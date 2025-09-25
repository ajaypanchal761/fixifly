const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function finalSlugTest() {
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

    // Step 2: Create multiple products with same name to test slug generation
    console.log('\n📦 Creating multiple products with name "Laptop"...');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`\n📦 Creating Laptop product #${i}...`);
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
        console.log(`✅ Laptop #${i} created successfully!`);
        console.log(`📦 Product ID: ${productData.data._id}`);
        console.log(`📦 Product Name: ${productData.data.name}`);
        console.log(`🔗 Product Slug: ${productData.data.seo?.slug}`);
      } else {
        console.log(`❌ Laptop #${i} creation failed: ${productData.message}`);
      }
    }

    // Step 3: Create products with different names
    console.log('\n📦 Creating products with different names...');
    const productNames = ['Desktop Computer', 'Gaming Laptop', 'MacBook Pro'];
    
    for (const name of productNames) {
      console.log(`\n📦 Creating "${name}" product...`);
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
        console.log(`📦 Product Name: ${productData.data.name}`);
        console.log(`🔗 Product Slug: ${productData.data.seo?.slug}`);
      } else {
        console.log(`❌ "${name}" creation failed: ${productData.message}`);
      }
    }

    console.log('\n🎉 All slug tests completed successfully!');

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
finalSlugTest();
