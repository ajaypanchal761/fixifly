const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vendorSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [30, 'First name cannot exceed 30 characters']
  },
  
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters long'],
    maxlength: [30, 'Last name cannot exceed 30 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number']
  },
  
  // Unique Vendor ID
  vendorId: {
    type: String,
    unique: true,
    required: true,
    match: [/^[1-9]\d{2}$/, 'Vendor ID must be a 3-digit number starting from 1']
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  
  role: {
    type: String,
    enum: ['vendor'],
    default: 'vendor'
  },
  
  // Service Information
  serviceCategories: [{
    type: String,
    enum: [
      'Electronics Repair',
      'Home Appliances',
      'Computer & Laptop',
      'Mobile Phone',
      'AC & Refrigeration',
      'Plumbing',
      'Electrical',
      'Carpentry',
      'Painting',
      'Cleaning Services',
      'Other'
    ]
  }],
  
  customServiceCategory: {
    type: String,
    trim: true,
    maxlength: [100, 'Custom service category cannot exceed 100 characters']
  },
  
  experience: {
    type: String,
    enum: [
      'Less than 1 year',
      '1-2 years',
      '3-5 years',
      '5-10 years',
      'More than 10 years'
    ],
    required: [true, 'Experience level is required']
  },
  
  // Location Information
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [100, 'Street address cannot exceed 100 characters']
    },
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
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [100, 'Landmark cannot exceed 100 characters']
    }
  },

  // Service Locations - Areas where vendor provides services
  serviceLocations: [{
    from: {
      type: String,
      required: [true, 'From location is required'],
      trim: true,
      maxlength: [100, 'From location cannot exceed 100 characters']
    },
    to: {
      type: String,
      required: [true, 'To location is required'],
      trim: true,
      maxlength: [100, 'To location cannot exceed 100 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Profile Information
  profileImage: {
    type: String,
    default: null
  },
  
  // Business Information
  specialty: {
    type: String,
    trim: true,
    maxlength: [100, 'Specialty cannot exceed 100 characters']
  },
  
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  // Verification Status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  
  isApproved: {
    type: Boolean,
    default: false
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: false  // Changed to false - requires admin approval
  },
  
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  // Rating and Reviews
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Statistics
  stats: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    cancelledTasks: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    joinedDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
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
  
  // Wallet Information
  wallet: {
    currentBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    hasInitialDeposit: {
      type: Boolean,
      default: false
    },
    initialDepositAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastTransactionAt: {
      type: Date,
      default: null
    }
  },

  // Documents
  documents: {
    aadharCard: {
      type: String,
      default: null
    },
    panCard: {
      type: String,
      default: null
    },
    bankDetails: {
      accountNumber: {
        type: String,
        default: null
      },
      ifscCode: {
        type: String,
        default: null
      },
      bankName: {
        type: String,
        default: null
      }
    },
    
    lastSubscriptionUpdate: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Virtual for full name
vendorSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for formatted phone
vendorSchema.virtual('formattedPhone').get(function() {
  if (this.phone.startsWith('+91')) {
    return `+91 ${this.phone.slice(3, 8)} ${this.phone.slice(8)}`;
  } else if (this.phone.startsWith('91')) {
    return `+91 ${this.phone.slice(2, 7)} ${this.phone.slice(7)}`;
  } else {
    return `+91 ${this.phone.slice(0, 5)} ${this.phone.slice(5)}`;
  }
});

// Index for better query performance
vendorSchema.index({ email: 1 });
vendorSchema.index({ phone: 1 });
vendorSchema.index({ 'address.city': 1 });
vendorSchema.index({ 'address.pincode': 1 });
vendorSchema.index({ serviceCategories: 1 });
vendorSchema.index({ 'serviceLocations.from': 1, 'serviceLocations.to': 1 });
vendorSchema.index({ isActive: 1, isApproved: 1 });

// Pre-save middleware to hash password
vendorSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
vendorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update last login
vendorSchema.methods.updateLastLogin = function() {
  this.stats.lastLoginAt = new Date();
  return this.save({ validateBeforeSave: false });
};

// Instance method to update rating
vendorSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Instance method to check if profile is complete
vendorSchema.methods.checkProfileComplete = function() {
  const requiredFields = [
    'firstName', 'lastName', 'email', 'phone', 'serviceCategories', 
    'experience', 'address.city', 'address.state', 'address.pincode'
  ];
  
  const isComplete = requiredFields.every(field => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      return this[parent] && this[parent][child];
    }
    return this[field];
  });
  
  this.isProfileComplete = isComplete;
  return isComplete;
};

// Instance method to add service location
vendorSchema.methods.addServiceLocation = function(from, to) {
  // Check if location already exists
  const existingLocation = this.serviceLocations.find(
    loc => loc.from.toLowerCase() === from.toLowerCase() && 
           loc.to.toLowerCase() === to.toLowerCase()
  );
  
  if (existingLocation) {
    throw new Error('Service location already exists');
  }
  
  this.serviceLocations.push({
    from: from.trim(),
    to: to.trim(),
    isActive: true,
    addedAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove service location
vendorSchema.methods.removeServiceLocation = function(locationId) {
  this.serviceLocations = this.serviceLocations.filter(
    loc => loc._id.toString() !== locationId
  );
  
  return this.save();
};

// Instance method to update service location
vendorSchema.methods.updateServiceLocation = function(locationId, from, to, isActive = true) {
  const location = this.serviceLocations.id(locationId);
  
  if (!location) {
    throw new Error('Service location not found');
  }
  
  // Check if updated location already exists (excluding current one)
  const existingLocation = this.serviceLocations.find(
    loc => loc._id.toString() !== locationId &&
           loc.from.toLowerCase() === from.toLowerCase() && 
           loc.to.toLowerCase() === to.toLowerCase()
  );
  
  if (existingLocation) {
    throw new Error('Service location already exists');
  }
  
  location.from = from.trim();
  location.to = to.trim();
  location.isActive = isActive;
  
  return this.save();
};

// Static method to generate unique 3-digit vendor ID
vendorSchema.statics.generateVendorId = async function() {
  let vendorId;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate a random 3-digit number starting from 100
    vendorId = Math.floor(Math.random() * 900) + 100;
    vendorId = vendorId.toString();
    
    // Check if this ID already exists
    const existingVendor = await this.findOne({ vendorId });
    if (!existingVendor) {
      isUnique = true;
    }
  }
  
  return vendorId;
};

// Instance method to add deposit to wallet
vendorSchema.methods.addDeposit = async function(amount, transactionId, razorpayOrderId = null, razorpayPaymentId = null, razorpaySignature = null) {
  const WalletTransaction = require('./WalletTransaction');
  
  const balanceBefore = this.wallet.currentBalance;
  const balanceAfter = balanceBefore + amount;
  
  // Update vendor wallet
  this.wallet.currentBalance = balanceAfter;
  this.wallet.lastTransactionAt = new Date();
  
  if (!this.wallet.hasInitialDeposit) {
    this.wallet.hasInitialDeposit = true;
    this.wallet.initialDepositAmount = amount;
  }
  
  // Find and update the existing pending transaction instead of creating a new one
  const existingTransaction = await WalletTransaction.findOne({
    transactionId: transactionId,
    vendorId: this.vendorId,
    status: 'pending'
  });
  
  if (existingTransaction) {
    // Update the existing pending transaction
    existingTransaction.amount = amount;
    existingTransaction.razorpayOrderId = razorpayOrderId;
    existingTransaction.razorpayPaymentId = razorpayPaymentId;
    existingTransaction.razorpaySignature = razorpaySignature;
    existingTransaction.status = 'completed';
    existingTransaction.balanceBefore = balanceBefore;
    existingTransaction.balanceAfter = balanceAfter;
    existingTransaction.processedBy = 'system';
    
    await existingTransaction.save();
  } else {
    // Fallback: create new transaction if pending one not found
    const transaction = new WalletTransaction({
      vendor: this._id,
      vendorId: this.vendorId,
      transactionId: transactionId,
      amount: amount,
      type: 'deposit',
      description: 'Wallet deposit',
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
      razorpaySignature: razorpaySignature,
      status: 'completed',
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      processedBy: 'system'
    });
    
    await transaction.save();
  }
  
  return this.save();
};

// Instance method to add withdrawal from wallet
vendorSchema.methods.addWithdrawal = async function(amount, transactionId, description = 'Wallet withdrawal') {
  const WalletTransaction = require('./WalletTransaction');
  
  if (this.wallet.currentBalance < amount) {
    throw new Error('Insufficient balance');
  }
  
  const balanceBefore = this.wallet.currentBalance;
  const balanceAfter = balanceBefore - amount;
  
  // Update vendor wallet
  this.wallet.currentBalance = balanceAfter;
  this.wallet.lastTransactionAt = new Date();
  
  // Create wallet transaction record
  const transaction = new WalletTransaction({
    vendor: this._id,
    vendorId: this.vendorId,
    transactionId: transactionId,
    amount: -amount,
    type: 'withdrawal',
    description: description,
    status: 'completed',
    balanceBefore: balanceBefore,
    balanceAfter: balanceAfter,
    processedBy: 'system'
  });
  
  await transaction.save();
  return this.save();
};

// Instance method to add earning to wallet
vendorSchema.methods.addEarning = async function(amount, transactionId, description = 'Service earning', metadata = {}) {
  const WalletTransaction = require('./WalletTransaction');
  
  const balanceBefore = this.wallet.currentBalance;
  const balanceAfter = balanceBefore + amount;
  
  // Update vendor wallet
  this.wallet.currentBalance = balanceAfter;
  this.wallet.lastTransactionAt = new Date();
  
  // Create wallet transaction record
  const transaction = new WalletTransaction({
    vendor: this._id,
    vendorId: this.vendorId,
    transactionId: transactionId,
    amount: amount,
    type: 'earning',
    description: description,
    status: 'completed',
    balanceBefore: balanceBefore,
    balanceAfter: balanceAfter,
    processedBy: 'system',
    metadata: metadata
  });
  
  await transaction.save();
  return this.save();
};

// Instance method to add penalty to wallet
vendorSchema.methods.addPenalty = async function(amount, transactionId, description = 'Penalty', metadata = {}) {
  const WalletTransaction = require('./WalletTransaction');
  
  const balanceBefore = this.wallet.currentBalance;
  const balanceAfter = Math.max(0, balanceBefore - amount); // Don't allow negative balance
  
  // Update vendor wallet
  this.wallet.currentBalance = balanceAfter;
  this.wallet.lastTransactionAt = new Date();
  
  // Create wallet transaction record
  const transaction = new WalletTransaction({
    vendor: this._id,
    vendorId: this.vendorId,
    transactionId: transactionId,
    amount: -amount,
    type: 'penalty',
    description: description,
    status: 'completed',
    balanceBefore: balanceBefore,
    balanceAfter: balanceAfter,
    processedBy: 'system',
    metadata: metadata
  });
  
  await transaction.save();
  return this.save();
};

// Static method to find vendors by location and service
vendorSchema.statics.findByLocationAndService = function(city, pincode, serviceCategory) {
  const query = {
    isActive: true,
    isApproved: true,
    'address.city': new RegExp(city, 'i')
  };
  
  if (pincode) {
    query['address.pincode'] = pincode;
  }
  
  if (serviceCategory) {
    query.serviceCategories = serviceCategory;
  }
  
  return this.find(query).select('-password');
};

// Transform JSON output
vendorSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;
