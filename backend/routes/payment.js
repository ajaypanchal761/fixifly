const express = require('express');
const {
  createOrder,
  verifyPayment,
  verifyPaymentById,
  getPaymentDetails,
  razorpayRedirectCallback,
  markPaymentFailed
} = require('../controllers/paymentController');

const router = express.Router();

// Public payment routes
router.route('/create-order')
  .post(createOrder); // Create Razorpay order

router.route('/verify')
  .post(verifyPayment); // Verify payment signature

router.route('/verify-by-id')
  .post(verifyPaymentById); // Verify payment by ID only (for WebView)

router.route('/mark-failed')
  .post(markPaymentFailed); // Mark payment as failed

// Razorpay callback route (for WebView/APK redirect mode)
router.route('/razorpay-callback')
  .all((req, res, next) => {
    // Log when route is hit - THESE WILL SHOW IN PM2 LOGS
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔔 🔔 🔔 PAYMENT CALLBACK ROUTE HIT 🔔 🔔 🔔');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔔 Method:', req.method);
    console.log('🔔 Path:', req.path);
    console.log('🔔 Full Path:', req.originalUrl);
    console.log('🔔 Query:', JSON.stringify(req.query));
    console.log('🔔 Body:', JSON.stringify(req.body));
    console.log('🔔 Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n');
    next();
  }, razorpayRedirectCallback); // Handle both GET and POST

router.route('/:paymentId')
  .get(getPaymentDetails); // Get payment details

module.exports = router;
