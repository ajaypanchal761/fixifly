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

// Test endpoint to verify callback route is accessible
router.route('/test-callback')
  .all((req, res) => {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🧪 🧪 🧪 CALLBACK ROUTE TEST ENDPOINT HIT 🧪 🧪 🧪');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🧪 Method:', req.method);
    console.log('🧪 Path:', req.path);
    console.log('🧪 Full Path:', req.originalUrl);
    console.log('🧪 Query:', JSON.stringify(req.query));
    console.log('🧪 IP:', req.ip || req.connection.remoteAddress);
    console.log('🧪 User-Agent:', req.headers['user-agent'] || 'N/A');
    console.log('🧪 Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n');
    
    res.json({
      success: true,
      message: 'Payment callback route is accessible',
      path: req.path,
      fullPath: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      serverTime: new Date().toISOString()
    });
  });

// Razorpay callback route (for WebView/APK redirect mode)
router.route('/razorpay-callback')
  .all((req, res, next) => {
    // CRITICAL: Log immediately when route is hit - THESE WILL SHOW IN PM2 LOGS
    // Use process.stdout.write to ensure immediate flush
    process.stdout.write('\n');
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔔 🔔 🔔 PAYMENT CALLBACK ROUTE HIT 🔔 🔔 🔔');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔔 Method:', req.method);
    console.log('🔔 Path:', req.path);
    console.log('🔔 Full Path:', req.originalUrl);
    console.log('🔔 Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('🔔 Query:', JSON.stringify(req.query, null, 2));
    console.log('🔔 Body:', JSON.stringify(req.body, null, 2));
    console.log('🔔 Headers:', JSON.stringify({
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'referer': req.headers.referer,
      'origin': req.headers.origin
    }, null, 2));
    console.log('🔔 IP:', req.ip || req.connection.remoteAddress);
    console.log('🔔 Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n');
    // Force flush
    if (process.stdout.isTTY) {
      process.stdout.write('');
    }
    next();
  }, razorpayRedirectCallback); // Handle both GET and POST

router.route('/:paymentId')
  .get(getPaymentDetails); // Get payment details

module.exports = router;
