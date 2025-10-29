// Firebase Admin SDK removed - all functions return early
const { logger } = require('../utils/logger');

// Initialize Firebase Admin SDK - DISABLED
let firebaseInitialized = false;

const initializeFirebase = () => {
  logger.warn('Firebase Admin SDK removed - push notifications disabled');
  return false;
};

/**
 * Send push notification to a specific vendor - DISABLED
 */
const sendPushNotification = async (fcmToken, notification, data = {}) => {
  logger.warn('Firebase removed - push notification disabled');
  return false;
};

/**
 * Send push notification to multiple vendors - DISABLED
 */
const sendMulticastPushNotification = async (fcmTokens, notification, data = {}) => {
  logger.warn('Firebase removed - multicast push notification disabled');
  return { successCount: 0, failureCount: fcmTokens ? fcmTokens.length : 0, responses: [] };
};

/**
 * Send push notification to all active vendors - DISABLED
 */
const sendToAllVendors = async (notification, data = {}) => {
  logger.warn('Firebase removed - send to all vendors disabled');
  return { successCount: 0, failureCount: 0, responses: [] };
};

module.exports = {
  sendPushNotification,
  sendMulticastPushNotification,
  sendToAllVendors
};
