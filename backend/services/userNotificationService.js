const User = require('../models/User');
const UserNotification = require('../models/UserNotification');
const { sendPushNotificationToUser } = require('./firebaseAdmin');
const { logger } = require('../utils/logger');

/**
 * User Notification Service
 * Handles sending push notifications to users
 */
class UserNotificationService {
  constructor() {
    this.serviceName = 'User Notification Service';
  }

  /**
   * Send push notification to a specific user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification payload
   * @param {Object} data - Additional data payload
   * @returns {Promise<boolean>} - Success status
   */
  async sendToUser(userId, notification, data = {}) {
    try {
      console.log('🔔 === UserNotificationService: Starting sendToUser ===');
      console.log('📋 Notification Details:', {
        userId: userId.toString(),
        title: notification.title,
        body: notification.body?.substring(0, 50) + '...',
        type: data.type,
        bookingId: data.bookingId
      });
      
      // Get user with FCM tokens (both web and mobile) - explicitly include fields with select: false
      const user = await User.findById(userId).select('+fcmTokens +fcmTokenMobile name email phone preferences');
      
      if (!user) {
        console.log('❌ User not found:', userId);
        logger.warn('User not found for notification', { userId });
        return false;
      }

      // Combine web and mobile tokens
      const allTokens = [
        ...(user.fcmTokens || []),
        ...(user.fcmTokenMobile || [])
      ];
      const uniqueTokens = [...new Set(allTokens)];

      console.log(`📊 User Details:`, {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        webTokensCount: user.fcmTokens?.length || 0,
        mobileTokensCount: user.fcmTokenMobile?.length || 0,
        totalUniqueTokens: uniqueTokens.length,
        webTokens: user.fcmTokens?.slice(0, 2).map(t => t.substring(0, 20) + '...') || [],
        mobileTokens: user.fcmTokenMobile?.slice(0, 2).map(t => t.substring(0, 20) + '...') || []
      });

      if (uniqueTokens.length === 0) {
        console.log('❌ User has no FCM tokens - Cannot send notification');
        logger.warn('User has no FCM tokens', { 
          userId, 
          userEmail: user.email,
          userPhone: user.phone,
          webTokensCount: user.fcmTokens?.length || 0,
          mobileTokensCount: user.fcmTokenMobile?.length || 0
        });
        return false;
      }

      // Check if user has push notifications enabled
      if (user.preferences?.notifications?.push === false) {
        console.log('⚠️ User has push notifications disabled in preferences');
        logger.info('Push notifications disabled for user', { 
          userId, 
          userEmail: user.email,
          userPhone: user.phone
        });
        return false;
      }

      // Create notification in database
      const userNotification = new UserNotification({
        user: userId,
        title: notification.title,
        message: notification.body || notification.message,
        type: data.type || 'general',
        priority: data.priority || 'medium',
        data: data,
        isRead: false,
        // Add image data if available
        ...(notification.image && {
          image: {
            secure_url: notification.image,
            public_id: `notification_${Date.now()}`,
            width: 300,
            height: 200
          }
        })
      });

      await userNotification.save();
      console.log('✅ User notification saved to database');

      // Prepare notification payload for Firebase
      const pushPayload = {
        title: notification.title,
        body: notification.body || notification.message,
        data: {
          ...data,
          notificationId: userNotification._id.toString(),
          userId: userId.toString()
        },
        handlerName: data.type || 'booking',
        link: data.link || (data.bookingId ? `/booking/${data.bookingId}` : '/notifications'),
        icon: '/favicon.png'
      };

      // Send push notification using Firebase Admin
      console.log('📤 Sending push notification via Firebase Admin...');
      const pushResult = await sendPushNotificationToUser(userId, pushPayload);

      if (pushResult && pushResult.success) {
        console.log('✅ Push notification sent successfully to user', {
          successCount: pushResult.successCount,
          failureCount: pushResult.failureCount,
          totalTokens: pushResult.totalTokens,
          notificationId: userNotification._id.toString()
        });
        logger.info('Push notification sent successfully to user', {
          userId,
          userEmail: user.email,
          userPhone: user.phone,
          notificationId: userNotification._id,
          title: notification.title,
          successCount: pushResult.successCount,
          failureCount: pushResult.failureCount,
          totalTokens: pushResult.totalTokens
        });
        return true;
      } else {
        console.log('❌ Push notification failed for user', {
          error: pushResult?.error || pushResult?.message || 'Unknown error',
          successCount: pushResult?.successCount || 0,
          failureCount: pushResult?.failureCount || 0,
          notificationId: userNotification._id.toString()
        });
        logger.error('Push notification failed for user', {
          userId,
          userEmail: user.email,
          userPhone: user.phone,
          notificationId: userNotification._id,
          error: pushResult?.error || pushResult?.message,
          successCount: pushResult?.successCount,
          failureCount: pushResult?.failureCount
        });
        return false;
      }

    } catch (error) {
      console.error('❌ === ERROR in UserNotificationService.sendToUser ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('UserId:', userId);
      console.error('Notification title:', notification.title);
      console.error('❌ === END ERROR ===');
      logger.error('Error sending notification to user', {
        error: error.message,
        stack: error.stack,
        userId
      });
      return false;
    }
  }

  /**
   * Send push notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notification - Notification payload
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} - Results with success and failure counts
   */
  async sendToMultipleUsers(userIds, notification, data = {}) {
    try {
      console.log('🔔 UserNotificationService: Starting sendToMultipleUsers...');
      console.log(`📊 Sending to ${userIds.length} users`);
      
      // Get users with FCM tokens (web or mobile)
      console.log(`🔍 Searching for users with IDs: ${userIds.slice(0, 3).join(', ')}${userIds.length > 3 ? '...' : ''}`);
      
      const users = await User.find({
        _id: { $in: userIds },
        $or: [
          { fcmTokens: { $exists: true, $ne: [], $size: { $gt: 0 } } },
          { fcmTokenMobile: { $exists: true, $ne: [], $size: { $gt: 0 } } }
        ]
      }).select('+fcmTokens +fcmTokenMobile _id name email preferences');

      console.log(`📊 Found ${users.length} users with FCM tokens out of ${userIds.length} requested`);

      // Debug: Show which users were found
      if (users.length > 0) {
        console.log('📱 Users with FCM tokens:');
        users.slice(0, 3).forEach((user, index) => {
          const webTokens = user.fcmTokens?.length || 0;
          const mobileTokens = user.fcmTokenMobile?.length || 0;
          console.log(`   ${index + 1}. ${user.name || 'No Name'} (${user.email || 'No Email'}) - Web: ${webTokens}, Mobile: ${mobileTokens}`);
        });
      }

      if (users.length === 0) {
        console.log('❌ No users with FCM tokens found');
        console.log('🔍 Debugging: Let me check all users with these IDs...');
        
        const allUsers = await User.find({
          _id: { $in: userIds }
        }).select('+fcmTokens +fcmTokenMobile _id name email');
        
        console.log(`📊 Found ${allUsers.length} total users with these IDs:`);
        allUsers.forEach((user, index) => {
          const webTokens = user.fcmTokens?.length || 0;
          const mobileTokens = user.fcmTokenMobile?.length || 0;
          console.log(`   ${index + 1}. ${user.name || 'No Name'} (${user.email || 'No Email'}) - Web: ${webTokens}, Mobile: ${mobileTokens}`);
        });
        
        logger.warn('No users with FCM tokens found', { userIds, totalUsersFound: allUsers.length });
        return { successCount: 0, failureCount: 0, responses: [] };
      }

      // Collect all tokens (web and mobile) from all users
      const fcmTokens = [];
      users.forEach(user => {
        if (user.preferences?.notifications?.push !== false) {
          if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
            fcmTokens.push(...user.fcmTokens);
          }
          if (user.fcmTokenMobile && Array.isArray(user.fcmTokenMobile)) {
            fcmTokens.push(...user.fcmTokenMobile);
          }
        }
      });
      const uniqueTokens = [...new Set(fcmTokens)];
      console.log(`📤 Sending to ${uniqueTokens.length} unique FCM tokens`);

      // Create notifications in database for all users
      const notifications = users.map(user => ({
        user: user._id,
        title: notification.title,
        message: notification.body || notification.message,
        type: data.type || 'general',
        priority: data.priority || 'medium',
        data: data,
        isRead: false,
        // Add image data if available
        ...(notification.image && {
          image: {
            secure_url: notification.image,
            public_id: `notification_${Date.now()}_${user._id}`,
            width: 300,
            height: 200
          }
        })
      }));

      await UserNotification.insertMany(notifications);
      console.log('✅ User notifications saved to database');

      // Prepare notification payload for Firebase
      const pushPayload = {
        title: notification.title,
        body: notification.body || notification.message,
        data: {
          ...data,
          type: 'user_notification'
        },
        handlerName: data.type || 'notification',
        link: '/notifications',
        icon: '/favicon.png'
      };

      // Send multicast push notification using Firebase Admin
      const { sendPushNotification } = require('./firebaseAdmin');
      const result = await sendPushNotification(uniqueTokens, pushPayload);

      console.log('📊 Multicast notification result:', {
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalTokens: fcmTokens.length
      });

      logger.info('Multicast notification sent to users', {
        totalUsers: userIds.length,
        usersWithTokens: users.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
        title: notification.title
      });

      return result;

    } catch (error) {
      console.error('❌ Error sending multicast notification to users:', error);
      logger.error('Error sending multicast notification to users', {
        error: error.message,
        userIds
      });
      return { successCount: 0, failureCount: 0, responses: [] };
    }
  }

