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
      bookingId,
      amount 
    } = req.body;

    // Verify the payment signature (if provided)
    // Note: In WebView/APK scenarios, signature might not be available
    // In such cases, we verify payment via Razorpay API
    let isAuthentic = false;
    
    if (razorpay_signature) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      isAuthentic = expectedSignature === razorpay_signature;
      
      if (!isAuthentic) {
        console.warn('⚠️ Signature verification failed, will verify via Razorpay API');
      }
    } else {
      console.log('⚠️ Signature not provided - will verify via Razorpay API (WebView/APK scenario)');
    }

    // If signature verification failed or signature not provided, verify via Razorpay API
    if (!isAuthentic && razorpay_payment_id) {
      try {
        console.log('🔍 Verifying payment via Razorpay API...');
        
        // Add retry mechanism for API verification (payment might still be processing)
        let payment = null;
        let retries = 3;
        let lastError = null;
        
        while (retries > 0) {
          try {
            payment = await razorpay.payments.fetch(razorpay_payment_id);
            
            // FIXED: Added parentheses for correct logic evaluation
            if (payment && (payment.status === 'captured' || payment.status === 'authorized')) {
          // Verify order_id matches
          if (payment.order_id === razorpay_order_id || !payment.order_id) {
            isAuthentic = true;
                console.log('✅ Payment verified via Razorpay API', {
                  paymentId: razorpay_payment_id,
                  orderId: payment.order_id,
                  status: payment.status,
                  retriesLeft: retries
                });
                break;
          } else {
            console.warn('⚠️ Order ID mismatch:', {
              paymentOrderId: payment.order_id,
              providedOrderId: razorpay_order_id
                });
                // Don't break, try again
              }
            } else {
              console.warn(`⚠️ Payment status is not captured/authorized: ${payment?.status} (retries left: ${retries - 1})`);
            }
            
            // Wait before retry (payment might still be processing)
            if (retries > 1) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            }
            retries--;
          } catch (fetchError) {
            lastError = fetchError;
            console.error(`❌ Error fetching payment (retry ${4 - retries}/3):`, fetchError.message);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            }
          }
        }
        
        // If still not authenticated after retries
        if (!isAuthentic && lastError) {
          console.error('❌ Payment verification failed after all retries:', lastError.message);
          // If signature was provided but verification failed, reject
          if (razorpay_signature) {
            return res.status(400).json({
              success: false,
              message: 'Invalid payment signature'
            });
          }
        }
      } catch (paymentError) {
        console.error('❌ Error verifying payment via Razorpay API:', paymentError.message);
        // If signature was provided but verification failed, reject
        if (razorpay_signature) {
          return res.status(400).json({
            success: false,
            message: 'Invalid payment signature'
          });
        }
      }
    }

    if (!isAuthentic) {
      console.error('❌ ========== PAYMENT VERIFICATION FAILED ==========');
      console.error('❌ Payment ID:', razorpay_payment_id || 'MISSING');
      console.error('❌ Order ID:', razorpay_order_id || 'MISSING');
      console.error('❌ Booking ID:', bookingId || 'N/A');
      console.error('❌ Ticket ID:', ticketId || 'N/A');
      console.error('❌ Reason: Signature verification failed or payment not found');
      console.error('❌ Timestamp:', new Date().toISOString());
      console.error('❌ ================================================');
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update booking payment status
    if (bookingId) {
      const Booking = require('../models/Booking');
      const booking = await Booking.findById(bookingId);
      
      if (booking) {
        if (!booking.payment) {
          booking.payment = {};
        }
        booking.payment.status = 'completed';
        booking.payment.method = 'online';
        booking.payment.transactionId = razorpay_payment_id;
        booking.payment.completedAt = new Date();
        booking.paymentStatus = 'payment_done';
        booking.status = 'completed';
        await booking.save();
        
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅ ✅ ✅ PAYMENT SUCCESS ✅ ✅ ✅');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅ Booking ID:', booking._id);
        console.log('✅ Payment ID:', razorpay_payment_id);
        console.log('✅ Order ID:', razorpay_order_id);
        console.log('✅ Amount:', booking.payment?.amount || 'N/A');
        console.log('✅ Status: COMPLETED');
        console.log('✅ Payment Method: Online (Razorpay)');
        console.log('✅ Timestamp:', new Date().toISOString());
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('\n');
      } else {
        console.warn('⚠️ Booking not found for payment verification:', bookingId);
      }
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

    console.log('✅ ========== PAYMENT VERIFICATION SUCCESS ==========');
    console.log('✅ Payment ID:', razorpay_payment_id);
    console.log('✅ Order ID:', razorpay_order_id);
    console.log('✅ Booking ID:', bookingId || 'N/A');
    console.log('✅ Ticket ID:', ticketId || 'N/A');
    console.log('✅ Amount:', amount ? `₹${(amount / 100).toFixed(2)}` : 'N/A');
    console.log('✅ Status: VERIFIED');
    console.log('✅ Timestamp:', new Date().toISOString());
    console.log('✅ ==================================================');

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

// @desc    Razorpay redirect callback handler (for WebView/APK)
// @route   ALL /api/payment/razorpay-callback
// @access  Public
const razorpayRedirectCallback = asyncHandler(async (req, res) => {
  // CRITICAL: Log immediately when callback is received - THESE WILL SHOW IN PM2 LOGS
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔔 🔔 🔔 RAZORPAY CALLBACK RECEIVED 🔔 🔔 🔔');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔔 Timestamp:', new Date().toISOString());
  console.log('🔔 Method:', req.method);
  console.log('🔔 URL:', req.originalUrl || req.url);
  console.log('🔔 Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
  console.log('🔔 IP:', req.ip || req.connection.remoteAddress);
  console.log('🔔 User-Agent:', req.headers['user-agent'] || 'N/A');
  console.log('🔔 Query Params:', JSON.stringify(req.query, null, 2));
  console.log('🔔 Body:', JSON.stringify(req.body, null, 2));
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n');
  
  try {
    // Additional detailed logging (already logged above, but keeping for completeness)

    // Extract payment details from request (can be in query or body)
    // Razorpay sends these as query parameters when redirecting to callback_url
    // IMPORTANT: Check multiple parameter name variations for maximum compatibility
    // Use let instead of const so we can update these if we fetch from Razorpay API
    let razorpay_payment_id = req.body?.razorpay_payment_id || 
                              req.query?.razorpay_payment_id || 
                              req.query?.payment_id ||
                              req.body?.razorpayPaymentId ||
                              req.query?.razorpayPaymentId;
    let razorpay_order_id = req.body?.razorpay_order_id || 
                           req.query?.razorpay_order_id || 
                           req.query?.order_id ||
                           req.body?.razorpayOrderId ||
                           req.query?.razorpayOrderId;
    const razorpay_signature = req.body?.razorpay_signature || 
                               req.query?.razorpay_signature || 
                               req.query?.signature ||
                               req.body?.razorpaySignature ||
                               req.query?.razorpaySignature;
    const bookingId = req.body?.bookingId || 
                     req.query?.bookingId || 
                     req.query?.booking_id ||
                     req.body?.booking_id;
    const ticketId = req.body?.ticketId || 
                    req.query?.ticketId || 
                    req.query?.ticket_id ||
                    req.body?.ticket_id;
    
    console.log('📋 Extracted payment data:', {
      razorpay_payment_id: razorpay_payment_id ? `${razorpay_payment_id.substring(0, 10)}...` : 'MISSING',
      razorpay_order_id: razorpay_order_id ? `${razorpay_order_id.substring(0, 10)}...` : 'MISSING',
      razorpay_signature: razorpay_signature ? `${razorpay_signature.substring(0, 10)}...` : 'MISSING',
      bookingId: bookingId || 'MISSING',
      ticketId: ticketId || 'MISSING'
    });
    
    // Check if this is a payment failure callback
    const isPaymentFailed = req.query?.error === 'payment_failed' || 
                           req.query?.payment_failed === 'true' ||
                           req.body?.error === 'payment_failed' ||
                           req.body?.payment_failed === 'true';
    
    if (isPaymentFailed) {
      const failureReason = req.query?.error_message || req.body?.error_message || 'Payment failed by user';
      const failedBookingId = bookingId;
      const failedTicketId = ticketId;
      
      console.error('\n');
      console.error('═══════════════════════════════════════════════════════════════');
      console.error('❌ ❌ ❌ PAYMENT FAILURE CALLBACK RECEIVED ❌ ❌ ❌');
      console.error('═══════════════════════════════════════════════════════════════');
      console.error('❌ Payment ID:', razorpay_payment_id || 'N/A');
      console.error('❌ Order ID:', razorpay_order_id || 'N/A');
      console.error('❌ Booking ID:', failedBookingId || 'N/A');
      console.error('❌ Ticket ID:', failedTicketId || 'N/A');
      console.error('❌ Failure Reason:', decodeURIComponent(failureReason));
      console.error('❌ Timestamp:', new Date().toISOString());
      console.error('═══════════════════════════════════════════════════════════════');
      console.error('\n');
      
      // Mark payment as failed in backend directly (no need for fetch, we're already in backend)
      if (failedBookingId || failedTicketId) {
        try {
          // Import models
          const Booking = require('../models/Booking');
          const SupportTicket = require('../models/SupportTicket');
          
          if (failedBookingId) {
            const booking = await Booking.findById(failedBookingId);
            if (booking) {
              if (!booking.payment) {
                booking.payment = {};
              }
              booking.payment.status = 'failed';
              booking.payment.failedAt = new Date();
              booking.payment.failureReason = decodeURIComponent(failureReason);
              if (razorpay_payment_id) {
                booking.payment.transactionId = razorpay_payment_id;
              }
              await booking.save();
              
              console.error('\n');
              console.error('═══════════════════════════════════════════════════════════════');
              console.error('❌ ❌ ❌ BOOKING PAYMENT MARKED AS FAILED ❌ ❌ ❌');
              console.error('═══════════════════════════════════════════════════════════════');
              console.error('❌ Booking ID:', booking._id);
              console.error('❌ Payment ID:', razorpay_payment_id || 'N/A');
              console.error('❌ Reason:', decodeURIComponent(failureReason));
              console.error('❌ Timestamp:', new Date().toISOString());
              console.error('═══════════════════════════════════════════════════════════════');
              console.error('\n');
            }
          }
          
          if (failedTicketId) {
            const ticket = await SupportTicket.findOne({ ticketId: failedTicketId });
            if (ticket) {
              ticket.paymentStatus = 'failed';
              ticket.paymentFailedAt = new Date();
              ticket.paymentFailureReason = decodeURIComponent(failureReason);
              if (razorpay_payment_id) {
                ticket.paymentId = razorpay_payment_id;
              }
              await ticket.save();
              
              console.error('\n');
              console.error('═══════════════════════════════════════════════════════════════');
              console.error('❌ ❌ ❌ TICKET PAYMENT MARKED AS FAILED ❌ ❌ ❌');
              console.error('═══════════════════════════════════════════════════════════════');
              console.error('❌ Ticket ID:', ticket.ticketId);
              console.error('❌ Payment ID:', razorpay_payment_id || 'N/A');
              console.error('❌ Reason:', decodeURIComponent(failureReason));
              console.error('❌ Timestamp:', new Date().toISOString());
              console.error('═══════════════════════════════════════════════════════════════');
              console.error('\n');
            }
          }
        } catch (markFailedError) {
          console.error('❌ Error marking payment as failed:', markFailedError.message);
        }
      }
    }
    
    // If no payment data at all, log warning
    if (!razorpay_payment_id && !razorpay_order_id && !isPaymentFailed) {
      console.error('❌ CRITICAL: No payment data received in callback!');
      console.error('❌ This means Razorpay did not send payment details');
      console.error('❌ Possible causes:');
      console.error('   1. callback_url not configured correctly');
      console.error('   2. Razorpay redirect failed');
      console.error('   3. WebView blocked the redirect');
    }

    // Detect WebView/Flutter context from user agent
    const userAgent = req.headers['user-agent'] || '';
    const isWebView = /wv|WebView|flutter|Flutter/i.test(userAgent);
    const isFlutterWebView = /flutter|Flutter/i.test(userAgent) || 
                            req.query?.isWebView === 'true' || 
                            req.body?.isWebView === 'true';

    // Build frontend callback URL
    const frontendBase = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://getfixfly.com' : 'http://localhost:8080');
    const url = new URL('/payment-callback', frontendBase);
    
    // If payment failed, add error parameters to frontend URL
    if (isPaymentFailed) {
      const failureReason = req.query?.error_message || req.body?.error_message || 'Payment failed by user';
      url.searchParams.set('error', 'payment_failed');
      url.searchParams.set('error_message', failureReason);
      url.searchParams.set('payment_failed', 'true');
      console.error('❌ Adding error parameters to frontend callback URL');
    }
    
    // Deep link URL for Flutter app (if configured)
    const deepLinkScheme = process.env.DEEP_LINK_SCHEME || 'fixfly';
    const deepLinkUrl = `${deepLinkScheme}://payment-callback?razorpay_order_id=${razorpay_order_id || ''}&razorpay_payment_id=${razorpay_payment_id || ''}&razorpay_signature=${razorpay_signature || ''}&bookingId=${bookingId || ''}&ticketId=${ticketId || ''}`;

    // Add payment parameters
    if (razorpay_order_id) {
      url.searchParams.set('razorpay_order_id', razorpay_order_id);
      url.searchParams.set('order_id', razorpay_order_id);
    }
    if (razorpay_payment_id) {
      url.searchParams.set('razorpay_payment_id', razorpay_payment_id);
      url.searchParams.set('payment_id', razorpay_payment_id);
    }
    if (razorpay_signature) {
      url.searchParams.set('razorpay_signature', razorpay_signature);
      url.searchParams.set('signature', razorpay_signature);
    }
    if (bookingId) {
      url.searchParams.set('booking_id', bookingId);
    }
    if (ticketId) {
      url.searchParams.set('ticket_id', ticketId);
    }

    // CRITICAL: If order_id or payment_id is missing, try to fetch from Razorpay
    // This is especially important for WebView where parameters might not be passed correctly
    if (razorpay_payment_id && !razorpay_order_id) {
      try {
        console.log('🔍 Order ID missing, fetching payment details from Razorpay...');
        console.log('🔍 Payment ID:', razorpay_payment_id);
        
        let payment = null;
        let retries = 3;
        
        // Retry fetching payment (might still be processing)
        while (retries > 0 && !payment) {
          try {
            payment = await razorpay.payments.fetch(razorpay_payment_id);
            if (payment && payment.order_id) {
              break;
            }
            if (retries > 1) {
              console.log(`⏳ Payment not ready, retrying in 2 seconds... (${retries - 1} retries left)`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            retries--;
          } catch (fetchError) {
            console.error(`❌ Error fetching payment (retry ${4 - retries}/3):`, fetchError.message);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        if (payment && payment.order_id) {
          razorpay_order_id = payment.order_id; // Update the variable
          url.searchParams.set('razorpay_order_id', payment.order_id);
          url.searchParams.set('order_id', payment.order_id);
          console.log('✅ Found order ID from payment:', payment.order_id);
        } else if (payment && payment.notes) {
          // Check payment notes for booking_id or ticket_id
          const notesBookingId = payment.notes.booking_id || payment.notes.bookingId;
          const notesTicketId = payment.notes.ticket_id || payment.notes.ticketId;
          
          if (notesBookingId && !bookingId) {
            url.searchParams.set('booking_id', notesBookingId);
            console.log('✅ Found booking ID from payment notes:', notesBookingId);
          }
          if (notesTicketId && !ticketId) {
            url.searchParams.set('ticket_id', notesTicketId);
            console.log('✅ Found ticket ID from payment notes:', notesTicketId);
          }
        } else {
          console.warn('⚠️ Could not fetch payment details or order_id from Razorpay');
        }
      } catch (paymentError) {
        console.error('❌ Error fetching payment from Razorpay:', paymentError.message);
      }
    }
    
    // CRITICAL: If we have order_id but missing payment_id, try to find payment from order
    // This can happen in WebView if Razorpay redirects before payment is fully processed
    if (razorpay_order_id && !razorpay_payment_id) {
      try {
        console.log('🔍 Payment ID missing, fetching order details from Razorpay...');
        console.log('🔍 Order ID:', razorpay_order_id);
        
        const order = await razorpay.orders.fetch(razorpay_order_id);
        
        if (order && order.payments) {
          // Get the most recent payment
          const payments = order.payments;
          if (payments && payments.length > 0) {
            // Fetch the latest payment
            const latestPaymentId = payments[payments.length - 1];
            try {
              const payment = await razorpay.payments.fetch(latestPaymentId);
              if (payment && payment.id) {
                razorpay_payment_id = payment.id; // Update the variable
                url.searchParams.set('razorpay_payment_id', payment.id);
                url.searchParams.set('payment_id', payment.id);
                console.log('✅ Found payment ID from order:', payment.id);
                
                // Also add signature if available
                if (payment.notes && payment.notes.signature) {
                  url.searchParams.set('razorpay_signature', payment.notes.signature);
                }
              }
            } catch (fetchPaymentError) {
              console.warn('⚠️ Could not fetch payment details from order:', fetchPaymentError.message);
            }
          }
        }
      } catch (orderError) {
        console.error('❌ Error fetching order from Razorpay:', orderError.message);
      }
    }

    console.log('🔀 Returning HTML form for reliable WebView redirect:', {
      isWebView,
      isFlutterWebView,
      url: url.toString(),
      deepLinkUrl
    });
    
    // Return HTML page with auto-submit form and deep linking support (more reliable in WebView)
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Processing Payment...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 400px;
            width: 90%;
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Processing Payment...</h2>
          <p>Please wait while we redirect you...</p>
          <div class="spinner"></div>
        </div>
        <form id="paymentForm" method="GET" action="${url.toString()}" style="display: none;">
        </form>
        <script>
          (function() {
            // Payment data
            const paymentData = {
              razorpay_order_id: '${razorpay_order_id || ''}',
              razorpay_payment_id: '${razorpay_payment_id || ''}',
              razorpay_signature: '${razorpay_signature || ''}',
              bookingId: '${bookingId || ''}',
              ticketId: '${ticketId || ''}'
            };
            
            // Store in multiple places for reliability
            try {
              // Method 1: localStorage
              localStorage.setItem('payment_response', JSON.stringify(paymentData));
              console.log('💾 Stored payment response in localStorage');
              
              // Method 2: sessionStorage (backup)
              sessionStorage.setItem('payment_response', JSON.stringify(paymentData));
              console.log('💾 Stored payment response in sessionStorage');
            } catch(e) {
              console.warn('⚠️ Storage not available:', e);
            }
            
            // Try deep linking first (for Flutter WebView)
            ${isFlutterWebView ? `
            try {
              // Method 1: Try Flutter bridge
              if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
                window.flutter_inappwebview.callHandler('paymentCallback', paymentData);
                console.log('📱 Sent payment data to Flutter via bridge');
              }
              
              // Method 2: Try deep link
              const deepLinkUrl = '${deepLinkUrl}';
              try {
                window.location.href = deepLinkUrl;
                console.log('🔗 Attempted deep link:', deepLinkUrl);
                // Wait a bit to see if deep link works
                setTimeout(function() {
                  // If still here, fallback to form submit
                  submitForm();
                }, 500);
                return;
              } catch(e) {
                console.warn('⚠️ Deep link failed:', e);
              }
              
              // Method 3: postMessage to parent
              if (window.parent !== window) {
                window.parent.postMessage({
                  type: 'paymentCallback',
                  ...paymentData
                }, '*');
                console.log('📨 Sent payment data via postMessage');
              }
            } catch(e) {
              console.warn('⚠️ Deep linking failed:', e);
            }
            ` : ''}
            
            // Function to submit form
            function submitForm() {
              try {
                document.getElementById('paymentForm').submit();
              } catch(e) {
                console.error('❌ Error submitting form:', e);
                // Fallback: redirect manually
                window.location.href = '${url.toString()}';
              }
            }
            
            // Auto-submit form after short delay to ensure storage writes complete
            setTimeout(submitForm, 100);
          })();
        </script>
      </body>
      </html>
    `;
    
    console.log('📤 Sending HTML response to client');
    console.log('📤 HTML length:', html.length);
    console.log('📤 Payment data in HTML:', {
      hasOrderId: !!razorpay_order_id,
      hasPaymentId: !!razorpay_payment_id,
      hasSignature: !!razorpay_signature,
      hasBookingId: !!bookingId,
      hasTicketId: !!ticketId
    });
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (error) {
    console.error('❌ Error in Razorpay callback:', error);
    const frontendBase = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://getfixfly.com' : 'http://localhost:8080');
    const errorUrl = new URL('/payment-callback', frontendBase);
    errorUrl.searchParams.set('error', 'CALLBACK_ERROR');
    errorUrl.searchParams.set('error_message', 'Payment callback processing failed');
    
    // Return error HTML instead of redirect
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <div style="text-align: center; padding: 50px; font-family: Arial;">
          <h2 style="color: red;">Payment Processing Error</h2>
          <p>There was an issue processing your payment. Please try again.</p>
          <a href="${errorUrl.toString()}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Continue</a>
        </div>
      </body>
      </html>
    `;
    res.send(errorHtml);
  }
});

// @desc    Verify payment by payment ID only (for WebView - no signature required)
// @route   POST /api/payment/verify-by-id
// @access  Public
const verifyPaymentById = asyncHandler(async (req, res) => {
  try {
    const { razorpay_payment_id, bookingId, ticketId } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    console.log('🔍 Verifying payment by ID (WebView scenario):', {
      paymentId: razorpay_payment_id,
      bookingId,
      ticketId
    });

    // Fetch payment from Razorpay with retry mechanism
    let payment = null;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        if (payment && (payment.status === 'captured' || payment.status === 'authorized')) {
          console.log('✅ Payment found and verified:', {
            paymentId: payment.id,
            orderId: payment.order_id,
            status: payment.status,
            amount: payment.amount
          });
          break;
        }
        
        // Wait before retry (payment might still be processing)
        if (retries > 1) {
          console.log(`⏳ Payment status: ${payment?.status}, retrying in 2 seconds... (${retries - 1} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        retries--;
      } catch (error) {
        lastError = error;
        console.error(`❌ Error fetching payment (retry ${4 - retries}/3):`, error.message);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!payment || (payment.status !== 'captured' && payment.status !== 'authorized')) {
      return res.status(400).json({
        success: false,
        message: 'Payment not found or not completed',
        paymentStatus: payment?.status,
        error: lastError?.message
      });
    }

    // Update booking payment status (same logic as verifyPayment)
    if (bookingId) {
      const Booking = require('../models/Booking');
      const booking = await Booking.findById(bookingId);
      
      if (booking) {
        if (!booking.payment) {
          booking.payment = {};
        }
        booking.payment.status = 'completed';
        booking.payment.method = 'online';
        booking.payment.transactionId = razorpay_payment_id;
        booking.payment.razorpayPaymentId = razorpay_payment_id;
        booking.payment.razorpayOrderId = payment.order_id;
        booking.payment.completedAt = new Date();
        booking.paymentStatus = 'payment_done';
        booking.status = 'completed';
        await booking.save();
        
        console.log('✅ ========== PAYMENT SUCCESS (verify-by-id) ==========');
        console.log('✅ Booking ID:', booking._id);
        console.log('✅ Payment ID:', razorpay_payment_id);
        console.log('✅ Order ID:', payment.order_id || 'N/A');
        console.log('✅ Amount:', payment.amount ? `₹${(payment.amount / 100).toFixed(2)}` : 'N/A');
        console.log('✅ Status: COMPLETED');
        console.log('✅ Payment Method: Online (Razorpay)');
        console.log('✅ Timestamp:', new Date().toISOString());
        console.log('✅ ===================================================');
      }
    }

    // Update support ticket payment status (same logic as verifyPayment)
    if (ticketId) {
      const SupportTicket = require('../models/SupportTicket');
      const ticket = await SupportTicket.findOne({ ticketId });
      
      if (ticket) {
        ticket.paymentStatus = 'collected';
        ticket.paymentId = razorpay_payment_id;
        ticket.paymentCompletedAt = new Date();
        ticket.status = 'Resolved';
        ticket.resolvedAt = new Date();
        await ticket.save();
        
        console.log('✅ ========== PAYMENT SUCCESS (verify-by-id) ==========');
        console.log('✅ Ticket ID:', ticket.ticketId);
        console.log('✅ Payment ID:', razorpay_payment_id);
        console.log('✅ Order ID:', payment.order_id || 'N/A');
        console.log('✅ Amount:', payment.amount ? `₹${(payment.amount / 100).toFixed(2)}` : 'N/A');
        console.log('✅ Status: RESOLVED');
        console.log('✅ Payment Method: Online (Razorpay)');
        console.log('✅ Timestamp:', new Date().toISOString());
        console.log('✅ ===================================================');
      }
    }

    console.log('✅ ========== PAYMENT VERIFICATION SUCCESS (verify-by-id) ==========');
    console.log('✅ Payment ID:', payment.id);
    console.log('✅ Order ID:', payment.order_id || 'N/A');
    console.log('✅ Status:', payment.status);
    console.log('✅ Amount:', payment.amount ? `₹${(payment.amount / 100).toFixed(2)}` : 'N/A');
    console.log('✅ Currency:', payment.currency || 'INR');
    console.log('✅ Booking ID:', bookingId || 'N/A');
    console.log('✅ Ticket ID:', ticketId || 'N/A');
    console.log('✅ Timestamp:', new Date().toISOString());
    console.log('✅ ===============================================================');
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: payment.id,
        orderId: payment.order_id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency
      }
    });

  } catch (error) {
    console.error('❌ ========== PAYMENT VERIFICATION ERROR (verify-by-id) ==========');
    console.error('❌ Payment ID:', req.body?.razorpay_payment_id || 'MISSING');
    console.error('❌ Booking ID:', req.body?.bookingId || 'N/A');
    console.error('❌ Ticket ID:', req.body?.ticketId || 'N/A');
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Timestamp:', new Date().toISOString());
    console.error('❌ ==============================================================');
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// @desc    Mark payment as failed for booking/ticket
// @route   POST /api/payment/mark-failed
// @access  Public
const markPaymentFailed = asyncHandler(async (req, res) => {
  try {
    const { bookingId, ticketId, reason } = req.body;

    if (!bookingId && !ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Either bookingId or ticketId is required'
      });
    }

    // Update booking payment status to failed
    if (bookingId) {
      const Booking = require('../models/Booking');
      const booking = await Booking.findById(bookingId);
      
      if (booking) {
        if (!booking.payment) {
          booking.payment = {};
        }
        booking.payment.status = 'failed';
        booking.payment.failedAt = new Date();
        if (reason) {
          booking.payment.failureReason = reason;
        }
        // Keep booking status as is (don't change to cancelled) so user can retry
        await booking.save();
        
        console.error('❌ ========== PAYMENT FAILED ==========');
        console.error('❌ Booking ID:', booking._id);
        console.error('❌ Payment Status: FAILED');
        console.error('❌ Reason:', reason || 'Payment verification failed');
        console.error('❌ Timestamp:', new Date().toISOString());
        console.error('❌ ====================================');
      } else {
        console.warn('⚠️ Booking not found for marking payment as failed:', bookingId);
      }
    }

    // Update support ticket payment status to failed
    if (ticketId) {
      const SupportTicket = require('../models/SupportTicket');
      const ticket = await SupportTicket.findOne({ ticketId });
      
      if (ticket) {
        ticket.paymentStatus = 'failed';
        ticket.paymentFailedAt = new Date();
        if (reason) {
          ticket.paymentFailureReason = reason;
        }
        await ticket.save();
        
        console.error('❌ ========== PAYMENT FAILED ==========');
        console.error('❌ Ticket ID:', ticket.ticketId);
        console.error('❌ Payment Status: FAILED');
        console.error('❌ Reason:', reason || 'Payment verification failed');
        console.error('❌ Timestamp:', new Date().toISOString());
        console.error('❌ ====================================');
      }
    }

    console.error('❌ ========== PAYMENT MARKED AS FAILED ==========');
    console.error('❌ Booking ID:', bookingId || 'N/A');
    console.error('❌ Ticket ID:', ticketId || 'N/A');
    console.error('❌ Reason:', reason || 'Payment verification failed');
    console.error('❌ Timestamp:', new Date().toISOString());
    console.error('❌ =============================================');
    
    res.json({
      success: true,
      message: 'Payment marked as failed',
      data: {
        bookingId: bookingId || null,
        ticketId: ticketId || null
      }
    });

  } catch (error) {
    console.error('❌ ========== ERROR MARKING PAYMENT AS FAILED ==========');
    console.error('❌ Booking ID:', req.body?.bookingId || 'N/A');
    console.error('❌ Ticket ID:', req.body?.ticketId || 'N/A');
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Timestamp:', new Date().toISOString());
    console.error('❌ =====================================================');
    res.status(500).json({
      success: false,
      message: 'Failed to mark payment as failed',
      error: error.message
    });
  }
});

module.exports = {
  createOrder,
  verifyPayment,
  verifyPaymentById,
  getPaymentDetails,
  markPaymentFailed,
  razorpayRedirectCallback
};
