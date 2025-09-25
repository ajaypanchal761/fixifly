const express = require('express');
const {
  getAllVendorWallets,
  getVendorWalletDetails,
  addManualTransaction,
  getWalletStatistics
} = require('../controllers/adminWalletController');
const { protectAdmin, requirePermission } = require('../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/admin/wallets
// @desc    Get all vendor wallets with summary
// @access  Private (Admin with vendorManagement permission)
router.get('/', protectAdmin, requirePermission('vendorManagement'), getAllVendorWallets);

// @route   GET /api/admin/wallets/statistics
// @desc    Get wallet transaction statistics
// @access  Private (Admin with vendorManagement permission)
router.get('/statistics', protectAdmin, requirePermission('vendorManagement'), getWalletStatistics);

// @route   GET /api/admin/wallets/:vendorId
// @desc    Get specific vendor wallet details
// @access  Private (Admin with vendorManagement permission)
router.get('/:vendorId', protectAdmin, requirePermission('vendorManagement'), getVendorWalletDetails);

// @route   POST /api/admin/wallets/:vendorId/transactions
// @desc    Add manual transaction to vendor wallet
// @access  Private (Admin with vendorManagement permission)
router.post('/:vendorId/transactions', protectAdmin, requirePermission('vendorManagement'), addManualTransaction);

module.exports = router;
