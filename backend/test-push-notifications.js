const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables FIRST
require('dotenv').config({ path: './config/production.env' });

// Then require services that depend on environment variables
const oneSignalService = require('./services/oneSignalService');
const Vendor = require('./models/Vendor');

// Debug environment loading
console.log('Environment check:', {
  ONESIGNAL_APP_ID: process.env.ONESIGNAL_APP_ID ? 'Found' : 'Not found',
  ONESIGNAL_API_KEY: process.env.ONESIGNAL_API_KEY ? 'Found' : 'Not found',
  MONGODB_URI: process.env.MONGODB_URI ? 'Found' : 'Not found'
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testPushNotifications() {
  try {
    console.log('🚀 Testing OneSignal Push Notifications for Vendors...\n');

    // Find an active vendor
    const vendor = await Vendor.findOne({ isActive: true });
    
    if (!vendor) {
      console.log('❌ No active vendor found for testing');
      return;
    }

    console.log('✅ Found test vendor:', {
      vendorId: vendor.vendorId,
      name: `${vendor.firstName} ${vendor.lastName}`,
      email: vendor.email
    });

    // Test 1: Support Ticket Assignment Notification
    console.log('\n📋 Testing Support Ticket Assignment Notification...');
    
    const ticketData = {
      ticketId: 'TK000TEST',
      subject: 'Test Support Ticket for Push Notification',
      type: 'service',
      priority: 'High',
      userName: 'Test Customer',
      userEmail: 'test@customer.com',
      userPhone: '9876543210',
      description: 'This is a test support ticket to verify push notifications are working correctly.'
    };

    try {
      const ticketNotificationResult = await oneSignalService.sendTaskAssignmentNotification(
        vendor._id.toString(),
        ticketData,
        'support_ticket'
      );
      
      if (ticketNotificationResult) {
        console.log('✅ Support ticket notification sent successfully:', {
          notificationId: ticketNotificationResult.id,
          recipients: ticketNotificationResult.recipients
        });
      } else {
        console.log('⚠️ Support ticket notification not sent (OneSignal not configured)');
      }
    } catch (error) {
      console.log('❌ Error sending support ticket notification:', error.message);
    }

    // Test 2: Booking Assignment Notification
    console.log('\n🔧 Testing Booking Assignment Notification...');
    
    const bookingData = {
      _id: 'booking_test_id',
      customer: {
        name: 'Test Customer',
        email: 'test@customer.com',
        phone: '9876543210'
      },
      services: [
        { serviceName: 'AC Repair' },
        { serviceName: 'Electrical Work' }
      ],
      scheduling: {
        scheduledDate: new Date(),
        scheduledTime: '10:00 AM'
      },
      priority: 'medium',
      pricing: {
        totalAmount: 500
      }
    };

    try {
      const bookingNotificationResult = await oneSignalService.sendTaskAssignmentNotification(
        vendor._id.toString(),
        bookingData,
        'booking'
      );
      
      if (bookingNotificationResult) {
        console.log('✅ Booking notification sent successfully:', {
          notificationId: bookingNotificationResult.id,
          recipients: bookingNotificationResult.recipients
        });
      } else {
        console.log('⚠️ Booking notification not sent (OneSignal not configured)');
      }
    } catch (error) {
      console.log('❌ Error sending booking notification:', error.message);
    }

    // Test 3: Urgent Task Notification
    console.log('\n🚨 Testing Urgent Task Notification...');
    
    const urgentTicketData = {
      ticketId: 'TK000URGENT',
      subject: 'URGENT: Critical System Failure',
      priority: 'urgent'
    };

    try {
      const urgentNotificationResult = await oneSignalService.sendUrgentTaskNotification(
        vendor._id.toString(),
        urgentTicketData,
        'support_ticket'
      );
      
      if (urgentNotificationResult) {
        console.log('✅ Urgent notification sent successfully:', {
          notificationId: urgentNotificationResult.id,
          recipients: urgentNotificationResult.recipients
        });
      } else {
        console.log('⚠️ Urgent notification not sent (OneSignal not configured)');
      }
    } catch (error) {
      console.log('❌ Error sending urgent notification:', error.message);
    }

    // Test 4: Custom Notification
    console.log('\n📱 Testing Custom Notification...');
    
    const customNotification = {
      title: '🎉 Welcome to Fixifly Push Notifications!',
      message: 'You will now receive instant notifications for new tasks assigned to you.',
      data: {
        type: 'welcome',
        action: 'view_dashboard'
      },
      priority: 'medium'
    };

    try {
      const customNotificationResult = await oneSignalService.sendToVendor(
        vendor._id.toString(),
        customNotification
      );
      
      if (customNotificationResult) {
        console.log('✅ Custom notification sent successfully:', {
          notificationId: customNotificationResult.id,
          recipients: customNotificationResult.recipients
        });
      } else {
        console.log('⚠️ Custom notification not sent (OneSignal not configured)');
      }
    } catch (error) {
      console.log('❌ Error sending custom notification:', error.message);
    }

    console.log('\n🎯 Push Notification Testing Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Add your OneSignal REST API Key to the environment variables');
    console.log('2. Ensure vendors have the mobile app or web app open to receive notifications');
    console.log('3. Test with real vendor accounts to verify end-to-end functionality');
    console.log('4. Monitor OneSignal dashboard for delivery statistics');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testPushNotifications();
