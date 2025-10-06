const express = require('express');
const router = express.Router();
const {
  sendNotification,
  getNotifications,
  getNotificationStats,
  deleteNotification
} = require('../controllers/adminNotificationController');
const { protectAdmin } = require('../middleware/adminAuth');

// All routes are protected and require admin authentication
router.use(protectAdmin);

// @route   POST /api/admin/notifications/send
// @desc    Send push notification to users
// @access  Private (Admin)
router.post('/send', sendNotification);

// @route   GET /api/admin/notifications
// @desc    Get all admin notifications
// @access  Private (Admin)
router.get('/', getNotifications);

// @route   GET /api/admin/notifications/stats
// @desc    Get notification statistics
// @access  Private (Admin)
router.get('/stats', getNotificationStats);

// @route   DELETE /api/admin/notifications/:id
// @desc    Delete notification
// @access  Private (Admin)
router.delete('/:id', deleteNotification);

module.exports = router;