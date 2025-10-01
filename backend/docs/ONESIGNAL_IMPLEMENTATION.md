# OneSignal Push Notification Implementation

This document describes the OneSignal push notification implementation for the Fixifly vendor system.

## Overview

OneSignal has been integrated to send push notifications to vendors when:
- Admin assigns a vendor to a booking request
- Admin assigns a vendor to a support ticket
- Admin assigns a vendor to a warranty claim
- Vendor wallet transactions (deposits, earnings, withdrawals)
- Vendor account status changes (approval, rejection, blocking)

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# OneSignal Configuration
ONESIGNAL_APP_ID=fee060ab-695d-45ca-8e35-8fa71ae5b6e0
ONESIGNAL_API_KEY=os_v2_app_73qgbk3jlvc4vdrvr6trvznw4buukfady27utmekcy6zqprcvost75euwqmlfnupyl7jnht5pyr3ipc2pxmqed6nnt4w6cm26xv4f7q
```

### Frontend Integration

The OneSignal SDK is loaded in `frontend/index.html`:

```html
<!-- OneSignal -->
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "fee060ab-695d-45ca-8e35-8fa71ae5b6e0",
    });
  });
</script>
```

## Backend Implementation

### OneSignal Service (`backend/services/oneSignalService.js`)

The service provides methods for:

- `sendNotificationToUsers()` - Send to specific users by external user ID
- `sendNotificationToAll()` - Send to all subscribed users
- `sendVendorAssignmentNotification()` - Send vendor assignment notifications
- `sendVendorWalletNotification()` - Send wallet transaction notifications
- `sendVendorStatusNotification()` - Send account status notifications
- `testConfiguration()` - Test OneSignal configuration

### Integration Points

#### 1. Vendor Assignment Notifications

**Booking Assignment** (`backend/controllers/adminBookingController.js`):
```javascript
// Send OneSignal notification to vendor
try {
  const oneSignalService = require('../services/oneSignalService');
  const vendor = await Vendor.findOne({ vendorId: booking.vendor.vendorId });
  
  if (vendor) {
    await oneSignalService.sendVendorAssignmentNotification(vendor._id.toString(), {
      type: 'booking',
      id: booking._id.toString(),
      title: booking.serviceDetails?.serviceName || 'Service Request',
      description: booking.serviceDetails?.description || 'New service request assigned',
      priority: priority || 'medium',
      customerName: booking.customerDetails?.name || 'Customer',
      customerPhone: booking.customerDetails?.phone || '',
      scheduledDate: scheduledDate,
      scheduledTime: scheduledTime
    });
  }
} catch (notificationError) {
  // Don't fail the assignment if notification fails
}
```

**Support Ticket Assignment** (`backend/controllers/supportTicketController.js`):
```javascript
// Send OneSignal notification to vendor
try {
  const oneSignalService = require('../services/oneSignalService');
  const Vendor = require('../models/Vendor');
  const vendor = await Vendor.findById(vendorId);
  
  if (vendor) {
    await oneSignalService.sendVendorAssignmentNotification(vendor._id.toString(), {
      type: 'support_ticket',
      id: ticket._id.toString(),
      title: ticket.subject,
      description: ticket.description,
      priority: ticket.priority || 'medium',
      customerName: ticket.userName,
      customerPhone: ticket.userPhone,
      scheduledDate: ticket.scheduledDate,
      scheduledTime: ticket.scheduledTime
    });
  }
} catch (notificationError) {
  // Don't fail the assignment if notification fails
}
```

**Warranty Claim Assignment** (`backend/controllers/adminWarrantyClaimController.js`):
```javascript
// Send OneSignal notification to vendor
try {
  const oneSignalService = require('../services/oneSignalService');
  const vendor = await Vendor.findById(vendorId);
  
  if (vendor) {
    await oneSignalService.sendVendorAssignmentNotification(vendor._id.toString(), {
      type: 'warranty_claim',
      id: claim._id.toString(),
      title: `Warranty Claim - ${claim.item}`,
      description: claim.issueDescription,
      priority: 'high',
      customerName: claim.userId?.name || 'Customer',
      customerPhone: claim.userId?.phone || claim.userId?.mobile || '',
      scheduledDate: null,
      scheduledTime: null
    });
  }
} catch (notificationError) {
  // Don't fail the assignment if notification fails
}
```

#### 2. Wallet Transaction Notifications

**Deposit Notification** (`backend/controllers/vendorController.js`):
```javascript
// Send OneSignal notification
try {
  const oneSignalService = require('../services/oneSignalService');
  await oneSignalService.sendVendorWalletNotification(vendor._id.toString(), {
    type: 'deposit',
    amount: pendingTransaction.amount,
    description: 'Wallet deposit via Razorpay',
    transactionId: transactionId,
    newBalance: vendor.wallet.currentBalance
  });
} catch (notificationError) {
  // Don't fail the transaction if notification fails
}
```

## Frontend Implementation

### OneSignal Service (`frontend/src/services/oneSignalService.ts`)

The frontend service handles:

- `initialize()` - Initialize OneSignal SDK
- `setVendorExternalId()` - Set vendor ID as external user ID
- `clearExternalId()` - Clear external user ID on logout
- `requestPermission()` - Request notification permission
- `isNotificationEnabled()` - Check if notifications are enabled
- `setupEventListeners()` - Set up notification event listeners

### Integration Points

#### 1. Vendor Login (`frontend/src/vendor/pages/VendorLogin.tsx`)

```typescript
// Set OneSignal external user ID for notifications
try {
  await oneSignalService.setVendorExternalId(vendor._id);
  console.log('OneSignal external user ID set for vendor:', vendor._id);
} catch (error) {
  console.error('Error setting OneSignal external user ID:', error);
  // Don't fail login if OneSignal fails
}
```

#### 2. Vendor Logout (`frontend/src/contexts/VendorContext.tsx`)

```typescript
const logout = async () => {
  // Clear OneSignal external user ID
  try {
    await oneSignalService.clearExternalId();
    console.log('OneSignal external user ID cleared on logout');
  } catch (error) {
    console.error('Error clearing OneSignal external user ID:', error);
    // Don't fail logout if OneSignal fails
  }

  localStorage.removeItem('vendorToken');
  localStorage.removeItem('vendorData');
  setVendor(null);
};
```

## Testing

### Test Script

Run the test script to verify OneSignal integration:

```bash
cd backend
node test-onesignal.js
```

### Admin API Endpoints

Test OneSignal functionality through admin API endpoints:

- `GET /api/admin/onesignal/status` - Get OneSignal service status
- `GET /api/admin/onesignal/test-config` - Test OneSignal configuration
- `POST /api/admin/onesignal/test-all` - Send test notification to all users
- `POST /api/admin/onesignal/test-vendor` - Send test notification to specific vendor
- `POST /api/admin/onesignal/test-wallet` - Send test wallet notification
- `POST /api/admin/onesignal/test-status` - Send test status notification

### Example API Calls

**Test Configuration:**
```bash
curl -X GET "http://localhost:5000/api/admin/onesignal/test-config" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Send Test Notification to All Users:**
```bash
curl -X POST "http://localhost:5000/api/admin/onesignal/test-all" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heading": "Test Notification",
    "message": "This is a test notification from admin panel"
  }'
```

