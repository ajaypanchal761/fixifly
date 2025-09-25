const mongoose = require('mongoose');
require('dotenv').config();

async function dropSlugIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the products collection
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    // List all indexes
    console.log('\n📋 Current indexes on products collection:');
    const indexes = await productsCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop the seo.slug unique index
    console.log('\n🗑️  Dropping seo.slug unique index...');
    try {
      await productsCollection.dropIndex('seo.slug_1');
      console.log('✅ Successfully dropped seo.slug_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index seo.slug_1 does not exist');
      } else {
        console.log('❌ Error dropping index:', error.message);
      }
    }

    // List indexes again to confirm
    console.log('\n📋 Updated indexes on products collection:');
    const updatedIndexes = await productsCollection.indexes();
    updatedIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
dropSlugIndex();
