const Admin = require('../models/Admin');
const firebasePushService = require('./firebasePushService');
const { logger } = require('../utils/logger');

/**
 * Send push notification to all active admins
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} - Results with success and failure counts
 */
const sendToAllAdmins = async (notification, data = {}) => {
  try {
    console.log('🔍 AdminNotificationService: Starting sendToAllAdmins...');
    
    // Get all active admins with FCM tokens
    const admins = await Admin.find({
      isActive: true,
      fcmToken: { $exists: true, $ne: null },
      'notificationSettings.pushNotifications': true
    }).select('fcmToken name email');

    console.log(`📊 Found ${admins.length} active admins with FCM tokens`);
    
    admins.forEach((admin, index) => {
      console.log(`   Admin ${index + 1}: ${admin.name} (${admin.email})`);
      console.log(`     FCM Token: ${admin.fcmToken ? 'Present' : 'Missing'}`);
      console.log(`     Token Length: ${admin.fcmToken ? admin.fcmToken.length : 0}`);
    });

    const fcmTokens = admins.map(admin => admin.fcmToken).filter(token => token);

    if (fcmTokens.length === 0) {
      console.log('❌ No active admins with FCM tokens found');
      logger.warn('No active admins with FCM tokens found');
      return { successCount: 0, failureCount: 0, responses: [] };
    }

    console.log(`📤 Sending notification to ${fcmTokens.length} admins:`, {
      notificationTitle: notification.title,
      notificationBody: notification.body,
      adminCount: fcmTokens.length
    });

    logger.info(`Sending notification to ${fcmTokens.length} admins`, {
      notificationTitle: notification.title,
      adminCount: fcmTokens.length
    });

    const result = await firebasePushService.sendMulticastPushNotification(fcmTokens, notification, data);
    
    console.log('📊 Firebase notification result:', {
      successCount: result.successCount,
      failureCount: result.failureCount,
      totalResponses: result.responses ? result.responses.length : 0
    });

    return result;
  } catch (error) {
    console.error('❌ AdminNotificationService error:', error);
    logger.error('Failed to send push notification to admins:', error);
    return { successCount: 0, failureCount: 0, responses: [] };
  }
};

/**
 * Send new booking notification to admins
 * @param {Object} booking - Booking data
 * @returns {Promise<Object>} - Results with success and failure counts
 */
const sendNewBookingNotification = async (booking) => {
  try {
    const notification = {
      title: '🆕 New Booking Received',
      body: `New booking from ${booking.customer.name} - ${booking.services.map(s => s.serviceName).join(', ')}`
    };

    const data = {
      type: 'new_booking',
      bookingId: booking._id.toString(),
      bookingReference: booking.bookingReference,
      customerName: booking.customer.name,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      totalAmount: booking.pricing.totalAmount.toString(),
      services: booking.services.map(s => s.serviceName).join(', '),
      scheduledDate: booking.scheduling.preferredDate ? booking.scheduling.preferredDate.toISOString() : '',
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    };

    logger.info('Sending new booking notification to admins', {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      customerName: booking.customer.name,
      totalAmount: booking.pricing.totalAmount
    });

    return await sendToAllAdmins(notification, data);
  } catch (error) {
    logger.error('Failed to send new booking notification to admins:', error);
    return { successCount: 0, failureCount: 0, responses: [] };
  }
};

/**
 * Send booking status update notification to admins
 * @param {Object} booking - Booking data
 * @param {string} newStatus - New booking status
 * @returns {Promise<Object>} - Results with success and failure counts
 */
const sendBookingStatusUpdateNotification = async (booking, newStatus) => {
  try {
    const statusMessages = {
      'confirmed': '✅ Booking Confirmed',
      'in_progress': '🔄 Booking In Progress',
      'completed': '✅ Booking Completed',
      'cancelled': '❌ Booking Cancelled'
    };

    const notification = {
      title: statusMessages[newStatus] || '📋 Booking Status Updated',
      body: `Booking ${booking.bookingReference} status changed to ${newStatus}`
    };

    const data = {
      type: 'booking_status_update',
      bookingId: booking._id.toString(),
      bookingReference: booking.bookingReference,
      newStatus: newStatus,
      customerName: booking.customer.name,
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    };

    logger.info('Sending booking status update notification to admins', {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      newStatus: newStatus
    });

    return await sendToAllAdmins(notification, data);
  } catch (error) {
    logger.error('Failed to send booking status update notification to admins:', error);
    return { successCount: 0, failureCount: 0, responses: [] };
  }
};

/**
 * Send system alert notification to admins
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Object} additionalData - Additional data
 * @returns {Promise<Object>} - Results with success and failure counts
 */
const sendSystemAlert = async (title, message, additionalData = {}) => {
  try {
    const notification = {
      title: `🚨 ${title}`,
      body: message
    };

    const data = {
      type: 'system_alert',
      alertTitle: title,
      alertMessage: message,
      timestamp: new Date().toISOString(),
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      ...additionalData
    };

    logger.info('Sending system alert to admins', {
      title: title,
      message: message
    });

    return await sendToAllAdmins(notification, data);
  } catch (error) {
    logger.error('Failed to send system alert to admins:', error);
    return { successCount: 0, failureCount: 0, responses: [] };
  }
};

module.exports = {
  sendToAllAdmins,
  sendNewBookingNotification,
  sendBookingStatusUpdateNotification,
  sendSystemAlert
};
