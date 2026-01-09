const mongoose = require('mongoose');
const VendorWallet = require('../models/VendorWallet');
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

      // Recalculate using new formula
      let newAmount = 0;
      const billingAmount = transaction.billingAmount || 0;
      const spareAmount = transaction.spareAmount || 0;
      const travellingAmount = transaction.travellingAmount || 0;

      if (billingAmount <= 600) {
        // For amounts > 300 and <= 600: (Billing - Spare - Travel) * 50% + Spare + Travel
        const baseAmount = billingAmount - spareAmount - travellingAmount;
        newAmount = (baseAmount * 0.5) + spareAmount + travellingAmount;
      } else {
        // New formula: (Billing - Spare - Travel - Booking) × 50% + Spare + Travel + Booking
        const baseAmount = billingAmount - spareAmount - travellingAmount - bookingAmount;
        newAmount = (baseAmount * 0.5) + spareAmount + travellingAmount + bookingAmount;
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

    // Update wallet totals
    const oldBalance = vendorWallet.currentBalance;
    const oldTotalEarnings = vendorWallet.totalEarnings;
    const balanceDifference = newTotalEarnings - oldTotalEarnings;

    vendorWallet.currentBalance = oldBalance + balanceDifference;
    vendorWallet.totalEarnings = newTotalEarnings;

    // Save the updated wallet
    await vendorWallet.save();

    console.log(`\n=== RECALCULATION SUMMARY ===`);
    console.log(`Old balance: ₹${oldBalance}`);
    console.log(`New balance: ₹${vendorWallet.currentBalance}`);
    console.log(`Balance difference: ₹${balanceDifference}`);
    console.log(`Old total earnings: ₹${oldTotalEarnings}`);
    console.log(`New total earnings: ₹${newTotalEarnings}`);

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
