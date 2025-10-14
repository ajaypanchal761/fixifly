const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const Vendor = require('../models/Vendor');
const firebasePushService = require('../services/firebasePushService');

// @desc    Test push notification for a specific vendor
// @route   POST /api/test/push-notification
// @access  Private (Admin)
const testPushNotification = asyncHandler(async (req, res) => {
  const { vendorId, message } = req.body;

  if (!vendorId) {
    return res.status(400).json({
      success: false,
      message: 'Vendor ID is required'
    });
  }

  // Safety check: Prevent test notifications in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Test notifications are not allowed in production environment',
      error: 'PRODUCTION_TEST_BLOCKED'
    });
  }

  try {
    // Find vendor by ID or vendorId
    let vendor;
    if (vendorId.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId
      vendor = await Vendor.findById(vendorId).select('fcmToken notificationSettings firstName lastName email');
    } else {
      // String vendorId
      vendor = await Vendor.findOne({ vendorId }).select('fcmToken notificationSettings firstName lastName email');
    }

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    logger.info('Testing push notification for vendor', {
      vendorId,
      vendorName: `${vendor.firstName} ${vendor.lastName}`,
      hasFcmToken: !!vendor.fcmToken,
      fcmTokenLength: vendor.fcmToken?.length || 0,
      pushEnabled: vendor.notificationSettings?.pushNotifications
    });

    if (!vendor.fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'Vendor does not have an FCM token. Please enable notifications in the frontend first.',
        data: {
          vendorName: `${vendor.firstName} ${vendor.lastName}`,
          hasFcmToken: false
        }
      });
    }

    const notification = {
      title: '🧪 Test Push Notification',
      body: message || 'This is a test notification from Fixfly backend'
    };

    const data = {
      type: 'test',
      action: 'test_notification',
      timestamp: new Date().toISOString()
    };

    const result = await firebasePushService.sendPushNotification(
      vendor.fcmToken,
      notification,
      data
    );

    if (result) {
      logger.info('Test push notification sent successfully', {
        vendorId,
        vendorName: `${vendor.firstName} ${vendor.lastName}`
      });

      res.json({
        success: true,
        message: 'Test push notification sent successfully',
        data: {
          vendorName: `${vendor.firstName} ${vendor.lastName}`,
          vendorEmail: vendor.email,
          fcmTokenPresent: true,
          notificationSent: true
        }
      });
    } else {
      logger.error('Test push notification failed', {
        vendorId,
        vendorName: `${vendor.firstName} ${vendor.lastName}`
      });

      res.status(500).json({
        success: false,
        message: 'Failed to send push notification',
        data: {
          vendorName: `${vendor.firstName} ${vendor.lastName}`,
          fcmTokenPresent: true,
          notificationSent: false
        }
      });
    }

  } catch (error) {
    logger.error('Error testing push notification:', {
      error: error.message,
      stack: error.stack,
      vendorId
    });

    res.status(500).json({
      success: false,
      message: 'Error testing push notification',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// @desc    Get all vendors with FCM token status
// @route   GET /api/test/vendors-fcm-status
// @access  Private (Admin)
const getVendorsFCMStatus = asyncHandler(async (req, res) => {
  try {
    const vendors = await Vendor.find({})
      .select('vendorId firstName lastName email fcmToken notificationSettings')
      .sort({ createdAt: -1 });

    const vendorsWithStatus = vendors.map(vendor => ({
      id: vendor._id,
      vendorId: vendor.vendorId,
      name: `${vendor.firstName} ${vendor.lastName}`,
      email: vendor.email,
      hasFcmToken: !!vendor.fcmToken,
      fcmTokenLength: vendor.fcmToken?.length || 0,
      pushNotificationsEnabled: vendor.notificationSettings?.pushNotifications || false,
      fcmTokenPreview: vendor.fcmToken ? vendor.fcmToken.substring(0, 20) + '...' : null
    }));

    const stats = {
      totalVendors: vendors.length,
      vendorsWithFcmToken: vendors.filter(v => v.fcmToken).length,
      vendorsWithPushEnabled: vendors.filter(v => v.notificationSettings?.pushNotifications).length,
      readyForNotifications: vendors.filter(v => v.fcmToken && v.notificationSettings?.pushNotifications).length
    };

    res.json({
      success: true,
      data: {
        vendors: vendorsWithStatus,
        stats
      }
    });

  } catch (error) {
    logger.error('Error getting vendors FCM status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting vendors FCM status',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

module.exports = {
  testPushNotification,
  getVendorsFCMStatus
};
