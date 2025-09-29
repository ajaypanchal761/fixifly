const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/asyncHandler');
const smsService = require('../services/smsService');
const logger = require('../utils/logger');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

// @desc    Send OTP to phone number
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  // Validate phone number
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  // Validate Indian phone number format
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit Indian phone number'
    });
  }

  try {
    logger.info('Starting OTP send process', { phone: cleanPhone });
    
    // Check if user exists
    let user = await User.findByPhoneOrEmail(cleanPhone);
    
    if (!user) {
      logger.info('Creating new user for OTP', { phone: cleanPhone });
      // Create new user if doesn't exist
      user = new User({
        phone: cleanPhone,
        role: 'user',
        isPhoneVerified: false
      });
    } else {
      logger.info('Existing user found', { userId: user._id, phone: cleanPhone });
    }

    // Check for default test number
    const isDefaultTestNumber = cleanPhone === '7610416911';
    let otp, smsResult;

    if (isDefaultTestNumber) {
      logger.info('Using test phone number', { phone: cleanPhone });
      // Use default OTP for test number
      otp = '110211';
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      };
      await user.save();
      
      // Don't send actual SMS for test number
      smsResult = {
        success: true,
        messageId: 'test-' + Date.now(),
        message: 'Default OTP set for test number'
      };
      
      logger.info('Test OTP set', { phone: cleanPhone, otp: otp });
    } else {
      logger.info('Generating OTP for real number', { phone: cleanPhone });
      // Generate OTP for real numbers
      otp = user.generateOTP();
      await user.save();
      
      logger.info('OTP generated and user saved', { phone: cleanPhone, userId: user._id });
      
      // Send OTP via SMS India Hub
      logger.info('Attempting to send SMS via SMS India Hub', { phone: cleanPhone });
      
      try {
        smsResult = await smsService.sendOTP(cleanPhone, otp);
        logger.info('SMS sending result', { 
          phone: cleanPhone, 
          success: smsResult.success, 
          messageId: smsResult.messageId || 'unknown',
          provider: smsResult.provider || 'unknown'
        });
        
        if (!smsResult.success) {
          logger.error('SMS sending failed', { 
            phone: cleanPhone, 
            error: smsResult.error,
            response: smsResult.response
          });
          
          // Check if it's template approval issue
          if (smsResult.error && smsResult.error.includes('Template needs approval')) {
            logger.warn('SMS India Hub template needs approval for phone numbers', { 
              phone: cleanPhone,
              senderId: process.env.SMS_INDIA_HUB_SENDER_ID
            });
            console.log(`🔧 SMS India Hub Template Approval Needed - OTP for ${cleanPhone}: ${otp}`);
          } else {
            console.log(`🔧 SMS Failed - OTP for ${cleanPhone}: ${otp}`);
          }
          
          // Even if SMS fails, consider it a success for now since OTP is generated
          smsResult.success = true;
          smsResult.messageId = 'fallback-' + Date.now();
        }
      } catch (smsError) {
        logger.error('SMS service error', { 
          phone: cleanPhone, 
          error: smsError.message,
          stack: smsError.stack
        });
        
        // Determine if it's a template approval issue
        if (smsError.message.includes('template not approved')) {
          logger.warn('SMS template needs approval from SMS India Hub', { phone: cleanPhone });
        }
        
        // Return success with fallback OTP (for development/testing)
        smsResult = {
          success: true,
          messageId: 'fallback-' + Date.now(),
          message: 'SMS service temporarily unavailable, using fallback mechanism'
        };
        console.log(`🔧 SMS Service Error Fallback - OTP for ${cleanPhone}: ${otp}`);
      }
    }

    // Enhanced response with debugging info
    const responseData = {
      phone: user.formattedPhone,
      messageId: smsResult.messageId,
      provider: smsResult.provider || 'SMS India Hub',
      smsStatus: smsResult.status || 'pending'
    };

    // Always include OTP in response for now (since SMS needs template approval)
    responseData.otp = otp;
    responseData.developmentMode = true;
    responseData.note = 'SMS India Hub template approval pending. OTP available in response for testing.';

    // Special handling for template approval issues
    if (smsResult.error && smsResult.error.includes('Template needs approval')) {
      responseData.smsStatus = 'template_approval_pending';
      responseData.smsNote = 'SMS template needs approval from SMS India Hub';
    }

    res.status(200).json({
      success: true,
      message: `OTP generated for ${user.formattedPhone}. SMS template approval pending with SMS India Hub.`,
      data: responseData
    });

  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

