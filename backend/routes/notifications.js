const express = require('express');
const router = express.Router();
const { sendNotification } = require('../controllers/userNotificationController');
const { protect } = require('../middleware/auth');

// @route   POST /api/send-notification
// @desc    Send notification to user
// @access  Private (Admin/System)
router.post('/send-notification', protect, sendNotification);

// @route   PUT /api/send-notification
// @desc    Send notification to user (alternative method)
// @access  Private (Admin/System)
router.put('/send-notification', protect, sendNotification);

module.exports = router;
