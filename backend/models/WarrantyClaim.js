const mongoose = require('mongoose');

const warrantyClaimSchema = new mongoose.Schema({
  // User and subscription details
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: String,
    required: true
  },
  planName: {
    type: String,
    required: true
  },

  // Claim details
  item: {
    type: String,
    required: true,
    trim: true
  },
  issueDescription: {
    type: String,
    required: true,
    trim: true
  },

  // Status and workflow
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in_progress', 'completed'],
    default: 'pending'
  },

  // Admin actions
  adminNotes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },

  // Vendor assignment
  assignedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  assignedAt: {
    type: Date
  },

  // Service details
  serviceDetails: {
    estimatedCost: {
      type: Number,
      default: 0
    },
    actualCost: {
      type: Number,
      default: 0
    },
    serviceDate: {
      type: Date
    },
    completionNotes: {
      type: String,
      trim: true
    }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
warrantyClaimSchema.index({ userId: 1, status: 1 });
warrantyClaimSchema.index({ subscriptionId: 1 });
warrantyClaimSchema.index({ status: 1 });
warrantyClaimSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WarrantyClaim', warrantyClaimSchema);
