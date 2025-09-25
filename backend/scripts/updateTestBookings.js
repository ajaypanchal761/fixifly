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

// Update test bookings with proper service names
const updateTestBookings = async () => {
  try {
    console.log('🔄 Updating test bookings with proper service names...');

    // Update existing bookings with proper service names
    const updates = [
      {
        filter: { 'customer.name': 'John Doe' },
        update: {
          $set: {
            'services.0.serviceName': 'Laptop Screen Repair',
            'services.0.serviceId': 'laptop-screen-repair-001'
          }
        }
      },
      {
        filter: { 'customer.name': 'Jane Smith' },
        update: {
          $set: {
            'services.0.serviceName': 'AC Repair & Maintenance',
            'services.0.serviceId': 'ac-repair-maintenance-001'
          }
        }
      },
      {
        filter: { 'customer.name': 'Mike Johnson' },
        update: {
          $set: {
            'services.0.serviceName': 'Mobile Phone Repair',
            'services.0.serviceId': 'mobile-phone-repair-001'
          }
        }
      },
      {
        filter: { 'customer.name': 'Sarah Wilson' },
        update: {
          $set: {
            'services.0.serviceName': 'Washing Machine Repair',
            'services.0.serviceId': 'washing-machine-repair-001'
          }
        }
      },
      {
        filter: { 'customer.name': 'David Brown' },
        update: {
          $set: {
            'services.0.serviceName': 'Plumbing Services',
            'services.0.serviceId': 'plumbing-services-001'
          }
        }
      }
    ];

    // Apply updates
    for (const update of updates) {
      const result = await Booking.updateOne(update.filter, update.update);
      console.log(`Updated booking for ${update.filter['customer.name']}: ${result.modifiedCount} document(s) modified`);
    }

    // Create a new booking with multiple services
    const multiServiceBooking = {
      customer: {
        name: "Ajay Panchal",
        email: "ajay@example.com",
        phone: "7610416911",
        address: {
          street: "123 Tech Street",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001"
        }
      },
      services: [
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
      ],
      pricing: {
        subtotal: 700,
        serviceFee: 100,
        totalAmount: 800
      },
      scheduling: {
        preferredDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        preferredTimeSlot: "morning"
      },
      status: "confirmed",
      payment: {
        status: "completed",
        method: "upi",
        transactionId: "TXN123456789",
        paidAt: new Date(),
        razorpayOrderId: "order_123456789",
        razorpayPaymentId: "pay_123456789",
        razorpaySignature: "signature_123456789",
        gatewayResponse: {
          amount: 80000, // in paise
          currency: "INR",
          status: "captured"
        }
      },
      notes: "Booking created from checkout",
      bookingReference: `BK${Date.now()}006`
    };

    // Check if this booking already exists
    const existingBooking = await Booking.findOne({ 'customer.email': 'ajay@example.com' });
    if (!existingBooking) {
      const newBooking = await Booking.create(multiServiceBooking);
      console.log(`✅ Created multi-service booking: ${newBooking.bookingReference}`);
    } else {
      console.log('📝 Multi-service booking already exists');
    }

    // Display all bookings
    const allBookings = await Booking.find({}).lean();
    console.log('\n📋 All bookings with updated service names:');
    allBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.customer.name}`);
      console.log(`   Services: ${booking.services.map(s => s.serviceName).join(', ')}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Amount: ₹${booking.pricing.totalAmount}`);
      console.log('   ---');
    });

    console.log('\n🎉 Test bookings updated successfully!');

  } catch (error) {
    console.error('❌ Error updating test bookings:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await updateTestBookings();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(console.error);
