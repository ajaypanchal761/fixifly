const { Notification } = require('../models/Notification');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

// @desc    Get all notifications for admin
// @route   GET /api/admin/notifications
// @access  Admin
const getAllNotifications = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      targetAudience, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (targetAudience) {
      filter.targetAudience = targetAudience;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const notifications = await Notification.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalNotifications = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(totalNotifications / parseInt(limit));

    // Calculate statistics
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          sentNotifications: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          scheduledNotifications: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          },
          draftNotifications: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          failedNotifications: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          totalRecipients: { $sum: '$sentCount' },
          totalDelivered: { $sum: '$deliveredCount' },
          totalRead: { $sum: '$readCount' }
        }
      }
    ]);

    const notificationStats = stats[0] || {
      totalNotifications: 0,
      sentNotifications: 0,
      scheduledNotifications: 0,
      draftNotifications: 0,
      failedNotifications: 0,
      totalRecipients: 0,
      totalDelivered: 0,
      totalRead: 0
    };

    // Calculate average delivery rate
    if (notificationStats.totalRecipients > 0) {
      notificationStats.averageDeliveryRate = Math.round(
        (notificationStats.totalDelivered / notificationStats.totalRecipients) * 100
      );
    } else {
      notificationStats.averageDeliveryRate = 0;
    }

    logger.info(`Admin retrieved notifications: ${notifications.length}`, {
      totalNotifications,
      page: parseInt(page),
      filters: { status, targetAudience, search }
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
        },
        stats: notificationStats
      }
    });
  } catch (error) {
    logger.error('Error retrieving admin notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notifications',
      error: error.message
    });
  }
});

// @desc    Get single notification for admin
// @route   GET /api/admin/notifications/:id
// @access  Admin
const getNotificationById = asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    logger.info(`Admin retrieved notification: ${notification._id}`, {
      notificationId: notification._id,
      status: notification.status
    });

    res.json({
      success: true,
      data: {
        notification
      }
    });
  } catch (error) {
    logger.error('Error retrieving admin notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notification',
      error: error.message
    });
  }
});

// @desc    Create new notification
// @route   POST /api/admin/notifications
// @access  Admin
const createNotification = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      message,
      targetAudience,
      targetUsers,
      targetVendors,
      isScheduled,
      scheduledAt,
      data
    } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Validate target audience
    if (!['all', 'users', 'vendors', 'specific'].includes(targetAudience)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target audience'
      });
    }

    // Validate specific targets
    if (targetAudience === 'specific') {
      if (!targetUsers && !targetVendors) {
        return res.status(400).json({
          success: false,
          message: 'Target users or vendors required for specific audience'
        });
      }
    }

    // Validate scheduled date
    if (isScheduled && scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date must be in the future'
        });
      }
    }

    const notificationData = {
      title,
      message,
      targetAudience,
      isScheduled: isScheduled || false,
      scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt) : null,
      status: isScheduled ? 'scheduled' : 'draft',
      createdBy: req.admin._id,
      data: data || {}
    };

    // Add specific targets if provided
    if (targetUsers && targetUsers.length > 0) {
      notificationData.targetUsers = targetUsers;
    }
    if (targetVendors && targetVendors.length > 0) {
      notificationData.targetVendors = targetVendors;
    }

    const notification = await Notification.create(notificationData);

    logger.info(`Admin created notification: ${notification._id}`, {
      notificationId: notification._id,
      title: notification.title,
      targetAudience: notification.targetAudience,
      isScheduled: notification.isScheduled,
      adminId: req.admin._id
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: {
        notification
      }
    });
  } catch (error) {
    logger.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
});

