const express = require('express');
const {
  createWithdrawalRequest,
  getVendorWithdrawalRequests
} = require('../controllers/withdrawalController');
const { protectVendor } = require('../middleware/vendorAuth');

const router = express.Router();

// @route   POST /api/vendors/withdrawal
// @desc    Create withdrawal request
// @access  Private (Vendor)
router.post('/', protectVendor, createWithdrawalRequest);

// @route   GET /api/vendors/withdrawal
// @desc    Get vendor's withdrawal requests
// @access  Private (Vendor)
router.get('/', protectVendor, getVendorWithdrawalRequests);

module.exports = router;
