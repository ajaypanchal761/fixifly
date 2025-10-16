require('dotenv').config();
const mongoose = require('mongoose');
const firebasePushService = require('./services/firebasePushService');
const Vendor = require('./models/Vendor');

// Test script to verify FCM notifications are working
async function testFCMNotifications() {
  try {
    console.log('🧪 Testing FCM Notification System...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://fixfly:fixfly786@cluster0.2ne8beo.mongodb.net/FixFly';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Get vendors with FCM tokens
    const vendorsWithTokens = await Vendor.find({
      isActive: true,
      fcmToken: { $exists: true, $ne: null, $ne: '' }
    }).select('fcmToken firstName lastName email');

    console.log(`📱 Found ${vendorsWithTokens.length} vendors with FCM tokens`);

    if (vendorsWithTokens.length === 0) {
      console.log('❌ No vendors with FCM tokens found. Please ensure vendors have updated their FCM tokens.');
      return;
    }

    // Test notification
    const notification = {
      title: '🧪 Test Notification from Fixfly',
      body: 'This is a test notification to verify FCM integration is working properly.'
    };

    const data = {
      type: 'test_notification',
      message: 'FCM notification system is working!',
      timestamp: new Date().toISOString()
    };

    console.log('📤 Sending test notification...');
    const result = await firebasePushService.sendToAllVendors(notification, data);
    
    console.log('📊 Test Results:', {
      successCount: result.successCount,
      failureCount: result.failureCount,
      totalVendors: vendorsWithTokens.length
    });

    if (result.successCount > 0) {
      console.log('✅ FCM notifications are working! Vendors should receive the test notification.');
    } else {
      console.log('❌ FCM notifications failed. Check Firebase configuration and vendor FCM tokens.');
    }

    // Show vendor details
    console.log('\n📋 Vendors with FCM tokens:');
    vendorsWithTokens.forEach((vendor, index) => {
      console.log(`   ${index + 1}. ${vendor.firstName} ${vendor.lastName} (${vendor.email})`);
      console.log(`      FCM Token: ${vendor.fcmToken ? vendor.fcmToken.substring(0, 20) + '...' : 'None'}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testFCMNotifications();
