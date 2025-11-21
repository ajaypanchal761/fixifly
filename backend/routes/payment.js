const express = require('express');
const {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  createPaymentLink
} = require('../controllers/paymentController');

const router = express.Router();

// Middleware to log payment route requests
router.use((req, res, next) => {
  console.log('[PaymentRoute]', req.method, req.originalUrl || req.path, {
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  next();
});

// Public payment routes
router.route('/create-order')
  .post(createOrder); // Create Razorpay order

router.route('/create-payment-link')
  .post(createPaymentLink); // Create Razorpay payment link for webview

router.route('/verify')
  .post(verifyPayment); // Verify payment signature

router.route('/:paymentId')
  .get(getPaymentDetails); // Get payment details

module.exports = router;
