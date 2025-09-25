const mongoose = require("mongoose");

// Service schema for individual services in booking
const bookingServiceSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
}, { _id: false });

// Main booking schema
const bookingSchema = new mongoose.Schema({
  // Customer Information
  customer: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
      },
      pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true,
        match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
      }
    }
  },

  // Service Information
  services: [bookingServiceSchema],
  
  // Pricing Information
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    serviceFee: {
      type: Number,
      required: true,
      min: [0, 'Service fee cannot be negative'],
      default: 100
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    }
  },

  // Booking Status
  status: {
    type: String,
    enum: ['pending', 'waiting_for_engineer', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },

  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Payment Information
  payment: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet'],
      default: 'card'
    },
    transactionId: {
      type: String,
      trim: true
    },
    paidAt: {
      type: Date
    },
    // Razorpay specific fields
    razorpayOrderId: {
      type: String,
      trim: true
    },
    razorpayPaymentId: {
      type: String,
      trim: true
    },
    razorpaySignature: {
      type: String,
      trim: true
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed
    }
  },

  // Billing Amount (vendor's service charge)
  billingAmount: {
    type: String,
    trim: true,
    default: ''
  },

  // Scheduling Information
  scheduling: {
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required']
    },
    preferredTimeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      required: [true, 'Preferred time slot is required']
    },
    scheduledDate: {
      type: Date
    },
    scheduledTime: {
      type: String
    }
  },

  // Vendor Assignment
  vendor: {
    vendorId: {
      type: String,
      ref: 'Vendor'
    },
    assignedAt: {
      type: Date
    }
  },

  // Vendor Response to Assignment
  vendorResponse: {
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    respondedAt: {
      type: Date
    },
    responseNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Response note cannot exceed 500 characters']
    }
  },

  // Payment Information
  paymentMode: {
    type: String,
    enum: ['online', 'cash'],
    default: 'online'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'payment_done', 'collected', 'not_collected'],
    default: 'pending'
  },

  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },

  // Assignment Notes
  assignmentNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Assignment notes cannot exceed 500 characters']
  },

  // Completion Data (when task is completed)
  completionData: {
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution note cannot exceed 1000 characters']
    },
    billingAmount: {
      type: String,
      trim: true
    },
    spareParts: [{
      id: Number,
      name: String,
      amount: String,
      photo: String
    }],
    travelingAmount: {
      type: String,
      trim: true
    },
    paymentMethod: {
      type: String,
      enum: ['online', 'cash'],
      trim: true
    },
    completedAt: {
      type: Date
    },
    totalAmount: {
      type: Number
    },
    includeGST: {
      type: Boolean,
      default: false
    },
    gstAmount: {
      type: Number,
      default: 0
    }
  },

  // Reschedule Information
  rescheduleData: {
    isRescheduled: {
      type: Boolean,
      default: false
    },
    originalDate: {
      type: Date
    },
    originalTime: {
      type: String
    },
    rescheduledDate: {
      type: Date
    },
    rescheduledTime: {
      type: String
    },
    rescheduleReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reschedule reason cannot exceed 500 characters']
    },
    rescheduledAt: {
      type: Date
    },
    rescheduledBy: {
      type: String,
      enum: ['vendor', 'customer', 'admin'],
      default: 'vendor'
    }
  },

  // Cancellation Information
  cancellationData: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledBy: {
      type: String,
      enum: ['vendor', 'customer', 'admin'],
      default: 'vendor'
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
    },
    cancelledAt: {
      type: Date
    },
    cancelledByVendor: {
      vendorId: {
        type: String,
        ref: 'Vendor'
      },
      vendorName: {
        type: String
      }
    }
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
    },
    completedAt: {
      type: Date
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for booking reference number
bookingSchema.virtual('bookingReference').get(function() {
  return `FIX${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for total services count
bookingSchema.virtual('totalServices').get(function() {
  return this.services.length;
});

// Pre-save middleware to update updatedAt
bookingSchema.pre('save', function(next) {
  this.tracking.updatedAt = new Date();
  next();
});

// Indexes for better performance
bookingSchema.index({ 'customer.email': 1 });
bookingSchema.index({ 'customer.phone': 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ 'scheduling.preferredDate': 1 });
bookingSchema.index({ 'vendor.vendorId': 1 });
bookingSchema.index({ createdAt: -1 });

// Static methods
bookingSchema.statics.findByCustomerEmail = function(email) {
  return this.find({ 'customer.email': email }).sort({ createdAt: -1 });
};

bookingSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

bookingSchema.statics.findByVendor = function(vendorId) {
  return this.find({ 'vendor.vendorId': vendorId }).sort({ createdAt: -1 });
};

// Instance methods
bookingSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'completed') {
    this.tracking.completedAt = new Date();
  }
  return this.save();
};

bookingSchema.methods.assignVendor = function(vendorId) {
  this.vendor.vendorId = vendorId;
  this.vendor.assignedAt = new Date();
  return this.save();
};

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = { Booking };
