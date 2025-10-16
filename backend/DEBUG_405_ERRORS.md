# 🚨 Debug 405 Method Not Allowed Errors

## Problem Analysis

Your Flutter app is getting 405 errors on all FCM token endpoints:
```
I/flutter (10989): Vendor endpoint response: 405 -
I/flutter (10989): Vendor fcm-token endpoint response: 405 -
I/flutter (10989): User endpoint response: 405 -
```

## 🔧 Debugging Steps

### 1. Test Debug Endpoints (No Auth Required)

First, test these debug endpoints to verify routing is working:

```bash
# Test user FCM debug endpoint
curl -X POST https://www.getfixfly.com/api/debug/user-fcm
curl -X PUT https://www.getfixfly.com/api/debug/user-fcm

# Test vendor FCM debug endpoint  
curl -X POST https://www.getfixfly.com/api/debug/vendor-fcm
curl -X PUT https://www.getfixfly.com/api/debug/vendor-fcm
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Debug endpoint reached",
  "method": "POST",
  "url": "/api/debug/user-fcm",
  "timestamp": "2024-01-16T10:30:00.000Z"
}
```

### 2. Test Actual FCM Endpoints (Auth Required)

If debug endpoints work, test the actual FCM endpoints with proper authentication:

```bash
# Test user FCM token endpoint
curl -X POST https://www.getfixfly.com/api/user/notifications/fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"fcmToken": "test_token_123"}'

curl -X PUT https://www.getfixfly.com/api/user/notifications/fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"fcmToken": "test_token_123"}'

# Test vendor FCM token endpoints
curl -X POST https://www.getfixfly.com/api/vendors/update-fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_VENDOR_JWT_TOKEN" \
  -d '{"fcmToken": "test_token_123"}'

curl -X PUT https://www.getfixfly.com/api/vendors/update-fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_VENDOR_JWT_TOKEN" \
  -d '{"fcmToken": "test_token_123"}'

curl -X POST https://www.getfixfly.com/api/vendors/fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_VENDOR_JWT_TOKEN" \
  -d '{"fcmToken": "test_token_123"}'

curl -X PUT https://www.getfixfly.com/api/vendors/fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_VENDOR_JWT_TOKEN" \
  -d '{"fcmToken": "test_token_123"}'
```

### 3. Check Server Logs

Monitor your server logs when testing. You should see:

```
Debug User FCM: POST /api/debug/user-fcm
Debug Vendor FCM: POST /api/debug/vendor-fcm
```

If you don't see these logs, the requests aren't reaching your server.

### 4. Verify Flutter App Endpoints

Check what URLs your Flutter app is actually calling. Based on the error logs, it seems like the Flutter app might be calling different endpoints than expected.

## 🎯 Possible Causes & Solutions

### Cause 1: Authentication Issues
**Problem:** Flutter app not sending proper JWT tokens
**Solution:** 
- Verify JWT token is being sent in Authorization header
- Check if token is valid and not expired
- Ensure token format: `Bearer <token>`

### Cause 2: Wrong Base URL
**Problem:** Flutter app calling wrong server URL
**Solution:**
- Verify Flutter app is calling `https://www.getfixfly.com/api/...`
- Check if there's a proxy or CDN blocking requests
- Test with direct server IP if available

### Cause 3: Route Registration Issues
**Problem:** Routes not properly registered in Express
**Solution:**
- Verify routes are registered in correct order in server.js
- Check for route conflicts
- Ensure middleware is applied correctly

### Cause 4: CORS Issues
**Problem:** CORS blocking requests from Flutter app
**Solution:**
- Check CORS configuration in server.js
- Add Flutter app domain to allowed origins
- Test with CORS disabled temporarily

### Cause 5: Flutter App Using Wrong Endpoints
**Problem:** Flutter app calling non-existent endpoints
**Solution:**
- Check Flutter app source code for endpoint URLs
- Verify endpoint paths match backend routes
- Update Flutter app to use correct endpoints

## 🔍 Debugging Commands

### Check Server Status
```bash
curl https://www.getfixfly.com/health
```

### Test Basic Connectivity
```bash
curl https://www.getfixfly.com/api/test
```

### Test Debug Endpoints
```bash
curl -X POST https://www.getfixfly.com/api/debug/user-fcm
curl -X POST https://www.getfixfly.com/api/debug/vendor-fcm
```

### Check Route Registration
Look for these lines in server.js:
```javascript
app.use('/api/vendors', vendorRoutes);
app.use('/api/user/notifications', userNotificationRoutes);
```

## 📱 Flutter App Debugging

### Check Flutter App Logs
Look for these specific log messages:
- "Sending FCM token to backend endpoints..."
- "Vendor endpoint response: 405"
- "User endpoint response: 405"

### Verify Flutter App Endpoints
Check what URLs the Flutter app is calling:
- Should be: `https://www.getfixfly.com/api/user/notifications/fcm-token`
- Should be: `https://www.getfixfly.com/api/vendors/update-fcm-token`
- Should be: `https://www.getfixfly.com/api/vendors/fcm-token`

## 🚀 Quick Fixes

### Fix 1: Add More Debug Logging
Add this to your Flutter app to see exact URLs being called:
```dart
print('Calling URL: $url');
print('Method: $method');
print('Headers: $headers');
```

### Fix 2: Test with Postman/Insomnia
Use Postman or Insomnia to test the endpoints directly:
1. Set method to POST or PUT
2. Add Authorization header with Bearer token
3. Add Content-Type: application/json
4. Send request with FCM token in body

### Fix 3: Check Network Tab
In your Flutter app, check the network requests:
1. Look for 405 errors
2. Check the exact URL being called
3. Verify headers are being sent
4. Check request body format

## 📞 Next Steps

1. **Test debug endpoints first** - This will tell us if routing is working
2. **Check server logs** - Look for incoming requests
3. **Verify Flutter app URLs** - Make sure it's calling correct endpoints
4. **Test with proper authentication** - Use valid JWT tokens
5. **Check CORS configuration** - Ensure Flutter app domain is allowed

## 🆘 If Still Getting 405 Errors

If you're still getting 405 errors after following these steps:

1. **Share the exact URLs** your Flutter app is calling
2. **Share server logs** showing incoming requests
3. **Test with curl commands** to verify endpoints work
4. **Check if there's a proxy/CDN** blocking requests
5. **Verify server is running** the latest code with our fixes

The debug endpoints should work immediately and help us identify where the issue is occurring.
