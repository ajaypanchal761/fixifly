const Vendor = require('../models/Vendor');
const VendorWallet = require('../models/VendorWallet');
const WalletTransaction = require('../models/WalletTransaction');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const emailService = require('../services/emailService');

// @desc    Get all vendor wallets with summary
// @route   GET /api/admin/wallets
// @access  Private (Admin)
const getAllVendorWallets = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'lastTransactionAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { vendorId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get vendors with wallet information
    const vendors = await Vendor.find(query)
      .select('vendorId firstName lastName email phone isActive isApproved')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get VendorWallet model
    const VendorWallet = require('../models/VendorWallet');

    // Get wallet summaries for each vendor
    const vendorsWithWallets = await Promise.all(
      vendors.map(async (vendor) => {
        // Get vendor wallet data
        const vendorWallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });

        // Calculate online and cash collections from transactions
        const onlineCollected = vendorWallet?.transactions
          ?.filter(t => t.paymentMethod === 'online' && t.type === 'earning')
          ?.reduce((sum, t) => sum + t.amount, 0) || 0;

        // Calculate cash collected from cash_collection transactions (sum of absolute amounts)
        const cashCollected = vendorWallet?.transactions
          ?.filter(t => t.type === 'cash_collection')
          ?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

        return {
          id: vendor._id,
          vendorId: vendor.vendorId,
          vendorName: `${vendor.firstName} ${vendor.lastName}`,
          vendorEmail: vendor.email,
          vendorPhone: vendor.phone,
          currentBalance: vendorWallet?.currentBalance || 0,
          totalEarnings: vendorWallet?.totalEarnings || 0,
          onlineCollected: onlineCollected,
          cashCollected: cashCollected,
          totalWithdrawals: vendorWallet?.totalWithdrawals || 0,
          totalDeposits: vendorWallet?.totalDeposits || 0,
          securityDeposit: vendorWallet?.securityDeposit || 0,
          availableBalance: vendorWallet?.availableBalance || 0,
          isActive: vendor.isActive,
          isApproved: vendor.isApproved,
          lastTransaction: vendorWallet?.lastTransactionAt || null,
          createdAt: vendor.createdAt,
          updatedAt: vendor.updatedAt
        };
      })
    );

    const totalVendors = await Vendor.countDocuments(query);

    res.json({
      success: true,
      data: {
        vendors: vendorsWithWallets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalVendors / parseInt(limit)),
          totalVendors: totalVendors,
          hasNextPage: skip + vendors.length < totalVendors,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching vendor wallets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor wallets',
      error: error.message
    });
  }
});

