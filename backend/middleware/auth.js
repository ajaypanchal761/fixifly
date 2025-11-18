const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('./asyncHandler');

// Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  try {
    let token;

    // Debug logging
    console.log('=== AUTH MIDDLEWARE START ===');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    console.log('Headers received:', {
      authorization: req.headers.authorization,
      authorizationType: typeof req.headers.authorization,
      authorizationLength: req.headers.authorization ? req.headers.authorization.length : 'undefined',
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent']
    });

    // SAFE authorization header check - multiple layers of protection
    const authHeader = req.headers.authorization;
    
    // Check if authHeader exists and is a string
    if (!authHeader) {
      console.log('Auth middleware: No authorization header provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    if (typeof authHeader !== 'string') {
      console.log('Auth middleware: Authorization header is not a string:', typeof authHeader);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token format'
      });
    }

    // Check if it starts with 'Bearer' - SAFE method
    if (!authHeader.startsWith('Bearer')) {
      console.log('Auth middleware: Authorization header does not start with Bearer');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token must start with Bearer'
      });
    }

    try {
      // Get token from header
      token = authHeader.split(' ')[1];

      if (!token) {
        console.log('Auth middleware: No token found after Bearer');
        return res.status(401).json({
          success: false,
          message: 'Not authorized, no token found'
        });
      }

      console.log('Auth middleware: Token extracted successfully, length:', token.length);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('Auth middleware: Token verified successfully, userId:', decoded.userId);

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

      console.log('Auth middleware: User found:', user.email);

      // Add user info to request
      req.user = {
        userId: user._id,
        role: user.role,
        user: user
      };

      console.log('Auth middleware: User added to request, proceeding to next middleware');
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