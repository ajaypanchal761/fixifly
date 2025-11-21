// Firebase Push Service - Uses firebaseAdmin.js for actual implementation
const { logger } = require('../utils/logger');
const { sendPushNotification: firebaseAdminSendPush } = require('./firebaseAdmin');

/**
 * Send push notification to a specific vendor
 * @param {string|string[]} fcmToken - Single token or array of tokens
 * @param {Object} notification - Notification payload with title and body
 * @param {Object} data - Additional data payload (optional)
 * @returns {Promise<Object>} - Response with success/failure counts
 */
const sendPushNotification = async (fcmToken, notification, data = {}) => {
  try {
    // Combine notification and data into payload
    const payload = {
      title: notification.title || notification.heading || 'Notification',
      body: notification.body || notification.message || '',
      ...(notification.icon && { icon: notification.icon }),
      ...(notification.badge && { badge: notification.badge }),
      ...(notification.image && { image: notification.image }),
      data: {
        ...data,
        ...(notification.data || {}),
        // Ensure type is included
        type: data.type || notification.data?.type || 'general',
        // Include title and body in data for consistency
        title: notification.title || notification.heading || 'Notification',
        message: notification.body || notification.message || '',
        timestamp: new Date().toISOString()
      },
      link: data.link || notification.link || '/',
      handlerName: data.handlerName || notification.handlerName || 'handleNotificationClick'
    };

    const result = await firebaseAdminSendPush(fcmToken, payload);
    
    // Convert result format to match expected format
    if (result.success === false) {
      return {
        successCount: 0,
        failureCount: Array.isArray(fcmToken) ? fcmToken.length : 1,
        responses: [],
        error: result.error || result.message
      };
    }

    return {
      successCount: result.successCount || 0,
      failureCount: result.failureCount || 0,
      responses: result.responses || [],
      invalidTokens: result.invalidTokens
    };
  } catch (error) {
    logger.error('Error in sendPushNotification:', error);
    return {
      successCount: 0,
      failureCount: Array.isArray(fcmToken) ? fcmToken.length : 1,
      responses: [],
      error: error.message
    };
  }
};

/**
 * Send push notification to multiple vendors (multicast)
 * @param {string[]} fcmTokens - Array of FCM tokens
 * @param {Object} notification - Notification payload with title and body
 * @param {Object} data - Additional data payload (optional)
 * @returns {Promise<Object>} - Response with success/failure counts
 */
const sendMulticastPushNotification = async (fcmTokens, notification, data = {}) => {
  try {
    if (!fcmTokens || !Array.isArray(fcmTokens) || fcmTokens.length === 0) {
      logger.warn('No FCM tokens provided for multicast push notification');
      return {
        successCount: 0,
        failureCount: 0,
        responses: []
      };
    }

    // Remove duplicates and invalid tokens
    const validTokens = [...new Set(fcmTokens.filter(token => token && token.trim().length > 0))];

    if (validTokens.length === 0) {
      logger.warn('No valid FCM tokens provided for multicast push notification');
      return {
        successCount: 0,
        failureCount: fcmTokens.length,
        responses: []
      };
    }

    // Combine notification and data into payload
    const payload = {
      title: notification.title || notification.heading || 'Notification',
      body: notification.body || notification.message || '',
      ...(notification.icon && { icon: notification.icon }),
      ...(notification.badge && { badge: notification.badge }),
      ...(notification.image && { image: notification.image }),
      data: {
        ...data,
        ...(notification.data || {}),
        // Ensure type is included
        type: data.type || notification.data?.type || 'general',
        // Include title and body in data for consistency
        title: notification.title || notification.heading || 'Notification',
        message: notification.body || notification.message || '',
        timestamp: new Date().toISOString()
      },
      link: data.link || notification.link || '/',
      handlerName: data.handlerName || notification.handlerName || 'handleNotificationClick'
    };

    logger.info('Sending multicast push notification', {
      tokenCount: validTokens.length,
      title: payload.title,
      type: payload.data.type
    });

    const result = await firebaseAdminSendPush(validTokens, payload);

    // Convert result format to match expected format
    if (result.success === false) {
      return {
        successCount: 0,
        failureCount: validTokens.length,
        responses: [],
        error: result.error || result.message
      };
    }

    return {
      successCount: result.successCount || 0,
      failureCount: result.failureCount || 0,
      responses: result.responses || [],
      invalidTokens: result.invalidTokens
    };
  } catch (error) {
    logger.error('Error in sendMulticastPushNotification:', error);
    return {
      successCount: 0,
      failureCount: fcmTokens ? fcmTokens.length : 0,
      responses: [],
      error: error.message
    };
  }
};

/**
 * Send push notification to all active vendors
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload (optional)
 * @returns {Promise<Object>} - Response with success/failure counts
 */
const sendToAllVendors = async (notification, data = {}) => {
  try {
    const Vendor = require('../models/Vendor');
    
    // Get all active vendors with FCM tokens
    const vendors = await Vendor.find({
      isActive: true,
      isBlocked: false,
      'notificationSettings.pushNotifications': { $ne: false }
    }).select('+fcmTokenMobile');

    // Collect all FCM tokens
    const allTokens = [];
    vendors.forEach(vendor => {
      if (vendor.fcmTokenMobile && Array.isArray(vendor.fcmTokenMobile)) {
        allTokens.push(...vendor.fcmTokenMobile);
      }
    });

    // Remove duplicates
    const uniqueTokens = [...new Set(allTokens)];

    if (uniqueTokens.length === 0) {
      logger.warn('No FCM tokens found for active vendors');
      return {
        successCount: 0,
        failureCount: 0,
        responses: []
      };
    }

    logger.info('Sending push notification to all vendors', {
      vendorCount: vendors.length,
      tokenCount: uniqueTokens.length
    });

    return await sendMulticastPushNotification(uniqueTokens, notification, data);
  } catch (error) {
    logger.error('Error in sendToAllVendors:', error);
    return {
      successCount: 0,
      failureCount: 0,
      responses: [],
      error: error.message
    };
  }
};

module.exports = {
  sendPushNotification,
  sendMulticastPushNotification,
  sendToAllVendors
};
