const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return true;
  }

  try {
    // Try to find service account file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
      path.join(__dirname, '../config/fixfly-fb12b-firebase-adminsdk-fbsvc-d96cf044fa.json');

    let serviceAccount;

    // Option 1: Read from file path
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      logger.info('Firebase Admin initialized from service account file');
    }
    // Option 2: Read from environment variable (for production)
    else if (process.env.FIREBASE_CONFIG) {
      serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
      logger.info('Firebase Admin initialized from environment variable');
    }
    // Option 3: Try default file name pattern
    else {
      const configDir = path.join(__dirname, '../config');
      const files = fs.readdirSync(configDir);
      const serviceAccountFile = files.find(file => 
        file.includes('firebase-adminsdk') && file.endsWith('.json')
      );
      
      if (serviceAccountFile) {
        const fullPath = path.join(configDir, serviceAccountFile);
        serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        logger.info(`Firebase Admin initialized from ${serviceAccountFile}`);
      } else {
        throw new Error('Firebase service account file not found');
      }
    }

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
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

// Initialize on module load
initializeFirebase();

/**
 * Send push notification to one or more FCM tokens
 * @param {string|string[]} tokens - Single token or array of tokens
 * @param {Object} payload - Notification payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {Object} payload.data - Custom data payload (optional)
 * @param {string} payload.handlerName - Handler name for navigation (optional)
 * @param {string} payload.link - Link/route for navigation (optional)
 * @param {string} payload.icon - Icon URL (optional)
 * @returns {Promise<Object>} - Response with success/failure counts
 */
