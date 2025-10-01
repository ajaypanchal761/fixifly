const express = require('express');
const router = express.Router();
const oneSignalService = require('../services/oneSignalService');
const { asyncHandler } = require('../middleware/asyncHandler');
const { adminAuth } = require('../middleware/adminAuth');
const { logger } = require('../utils/logger');

// @desc    Test OneSignal configuration
// @route   GET /api/admin/onesignal/test-config
// @access  Private (Admin)
router.get('/test-config', adminAuth, asyncHandler(async (req, res) => {
  try {
    const result = await oneSignalService.testConfiguration();
    
    res.json({
      success: result.success,
      message: result.message,
      data: result.data,
      error: result.error
    });
  } catch (error) {
    logger.error('Error testing OneSignal configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test OneSignal configuration',
      error: error.message
    });
  }
}));

// @desc    Send test notification to all users
// @route   POST /api/admin/onesignal/test-all
// @access  Private (Admin)
router.post('/test-all', adminAuth, asyncHandler(async (req, res) => {
  try {
    const { message, heading } = req.body;
    
    const result = await oneSignalService.sendNotificationToAll({
      heading: heading || '🧪 Test Notification',
      message: message || 'This is a test notification from Fixifly admin panel.',
      data: {
        type: 'admin_test',
        timestamp: new Date().toISOString(),
        sentBy: req.admin.name || 'Admin'
      }
    });
    
    res.json({
      success: result.success,
      message: result.message,
      data: result.data,
      error: result.error
    });
  } catch (error) {
    logger.error('Error sending test notification to all users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
}));

// @desc    Send test notification to specific vendor
// @route   POST /api/admin/onesignal/test-vendor
// @access  Private (Admin)
router.post('/test-vendor', adminAuth, asyncHandler(async (req, res) => {
  try {
    const { vendorId, type = 'booking', message } = req.body;
    
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }
    
    const result = await oneSignalService.sendVendorAssignmentNotification(vendorId, {
      type: type,
      id: 'test_' + Date.now(),
      title: 'Test Assignment',
      description: message || 'This is a test assignment notification from admin panel.',
      priority: 'medium',
      customerName: 'Test Customer',
      customerPhone: '+91-9876543210',
      scheduledDate: null,
      scheduledTime: null
    });
    
    res.json({
      success: result.success,
      message: result.message,
      data: result.data,
      error: result.error
    });
  } catch (error) {
    logger.error('Error sending test notification to vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification to vendor',
      error: error.message
    });
  }
}));

// @desc    Send test wallet notification to vendor
// @route   POST /api/admin/onesignal/test-wallet
// @access  Private (Admin)
router.post('/test-wallet', adminAuth, asyncHandler(async (req, res) => {
  try {
    const { vendorId, type = 'deposit', amount = 1000 } = req.body;
    
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }
    
    const result = await oneSignalService.sendVendorWalletNotification(vendorId, {
      type: type,
      amount: amount,
      description: 'Test wallet transaction from admin panel',
      transactionId: 'TEST_' + Date.now(),
      newBalance: 5000
    });
    
    res.json({
      success: result.success,
      message: result.message,
      data: result.data,
      error: result.error
    });
  } catch (error) {
    logger.error('Error sending test wallet notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test wallet notification',
      error: error.message
    });
  }
}));

// @desc    Send test status notification to vendor
// @route   POST /api/admin/onesignal/test-status
// @access  Private (Admin)
router.post('/test-status', adminAuth, asyncHandler(async (req, res) => {
  try {
    const { vendorId, status = 'approved', reason } = req.body;
    
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }
    
    const result = await oneSignalService.sendVendorStatusNotification(vendorId, {
      status: status,
      reason: reason || 'Test status notification from admin panel'
    });
    
    res.json({
      success: result.success,
      message: result.message,
      data: result.data,
      error: result.error
    });
  } catch (error) {
    logger.error('Error sending test status notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test status notification',
      error: error.message
    });
  }
}));

// @desc    Get OneSignal service status
// @route   GET /api/admin/onesignal/status
// @access  Private (Admin)
router.get('/status', adminAuth, asyncHandler(async (req, res) => {
  try {
    const isConfigured = oneSignalService.isServiceConfigured();
    
    res.json({
      success: true,
      data: {
        isConfigured,
        appId: process.env.ONESIGNAL_APP_ID || 'Not set',
        hasApiKey: !!process.env.ONESIGNAL_API_KEY,
        serviceStatus: isConfigured ? 'Ready' : 'Not Configured'
      }
    });
  } catch (error) {
    logger.error('Error getting OneSignal status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OneSignal status',
      error: error.message
    });
  }
}));

module.exports = router;
