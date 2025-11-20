/**
 * Test script to verify vendor FCM token endpoint is accessible
 */

const testEndpoint = async () => {
  try {
    const phone = '7610416911';
    const token = `test_endpoint_${Date.now()}`;
    
    console.log('🧪 Testing Vendor FCM Token Endpoint...');
    console.log(`   URL: http://localhost:5000/api/vendors/save-fcm-token-mobile`);
    console.log(`   Phone: ${phone}`);
    console.log(`   Token: ${token.substring(0, 30)}...`);
    
    const response = await fetch('http://localhost:5000/api/vendors/save-fcm-token-mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        phone: phone,
        platform: 'mobile'
      })
    });
    
    const data = await response.json();
    
    console.log('\n📊 Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Message: ${data.message}`);
    
    if (data.success) {
      console.log(`   ✅ Token Count: ${data.tokenCount || 'N/A'}`);
      console.log(`   ✅ Devices Registered: ${data.devicesRegistered || 'N/A'}`);
    } else {
      console.log(`   ❌ Error: ${data.message}`);
      if (data.debug) {
        console.log(`   Debug: ${JSON.stringify(data.debug, null, 2)}`);
      }
    }
    
    return data.success;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Make sure the server is running on port 5000');
    return false;
  }
};

// Only run if fetch is available (Node 18+)
if (typeof fetch !== 'undefined') {
  testEndpoint();
} else {
  console.log('⚠️ fetch is not available. Please use Node.js 18+');
  console.log('\n📝 Manual Test Command:');
  console.log('curl -X POST http://localhost:5000/api/vendors/save-fcm-token-mobile \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"token":"test_token_123","phone":"7610416911","platform":"mobile"}\'');
}

