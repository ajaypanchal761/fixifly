const mongoose = require('mongoose');
const moment = require('moment');

const adminNotificationSchema = new mongoose.Schema({
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
  targetAudience: {
    type: String,
    enum: ['all', 'users', 'vendors', 'specific'],
    required: true
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],
  scheduledAt: {
    type: Date,
    default: null
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'scheduled', 'failed'],
    default: 'draft'
  },
  sentAt: {
    type: Date,
    default: null
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
  failedCount: {
    type: Number,
    default: 0
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
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
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time ago
adminNotificationSchema.virtual('timeAgo').get(function() {
  return moment(this.createdAt).fromNow();
});

// Virtual for delivery rate
adminNotificationSchema.virtual('deliveryRate').get(function() {
  if (this.sentCount === 0) return 0;
  return Math.round((this.deliveredCount / this.sentCount) * 100);
});

// Virtual for read rate
adminNotificationSchema.virtual('readRate').get(function() {
  if (this.deliveredCount === 0) return 0;
  return Math.round((this.readCount / this.deliveredCount) * 100);
});

// Static method to get notification statistics
adminNotificationSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalNotifications: { $sum: 1 },
        sentNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        },
        scheduledNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
        },
        draftNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        failedNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        totalSentCount: { $sum: '$sentCount' },
        totalDeliveredCount: { $sum: '$deliveredCount' },
        totalReadCount: { $sum: '$readCount' },
        totalFailedCount: { $sum: '$failedCount' }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalNotifications: 0,
      sentNotifications: 0,
      scheduledNotifications: 0,
      draftNotifications: 0,
      failedNotifications: 0,
      totalRecipients: 0,
      averageDeliveryRate: 0,
      averageReadRate: 0
    };
  }

  const result = stats[0];
  const averageDeliveryRate = result.totalSentCount > 0 
    ? Math.round((result.totalDeliveredCount / result.totalSentCount) * 100) 
    : 0;
  const averageReadRate = result.totalDeliveredCount > 0 
    ? Math.round((result.totalReadCount / result.totalDeliveredCount) * 100) 
    : 0;

  return {
    totalNotifications: result.totalNotifications,
    sentNotifications: result.sentNotifications,
    scheduledNotifications: result.scheduledNotifications,
    draftNotifications: result.draftNotifications,
    failedNotifications: result.failedNotifications,
    totalRecipients: result.totalSentCount,
    averageDeliveryRate,
    averageReadRate
  };
};

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);

module.exports = AdminNotification;
