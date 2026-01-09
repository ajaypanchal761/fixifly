# User Model Documentationss

## Overview
The User model is designed to handle all user-related data for the Fixifly application, including authentication, profile information, and user preferences.

## Schema Fields

### Basic Information
- **name** (String, Required): User's full name (2-50 characters)
- **email** (String, Required, Unique): User's email address with validation
- **phone** (String, Required, Unique): User's phone number with Indian format validation
- **role** (String, Enum): User role - 'user', 'vendor', or 'admin' (default: 'user')

### Authentication & Verification
- **isPhoneVerified** (Boolean): Phone number verification status (default: false)
- **isEmailVerified** (Boolean): Email verification status (default: false)
- **otp** (Object): OTP code and expiration for verification
  - **code** (String): 6-digit OTP code
  - **expiresAt** (Date): OTP expiration timestamp

### Profile Information
- **profileImage** (String): URL or path to user's profile image
- **address** (Object): Complete address information
  - **street** (String): Street address
  - **city** (String): City name
  - **state** (String): State name
  - **pincode** (String): 6-digit Indian pincode
  - **landmark** (String): Nearby landmark

### Account Status
- **isActive** (Boolean): Account active status (default: true)
- **isBlocked** (Boolean): Account blocked status (default: false)

### User Preferences
- **preferences** (Object): User preferences and settings
  - **notifications** (Object): Notification preferences
    - **email** (Boolean): Email notifications (default: true)
    - **sms** (Boolean): SMS notifications (default: true)
    - **push** (Boolean): Push notifications (default: true)
  - **language** (String): Preferred language (default: 'en')

### Statistics
- **stats** (Object): User activity statistics
  - **totalBookings** (Number): Total number of bookings
  - **completedBookings** (Number): Number of completed bookings
  - **cancelledBookings** (Number): Number of cancelled bookings
  - **totalSpent** (Number): Total amount spent
  - **lastLoginAt** (Date): Last login timestamp

### Timestamps
- **createdAt** (Date): Account creation timestamp (auto-generated)
- **updatedAt** (Date): Last update timestamp (auto-generated)

## Virtual Fields

### fullAddress
Returns a formatted full address string combining street, city, state, and pincode.

```javascript
const user = await User.findById(userId);
console.log(user.fullAddress); // "123 Main Street, Mumbai, Maharashtra, 400001"
```

### formattedPhone
Returns a formatted phone number with +91 prefix.

```javascript
const user = await User.findById(userId);
console.log(user.formattedPhone); // "+91 9876543210"
```

## Methods

### Instance Methods

#### generateOTP()
Generates a 6-digit OTP and sets expiration time (10 minutes).

```javascript
const user = await User.findById(userId);
const otp = user.generateOTP();
await user.save();
```

#### verifyOTP(otpCode)
Verifies the provided OTP code against the stored OTP.

```javascript
const user = await User.findById(userId);
const isValid = user.verifyOTP('123456');
```

#### clearOTP()
Clears the stored OTP code and expiration.

```javascript
const user = await User.findById(userId);
user.clearOTP();
await user.save();
```

#### updateLastLogin()
Updates the last login timestamp.

```javascript
const user = await User.findById(userId);
await user.updateLastLogin();
```

#### incrementBookingStats(status, amount)
Increments booking statistics based on booking status.

```javascript
const user = await User.findById(userId);
await user.incrementBookingStats('completed', 500);
```

### Static Methods

#### findByPhoneOrEmail(identifier)
Finds a user by phone number or email address.

```javascript
const user = await User.findByPhoneOrEmail('john@example.com');
const user2 = await User.findByPhoneOrEmail('9876543210');
```

#### getUserStats()
Returns aggregated user statistics.

```javascript
const stats = await User.getUserStats();
```

## Validation Rules

### Email Validation
- Must be a valid email format
- Automatically converted to lowercase
- Must be unique across all users

### Phone Validation
- Must be a valid 10-digit Indian phone number
- Automatically formatted with +91 prefix
- Must be unique across all users

### Name Validation
- Minimum 2 characters, maximum 50 characters
- Automatically trimmed of whitespace

### Pincode Validation
- Must be a valid 6-digit Indian pincode
- First digit cannot be 0

## Indexes
The following indexes are created for optimal performance:
- email (unique)
- phone (unique)
- role
- isActive
- createdAt (descending)

## Usage Examples

### Creating a New User
```javascript
const user = new User({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '9876543210',
  address: {
    street: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    landmark: 'Near Central Mall'
  }
});

await user.save();
```

### User Login Flow
```javascript
// 1. Find user by phone/email
const user = await User.findByPhoneOrEmail(identifier);

// 2. Generate OTP
const otp = user.generateOTP();
await user.save();

// 3. Send OTP via SMS/Email
// ... SMS/Email sending logic ...

// 4. Verify OTP
const isValid = user.verifyOTP(providedOTP);
if (isValid) {
  user.clearOTP();
  await user.updateLastLogin();
  await user.save();
  // Generate JWT token and return user data
}
```

### Updating User Profile
```javascript
const user = await User.findById(userId);
user.name = 'Updated Name';
user.address.city = 'New City';
await user.save();
```

## Frontend Integration

This model is designed to work seamlessly with the frontend components:

- **AuthContext**: Uses `id`, `name`, `email`, `phone`, `role` fields
- **Login/Signup**: Handles phone-based authentication with OTP
- **Profile**: Manages all address and personal information fields
- **User Management**: Supports role-based access control

## Security Considerations

1. **Phone Number Formatting**: Automatically formats phone numbers to prevent duplicates
2. **Email Normalization**: Converts emails to lowercase for consistency
3. **OTP Expiration**: OTPs expire after 10 minutes for security
4. **Input Validation**: Comprehensive validation prevents invalid data
5. **Unique Constraints**: Email and phone must be unique across the system

## Testing

Use the provided test file (`test-user.js`) to verify model functionality:

```javascript
const { testUserModel } = require('./test-user');
await testUserModel();
```
