const UserNotification = require('../models/UserNotification');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

// @desc    Get user notifications
// @route   GET /api/user/notifications
// @access  Private (User)
const getUserNotifications = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      priority, 
      isRead,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object
    const filter = {
      user: req.user.userId,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };
    
    if (type) {
      filter.type = type;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const notifications = await UserNotification.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalNotifications = await UserNotification.countDocuments(filter);
    const totalPages = Math.ceil(totalNotifications / parseInt(limit));

    // Get unread count
    const unreadCount = await UserNotification.getUnreadCount(req.user.userId);

    logger.info(`User retrieved notifications: ${notifications.length}`, {
      userId: req.user.userId,
      totalNotifications,
      unreadCount,
      page: parseInt(page),
      filters: { type, priority, isRead }
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
        unreadCount
      }
    });
  } catch (error) {
    logger.error('Error retrieving user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notifications',
      error: error.message
    });
  }
});

// @desc    Get single notification
// @route   GET /api/user/notifications/:id
// @access  Private (User)
const getNotificationById = asyncHandler(async (req, res) => {
  try {
    const notification = await UserNotification.findOne({
      _id: req.params.id,
      user: req.user.userId
    }).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    logger.info(`User retrieved notification: ${notification._id}`, {
      notificationId: notification._id,
      userId: req.user._id
    });

    res.json({
      success: true,
      data: {
        notification
      }
    });
  } catch (error) {
    logger.error('Error retrieving user notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notification',
      error: error.message
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/user/notifications/:id/read
// @access  Private (User)
const markAsRead = asyncHandler(async (req, res) => {
  try {
    const notification = await UserNotification.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    logger.info(`User marked notification as read: ${notification._id}`, {
      notificationId: notification._id,
      userId: req.user._id
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification
      }
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/user/notifications/read-all
// @access  Private (User)
const markAllAsRead = asyncHandler(async (req, res) => {
  try {
    const result = await UserNotification.markAllAsRead(req.user.userId);

    logger.info(`User marked all notifications as read`, {
      userId: req.user.userId,
      modifiedCount: result.modifiedCount
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/user/notifications/:id
// @access  Private (User)
const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const notification = await UserNotification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    logger.info(`User deleted notification: ${notification._id}`, {
      notificationId: notification._id,
      userId: req.user._id
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

// @desc    Update user FCM token
// @route   PUT /api/user/fcm-token
// @access  Private (User)
const updateFcmToken = asyncHandler(async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { fcmToken },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User updated FCM token`, {
      userId: req.user.userId,
      fcmTokenLength: fcmToken.length
    });

    res.json({
      success: true,
      message: 'FCM token updated successfully',
      data: {
        fcmTokenUpdated: true
      }
    });
  } catch (error) {
    logger.error('Error updating FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating FCM token',
      error: error.message
    });
  }
});

// @desc    Get notification statistics
// @route   GET /api/user/notifications/stats
// @access  Private (User)
const getNotificationStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const stats = await UserNotification.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          unreadNotifications: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          },
          readNotifications: {
            $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] }
          },
          highPriorityNotifications: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          mediumPriorityNotifications: {
            $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] }
          },
          lowPriorityNotifications: {
            $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalNotifications: 0,
      unreadNotifications: 0,
      readNotifications: 0,
      highPriorityNotifications: 0,
      mediumPriorityNotifications: 0,
      lowPriorityNotifications: 0
    };

    logger.info(`User retrieved notification statistics`, {
      userId,
      totalNotifications: result.totalNotifications,
      unreadNotifications: result.unreadNotifications
    });

    res.json({
      success: true,
      data: result
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
  getUserNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateFcmToken,
  getNotificationStats
};
