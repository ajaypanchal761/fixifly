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
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please enter a valid email address']
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function (v) {
        // Remove all non-digit characters
        let digits = v.replace(/\D/g, '');

        // Remove leading 0 if present (common mistake)
        if (digits.length === 11 && digits.startsWith('0')) {
          digits = digits.substring(1);
        }

        // Check if it's a valid 10-digit number
        return digits.length === 10;
      },
      message: 'Please enter a valid 10-digit phone number (without country code or leading 0)'
    }
  },

  alternatePhone: {
    type: String,
    required: [true, 'Alternate phone number is required'],
    trim: true,
    validate: {
      validator: function (v) {
        // Remove all non-digit characters
        let digits = v.replace(/\D/g, '');

        // Remove leading 0 if present (common mistake)
        if (digits.length === 11 && digits.startsWith('0')) {
          digits = digits.substring(1);
        }

        // Check if it's a valid 10-digit number
        return digits.length === 10;
      },
      message: 'Please enter a valid 10-digit phone number (without country code or leading 0)'
    }
  },

  fatherName: {
    type: String,
    required: [true, 'Father\'s name is required'],
    trim: true,
    minlength: [2, 'Father\'s name must be at least 2 characters long'],
    maxlength: [50, 'Father\'s name cannot exceed 50 characters']
  },

  homePhone: {
    type: String,
    required: [true, 'Home phone number is required'],
    trim: true,
    validate: {
      validator: function (v) {
        // Remove all non-digit characters
        let digits = v.replace(/\D/g, '');

        // Remove leading 0 if present (common mistake)
        if (digits.length === 11 && digits.startsWith('0')) {
          digits = digits.substring(1);
        }

        // Check if it's a valid 10-digit number
        return digits.length === 10;
      },
      message: 'Please enter a valid 10-digit phone number (without country code or leading 0)'
    }
  },

  currentAddress: {
    type: String,
    required: [true, 'Current address is required'],
    trim: true,
    maxlength: [500, 'Current address cannot exceed 500 characters']
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

  // OTP for forgot password
  forgotPasswordOTP: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
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
      'Laptop, Computers, Tab',
      'Macbook, iMac, Surface',
      'Printer Repair',
      'CCTV',
      'Server & Networking',
      'Software App Developer',
      'AC Repair',
      'Fridge, Washing Machine, Home Appliance Repair',
      'Electrician',
      'Plumber',
      'Cleaning'
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
      validate: {
        validator: function (v) {
          // Allow empty string or valid 6-digit pincode
          return !v || /^[1-9][0-9]{5}$/.test(v);
        },
        message: 'Please enter a valid 6-digit pincode'
      }
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

  // Partner Verification Status
  isVerifiedPartner: {
    type: Boolean,
    default: false
  },

  verificationStatus: {
    type: String,
    enum: ['pending', 'payment_pending', 'payment_completed', 'under_review', 'verified', 'rejected'],
    default: 'pending'
  },

  verificationPayment: {
    amount: {
      type: Number,
      default: 3999
    },
    razorpayOrderId: {
      type: String,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    razorpaySignature: {
      type: String,
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  },

  verificationSubmittedAt: {
    type: Date,
    default: null
  },

  verificationApprovedAt: {
    type: Date,
    default: null
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true  // Instant activation - vendor account is active immediately upon creation
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
    },
    // New fields for mandatory deposit requirement
    hasMandatoryDeposit: {
      type: Boolean,
      default: false
    },
    mandatoryDepositAmount: {
      type: Number,
      default: 2000,
      min: 2000
    },
    firstTaskAssignedAt: {
      type: Date,
      default: null
    },
    canAcceptTasks: {
      type: Boolean,
      default: false
    }
  },

  // Documents
  documents: {
    aadhaarFront: {
      type: String,
      default: null
    },
    aadhaarBack: {
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
  },

  // FCM Tokens for Push Notifications
  fcmTokens: {
    type: [String],
    default: [],
    select: false // Don't include in default queries for security
  },
  // FCM Token for Mobile/APK (Android/iOS)
  fcmTokenMobile: {
    type: [String],
    default: [],
    select: false // Don't include in default queries for security
  },

  // Notification Settings
  notificationSettings: {
    pushNotifications: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: true
    }
  },

  // Rating Information
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    },
    ratingDistribution: {
      type: Map,
      of: Number,
      default: () => new Map([
        ['1', 0],
        ['2', 0],
        ['3', 0],
        ['4', 0],
        ['5', 0]
      ])
    }
  }
}, {
  timestamps: true
});

// Virtual for full name
vendorSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for formatted phone
vendorSchema.virtual('formattedPhone').get(function () {
  if (!this.phone || typeof this.phone !== 'string') {
    return this.phone || '';
  }

  if (this.phone.startsWith('+91')) {
    return `+91 ${this.phone.slice(3, 8)} ${this.phone.slice(8)}`;
  } else if (this.phone.startsWith('91')) {
    return `+91 ${this.phone.slice(2, 7)} ${this.phone.slice(7)}`;
  } else {
    return `+91 ${this.phone.slice(0, 5)} ${this.phone.slice(5)}`;
  }
});

// Index for better query performance
// Note: email and phone already have unique indexes from schema definition
vendorSchema.index({ 'address.city': 1 });
vendorSchema.index({ 'address.pincode': 1 });
vendorSchema.index({ serviceCategories: 1 });
vendorSchema.index({ 'serviceLocations.from': 1, 'serviceLocations.to': 1 });
vendorSchema.index({ isActive: 1, isApproved: 1 });

