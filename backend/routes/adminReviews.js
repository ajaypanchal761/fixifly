const express = require('express');
const router = express.Router();
const {
  getAdminReviews,
  updateReviewStatus,
  addAdminResponse,
  toggleFeatured
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Admin routes
router.get('/', getAdminReviews);
router.put('/:id/status', updateReviewStatus);
router.post('/:id/response', addAdminResponse);
router.put('/:id/featured', toggleFeatured);

module.exports = router;
