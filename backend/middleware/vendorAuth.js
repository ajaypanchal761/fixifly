const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const { asyncHandler } = require('./asyncHandler');
const { logger } = require('../utils/logger');

// @desc    Protect vendor routes
const protectVendor = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Log token for debugging (first 20 characters only for security)
      logger.info('Vendor authentication attempt', {
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'null',
        tokenLength: token ? token.length : 0,
        endpoint: req.originalUrl
      });

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get vendor from token
      const vendor = await Vendor.findById(decoded.vendorId);

      if (!vendor) {
        logger.warn('Vendor not found for token', { vendorId: decoded.vendorId });
        return res.status(401).json({
          success: false,
          message: 'Not authorized, vendor not found'
        });
      }

      // Admin approval is no longer required for basic access

      // Check if vendor is active
      if (!vendor.isActive) {
        logger.warn('Inactive vendor tried to access protected route', { vendorId: vendor._id });
        return res.status(401).json({
          success: false,
          message: 'Not authorized, account is deactivated'
        });
      }

      // Check if vendor is blocked
      if (vendor.isBlocked) {
        logger.warn('Blocked vendor tried to access protected route', { vendorId: vendor._id });
        return res.status(401).json({
          success: false,
          message: 'You are blocked by admin. Please contact support for assistance.'
        });
      }

      // Add vendor to request object
      req.vendor = {
        _id: vendor._id,
        vendorId: vendor.vendorId,
        email: vendor.email,
        role: vendor.role
      };

      next();
    } catch (error) {
      logger.error('Token verification failed', { 
        error: error.message,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'null',
        tokenLength: token ? token.length : 0,
        endpoint: req.originalUrl
      });
      
      let errorMessage = 'Not authorized, token failed';
      if (error.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token format';
      } else if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired, please login again';
      } else if (error.name === 'NotBeforeError') {
        errorMessage = 'Token not active yet';
      }
      
      return res.status(401).json({
        success: false,
        message: errorMessage,
        error: error.name
      });
    }
  }

  if (!token) {
    logger.warn('No token provided for vendor route');
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
});

// @desc    Authorize vendor roles
const authorizeVendor = (...roles) => {
  return (req, res, next) => {
    if (!req.vendor) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.vendor.role)) {
      logger.warn('Unauthorized vendor role access attempt', {
        vendorId: req.vendor.vendorId,
        role: req.vendor.role,
        requiredRoles: roles
      });
      return res.status(403).json({
        success: false,
        message: `Not authorized to access this resource. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// @desc    Optional vendor authentication
const optionalVendorAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const vendor = await Vendor.findById(decoded.vendorId);

      if (vendor && vendor.isActive && !vendor.isBlocked) {
        req.vendor = {
          _id: vendor._id,
          vendorId: vendor.vendorId,
          email: vendor.email,
          role: vendor.role
        };
      }
    } catch (error) {
      // Token is invalid, but we continue without authentication
      logger.debug('Optional vendor auth failed', { error: error.message });
    }
  }

  next();
});

// @desc    Check if vendor profile is complete
const requireCompleteProfile = asyncHandler(async (req, res, next) => {
  if (!req.vendor) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  try {
    const vendor = await Vendor.findById(req.vendor.vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (!vendor.isProfileComplete) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before accessing this feature',
        data: {
          isProfileComplete: false,
          missingFields: getMissingFields(vendor)
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Profile completion check failed', {
      error: error.message,
      vendorId: req.vendor.vendorId
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @desc    Check if vendor is approved
const requireApproval = asyncHandler(async (req, res, next) => {
  if (!req.vendor) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  try {
    const vendor = await Vendor.findById(req.vendor.vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (!vendor.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for admin approval.',
        data: {
          isApproved: false,
          status: 'pending'
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Vendor approval check failed', {
      error: error.message,
      vendorId: req.vendor.vendorId
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to get missing profile fields
const getMissingFields = (vendor) => {
  const requiredFields = [
    'firstName', 'lastName', 'email', 'phone', 'serviceCategories', 
    'experience', 'address.city', 'address.state', 'address.pincode'
  ];
  
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!vendor[parent] || !vendor[parent][child]) {
        missingFields.push(field);
      }
    } else {
      if (!vendor[field]) {
        missingFields.push(field);
      }
    }
  });
  
  return missingFields;
};

module.exports = {
  protectVendor,
  authorizeVendor,
  optionalVendorAuth,
  requireCompleteProfile,
  requireApproval
};
