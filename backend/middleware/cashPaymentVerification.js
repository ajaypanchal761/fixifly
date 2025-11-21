const { logger } = require('../utils/logger');

/**
 * Middleware to validate cash payment verification
 * This ensures vendors confirm cash payments with proper verification
 */
const validateCashPayment = (req, res, next) => {
  const { paymentMethod, cashVerification, cashPhoto } = req.body;

  // If payment method is cash, require verification
  if (paymentMethod === 'cash') {
    if (!cashVerification) {
      return res.status(400).json({
        success: false,
        message: 'Cash payment verification is required',
        error: 'CASH_VERIFICATION_REQUIRED',
        details: {
          message: 'Please confirm that the customer has actually paid in cash',
          requiresVerification: true
        }
      });
    }

    if (cashVerification !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Cash payment not confirmed',
        error: 'CASH_NOT_CONFIRMED'
      });
    }

    // Log cash payment for audit
    logger.warn('Cash payment processed', {
      vendorId: req.vendor?.vendorId,
      caseId: req.body.caseId,
      amount: req.body.billingAmount,
      cashPhoto: cashPhoto ? 'provided' : 'not_provided',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Middleware to validate photo upload verification
 * This ensures vendors upload original photos
 */
const validatePhotoUpload = (req, res, next) => {
  const { photos, photoVerification } = req.body;

  // If photos are being uploaded, require verification
  if (photos && photos.length > 0) {
    if (!photoVerification) {
      return res.status(400).json({
        success: false,
        message: 'Photo verification is required',
        error: 'PHOTO_VERIFICATION_REQUIRED',
        details: {
          message: 'Please confirm that you are uploading original photos',
          requiresVerification: true
        }
      });
    }

    if (photoVerification !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Photo verification not confirmed',
        error: 'PHOTO_NOT_CONFIRMED'
      });
    }

    // Log photo upload for audit
    logger.info('Photos uploaded with verification', {
      vendorId: req.vendor?.vendorId,
      caseId: req.body.caseId,
      photoCount: photos.length,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Middleware to check if vendor has sufficient balance for task acceptance
 */
const checkTaskAcceptanceBalance = async (req, res, next) => {
  try {
    const { taskMRP } = req.body;
    const { vendorId } = req.vendor;

    if (!taskMRP || taskMRP <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid task MRP is required'
      });
    }

    // Import here to avoid circular dependency
    const VendorWallet = require('../models/VendorWallet');
    
    let wallet = await VendorWallet.findOne({ vendorId });
    if (!wallet) {
      wallet = new VendorWallet({ vendorId });
    }

    if (wallet.currentBalance < taskMRP) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to accept task',
        error: 'INSUFFICIENT_BALANCE',
        details: {
          currentBalance: wallet.currentBalance,
          requiredAmount: taskMRP,
          shortfall: taskMRP - wallet.currentBalance
        }
      });
    }

    // Add wallet to request for use in controller
    req.wallet = wallet;
    next();

  } catch (error) {
    logger.error('Error checking task acceptance balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify balance',
      error: error.message
    });
  }
};

/**
 * Middleware to validate GST calculation
 */
const validateGSTCalculation = (req, res, next) => {
  const { billingAmount, gstIncluded } = req.body;

  if (gstIncluded && billingAmount) {
    const gstAmount = billingAmount * 0.18;
    const netAmount = billingAmount - gstAmount;

    // Add calculated values to request body
    req.body.gstAmount = gstAmount;
    req.body.netBillingAmount = netAmount;

    logger.info('GST calculation', {
      vendorId: req.vendor?.vendorId,
      caseId: req.body.caseId,
      billingAmount,
      gstAmount,
      netAmount,
      gstIncluded
    });
  }

  next();
};

/**
 * Middleware to log wallet transactions for audit
 */
const logWalletTransaction = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log successful wallet transactions
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const responseData = JSON.parse(data);
        if (responseData.success && responseData.data?.transaction) {
          logger.info('Wallet transaction completed', {
            vendorId: req.vendor?.vendorId,
            transactionId: responseData.data.transaction.transactionId,
            type: responseData.data.transaction.type,
            amount: responseData.data.transaction.amount,
            newBalance: responseData.data.newBalance,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  validateCashPayment,
  validatePhotoUpload,
  checkTaskAcceptanceBalance,
  validateGSTCalculation,
  logWalletTransaction
};


