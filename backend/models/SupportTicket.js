const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: function () {
      return `TK${Date.now().toString().slice(-6)}`;
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  supportType: {
    type: String,
    enum: ['service', 'product', 'amc', 'others'],
    required: true
  },
  type: {
    type: String,
    required: true
  },
  caseId: {
    type: String,
    default: null
  },
  subscriptionId: {
    type: String,
    default: null
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Submitted', 'In Progress', 'Waiting for Response', 'Rescheduled', 'Cancelled', 'Resolved', 'Closed'],
    default: 'Submitted',
    index: true
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  vendorStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'Completed', 'Declined', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  vendorAcceptedAt: {
    type: Date,
    default: null
  },
  vendorDeclinedAt: {
    type: Date,
    default: null
  },
  vendorDeclineReason: {
    type: String,
    default: null
  },
  vendorCompletedAt: {
    type: Date,
    default: null
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  scheduledTime: {
    type: String,
    default: null
  },
  scheduleNotes: {
    type: String,
    default: null
  },
  estimatedResolution: {
    type: Date,
    default: null
  },
  resolution: {
    type: String,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },

  // Completion data (for vendor completion)
  completionData: {
    resolutionNote: String,
    spareParts: [{
      id: Number,
      name: String,
      amount: String,
      photo: String,
      warranty: String
    }],
    paymentMethod: {
      type: String,
      enum: ['online', 'cash'],
      default: 'cash'
    },
    totalAmount: Number,
    billingAmount: Number,
    includeGST: Boolean,
    gstAmount: Number,
    travelingAmount: String,
    completedAt: Date
  },

  // Vendor assignment tracking
  vendorAssignmentHistory: [{
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    assignedAt: Date,
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'declined', 'completed']
    },
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Vendor communication tracking
  vendorCommunications: [{
    message: String,
    sender: {
      type: String,
      enum: ['vendor', 'admin', 'user']
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId
    },
    senderName: String,
    isInternal: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Vendor performance tracking
  vendorPerformance: {
    responseTime: Number, // in hours
    completionTime: Number, // in hours
    customerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    customerFeedback: String,
    qualityScore: {
      type: Number,
      min: 1,
      max: 10
    }
  },

  // Payment information
  paymentMode: {
    type: String,
    enum: ['online', 'cash'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'collected', 'failed'],
    default: 'collected'
  },
  billingAmount: {
    type: Number,
    default: 0
  },

  // Reschedule data (matching booking task format)
  rescheduleData: {
    isRescheduled: Boolean,
    originalDate: Date,
    originalTime: String,
    rescheduledDate: Date,
    rescheduledTime: String,
    rescheduleReason: String,
    rescheduledAt: Date,
    rescheduledBy: {
      type: String,
      enum: ['admin', 'vendor', 'user']
    }
  },

  // Cancellation data (matching booking task format)
  cancellationData: {
    isCancelled: Boolean,
    cancelledBy: {
      type: String,
      enum: ['admin', 'vendor', 'user']
    },
    cancellationReason: String,
    cancelledAt: Date,
    cancelledByVendor: {
      vendorId: mongoose.Schema.Types.ObjectId,
      vendorName: String
    }
  },

  tags: [{
    type: String,
    trim: true
  }],
  responses: [{
    message: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      enum: ['user', 'admin'],
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],
  responseCount: {
    type: Number,
    default: 0
  },
  lastResponseAt: {
    type: Date,
    default: Date.now
  },
  lastResponseBy: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: {
    type: Date,
    default: null
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  customerSatisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    feedback: {
      type: String,
      default: null
    },
    ratedAt: {
      type: Date,
      default: null
    }
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'email', 'phone', 'whatsapp'],
      default: 'web'
    },
    userAgent: String,
    ipAddress: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
SupportTicketSchema.index({ status: 1, priority: 1 });
SupportTicketSchema.index({ createdAt: -1 });
SupportTicketSchema.index({ lastResponseAt: -1 });
SupportTicketSchema.index({ assignedTo: 1, status: 1 });
SupportTicketSchema.index({ assignedTo: 1, vendorStatus: 1 });
SupportTicketSchema.index({ vendorStatus: 1, createdAt: -1 });
SupportTicketSchema.index({ assignedBy: 1, createdAt: -1 });
SupportTicketSchema.index({ scheduledDate: 1, scheduledTime: 1 });
SupportTicketSchema.index({ 'vendorAssignmentHistory.vendorId': 1 });
SupportTicketSchema.index({ 'vendorPerformance.customerRating': -1 });

// Pre-save middleware to generate ticket ID
SupportTicketSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      // Use a more robust method to generate unique ticket ID
      let ticketId;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const count = await mongoose.model('SupportTicket').countDocuments();
        ticketId = `TK${String(count + 1 + attempts).padStart(6, '0')}`;

        // Check if this ticketId already exists
        const existingTicket = await mongoose.model('SupportTicket').findOne({ ticketId });
        if (!existingTicket) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        // Fallback to timestamp-based ID if we can't find a unique sequential one
        ticketId = `TK${Date.now().toString().slice(-6)}`;
      }

      this.ticketId = ticketId;
    } catch (error) {
      console.error('Error generating ticket ID:', error);
      // Fallback to timestamp-based ID
      this.ticketId = `TK${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Virtual for formatted creation date
SupportTicketSchema.virtual('formattedCreatedAt').get(function () {
  if (!this.createdAt) {
    return 'Date not available';
  }
  try {
    const date = this.createdAt.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const time = this.createdAt.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${date} at ${time}`;
  } catch (error) {
    return 'Date not available';
  }
});

// Virtual for last update time
SupportTicketSchema.virtual('lastUpdate').get(function () {
  if (!this.updatedAt) {
    return 'Date not available';
  }
  try {
    return this.updatedAt.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' at ' + this.updatedAt.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'Date not available';
  }
});

// Method to add response
SupportTicketSchema.methods.addResponse = function (message, sender, senderId, senderName, isInternal = false) {
  this.responses.push({
    message,
    sender,
    senderId,
    senderName,
    isInternal
  });
  this.responseCount = this.responses.length;
  this.lastResponseAt = new Date();
  this.lastResponseBy = sender;

  // Update status based on response
  if (sender === 'admin' && this.status === 'Submitted') {
    this.status = 'In Progress';
  } else if (sender === 'user' && this.status === 'In Progress') {
    this.status = 'Waiting for Response';
  }

  return this.save();
};

// Method to resolve ticket
SupportTicketSchema.methods.resolveTicket = function (resolution, resolvedBy) {
  this.status = 'Resolved';
  this.resolution = resolution;
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  return this.save();
};

// Method to escalate ticket
SupportTicketSchema.methods.escalateTicket = function (escalatedTo) {
  this.isEscalated = true;
  this.escalatedAt = new Date();
  this.escalatedTo = escalatedTo;
  this.priority = 'High';
  return this.save();
};

// Method to assign vendor to ticket
SupportTicketSchema.methods.assignVendor = function (vendorId, adminId, notes = '') {
  this.assignedTo = vendorId;
  this.assignedAt = new Date();
  this.assignedBy = adminId;
  this.vendorStatus = 'Pending';

  // Add to assignment history
  this.vendorAssignmentHistory.push({
    vendorId: vendorId,
    assignedAt: new Date(),
    assignedBy: adminId,
    status: 'assigned',
    notes: notes
  });

  return this.save();
};

// Method to accept ticket by vendor
SupportTicketSchema.methods.acceptByVendor = function (vendorId) {
  if (this.assignedTo.toString() !== vendorId.toString()) {
    throw new Error('Vendor not assigned to this ticket');
  }

  this.vendorStatus = 'Accepted';
  this.vendorAcceptedAt = new Date();

  // Update assignment history
  const assignment = this.vendorAssignmentHistory.find(a =>
    a.vendorId.toString() === vendorId.toString() && a.status === 'assigned'
  );
  if (assignment) {
    assignment.status = 'accepted';
  }

  return this.save();
};

// Method to decline ticket by vendor
SupportTicketSchema.methods.declineByVendor = async function (vendorId, reason = '') {
  if (this.assignedTo.toString() !== vendorId.toString()) {
    throw new Error('Vendor not assigned to this ticket');
  }

  this.vendorStatus = 'Declined';
  this.vendorDeclinedAt = new Date();
  this.vendorDeclineReason = reason;

  // Update ticket status to Cancelled
  this.status = 'Cancelled';
  // Keep assignedTo to show in vendor's cancelled tab
  // this.assignedTo = null;
  // this.assignedAt = null;

  // Update assignment history
  const assignment = this.vendorAssignmentHistory.find(a =>
    a.vendorId.toString() === vendorId.toString() && a.status === 'assigned'
  );
  if (assignment) {
    assignment.status = 'declined';
    assignment.notes = reason;
  }

  // Apply penalty for task rejection
  const VendorWallet = require('./VendorWallet');
  const Vendor = require('./Vendor');

  // Get vendor details to get the vendorId string
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    console.error('Vendor not found for penalty application:', vendorId);
    return this.save();
  }

  const wallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });

  if (wallet) {
    const penaltyAmount = 100;
    // Check if wallet has balance > 0 - no penalty if balance is 0
    if (wallet.currentBalance > 0 && wallet.currentBalance >= penaltyAmount) {
      console.log('🔧 PENALTY DEBUG: Applying penalty for task rejection', {
        ticketId: this.ticketId,
        vendorId: vendor.vendorId,
        amount: penaltyAmount
      });

      // Add penalty for task rejection
      await wallet.addPenalty({
        caseId: this._id,
        type: 'rejection',
        amount: penaltyAmount, // ₹100 penalty for rejecting task
        description: `Task rejection penalty - ${this.ticketId}`
      });

      console.log('🔧 PENALTY DEBUG: Penalty applied successfully', {
        newBalance: wallet.currentBalance,
        totalPenalties: wallet.totalPenalties
      });
    } else {
      console.log('🔧 PENALTY DEBUG: Penalty skipped - balance is 0 or insufficient', {
        ticketId: this.ticketId,
        vendorId: vendor.vendorId,
        currentBalance: wallet.currentBalance,
        requiredAmount: penaltyAmount
      });
    }
  } else {
    console.error('Vendor wallet not found for penalty application:', vendor.vendorId);
  }

  return this.save();
};

