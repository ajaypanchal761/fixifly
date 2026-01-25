const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  // Check if already initialized
  if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin already initialized (apps.length > 0)');
    firebaseInitialized = true;
    return true;
  }

  if (firebaseInitialized) {
    console.log('✅ Firebase Admin already initialized (flag set)');
    return true;
  }

  try {
    console.log('🔧 === Initializing Firebase Admin SDK ===');

    // Try to find service account file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      path.join(__dirname, '../config/fixfly-fb12b-firebase-adminsdk-fbsvc-d96cf044fa.json');

    console.log('📁 Checking service account path:', serviceAccountPath);
    console.log('📁 File exists:', fs.existsSync(serviceAccountPath));
    console.log('🔑 FIREBASE_CONFIG env var exists:', !!process.env.FIREBASE_CONFIG);

    let serviceAccount;

    // Option 1: Read from file path
    if (fs.existsSync(serviceAccountPath)) {
      console.log('📂 Reading service account from file:', serviceAccountPath);
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      console.log('✅ Service account file loaded successfully');
      logger.info('Firebase Admin initialized from service account file');
    }
    // Option 2: Read from environment variable (for production)
    else if (process.env.FIREBASE_CONFIG) {
      console.log('📦 Reading service account from FIREBASE_CONFIG env variable');
      serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
      console.log('✅ Service account loaded from environment variable');
      logger.info('Firebase Admin initialized from environment variable');
    }
    // Option 3: Try default file name pattern
    else {
      console.log('🔍 Searching for Firebase service account file in config directory...');
      const configDir = path.join(__dirname, '../config');

      if (!fs.existsSync(configDir)) {
        throw new Error(`Config directory not found: ${configDir}`);
      }

      const files = fs.readdirSync(configDir);
      console.log('📁 Files in config directory:', files);

      const serviceAccountFile = files.find(file =>
        file.includes('firebase-adminsdk') && file.endsWith('.json')
      );

      if (serviceAccountFile) {
        const fullPath = path.join(configDir, serviceAccountFile);
        console.log('📂 Found service account file:', serviceAccountFile);
        serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        console.log('✅ Service account file loaded successfully');
        logger.info(`Firebase Admin initialized from ${serviceAccountFile}`);
      } else {
        throw new Error(`Firebase service account file not found in ${configDir}. Files: ${files.join(', ')}`);
      }
    }

    if (!serviceAccount) {
      throw new Error('Service account data is null or undefined');
    }

    // Validate service account structure
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Invalid service account structure. Missing required fields (project_id, private_key, or client_email)');
    }

    // Fix private key formatting if needed (handle escaped newlines)
    if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
      // Replace escaped newlines with actual newlines if needed
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

      // Ensure proper BEGIN/END markers
      if (!serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
        throw new Error('Invalid private key format: Missing BEGIN PRIVATE KEY marker');
      }
      if (!serviceAccount.private_key.includes('END PRIVATE KEY')) {
        throw new Error('Invalid private key format: Missing END PRIVATE KEY marker');
      }
    }

    console.log('🔧 Initializing Firebase Admin with service account...');
    console.log('📋 Project ID:', serviceAccount.project_id);
    console.log('📋 Client Email:', serviceAccount.client_email);
    console.log('📋 Private Key ID:', serviceAccount.private_key_id);
    console.log('📋 Private Key Length:', serviceAccount.private_key?.length || 0);
    console.log('📋 Private Key Has Newlines:', serviceAccount.private_key?.includes('\n') || false);

    // Check server time (JWT signature issues often caused by time sync)
    const serverTime = new Date();
    const serverTimeISO = serverTime.toISOString();
    console.log('🕐 Server Time:', serverTimeISO);
    console.log('🕐 Server Time UTC:', serverTime.getTime());

    // Initialize Firebase Admin
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (initError) {
      // Handle specific credential errors
      if (initError.message && initError.message.includes('invalid-credential')) {
        console.error('❌ Firebase credential error detected');
        console.error('💡 Possible causes:');
        console.error('   1. Server time is not synced - Check server time sync');
        console.error('   2. Certificate key file has been revoked - Check Firebase Console');
        console.error('   3. Private key format issue - Check key formatting');
        console.error('🔗 Check key at: https://console.firebase.google.com/iam-admin/serviceaccounts/project');
        console.error('🔗 Generate new key at: https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk');
      }
      throw initError;
    }

    // Verify initialization
    if (admin.apps.length > 0) {
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
      console.log('📊 Active Firebase apps:', admin.apps.length);
      logger.info('Firebase Admin SDK initialized successfully', {
        projectId: serviceAccount.project_id,
        appsCount: admin.apps.length
      });
      return true;
    } else {
      throw new Error('Firebase Admin initialization completed but no apps found');
    }
  } catch (error) {
    console.error('❌ === Firebase Admin Initialization Failed ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('❌ === END ERROR ===');
    logger.error('Failed to initialize Firebase Admin SDK:', {
      error: error.message,
      stack: error.stack
    });
    firebaseInitialized = false;
    return false;
  }
};

