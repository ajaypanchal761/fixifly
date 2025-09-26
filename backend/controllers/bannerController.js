const Banner = require('../models/Banner');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const cloudinary = require('../utils/cloudinary');

// @desc    Get all banners
// @route   GET /api/admin/banners
// @access  Private (Admin)
const getAllBanners = asyncHandler(async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ order: 1, createdAt: -1 })
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    logger.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
      error: error.message
    });
  }
});

// @desc    Get active banners for public use
// @route   GET /api/banners
// @access  Public
const getActiveBanners = asyncHandler(async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select('title image order');

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    logger.error('Error fetching active banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
      error: error.message
    });
  }
});

// @desc    Create new banner
// @route   POST /api/admin/banners
// @access  Private (Admin)
const createBanner = asyncHandler(async (req, res) => {
  try {
    const { title, order } = req.body;
    
    logger.info('Creating banner', { 
      title, 
      order, 
      hasFile: !!req.file,
      fileInfo: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : null
    });
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Banner image is required'
      });
    }

    // Upload image to Cloudinary
    logger.info('Uploading to Cloudinary', { filePath: req.file.path });
    const result = await cloudinary.uploadImage(req.file.path, {
      folder: 'banners',
      resource_type: 'auto'
    });
    logger.info('Cloudinary upload successful', { public_id: result.public_id, url: result.secure_url });

    const banner = new Banner({
      title,
      image: {
        public_id: result.public_id,
        url: result.secure_url
      },
      order: order || 0,
      createdBy: req.admin?.id || null
    });

    logger.info('Saving banner to database', { bannerData: banner });
    await banner.save();
    logger.info('Banner saved successfully', { bannerId: banner._id });

    // Populate createdBy field if it exists
    if (banner.createdBy) {
      await banner.populate('createdBy', 'firstName lastName email');
    }

    logger.info(`Banner created successfully`, {
      bannerId: banner._id,
      title: banner.title,
      adminId: req.admin?.id
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    });
  } catch (error) {
    logger.error('Error creating banner:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Delete uploaded file if banner creation fails
    if (req.file && req.file.path) {
      try {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message
    });
  }
});

// @desc    Update banner
// @route   PUT /api/admin/banners/:id
// @access  Private (Admin)
const updateBanner = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { title, isActive, order } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Update fields
    if (title) banner.title = title;
    if (typeof isActive === 'boolean') banner.isActive = isActive;
    if (order !== undefined) banner.order = order;

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary
      try {
        await cloudinary.deleteImage(banner.image.public_id);
      } catch (cloudinaryError) {
        logger.error('Error deleting old image from Cloudinary:', cloudinaryError);
      }

      // Upload new image
      const result = await cloudinary.uploadImage(req.file.path, {
        folder: 'banners',
        resource_type: 'auto'
      });

      banner.image = {
        public_id: result.public_id,
        url: result.secure_url
      };
    }

    await banner.save();
    await banner.populate('createdBy', 'firstName lastName email');

    logger.info(`Banner updated successfully`, {
      bannerId: banner._id,
      title: banner.title,
      adminId: req.admin.id
    });

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });
  } catch (error) {
    logger.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message
    });
  }
});

// @desc    Delete banner
// @route   DELETE /api/admin/banners/:id
// @access  Private (Admin)
const deleteBanner = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Delete image from Cloudinary
    try {
      await cloudinary.deleteImage(banner.image.public_id);
    } catch (cloudinaryError) {
      logger.error('Error deleting image from Cloudinary:', cloudinaryError);
    }

    await Banner.findByIdAndDelete(id);

    logger.info(`Banner deleted successfully`, {
      bannerId: id,
      adminId: req.admin.id
    });

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message
    });
  }
});

// @desc    Toggle banner status
// @route   PATCH /api/admin/banners/:id/toggle
// @access  Private (Admin)
const toggleBannerStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();
    await banner.populate('createdBy', 'firstName lastName email');

    logger.info(`Banner status toggled`, {
      bannerId: banner._id,
      isActive: banner.isActive,
      adminId: req.admin.id
    });

    res.json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      data: banner
    });
  } catch (error) {
    logger.error('Error toggling banner status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle banner status',
      error: error.message
    });
  }
});

module.exports = {
  getAllBanners,
  getActiveBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
};
