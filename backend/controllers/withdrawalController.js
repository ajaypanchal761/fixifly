const WithdrawalRequest = require('../models/WithdrawalRequest');
const Vendor = require('../models/Vendor');
const VendorWallet = require('../models/VendorWallet');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const emailService = require('../services/emailService');

// @desc    Create withdrawal request
// @route   POST /api/vendors/withdrawal
// @access  Private (Vendor)
const createWithdrawalRequest = asyncHandler(async (req, res) => {
  try {
    const { amount } = req.body;
    const vendorId = req.vendor._id;

    // Validate amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid withdrawal amount is required'
      });
    }

    const withdrawalAmount = parseFloat(amount);

    // Get vendor details
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get vendor wallet
    const vendorWallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });
    if (!vendorWallet) {
      return res.status(404).json({
        success: false,
        message: 'Vendor wallet not found'
      });
    }

    // Check if withdrawal amount exceeds available balance
    if (withdrawalAmount > vendorWallet.currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available balance: ₹${vendorWallet.currentBalance.toLocaleString()}`
      });
    }

    // Check if vendor has any pending withdrawal requests
    const pendingRequest = await WithdrawalRequest.findOne({
      vendorId: vendor.vendorId,
      status: 'pending'
    });

    if (pendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending withdrawal request. Please wait for it to be processed.'
      });
    }

    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      vendor: vendorId,
      vendorId: vendor.vendorId,
      vendorName: `${vendor.firstName} ${vendor.lastName}`,
      vendorEmail: vendor.email,
      vendorPhone: vendor.phone,
      amount: withdrawalAmount
    });

    await withdrawalRequest.save();

    // Log the withdrawal request
    logger.info('Withdrawal request created', {
      vendorId: vendor.vendorId,
      vendorName: withdrawalRequest.vendorName,
      amount: withdrawalAmount,
      requestId: withdrawalRequest._id
    });

    // Send email notification to admin (optional)
    try {
      await emailService.sendWithdrawalRequestNotification({
        vendorName: withdrawalRequest.vendorName,
        vendorEmail: withdrawalRequest.vendorEmail,
        amount: withdrawalAmount,
        requestId: withdrawalRequest._id
      });
    } catch (emailError) {
      logger.error('Failed to send withdrawal request email notification', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully. It will be processed within 24-48 hours.',
      data: {
        requestId: withdrawalRequest._id,
        amount: withdrawalAmount,
        status: 'pending',
        submittedAt: withdrawalRequest.createdAt
      }
    });

  } catch (error) {
    logger.error('Error creating withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create withdrawal request. Please try again.'
    });
  }
});

// @desc    Get vendor's withdrawal requests
// @route   GET /api/vendors/withdrawal
// @access  Private (Vendor)
const getVendorWithdrawalRequests = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const requests = await WithdrawalRequest.find({ vendorId: vendor.vendorId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    logger.error('Error fetching withdrawal requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal requests'
    });
  }
});

// @desc    Get all withdrawal requests (Admin)
// @route   GET /api/admin/withdrawals
// @access  Private (Admin)
const getAllWithdrawalRequests = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { vendorId: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
        { vendorEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await WithdrawalRequest.find(query)
      .populate('vendor', 'vendorId firstName lastName email phone')
      .populate('processedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalRequests = await WithdrawalRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRequests / parseInt(limit)),
          totalRequests,
          hasNext: skip + parseInt(limit) < totalRequests,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching withdrawal requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal requests'
    });
  }
});

// @desc    Approve withdrawal request
// @route   PUT /api/admin/withdrawals/:requestId/approve
// @access  Private (Admin)
const approveWithdrawalRequest = asyncHandler(async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.admin._id;

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request has already been processed'
      });
    }

    // Get vendor wallet
    const vendorWallet = await VendorWallet.findOne({ 
      vendorId: withdrawalRequest.vendorId 
    });

    if (!vendorWallet) {
      return res.status(404).json({
        success: false,
        message: 'Vendor wallet not found'
      });
    }

    // Check if vendor still has sufficient balance
    if (withdrawalRequest.amount > vendorWallet.currentBalance) {
      return res.status(400).json({
        success: false,
        message: 'Vendor has insufficient balance for this withdrawal'
      });
    }

    // Approve the request
    await withdrawalRequest.approve(adminId, adminNotes);

    // Process the withdrawal (deduct from wallet)
    vendorWallet.currentBalance -= withdrawalRequest.amount;
    vendorWallet.totalWithdrawals += withdrawalRequest.amount;
    await vendorWallet.save();

    // Add transaction record
    await vendorWallet.addManualAdjustment({
      amount: withdrawalRequest.amount,
      type: 'withdrawal',
      description: `Withdrawal approved - Request ID: ${requestId}`,
      processedBy: adminId.toString(),
      metadata: {
        withdrawalRequestId: requestId,
        processedBy: adminId,
        adminNotes
      }
    });

    // Send email notification to vendor
    try {
      await emailService.sendWithdrawalApprovalNotification({
        vendorName: withdrawalRequest.vendorName,
        vendorEmail: withdrawalRequest.vendorEmail,
        amount: withdrawalRequest.amount,
        requestId: requestId
      });
    } catch (emailError) {
      logger.error('Failed to send withdrawal approval email', emailError);
    }

    logger.info('Withdrawal request approved', {
      requestId,
      vendorId: withdrawalRequest.vendorId,
      amount: withdrawalRequest.amount,
      adminId
    });

    res.json({
      success: true,
      message: 'Withdrawal request approved successfully',
      data: withdrawalRequest
    });

  } catch (error) {
    logger.error('Error approving withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve withdrawal request'
    });
  }
});

// @desc    Decline withdrawal request
// @route   PUT /api/admin/withdrawals/:requestId/decline
// @access  Private (Admin)
const declineWithdrawalRequest = asyncHandler(async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.admin._id;

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request has already been processed'
      });
    }

    // Decline the request
    await withdrawalRequest.decline(adminId, adminNotes);

    // Send email notification to vendor
    try {
      await emailService.sendWithdrawalDeclineNotification({
        vendorName: withdrawalRequest.vendorName,
        vendorEmail: withdrawalRequest.vendorEmail,
        amount: withdrawalRequest.amount,
        requestId: requestId,
        reason: adminNotes
      });
    } catch (emailError) {
      logger.error('Failed to send withdrawal decline email', emailError);
    }

    logger.info('Withdrawal request declined', {
      requestId,
      vendorId: withdrawalRequest.vendorId,
      amount: withdrawalRequest.amount,
      adminId,
      reason: adminNotes
    });

    res.json({
      success: true,
      message: 'Withdrawal request declined',
      data: withdrawalRequest
    });

  } catch (error) {
    logger.error('Error declining withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline withdrawal request'
    });
  }
});

module.exports = {
  createWithdrawalRequest,
  getVendorWithdrawalRequests,
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  declineWithdrawalRequest
};