// Method to complete ticket by vendor
SupportTicketSchema.methods.completeByVendor = function (vendorId, completionData = {}) {
  if (this.assignedTo.toString() !== vendorId.toString()) {
    throw new Error('Vendor not assigned to this ticket');
  }

  this.vendorStatus = 'Completed';
  this.vendorCompletedAt = new Date();

  // Store completion data
  if (completionData) {
    this.completionData = {
      ...completionData,
      completedAt: new Date()
    };

    // Update payment information from completion data
    if (completionData.paymentMethod) {
      this.paymentMode = completionData.paymentMethod;
      this.paymentStatus = completionData.paymentMethod === 'online' ? 'pending' : 'collected';

      // Set status based on payment method
      if (completionData.paymentMethod === 'online') {
        // For online payment, keep status as 'In Progress' until payment is completed
        this.status = 'In Progress';
      } else {
        // For cash payment, mark as resolved immediately
        this.status = 'Resolved';
        this.resolvedAt = new Date();
      }
    } else {
      // Default to resolved if no payment method specified
      this.status = 'Resolved';
      this.resolvedAt = new Date();
    }

    if (completionData.billingAmount !== undefined) {
      console.log('Setting billing amount in model:', completionData.billingAmount);
      this.billingAmount = completionData.billingAmount;
    } else {
      console.log('Billing amount not provided in completion data');
    }
  } else {
    // If no completion data, mark as resolved
    this.status = 'Resolved';
    this.resolvedAt = new Date();
  }

  // Update assignment history
  const assignment = this.vendorAssignmentHistory.find(a =>
    a.vendorId.toString() === vendorId.toString() && a.status === 'accepted'
  );
  if (assignment) {
    assignment.status = 'completed';
  }

  return this.save();
};

