const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function createDefaultAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@fixifly.com' });
    if (existingAdmin) {
      console.log('⚠️  Default admin already exists:', existingAdmin.email);
      console.log('📧 Email: admin@fixifly.com');
      console.log('🔑 Password: admin123');
      return;
    }

    // Create default admin
    const adminData = {
      name: 'Fixifly Admin',
      email: 'admin@fixifly.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'super_admin',
      department: 'IT',
      designation: 'System Administrator',
      isActive: true,
      permissions: {
        userManagement: true,
        vendorManagement: true,
        productManagement: true,
        blogManagement: true,
        cardManagement: true,
        analytics: true,
        systemSettings: true
      }
    };

    const admin = await Admin.create(adminData);
    console.log('✅ Default admin created successfully!');
    console.log('📧 Email: admin@fixifly.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 Admin ID:', admin.adminId);
    console.log('👤 Name:', admin.name);
    console.log('📱 Phone:', admin.phone);

  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createDefaultAdmin();
