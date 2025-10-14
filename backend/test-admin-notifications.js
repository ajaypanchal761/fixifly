require('dotenv').config();
const mongoose = require('mongoose');
const userNotificationService = require('./services/userNotificationService');
const User = require('./models/User');
const Admin = require('./models/Admin');
const { logger } = require('./utils/logger');

// Test script for admin notification management
async function testAdminNotifications() {
  try {
    // Safety check: Prevent running in production
    if (process.env.NODE_ENV === 'production') {
      console.log('❌ This test script cannot be run in production environment');
      console.log('   Test notifications should not be sent to real users in production');
      return;
    }
    
    console.log('🧪 Starting Admin Notification Management Test...');
    console.log('⚠️  WARNING: This will send test notifications to real users!');
    console.log('   Make sure you are in development environment only.');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://fixfly:fixfly786@cluster0.2ne8beo.mongodb.net/FixFly';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Find test users with FCM tokens
    const testUsers = await User.find({
      fcmToken: { $exists: true, $ne: null },
      isActive: true
    }).limit(3);

    if (testUsers.length === 0) {
      console.log('❌ No users with FCM tokens found. Please ensure users have registered their FCM tokens.');
      return;
    }

    console.log(`📱 Found ${testUsers.length} test users with FCM tokens:`);
    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
    });

    // Test 1: Send notification to all users
    console.log('\n🔔 Test 1: Sending notification to all users...');
    const allUserIds = testUsers.map(user => user._id);
    const allUsersResult = await userNotificationService.sendToMultipleUsers(
      allUserIds,
      {
        title: '📢 Admin Test Notification',
        body: 'This is a test notification sent from admin panel to all users.'
      },
      {
        type: 'admin_notification',
        priority: 'medium',
        timestamp: new Date().toISOString()
      }
    );
    console.log(`   Result: ${allUsersResult.successCount} successful, ${allUsersResult.failureCount} failed`);

    // Test 2: Send notification to specific users
    console.log('\n🔔 Test 2: Sending notification to specific users...');
    const specificUserIds = testUsers.slice(0, 2).map(user => user._id);
    const specificUsersResult = await userNotificationService.sendToMultipleUsers(
      specificUserIds,
      {
        title: '🎯 Targeted Admin Notification',
        body: 'This is a targeted notification sent to specific users only.'
      },
      {
        type: 'admin_notification',
        priority: 'high',
        timestamp: new Date().toISOString()
      }
    );
    console.log(`   Result: ${specificUsersResult.successCount} successful, ${specificUsersResult.failureCount} failed`);

    // Test 3: Send individual notification
    console.log('\n🔔 Test 3: Sending individual notification...');
    const individualResult = await userNotificationService.sendToUser(
      testUsers[0]._id,
      {
        title: '👤 Individual Admin Notification',
        body: 'This is an individual notification sent to a specific user.'
      },
      {
        type: 'admin_notification',
        priority: 'high',
        timestamp: new Date().toISOString()
      }
    );
    console.log(`   Result: ${individualResult ? '✅ Success' : '❌ Failed'}`);

    // Test 4: Send notification with image
    console.log('\n🔔 Test 4: Sending notification with image...');
    const imageResult = await userNotificationService.sendToMultipleUsers(
      allUserIds,
      {
        title: '🖼️ Admin Notification with Image',
        body: 'This notification includes an image to test image support.',
        image: 'https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=Test+Image'
      },
      {
        type: 'admin_notification',
        priority: 'medium',
        timestamp: new Date().toISOString(),
        image: 'https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=Test+Image'
      }
    );
    console.log(`   Result: ${imageResult.successCount} successful, ${imageResult.failureCount} failed`);

    // Test 5: Send urgent notification
    console.log('\n🔔 Test 5: Sending urgent notification...');
    const urgentResult = await userNotificationService.sendToMultipleUsers(
      allUserIds,
      {
        title: '🚨 URGENT: Admin Announcement',
        body: 'This is an urgent notification with high priority.'
      },
      {
        type: 'admin_notification',
        priority: 'high',
        timestamp: new Date().toISOString()
      }
    );
    console.log(`   Result: ${urgentResult.successCount} successful, ${urgentResult.failureCount} failed`);

    console.log('\n✅ Admin Notification Management Test Completed!');
    console.log('\n📋 Test Summary:');
    console.log(`   - All Users Notification: ${allUsersResult.successCount} sent, ${allUsersResult.failureCount} failed`);
    console.log(`   - Specific Users Notification: ${specificUsersResult.successCount} sent, ${specificUsersResult.failureCount} failed`);
    console.log(`   - Individual Notification: ${individualResult ? '✅' : '❌'}`);
    console.log(`   - Image Notification: ${imageResult.successCount} sent, ${imageResult.failureCount} failed`);
    console.log(`   - Urgent Notification: ${urgentResult.successCount} sent, ${urgentResult.failureCount} failed`);

    console.log('\n📱 Check your devices for notifications!');
    console.log('   - Users should receive push notifications');
    console.log('   - Notifications should appear in the notification tab');
    console.log('   - Database should have notification records');

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error('Admin notification test failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testAdminNotifications();
}

module.exports = testAdminNotifications;
