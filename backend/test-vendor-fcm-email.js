/**
 * Test script for Vendor Mobile FCM Token Save with Email
 * 
 * Usage:
 * node test-vendor-fcm-email.js <email> <token>
 * 
 * Example:
 * node test-vendor-fcm-email.js panchalajay717@gmail.com test_token_12345
 */

require('dotenv').config({ path: './config/production.env' });
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

const testVendorFCMTokenWithEmail = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = process.argv[2] || 'panchalajay717@gmail.com';
    const testToken = process.argv[3] || `test_email_token_${Date.now()}`;

    console.log('\n📋 Test Parameters:');
    console.log(`   Email: ${email}`);
    console.log(`   Test Token: ${testToken.substring(0, 30)}...`);

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`   Normalized Email: ${normalizedEmail}`);

    // Find vendor by email
    const vendor = await Vendor.findOne({ email: normalizedEmail }).select('+fcmTokenMobile');
    
    if (!vendor) {
      console.error('❌ Vendor not found with email:', normalizedEmail);
      console.log('\n📊 Available vendors in database:');
      const allVendors = await Vendor.find({}).select('email vendorId').limit(5);
      allVendors.forEach(v => {
        console.log(`   - Email: ${v.email}, Vendor ID: ${v.vendorId}`);
      });
      process.exit(1);
    }

    console.log('\n✅ Vendor Found:');
    console.log(`   MongoDB ID: ${vendor._id}`);
    console.log(`   Vendor ID: ${vendor.vendorId}`);
    console.log(`   Email: ${vendor.email}`);
    console.log(`   Phone: ${vendor.phone}`);
    console.log(`   Current Mobile Tokens: ${vendor.fcmTokenMobile?.length || 0}`);

    // Initialize array if needed
    if (!vendor.fcmTokenMobile || !Array.isArray(vendor.fcmTokenMobile)) {
      vendor.fcmTokenMobile = [];
      console.log('   ✅ Initialized fcmTokenMobile array');
    }

    // Check if token exists
    const tokenExists = vendor.fcmTokenMobile.some(t => t === testToken);
    if (tokenExists) {
      console.log('\nℹ️ Token already exists in database');
      console.log(`   Token Count: ${vendor.fcmTokenMobile.length}`);
      process.exit(0);
    }

    // Add token
    console.log('\n🧪 Adding mobile/webview FCM token...');
    const oldCount = vendor.fcmTokenMobile.length;
    
    // Remove if exists (shouldn't happen but safety)
    vendor.fcmTokenMobile = vendor.fcmTokenMobile.filter(t => t !== testToken);
    
    // Add to beginning
    vendor.fcmTokenMobile.unshift(testToken);
    
    // Limit to 10
    if (vendor.fcmTokenMobile.length > 10) {
      vendor.fcmTokenMobile = vendor.fcmTokenMobile.slice(0, 10);
    }

    vendor.markModified('fcmTokenMobile');
    
    console.log(`   Tokens before save: ${oldCount}`);
    console.log(`   Tokens after save: ${vendor.fcmTokenMobile.length}`);

    // Save
    await vendor.save({ validateBeforeSave: false });
    console.log('✅ Vendor saved');

    // Verify
    const updatedVendor = await Vendor.findById(vendor._id).select('+fcmTokenMobile');
    
    console.log('\n📊 Verification:');
    console.log(`   Mobile Tokens: ${updatedVendor.fcmTokenMobile?.length || 0}`);
    
    if (updatedVendor.fcmTokenMobile && updatedVendor.fcmTokenMobile.length > 0) {
      const tokenExists = updatedVendor.fcmTokenMobile.includes(testToken);
      console.log(`   ✅ Test token exists: ${tokenExists ? 'YES ✅' : 'NO ❌'}`);
      
      if (!tokenExists) {
        console.log('\n❌ Token not found after save');
      }
    }

    console.log('\n✅ Test completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

testVendorFCMTokenWithEmail();

