require('dotenv').config();
const admin = require('firebase-admin');

// Test Firebase configuration
async function testFirebaseConfig() {
  try {
    console.log('🔍 Testing Firebase Configuration...');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`   FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? '✅ Present' : '❌ Missing'}`);
    console.log(`   FIREBASE_PRIVATE_KEY_ID: ${process.env.FIREBASE_PRIVATE_KEY_ID ? '✅ Present' : '❌ Missing'}`);
    console.log(`   FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? '✅ Present' : '❌ Missing'}`);
    console.log(`   FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? '✅ Present' : '❌ Missing'}`);
    console.log(`   FIREBASE_CLIENT_ID: ${process.env.FIREBASE_CLIENT_ID ? '✅ Present' : '❌ Missing'}`);
    console.log(`   FIREBASE_CLIENT_X509_CERT_URL: ${process.env.FIREBASE_CLIENT_X509_CERT_URL ? '✅ Present' : '❌ Missing'}`);
    
    // Check private key format
    if (process.env.FIREBASE_PRIVATE_KEY) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      console.log(`\n🔑 Private Key Analysis:`);
      console.log(`   Length: ${privateKey.length} characters`);
      console.log(`   Starts with: ${privateKey.substring(0, 20)}...`);
      console.log(`   Contains \\n: ${privateKey.includes('\\n') ? 'Yes' : 'No'}`);
      console.log(`   Contains actual newlines: ${privateKey.includes('\n') ? 'Yes' : 'No'}`);
      
      // Test key replacement
      const processedKey = privateKey.replace(/\\n/g, '\n');
      console.log(`   After \\n replacement: ${processedKey.substring(0, 20)}...`);
    }
    
    // Try to initialize Firebase
    console.log('\n🔥 Attempting Firebase initialization...');
    
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };
    
    // Validate required fields
    if (!serviceAccount.private_key) {
      throw new Error('FIREBASE_PRIVATE_KEY is missing or invalid');
    }
    if (!serviceAccount.client_email) {
      throw new Error('FIREBASE_CLIENT_EMAIL is missing');
    }
    if (!serviceAccount.project_id) {
      throw new Error('FIREBASE_PROJECT_ID is missing');
    }
    
    console.log('✅ Service account object created successfully');
    
    // Initialize Firebase Admin SDK
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } else {
      console.log('✅ Firebase Admin SDK already initialized');
    }
    
    // Test sending a notification
    console.log('\n📱 Testing notification sending...');
    
    const testToken = 'test-token-123';
    const message = {
      notification: {
        title: 'Test Notification',
        body: 'This is a test notification from Firebase config test'
      },
      token: testToken
    };
    
    try {
      // This will fail because it's a test token, but it will validate the Firebase setup
      await admin.messaging().send(message);
      console.log('✅ Notification sent successfully (unexpected - test token should fail)');
    } catch (error) {
      if (error.code === 'messaging/invalid-registration-token') {
        console.log('✅ Firebase setup is correct - test token failed as expected');
      } else {
        console.log(`⚠️ Firebase setup issue: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Firebase configuration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Firebase configuration test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
if (require.main === module) {
  testFirebaseConfig();
}

module.exports = testFirebaseConfig;
