const mongoose = require('mongoose');
const { Product } = require('../models/Product');
require('dotenv').config();

async function updatePlumberProduct() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly');
    console.log('🔌 Connected to MongoDB');

    // Find the Plumber product
    const plumberProduct = await Product.findOne({ productName: 'Plumber' });
    
    if (plumberProduct) {
      console.log('🔧 Found Plumber product, updating...');
      
      // Update to be active and non-featured
      const updatedProduct = await Product.findByIdAndUpdate(
        plumberProduct._id,
        {
          status: 'active',
          isFeatured: false,
          productImage: plumberProduct.productImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
        },
        { new: true }
      );

      console.log(`✅ Updated Plumber product: Status: ${updatedProduct.status}, Featured: ${updatedProduct.isFeatured}`);
    } else {
      console.log('❌ Plumber product not found');
    }

    // Create additional non-featured products with valid image URLs
    const additionalProducts = [
      {
        productName: 'Mobile Repair',
        productImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
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
        productImage: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400',
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
      }
    ];

    console.log('\n🚀 Creating additional non-featured products...');
    
    for (const productData of additionalProducts) {
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
    const nonFeaturedProducts = await Product.find({ isFeatured: false, status: 'active' });
    const totalProducts = await Product.find({ status: 'active' });

    console.log(`\n📊 Final Product Summary:`);
    console.log(`⭐ Featured products: ${featuredProducts.length}`);
    console.log(`📦 Non-featured products: ${nonFeaturedProducts.length}`);
    console.log(`📋 Total active products: ${totalProducts.length}`);

    if (featuredProducts.length > 0) {
      console.log('\n⭐ Featured products:');
      featuredProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.productName}`);
      });
    }

    if (nonFeaturedProducts.length > 0) {
      console.log('\n📦 Non-featured products:');
      nonFeaturedProducts.forEach((product, index) => {
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
updatePlumberProduct();
