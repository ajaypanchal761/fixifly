const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');

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
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || amount <= 0) {
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

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
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
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      ticketId,
      amount 
    } = req.body;

    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update support ticket payment status
    if (ticketId) {
      const SupportTicket = require('../models/SupportTicket');
      const ticket = await SupportTicket.findOne({ ticketId });
      
      if (ticket) {
        ticket.paymentStatus = 'collected';
        ticket.paymentId = razorpay_payment_id;
        ticket.paymentCompletedAt = new Date();
        ticket.status = 'Resolved'; // Mark as resolved when payment is completed
        ticket.resolvedAt = new Date();
        await ticket.save();

        // Add vendor earning to wallet for online payment (support tickets)
        if (ticket.assignedTo && ticket.completionData && ticket.completionData.paymentMethod === 'online') {
          try {
            const VendorWallet = require('../models/VendorWallet');
            const WalletCalculationService = require('../services/walletCalculationService');
            
            const billingAmount = parseFloat(ticket.completionData.billingAmount) || 0;
            const spareAmount = ticket.completionData.spareParts?.reduce((sum, part) => {
              return sum + (parseFloat(part.amount.replace(/[₹,]/g, '')) || 0);
            }, 0) || 0;
            const travellingAmount = 0; // Support tickets don't have travelling amount
            const bookingAmount = 0; // Support tickets don't have booking amount
            
            // Calculate vendor earning
            const calculation = WalletCalculationService.calculateEarning({
              billingAmount,
              spareAmount,
              travellingAmount,
              bookingAmount,
              paymentMethod: 'online',
              gstIncluded: ticket.completionData.includeGST || false
            });
            
            // Add earning to vendor wallet
            const vendorWallet = await VendorWallet.findOne({ vendorId: ticket.assignedTo });
            if (vendorWallet) {
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
              
              console.log('Support ticket vendor earning added to wallet', {
                vendorId: ticket.assignedTo,
                ticketId: ticket.ticketId,
                earningAmount: calculation.calculatedAmount,
                billingAmount,
                spareAmount
              });
            }
          } catch (error) {
            console.error('Error adding support ticket vendor earning to wallet:', error);
            // Don't fail the payment verification if wallet update fails
          }
        }
      }
    }

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
    const { paymentId } = req.params;

    const payment = await razorpay.payments.fetch(paymentId);

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
});

