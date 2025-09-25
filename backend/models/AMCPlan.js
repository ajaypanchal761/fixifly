const mongoose = require('mongoose');

const AMCPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Plan name cannot exceed 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Plan price is required'],
    min: [0, 'Price cannot be negative']
  },
  period: {
    type: String,
    required: [true, 'Plan period is required'],
    enum: {
      values: ['monthly', 'yearly'],
      message: 'Period must be either monthly or yearly'
    }
  },
  description: {
    type: String,
    required: [true, 'Plan description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  features: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Feature title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: true,
      maxlength: [200, 'Feature description cannot exceed 200 characters']
    }
  }],
  limitations: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Limitation title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: true,
      maxlength: [200, 'Limitation description cannot exceed 200 characters']
    }
  }],
  benefits: {
    callSupport: {
      type: String,
      enum: ['unlimited', 'limited', 'none'],
      default: 'unlimited'
    },
    remoteSupport: {
      type: String,
      enum: ['unlimited', 'limited', 'none'],
      default: 'unlimited'
    },
    homeVisits: {
      count: {
        type: Number,
        default: 0,
        min: [0, 'Home visits count cannot be negative']
      },
      description: {
        type: String,
        maxlength: [200, 'Home visits description cannot exceed 200 characters']
      }
    },
    antivirus: {
      included: {
        type: Boolean,
        default: false
      },
      name: {
        type: String,
        maxlength: [100, 'Antivirus name cannot exceed 100 characters']
      }
    },
    softwareInstallation: {
      included: {
        type: Boolean,
        default: false
      }
    },
    sparePartsDiscount: {
      percentage: {
        type: Number,
        default: 0,
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100']
      }
    },
    freeSpareParts: {
      amount: {
        type: Number,
        default: 0,
        min: [0, 'Free spare parts amount cannot be negative']
      }
    },
    laborCost: {
      included: {
        type: Boolean,
        default: false
      }
    }
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'draft'],
      message: 'Status must be active, inactive, or draft'
    },
    default: 'active'
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    maxlength: [500, 'Image URL cannot exceed 500 characters']
  },
  validityPeriod: {
    type: Number,
    required: [true, 'Validity period is required'],
    min: [1, 'Validity period must be at least 1 day']
  },
  tags: [{
    type: String,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
AMCPlanSchema.index({ name: 1 });
AMCPlanSchema.index({ status: 1 });
AMCPlanSchema.index({ isPopular: 1 });
AMCPlanSchema.index({ sortOrder: 1 });
AMCPlanSchema.index({ createdBy: 1 });

// Virtual for formatted price
AMCPlanSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price}`;
});

// Virtual for duration
AMCPlanSchema.virtual('duration').get(function() {
  return this.period === 'yearly' ? '1 Year' : '1 Month';
});

// Pre-save middleware to update lastModifiedBy
AMCPlanSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.createdBy; // You can update this to use the actual admin making the change
  }
  next();
});

// Static method to get active plans
AMCPlanSchema.statics.getActivePlans = function() {
  return this.find({ status: 'active' }).sort({ sortOrder: 1, createdAt: 1 });
};

// Static method to get popular plans
AMCPlanSchema.statics.getPopularPlans = function() {
  return this.find({ status: 'active', isPopular: true }).sort({ sortOrder: 1 });
};

// Instance method to check if plan is active
AMCPlanSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Instance method to get feature count
AMCPlanSchema.methods.getFeatureCount = function() {
  return this.features ? this.features.length : 0;
};

module.exports = mongoose.model('AMCPlan', AMCPlanSchema);

