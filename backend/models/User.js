const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: false, // Made optional for initial OTP sending
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: false, // Made optional for initial OTP sending
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number']
  },
  
  // Authentication
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
  },
  
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Profile Information
  profileImage: {
    type: String,
    default: null
  },
  
  // Address Information
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
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  // OTP and Verification
  otp: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  
  // FCM Token for push notifications
  fcmToken: {
    type: String,
    default: null
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
      default: 'en',
      enum: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']
    }
  },
  
  // Statistics
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    completedBookings: {
      type: Number,
      default: 0
    },
    cancelledBookings: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    
    lastSubscriptionUpdate: {
      type: Date,
      default: null
    },
    isFirstTimeUser: {
      type: Boolean,
      default: true
    },
    firstBookingDate: {
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
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address.street) return null;
  
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Virtual for formatted phone number
userSchema.virtual('formattedPhone').get(function() {
  if (!this.phone) return null;
  
  // Remove any non-digit characters and format as +91 XXXXXXXXXX
  const digits = this.phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits}`;
  }
  return this.phone;
});

// Pre-save middleware to format phone number
userSchema.pre('save', function(next) {
  if (this.isModified('phone')) {
    // Remove any non-digit characters
    const digits = this.phone.replace(/\D/g, '');
    
    // If it's a 10-digit number, add +91 prefix
    if (digits.length === 10) {
      this.phone = `+91${digits}`;
    }
  }
  next();
});

// Method to generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(otpCode) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  
  if (new Date() > this.otp.expiresAt) {
    return false; // OTP expired
  }
  
  return this.otp.code === otpCode;
};

// Method to clear OTP
userSchema.methods.clearOTP = function() {
  this.otp = {
    code: null,
    expiresAt: null
  };
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.stats.lastLoginAt = new Date();
  return this.save();
};

// Method to increment booking stats
userSchema.methods.incrementBookingStats = function(status, amount = 0) {
  this.stats.totalBookings += 1;
  
  if (status === 'completed') {
    this.stats.completedBookings += 1;
    this.stats.totalSpent += amount;
  } else if (status === 'cancelled') {
    this.stats.cancelledBookings += 1;
  }
  
  return this.save();
};

// Static method to find user by phone or email
userSchema.statics.findByPhoneOrEmail = function(identifier) {
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  
  if (phoneRegex.test(identifier)) {
    // Format phone number
    const digits = identifier.replace(/\D/g, '');
    const formattedPhone = digits.length === 10 ? `+91${digits}` : identifier;
    return this.findOne({ phone: formattedPhone });
  } else if (emailRegex.test(identifier)) {
    return this.findOne({ email: identifier.toLowerCase() });
  }
  
  return null;
};

// Static method to get user statistics
userSchema.statics.getUserStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        verifiedUsers: { $sum: { $cond: ['$isPhoneVerified', 1, 0] } },
        usersByRole: {
          $push: {
            role: '$role',
            isActive: '$isActive'
          }
        }
      }
    }
  ]);
};

// Export the model
const User = mongoose.model('User', userSchema);
module.exports = User;
