const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    minlength: [2, 'Service name must be at least 2 characters long'],
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Unique Service ID
  serviceId: {
    type: String,
    unique: true,
    required: true,
    match: [/^SVC\d{4}$/, 'Service ID must be in format SVC0001, SVC0002, etc.']
  },
  
  // Category and Tab Information
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  
  serviceTab: {
    type: String,
    required: [true, 'Service tab is required']
  },
  
  // Service Images
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Pricing Information
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative']
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR']
    },
    isOnSale: {
      type: Boolean,
      default: false
    },
    saleStartDate: Date,
    saleEndDate: Date,
    priceType: {
      type: String,
      enum: ['fixed', 'hourly', 'per_unit', 'custom'],
      default: 'fixed'
    }
  },
  
  // Service Duration and Availability
  duration: {
    estimatedTime: {
      type: String,
      required: true,
      default: '1 hour'
    },
    minDuration: {
      type: Number,
      default: 30 // in minutes
    },
    maxDuration: {
      type: Number,
      default: 480 // in minutes (8 hours)
    }
  },
  
  // Service Requirements
  requirements: {
    tools: [String],
    materials: [String],
    skills: [String],
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    certifications: [String]
  },
  
  // Service Specifications
  specifications: {
    serviceType: {
      type: String,
      enum: ['repair', 'maintenance', 'installation', 'consultation', 'inspection', 'other'],
      default: 'repair'
    },
    warranty: {
      period: Number,
      unit: {
        type: String,
        enum: ['days', 'months', 'years'],
        default: 'months'
      },
      description: String
    },
    coverage: {
      type: String,
      enum: ['local', 'regional', 'national'],
      default: 'local'
    },
    serviceArea: [String] // Cities or areas where service is available
  },
  
  // Service Status and Visibility
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'discontinued'],
    default: 'active'
  },
  
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Service Tags and Attributes
  tags: [String],
  
  attributes: [{
    name: String,
    value: String,
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'list'],
      default: 'text'
    }
  }],
  
  // Related Services
  relatedServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  
  // Service Statistics
  stats: {
    views: {
      type: Number,
      default: 0
    },
    bookings: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    },
    cancelled: {
      type: Number,
      default: 0
    },
    reviews: {
      count: {
        type: Number,
        default: 0
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      }
    }
  },
  
  // Vendor Information (if service is vendor-specific)
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  
  // Admin Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
serviceSchema.index({ name: 'text', description: 'text' });
serviceSchema.index({ category: 1 });
serviceSchema.index({ serviceTab: 1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ isAvailable: 1 });
serviceSchema.index({ isFeatured: 1 });
serviceSchema.index({ vendor: 1 });
serviceSchema.index({ 'pricing.basePrice': 1 });
serviceSchema.index({ createdAt: -1 });

// Virtual for primary image
serviceSchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg ? primaryImg.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Virtual for current price
serviceSchema.virtual('currentPrice').get(function() {
  if (this.pricing.isOnSale && this.pricing.discountPrice) {
    const now = new Date();
    if (this.pricing.saleStartDate && this.pricing.saleEndDate) {
      if (now >= this.pricing.saleStartDate && now <= this.pricing.saleEndDate) {
        return this.pricing.discountPrice;
      }
    }
  }
  return this.pricing.basePrice;
});

// Virtual for service availability
serviceSchema.virtual('isServiceAvailable').get(function() {
  return this.isAvailable && this.status === 'active';
});

// Pre-save middleware to generate service ID
serviceSchema.pre('save', async function(next) {
  if (this.isNew && !this.serviceId) {
    this.serviceId = await Service.generateServiceId();
  }
  
  // Ensure only one primary image
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Keep only the first primary image
      this.images.forEach((img, index) => {
        if (index > 0) img.isPrimary = false;
      });
    }
  }
  
  this.updatedAt = new Date();
  next();
});

// Static method to generate unique service ID
serviceSchema.statics.generateServiceId = async function() {
  const count = await this.countDocuments();
  const serviceId = `SVC${String(count + 1).padStart(4, '0')}`;
  
  // Check if ID already exists (very unlikely but safe)
  const existing = await this.findOne({ serviceId });
  if (existing) {
    return this.generateServiceId();
  }
  
  return serviceId;
};

// Static method to get services by category
serviceSchema.statics.getByCategory = function(categoryId, options = {}) {
  const query = { category: categoryId, status: 'active', isAvailable: true };
  
  if (options.serviceTab) {
    query.serviceTab = options.serviceTab;
  }
  
  if (options.featured) {
    query.isFeatured = true;
  }
  
  return this.find(query)
    .populate('category', 'name slug')
    .populate('vendor', 'firstName lastName vendorId')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20);
};

// Static method to search services
serviceSchema.statics.searchServices = function(searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'active',
    isAvailable: true
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.serviceTab) {
    query.serviceTab = options.serviceTab;
  }
  
  if (options.vendor) {
    query.vendor = options.vendor;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('category', 'name slug')
    .populate('vendor', 'firstName lastName vendorId')
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20);
};

// Static method to get featured services
serviceSchema.statics.getFeaturedServices = function(limit = 10) {
  return this.find({ 
    isFeatured: true, 
    status: 'active', 
    isAvailable: true 
  })
  .populate('category', 'name slug')
  .populate('vendor', 'firstName lastName vendorId')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to get services by vendor
serviceSchema.statics.getByVendor = function(vendorId, options = {}) {
  const query = { vendor: vendorId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('category', 'name slug')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20);
};

// Instance method to update booking stats
serviceSchema.methods.updateBookingStats = function(status) {
  switch (status) {
    case 'booked':
      this.stats.bookings += 1;
      break;
    case 'completed':
      this.stats.completed += 1;
      break;
    case 'cancelled':
      this.stats.cancelled += 1;
      break;
  }
  
  return this.save();
};

// Instance method to update view count
serviceSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

// Instance method to check service availability
serviceSchema.methods.isAvailableForBooking = function() {
  return this.isAvailable && this.status === 'active';
};

// Instance method to get service duration in minutes
serviceSchema.methods.getDurationInMinutes = function() {
  const duration = this.duration.estimatedTime;
  const match = duration.match(/(\d+)\s*(hour|minute|hr|min)/i);
  
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.includes('hour') || unit.includes('hr')) {
      return value * 60;
    } else {
      return value;
    }
  }
  
  return 60; // Default to 1 hour
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
