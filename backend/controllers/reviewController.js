const mongoose = require('mongoose');
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
    console.log('=== REVIEW CREATION REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User from auth middleware:', req.user);
    console.log('Authorization header:', req.headers.authorization);
    console.log('Authorization header type:', typeof req.headers.authorization);
    console.log('Authorization header value:', JSON.stringify(req.headers.authorization));
    
    const { category, rating, comment, cardId, vendorId, bookingId, isAnonymous } = req.body;
    
    // Log the request data for debugging
    console.log('Review submission data:', {
      category,
      rating,
      comment: comment ? comment.substring(0, 50) + '...' : 'No comment',
      cardId,
      vendorId,
      bookingId,
      isAnonymous,
      userId: req.user?.userId,
      authHeader: req.headers.authorization ? 'Present' : 'Missing',
      userAgent: req.get('User-Agent')
    });

    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      console.log('Auth check failed:', { user: req.user, userId: req.user?.userId });
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const userId = req.user.userId;

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

    // Validate category against enum values
    const validCategories = [
      'AC Repair', 'Washing Machine Repair', 'Refrigerator Repair', 'TV Repair',
      'Laptop Repair', 'Desktop Repair', 'Printer Repair', 'General Service',
      'Customer Support', 'Overall Experience', 'Electronics Repair', 'Plumbing Services',
      'Home Appliance', 'IT Services', 'Carpentry', 'Electrical Work',
      'Mobile Specialist', 'Tablet Specialist', 'Mac Specialist', 'Security Specialist', 'Data Specialist'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Check if user already reviewed this specific booking
    if (bookingId) {
      const existingReview = await Review.findOne({
        userId,
        bookingId
      });

      console.log('Checking for existing review for booking:', bookingId);
      console.log('Existing review found:', existingReview ? 'Yes' : 'No');

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this booking. Each booking can only be reviewed once.'
        });
      }
    } else {
      // For general reviews (not linked to specific booking), check for recent reviews
      const existingReviewQuery = {
        userId,
        category,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days
      };

      console.log('Checking for existing general review with query:', existingReviewQuery);
      const existingReview = await Review.findOne(existingReviewQuery);
      console.log('Existing review found:', existingReview ? 'Yes' : 'No');

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this category recently. Please wait before submitting another review.'
        });
      }
    }

    // Create review data object
    const reviewData = {
      userId,
      category,
      rating,
      comment,
      isAnonymous: isAnonymous || false,
      metadata: {
        source: 'web',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    };

    // Add optional fields only if they exist and are valid
    if (cardId && cardId.trim()) {
      reviewData.cardId = cardId;
    }
    if (vendorId && vendorId.trim()) {
      reviewData.vendorId = vendorId;
    }
    if (bookingId && bookingId.trim()) {
      reviewData.bookingId = bookingId;
    }

    console.log('Creating review with data:', reviewData);

    // Validate ObjectId format for vendorId if provided
    if (reviewData.vendorId && !mongoose.Types.ObjectId.isValid(reviewData.vendorId)) {
      console.error('Invalid vendorId format:', reviewData.vendorId);
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID format'
      });
    }

    // Validate ObjectId format for bookingId if provided
    if (reviewData.bookingId && !mongoose.Types.ObjectId.isValid(reviewData.bookingId)) {
      console.error('Invalid bookingId format:', reviewData.bookingId);
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    // Create review
    const review = await Review.create(reviewData);

    // Populate the created review
    await review.populate('userId', 'name profileImage');
    if (cardId) {
      await review.populate('cardId', 'name speciality');
    }
    if (vendorId) {
      await review.populate('vendorId', 'firstName lastName vendorId');
      
      // Update vendor rating after review submission
      try {
        const Vendor = require('../models/Vendor');
        const vendor = await Vendor.findById(vendorId);
        if (vendor) {
          await vendor.updateRating();
          console.log('Vendor rating updated successfully');
        }
      } catch (error) {
        console.error('Error updating vendor rating:', error);
        // Don't fail the review submission if rating update fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    // Check if it's a duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate review detected'
      });
    }
    
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

// @desc    Get vendor reviews
// @route   GET /api/reviews/vendor/:vendorId
// @access  Public
const getVendorReviews = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { limit = 10 } = req.query;

    console.log('🔍 Getting vendor reviews for vendorId:', vendorId);
    console.log('🔍 Limit:', limit);

    // Validate vendorId format
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      console.log('❌ Invalid vendorId format:', vendorId);
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID format'
      });
    }

    const reviews = await Review.getVendorReviews(vendorId, parseInt(limit));
    console.log('✅ Found reviews:', reviews.length);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('❌ Error in getVendorReviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor reviews',
      error: error.message
    });
  }
});

// @desc    Get vendor rating statistics
// @route   GET /api/reviews/vendor/:vendorId/stats
// @access  Public
const getVendorRatingStats = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.params;

    console.log('📊 Getting vendor rating stats for vendorId:', vendorId);

    // Validate vendorId format
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      console.log('❌ Invalid vendorId format:', vendorId);
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID format'
      });
    }

    const stats = await Review.getVendorRatingStats(vendorId);
    const result = stats[0] || { totalReviews: 0, averageRating: 0, ratingDistribution: [] };

    console.log('📊 Raw stats result:', result);

    // Calculate rating distribution
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    if (result.ratingDistribution && Array.isArray(result.ratingDistribution)) {
      result.ratingDistribution.forEach(rating => {
        if (ratingDistribution[rating] !== undefined) {
          ratingDistribution[rating]++;
        }
      });
    }

    const responseData = {
      totalReviews: result.totalReviews || 0,
      averageRating: result.averageRating ? Math.round(result.averageRating * 10) / 10 : 0,
      ratingDistribution
    };

    console.log('📊 Final response data:', responseData);

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ Error in getVendorRatingStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor rating statistics',
      error: error.message
    });
  }
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


// @desc    Get reviews by booking ID
// @route   GET /api/reviews/booking/:bookingId
// @access  Public
const getReviewsByBookingId = asyncHandler(async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    const reviews = await Review.find({ bookingId })
      .populate('userId', 'name email')
      .populate('vendorId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching reviews by booking ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

module.exports = {
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
};
