const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const Review = require('../models/Review');
require('dotenv').config({ path: './config/production.env' });

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Update all vendor ratings
const updateAllVendorRatings = async () => {
  try {
    console.log('Starting vendor rating update...');
    
    const vendors = await Vendor.find({});
    console.log(`Found ${vendors.length} vendors to update`);
    
    let updatedCount = 0;
    
    for (const vendor of vendors) {
      try {
        await vendor.updateRating();
        updatedCount++;
        console.log(`Updated rating for vendor: ${vendor.vendorId} - ${vendor.firstName} ${vendor.lastName}`);
      } catch (error) {
        console.error(`Error updating rating for vendor ${vendor.vendorId}:`, error.message);
      }
    }
    
    console.log(`Successfully updated ratings for ${updatedCount} vendors`);
  } catch (error) {
    console.error('Error updating vendor ratings:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await updateAllVendorRatings();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('Script execution error:', error);
  process.exit(1);
});