// Initialize on module load
console.log('🚀 Attempting to initialize Firebase Admin on module load...');
const initResult = initializeFirebase();
if (!initResult) {
  console.error('⚠️ Firebase Admin initialization failed on module load. Will retry on first use.');
}

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
  // Check if Firebase is initialized, if not try to initialize
  if (!firebaseInitialized && admin.apps.length === 0) {
    console.log('⚠️ Firebase Admin not initialized, attempting to initialize now...');
    const initResult = initializeFirebase();
    if (!initResult) {
      console.error('❌ Firebase Admin initialization failed');
      logger.error('Firebase Admin not initialized');
      return { success: false, error: 'Firebase Admin not initialized' };
    }
  }

  // Double check
  if (admin.apps.length === 0) {
    console.error('❌ Firebase Admin apps.length is 0, initialization failed');
    logger.error('Firebase Admin not initialized - no apps found');
    return { success: false, error: 'Firebase Admin not initialized' };
  }

  try {
    // Ensure tokens is an array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    // Remove null/undefined/empty tokens and unique-ify
    const validTokens = [...new Set(tokenArray.filter(token => token && token.trim().length > 0))];

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
      hasData: !!payload.data,
      hasImage: !!payload.image,
      imageUrl: payload.image ? payload.image.substring(0, 60) + '...' : 'None'
    });

    // Helper function to convert all data values to strings (FCM requirement)
    const stringifyData = (data) => {
      const stringified = {};
      for (const [key, value] of Object.entries(data || {})) {
        if (value === null || value === undefined) {
          stringified[key] = '';
        } else if (typeof value === 'object') {
          // Convert objects/arrays to JSON strings
          stringified[key] = JSON.stringify(value);
        } else {
          // Convert everything else to string
          stringified[key] = String(value);
        }
      }
      return stringified;
    };

    // Prepare data payload with all values as strings
    const dataPayload = stringifyData({
      ...(payload.data || {}),
      link: payload.link || '/',
      handlerName: payload.handlerName || 'handleNotificationClick',
      // Additional fields for webview/APK compatibility
      type: payload.data?.type || 'general',
      title: payload.title,
      body: payload.body,
      timestamp: new Date().toISOString(),
      // Include image in data payload
      ...(payload.image && { image: payload.image })
    });

    // Generate consistent tag/notification ID to prevent duplicates
    // Use bookingId or type to ensure same notification type gets same tag
    const notificationTag = payload.data?.bookingId
      ? `booking_${String(payload.data.bookingId)}`
      : payload.data?.type
        ? `type_${String(payload.data.type)}`
        : `notif_${payload.data?.notificationId || Date.now()}`;

    // Create individual message for each token (like RentYatra - better for webview APK)
    // NOTE: Removed top-level 'notification' field to prevent duplicate notifications
    // Platform-specific notifications (webpush, android, apns) will handle display
    const messages = validTokens.map((token) => ({
      token,
      // Removed top-level notification field to prevent duplicates
      // Platform-specific notifications below will handle display
      data: dataPayload,
      // Web push specific options
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/favicon.png',
          badge: '/favicon.png',
          // Include image for web push
          ...(payload.image && { image: payload.image }),
          clickAction: payload.handlerName || 'message',
          requireInteraction: payload.data?.priority === 'high' || payload.data?.type === 'booking_assignment' || payload.requireInteraction || false,
          // Use consistent tag to prevent duplicate notifications
          tag: notificationTag,
          vibrate: payload.data?.type === 'booking_assignment' ? [200, 100, 200, 100, 200] : [200, 100, 200],
          silent: false,
        },
        fcmOptions: {
          link: payload.link || '/',
        },
        headers: {
          Urgency: payload.data?.priority === 'high' || payload.data?.type === 'booking_assignment' ? 'high' : 'normal',
        },
      },
      // Android specific options (for APK/webview)
      android: {
        priority: 'high',
        notification: {
          title: payload.title,
          body: payload.body,
          sound: 'default',
          channelId: 'default',
          // Include image for Android
          ...(payload.image && { imageUrl: payload.image }),
          clickAction: payload.link || 'FLUTTER_NOTIFICATION_CLICK',
          // Use consistent tag to prevent duplicate notifications
          tag: notificationTag,
        },
        data: stringifyData({
          ...(payload.data || {}),
          click_action: payload.link || 'FLUTTER_NOTIFICATION_CLICK',
          handlerName: payload.handlerName || '',
          // Include image in Android data
          ...(payload.image && { image: payload.image })
        }),
      },
      // iOS specific options
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: 'default',
            badge: 1,
            // Use consistent thread-id (similar to tag) to prevent duplicate notifications
            'thread-id': notificationTag,
            // Include image for iOS
            ...(payload.image && {
              'mutable-content': 1,
              'fcm_options': {
                image: payload.image
              }
            })
          },
          // Include image in APNS payload
          ...(payload.image && { image: payload.image })
        },
        // Include image in APNS notification
        ...(payload.image && {
          fcmOptions: {
            image: payload.image
          }
        }),
        // Use consistent headers to prevent duplicates
        headers: {
          'apns-collapse-id': notificationTag
        }
      },
    }));

    // Use sendEach (like RentYatra) - better for handling individual token failures
    try {
      // Verify Firebase is initialized before sending
      if (admin.apps.length === 0) {
        console.error('❌ Firebase Admin not initialized - cannot send notifications');
        logger.error('Firebase Admin not initialized when trying to send push notification');
        return {
          success: false,
          error: 'Firebase Admin not initialized',
          successCount: 0,
          failureCount: validTokens.length
        };
      }

      console.log('📤 Calling Firebase sendEach with', {
        messageCount: messages.length,
        tokenCount: validTokens.length,
        firebaseInitialized: firebaseInitialized,
        adminAppsCount: admin.apps.length
      });

      const response = await admin.messaging().sendEach(messages);

      console.log('✅ === Push notification sent successfully ===');
      console.log('Results:', {
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: validTokens.length,
        successRate: `${((response.successCount / validTokens.length) * 100).toFixed(1)}%`,
        responsesCount: response.responses?.length || 0
      });

      // Log all responses for debugging
      if (response.responses && response.responses.length > 0) {
        console.log('📋 All responses:', response.responses.map((resp, idx) => ({
          index: idx + 1,
          success: resp.success,
          error: resp.error ? {
            code: resp.error.code,
            message: resp.error.message,
            stack: resp.error.stack
          } : null
        })));
      }

      // Log failed tokens if any
      if (response.failureCount > 0) {
        console.warn('⚠️ === Some push notifications failed ===');
        console.log('📊 Response details:', {
          successCount: response.successCount,
          failureCount: response.failureCount,
          responsesLength: response.responses?.length || 0,
          validTokensLength: validTokens.length
        });
        const invalidTokens = [];
        let credentialErrorDetected = false;

        // Ensure responses array exists and has items
        if (!response.responses || !Array.isArray(response.responses)) {
          console.error('❌ response.responses is not an array:', {
            responses: response.responses,
            responsesType: typeof response.responses
          });
        }

        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            const errorMessage = resp.error?.message || resp.error?.toString() || 'Unknown error';
            const fullError = resp.error;

            console.error(`❌ Token ${idx + 1} failed:`, {
              error: errorMessage,
              code: errorCode,
              tokenPreview: validTokens[idx]?.substring(0, 20) + '...',
              fullError: fullError ? JSON.stringify(fullError, Object.getOwnPropertyNames(fullError)) : 'No error object',
              errorType: typeof resp.error,
              errorKeys: resp.error ? Object.keys(resp.error) : []
            });

            logger.error(`Push notification failed for token ${idx + 1}`, {
              errorCode,
              errorMessage,
              tokenPreview: validTokens[idx]?.substring(0, 30) + '...',
              fullError: fullError
            });

            // Check for credential errors
            if (errorCode === 'app/invalid-credential' || errorMessage.includes('Invalid JWT Signature')) {
              if (!credentialErrorDetected) {
                credentialErrorDetected = true;
                console.error('🔴 === CRITICAL: Firebase Credential Error Detected ===');
                console.error('💡 This error means:');
                console.error('   1. Server time is not properly synced');
                console.error('   2. Certificate key file has been revoked');
                console.error('');
                console.error('🔧 Solutions:');
                console.error('   1. Re-sync time on server: sudo ntpdate -s time.nist.gov');
                console.error('   2. Check key at: https://console.firebase.google.com/iam-admin/serviceaccounts/project');
                console.error('   3. Generate new key at: https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk');
                console.error('🔴 === END CREDENTIAL ERROR ===');
              }
            }

            // Collect invalid tokens for cleanup
            // Check for all invalid token error codes
            const isInvalidToken = errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered' ||
              errorCode === 'messaging/invalid-argument' ||
              (errorMessage && errorMessage.includes('not found'));

            if (isInvalidToken) {
              invalidTokens.push(validTokens[idx]);
              console.log(`🗑️ Marking token ${idx + 1} as invalid for cleanup:`, {
                errorCode,
                errorMessage,
                tokenPreview: validTokens[idx]?.substring(0, 30) + '...'
              });
            } else {
              console.log(`⚠️ Token ${idx + 1} failed but not marked as invalid:`, {
                errorCode,
                errorMessage
              });
            }
          }
        });
        if (invalidTokens.length > 0) {
          console.log(`🗑️ Total invalid tokens to cleanup: ${invalidTokens.length}`);
          console.log(`🗑️ Invalid tokens list:`, invalidTokens.map(t => t.substring(0, 30) + '...'));
        }

        return {
          success: response.successCount > 0,
          successCount: response.successCount,
          failureCount: response.failureCount,
          totalTokens: validTokens.length,
          responses: response.responses,
          invalidTokens: invalidTokens.length > 0 ? invalidTokens : [],
        };
      }

      // No failures - return success with empty invalidTokens array
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: validTokens.length,
        responses: response.responses,
        invalidTokens: [],
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
    // Check if Firebase is initialized, if not try to initialize
    if (!firebaseInitialized && admin.apps.length === 0) {
      console.log('⚠️ Firebase Admin not initialized in sendPushNotificationToUser, attempting to initialize...');
      const initResult = initializeFirebase();
      if (!initResult) {
        console.error('❌ Firebase Admin initialization failed in sendPushNotificationToUser');
        return { success: false, error: 'Firebase Admin not initialized' };
      }
    }

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
      userId: userId.toString(),
      hasImage: !!payload.image,
      imageUrl: payload.image ? payload.image.substring(0, 50) + '...' : 'None'
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


