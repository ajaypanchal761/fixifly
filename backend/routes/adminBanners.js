const express = require('express');
const {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
} = require('../controllers/bannerController');
const { protectAdmin, requirePermission } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/admin/banners
// @desc    Get all banners
// @access  Private (Admin with contentManagement permission)
router.get('/', protectAdmin, requirePermission('contentManagement'), getAllBanners);

// @route   POST /api/admin/banners
// @desc    Create new banner
// @access  Private (Admin with contentManagement permission)
router.post('/', protectAdmin, requirePermission('contentManagement'), upload.singleBannerImage(), createBanner);

// @route   PUT /api/admin/banners/:id
// @desc    Update banner
// @access  Private (Admin with contentManagement permission)
router.put('/:id', protectAdmin, requirePermission('contentManagement'), upload.singleBannerImage(), updateBanner);

// @route   DELETE /api/admin/banners/:id
// @desc    Delete banner
// @access  Private (Admin with contentManagement permission)
router.delete('/:id', protectAdmin, requirePermission('contentManagement'), deleteBanner);

// @route   PATCH /api/admin/banners/:id/toggle
// @desc    Toggle banner status
// @access  Private (Admin with contentManagement permission)
router.patch('/:id/toggle', protectAdmin, requirePermission('contentManagement'), toggleBannerStatus);

module.exports = router;
