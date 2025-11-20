# 🚨 URGENT: Flutter Webview FCM Token Save Fix

## Problem
FCM token is **NOT being saved** because the webview is **NOT calling the API endpoint**.

## Evidence from Logs
```
❌ No logs showing: "=== VENDOR MOBILE FCM TOKEN SAVE REQUEST ==="
❌ Login shows: "hasDeviceToken: false"
❌ Database shows: "fcmTokenMobile": []
```

## Solution
**Flutter/webview MUST call the `/api/vendors/save-fcm-token-mobile` endpoint separately.**

## Implementation Steps

### Step 1: Get FCM Token in Webview

```javascript
// In your webview JavaScript
import { getMessaging, getToken } from 'firebase/messaging';

const messaging = getMessaging();
const fcmToken = await getToken(messaging, {
  vapidKey: 'YOUR_VAPID_KEY'
});
```

### Step 2: Call the API Endpoint

```javascript
// Call this function after getting FCM token
const saveVendorFCMToken = async (fcmToken, vendorPhoneNumber) => {
  try {
    console.log('📱 Saving FCM token for vendor...');
    
    const response = await fetch('https://api.fixifly.com/api/vendors/save-fcm-token-mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: fcmToken,
        phone: vendorPhoneNumber, // "7610416911" (10 digits, no +91)
        platform: 'mobile'  // or 'webview'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ FCM token saved successfully!');
      console.log('Token count:', data.tokenCount);
      return true;
    } else {
      console.error('❌ Failed to save FCM token:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    return false;
  }
};

// Call this function:
// 1. After webview loads
// 2. After vendor login
// 3. When FCM token refreshes
saveVendorFCMToken(fcmToken, '7610416911');
```

### Step 3: Flutter/Dart Implementation

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<bool> saveVendorFCMToken(String fcmToken, String phoneNumber) async {
  try {
    print('📱 Saving FCM token for vendor...');
    
    final response = await http.post(
      Uri.parse('https://api.fixifly.com/api/vendors/save-fcm-token-mobile'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'token': fcmToken,
        'phone': phoneNumber, // "7610416911" (10 digits)
        'platform': 'mobile'
      }),
    );

    final data = jsonDecode(response.body);
    
    if (data['success'] == true) {
      print('✅ FCM token saved successfully!');
      print('Token count: ${data['tokenCount']}');
      return true;
    } else {
      print('❌ Failed: ${data['message']}');
      return false;
    }
  } catch (e) {
    print('❌ Error: $e');
    return false;
  }
}

// Call this function:
// 1. After webview loads
// 2. After vendor login
// 3. When FCM token refreshes
await saveVendorFCMToken(fcmToken, '7610416911');
```

## When to Call This Endpoint

### ✅ Call Immediately After:
1. **Webview Loads** - Get FCM token and save it
2. **Vendor Login** - Save token after successful login
3. **FCM Token Refresh** - Save new token when it refreshes
4. **App Launch** - Save token on app startup

### Example Flow:

```javascript
// 1. Webview loads
window.addEventListener('load', async () => {
  // 2. Get FCM token
  const fcmToken = await getFCMToken();
  
  // 3. Get vendor phone number (from login or storage)
  const vendorPhone = localStorage.getItem('vendorPhone') || '7610416911';
  
  // 4. Save FCM token
  await saveVendorFCMToken(fcmToken, vendorPhone);
});

// After vendor login
function onVendorLogin(vendorData) {
  // Save phone number
  localStorage.setItem('vendorPhone', vendorData.phone);
  
  // Get and save FCM token
  getFCMToken().then(token => {
    saveVendorFCMToken(token, vendorData.phone);
  });
}
```

## API Endpoint Details

### Endpoint
```
POST /api/vendors/save-fcm-token-mobile
```

### Request Body
```json
{
  "token": "your_fcm_token_here",
  "phone": "7610416911",
  "platform": "mobile"
}
```

### Success Response
```json
{
  "success": true,
  "message": "FCM token saved successfully for mobile device",
  "tokenCount": 1,
  "devicesRegistered": 1,
  "platform": "mobile"
}
```

### Error Response (Vendor Not Found)
```json
{
  "success": false,
  "message": "Vendor not found with this phone number. Please register first."
}
```

## Important Notes

1. **No Authentication Required** - This is a public endpoint
2. **Phone Number Must Match** - Must match the phone used during vendor registration
3. **Multiple Calls Safe** - Can call multiple times (automatic deduplication)
4. **Up to 10 Tokens** - Maximum 10 tokens per vendor

## Testing

### Check Server Logs
After calling the endpoint, you should see:
```
=== VENDOR MOBILE FCM TOKEN SAVE REQUEST ===
Request Method: POST
Phone number normalization: { originalPhone: '7610416911', normalizedPhone: '7610416911' }
✅ Vendor found for FCM token save
💾 Saving FCM tokens to database...
✅ FCM tokens saved successfully
```

### Verify in Database
```javascript
// Check vendor document
{
  "_id": "...",
  "vendorId": "652",
  "phone": "7610416911",
  "fcmTokenMobile": [
    "your_fcm_token_here"
  ]
}
```

## Current Status

- ✅ Backend endpoint is working
- ✅ Database save logic is tested
- ✅ Phone number matching is working
- ❌ **Webview is NOT calling the endpoint** ← THIS IS THE PROBLEM

## Action Required

**Flutter team must implement the API call in webview to save FCM token.**

The endpoint is ready and working. Just need to call it from the webview!

