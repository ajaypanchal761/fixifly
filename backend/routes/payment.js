const express = require('express');
const {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  processRefund,
  getPaymentMethods
} = require('../controllers/paymentController');

const router = express.Router();

// Public payment routes
router.route('/create-order')
  .post(createOrder); // Create Razorpay order

router.route('/verify')
  .post(verifyPayment); // Verify payment signature

router.route('/methods')
  .get(getPaymentMethods); // Get available payment methods

router.route('/:paymentId')
  .get(getPaymentDetails); // Get payment details

router.route('/:paymentId/refund')
  .post(processRefund); // Process refund

module.exports = router;
