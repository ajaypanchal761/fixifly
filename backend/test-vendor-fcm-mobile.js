/**
 * Test script for Vendor Mobile FCM Token Save
 * 
 * Usage:
 * node test-vendor-fcm-mobile.js <vendorId> <token> <phone>
 * 
 * Example:
 * node test-vendor-fcm-mobile.js 216 test_webview_token_12345 7610416911
 */

require('dotenv').config({ path: './config/production.env' });
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

const testVendorFCMTokenMobile = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const vendorId = process.argv[2] || '216';
    const testToken = process.argv[3] || `test_webview_token_${Date.now()}`;
    const phone = process.argv[4] || '7610416911';

    console.log('\n📋 Test Parameters:');
    console.log(`   Vendor ID: ${vendorId}`);
    console.log(`   Test Token: ${testToken.substring(0, 30)}...`);
    console.log(`   Phone: ${phone}`);

    // Normalize phone number (same logic as saveFCMTokenMobile)
    const normalizePhone = (phoneNumber) => {
      if (!phoneNumber) return phoneNumber;
      const digits = phoneNumber.replace(/\D/g, '');
      // Remove country code if present (91 or +91)
      let cleaned = digits;
      if (cleaned.length === 12 && cleaned.startsWith('91')) {
        cleaned = cleaned.substring(2);
      } else if (cleaned.length === 13 && cleaned.startsWith('91')) {
        cleaned = cleaned.substring(2);
      }
      // Remove leading 0 if present
      if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      return cleaned;
    };

    const normalizedPhone = normalizePhone(phone);
    console.log(`\n📞 Phone Normalization:`);
    console.log(`   Original: ${phone}`);
    console.log(`   Normalized: ${normalizedPhone}`);

    // Find vendor by vendorId first
    let vendor = await Vendor.findOne({ vendorId }).select('+fcmTokenMobile');
    
    if (!vendor) {
      console.error('❌ Vendor not found by vendorId');
      
      // Try finding by phone
      console.log('\n🔍 Trying to find vendor by phone number...');
      vendor = await Vendor.findOne({ phone: normalizedPhone }).select('+fcmTokenMobile');
      
      if (!vendor) {
        // Try with alternate formats
        const phoneWithZero = '0' + normalizedPhone;
        vendor = await Vendor.findOne({ phone: phoneWithZero }).select('+fcmTokenMobile');
      }
      
      if (!vendor) {
        const phoneWithPlus91 = '+91' + normalizedPhone;
        vendor = await Vendor.findOne({ phone: phoneWithPlus91 }).select('+fcmTokenMobile');
      }
      
      if (!vendor) {
        const phoneWith91 = '91' + normalizedPhone;
        vendor = await Vendor.findOne({ phone: phoneWith91 }).select('+fcmTokenMobile');
      }
    }
    
    if (!vendor) {
      console.error('❌ Vendor not found with any method');
      console.log('\n📊 Available vendors in database:');
      const allVendors = await Vendor.find({}).select('vendorId phone email').limit(5);
      allVendors.forEach(v => {
        console.log(`   - Vendor ID: ${v.vendorId}, Phone: ${v.phone}, Email: ${v.email}`);
      });
      process.exit(1);
    }

    console.log('\n✅ Vendor Found:');
    console.log(`   MongoDB ID: ${vendor._id}`);
    console.log(`   Vendor ID: ${vendor.vendorId}`);
    console.log(`   Email: ${vendor.email}`);
    console.log(`   Phone in DB: ${vendor.phone}`);
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
    console.log(`   Token array: ${vendor.fcmTokenMobile.map(t => t.substring(0, 20) + '...').join(', ')}`);

    // Save
    await vendor.save({ validateBeforeSave: false });
    console.log('✅ Vendor saved');

    // Verify
    const updatedVendor = await Vendor.findById(vendor._id).select('+fcmTokenMobile');
    
    console.log('\n📊 Verification:');
    console.log(`   Mobile Tokens: ${updatedVendor.fcmTokenMobile?.length || 0}`);
    
    if (updatedVendor.fcmTokenMobile && updatedVendor.fcmTokenMobile.length > 0) {
      console.log(`   Token List: ${updatedVendor.fcmTokenMobile.map(t => t.substring(0, 20) + '...').join(', ')}`);
      const tokenExists = updatedVendor.fcmTokenMobile.includes(testToken);
      console.log(`   ✅ Test token exists: ${tokenExists ? 'YES ✅' : 'NO ❌'}`);
      
      if (!tokenExists) {
        console.log('\n❌ Token not found after save - trying direct MongoDB update...');
        
        // Try direct update
        const result = await Vendor.updateOne(
          { _id: vendor._id },
          { 
            $addToSet: { fcmTokenMobile: testToken },
            $slice: { fcmTokenMobile: 10 }
          }
        );
        
        console.log(`   Update result: ${JSON.stringify(result)}`);
        
        // Verify again
        const finalVendor = await Vendor.findById(vendor._id).select('+fcmTokenMobile');
        const finalExists = finalVendor.fcmTokenMobile?.includes(testToken);
        console.log(`   ✅ Token exists after direct update: ${finalExists ? 'YES ✅' : 'NO ❌'}`);
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

testVendorFCMTokenMobile();