// Method to add vendor communication
SupportTicketSchema.methods.addVendorCommunication = function (message, sender, senderId, senderName, isInternal = false) {
  this.vendorCommunications.push({
    message,
    sender,
    senderId,
    senderName,
    isInternal
  });

  return this.save();
};

// Method to update vendor performance
SupportTicketSchema.methods.updateVendorPerformance = function (performanceData) {
  this.vendorPerformance = {
    ...this.vendorPerformance,
    ...performanceData
  };

  return this.save();
};

// Method to cancel ticket by vendor
SupportTicketSchema.methods.cancelByVendor = function (vendorId, reason = '') {
  if (this.assignedTo.toString() !== vendorId.toString()) {
    throw new Error('Vendor not assigned to this ticket');
  }

  this.vendorStatus = 'Cancelled';
  this.status = 'Closed';
  this.vendorDeclinedAt = new Date();
  this.vendorDeclineReason = reason;

  // Store cancellation data (matching booking task format)
  this.cancellationData = {
    isCancelled: true,
    cancelledBy: 'vendor',
    cancellationReason: reason,
    cancelledAt: new Date(),
    cancelledByVendor: {
      vendorId: vendorId,
      vendorName: 'Vendor' // Will be populated by controller
    }
  };

  // Update assignment history
  const assignment = this.vendorAssignmentHistory.find(a =>
    a.vendorId.toString() === vendorId.toString() && a.status === 'accepted'
  );
  if (assignment) {
    assignment.status = 'cancelled';
    assignment.notes = reason;
  }

  return this.save();
};

const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);

module.exports = SupportTicket;
