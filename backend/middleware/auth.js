const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('./asyncHandler');

// Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      // Get user from token
      const user = await User.findById(decoded.userId).select('-otp');

      if (!user) {
        console.log('Auth middleware: User not found for token');
        console.log('Auth middleware: Token payload:', decoded);
        console.log('Auth middleware: Looking for userId:', decoded.userId);
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        console.log('Auth middleware: User account is deactivated');
        return res.status(401).json({
          success: false,
          message: 'Not authorized, account is deactivated'
        });
      }

      // Check if user is blocked
      if (user.isBlocked) {
        console.log('Auth middleware: User account is blocked');
        return res.status(401).json({
          success: false,
          message: 'Not authorized, account is blocked'
        });
      }

      req.user = {
        userId: user._id,
        role: user.role,
        user: user
      };

      next();
    } catch (error) {
      console.error('Auth middleware: Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    console.log('Auth middleware: No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
});

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-otp');

      if (user && user.isActive && !user.isBlocked) {
        req.user = {
          userId: user._id,
          role: user.role,
          user: user
        };
      }
    } catch (error) {
      // Ignore token errors for optional auth
      console.log('Optional auth token error:', error.message);
    }
  }

  next();
});

// Check if user is phone verified
const requirePhoneVerification = (req, res, next) => {
  if (!req.user || !req.user.user.isPhoneVerified) {
    return res.status(403).json({
      success: false,
      message: 'Phone number verification required'
    });
  }
  next();
};

// Check if user is email verified
const requireEmailVerification = (req, res, next) => {
  if (!req.user || !req.user.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required'
    });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  requirePhoneVerification,
  requireEmailVerification
};