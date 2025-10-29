// Firebase Admin SDK removed - all functions return early
const { logger } = require('../utils/logger');

// Initialize Firebase Admin SDK for Realtime Database - DISABLED
let firebaseInitialized = false;

const initializeFirebase = () => {
  logger.warn('Firebase Admin SDK removed - realtime notifications disabled');
  return false;
};

/**
 * Send notification to vendor via Firebase Realtime Database - DISABLED
 */
const sendRealtimeNotification = async (vendorId, notification) => {
  logger.warn('Firebase removed - realtime notification disabled');
  return false;
};

/**
 * Send push notification and realtime database notification - DISABLED
 */
const sendCompleteNotification = async (vendorId, fcmToken, notification, data = {}) => {
  logger.warn('Firebase removed - complete notification disabled');
  return { pushNotification: false, realtimeNotification: false };
};

/**
 * Get vendor notifications from Realtime Database - DISABLED
 */
const getVendorNotifications = async (vendorId, limit = 50) => {
  logger.warn('Firebase removed - get vendor notifications disabled');
  return [];
};

/**
 * Mark notification as read in Realtime Database - DISABLED
 */
const markNotificationAsRead = async (vendorId, notificationId) => {
  logger.warn('Firebase removed - mark notification as read disabled');
  return false;
};

module.exports = {
  sendRealtimeNotification,
  sendCompleteNotification,
  getVendorNotifications,
  markNotificationAsRead,
  initializeFirebase
};
