const User = require('../models/User');
const UserNotification = require('../models/UserNotification');
const firebasePushService = require('./firebasePushService');
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
      console.log('🔔 UserNotificationService: Starting sendToUser...');
      
      // Get user with FCM token
      const user = await User.findById(userId).select('fcmToken name email phone');
      
      if (!user) {
        console.log('❌ User not found:', userId);
        logger.warn('User not found for notification', { userId });
        return false;
      }

      console.log(`📊 User found: ${user.name} (${user.email})`);
      console.log(`   FCM Token: ${user.fcmToken ? 'Present' : 'Missing'}`);
      console.log(`   Token Length: ${user.fcmToken ? user.fcmToken.length : 0}`);

      if (!user.fcmToken) {
        console.log('❌ User has no FCM token');
        logger.warn('User has no FCM token', { userId, userEmail: user.email });
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

      // Send push notification - convert all data values to strings
      const pushData = {};
      Object.keys(data).forEach(key => {
        pushData[key] = String(data[key]);
      });
      pushData.notificationId = userNotification._id.toString();
      pushData.userId = userId.toString();
      
      const pushResult = await firebasePushService.sendPushNotification(
        user.fcmToken,
        notification,
        pushData
      );

      if (pushResult) {
        console.log('✅ Push notification sent successfully to user');
        logger.info('Push notification sent successfully to user', {
          userId,
          userEmail: user.email,
          notificationId: userNotification._id,
          title: notification.title
        });
        return true;
      } else {
        console.log('❌ Push notification failed for user');
        logger.error('Push notification failed for user', {
          userId,
          userEmail: user.email,
          notificationId: userNotification._id
        });
        return false;
      }

    } catch (error) {
      console.error('❌ Error sending notification to user:', error);
      logger.error('Error sending notification to user', {
        error: error.message,
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
      
      // Get users with FCM tokens
      console.log(`🔍 Searching for users with IDs: ${userIds.slice(0, 3).join(', ')}${userIds.length > 3 ? '...' : ''}`);
      
      const users = await User.find({
        _id: { $in: userIds },
        fcmToken: { $exists: true, $ne: null, $ne: '' }
      }).select('_id fcmToken name email');

      console.log(`📊 Found ${users.length} users with FCM tokens out of ${userIds.length} requested`);

      // Debug: Show which users were found
      if (users.length > 0) {
        console.log('📱 Users with FCM tokens:');
        users.slice(0, 3).forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name || 'No Name'} (${user.email || 'No Email'}) - FCM: ${user.fcmToken ? 'Present' : 'Missing'}`);
        });
      }

      if (users.length === 0) {
        console.log('❌ No users with FCM tokens found');
        console.log('🔍 Debugging: Let me check all users with these IDs...');
        
        const allUsers = await User.find({
          _id: { $in: userIds }
        }).select('_id fcmToken name email');
        
        console.log(`📊 Found ${allUsers.length} total users with these IDs:`);
        allUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name || 'No Name'} (${user.email || 'No Email'}) - FCM: ${user.fcmToken || 'None'}`);
        });
        
        logger.warn('No users with FCM tokens found', { userIds, totalUsersFound: allUsers.length });
        return { successCount: 0, failureCount: 0, responses: [] };
      }

      const fcmTokens = users.map(user => user.fcmToken).filter(token => token);
      console.log(`📤 Sending to ${fcmTokens.length} FCM tokens`);

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

      // Send multicast push notification
      const result = await firebasePushService.sendMulticastPushNotification(
        fcmTokens,
        notification,
        {
          ...data,
          type: 'user_notification'
        }
      );

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
