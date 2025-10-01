const oneSignalService = require('./services/oneSignalService');
const { logger } = require('./utils/logger');

async function testOneSignalService() {
  console.log('🧪 Testing OneSignal Service...\n');

  try {
    // Test 1: Check configuration
    console.log('1. Testing OneSignal configuration...');
    const configTest = await oneSignalService.testConfiguration();
    console.log('Configuration test result:', configTest);
    
    if (!configTest.success) {
      console.error('❌ OneSignal configuration test failed');
      return;
    }
    console.log('✅ OneSignal configuration is valid\n');

    // Test 2: Send test notification to all users
    console.log('2. Testing notification to all users...');
    const allUsersTest = await oneSignalService.sendNotificationToAll({
      heading: '🧪 OneSignal Test',
      message: 'This is a test notification from Fixifly backend. If you receive this, OneSignal is working correctly!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    });
    console.log('All users notification result:', allUsersTest);
    
    if (allUsersTest.success) {
      console.log('✅ Test notification sent to all users successfully\n');
    } else {
      console.log('⚠️ Test notification to all users failed:', allUsersTest.error);
    }

    // Test 3: Send test notification to specific vendor (you can replace with actual vendor ID)
    console.log('3. Testing notification to specific vendor...');
    const testVendorId = 'test_vendor_123'; // Replace with actual vendor ID for testing
    
    const vendorTest = await oneSignalService.sendVendorAssignmentNotification(testVendorId, {
      type: 'booking',
      id: 'test_booking_123',
      title: 'Test Service Request',
      description: 'This is a test service request assignment notification',
      priority: 'medium',
      customerName: 'Test Customer',
      customerPhone: '+91-9876543210',
      scheduledDate: '2024-01-15',
      scheduledTime: '10:00 AM'
    });
    console.log('Vendor assignment notification result:', vendorTest);
    
    if (vendorTest.success) {
      console.log('✅ Test vendor assignment notification sent successfully\n');
    } else {
      console.log('⚠️ Test vendor assignment notification failed:', vendorTest.error);
    }

    // Test 4: Send wallet notification
    console.log('4. Testing wallet notification...');
    const walletTest = await oneSignalService.sendVendorWalletNotification(testVendorId, {
      type: 'deposit',
      amount: 1000,
      description: 'Test wallet deposit',
      transactionId: 'TEST_TXN_123',
      newBalance: 5000
    });
    console.log('Wallet notification result:', walletTest);
    
    if (walletTest.success) {
      console.log('✅ Test wallet notification sent successfully\n');
    } else {
      console.log('⚠️ Test wallet notification failed:', walletTest.error);
    }

    // Test 5: Send status notification
    console.log('5. Testing status notification...');
    const statusTest = await oneSignalService.sendVendorStatusNotification(testVendorId, {
      status: 'approved',
      reason: 'Test approval notification'
    });
    console.log('Status notification result:', statusTest);
    
    if (statusTest.success) {
      console.log('✅ Test status notification sent successfully\n');
    } else {
      console.log('⚠️ Test status notification failed:', statusTest.error);
    }

    console.log('🎉 OneSignal service testing completed!');
    console.log('\n📋 Summary:');
    console.log('- Configuration: ✅ Valid');
    console.log('- All users notification: ' + (allUsersTest.success ? '✅ Success' : '⚠️ Failed'));
    console.log('- Vendor assignment notification: ' + (vendorTest.success ? '✅ Success' : '⚠️ Failed'));
    console.log('- Wallet notification: ' + (walletTest.success ? '✅ Success' : '⚠️ Failed'));
    console.log('- Status notification: ' + (statusTest.success ? '✅ Success' : '⚠️ Failed'));

  } catch (error) {
    console.error('❌ Error during OneSignal testing:', error);
    logger.error('OneSignal test error:', {
      error: error.message,
      stack: error.stack
    });
  }
}

// Run the test
testOneSignalService().then(() => {
  console.log('\n✨ Test completed. Check the results above.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
