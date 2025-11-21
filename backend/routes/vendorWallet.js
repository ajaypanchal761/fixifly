const express = require('express');
const {
  getVendorWallet,
  getVendorTransactions,
  addEarning,
  addPenalty,
  addTaskAcceptanceFee,
  addCashCollectionDeduction,
  addDeposit,
  requestWithdrawal,
  getWalletStatistics
} = require('../controllers/vendorWalletController');
const { protectVendor } = require('../middleware/vendorAuth');
const {
  validateCashPayment,
  validatePhotoUpload,
  checkTaskAcceptanceBalance,
  validateGSTCalculation,
  logWalletTransaction
} = require('../middleware/cashPaymentVerification');

const router = express.Router();

// @route   GET /api/vendor/wallet
// @desc    Get vendor wallet details
// @access  Private (Vendor)
router.get('/', protectVendor, getVendorWallet);

// @route   GET /api/vendor/wallet/transactions
// @desc    Get vendor wallet transactions
// @access  Private (Vendor)
router.get('/transactions', protectVendor, getVendorTransactions);

// @route   GET /api/vendor/wallet/statistics
// @desc    Get vendor wallet statistics
// @access  Private (Vendor)
router.get('/statistics', protectVendor, getWalletStatistics);

// @route   POST /api/vendor/wallet/earning
// @desc    Add earning to vendor wallet
// @access  Private (Vendor)
router.post('/earning', protectVendor, validateCashPayment, validateGSTCalculation, logWalletTransaction, addEarning);

// @route   POST /api/vendor/wallet/penalty
// @desc    Add penalty to vendor wallet
// @access  Private (Vendor)
router.post('/penalty', protectVendor, addPenalty);

// @route   POST /api/vendor/wallet/task-fee
// @desc    Add task acceptance fee
// @access  Private (Vendor)
router.post('/task-fee', protectVendor, checkTaskAcceptanceBalance, logWalletTransaction, addTaskAcceptanceFee);

// @route   POST /api/vendor/wallet/cash-collection
// @desc    Add cash collection deduction
// @access  Private (Vendor)
router.post('/cash-collection', protectVendor, validateCashPayment, validateGSTCalculation, logWalletTransaction, addCashCollectionDeduction);

// @route   POST /api/vendor/wallet/deposit
// @desc    Add deposit to vendor wallet
// @access  Private (Vendor)
router.post('/deposit', protectVendor, addDeposit);

// @route   POST /api/vendor/wallet/withdrawal
// @desc    Request withdrawal from vendor wallet
// @access  Private (Vendor)
router.post('/withdrawal', protectVendor, requestWithdrawal);

module.exports = router;
