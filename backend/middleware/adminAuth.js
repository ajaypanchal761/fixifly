const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { asyncHandler } = require('./asyncHandler');
const { logger } = require('../utils/logger');
const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwtUtils');

// @desc    Protect admin routes
const protectAdmin = asyncHandler(async (req, res, next) => {
  // Extract token from header
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    logger.warn('Admin access attempt without token', {
      endpoint: req.originalUrl,
      ip: req.ip
    });

    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }

  try {
    // Log token for debugging (first 20 characters only for security)
    logger.info('Admin authentication attempt', {
      tokenPrefix: token.substring(0, 20) + '...',
      tokenLength: token.length,
      endpoint: req.originalUrl
    });

    // Verify access token using JWT utils
    const decoded = verifyAccessToken(token);

    // Get admin from token
    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
      logger.warn('Admin not found for token', { 
        adminId: decoded.adminId,
        decoded: decoded 
      });
      return res.status(401).json({
        success: false,
        message: 'Not authorized, admin not found'
      });
    }

    // Check if token is blacklisted
    if (admin.isTokenBlacklisted(token)) {
      logger.warn('Blacklisted token used', { adminId: admin._id });
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is blacklisted'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      logger.warn('Inactive admin tried to access protected route', { adminId: admin._id });
      return res.status(401).json({
        success: false,
        message: 'Not authorized, account is deactivated'
      });
    }

    // Check if admin is blocked
    if (admin.isBlocked) {
      logger.warn('Blocked admin tried to access protected route', { adminId: admin._id });
      return res.status(401).json({
        success: false,
        message: 'Not authorized, account is blocked'
      });
    }

    // Check if account is locked
    if (admin.isAccountLocked()) {
      logger.warn('Locked admin account tried to access protected route', { adminId: admin._id });
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Add admin to request object (full model instance to access methods)
    req.admin = admin;

    next();
  } catch (error) {
    logger.error('Admin token verification error', {
      error: error.message,
      tokenPrefix: token.substring(0, 20) + '...',
      endpoint: req.originalUrl
    });

    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
});

// @desc    Grant access to specific admin roles
const authorizeAdmin = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, admin not found'
      });
    }

    if (!roles.includes(req.admin.role)) {
      logger.warn('Unauthorized admin role access attempt', {
        adminId: req.admin._id,
        adminRole: req.admin.role,
        requiredRoles: roles,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        message: `Admin role ${req.admin.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// @desc    Check if admin has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, admin not found'
      });
    }

    // Super admin has all permissions
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Check if admin has the required permission
    if (!req.admin.permissions[permission]) {
      logger.warn('Admin permission denied', {
        adminId: req.admin._id,
        adminRole: req.admin.role,
        requiredPermission: permission,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        message: `You don't have permission to access this resource`
      });
    }

    next();
  };
};

// @desc    Optional admin authentication - doesn't fail if no token
const optionalAdminAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findById(decoded.adminId || decoded._id);

      if (admin && admin.isActive && !admin.isBlocked && !admin.isAccountLocked()) {
        req.admin = admin;
      }
    } catch (error) {
      // Ignore token errors for optional auth
      logger.debug('Optional admin auth token error', { error: error.message });
    }
  }

  next();
});

// @desc    Check if admin is super admin
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, admin not found'
    });
  }

  if (req.admin.role !== 'super_admin') {
    logger.warn('Non-super admin tried to access super admin route', {
      adminId: req.admin._id,
      adminRole: req.admin.role,
      endpoint: req.originalUrl
    });

    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }

  next();
};

// @desc    Log admin activity
const logAdminActivity = (action, description, targetType = null) => {
  return async (req, res, next) => {
    // Store the original res.json method
    const originalJson = res.json;

    // Override res.json to log activity after response
    res.json = function(data) {
      // Call the original json method
      originalJson.call(this, data);

      // Log activity if admin is authenticated and request was successful
      if (req.admin && data.success) {
        req.admin.logActivity(
          action,
          description,
          targetType,
          req.params.id || req.body.id || null,
          req.ip,
          req.get('User-Agent')
        ).catch(error => {
          logger.error('Error logging admin activity', { error: error.message });
        });
      }
    };

    next();
  };
};

module.exports = {
  protectAdmin,
  authorizeAdmin,
  requirePermission,
  optionalAdminAuth,
  requireSuperAdmin,
  logAdminActivity
};
