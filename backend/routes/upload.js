const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const uploadMiddleware = require('../middleware/upload');
const { protect } = require('../middleware/auth');


/**
 * @route   POST /api/upload/image
 * @desc    Upload image to Cloudinary
 * @access  Private (User)
 */
router.post('/image', 
  protect,
  uploadMiddleware.getProfileImageUpload().single('file'),
  uploadMiddleware.handleUploadError,
  uploadController.uploadImage
);

/**
 * @route   POST /api/upload/images
 * @desc    Upload multiple images to Cloudinary
 * @access  Private (User)
 */
router.post('/images', 
  protect,
  uploadMiddleware.multipleImages(5),
  uploadMiddleware.handleUploadError,
  uploadController.uploadMultipleImages
);

module.exports = router;