// @desc    Get specific vendor wallet details
// @route   GET /api/admin/wallets/:vendorId
// @access  Private (Admin)
const getVendorWalletDetails = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 50, type, status, startDate, endDate } = req.query;

    // Find vendor
    const vendor = await Vendor.findOne({ vendorId }).select('-password');
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Find vendor wallet
    const vendorWallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });

    // Get transactions from VendorWallet embedded array
    let transactions = [];
    let totalTransactionsCount = 0;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (vendorWallet && vendorWallet.transactions && Array.isArray(vendorWallet.transactions)) {
      transactions = [...vendorWallet.transactions];

      // Apply filters
      if (type && type !== 'all') {
        transactions = transactions.filter(t => t.type === type);
      }

      if (status && status !== 'all') {
        transactions = transactions.filter(t => t.status === status);
      }

      if (startDate || endDate) {
        transactions = transactions.filter(t => {
          const transactionDate = new Date(t.createdAt || t.timestamp || 0);
          if (startDate && transactionDate < new Date(startDate)) return false;
          if (endDate && transactionDate > new Date(endDate)) return false;
          return true;
        });
      }

      // Sort by date (newest first)
      transactions.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timestamp || 0);
        const dateB = new Date(b.createdAt || b.timestamp || 0);
        return dateB - dateA;
      });

      // Store total count before pagination
      totalTransactionsCount = transactions.length;

      // Pagination
      transactions = transactions.slice(skip, skip + parseInt(limit));

      // Format transactions
      transactions = transactions.map(txn => ({
        _id: txn._id || txn.transactionId,
        transactionId: txn.transactionId,
        vendorId: vendor.vendorId,
        amount: txn.amount || 0,
        type: txn.type || 'unknown',
        description: txn.description || '',
        status: txn.status || 'completed',
        createdAt: txn.createdAt || txn.timestamp || new Date(),
        caseId: txn.caseId,
        bookingId: txn.bookingId,
        metadata: txn.metadata || {}
      }));
    }

    // Get wallet summary from VendorWallet
    let summary = {};
    try {
      summary = await VendorWallet.getVendorSummary(vendor.vendorId);
    } catch (summaryError) {
      logger.error('Error fetching vendor summary:', summaryError);
      // Use default summary if there's an error
      if (vendorWallet) {
        summary = {
          currentBalance: vendorWallet.currentBalance || 0,
          availableBalance: vendorWallet.availableForWithdrawal || 0,
          totalEarnings: vendorWallet.totalEarnings || 0,
          totalPenalties: vendorWallet.totalPenalties || 0,
          totalWithdrawals: vendorWallet.totalWithdrawals || 0,
          totalDeposits: vendorWallet.totalDeposits || 0,
          totalTaskAcceptanceFees: vendorWallet.totalTaskAcceptanceFees || 0,
          totalCashCollections: vendorWallet.totalCashCollections || 0,
          totalRefunds: vendorWallet.totalRefunds || 0,
          totalTasksCompleted: vendorWallet.totalTasksCompleted || 0,
          totalTasksRejected: vendorWallet.totalTasksRejected || 0,
          totalTasksCancelled: vendorWallet.totalTasksCancelled || 0
        };
      }
    }

    // Get transaction statistics from VendorWallet transactions
    const transactionStats = [];
    if (vendorWallet && vendorWallet.transactions && Array.isArray(vendorWallet.transactions)) {
      const statsMap = {};
      vendorWallet.transactions.forEach(txn => {
        const key = `${txn.type || 'unknown'}_${txn.status || 'completed'}`;
        if (!statsMap[key]) {
          statsMap[key] = {
            _id: {
              type: txn.type || 'unknown',
              status: txn.status || 'completed'
            },
            count: 0,
            totalAmount: 0
          };
        }
        statsMap[key].count += 1;
        statsMap[key].totalAmount += Math.abs(txn.amount || 0);
      });
      transactionStats.push(...Object.values(statsMap));
    }

    res.json({
      success: true,
      data: {
        vendor: {
          id: vendor._id,
          vendorId: vendor.vendorId,
          name: `${vendor.firstName} ${vendor.lastName}`,
          email: vendor.email,
          phone: vendor.phone,
          isActive: vendor.isActive,
          isApproved: vendor.isApproved,
          wallet: vendor.wallet
        },
        summary: summary,
        transactions: transactions,
        transactionStats: transactionStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalTransactionsCount / parseInt(limit)),
          totalTransactions: totalTransactionsCount,
          hasNextPage: skip + transactions.length < totalTransactionsCount,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching vendor wallet details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor wallet details',
      error: error.message
    });
  }
});

// @desc    Add manual transaction to vendor wallet
// @route   POST /api/admin/wallets/:vendorId/transactions
// @access  Private (Admin)
const addManualTransaction = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { amount, type, description, adminNotes } = req.body;
    const adminId = req.admin._id;

    // Validate input
    if (!amount || !type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Amount, type, and description are required'
      });
    }

    if (!['deposit', 'withdrawal', 'earning', 'penalty', 'refund', 'bonus'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type'
      });
    }

    // Find vendor
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Generate transaction ID
    const transactionId = `ADMIN_${vendor.vendorId}_${Date.now()}`;

    // Create transaction based on type
    let result;
    switch (type) {
      case 'deposit':
        result = await vendor.addDeposit(amount, transactionId);
        break;
      case 'withdrawal':
        result = await vendor.addWithdrawal(amount, transactionId, description);
        break;
      case 'earning':
        result = await vendor.addEarning(amount, transactionId, description);
        break;
      case 'penalty':
        result = await vendor.addPenalty(amount, transactionId, description);
        break;
      default:
        // For refund and bonus, treat as deposit
        result = await vendor.addDeposit(amount, transactionId);
    }

    // Update the transaction with admin notes
    const transaction = await WalletTransaction.findOne({ transactionId });
    if (transaction) {
      transaction.metadata.adminNotes = adminNotes;
      transaction.processedBy = 'admin';
      await transaction.save();
    }

    logger.info('Manual transaction added by admin', {
      adminId,
      vendorId: vendor.vendorId,
      transactionId,
      amount,
      type,
      description
    });

    // Send email notification to vendor
    try {
      await emailService.sendWalletTransactionNotification(
        {
          name: vendor.fullName,
          email: vendor.email
        },
        {
          type: type,
          amount: amount,
          description: description,
          transactionId: transactionId,
          newBalance: vendor.wallet.currentBalance
        }
      );
      logger.info('Wallet transaction notification email sent successfully', {
        vendorId: vendor.vendorId,
        email: vendor.email,
        transactionId
      });
    } catch (emailError) {
      logger.error('Failed to send wallet transaction notification email:', emailError);
      // Don't fail the transaction if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      data: {
        transactionId: transactionId,
        newBalance: vendor.wallet.currentBalance,
        transaction: transaction
      }
    });

  } catch (error) {
    logger.error('Error adding manual transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add transaction',
      error: error.message
    });
  }
});

