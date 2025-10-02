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

// Check all vendors and their wallets
const checkAllVendors = async () => {
  try {
    console.log('Checking all vendors and their wallets...\n');

    // Get all vendors
    const vendors = await Vendor.find({});
    console.log(`Found ${vendors.length} vendors in database:\n`);

    for (const vendor of vendors) {
      console.log(`Vendor: ${vendor.vendorId} (${vendor._id})`);
      console.log(`- Email: ${vendor.email}`);
      console.log(`- Name: ${vendor.firstName} ${vendor.lastName}`);
      console.log(`- Is Approved: ${vendor.isApproved}`);
      console.log(`- Is Active: ${vendor.isActive}`);
      console.log(`- Is Blocked: ${vendor.isBlocked}`);

      // Check wallet
      const wallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });
      if (wallet) {
        console.log(`- Wallet Found: Yes`);
        console.log(`  - Current Balance: ₹${wallet.currentBalance}`);
        console.log(`  - Total Deposits: ₹${wallet.totalDeposits}`);
        console.log(`  - Total Transactions: ${wallet.transactions.length}`);
      } else {
        console.log(`- Wallet Found: No`);
      }
      console.log('');
    }

    // Check if there are any wallets without vendors
    const wallets = await VendorWallet.find({});
    console.log(`\nFound ${wallets.length} wallets in database:\n`);

    for (const wallet of wallets) {
      const vendor = await Vendor.findOne({ vendorId: wallet.vendorId });
      if (vendor) {
        console.log(`Wallet for vendor ${wallet.vendorId}: ₹${wallet.currentBalance} (Vendor exists)`);
      } else {
        console.log(`Wallet for vendor ${wallet.vendorId}: ₹${wallet.currentBalance} (Vendor NOT found!)`);
      }
    }

  } catch (error) {
    console.error('Error checking vendors:', error);
  }
};

// Run check
const runCheck = async () => {
  await connectDB();
  await checkAllVendors();
  await mongoose.connection.close();
  console.log('Check completed and database connection closed');
};

// Run if called directly
if (require.main === module) {
  runCheck().catch(console.error);
}

module.exports = { checkAllVendors };




















