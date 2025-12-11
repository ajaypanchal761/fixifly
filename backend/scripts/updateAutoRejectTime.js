/**
 * Script to update autoRejectAt time for pending bookings
 * This updates any bookings that have autoRejectAt set to less than 25 minutes from assignedAt
 */

const mongoose = require('mongoose');
const { Booking } = require('../models/Booking');
require('dotenv').config();

const updateAutoRejectTimes = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fixfly', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to database');

    // Find all bookings with pending vendor response that have vendor assigned
    const pendingBookings = await Booking.find({
      'vendorResponse.status': 'pending',
      'vendor.vendorId': { $exists: true, $ne: null },
      'vendor.assignedAt': { $exists: true, $ne: null },
      'vendor.autoRejectAt': { $exists: true, $ne: null }
    });

    console.log(`Found ${pendingBookings.length} pending bookings to check`);

    let updatedCount = 0;
    const now = new Date();

    for (const booking of pendingBookings) {
      const assignedAt = booking.vendor.assignedAt;
      const autoRejectAt = booking.vendor.autoRejectAt;
      
      if (!assignedAt || !autoRejectAt) continue;

      // Calculate the time difference in minutes
      const timeDiffMs = autoRejectAt.getTime() - assignedAt.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);

      // If autoRejectAt is set to less than 25 minutes from assignedAt, update it
      if (timeDiffMinutes < 25) {
        // Calculate new autoRejectAt as 25 minutes from assignedAt
        const newAutoRejectAt = new Date(assignedAt.getTime() + 25 * 60 * 1000);
        
        // Only update if the new time is in the future
        if (newAutoRejectAt > now) {
          await Booking.findByIdAndUpdate(booking._id, {
            'vendor.autoRejectAt': newAutoRejectAt
          });
          
          updatedCount++;
          console.log(`✅ Updated booking ${booking.bookingReference || booking._id}: ${timeDiffMinutes.toFixed(1)} minutes → 25 minutes`);
        } else {
          console.log(`⏭️  Skipped booking ${booking.bookingReference || booking._id}: New autoRejectAt would be in the past`);
        }
      } else {
        console.log(`✓ Booking ${booking.bookingReference || booking._id}: Already set to ${timeDiffMinutes.toFixed(1)} minutes (OK)`);
      }
    }

    console.log(`\n✅ Update complete! Updated ${updatedCount} bookings to 25 minutes`);

  } catch (error) {
    console.error('❌ Error updating auto-reject times:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the script
updateAutoRejectTimes();

