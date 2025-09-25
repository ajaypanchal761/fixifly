const mongoose = require('mongoose');
const { Product } = require('../models/Product');
require('dotenv').config();

async function checkAndCreateFeaturedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly');
    console.log('🔌 Connected to MongoDB');

    // Check existing products
    const existingProducts = await Product.find({});
    console.log(`📊 Total products in database: ${existingProducts.length}`);
    
    if (existingProducts.length > 0) {
      console.log('📦 Existing products:');
      existingProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.productName} - Status: ${product.status} - Featured: ${product.isFeatured}`);
      });
    }

    // Check featured products
    const featuredProducts = await Product.find({ isFeatured: true, status: 'active' });
    console.log(`⭐ Featured products: ${featuredProducts.length}`);

    // If no featured products exist, create some sample ones
    if (featuredProducts.length === 0) {
      console.log('\n🚀 Creating sample featured products...');
      
      const sampleProducts = [
        {
          productName: 'Laptop Repair',
          productImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
          serviceType: 'IT Needs',
          isFeatured: true,
          status: 'active',
          categories: {
            A: [
              {
                serviceName: 'Screen Replacement',
                description: 'Replace damaged laptop screen',
                price: 150,
                isActive: true
              },
              {
                serviceName: 'Keyboard Repair',
                description: 'Fix or replace laptop keyboard',
                price: 80,
                isActive: true
              }
            ],
            B: [
              {
                serviceName: 'Motherboard Repair',
                description: 'Professional motherboard diagnostics and repair',
                price: 200,
                isActive: true
              }
            ],
            C: [],
            D: []
          },
          categoryNames: {
            A: 'Basic Services',
            B: 'Premium Services',
            C: 'Emergency Services',
            D: 'Maintenance Services'
          },
          createdBy: new mongoose.Types.ObjectId() // You might need to use an actual admin ID
        },
        {
          productName: 'Desktop Repair',
          productImage: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400',
          serviceType: 'IT Needs',
          isFeatured: true,
          status: 'active',
          categories: {
            A: [
              {
                serviceName: 'Hardware Upgrade',
                description: 'Upgrade RAM, SSD, or other components',
                price: 120,
                isActive: true
              }
            ],
            B: [
              {
                serviceName: 'Power Supply Replacement',
                description: 'Replace faulty power supply unit',
                price: 100,
                isActive: true
              }
            ],
            C: [],
            D: []
          },
          categoryNames: {
            A: 'Basic Services',
            B: 'Premium Services',
            C: 'Emergency Services',
            D: 'Maintenance Services'
          },
          createdBy: new mongoose.Types.ObjectId()
        },
        {
          productName: 'Printer Repair',
          productImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400',
          serviceType: 'IT Needs',
          isFeatured: true,
          status: 'active',
          categories: {
            A: [
              {
                serviceName: 'Ink Cartridge Replacement',
                description: 'Replace empty or faulty ink cartridges',
                price: 50,
                isActive: true
              }
            ],
            B: [
              {
                serviceName: 'Print Head Cleaning',
                description: 'Professional print head cleaning service',
                price: 75,
                isActive: true
              }
            ],
            C: [],
            D: []
          },
          categoryNames: {
            A: 'Basic Services',
            B: 'Premium Services',
            C: 'Emergency Services',
            D: 'Maintenance Services'
          },
          createdBy: new mongoose.Types.ObjectId()
        }
      ];

      for (const productData of sampleProducts) {
        try {
          const product = await Product.create(productData);
          console.log(`✅ Created featured product: ${product.productName}`);
        } catch (error) {
          console.log(`❌ Failed to create product ${productData.productName}:`, error.message);
        }
      }
    }

    // Verify featured products
    const updatedFeaturedProducts = await Product.find({ isFeatured: true, status: 'active' });
    console.log(`\n⭐ Updated featured products count: ${updatedFeaturedProducts.length}`);
    
    if (updatedFeaturedProducts.length > 0) {
      console.log('📦 Featured products:');
      updatedFeaturedProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.productName} - ${product.serviceType}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
checkAndCreateFeaturedProducts();
