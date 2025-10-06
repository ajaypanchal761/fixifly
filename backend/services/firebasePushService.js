const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

// Initialize Firebase Admin SDK
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
      projectId: serviceAccount.project_id
    });

    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    firebaseInitialized = false;
    return false;
  }
};

/**
 * Send push notification to a specific vendor
 * @param {string} fcmToken - FCM token of the vendor
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @returns {Promise<boolean>} - Success status
 */
const sendPushNotification = async (fcmToken, notification, data = {}) => {
  try {
    // Initialize Firebase if not already done
    if (!initializeFirebase()) {
      logger.error('Failed to initialize Firebase Admin SDK');
      return false;
    }

    if (!fcmToken) {
      logger.warn('No FCM token provided for push notification');
      return false;
    }

    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#FF6B35',
          sound: 'default',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            alert: {
              title: notification.title,
              body: notification.body
            }
          }
        }
      },
      webpush: {
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View Details'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        }
      }
    };

    const response = await admin.messaging().send(message);
    logger.info('Push notification sent successfully:', {
      messageId: response,
      fcmToken: fcmToken.substring(0, 20) + '...'
    });

    return true;
  } catch (error) {
    logger.error('Failed to send push notification:', {
      error: error.message,
      fcmToken: fcmToken ? fcmToken.substring(0, 20) + '...' : 'null'
    });

    // Handle specific Firebase errors
    if (error.code === 'messaging/registration-token-not-registered') {
      logger.warn('FCM token is no longer valid, should be removed from database');
    }

    return false;
  }
};

/**
 * Send push notification to multiple vendors
 * @param {Array<string>} fcmTokens - Array of FCM tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} - Results with success and failure counts
 */
const sendMulticastPushNotification = async (fcmTokens, notification, data = {}) => {
  try {
    console.log('🔥 FirebasePushService: Starting multicast notification...');
    console.log(`📊 FCM Tokens count: ${fcmTokens ? fcmTokens.length : 0}`);
    console.log(`📋 Notification: ${notification.title} - ${notification.body}`);
    
    // Initialize Firebase if not already done
    if (!initializeFirebase()) {
      console.error('❌ Failed to initialize Firebase Admin SDK');
      logger.error('Failed to initialize Firebase Admin SDK');
      return { successCount: 0, failureCount: 0, responses: [] };
    }

    if (!fcmTokens || fcmTokens.length === 0) {
      console.log('❌ No FCM tokens provided for multicast push notification');
      logger.warn('No FCM tokens provided for multicast push notification');
      return { successCount: 0, failureCount: 0, responses: [] };
    }

    const message = {
      tokens: fcmTokens,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#FF6B35',
          sound: 'default',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            alert: {
              title: notification.title,
              body: notification.body
            }
          }
        }
      },
      webpush: {
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View Details'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        }
      }
    };

    console.log('📤 Sending multicast message to Firebase...');
    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log('📊 Firebase multicast response:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: fcmTokens.length,
      responses: response.responses ? response.responses.length : 0
    });

    if (response.responses && response.responses.length > 0) {
      response.responses.forEach((resp, index) => {
        console.log(`   Response ${index + 1}: ${resp.success ? 'Success' : 'Failed'}`);
        if (resp.error) {
          console.log(`     Error: ${resp.error.code} - ${resp.error.message}`);
        }
        if (resp.messageId) {
          console.log(`     Message ID: ${resp.messageId}`);
        }
      });
    }
    
    logger.info('Multicast push notification sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: fcmTokens.length
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };
  } catch (error) {
    logger.error('Failed to send multicast push notification:', error);
    return { successCount: 0, failureCount: fcmTokens.length, responses: [] };
  }
};

/**
 * Send push notification to all active vendors
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} - Results with success and failure counts
 */
const sendToAllVendors = async (notification, data = {}) => {
  try {
    const Vendor = require('../models/Vendor');
    
    // Get all active vendors with FCM tokens
    const vendors = await Vendor.find({
      isActive: true,
      fcmToken: { $exists: true, $ne: null },
      'notificationSettings.pushNotifications': true
    }).select('fcmToken');

    const fcmTokens = vendors.map(vendor => vendor.fcmToken).filter(token => token);

    if (fcmTokens.length === 0) {
      logger.warn('No active vendors with FCM tokens found');
      return { successCount: 0, failureCount: 0, responses: [] };
    }

    return await sendMulticastPushNotification(fcmTokens, notification, data);
  } catch (error) {
    logger.error('Failed to send push notification to all vendors:', error);
    return { successCount: 0, failureCount: 0, responses: [] };
  }
};

module.exports = {
  sendPushNotification,
  sendMulticastPushNotification,
  sendToAllVendors
};
