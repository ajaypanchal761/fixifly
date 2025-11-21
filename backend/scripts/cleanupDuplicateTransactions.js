const mongoose = require('mongoose');
const WalletTransaction = require('../models/WalletTransaction');
require('dotenv').config();

async function cleanupDuplicateTransactions() {
  try {
    console.log('🧹 Cleaning up duplicate wallet transactions...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all transactions for the vendor
    const vendorTransactions = await WalletTransaction.find({ vendorId: '271' })
      .sort({ createdAt: -1 });
    
    console.log(`📊 Found ${vendorTransactions.length} transactions for vendor 271`);
    
    // Group by transactionId to find duplicates
    const transactionGroups = {};
    vendorTransactions.forEach(txn => {
      if (!transactionGroups[txn.transactionId]) {
        transactionGroups[txn.transactionId] = [];
      }
      transactionGroups[txn.transactionId].push(txn);
    });
    
    // Find duplicates
    const duplicates = Object.entries(transactionGroups)
      .filter(([id, txns]) => txns.length > 1);
    
    console.log(`🔍 Found ${duplicates.length} duplicate transaction IDs`);
    
    for (const [transactionId, txns] of duplicates) {
      console.log(`\n📝 Processing duplicate: ${transactionId}`);
      console.log(`   Found ${txns.length} transactions with this ID`);
      
      // Sort by creation date (newest first)
      txns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Keep the newest one, delete the rest
      const toKeep = txns[0];
      const toDelete = txns.slice(1);
      
      console.log(`   Keeping: ${toKeep._id} (${toKeep.status}) - ${toKeep.createdAt}`);
      
      for (const txn of toDelete) {
        console.log(`   Deleting: ${txn._id} (${txn.status}) - ${txn.createdAt}`);
        await WalletTransaction.findByIdAndDelete(txn._id);
      }
    }
    
    // Show final count
    const finalCount = await WalletTransaction.countDocuments({ vendorId: '271' });
    console.log(`\n✅ Cleanup completed! Final transaction count: ${finalCount}`);
    
    // Show remaining transactions
    const remainingTransactions = await WalletTransaction.find({ vendorId: '271' })
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('\n📋 Remaining transactions:');
    remainingTransactions.forEach((txn, index) => {
      console.log(`   ${index + 1}. ${txn.transactionId} - ₹${txn.amount} (${txn.status}) - ${txn.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error during cleanup:');
    console.error(error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the cleanup
cleanupDuplicateTransactions();
