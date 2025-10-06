const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

// Initialize Firebase Admin SDK for Realtime Database
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized || admin.apps.length > 0) {
    return true;
  }

  try {
    // Use service account key from environment variables
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "fixfly-d8e35",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };

    // Validate required fields
    if (!serviceAccount.private_key) {
      throw new Error('FIREBASE_PRIVATE_KEY is missing or invalid');
    }
    if (!serviceAccount.client_email) {
      throw new Error('FIREBASE_CLIENT_EMAIL is missing');
    }
    if (!serviceAccount.project_id) {
      throw new Error('FIREBASE_PROJECT_ID is missing');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
      databaseURL: "https://fixfly-d8e35-default-rtdb.firebaseio.com/"
    });

    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized with Realtime Database');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    firebaseInitialized = false;
    return false;
  }
};

/**
 * Send notification to vendor via Firebase Realtime Database
 * @param {string} vendorId - Vendor ID
 * @param {Object} notification - Notification data
 * @returns {Promise<boolean>} - Success status
 */
const sendRealtimeNotification = async (vendorId, notification) => {
  try {
    // Initialize Firebase if not already done
    if (!initializeFirebase()) {
      logger.error('Failed to initialize Firebase Admin SDK');
      return false;
    }

    if (!vendorId) {
      logger.warn('No vendor ID provided for realtime notification');
      return false;
    }

    const db = admin.database();
    const notificationRef = db.ref(`notifications/${vendorId}`).push();

    const notificationData = {
      id: notificationRef.key,
      vendorId: vendorId,
      title: notification.title || 'Notification',
      message: notification.message || 'You have a new notification',
      type: notification.type || 'general',
      priority: notification.priority || 'medium',
      data: notification.data || {},
      timestamp: admin.database.ServerValue.TIMESTAMP,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    await notificationRef.set(notificationData);

    logger.info('Realtime notification sent successfully:', {
      vendorId,
      notificationId: notificationRef.key,
      title: notification.title
    });

    return true;
  } catch (error) {
    logger.error('Failed to send realtime notification:', {
      error: error.message,
      vendorId
    });
    return false;
  }
};

/**
 * Send push notification and realtime database notification
 * @param {string} vendorId - Vendor ID
 * @param {string} fcmToken - FCM token
 * @param {Object} notification - Notification data
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} - Results
 */
const sendCompleteNotification = async (vendorId, fcmToken, notification, data = {}) => {
  try {
    const results = {
      pushNotification: false,
      realtimeNotification: false
    };

    // Send push notification if FCM token is available
    if (fcmToken && fcmToken !== 'test_fcm_token_' + Date.now()) {
      try {
        const firebasePushService = require('./firebasePushService');
        results.pushNotification = await firebasePushService.sendPushNotification(
          fcmToken,
          notification,
          data
        );
      } catch (pushError) {
        logger.error('Push notification failed:', pushError);
      }
    }

    // Always send realtime database notification
    try {
      results.realtimeNotification = await sendRealtimeNotification(vendorId, {
        ...notification,
        data: data
      });
    } catch (realtimeError) {
      logger.error('Realtime notification failed:', realtimeError);
    }

    return results;
  } catch (error) {
    logger.error('Failed to send complete notification:', error);
    return { pushNotification: false, realtimeNotification: false };
  }
};

/**
 * Get vendor notifications from Realtime Database
 * @param {string} vendorId - Vendor ID
 * @param {number} limit - Number of notifications to fetch
 * @returns {Promise<Array>} - Notifications array
 */
const getVendorNotifications = async (vendorId, limit = 50) => {
  try {
    if (!initializeFirebase()) {
      throw new Error('Firebase not initialized');
    }

    const db = admin.database();
    const notificationsRef = db.ref(`notifications/${vendorId}`);
    
    const snapshot = await notificationsRef
      .orderByChild('timestamp')
      .limitToLast(limit)
      .once('value');

    const notifications = [];
    snapshot.forEach((childSnapshot) => {
      notifications.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    return notifications.reverse(); // Most recent first
  } catch (error) {
    logger.error('Failed to get vendor notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read in Realtime Database
 * @param {string} vendorId - Vendor ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<boolean>} - Success status
 */
const markNotificationAsRead = async (vendorId, notificationId) => {
  try {
    if (!initializeFirebase()) {
      throw new Error('Firebase not initialized');
    }

    const db = admin.database();
    const notificationRef = db.ref(`notifications/${vendorId}/${notificationId}`);
    
    await notificationRef.update({
      isRead: true,
      readAt: admin.database.ServerValue.TIMESTAMP
    });

    logger.info('Notification marked as read:', { vendorId, notificationId });
    return true;
  } catch (error) {
    logger.error('Failed to mark notification as read:', error);
    return false;
  }
};

module.exports = {
  sendRealtimeNotification,
  sendCompleteNotification,
  getVendorNotifications,
  markNotificationAsRead,
  initializeFirebase
};
