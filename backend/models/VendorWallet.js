const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  caseId: {
    type: String,
    required: function() {
      // caseId is required for all transaction types except deposit and manual_adjustment
      return this.type !== 'deposit' && this.type !== 'manual_adjustment';
    }
  },
  type: {
    type: String,
    enum: ['earning', 'penalty', 'deposit', 'withdrawal', 'task_acceptance_fee', 'cash_collection', 'refund', 'manual_adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cash', 'system'],
    required: true
  },
  billingAmount: {
    type: Number,
    required: function() {
      // billingAmount is required for all transaction types except manual_adjustment
      return this.type !== 'manual_adjustment';
    }
  },
  spareAmount: {
    type: Number,
    default: 0
  },
  travellingAmount: {
    type: Number,
    default: 0
  },
  bookingAmount: {
    type: Number,
    default: 0
  },
  gstIncluded: {
    type: Boolean,
    default: false
  },
  gstAmount: {
    type: Number,
    default: 0
  },
  calculatedAmount: {
    type: Number,
    required: function() {
      // calculatedAmount is required for all transaction types except manual_adjustment
      return this.type !== 'manual_adjustment';
    }
  },
  metadata: {
    adminNotes: String,
    vendorNotes: String,
    cashPhoto: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  },
  processedBy: {
    type: String,
    enum: ['system', 'admin', 'vendor'],
    default: 'system'
  }
}, {
  timestamps: true
});

const vendorWalletSchema = new mongoose.Schema({
  vendorId: {
    type: String,
    required: true,
    unique: true,
    ref: 'Vendor'
  },
  currentBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  securityDeposit: {
    type: Number,
    default: 3999,
    min: 3999
  },
  availableBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalPenalties: {
    type: Number,
    default: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0
  },
  totalDeposits: {
    type: Number,
    default: 0
  },
  totalTaskAcceptanceFees: {
    type: Number,
    default: 0
  },
  totalCashCollections: {
    type: Number,
    default: 0
  },
  totalRefunds: {
    type: Number,
    default: 0
  },
  // Statistics
  totalTasksCompleted: {
    type: Number,
    default: 0
  },
  totalTasksRejected: {
    type: Number,
    default: 0
  },
  totalTasksCancelled: {
    type: Number,
    default: 0
  },
  totalRejectionPenalties: {
    type: Number,
    default: 0
  },
  totalCancellationPenalties: {
    type: Number,
    default: 0
  },
  // Monthly tracking
  monthlyEarnings: [{
    year: Number,
    month: Number,
    amount: Number
  }],
  lastTransactionAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  transactions: [walletTransactionSchema]
}, {
  timestamps: true
});

// Virtual for available balance (current balance - security deposit)
vendorWalletSchema.virtual('availableForWithdrawal').get(function() {
  return Math.max(0, this.currentBalance - this.securityDeposit);
});

// Method to add earning
vendorWalletSchema.methods.addEarning = async function(transactionData) {
  const {
    caseId,
    billingAmount,
    spareAmount = 0,
    travellingAmount = 0,
    bookingAmount = 0,
    paymentMethod,
    gstIncluded = false,
    description = 'Task completion earning'
  } = transactionData;

  // Check for duplicate earning for the same case
  const existingEarning = this.transactions.find(t => 
    t.caseId === caseId && 
    t.type === 'earning' && 
    t.paymentMethod === paymentMethod
  );

  if (existingEarning) {
    console.log(`Duplicate earning prevented for case: ${caseId}, payment method: ${paymentMethod}`);
    return existingEarning; // Return existing transaction
  }

  let calculatedAmount = 0;
  let gstAmount = 0;

  // Calculate GST if included (billing amount is GST-inclusive)
  if (gstIncluded) {
    gstAmount = billingAmount * 0.18 / 1.18; // GST amount from GST-inclusive amount
    billingAmount = billingAmount / 1.18; // GST-excluded amount
  }

  // Calculate amount based on payment method
  if (paymentMethod === 'online') {
    // Online payment: (Billing - Spare - Travel - Booking) * 50% + Spare + Travel + Booking
    const baseAmount = billingAmount - spareAmount - travellingAmount - bookingAmount;
    calculatedAmount = (baseAmount * 0.5) + spareAmount + travellingAmount + bookingAmount;
  } else if (paymentMethod === 'cash') {
    // Cash payment: (Billing - Spare - Travel - Booking) * 50% + Spare + Travel + Booking
    const baseAmount = billingAmount - spareAmount - travellingAmount - bookingAmount;
    calculatedAmount = (baseAmount * 0.5) + spareAmount + travellingAmount + bookingAmount;
  }

  // Special case for amounts <= 500
  if (billingAmount <= 500) {
    if (paymentMethod === 'online') {
      calculatedAmount = billingAmount - 20; // 20 rupees cut for online
    } else {
      calculatedAmount = billingAmount; // Full amount for cash
    }
  }

  const transaction = {
    transactionId: `EARN_${this.vendorId}_${Date.now()}`,
    caseId,
    type: 'earning',
    amount: calculatedAmount,
    description,
    paymentMethod,
    billingAmount,
    spareAmount,
    travellingAmount,
    bookingAmount,
    gstIncluded,
    gstAmount,
    calculatedAmount,
    status: 'completed'
  };

  this.transactions.push(transaction);
  this.currentBalance += calculatedAmount;
  this.totalEarnings += calculatedAmount;
  this.totalTasksCompleted += 1;
  this.lastTransactionAt = new Date();

  // Update monthly earnings
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  const monthlyEarning = this.monthlyEarnings.find(m => m.year === year && m.month === month);
  if (monthlyEarning) {
    monthlyEarning.amount += calculatedAmount;
  } else {
    this.monthlyEarnings.push({ year, month, amount: calculatedAmount });
  }

  await this.save();
  return transaction;
};

