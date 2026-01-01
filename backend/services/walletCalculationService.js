const { logger } = require('../utils/logger');

class WalletCalculationService {
  /**
   * Calculate vendor earning based on payment method and billing details
   * @param {Object} params - Calculation parameters
   * @param {number} params.billingAmount - Total billing amount
   * @param {number} params.spareAmount - Spare parts amount
   * @param {number} params.travellingAmount - Travelling charges
   * @param {number} params.bookingAmount - Original booking amount
   * @param {string} params.paymentMethod - 'online' or 'cash'
   * @param {boolean} params.gstIncluded - Whether GST is included
   * @returns {Object} Calculation result
   */
  static calculateEarning(params) {
    const {
      billingAmount,
      spareAmount = 0,
      travellingAmount = 0,
      bookingAmount = 0,
      paymentMethod,
      gstIncluded = false
    } = params;

    let gstAmount = 0;
    let netBillingAmount = billingAmount;

    // Calculate GST if included (billing amount is GST-excluded)
    if (gstIncluded) {
      // When GST is included, billing amount is GST-excluded
      // GST amount = billing amount * 0.18
      netBillingAmount = billingAmount; // GST-excluded amount (same as billing amount)
      gstAmount = billingAmount * 0.18; // GST amount
    }

    let calculatedAmount = 0;

    // Special case for amounts <= 500
    if (netBillingAmount <= 500) {
      if (paymentMethod === 'online') {
        calculatedAmount = netBillingAmount - 20; // 20 rupees cut for online
      } else {
        calculatedAmount = netBillingAmount; // Full amount for cash
      }
    } else {
      // Regular calculation
      if (paymentMethod === 'online') {
        // Online payment: (GST-excluded - Spare - Travel - Booking) * 50% + Spare + Travel + Booking
        const baseAmount = netBillingAmount - spareAmount - travellingAmount - bookingAmount;
        calculatedAmount = (baseAmount * 0.5) + spareAmount + travellingAmount + bookingAmount;
      } else if (paymentMethod === 'cash') {
        // Cash payment: (GST-excluded - Spare - Travel - Booking) * 50% + Spare + Travel + Booking
        const baseAmount = netBillingAmount - spareAmount - travellingAmount - bookingAmount;
        calculatedAmount = (baseAmount * 0.5) + spareAmount + travellingAmount + bookingAmount;
      }
    }

    return {
      billingAmount,
      netBillingAmount,
      spareAmount,
      travellingAmount,
      bookingAmount,
      gstAmount,
      gstIncluded,
      paymentMethod,
      calculatedAmount: Math.round(calculatedAmount * 100) / 100, // Round to 2 decimal places
      breakdown: {
        baseAmount: netBillingAmount - spareAmount - travellingAmount - bookingAmount,
        percentage: netBillingAmount <= 500 ? (paymentMethod === 'online' ? 'Fixed -20' : '100%') : '50%',
        spareAmount,
        travellingAmount,
        bookingAmount,
        gstAmount
      }
    };
  }

  /**
   * Calculate cash collection deduction
   * @param {Object} params - Calculation parameters
   * @returns {Object} Calculation result
   */
  static calculateCashCollectionDeduction(params) {
    const {
      billingAmount,
      spareAmount = 0,
      travellingAmount = 0,
      bookingAmount = 0,
      gstIncluded = false
    } = params;

    let gstAmount = 0;
    let netBillingAmount = billingAmount;

    // Calculate GST if included (billing amount is GST-excluded)
    if (gstIncluded) {
      // When GST is included, billing amount is GST-excluded
      // GST amount = billing amount * 0.18
      netBillingAmount = billingAmount; // GST-excluded amount (same as billing amount)
      gstAmount = billingAmount * 0.18; // GST amount
    }

    let calculatedAmount = 0;

    // Cash collection: (GST-excluded - Spare - Travel - Booking) * 50% + Booking Amount
    // Booking amount is fully deducted because customer already paid it separately
    const baseAmount = netBillingAmount - spareAmount - travellingAmount - bookingAmount;
    calculatedAmount = (baseAmount * 0.5) + bookingAmount;

    return {
      billingAmount,
      netBillingAmount,
      spareAmount,
      travellingAmount,
      bookingAmount,
      gstAmount,
      gstIncluded,
      calculatedAmount: Math.round(calculatedAmount * 100) / 100,
      breakdown: {
        baseAmount: netBillingAmount - spareAmount - travellingAmount - bookingAmount,
        percentage: '50%',
        spareAmount,
        travellingAmount,
        bookingAmount,
        gstAmount
      }
    };
  }

