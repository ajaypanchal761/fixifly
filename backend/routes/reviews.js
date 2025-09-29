const express = require('express');
const router = express.Router();
const {
  getReviews,
  getFeaturedReviews,
  getReviewsByCategory,
  getUserReviews,
  getReview,
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
router.get('/stats/overview', getReviewStats);
router.get('/:id', getReview);

// Protected routes (require authentication)
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/like', protect, toggleLikeReview);

module.exports = router;
