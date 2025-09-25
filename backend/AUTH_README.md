# Authentication System Documentation

## Overview
Complete authentication system for Fixifly with phone-based OTP verification, JWT tokens, and comprehensive user management.

## 🚀 Features

### ✅ Implemented Features
- **Phone-based Authentication**: OTP verification for login/signup
- **JWT Token Management**: Secure session handling
- **User Registration**: Complete user profile creation
- **Profile Management**: Update user information
- **Role-based Access**: User, Vendor, Admin roles
- **Security Middleware**: Protected routes and authorization
- **Comprehensive Validation**: Input validation and error handling
- **Statistics Tracking**: User activity and booking stats

## 📁 Files Created

### Controllers
- `backend/controllers/authController.js` - Main authentication controller
- `backend/controllers/test-auth.js` - Test file for authentication

### Middleware
- `backend/middleware/auth.js` - Authentication and authorization middleware

### Routes
- `backend/routes/auth.js` - Authentication routes

## 🔗 API Endpoints

### Public Routes

#### 1. Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to +91 9876543210",
  "data": {
    "phone": "+91 9876543210",
    "otp": "123456" // Only in development
  }
}
```

#### 2. Verify OTP (Login/Signup)
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456",
  "name": "John Doe",        // Optional for signup
  "email": "john@example.com" // Optional for signup
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+91 9876543210",
      "role": "user",
      "isPhoneVerified": true,
      "isEmailVerified": false,
      "address": { /* address object */ },
      "preferences": { /* preferences object */ },
      "stats": { /* stats object */ }
    },
    "token": "jwt_token_here"
  }
}
```

#### 3. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "landmark": "Near Central Mall"
  }
}
```

#### 4. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}
```

### Protected Routes (Require JWT Token)

#### 5. Get Current User
```http
GET /api/auth/me
Authorization: Bearer jwt_token_here
```

#### 6. Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "address": {
    "city": "New City"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    },
    "language": "en"
  }
}
```

#### 7. Logout
```http
POST /api/auth/logout
Authorization: Bearer jwt_token_here
```

## 🔐 Authentication Flow

### 1. User Registration/Login Flow
```
1. User enters phone number
2. POST /api/auth/send-otp
3. OTP sent to phone (via SMS service)
4. User enters OTP
5. POST /api/auth/verify-otp
6. JWT token generated and returned
7. User authenticated
```

### 2. Frontend Integration
```javascript
// Send OTP
const sendOTP = async (phone) => {
  const response = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return response.json();
};

// Verify OTP and Login
const verifyOTP = async (phone, otp, userData = {}) => {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, ...userData })
  });
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('userToken', data.data.token);
    localStorage.setItem('userData', JSON.stringify(data.data.user));
  }
  
  return data;
};

// Get current user
const getCurrentUser = async () => {
  const token = localStorage.getItem('userToken');
  const response = await fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## 🛡️ Security Features

### JWT Token Security
- **Secret Key**: Configurable via `JWT_SECRET` environment variable
- **Expiration**: 30 days default
- **Token Format**: `Bearer <token>` in Authorization header

### Input Validation
- **Phone Numbers**: Indian format validation (10 digits)
- **Email**: RFC compliant email validation
- **OTP**: 6-digit numeric validation
- **Pincode**: 6-digit Indian pincode validation

### User Security
- **Account Status**: Active/Blocked status checking
- **Phone Verification**: Required for authentication
- **Email Verification**: Optional, can be implemented later
- **Role-based Access**: Different access levels

## 🔧 Middleware Usage

### Protect Routes
```javascript
const { protect } = require('../middleware/auth');

// Protect a route
router.get('/protected-route', protect, (req, res) => {
  // req.user contains user information
  res.json({ user: req.user });
});
```

### Role-based Authorization
```javascript
const { protect, authorize } = require('../middleware/auth');

// Admin only route
router.get('/admin-route', protect, authorize('admin'), (req, res) => {
  res.json({ message: 'Admin access granted' });
});

// Vendor or Admin route
router.get('/vendor-route', protect, authorize('vendor', 'admin'), (req, res) => {
  res.json({ message: 'Vendor/Admin access granted' });
});
```

### Optional Authentication
```javascript
const { optionalAuth } = require('../middleware/auth');

// Route that works with or without authentication
router.get('/public-route', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ message: 'Authenticated user', user: req.user });
  } else {
    res.json({ message: 'Anonymous user' });
  }
});
```

## 📊 User Data Structure

### Complete User Object
```javascript
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "role": "user", // user, vendor, admin
  "isPhoneVerified": true,
  "isEmailVerified": false,
  "profileImage": "image_url",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "landmark": "Near Central Mall"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "sms": true,
      "push": true
    },
    "language": "en"
  },
  "stats": {
    "totalBookings": 5,
    "completedBookings": 4,
    "cancelledBookings": 1,
    "totalSpent": 2500,
    "lastLoginAt": "2024-01-15T10:30:00Z"
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## 🧪 Testing

### Run Tests
```javascript
const { testAuthControllers } = require('./test-auth');
await testAuthControllers();
```

### Test Data
```javascript
const { testAuthData } = require('./test-auth');
console.log(testAuthData.registration);
console.log(testAuthData.login);
console.log(testAuthData.profileUpdate);
```

## 🔧 Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-here
MONGODB_URI=mongodb://localhost:27017/fixifly
NODE_ENV=development
```

## 🚀 Integration with Frontend

### AuthContext Integration
The authentication system is designed to work seamlessly with your existing frontend AuthContext:

```javascript
// In your frontend AuthContext
const login = async (phone, otp, userData = {}) => {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, ...userData })
  });
  
  const data = await response.json();
  if (data.success) {
    // Update your AuthContext state
    setUser(data.data.user);
    localStorage.setItem('userToken', data.data.token);
  }
  return data;
};
```

### Route Protection
```javascript
// In your frontend protected routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('userToken');
  
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" />;
  }
  
  return children;
};
```

## 📝 Error Handling

### Common Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"] // For validation errors
}
```

### Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid token, user not found)
- `403` - Forbidden (account blocked, insufficient permissions)
- `404` - Not Found (user not found)
- `500` - Internal Server Error

## 🔄 Next Steps

1. **SMS Integration**: Integrate with SMS service (Twilio, AWS SNS)
2. **Email Verification**: Add email verification flow
3. **Password Reset**: Implement password reset functionality
4. **Social Login**: Add Google/Facebook login options
5. **Rate Limiting**: Add rate limiting for OTP requests
6. **Audit Logs**: Add user activity logging

## 📞 Support

For any issues or questions about the authentication system, refer to the test files and API documentation provided.
