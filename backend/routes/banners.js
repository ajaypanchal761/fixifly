const express = require('express');
const { getActiveBanners } = require('../controllers/bannerController');

const router = express.Router();

// @route   GET /api/banners
// @desc    Get active banners for public use
// @access  Public
router.get('/', getActiveBanners);

module.exports = router;
