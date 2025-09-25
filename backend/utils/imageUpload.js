const cloudinaryService = require('./cloudinary');
const uploadMiddleware = require('../middleware/upload');
const { logger } = require('./logger');

/**
 * Image upload utility functions
 */
class ImageUploadService {
  constructor() {
    this.cloudinary = cloudinaryService;
    this.upload = uploadMiddleware;
  }

  /**
   * Upload profile image to Cloudinary
   * @param {Object} file - Multer file object
   * @param {string} userId - User ID for folder organization
   * @returns {Promise<Object>} Upload result
   */
  async uploadProfileImage(file, userId) {
    try {
      // Validate file
      const validation = this.cloudinary.validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      logger.info('Starting profile image upload', {
        userId: userId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype
      });

      // Upload to Cloudinary
      const uploadResult = await this.cloudinary.uploadFromBuffer(file.buffer, {
        folder: `fixifly/profile-images/${userId}`,
        public_id: `profile_${userId}_${Date.now()}`,
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto' }
        ]
      });

      logger.info('Profile image uploaded successfully', {
        userId: userId,
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url
      });

      return {
        success: true,
        data: {
          publicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url,
          imageUrl: uploadResult.secure_url,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
          format: uploadResult.format
        }
      };
    } catch (error) {
      logger.error('Failed to upload profile image', {
        userId: userId,
        error: error.message,
        fileName: file?.originalname
      });
      throw error;
    }
  }

  /**
   * Upload blog image to Cloudinary
   * @param {Object} file - Multer file object
   * @param {string} blogId - Blog ID for folder organization
   * @returns {Promise<Object>} Upload result
   */
  async uploadBlogImage(file, blogId) {
    try {
      // Validate file
      const validation = this.cloudinary.validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      logger.info('Starting blog image upload', {
        blogId: blogId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype
      });

      // Upload to Cloudinary
      const uploadResult = await this.cloudinary.uploadFromBuffer(file.buffer, {
        folder: `fixifly/blog-images/${blogId}`,
        public_id: `blog_${blogId}_${Date.now()}`,
        transformation: [
          { width: 1200, height: 630, crop: 'fill', gravity: 'auto' },
          { quality: 'auto' }
        ]
      });

      logger.info('Blog image uploaded successfully', {
        blogId: blogId,
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url
      });

      return {
        success: true,
        data: {
          publicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url,
          imageUrl: uploadResult.secure_url,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
          format: uploadResult.format
        }
      };
    } catch (error) {
      logger.error('Failed to upload blog image', {
        blogId: blogId,
        error: error.message,
        fileName: file?.originalname
      });
      throw error;
    }
  }

  /**
   * Delete profile image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {string} userId - User ID for logging
   * @returns {Promise<Object>} Delete result
   */
  async deleteProfileImage(publicId, userId) {
    try {
      if (!publicId) {
        throw new Error('Public ID is required for image deletion');
      }

      logger.info('Starting profile image deletion', {
        userId: userId,
        publicId: publicId
      });

      const deleteResult = await this.cloudinary.deleteImage(publicId);

      if (deleteResult.success) {
        logger.info('Profile image deleted successfully', {
          userId: userId,
          publicId: publicId
        });
      } else {
        logger.warn('Profile image deletion failed', {
          userId: userId,
          publicId: publicId,
          result: deleteResult.message
        });
      }

      return deleteResult;
    } catch (error) {
      logger.error('Failed to delete profile image', {
        userId: userId,
        publicId: publicId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete blog image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {string} blogId - Blog ID for logging
   * @returns {Promise<Object>} Delete result
   */
  async deleteBlogImage(publicId, blogId) {
    try {
      if (!publicId) {
        throw new Error('Public ID is required for image deletion');
      }

      logger.info('Starting blog image deletion', {
        blogId: blogId,
        publicId: publicId
      });

      const deleteResult = await this.cloudinary.deleteImage(publicId);

      if (deleteResult.success) {
        logger.info('Blog image deleted successfully', {
          blogId: blogId,
          publicId: publicId
        });
      } else {
        logger.warn('Blog image deletion failed', {
          blogId: blogId,
          publicId: publicId,
          result: deleteResult.message
        });
      }

      return deleteResult;
    } catch (error) {
      logger.error('Failed to delete blog image', {
        blogId: blogId,
        publicId: publicId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update profile image (delete old, upload new)
   * @param {Object} file - New image file
   * @param {string} oldPublicId - Old image public ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async updateProfileImage(file, oldPublicId, userId) {
    try {
      logger.info('Starting profile image update', {
        userId: userId,
        oldPublicId: oldPublicId,
        newFileName: file.originalname
      });

      // Upload new image first
      const uploadResult = await this.uploadProfileImage(file, userId);

      // If upload successful and old image exists, delete it
      if (uploadResult.success && oldPublicId) {
        try {
          await this.deleteProfileImage(oldPublicId, userId);
        } catch (deleteError) {
          // Log error but don't fail the update
          logger.warn('Failed to delete old profile image during update', {
            userId: userId,
            oldPublicId: oldPublicId,
            error: deleteError.message
          });
        }
      }

      return uploadResult;
    } catch (error) {
      logger.error('Failed to update profile image', {
        userId: userId,
        oldPublicId: oldPublicId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate optimized image URL
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {string} Optimized URL
   */
  generateOptimizedUrl(publicId, options = {}) {
    return this.cloudinary.generateOptimizedUrl(publicId, options);
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} url - Cloudinary URL
   * @returns {string} Public ID
   */
  extractPublicId(url) {
    return this.cloudinary.extractPublicId(url);
  }

  /**
   * Get multer middleware for profile image upload
   * @returns {Function} Multer middleware
   */
  getProfileImageUploadMiddleware() {
    return this.upload.singleProfileImage();
  }

  /**
   * Get multer error handler
   * @returns {Function} Error handler middleware
   */
  getUploadErrorHandler() {
    return this.upload.handleUploadError.bind(this.upload);
  }

  /**
   * Validate uploaded file
   * @param {Object} file - File object
   * @returns {Object} Validation result
   */
  validateFile(file) {
    return this.upload.validateFile(file);
  }

  /**
   * Cleanup temporary files
   * @param {Array} files - Array of file objects
   */
  cleanupTempFiles(files) {
    this.upload.cleanupTempFiles(files);
  }

  /**
   * Get image upload statistics
   * @returns {Promise<Object>} Upload statistics
   */
  async getUploadStats() {
    try {
      const accountInfo = await this.cloudinary.getAccountInfo();
      return {
        success: true,
        data: accountInfo
      };
    } catch (error) {
      logger.error('Failed to get upload stats', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch upload multiple images
   * @param {Array} files - Array of file objects
   * @param {string} userId - User ID
   * @param {string} folder - Cloudinary folder
   * @returns {Promise<Array>} Upload results
   */
  async batchUpload(files, userId, folder = 'general') {
    try {
      logger.info('Starting batch image upload', {
        userId: userId,
        fileCount: files.length,
        folder: folder
      });

      const uploadPromises = files.map(async (file, index) => {
        try {
          const result = await this.cloudinary.uploadFromBuffer(file.buffer, {
            folder: `fixifly/${folder}/${userId}`,
            public_id: `${folder}_${userId}_${Date.now()}_${index}`,
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto' }
            ]
          });

          return {
            success: true,
            index: index,
            fileName: file.originalname,
            data: result
          };
        } catch (error) {
          logger.error('Failed to upload file in batch', {
            userId: userId,
            fileName: file.originalname,
            index: index,
            error: error.message
          });

          return {
            success: false,
            index: index,
            fileName: file.originalname,
            error: error.message
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      logger.info('Batch upload completed', {
        userId: userId,
        total: files.length,
        successful: successful.length,
        failed: failed.length
      });

      return {
        success: true,
        data: {
          total: files.length,
          successful: successful.length,
          failed: failed.length,
          results: results
        }
      };
    } catch (error) {
      logger.error('Batch upload failed', {
        userId: userId,
        error: error.message
      });
      throw error;
    }
  }
}

// Create singleton instance
const imageUploadService = new ImageUploadService();

module.exports = imageUploadService;
