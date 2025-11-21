const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function simpleImageTest() {
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

    // Step 2: Create a test product
    console.log('\n📦 Creating test product...');
    const productResponse = await axios.post('http://localhost:5000/api/admin/products', {
      name: 'Simple Test Product',
      category: 'IT Needs',
      status: 'draft'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const productData = productResponse.data;
    if (!productData.success) {
      throw new Error('Product creation failed: ' + productData.message);
    }

    console.log('✅ Test product created successfully!');
    console.log('📦 Product ID:', productData.data._id);

    const productId = productData.data._id;

    // Step 3: Test the image upload endpoint with a simple request
    console.log('\n🔍 Testing image upload endpoint...');
    
    try {
      const testResponse = await axios.get(
        `http://localhost:5000/api/admin/products/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Product endpoint is accessible');
      console.log('📦 Product data:', JSON.stringify(testResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Product endpoint error:', error.message);
    }

    // Step 4: Test image upload endpoint accessibility
    console.log('\n🔍 Testing image upload endpoint accessibility...');
    
    try {
      const imageEndpointResponse = await axios.post(
        `http://localhost:5000/api/admin/products/${productId}/images`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Image upload endpoint is accessible');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Image upload endpoint is accessible (400 error expected for empty request)');
      } else {
        console.log('❌ Image upload endpoint error:', error.message);
        if (error.response) {
          console.log('Response status:', error.response.status);
          console.log('Response data:', JSON.stringify(error.response.data, null, 2));
        }
      }
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
simpleImageTest();