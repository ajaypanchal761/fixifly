/**
 * Test script to test vendor FCM token API endpoint
 */

const testVendorFCMAPI = async () => {
  try {
    const phone = '7610416911';
    const token = `test_webview_token_${Date.now()}`;
    
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
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ FCM token saved successfully!');
      console.log(`   Token Count: ${data.tokenCount || data.data?.tokenCount || 'N/A'}`);
    } else {
      console.log('❌ Failed to save FCM token');
      console.log(`   Error: ${data.message}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Only run if fetch is available (Node 18+)
if (typeof fetch !== 'undefined') {
  testVendorFCMAPI();
} else {
  console.log('⚠️ fetch is not available. Please use Node.js 18+ or install node-fetch');
  console.log('Or test manually using:');
  console.log('curl -X POST http://localhost:5000/api/vendors/save-fcm-token-mobile \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"token":"test_token","phone":"7610416911","platform":"mobile"}\'');
}

