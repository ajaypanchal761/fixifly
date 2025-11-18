# Flutter Mobile App - FCM Token API Documentation

## Overview
Yeh API Flutter mobile app ke liye hai jisme FCM (Firebase Cloud Messaging) token ko backend mein save karna hai.

---

## API Endpoint

### Save Mobile FCM Token

**Endpoint:** `POST /api/users/save-fcm-token-mobile`

**Base URL:** 
- Development: `http://localhost:5000/api`
- Production: `https://your-production-api.com/api`

**Authentication:** Not required (Public endpoint)

---

## Request

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "token": "dMd4D-6BCcuT20Gl9MTVpa:APA91bEKR6_wePUicqKNhuMmL4Q5waaL8RHWc2yJIttYPZsE1ix-1Nwy-OFJzF_dW753fyxNgtrhCS90ht2Z8Hkt5VxfDIn23efL3d-I12JIonFF1UQuVpQ",
  "phone": "+917610416911",
  "platform": "mobile"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | FCM token from Flutter app (Firebase Cloud Messaging token) |
| `phone` | string | Yes | User's phone number (with country code, e.g., +917610416911) |
| `platform` | string | Optional | Platform identifier (default: "mobile") |

### Phone Number Format
- Phone number must include country code
- Format: `+91XXXXXXXXXX` (for India)
- Example: `+917610416911`
- Without country code: `7610416911` (will be auto-formatted to `+917610416911`)

---

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "FCM mobile token saved successfully",
  "data": {
    "tokenCount": 1
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Token
```json
{
  "success": false,
  "message": "FCM token is required"
}
```

#### 400 Bad Request - Missing Phone
```json
{
  "success": false,
  "message": "Phone number is required"
}
```

#### 404 Not Found - User Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to save FCM mobile token. Please try again."
}
```

---

## Flutter Implementation Example

### 1. Get FCM Token in Flutter

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

class FCMService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  
  // Request permission
  static Future<void> requestPermission() async {
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');
    }
  }
  
  // Get FCM token
  static Future<String?> getToken() async {
    try {
      String? token = await _firebaseMessaging.getToken();
      print('FCM Token: $token');
      return token;
    } catch (e) {
      print('Error getting FCM token: $e');
      return null;
    }
  }
  
  // Listen for token refresh
  static void listenToTokenRefresh() {
    _firebaseMessaging.onTokenRefresh.listen((newToken) {
      print('FCM Token refreshed: $newToken');
      // Save new token to backend
      saveTokenToBackend(newToken);
    });
  }
}
```

### 2. Save Token to Backend

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class FCMTokenService {
  static const String baseUrl = 'https://your-production-api.com/api';
  
  // Save FCM token to backend
  static Future<bool> saveTokenToBackend(String token, String phoneNumber) async {
    try {
      final url = Uri.parse('$baseUrl/users/save-fcm-token-mobile');
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'token': token,
          'phone': phoneNumber,
          'platform': 'mobile',
        }),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          print('✅ FCM token saved successfully');
          print('Token count: ${data['data']['tokenCount']}');
          return true;
        } else {
          print('❌ Failed to save token: ${data['message']}');
          return false;
        }
      } else {
        print('❌ HTTP Error: ${response.statusCode}');
        print('Response: ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Error saving FCM token: $e');
      return false;
    }
  }
}
```

### 3. Complete Implementation

```dart
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class PushNotificationManager {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static const String apiBaseUrl = 'https://your-production-api.com/api';
  
  // Initialize push notifications
  static Future<void> initialize(String userPhoneNumber) async {
    try {
      // Request permission
      await requestPermission();
      
      // Get FCM token
      String? token = await getFCMToken();
      
      if (token != null) {
        // Save token to backend
        await saveTokenToBackend(token, userPhoneNumber);
      }
      
      // Listen for token refresh
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        print('🔄 FCM Token refreshed: $newToken');
        saveTokenToBackend(newToken, userPhoneNumber);
      });
      
      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('📬 Foreground message received: ${message.notification?.title}');
        // Show local notification or update UI
      });
      
      // Handle background messages (requires top-level function)
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
      
    } catch (e) {
      print('❌ Error initializing push notifications: $e');
    }
  }
  
  // Request notification permission
  static Future<void> requestPermission() async {
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    
    print('📱 Notification permission: ${settings.authorizationStatus}');
  }
  
  // Get FCM token
  static Future<String?> getFCMToken() async {
    try {
      String? token = await _firebaseMessaging.getToken();
      print('🔑 FCM Token: ${token?.substring(0, 20)}...');
      return token;
    } catch (e) {
      print('❌ Error getting FCM token: $e');
      return null;
    }
  }
  
  // Save token to backend
  static Future<bool> saveTokenToBackend(String token, String phoneNumber) async {
    try {
      final url = Uri.parse('$apiBaseUrl/users/save-fcm-token-mobile');
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'token': token,
          'phone': phoneNumber,
          'platform': 'mobile',
        }),
      );
      
      final responseData = json.decode(response.body);
      
      if (response.statusCode == 200 && responseData['success'] == true) {
        print('✅ FCM token saved successfully');
        return true;
      } else {
        print('❌ Failed to save token: ${responseData['message']}');
        return false;
      }
    } catch (e) {
      print('❌ Error saving FCM token: $e');
      return false;
    }
  }
}

// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📬 Background message received: ${message.notification?.title}');
  // Handle background notification
}
```

### 4. Usage in App

```dart
// In your main.dart or login screen
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // After user login, initialize push notifications
  String userPhone = '+917610416911'; // Get from user login
  await PushNotificationManager.initialize(userPhone);
  
  runApp(MyApp());
}
```

---

## Important Notes

### Token Management
- **Maximum 10 tokens per user**: System automatically keeps only the 10 most recent tokens
- **Duplicate prevention**: Same token won't be stored twice
- **Token refresh**: When FCM token refreshes, call this API again with new token
- **Token cleanup**: Invalid/expired tokens are automatically removed

### Phone Number Format
- Always include country code: `+91XXXXXXXXXX`
- System auto-formats 10-digit numbers to include `+91`
- Phone number must match registered user's phone

### Error Handling
- Always check `success` field in response
- Handle network errors gracefully
- Retry on failure (with exponential backoff)
- Log errors for debugging

### Testing
1. Get FCM token from Flutter app
2. Call API with token and phone number
3. Check response for success
4. Verify token is saved in database
5. Send test notification from backend

---

## API Testing with cURL

```bash
# Save FCM token
curl -X POST https://your-production-api.com/api/users/save-fcm-token-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "token": "dMd4D-6BCcuT20Gl9MTVpa:APA91bEKR6_wePUicqKNhuMmL4Q5waaL8RHWc2yJIttYPZsE1ix-1Nwy-OFJzF_dW753fyxNgtrhCS90ht2Z8Hkt5VxfDIn23efL3d-I12JIonFF1UQuVpQ",
    "phone": "+917610416911",
    "platform": "mobile"
  }'
```

---

## Response Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Token saved successfully |
| 400 | Bad Request - Missing or invalid parameters |
| 404 | Not Found - User not found with provided phone number |
| 500 | Internal Server Error - Server error occurred |

---

## Database Storage

Token is stored in user document:
```json
{
  "fcmTokenMobile": [
    "dMd4D-6BCcuT20Gl9MTVpa:APA91bEKR6_wePUicqKNhuMmL4Q5waaL8RHWc2yJIttYPZsE1ix-1Nwy-OFJzF_dW753fyxNgtrhCS90ht2Z8Hkt5VxfDIn23efL3d-I12JIonFF1UQuVpQ"
  ]
}
```

---

## Support

For issues or questions:
- Check backend logs for errors
- Verify phone number format
- Ensure user exists in database
- Test with Postman/cURL first

---

**Last Updated:** 2025-01-18  
**API Version:** 1.0

