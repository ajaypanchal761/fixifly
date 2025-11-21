const mongoose = require('mongoose');
const { Booking } = require('../models/Booking');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ajay761:ajay%401102@cluster0.okjqrni.mongodb.net/FixFly';
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix Ajay's booking with proper service names
const fixAjayBooking = async () => {
  try {
    console.log('🔄 Fixing Ajay Panchal booking with proper service names...');

    // Find Ajay's booking
    const ajayBooking = await Booking.findOne({ 'customer.email': 'ajay@example.com' });
    
    if (ajayBooking) {
      console.log('📝 Found Ajay\'s booking:', ajayBooking.bookingReference);
      console.log('Current services:', ajayBooking.services);
      
      // Update with proper service names
      ajayBooking.services = [
        {
          serviceId: "laptop-repair-001",
          serviceName: "Laptop Repair",
          price: 500
        },
        {
          serviceId: "mobile-repair-001", 
          serviceName: "Mobile Phone Repair",
          price: 200
        }
      ];
      
      // Update pricing to match
      ajayBooking.pricing = {
        subtotal: 700,
        serviceFee: 100,
        totalAmount: 800
      };
      
      await ajayBooking.save();
      console.log('✅ Updated Ajay\'s booking with proper service names');
      console.log('New services:', ajayBooking.services.map(s => s.serviceName).join(', '));
    } else {
      console.log('❌ Ajay\'s booking not found');
    }

    // Display all bookings
    const allBookings = await Booking.find({}).lean();
    console.log('\n📋 All bookings:');
    allBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.customer.name}`);
      console.log(`   Services: ${booking.services.map(s => s.serviceName).join(', ')}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Amount: ₹${booking.pricing.totalAmount}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Error fixing Ajay booking:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixAjayBooking();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(console.error);
