const User = require('../models/User');
const UserNotification = require('../models/UserNotification');
const AdminNotification = require('../models/AdminNotification');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const { sendMulticastPushNotification } = require('../services/firebasePushService');

// @desc    Send push notification to users
// @route   POST /api/admin/notifications/send
// @access  Private (Admin)
const sendNotification = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      message,
      targetAudience,
      targetUsers,
      targetVendors,
      scheduledAt,
      isScheduled
    } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Create admin notification record
    const adminNotificationData = {
      title,
      message,
      targetAudience,
      targetUsers: targetUsers || [],
      targetVendors: targetVendors || [],
      scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt) : null,
      isScheduled: isScheduled || false,
      status: 'draft',
      sentBy: req.admin._id,
      data: {
        type: 'admin_notification',
        title,
        message,
        timestamp: new Date().toISOString()
      }
    };

    // Handle scheduled notifications
    if (isScheduled && scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
          message: 'Scheduled time must be in the future'
        });
      }
      
      adminNotificationData.status = 'scheduled';
      const adminNotification = await AdminNotification.create(adminNotificationData);
      
      return res.status(200).json({
        success: true,
        message: 'Notification scheduled successfully',
        data: {
          notification: adminNotification,
          sentCount: 0,
          deliveredCount: 0,
          failedCount: 0
        }
      });
    }

    // Get target users based on audience
    let targetUserIds = [];
    
    if (targetAudience === 'all') {
      // Get all users with FCM tokens
      const users = await User.find({
        fcmToken: { $exists: true, $ne: null },
        'preferences.notifications.push': true,
        isActive: true,
        isBlocked: false
      }).select('_id fcmToken');
      targetUserIds = users.map(user => user._id);
    } else if (targetAudience === 'users') {
      // Get all users with FCM tokens
      const users = await User.find({
        role: 'user',
        fcmToken: { $exists: true, $ne: null },
        'preferences.notifications.push': true,
        isActive: true,
        isBlocked: false
      }).select('_id fcmToken');
      targetUserIds = users.map(user => user._id);
    } else if (targetAudience === 'specific' && targetUsers && targetUsers.length > 0) {
      // Get specific users
      const users = await User.find({
        _id: { $in: targetUsers },
        fcmToken: { $exists: true, $ne: null },
        'preferences.notifications.push': true,
        isActive: true,
        isBlocked: false
      }).select('_id fcmToken');
      targetUserIds = users.map(user => user._id);
    }

    if (targetUserIds.length === 0) {
        return res.status(400).json({
          success: false,
        message: 'No target users found with FCM tokens'
      });
    }

    // Get FCM tokens for push notification
    const users = await User.find({
      _id: { $in: targetUserIds },
      fcmToken: { $exists: true, $ne: null }
    }).select('_id fcmToken');

    const fcmTokens = users.map(user => user.fcmToken).filter(token => token);

    if (fcmTokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid FCM tokens found'
      });
    }

    // Prepare push notification payload
    const pushNotification = {
      title,
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        type: 'admin_notification',
        title,
        message,
        timestamp: new Date().toISOString()
      }
    };

    const pushData = {
      type: 'admin_notification',
      title,
      message,
      timestamp: new Date().toISOString()
    };

    // Send push notification
    let pushResult = { successCount: 0, failureCount: 0 };
    try {
      pushResult = await sendMulticastPushNotification(fcmTokens, pushNotification, pushData);
      logger.info('Push notification sent', {
        totalTokens: fcmTokens.length,
        successCount: pushResult.successCount,
        failureCount: pushResult.failureCount
      });
    } catch (error) {
      logger.error('Error sending push notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send push notification',
        error: error.message
      });
    }

    // Create user notifications in database
    const userNotifications = targetUserIds.map(userId => ({
      user: userId,
      title,
      message,
      type: 'system',
      priority: 'medium',
      data: {
        type: 'admin_notification',
        title,
        message,
        timestamp: new Date().toISOString()
      },
      sentBy: req.admin._id,
      pushSent: true,
      pushSentAt: new Date()
    }));

    await UserNotification.insertMany(userNotifications);

    // Update admin notification record with results
    adminNotificationData.status = 'sent';
    adminNotificationData.sentAt = new Date();
    adminNotificationData.sentCount = pushResult.successCount;
    adminNotificationData.deliveredCount = pushResult.successCount;
    adminNotificationData.failedCount = pushResult.failureCount;
    adminNotificationData.readCount = 0; // Initially no reads

    const adminNotification = await AdminNotification.create(adminNotificationData);

    logger.info('Admin notification sent successfully', {
      adminId: req.admin._id,
      adminNotificationId: adminNotification._id,
      title,
      targetAudience,
      totalUsers: targetUserIds.length,
      sentCount: pushResult.successCount,
      failedCount: pushResult.failureCount
    });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notification: adminNotification,
        sentCount: pushResult.successCount,
        deliveredCount: pushResult.successCount,
        failedCount: pushResult.failureCount
      }
    });

  } catch (error) {
    logger.error('Error sending admin notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message
    });
  }
});

// @desc    Get all admin notifications
// @route   GET /api/admin/notifications
// @access  Private (Admin)
const getNotifications = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status, targetAudience, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (targetAudience && targetAudience !== 'all') {
      filter.targetAudience = targetAudience;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const notifications = await AdminNotification.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sentBy', 'name email')
      .lean();

    const totalNotifications = await AdminNotification.countDocuments(filter);
    const totalPages = Math.ceil(totalNotifications / parseInt(limit));

    logger.info(`Admin retrieved notifications`, {
      adminId: req.admin._id,
      totalNotifications,
      page: parseInt(page),
      status,
      targetAudience
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalNotifications,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching admin notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// @desc    Get notification statistics
// @route   GET /api/admin/notifications/stats
// @access  Private (Admin)
const getNotificationStats = asyncHandler(async (req, res) => {
  try {
    const stats = await AdminNotification.getStats();

    logger.info(`Admin retrieved notification stats`, {
      adminId: req.admin._id,
      stats
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification statistics',
      error: error.message
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
// @access  Private (Admin)
const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await AdminNotification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if notification can be deleted (only draft and failed notifications)
    if (notification.status === 'sent' || notification.status === 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete sent or scheduled notifications'
      });
    }

    await AdminNotification.findByIdAndDelete(id);

    logger.info(`Admin deleted notification: ${id}`, {
      adminId: req.admin._id,
      notificationId: id
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

module.exports = {
  sendNotification,
  getNotifications,
  getNotificationStats,
  deleteNotification
};