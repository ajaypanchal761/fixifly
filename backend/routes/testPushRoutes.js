const express = require('express');
const { testPushNotification, getVendorsFCMStatus } = require('../controllers/testPushController');
const { protectAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// @route   POST /api/test/push-notification
// @desc    Test push notification for a specific vendor
// @access  Private (Admin)
router.post('/push-notification', protectAdmin, testPushNotification);

// @route   GET /api/test/vendors-fcm-status
// @desc    Get all vendors with FCM token status
// @access  Private (Admin)
router.get('/vendors-fcm-status', protectAdmin, getVendorsFCMStatus);

module.exports = router;
