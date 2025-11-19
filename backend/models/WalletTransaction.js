const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
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
  
  // Transaction details
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'earning', 'penalty', 'refund', 'bonus'],
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  // Payment gateway details
  razorpayOrderId: {
    type: String,
    default: null
  },
  
  razorpayPaymentId: {
    type: String,
    default: null
  },
  
  razorpaySignature: {
    type: String,
    default: null
  },
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Balance tracking
  balanceBefore: {
    type: Number,
    required: true
  },
  
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // Additional metadata
  metadata: {
    bookingId: {
      type: String,
      default: null
    },
    caseId: {
      type: String,
      default: null
    },
    serviceName: {
      type: String,
      default: null
    },
    customerName: {
      type: String,
      default: null
    },
    adminNotes: {
      type: String,
      default: null
    }
  },
  
  // Audit fields
  processedBy: {
    type: String,
    enum: ['system', 'admin', 'vendor', 'customer'],
    default: 'system'
  },
  
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
walletTransactionSchema.index({ vendor: 1, createdAt: -1 });
walletTransactionSchema.index({ vendorId: 1, createdAt: -1 });
// transactionId already has unique index from schema definition
walletTransactionSchema.index({ type: 1, status: 1 });
walletTransactionSchema.index({ razorpayOrderId: 1 });
walletTransactionSchema.index({ razorpayPaymentId: 1 });
walletTransactionSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted amount
walletTransactionSchema.virtual('formattedAmount').get(function() {
  const sign = this.amount >= 0 ? '+' : '';
  return `${sign}₹${Math.abs(this.amount).toLocaleString()}`;
});

// Virtual for transaction type display
walletTransactionSchema.virtual('typeDisplay').get(function() {
  const typeMap = {
    'deposit': 'Deposit',
    'withdrawal': 'Withdrawal',
    'earning': 'Earning',
    'penalty': 'Penalty',
    'refund': 'Refund',
    'bonus': 'Bonus'
  };
  return typeMap[this.type] || this.type;
});

// Static method to get vendor transaction summary
walletTransactionSchema.statics.getVendorSummary = async function(vendorId) {
  const summary = await this.aggregate([
    { $match: { vendorId: vendorId, status: 'completed' } },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalEarnings: 0,
    totalPenalties: 0,
    totalRefunds: 0,
    totalBonuses: 0,
    transactionCounts: {}
  };
  
  summary.forEach(item => {
    const type = item._id;
    const amount = item.totalAmount;
    const count = item.count;
    
    switch (type) {
      case 'deposit':
        result.totalDeposits = amount;
        break;
      case 'withdrawal':
        result.totalWithdrawals = Math.abs(amount);
        break;
      case 'earning':
        result.totalEarnings = amount;
        break;
      case 'penalty':
        result.totalPenalties = Math.abs(amount);
        break;
      case 'refund':
        result.totalRefunds = amount;
        break;
      case 'bonus':
        result.totalBonuses = amount;
        break;
    }
    
    result.transactionCounts[type] = count;
  });
  
  return result;
};

// Static method to get recent transactions
walletTransactionSchema.statics.getRecentTransactions = function(vendorId, limit = 10) {
  return this.find({ vendorId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('vendor', 'vendorId firstName lastName email phone');
};

// Instance method to mark as completed
walletTransactionSchema.methods.markCompleted = function(balanceAfter) {
  this.status = 'completed';
  this.balanceAfter = balanceAfter;
  this.processedAt = new Date();
  return this.save();
};

// Instance method to mark as failed
walletTransactionSchema.methods.markFailed = function() {
  this.status = 'failed';
  this.processedAt = new Date();
  return this.save();
};

// Transform JSON output
walletTransactionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
module.exports = WalletTransaction;
