const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const adminNotificationService = require('./services/adminNotificationService');
const firebasePushService = require('./services/firebasePushService');
const { logger } = require('./utils/logger');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function debugAdminNotifications() {
  try {
    console.log('🔍 Debugging Admin Notifications...\n');

    // Step 1: Check admins in database
    console.log('📊 Step 1: Checking admins in database...');
    const allAdmins = await Admin.find({});
    console.log(`   Total admins: ${allAdmins.length}`);

    if (allAdmins.length === 0) {
      console.log('❌ No admins found in database');
      console.log('💡 Create an admin account first');
      return;
    }

    // Step 2: Check admin details
    console.log('\n👤 Step 2: Admin details:');
    allAdmins.forEach((admin, index) => {
      console.log(`   Admin ${index + 1}: ${admin.name} (${admin.email})`);
      console.log(`     - Active: ${admin.isActive}`);
      console.log(`     - FCM Token: ${admin.fcmToken ? 'Present' : 'Missing'}`);
      console.log(`     - Token Length: ${admin.fcmToken ? admin.fcmToken.length : 0}`);
      console.log(`     - Push Notifications: ${admin.notificationSettings?.pushNotifications || false}`);
      console.log(`     - New Bookings: ${admin.notificationSettings?.newBookings || false}`);
    });

    // Step 3: Check active admins with FCM tokens
    console.log('\n🔍 Step 3: Checking active admins with FCM tokens...');
    const activeAdminsWithTokens = await Admin.find({
      isActive: true,
      fcmToken: { $exists: true, $ne: null },
      'notificationSettings.pushNotifications': true
    });

    console.log(`   Active admins with FCM tokens: ${activeAdminsWithTokens.length}`);

    if (activeAdminsWithTokens.length === 0) {
      console.log('\n❌ No active admins with FCM tokens found!');
      console.log('💡 Possible solutions:');
      console.log('   1. Make sure admins have opened the admin panel');
      console.log('   2. Check if notification permission was granted in browser');
      console.log('   3. Check browser console for errors');
      console.log('   4. Verify Firebase configuration');
      return;
    }

    // Step 4: Test Firebase configuration
    console.log('\n🔥 Step 4: Testing Firebase configuration...');
    try {
      const firebaseTest = await firebasePushService.sendPushNotification(
        'test-token-123', // This will fail but test Firebase setup
        { title: 'Test', body: 'Test' },
        { type: 'test' }
      );
      console.log('   Firebase test result:', firebaseTest);
    } catch (error) {
      if (error.message.includes('invalid-registration-token')) {
        console.log('   ✅ Firebase is working (expected error with test token)');
      } else {
        console.log('   ❌ Firebase error:', error.message);
      }
    }

    // Step 5: Test admin notification service
    console.log('\n📤 Step 5: Testing admin notification service...');
    
    const testBooking = {
      _id: 'test-booking-id',
      bookingReference: 'FIX12345678',
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890'
      },
      services: [
        { serviceName: 'Laptop Repair' }
      ],
      pricing: {
        totalAmount: 1500
      },
      scheduling: {
        preferredDate: new Date()
      }
    };

    console.log('   Sending test notification...');
    const result = await adminNotificationService.sendNewBookingNotification(testBooking);
    
    console.log('   📊 Notification Result:');
    console.log(`     - Success Count: ${result.successCount}`);
    console.log(`     - Failure Count: ${result.failureCount}`);
    console.log(`     - Total Responses: ${result.responses ? result.responses.length : 0}`);

    if (result.responses && result.responses.length > 0) {
      console.log('   📋 Response Details:');
      result.responses.forEach((response, index) => {
        console.log(`     Response ${index + 1}: ${response.success ? 'Success' : 'Failed'}`);
        if (response.error) {
          console.log(`       Error: ${response.error}`);
        }
      });
    }

    // Step 6: Check recent logs
    console.log('\n📋 Step 6: Recommendations:');
    if (result.successCount === 0) {
      console.log('   ❌ No notifications were sent successfully');
      console.log('   💡 Check the following:');
      console.log('     1. Firebase environment variables are set correctly');
      console.log('     2. Firebase service account has proper permissions');
      console.log('     3. FCM tokens are valid and not expired');
      console.log('     4. Network connectivity to Firebase servers');
    } else {
      console.log('   ✅ Notifications are working!');
      console.log(`   📊 Successfully sent to ${result.successCount} admins`);
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

async function main() {
  await connectDB();
  await debugAdminNotifications();
  await mongoose.disconnect();
  console.log('\n✅ Debug completed');
}

main().catch(console.error);
