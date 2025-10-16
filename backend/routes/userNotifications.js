const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateFcmToken,
  getNotificationStats
} = require('../controllers/userNotificationController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/user/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', getUserNotifications);

// @route   GET /api/user/notifications/stats
// @desc    Get notification statistics
// @access  Private
router.get('/stats', getNotificationStats);

// @route   GET /api/user/notifications/:id
// @desc    Get single notification
// @access  Private
router.get('/:id', getNotificationById);

// @route   PUT /api/user/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', markAsRead);

// @route   PUT /api/user/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', markAllAsRead);

// @route   DELETE /api/user/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', deleteNotification);

// @route   POST /api/user/notifications/fcm-token
// @desc    Update user FCM token
// @access  Private
router.post('/fcm-token', updateFcmToken);

module.exports = router;
