const express = require('express');
const router = express.Router();
const {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  sendNotification,
  deleteNotification,
  getNotificationStats
} = require('../controllers/adminNotificationController');
const { protectAdmin } = require('../middleware/adminAuth');

// All routes are protected with admin authentication
router.use(protectAdmin);

// @route   GET /api/admin/notifications
// @desc    Get all notifications for admin
// @access  Admin
router.get('/', getAllNotifications);

// @route   GET /api/admin/notifications/stats
// @desc    Get notification statistics
// @access  Admin
router.get('/stats', getNotificationStats);

// @route   GET /api/admin/notifications/:id
// @desc    Get single notification for admin
// @access  Admin
router.get('/:id', getNotificationById);

// @route   POST /api/admin/notifications
// @desc    Create new notification
// @access  Admin
router.post('/', createNotification);

// @route   PUT /api/admin/notifications/:id
// @desc    Update notification
// @access  Admin
router.put('/:id', updateNotification);

// @route   POST /api/admin/notifications/:id/send
// @desc    Send notification
// @access  Admin
router.post('/:id/send', sendNotification);

// @route   DELETE /api/admin/notifications/:id
// @desc    Delete notification
// @access  Admin
router.delete('/:id', deleteNotification);

module.exports = router;
