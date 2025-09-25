const VendorWallet = require('../models/VendorWallet');
const Vendor = require('../models/Vendor');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

// @desc    Get vendor wallet details
// @route   GET /api/vendor/wallet
// @access  Private (Vendor)
const getVendorWallet = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.vendor;

    let wallet = await VendorWallet.findOne({ vendorId });
    
    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = new VendorWallet({
        vendorId,
        currentBalance: 0,
        securityDeposit: 4000,
        availableBalance: 0
      });
      await wallet.save();
    }

    const summary = await VendorWallet.getVendorSummary(vendorId);
    const recentTransactions = await VendorWallet.getRecentTransactions(vendorId, 10);

    res.json({
      success: true,
      data: {
        wallet: {
          currentBalance: wallet.currentBalance,
          securityDeposit: wallet.securityDeposit,
          availableBalance: wallet.availableForWithdrawal,
          totalEarnings: wallet.totalEarnings,
          totalPenalties: wallet.totalPenalties,
          totalWithdrawals: wallet.totalWithdrawals,
          totalDeposits: wallet.totalDeposits,
          totalTaskAcceptanceFees: wallet.totalTaskAcceptanceFees,
          totalCashCollections: wallet.totalCashCollections,
          totalRefunds: wallet.totalRefunds,
          totalTasksCompleted: wallet.totalTasksCompleted,
          totalTasksRejected: wallet.totalTasksRejected,
          totalTasksCancelled: wallet.totalTasksCancelled,
          lastTransactionAt: wallet.lastTransactionAt,
          isActive: wallet.isActive
        },
        summary,
        recentTransactions
      }
    });

  } catch (error) {
    logger.error('Error fetching vendor wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet details',
      error: error.message
    });
  }
});

// @desc    Get vendor wallet transactions
// @route   GET /api/vendor/wallet/transactions
// @access  Private (Vendor)
const getVendorTransactions = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.vendor;
    const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;

    const wallet = await VendorWallet.findOne({ vendorId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Build filter for transactions
    let transactions = wallet.transactions;

    if (type && type !== 'all') {
      transactions = transactions.filter(t => t.type === type);
    }

    if (status && status !== 'all') {
      transactions = transactions.filter(t => t.status === status);
    }

    if (startDate || endDate) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        if (startDate && transactionDate < new Date(startDate)) return false;
        if (endDate && transactionDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(transactions.length / parseInt(limit)),
          totalTransactions: transactions.length,
          hasNextPage: skip + paginatedTransactions.length < transactions.length,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching vendor transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// @desc    Add earning to vendor wallet
// @route   POST /api/vendor/wallet/earning
// @access  Private (Vendor)
const addEarning = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.vendor;
    const {
      caseId,
      billingAmount,
      spareAmount = 0,
      travellingAmount = 0,
      paymentMethod,
      gstIncluded = false,
      description
    } = req.body;

    // Validate required fields
    if (!caseId || !billingAmount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Case ID, billing amount, and payment method are required'
      });
    }

    if (!['online', 'cash'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Payment method must be either online or cash'
      });
    }

    let wallet = await VendorWallet.findOne({ vendorId });
    if (!wallet) {
      wallet = new VendorWallet({ vendorId });
    }

    const transaction = await wallet.addEarning({
      caseId,
      billingAmount,
      spareAmount,
      travellingAmount,
      paymentMethod,
      gstIncluded,
      description
    });

    logger.info('Earning added to vendor wallet', {
      vendorId,
      caseId,
      amount: transaction.amount,
      paymentMethod
    });

    res.status(201).json({
      success: true,
      message: 'Earning added successfully',
      data: {
        transaction,
        newBalance: wallet.currentBalance,
        availableBalance: wallet.availableForWithdrawal
      }
    });

  } catch (error) {
    logger.error('Error adding earning:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add earning',
      error: error.message
    });
  }
});

// @desc    Add penalty to vendor wallet
// @route   POST /api/vendor/wallet/penalty
// @access  Private (Vendor)
const addPenalty = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.vendor;
    const {
      caseId,
      type,
      amount,
      description
    } = req.body;

    // Validate required fields
    if (!caseId || !type || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Case ID, penalty type, and amount are required'
      });
    }

    if (!['rejection', 'cancellation'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Penalty type must be either rejection or cancellation'
      });
    }

    let wallet = await VendorWallet.findOne({ vendorId });
    if (!wallet) {
      wallet = new VendorWallet({ vendorId });
    }

    const transaction = await wallet.addPenalty({
      caseId,
      type,
      amount,
      description
    });

    logger.info('Penalty added to vendor wallet', {
      vendorId,
      caseId,
      type,
      amount
    });

    res.status(201).json({
      success: true,
      message: 'Penalty added successfully',
      data: {
        transaction,
        newBalance: wallet.currentBalance,
        availableBalance: wallet.availableForWithdrawal
      }
    });

  } catch (error) {
    logger.error('Error adding penalty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add penalty',
      error: error.message
    });
  }
});

