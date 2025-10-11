const mongoose = require('mongoose');

const vendorNotificationSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  type: {
    type: String,
    enum: ['warranty_claim', 'booking_assignment', 'payment_update', 'system_notification', 'support_ticket_assignment'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
vendorNotificationSchema.index({ vendorId: 1, isRead: 1 });
vendorNotificationSchema.index({ createdAt: -1 });
vendorNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VendorNotification', vendorNotificationSchema);
