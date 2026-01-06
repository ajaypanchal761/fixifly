const cloudinary = require('cloudinary');
const { logger } = require('./logger');

const cloudinaryV2 = cloudinary.v2;

/**
 * Cloudinary configuration and utility functions
 */
class CloudinaryService {
  constructor() {
    this.initialize();
  }

  /**
   * Initialize Cloudinary with credentials
   */
  initialize() {
    try {
      cloudinaryV2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });

      logger.info('Cloudinary initialized successfully', {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME
      });
    } catch (error) {
      logger.error('Failed to initialize Cloudinary', { error: error.message });
      throw error;
    }
  }

  /**
   * Upload image to Cloudinary
   * @param {Buffer|string} file - File buffer or file path
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadImage(file, options = {}) {
    try {
      const defaultOptions = {
        folder: 'fixifly/profile-images',
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto' }
        ]
      };

      const uploadOptions = { ...defaultOptions, ...options };

      logger.info('Uploading image to Cloudinary', {
        folder: uploadOptions.folder,
        resource_type: uploadOptions.resource_type
      });

      const result = await cloudinaryV2.uploader.upload(file, uploadOptions);

      logger.info('Image uploaded successfully', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        bytes: result.bytes
      });

      return {
        success: true,
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format
      };
    } catch (error) {
      logger.error('Failed to upload image to Cloudinary', {
        error: error.message,
        options: options
      });
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload image from buffer (for multer)
   * @param {Buffer} buffer - File buffer
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFromBuffer(buffer, options = {}) {
    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        logger.error('Cloudinary upload timeout', {
          timeout: '5 minutes',
          folder: options.folder || 'fixifly/products'
        });
        reject(new Error('Image upload timeout - request took too long'));
      }, 300000); // 5 minute timeout

      const uploadStream = cloudinaryV2.uploader.upload_stream(
        {
          folder: 'fixifly/products', // Default folder for products
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'auto' },
            { quality: 'auto' }
          ],
          ...options
        },
        (error, result) => {
          clearTimeout(timeout); // Clear timeout on completion

          if (error) {
            logger.error('Failed to upload from buffer', {
              error: error.message,
              http_code: error.http_code,
              name: error.name
            });
            reject(new Error(`Image upload failed: ${error.message}`));
          } else {
            logger.info('Image uploaded from buffer successfully', {
              public_id: result.public_id,
              secure_url: result.secure_url
            });
            resolve({
              success: true,
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
              format: result.format
            });
          }
        }
      );

      // Handle stream errors
      uploadStream.on('error', (error) => {
        clearTimeout(timeout);
        logger.error('Upload stream error', {
          error: error.message,
          errorType: error.name
        });
        reject(new Error(`Upload stream failed: ${error.message}`));
      });

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload banner image without cropping
   * @param {Buffer|string} file - File buffer or file path
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadBannerImage(file, options = {}) {
    try {
      const defaultOptions = {
        folder: 'fixifly/banners',
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto'
        // No transformation - keep original dimensions
      };

      const uploadOptions = { ...defaultOptions, ...options };

      logger.info('Uploading banner image to Cloudinary', {
        folder: uploadOptions.folder,
        resource_type: uploadOptions.resource_type
      });

      const result = await cloudinaryV2.uploader.upload(file, uploadOptions);

      logger.info('Banner image uploaded successfully', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        bytes: result.bytes,
        width: result.width,
        height: result.height
      });

      return {
        success: true,
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format
      };
    } catch (error) {
      logger.error('Failed to upload banner image to Cloudinary', {
        error: error.message,
        options: options
      });
      throw new Error(`Banner image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload product image from buffer
   * @param {Buffer} buffer - File buffer
   * @param {string} productName - Product name for folder organization
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadProductImage(buffer, productName = 'general', options = {}) {
    try {
      const sanitizedProductName = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      const defaultOptions = {
        folder: `fixifly/products/${sanitizedProductName}`,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          { width: 800, height: 600, crop: 'fill', gravity: 'auto' },
          { quality: 'auto' }
        ],
        ...options
      };

      logger.info('Uploading product image to Cloudinary', {
        folder: defaultOptions.folder,
        productName: productName
      });

      const result = await this.uploadFromBuffer(buffer, defaultOptions);

      logger.info('Product image uploaded successfully', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        productName: productName
      });

      return result;
    } catch (error) {
      logger.error('Failed to upload product image', {
        error: error.message,
        productName: productName
      });
      throw error;
    }
  }

  /**
   * Upload service image from buffer
   * @param {Buffer} buffer - File buffer
   * @param {string} serviceKey - Service key for folder organization
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadServiceImage(buffer, serviceKey = 'general', options = {}) {
    try {
      const sanitizedServiceKey = serviceKey.toLowerCase().replace(/[^a-z0-9]/g, '-');

      const defaultOptions = {
        folder: `fixifly/services/${sanitizedServiceKey}`,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          { width: 400, height: 300, crop: 'fill', gravity: 'auto' },
          { quality: 'auto' }
        ],
        ...options
      };

      logger.info('Uploading service image to Cloudinary', {
        folder: defaultOptions.folder,
        serviceKey: serviceKey
      });

      const result = await this.uploadFromBuffer(buffer, defaultOptions);

      logger.info('Service image uploaded successfully', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        serviceKey: serviceKey
      });

      return result;
    } catch (error) {
      logger.error('Failed to upload service image', {
        error: error.message,
        serviceKey: serviceKey
      });
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Public ID of the image
   * @returns {Promise<Object>} Delete result
   */
  async deleteImage(publicId) {
    try {
      logger.info('Deleting image from Cloudinary', { public_id: publicId });

      const result = await cloudinaryV2.uploader.destroy(publicId);

      if (result.result === 'ok') {
        logger.info('Image deleted successfully', { public_id: publicId });
        return {
          success: true,
          message: 'Image deleted successfully'
        };
      } else {
        logger.warn('Image deletion failed', {
          public_id: publicId,
          result: result.result
        });
        return {
          success: false,
          message: 'Image deletion failed'
        };
      }
    } catch (error) {
      logger.error('Failed to delete image from Cloudinary', {
        error: error.message,
        public_id: publicId
      });
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate optimized image URL
   * @param {string} publicId - Public ID of the image
   * @param {Object} transformations - Image transformations
   * @returns {string} Optimized URL
   */
  generateOptimizedUrl(publicId, transformations = {}) {
    const defaultTransformations = {
      width: 300,
      height: 300,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      fetch_format: 'auto'
    };

    const finalTransformations = { ...defaultTransformations, ...transformations };

    return cloudinaryV2.url(publicId, {
      ...finalTransformations,
      secure: true
    });
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} url - Cloudinary URL
   * @returns {string} Public ID
   */
  extractPublicId(url) {
    try {
      const matches = url.match(/\/v\d+\/(.+)\./);
      return matches ? matches[1] : null;
    } catch (error) {
      logger.error('Failed to extract public ID from URL', {
        error: error.message,
        url: url
      });
      return null;
    }
  }

  /**
   * Validate image file
   * @param {Object} file - File object
   * @returns {Object} Validation result
   */
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 20 * 1024 * 1024; // 20MB

    if (!file) {
      return {
        valid: false,
        error: 'No file provided'
      };
    }

    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 20MB'
      };
    }

    return {
      valid: true,
      error: null
    };
  }

  /**
   * Get Cloudinary account info
   * @returns {Promise<Object>} Account information
   */
  async getAccountInfo() {
    try {
      const result = await cloudinaryV2.api.ping();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Failed to get Cloudinary account info', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const cloudinaryService = new CloudinaryService();

module.exports = cloudinaryService;
