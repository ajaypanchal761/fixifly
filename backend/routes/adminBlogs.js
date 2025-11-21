const express = require('express');
const router = express.Router();
const {
  getAdminBlogs,
  getAdminBlog,
  createBlog,
  updateBlog,
  uploadBlogImage,
  deleteBlog,
  toggleBlogStatus,
  getBlogStats
} = require('../controllers/blogController');
const { protectAdmin } = require('../middleware/adminAuth');
const uploadMiddleware = require('../middleware/upload');

// All routes are protected and require admin authentication
router.use(protectAdmin);

// @route   GET /api/admin/blogs
// @desc    Get all blogs for admin
// @access  Private (Admin)
router.get('/', getAdminBlogs);

// @route   GET /api/admin/blogs/stats
// @desc    Get blog statistics
// @access  Private (Admin)
router.get('/stats', getBlogStats);

// @route   GET /api/admin/blogs/:id
// @desc    Get single blog for admin
// @access  Private (Admin)
router.get('/:id', getAdminBlog);

// @route   POST /api/admin/blogs
// @desc    Create new blog
// @access  Private (Admin)
router.post('/', createBlog);

// @route   PUT /api/admin/blogs/:id
// @desc    Update blog
// @access  Private (Admin)
router.put('/:id', updateBlog);

// @route   POST /api/admin/blogs/:id/image
// @desc    Upload blog featured image
// @access  Private (Admin)
router.post('/:id/image', 
  uploadMiddleware.singleBlogImage(),
  uploadMiddleware.handleUploadError,
  uploadBlogImage
);

// @route   PUT /api/admin/blogs/:id/status
// @desc    Toggle blog status
// @access  Private (Admin)
router.put('/:id/status', toggleBlogStatus);

// @route   DELETE /api/admin/blogs/:id
// @desc    Delete blog
// @access  Private (Admin)
router.delete('/:id', deleteBlog);

module.exports = router;
