const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  // Vendor reference
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  
  vendorId: {
    type: String,
    required: true
  },
  
  // Vendor details (snapshot at time of request)
  vendorName: {
    type: String,
    required: true
  },
  
  vendorEmail: {
    type: String,
    required: true
  },
  
  vendorPhone: {
    type: String,
    required: true
  },
  
  // Withdrawal details
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'processed'],
    default: 'pending'
  },
  
  // Admin processing details
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  processedAt: {
    type: Date,
    default: null
  },
  
  adminNotes: {
    type: String,
    default: ''
  },
  
  // Bank details (if needed for processing)
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  
  // Transaction reference (when processed)
  transactionId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
withdrawalRequestSchema.index({ vendorId: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });
withdrawalRequestSchema.index({ createdAt: -1 });

// Virtual for formatted amount
withdrawalRequestSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString()}`;
});

// Method to approve withdrawal
withdrawalRequestSchema.methods.approve = async function(adminId, notes = '') {
  this.status = 'approved';
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.adminNotes = notes;
  return this.save();
};

// Method to decline withdrawal
withdrawalRequestSchema.methods.decline = async function(adminId, notes = '') {
  this.status = 'declined';
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.adminNotes = notes;
  return this.save();
};

// Static method to get pending requests
withdrawalRequestSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending' })
    .populate('vendor', 'vendorId firstName lastName email phone')
    .sort({ createdAt: -1 });
};

// Static method to get requests by vendor
withdrawalRequestSchema.statics.getVendorRequests = function(vendorId) {
  return this.find({ vendorId })
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
