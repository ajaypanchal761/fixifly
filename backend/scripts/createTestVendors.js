const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Vendor = require('../models/Vendor');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test vendors data
const testVendors = [
  {
    firstName: 'Ankit',
    lastName: 'Ahirwar',
    email: 'ankit.ahirwar@example.com',
    phone: '9876543210',
    password: 'password123',
    serviceCategories: ['Computer & Laptop', 'Mobile Phone'],
    experience: '5-10 years',
    address: {
      street: '123 Tech Street',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001'
    },
    specialty: 'Laptop and Mobile Repair Specialist',
    bio: 'Experienced technician with 5+ years in laptop and mobile repair services.',
    isActive: true,
    isApproved: true,
    isBlocked: false,
    isEmailVerified: true,
    isPhoneVerified: true
  },
  {
    firstName: 'Raihan',
    lastName: 'Khan',
    email: 'raihan.khan@example.com',
    phone: '9876543211',
    password: 'password123',
    serviceCategories: ['AC & Refrigeration', 'Home Appliances'],
    experience: '5-10 years',
    address: {
      street: '456 Service Lane',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462001'
    },
    specialty: 'Home Appliance Repair Expert',
    bio: 'Specialized in AC and washing machine repair with 7+ years of experience.',
    isActive: true,
    isApproved: true,
    isBlocked: false,
    isEmailVerified: true,
    isPhoneVerified: true
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@example.com',
    phone: '9876543212',
    password: 'password123',
    serviceCategories: ['Plumbing', 'AC & Refrigeration'],
    experience: '3-5 years',
    address: {
      street: '789 Repair Road',
      city: 'Gwalior',
      state: 'Madhya Pradesh',
      pincode: '474001'
    },
    specialty: 'Plumbing and AC Services',
    bio: 'Professional plumber and AC technician with 4+ years of experience.',
    isActive: true,
    isApproved: true,
    isBlocked: false,
    isEmailVerified: true,
    isPhoneVerified: true
  },
  {
    firstName: 'Vikram',
    lastName: 'Singh',
    email: 'vikram.singh@example.com',
    phone: '9876543213',
    password: 'password123',
    serviceCategories: ['Mobile Phone', 'Computer & Laptop'],
    experience: '5-10 years',
    address: {
      street: '321 Digital Avenue',
      city: 'Jabalpur',
      state: 'Madhya Pradesh',
      pincode: '482001'
    },
    specialty: 'Mobile and Laptop Repair Specialist',
    bio: 'Expert in mobile and laptop repair with 6+ years of experience.',
    isActive: true,
    isApproved: true,
    isBlocked: false,
    isEmailVerified: true,
    isPhoneVerified: true
  },
  {
    firstName: 'Suresh',
    lastName: 'Kumar',
    email: 'suresh.kumar@example.com',
    phone: '9876543214',
    password: 'password123',
    serviceCategories: ['Home Appliances', 'Plumbing'],
    experience: 'More than 10 years',
    address: {
      street: '654 Appliance Street',
      city: 'Ujjain',
      state: 'Madhya Pradesh',
      pincode: '456001'
    },
    specialty: 'Washing Machine and Plumbing Expert',
    bio: 'Senior technician specializing in washing machine repair and plumbing services.',
    isActive: true,
    isApproved: true,
    isBlocked: false,
    isEmailVerified: true,
    isPhoneVerified: true
  }
];

// Create test vendors
const createTestVendors = async () => {
  try {
    console.log('Starting to create test vendors...');
    
    // Clear existing test vendors
    await Vendor.deleteMany({
      email: { $in: testVendors.map(v => v.email) }
    });
    console.log('Cleared existing test vendors');
    
    // Create new vendors
    for (const vendorData of testVendors) {
      try {
        // Generate unique vendor ID
        const vendorId = await Vendor.generateVendorId();
        
        // Create vendor (password will be hashed by pre-save middleware)
        const vendor = new Vendor({
          ...vendorData,
          vendorId,
          rating: {
            average: 4.5,
            count: 0
          },
          stats: {
            totalTasks: 0,
            completedTasks: 0,
            lastLoginAt: new Date()
          }
        });
        
        // Check if profile is complete
        vendor.checkProfileComplete();
        
        await vendor.save();
        console.log(`✅ Created vendor: ${vendor.firstName} ${vendor.lastName} (ID: ${vendor.vendorId})`);
        
      } catch (error) {
        console.error(`❌ Error creating vendor ${vendorData.firstName} ${vendorData.lastName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Test vendors creation completed!');
    console.log('You can now see these vendors in the admin vendor management page.');
    
  } catch (error) {
    console.error('Error creating test vendors:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await createTestVendors();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});