// Method to add penalty
vendorWalletSchema.methods.addPenalty = async function(penaltyData) {
  const {
    caseId,
    type: penaltyType,
    amount,
    description
  } = penaltyData;

  const transaction = {
    transactionId: `PEN_${this.vendorId}_${Date.now()}`,
    caseId,
    type: 'penalty',
    amount: -amount, // Negative amount for penalty
    description,
    paymentMethod: 'system',
    billingAmount: 0,
    calculatedAmount: -amount,
    status: 'completed'
  };

  this.transactions.push(transaction);
  this.currentBalance = Math.max(0, this.currentBalance - amount);
  this.totalPenalties += amount;
  this.lastTransactionAt = new Date();

  // Update specific penalty counters
  if (penaltyType === 'rejection') {
    this.totalTasksRejected += 1;
    this.totalRejectionPenalties += amount;
  } else if (penaltyType === 'cancellation') {
    this.totalTasksCancelled += 1;
    this.totalCancellationPenalties += amount;
  } else if (penaltyType === 'auto_rejection') {
    this.totalTasksRejected += 1;
    this.totalRejectionPenalties += amount;
  }

  await this.save();
  return transaction;
};

// Method to add task acceptance fee
vendorWalletSchema.methods.addTaskAcceptanceFee = async function(taskData) {
  const {
    caseId,
    taskMRP,
    description = 'Task acceptance fee'
  } = taskData;

  const transaction = {
    transactionId: `FEE_${this.vendorId}_${Date.now()}`,
    caseId,
    type: 'task_acceptance_fee',
    amount: -taskMRP, // Negative amount for fee
    description,
    paymentMethod: 'system',
    billingAmount: taskMRP,
    calculatedAmount: -taskMRP,
    status: 'completed'
  };

  this.transactions.push(transaction);
  this.currentBalance = Math.max(0, this.currentBalance - taskMRP);
  this.totalTaskAcceptanceFees += taskMRP;
  this.lastTransactionAt = new Date();

  await this.save();
  return transaction;
};

// Method to add cash collection deduction
vendorWalletSchema.methods.addCashCollectionDeduction = async function(collectionData) {
  const {
    caseId,
    billingAmount,
    spareAmount = 0,
    travellingAmount = 0,
    bookingAmount = 0,
    gstIncluded = false,
    description = 'Cash collection deduction'
  } = collectionData;

  // Check for duplicate cash collection for the same case
  const existingCollection = this.transactions.find(t => 
    t.caseId === caseId && 
    t.type === 'cash_collection'
  );

  if (existingCollection) {
    console.log(`Duplicate cash collection prevented for case: ${caseId}`);
    return existingCollection; // Return existing transaction
  }

  let calculatedAmount = 0;
  let gstAmount = 0;
  let netBillingAmount = billingAmount;

  // Calculate GST if included (billing amount is GST-inclusive)
  if (gstIncluded) {
    gstAmount = billingAmount * 0.18 / 1.18; // GST amount from GST-inclusive amount
    netBillingAmount = billingAmount / 1.18; // GST-excluded amount
  }

  // Cash collection: (Billing - Spare - Travel - Booking) * 50%
  const baseAmount = netBillingAmount - spareAmount - travellingAmount - bookingAmount;
  calculatedAmount = baseAmount * 0.5;

  // Add GST amount to cash collection deduction if GST is included
  if (gstIncluded) {
    calculatedAmount += gstAmount;
  }

  const transaction = {
    transactionId: `CASH_${this.vendorId}_${Date.now()}`,
    caseId,
    type: 'cash_collection',
    amount: -calculatedAmount, // Negative amount for deduction
    description,
    paymentMethod: 'cash',
    billingAmount,
    spareAmount,
    travellingAmount,
    bookingAmount,
    gstIncluded,
    gstAmount,
    calculatedAmount: -calculatedAmount,
    status: 'completed'
  };

  this.transactions.push(transaction);
  this.currentBalance = Math.max(0, this.currentBalance - calculatedAmount);
  this.totalCashCollections += calculatedAmount;
  this.lastTransactionAt = new Date();

  await this.save();
  return transaction;
};

