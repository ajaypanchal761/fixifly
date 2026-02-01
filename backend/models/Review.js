const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // User who wrote the review
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  // Service category being reviewed
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'AC Repair',
      'Washing Machine Repair',
      'Refrigerator Repair',
      'TV Repair',
      'Laptop Repair',
      'Desktop Repair',
      'Printer Repair',
      'General Service',
      'Customer Support',
      'Overall Experience',
      'Electronics Repair',
      'Plumbing Services',
      'Home Appliance',
      'IT Services',
      'Carpentry',
      'Electrical Work',
      'Mobile Specialist',
      'Tablet Specialist',
      'Mac Specialist',
      'Security Specialist',
      'Data Specialist'
    ]
  },

  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },

  // Review comment
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters long'],
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },

  // Optional: Link to specific booking/service
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },

  // Optional: Link to specific vendor/card
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: false
  },

  // Optional: Link to specific vendor
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: false
  },

  // Review status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'approved'
  },

  // Likes/helpful votes
  likes: {
    type: Number,
    default: 0
  },

  // Users who liked this review
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Admin response to the review
  adminResponse: {
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin response cannot exceed 500 characters']
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    respondedAt: {
      type: Date
    }
  },

  // Review metadata
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    },
    userAgent: String,
    ipAddress: String
  },

  // Flags
  isVerified: {
    type: Boolean,
    default: false // True if user has completed a booking
  },

  isFeatured: {
    type: Boolean,
    default: false // Admin can feature good reviews
  },

  isAnonymous: {
    type: Boolean,
    default: false // User can choose to be anonymous
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
reviewSchema.index({ userId: 1 });
reviewSchema.index({ category: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isFeatured: 1 });
reviewSchema.index({ cardId: 1 });
reviewSchema.index({ vendorId: 1 });
reviewSchema.index({ bookingId: 1 });

// Compound indexes
reviewSchema.index({ category: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, isFeatured: 1, createdAt: -1 });
reviewSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ bookingId: 1, userId: 1 });

// Virtual for user initials
reviewSchema.virtual('userInitials').get(function () {
  if (!this.populated('userId') || !this.userId.name) {
    return 'U';
  }

  const name = this.userId.name.trim();
  const words = name.split(' ');

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    return words[0][0].toUpperCase();
  }

  return 'U';
});

// Virtual for user display name
reviewSchema.virtual('userDisplayName').get(function () {
  if (this.isAnonymous) {
    return 'Anonymous User';
  }

  if (!this.populated('userId') || !this.userId.name) {
    return 'User';
  }

  return this.userId.name;
});

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function () {
  const now = new Date();
  const diffInMs = now - this.createdAt;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  } else if (diffInDays < 7) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
});

// Virtual for rating text
reviewSchema.virtual('ratingText').get(function () {
  const ratingTexts = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  return ratingTexts[this.rating] || 'Unknown';
});

// Pre-save middleware
reviewSchema.pre('save', function (next) {
  // Ensure user can't like their own review
  if (this.likedBy && this.likedBy.includes(this.userId)) {
    this.likedBy = this.likedBy.filter(id => !id.equals(this.userId));
  }

  // Update likes count
  this.likes = this.likedBy ? this.likedBy.length : 0;

  next();
});

// Instance methods
reviewSchema.methods.toggleLike = function (userId) {
  if (!this.likedBy) {
    this.likedBy = [];
  }

  const userIndex = this.likedBy.findIndex(id => id.equals(userId));

  if (userIndex > -1) {
    // User already liked, remove like
    this.likedBy.splice(userIndex, 1);
  } else {
    // User hasn't liked, add like
    this.likedBy.push(userId);
  }

  this.likes = this.likedBy.length;
  return this.save();
};

reviewSchema.methods.addAdminResponse = function (message, adminId) {
  this.adminResponse = {
    message: message,
    respondedBy: adminId,
    respondedAt: new Date()
  };

  return this.save();
};

reviewSchema.methods.updateStatus = function (status) {
  this.status = status;
  return this.save();
};

reviewSchema.methods.toggleFeatured = function () {
  this.isFeatured = !this.isFeatured;
  return this.save();
};

// Static methods
reviewSchema.statics.getApprovedReviews = function (filters = {}, limit = 10, skip = 0) {
  const query = {
    status: 'approved',
    ...filters
  };

  return this.find(query)
    .populate('userId', 'name profileImage')
    .populate('cardId', 'name speciality')
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

reviewSchema.statics.getReviewsByCategory = function (category, limit = 10) {
  return this.getApprovedReviews({ category }, limit);
};

reviewSchema.statics.getFeaturedReviews = function (limit = 5) {
  return this.getApprovedReviews({ isFeatured: true }, limit);
};

reviewSchema.statics.getRecentReviews = function (limit = 10) {
  return this.getApprovedReviews({}, limit);
};

reviewSchema.statics.getUserReviews = function (userId, limit = 10) {
  return this.find({ userId })
    .populate('cardId', 'name speciality')
    .populate('vendorId', 'firstName lastName vendorId')
    .sort({ createdAt: -1 })
    .limit(limit);
};

reviewSchema.statics.getVendorReviews = function (vendorId, limit = 10) {
  return this.find({ vendorId, status: 'approved' })
    .populate('userId', 'name profileImage')
    .populate('bookingId', 'bookingReference services')
    .sort({ createdAt: -1 })
    .limit(limit);
};

reviewSchema.statics.getVendorRatingStats = function (vendorId) {
  return this.aggregate([
    { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), status: 'approved' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
};

reviewSchema.statics.getReviewStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        approvedReviews: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        pendingReviews: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        averageRating: { $avg: '$rating' },
        featuredReviews: { $sum: { $cond: ['$isFeatured', 1, 0] } },
        totalLikes: { $sum: '$likes' },
        reviewsByCategory: {
          $push: {
            category: '$category',
            rating: '$rating',
            status: '$status'
          }
        }
      }
    }
  ]);
};

reviewSchema.statics.getCategoryStats = function () {
  return this.aggregate([
    {
      $match: { status: 'approved' }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        totalLikes: { $sum: '$likes' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Export the model
module.exports = mongoose.model('Review', reviewSchema);
