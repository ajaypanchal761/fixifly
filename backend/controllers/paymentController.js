const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Public
const createOrder = asyncHandler(async (req, res) => {
  try {
    logger.info('📝 Creating Razorpay order', {
      requestId: req.requestId,
      body: { amount: req.body.amount, currency: req.body.currency, receipt: req.body.receipt }
    });

    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || amount <= 0) {
      logger.warn('Invalid amount provided for order creation', {
        requestId: req.requestId,
        amount
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const options = {
      amount: Math.round(parseFloat(amount) * 100), // Convert rupees to paise
      currency: currency,
      receipt: receipt,
      notes: notes || {}
    };

    logger.debug('Razorpay order options prepared', {
      requestId: req.requestId,
      amountInPaise: options.amount,
      currency: options.currency
    });

    const order = await razorpay.orders.create(options);

    logger.info('✅ Razorpay order created successfully', {
      requestId: req.requestId,
      orderId: order.id,
      amount: order.amount,
      status: order.status
    });

    res.json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    logger.error('❌ Error creating Razorpay order', {
      requestId: req.requestId,
      message: error.message,
      stack: error.stack,
      amount: req.body.amount
    });
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Public
const verifyPayment = asyncHandler(async (req, res) => {
  try {
    logger.info('🔐 Verifying Razorpay payment', {
      requestId: req.requestId,
      orderId: req.body.razorpay_order_id,
      paymentId: req.body.razorpay_payment_id,
      ticketId: req.body.ticketId,
      amount: req.body.amount
    });

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      ticketId,
      amount 
    } = req.body;

    // Verify the payment signature
    logger.debug('Step 1: Generating expected signature', {
      requestId: req.requestId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    });

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    logger.debug('Step 2: Comparing signatures', {
      requestId: req.requestId,
      expectedSignature: expectedSignature.substring(0, 20) + '...',
      receivedSignature: razorpay_signature ? razorpay_signature.substring(0, 20) + '...' : 'missing'
    });

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      logger.warn('⚠️ Payment signature verification failed', {
        requestId: req.requestId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    logger.info('✅ Payment signature verified successfully', {
      requestId: req.requestId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    });

    // Update support ticket payment status
    if (ticketId) {
      logger.debug('Step 3: Updating support ticket payment status', {
        requestId: req.requestId,
        ticketId
      });

      const SupportTicket = require('../models/SupportTicket');
      const ticket = await SupportTicket.findOne({ ticketId });
      
      if (ticket) {
        logger.debug('Step 4: Support ticket found, updating payment details', {
          requestId: req.requestId,
          ticketId,
          currentStatus: ticket.status,
          currentPaymentStatus: ticket.paymentStatus
        });

        ticket.paymentStatus = 'collected';
        ticket.paymentId = razorpay_payment_id;
        ticket.paymentCompletedAt = new Date();
        ticket.status = 'Resolved'; // Mark as resolved when payment is completed
        ticket.resolvedAt = new Date();
        await ticket.save();

        logger.info('✅ Support ticket payment status updated', {
          requestId: req.requestId,
          ticketId,
          paymentId: razorpay_payment_id,
          newStatus: 'Resolved'
        });

        // Add vendor earning to wallet for online payment (support tickets)
        if (ticket.assignedTo && ticket.completionData && ticket.completionData.paymentMethod === 'online') {
          logger.debug('Step 5: Processing vendor wallet earning for support ticket', {
            requestId: req.requestId,
            ticketId,
            vendorId: ticket.assignedTo,
            paymentMethod: ticket.completionData.paymentMethod
          });

          try {
            const VendorWallet = require('../models/VendorWallet');
            const WalletCalculationService = require('../services/walletCalculationService');
            
            const billingAmount = parseFloat(ticket.completionData.billingAmount) || 0;
            const spareAmount = ticket.completionData.spareParts?.reduce((sum, part) => {
              return sum + (parseFloat(part.amount.replace(/[₹,]/g, '')) || 0);
            }, 0) || 0;
            const travellingAmount = 0; // Support tickets don't have travelling amount
            const bookingAmount = 0; // Support tickets don't have booking amount
            
            logger.debug('Step 6: Calculating vendor earning', {
              requestId: req.requestId,
              billingAmount,
              spareAmount,
              travellingAmount,
              bookingAmount,
              gstIncluded: ticket.completionData.includeGST || false
            });
            
            // Calculate vendor earning
            const calculation = WalletCalculationService.calculateEarning({
              billingAmount,
              spareAmount,
              travellingAmount,
              bookingAmount,
              paymentMethod: 'online',
              gstIncluded: ticket.completionData.includeGST || false
            });
            
            logger.debug('Step 7: Earning calculation completed', {
              requestId: req.requestId,
              calculatedAmount: calculation.calculatedAmount,
              gstAmount: calculation.gstAmount
            });
            
            // Add earning to vendor wallet
            const vendorWallet = await VendorWallet.findOne({ vendorId: ticket.assignedTo });
            if (vendorWallet) {
              logger.debug('Step 8: Vendor wallet found, adding earning', {
                requestId: req.requestId,
                vendorId: ticket.assignedTo,
                currentBalance: vendorWallet.currentBalance
              });

              await vendorWallet.addEarning({
                caseId: ticket.ticketId,
                billingAmount,
                spareAmount,
                travellingAmount,
                bookingAmount: 0, // Support tickets don't have booking amount
                paymentMethod: 'online',
                gstIncluded: ticket.completionData.includeGST || false,
                description: `Support ticket completion earning - ${ticket.ticketId}`
              });
              
              logger.info('✅ Vendor earning added to wallet', {
                requestId: req.requestId,
                vendorId: ticket.assignedTo,
                ticketId: ticket.ticketId,
                earningAmount: calculation.calculatedAmount,
                billingAmount,
                spareAmount,
                newBalance: vendorWallet.currentBalance
              });

              console.log('Support ticket vendor earning added to wallet', {
                vendorId: ticket.assignedTo,
                ticketId: ticket.ticketId,
                earningAmount: calculation.calculatedAmount,
                billingAmount,
                spareAmount
              });
            } else {
              logger.warn('Vendor wallet not found for earning', {
                requestId: req.requestId,
                vendorId: ticket.assignedTo
              });
            }
          } catch (error) {
            logger.error('❌ Error adding support ticket vendor earning to wallet', {
              requestId: req.requestId,
              ticketId,
              vendorId: ticket.assignedTo,
              error: error.message,
              stack: error.stack
            });
            console.error('Error adding support ticket vendor earning to wallet:', error);
            // Don't fail the payment verification if wallet update fails
          }
        }
      }
    }

    logger.info('✅ Payment verification completed successfully', {
      requestId: req.requestId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount,
      ticketId: ticketId || 'N/A'
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: amount
      }
    });

  } catch (error) {
    logger.error('❌ Error verifying payment', {
      requestId: req.requestId,
      orderId: req.body.razorpay_order_id,
      paymentId: req.body.razorpay_payment_id,
      error: error.message,
      stack: error.stack
    });
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// @desc    Get payment details
// @route   GET /api/payment/:paymentId
// @access  Public
const getPaymentDetails = asyncHandler(async (req, res) => {
  try {
    logger.info('📋 Fetching payment details', {
      requestId: req.requestId,
      paymentId: req.params.paymentId
    });

    const { paymentId } = req.params;

    const payment = await razorpay.payments.fetch(paymentId);

    logger.info('✅ Payment details fetched successfully', {
      requestId: req.requestId,
      paymentId,
      status: payment.status,
      amount: payment.amount
    });

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    logger.error('❌ Error fetching payment details', {
      requestId: req.requestId,
      paymentId: req.params.paymentId,
      error: error.message,
      stack: error.stack
    });
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
});

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails
};
