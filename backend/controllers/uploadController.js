const { asyncHandler } = require('../middleware/asyncHandler');
const cloudinaryService = require('../utils/cloudinary');
const { logger } = require('../utils/logger');

/**
 * @desc    Upload single image to Cloudinary
 * @route   POST /api/upload/image
 * @access  Private
 */
const uploadImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    logger.info('Uploading image to Cloudinary', {
      userId: req.user?.userId,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Upload to Cloudinary with custom options
    const uploadOptions = {
      folder: 'fixifly/amc-device-photos',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'auto' },
        { quality: 'auto' }
      ],
      quality: 'auto',
      fetch_format: 'auto'
    };

    const result = await cloudinaryService.uploadFromBuffer(
      req.file.buffer, 
      uploadOptions
    );

    logger.info('Image uploaded successfully', {
      userId: req.user?.userId,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      bytes: result.bytes
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format
      }
    });

  } catch (error) {
    logger.error('Image upload failed', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

/**
 * @desc    Upload multiple images to Cloudinary
 * @route   POST /api/upload/images
 * @access  Private
 */
const uploadMultipleImages = asyncHandler(async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    logger.info('Uploading multiple images to Cloudinary', {
      userId: req.user?.userId,
      fileCount: req.files.length
    });

    const uploadPromises = req.files.map(async (file) => {
      try {
        const uploadOptions = {
          folder: 'fixifly/amc-device-photos',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'auto' },
            { quality: 'auto' }
          ],
          quality: 'auto',
          fetch_format: 'auto'
        };

        const result = await cloudinaryService.uploadFromBuffer(
          file.buffer, 
          uploadOptions
        );

        return {
          success: true,
          originalName: file.originalname,
          public_id: result.public_id,
          secure_url: result.secure_url,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format
        };
      } catch (error) {
        logger.error('Failed to upload individual image', {
          originalName: file.originalname,
          error: error.message
        });

        return {
          success: false,
          originalName: file.originalname,
          error: error.message
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    const successfulUploads = results.filter(result => result.success);
    const failedUploads = results.filter(result => !result.success);

    logger.info('Multiple images upload completed', {
      userId: req.user?.userId,
      successful: successfulUploads.length,
      failed: failedUploads.length
    });

    if (successfulUploads.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'All image uploads failed',
        errors: failedUploads
      });
    }

    res.status(200).json({
      success: true,
      message: `${successfulUploads.length} image(s) uploaded successfully`,
      data: {
        successful: successfulUploads,
        failed: failedUploads.length > 0 ? failedUploads : undefined
      }
    });

  } catch (error) {
    logger.error('Multiple images upload failed', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

/**
 * @desc    Delete image from Cloudinary
 * @route   DELETE /api/upload/image/:publicId
 * @access  Private
 */
const deleteImage = asyncHandler(async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    logger.info('Deleting image from Cloudinary', {
      userId: req.user?.userId,
      publicId: publicId
    });

    const result = await cloudinaryService.deleteImage(publicId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to delete image'
      });
    }

  } catch (error) {
    logger.error('Image deletion failed', {
      userId: req.user?.userId,
      publicId: req.params.publicId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
});

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage
};
