// Load environment variables
require('dotenv').config({ path: './config/production.env' });

const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const { Booking } = require('./models/Booking');
const adminNotificationService = require('./services/adminNotificationService');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ajay761:ajay%401102@cluster0.okjqrni.mongodb.net/FixFly', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function debugBookingNotification() {
  try {
    console.log('🔍 Debugging Booking Notification Flow...\n');

    // Step 1: Check admins
    console.log('📊 Step 1: Checking admins...');
    const allAdmins = await Admin.find({});
    console.log(`   Total admins: ${allAdmins.length}`);

    const activeAdminsWithTokens = await Admin.find({
      isActive: true,
      fcmToken: { $exists: true, $ne: null },
      'notificationSettings.pushNotifications': true
    });

    console.log(`   Active admins with FCM tokens: ${activeAdminsWithTokens.length}`);

    if (activeAdminsWithTokens.length === 0) {
      console.log('❌ No active admins with FCM tokens found!');
      console.log('💡 Solutions:');
      console.log('   1. Make sure admin has opened the admin panel');
      console.log('   2. Check if notification permission was granted');
      console.log('   3. Verify admin notification settings');
      return;
    }

    // Show admin details
    activeAdminsWithTokens.forEach((admin, index) => {
      console.log(`   Admin ${index + 1}: ${admin.name} (${admin.email})`);
      console.log(`     FCM Token: ${admin.fcmToken ? 'Present' : 'Missing'}`);
      console.log(`     Token Length: ${admin.fcmToken ? admin.fcmToken.length : 0}`);
      console.log(`     Push Notifications: ${admin.notificationSettings?.pushNotifications}`);
    });

    // Step 2: Check recent bookings
    console.log('\n📋 Step 2: Checking recent bookings...');
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`   Recent bookings: ${recentBookings.length}`);
    
    if (recentBookings.length > 0) {
      console.log('   Latest booking:');
      const latestBooking = recentBookings[0];
      console.log(`     ID: ${latestBooking._id}`);
      console.log(`     Reference: ${latestBooking.bookingReference}`);
      console.log(`     Customer: ${latestBooking.customer.name}`);
      console.log(`     Created: ${latestBooking.createdAt}`);
    }

    // Step 3: Test notification service with latest booking
    if (recentBookings.length > 0) {
      console.log('\n🧪 Step 3: Testing notification service with latest booking...');
      
      const latestBooking = recentBookings[0];
      console.log('📤 Sending test notification for latest booking...');
      
      try {
        const result = await adminNotificationService.sendNewBookingNotification(latestBooking);
        
        console.log('📊 Notification Result:');
        console.log(`   - Success Count: ${result.successCount}`);
        console.log(`   - Failure Count: ${result.failureCount}`);
        console.log(`   - Total Responses: ${result.responses ? result.responses.length : 0}`);

        if (result.responses && result.responses.length > 0) {
          console.log('📋 Response Details:');
          result.responses.forEach((response, index) => {
            console.log(`   Response ${index + 1}: ${response.success ? 'Success' : 'Failed'}`);
            if (response.error) {
              console.log(`     Error: ${response.error.code} - ${response.error.message}`);
            }
            if (response.messageId) {
              console.log(`     Message ID: ${response.messageId}`);
            }
          });
        }

        if (result.successCount > 0) {
          console.log('✅ Notifications are working!');
          console.log('💡 If admin still doesn\'t receive notifications, check:');
          console.log('   1. Browser notification permissions');
          console.log('   2. Browser is not in focus (notifications might be silent)');
          console.log('   3. Check browser console for errors');
        } else {
          console.log('❌ Notifications are not working');
          console.log('💡 Check Firebase configuration and FCM tokens');
        }

      } catch (error) {
        console.error('❌ Error testing notification service:', error);
      }
    }

    // Step 4: Check Firebase environment variables
    console.log('\n🔥 Step 4: Checking Firebase configuration...');
    console.log(`   FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing'}`);
    console.log(`   FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing'}`);
    console.log(`   FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing'}`);
    console.log(`   FIREBASE_CLIENT_ID: ${process.env.FIREBASE_CLIENT_ID ? 'Set' : 'Missing'}`);
    console.log(`   FIREBASE_CLIENT_X509_CERT_URL: ${process.env.FIREBASE_CLIENT_X509_CERT_URL ? 'Set' : 'Missing'}`);

    // Step 5: Recommendations
    console.log('\n💡 Step 5: Recommendations:');
    console.log('   1. Make sure admin opens the admin panel to enable notifications');
    console.log('   2. Check browser notification permissions');
    console.log('   3. Verify Firebase environment variables are set');
    console.log('   4. Test with a new booking and check server logs');
    console.log('   5. Check if admin is receiving notifications in browser');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

async function main() {
  await connectDB();
  await debugBookingNotification();
  await mongoose.disconnect();
  console.log('\n✅ Debug completed');
}

main().catch(console.error);
