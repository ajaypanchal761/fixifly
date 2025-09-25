const express = require('express');
const {
  createOrder,
  verifyPayment,
  getPaymentDetails
} = require('../controllers/paymentController');

const router = express.Router();

// Public payment routes
router.route('/create-order')
  .post(createOrder); // Create Razorpay order

router.route('/verify')
  .post(verifyPayment); // Verify payment signature

router.route('/:paymentId')
  .get(getPaymentDetails); // Get payment details

module.exports = router;
