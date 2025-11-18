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
  logger.info('📤 Sending Push Notification via FCM', {
    tokenCount: Array.isArray(tokens) ? tokens.length : 1,
    title: payload?.title || 'N/A',
    body: payload?.body || 'N/A',
    hasData: !!payload?.data
  });

  if (!firebaseInitialized) {
    logger.error('❌ Firebase Admin not initialized');
    return { success: false, error: 'Firebase Admin not initialized' };
  }

  try {
    logger.debug('Step 1: Processing FCM tokens', {
      inputTokenCount: Array.isArray(tokens) ? tokens.length : 1,
      isArray: Array.isArray(tokens)
    });

    // Ensure tokens is an array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    
    // Remove null/undefined/empty tokens
    const validTokens = tokenArray.filter(token => token && token.trim().length > 0);
    
    logger.debug('Step 2: Token validation completed', {
      inputCount: tokenArray.length,
      validCount: validTokens.length,
      invalidCount: tokenArray.length - validTokens.length
    });
    
    if (validTokens.length === 0) {
      logger.warn('⚠️ No valid FCM tokens provided', {
        inputCount: tokenArray.length
      });
      return { success: false, error: 'No valid FCM tokens provided' };
    }

    logger.debug('Step 3: Building FCM message payload', {
      validTokenCount: validTokens.length,
      title: payload?.title,
      body: payload?.body
    });

    // Build message payload
    const message = {
      notification: {
        title: payload.title || 'Notification',
        body: payload.body || 'You have a new notification',
      },
      data: {
        ...(payload.data || {}),
        handlerName: payload.handlerName || '',
        link: payload.link || '',
        icon: payload.icon || '',
        timestamp: new Date().toISOString(),
      },
      // Web push specific options
      webpush: {
        notification: {
          title: payload.title || 'Notification',
          body: payload.body || 'You have a new notification',
          icon: payload.icon || '/favicon.png',
          badge: '/favicon.png',
          requireInteraction: false,
        },
        fcmOptions: {
          link: payload.link || '/',
        },
      },
      // Android specific options
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
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
    };

    let result;

    // If single token, use send()
    if (validTokens.length === 1) {
      logger.debug('Step 4: Sending to single FCM token', {
        tokenPreview: validTokens[0].substring(0, 30) + '...'
      });

      message.token = validTokens[0];
      try {
        const response = await admin.messaging().send(message);
        logger.info('✅ Push notification sent successfully (single token)', {
          messageId: response,
          tokenPreview: validTokens[0].substring(0, 30) + '...'
        });
        result = {
          success: true,
          successCount: 1,
          failureCount: 0,
          responses: [{ success: true, messageId: response }],
        };
      } catch (error) {
        logger.error('❌ Error sending push notification (single token)', {
          error: error.message,
          errorCode: error.code,
          tokenPreview: validTokens[0].substring(0, 30) + '...',
          stack: error.stack
        });
        result = {
          success: false,
          successCount: 0,
          failureCount: 1,
          responses: [{ success: false, error: error.message, errorCode: error.code }],
        };
      }
    } else {
      // Multiple tokens, use sendMulticast()
      logger.debug('Step 4: Sending to multiple FCM tokens (multicast)', {
        tokenCount: validTokens.length
      });

      message.tokens = validTokens;
      try {
        const response = await admin.messaging().sendMulticast(message);
        logger.info('✅ Push notification sent (multicast)', {
          successCount: response.successCount,
          failureCount: response.failureCount,
          totalTokens: validTokens.length
        });
        
        // Remove invalid tokens
        if (response.failureCount > 0) {
          logger.debug('Step 5: Processing failed tokens', {
            failureCount: response.failureCount
          });

          const invalidTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const errorCode = resp.error?.code;
              logger.debug('Failed token details', {
                index: idx,
                errorCode,
                errorMessage: resp.error?.message,
                tokenPreview: validTokens[idx].substring(0, 30) + '...'
              });
              // Remove tokens that are invalid or unregistered
              if (errorCode === 'messaging/invalid-registration-token' || 
                  errorCode === 'messaging/registration-token-not-registered') {
                invalidTokens.push(validTokens[idx]);
              }
            }
          });
          
          if (invalidTokens.length > 0) {
            logger.warn('⚠️ Found invalid FCM tokens that should be removed', {
              invalidTokenCount: invalidTokens.length,
              tokenPreviews: invalidTokens.slice(0, 3).map(t => t.substring(0, 30) + '...')
            });
            // Return invalid tokens so they can be cleaned up
            result = {
              success: response.successCount > 0,
              successCount: response.successCount,
              failureCount: response.failureCount,
              responses: response.responses,
              invalidTokens: invalidTokens,
            };
          } else {
            result = {
              success: response.successCount > 0,
              successCount: response.successCount,
              failureCount: response.failureCount,
              responses: response.responses,
            };
          }
        } else {
          logger.debug('Step 5: All tokens sent successfully', {
            successCount: response.successCount
          });
          result = {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses,
          };
        }
      } catch (error) {
        logger.error('❌ Error sending multicast push notification', {
          error: error.message,
          errorCode: error.code,
          tokenCount: validTokens.length,
          stack: error.stack
        });
        result = {
          success: false,
          successCount: 0,
          failureCount: validTokens.length,
          responses: [],
          error: error.message,
        };
      }
    }

    logger.info('📊 Push notification result summary', {
      success: result.success,
      successCount: result.successCount,
      failureCount: result.failureCount,
      invalidTokenCount: result.invalidTokens?.length || 0
    });

    return result;
  } catch (error) {
    logger.error('❌ Error in sendPushNotification', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      tokenCount: Array.isArray(tokens) ? tokens.length : 1
    });
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
    logger.info('👤 Sending Push Notification to User', {
      userId,
      title: payload?.title || 'N/A'
    });

    logger.debug('Step 1: Fetching user FCM tokens', {
      userId
    });

    const User = require('../models/User');
    const user = await User.findById(userId).select('fcmTokens fcmTokenMobile preferences');
    
    if (!user) {
      logger.warn('User not found for push notification', {
        userId
      });
      return { success: false, error: 'User not found' };
    }

    logger.debug('Step 2: Checking user preferences', {
      userId,
      pushNotificationsEnabled: user.preferences?.notifications?.push !== false
    });

    // Check if user has push notifications enabled
    if (user.preferences?.notifications?.push === false) {
      logger.info('Push notifications disabled for user', {
        userId
      });
      return { success: false, error: 'Push notifications disabled for user' };
    }

    logger.debug('Step 3: Combining web and mobile FCM tokens', {
      userId,
      webTokenCount: user.fcmTokens?.length || 0,
      mobileTokenCount: user.fcmTokenMobile?.length || 0
    });

    // Combine web and mobile tokens
    const allTokens = [
      ...(user.fcmTokens || []),
      ...(user.fcmTokenMobile || [])
    ];

    // Remove duplicates
    const uniqueTokens = [...new Set(allTokens)];

    logger.debug('Step 4: Token deduplication completed', {
      userId,
      totalTokens: allTokens.length,
      uniqueTokens: uniqueTokens.length,
      duplicatesRemoved: allTokens.length - uniqueTokens.length
    });

    if (uniqueTokens.length === 0) {
      logger.warn('⚠️ No FCM tokens found for user', {
        userId,
        webTokenCount: user.fcmTokens?.length || 0,
        mobileTokenCount: user.fcmTokenMobile?.length || 0
      });
      return { success: false, error: 'No FCM tokens found for user' };
    }

    logger.debug('Step 5: Sending notification to tokens', {
      userId,
      uniqueTokenCount: uniqueTokens.length,
      tokenPreviews: uniqueTokens.slice(0, 3).map(t => t.substring(0, 30) + '...')
    });

    // Send notification
    const result = await sendPushNotification(uniqueTokens, payload);

    // Clean up invalid tokens if any
    if (result.invalidTokens && result.invalidTokens.length > 0) {
      logger.info('Cleaning up invalid FCM tokens', {
        userId,
        invalidTokenCount: result.invalidTokens.length,
        tokenPreviews: result.invalidTokens.slice(0, 3).map(t => t.substring(0, 30) + '...')
      });

      await User.findByIdAndUpdate(userId, {
        $pull: {
          fcmTokens: { $in: result.invalidTokens },
          fcmTokenMobile: { $in: result.invalidTokens },
        },
      });
      logger.info('✅ Invalid tokens cleaned up', {
        userId,
        removedCount: result.invalidTokens.length
      });
    }

    logger.info('✅ Push notification to user completed', {
      userId,
      success: result.success,
      successCount: result.successCount,
      failureCount: result.failureCount
    });

    return result;
  } catch (error) {
    logger.error('❌ Error in sendPushNotificationToUser', {
      userId,
      error: error.message,
      stack: error.stack
    });
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

