const { Booking } = require('../models/Booking');
const VendorWallet = require('../models/VendorWallet');
const { logger } = require('../utils/logger');

class AutoRejectService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  // Start the auto-reject service
  start() {
    if (this.isRunning) {
      logger.info('Auto-reject service is already running');
      return;
    }

    this.isRunning = true;
    // Check every minute for pending assignments that need auto-rejection
    this.intervalId = setInterval(() => {
      this.checkAndAutoReject();
    }, 60000); // 60 seconds

    logger.info('Auto-reject service started - checking every minute for pending assignments');
  }

  // Stop the auto-reject service
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Auto-reject service stopped');
  }

  // Check for pending assignments and auto-reject if needed
  async checkAndAutoReject() {
    try {
      const now = new Date();
      
      // Find bookings with pending vendor response that have passed the auto-reject time
      const pendingAssignments = await Booking.find({
        'vendorResponse.status': 'pending',
        'vendor.autoRejectAt': { $lte: now },
        'vendor.vendorId': { $exists: true, $ne: null }
      });

      logger.info(`Found ${pendingAssignments.length} pending assignments to check for auto-rejection`);

      for (const booking of pendingAssignments) {
        await this.autoRejectBooking(booking);
      }

    } catch (error) {
      logger.error('Error in auto-reject check:', error);
    }
  }

  // Auto-reject a specific booking
  async autoRejectBooking(booking) {
    try {
      const vendorId = booking.vendor.vendorId;
      
      logger.info(`Auto-rejecting booking ${booking._id} for vendor ${vendorId}`);

      // Apply penalty to vendor wallet
      const wallet = await VendorWallet.findOne({ vendorId });
      
      if (wallet) {
        await wallet.addPenalty({
          caseId: booking.bookingReference || booking._id.toString(),
          type: 'auto_rejection',
          amount: 100, // ₹100 penalty for auto-rejection
          description: `Auto-rejection penalty - Task not responded within 25 minutes - ${booking.bookingReference || booking._id}`
        });

        logger.info(`Auto-rejection penalty applied to vendor ${vendorId}`, {
          vendorId,
          bookingId: booking._id,
          penaltyAmount: 100
        });
      }

      // Update booking status
      const updatedBooking = await Booking.findByIdAndUpdate(
        booking._id,
        {
          'vendorResponse.status': 'declined',
          'vendorResponse.respondedAt': new Date(),
          'vendorResponse.responseNote': 'Auto-rejected: No response within 25 minutes',
          status: 'waiting_for_engineer', // Set back to waiting for engineer
          'vendor.vendorId': null, // Remove vendor assignment
          'vendor.assignedAt': null,
          'vendor.autoRejectAt': null,
          'tracking.updatedAt': new Date()
        },
        { new: true, runValidators: true }
      );

      logger.info(`Booking ${booking._id} auto-rejected and set to waiting_for_engineer`, {
        bookingId: booking._id,
        vendorId,
        newStatus: 'waiting_for_engineer',
        penaltyApplied: true
      });

      return updatedBooking;

    } catch (error) {
      logger.error(`Error auto-rejecting booking ${booking._id}:`, error);
      throw error;
    }
  }

  // Manual trigger for testing
  async triggerAutoRejectCheck() {
    logger.info('Manual trigger for auto-reject check');
    await this.checkAndAutoReject();
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId ? 'active' : 'inactive'
    };
  }
}

// Create singleton instance
const autoRejectService = new AutoRejectService();

module.exports = autoRejectService;
