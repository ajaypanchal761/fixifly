const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true,
    minlength: [2, 'City name must be at least 2 characters long'],
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State name cannot exceed 50 characters']
  },
  
  // Service Availability
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Service Statistics
  serviceCount: {
    type: Number,
    default: 0,
    min: [0, 'Service count cannot be negative']
  },
  
  // Delivery Information
  estimatedDeliveryTime: {
    type: String,
    default: 'Same Day',
    enum: ['Same Day', 'Next Day', '2-3 Days', '1 Week']
  },
  
  // Coverage Information
  coverage: {
    pincodes: [{
      type: String,
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode']
    }],
    areas: [{
      type: String,
      trim: true,
      maxlength: [100, 'Area name cannot exceed 100 characters']
    }]
  },
  
  // Pricing Information
  pricing: {
    baseServiceFee: {
      type: Number,
      default: 0,
      min: [0, 'Base service fee cannot be negative']
    },
    travelFee: {
      type: Number,
      default: 0,
      min: [0, 'Travel fee cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR']
    }
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
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Statistics
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    activeVendors: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    lastBookingAt: {
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
citySchema.index({ name: 1, state: 1 }, { unique: true });
citySchema.index({ isActive: 1 });
citySchema.index({ state: 1 });
citySchema.index({ 'coverage.pincodes': 1 });
citySchema.index({ createdAt: -1 });

// Virtual for full location
citySchema.virtual('fullLocation').get(function() {
  return `${this.name}, ${this.state}`;
});

// Virtual for service availability status
citySchema.virtual('availabilityStatus').get(function() {
  if (!this.isActive) return 'Inactive';
  if (this.serviceCount === 0) return 'No Services';
  return 'Available';
});

// Pre-save middleware to update service count
citySchema.pre('save', async function(next) {
  if (this.isModified('isActive') && this.isActive) {
    // When activating a city, we might want to update service count
    // This could be implemented based on actual services available
  }
  next();
});

// Method to toggle active status
citySchema.methods.toggleActive = function() {
  this.isActive = !this.isActive;
  return this.save();
};

// Method to add pincode coverage
citySchema.methods.addPincode = function(pincode) {
  if (!this.coverage.pincodes.includes(pincode)) {
    this.coverage.pincodes.push(pincode);
  }
  return this.save();
};

// Method to remove pincode coverage
citySchema.methods.removePincode = function(pincode) {
  this.coverage.pincodes = this.coverage.pincodes.filter(p => p !== pincode);
  return this.save();
};

// Method to add area coverage
citySchema.methods.addArea = function(area) {
  if (!this.coverage.areas.includes(area)) {
    this.coverage.areas.push(area);
  }
  return this.save();
};

// Method to remove area coverage
citySchema.methods.removeArea = function(area) {
  this.coverage.areas = this.coverage.areas.filter(a => a !== area);
  return this.save();
};

// Method to update service count
citySchema.methods.updateServiceCount = function(count) {
  this.serviceCount = count;
  return this.save();
};

// Method to update stats
citySchema.methods.updateStats = function(stats) {
  this.stats = { ...this.stats, ...stats };
  return this.save();
};

// Static method to get active cities
citySchema.statics.getActiveCities = function() {
  return this.find({ isActive: true })
    .sort({ name: 1 });
};

// Static method to get cities by state
citySchema.statics.getCitiesByState = function(state) {
  return this.find({ 
    state: { $regex: state, $options: 'i' },
    isActive: true 
  })
  .sort({ name: 1 });
};

// Static method to search cities
citySchema.statics.searchCities = function(query) {
  const searchQuery = {
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { state: { $regex: query, $options: 'i' } },
      { 'coverage.areas': { $in: [new RegExp(query, 'i')] } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  return this.find(searchQuery)
    .sort({ name: 1 });
};

// Static method to get city statistics
citySchema.statics.getCityStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalCities: { $sum: 1 },
        activeCities: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        inactiveCities: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
        totalServiceCount: { $sum: '$serviceCount' },
        averageServiceCount: { $avg: '$serviceCount' },
        citiesByState: {
          $push: {
            state: '$state',
            city: '$name',
            isActive: '$isActive',
            serviceCount: '$serviceCount'
          }
        }
      }
    }
  ]);
};

// Export the model
module.exports = mongoose.model('City', citySchema);
