# 🔧 Fixfly Notification API Implementation

## Overview

This document describes the implementation of the FCM token storage and notification sending endpoints for the Fixfly backend API.

## ✅ Implemented Endpoints

### 1. FCM Token Storage Endpoint

**Endpoint:** `POST /api/user/notifications/fcm-token`

**Request Body:**
```json
{
  "fcmToken": "your_fcm_token_here"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "FCM token updated successfully",
  "data": {
    "fcmTokenUpdated": true
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "FCM token is required"
}
```

### 2. Send Notification Endpoint

**Endpoint:** `POST /api/send-notification`

**Request Body:**
```json
{
  "userId": "user_id_here",
  "title": "Notification Title",
  "body": "Notification message body",
  "data": {
    "type": "booking",
    "priority": "high",
    "customData": "any_additional_data"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "messageId": "firebase_message_id",
  "data": {
    "userId": "user_id_here",
    "title": "Notification Title",
    "body": "Notification message body",
    "fcmTokenPresent": true
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "User FCM token not found"
}
```

## 🔧 Implementation Details

### Database Schema

The User model already includes FCM token storage:

```javascript
// User Schema (backend/models/User.js)
fcmToken: {
  type: String,
  default: null
}
```

### Firebase Configuration

Firebase Admin SDK is configured with environment variables:

```javascript
// Environment variables required:
FIREBASE_PROJECT_ID=fixfly-d8e35
FIREBASE_PRIVATE_KEY_ID=17cb7a00c8063270912497ed1fa8bc85921d5e59
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@fixfly-d8e35.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=106035619768304668471
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
```

### Authentication

Both endpoints require authentication via JWT token:

```javascript
// Required header:
Authorization: Bearer <jwt_token>
```

## 🧪 Testing

### Manual Testing with cURL

1. **Test FCM Token Storage:**
```bash
curl -X POST https://www.getfixfly.com/api/user/notifications/fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"fcmToken": "test_token_here"}'
```

2. **Test Send Notification:**
```bash
curl -X POST https://www.getfixfly.com/api/send-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "USER_ID_HERE",
    "title": "Test Notification",
    "body": "This is a test notification",
    "data": {
      "type": "test",
      "priority": "high"
    }
  }'
```

### Automated Testing

Run the test script:
```bash
node test-notification-api.js
```

## 🔄 Integration with Frontend

The frontend already has FCM token generation and storage implemented:

- **File:** `frontend/src/utils/notificationSetup.js`
- **Function:** `saveUserTokenToBackend(fcmToken)`
- **Endpoint Used:** `PUT /api/user/notifications/fcm-token` (now updated to POST)

## 📱 Push Notification Features

The implementation includes:

1. **Multi-platform Support:**
   - Android notifications with custom icon and color
   - iOS notifications with badge and sound
   - Web push notifications with actions

2. **Notification Persistence:**
   - All sent notifications are stored in the database
   - Users can retrieve notification history
   - Read/unread status tracking

3. **Error Handling:**
   - Comprehensive error logging
   - Graceful fallbacks for missing FCM tokens
   - Firebase initialization error handling

## 🚀 Deployment Notes

1. **Environment Variables:** Ensure all Firebase environment variables are set in production
2. **CORS:** The server is configured to accept requests from the frontend domains
3. **Authentication:** JWT tokens are required for all notification endpoints
4. **Database:** MongoDB connection is required for user and notification storage

## 📊 Monitoring

The implementation includes comprehensive logging:

- FCM token updates are logged with user information
- Notification sending results are logged with success/failure status
- Firebase initialization status is monitored
- Error details are captured for debugging

## 🔧 Maintenance

### Updating FCM Tokens

Users' FCM tokens should be updated when:
- App is reinstalled
- User logs in from a new device
- Token expires (Firebase handles this automatically)

### Notification Cleanup

Consider implementing:
- Automatic cleanup of old notifications
- Notification expiration based on type
- User preference management for notification types

## 🆘 Troubleshooting

### Common Issues

1. **"FCM token not found"**
   - User hasn't granted notification permissions
   - FCM token hasn't been generated yet
   - Token was cleared from database

2. **"Failed to send notification"**
   - Firebase configuration issue
   - Invalid FCM token
   - Network connectivity problem

3. **Authentication errors**
   - Invalid or expired JWT token
   - Missing Authorization header

### Debug Steps

1. Check server logs for detailed error messages
2. Verify Firebase configuration with test script
3. Test with a known valid user ID and FCM token
4. Check network connectivity to Firebase services

## 📈 Future Enhancements

Potential improvements:
1. Batch notification sending
2. Notification scheduling
3. Rich media notifications (images, videos)
4. Notification analytics and tracking
5. User notification preferences management
6. Notification templates system