// Pre-save middleware to hash password
vendorSchema.pre('save', async function (next) {
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
vendorSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate OTP for forgot password
vendorSchema.methods.generateForgotPasswordOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.forgotPasswordOTP = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
  return otp;
};

// Method to verify OTP for forgot password
vendorSchema.methods.verifyForgotPasswordOTP = function (otpCode) {
  if (!this.forgotPasswordOTP || !this.forgotPasswordOTP.code || !this.forgotPasswordOTP.expiresAt) {
    return false;
  }

  if (new Date() > this.forgotPasswordOTP.expiresAt) {
    return false; // OTP expired
  }

  return this.forgotPasswordOTP.code === otpCode;
};

// Method to clear OTP for forgot password
vendorSchema.methods.clearForgotPasswordOTP = function () {
  this.forgotPasswordOTP = {
    code: null,
    expiresAt: null
  };
};

// Instance method to update last login
vendorSchema.methods.updateLastLogin = function () {
  this.stats.lastLoginAt = new Date();
  return this.save({ validateBeforeSave: false });
};

// Instance method to update rating
vendorSchema.methods.updateRating = function (newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Instance method to check if profile is complete
vendorSchema.methods.checkProfileComplete = function () {
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
vendorSchema.methods.addServiceLocation = function (from, to) {
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
vendorSchema.methods.removeServiceLocation = function (locationId) {
  this.serviceLocations = this.serviceLocations.filter(
    loc => loc._id.toString() !== locationId
  );

  return this.save();
};

// Instance method to update service location
vendorSchema.methods.updateServiceLocation = function (locationId, from, to, isActive = true) {
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
vendorSchema.statics.generateVendorId = async function () {
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
vendorSchema.methods.addDeposit = async function (amount, transactionId, razorpayOrderId = null, razorpayPaymentId = null, razorpaySignature = null) {
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
vendorSchema.methods.addWithdrawal = async function (amount, transactionId, description = 'Wallet withdrawal') {
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
vendorSchema.methods.addEarning = async function (amount, transactionId, description = 'Service earning', metadata = {}) {
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
vendorSchema.methods.addPenalty = async function (amount, transactionId, description = 'Penalty', metadata = {}) {
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
vendorSchema.statics.findByLocationAndService = function (city, pincode, serviceCategory) {
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

// Instance method to check if vendor can accept tasks (mandatory deposit requirement)
vendorSchema.methods.canAcceptNewTasks = async function () {
  // If vendor has never been assigned a task, they can accept
  if (!this.wallet.firstTaskAssignedAt) {
    return true;
  }

  // If vendor has already made mandatory deposit, they can accept
  if (this.wallet.hasMandatoryDeposit) {
    return true;
  }

  // Check if vendor has initial deposit (₹3999) - if yes, they can accept
  if (this.wallet.hasInitialDeposit) {
    // Auto-mark mandatory deposit as completed if they have initial deposit
    if (!this.wallet.hasMandatoryDeposit) {
      this.wallet.hasMandatoryDeposit = true;
      this.wallet.mandatoryDepositAmount = 3999;
      await this.save();
    }
    return true;
  }

  // Check wallet balance from VendorWallet model
  const VendorWallet = require('./VendorWallet');
  const vendorWallet = await VendorWallet.findOne({ vendorId: this.vendorId });

  if (vendorWallet) {
    const currentBalance = vendorWallet.currentBalance || 0;
    const totalDeposits = vendorWallet.totalDeposits || 0;

    // If vendor has ₹2000 or more in balance, they can accept tasks
    if (currentBalance >= 2000 || totalDeposits >= 2000) {
      // Auto-mark mandatory deposit as completed
      if (!this.wallet.hasMandatoryDeposit) {
        this.wallet.hasMandatoryDeposit = true;
        this.wallet.mandatoryDepositAmount = Math.max(2000, currentBalance >= 2000 ? currentBalance : totalDeposits);
        await this.save();
      }
      return true;
    }
  }

  // If vendor has been assigned a task but hasn't made mandatory deposit, they cannot accept
  return false;
};

// Instance method to mark first task assignment
vendorSchema.methods.markFirstTaskAssignment = function () {
  if (!this.wallet.firstTaskAssignedAt) {
    this.wallet.firstTaskAssignedAt = new Date();
    this.wallet.canAcceptTasks = false; // Cannot accept until mandatory deposit is made
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to mark mandatory deposit as completed
vendorSchema.methods.markMandatoryDepositCompleted = function (amount) {
  this.wallet.hasMandatoryDeposit = true;
  this.wallet.mandatoryDepositAmount = amount;
  this.wallet.canAcceptTasks = true;
  return this.save();
};

// Instance method to update vendor rating
vendorSchema.methods.updateRating = async function () {
  const Review = require('./Review');

  // Get all reviews for this vendor
  const reviews = await Review.find({
    vendorId: this._id,
    status: 'approved'
  });

  if (reviews.length === 0) {
    // No reviews, reset rating
    this.rating.average = 0;
    this.rating.totalReviews = 0;
    this.rating.ratingDistribution = new Map([
      ['1', 0], ['2', 0], ['3', 0], ['4', 0], ['5', 0]
    ]);
  } else {
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal
    this.rating.totalReviews = reviews.length;

    // Calculate rating distribution
    const distribution = new Map([
      ['1', 0], ['2', 0], ['3', 0], ['4', 0], ['5', 0]
    ]);

    reviews.forEach(review => {
      const rating = review.rating.toString();
      distribution.set(rating, (distribution.get(rating) || 0) + 1);
    });

    this.rating.ratingDistribution = distribution;
  }

  return this.save();
};

// Transform JSON output
vendorSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;
