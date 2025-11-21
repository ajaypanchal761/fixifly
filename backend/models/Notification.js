const mongoose = require("mongoose");

// Notification schema
const notificationSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },

  // Target Audience
  targetAudience: {
    type: String,
    enum: ['all', 'users', 'vendors', 'specific'],
    required: [true, 'Target audience is required'],
    default: 'all'
  },

  // Specific targets (when targetAudience is 'specific')
  targetUsers: [{
    type: String,
    ref: 'User'
  }],

  targetVendors: [{
    type: String,
    ref: 'Vendor'
  }],

  // Scheduling
  isScheduled: {
    type: Boolean,
    default: false
  },

  scheduledAt: {
    type: Date
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'failed'],
    default: 'draft'
  },

  // Delivery Information
  sentAt: {
    type: Date
  },

  sentCount: {
    type: Number,
    default: 0
  },

  deliveredCount: {
    type: Number,
    default: 0
  },

  readCount: {
    type: Number,
    default: 0
  },

  // Error Information
  errorMessage: {
    type: String,
    trim: true
  },

  // Additional Data
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Admin Information
  createdBy: {
    type: String,
    ref: 'Admin',
    required: true
  },

  // Tracking
  tracking: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for delivery rate
notificationSchema.virtual('deliveryRate').get(function() {
  if (this.sentCount === 0) return 0;
  return Math.round((this.deliveredCount / this.sentCount) * 100);
});

// Virtual for read rate
notificationSchema.virtual('readRate').get(function() {
  if (this.deliveredCount === 0) return 0;
  return Math.round((this.readCount / this.deliveredCount) * 100);
});

// Pre-save middleware to update updatedAt
notificationSchema.pre('save', function(next) {
  this.tracking.updatedAt = new Date();
  next();
});

// Indexes for better performance
notificationSchema.index({ status: 1 });
notificationSchema.index({ targetAudience: 1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ sentAt: 1 });
notificationSchema.index({ createdBy: 1 });
notificationSchema.index({ createdAt: -1 });

// Static methods
notificationSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

notificationSchema.statics.findByTargetAudience = function(audience) {
  return this.find({ targetAudience: audience }).sort({ createdAt: -1 });
};

notificationSchema.statics.findScheduled = function() {
  return this.find({ 
    status: 'scheduled', 
    scheduledAt: { $lte: new Date() } 
  }).sort({ scheduledAt: 1 });
};

// Instance methods
notificationSchema.methods.markAsSent = function(sentCount) {
  this.status = 'sent';
  this.sentAt = new Date();
  this.sentCount = sentCount;
  return this.save();
};

notificationSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

notificationSchema.methods.updateDeliveryStats = function(deliveredCount, readCount) {
  this.deliveredCount = deliveredCount;
  this.readCount = readCount;
  return this.save();
};

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = { Notification };
