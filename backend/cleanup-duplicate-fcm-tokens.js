/**
 * Script to clean up duplicate FCM tokens from users and vendors
 * 
 * Usage: node cleanup-duplicate-fcm-tokens.js
 */

require('dotenv').config({ path: './config/production.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const Vendor = require('./models/Vendor');

const cleanupDuplicateFCMTokens = async () => {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixfly', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    let totalUsersFixed = 0;
    let totalVendorsFixed = 0;
    let totalDuplicatesRemoved = 0;

    // Clean up user FCM tokens
    console.log('🧹 Cleaning up user FCM tokens...');
    const users = await User.find({}).select('+fcmTokens +fcmTokenMobile');
    
    for (const user of users) {
      let userFixed = false;
      let duplicatesRemoved = 0;

      // Clean fcmTokens
      if (user.fcmTokens && Array.isArray(user.fcmTokens) && user.fcmTokens.length > 0) {
        const originalLength = user.fcmTokens.length;
        const uniqueTokens = [...new Set(user.fcmTokens)];
        
        if (uniqueTokens.length !== originalLength) {
          duplicatesRemoved += (originalLength - uniqueTokens.length);
          user.fcmTokens = uniqueTokens;
          user.markModified('fcmTokens');
          userFixed = true;
          console.log(`   User ${user._id} (${user.email}): Removed ${originalLength - uniqueTokens.length} duplicate web tokens`);
        }
      }

      // Clean fcmTokenMobile
      if (user.fcmTokenMobile && Array.isArray(user.fcmTokenMobile) && user.fcmTokenMobile.length > 0) {
        const originalLength = user.fcmTokenMobile.length;
        const uniqueTokens = [...new Set(user.fcmTokenMobile)];
        
        if (uniqueTokens.length !== originalLength) {
          duplicatesRemoved += (originalLength - uniqueTokens.length);
          user.fcmTokenMobile = uniqueTokens;
          user.markModified('fcmTokenMobile');
          userFixed = true;
          console.log(`   User ${user._id} (${user.email}): Removed ${originalLength - uniqueTokens.length} duplicate mobile tokens`);
        }
      }

      if (userFixed) {
        // Use updateOne for reliable persistence
        await User.updateOne(
          { _id: user._id },
          { 
            $set: { 
              fcmTokens: user.fcmTokens,
              fcmTokenMobile: user.fcmTokenMobile,
              updatedAt: new Date()
            } 
          }
        );
        await user.save({ validateBeforeSave: false });
        totalUsersFixed++;
        totalDuplicatesRemoved += duplicatesRemoved;
      }
    }

    console.log(`✅ User cleanup complete: ${totalUsersFixed} users fixed\n`);

    // Clean up vendor FCM tokens
    console.log('🧹 Cleaning up vendor FCM tokens...');
    const vendors = await Vendor.find({}).select('+fcmTokens +fcmTokenMobile');
    
    for (const vendor of vendors) {
      let vendorFixed = false;
      let duplicatesRemoved = 0;

      // Clean fcmTokens
      if (vendor.fcmTokens && Array.isArray(vendor.fcmTokens) && vendor.fcmTokens.length > 0) {
        const originalLength = vendor.fcmTokens.length;
        const uniqueTokens = [...new Set(vendor.fcmTokens)];
        
        if (uniqueTokens.length !== originalLength) {
          duplicatesRemoved += (originalLength - uniqueTokens.length);
          vendor.fcmTokens = uniqueTokens;
          vendor.markModified('fcmTokens');
          vendorFixed = true;
          console.log(`   Vendor ${vendor._id} (${vendor.email}): Removed ${originalLength - uniqueTokens.length} duplicate web tokens`);
        }
      }

      // Clean fcmTokenMobile
      if (vendor.fcmTokenMobile && Array.isArray(vendor.fcmTokenMobile) && vendor.fcmTokenMobile.length > 0) {
        const originalLength = vendor.fcmTokenMobile.length;
        const uniqueTokens = [...new Set(vendor.fcmTokenMobile)];
        
        if (uniqueTokens.length !== originalLength) {
          duplicatesRemoved += (originalLength - uniqueTokens.length);
          vendor.fcmTokenMobile = uniqueTokens;
          vendor.markModified('fcmTokenMobile');
          vendorFixed = true;
          console.log(`   Vendor ${vendor._id} (${vendor.email}): Removed ${originalLength - uniqueTokens.length} duplicate mobile tokens`);
        }
      }

      if (vendorFixed) {
        // Use updateOne for reliable persistence
        await Vendor.updateOne(
          { _id: vendor._id },
          { 
            $set: { 
              fcmTokens: vendor.fcmTokens,
              fcmTokenMobile: vendor.fcmTokenMobile,
              updatedAt: new Date()
            } 
          }
        );
        await vendor.save({ validateBeforeSave: false });
        totalVendorsFixed++;
        totalDuplicatesRemoved += duplicatesRemoved;
      }
    }

    console.log(`✅ Vendor cleanup complete: ${totalVendorsFixed} vendors fixed\n`);

    // Summary
    console.log('📊 Cleanup Summary:');
    console.log(`   Users fixed: ${totalUsersFixed}`);
    console.log(`   Vendors fixed: ${totalVendorsFixed}`);
    console.log(`   Total duplicates removed: ${totalDuplicatesRemoved}`);
    console.log('\n✅ Cleanup completed successfully');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
};

cleanupDuplicateFCMTokens();

