const express = require('express');
const { 
  createBooking, 
  createBookingWithPayment, 
  getBookingById, 
  getBookingsByCustomer, 
  getBookingsByVendor, 
  updateBookingStatus, 
  getBookingStats,
  acceptTask,
  declineTask,
  completeTask,
  cancelBooking,
  cancelBookingByUser,
  rescheduleBookingByUser,
  rescheduleBooking,
  createPaymentOrder,
  verifyPayment,
  checkFirstTimeUser
} = require('../controllers/bookingController');
const { protectVendor, optionalVendorAuth } = require('../middleware/vendorAuth');

const router = express.Router();

// Public booking routes (no authentication required for now)
router.route('/')
  .post(createBooking); // Create new booking

router.route('/with-payment')
  .post((req, res, next) => {
    // CRITICAL: Log when route is hit - THESE WILL SHOW IN PM2 LOGS
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💳 💳 💳 BOOKING WITH PAYMENT ROUTE HIT 💳 💳 💳');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💳 Method:', req.method);
    console.log('💳 Path:', req.path);
    console.log('💳 Full Path:', req.originalUrl);
    console.log('💳 Query:', JSON.stringify(req.query));
    console.log('💳 Body Keys:', Object.keys(req.body || {}));
    console.log('💳 Has Payment Data:', !!(req.body?.paymentData));
    console.log('💳 Has Customer:', !!(req.body?.customer));
    console.log('💳 Has Services:', !!(req.body?.services));
    console.log('💳 Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n');
    next();
  }, createBookingWithPayment); // Create booking with payment verification

router.route('/stats')
  .get(getBookingStats); // Get booking statistics

router.route('/check-first-time')
  .post(checkFirstTimeUser); // Check if user is first-time user

// Test endpoint to check booking routes
router.route('/test')
  .get((req, res) => {
    res.json({
      success: true,
      message: 'Booking routes are working',
      timestamp: new Date().toISOString()
    });
  });

// Test endpoint to check vendor authentication
router.route('/test-auth')
  .get(protectVendor, (req, res) => {
    res.json({
      success: true,
      message: 'Vendor authentication is working',
      vendor: req.vendor,
      timestamp: new Date().toISOString()
    });
  });

router.route('/:id')
  .get(optionalVendorAuth, getBookingById); // Get booking by ID

router.route('/:id/status')
  .patch(updateBookingStatus); // Update booking status

router.route('/:id/accept')
  .patch(protectVendor, acceptTask); // Accept task by vendor

router.route('/:id/decline')
  .patch(protectVendor, declineTask); // Decline task by vendor

router.route('/:id/complete')
  .patch(protectVendor, completeTask); // Complete task by vendor

router.route('/:id/cancel')
  .patch(protectVendor, cancelBooking); // Cancel task by vendor

router.route('/:id/cancel-by-user')
  .patch(cancelBookingByUser); // Cancel booking by user

router.route('/:id/reschedule-by-user')
  .patch(rescheduleBookingByUser); // Reschedule booking by user

router.route('/:id/reschedule')
  .patch(protectVendor, rescheduleBooking); // Reschedule task by vendor

router.route('/payment/create-order')
  .post(createPaymentOrder); // Create payment order for completed task

router.route('/payment/verify')
  .post(verifyPayment); // Verify payment and update booking status

// Test endpoint to check Razorpay configuration
router.route('/payment/test-config')
  .get((req, res) => {
    const RazorpayService = require('../services/razorpayService');
    const isConfigured = RazorpayService.isConfigured();
    res.json({
      success: true,
      razorpayConfigured: isConfigured,
      hasKeyId: !!process.env.RAZORPAY_KEY_ID,
      hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
      keyIdLength: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.length : 0
    });
  });


router.route('/customer/:email')
  .get(getBookingsByCustomer); // Get bookings by customer email

// Protected vendor routes (must come before /vendor/:vendorId)
router.route('/vendor/me')
  .get(protectVendor, (req, res) => {
    // Use the vendor's custom vendorId from the authenticated request
    req.params.vendorId = req.vendor.vendorId;
    getBookingsByVendor(req, res);
  }); // Get current vendor's bookings

router.route('/vendor/:vendorId')
  .get(getBookingsByVendor); // Get bookings assigned to vendor

module.exports = router;
