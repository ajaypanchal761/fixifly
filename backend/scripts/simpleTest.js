const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function simpleTest() {
  try {
    console.log('🔍 Simple test starting...');
    
    // Test 1: Check if server is running
    console.log('\n1️⃣ Testing server connection...');
    try {
      const response = await axios.get('http://localhost:5000/health', { timeout: 5000 });
      console.log('✅ Server is running:', response.status);
    } catch (error) {
      console.log('❌ Server not running:', error.message);
      return;
    }
    
    // Test 2: Test admin login with detailed error
    console.log('\n2️⃣ Testing admin login...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/admin/login', {
        email: 'admin@fixifly.com',
        password: 'admin123'
      }, { timeout: 10000 });
      
      console.log('✅ Login response:', loginResponse.data);
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.accessToken;
        console.log('✅ Token received:', token.substring(0, 20) + '...');
        
        // Test 3: Test product creation
        console.log('\n3️⃣ Testing product creation...');
        const productData = {
          productName: 'Simple Test Product ' + Date.now(),
          serviceType: 'IT Needs',
          categories: {
            A: [{
              serviceName: 'Test Service',
              description: 'Test description',
              price: 1000,
              isActive: true
            }],
            B: [],
            C: [],
            D: []
          }
        };
        
        const productResponse = await axios.post('http://localhost:5000/api/admin/products', productData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        console.log('✅ Product creation response:', productResponse.data);
        
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
      
    } catch (error) {
      console.log('❌ Login error:', error.message);
      if (error.response) {
        console.log('📋 Response data:', error.response.data);
        console.log('📋 Status:', error.response.status);
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

// Run the test
simpleTest();
