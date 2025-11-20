/**
 * Test script for Vendor FCM Token APIs
 * 
 * Usage:
 * node test-vendor-fcm-token.js <vendorId> <token> <phone>
 * 
 * Example:
 * node test-vendor-fcm-token.js 867 test_token_12345 7610416911
 */

require('dotenv').config({ path: './config/production.env' });
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

const testVendorFCMToken = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const vendorId = process.argv[2] || '867';
    const testToken = process.argv[3] || `test_web_token_${Date.now()}`;
    const phone = process.argv[4] || '7610416911';

    console.log('\n📋 Test Parameters:');
    console.log(`   Vendor ID: ${vendorId}`);
    console.log(`   Test Token: ${testToken.substring(0, 30)}...`);
    console.log(`   Phone: ${phone}`);

    // Find vendor by vendorId
    const vendor = await Vendor.findOne({ vendorId }).select('+fcmTokens +fcmTokenMobile');
    
    if (!vendor) {
      console.error('❌ Vendor not found');
      process.exit(1);
    }

    console.log('\n📊 Current Vendor FCM Tokens:');
    console.log(`   Web Tokens (fcmTokens): ${vendor.fcmTokens?.length || 0}`);
    console.log(`   Mobile Tokens (fcmTokenMobile): ${vendor.fcmTokenMobile?.length || 0}`);
    
    if (vendor.fcmTokens && vendor.fcmTokens.length > 0) {
      console.log(`   Web Token List: ${vendor.fcmTokens.slice(0, 3).map(t => t.substring(0, 20) + '...').join(', ')}`);
    }
    if (vendor.fcmTokenMobile && vendor.fcmTokenMobile.length > 0) {
      console.log(`   Mobile Token List: ${vendor.fcmTokenMobile.slice(0, 3).map(t => t.substring(0, 20) + '...').join(', ')}`);
    }

    // Test: Add web token
    console.log('\n🧪 Testing: Adding web FCM token...');
    
    if (!vendor.fcmTokens || !Array.isArray(vendor.fcmTokens)) {
      vendor.fcmTokens = [];
    }

    // Remove token if exists
    vendor.fcmTokens = vendor.fcmTokens.filter(t => t !== testToken);
    
    // Add new token
    vendor.fcmTokens.unshift(testToken);
    
    // Limit to 10 tokens
    if (vendor.fcmTokens.length > 10) {
      vendor.fcmTokens = vendor.fcmTokens.slice(0, 10);
    }

    vendor.markModified('fcmTokens');
    await vendor.save();

    console.log('✅ Token saved to vendor object');

    // Verify save
    const updatedVendor = await Vendor.findById(vendor._id).select('+fcmTokens +fcmTokenMobile');
    
    console.log('\n📊 Updated Vendor FCM Tokens:');
    console.log(`   Web Tokens (fcmTokens): ${updatedVendor.fcmTokens?.length || 0}`);
    console.log(`   Mobile Tokens (fcmTokenMobile): ${updatedVendor.fcmTokenMobile?.length || 0}`);
    
    if (updatedVendor.fcmTokens && updatedVendor.fcmTokens.length > 0) {
      console.log(`   Web Token List: ${updatedVendor.fcmTokens.slice(0, 3).map(t => t.substring(0, 20) + '...').join(', ')}`);
      const tokenExists = updatedVendor.fcmTokens.includes(testToken);
      console.log(`   ✅ Test token exists: ${tokenExists ? 'YES' : 'NO'}`);
    }

    if (updatedVendor.fcmTokenMobile && updatedVendor.fcmTokenMobile.length > 0) {
      console.log(`   Mobile Token List: ${updatedVendor.fcmTokenMobile.slice(0, 3).map(t => t.substring(0, 20) + '...').join(', ')}`);
    }

    console.log('\n✅ Test completed successfully!');
    
    // Cleanup: Remove test token
    console.log('\n🧹 Cleaning up test token...');
    updatedVendor.fcmTokens = updatedVendor.fcmTokens.filter(t => t !== testToken);
    updatedVendor.markModified('fcmTokens');
    await updatedVendor.save();
    console.log('✅ Test token removed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testVendorFCMToken();

