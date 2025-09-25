const RazorpayService = require('../services/razorpayService');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Public
const createOrder = asyncHandler(async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (!receipt) {
      return res.status(400).json({
        success: false,
        message: 'Receipt ID is required'
      });
    }

    // Create Razorpay order
    const orderData = {
      amount: parseFloat(amount),
      currency,
      receipt,
      notes
    };

    const order = await RazorpayService.createOrder(orderData);

    logger.info(`Razorpay order created: ${order.orderId}`, {
      orderId: order.orderId,
      amount: order.amount,
      receipt: order.receipt
    });

    res.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    logger.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// @desc    Verify payment signature
// @route   POST /api/payment/verify
// @access  Public
const verifyPayment = asyncHandler(async (req, res) => {
  try {
    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature,
      bookingData 
    } = req.body;

    // Validate required fields
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification data'
      });
    }

    // Verify payment signature
    const isSignatureValid = RazorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      logger.error('Payment signature verification failed', {
        razorpayOrderId,
        razorpayPaymentId
      });
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await RazorpayService.getPaymentDetails(razorpayPaymentId);

    logger.info(`Payment verified successfully: ${razorpayPaymentId}`, {
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      amount: paymentDetails.amount,
      status: paymentDetails.status
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        status: paymentDetails.status,
        method: paymentDetails.method,
        capturedAt: paymentDetails.capturedAt
      }
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// @desc    Get payment details
// @route   GET /api/payment/:paymentId
// @access  Public
const getPaymentDetails = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const paymentDetails = await RazorpayService.getPaymentDetails(paymentId);

    logger.info(`Payment details retrieved: ${paymentId}`, {
      paymentId,
      status: paymentDetails.status
    });

    res.json({
      success: true,
      data: paymentDetails
    });
  } catch (error) {
    logger.error('Error retrieving payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment details',
      error: error.message
    });
  }
});

// @desc    Process refund
// @route   POST /api/payment/:paymentId/refund
// @access  Public (in real app, this would be protected)
const processRefund = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason = 'Customer request' } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid refund amount is required'
      });
    }

    const refund = await RazorpayService.processRefund(paymentId, amount, reason);

    logger.info(`Refund processed successfully: ${refund.refundId}`, {
      refundId: refund.refundId,
      paymentId: refund.paymentId,
      amount: refund.amount,
      reason
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: refund
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
});

// @desc    Get payment methods
// @route   GET /api/payment/methods
// @access  Public
const getPaymentMethods = asyncHandler(async (req, res) => {
  try {
    const paymentMethods = RazorpayService.getPaymentMethods();

    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    logger.error('Error retrieving payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment methods',
      error: error.message
    });
  }
});

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  processRefund,
  getPaymentMethods
};