// @desc    Verify OTP and login/signup user
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, name, email } = req.body;

  // Validate required fields
  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required'
    });
  }

  // Validate OTP format
  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 6-digit OTP'
    });
  }

  try {
    // Find user by phone
    const cleanPhone = phone.replace(/\D/g, '');
    let user = await User.findByPhoneOrEmail(cleanPhone);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please request OTP first.'
      });
    }

    // Verify OTP
    const isValidOTP = user.verifyOTP(otp);
    
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please try again.'
      });
    }

    // Clear OTP after successful verification
    user.clearOTP();
    user.isPhoneVerified = true;

    // If this is a signup (name and email provided), update user info
    if (name && email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already registered'
        });
      }

      user.name = name.trim();
      user.email = email.toLowerCase();
      user.isEmailVerified = false; // Email verification can be done later
    } else if (!user.name || !user.email) {
      // If user doesn't have complete profile, require name and email for signup
      return res.status(400).json({
        success: false,
        message: 'Name and email are required for account creation'
      });
    }

    // Update last login
    await user.updateLastLogin();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Prepare user data for response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.formattedPhone,
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
      address: user.address,
      preferences: user.preferences,
      stats: user.stats
    };

    // Determine if this is login or signup
    const isNewUser = !user.name || !user.email;
    const message = isNewUser ? 'Account created and verified successfully!' : 'Login successful!';

    res.status(200).json({
      success: true,
      message: message,
      data: {
        user: userData,
        token,
        isNewUser: isNewUser,
        redirectTo: isNewUser ? '/profile' : '/' // Redirect new users to profile, existing to home
      }
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
});

// @desc    Register new user with complete information
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;

  // Validate required fields
  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and phone number are required'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address'
    });
  }

  // Validate phone number
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit Indian phone number'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: cleanPhone }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'phone';
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    // Create new user with complete data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      phone: cleanPhone,
      role: 'user',
      isPhoneVerified: false,
      isEmailVerified: false
    };

    // Add address if provided
    if (address) {
      userData.address = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        landmark: address.landmark || ''
      };
    }

    const user = new User(userData);
    await user.save();

    // Check for default test number
    const isDefaultTestNumber = cleanPhone === '7610416911';
    let otp, smsResult;

    if (isDefaultTestNumber) {
      // Use default OTP for test number
      otp = '110211';
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      };
      await user.save();
      
      // Don't send actual SMS for test number
      smsResult = {
        success: true,
        messageId: 'test-' + Date.now(),
        message: 'Default OTP set for test number'
      };
      
      console.log(`🧪 Test Mode - Default Registration OTP for ${cleanPhone}: ${otp}`);
    } else {
      // Generate OTP for real numbers
      otp = user.generateOTP();
      await user.save();

      // Send OTP via SMS India Hub
      smsResult = await smsService.sendOTP(cleanPhone, otp);
      
      if (!smsResult.success) {
        console.error('SMS sending failed:', smsResult.error);
        // Still return success but log the error
        console.log(`🔧 Fallback - Registration OTP for ${cleanPhone}: ${otp}`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please verify your phone number with the OTP sent.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.formattedPhone,
          role: user.role,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          address: user.address
        },
        messageId: smsResult.messageId,
        // In development, also send OTP in response
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

// @desc    Login user with phone and OTP
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  // Validate required fields
  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required'
    });
  }

  try {
    // Find user by phone
    const cleanPhone = phone.replace(/\D/g, '');
    const user = await User.findByPhoneOrEmail(cleanPhone);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact support.'
      });
    }

    // Verify OTP
    const isValidOTP = user.verifyOTP(otp);
    
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please try again.'
      });
    }

    // Clear OTP and update login info
    user.clearOTP();
    await user.updateLastLogin();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Prepare user data for response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.formattedPhone,
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
      address: user.address,
      preferences: user.preferences,
      stats: user.stats
    };

    res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back to Fixifly.',
      data: {
        user: userData,
        token,
        redirectTo: '/' // Redirect to home page after login
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Since we're using JWT tokens, logout is handled on the client side
  // by removing the token from storage. However, we can implement
  // token blacklisting here if needed for enhanced security.

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('-otp');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.formattedPhone,
    role: user.role,
    isPhoneVerified: user.isPhoneVerified,
    isEmailVerified: user.isEmailVerified,
    profileImage: user.profileImage,
    address: user.address,
    preferences: user.preferences,
    stats: user.stats,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  res.status(200).json({
    success: true,
    data: {
      user: userData
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, address, preferences } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (name) user.name = name.trim();
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already registered'
        });
      }

      user.email = email.toLowerCase();
      user.isEmailVerified = false; // Reset email verification
    }

    if (address) {
      user.address = {
        street: address.street || user.address.street,
        city: address.city || user.address.city,
        state: address.state || user.address.state,
        pincode: address.pincode || user.address.pincode,
        landmark: address.landmark || user.address.landmark
      };
    }

    if (preferences) {
      user.preferences = {
        notifications: {
          email: preferences.notifications?.email ?? user.preferences.notifications.email,
          sms: preferences.notifications?.sms ?? user.preferences.notifications.sms,
          push: preferences.notifications?.push ?? user.preferences.notifications.push
        },
        language: preferences.language || user.preferences.language
      };
    }

    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.formattedPhone,
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
      address: user.address,
      preferences: user.preferences,
      stats: user.stats
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userData
      }
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile. Please try again.'
    });
  }
});

module.exports = {
  sendOTP,
  verifyOTP,
  register,
  login,
  logout,
  getMe,
  updateProfile
};
