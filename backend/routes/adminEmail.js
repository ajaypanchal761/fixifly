const express = require('express');
const {
  sendTestEmail,
  sendEmailToVendor,
  sendBulkEmail,
  getEmailStatus
} = require('../controllers/adminEmailController');
const { protectAdmin, requirePermission } = require('../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/admin/email/status
// @desc    Get email service status
// @access  Private (Admin)
router.get('/status', protectAdmin, getEmailStatus);

// @route   POST /api/admin/email/test
// @desc    Send test email
// @access  Private (Admin)
router.post('/test', protectAdmin, sendTestEmail);

// @route   POST /api/admin/email/vendor/:vendorId
// @desc    Send custom email to vendor
// @access  Private (Admin with vendorManagement permission)
router.post('/vendor/:vendorId', protectAdmin, requirePermission('vendorManagement'), sendEmailToVendor);

// @route   POST /api/admin/email/bulk
// @desc    Send bulk email to vendors
// @access  Private (Admin with vendorManagement permission)
router.post('/bulk', protectAdmin, requirePermission('vendorManagement'), sendBulkEmail);

module.exports = router;
