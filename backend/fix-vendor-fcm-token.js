/**
 * Direct script to fix/add FCM token to vendor
 * 
 * Usage:
 * node fix-vendor-fcm-token.js <vendorId> <token>
 * 
 * Example:
 * node fix-vendor-fcm-token.js 346 test_web_token_12345
 */

require('dotenv').config({ path: './config/production.env' });
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

const fixVendorFCMToken = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const vendorId = process.argv[2] || '346';
    const testToken = process.argv[3] || `test_web_token_${Date.now()}`;

    console.log('\n📋 Fix Parameters:');
    console.log(`   Vendor ID: ${vendorId}`);
    console.log(`   Test Token: ${testToken.substring(0, 30)}...`);

    // Find vendor by vendorId
    const vendor = await Vendor.findOne({ vendorId }).select('+fcmTokens +fcmTokenMobile');
    
    if (!vendor) {
      console.error('❌ Vendor not found');
      process.exit(1);
    }

    console.log('\n📊 Current Vendor State:');
    console.log(`   MongoDB ID: ${vendor._id}`);
    console.log(`   Vendor ID: ${vendor.vendorId}`);
    console.log(`   Email: ${vendor.email}`);
    console.log(`   Web Tokens (fcmTokens): ${vendor.fcmTokens?.length || 0}`);
    console.log(`   Mobile Tokens (fcmTokenMobile): ${vendor.fcmTokenMobile?.length || 0}`);
    
    // Initialize arrays if needed
    if (!vendor.fcmTokens || !Array.isArray(vendor.fcmTokens)) {
      vendor.fcmTokens = [];
      console.log('   ✅ Initialized fcmTokens array');
    }
    
    if (!vendor.fcmTokenMobile || !Array.isArray(vendor.fcmTokenMobile)) {
      vendor.fcmTokenMobile = [];
      console.log('   ✅ Initialized fcmTokenMobile array');
    }

    // Add web token
    console.log('\n🧪 Adding web FCM token...');
    
    // Remove if exists
    vendor.fcmTokens = vendor.fcmTokens.filter(t => t !== testToken);
    
    // Add to beginning
    vendor.fcmTokens.unshift(testToken);
    
    // Limit to 10
    if (vendor.fcmTokens.length > 10) {
      vendor.fcmTokens = vendor.fcmTokens.slice(0, 10);
    }

    // Mark as modified
    vendor.markModified('fcmTokens');
    vendor.markModified('fcmTokenMobile');

    console.log(`   Tokens before save: ${vendor.fcmTokens.length}`);
    console.log(`   Token array: ${vendor.fcmTokens.map(t => t.substring(0, 20) + '...').join(', ')}`);

    // Save
    await vendor.save({ validateBeforeSave: false });
    console.log('✅ Vendor saved');

    // Verify
    const updatedVendor = await Vendor.findById(vendor._id).select('+fcmTokens +fcmTokenMobile');
    
    console.log('\n📊 Updated Vendor State:');
    console.log(`   Web Tokens (fcmTokens): ${updatedVendor.fcmTokens?.length || 0}`);
    console.log(`   Mobile Tokens (fcmTokenMobile): ${updatedVendor.fcmTokenMobile?.length || 0}`);
    
    if (updatedVendor.fcmTokens && updatedVendor.fcmTokens.length > 0) {
      console.log(`   Web Token List: ${updatedVendor.fcmTokens.map(t => t.substring(0, 20) + '...').join(', ')}`);
      const tokenExists = updatedVendor.fcmTokens.includes(testToken);
      console.log(`   ✅ Test token exists: ${tokenExists ? 'YES ✅' : 'NO ❌'}`);
      
      if (!tokenExists) {
        console.log('\n❌ Token not found after save - trying direct update...');
        
        // Try direct MongoDB update
        const result = await Vendor.updateOne(
          { _id: vendor._id },
          { 
            $addToSet: { fcmTokens: testToken },
            $slice: { fcmTokens: 10 }
          }
        );
        
        console.log(`   Update result: ${JSON.stringify(result)}`);
        
        // Verify again
        const finalVendor = await Vendor.findById(vendor._id).select('+fcmTokens');
        const finalExists = finalVendor.fcmTokens?.includes(testToken);
        console.log(`   ✅ Token exists after direct update: ${finalExists ? 'YES ✅' : 'NO ❌'}`);
      }
    }

    console.log('\n✅ Fix completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

fixVendorFCMToken();

