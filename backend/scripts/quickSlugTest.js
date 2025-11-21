const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function quickSlugTest() {
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

    // Step 2: Create one more Laptop product to see slug generation
    console.log('\n📦 Creating another Laptop product...');
    const productResponse = await axios.post('http://localhost:5000/api/admin/products', {
      name: 'Laptop',
      category: 'IT Needs',
      status: 'draft'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const productData = productResponse.data;
    if (productData.success) {
      console.log('✅ Laptop product created successfully!');
      console.log('📦 Product ID:', productData.data._id);
      console.log('📦 Product Name:', productData.data.name);
      console.log('🔗 Product Slug:', productData.data.seo?.slug);
    } else {
      console.log('❌ Laptop creation failed:', productData.message);
    }

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

// Run the test
quickSlugTest();
