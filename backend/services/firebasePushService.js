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
 * PUSH NOTIFICATIONS DISABLED - Returns false without sending
 * @param {string} fcmToken - FCM token of the vendor
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @returns {Promise<boolean>} - Success status
 */
const sendPushNotification = async (fcmToken, notification, data = {}) => {
  // PUSH NOTIFICATIONS DISABLED
  logger.warn('Push notifications are disabled - skipping notification send');
  return false;
};

/**
 * Send push notification to multiple vendors
 * PUSH NOTIFICATIONS DISABLED - Returns empty results without sending
 * @param {Array<string>} fcmTokens - Array of FCM tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} - Results with success and failure counts
 */
const sendMulticastPushNotification = async (fcmTokens, notification, data = {}) => {
  // PUSH NOTIFICATIONS DISABLED
  logger.warn('Push notifications are disabled - skipping multicast notification send');
  return { successCount: 0, failureCount: fcmTokens ? fcmTokens.length : 0, responses: [] };
};

/**
 * Send push notification to all active vendors
 * PUSH NOTIFICATIONS DISABLED - Returns empty results without sending
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} - Results with success and failure counts
 */
const sendToAllVendors = async (notification, data = {}) => {
  // PUSH NOTIFICATIONS DISABLED
  logger.warn('Push notifications are disabled - skipping send to all vendors');
  return { successCount: 0, failureCount: 0, responses: [] };
};

module.exports = {
  sendPushNotification,
  sendMulticastPushNotification,
  sendToAllVendors
};
