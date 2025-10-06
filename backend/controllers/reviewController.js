const Review = require('../models/Review');
const User = require('../models/User');
const Card = require('../models/Card');
const { asyncHandler } = require('../middleware/asyncHandler');
// const { ErrorResponse } = require('../utils/errorResponse');

// @desc    Get all reviews (with filters)
// @route   GET /api/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  try {
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

    // Get reviews and safely populate user and card data
    const reviews = await Review.find(filters)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Safely populate user and card data
    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        try {
          // Populate user data if userId exists
          if (review.userId) {
            const user = await User.findById(review.userId).select('name profileImage');
            review.userId = user;
          }
          
          // Populate card data if cardId exists
          if (review.cardId) {
            const card = await Card.findById(review.cardId).select('name speciality');
            review.cardId = card;
          }
          
          return review;
        } catch (error) {
          console.error('Error populating review data:', error);
          // Return review without populated data if there's an error
          return review;
        }
      })
    );

    // Show reviews even if user or card data is missing, but provide fallback data
    const validReviews = populatedReviews.map(review => {
      // Provide fallback data if user or card is missing
      if (!review.userId) {
        review.userId = { name: 'Anonymous User', profileImage: null };
      }
      if (!review.cardId) {
        review.cardId = { name: 'Unknown Service', speciality: 'General' };
      }
      return review;
    });

    const total = await Review.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: validReviews.length,
      total,
      data: validReviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// @desc    Get featured reviews
// @route   GET /api/reviews/featured
// @access  Public
const getFeaturedReviews = asyncHandler(async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Get featured reviews without populate to avoid null reference errors
    const reviews = await Review.find({
      status: 'approved',
      isFeatured: true
    })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(parseInt(limit));

    // Safely populate user and card data
    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        try {
          // Populate user data if userId exists
          if (review.userId) {
            const user = await User.findById(review.userId).select('name profileImage');
            review.userId = user;
          }
          
          // Populate card data if cardId exists
          if (review.cardId) {
            const card = await Card.findById(review.cardId).select('name speciality');
            review.cardId = card;
          }
          
          return review;
        } catch (error) {
          console.error('Error populating featured review data:', error);
          return review;
        }
      })
    );

    // Show reviews even if user or card data is missing, but provide fallback data
    const validReviews = populatedReviews.map(review => {
      if (!review.userId) {
        review.userId = { name: 'Anonymous User', profileImage: null };
      }
      if (!review.cardId) {
        review.cardId = { name: 'Unknown Service', speciality: 'General' };
      }
      return review;
    });

    res.status(200).json({
      success: true,
      count: validReviews.length,
      data: validReviews
    });
  } catch (error) {
    console.error('Error fetching featured reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured reviews',
      error: error.message
    });
  }
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
  try {
    const { category, rating, comment, cardId, bookingId, isAnonymous } = req.body;
    
    // Log the request data for debugging
    console.log('Review submission data:', {
      category,
      rating,
      comment: comment ? comment.substring(0, 50) + '...' : 'No comment',
      cardId,
      bookingId,
      isAnonymous,
      userId: req.user?.userId,
      authHeader: req.headers.authorization,
      userAgent: req.get('User-Agent')
    });

    // Validate required fields
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required'
      });
    }

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    if (comment.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be at least 10 characters long'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const userId = req.user.userId;

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
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment, isAnonymous } = req.body;
  const userId = req.user.userId;

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
  const userId = req.user.userId;

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
  const userId = req.user.userId;

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
  getReviewStats
};
