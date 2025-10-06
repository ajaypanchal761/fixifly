const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./server');

// Test script to verify product creation with service images
async function testProductCreation() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly');
    console.log('Connected to database');

    // Test data
    const testProductData = {
      productName: 'Test Product with Service Images',
      serviceType: 'IT Needs',
      isFeatured: false,
      categories: {
        A: [
          {
            serviceName: 'Test Service 1',
            description: 'Test service description',
            price: 100,
            discountPrice: 80,
            isActive: true
          }
        ],
        B: [],
        C: [],
        D: []
      },
      categoryNames: {
        A: 'Test Category A',
        B: 'Test Category B',
        C: 'Test Category C',
        D: 'Test Category D'
      }
    };

    console.log('Testing product creation with service images...');
    console.log('Test data:', JSON.stringify(testProductData, null, 2));

    // Test the API endpoint
    const response = await request(app)
      .post('/api/admin/products')
      .set('Authorization', 'Bearer test-token') // You'll need a valid token
      .send(testProductData);

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Product creation test passed');
    } else {
      console.log('❌ Product creation test failed');
    }

  } catch (error) {
    console.error('Error testing product creation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the test
testProductCreation();
