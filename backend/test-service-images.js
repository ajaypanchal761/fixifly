const mongoose = require('mongoose');
const { Product } = require('./models/Product');

// Test script to verify service images are stored in database
async function testServiceImages() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly');
    console.log('Connected to database');

    // Find a product with services
    const products = await Product.find({}).limit(5);
    
    console.log('\n=== Testing Service Images Storage ===\n');
    
    for (const product of products) {
      console.log(`Product: ${product.productName}`);
      console.log(`Product Image: ${product.productImage || 'None'}`);
      
      // Check each category for service images
      ['A', 'B', 'C', 'D'].forEach(categoryKey => {
        const services = product.categories[categoryKey] || [];
        if (services.length > 0) {
          console.log(`\nCategory ${categoryKey} (${product.categoryNames[categoryKey]}):`);
          services.forEach((service, index) => {
            console.log(`  Service ${index + 1}: ${service.serviceName}`);
            console.log(`    Image: ${service.serviceImage || 'None'}`);
            console.log(`    Price: ₹${service.price}`);
            console.log(`    Active: ${service.isActive}`);
          });
        }
      });
      
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
    // Test specific service image queries
    console.log('\n=== Testing Service Image Queries ===\n');
    
    // Find services with images
    const servicesWithImages = await Product.aggregate([
      { $unwind: '$categories.A' },
      { $match: { 'categories.A.serviceImage': { $exists: true, $ne: null } } },
      { $project: { 
        productName: 1, 
        serviceName: '$categories.A.serviceName',
        serviceImage: '$categories.A.serviceImage'
      }}
    ]);
    
    console.log('Services with images in Category A:');
    servicesWithImages.forEach(service => {
      console.log(`  ${service.productName} - ${service.serviceName}: ${service.serviceImage}`);
    });
    
  } catch (error) {
    console.error('Error testing service images:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

// Run the test
testServiceImages();
