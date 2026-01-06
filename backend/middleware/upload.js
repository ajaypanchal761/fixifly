const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

/**
 * Multer configuration for file uploads
 */
class UploadMiddleware {
  constructor() {
    this.setupStorage();
    this.setupFileFilter();
  }

  /**
   * Setup multer storage configuration
   */
  setupStorage() {
    // Memory storage for Cloudinary uploads
    this.memoryStorage = multer.memoryStorage();

    // Disk storage for local uploads (backup)
    this.diskStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'temp');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });

    // Disk storage for product images
    this.productStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'products');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
      }
    });
  }

  /**
   * Setup file filter for image validation
   */
  setupFileFilter() {
    this.fileFilter = (req, file, cb) => {
      // Check file type
      const allowedTypes = /jpeg|jpg|png|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        const error = new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
      }
    };
  }

  /**
   * Get multer configuration for profile image uploads
   * @param {Object} options - Configuration options
   * @returns {Object} Multer configuration
   */
  getProfileImageUpload(options = {}) {
    const defaultOptions = {
      storage: this.memoryStorage, // Use memory storage for Cloudinary
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only one file
      }
    };

    return multer({ ...defaultOptions, ...options });
  }

  /**
   * Get multer configuration for blog image uploads
   * @param {Object} options - Configuration options
   * @returns {Object} Multer configuration
   */
  getBlogImageUpload(options = {}) {
    const defaultOptions = {
      storage: this.memoryStorage, // Use memory storage for Cloudinary
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for blog images
        files: 1 // Only one file
      }
    };

    return multer({ ...defaultOptions, ...options });
  }

  /**
   * Get multer configuration for general file uploads
   * @param {Object} options - Configuration options
   * @returns {Object} Multer configuration
   */
  getGeneralUpload(options = {}) {
    const defaultOptions = {
      storage: this.diskStorage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files
      }
    };

    return multer({ ...defaultOptions, ...options });
  }

  /**
   * Middleware for single profile image upload
   */
  singleProfileImage() {
    return this.getProfileImageUpload().single('profileImage');
  }

  /**
   * Middleware for single blog image upload
   */
  singleBlogImage() {
    return this.getBlogImageUpload().single('featuredImage');
  }

  /**
   * Middleware for multiple image uploads (memory storage for Cloudinary)
   */
  multipleImages(maxCount = 5) {
    return multer({
      storage: this.memoryStorage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: maxCount
      }
    }).array('images', maxCount);
  }

  /**
   * Middleware for product image uploads (local storage)
   */
  productImages(maxCount = 1) {
    return multer({
      storage: this.productStorage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: maxCount
      }
    }).array('images', maxCount);
  }

  /**
   * Middleware for single product image upload (memory storage for Cloudinary)
   */
  singleProductImage() {
    return multer({
      storage: this.memoryStorage, // Use memory storage for Cloudinary
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only one file
      }
    }).single('productImage');
  }

  /**
   * Middleware for single banner image upload (disk storage for Cloudinary)
   */
  singleBannerImage() {
    return multer({
      storage: this.diskStorage, // Use disk storage for Cloudinary
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for banners
        files: 1 // Only one file
      }
    }).single('image');
  }

  /**
   * Middleware for product with service images upload (memory storage for Cloudinary)
   */
  productWithServiceImages() {
    const upload = multer({
      storage: this.memoryStorage, // Use memory storage for Cloudinary
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 10 // Allow up to 10 files (1 product image + up to 9 service images)
      }
    }).fields([
      { name: 'productImage', maxCount: 1 },
      { name: 'serviceImages', maxCount: 9 }
    ]);

    return (req, res, next) => {
      upload(req, res, (err) => {
        if (err) {
          logger.error('Upload middleware error:', {
            error: err.message,
            code: err.code,
            field: err.field
          });
          return this.handleUploadError(err, req, res, next);
        }

        logger.info('Upload middleware success', {
          hasFiles: !!(req.files),
          filesCount: req.files ? Object.keys(req.files).length : 0,
          productImageCount: req.files?.productImage?.length || 0,
          serviceImagesCount: req.files?.serviceImages?.length || 0
        });

        next();
      });
    };
  }

  /**
   * Middleware for mixed file uploads
   */
  mixedUpload() {
    return this.getGeneralUpload().fields([
      { name: 'profileImage', maxCount: 1 },
      { name: 'documents', maxCount: 3 }
    ]);
  }

  /**
   * Middleware for vendor registration file uploads
   */
  vendorRegistrationFiles() {
    const upload = multer({
      storage: this.diskStorage, // Use disk storage for large vendor files
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
        files: 3 // Maximum 3 files
      }
    }).fields([
      { name: 'aadhaarFront', maxCount: 1 },
      { name: 'aadhaarBack', maxCount: 1 },
      { name: 'profilePhoto', maxCount: 1 }
    ]);

    return (req, res, next) => {
      upload(req, res, (err) => {
        if (err) {
          logger.error('Vendor registration upload middleware error:', {
            error: err.message,
            code: err.code,
            field: err.field
          });
          return this.handleUploadError(err, req, res, next);
        }

        logger.info('Vendor registration upload middleware success', {
          hasFiles: !!(req.files),
          filesCount: req.files ? Object.keys(req.files).length : 0,
          aadhaarFrontCount: req.files?.aadhaarFront?.length || 0,
          aadhaarBackCount: req.files?.aadhaarBack?.length || 0,
          profilePhotoCount: req.files?.profilePhoto?.length || 0
        });

        next();
      });
    };
  }

  /**
   * Generic fields method for multiple file uploads
   */
  fields(fieldConfig) {
    const upload = multer({
      storage: this.memoryStorage, // Use memory storage for Cloudinary
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: fieldConfig.length // Maximum files based on field config
      }
    }).fields(fieldConfig);

    return (req, res, next) => {
      upload(req, res, (err) => {
        if (err) {
          logger.error('Upload middleware error:', {
            error: err.message,
            code: err.code,
            field: err.field
          });
          return this.handleUploadError(err, req, res, next);
        }

        logger.info('Upload middleware success', {
          hasFiles: !!(req.files),
          filesCount: req.files ? Object.keys(req.files).length : 0
        });

        next();
      });
    };
  }

  /**
   * Error handler for multer errors
   * @param {Error} error - Multer error
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  handleUploadError(error, req, res, next) {
    logger.error('Upload error occurred', {
      error: error.message,
      code: error.code,
      field: error.field
    });

    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 50MB.',
            error: 'FILE_TOO_LARGE'
          });

        case 'LIMIT_FILE_COUNT':
          return res.status(400).json({
            success: false,
            message: 'Too many files. Maximum 1 file allowed for profile images.',
            error: 'TOO_MANY_FILES'
          });

        case 'LIMIT_UNEXPECTED_FILE':
          return res.status(400).json({
            success: false,
            message: 'Unexpected file field.',
            error: 'UNEXPECTED_FILE_FIELD'
          });

        default:
          return res.status(400).json({
            success: false,
            message: 'File upload error occurred.',
            error: 'UPLOAD_ERROR'
          });
      }
    }

    if (error.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'INVALID_FILE_TYPE'
      });
    }

    // Pass other errors to the next error handler
    next(error);
  }

  /**
   * Cleanup temporary files
   * @param {Array} files - Array of file objects
   */
  cleanupTempFiles(files) {
    if (!files || !Array.isArray(files)) return;

    files.forEach(file => {
      if (file.path) {
        try {
          fs.unlinkSync(file.path);
          logger.info('Temporary file cleaned up', { path: file.path });
        } catch (error) {
          logger.error('Failed to cleanup temporary file', {
            path: file.path,
            error: error.message
          });
        }
      }
    });
  }

  /**
   * Validate uploaded file
   * @param {Object} file - File object
   * @returns {Object} Validation result
   */
  validateFile(file) {
    if (!file) {
      return {
        valid: false,
        error: 'No file uploaded'
      };
    }

    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit'
      };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed'
      };
    }

    return {
      valid: true,
      error: null
    };
  }
}

// Create singleton instance
const uploadMiddleware = new UploadMiddleware();

module.exports = uploadMiddleware;
