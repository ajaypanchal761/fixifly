const mongoose = require('mongoose');
const VendorWallet = require('../models/VendorWallet');
const Vendor = require('../models/Vendor');
const { Booking } = require('../models/Booking');
require('dotenv').config({ path: './config/production.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function recalculateWalletBalance(vendorId) {
  try {
    console.log(`Recalculating wallet balance for vendor: ${vendorId}`);

    // Find the vendor wallet
    const vendorWallet = await VendorWallet.findOne({ vendorId });
    if (!vendorWallet) {
      console.log('Vendor wallet not found');
      return;
    }

    console.log(`Current balance: ₹${vendorWallet.currentBalance}`);
    console.log(`Total earnings: ₹${vendorWallet.totalEarnings}`);

    // Find all earning transactions for this vendor
    const earningTransactions = vendorWallet.transactions.filter(t => t.type === 'earning');
    console.log(`Found ${earningTransactions.length} earning transactions`);

    let newTotalEarnings = 0;
    let recalculatedTransactions = [];

    for (const transaction of earningTransactions) {
      console.log(`\nProcessing transaction: ${transaction.transactionId}`);
      console.log(`Case ID: ${transaction.caseId}`);
      console.log(`Original amount: ₹${transaction.amount}`);
      console.log(`Billing: ₹${transaction.billingAmount}, Spare: ₹${transaction.spareAmount}, Travel: ₹${transaction.travellingAmount}`);

      // Find the booking to get the booking amount
      let bookingAmount = 0;
      if (transaction.caseId && transaction.caseId.startsWith('CASE_')) {
        const bookingId = transaction.caseId.replace('CASE_', '');
        const booking = await Booking.findById(bookingId);
        if (booking && booking.pricing) {
          bookingAmount = booking.pricing.totalAmount || 0;
          console.log(`Found booking amount: ₹${bookingAmount}`);
        }
      }

      // Recalculate using production formula from VendorWallet.js
      let newAmount = 0;
      const billingAmount = transaction.billingAmount || 0;
      const spareAmount = transaction.spareAmount || 0;
      const travellingAmount = transaction.travellingAmount || 0;
      const gstIncluded = transaction.gstIncluded || false;
      const gstAmount = transaction.gstAmount || 0;

      if (billingAmount <= 300) {
        // Special case for amounts <= 300: Full amount goes to vendor (including GST)
        newAmount = billingAmount + gstAmount;
      } else {
        // For amounts > 300: (Billing - Spare - Travel) * 50% + Spare + Travel
        const baseAmount = billingAmount - spareAmount - travellingAmount;
        newAmount = (baseAmount * 0.5) + spareAmount + travellingAmount;
      }

      console.log(`Recalculated amount: ₹${newAmount}`);
      console.log(`Difference: ₹${newAmount - transaction.amount}`);

      // Update transaction
      transaction.amount = newAmount;
      transaction.calculatedAmount = newAmount;
      transaction.bookingAmount = bookingAmount;

      newTotalEarnings += newAmount;
      recalculatedTransactions.push({
        transactionId: transaction.transactionId,
        caseId: transaction.caseId,
        oldAmount: transaction.amount,
        newAmount: newAmount,
        difference: newAmount - transaction.amount
      });
    }

    // Final audit: sum ALL transactions in the wallet to ensure absolute consistency
    let totalEarnings = 0;
    let totalPenalties = 0;
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalCashCollections = 0;
    let totalTaskFees = 0;
    let totalRefunds = 0;
    let calculatedCurrentBalance = 0;

    for (const t of vendorWallet.transactions) {
      const amount = t.amount || 0;
      calculatedCurrentBalance += amount;

      switch (t.type) {
        case 'earning': totalEarnings += amount; break;
        case 'penalty': totalPenalties += Math.abs(amount); break;
        case 'deposit': totalDeposits += amount; break;
        case 'withdrawal': totalWithdrawals += Math.abs(amount); break;
        case 'cash_collection': totalCashCollections += Math.abs(amount); break;
        case 'task_acceptance_fee': totalTaskFees += Math.abs(amount); break;
        case 'refund': totalRefunds += amount; break;
      }
    }

    const oldBalance = vendorWallet.currentBalance;

    // Update VendorWallet
    vendorWallet.currentBalance = Math.max(0, calculatedCurrentBalance);
    vendorWallet.totalEarnings = totalEarnings;
    vendorWallet.totalDeposits = totalDeposits;
    vendorWallet.totalWithdrawals = totalWithdrawals;
    vendorWallet.totalPenalties = totalPenalties;
    vendorWallet.totalCashCollections = totalCashCollections;
    vendorWallet.totalTaskAcceptanceFees = totalTaskFees;
    vendorWallet.totalRefunds = totalRefunds;
    vendorWallet.securityDeposit = 0; // Explicitly remove 3999 system
    vendorWallet.lastTransactionAt = new Date();

    // Save the updated wallet
    await vendorWallet.save();

    // Sync with Vendor model
    const vendor = await Vendor.findOne({ vendorId });
    if (vendor && vendor.wallet) {
      vendor.wallet.currentBalance = vendorWallet.currentBalance;
      vendor.wallet.totalDeposits = totalDeposits;
      vendor.wallet.totalWithdrawals = totalWithdrawals;
      vendor.wallet.hasInitialDeposit = totalDeposits > 0;
      await vendor.save({ validateBeforeSave: false });
    }

    console.log(`\n=== RECALCULATION & SYNC SUMMARY ===`);
    console.log(`Vendor ID: ${vendorId}`);
    console.log(`Old balance: ₹${oldBalance}`);
    console.log(`New balance: ₹${vendorWallet.currentBalance}`);
    console.log(`Balance difference: ₹${vendorWallet.currentBalance - oldBalance}`);
    console.log(`Total Earnings: ₹${totalEarnings}`);
    console.log(`Total Deposits: ₹${totalDeposits}`);
    console.log(`Security Deposit: ₹${vendorWallet.securityDeposit}`);
    console.log(`Available Balance: ₹${vendorWallet.availableBalance}`);

    console.log(`\n=== TRANSACTION DETAILS ===`);
    recalculatedTransactions.forEach(t => {
      console.log(`${t.transactionId}: ${t.caseId} - Old: ₹${t.oldAmount}, New: ₹${t.newAmount}, Diff: ₹${t.difference}`);
    });

    console.log('\nWallet balance recalculated successfully!');

  } catch (error) {
    console.error('Error recalculating wallet balance:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Get vendor ID from command line argument
const vendorId = process.argv[2];
if (!vendorId) {
  console.log('Usage: node recalculate-wallet-balance.js <vendorId>');
  process.exit(1);
}

recalculateWalletBalance(vendorId);
