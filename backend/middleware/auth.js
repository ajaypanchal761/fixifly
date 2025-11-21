const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('./asyncHandler');

// Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  try {
    let token;

    // Debug logging (reduced - only log errors and important info)
    // Only log for non-profile routes to reduce noise
    if (!req.url.includes('/profile') && !req.url.includes('/users/profile')) {
      console.log('[Auth]', req.method, req.url);
    }

    // SAFE authorization header check - multiple layers of protection
    const authHeader = req.headers.authorization;
    
    // Check if authHeader exists and is a string
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    if (typeof authHeader !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token format'
      });
    }

    // Check if it starts with 'Bearer' - SAFE method
    if (!authHeader.startsWith('Bearer')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token must start with Bearer'
      });
    }

    try {
      // Get token from header
      token = authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, no token found'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      // Get user from token
      const user = await User.findById(decoded.userId).select('-otp');

      if (!user) {
        console.error('[Auth] User not found for token, userId:', decoded.userId);
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      // Add user info to request
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

  } catch (error) {
    console.error('Auth middleware: Unexpected error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
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
        message: `Not authorized to access this resource. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;
    
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer')) {
      try {
        token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId).select('-otp');

        if (user) {
          req.user = {
            userId: user._id,
            role: user.role,
            user: user
          };
        }
      } catch (error) {
        console.log('Optional auth: Token verification failed, continuing without auth');
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth: Error:', error);
    next(); // Continue without authentication
  }
});

module.exports = {
  protect,
  authorize,
  optionalAuth
};