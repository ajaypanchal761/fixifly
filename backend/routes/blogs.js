const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlogBySlug,
  getFeaturedBlogs,
  getRecentBlogs,
  getPopularBlogs,
  getBlogCategories,
  likeBlog,
  unlikeBlog,
  getLikeStatus
} = require('../controllers/blogController');

// ==================== PUBLIC ROUTES ====================

// @route   GET /api/blogs
// @desc    Get all published blogs
// @access  Public
router.get('/', getBlogs);

// @route   GET /api/blogs/featured
// @desc    Get featured blogs
// @access  Public
router.get('/featured', getFeaturedBlogs);

// @route   GET /api/blogs/recent
// @desc    Get recent blogs
// @access  Public
router.get('/recent', getRecentBlogs);

// @route   GET /api/blogs/popular
// @desc    Get popular blogs
// @access  Public
router.get('/popular', getPopularBlogs);

// @route   GET /api/blogs/categories
// @desc    Get blog categories
// @access  Public
router.get('/categories', getBlogCategories);

// @route   POST /api/blogs/:id/like
// @desc    Like a blog
// @access  Public
router.post('/:id/like', likeBlog);

// @route   POST /api/blogs/:id/unlike
// @desc    Unlike a blog
// @access  Public
router.post('/:id/unlike', unlikeBlog);

// @route   GET /api/blogs/:id/like-status
// @desc    Check if user has liked a blog
// @access  Public
router.get('/:id/like-status', getLikeStatus);

// @route   GET /api/blogs/:slug
// @desc    Get single blog by slug
// @access  Public
router.get('/:slug', getBlogBySlug);

module.exports = router;
