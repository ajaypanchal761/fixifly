# Vendor Webview FCM Token Save Guide

## Problem
FCM token from webview is not being saved to vendor's `fcmTokenMobile` array.

## Solution
Call the `/api/vendors/save-fcm-token-mobile` endpoint from webview.

## API Endpoint

```
POST /api/vendors/save-fcm-token-mobile
```

## Request Format

```javascript
{
  "token": "your_fcm_token_from_webview",
  "phone": "7610416911",  // Vendor's 10-digit phone number (without +91)
  "platform": "mobile"    // or "webview"
}
```

## Implementation Example

### JavaScript/TypeScript (Webview)

```javascript
// Get FCM token from Firebase
import { getMessaging, getToken } from 'firebase/messaging';

const messaging = getMessaging();
const fcmToken = await getToken(messaging, {
  vapidKey: 'YOUR_VAPID_KEY'
});

// Save token to backend
const saveVendorFCMToken = async (token, phoneNumber) => {
  try {
    const response = await fetch('https://api.fixifly.com/api/vendors/save-fcm-token-mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        phone: phoneNumber, // 10-digit phone number
        platform: 'webview' // or 'mobile'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ FCM token saved successfully');
      console.log('Token count:', data.tokenCount || data.data?.tokenCount);
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

// Call when webview loads or after vendor login
saveVendorFCMToken(fcmToken, '7610416911');
```

## When to Call

1. **On Webview Load** - Call immediately when webview initializes
2. **After Vendor Login** - Call after successful login
3. **On Token Refresh** - Call when FCM token refreshes

## Phone Number Format

- ✅ Correct: `"7610416911"` (10 digits, no prefix)
- ✅ Also works: `"+917610416911"` (will be normalized)
- ✅ Also works: `"917610416911"` (will be normalized)
- ❌ Wrong: `"+91 7610416911"` (spaces not allowed)

## Response Examples

### Success Response
```json
{
  "success": true,
  "message": "FCM token saved successfully for mobile device",
  "updated": true,
  "tokenCount": 1,
  "previousTokenCount": 0,
  "maxTokens": 10,
  "devicesRegistered": 1,
  "platform": "webview"
}
```

### Error Response (Vendor Not Found)
```json
{
  "success": false,
  "message": "Vendor not found with this phone number. Please register first.",
  "debug": {
    "originalPhone": "7610416911",
    "normalizedPhone": "7610416911",
    "hint": "Make sure the phone number matches the one used during registration"
  }
}
```

## Debugging

### Check Server Logs
Look for these log messages:
- `=== VENDOR MOBILE FCM TOKEN SAVE REQUEST ===`
- `Phone number normalization`
- `Vendor lookup attempt`
- `✅ Vendor found for FCM token save`
- `💾 Saving FCM tokens to database...`
- `✅ FCM tokens saved successfully`

### Test Endpoint Manually

```bash
# Using curl (Linux/Mac)
curl -X POST http://localhost:5000/api/vendors/save-fcm-token-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_webview_token_12345",
    "phone": "7610416911",
    "platform": "webview"
  }'

# Using PowerShell (Windows)
$body = @{
    token = "test_webview_token_12345"
    phone = "7610416911"
    platform = "webview"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/vendors/save-fcm-token-mobile" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

## Common Issues

### 1. Vendor Not Found
- **Cause**: Phone number doesn't match registered phone
- **Solution**: Use the exact phone number from vendor registration

### 2. Token Not Saving
- **Cause**: Phone number format mismatch
- **Solution**: Send 10-digit phone number without +91 prefix

### 3. No Logs Appearing
- **Cause**: API endpoint not being called
- **Solution**: Check network tab in browser, verify endpoint URL

## Verification

After calling the API, verify the token was saved:

```javascript
// Check vendor profile (requires authentication)
const checkVendorTokens = async () => {
  const response = await fetch('https://api.fixifly.com/api/vendors/profile', {
    headers: {
      'Authorization': `Bearer ${vendorJWTToken}`
    }
  });
  
  const data = await response.json();
  // Note: fcmTokenMobile is not returned in profile for security
  // But you can check server logs to verify
};
```

## Important Notes

1. **No Authentication Required** - This endpoint is public (uses phone number)
2. **Phone Number Must Match** - Must match the phone used during vendor registration
3. **Multiple Devices Supported** - Up to 10 tokens per vendor
4. **Automatic Deduplication** - Duplicate tokens are automatically removed

