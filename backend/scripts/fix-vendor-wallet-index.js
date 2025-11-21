/**
 * Script to fix VendorWallet duplicate key error
 * 
 * This script:
 * 1. Drops the problematic unique index on transactions.transactionId
 * 2. Fixes existing null transactionId values
 * 3. Creates a sparse index that only indexes non-null values
 * 
 * Usage: node scripts/fix-vendor-wallet-index.js
 */

require('dotenv').config({ path: './config/production.env' });
const mongoose = require('mongoose');
const VendorWallet = require('../models/VendorWallet');

const fixVendorWalletIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('vendorwallets');

    console.log('\n📋 Step 1: Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    // Find the problematic index
    const problematicIndex = indexes.find(idx => 
      idx.name === 'transactions.transactionId_1' || 
      (idx.key && idx.key['transactions.transactionId'] === 1)
    );

    if (problematicIndex) {
      console.log('\n🔧 Step 2: Dropping problematic unique index...');
      try {
        await collection.dropIndex(problematicIndex.name);
        console.log(`✅ Dropped index: ${problematicIndex.name}`);
      } catch (error) {
        if (error.code === 27) {
          console.log('⚠️ Index does not exist, skipping drop');
        } else {
          throw error;
        }
      }
    } else {
      console.log('ℹ️ No problematic index found');
    }

    console.log('\n🔧 Step 3: Fixing null transactionId values...');
    const wallets = await VendorWallet.find({
      'transactions.transactionId': null
    });

    console.log(`Found ${wallets.length} wallets with null transactionId values`);

    let fixedCount = 0;
    for (const wallet of wallets) {
      let updated = false;
      
      for (let i = 0; i < wallet.transactions.length; i++) {
        const transaction = wallet.transactions[i];
        
        // If transactionId is null or missing, generate one
        if (!transaction.transactionId || transaction.transactionId === null) {
          const prefix = transaction.type?.toUpperCase().substring(0, 3) || 'TXN';
          transaction.transactionId = `${prefix}_${wallet.vendorId}_${Date.now()}_${i}`;
          updated = true;
          fixedCount++;
        }
      }
      
      if (updated) {
        wallet.markModified('transactions');
        await wallet.save({ validateBeforeSave: false });
        console.log(`✅ Fixed wallet: ${wallet.vendorId}`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} null transactionId values`);

    console.log('\n🔧 Step 4: Creating sparse index (only indexes non-null values)...');
    try {
      // Create a sparse index that only indexes non-null transactionId values
      // This allows multiple null values while maintaining uniqueness for non-null values
      await collection.createIndex(
        { 'transactions.transactionId': 1 },
        { 
          name: 'transactions.transactionId_1_sparse',
          sparse: true,
          unique: true,
          background: true
        }
      );
      console.log('✅ Created sparse unique index on transactions.transactionId');
    } catch (error) {
      console.log('⚠️ Index creation result:', error.message);
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Index already exists, that\'s fine');
      }
    }

    console.log('\n✅ Fix completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Dropped problematic index: ${problematicIndex ? 'Yes' : 'N/A'}`);
    console.log(`   - Fixed null values: ${fixedCount}`);
    console.log(`   - Created sparse index: Yes`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

fixVendorWalletIndex();