  /**
   * Send booking status update notification to user
   * @param {string} userId - User ID
   * @param {Object} booking - Booking data
   * @param {string} status - New booking status
   * @returns {Promise<boolean>} - Success status
   */
  async sendBookingStatusUpdate(userId, booking, status) {
    try {
      const statusMessages = {
        'waiting_for_engineer': 'Your booking is waiting for an engineer to be assigned.',
        'engineer_assigned': 'An engineer has been assigned to your booking.',
        'in_progress': 'Your service is now in progress.',
        'completed': 'Your service has been completed successfully.',
        'cancelled': 'Your booking has been cancelled.',
        'rescheduled': 'Your booking has been rescheduled.'
      };

      const notification = {
        title: '📱 Booking Status Update',
        body: statusMessages[status] || `Your booking status has been updated to: ${status}`
      };

      const data = {
        type: 'booking_update',
        bookingId: booking._id.toString(),
        status: status,
        priority: status === 'completed' ? 'high' : 'medium'
      };

      return await this.sendToUser(userId, notification, data);

    } catch (error) {
      logger.error('Error sending booking status update notification', {
        error: error.message,
        userId,
        bookingId: booking._id,
        status
      });
      return false;
    }
  }

  /**
   * Send payment confirmation notification to user
   * @param {string} userId - User ID
   * @param {Object} payment - Payment data
   * @returns {Promise<boolean>} - Success status
   */
  async sendPaymentConfirmation(userId, payment) {
    try {
      const notification = {
        title: '💳 Payment Confirmed',
        body: `Your payment of ₹${payment.amount} has been confirmed successfully.`
      };

      const data = {
        type: 'payment_confirmation',
        paymentId: payment._id?.toString() || payment.transactionId,
        amount: payment.amount,
        priority: 'high'
      };

      return await this.sendToUser(userId, notification, data);

    } catch (error) {
      logger.error('Error sending payment confirmation notification', {
        error: error.message,
        userId,
        paymentId: payment._id || payment.transactionId
      });
      return false;
    }
  }

  /**
   * Send general notification to user
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} data - Additional data
   * @returns {Promise<boolean>} - Success status
   */
  async sendGeneralNotification(userId, title, message, data = {}) {
    try {
      const notification = {
        title: title,
        body: message
      };

      const notificationData = {
        type: 'general',
        priority: 'medium',
        ...data
      };

      return await this.sendToUser(userId, notification, notificationData);

    } catch (error) {
      logger.error('Error sending general notification', {
        error: error.message,
        userId,
        title
      });
      return false;
    }
  }
}

// Create and export singleton instance
const userNotificationService = new UserNotificationService();
module.exports = userNotificationService;
