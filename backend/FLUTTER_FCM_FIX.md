# Flutter FCM Token API Fix - 405 Error Resolution

## Issue
Flutter app was getting 405 (Method Not Allowed) error when trying to save FCM token.

## Fixes Applied

### 1. CORS Configuration Updated
- Now allows all origins (including mobile apps with no origin)
- Added proper OPTIONS handling for CORS preflight requests
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS, PATCH

### 2. Route Configuration
- Added explicit OPTIONS handler for `/save-fcm-token-mobile`
- Added GET handler that returns helpful error message (for debugging)
- POST handler properly configured

### 3. Controller Updates
- Added method validation (checks if request is POST)
- Added detailed logging for debugging
- Better error messages

## Correct API Usage for Flutter

### Endpoint
```
POST /api/users/save-fcm-token-mobile
```

### Request Format
```dart
final response = await http.post(
  Uri.parse('https://your-backend-url.com/api/users/save-fcm-token-mobile'),
  headers: {
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'token': fcmToken,           // FCM token string
    'phone': phoneNumber,        // 10-digit phone (without +91)
    'platform': 'android',       // Optional: 'android' or 'ios'
  }),
);
```

### Important Points
1. **Method**: Must be POST (not GET)
2. **Content-Type**: Must be `application/json`
3. **Phone Number**: 10 digits without +91 prefix (e.g., "9876543210")
4. **URL**: Full URL including `/api/users/save-fcm-token-mobile`

### Example Flutter Code
```dart
Future<void> saveFCMToken(String token, String phone) async {
  try {
    final response = await http.post(
      Uri.parse('https://your-backend-url.com/api/users/save-fcm-token-mobile'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'token': token,
        'phone': phone.replaceAll(RegExp(r'[^0-9]'), ''), // Remove +91 if present
        'platform': 'android',
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      print('✅ FCM token saved: ${data['message']}');
    } else {
      print('❌ Error: ${response.statusCode}');
      print('Response: ${response.body}');
    }
  } catch (e) {
    print('❌ Exception: $e');
  }
}
```

## Testing

### Test with cURL
```bash
curl -X POST http://localhost:5000/api/users/save-fcm-token-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_token_123456789",
    "phone": "9876543210",
    "platform": "android"
  }'
```

### Expected Response (Success)
```json
{
  "success": true,
  "message": "FCM token saved successfully for mobile device",
  "updated": true,
  "tokenCount": 1,
  "previousTokenCount": 0,
  "maxTokens": 10,
  "devicesRegistered": 1,
  "platform": "android"
}
```

### Expected Response (405 Error - Wrong Method)
```json
{
  "success": false,
  "message": "Method GET not allowed. Use POST.",
  "endpoint": "/api/users/save-fcm-token-mobile",
  "method": "POST",
  "example": {
    "url": "/api/users/save-fcm-token-mobile",
    "method": "POST",
    "body": {
      "token": "your_fcm_token_string",
      "phone": "9876543210",
      "platform": "mobile"
    }
  }
}
```

## Common Issues & Solutions

### Issue 1: 405 Method Not Allowed
**Cause**: Using GET instead of POST
**Solution**: Ensure you're using `http.post()` not `http.get()`

### Issue 2: CORS Error
**Cause**: CORS preflight failing
**Solution**: Already fixed - CORS now allows all origins

### Issue 3: 400 Bad Request
**Cause**: Missing or invalid phone number
**Solution**: Ensure phone is 10 digits without +91 prefix

### Issue 4: 404 Not Found
**Cause**: User not found with that phone number
**Solution**: User must be registered first

## Debugging

Check server logs for:
- Request method
- Request URL
- Request body
- Headers

All requests to `/save-fcm-token-mobile` are now logged with detailed information.

## Next Steps

1. Restart the backend server
2. Test with cURL first to verify endpoint works
3. Update Flutter code to use POST method
4. Check Flutter logs for any errors
5. Verify phone number format (10 digits, no +91)