const sendPushNotification = async (tokens, payload) => {
  if (!firebaseInitialized) {
    logger.error('Firebase Admin not initialized');
    return { success: false, error: 'Firebase Admin not initialized' };
  }

  try {
    // Ensure tokens is an array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    
    // Remove null/undefined/empty tokens
    const validTokens = tokenArray.filter(token => token && token.trim().length > 0);
    
    if (validTokens.length === 0) {
      logger.warn('No valid FCM tokens provided');
      return { success: false, error: 'No valid FCM tokens provided' };
    }

    if (!payload || !payload.title || !payload.body) {
      logger.error('Invalid payload: title and body are required');
      return { success: false, error: 'Invalid payload: title and body are required' };
    }

    console.log('📤 Sending push notification...', {
      tokenCount: validTokens.length,
      title: payload.title,
      body: payload.body.substring(0, 50) + '...',
      hasData: !!payload.data
    });

    // Create individual message for each token (like RentYatra - better for webview APK)
    const messages = validTokens.map((token) => ({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        ...(payload.data || {}),
        link: payload.link || '/',
        handlerName: payload.handlerName || 'handleNotificationClick',
        // Additional fields for webview/APK compatibility
        type: payload.data?.type || 'general',
        title: payload.title,
        body: payload.body,
        timestamp: new Date().toISOString(),
      },
      // Web push specific options
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/favicon.png',
          badge: '/favicon.png',
          clickAction: payload.handlerName || 'message',
          requireInteraction: false,
          // Use bookingId or type as tag to prevent duplicate notifications
          tag: payload.data?.bookingId 
            ? `booking_${payload.data.bookingId}` 
            : payload.data?.type 
              ? `type_${payload.data.type}`
              : `notif_${Date.now()}`,
          vibrate: [200, 100, 200],
          silent: false,
        },
        fcmOptions: {
          link: payload.link || '/',
        },
        headers: {
          Urgency: 'normal',
        },
      },
      // Android specific options (for APK/webview)
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
          clickAction: payload.link || 'FLUTTER_NOTIFICATION_CLICK',
          tag: payload.data?.bookingId 
            ? `booking_${payload.data.bookingId}` 
            : payload.data?.type 
              ? `type_${payload.data.type}`
              : `notif_${Date.now()}`,
        },
        data: {
          ...(payload.data || {}),
          click_action: payload.link || 'FLUTTER_NOTIFICATION_CLICK',
          handlerName: payload.handlerName || '',
        },
      },
      // iOS specific options
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    }));

    // Use sendEach (like RentYatra) - better for handling individual token failures
    try {
      const response = await admin.messaging().sendEach(messages);
      
      console.log('✅ === Push notification sent successfully ===');
      console.log('Results:', {
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: validTokens.length,
        successRate: `${((response.successCount / validTokens.length) * 100).toFixed(1)}%`
      });

      // Log failed tokens if any
      if (response.failureCount > 0) {
        console.warn('⚠️ === Some push notifications failed ===');
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            console.error(`❌ Token ${idx + 1} failed:`, {
              error: resp.error?.message || 'Unknown error',
              code: errorCode,
              tokenPreview: validTokens[idx]?.substring(0, 20) + '...'
            });
            // Collect invalid tokens for cleanup
            if (errorCode === 'messaging/invalid-registration-token' || 
                errorCode === 'messaging/registration-token-not-registered') {
              invalidTokens.push(validTokens[idx]);
              console.log(`🗑️ Marking token ${idx + 1} as invalid for cleanup`);
            }
          }
        });
        if (invalidTokens.length > 0) {
          console.log(`🗑️ Total invalid tokens to cleanup: ${invalidTokens.length}`);
        }
        
        return {
          success: response.successCount > 0,
          successCount: response.successCount,
          failureCount: response.failureCount,
          totalTokens: validTokens.length,
          responses: response.responses,
          invalidTokens: invalidTokens.length > 0 ? invalidTokens : undefined,
        };
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: validTokens.length,
        responses: response.responses,
      };
    } catch (error) {
      logger.error('Error sending push notification:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  } catch (error) {
    logger.error('Error in sendPushNotification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send push notification to a user (fetches tokens from user document)
 * @param {string} userId - User ID
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} - Response with success/failure counts
 */
const sendPushNotificationToUser = async (userId, payload) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId).select('+fcmTokens +fcmTokenMobile preferences');
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if user has push notifications enabled
    if (user.preferences?.notifications?.push === false) {
      logger.info(`Push notifications disabled for user ${userId}`);
      return { success: false, error: 'Push notifications disabled for user' };
    }

    // Combine web and mobile tokens
    const allTokens = [
      ...(user.fcmTokens || []),
      ...(user.fcmTokenMobile || [])
    ];

    // Remove duplicates
    const uniqueTokens = [...new Set(allTokens)];

    console.log(`📱 === FCM Tokens for user ${userId} ===`);
    console.log('Token Details:', {
      webTokens: user.fcmTokens?.length || 0,
      mobileTokens: user.fcmTokenMobile?.length || 0,
      totalUnique: uniqueTokens.length,
      webTokenList: user.fcmTokens?.slice(0, 2).map(t => t.substring(0, 20) + '...') || [],
      mobileTokenList: user.fcmTokenMobile?.slice(0, 2).map(t => t.substring(0, 20) + '...') || [],
      userEmail: user.email,
      userPhone: user.phone
    });

    if (uniqueTokens.length === 0) {
      logger.warn(`No FCM tokens found for user ${userId}`);
      console.log(`❌ No FCM tokens found for user ${userId}`);
      return { success: false, error: 'No FCM tokens found for user' };
    }

    // Log notification details for debugging
    console.log(`📤 === Sending notification to ${uniqueTokens.length} device(s) ===`);
    console.log('Notification Payload:', {
      title: payload.title,
      body: payload.body?.substring(0, 50) + '...',
      type: payload.data?.type,
      bookingId: payload.data?.bookingId,
      bookingReference: payload.data?.bookingReference,
      link: payload.link,
      handlerName: payload.handlerName,
      userId: userId.toString()
    });

    // Send notification
    const result = await sendPushNotification(uniqueTokens, payload);

    // Clean up invalid tokens if any
    if (result.invalidTokens && result.invalidTokens.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: {
          fcmTokens: { $in: result.invalidTokens },
          fcmTokenMobile: { $in: result.invalidTokens },
        },
      });
      logger.info(`Cleaned up ${result.invalidTokens.length} invalid tokens for user ${userId}`);
    }

    return result;
  } catch (error) {
    logger.error('Error in sendPushNotificationToUser:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  initializeFirebase,
  sendPushNotification,
  sendPushNotificationToUser,
  isInitialized: () => firebaseInitialized,
};