  /**
   * Validate wallet transaction
   * @param {Object} wallet - Vendor wallet object
   * @param {string} transactionType - Type of transaction
   * @param {number} amount - Transaction amount
   * @returns {Object} Validation result
   */
  static validateTransaction(wallet, transactionType, amount) {
    const errors = [];
    const warnings = [];

    // Check if wallet exists
    if (!wallet) {
      errors.push('Wallet not found');
      return { isValid: false, errors, warnings };
    }

    // Check if wallet is active
    if (!wallet.isActive) {
      errors.push('Wallet is inactive');
    }

    // Check security deposit for withdrawals
    if (transactionType === 'withdrawal') {
      const availableBalance = wallet.currentBalance - wallet.securityDeposit;
      if (amount > availableBalance) {
        errors.push(`Insufficient balance. Available: ₹${availableBalance}, Required: ₹${amount}`);
      }
    }

    // Check minimum balance for penalties and fees
    if (['penalty', 'task_acceptance_fee'].includes(transactionType)) {
      if (wallet.currentBalance < amount) {
        errors.push(`Insufficient balance for ${transactionType}. Current: ₹${wallet.currentBalance}, Required: ₹${amount}`);
      }
    }

    // Warnings for low balance
    if (wallet.currentBalance < wallet.securityDeposit) {
      warnings.push('Balance is below security deposit amount');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate transaction ID
   * @param {string} vendorId - Vendor ID
   * @param {string} type - Transaction type
   * @returns {string} Transaction ID
   */
  static generateTransactionId(vendorId, type) {
    const timestamp = Date.now();
    const typePrefix = {
      earning: 'EARN',
      penalty: 'PEN',
      deposit: 'DEP',
      withdrawal: 'WTH',
      task_acceptance_fee: 'FEE',
      cash_collection: 'CASH',
      refund: 'REF'
    };
    
    return `${typePrefix[type] || 'TXN'}_${vendorId}_${timestamp}`;
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount
   */
  static formatAmount(amount) {
    return `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Get transaction type display name
   * @param {string} type - Transaction type
   * @returns {string} Display name
   */
  static getTransactionTypeDisplay(type) {
    const typeMap = {
      earning: 'Earning',
      penalty: 'Penalty',
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      task_acceptance_fee: 'Task Fee',
      cash_collection: 'Cash Collection',
      refund: 'Refund'
    };
    
    return typeMap[type] || type;
  }

  /**
   * Calculate monthly statistics
   * @param {Array} transactions - Array of transactions
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Object} Monthly statistics
   */
  static calculateMonthlyStats(transactions, year, month) {
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate.getFullYear() === year && transactionDate.getMonth() + 1 === month;
    });

    const stats = {
      totalEarnings: 0,
      totalPenalties: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalTaskFees: 0,
      totalCashCollections: 0,
      totalRefunds: 0,
      transactionCount: monthlyTransactions.length
    };

    monthlyTransactions.forEach(transaction => {
      switch (transaction.type) {
        case 'earning':
          stats.totalEarnings += transaction.amount;
          break;
        case 'penalty':
          stats.totalPenalties += Math.abs(transaction.amount);
          break;
        case 'deposit':
          stats.totalDeposits += transaction.amount;
          break;
        case 'withdrawal':
          stats.totalWithdrawals += Math.abs(transaction.amount);
          break;
        case 'task_acceptance_fee':
          stats.totalTaskFees += Math.abs(transaction.amount);
          break;
        case 'cash_collection':
          stats.totalCashCollections += Math.abs(transaction.amount);
          break;
        case 'refund':
          stats.totalRefunds += transaction.amount;
          break;
      }
    });

    return stats;
  }

  /**
   * Log wallet transaction for audit
   * @param {string} vendorId - Vendor ID
   * @param {Object} transaction - Transaction object
   * @param {string} action - Action performed
   */
  static logTransaction(vendorId, transaction, action) {
    logger.info('Wallet transaction', {
      vendorId,
      transactionId: transaction.transactionId,
      type: transaction.type,
      amount: transaction.amount,
      action,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = WalletCalculationService;


