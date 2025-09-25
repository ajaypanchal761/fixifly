# AMC (Annual Maintenance Contract) System Documentation

## Overview
The AMC system provides comprehensive Annual Maintenance Contract management for both users and administrators. It includes plan management, subscription tracking, service history, and usage monitoring.

## System Architecture

### Database Models

#### 1. AMCPlan Model (`backend/models/AMCPlan.js`)
Manages AMC plan definitions with comprehensive features and benefits.

**Key Fields:**
- `name`: Plan name (TRY PLAN, CARE PLAN, RELAX PLAN)
- `price`: Plan price in INR
- `period`: Billing period (yearly/monthly)
- `features`: Array of plan features
- `benefits`: Detailed benefits object
- `status`: Plan status (active/inactive/draft)
- `isPopular`: Popular plan flag
- `isRecommended`: Recommended plan flag

**Benefits Structure:**
```javascript
benefits: {
  callSupport: 'unlimited' | 'limited',
  remoteSupport: 'unlimited' | 'limited',
  homeVisits: { count: Number, description: String },
  antivirus: { included: Boolean, name: String, duration: String },
  softwareInstallation: { included: Boolean, description: String },
  sparePartsDiscount: { percentage: Number, description: String },
  freeSpareParts: { amount: Number, description: String },
  laborCost: { included: Boolean, description: String }
}
```

#### 2. AMCSubscription Model (`backend/models/AMCSubscription.js`)
Tracks user subscriptions and service usage.

**Key Fields:**
- `subscriptionId`: Unique subscription identifier
- `userId`: Reference to User model
- `planId`: Reference to AMCPlan model
- `devices`: Array of registered devices
- `usage`: Usage tracking object
- `serviceHistory`: Array of service requests
- `status`: Subscription status
- `paymentStatus`: Payment status

**Usage Tracking:**
```javascript
usage: {
  callSupport: { used: Number, limit: String },
  remoteSupport: { used: Number, limit: String },
  homeVisits: { used: Number, limit: Number, remaining: Number },
  antivirus: { activated: Boolean, activationDate: Date, expiryDate: Date },
  sparePartsDiscount: { used: Number, limit: Number },
  freeSpareParts: { used: Number, limit: Number, remaining: Number }
}
```

## API Endpoints

### User AMC Endpoints

#### AMC Plans
- `GET /api/amc/plans` - Get all active AMC plans
- `GET /api/amc/plans/:id` - Get specific AMC plan details

#### AMC Subscriptions
- `GET /api/amc/subscriptions` - Get user's AMC subscriptions
- `GET /api/amc/subscriptions/:id` - Get specific subscription details
- `POST /api/amc/subscriptions` - Create new AMC subscription
- `PUT /api/amc/subscriptions/:id` - Update subscription (auto-renewal, devices)
- `POST /api/amc/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/amc/subscriptions/:id/renew` - Renew subscription

#### AMC Services
- `POST /api/amc/subscriptions/:id/services` - Request AMC service
- `GET /api/amc/subscriptions/:id/services` - Get service history

#### Usage Tracking
- `GET /api/amc/subscriptions/:id/usage` - Get usage details

### Admin AMC Endpoints

#### AMC Plans Management
- `GET /api/amc/admin/plans` - Get all AMC plans (with filters)
- `GET /api/amc/admin/plans/:id` - Get specific AMC plan
- `POST /api/amc/admin/plans` - Create new AMC plan
- `PUT /api/amc/admin/plans/:id` - Update AMC plan
- `DELETE /api/amc/admin/plans/:id` - Delete AMC plan
- `POST /api/amc/admin/seed-plans` - Seed default AMC plans

#### AMC Subscriptions Management
- `GET /api/amc/admin/subscriptions` - Get all AMC subscriptions
- `GET /api/amc/admin/subscriptions/:id` - Get specific subscription
- `PUT /api/amc/admin/subscriptions/:id/status` - Update subscription status
- `POST /api/amc/admin/subscriptions/:id/services` - Add service to subscription

