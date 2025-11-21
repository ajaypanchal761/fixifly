const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');
require('dotenv').config({ path: './config/production.env' });

async function checkVendorFCMStatus() {
  try {
    console.log('📱 Checking Vendor FCM Token Status...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all vendors
    const vendors = await Vendor.find({})
      .select('vendorId firstName lastName email fcmToken notificationSettings')
      .sort({ createdAt: -1 });

    console.log(`📊 Total Vendors: ${vendors.length}\n`);

    // Categorize vendors
    const vendorsWithFCM = vendors.filter(v => v.fcmToken);
    const vendorsWithoutFCM = vendors.filter(v => !v.fcmToken);
    const vendorsWithPushEnabled = vendors.filter(v => v.notificationSettings?.pushNotifications);

    console.log('📈 Statistics:');
    console.log(`- Vendors with FCM Token: ${vendorsWithFCM.length}`);
    console.log(`- Vendors without FCM Token: ${vendorsWithoutFCM.length}`);
    console.log(`- Vendors with Push Enabled: ${vendorsWithPushEnabled.length}`);
    console.log(`- Ready for Notifications: ${vendorsWithFCM.filter(v => v.notificationSettings?.pushNotifications).length}\n`);

    // Show vendors with FCM tokens
    if (vendorsWithFCM.length > 0) {
      console.log('✅ Vendors with FCM Tokens:');
      vendorsWithFCM.forEach((vendor, index) => {
        console.log(`${index + 1}. ${vendor.firstName} ${vendor.lastName}`);
        console.log(`   📧 Email: ${vendor.email}`);
        console.log(`   🆔 Vendor ID: ${vendor.vendorId}`);
        console.log(`   📱 FCM Token: ${vendor.fcmToken.substring(0, 20)}...`);
        console.log(`   🔔 Push Enabled: ${vendor.notificationSettings?.pushNotifications ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    // Show vendors without FCM tokens
    if (vendorsWithoutFCM.length > 0) {
      console.log('❌ Vendors without FCM Tokens:');
      vendorsWithoutFCM.forEach((vendor, index) => {
        console.log(`${index + 1}. ${vendor.firstName} ${vendor.lastName}`);
        console.log(`   📧 Email: ${vendor.email}`);
        console.log(`   🆔 Vendor ID: ${vendor.vendorId}`);
        console.log(`   📱 FCM Token: Missing`);
        console.log(`   🔔 Push Enabled: ${vendor.notificationSettings?.pushNotifications ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    console.log('💡 Recommendations:');
    if (vendorsWithoutFCM.length > 0) {
      console.log(`- ${vendorsWithoutFCM.length} vendors need to enable notifications in the frontend`);
      console.log('- They should visit the vendor dashboard and click "Enable Notifications"');
    }
    
    if (vendorsWithFCM.length > 0) {
      console.log(`- ${vendorsWithFCM.length} vendors are ready to receive push notifications`);
      console.log('- You can test notifications using the test scripts');
    }

  } catch (error) {
    console.error('❌ Error checking vendor FCM status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkVendorFCMStatus();
