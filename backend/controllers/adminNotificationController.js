const User = require('../models/User');
const UserNotification = require('../models/UserNotification');
const AdminNotification = require('../models/AdminNotification');
const Vendor = require('../models/Vendor');
const VendorNotification = require('../models/VendorNotification');
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
      isScheduled,
      image
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
      image: image || null,
      data: {
        type: 'admin_notification',
        title,
        message,
        timestamp: new Date().toISOString(),
        ...(image && { image })
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

    // Get target users and vendors based on audience
    let targetUserIds = [];
    let targetVendorIds = [];
    
    if (targetAudience === 'all') {
      // Get all users (only regular users, not vendors)
      const users = await User.find({
        isActive: true,
        isBlocked: false
      }).select('_id fcmToken');
      targetUserIds = users.map(user => user._id);
      logger.info('Found users for "all" audience', { count: users.length });
      // Note: targetVendorIds remains empty for 'all' - only users get notifications
    } else if (targetAudience === 'vendors') {
      // Get all vendors
      const vendors = await Vendor.find({
        isActive: true,
        isBlocked: false
      }).select('_id fcmToken');
      targetVendorIds = vendors.map(vendor => vendor._id);
      logger.info('Found vendors for "vendors" audience', { count: vendors.length });
    } else if (targetAudience === 'specific' && targetVendors && targetVendors.length > 0) {
      // Get specific vendors
      const vendors = await Vendor.find({
        _id: { $in: targetVendors },
        isActive: true,
        isBlocked: false
      }).select('_id fcmToken');
      targetVendorIds = vendors.map(vendor => vendor._id);
      logger.info('Found specific vendors', { count: vendors.length, targetVendors });
    }

    logger.info('Target audience analysis', {
      targetAudience,
      targetUserIds: targetUserIds.length,
      targetVendorIds: targetVendorIds.length,
      targetUsers: targetUsers,
      targetVendors: targetVendors
    });

    if (targetUserIds.length === 0 && targetVendorIds.length === 0) {
        return res.status(400).json({
          success: false,
        message: 'No target users or vendors found'
      });
    }

    // Get FCM tokens for push notification
    const users = await User.find({
      _id: { $in: targetUserIds },
      fcmToken: { $exists: true, $ne: null }
    }).select('_id fcmToken');

    const vendors = await Vendor.find({
      _id: { $in: targetVendorIds },
      fcmToken: { $exists: true, $ne: null }
    }).select('_id fcmToken');

    const userFcmTokens = users.map(user => user.fcmToken).filter(token => token);
    const vendorFcmTokens = vendors.map(vendor => vendor.fcmToken).filter(token => token);
    const fcmTokens = [...userFcmTokens, ...vendorFcmTokens];

    // If no FCM tokens, we'll still create notifications in database but skip push notification
    let pushResult = { successCount: 0, failureCount: 0 };
    
    if (fcmTokens.length > 0) {

    // Prepare push notification payload
    const pushNotification = {
      title,
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...(image && { image: image.secure_url }),
      data: {
        type: 'admin_notification',
        title,
        message,
        timestamp: new Date().toISOString(),
        ...(image && { image: image.secure_url })
      }
    };

    // Debug logging for image
    if (image) {
      console.log('🖼️ Image data in notification:', {
        hasImage: !!image,
        secure_url: image.secure_url,
        public_id: image.public_id,
        width: image.width,
        height: image.height
      });
    } else {
      console.log('❌ No image data in notification');
    }

    const pushData = {
      type: 'admin_notification',
      title,
      message,
      timestamp: new Date().toISOString(),
      ...(image && { image: image.secure_url })
    };

      // Send push notification
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
    }

    // Create user notifications in database
    const userNotifications = targetUserIds.map(userId => ({
      user: userId,
      title,
      message,
      type: 'system',
      priority: 'medium',
      image: image || null,
      data: {
        type: 'admin_notification',
        title,
        message,
        timestamp: new Date().toISOString(),
        ...(image && { image })
      },
      sentBy: req.admin._id,
      pushSent: true,
      pushSentAt: new Date()
    }));

    // Create vendor notifications in database
    const vendorNotifications = targetVendorIds.map(vendorId => ({
      vendorId: vendorId,
      title,
      message,
      type: 'system_notification',
      priority: 'medium',
      image: image || null,
      data: {
        type: 'admin_notification',
        title,
        message,
        timestamp: new Date().toISOString(),
        ...(image && { image })
      }
    }));

    // Insert notifications
    if (userNotifications.length > 0) {
      await UserNotification.insertMany(userNotifications);
    }
    if (vendorNotifications.length > 0) {
      await VendorNotification.insertMany(vendorNotifications);
    }

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
      totalVendors: targetVendorIds.length,
      sentCount: pushResult.successCount,
      failedCount: pushResult.failureCount
    });

    const responseMessage = fcmTokens.length > 0 
      ? 'Notification sent successfully'
      : 'Notification saved successfully (no push notifications sent - no FCM tokens found)';

    res.json({
      success: true,
      message: responseMessage,
      data: {
        notification: adminNotification,
        sentCount: pushResult.successCount,
        deliveredCount: pushResult.successCount,
        failedCount: pushResult.failureCount,
        totalUsers: targetUserIds.length,
        totalVendors: targetVendorIds.length,
        pushNotificationsSent: fcmTokens.length > 0
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