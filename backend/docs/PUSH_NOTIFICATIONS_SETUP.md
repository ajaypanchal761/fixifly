# OneSignal Push Notifications for Vendors

## Overview

This implementation adds OneSignal push notifications to notify vendors when they receive new tasks (support tickets, bookings, or warranty claims). Vendors will receive instant push notifications on their devices when:

- A new support ticket is assigned to them
- A new service booking is assigned to them  
- A new warranty claim is assigned to them
- Urgent tasks require immediate attention

## Setup Instructions

### 1. OneSignal Configuration

1. **Get OneSignal REST API Key:**
   - Go to your OneSignal dashboard
   - Navigate to Settings > Keys & IDs
   - Copy the REST API Key

2. **Add to Environment Variables:**
   ```bash
   # Add to your .env file
   ONESIGNAL_APP_ID=0e3861fd-d24e-4f93-a211-d64dfd966d17
   ONESIGNAL_API_KEY=YOUR_ONESIGNAL_REST_API_KEY_HERE
   ```

### 2. Backend Setup

The backend implementation includes:

- **OneSignal Service** (`services/oneSignalService.js`): Handles all push notification operations
- **Vendor Notification Controller** (`controllers/vendorNotificationController.js`): Creates notifications and triggers push notifications
- **Integration Points**: Support tickets, bookings, and warranty claims automatically trigger push notifications

### 3. Frontend Setup

The frontend implementation includes:

- **OneSignal Service** (`services/oneSignalService.js`): Handles client-side OneSignal operations
- **Vendor Context Integration**: Automatically registers/unregisters vendors for push notifications
- **Notification Handling**: Processes notification clicks and navigates to appropriate pages

## Features

### 🎯 Automatic Task Assignment Notifications

When admins assign tasks to vendors, push notifications are automatically sent with:

- **Support Tickets**: Ticket ID, subject, priority, customer details
- **Service Bookings**: Customer name, services, scheduled time, location
- **Warranty Claims**: Item details, issue description, customer info

### 🚨 Priority-Based Notifications

- **Urgent/High Priority**: Higher notification priority, immediate delivery
- **Medium/Low Priority**: Standard notification priority
- **Custom Sounds**: Different notification sounds based on priority (configurable)

### 📱 Smart Notification Handling

- **Click Actions**: Notifications include action buttons (Accept, View Details)
- **Deep Linking**: Clicking notifications navigates to specific task pages
- **Vendor Targeting**: Uses vendor ID as external user ID for precise targeting

### 🔧 Vendor Management

- **Auto Registration**: Vendors are automatically registered for push notifications on login
- **Preference Handling**: Respects vendor notification preferences
- **Tag Management**: Vendor profiles are tagged with service categories, location, etc.
- **Auto Cleanup**: Vendors are unregistered from push notifications on logout

## API Integration

### Backend Services

```javascript
// Send support ticket assignment notification
await oneSignalService.sendTaskAssignmentNotification(
  vendorId, 
  ticketData, 
  'support_ticket'
);

// Send booking assignment notification  
await oneSignalService.sendTaskAssignmentNotification(
  vendorId, 
  bookingData, 
  'booking'
);

// Send urgent task notification
await oneSignalService.sendUrgentTaskNotification(
  vendorId, 
  taskData, 
  'support_ticket'
);

// Send custom notification
await oneSignalService.sendToVendor(vendorId, {
  title: 'Custom Title',
  message: 'Custom message',
  data: { custom: 'data' },
  priority: 'high'
});
```

### Frontend Integration

```javascript
// Register vendor for push notifications (automatic on login)
await oneSignalService.registerVendor(vendorId, vendorData);

// Check notification permission status
const isEnabled = await oneSignalService.isPushEnabled();

// Request notification permission
await oneSignalService.requestPermission();

// Update vendor tags (automatic on profile update)
await oneSignalService.updateVendorTags(updatedVendorData);
```

## Testing

### Run Test Script

```bash
cd backend
node test-push-notifications.js
```

This will:
1. Find an active vendor in the database
2. Send test notifications for different task types
3. Verify OneSignal integration is working
4. Display results and next steps

### Manual Testing

1. **Login as Vendor**: Use the vendor mobile app or web app
2. **Allow Notifications**: Grant push notification permissions
3. **Assign Task**: Have an admin assign a support ticket/booking to the vendor
4. **Verify Notification**: Check that push notification is received
5. **Test Click Action**: Click notification to verify navigation works

## Notification Flow

```
Admin assigns task → Backend creates notification → OneSignal sends push → Vendor receives notification → Click opens task details
```

### Detailed Flow:

1. **Admin Action**: Admin assigns support ticket/booking to vendor
2. **Backend Processing**: 
   - Task assignment is saved to database
   - Vendor notification record is created
   - OneSignal service is called to send push notification
3. **OneSignal Delivery**: 
   - OneSignal delivers push notification to vendor's device
   - Notification includes task details and action buttons
4. **Vendor Interaction**:
   - Vendor receives push notification
   - Clicking notification opens relevant task page
   - Vendor can accept/decline or view task details

## Configuration Options

### Notification Types

- `support_ticket_assignment`: New support ticket assigned
- `booking_assignment`: New service booking assigned  
- `warranty_claim`: New warranty claim assigned
- `urgent_task`: Urgent task requiring immediate attention
- `system_notification`: General system notifications

### Priority Levels

- `urgent`: Priority 10 (immediate delivery)
- `high`: Priority 8 (high priority delivery)
- `medium`: Priority 5 (standard delivery)
- `low`: Priority 2 (low priority delivery)

### Vendor Tags

Vendors are automatically tagged with:
- `vendor_id`: Unique vendor identifier
- `user_type`: Always "vendor"
- `vendor_name`: Full name
- `service_categories`: Comma-separated service categories
- `city`: Vendor's city
- `state`: Vendor's state  
- `is_active`: Active status

## Troubleshooting

### Common Issues

1. **Notifications Not Received**:
   - Check OneSignal API key is correctly set
   - Verify vendor has granted push notification permissions
   - Check vendor is registered with correct external user ID

2. **Wrong Notifications Received**:
   - Verify vendor ID is correctly passed to OneSignal
   - Check external user ID mapping in OneSignal dashboard

3. **Notification Click Not Working**:
   - Verify notification data includes correct action and IDs
   - Check frontend routing for notification click handlers

### Debug Steps

1. **Check Backend Logs**: Look for OneSignal service logs
2. **OneSignal Dashboard**: Check delivery reports and user segments
3. **Browser Console**: Check for frontend OneSignal errors
4. **Test Script**: Run the test script to verify basic functionality

## Security Considerations

- OneSignal API key should be kept secure and not exposed in frontend code
- Vendor external user IDs should not contain sensitive information
- Notification data should not include sensitive customer information
- Push notification permissions should be requested appropriately

## Performance Considerations

- Push notifications are sent asynchronously to avoid blocking task assignment
- Failed push notifications don't prevent task assignment from completing
- OneSignal handles delivery optimization and retry logic
- Vendor tags are updated efficiently only when profile data changes

## Future Enhancements

- **Rich Notifications**: Add images and custom layouts
- **Notification History**: Track notification delivery and read status
- **Batch Notifications**: Send notifications to multiple vendors efficiently
- **Custom Sounds**: Different notification sounds for different task types
- **Scheduled Notifications**: Send reminders for pending tasks
- **Analytics**: Track notification engagement and effectiveness

