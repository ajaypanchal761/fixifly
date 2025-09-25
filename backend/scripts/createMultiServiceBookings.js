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

// Create bookings with different numbers of services
const createMultiServiceBookings = async () => {
  try {
    console.log('🔄 Creating bookings with different numbers of services...');

    // Single service booking
    const singleServiceBooking = {
      customer: {
        name: "Priya Sharma",
        email: "priya@example.com",
        phone: "9876543215",
        address: {
          street: "456 Service Lane",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001"
        }
      },
      services: [
        {
          serviceId: "ac-repair-002",
          serviceName: "AC Repair & Maintenance",
          price: 1500
        }
      ],
      pricing: {
        subtotal: 1500,
        serviceFee: 100,
        totalAmount: 1600
      },
      scheduling: {
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        preferredTimeSlot: "afternoon"
      },
      status: "pending",
      payment: {
        status: "pending",
        method: "card",
        transactionId: null,
        paidAt: null
      },
      notes: "Single service booking",
      bookingReference: `BK${Date.now()}007`
    };

    // Three services booking
    const threeServiceBooking = {
      customer: {
        name: "Rajesh Kumar",
        email: "rajesh@example.com",
        phone: "9876543216",
        address: {
          street: "789 Multi Service Road",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001"
        }
      },
      services: [
        {
          serviceId: "laptop-repair-002",
          serviceName: "Laptop Repair",
          price: 800
        },
        {
          serviceId: "mobile-repair-002",
          serviceName: "Mobile Phone Repair",
          price: 300
        },
        {
          serviceId: "washing-machine-002",
          serviceName: "Washing Machine Repair",
          price: 600
        }
      ],
      pricing: {
        subtotal: 1700,
        serviceFee: 100,
        totalAmount: 1800
      },
      scheduling: {
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        preferredTimeSlot: "morning"
      },
      status: "in_progress",
      payment: {
        status: "completed",
        method: "upi",
        transactionId: "TXN987654321",
        paidAt: new Date(),
        razorpayOrderId: "order_987654321",
        razorpayPaymentId: "pay_987654321",
        razorpaySignature: "signature_987654321",
        gatewayResponse: {
          amount: 180000,
          currency: "INR",
          status: "captured"
        }
      },
      notes: "Three services booking - comprehensive repair",
      bookingReference: `BK${Date.now()}008`
    };

    // Create the bookings
    const bookings = [singleServiceBooking, threeServiceBooking];
    
    for (const bookingData of bookings) {
      // Check if booking already exists
      const existingBooking = await Booking.findOne({ 'customer.email': bookingData.customer.email });
      if (!existingBooking) {
        const newBooking = await Booking.create(bookingData);
        console.log(`✅ Created booking for ${bookingData.customer.name}: ${newBooking.bookingReference}`);
        console.log(`   Services: ${newBooking.services.map(s => s.serviceName).join(', ')}`);
        console.log(`   Amount: ₹${newBooking.pricing.totalAmount}`);
      } else {
        console.log(`📝 Booking for ${bookingData.customer.name} already exists`);
      }
    }

    // Display all bookings
    const allBookings = await Booking.find({}).lean();
    console.log('\n📋 All bookings with service counts:');
    allBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.customer.name}`);
      console.log(`   Services (${booking.services.length}): ${booking.services.map(s => s.serviceName).join(', ')}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Amount: ₹${booking.pricing.totalAmount}`);
      console.log('   ---');
    });

    console.log('\n🎉 Multi-service bookings created successfully!');

  } catch (error) {
    console.error('❌ Error creating multi-service bookings:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await createMultiServiceBookings();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(console.error);
