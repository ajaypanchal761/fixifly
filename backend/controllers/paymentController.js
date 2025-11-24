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
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 🔍 🔍 PAYMENT VERIFICATION REQUEST 🔍 🔍 🔍');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🔗 URL:', req.originalUrl || req.url);
    console.log('🌐 IP:', req.ip || req.connection.remoteAddress);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n');
    
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      ticketId,
      bookingId,
      amount 
    } = req.body;
    
    console.log('📋 Payment Verification Data:');
    console.log('   Order ID:', razorpay_order_id || 'MISSING');
    console.log('   Payment ID:', razorpay_payment_id || 'MISSING');
    console.log('   Signature:', razorpay_signature ? 'PRESENT' : 'MISSING');
    console.log('   Booking ID:', bookingId || 'N/A');
    console.log('   Ticket ID:', ticketId || 'N/A');
    console.log('   Amount:', amount || 'N/A');
    console.log('\n');

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
          // Verify order_id matches (or accept if order_id not provided - WebView scenario)
          // CRITICAL: For WebView/APK, order_id might not be in URL params, so we accept payment if status is captured
          if (!razorpay_order_id || payment.order_id === razorpay_order_id || !payment.order_id) {
            isAuthentic = true;
                console.log('✅ Payment verified via Razorpay API', {
                  paymentId: razorpay_payment_id,
                  orderId: payment.order_id || razorpay_order_id || 'N/A',
                  status: payment.status,
                  retriesLeft: retries,
                  note: razorpay_order_id ? 'Order ID matched' : 'Order ID not provided (WebView scenario)'
                });
                // Update razorpay_order_id from payment if missing
                if (!razorpay_order_id && payment.order_id) {
                  razorpay_order_id = payment.order_id;
                }
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

    // CRITICAL: For WebView/APK, if we have payment_id but verification failed, try one more time
    // Sometimes payment takes a few seconds to be available in Razorpay API
    if (!isAuthentic && razorpay_payment_id && !razorpay_signature) {
      console.log('🔄 WebView scenario: Payment verification failed, trying one more time...');
      try {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        const retryPayment = await razorpay.payments.fetch(razorpay_payment_id);
        if (retryPayment && (retryPayment.status === 'captured' || retryPayment.status === 'authorized')) {
          isAuthentic = true;
          if (!razorpay_order_id && retryPayment.order_id) {
            razorpay_order_id = retryPayment.order_id;
          }
          console.log('✅ Payment verified on retry:', {
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id || retryPayment.order_id,
            status: retryPayment.status
          });
        }
      } catch (retryError) {
        console.warn('⚠️ Retry verification also failed:', retryError.message);
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

    console.log('\n');
    console.log('✅ ✅ ✅ PAYMENT VERIFICATION SUCCESS ✅ ✅ ✅');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Payment ID:', razorpay_payment_id);
    console.log('✅ Order ID:', razorpay_order_id);
    console.log('✅ Booking ID:', bookingId || 'N/A');
    console.log('✅ Ticket ID:', ticketId || 'N/A');
    console.log('✅ Amount:', amount ? `₹${(amount / 100).toFixed(2)}` : 'N/A');
    console.log('✅ Status: VERIFIED');
    console.log('✅ Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n');

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
  console.log('🔔 🔔 🔔 STEP 1: RAZORPAY CALLBACK RECEIVED 🔔 🔔 🔔');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔔 Timestamp:', new Date().toISOString());
  console.log('🔔 Method:', req.method);
  console.log('🔔 URL:', req.originalUrl || req.url);
  console.log('🔔 Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
  console.log('🔔 IP:', req.ip || req.connection.remoteAddress);
  console.log('🔔 User-Agent:', req.headers['user-agent'] || 'N/A');
  console.log('🔔 Referer:', req.headers.referer || 'N/A');
  console.log('🔔 Query Params:', JSON.stringify(req.query, null, 2));
  console.log('🔔 Body:', JSON.stringify(req.body, null, 2));
  console.log('🔔 Headers:', JSON.stringify({
    'content-type': req.headers['content-type'],
    'accept': req.headers['accept'],
    'origin': req.headers['origin']
  }, null, 2));
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
    let bookingId = req.body?.bookingId || 
                   req.query?.bookingId || 
                   req.query?.booking_id ||
                   req.body?.booking_id;
    let ticketId = req.body?.ticketId || 
                  req.query?.ticketId || 
                  req.query?.ticket_id ||
                  req.body?.ticket_id;
    
    // CRITICAL: If we have payment_id but missing booking_id/ticket_id, try to fetch from payment notes
    // This is especially important for WebView where URL params might not be passed correctly
    if (razorpay_payment_id && !bookingId && !ticketId) {
      try {
        console.log('🔍 ========== STEP 2.1: FETCHING PAYMENT NOTES ==========');
        console.log('🔍 Payment ID:', razorpay_payment_id);
        console.log('🔍 Reason: Booking/Ticket ID missing from URL params');
        console.log('🔍 Attempting to fetch from Razorpay payment notes...');
        
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        console.log('🔍 Payment fetched:', payment ? 'SUCCESS' : 'FAILED');
        
        if (payment && payment.notes) {
          console.log('🔍 Payment Notes:', JSON.stringify(payment.notes, null, 2));
          const notesBookingId = payment.notes.booking_id || payment.notes.bookingId;
          const notesTicketId = payment.notes.ticket_id || payment.notes.ticketId;
          
          if (notesBookingId && !bookingId) {
            bookingId = notesBookingId;
            console.log('✅ ✅ ✅ Extracted booking ID from payment notes:', notesBookingId);
          }
          if (notesTicketId && !ticketId) {
            ticketId = notesTicketId;
            console.log('✅ ✅ ✅ Extracted ticket ID from payment notes:', notesTicketId);
          }
          
          if (!notesBookingId && !notesTicketId) {
            console.warn('⚠️ No booking/ticket ID found in payment notes');
          }
        } else {
          console.warn('⚠️ Payment notes not available');
        }
        console.log('🔍 ===================================================');
      } catch (notesError) {
        console.error('❌ Error fetching payment notes:', notesError.message);
        console.error('❌ Stack:', notesError.stack);
      }
    }
    
    console.log('📋 ========== STEP 2: EXTRACTING PAYMENT DATA ==========');
    console.log('📋 Payment ID:', razorpay_payment_id ? `${razorpay_payment_id.substring(0, 10)}...` : 'MISSING');
    console.log('📋 Order ID:', razorpay_order_id ? `${razorpay_order_id.substring(0, 10)}...` : 'MISSING');
    console.log('📋 Signature:', razorpay_signature ? `${razorpay_signature.substring(0, 10)}...` : 'MISSING');
    console.log('📋 Booking ID:', bookingId || 'MISSING');
    console.log('📋 Ticket ID:', ticketId || 'MISSING');
    console.log('📋 Timestamp:', new Date().toISOString());
    console.log('📋 ===================================================');
    
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
    
    // Check if this is a new booking payment (not existing booking)
    // Look for pending_booking_token in query params - this indicates a new booking from checkout
    const pendingBookingToken = req.query?.pending_booking_token || 
                               req.body?.pending_booking_token ||
                               req.query?.booking_token ||
                               req.body?.booking_token;
    
    // If we have a pending booking token, this is a new booking from checkout
    // We need to create the booking after payment verification
    let pendingBookingData = null;
    if (pendingBookingToken && !isPaymentFailed && razorpay_payment_id) {
      try {
        // Try to get booking data from payment notes (Razorpay stores notes)
        if (razorpay_payment_id) {
          const payment = await razorpay.payments.fetch(razorpay_payment_id);
          if (payment && payment.notes) {
            // Check if notes contain booking data indicator
            if (payment.notes.payment_type === 'service_payment' || payment.notes.isWebView === 'true') {
              console.log('📋 Detected new booking payment from checkout (WebView)');
              console.log('📋 Payment notes:', JSON.stringify(payment.notes, null, 2));
              // We'll need to get booking data from frontend callback or create it from stored data
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not fetch payment notes:', e.message);
      }
    }
    
    // If no payment data at all, log warning and try to fetch from Razorpay order
    if (!razorpay_payment_id && !razorpay_order_id && !isPaymentFailed) {
      console.error('❌ CRITICAL: No payment data received in callback!');
      console.error('❌ This means Razorpay did not send payment details');
      console.error('❌ Possible causes:');
      console.error('   1. callback_url not configured correctly');
      console.error('   2. Razorpay redirect failed');
      console.error('   3. WebView blocked the redirect');
      console.error('   4. Payment might still be processing');
      
      // Try to get payment data from request headers or referer
      const referer = req.headers.referer || '';
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          const refOrderId = refererUrl.searchParams.get('razorpay_order_id') || refererUrl.searchParams.get('order_id');
          const refPaymentId = refererUrl.searchParams.get('razorpay_payment_id') || refererUrl.searchParams.get('payment_id');
          
          if (refOrderId && !razorpay_order_id) {
            razorpay_order_id = refOrderId;
            console.log('✅ Found order ID from referer:', refOrderId);
          }
          if (refPaymentId && !razorpay_payment_id) {
            razorpay_payment_id = refPaymentId;
            console.log('✅ Found payment ID from referer:', refPaymentId);
          }
        } catch (e) {
          console.warn('⚠️ Could not parse referer URL:', e.message);
        }
      }
    }

    // Detect WebView/Flutter context from user agent
    console.log('🔍 ========== STEP 3: DETECTING WEBVIEW CONTEXT ==========');
    const userAgent = req.headers['user-agent'] || '';
    const isWebView = /wv|WebView|flutter|Flutter/i.test(userAgent);
    const isFlutterWebView = /flutter|Flutter/i.test(userAgent) || 
                            req.query?.isWebView === 'true' || 
                            req.body?.isWebView === 'true';
    console.log('🔍 User Agent:', userAgent);
    console.log('🔍 Is WebView:', isWebView);
    console.log('🔍 Is Flutter WebView:', isFlutterWebView);
    console.log('🔍 ===================================================');

    // Build frontend callback URL
    console.log('🔗 ========== STEP 4: BUILDING FRONTEND CALLBACK URL ==========');
    console.log('🔗 FRONTEND_URL env:', process.env.FRONTEND_URL || 'NOT SET');
    console.log('🔗 NODE_ENV:', process.env.NODE_ENV);
    
    // CRITICAL: Ensure FRONTEND_URL is properly set and has no trailing slash
    // For WebView/APK, this should redirect to the frontend where the app is hosted
    let frontendBase = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://getfixfly.com' : 'http://localhost:8080');
    console.log('🔗 Frontend Base (initial):', frontendBase);
    
    // Remove trailing slash if present
    frontendBase = frontendBase.replace(/\/+$/, '');
    console.log('🔗 Frontend Base (after trim):', frontendBase);
    
    // Ensure it's a valid URL
    if (!frontendBase.startsWith('http://') && !frontendBase.startsWith('https://')) {
      frontendBase = `https://${frontendBase}`;
      console.log('🔗 Frontend Base (after protocol):', frontendBase);
    }
    
    // CRITICAL: For WebView, ensure we're redirecting to the correct frontend URL
    // In WebView, the frontend might be loaded from a different origin
    // Try to detect from referer if available
    if (isWebView || isFlutterWebView) {
      const referer = req.headers.referer || '';
      console.log('🔗 Referer:', referer);
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          // If referer is from getfixfly.com, use that as frontend base
          if (refererUrl.hostname.includes('getfixfly.com')) {
            frontendBase = `${refererUrl.protocol}//${refererUrl.hostname}`;
            console.log('🔧 ✅ WebView detected - using referer as frontend base:', frontendBase);
          }
        } catch (e) {
          console.warn('⚠️ Could not parse referer URL:', e.message);
        }
      }
    }
    
    console.log('🔗 ✅ Final Frontend Base:', frontendBase);
    const url = new URL('/payment-callback', frontendBase);
    console.log('🔗 ✅ Frontend Callback URL (base):', url.toString());
    console.log('🔗 ===================================================');
    
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
    console.log('🔗 ========== STEP 5: ADDING PAYMENT PARAMETERS TO URL ==========');
    if (razorpay_order_id) {
      url.searchParams.set('razorpay_order_id', razorpay_order_id);
      url.searchParams.set('order_id', razorpay_order_id);
      console.log('✅ Added Order ID:', razorpay_order_id.substring(0, 10) + '...');
    } else {
      console.warn('⚠️ Order ID missing - not adding to URL');
    }
    if (razorpay_payment_id) {
      url.searchParams.set('razorpay_payment_id', razorpay_payment_id);
      url.searchParams.set('payment_id', razorpay_payment_id);
      console.log('✅ Added Payment ID:', razorpay_payment_id.substring(0, 10) + '...');
    } else {
      console.warn('⚠️ Payment ID missing - not adding to URL');
    }
    if (razorpay_signature) {
      url.searchParams.set('razorpay_signature', razorpay_signature);
      url.searchParams.set('signature', razorpay_signature);
      console.log('✅ Added Signature: PRESENT');
    } else {
      console.warn('⚠️ Signature missing - not adding to URL');
    }
    if (bookingId) {
      url.searchParams.set('booking_id', bookingId);
      console.log('✅ Added Booking ID:', bookingId);
    } else {
      console.log('ℹ️ Booking ID not present');
    }
    if (ticketId) {
      url.searchParams.set('ticket_id', ticketId);
      console.log('✅ Added Ticket ID:', ticketId);
    } else {
      console.log('ℹ️ Ticket ID not present');
    }
    console.log('🔗 ✅ Final Callback URL with params:', url.toString());
    console.log('🔗 ===================================================');

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
        }
        
        // CRITICAL: Always check payment notes for booking_id/ticket_id (even if we have order_id)
        // This is important for WebView where URL params might not be passed correctly
        if (payment && payment.notes) {
          const notesBookingId = payment.notes.booking_id || payment.notes.bookingId;
          const notesTicketId = payment.notes.ticket_id || payment.notes.ticketId;
          
          if (notesBookingId && !bookingId) {
            bookingId = notesBookingId; // Update the variable
            url.searchParams.set('booking_id', notesBookingId);
            console.log('✅ Found booking ID from payment notes:', notesBookingId);
          }
          if (notesTicketId && !ticketId) {
            ticketId = notesTicketId; // Update the variable
            url.searchParams.set('ticket_id', notesTicketId);
            console.log('✅ Found ticket ID from payment notes:', notesTicketId);
          }
        }
        
        if (!payment || !payment.order_id) {
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

    // CRITICAL: If we have payment_id and order_id, verify payment immediately in backend
    // This ensures payment is verified even if frontend callback fails
    if (razorpay_payment_id && razorpay_order_id && !isPaymentFailed) {
      try {
        console.log('🔍 ========== STEP 6: VERIFYING PAYMENT IN CALLBACK HANDLER ==========');
        console.log('🔍 Payment ID:', razorpay_payment_id);
        console.log('🔍 Order ID:', razorpay_order_id);
        console.log('🔍 Booking ID:', bookingId || 'N/A');
        console.log('🔍 Ticket ID:', ticketId || 'N/A');
        console.log('🔍 Timestamp:', new Date().toISOString());
        console.log('🔍 ===================================================');
        
        // Import payment verification logic
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        
        // Fetch payment from Razorpay
        let payment = null;
        let retries = 3;
        while (retries > 0 && !payment) {
          try {
            payment = await rzp.payments.fetch(razorpay_payment_id);
            if (payment && (payment.status === 'captured' || payment.status === 'authorized')) {
              console.log('✅ Payment verified in callback handler:', {
                paymentId: razorpay_payment_id,
                status: payment.status,
                amount: payment.amount
              });
              break;
            }
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (e) {
            console.warn(`⚠️ Error fetching payment (retry ${4 - retries}/3):`, e.message);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        // If payment verified, update booking/ticket immediately
        if (payment && (payment.status === 'captured' || payment.status === 'authorized')) {
          console.log('✅ ========== STEP 6.1: PAYMENT VERIFIED - UPDATING BOOKING/TICKET ==========');
          console.log('✅ Payment Status:', payment.status);
          console.log('✅ Payment Amount:', payment.amount ? `₹${(payment.amount / 100).toFixed(2)}` : 'N/A');
          
          if (bookingId) {
            try {
              console.log('📝 Updating booking:', bookingId);
              const Booking = require('../models/Booking');
              const booking = await Booking.findById(bookingId);
              if (booking) {
                console.log('📝 Booking found:', booking._id);
                if (!booking.payment) {
                  booking.payment = {};
                }
                booking.payment.status = 'completed';
                booking.payment.method = 'online';
                booking.payment.transactionId = razorpay_payment_id;
                booking.payment.razorpayPaymentId = razorpay_payment_id;
                booking.payment.razorpayOrderId = razorpay_order_id;
                booking.payment.completedAt = new Date();
                booking.paymentStatus = 'payment_done';
                booking.status = 'completed';
                await booking.save();
                
                console.log('✅ ✅ ✅ BOOKING PAYMENT UPDATED IN CALLBACK ✅ ✅ ✅');
                console.log('✅ Booking ID:', booking._id);
                console.log('✅ Payment ID:', razorpay_payment_id);
                console.log('✅ Order ID:', razorpay_order_id);
                console.log('✅ Status: COMPLETED');
                console.log('✅ Timestamp:', new Date().toISOString());
              } else {
                console.warn('⚠️ Booking not found:', bookingId);
              }
            } catch (bookingError) {
              console.error('❌ Error updating booking in callback:', bookingError.message);
              console.error('❌ Stack:', bookingError.stack);
            }
          }
          
          if (ticketId) {
            try {
              const SupportTicket = require('../models/SupportTicket');
              const ticket = await SupportTicket.findOne({ ticketId });
              if (ticket) {
                ticket.paymentStatus = 'collected';
                ticket.paymentId = razorpay_payment_id;
                ticket.paymentCompletedAt = new Date();
                ticket.status = 'Resolved';
                ticket.resolvedAt = new Date();
                await ticket.save();
                
                console.log('✅ ✅ ✅ TICKET PAYMENT UPDATED IN CALLBACK ✅ ✅ ✅');
                console.log('✅ Ticket ID:', ticket.ticketId);
                console.log('✅ Payment ID:', razorpay_payment_id);
                console.log('✅ Status: RESOLVED');
              }
            } catch (ticketError) {
              console.error('❌ Error updating ticket in callback:', ticketError.message);
            }
          }
        }
      } catch (verifyError) {
        console.error('❌ Error verifying payment in callback:', verifyError.message);
        // Don't fail the callback, let frontend handle verification
      }
    }
    
    console.log('🔀 ========== STEP 7: REDIRECTING TO FRONTEND ==========');
    console.log('🔀 Is WebView:', isWebView);
    console.log('🔀 Is Flutter WebView:', isFlutterWebView);
    console.log('🔀 Redirect URL:', url.toString());
    console.log('🔀 Payment ID:', razorpay_payment_id || 'N/A');
    console.log('🔀 Order ID:', razorpay_order_id || 'N/A');
    console.log('🔀 Booking ID:', bookingId || 'N/A');
    console.log('🔀 Ticket ID:', ticketId || 'N/A');
    console.log('🔀 Timestamp:', new Date().toISOString());
    console.log('🔀 ===================================================');
    
    // CRITICAL: Simple redirect like RentYatra - no complex HTML
    // This is more reliable in WebView/APK scenarios
    console.log('🔀 Redirecting to frontend callback:', url.toString());
    return res.redirect(302, url.toString());

  } catch (err) {
    console.error('❌ Error in Razorpay callback handler:', err);
    // Simple redirect to frontend with error - like RentYatra
    const frontendBase = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://getfixfly.com' : 'http://localhost:8080');
    const fallbackUrl = `${frontendBase}/payment-callback?error=CALLBACK_ERROR&error_message=Payment callback processing failed`;
    console.log('⚠️ Using fallback redirect to:', fallbackUrl);
    res.redirect(302, fallbackUrl);
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
