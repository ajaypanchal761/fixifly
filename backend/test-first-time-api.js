const express = require('express');
const mongoose = require('mongoose');
const { Booking } = require('./models/Booking');
const User = require('./models/User');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Test endpoint to check first-time user status
app.post('/api/test/first-time-user', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is required'
      });
    }

    // Check if user exists in User model
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { phone: phone }
      ]
    });

    // Check if user has any previous bookings
    const previousBookings = await Booking.countDocuments({
      $or: [
        { 'customer.email': email },
        { 'customer.phone': phone }
      ]
    });

    const isFirstTime = !existingUser && previousBookings === 0;

    res.json({
      success: true,
      data: {
        email: email,
        phone: phone,
        existingUser: !!existingUser,
        previousBookings: previousBookings,
        isFirstTimeUser: isFirstTime,
        message: isFirstTime 
          ? 'This is a first-time user - service will be FREE!' 
          : 'This is not a first-time user - regular pricing applies'
      }
    });

  } catch (error) {
    console.error('Error checking first-time user:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking first-time user status',
      error: error.message
    });
  }
});

// Test endpoint to simulate booking creation with first-time user logic
app.post('/api/test/booking-simulation', async (req, res) => {
  try {
    const { customer, services, pricing } = req.body;

    if (!customer || !services || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'Customer, services, and pricing are required'
      });
    }

    // Check if this is a first-time user
    const existingUser = await User.findOne({
      $or: [
        { email: customer.email },
        { phone: customer.phone }
      ]
    });

    const previousBookings = await Booking.countDocuments({
      $or: [
        { 'customer.email': customer.email },
        { 'customer.phone': customer.phone }
      ]
    });

    const isFirstTime = !existingUser && previousBookings === 0;

    // Apply first-time user discount (make service free)
    let finalPricing = { ...pricing };
    if (isFirstTime) {
      finalPricing = {
        subtotal: 0,
        serviceFee: 0,
        totalAmount: 0,
        originalSubtotal: pricing.subtotal,
        originalServiceFee: pricing.serviceFee || 100,
        originalTotalAmount: pricing.totalAmount,
        isFirstTimeUser: true,
        discountApplied: 'First-time user - Service is free'
      };
    }

    res.json({
      success: true,
      data: {
        customer: customer,
        services: services,
        originalPricing: pricing,
        finalPricing: finalPricing,
        isFirstTimeUser: isFirstTime,
        discountApplied: isFirstTime ? 'First-time user - Service is free' : 'No discount',
        savings: isFirstTime ? pricing.totalAmount : 0
      }
    });

  } catch (error) {
    console.error('Error simulating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error simulating booking',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('\nTest endpoints:');
  console.log('POST /api/test/first-time-user - Check if user is first-time');
  console.log('POST /api/test/booking-simulation - Simulate booking with pricing');
  console.log('\nExample usage:');
  console.log('curl -X POST http://localhost:3001/api/test/first-time-user \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email": "test@example.com", "phone": "+919876543210"}\'');
});
