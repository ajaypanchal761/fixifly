# First-Time User Free Service Feature

## Overview

This feature provides **FREE service booking** for users who are booking a product/service for the first time on the Fixifly platform. When a user books a service for the first time, the entire service cost is waived, making it completely free.

## How It Works

### 1. First-Time User Detection

The system checks if a user is booking for the first time by:

1. **User Model Check**: Verifying if the user exists in the User collection
2. **Booking History Check**: Checking if the user has any previous bookings in the Booking collection
3. **Combined Logic**: A user is considered "first-time" if:
   - They don't exist in the User model, OR
   - They exist but have zero previous bookings

### 2. Pricing Adjustment

When a first-time user is detected:

- **Original Price**: Stored in `originalSubtotal`, `originalServiceFee`, `originalTotalAmount`
- **Final Price**: Set to `0` for all pricing fields
- **Discount Applied**: Marked as "First-time user - Service is free"
- **Flag**: `isFirstTimeUser` set to `true`

### 3. User Status Update

After the first booking is created:

- User's `stats.isFirstTimeUser` is set to `false`
- User's `stats.firstBookingDate` is recorded
- Future bookings will be charged at regular rates

## Database Schema Changes

### Booking Model (`models/Booking.js`)

Added new fields to the `pricing` object:

```javascript
pricing: {
  // ... existing fields ...
  
  // First-time user discount fields
  originalSubtotal: {
    type: Number,
    default: null
  },
  originalServiceFee: {
    type: Number,
    default: null
  },
  originalTotalAmount: {
    type: Number,
    default: null
  },
  isFirstTimeUser: {
    type: Boolean,
    default: false
  },
  discountApplied: {
    type: String,
    default: null
  }
}
```

### User Model (`models/User.js`)

Added new fields to the `stats` object:

```javascript
stats: {
  // ... existing fields ...
  
  isFirstTimeUser: {
    type: Boolean,
    default: true
  },
  firstBookingDate: {
    type: Date,
    default: null
  }
}
```

## API Endpoints

### 1. Create Booking (Regular)
**POST** `/api/bookings`

- Automatically detects first-time users
- Applies free pricing for first-time users
- Updates user status after booking creation

### 2. Create Booking with Payment
**POST** `/api/bookings/with-payment`

- Same first-time user logic as regular booking
- Handles payment verification for non-first-time users
- First-time users get free service regardless of payment method

## Example Usage

### First-Time User Booking Request

```json
{
  "customer": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+919876543210",
    "address": {
      "street": "123 Test Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  },
  "services": [
    {
      "serviceId": "SERVICE_001",
      "serviceName": "Windows Laptop Service",
      "price": 400
    }
  ],
  "pricing": {
    "subtotal": 400,
    "serviceFee": 100,
    "totalAmount": 500
  },
  "scheduling": {
    "preferredDate": "2024-01-15",
    "preferredTimeSlot": "morning"
  }
}
```

### First-Time User Booking Response

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "pricing": {
        "subtotal": 0,
        "serviceFee": 0,
        "totalAmount": 0,
        "originalSubtotal": 400,
        "originalServiceFee": 100,
        "originalTotalAmount": 500,
        "isFirstTimeUser": true,
        "discountApplied": "First-time user - Service is free"
      }
    }
  }
}
```

## Testing

### Test Scripts

1. **`test-first-time-user.js`**: Standalone test script
2. **`test-first-time-api.js`**: API server for testing endpoints

### Test Endpoints

1. **POST** `/api/test/first-time-user`: Check if user is first-time
2. **POST** `/api/test/booking-simulation`: Simulate booking with pricing

### Running Tests

```bash
# Test script
node backend/test-first-time-user.js

# Test API server
node backend/test-first-time-api.js
```

## Business Logic

### Eligibility Criteria

- ✅ **New users** (not in User model)
- ✅ **Existing users** with zero previous bookings
- ❌ **Returning users** with previous bookings

### Pricing Logic

- **First-time users**: ₹0 (FREE)
- **Returning users**: Regular pricing
- **Original prices**: Always stored for reference
- **Discount tracking**: Recorded for analytics

### User Journey

1. **First Booking**: User gets FREE service
2. **Status Update**: User marked as non-first-time
3. **Future Bookings**: Regular pricing applies
4. **Analytics**: First booking date tracked

## Implementation Details

### Key Functions

1. **`isFirstTimeUser(email, phone)`**: Checks if user is first-time
2. **Pricing adjustment logic**: Applied in both booking endpoints
3. **User status update**: Automatic after first booking

### Error Handling

- User update failures don't affect booking creation
- Graceful fallback to regular pricing if detection fails
- Comprehensive logging for debugging

### Performance Considerations

- Efficient database queries using indexes
- Minimal additional database calls
- Cached user status for subsequent requests

## Monitoring & Analytics

### Metrics to Track

- Number of first-time users
- Conversion rate from first-time to returning users
- Revenue impact of free first bookings
- User acquisition cost effectiveness

### Logging

- First-time user detection results
- Pricing adjustments applied
- User status updates
- Booking creation with discount details

## Future Enhancements

### Potential Improvements

1. **Time-based discounts**: First booking within X days of registration
2. **Referral bonuses**: Additional discounts for referred users
3. **Service-specific discounts**: Different free services for first-time users
4. **Geographic discounts**: Location-based first-time user benefits
5. **Seasonal promotions**: Special first-time user offers during holidays

### Configuration Options

- Make first-time user feature configurable
- Allow different discount percentages
- Enable/disable feature per service type
- Set maximum discount amounts

## Security Considerations

- Validate user identity to prevent abuse
- Rate limiting on booking creation
- Audit trail for all pricing adjustments
- Fraud detection for suspicious patterns

## Conclusion

The first-time user free service feature provides an excellent user acquisition strategy by offering completely free service to new users. This encourages trial usage and helps build customer loyalty while maintaining clear business logic and comprehensive tracking.
