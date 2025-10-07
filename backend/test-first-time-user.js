const mongoose = require('mongoose');
const { Booking } = require('./models/Booking');
const User = require('./models/User');

// Test script to demonstrate first-time user functionality
async function testFirstTimeUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly');
    console.log('Connected to MongoDB');

    // Test data for first-time user
    const firstTimeUserData = {
      customer: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+919876543210',
        address: {
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      },
      services: [
        {
          serviceId: 'SERVICE_001',
          serviceName: 'Windows Laptop Service',
          price: 400
        }
      ],
      pricing: {
        subtotal: 400,
        serviceFee: 100,
        totalAmount: 500
      },
      scheduling: {
        preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        preferredTimeSlot: 'morning'
      },
      notes: 'Test booking for first-time user'
    };

    console.log('\n=== Testing First-Time User Booking ===');
    console.log('Original pricing:', firstTimeUserData.pricing);

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [
        { email: firstTimeUserData.customer.email },
        { phone: firstTimeUserData.customer.phone }
      ]
    });

    console.log('Existing user found:', !!existingUser);

    // Check if user has previous bookings
    const previousBookings = await Booking.countDocuments({
      $or: [
        { 'customer.email': firstTimeUserData.customer.email },
        { 'customer.phone': firstTimeUserData.customer.phone }
      ]
    });

    console.log('Previous bookings count:', previousBookings);

    const isFirstTime = !existingUser && previousBookings === 0;
    console.log('Is first-time user:', isFirstTime);

    if (isFirstTime) {
      console.log('\n🎉 FIRST-TIME USER DETECTED!');
      console.log('✅ Service will be FREE for this user');
      console.log('Original price: ₹', firstTimeUserData.pricing.totalAmount);
      console.log('Final price: ₹0 (FREE)');
      
      // Simulate the pricing adjustment
      const adjustedPricing = {
        subtotal: 0,
        serviceFee: 0,
        totalAmount: 0,
        originalSubtotal: firstTimeUserData.pricing.subtotal,
        originalServiceFee: firstTimeUserData.pricing.serviceFee,
        originalTotalAmount: firstTimeUserData.pricing.totalAmount,
        isFirstTimeUser: true,
        discountApplied: 'First-time user - Service is free'
      };
      
      console.log('\nAdjusted pricing:', adjustedPricing);
    } else {
      console.log('\n❌ Not a first-time user');
      console.log('Regular pricing will apply: ₹', firstTimeUserData.pricing.totalAmount);
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testFirstTimeUser();
