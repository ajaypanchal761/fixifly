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

// Create test bookings
const createTestBookings = async () => {
  try {
    console.log('🔄 Creating test bookings...');

    const testBookings = [
      {
        customer: {
          name: "John Doe",
          email: "john.doe@example.com",
          phone: "9876543210",
          address: {
            street: "123 Main Street",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001"
          }
        },
        services: [
          {
            serviceId: "laptop-repair-001",
            serviceName: "Laptop Screen Repair",
            price: 2500
          }
        ],
        pricing: {
          subtotal: 2500,
          serviceFee: 100,
          totalAmount: 2600
        },
        scheduling: {
          preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          preferredTimeSlot: "morning"
        },
        status: "pending",
        payment: {
          status: "pending",
          method: "card",
          transactionId: null,
          paidAt: null
        },
        notes: "Screen has cracks and display is flickering",
        bookingReference: `BK${Date.now()}001`
      },
      {
        customer: {
          name: "Jane Smith",
          email: "jane.smith@example.com",
          phone: "9876543211",
          address: {
            street: "456 Park Avenue",
            city: "Delhi",
            state: "Delhi",
            pincode: "110001"
          }
        },
        services: [
          {
            serviceId: "ac-repair-001",
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
          preferredDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
          preferredTimeSlot: "afternoon"
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
            amount: 160000, // in paise
            currency: "INR",
            status: "captured"
          }
        },
        notes: "AC not cooling properly, needs maintenance",
        bookingReference: `BK${Date.now()}002`
      },
      {
        customer: {
          name: "Mike Johnson",
          email: "mike.johnson@example.com",
          phone: "9876543212",
          address: {
            street: "789 Tech Street",
            city: "Bangalore",
            state: "Karnataka",
            pincode: "560001"
          }
        },
        services: [
          {
            serviceId: "mobile-repair-001",
            serviceName: "Mobile Phone Repair",
            price: 800
          }
        ],
        pricing: {
          subtotal: 800,
          serviceFee: 100,
          totalAmount: 900
        },
        scheduling: {
          preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          preferredTimeSlot: "evening"
        },
        status: "in_progress",
        payment: {
          status: "completed",
          method: "card",
          transactionId: "TXN987654321",
          paidAt: new Date(),
          razorpayOrderId: "order_987654321",
          razorpayPaymentId: "pay_987654321",
          razorpaySignature: "signature_987654321",
          gatewayResponse: {
            amount: 90000, // in paise
            currency: "INR",
            status: "captured"
          }
        },
        notes: "Phone screen cracked, needs replacement",
        bookingReference: `BK${Date.now()}003`
      },
      {
        customer: {
          name: "Sarah Wilson",
          email: "sarah.wilson@example.com",
          phone: "9876543213",
          address: {
            street: "321 Service Road",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600001"
          }
        },
        services: [
          {
            serviceId: "washing-machine-001",
            serviceName: "Washing Machine Repair",
            price: 1200
          }
        ],
        pricing: {
          subtotal: 1200,
          serviceFee: 100,
          totalAmount: 1300
        },
        scheduling: {
          preferredDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          preferredTimeSlot: "morning"
        },
        status: "completed",
        payment: {
          status: "completed",
          method: "netbanking",
          transactionId: "TXN456789123",
          paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          razorpayOrderId: "order_456789123",
          razorpayPaymentId: "pay_456789123",
          razorpaySignature: "signature_456789123",
          gatewayResponse: {
            amount: 130000, // in paise
            currency: "INR",
            status: "captured"
          }
        },
        notes: "Washing machine not spinning properly",
        bookingReference: `BK${Date.now()}004`
      },
      {
        customer: {
          name: "David Brown",
          email: "david.brown@example.com",
          phone: "9876543214",
          address: {
            street: "654 Repair Lane",
            city: "Pune",
            state: "Maharashtra",
            pincode: "411001"
          }
        },
        services: [
          {
            serviceId: "plumbing-001",
            serviceName: "Plumbing Services",
            price: 600
          }
        ],
        pricing: {
          subtotal: 600,
          serviceFee: 100,
          totalAmount: 700
        },
        scheduling: {
          preferredDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          preferredTimeSlot: "afternoon"
        },
        status: "cancelled",
        payment: {
          status: "refunded",
          method: "upi",
          transactionId: "TXN789123456",
          paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          razorpayOrderId: "order_789123456",
          razorpayPaymentId: "pay_789123456",
          razorpaySignature: "signature_789123456",
          gatewayResponse: {
            amount: 70000, // in paise
            currency: "INR",
            status: "captured"
          }
        },
        notes: "Customer cancelled due to scheduling conflict",
        bookingReference: `BK${Date.now()}005`
      }
    ];

    // Clear existing bookings first
    await Booking.deleteMany({});
    console.log('🗑️ Cleared existing bookings');

    // Create new test bookings
    const createdBookings = await Booking.insertMany(testBookings);
    console.log(`✅ Created ${createdBookings.length} test bookings`);

    // Display summary
    console.log('\n📊 Booking Summary:');
    createdBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.customer.name} - ${booking.services[0].serviceName} - ${booking.status} - ₹${booking.pricing.totalAmount}`);
    });

    console.log('\n🎉 Test bookings created successfully!');
    console.log('You can now test the admin booking management page.');

  } catch (error) {
    console.error('❌ Error creating test bookings:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await createTestBookings();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(console.error);