// @desc    Add task acceptance fee
// @route   POST /api/vendor/wallet/task-fee
// @access  Private (Vendor)
const addTaskAcceptanceFee = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.vendor;
    const {
      caseId,
      taskMRP,
      description
    } = req.body;

    // Validate required fields
    if (!caseId || !taskMRP) {
      return res.status(400).json({
        success: false,
        message: 'Case ID and task MRP are required'
      });
    }

    let wallet = await VendorWallet.findOne({ vendorId });
    if (!wallet) {
      wallet = new VendorWallet({ vendorId });
    }

    // Check if vendor has sufficient balance
    if (wallet.currentBalance < taskMRP) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to pay task acceptance fee'
      });
    }

    const transaction = await wallet.addTaskAcceptanceFee({
      caseId,
      taskMRP,
      description
    });

    logger.info('Task acceptance fee added to vendor wallet', {
      vendorId,
      caseId,
      taskMRP
    });

    res.status(201).json({
      success: true,
      message: 'Task acceptance fee added successfully',
      data: {
        transaction,
        newBalance: wallet.currentBalance,
        availableBalance: wallet.availableForWithdrawal
      }
    });

  } catch (error) {
    logger.error('Error adding task acceptance fee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add task acceptance fee',
      error: error.message
    });
  }
});

// @desc    Add cash collection deduction
// @route   POST /api/vendor/wallet/cash-collection
// @access  Private (Vendor)
const addCashCollectionDeduction = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.vendor;
    const {
      caseId,
      billingAmount,
      spareAmount = 0,
      travellingAmount = 0,
      gstIncluded = false,
      description,
      cashPhoto
    } = req.body;

    // Validate required fields
    if (!caseId || !billingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Case ID and billing amount are required'
      });
    }

    let wallet = await VendorWallet.findOne({ vendorId });
    if (!wallet) {
      wallet = new VendorWallet({ vendorId });
    }

    const transaction = await wallet.addCashCollectionDeduction({
      caseId,
      billingAmount,
      spareAmount,
      travellingAmount,
      gstIncluded,
      description
    });

    // Add cash photo if provided
    if (cashPhoto) {
      transaction.metadata.cashPhoto = cashPhoto;
      await wallet.save();
    }

    logger.info('Cash collection deduction added to vendor wallet', {
      vendorId,
      caseId,
      amount: transaction.amount
    });

    res.status(201).json({
      success: true,
      message: 'Cash collection deduction added successfully',
      data: {
        transaction,
        newBalance: wallet.currentBalance,
        availableBalance: wallet.availableForWithdrawal
      }
    });

  } catch (error) {
    logger.error('Error adding cash collection deduction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add cash collection deduction',
      error: error.message
    });
  }
});

// @desc    Add deposit to vendor wallet
// @route   POST /api/vendor/wallet/deposit
// @access  Private (Vendor)
const addDeposit = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.vendor;
    const {
      amount,
      description
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid deposit amount is required'
      });
    }

    let wallet = await VendorWallet.findOne({ vendorId });
    if (!wallet) {
      wallet = new VendorWallet({ vendorId });
    }

    const transaction = await wallet.addDeposit({
      amount,
      description
    });

    logger.info('Deposit added to vendor wallet', {
      vendorId,
      amount
    });

    res.status(201).json({
      success: true,
      message: 'Deposit added successfully',
      data: {
        transaction,
        newBalance: wallet.currentBalance,
        availableBalance: wallet.availableForWithdrawal
      }
    });

  } catch (error) {
    logger.error('Error adding deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add deposit',
      error: error.message
    });
  }
});

// @desc    Request withdrawal from vendor wallet
// @route   POST /api/vendor/wallet/withdrawal
// @access  Private (Vendor)
const requestWithdrawal = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.vendor;
    const {
      amount,
      description
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid withdrawal amount is required'
      });
    }

    let wallet = await VendorWallet.findOne({ vendorId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const transaction = await wallet.addWithdrawal({
      amount,
      description
    });

    logger.info('Withdrawal requested from vendor wallet', {
      vendorId,
      amount
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        transaction,
        newBalance: wallet.currentBalance,
        availableBalance: wallet.availableForWithdrawal
      }
    });

  } catch (error) {
    logger.error('Error requesting withdrawal:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to request withdrawal',
      error: error.message
    });
  }
});

// @desc    Get vendor wallet statistics
// @route   GET /api/vendor/wallet/statistics
// @access  Private (Vendor)
const getWalletStatistics = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.vendor;
    const { period = 'monthly' } = req.query;

    const wallet = await VendorWallet.findOne({ vendorId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    let statistics = {
      currentBalance: wallet.currentBalance,
      availableBalance: wallet.availableForWithdrawal,
      totalEarnings: wallet.totalEarnings,
      totalPenalties: wallet.totalPenalties,
      totalWithdrawals: wallet.totalWithdrawals,
      totalDeposits: wallet.totalDeposits,
      totalTaskAcceptanceFees: wallet.totalTaskAcceptanceFees,
      totalCashCollections: wallet.totalCashCollections,
      totalRefunds: wallet.totalRefunds,
      totalTasksCompleted: wallet.totalTasksCompleted,
      totalTasksRejected: wallet.totalTasksRejected,
      totalTasksCancelled: wallet.totalTasksCancelled,
      totalRejectionPenalties: wallet.totalRejectionPenalties,
      totalCancellationPenalties: wallet.totalCancellationPenalties
    };

    // Add monthly earnings if requested
    if (period === 'monthly') {
      statistics.monthlyEarnings = wallet.monthlyEarnings;
    }

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Error fetching wallet statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet statistics',
      error: error.message
    });
  }
});

module.exports = {
  getVendorWallet,
  getVendorTransactions,
  addEarning,
  addPenalty,
  addTaskAcceptanceFee,
  addCashCollectionDeduction,
  addDeposit,
  requestWithdrawal,
  getWalletStatistics
};


