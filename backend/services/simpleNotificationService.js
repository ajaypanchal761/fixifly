const mongoose = require('mongoose');
const { logger } = require('../utils/logger');
const firebaseRealtimeService = require('./firebaseRealtimeService');

/**
 * Simple Notification Service
 * Handles notifications without complex MongoDB operations
 */
class SimpleNotificationService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Ensure MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000
        });
      }

      this.isInitialized = true;
      logger.info('Simple notification service initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize simple notification service:', error);
      return false;
    }
  }

  /**
   * Send notification to vendor (simplified version)
   * @param {string} vendorId - Vendor ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<boolean>} - Success status
   */
  async sendNotification(vendorId, notificationData) {
    try {
      // Initialize if needed
      await this.initialize();

      logger.info('Sending simple notification to vendor', {
        vendorId,
        title: notificationData.title,
        type: notificationData.type
      });

      // Get vendor details for FCM tokens (mobile/webview only - web tokens removed)
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findOne({ vendorId: vendorId }).select('+fcmTokenMobile notificationSettings');

      // Use mobile/webview tokens only
      const uniqueTokens = [...(vendor?.fcmTokenMobile || [])].filter(token =>
        token && !token.startsWith('test_') && !token.startsWith('real_fcm_token_')
      );

      let pushNotificationSent = false;
      let realtimeNotificationSent = false;

      // Send Firebase Realtime Database notification (always works)
      try {
        realtimeNotificationSent = await firebaseRealtimeService.sendRealtimeNotification(
          vendorId,
          {
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type || 'general',
            priority: notificationData.priority || 'medium'
          }
        );
      } catch (realtimeError) {
        logger.error('Realtime notification failed:', realtimeError);
      }

      // Send push notification if vendor has real FCM tokens
      if (vendor && uniqueTokens.length > 0) {
        try {
          const firebasePushService = require('./firebasePushService');
          // Convert data to string values for FCM
          const fcmData = {};
          if (notificationData.data) {
            Object.keys(notificationData.data).forEach(key => {
              fcmData[key] = String(notificationData.data[key]);
            });
          }

          const pushNotification = {
            title: notificationData.title,
            body: notificationData.message
          };

          const pushResult = await firebasePushService.sendMulticastPushNotification(
            uniqueTokens,
            pushNotification,
            fcmData
          );

          if (pushResult.successCount > 0) {
            pushNotificationSent = true;
            logger.info('Push notification sent successfully', {
              vendorId,
              successCount: pushResult.successCount,
              failureCount: pushResult.failureCount,
              totalTokens: uniqueTokens.length,
              mobileTokens: vendor.fcmTokenMobile?.length || 0
            });
          }
        } catch (pushError) {
          logger.error('Push notification failed:', pushError);
        }
      } else {
        logger.warn('Push notification skipped - vendor has no valid FCM tokens', {
          vendorId,
          hasTokens: uniqueTokens.length > 0,
          mobileTokens: vendor?.fcmTokenMobile?.length || 0
        });
      }

      const success = realtimeNotificationSent || pushNotificationSent;

      if (success) {
        logger.info('Simple notification process completed', {
          vendorId,
          title: notificationData.title,
          pushSent: pushNotificationSent,
          realtimeSent: realtimeNotificationSent
        });
      } else {
        logger.error('Failed to send simple notification through any channel', {
          vendorId,
          title: notificationData.title
        });
      }

      return success;
    } catch (error) {
      logger.error('Error sending simple notification:', {
        error: error.message,
        vendorId,
        title: notificationData.title
      });
      return false;
    }
  }

  /**
   * Send booking assignment notification
   * @param {string} vendorId - Vendor ID
   * @param {Object} bookingData - Booking data
   * @returns {Promise<boolean>} - Success status
   */
  async sendBookingAssignmentNotification(vendorId, bookingData) {
    const notificationData = {
      title: '📅 New Service Booking Assigned',
      message: `A new service booking for ${bookingData.customer?.name} has been assigned to you. Please review and take action.`,
      type: 'booking_assignment',
      priority: bookingData.priority === 'urgent' || bookingData.priority === 'high' ? 'high' : 'medium',
      data: {
        bookingId: String(bookingData._id),
        customerName: String(bookingData.customer?.name || 'Customer'),
        scheduledDate: bookingData.scheduling?.scheduledDate ? String(bookingData.scheduling.scheduledDate) : '',
        totalAmount: String(bookingData.pricing?.totalAmount || '0'),
        type: 'booking_assignment',
        action: 'view_booking'
      }
    };

    return await this.sendNotification(vendorId, notificationData);
  }

  /**
   * Send support ticket assignment notification
   * @param {string} vendorId - Vendor ID
   * @param {Object} ticketData - Ticket data
   * @returns {Promise<boolean>} - Success status
   */
  async sendSupportTicketAssignmentNotification(vendorId, ticketData) {
    const notificationData = {
      title: '🎫 New Support Ticket Assigned',
      message: `A new support ticket "${ticketData.subject}" has been assigned to you. Please review and take action.`,
      type: 'support_ticket_assignment',
      priority: ticketData.priority === 'urgent' || ticketData.priority === 'high' ? 'high' : 'medium',
      data: {
        ticketId: String(ticketData.ticketId || ''),
        subject: String(ticketData.subject || ''),
        customerName: String(ticketData.userName || 'Customer'),
        type: 'support_ticket_assignment',
        action: 'view_ticket'
      }
    };

    return await this.sendNotification(vendorId, notificationData);
  }
}

// Export singleton instance
module.exports = new SimpleNotificationService();
