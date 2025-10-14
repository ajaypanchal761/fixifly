const mongoose = require('mongoose');
const userNotificationService = require('./services/userNotificationService');
const User = require('./models/User');
const { logger } = require('./utils/logger');

// Test script for user notifications
async function testUserNotifications() {
  try {
    console.log('🧪 Starting User Notification Test...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixfly');
    console.log('✅ Connected to database');

    // Find a test user with FCM token
    const testUser = await User.findOne({
      fcmToken: { $exists: true, $ne: null }
    });

    if (!testUser) {
      console.log('❌ No user with FCM token found. Please ensure a user has registered their FCM token.');
      return;
    }

    console.log(`📱 Found test user: ${testUser.name} (${testUser.email})`);
    console.log(`   FCM Token: ${testUser.fcmToken ? 'Present' : 'Missing'}`);
    console.log(`   Token Length: ${testUser.fcmToken ? testUser.fcmToken.length : 0}`);

    // Test 1: Send general notification
    console.log('\n🔔 Test 1: Sending general notification...');
    const generalResult = await userNotificationService.sendGeneralNotification(
      testUser._id,
      '🧪 Test Notification',
      'This is a test notification to verify the system is working correctly.',
      {
        testType: 'general',
        timestamp: new Date().toISOString()
      }
    );
    console.log(`   Result: ${generalResult ? '✅ Success' : '❌ Failed'}`);

    // Test 2: Send booking status update notification
    console.log('\n🔔 Test 2: Sending booking status update notification...');
    const mockBooking = {
      _id: '507f1f77bcf86cd799439011',
      bookingReference: 'TEST-001',
      customer: {
        name: testUser.name,
        email: testUser.email
      }
    };
    
    const bookingResult = await userNotificationService.sendBookingStatusUpdate(
      testUser._id,
      mockBooking,
      'completed'
    );
    console.log(`   Result: ${bookingResult ? '✅ Success' : '❌ Failed'}`);

    // Test 3: Send payment confirmation notification
    console.log('\n🔔 Test 3: Sending payment confirmation notification...');
    const mockPayment = {
      _id: '507f1f77bcf86cd799439012',
      transactionId: 'TXN-TEST-001',
      amount: 1500
    };
    
    const paymentResult = await userNotificationService.sendPaymentConfirmation(
      testUser._id,
      mockPayment
    );
    console.log(`   Result: ${paymentResult ? '✅ Success' : '❌ Failed'}`);

    // Test 4: Send notification to multiple users
    console.log('\n🔔 Test 4: Sending notification to multiple users...');
    const allUsersWithTokens = await User.find({
      fcmToken: { $exists: true, $ne: null }
    }).select('_id').limit(3);

    if (allUsersWithTokens.length > 1) {
      const userIds = allUsersWithTokens.map(user => user._id);
      const multicastResult = await userNotificationService.sendToMultipleUsers(
        userIds,
        {
          title: '📢 System Announcement',
          body: 'This is a test multicast notification to multiple users.'
        },
        {
          type: 'system_announcement',
          priority: 'medium'
        }
      );
      console.log(`   Result: ${multicastResult.successCount} successful, ${multicastResult.failureCount} failed`);
    } else {
      console.log('   ⚠️ Not enough users with FCM tokens for multicast test');
    }

    console.log('\n✅ User Notification Test Completed!');
    console.log('\n📋 Test Summary:');
    console.log(`   - General Notification: ${generalResult ? '✅' : '❌'}`);
    console.log(`   - Booking Status Update: ${bookingResult ? '✅' : '❌'}`);
    console.log(`   - Payment Confirmation: ${paymentResult ? '✅' : '❌'}`);
    console.log(`   - Multicast Notification: ${allUsersWithTokens.length > 1 ? '✅' : '⚠️'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error('User notification test failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testUserNotifications();
}

module.exports = testUserNotifications;
