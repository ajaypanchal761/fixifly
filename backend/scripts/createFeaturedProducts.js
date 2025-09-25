const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function createFeaturedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Login as admin
    console.log('\n🔐 Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/admin/login', {
      email: 'admin@fixifly.com',
      password: 'admin123'
    });

    const loginData = loginResponse.data;
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }

    const token = loginData.data.accessToken;
    console.log('✅ Admin login successful');

    // Step 2: Create featured products
    console.log('\n📦 Creating featured products...');
    const featuredProducts = [
      { name: 'Laptop Repair', category: 'IT Needs', isFeatured: true, status: 'active' },
      { name: 'Desktop Repair', category: 'IT Needs', isFeatured: true, status: 'active' },
      { name: 'Printer Repair', category: 'IT Needs', isFeatured: true, status: 'active' }
    ];

    const createdProducts = [];

    for (const productData of featuredProducts) {
      console.log(`\n📦 Creating "${productData.name}"...`);
      const productResponse = await axios.post('http://localhost:5000/api/admin/products', productData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const response = productResponse.data;
      if (response.success) {
        console.log(`✅ "${productData.name}" created successfully!`);
        console.log(`📦 Product ID: ${response.data._id}`);
        createdProducts.push({
          id: response.data._id,
          name: response.data.name
        });
      } else {
        console.log(`❌ "${productData.name}" creation failed: ${response.message}`);
      }
    }

    // Step 3: Test the public API
    console.log('\n🔍 Testing public API...');
    try {
      const publicResponse = await axios.get('http://localhost:5000/api/products/featured?limit=3');
      console.log('✅ Public API response:', JSON.stringify(publicResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Public API error:', error.message);
      if (error.response) {
        console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log('\n🎉 Featured products creation completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
createFeaturedProducts();
