const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function finalDeleteTest() {
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

    // Step 2: Create multiple test products
    console.log('\n📦 Creating test products...');
    const productNames = ['Test Product 1', 'Test Product 2', 'Test Product 3'];
    const createdProducts = [];

    for (const name of productNames) {
      console.log(`\n📦 Creating "${name}"...`);
      const productResponse = await axios.post('http://localhost:5000/api/admin/products', {
        name: name,
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
        console.log(`✅ "${name}" created successfully!`);
        console.log(`📦 Product ID: ${productData.data._id}`);
        createdProducts.push({
          id: productData.data._id,
          name: productData.data.name
        });
      } else {
        console.log(`❌ "${name}" creation failed: ${productData.message}`);
      }
    }

    // Step 3: List all products before deletion
    console.log('\n📋 Listing all products before deletion...');
    const listResponse = await axios.get('http://localhost:5000/api/admin/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (listResponse.data.success) {
      console.log(`📊 Total products before deletion: ${listResponse.data.data.length}`);
    }

    // Step 4: Delete products one by one
    console.log('\n🗑️  Deleting products...');
    for (const product of createdProducts) {
      console.log(`\n🗑️  Deleting "${product.name}" (ID: ${product.id})...`);
      
      const deleteResponse = await axios.delete(
        `http://localhost:5000/api/admin/products/${product.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const deleteData = deleteResponse.data;
      if (deleteData.success) {
        console.log(`✅ "${product.name}" deleted successfully!`);
      } else {
        console.log(`❌ "${product.name}" deletion failed: ${deleteData.message}`);
      }
    }

    // Step 5: List all products after deletion
    console.log('\n📋 Listing all products after deletion...');
    const finalListResponse = await axios.get('http://localhost:5000/api/admin/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (finalListResponse.data.success) {
      console.log(`📊 Total products after deletion: ${finalListResponse.data.data.length}`);
    }

    console.log('\n🎉 Final delete test completed successfully!');

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
finalDeleteTest();
