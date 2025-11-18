# Flutter FCM Token API - Quick Reference

## API Endpoint
```
POST /api/users/save-fcm-token-mobile
```

## Base URLs
- **Development:** `http://localhost:5000/api`
- **Production:** `https://your-production-api.com/api` (Update with actual URL)

---

## Request Body
```json
{
  "token": "YOUR_FCM_TOKEN_HERE",
  "phone": "+917610416911",
  "platform": "mobile"
}
```

## Required Fields
- `token` (string): FCM token from Firebase Messaging
- `phone` (string): User's phone number with country code (e.g., +917610416911)

## Optional Fields
- `platform` (string): Default is "mobile"

---

## Success Response (200)
```json
{
  "success": true,
  "message": "FCM mobile token saved successfully",
  "data": {
    "tokenCount": 1
  }
}
```

## Error Responses

### 400 - Missing Token
```json
{
  "success": false,
  "message": "FCM token is required"
}
```

### 400 - Missing Phone
```json
{
  "success": false,
  "message": "Phone number is required"
}
```

### 404 - User Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Flutter Code Example

```dart
// Save FCM token
Future<bool> saveFCMToken(String token, String phone) async {
  final response = await http.post(
    Uri.parse('https://your-api.com/api/users/save-fcm-token-mobile'),
    headers: {'Content-Type': 'application/json'},
    body: json.encode({
      'token': token,
      'phone': phone,
      'platform': 'mobile',
    }),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return data['success'] == true;
  }
  return false;
}
```

---

## Phone Number Format
- ✅ Correct: `+917610416911`
- ✅ Also works: `7610416911` (auto-formatted to +917610416911)
- ❌ Wrong: `917610416911` (without +)

---

## Notes
- Maximum 10 tokens per user (old tokens auto-removed)
- Duplicate tokens are automatically removed
- Call this API when:
  - User logs in
  - FCM token refreshes
  - App starts (if user is logged in)

