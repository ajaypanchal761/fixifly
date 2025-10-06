const mongoose = require("mongoose");

// Service schema for individual services within categories
const serviceSchema = new mongoose.Schema({
  serviceName: { 
    type: String, 
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [1000000, 'Price cannot exceed 1,000,000']
  },
  discountPrice: { 
    type: Number, 
    min: [0, 'Discount price cannot be negative'],
    max: [1000000, 'Discount price cannot exceed 1,000,000'],
    validate: {
      validator: function(value) {
        // Allow empty/null discount price
        if (!value || value === 0) return true;
        // If discount price is provided, it must be less than regular price
        return value < this.price;
      },
      message: 'Discount price must be less than regular price'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  serviceImage: { 
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(value);
      },
      message: 'Service image must be a valid image URL'
    }
  }
}, { timestamps: true });

// Main product schema - matching frontend form structure
const productSchema = new mongoose.Schema({
  // Basic Information - matching frontend form
  productName: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  productImage: { 
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(value);
      },
      message: 'Product image must be a valid image URL'
    }
  },
  serviceType: { 
    type: String, 
    required: [true, 'Service type is required'],
    trim: true,
    enum: {
      values: ['IT Needs', 'Home Appliance'],
      message: 'Service type must be either "IT Needs" or "Home Appliance"'
    }
  },
  
  // Categories - matching frontend structure (A, B, C, D)
  categories: {
    A: [serviceSchema], // Basic Services
    B: [serviceSchema], // Premium Services  
    C: [serviceSchema], // Emergency Services
    D: [serviceSchema]  // Maintenance Services
  },
  
  // Category names - store custom category names
  categoryNames: {
    A: {
      type: String,
      default: 'Basic Services',
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    B: {
      type: String,
      default: 'Premium Services',
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    C: {
      type: String,
      default: 'Emergency Services',
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    D: {
      type: String,
      default: 'Maintenance Services',
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    }
  },
  
  // Status and Visibility
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total services count
productSchema.virtual('totalServices').get(function() {
  return this.categories.A.length + this.categories.B.length + 
         this.categories.C.length + this.categories.D.length;
});

// Virtual for category names mapping (now uses stored names)
productSchema.virtual('categoryNamesMapping').get(function() {
  return {
    A: this.categoryNames.A,
    B: this.categoryNames.B,
    C: this.categoryNames.C,
    D: this.categoryNames.D
  };
});

// Pre-save middleware to ensure categories and category names exist
productSchema.pre('save', function(next) {
  // Ensure all category arrays exist
  if (!this.categories.A) this.categories.A = [];
  if (!this.categories.B) this.categories.B = [];
  if (!this.categories.C) this.categories.C = [];
  if (!this.categories.D) this.categories.D = [];
  
  // Ensure all category names exist with defaults
  if (!this.categoryNames) this.categoryNames = {};
  if (!this.categoryNames.A) this.categoryNames.A = 'Basic Services';
  if (!this.categoryNames.B) this.categoryNames.B = 'Premium Services';
  if (!this.categoryNames.C) this.categoryNames.C = 'Emergency Services';
  if (!this.categoryNames.D) this.categoryNames.D = 'Maintenance Services';
  
  next();
});

// Indexes for better performance
productSchema.index({ productName: 1 });
productSchema.index({ serviceType: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ createdAt: -1 });

// Text search index
productSchema.index({
  productName: 'text',
  'categories.A.serviceName': 'text',
  'categories.B.serviceName': 'text', 
  'categories.C.serviceName': 'text',
  'categories.D.serviceName': 'text'
});

// Static methods
productSchema.statics.findByServiceType = function(serviceType) {
  return this.find({ serviceType, status: 'active' });
};

productSchema.statics.findFeatured = function() {
  return this.find({ isFeatured: true, status: 'active' });
};

productSchema.statics.searchProducts = function(query) {
  return this.find({
    $text: { $search: query },
    status: 'active'
  }, {
    score: { $meta: 'textScore' }
  }).sort({ score: { $meta: 'textScore' } });
};

// Instance methods
productSchema.methods.addServiceToCategory = function(categoryKey, serviceData) {
  if (['A', 'B', 'C', 'D'].includes(categoryKey)) {
    this.categories[categoryKey].push(serviceData);
    return this.save();
  }
  throw new Error('Invalid category key. Must be A, B, C, or D');
};

productSchema.methods.removeServiceFromCategory = function(categoryKey, serviceId) {
  if (['A', 'B', 'C', 'D'].includes(categoryKey)) {
    this.categories[categoryKey] = this.categories[categoryKey].filter(
      service => service._id.toString() !== serviceId
    );
    return this.save();
  }
  throw new Error('Invalid category key. Must be A, B, C, or D');
};

productSchema.methods.getCategoryName = function(categoryKey) {
  const names = {
    A: 'Basic Services',
    B: 'Premium Services',
    C: 'Emergency Services', 
    D: 'Maintenance Services'
  };
  return names[categoryKey] || 'Unknown Category';
};

productSchema.methods.getServicesByCategory = function(categoryKey) {
  if (['A', 'B', 'C', 'D'].includes(categoryKey)) {
    return this.categories[categoryKey];
  }
  return [];
};

const Product = mongoose.model("Product", productSchema);
module.exports = { Product };