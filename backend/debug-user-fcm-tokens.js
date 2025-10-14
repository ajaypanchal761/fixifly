require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Debug script to check user FCM tokens
async function debugUserFcmTokens() {
  try {
    console.log('🔍 Debugging User FCM Tokens...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://fixfly:fixfly786@cluster0.2ne8beo.mongodb.net/FixFly';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Get all users
    const allUsers = await User.find({}).select('_id name email phone fcmToken isActive isBlocked createdAt');
    console.log(`📊 Total users in database: ${allUsers.length}`);

    // Get active users
    const activeUsers = await User.find({
      isActive: true,
      isBlocked: false
    }).select('_id name email phone fcmToken createdAt');
    console.log(`✅ Active users: ${activeUsers.length}`);

    // Get users with FCM tokens (properly filter out null/empty tokens)
    const usersWithFcmTokens = await User.find({
      isActive: true,
      isBlocked: false,
      fcmToken: { $exists: true, $ne: null, $ne: '' }
    }).select('_id name email phone fcmToken createdAt');
    
    // Additional filtering to ensure we only count users with actual FCM tokens
    const actualUsersWithFcmTokens = usersWithFcmTokens.filter(user => 
      user.fcmToken && user.fcmToken.trim() !== '' && user.fcmToken !== 'None'
    );
    
    console.log(`📱 Users with FCM tokens: ${actualUsersWithFcmTokens.length}`);

    // Get users without FCM tokens
    const usersWithoutFcmTokens = await User.find({
      isActive: true,
      isBlocked: false,
      $or: [
        { fcmToken: { $exists: false } },
        { fcmToken: null },
        { fcmToken: '' }
      ]
    }).select('_id name email phone fcmToken createdAt');
    console.log(`❌ Users without FCM tokens: ${usersWithoutFcmTokens.length}`);

    // Show details of users with FCM tokens
    if (actualUsersWithFcmTokens.length > 0) {
      console.log('\n📱 Users with FCM tokens:');
      actualUsersWithFcmTokens.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'No Name'} (${user.email || 'No Email'})`);
        console.log(`      Phone: ${user.phone || 'No Phone'}`);
        console.log(`      FCM Token: ${user.fcmToken ? user.fcmToken.substring(0, 20) + '...' : 'None'}`);
        console.log(`      Created: ${user.createdAt}`);
        console.log('');
      });
    }

    // Show details of users without FCM tokens
    if (usersWithoutFcmTokens.length > 0) {
      console.log('\n❌ Users without FCM tokens:');
      usersWithoutFcmTokens.slice(0, 5).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'No Name'} (${user.email || 'No Email'})`);
        console.log(`      Phone: ${user.phone || 'No Phone'}`);
        console.log(`      FCM Token: ${user.fcmToken || 'None'}`);
        console.log(`      Created: ${user.createdAt}`);
        console.log('');
      });
      
      if (usersWithoutFcmTokens.length > 5) {
        console.log(`   ... and ${usersWithoutFcmTokens.length - 5} more users without FCM tokens`);
      }
    }

    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Total Users: ${allUsers.length}`);
    console.log(`   Active Users: ${activeUsers.length}`);
    console.log(`   Users with FCM Tokens: ${actualUsersWithFcmTokens.length}`);
    console.log(`   Users without FCM Tokens: ${usersWithoutFcmTokens.length}`);
    
    if (actualUsersWithFcmTokens.length === 0) {
      console.log('\n⚠️ ISSUE FOUND: No users have FCM tokens!');
      console.log('   This is why admin notifications show "0 sent" and "0 delivered"');
      console.log('   Users need to login/register to generate FCM tokens');
    } else {
      console.log('\n✅ Users with FCM tokens found - admin notifications should work');
      console.log(`   Found ${actualUsersWithFcmTokens.length} user(s) with valid FCM tokens`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the debug
if (require.main === module) {
  debugUserFcmTokens();
}

module.exports = debugUserFcmTokens;
