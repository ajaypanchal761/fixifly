const oneSignalService = require('./services/oneSignalService');
const { logger } = require('./utils/logger');

async function testVendorTaskNotification() {
  console.log('🧪 Testing Vendor Task Notification System...\n');

  try {
    // Test 1: Check OneSignal configuration
    console.log('1. Checking OneSignal configuration...');
    const configTest = await oneSignalService.testConfiguration();
    
    if (!configTest.success) {
      console.error('❌ OneSignal configuration test failed');
      return;
    }
    console.log('✅ OneSignal configuration is valid\n');

    // Test 2: Simulate booking assignment notification
    console.log('2. Testing booking assignment notification...');
    const bookingTest = await oneSignalService.sendVendorAssignmentNotification('test_vendor_123', {
      type: 'booking',
      id: 'booking_12345',
      title: 'Laptop Repair Service',
      description: 'Customer needs laptop screen replacement and software installation',
      priority: 'high',
      customerName: 'Rajesh Kumar',
      customerPhone: '+91-9876543210',
      scheduledDate: '2024-01-15',
      scheduledTime: '10:00 AM'
    });
    
    console.log('Booking assignment notification result:', bookingTest);
    if (bookingTest.success) {
      console.log('✅ Booking assignment notification sent successfully\n');
    } else {
      console.log('⚠️ Booking assignment notification failed:', bookingTest.error);
    }

    // Test 3: Simulate support ticket assignment notification
    console.log('3. Testing support ticket assignment notification...');
    const supportTest = await oneSignalService.sendVendorAssignmentNotification('test_vendor_123', {
      type: 'support_ticket',
      id: 'ticket_67890',
      title: 'Customer Support Request',
      description: 'Customer facing issues with printer installation',
      priority: 'medium',
      customerName: 'Priya Sharma',
      customerPhone: '+91-9876543211',
      scheduledDate: null,
      scheduledTime: null
    });
    
    console.log('Support ticket assignment notification result:', supportTest);
    if (supportTest.success) {
      console.log('✅ Support ticket assignment notification sent successfully\n');
    } else {
      console.log('⚠️ Support ticket assignment notification failed:', supportTest.error);
    }

    // Test 4: Simulate warranty claim assignment notification
    console.log('4. Testing warranty claim assignment notification...');
    const warrantyTest = await oneSignalService.sendVendorAssignmentNotification('test_vendor_123', {
      type: 'warranty_claim',
      id: 'claim_11111',
      title: 'Warranty Claim - Desktop Computer',
      description: 'Customer reports desktop not starting after power surge',
      priority: 'high',
      customerName: 'Amit Patel',
      customerPhone: '+91-9876543212',
      scheduledDate: null,
      scheduledTime: null
    });
    
    console.log('Warranty claim assignment notification result:', warrantyTest);
    if (warrantyTest.success) {
      console.log('✅ Warranty claim assignment notification sent successfully\n');
    } else {
      console.log('⚠️ Warranty claim assignment notification failed:', warrantyTest.error);
    }

    // Test 5: Test notification to all vendors
    console.log('5. Testing notification to all vendors...');
    const allVendorsTest = await oneSignalService.sendNotificationToAll({
      heading: '🔔 New Task Available',
      message: 'New service requests are available in your area. Check your dashboard for details.',
      data: {
        type: 'general_announcement',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('All vendors notification result:', allVendorsTest);
    if (allVendorsTest.success) {
      console.log('✅ All vendors notification sent successfully\n');
    } else {
      console.log('⚠️ All vendors notification failed:', allVendorsTest.error);
    }

    console.log('🎉 Vendor Task Notification Testing Completed!');
    console.log('\n📋 Summary:');
    console.log('- OneSignal Configuration: ✅ Valid');
    console.log('- Booking Assignment: ' + (bookingTest.success ? '✅ Success' : '⚠️ Failed'));
    console.log('- Support Ticket Assignment: ' + (supportTest.success ? '✅ Success' : '⚠️ Failed'));
    console.log('- Warranty Claim Assignment: ' + (warrantyTest.success ? '✅ Success' : '⚠️ Failed'));
    console.log('- All Vendors Notification: ' + (allVendorsTest.success ? '✅ Success' : '⚠️ Failed'));

    console.log('\n📱 How to Test with Real Vendor:');
    console.log('1. Vendor should login to the frontend');
    console.log('2. OneSignal will automatically set their external user ID');
    console.log('3. Admin assigns vendor to a task through admin panel');
    console.log('4. Vendor will receive push notification on their device');
    console.log('5. Clicking notification will navigate to the specific task');

    console.log('\n🔧 Admin Panel Testing:');
    console.log('Use these API endpoints to test:');
    console.log('- GET /api/admin/onesignal/status');
    console.log('- POST /api/admin/onesignal/test-vendor');
    console.log('- POST /api/admin/onesignal/test-all');

  } catch (error) {
    console.error('❌ Error during vendor task notification testing:', error);
    logger.error('Vendor task notification test error:', {
      error: error.message,
      stack: error.stack
    });
  }
}

// Run the test
testVendorTaskNotification().then(() => {
  console.log('\n✨ Test completed. Check the results above.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
