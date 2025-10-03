const Vendor = require('../models/Vendor');
const VendorWallet = require('../models/VendorWallet');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

// @desc    Get vendor statistics
// @route   GET /api/vendor/stats
// @access  Private (Vendor)
const getVendorStats = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.vendor;

    // Get vendor wallet data
    const wallet = await VendorWallet.findOne({ vendorId });
    
    // Get basic vendor info
    const vendor = await Vendor.findOne({ vendorId }).select('firstName lastName email phone');

    // Calculate basic stats (you can expand this based on your needs)
    const stats = {
      totalCustomers: 0, // This would need to be calculated from bookings
      monthlyRevenue: wallet?.totalEarnings || 0,
      averageRating: 4.5, // This would need to be calculated from reviews
      totalTasks: wallet?.totalTasksCompleted || 0,
      totalEarnings: wallet?.totalEarnings || 0,
      currentBalance: wallet?.currentBalance || 0,
      totalPenalties: wallet?.totalPenalties || 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching vendor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor statistics',
      error: error.message
    });
  }
});

module.exports = {
  getVendorStats
};






















