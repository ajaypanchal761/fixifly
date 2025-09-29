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
          securityDeposit: vendorWallet?.securityDeposit || 3999,
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

    // Build transaction query
    const transactionQuery = { vendorId: vendor.vendorId };
    
    if (type && type !== 'all') {
      transactionQuery.type = type;
    }
    
    if (status && status !== 'all') {
      transactionQuery.status = status;
    }
    
    if (startDate || endDate) {
      transactionQuery.createdAt = {};
      if (startDate) {
        transactionQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        transactionQuery.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get transactions with pagination
    const transactions = await WalletTransaction.find(transactionQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTransactions = await WalletTransaction.countDocuments(transactionQuery);

    // Get wallet summary
    const summary = await WalletTransaction.getVendorSummary(vendor.vendorId);

    // Get transaction statistics
    const transactionStats = await WalletTransaction.aggregate([
      { $match: { vendorId: vendor.vendorId } },
      {
        $group: {
          _id: {
            type: '$type',
            status: '$status'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

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
          totalPages: Math.ceil(totalTransactions / parseInt(limit)),
          totalTransactions: totalTransactions,
          hasNextPage: skip + transactions.length < totalTransactions,
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
    if (!currentBalance || isNaN(parseFloat(currentBalance))) {
      return res.status(400).json({
        success: false,
        message: 'Valid current balance is required'
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

    const newBalance = parseFloat(currentBalance);
    const oldBalance = vendorWallet.currentBalance;
    const adjustmentAmount = newBalance - oldBalance;

    // Update the wallet balance
    vendorWallet.currentBalance = newBalance;
    await vendorWallet.save();

    // Add a transaction record for the adjustment
    if (adjustmentAmount !== 0) {
      await vendorWallet.addManualAdjustment({
        amount: Math.abs(adjustmentAmount),
        type: adjustmentAmount > 0 ? 'credit' : 'debit',
        description: description || `Admin balance adjustment: ${adjustmentAmount > 0 ? '+' : ''}₹${adjustmentAmount}`,
        processedBy: req.admin?.id || 'admin',
        metadata: {
          oldBalance,
          newBalance,
          adjustmentAmount,
          adjustmentType: adjustmentType || 'manual'
        }
      });
    }

    // Get updated wallet data
    const updatedWallet = await VendorWallet.findOne({ vendorId });

    logger.info(`Admin adjusted vendor wallet balance`, {
      vendorId,
      oldBalance,
      newBalance,
      adjustmentAmount,
      adminId: req.admin?.id
    });

    res.json({
      success: true,
      message: 'Wallet balance adjusted successfully',
      data: {
        vendorId,
        oldBalance,
        newBalance,
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
