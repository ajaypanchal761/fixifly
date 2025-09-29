const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const VendorWallet = require('../models/VendorWallet');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check vendor 953
const checkVendor953 = async () => {
  try {
    console.log('Checking vendor 953...\n');

    // Find vendor 953
    const vendor = await Vendor.findOne({ vendorId: '953' });
    if (!vendor) {
      console.log('Vendor 953 not found');
      return;
    }

    console.log(`Found vendor: ${vendor.vendorId} (${vendor._id})`);
    console.log(`Email: ${vendor.email}`);
    console.log(`Name: ${vendor.firstName} ${vendor.lastName}`);

    // Check old wallet system
    console.log('\n=== OLD WALLET SYSTEM (Vendor.wallet) ===');
    console.log(`Current Balance: ₹${vendor.wallet.currentBalance}`);
    console.log(`Has Initial Deposit: ${vendor.wallet.hasInitialDeposit}`);
    console.log(`Initial Deposit Amount: ₹${vendor.wallet.initialDepositAmount || 0}`);
    console.log(`Last Transaction At: ${vendor.wallet.lastTransactionAt}`);

    // Check new wallet system
    const vendorWallet = await VendorWallet.findOne({ vendorId: '953' });
    if (vendorWallet) {
      console.log('\n=== NEW WALLET SYSTEM (VendorWallet) ===');
      console.log(`Current Balance: ₹${vendorWallet.currentBalance}`);
      console.log(`Total Deposits: ₹${vendorWallet.totalDeposits}`);
      console.log(`Total Transactions: ${vendorWallet.transactions.length}`);
      console.log(`Has Initial Deposit: ${vendorWallet.currentBalance >= 4000}`);
      
      if (vendorWallet.transactions.length > 0) {
        console.log('\nTransactions:');
        vendorWallet.transactions.forEach((txn, index) => {
          console.log(`${index + 1}. ${txn.type} - ₹${txn.amount} (${txn.transactionId})`);
        });
      }
    } else {
      console.log('\n=== NEW WALLET SYSTEM (VendorWallet) ===');
      console.log('No VendorWallet found for vendor 953');
    }

    // Check if vendor has made any deposits
    if (vendor.wallet.currentBalance === 0 && (!vendorWallet || vendorWallet.currentBalance === 0)) {
      console.log('\n✅ CONCLUSION: Vendor 953 has NOT made any deposits');
      console.log('Expected frontend behavior: Show ₹0 balance');
    } else {
      console.log('\n✅ CONCLUSION: Vendor 953 HAS made deposits');
      console.log('Expected frontend behavior: Show actual balance from database');
    }

  } catch (error) {
    console.error('Check error:', error);
  }
};

// Run check
const runCheck = async () => {
  await connectDB();
  await checkVendor953();
  await mongoose.connection.close();
  console.log('Check completed and database connection closed');
};

// Run if called directly
if (require.main === module) {
  runCheck().catch(console.error);
}

module.exports = { checkVendor953 };














