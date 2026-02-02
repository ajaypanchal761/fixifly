const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true
    // Removed unique: true - unique constraint on embedded schema fields doesn't work properly
    // and causes duplicate key errors when multiple documents have null values.
    // Uniqueness should be enforced at application level or using a sparse index.
  },
  caseId: {
    type: String,
    required: function () {
      // caseId is required for all transaction types except deposit, manual_adjustment, and withdrawal_request
      return this.type !== 'deposit' && this.type !== 'manual_adjustment' && this.type !== 'withdrawal_request';
    }
  },
  type: {
    type: String,
    enum: ['earning', 'penalty', 'deposit', 'withdrawal', 'withdrawal_request', 'task_acceptance_fee', 'cash_collection', 'refund', 'manual_adjustment'],
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
    enum: ['pending', 'completed', 'failed', 'refunded', 'approved', 'declined', 'rejected'],
    default: 'completed'
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cash', 'system'],
    required: true
  },
  billingAmount: {
    type: Number,
    required: function () {
      // billingAmount is required for all transaction types except manual_adjustment and withdrawal_request
      return this.type !== 'manual_adjustment' && this.type !== 'withdrawal_request';
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
    required: function () {
      // calculatedAmount is required for all transaction types except manual_adjustment and withdrawal_request
      return this.type !== 'manual_adjustment' && this.type !== 'withdrawal_request';
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
    default: 0
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
vendorWalletSchema.virtual('availableForWithdrawal').get(function () {
  return Math.max(0, this.currentBalance - this.securityDeposit);
});

// Method to add earning
vendorWalletSchema.methods.addEarning = async function (transactionData) {
  const {
    caseId,
    billingAmount,
    spareAmount = 0,
    travellingAmount = 0,
    bookingAmount = 0,
    paymentMethod,
    gstIncluded = false,
    gstAmount: providedGstAmount = 0, // Use GST amount from frontend if provided
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

  // Calculate GST if included (billing amount is GST-excluded)
  let netBillingAmount = billingAmount;
  if (gstIncluded) {
    // When GST is included, billing amount is GST-excluded
    // Use provided GST amount from frontend, or calculate if not provided
    netBillingAmount = billingAmount; // GST-excluded amount (same as billing amount)
    gstAmount = providedGstAmount > 0 ? providedGstAmount : (billingAmount * 0.18); // Use provided GST or calculate
  }

  // Special case for amounts <= 300: Full amount goes to vendor (including GST)
  // Applies to both online and online with GST payments - vendor gets 100%, admin gets 0%
  if (netBillingAmount <= 300) {
    // Full billing amount + GST (if included) goes to vendor, admin gets nothing
    // For online: full amount goes to vendor
    // For online with GST: billing amount + GST goes to vendor (full amount)
    calculatedAmount = netBillingAmount + gstAmount; // Include GST in vendor earning
  }
  // Special case for amounts > 300 and <= 600
  else if (netBillingAmount <= 600) {
    if (paymentMethod === 'online') {
      // Online payment: (GST-excluded - Spare - Travel) * 50% + Spare + Travel
      // GST amount NOT added to vendor earning for amounts > 300
      const baseAmount = netBillingAmount - spareAmount - travellingAmount;
      calculatedAmount = (baseAmount * 0.5) + spareAmount + travellingAmount;
    } else {
      // Cash payment: (GST-excluded - Spare - Travel) * 50% + Spare + Travel
      // GST amount NOT added to vendor earning for amounts > 300
      const baseAmount = netBillingAmount - spareAmount - travellingAmount;
      calculatedAmount = (baseAmount * 0.5) + spareAmount + travellingAmount;
    }
  }
  // Regular calculation for amounts > 600
  else {
    // Calculate amount based on payment method
    if (paymentMethod === 'online') {
      // Online payment: (GST-excluded - Spare - Travel) * 50% + Spare + Travel
      // GST amount NOT added to vendor earning for amounts > 300
      const baseAmount = netBillingAmount - spareAmount - travellingAmount;
      calculatedAmount = (baseAmount * 0.5) + spareAmount + travellingAmount;
    } else if (paymentMethod === 'cash') {
      // Cash payment: (GST-excluded - Spare - Travel) * 50% + Spare + Travel
      // GST amount NOT added to vendor earning for amounts > 300
      const baseAmount = netBillingAmount - spareAmount - travellingAmount;
      calculatedAmount = (baseAmount * 0.5) + spareAmount + travellingAmount;
    }
  }

  const transaction = {
    transactionId: `EARN_${this.vendorId}_${Date.now()}`,
    caseId,
    type: 'earning',
    amount: calculatedAmount,
    description,
    paymentMethod,
    billingAmount: netBillingAmount, // Use net billing amount for consistency
    spareAmount,
    travellingAmount,
    bookingAmount,
    gstIncluded,
    gstAmount,
    calculatedAmount,
    status: 'completed'
  };

  // Ensure amount field always uses calculatedAmount (not billingAmount)
  transaction.amount = calculatedAmount;

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
vendorWalletSchema.methods.addPenalty = async function (penaltyData) {
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
vendorWalletSchema.methods.addTaskAcceptanceFee = async function (taskData) {
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
vendorWalletSchema.methods.addCashCollectionDeduction = async function (collectionData) {
  const {
    caseId,
    billingAmount,
    spareAmount = 0,
    travellingAmount = 0,
    bookingAmount = 0,
    gstIncluded = false,
    gstAmount: providedGstAmount = 0, // Use GST amount from frontend if provided
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

  // Calculate GST if included (billing amount is GST-excluded)
  if (gstIncluded) {
    // When GST is included, billing amount is GST-excluded
    // Use provided GST amount from frontend, or calculate if not provided
    netBillingAmount = billingAmount; // GST-excluded amount (same as billing amount)
    gstAmount = providedGstAmount > 0 ? providedGstAmount : (billingAmount * 0.18); // Use provided GST or calculate
  }

  // Special case: If billing amount <= 300, no wallet deduction
  if (netBillingAmount <= 300) {
    calculatedAmount = 0; // No deduction for small amounts
  } else {
    // Cash collection: (GST-excluded - Spare - Travel) * 50%
    const baseAmount = netBillingAmount - spareAmount - travellingAmount;
    calculatedAmount = (baseAmount * 0.5);
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
vendorWalletSchema.methods.addDeposit = async function (depositData) {
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
vendorWalletSchema.methods.addWithdrawal = async function (withdrawalData) {
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
vendorWalletSchema.methods.addRefund = async function (refundData) {
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
vendorWalletSchema.statics.getVendorSummary = async function (vendorId) {
  try {
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

    // Calculate available balance safely (virtual property might not be accessible in all contexts)
    let availableBalance = 0;
    try {
      if (wallet.availableBalance !== undefined && wallet.availableBalance !== null) {
        availableBalance = wallet.availableBalance;
      } else {
        // Calculate manually if virtual property is not accessible
        availableBalance = Math.max(0, (wallet.currentBalance || 0) - (wallet.securityDeposit || 0));
      }
    } catch (balanceError) {
      // Fallback calculation
      availableBalance = Math.max(0, (wallet.currentBalance || 0) - (wallet.securityDeposit || 0));
    }

    return {
      currentBalance: wallet.currentBalance || 0,
      availableBalance: availableBalance,
      totalEarnings: wallet.totalEarnings || 0,
      totalPenalties: wallet.totalPenalties || 0,
      totalWithdrawals: wallet.totalWithdrawals || 0,
      totalDeposits: wallet.totalDeposits || 0,
      totalTaskAcceptanceFees: wallet.totalTaskAcceptanceFees || 0,
      totalCashCollections: wallet.totalCashCollections || 0,
      totalRefunds: wallet.totalRefunds || 0,
      totalTasksCompleted: wallet.totalTasksCompleted || 0,
      totalTasksRejected: wallet.totalTasksRejected || 0,
      totalTasksCancelled: wallet.totalTasksCancelled || 0
    };
  } catch (error) {
    console.error('Error in getVendorSummary:', error);
    throw error; // Re-throw to be caught by the caller
  }
};

// Static method to get recent transactions
vendorWalletSchema.statics.getRecentTransactions = async function (vendorId, limit = 10) {
  try {
    const wallet = await this.findOne({ vendorId });
    if (!wallet) {
      return [];
    }

    if (!wallet.transactions || !Array.isArray(wallet.transactions)) {
      return [];
    }

    // Safely sort transactions, handling missing createdAt fields
    const sortedTransactions = wallet.transactions
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Sort descending (newest first)
      })
      .slice(0, limit)
      .map(transaction => ({
        _id: transaction._id,
        transactionId: transaction.transactionId,
        amount: transaction.amount || 0,
        type: transaction.type || 'unknown',
        description: transaction.description || '',
        status: transaction.status || 'completed',
        createdAt: transaction.createdAt || transaction.timestamp || new Date(),
        caseId: transaction.caseId,
        bookingId: transaction.bookingId,
        metadata: transaction.metadata || {},
        formattedAmount: `₹${Math.abs(transaction.amount || 0).toLocaleString()}`,
        typeDisplay: (transaction.type || 'unknown').replace('_', ' ').toUpperCase()
      }));

    return sortedTransactions;
  } catch (error) {
    console.error('Error in getRecentTransactions:', error);
    return [];
  }
};

// Add manual adjustment transaction
vendorWalletSchema.methods.addManualAdjustment = function (adjustmentData) {
  const {
    amount,
    type,
    description,
    processedBy = 'admin',
    metadata = {},
    status = 'completed' // Allow custom status, default to 'completed'
  } = adjustmentData;

  // Determine if this is a credit or debit based on metadata or amount
  const isCredit = metadata.isCredit !== undefined ? metadata.isCredit : amount > 0;

  // For withdrawal_request, use status from metadata if provided, otherwise use the passed status
  const transactionStatus = type === 'withdrawal_request' && metadata.status
    ? metadata.status
    : status;

  const transaction = {
    transactionId: `ADJ_${this.vendorId}_${Date.now()}`,
    type: type, // Use the type as provided (including 'withdrawal_request')
    amount: isCredit ? amount : -amount,
    description,
    paymentMethod: 'system',
    status: transactionStatus, // Use the determined status
    processedBy: processedBy === 'system' ? 'system' : 'admin',
    metadata: {
      ...metadata,
      adminId: processedBy
    },
    verificationStatus: 'approved',
    createdAt: new Date(),
    // Add required fields for withdrawal_request type
    ...(type === 'withdrawal_request' && {
      caseId: `WR-${Date.now()}`,
      billingAmount: 0,
      calculatedAmount: isCredit ? amount : -amount
    })
  };

  this.transactions.push(transaction);
  // Don't update currentBalance here - it's already updated in the controller
  this.lastTransactionAt = new Date();

  return this.save();
};

// Pre-save middleware to update available balance
vendorWalletSchema.pre('save', function (next) {
  this.availableBalance = Math.max(0, this.currentBalance - this.securityDeposit);
  next();
});

module.exports = mongoose.model('VendorWallet', vendorWalletSchema);
