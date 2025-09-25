const mongoose = require('mongoose');
const { Product } = require('../models/Product');
require('dotenv').config();

async function createNonFeaturedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly');
    console.log('🔌 Connected to MongoDB');

    // Create some non-featured products
    const nonFeaturedProducts = [
      {
        productName: 'Mobile Repair',
        productImage: 'https://via.placeholder.com/400x300?text=Mobile+Repair',
        serviceType: 'IT Needs',
        isFeatured: false,
        status: 'active',
        categories: {
          A: [
            {
              serviceName: 'Screen Replacement',
              description: 'Replace cracked or damaged mobile screen',
              price: 80,
              isActive: true
            }
          ],
          B: [
            {
              serviceName: 'Battery Replacement',
              description: 'Replace old or faulty mobile battery',
              price: 60,
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
        productName: 'Tablet Repair',
        productImage: 'https://via.placeholder.com/400x300?text=Tablet+Repair',
        serviceType: 'IT Needs',
        isFeatured: false,
        status: 'active',
        categories: {
          A: [
            {
              serviceName: 'Tablet Screen Fix',
              description: 'Fix tablet screen issues',
              price: 120,
              isActive: true
            }
          ],
          B: [
            {
              serviceName: 'Tablet Software Update',
              description: 'Update tablet software and optimize performance',
              price: 50,
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
        productName: 'Gaming Console Repair',
        productImage: 'https://via.placeholder.com/400x300?text=Gaming+Console',
        serviceType: 'IT Needs',
        isFeatured: false,
        status: 'active',
        categories: {
          A: [
            {
              serviceName: 'Controller Repair',
              description: 'Fix gaming console controllers',
              price: 40,
              isActive: true
            }
          ],
          B: [
            {
              serviceName: 'Console Cleaning',
              description: 'Deep clean and maintain gaming console',
              price: 80,
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

    console.log('🚀 Creating non-featured products...');
    
    for (const productData of nonFeaturedProducts) {
      try {
        // Check if product already exists
        const existingProduct = await Product.findOne({ productName: productData.productName });
        if (existingProduct) {
          console.log(`⚠️ Product "${productData.productName}" already exists, skipping...`);
          continue;
        }

        const product = await Product.create(productData);
        console.log(`✅ Created non-featured product: ${product.productName}`);
      } catch (error) {
        console.log(`❌ Failed to create product ${productData.productName}:`, error.message);
      }
    }

    // Verify the results
    const featuredProducts = await Product.find({ isFeatured: true, status: 'active' });
    const nonFeaturedProductsCount = await Product.find({ isFeatured: false, status: 'active' });
    const totalProducts = await Product.find({ status: 'active' });

    console.log(`\n📊 Product Summary:`);
    console.log(`⭐ Featured products: ${featuredProducts.length}`);
    console.log(`📦 Non-featured products: ${nonFeaturedProductsCount.length}`);
    console.log(`📋 Total active products: ${totalProducts.length}`);

    if (featuredProducts.length > 0) {
      console.log('\n⭐ Featured products:');
      featuredProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.productName}`);
      });
    }

    if (nonFeaturedProductsCount.length > 0) {
      console.log('\n📦 Non-featured products:');
      nonFeaturedProductsCount.forEach((product, index) => {
        console.log(`${index + 1}. ${product.productName}`);
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
createNonFeaturedProducts();
