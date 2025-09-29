const mongoose = require('mongoose');
const WalletTransaction = require('../models/WalletTransaction');
const VendorWallet = require('../models/VendorWallet');
const Vendor = require('../models/Vendor');
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

// Migration function to sync wallet transactions
const migrateWalletTransactions = async () => {
  try {
    console.log('Starting wallet transaction migration...');

    // Get all vendors
    const vendors = await Vendor.find({}, 'vendorId wallet');
    console.log(`Found ${vendors.length} vendors to process`);

    for (const vendor of vendors) {
      console.log(`Processing vendor: ${vendor.vendorId}`);

      // Get or create VendorWallet
      let vendorWallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });
      if (!vendorWallet) {
        vendorWallet = new VendorWallet({
          vendorId: vendor.vendorId,
          currentBalance: vendor.wallet?.currentBalance || 0,
          securityDeposit: 3999,
          availableBalance: Math.max(0, (vendor.wallet?.currentBalance || 0) - 3999)
        });
        await vendorWallet.save();
        console.log(`Created new VendorWallet for ${vendor.vendorId}`);
      }

      // Get all completed transactions for this vendor
      const transactions = await WalletTransaction.find({
        vendorId: vendor.vendorId,
        status: 'completed'
      }).sort({ createdAt: 1 });

      console.log(`Found ${transactions.length} completed transactions for ${vendor.vendorId}`);

      // Process each transaction
      for (const transaction of transactions) {
        try {
          // Check if transaction already exists in VendorWallet
          const existingTransaction = vendorWallet.transactions.find(
            t => t.transactionId === transaction.transactionId
          );

          if (existingTransaction) {
            console.log(`Transaction ${transaction.transactionId} already exists, skipping`);
            continue;
          }

          // Add transaction to VendorWallet based on type
          switch (transaction.type) {
            case 'deposit':
              await vendorWallet.addDeposit({
                amount: transaction.amount,
                description: transaction.description || 'Wallet deposit',
                transactionId: transaction.transactionId
              });
              console.log(`Added deposit transaction: ${transaction.transactionId}`);
              break;

            case 'withdrawal':
              await vendorWallet.addWithdrawal({
                amount: transaction.amount,
                description: transaction.description || 'Wallet withdrawal',
                transactionId: transaction.transactionId
              });
              console.log(`Added withdrawal transaction: ${transaction.transactionId}`);
              break;

            case 'earning':
              await vendorWallet.addEarning({
                caseId: transaction.metadata?.caseId || transaction.transactionId,
                billingAmount: transaction.amount,
                paymentMethod: 'online', // Default to online for migrated transactions
                description: transaction.description || 'Earning',
                spareAmount: 0,
                travellingAmount: 0
              });
              console.log(`Added earning transaction: ${transaction.transactionId}`);
              break;

            case 'penalty':
              await vendorWallet.addPenalty({
                caseId: transaction.metadata?.caseId || transaction.transactionId,
                type: 'cancellation', // Default type for migrated penalties
                amount: Math.abs(transaction.amount),
                description: transaction.description || 'Penalty'
              });
              console.log(`Added penalty transaction: ${transaction.transactionId}`);
              break;

            default:
              console.log(`Unknown transaction type: ${transaction.type}, skipping`);
          }
        } catch (error) {
          console.error(`Error processing transaction ${transaction.transactionId}:`, error.message);
        }
      }

      // Update vendor's wallet balance to match VendorWallet
      if (vendorWallet.currentBalance !== vendor.wallet?.currentBalance) {
        vendor.wallet.currentBalance = vendorWallet.currentBalance;
        vendor.wallet.hasInitialDeposit = vendorWallet.currentBalance >= 3999;
        await vendor.save();
        console.log(`Updated vendor ${vendor.vendorId} wallet balance to ${vendorWallet.currentBalance}`);
      }
    }

    console.log('Wallet transaction migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateWalletTransactions();
  await mongoose.connection.close();
  console.log('Migration completed and database connection closed');
};

// Run if called directly
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { migrateWalletTransactions };















