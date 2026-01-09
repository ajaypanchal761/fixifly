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
      gstIncluded = false,
      gstAmount: providedGstAmount = 0 // Use GST amount from frontend if provided
    } = params;

    let gstAmount = 0;
    let netBillingAmount = billingAmount;

    // Calculate GST if included (billing amount is GST-excluded)
    if (gstIncluded) {
      // When GST is included, billing amount is GST-excluded
      // Use provided GST amount from frontend, or calculate if not provided
      netBillingAmount = billingAmount; // GST-excluded amount (same as billing amount)
      gstAmount = providedGstAmount > 0 ? providedGstAmount : (billingAmount * 0.18); // Use provided GST or calculate
    }

    let calculatedAmount = 0;

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
        baseAmount: netBillingAmount - spareAmount - travellingAmount,
        percentage: netBillingAmount <= 300 ? '100% (Full to vendor)' : 
                    netBillingAmount <= 600 ? '50% (with spare & travel)' : '50%',
        spareAmount,
        travellingAmount,
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
      gstIncluded = false,
      gstAmount: providedGstAmount = 0 // Use GST amount from frontend if provided
    } = params;

    let gstAmount = 0;
    let netBillingAmount = billingAmount;

    // Calculate GST if included (billing amount is GST-excluded)
    if (gstIncluded) {
      // When GST is included, billing amount is GST-excluded
      // Use provided GST amount from frontend, or calculate if not provided
      netBillingAmount = billingAmount; // GST-excluded amount (same as billing amount)
      gstAmount = providedGstAmount > 0 ? providedGstAmount : (billingAmount * 0.18); // Use provided GST or calculate
    }

    let calculatedAmount = 0;

    // Special case: If billing amount <= 300, no wallet deduction
    if (netBillingAmount <= 300) {
      calculatedAmount = 0; // No deduction for small amounts
    } else {
      // Cash collection: (GST-excluded - Spare - Travel) * 50%
      const baseAmount = netBillingAmount - spareAmount - travellingAmount;
      calculatedAmount = (baseAmount * 0.5);
    }

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
        baseAmount: netBillingAmount - spareAmount - travellingAmount,
        percentage: '50%',
        spareAmount,
        travellingAmount,
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


