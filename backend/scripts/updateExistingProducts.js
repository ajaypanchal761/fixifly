const mongoose = require('mongoose');
const { Product } = require('../models/Product');
require('dotenv').config();

async function updateExistingProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly');
    console.log('🔌 Connected to MongoDB');

    // Get all existing products
    const existingProducts = await Product.find({});
    console.log(`📊 Found ${existingProducts.length} existing products`);

    if (existingProducts.length === 0) {
      console.log('❌ No products found in database');
      return;
    }

    // Update each product to be active and featured
    for (const product of existingProducts) {
      try {
        // Update product to be active and featured
        const updatedProduct = await Product.findByIdAndUpdate(
          product._id,
          {
            status: 'active',
            isFeatured: true,
            productImage: product.productImage || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.productName)
          },
          { new: true }
        );

        console.log(`✅ Updated product: ${updatedProduct.productName} - Status: ${updatedProduct.status} - Featured: ${updatedProduct.isFeatured}`);
      } catch (error) {
        console.log(`❌ Failed to update product ${product.productName}:`, error.message);
      }
    }

    // Verify the updates
    const featuredProducts = await Product.find({ isFeatured: true, status: 'active' });
    console.log(`\n⭐ Featured products count: ${featuredProducts.length}`);
    
    if (featuredProducts.length > 0) {
      console.log('📦 Featured products:');
      featuredProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.productName} - ${product.serviceType} - Featured: ${product.isFeatured}`);
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
updateExistingProducts();