// @desc    Create Razorpay Payment Link for webview compatibility
// @route   POST /api/payment/create-payment-link
// @access  Public
const createPaymentLink = asyncHandler(async (req, res) => {
  try {
    console.log('[Razorpay][CreatePaymentLink] Request received', {
      body: req.body,
      headers: {
        'user-agent': req.headers['user-agent'],
        'authorization': req.headers['authorization'] ? 'Present' : 'Missing'
      },
      timestamp: new Date().toISOString()
    });

    const { amount, currency = 'INR', description, ticketId, bookingId, customer, notes } = req.body;

    if (!amount || amount <= 0) {
      console.error('[Razorpay][CreatePaymentLink] Invalid amount', { amount });
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Validate Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[Razorpay][CreatePaymentLink] Razorpay keys not configured', {
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET
      });
      return res.status(500).json({ 
        success: false, 
        message: 'Payment gateway not configured. Please contact support.' 
      });
    }

    // Get base URLs
    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Create callback URL based on type
    let callbackUrl;
    if (ticketId) {
      callbackUrl = `${backendUrl}/api/support-tickets/payment-callback?ticketId=${ticketId}`;
    } else if (bookingId) {
      callbackUrl = `${backendUrl}/api/bookings/payment-callback?bookingId=${bookingId}`;
    } else {
      callbackUrl = `${backendUrl}/api/payment/callback`;
    }
    
    // Detect if request is from WebView
    const userAgent = req.headers['user-agent'] || '';
    const isWebViewRequest = /wv|WebView|flutter|Android.*wv|iPhone.*wv/i.test(userAgent);
    
    const paymentLinkOptions = {
      amount: Math.round(parseFloat(amount) * 100), // Convert to paise
      currency: currency,
      description: description || 'Payment',
      customer: customer || {
        name: 'Customer',
        email: '',
        contact: ''
      },
      notify: {
        sms: false,
        email: false
      },
      reminder_enable: false,
      callback_url: callbackUrl,
      callback_method: 'get',
      options: {
        checkout: {
          method: {
            netbanking: 1,
            card: 1,
            upi: 1,
            wallet: 1
          }
        }
      },
      notes: {
        ...(notes || {}),
        ...(ticketId ? { ticketId, type: 'support_ticket' } : {}),
        ...(bookingId ? { bookingId, type: 'booking' } : {}),
        isWebView: isWebViewRequest ? 'true' : 'false'
      }
    };
    
    console.log('[Razorpay][CreatePaymentLink] Creating payment link', {
      amount: paymentLinkOptions.amount,
      amountInRupees: amount,
      currency: paymentLinkOptions.currency,
      callbackUrl,
      ticketId,
      bookingId,
      customer: customer ? { name: customer.name, email: customer.email, contact: customer.contact ? 'Present' : 'Missing' } : 'Not provided',
      isWebView: isWebViewRequest
    });

    let paymentLink;
    try {
      paymentLink = await razorpay.paymentLink.create(paymentLinkOptions);
    } catch (razorpayError) {
      console.error('[Razorpay][CreatePaymentLink] Razorpay API error:', {
        message: razorpayError?.message,
        error: razorpayError?.error,
        statusCode: razorpayError?.statusCode,
        fullError: razorpayError
      });
      throw razorpayError;
    }
    
    // Validate payment link response
    if (!paymentLink || !paymentLink.id || !paymentLink.short_url) {
      throw new Error('Invalid payment link response from Razorpay');
    }
    
    console.log('[Razorpay][CreatePaymentLink] Payment link created successfully', {
      paymentLinkId: paymentLink.id,
      shortUrl: paymentLink.short_url,
      status: paymentLink.status
    });

    res.json({
      success: true,
      message: 'Payment link created successfully',
      data: {
        paymentLinkId: paymentLink.id,
        paymentUrl: paymentLink.short_url,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
      }
    });

  } catch (error) {
    console.error('[Razorpay][CreatePaymentLink] Error:', {
      message: error?.message,
      stack: error?.stack,
      error: error?.error,
      statusCode: error?.statusCode,
      name: error?.name,
      fullError: error
    });
    
    let errorMessage = 'Failed to create payment link. Please try again later.';
    
    if (error?.error?.description) {
      errorMessage = error.error.description;
    } else if (error?.error?.code) {
      errorMessage = `Payment error (${error.error.code}): ${error.error.description || 'Please check your payment gateway configuration'}`;
    } else if (error?.message) {
      if (error.message.includes('status') || error.message.includes('undefined')) {
        errorMessage = 'Payment gateway configuration error. Please contact support.';
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorCode: error?.error?.code || error?.statusCode
    });
  }
});

