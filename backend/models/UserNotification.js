const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  
  // Notification type
  type: {
    type: String,
    enum: [
      'booking', 
      'payment', 
      'reminder', 
      'system', 
      'service', 
      'promotion', 
      'admin_notification', 
      'general', 
      'booking_update', 
      'payment_confirmation', 
      'booking_confirmation',
      'engineer_assigned',
      'support_ticket_engineer_assigned'
    ],
    default: 'system'
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Read timestamp
  readAt: {
    type: Date,
    default: null
  },
  
  // Image data
  image: {
    public_id: {
      type: String,
      default: null
    },
    secure_url: {
      type: String,
      default: null
    },
    width: {
      type: Number,
      default: null
    },
    height: {
      type: Number,
      default: null
    }
  },
  
  // Additional data
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Related entities
  bookingId: {
    type: String,
    default: null
  },
  
  serviceType: {
    type: String,
    default: null
  },
  
  // Admin who sent the notification (if applicable)
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  // Push notification status
  pushSent: {
    type: Boolean,
    default: false
  },
  
  pushSentAt: {
    type: Date,
    default: null
  },
  
  // Expiry date (for time-sensitive notifications)
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userNotificationSchema.index({ user: 1, createdAt: -1 });
userNotificationSchema.index({ user: 1, isRead: 1 });
userNotificationSchema.index({ type: 1 });
userNotificationSchema.index({ priority: 1 });
userNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time ago
userNotificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
});

// Instance method to mark as read
userNotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count for user
userNotificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ 
    user: userId, 
    isRead: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to mark all as read for user
userNotificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

module.exports = mongoose.model('UserNotification', userNotificationSchema);