**Send Test Notification to Specific Vendor:**
```bash
curl -X POST "http://localhost:5000/api/admin/onesignal/test-vendor" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "VENDOR_ID_HERE",
    "type": "booking",
    "message": "Test assignment notification"
  }'
```

## Notification Types

### 1. Vendor Assignment Notifications

**Booking Assignment:**
- Heading: "🔧 New Service Request Assigned"
- Message: "You have been assigned a new service request: [Service Name]"
- Data: Assignment details, customer info, scheduling info
- URL: `/vendor/bookings/[bookingId]`

**Support Ticket Assignment:**
- Heading: "🎫 New Support Ticket Assigned"
- Message: "A new support ticket has been assigned to you: [Subject]"
- Data: Ticket details, customer info, priority
- URL: `/vendor/support-tickets/[ticketId]`

**Warranty Claim Assignment:**
- Heading: "🛡️ New Warranty Claim Assigned"
- Message: "A new warranty claim has been assigned to you: [Item]"
- Data: Claim details, customer info
- URL: `/vendor/warranty-claims/[claimId]`

### 2. Wallet Transaction Notifications

**Deposit:**
- Heading: "💰 Wallet Credited"
- Message: "Your wallet has been credited with ₹[amount]. New balance: ₹[balance]"
- Data: Transaction details, new balance
- URL: `/vendor/wallet`

**Earning:**
- Heading: "💰 Wallet Credited"
- Message: "Your wallet has been credited with ₹[amount]. New balance: ₹[balance]"
- Data: Transaction details, new balance
- URL: `/vendor/wallet`

**Withdrawal:**
- Heading: "💸 Wallet Debited"
- Message: "Your wallet has been debited with ₹[amount]. New balance: ₹[balance]"
- Data: Transaction details, new balance
- URL: `/vendor/wallet`

### 3. Account Status Notifications

**Approval:**
- Heading: "🎉 Account Approved"
- Message: "Congratulations! Your vendor account has been approved. You can now start accepting service requests."
- Data: Status details
- URL: `/vendor/dashboard`

**Rejection:**
- Heading: "❌ Account Rejected"
- Message: "Your vendor account application was rejected. Reason: [reason]"
- Data: Status details, reason
- URL: `/vendor/dashboard`

**Blocking:**
- Heading: "🚫 Account Blocked"
- Message: "Your vendor account has been blocked. Reason: [reason]"
- Data: Status details, reason
- URL: `/vendor/dashboard`

## Error Handling

- All OneSignal operations are wrapped in try-catch blocks
- Notification failures don't affect the main business logic
- Errors are logged for debugging purposes
- Graceful degradation when OneSignal is not configured

## Security Considerations

- OneSignal API key is stored in environment variables
- External user IDs are set to vendor MongoDB ObjectIds
- No sensitive data is sent in notification payloads
- Admin endpoints require authentication

## Monitoring and Logging

- All OneSignal operations are logged with appropriate levels
- Success and failure rates can be monitored
- Error details are captured for debugging
- Performance metrics can be tracked

## Troubleshooting

### Common Issues

1. **"All included players are not subscribed"**
   - This is normal for test vendor IDs that don't exist
   - Real vendors need to have subscribed to notifications

2. **OneSignal not initialized**
   - Check if the SDK is loaded in the HTML
   - Verify the app ID is correct
   - Check browser console for errors

3. **External user ID not set**
   - Ensure vendor is logged in
   - Check if OneSignal service is initialized
   - Verify vendor ID is valid

### Debug Steps

1. Check OneSignal configuration:
   ```bash
   curl -X GET "http://localhost:5000/api/admin/onesignal/status" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

2. Test OneSignal service:
   ```bash
   cd backend
   node test-onesignal.js
   ```

3. Check browser console for OneSignal errors
4. Verify environment variables are set correctly
5. Check OneSignal dashboard for delivery status

## Future Enhancements

- Add notification preferences for vendors
- Implement notification history
- Add rich media notifications
- Implement notification scheduling
- Add notification analytics
- Support for multiple notification channels
