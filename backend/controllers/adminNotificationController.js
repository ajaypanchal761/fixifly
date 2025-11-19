const User = require('../models/User');
const UserNotification = require('../models/UserNotification');
const AdminNotification = require('../models/AdminNotification');
const Vendor = require('../models/Vendor');
const VendorNotification = require('../models/VendorNotification');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const { sendMulticastPushNotification } = require('../services/firebasePushService');
const userNotificationService = require('../services/userNotificationService');

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
      console.log('🔍 === Searching for users with targetAudience: all ===');
      const users = await User.find({
        isActive: true,
        isBlocked: false
      }).select('+fcmTokens +fcmTokenMobile _id name email phone preferences');
      
      console.log(`📊 Found ${users.length} total users in database`);
      
      // Filter users with FCM tokens (web or mobile)
      const usersWithFcmTokens = users.filter(user => {
        const hasWebTokens = user.fcmTokens && Array.isArray(user.fcmTokens) && user.fcmTokens.length > 0;
        const hasMobileTokens = user.fcmTokenMobile && Array.isArray(user.fcmTokenMobile) && user.fcmTokenMobile.length > 0;
        const pushEnabled = user.preferences?.notifications?.push !== false;
        return (hasWebTokens || hasMobileTokens) && pushEnabled;
      });
      
      console.log(`📱 Found ${usersWithFcmTokens.length} users with FCM tokens (web or mobile)`);
      
      // Log some user details for debugging
      usersWithFcmTokens.slice(0, 5).forEach((user, index) => {
        const webTokens = user.fcmTokens?.length || 0;
        const mobileTokens = user.fcmTokenMobile?.length || 0;
        console.log(`   User ${index + 1}: ${user.name || 'No Name'} (${user.email || 'No Email'}) - Web: ${webTokens}, Mobile: ${mobileTokens}`);
      });
      
      targetUserIds = users.map(user => user._id);
      logger.info('Found users for "all" audience', { 
        totalUsers: users.length,
        usersWithFcmTokens: usersWithFcmTokens.length,
        targetUserIds: targetUserIds.length
      });
      // Note: targetVendorIds remains empty for 'all' - only users get notifications
    } else if (targetAudience === 'specific' && targetUsers && targetUsers.length > 0) {
      // Get specific users
      console.log('🔍 === Searching for specific users ===');
      const users = await User.find({
        _id: { $in: targetUsers },
        isActive: true,
        isBlocked: false
      }).select('+fcmTokens +fcmTokenMobile _id name email phone preferences');
      
      console.log(`📊 Found ${users.length} specific users`);
      
      // Filter users with FCM tokens (web or mobile)
      const usersWithFcmTokens = users.filter(user => {
        const hasWebTokens = user.fcmTokens && Array.isArray(user.fcmTokens) && user.fcmTokens.length > 0;
        const hasMobileTokens = user.fcmTokenMobile && Array.isArray(user.fcmTokenMobile) && user.fcmTokenMobile.length > 0;
        const pushEnabled = user.preferences?.notifications?.push !== false;
        return (hasWebTokens || hasMobileTokens) && pushEnabled;
      });
      
      console.log(`📱 Found ${usersWithFcmTokens.length} specific users with FCM tokens`);
      
      // Log user details for debugging
      usersWithFcmTokens.slice(0, 5).forEach((user, index) => {
        const webTokens = user.fcmTokens?.length || 0;
        const mobileTokens = user.fcmTokenMobile?.length || 0;
        console.log(`   User ${index + 1}: ${user.name || 'No Name'} (${user.email || 'No Email'}) - Web: ${webTokens}, Mobile: ${mobileTokens}`);
      });
      
      targetUserIds = users.map(user => user._id);
      logger.info('Found specific users', { 
        totalUsers: users.length,
        usersWithFcmTokens: usersWithFcmTokens.length,
        targetUserIds: targetUserIds.length,
        requestedUserIds: targetUsers
      });
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

    // Send notifications using the improved user notification service
    let userPushResult = { successCount: 0, failureCount: 0 };
    let vendorPushResult = { successCount: 0, failureCount: 0 };

    // Send notifications to users using the user notification service
    if (targetUserIds.length > 0) {
      try {
        console.log('🔔 === Sending notifications to users via userNotificationService ===');
        console.log(`📤 Target user IDs: ${targetUserIds.length} users`);
        console.log(`📝 Notification title: "${title}"`);
        console.log(`📝 Notification message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
        console.log(`🖼️ Image: ${image ? 'Present' : 'Not provided'}`);
        
        userPushResult = await userNotificationService.sendToMultipleUsers(
          targetUserIds,
          {
            title,
            body: message,
            ...(image && { image: image.secure_url || image })
          },
          {
            type: 'admin_notification',
            priority: 'high',
            timestamp: new Date().toISOString(),
            link: '/notifications',
            ...(image && { image: image.secure_url || image })
          }
        );
        
        console.log('✅ === User notifications sent ===');
        console.log('Results:', {
          successCount: userPushResult.successCount,
          failureCount: userPushResult.failureCount,
          totalTargetUsers: targetUserIds.length,
          successRate: targetUserIds.length > 0 ? `${((userPushResult.successCount / targetUserIds.length) * 100).toFixed(1)}%` : '0%'
        });
        
        if (userPushResult.successCount === 0 && userPushResult.failureCount === 0) {
          console.log('⚠️ No notifications were sent - this might indicate:');
          console.log('   1. Users have no FCM tokens (web or mobile)');
          console.log('   2. Users have push notifications disabled');
          console.log('   3. Issue with user notification service');
        } else if (userPushResult.failureCount > 0) {
          console.log(`⚠️ ${userPushResult.failureCount} notifications failed to send`);
          console.log('   This might indicate invalid FCM tokens that need cleanup');
        }
        
      } catch (error) {
        console.error('❌ === ERROR sending user notifications ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('❌ === END ERROR ===');
        logger.error('Error sending user notifications via userNotificationService:', {
          error: error.message,
          stack: error.stack,
          targetUserIds: targetUserIds.length
        });
      }
    } else {
      console.log('⚠️ No target user IDs found - skipping user notifications');
    }

    // Send notifications to vendors using the existing method
    if (targetVendorIds.length > 0) {
      try {
        const vendors = await Vendor.find({
          _id: { $in: targetVendorIds },
          fcmToken: { $exists: true, $ne: null }
        }).select('_id fcmToken');

        const vendorFcmTokens = vendors.map(vendor => vendor.fcmToken).filter(token => token);

        if (vendorFcmTokens.length > 0) {
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

          const pushData = {
            type: 'admin_notification',
            title,
            message,
            timestamp: new Date().toISOString(),
            ...(image && { image: image.secure_url })
          };

          vendorPushResult = await sendMulticastPushNotification(vendorFcmTokens, pushNotification, pushData);
          console.log('✅ Vendor notifications sent:', {
            successCount: vendorPushResult.successCount,
            failureCount: vendorPushResult.failureCount
          });
        }
      } catch (error) {
        console.error('❌ Error sending vendor notifications:', error);
        logger.error('Error sending vendor notifications:', error);
      }
    }

    // Combine results
    const totalPushResult = {
      successCount: userPushResult.successCount + vendorPushResult.successCount,
      failureCount: userPushResult.failureCount + vendorPushResult.failureCount
    };

    // Note: User notifications are already created by userNotificationService.sendToMultipleUsers()
    // We only need to create vendor notifications in database since vendor service doesn't handle it
    if (targetVendorIds.length > 0) {
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

      await VendorNotification.insertMany(vendorNotifications);
    }

    // Update admin notification record with results
    adminNotificationData.status = 'sent';
    adminNotificationData.sentAt = new Date();
    adminNotificationData.sentCount = totalPushResult.successCount;
    adminNotificationData.deliveredCount = totalPushResult.successCount;
    adminNotificationData.failedCount = totalPushResult.failureCount;
    adminNotificationData.readCount = 0; // Initially no reads

    const adminNotification = await AdminNotification.create(adminNotificationData);

    logger.info('Admin notification sent successfully', {
      adminId: req.admin._id,
      adminNotificationId: adminNotification._id,
      title,
      targetAudience,
      totalUsers: targetUserIds.length,
      totalVendors: targetVendorIds.length,
      userNotificationsSent: userPushResult.successCount,
      vendorNotificationsSent: vendorPushResult.successCount,
      totalSentCount: totalPushResult.successCount,
      totalFailedCount: totalPushResult.failureCount
    });

    const responseMessage = totalPushResult.successCount > 0 
      ? 'Notification sent successfully'
      : 'Notification saved successfully (no push notifications sent - no FCM tokens found)';

    res.json({
      success: true,
      message: responseMessage,
      data: {
        notification: adminNotification,
        sentCount: totalPushResult.successCount,
        deliveredCount: totalPushResult.successCount,
        failedCount: totalPushResult.failureCount,
        totalUsers: targetUserIds.length,
        totalVendors: targetVendorIds.length,
        userNotificationsSent: userPushResult.successCount,
        vendorNotificationsSent: vendorPushResult.successCount,
        pushNotificationsSent: totalPushResult.successCount > 0
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