const express = require('express');
const router = express.Router();
const {
  getReviews,
  getFeaturedReviews,
  getReviewsByCategory,
  getUserReviews,
  getVendorReviews,
  getVendorRatingStats,
  getReview,
  getReviewsByBookingId,
  createReview,
  updateReview,
  deleteReview,
  toggleLikeReview,
  getReviewStats
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getReviews);
router.get('/featured', getFeaturedReviews);
router.get('/category/:category', getReviewsByCategory);
router.get('/user/:userId', getUserReviews);
router.get('/vendor/:vendorId', getVendorReviews);
router.get('/vendor/:vendorId/stats', getVendorRatingStats);
router.get('/booking/:bookingId', getReviewsByBookingId);
router.get('/stats/overview', getReviewStats);
router.get('/:id', getReview);

// Test route without authentication
router.post('/test', (req, res) => {
  console.log('Test review endpoint hit');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({ success: true, message: 'Test endpoint working' });
});

// Test route with authentication
router.post('/test-auth', protect, (req, res) => {
  console.log('Test auth endpoint hit');
  console.log('User:', req.user);
  res.json({ success: true, message: 'Auth test endpoint working', user: req.user });
});

// Protected routes (require authentication)
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/like', protect, toggleLikeReview);

module.exports = router;