// @desc    Get wallet transaction statistics
// @route   GET /api/admin/wallets/statistics
// @access  Private (Admin)
const getWalletStatistics = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get overall statistics
    const overallStats = await WalletTransaction.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Get daily transaction volume
    const dailyVolume = await WalletTransaction.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 30 }
    ]);

    // Get vendor statistics
    const vendorStats = await WalletTransaction.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: '$vendorId',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    // Get total wallet balances
    const totalBalances = await Vendor.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$wallet.currentBalance' },
          totalDeposits: { $sum: '$wallet.initialDepositAmount' },
          vendorsWithDeposits: {
            $sum: { $cond: ['$wallet.hasInitialDeposit', 1, 0] }
          },
          totalVendors: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overallStats: overallStats,
        dailyVolume: dailyVolume,
        topVendors: vendorStats,
        totalBalances: totalBalances[0] || {
          totalBalance: 0,
          totalDeposits: 0,
          vendorsWithDeposits: 0,
          totalVendors: 0
        }
      }
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

// @desc    Adjust vendor wallet balance
// @route   PUT /api/admin/wallets/:vendorId/adjust
// @access  Private (Admin)
const adjustVendorWallet = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { currentBalance, description, adjustmentType } = req.body;

    // Validate input
    if (currentBalance === undefined || isNaN(parseFloat(currentBalance))) {
      return res.status(400).json({
        success: false,
        message: 'Valid balance is required'
      });
    }

    // Find the vendor wallet
    const vendorWallet = await VendorWallet.findOne({ vendorId });
    if (!vendorWallet) {
      return res.status(404).json({
        success: false,
        message: 'Vendor wallet not found'
      });
    }

    // Find the vendor to sync balance
    const vendor = await Vendor.findOne({ vendorId });

    // The admin provides the "Target Available Balance" (what they see in the table)
    const targetAvailableBalance = parseFloat(currentBalance);
    const securityDeposit = vendorWallet.securityDeposit || 0;

    // To make availableBalance = targetAvailableBalance,
    // we need currentBalance = targetAvailableBalance + securityDeposit
    const newTotalBalance = targetAvailableBalance + securityDeposit;
    const oldTotalBalance = vendorWallet.currentBalance;
    const adjustmentAmount = newTotalBalance - oldTotalBalance;

    // Update the wallet balance
    vendorWallet.currentBalance = newTotalBalance;
    // availableBalance is updated via pre-save middleware in VendorWallet.js
    await vendorWallet.save();

    // Sync with Vendor model if exists
    if (vendor && vendor.wallet) {
      vendor.wallet.currentBalance = newTotalBalance;
      vendor.wallet.lastTransactionAt = new Date();
      await vendor.save({ validateBeforeSave: false });
    }

    // Add a transaction record for the adjustment in VendorWallet
    if (adjustmentAmount !== 0) {
      await vendorWallet.addManualAdjustment({
        amount: Math.abs(adjustmentAmount),
        type: 'manual_adjustment',
        description: description || `Admin set available balance to ₹${targetAvailableBalance.toLocaleString()} (Adjustment: ${adjustmentAmount > 0 ? '+' : ''}₹${adjustmentAmount.toLocaleString()})`,
        processedBy: req.admin?.id || 'admin',
        metadata: {
          targetAvailableBalance,
          oldBalance: oldTotalBalance,
          newBalance: newTotalBalance,
          adjustmentAmount,
          adjustmentType: adjustmentType || 'manual',
          isCredit: adjustmentAmount > 0
        }
      });
    }

    // Get updated wallet data
    const updatedWallet = await VendorWallet.findOne({ vendorId });

    logger.info(`Admin adjusted vendor wallet balance`, {
      vendorId,
      oldBalance: oldTotalBalance,
      newBalance: newTotalBalance,
      adjustmentAmount,
      adminId: req.admin?.id
    });

    res.json({
      success: true,
      message: 'Wallet balance adjusted successfully',
      data: {
        vendorId,
        oldBalance: oldTotalBalance,
        newBalance: newTotalBalance,
        availableBalance: updatedWallet.availableBalance,
        adjustmentAmount,
        wallet: updatedWallet
      }
    });

  } catch (error) {
    logger.error('Error adjusting vendor wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust wallet balance',
      error: error.message
    });
  }
});

module.exports = {
  getAllVendorWallets,
  getVendorWalletDetails,
  addManualTransaction,
  getWalletStatistics,
  adjustVendorWallet
};