// Method to add deposit
vendorWalletSchema.methods.addDeposit = async function(depositData) {
  const {
    amount,
    description = 'Wallet deposit',
    transactionId = `DEP_${this.vendorId}_${Date.now()}`
  } = depositData;

  const transaction = {
    transactionId,
    type: 'deposit',
    amount,
    description,
    paymentMethod: 'online',
    billingAmount: amount,
    calculatedAmount: amount,
    status: 'completed'
  };

  this.transactions.push(transaction);
  this.currentBalance += amount;
  this.totalDeposits += amount;
  this.lastTransactionAt = new Date();

  await this.save();
  return transaction;
};

// Method to add withdrawal
vendorWalletSchema.methods.addWithdrawal = async function(withdrawalData) {
  const {
    amount,
    description = 'Wallet withdrawal',
    transactionId = `WTH_${this.vendorId}_${Date.now()}`
  } = withdrawalData;

  // Check if withdrawal amount is available (considering security deposit)
  const availableAmount = this.currentBalance - this.securityDeposit;
  if (amount > availableAmount) {
    throw new Error('Insufficient balance for withdrawal. Security deposit cannot be withdrawn.');
  }

  const transaction = {
    transactionId,
    type: 'withdrawal',
    amount: -amount, // Negative amount for withdrawal
    description,
    paymentMethod: 'online',
    billingAmount: amount,
    calculatedAmount: -amount,
    status: 'pending'
  };

  this.transactions.push(transaction);
  this.currentBalance -= amount;
  this.totalWithdrawals += amount;
  this.lastTransactionAt = new Date();

  await this.save();
  return transaction;
};

// Method to add refund
vendorWalletSchema.methods.addRefund = async function(refundData) {
  const {
    caseId,
    amount,
    description = 'Penalty refund',
    transactionId = `REF_${this.vendorId}_${Date.now()}`
  } = refundData;

  const transaction = {
    transactionId,
    caseId,
    type: 'refund',
    amount,
    description,
    paymentMethod: 'system',
    billingAmount: amount,
    calculatedAmount: amount,
    status: 'completed'
  };

  this.transactions.push(transaction);
  this.currentBalance += amount;
  this.totalRefunds += amount;
  this.lastTransactionAt = new Date();

  await this.save();
  return transaction;
};

// Static method to get vendor wallet summary
vendorWalletSchema.statics.getVendorSummary = async function(vendorId) {
  const wallet = await this.findOne({ vendorId });
  if (!wallet) {
    return {
      currentBalance: 0,
      availableBalance: 0,
      totalEarnings: 0,
      totalPenalties: 0,
      totalWithdrawals: 0,
      totalDeposits: 0,
      totalTaskAcceptanceFees: 0,
      totalCashCollections: 0,
      totalRefunds: 0,
      totalTasksCompleted: 0,
      totalTasksRejected: 0,
      totalTasksCancelled: 0
    };
  }

  return {
    currentBalance: wallet.currentBalance,
    availableBalance: wallet.availableForWithdrawal,
    totalEarnings: wallet.totalEarnings,
    totalPenalties: wallet.totalPenalties,
    totalWithdrawals: wallet.totalWithdrawals,
    totalDeposits: wallet.totalDeposits,
    totalTaskAcceptanceFees: wallet.totalTaskAcceptanceFees,
    totalCashCollections: wallet.totalCashCollections,
    totalRefunds: wallet.totalRefunds,
    totalTasksCompleted: wallet.totalTasksCompleted,
    totalTasksRejected: wallet.totalTasksRejected,
    totalTasksCancelled: wallet.totalTasksCancelled
  };
};

// Static method to get recent transactions
vendorWalletSchema.statics.getRecentTransactions = async function(vendorId, limit = 10) {
  const wallet = await this.findOne({ vendorId });
  if (!wallet) {
    return [];
  }

  return wallet.transactions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map(transaction => ({
      _id: transaction._id,
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      status: transaction.status,
      createdAt: transaction.createdAt,
      formattedAmount: `₹${Math.abs(transaction.amount).toLocaleString()}`,
      typeDisplay: transaction.type.replace('_', ' ').toUpperCase()
    }));
};

// Add manual adjustment transaction
vendorWalletSchema.methods.addManualAdjustment = function(adjustmentData) {
  const {
    amount,
    type,
    description,
    processedBy = 'admin',
    metadata = {}
  } = adjustmentData;

  const transaction = {
    transactionId: `ADJ_${this.vendorId}_${Date.now()}`,
    type: 'manual_adjustment',
    amount: type === 'credit' ? amount : -amount,
    description,
    paymentMethod: 'system',
    status: 'completed',
    processedBy: 'admin',
    metadata: {
      ...metadata,
      adminId: processedBy
    },
    verificationStatus: 'approved'
  };

  this.transactions.push(transaction);
  // Don't update currentBalance here - it's already updated in the controller
  this.lastTransactionAt = new Date();

  return this.save();
};

// Pre-save middleware to update available balance
vendorWalletSchema.pre('save', function(next) {
  this.availableBalance = Math.max(0, this.currentBalance - this.securityDeposit);
  next();
});

module.exports = mongoose.model('VendorWallet', vendorWalletSchema);
