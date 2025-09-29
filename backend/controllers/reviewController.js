const Review = require('../models/Review');
const User = require('../models/User');
const Card = require('../models/Card');
const { asyncHandler } = require('../middleware/asyncHandler');
// const { ErrorResponse } = require('../utils/errorResponse');

// @desc    Get all reviews (with filters)
// @route   GET /api/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  const {
    category,
    rating,
    featured,
    limit = 10,
    skip = 0,
    sort = 'newest'
  } = req.query;

  // Build filter object
  const filters = {
    status: 'approved'
  };

  if (category) {
    filters.category = category;
  }

  if (rating) {
    filters.rating = parseInt(rating);
  }

  if (featured === 'true') {
    filters.isFeatured = true;
  }

  // Build sort object
  let sortObj = {};
  switch (sort) {
    case 'newest':
      sortObj = { isFeatured: -1, createdAt: -1 };
      break;
    case 'oldest':
      sortObj = { isFeatured: -1, createdAt: 1 };
      break;
    case 'highest_rating':
      sortObj = { isFeatured: -1, rating: -1, createdAt: -1 };
      break;
    case 'lowest_rating':
      sortObj = { isFeatured: -1, rating: 1, createdAt: -1 };
      break;
    case 'most_liked':
      sortObj = { isFeatured: -1, likes: -1, createdAt: -1 };
      break;
    default:
      sortObj = { isFeatured: -1, createdAt: -1 };
  }

  const reviews = await Review.find(filters)
    .populate('userId', 'name profileImage')
    .populate('cardId', 'name speciality')
    .sort(sortObj)
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await Review.countDocuments(filters);

  res.status(200).json({
    success: true,
    count: reviews.length,
    total,
    data: reviews
  });
});

// @desc    Get featured reviews
// @route   GET /api/reviews/featured
// @access  Public
const getFeaturedReviews = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const reviews = await Review.getFeaturedReviews(parseInt(limit));

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get reviews by category
// @route   GET /api/reviews/category/:category
// @access  Public
const getReviewsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { limit = 10 } = req.query;

  const reviews = await Review.getReviewsByCategory(category, parseInt(limit));

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get user's reviews
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 10 } = req.query;

  const reviews = await Review.getUserReviews(userId, parseInt(limit));

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
const getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('userId', 'name profileImage')
    .populate('cardId', 'name speciality')
    .populate('bookingId', 'serviceType status');

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { category, rating, comment, cardId, bookingId, isAnonymous } = req.body;
  const userId = req.user.id;

  // Check if user already reviewed this category recently
  const existingReview = await Review.findOne({
    userId,
    category,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this category recently. Please wait before submitting another review.'
    });
  }

  // Create review
  const review = await Review.create({
    userId,
    category,
    rating,
    comment,
    cardId,
    bookingId,
    isAnonymous: isAnonymous || false,
    metadata: {
      source: 'web',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
  });

  // Populate the created review
  await review.populate('userId', 'name profileImage');
  if (cardId) {
    await review.populate('cardId', 'name speciality');
  }

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: review
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment, isAnonymous } = req.body;
  const userId = req.user.id;

  let review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if user owns the review or is admin
  if (review.userId.toString() !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this review'
    });
  }

  // Update fields
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  if (isAnonymous !== undefined) review.isAnonymous = isAnonymous;

  review = await review.save();

  // Populate the updated review
  await review.populate('userId', 'name profileImage');
  if (review.cardId) {
    await review.populate('cardId', 'name speciality');
  }

  res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if user owns the review or is admin
  if (review.userId.toString() !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this review'
    });
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Like/Unlike review
// @route   POST /api/reviews/:id/like
// @access  Private
const toggleLikeReview = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Toggle like
  await review.toggleLike(userId);

  res.status(200).json({
    success: true,
    message: 'Like toggled successfully',
    data: {
      likes: review.likes,
      isLiked: review.likedBy.includes(userId)
    }
  });
});

// @desc    Get review statistics
// @route   GET /api/reviews/stats/overview
// @access  Public
const getReviewStats = asyncHandler(async (req, res) => {
  const stats = await Review.getReviewStats();
  const categoryStats = await Review.getCategoryStats();

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {},
      categories: categoryStats
    }
  });
});

// @desc    Admin: Get all reviews (including pending)
// @route   GET /api/admin/reviews
// @access  Private (Admin)
const getAdminReviews = asyncHandler(async (req, res) => {
  const {
    status,
    category,
    rating,
    limit = 20,
    skip = 0,
    sort = 'newest'
  } = req.query;

  // Build filter object
  const filters = {};
  if (status) filters.status = status;
  if (category) filters.category = category;
  if (rating) filters.rating = parseInt(rating);

  // Build sort object
  let sortObj = {};
  switch (sort) {
    case 'newest':
      sortObj = { createdAt: -1 };
      break;
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'highest_rating':
      sortObj = { rating: -1, createdAt: -1 };
      break;
    case 'lowest_rating':
      sortObj = { rating: 1, createdAt: -1 };
      break;
    default:
      sortObj = { createdAt: -1 };
  }

  const reviews = await Review.find(filters)
    .populate('userId', 'name email phone')
    .populate('cardId', 'name speciality')
    .sort(sortObj)
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await Review.countDocuments(filters);

  res.status(200).json({
    success: true,
    count: reviews.length,
    total,
    data: reviews
  });
});

// @desc    Admin: Update review status
// @route   PUT /api/admin/reviews/:id/status
// @access  Private (Admin)
const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  review.status = status;
  await review.save();

  res.status(200).json({
    success: true,
    message: 'Review status updated successfully',
    data: review
  });
});

// @desc    Admin: Add response to review
// @route   POST /api/admin/reviews/:id/response
// @access  Private (Admin)
const addAdminResponse = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const adminId = req.user.id;

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  await review.addAdminResponse(message, adminId);

  res.status(200).json({
    success: true,
    message: 'Admin response added successfully',
    data: review
  });
});

// @desc    Admin: Toggle featured status
// @route   PUT /api/admin/reviews/:id/featured
// @access  Private (Admin)
const toggleFeatured = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  await review.toggleFeatured();

  res.status(200).json({
    success: true,
    message: 'Featured status toggled successfully',
    data: review
  });
});

module.exports = {
  getReviews,
  getFeaturedReviews,
  getReviewsByCategory,
  getUserReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  toggleLikeReview,
  getReviewStats,
  getAdminReviews,
  updateReviewStatus,
  addAdminResponse,
  toggleFeatured
};
