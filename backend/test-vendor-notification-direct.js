require('dotenv').config({ path: './config/production.env' });

const oneSignalService = require('./services/oneSignalService');

async function testDirectNotification() {
  console.log('🔔 Testing Direct Vendor Notification...\n');

  try {
    // Use the existing oneSignalService instance
    console.log('📡 OneSignal service loaded');

    // Test with vendor ID '339' (Krishna Panchal)
    const vendorId = '339';
    
    console.log('📱 Sending test notification directly to vendor:', vendorId);
    
    const notificationData = {
      title: '🎯 Test: New Task Assignment',
      message: 'This is a test notification to verify that push notifications are working correctly!',
      data: {
        ticketId: 'TEST_DIRECT',
        subject: 'Direct Notification Test',
        priority: 'high',
        customerName: 'Test Customer',
        customerPhone: '9876543210',
        type: 'support_ticket',
        action: 'assign'
      },
      priority: 'high'
    };

    // Send notification using our OneSignal service
    const result = await oneSignalService.sendTaskAssignmentNotification(vendorId, notificationData, 'support_ticket');
    
    console.log('✅ Test notification sent successfully!');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
    if (result && result.id) {
      console.log('\n🎉 SUCCESS: Notification was accepted by OneSignal!');
      console.log('📱 Check vendor device for notification');
      console.log('🔑 Notification ID:', result.id);
      console.log('👥 Recipients:', result.recipients || 'Unknown');
    } else {
      console.log('\n⚠️  WARNING: OneSignal API call succeeded but no notification ID returned');
      console.log('💡 This might mean the vendor is not subscribed');
      
      if (result && result.errors) {
        console.log('❌ Errors:', result.errors);
      }
    }

  } catch (error) {
    console.error('❌ Error testing notification:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n🏁 Test complete!');
}

testDirectNotification();
