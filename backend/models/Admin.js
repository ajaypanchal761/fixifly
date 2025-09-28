const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
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
  
  // Unique Admin ID
  adminId: {
    type: String,
    unique: true,
    required: false, // Will be generated automatically
    match: [/^ADMIN\d{3}$/, 'Admin ID must be in format ADMIN001, ADMIN002, etc.']
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
    enum: ['admin', 'super_admin'],
    default: 'admin'
  },
  
  // Admin Permissions
  permissions: {
    userManagement: {
      type: Boolean,
      default: true
    },
    vendorManagement: {
      type: Boolean,
      default: true
    },
    serviceManagement: {
      type: Boolean,
      default: true
    },
    bookingManagement: {
      type: Boolean,
      default: true
    },
    paymentManagement: {
      type: Boolean,
      default: true
    },
    productManagement: {
      type: Boolean,
      default: true
    },
    blogManagement: {
      type: Boolean,
      default: true
    },
    amcManagement: {
      type: Boolean,
      default: true
    },
    supportManagement: {
      type: Boolean,
      default: true
    },
    contentManagement: {
      type: Boolean,
      default: true
    },
    analytics: {
      type: Boolean,
      default: true
    },
    systemSettings: {
      type: Boolean,
      default: false // Only super admin
    },
    cardManagement: {
      type: Boolean,
      default: true
    },
    cityManagement: {
      type: Boolean,
      default: true
    }
  },
  
  // Profile Information
  profileImage: {
    type: String,
    default: null
  },
  
  // Department/Department Information
  department: {
    type: String,
    enum: [
      'Operations',
      'Customer Support',
      'Technical',
      'Finance',
      'Marketing',
      'HR',
      'IT',
      'Management'
    ],
    default: 'Operations'
  },
  
  designation: {
    type: String,
    trim: true,
    maxlength: [50, 'Designation cannot exceed 50 characters']
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
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  // Admin Statistics
  stats: {
    totalLogins: {
      type: Number,
      default: 0
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    lastLoginIP: {
      type: String,
      default: null
    },
    totalActions: {
      type: Number,
      default: 0
    },
    usersManaged: {
      type: Number,
      default: 0
    },
    vendorsManaged: {
      type: Number,
      default: 0
    },
    bookingsProcessed: {
      type: Number,
      default: 0
    },
    supportTicketsResolved: {
      type: Number,
      default: 0
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
      },
      systemAlerts: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    dashboardLayout: {
      type: String,
      default: 'default',
      enum: ['default', 'compact', 'detailed']
    }
  },
  
  // Security Settings
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String,
      default: null
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockoutUntil: {
      type: Date,
      default: null
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now
    },
    // JWT Refresh Token
    refreshToken: {
      type: String,
      default: null,
      select: false // Don't include in queries by default
    },
    refreshTokenExpires: {
      type: Date,
      default: null
    },
    // Token blacklist for logout
    blacklistedTokens: [{
      token: String,
      blacklistedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Activity Log
  activityLog: [{
    action: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      enum: ['user', 'vendor', 'booking', 'payment', 'service', 'system', 'admin']
    },
    targetId: {
      type: String
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Created by (for audit trail)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  // Last modified by (for audit trail)
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
adminSchema.index({ email: 1 });
adminSchema.index({ phone: 1 });
adminSchema.index({ adminId: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ department: 1 });
adminSchema.index({ createdAt: -1 });

// Virtual for formatted phone number
adminSchema.virtual('formattedPhone').get(function() {
  if (!this.phone) return null;
  
  // Remove any non-digit characters and format as +91 XXXXXXXXXX
  const digits = this.phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits}`;
  }
  return this.phone;
});

// Virtual for full admin info
adminSchema.virtual('fullInfo').get(function() {
  return {
    id: this._id,
    adminId: this.adminId,
    name: this.name,
    email: this.email,
    phone: this.formattedPhone,
    role: this.role,
    department: this.department,
    designation: this.designation,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
});

// Pre-save middleware to generate adminId and format phone number
adminSchema.pre('save', async function(next) {
  // Generate adminId if not provided
  if (!this.adminId) {
    this.adminId = await this.constructor.generateAdminId();
  }
  
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

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update password change timestamp
    this.security.passwordChangedAt = new Date();
    this.security.lastPasswordChange = new Date();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update last login
adminSchema.methods.updateLastLogin = function(ipAddress = null) {
  this.stats.totalLogins += 1;
  this.stats.lastLoginAt = new Date();
  if (ipAddress) {
    this.stats.lastLoginIP = ipAddress;
  }
  
  // Reset login attempts on successful login
  this.security.loginAttempts = 0;
  this.security.lockoutUntil = null;
  
  return this.save({ validateBeforeSave: false });
};

// Instance method to increment login attempts
adminSchema.methods.incrementLoginAttempts = function() {
  this.security.loginAttempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.security.loginAttempts >= 5) {
    this.security.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  return this.save({ validateBeforeSave: false });
};

// Instance method to check if account is locked
adminSchema.methods.isAccountLocked = function() {
  return this.security.lockoutUntil && this.security.lockoutUntil > new Date();
};

// Instance method to log activity
adminSchema.methods.logActivity = function(action, description, targetType = null, targetId = null, ipAddress = null, userAgent = null) {
  this.activityLog.push({
    action,
    description,
    targetType,
    targetId,
    ipAddress,
    userAgent,
    timestamp: new Date()
  });
  
  // Increment total actions
  this.stats.totalActions += 1;
  
  // Keep only last 100 activities
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
  
  return this.save({ validateBeforeSave: false });
};

// Instance method to check if profile is complete
adminSchema.methods.checkProfileComplete = function() {
  const requiredFields = ['name', 'email', 'phone', 'department'];
  const isComplete = requiredFields.every(field => this[field]);
  
  this.isProfileComplete = isComplete;
  return isComplete;
};

// Instance method to check permission
adminSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') {
    return true; // Super admin has all permissions
  }
  
  return this.permissions[permission] === true;
};

// Instance method to generate refresh token
adminSchema.methods.generateRefreshToken = function() {
  const crypto = require('crypto');
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  this.security.refreshToken = refreshToken;
  this.security.refreshTokenExpires = refreshTokenExpires;
  
  return this.save({ validateBeforeSave: false });
};

// Instance method to verify refresh token
adminSchema.methods.verifyRefreshToken = function(token) {
  return this.security.refreshToken === token && 
         this.security.refreshTokenExpires > new Date();
};

// Instance method to revoke refresh token
adminSchema.methods.revokeRefreshToken = function() {
  this.security.refreshToken = null;
  this.security.refreshTokenExpires = null;
  return this.save({ validateBeforeSave: false });
};

// Instance method to blacklist token
adminSchema.methods.blacklistToken = function(token) {
  this.security.blacklistedTokens.push({
    token: token,
    blacklistedAt: new Date()
  });
  
  // Keep only last 50 blacklisted tokens
  if (this.security.blacklistedTokens.length > 50) {
    this.security.blacklistedTokens = this.security.blacklistedTokens.slice(-50);
  }
  
  return this.save({ validateBeforeSave: false });
};

// Instance method to check if token is blacklisted
adminSchema.methods.isTokenBlacklisted = function(token) {
  return this.security.blacklistedTokens.some(blacklisted => blacklisted.token === token);
};

// Static method to generate unique admin ID
adminSchema.statics.generateAdminId = async function() {
  let adminId;
  let isUnique = false;
  let counter = 1;
  
  while (!isUnique) {
    adminId = `ADMIN${counter.toString().padStart(3, '0')}`;
    
    // Check if this ID already exists
    const existingAdmin = await this.findOne({ adminId });
    if (!existingAdmin) {
      isUnique = true;
    } else {
      counter++;
    }
  }
  
  return adminId;
};

// Static method to find admin by email or phone
adminSchema.statics.findByEmailOrPhone = function(identifier) {
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

// Static method to get admin statistics
adminSchema.statics.getAdminStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalAdmins: { $sum: 1 },
        activeAdmins: { $sum: { $cond: ['$isActive', 1, 0] } },
        superAdmins: { $sum: { $cond: [{ $eq: ['$role', 'super_admin'] }, 1, 0] } },
        adminsByDepartment: {
          $push: {
            department: '$department',
            isActive: '$isActive'
          }
        }
      }
    }
  ]);
};

// Transform JSON output
adminSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    if (ret.security && ret.security.twoFactorSecret) {
      delete ret.security.twoFactorSecret;
    }
    delete ret.__v;
    return ret;
  }
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
