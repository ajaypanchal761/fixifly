const express = require('express');
const {
  getAllBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
  updateBookingPriority,
  assignVendor,
  processRefund,
  getBookingStats,
  deleteBooking
} = require('../controllers/adminBookingController');
const { protectAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

// Admin booking routes
router.route('/')
  .get(getAllBookings); // Get all bookings with filters and pagination

router.route('/stats')
  .get(getBookingStats); // Get booking statistics

router.route('/:id')
  .get(getBookingById) // Get single booking
  .put(updateBooking) // Update booking details
  .delete(deleteBooking); // Delete booking

router.route('/:id/status')
  .patch(updateBookingStatus); // Update booking status

router.route('/:id/priority')
  .patch(updateBookingPriority); // Update booking priority

router.route('/:id/assign-vendor')
  .patch(assignVendor); // Assign vendor to booking

router.route('/:id/refund')
  .post(processRefund); // Process refund for booking

module.exports = router;