// @desc    Handle Razorpay payment callback for support tickets (for payment links)
// @route   GET /api/support-tickets/payment-callback
// @access  Public (called by Razorpay)
const handleSupportTicketPaymentCallback = asyncHandler(async (req, res) => {
  try {
    const { ticketId } = req.query;
    const { razorpay_payment_link_id, razorpay_payment_id, razorpay_payment_link_status } = req.query;
    
    console.log('[Razorpay][SupportTicket][PaymentCallback] Callback received', {
      ticketId,
      paymentLinkId: razorpay_payment_link_id,
      paymentId: razorpay_payment_id,
      status: razorpay_payment_link_status
    });

    if (!ticketId) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Error</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Payment Error</h1>
          <p>Ticket ID not found in callback.</p>
        </body>
        </html>
      `);
    }

    const SupportTicket = require('../models/SupportTicket');
    const ticket = await SupportTicket.findOne({ ticketId });
    
    if (!ticket) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Error</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Payment Error</h1>
          <p>Support ticket not found.</p>
        </body>
        </html>
      `);
    }

    // Validate Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[Razorpay][SupportTicket][PaymentCallback] Razorpay keys not configured');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/support?payment=failed&ticketId=${ticketId}&message=Payment gateway not configured`);
    }

    // Fetch payment link details from Razorpay
    let paymentLink;
    try {
      const paymentLinkId = razorpay_payment_link_id;
      if (!paymentLinkId) {
        throw new Error('Payment link ID not found');
      }
      paymentLink = await razorpay.paymentLink.fetch(paymentLinkId);
    } catch (linkError) {
      console.error('[Razorpay][SupportTicket][PaymentCallback] Error fetching payment link', {
        error: linkError.message,
        paymentLinkId: razorpay_payment_link_id
      });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/support?payment=failed&ticketId=${ticketId}&message=Failed to verify payment`);
    }

    // Check payment status
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const userAgent = req.headers['user-agent'] || '';
    const isWebViewRequest = /wv|WebView|flutter|Android.*wv|iPhone.*wv/i.test(userAgent);

    if (paymentLink.status === 'paid' && razorpay_payment_id) {
      // Payment successful - update ticket
      ticket.paymentStatus = 'collected';
      ticket.paymentId = razorpay_payment_id;
      ticket.paymentCompletedAt = new Date();
      ticket.status = 'Resolved';
      ticket.resolvedAt = new Date();
      await ticket.save();

      // Add vendor earning to wallet if applicable
      if (ticket.assignedTo && ticket.completionData && ticket.completionData.paymentMethod === 'online') {
        try {
          const VendorWallet = require('../models/VendorWallet');
          const WalletCalculationService = require('../services/walletCalculationService');
          
          const billingAmount = parseFloat(ticket.completionData.billingAmount) || 0;
          const spareAmount = ticket.completionData.spareParts?.reduce((sum, part) => {
            return sum + (parseFloat(part.amount.replace(/[₹,]/g, '')) || 0);
          }, 0) || 0;
          
          const calculation = WalletCalculationService.calculateEarning({
            billingAmount,
            spareAmount,
            travellingAmount: 0,
            bookingAmount: 0,
            paymentMethod: 'online',
            gstIncluded: ticket.completionData.includeGST || false
          });
          
          const vendorWallet = await VendorWallet.findOne({ vendorId: ticket.assignedTo });
          if (vendorWallet) {
            await vendorWallet.addEarning({
              caseId: ticket.ticketId,
              billingAmount,
              spareAmount,
              travellingAmount: 0,
              bookingAmount: 0,
              paymentMethod: 'online',
              gstIncluded: ticket.completionData.includeGST || false,
              description: `Support ticket completion earning - ${ticket.ticketId}`
            });
          }
        } catch (error) {
          console.error('Error adding support ticket vendor earning to wallet:', error);
        }
      }

      // Return success response with multiple redirect methods for WebView
      if (isWebViewRequest) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Successful</title>
            <script>
              (function() {
                var ticketId = '${ticketId}';
                var paymentId = '${razorpay_payment_id}';
                var frontendUrl = '${frontendUrl}';
                var redirectUrl = frontendUrl + '/support?payment=success&ticketId=' + ticketId;
                var deepLink = 'fixifly://payment-callback?ticketId=' + ticketId + '&status=success&paymentId=' + paymentId;
                
                // IMMEDIATE REDIRECT - Execute first, before anything else
                // Try multiple redirect methods simultaneously
                
                // Method 1: window.top.location (for WebView iframes)
                try {
                  if (window.top && window.top !== window) {
                    window.top.location.href = redirectUrl;
                  }
                } catch (e) {
                  // Cross-origin error, continue with other methods
                }
                
                // Method 2: window.location.href (standard redirect)
                try {
                  window.location.href = redirectUrl;
                } catch (e) {
                  // Fallback
                }
                
                // Method 3: window.location.replace (no history)
                try {
                  window.location.replace(redirectUrl);
                } catch (e) {
                  // Fallback
                }
                
                // Method 4: Flutter bridge (CRITICAL - Tell Flutter to navigate)
                if (window.FlutterPaymentBridge && typeof window.FlutterPaymentBridge.paymentCallback === 'function') {
                  try {
                    window.FlutterPaymentBridge.paymentCallback({
                      type: 'paymentCallback',
                      status: 'success',
                      ticketId: ticketId,
                      paymentId: paymentId,
                      redirectUrl: redirectUrl
                    });
                  } catch (e) {
                    console.error('Flutter bridge error:', e);
                  }
                }
                
                // Method 5: Flutter InAppWebView handler
                if (window.flutter_inappwebview) {
                  try {
                    window.flutter_inappwebview.callHandler('paymentCallback', {
                      type: 'paymentCallback',
                      status: 'success',
                      ticketId: ticketId,
                      paymentId: paymentId,
                      redirectUrl: redirectUrl
                    });
                  } catch (e) {
                    console.error('Flutter InAppWebView error:', e);
                  }
                }
                
                // Method 6: JavaScript channel (PaymentHandler)
                if (window.PaymentHandler && typeof window.PaymentHandler.postMessage === 'function') {
                  try {
                    window.PaymentHandler.postMessage(JSON.stringify({
                      type: 'paymentCallback',
                      status: 'success',
                      ticketId: ticketId,
                      paymentId: paymentId,
                      redirectUrl: redirectUrl
                    }));
                  } catch (e) {
                    console.error('PaymentHandler error:', e);
                  }
                }
                
                // Method 7: postMessage to parent (non-blocking)
                if (window.parent !== window) {
                  try {
                    window.parent.postMessage({
                      type: 'paymentCallback',
                      status: 'success',
                      ticketId: ticketId,
                      paymentId: paymentId
                    }, '*');
                  } catch (e) {
                    console.error('PostMessage error:', e);
                  }
                }
                
                // Method 8: Deep link (non-blocking)
                try {
                  setTimeout(function() {
                    try {
                      window.location.href = deepLink;
                    } catch (e) {
                      // If deep link fails, ensure web redirect
                      window.location.href = redirectUrl;
                    }
                  }, 100);
                } catch (e) {
                  // Ignore deep link errors
                }
                
                // Force redirect after page load (final fallback)
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    window.location.href = redirectUrl;
                  }, 100);
                });
                
                // Also try on DOMContentLoaded
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function() {
                    window.location.href = redirectUrl;
                  });
                } else {
                  // Already loaded, redirect immediately
                  window.location.href = redirectUrl;
                }
              })();
            </script>
          </head>
          <body onload="window.location.href='${frontendUrl}/support?payment=success&ticketId=${ticketId}'" style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: green;">Payment Successful!</h1>
            <p>Your ticket has been resolved.</p>
            <p>Redirecting...</p>
            <p style="font-size: 12px; color: #666;">If you are not redirected automatically, <a href="${frontendUrl}/support?payment=success&ticketId=${ticketId}">click here</a></p>
          </body>
          </html>
        `);
      } else {
        return res.redirect(`${frontendUrl}/support?payment=success&ticketId=${ticketId}`);
      }
    } else {
      // Payment failed or cancelled
      const failureMessage = paymentLink.status === 'cancelled' 
        ? 'Payment was cancelled' 
        : paymentLink.status === 'expired'
        ? 'Payment link expired'
        : 'Payment not completed. Please try again.';

      if (isWebViewRequest) {
        const encodedMessage = encodeURIComponent(failureMessage);
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Failed</title>
            <script>
              (function() {
                var ticketId = '${ticketId}';
                var message = '${failureMessage.replace(/'/g, "\\'")}';
                var frontendUrl = '${frontendUrl}';
                var redirectUrl = frontendUrl + '/support?payment=failed&ticketId=' + ticketId + '&message=' + encodeURIComponent(message);
                var deepLink = 'fixifly://payment-callback?ticketId=' + ticketId + '&status=failed&message=' + encodeURIComponent(message);
                
                // Try multiple redirect methods
                try {
                  if (window.top && window.top !== window) {
                    window.top.location.href = redirectUrl;
                  }
                } catch (e) {}
                
                try {
                  window.location.href = redirectUrl;
                } catch (e) {}
                
                // Flutter bridge
                if (window.FlutterPaymentBridge && typeof window.FlutterPaymentBridge.paymentCallback === 'function') {
                  try {
                    window.FlutterPaymentBridge.paymentCallback({
                      type: 'paymentCallback',
                      status: 'failed',
                      ticketId: ticketId,
                      message: message
                    });
                  } catch (e) {}
                }
                
                if (window.flutter_inappwebview) {
                  try {
                    window.flutter_inappwebview.callHandler('paymentCallback', {
                      type: 'paymentCallback',
                      status: 'failed',
                      ticketId: ticketId,
                      message: message
                    });
                  } catch (e) {}
                }
                
                if (window.parent !== window) {
                  try {
                    window.parent.postMessage({
                      type: 'paymentCallback',
                      status: 'failed',
                      ticketId: ticketId,
                      message: message
                    }, '*');
                  } catch (e) {}
                }
                
                setTimeout(function() {
                  window.location.href = redirectUrl;
                }, 1000);
              })();
            </script>
          </head>
          <body onload="setTimeout(function(){window.location.href='${frontendUrl}/support?payment=failed&ticketId=${ticketId}&message=${encodedMessage}'}, 1000)" style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: red;">Payment Failed</h1>
            <p>${failureMessage}</p>
            <p>Please try again to complete your payment.</p>
            <p style="font-size: 12px; color: #666;">If you are not redirected automatically, <a href="${frontendUrl}/support?payment=failed&ticketId=${ticketId}&message=${encodedMessage}">click here</a></p>
          </body>
          </html>
        `);
      } else {
        return res.redirect(`${frontendUrl}/support?payment=failed&ticketId=${ticketId}&message=${encodeURIComponent(failureMessage)}`);
      }
    }
  } catch (error) {
    console.error('[Razorpay][SupportTicket][PaymentCallback] Error', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const ticketId = req.query.ticketId || '';
    return res.redirect(`${frontendUrl}/support?payment=failed&ticketId=${ticketId}&message=Payment callback error`);
  }
});

// @desc    Handle Razorpay payment callback for bookings (for payment links)
// @route   GET /api/bookings/payment-callback
// @access  Public (called by Razorpay)
const handleBookingPaymentCallback = asyncHandler(async (req, res) => {
  try {
    const { bookingId } = req.query;
    const { razorpay_payment_link_id, razorpay_payment_id, razorpay_payment_link_status } = req.query;
    
    console.log('[Razorpay][Booking][PaymentCallback] Callback received', {
      bookingId,
      paymentLinkId: razorpay_payment_link_id,
      paymentId: razorpay_payment_id,
      status: razorpay_payment_link_status
    });

    if (!bookingId) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Error</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Payment Error</h1>
          <p>Booking ID not found in callback.</p>
        </body>
        </html>
      `);
    }

    const Booking = require('../models/Booking');
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Error</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Payment Error</h1>
          <p>Booking not found.</p>
        </body>
        </html>
      `);
    }

    // Validate Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[Razorpay][Booking][PaymentCallback] Razorpay keys not configured');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/booking?payment=failed&bookingId=${bookingId}&message=Payment gateway not configured`);
    }

    // Fetch payment link details from Razorpay
    let paymentLink;
    try {
      const paymentLinkId = razorpay_payment_link_id;
      if (!paymentLinkId) {
        throw new Error('Payment link ID not found');
      }
      paymentLink = await razorpay.paymentLink.fetch(paymentLinkId);
    } catch (linkError) {
      console.error('[Razorpay][Booking][PaymentCallback] Error fetching payment link', {
        error: linkError.message,
        paymentLinkId: razorpay_payment_link_id
      });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/booking?payment=failed&bookingId=${bookingId}&message=Failed to verify payment`);
    }

    // Check payment status
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const userAgent = req.headers['user-agent'] || '';
    const isWebViewRequest = /wv|WebView|flutter|Android.*wv|iPhone.*wv/i.test(userAgent);

    if (paymentLink.status === 'paid' && razorpay_payment_id) {
      // Payment successful - update booking
      booking.paymentStatus = 'payment_done';
      booking.paymentId = razorpay_payment_id;
      booking.status = 'completed';
      booking.paymentCompletedAt = new Date();
      await booking.save();

      // Return success response with multiple redirect methods for WebView
      if (isWebViewRequest) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Successful</title>
            <script>
              (function() {
                var bookingId = '${bookingId}';
                var paymentId = '${razorpay_payment_id}';
                var frontendUrl = '${frontendUrl}';
                var redirectUrl = frontendUrl + '/booking?payment=success&bookingId=' + bookingId;
                var deepLink = 'fixifly://payment-callback?bookingId=' + bookingId + '&status=success&paymentId=' + paymentId;
                
                // IMMEDIATE REDIRECT - Execute first, before anything else
                try {
                  if (window.top && window.top !== window) {
                    window.top.location.href = redirectUrl;
                  }
                } catch (e) {}
                
                try {
                  window.location.href = redirectUrl;
                } catch (e) {}
                
                try {
                  window.location.replace(redirectUrl);
                } catch (e) {}
                
                // Flutter bridge
                if (window.FlutterPaymentBridge && typeof window.FlutterPaymentBridge.paymentCallback === 'function') {
                  try {
                    window.FlutterPaymentBridge.paymentCallback({
                      type: 'paymentCallback',
                      status: 'success',
                      bookingId: bookingId,
                      paymentId: paymentId,
                      redirectUrl: redirectUrl
                    });
                  } catch (e) {}
                }
                
                if (window.flutter_inappwebview) {
                  try {
                    window.flutter_inappwebview.callHandler('paymentCallback', {
                      type: 'paymentCallback',
                      status: 'success',
                      bookingId: bookingId,
                      paymentId: paymentId,
                      redirectUrl: redirectUrl
                    });
                  } catch (e) {}
                }
                
                if (window.PaymentHandler && typeof window.PaymentHandler.postMessage === 'function') {
                  try {
                    window.PaymentHandler.postMessage(JSON.stringify({
                      type: 'paymentCallback',
                      status: 'success',
                      bookingId: bookingId,
                      paymentId: paymentId,
                      redirectUrl: redirectUrl
                    }));
                  } catch (e) {}
                }
                
                if (window.parent !== window) {
                  try {
                    window.parent.postMessage({
                      type: 'paymentCallback',
                      status: 'success',
                      bookingId: bookingId,
                      paymentId: paymentId
                    }, '*');
                  } catch (e) {}
                }
                
                setTimeout(function() {
                  try {
                    window.location.href = deepLink;
                  } catch (e) {
                    window.location.href = redirectUrl;
                  }
                }, 100);
                
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    window.location.href = redirectUrl;
                  }, 100);
                });
                
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function() {
                    window.location.href = redirectUrl;
                  });
                } else {
                  window.location.href = redirectUrl;
                }
              })();
            </script>
          </head>
          <body onload="window.location.href='${frontendUrl}/booking?payment=success&bookingId=${bookingId}'" style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: green;">Payment Successful!</h1>
            <p>Your payment has been processed successfully.</p>
            <p>Redirecting...</p>
            <p style="font-size: 12px; color: #666;">If you are not redirected automatically, <a href="${frontendUrl}/booking?payment=success&bookingId=${bookingId}">click here</a></p>
          </body>
          </html>
        `);
      } else {
        return res.redirect(`${frontendUrl}/booking?payment=success&bookingId=${bookingId}`);
      }
    } else {
      // Payment failed or cancelled
      const failureMessage = paymentLink.status === 'cancelled' 
        ? 'Payment was cancelled' 
        : paymentLink.status === 'expired'
        ? 'Payment link expired'
        : 'Payment not completed. Please try again.';

      if (isWebViewRequest) {
        const encodedMessage = encodeURIComponent(failureMessage);
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Failed</title>
            <script>
              (function() {
                var bookingId = '${bookingId}';
                var message = '${failureMessage.replace(/'/g, "\\'")}';
                var frontendUrl = '${frontendUrl}';
                var redirectUrl = frontendUrl + '/booking?payment=failed&bookingId=' + bookingId + '&message=' + encodeURIComponent(message);
                var deepLink = 'fixifly://payment-callback?bookingId=' + bookingId + '&status=failed&message=' + encodeURIComponent(message);
                
                // Try multiple redirect methods
                try {
                  if (window.top && window.top !== window) {
                    window.top.location.href = redirectUrl;
                  }
                } catch (e) {}
                
                try {
                  window.location.href = redirectUrl;
                } catch (e) {}
                
                // Flutter bridge
                if (window.FlutterPaymentBridge && typeof window.FlutterPaymentBridge.paymentCallback === 'function') {
                  try {
                    window.FlutterPaymentBridge.paymentCallback({
                      type: 'paymentCallback',
                      status: 'failed',
                      bookingId: bookingId,
                      message: message
                    });
                  } catch (e) {}
                }
                
                if (window.flutter_inappwebview) {
                  try {
                    window.flutter_inappwebview.callHandler('paymentCallback', {
                      type: 'paymentCallback',
                      status: 'failed',
                      bookingId: bookingId,
                      message: message
                    });
                  } catch (e) {}
                }
                
                if (window.parent !== window) {
                  try {
                    window.parent.postMessage({
                      type: 'paymentCallback',
                      status: 'failed',
                      bookingId: bookingId,
                      message: message
                    }, '*');
                  } catch (e) {}
                }
                
                setTimeout(function() {
                  window.location.href = redirectUrl;
                }, 1000);
              })();
            </script>
          </head>
          <body onload="setTimeout(function(){window.location.href='${frontendUrl}/booking?payment=failed&bookingId=${bookingId}&message=${encodedMessage}'}, 1000)" style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: red;">Payment Failed</h1>
            <p>${failureMessage}</p>
            <p>Please try again to complete your payment.</p>
            <p style="font-size: 12px; color: #666;">If you are not redirected automatically, <a href="${frontendUrl}/booking?payment=failed&bookingId=${bookingId}&message=${encodedMessage}">click here</a></p>
          </body>
          </html>
        `);
      } else {
        return res.redirect(`${frontendUrl}/booking?payment=failed&bookingId=${bookingId}&message=${encodeURIComponent(failureMessage)}`);
      }
    }
  } catch (error) {
    console.error('[Razorpay][Booking][PaymentCallback] Error', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const bookingId = req.query.bookingId || '';
    return res.redirect(`${frontendUrl}/booking?payment=failed&bookingId=${bookingId}&message=Payment callback error`);
  }
});

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  createPaymentLink,
  handleSupportTicketPaymentCallback,
  handleBookingPaymentCallback
};
