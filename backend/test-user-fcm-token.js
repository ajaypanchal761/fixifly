/**
 * Test script to verify user FCM token storage
 * 
 * Usage: node test-user-fcm-token.js <userId> <token> [platform]
 * Example: node test-user-fcm-token.js 694b9f55d2381ac170ecc9db test_web_token_12345 web
 * Example: node test-user-fcm-token.js 694b9f55d2381ac170ecc9db test_mobile_token_12345 mobile
 */

require('dotenv').config({ path: './config/production.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const testUserFCMToken = async () => {
  const userId = process.argv[2];
  const testToken = process.argv[3] || `test_token_${Date.now()}`;
  const platform = process.argv[4] || 'web';

  if (!userId) {
    console.error('❌ Error: User ID is required');
    console.log('Usage: node test-user-fcm-token.js <userId> <token> [platform]');
    console.log('Example: node test-user-fcm-token.js 694b9f55d2381ac170ecc9db test_token_12345 web');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixfly', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find user by ID
    console.log(`\n📋 Looking up user: ${userId}`);
    const user = await User.findById(userId).select('+fcmTokens +fcmTokenMobile');
    
    if (!user) {
      console.error(`❌ User not found with ID: ${userId}`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user.name} (${user.email})`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Web Tokens (fcmTokens): ${user.fcmTokens?.length || 0}`);
    console.log(`   Mobile Tokens (fcmTokenMobile): ${user.fcmTokenMobile?.length || 0}`);

    // Initialize arrays if they don't exist
    if (!user.fcmTokens || !Array.isArray(user.fcmTokens)) {
      user.fcmTokens = [];
      console.log('   ✅ Initialized fcmTokens array');
    }

    if (!user.fcmTokenMobile || !Array.isArray(user.fcmTokenMobile)) {
      user.fcmTokenMobile = [];
      console.log('   ✅ Initialized fcmTokenMobile array');
    }

    // Save token based on platform
    if (platform === 'web' || platform === 'Web') {
      console.log(`\n💾 Saving web FCM token: ${testToken.substring(0, 30)}...`);
      
      // Remove token if exists
      user.fcmTokens = user.fcmTokens.filter(t => t !== testToken);
      
      // Add new token at the beginning
      user.fcmTokens.unshift(testToken);
      
      // Keep only the most recent 10 tokens
      if (user.fcmTokens.length > 10) {
        user.fcmTokens = user.fcmTokens.slice(0, 10);
      }
      
      user.markModified('fcmTokens');
      
      console.log(`   Tokens before save: ${user.fcmTokens.length}`);
      console.log(`   Token array: ${user.fcmTokens.map(t => t.substring(0, 20) + '...').join(', ')}`);
      
      // Use updateOne for reliable persistence
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            fcmTokens: user.fcmTokens,
            updatedAt: new Date()
          } 
        }
      );
      
      // Also save the document
      await user.save({ validateBeforeSave: false });
      console.log('   ✅ Token saved using updateOne + save');
      
    } else if (platform === 'mobile' || platform === 'Mobile') {
      console.log(`\n💾 Saving mobile FCM token: ${testToken.substring(0, 30)}...`);
      
      // Remove token if exists
      user.fcmTokenMobile = user.fcmTokenMobile.filter(t => t !== testToken);
      
      // Add new token at the beginning
      user.fcmTokenMobile.unshift(testToken);
      
      // Keep only the most recent 10 tokens
      if (user.fcmTokenMobile.length > 10) {
        user.fcmTokenMobile = user.fcmTokenMobile.slice(0, 10);
      }
      
      user.markModified('fcmTokenMobile');
      
      console.log(`   Tokens before save: ${user.fcmTokenMobile.length}`);
      console.log(`   Token array: ${user.fcmTokenMobile.map(t => t.substring(0, 20) + '...').join(', ')}`);
      
      // Use updateOne for reliable persistence
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            fcmTokenMobile: user.fcmTokenMobile,
            updatedAt: new Date()
          } 
        }
      );
      
      // Also save the document
      await user.save({ validateBeforeSave: false });
      console.log('   ✅ Token saved using updateOne + save');
    }

    // Verify the save
    console.log('\n🔍 Verifying token save...');
    const updatedUser = await User.findById(userId).select('+fcmTokens +fcmTokenMobile');
    
    if (platform === 'web' || platform === 'Web') {
      console.log(`   Web Tokens (fcmTokens): ${updatedUser.fcmTokens?.length || 0}`);
      
      if (updatedUser.fcmTokens && updatedUser.fcmTokens.length > 0) {
        console.log(`   Web Token List: ${updatedUser.fcmTokens.map(t => t.substring(0, 20) + '...').join(', ')}`);
        const tokenExists = updatedUser.fcmTokens.includes(testToken);
        
        if (tokenExists) {
          console.log('   ✅ SUCCESS: Web token found in database!');
        } else {
          console.log('   ❌ FAILED: Web token NOT found in database after save');
          console.log('   🔄 Trying alternative save method...');
          
          // Try using $addToSet
          await User.updateOne(
            { _id: user._id },
            { 
              $addToSet: { fcmTokens: testToken },
              $set: { updatedAt: new Date() }
            }
          );
          
          // Verify again
          const finalUser = await User.findById(userId).select('+fcmTokens');
          const finalExists = finalUser.fcmTokens?.includes(testToken);
          
          if (finalExists) {
            console.log('   ✅ SUCCESS: Token saved using $addToSet method');
          } else {
            console.log('   ❌ FAILED: Token still not saved after $addToSet');
          }
        }
      } else {
        console.log('   ❌ FAILED: fcmTokens array is empty after save');
      }
    } else {
      console.log(`   Mobile Tokens (fcmTokenMobile): ${updatedUser.fcmTokenMobile?.length || 0}`);
      
      if (updatedUser.fcmTokenMobile && updatedUser.fcmTokenMobile.length > 0) {
        console.log(`   Mobile Token List: ${updatedUser.fcmTokenMobile.map(t => t.substring(0, 20) + '...').join(', ')}`);
        const tokenExists = updatedUser.fcmTokenMobile.includes(testToken);
        
        if (tokenExists) {
          console.log('   ✅ SUCCESS: Mobile token found in database!');
        } else {
          console.log('   ❌ FAILED: Mobile token NOT found in database after save');
          console.log('   🔄 Trying alternative save method...');
          
          // Try using $addToSet
          await User.updateOne(
            { _id: user._id },
            { 
              $addToSet: { fcmTokenMobile: testToken },
              $set: { updatedAt: new Date() }
            }
          );
          
          // Verify again
          const finalUser = await User.findById(userId).select('+fcmTokenMobile');
          const finalExists = finalUser.fcmTokenMobile?.includes(testToken);
          
          if (finalExists) {
            console.log('   ✅ SUCCESS: Token saved using $addToSet method');
          } else {
            console.log('   ❌ FAILED: Token still not saved after $addToSet');
          }
        }
      } else {
        console.log('   ❌ FAILED: fcmTokenMobile array is empty after save');
      }
    }

    console.log('\n✅ Test completed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
};

testUserFCMToken();