#### AMC Statistics
- `GET /api/amc/admin/stats` - Get AMC statistics and analytics

## Default AMC Plans

### 1. TRY PLAN - ₹17/yearly
**Benefits:**
- Unlimited Call Support
- 3 Remote Support Sessions
- 1 Free Home Visit & Diagnosis
- Free Hidden Tips & Tricks

### 2. CARE PLAN - ₹59/yearly (Popular)
**Benefits:**
- Unlimited Call Support
- Unlimited Remote Support
- Free Antivirus Pro For 1 Year
- 6 Free Home Visits
- Free Software Installation & Driver Updates
- Up to 40% Off on All Spare Parts

### 3. RELAX PLAN - ₹199/yearly (Recommended)
**Benefits:**
- Unlimited Call Support
- Unlimited Remote Support
- Free Quick Heal Pro Antivirus For 1 Year
- Free Windows MS Office Installation with Software Support
- 12 Free Home Visits
- No Labor Cost for 1 Year
- Free Spare Parts up to ₹2000
- Up to 60% Off on Premium Spare Parts

## Frontend Integration

### API Service (`frontend/src/services/amcApiService.js`)
Comprehensive API service with:
- User AMC operations
- Admin AMC operations
- Utility functions for data formatting
- Error handling and token management

### Key Features:
- Automatic token management
- Request/response interceptors
- Error handling with user-friendly messages
- Data formatting utilities
- Status color coding
- Usage percentage calculations

## Admin Management Interface

### Two-Toggle System:
1. **AMC Plans Toggle**: Manage AMC plan definitions
   - Create, edit, delete plans
   - Set plan features and benefits
   - Manage plan status and popularity
   - View plan statistics

2. **User Subscriptions Toggle**: Manage user subscriptions
   - View all user subscriptions
   - Update subscription status
   - Add services to subscriptions
   - Track usage and revenue

## User Interface Features

### AMC Plans Tab:
- Display all available plans
- Show plan features and benefits
- Highlight popular and recommended plans
- Subscription enrollment process

### My AMC Tab:
- View active subscriptions
- Track usage and remaining benefits
- Service request functionality
- Subscription management (renewal, cancellation)

## Service Types

1. **Call Support**: Phone-based technical support
2. **Remote Support**: Remote desktop assistance
3. **Home Visit**: On-site service visits
4. **Repair**: Device repair services
5. **Maintenance**: Preventive maintenance

## Usage Tracking

The system tracks:
- Service usage against plan limits
- Remaining benefits
- Service history
- Payment status
- Subscription lifecycle

## Security Features

- JWT-based authentication
- Role-based access control
- Admin permission system
- Input validation and sanitization
- Rate limiting and error handling

## Database Indexes

Optimized indexes for:
- Plan queries by status and popularity
- Subscription queries by user and status
- Service history queries
- Usage tracking queries

## Error Handling

Comprehensive error handling with:
- User-friendly error messages
- Proper HTTP status codes
- Logging for debugging
- Graceful degradation

## Future Enhancements

1. **Payment Integration**: Razorpay integration for subscription payments
2. **Notification System**: Email/SMS notifications for renewals and services
3. **Analytics Dashboard**: Advanced analytics and reporting
4. **Mobile App**: React Native mobile application
5. **API Documentation**: Swagger/OpenAPI documentation
6. **Testing**: Comprehensive unit and integration tests

## Getting Started

1. **Seed Default Plans**: Use the seed endpoint to create default AMC plans
2. **Configure Permissions**: Ensure admin users have `amcManagement` permission
3. **Frontend Integration**: Use the provided API service for frontend integration
4. **Testing**: Test all endpoints with proper authentication

## Support

For technical support or questions about the AMC system, please refer to the development team or create an issue in the project repository.








