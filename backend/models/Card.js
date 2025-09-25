const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Provider name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  speciality: {
    type: String,
    required: [true, 'Speciality is required'],
    trim: true,
    enum: [
      'Electronics Repair',
      'Plumbing Services', 
      'AC Repair',
      'Home Appliance',
      'IT Services',
      'Carpentry',
      'Electrical Work',
      'Laptop Repair',
      'Desktop Specialist',
      'Mac Specialist',
      'Mobile Specialist',
      'Tablet Specialist',
      'Printer Specialist',
      'Security Specialist',
      'Data Specialist'
    ]
  },
  
  subtitle: {
    type: String,
    required: [true, 'Subtitle is required'],
    trim: true,
    maxlength: [100, 'Subtitle cannot exceed 100 characters']
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  priceDisplay: {
    type: String,
    required: [true, 'Price display is required'],
    trim: true,
    default: function() {
      return `Starting at ₹${this.price}`;
    }
  },
  
  // Image
  image: {
    type: String,
    required: [true, 'Provider image is required'],
    trim: true
  },
  
  // Status and Visibility
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  
  isPopular: {
    type: Boolean,
    default: false
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Ratings and Reviews
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  
  totalReviews: {
    type: Number,
    default: 0,
    min: [0, 'Total reviews cannot be negative']
  },
  
  // Job Statistics
  completedJobs: {
    type: Number,
    default: 0,
    min: [0, 'Completed jobs cannot be negative']
  },
  
  totalJobs: {
    type: Number,
    default: 0,
    min: [0, 'Total jobs cannot be negative']
  },
  
  // Provider Information
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for now, can be linked to vendor later
  },
  
  // Location Information
  location: {
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State name cannot exceed 50 characters']
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode']
    }
  },
  
  // Service Details
  serviceDetails: {
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    experience: {
      type: String,
      trim: true,
      maxlength: [100, 'Experience cannot exceed 100 characters']
    },
    certifications: [{
      type: String,
      trim: true
    }],
    languages: [{
      type: String,
      trim: true,
      enum: ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Marathi', 'Punjabi', 'Urdu']
    }]
  },
  
  // Availability
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '18:00'
      }
    },
    workingDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }]
  },
  
  // Admin Management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // SEO and Display
  displayOrder: {
    type: Number,
    default: 0
  },
  
  // Statistics
  stats: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    bookings: {
      type: Number,
      default: 0
    },
    lastViewedAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
cardSchema.index({ name: 1 });
cardSchema.index({ speciality: 1 });
cardSchema.index({ status: 1 });
cardSchema.index({ isPopular: 1 });
cardSchema.index({ isFeatured: 1 });
cardSchema.index({ rating: -1 });
cardSchema.index({ 'location.city': 1 });
cardSchema.index({ 'location.state': 1 });
cardSchema.index({ createdAt: -1 });
cardSchema.index({ displayOrder: 1 });

// Virtual for formatted price
cardSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price}`;
});

// Virtual for completion rate
cardSchema.virtual('completionRate').get(function() {
  if (this.totalJobs === 0) return 0;
  return Math.round((this.completedJobs / this.totalJobs) * 100);
});

// Virtual for full location
cardSchema.virtual('fullLocation').get(function() {
  if (!this.location.city) return null;
  
  const parts = [
    this.location.city,
    this.location.state,
    this.location.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Pre-save middleware to update price display
cardSchema.pre('save', function(next) {
  if (this.isModified('price')) {
    this.priceDisplay = `Starting at ₹${this.price}`;
  }
  next();
});

// Method to increment view count
cardSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  this.stats.lastViewedAt = new Date();
  return this.save();
};

// Method to increment click count
cardSchema.methods.incrementClicks = function() {
  this.stats.clicks += 1;
  return this.save();
};

// Method to increment booking count
cardSchema.methods.incrementBookings = function() {
  this.stats.bookings += 1;
  this.totalJobs += 1;
  return this.save();
};

// Method to update rating
cardSchema.methods.updateRating = function(newRating, isCompleted = false) {
  if (isCompleted) {
    this.completedJobs += 1;
  }
  
  // Calculate new average rating
  const totalRating = (this.rating * this.totalReviews) + newRating;
  this.totalReviews += 1;
  this.rating = Math.round((totalRating / this.totalReviews) * 10) / 10; // Round to 1 decimal place
  
  return this.save();
};

// Method to toggle status
cardSchema.methods.toggleStatus = function() {
  this.status = this.status === 'active' ? 'inactive' : 'active';
  return this.save();
};

// Method to toggle popular status
cardSchema.methods.togglePopular = function() {
  this.isPopular = !this.isPopular;
  return this.save();
};

// Method to toggle featured status
cardSchema.methods.toggleFeatured = function() {
  this.isFeatured = !this.isFeatured;
  return this.save();
};

// Static method to get cards by speciality
cardSchema.statics.getBySpeciality = function(speciality, limit = 10) {
  return this.find({ 
    speciality, 
    status: 'active' 
  })
  .sort({ isFeatured: -1, rating: -1, displayOrder: 1 })
  .limit(limit);
};

// Static method to get popular cards
cardSchema.statics.getPopular = function(limit = 10) {
  return this.find({ 
    isPopular: true, 
    status: 'active' 
  })
  .sort({ rating: -1, displayOrder: 1 })
  .limit(limit);
};

// Static method to get featured cards
cardSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ 
    isFeatured: true, 
    status: 'active' 
  })
  .sort({ displayOrder: 1, rating: -1 })
  .limit(limit);
};

// Static method to search cards
cardSchema.statics.searchCards = function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    ...filters
  };
  
  if (query) {
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { speciality: { $regex: query, $options: 'i' } },
      { subtitle: { $regex: query, $options: 'i' } },
      { 'serviceDetails.description': { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ];
  }
  
  return this.find(searchQuery)
    .sort({ isFeatured: -1, isPopular: -1, rating: -1, displayOrder: 1 });
};

// Static method to get card statistics
cardSchema.statics.getCardStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalCards: { $sum: 1 },
        activeCards: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        popularCards: { $sum: { $cond: ['$isPopular', 1, 0] } },
        featuredCards: { $sum: { $cond: ['$isFeatured', 1, 0] } },
        averageRating: { $avg: '$rating' },
        totalViews: { $sum: '$stats.views' },
        totalClicks: { $sum: '$stats.clicks' },
        totalBookings: { $sum: '$stats.bookings' },
        cardsBySpeciality: {
          $push: {
            speciality: '$speciality',
            status: '$status'
          }
        }
      }
    }
  ]);
};

// Export the model
module.exports = mongoose.model('Card', cardSchema);
