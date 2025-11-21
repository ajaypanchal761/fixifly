const express = require('express');
const { getVendorStats } = require('../controllers/vendorStatsController');
const { protectVendor } = require('../middleware/vendorAuth');

const router = express.Router();

// @route   GET /api/vendor/stats
// @desc    Get vendor statistics
// @access  Private (Vendor)
router.get('/', protectVendor, getVendorStats);

module.exports = router;



