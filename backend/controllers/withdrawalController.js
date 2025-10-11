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

    // Check if withdrawal amount exceeds available balance (current balance - security deposit)
    const availableBalance = Math.max(0, vendorWallet.currentBalance - vendorWallet.securityDeposit);
    
    // Check if available balance is at least ₹5000 for withdrawal
    if (availableBalance < 5000) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal is only available when your balance reaches ₹5,000 or above. Current available balance: ₹${availableBalance.toLocaleString()}`
      });
    }
    
    if (withdrawalAmount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available balance: ₹${availableBalance.toLocaleString()}`
      });
    }
    
    // Check if withdrawal amount is valid (should be the amount above ₹5000)
    if (withdrawalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid withdrawal amount.'
      });
    }
    
    // Check if withdrawal amount exceeds the amount available above ₹5000
    const withdrawableAmount = availableBalance - 5000;
    if (withdrawalAmount > withdrawableAmount) {
      return res.status(400).json({
        success: false,
        message: `You can only withdraw ₹${withdrawableAmount.toLocaleString()} (the amount above ₹5,000). Available balance: ₹${availableBalance.toLocaleString()}`
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

    // Create withdrawal request with the amount above ₹5000
    const withdrawalRequest = new WithdrawalRequest({
      vendor: vendorId,
      vendorId: vendor.vendorId,
      vendorName: `${vendor.firstName} ${vendor.lastName}`,
      vendorEmail: vendor.email,
      vendorPhone: vendor.phone,
      amount: withdrawalAmount // Store only the amount above ₹5000
    });

    await withdrawalRequest.save();

    // Add transaction record for the withdrawal request (pending status)
    try {
      logger.info('Adding withdrawal request transaction record', {
        vendorId: vendor.vendorId,
        withdrawalAmount,
        requestId: withdrawalRequest._id
      });
      
      const transactionData = {
        amount: 0, // No amount deducted yet (pending)
        type: 'withdrawal_request',
        description: `Withdrawal request submitted - Amount above ₹5,000: ₹${withdrawalAmount.toLocaleString()} (Request ID: ${withdrawalRequest._id})`,
        processedBy: 'system',
        metadata: {
          withdrawalRequestId: withdrawalRequest._id,
          amountAbove5000: withdrawalAmount,
          status: 'pending',
          note: 'Withdrawal request pending admin approval'
        }
      };
      
      logger.info('Creating withdrawal request transaction with data:', transactionData);
      
      await vendorWallet.addManualAdjustment(transactionData);
      
      logger.info('Withdrawal request transaction record added successfully', {
        vendorId: vendor.vendorId,
        requestId: withdrawalRequest._id
      });
    } catch (transactionError) {
      logger.error('Error adding withdrawal request transaction record:', transactionError);
      // Don't fail the request if transaction record fails
    }

    // Log the withdrawal request
    logger.info('Withdrawal request created', {
      vendorId: vendor.vendorId,
      vendorName: withdrawalRequest.vendorName,
      amountAbove5000: withdrawalAmount,
      requestId: withdrawalRequest._id
    });

    // Send email notification to admin (optional)
    try {
      await emailService.sendWithdrawalRequestNotification({
        vendorName: withdrawalRequest.vendorName,
        vendorEmail: withdrawalRequest.vendorEmail,
        amount: withdrawalAmount + 5000, // Show total amount in email
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
        amount: withdrawalAmount + 5000, // Show total amount in response
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

    // Check if vendor still has sufficient balance (only need to check if amount above ₹5000 is available)
    const availableBalance = Math.max(0, vendorWallet.currentBalance - 5000);
    if (withdrawalRequest.amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Vendor has insufficient balance for this withdrawal. Requested: ₹${withdrawalRequest.amount.toLocaleString()}, Available above ₹5,000: ₹${availableBalance.toLocaleString()}`
      });
    }

    // Approve the request
    try {
      await withdrawalRequest.approve(adminId, adminNotes);
    } catch (approveError) {
      logger.error('Error approving withdrawal request:', approveError);
      return res.status(500).json({
        success: false,
        message: 'Failed to approve withdrawal request'
      });
    }

    // Process the withdrawal (deduct only the amount above ₹5000)
    try {
      vendorWallet.currentBalance -= withdrawalRequest.amount; // Only deduct the amount above ₹5000
      vendorWallet.totalWithdrawals += withdrawalRequest.amount;
      await vendorWallet.save();
    } catch (walletError) {
      logger.error('Error updating vendor wallet:', walletError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update vendor wallet'
      });
    }

    // Update the existing withdrawal request transaction record
    try {
      logger.info('Looking for withdrawal request transaction to update', {
        requestId,
        totalTransactions: vendorWallet.transactions.length,
        withdrawalTransactions: vendorWallet.transactions.filter(t => 
          t.type === 'withdrawal_request' || 
          (t.type === 'manual_adjustment' && t.description && t.description.includes('Withdrawal request'))
        ).map(t => ({
          id: t._id,
          type: t.type,
          description: t.description,
          metadata: t.metadata
        }))
      });
      
      // Find and update the existing withdrawal request transaction
      // Look for both old format (manual_adjustment with description) and new format (withdrawal_request type)
      const transactionIndex = vendorWallet.transactions.findIndex(t => {
        // New format: withdrawal_request type with matching requestId
        if (t.type === 'withdrawal_request' && t.metadata && t.metadata.withdrawalRequestId === requestId) {
          return true;
        }
        // Old format: manual_adjustment with description containing requestId
        if (t.type === 'manual_adjustment' && t.description && t.description.includes(requestId)) {
          return true;
        }
        // Also check for withdrawal_request type with description containing requestId (fallback)
        if (t.type === 'withdrawal_request' && t.description && t.description.includes(requestId)) {
          return true;
        }
        return false;
      });
      
      logger.info('Transaction search result', {
        requestId,
        transactionIndex,
        found: transactionIndex !== -1,
        transactionType: transactionIndex !== -1 ? vendorWallet.transactions[transactionIndex].type : 'none'
      });
      
      if (transactionIndex !== -1) {
        const transaction = vendorWallet.transactions[transactionIndex];
        logger.info('Updating existing withdrawal request transaction', {
          requestId,
          transactionIndex,
          oldType: transaction.type,
          oldDescription: transaction.description,
          oldStatus: transaction.status
        });
        
        // Update the existing transaction
        transaction.type = 'withdrawal_request'; // Ensure it's the correct type
        transaction.amount = -withdrawalRequest.amount; // Negative for withdrawal
        transaction.description = `Withdrawal approved - Amount above ₹5,000: ₹${withdrawalRequest.amount.toLocaleString()} (Request ID: ${requestId})`;
        transaction.status = 'approved'; // Set to 'approved' for frontend compatibility
        // Add required fields for withdrawal_request type
        transaction.caseId = transaction.caseId || `WR-${Date.now()}`;
        transaction.billingAmount = transaction.billingAmount || 0;
        transaction.calculatedAmount = transaction.calculatedAmount || -withdrawalRequest.amount;
        transaction.metadata = {
          ...transaction.metadata,
          withdrawalRequestId: requestId,
          amountAbove5000: withdrawalRequest.amount,
          status: 'approved',
          processedBy: adminId,
          adminNotes,
          processedAt: new Date()
        };
        
        await vendorWallet.save();
        
        logger.info('Successfully updated withdrawal request transaction', {
          requestId,
          newType: transaction.type,
          newDescription: transaction.description,
          newStatus: transaction.status
        });
      } else {
        logger.warn('No existing withdrawal request transaction found, creating new one', {
          requestId,
          availableTransactions: vendorWallet.transactions.map(t => ({
            id: t._id,
            type: t.type,
            description: t.description,
            metadata: t.metadata
          }))
        });
        
        // If no existing transaction found, don't create a new one
        // This should not happen if withdrawal request creation worked properly
        logger.error('No existing withdrawal request transaction found for approval', {
          requestId,
          vendorId: withdrawalRequest.vendorId,
          availableTransactions: vendorWallet.transactions.map(t => ({
            id: t._id,
            type: t.type,
            description: t.description,
            metadata: t.metadata
          }))
        });
      }
    } catch (transactionError) {
      logger.error('Error updating transaction record:', transactionError);
      // Don't fail the approval if transaction record fails
      logger.warn('Withdrawal approved but transaction record failed to save');
    }

    // Send email notification to vendor
    try {
      await emailService.sendWithdrawalApprovalNotification({
        vendorName: withdrawalRequest.vendorName,
        vendorEmail: withdrawalRequest.vendorEmail,
        amount: withdrawalRequest.amount, // Only the amount above ₹5000
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

    // Update the existing withdrawal request transaction record
    try {
      // Get vendor wallet
      const vendorWallet = await VendorWallet.findOne({ 
        vendorId: withdrawalRequest.vendorId 
      });

      if (vendorWallet) {
        // Find and update the existing withdrawal request transaction
        const transactionIndex = vendorWallet.transactions.findIndex(t => 
          t.metadata && t.metadata.withdrawalRequestId === requestId
        );
        
        if (transactionIndex !== -1) {
          // Update the existing transaction
          vendorWallet.transactions[transactionIndex].amount = 0; // No amount deducted
          vendorWallet.transactions[transactionIndex].description = `Withdrawal request declined - Amount above ₹5,000: ₹${withdrawalRequest.amount.toLocaleString()} (Request ID: ${requestId})`;
          vendorWallet.transactions[transactionIndex].status = 'declined';
          vendorWallet.transactions[transactionIndex].metadata = {
            ...vendorWallet.transactions[transactionIndex].metadata,
            status: 'declined',
            processedBy: adminId,
            adminNotes,
            processedAt: new Date()
          };
          
          await vendorWallet.save();
        }
      }
    } catch (transactionError) {
      logger.error('Error updating transaction record for declined request:', transactionError);
      // Don't fail the decline if transaction record fails
    }

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

// @desc    Clean up duplicate withdrawal request transactions
// @route   POST /api/admin/withdrawals/cleanup-duplicates
// @access  Private (Admin)
const cleanupDuplicateWithdrawalTransactions = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.body;
    
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

    const vendorWallet = await VendorWallet.findOne({ vendorId });
    if (!vendorWallet) {
      return res.status(404).json({
        success: false,
        message: 'Vendor wallet not found'
      });
    }

    // Find all withdrawal request transactions
    const withdrawalTransactions = vendorWallet.transactions.filter(t => 
      t.type === 'withdrawal_request' || 
      (t.type === 'manual_adjustment' && t.description && t.description.includes('Withdrawal request'))
    );

    // Group by request ID
    const groupedTransactions = {};
    withdrawalTransactions.forEach(transaction => {
      let requestId = null;
      
      // Extract request ID from metadata or description
      if (transaction.metadata && transaction.metadata.withdrawalRequestId) {
        requestId = transaction.metadata.withdrawalRequestId;
      } else if (transaction.description) {
        const match = transaction.description.match(/Request ID: ([a-f0-9]+)/);
        if (match) {
          requestId = match[1];
        }
      }
      
      if (requestId) {
        if (!groupedTransactions[requestId]) {
          groupedTransactions[requestId] = [];
        }
        groupedTransactions[requestId].push(transaction);
      }
    });

    let cleanedCount = 0;
    const cleanedTransactions = [];

    // For each group, keep only the latest transaction
    Object.keys(groupedTransactions).forEach(requestId => {
      const transactions = groupedTransactions[requestId];
      if (transactions.length > 1) {
        // Sort by creation date, keep the latest
        transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const keepTransaction = transactions[0];
        const removeTransactions = transactions.slice(1);
        
        // Remove duplicate transactions
        removeTransactions.forEach(transaction => {
          const index = vendorWallet.transactions.findIndex(t => t._id.toString() === transaction._id.toString());
          if (index !== -1) {
            vendorWallet.transactions.splice(index, 1);
            cleanedCount++;
            cleanedTransactions.push({
              id: transaction._id,
              description: transaction.description,
              createdAt: transaction.createdAt
            });
          }
        });
      }
    });

    if (cleanedCount > 0) {
      await vendorWallet.save();
      
      logger.info('Cleaned up duplicate withdrawal transactions', {
        vendorId,
        cleanedCount,
        cleanedTransactions
      });
    }

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} duplicate withdrawal transactions`,
      data: {
        cleanedCount,
        cleanedTransactions
      }
    });

  } catch (error) {
    logger.error('Error cleaning up duplicate withdrawal transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up duplicate transactions'
    });
  }
});

module.exports = {
  createWithdrawalRequest,
  getVendorWithdrawalRequests,
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  declineWithdrawalRequest,
  cleanupDuplicateWithdrawalTransactions
};