// @desc    Update notification
// @route   PUT /api/admin/notifications/:id
// @access  Admin
const updateNotification = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      message,
      targetAudience,
      targetUsers,
      targetVendors,
      isScheduled,
      scheduledAt,
      data
    } = req.body;

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if notification can be updated
    if (notification.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update sent notification'
      });
    }

    // Update fields
    if (title) notification.title = title;
    if (message) notification.message = message;
    if (targetAudience) notification.targetAudience = targetAudience;
    if (targetUsers) notification.targetUsers = targetUsers;
    if (targetVendors) notification.targetVendors = targetVendors;
    if (isScheduled !== undefined) notification.isScheduled = isScheduled;
    if (scheduledAt) notification.scheduledAt = new Date(scheduledAt);
    if (data) notification.data = data;

    // Update status based on scheduling
    if (notification.isScheduled && notification.scheduledAt) {
      notification.status = 'scheduled';
    } else if (!notification.isScheduled) {
      notification.status = 'draft';
    }

    await notification.save();

    logger.info(`Admin updated notification: ${notification._id}`, {
      notificationId: notification._id,
      adminId: req.admin._id
    });

    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: {
        notification
      }
    });
  } catch (error) {
    logger.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
});

// @desc    Send notification
// @route   POST /api/admin/notifications/:id/send
// @access  Admin
const sendNotification = asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if notification can be sent
    if (notification.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Notification already sent'
      });
    }

    if (notification.isScheduled && notification.scheduledAt > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send scheduled notification before scheduled time'
      });
    }

    // TODO: Implement actual push notification sending logic here
    // This would integrate with FCM, APNS, or other push notification services
    
    // For now, simulate sending
    const sentCount = Math.floor(Math.random() * 1000) + 100; // Mock sent count
    const deliveredCount = Math.floor(sentCount * 0.95); // Mock delivery rate
    const readCount = Math.floor(deliveredCount * 0.7); // Mock read rate

    // Update notification status
    notification.status = 'sent';
    notification.sentAt = new Date();
    notification.sentCount = sentCount;
    notification.deliveredCount = deliveredCount;
    notification.readCount = readCount;

    await notification.save();

    logger.info(`Admin sent notification: ${notification._id}`, {
      notificationId: notification._id,
      sentCount,
      deliveredCount,
      readCount,
      adminId: req.admin._id
    });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notification,
        sentCount,
        deliveredCount,
        readCount
      }
    });
  } catch (error) {
    logger.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
// @access  Admin
const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if notification can be deleted
    if (notification.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete sent notification'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    logger.info(`Admin deleted notification: ${notification._id}`, {
      notificationId: notification._id,
      adminId: req.admin._id
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

// @desc    Get notification statistics
// @route   GET /api/admin/notifications/stats
// @access  Admin
const getNotificationStats = asyncHandler(async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
        break;
      case '1y':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const stats = await Notification.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          sentNotifications: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          scheduledNotifications: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          },
          draftNotifications: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          failedNotifications: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          totalRecipients: { $sum: '$sentCount' },
          totalDelivered: { $sum: '$deliveredCount' },
          totalRead: { $sum: '$readCount' }
        }
      }
    ]);

    // Get daily notification trends for the last 30 days
    const dailyTrends = await Notification.aggregate([
      { $match: { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          notifications: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          recipients: { $sum: '$sentCount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const result = stats[0] || {
      totalNotifications: 0,
      sentNotifications: 0,
      scheduledNotifications: 0,
      draftNotifications: 0,
      failedNotifications: 0,
      totalRecipients: 0,
      totalDelivered: 0,
      totalRead: 0
    };

    // Calculate rates
    if (result.totalRecipients > 0) {
      result.averageDeliveryRate = Math.round((result.totalDelivered / result.totalRecipients) * 100);
    } else {
      result.averageDeliveryRate = 0;
    }

    if (result.totalDelivered > 0) {
      result.averageReadRate = Math.round((result.totalRead / result.totalDelivered) * 100);
    } else {
      result.averageReadRate = 0;
    }

    logger.info(`Admin retrieved notification statistics for period: ${period}`, {
      totalNotifications: result.totalNotifications,
      totalRecipients: result.totalRecipients
    });

    res.json({
      success: true,
      data: {
        ...result,
        dailyTrends,
        period
      }
    });
  } catch (error) {
    logger.error('Error retrieving notification statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notification statistics',
      error: error.message
    });
  }
});

module.exports = {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  sendNotification,
  deleteNotification,
  getNotificationStats
};
