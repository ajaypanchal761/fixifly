const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function simpleProductTest() {
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

    // Step 2: Test simple product creation (no images)
    console.log('\n📦 Testing simple product creation...');
    
    try {
      const productResponse = await axios.post('http://localhost:5000/api/admin/products', {
        name: 'Test Product Without Images',
        category: 'IT Needs',
        status: 'draft'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const productData = productResponse.data;
      console.log('✅ Product created successfully!');
      console.log('📦 Product ID:', productData.data.product._id);
      console.log('📝 Product Name:', productData.data.product.name);
      
    } catch (error) {
      console.log('❌ Product creation failed:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      console.log('Full error:', error.response?.data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
simpleProductTest();
