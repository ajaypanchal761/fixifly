const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const defaultCategories = [
  {
    name: 'IT Needs',
    description: 'Information Technology products and services including computers, laptops, mobile phones, and related accessories',
    image: {
      url: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=IT+Needs',
      alt: 'IT Needs Category'
    },
    status: 'active',
    isVisible: true,
    isFeatured: true,
    sortOrder: 1
  },
  {
    name: 'Home Appliance',
    description: 'Home appliances and electronic devices for household use including refrigerators, washing machines, ACs, and more',
    image: {
      url: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Home+Appliance',
      alt: 'Home Appliance Category'
    },
    status: 'active',
    isVisible: true,
    isFeatured: true,
    sortOrder: 2
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly');
    console.log('Connected to MongoDB');

    // Check if categories already exist
    for (const categoryData of defaultCategories) {
      const existingCategory = await Category.findOne({ name: categoryData.name });
      
      if (!existingCategory) {
        // Create a dummy admin ID for seeding
        const dummyAdminId = new mongoose.Types.ObjectId();
        
        const category = await Category.create({
          ...categoryData,
          createdBy: dummyAdminId
        });
        console.log(`✅ Created category: ${categoryData.name}`);
      } else {
        console.log(`⚠️  Category already exists: ${categoryData.name}`);
      }
    }

    console.log('🎉 Category seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedCategories();
