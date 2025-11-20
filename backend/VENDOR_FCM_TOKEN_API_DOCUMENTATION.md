# Vendor FCM Token API Documentation for APK/Mobile Team

## Overview
This document describes the API endpoints for managing FCM (Firebase Cloud Messaging) tokens for push notifications for vendors in the Fixifly application. 

**⚠️ IMPORTANT: Web FCM tokens have been removed. Only mobile/webview devices are supported.**

These endpoints allow the APK/mobile app to register, update, and remove FCM tokens for vendors.

## ⚡ Quick Start - APK Team
**Minimum Required: Just 1 Endpoint!**

For APK team, you only need **ONE endpoint** to save FCM tokens:
- **`POST /api/vendors/save-fcm-token-mobile`** - Works without login (uses phone number)

This single endpoint will handle:
- ✅ App launch (before login)
- ✅ After login
- ✅ Token refresh
- ✅ Multiple devices
- ✅ Mobile webview

**Optional Endpoints**:
- `DELETE /api/vendors/remove-fcm-token` - On logout/uninstall (requires authentication)

---

## Base URL
```
Production: https://api.fixifly.com/api
Development: http://localhost:5000/api
```

---

## Endpoints

### 1. Save FCM Token (Mobile/WebView - No Login Required) ⭐ **MAIN ENDPOINT - USE THIS ONE!**
**This is the MAIN endpoint for APK team. Use this for all scenarios - before login, after login, token refresh, everything!**

#### Endpoint
```
POST /api/vendors/save-fcm-token-mobile
```

#### Authentication
**Not Required** - This is a public endpoint, but requires phone number

#### Request Body
```json
{
  "token": "your_fcm_token_string",
  "phone": "9876543210",  // 10-digit Indian phone number (without +91)
  "platform": "mobile"     // Optional: "mobile" | "android" | "ios"
}
```

#### Request Example (cURL)
```bash
curl -X POST https://api.fixifly.com/api/vendors/save-fcm-token-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "token": "dAbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
    "phone": "9876543210",
    "platform": "mobile"
  }'
```

#### Request Example (JavaScript/Fetch)
```javascript
const saveFCMTokenMobile = async (token, phone, platform = 'mobile') => {
  const response = await fetch('https://api.fixifly.com/api/vendors/save-fcm-token-mobile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: token,
      phone: phone,
      platform: platform
    })
  });
  
  const data = await response.json();
  return data;
};
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "FCM token saved successfully for mobile device",
  "updated": true,
  "tokenCount": 2,
  "previousTokenCount": 1,
  "maxTokens": 10,
  "devicesRegistered": 2,
  "platform": "mobile"
}
```

#### Response When Token Already Exists
```json
{
  "success": true,
  "message": "Token already exists in database",
  "updated": false,
  "tokenCount": 2,
  "tokenInDatabase": true,
  "platform": "mobile"
}
```

#### Error Responses

**400 Bad Request** - Invalid token or phone number
```json
{
  "success": false,
  "message": "FCM token is required"
}
```

or

```json
{
  "success": false,
  "message": "Please provide a valid 10-digit Indian phone number"
}
```

**404 Not Found** - Vendor not found
```json
{
  "success": false,
  "message": "Vendor not found with this phone number. Please register first."
}
```

---

### 2. Remove FCM Token
**Use this endpoint when vendor logs out or uninstalls the app.**

#### Endpoint
```
DELETE /api/vendors/remove-fcm-token
```

#### Authentication
**Required**: Bearer token in Authorization header
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "token": "your_fcm_token_string",
  "platform": "mobile"  // Optional: "web" | "mobile" | "android" | "ios"
}
```

#### Request Example (cURL)
```bash
curl -X DELETE https://api.fixifly.com/api/vendors/remove-fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "token": "dAbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
    "platform": "mobile"
  }'
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "FCM token removed successfully",
  "removed": true
}
```

#### Response When Token Not Found
```json
{
  "success": true,
  "message": "Token not found",
  "removed": false
}
```

---

## Implementation Guide for Mobile App

### Step 1: Get FCM Token
```javascript
// Get FCM token from Firebase
import { getMessaging, getToken } from 'firebase/messaging';

const messaging = getMessaging();
const token = await getToken(messaging, {
  vapidKey: 'YOUR_VAPID_KEY'
});
```

### Step 2: Save Token on App Launch (Before Login)
```javascript
// Save token immediately when app launches
const saveTokenOnLaunch = async (fcmToken, phoneNumber) => {
  try {
    const response = await fetch('https://api.fixifly.com/api/vendors/save-fcm-token-mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: fcmToken,
        phone: phoneNumber, // Vendor's phone number
        platform: 'mobile'
      })
    });
    
    const data = await response.json();
    console.log('Token saved:', data);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};
```

### Step 3: Save Token After Login
```javascript
// After vendor logs in, save token again using mobile endpoint (optional, but recommended)
const saveTokenAfterLogin = async (fcmToken, phoneNumber) => {
  try {
    const response = await fetch('https://api.fixifly.com/api/vendors/save-fcm-token-mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: fcmToken,
        phone: phoneNumber,
        platform: 'mobile'
      })
    });
    
    const data = await response.json();
    console.log('Token saved after login:', data);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};
```

### Step 4: Handle Token Refresh
```javascript
// Firebase automatically refreshes tokens
// Listen for token refresh and update
import { onTokenRefresh } from 'firebase/messaging';

onTokenRefresh(messaging, async () => {
  const newToken = await getToken(messaging, {
    vapidKey: 'YOUR_VAPID_KEY'
  });
  
  // Save new token
  await saveTokenOnLaunch(newToken, vendorPhoneNumber);
});
```

### Step 5: Remove Token on Logout
```javascript
// Remove token when vendor logs out
const removeTokenOnLogout = async (fcmToken, vendorToken) => {
  try {
    const response = await fetch('https://api.fixifly.com/api/vendors/remove-fcm-token', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendorToken}`
      },
      body: JSON.stringify({
        token: fcmToken,
        platform: 'mobile'
      })
    });
    
    const data = await response.json();
    console.log('Token removed:', data);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};
```

---

## Important Notes

1. **Token Storage**: The system stores up to 10 mobile/webview tokens per vendor
2. **Web Tokens Removed**: Web browser FCM tokens are no longer supported - only mobile/webview devices
3. **Token Deduplication**: Duplicate tokens are automatically removed
4. **Platform**: Only mobile/webview platforms are supported (mobile, android, ios)
5. **Multiple Devices**: Each device gets its own token, and all tokens are stored
6. **Token Refresh**: When FCM refreshes a token, save the new token - the old one will be automatically cleaned up

---

## Testing

### Test Token Save (Mobile)
```bash
curl -X POST http://localhost:5000/api/vendors/save-fcm-token-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_token_12345",
    "phone": "9876543210",
    "platform": "mobile"
  }'
```

### Test Token Save (Mobile - No Auth Required)
```bash
curl -X POST http://localhost:5000/api/vendors/save-fcm-token-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_token_12345",
    "phone": "7610416911",
    "platform": "mobile"
  }'
```

---

## Support

For issues or questions, contact the backend team or check the main API documentation.

