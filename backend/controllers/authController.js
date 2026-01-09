const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/asyncHandler');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');
const { logger } = require('../utils/logger');

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
      logger.info('User not found for OTP', { phone: cleanPhone });
      return res.status(404).json({
        success: false,
        message: 'User not found. Please sign up first.'
      });
    }

    // Check if user has completed signup (has name and email)
    if (!user.name || !user.email) {
      logger.info('User has not completed signup', { userId: user._id, phone: cleanPhone });
      return res.status(400).json({
        success: false,
        message: 'Please complete your signup first. Name and email are required.'
      });
    }

    logger.info('Existing user found with completed signup', { userId: user._id, phone: cleanPhone });

    const isDefaultTestNumber = cleanPhone === '7610416911';
    let otp;
    let smsResult;

    if (isDefaultTestNumber) {
      logger.info('Detected default test number, applying static OTP', { phone: cleanPhone });

      otp = '110211';
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      };
      await user.save();

      logger.info('Static OTP assigned and user saved', { phone: cleanPhone, userId: user._id });

      smsResult = {
        success: true,
        messageId: 'test-' + Date.now(),
        provider: 'test-mode',
        message: 'Default OTP applied for test number',
        status: 'skipped',
      };

      console.log(`🧪 Test Mode - Default OTP for ${cleanPhone}: ${otp} (SMS skipped)`);
    } else {
      // Generate random OTP for all other phone numbers
      logger.info('Generating random OTP', { phone: cleanPhone });
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
          provider: smsResult.provider || 'unknown',
        });

        if (!smsResult.success) {
          logger.error('SMS sending failed', {
            phone: cleanPhone,
            error: smsResult.error,
            response: smsResult.response,
          });

          // Check if it's template approval issue
          if (smsResult.error && smsResult.error.includes('Template needs approval')) {
            logger.warn('SMS India Hub template needs approval for phone numbers', {
              phone: cleanPhone,
              senderId: process.env.SMSINDIAHUB_SENDER_ID,
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
          stack: smsError.stack,
        });

        // Determine if it's a template approval issue
        if (smsError.message.includes('template not approved')) {
          logger.warn('SMS template needs approval from SMS India Hub', { phone: cleanPhone });
        }

        // Return success with fallback OTP (for development/testing)
        smsResult = {
          success: true,
          messageId: 'fallback-' + Date.now(),
          message: 'SMS service temporarily unavailable, using fallback mechanism',
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
    logger.error('Send OTP Error:', error);

    // Check if it's a template approval issue
    if (error.message && error.message.includes('Template needs approval')) {
      // Generate and store OTP anyway for testing purposes
      logger.warn('SMS template approval needed, proceeding with fallback OTP');

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const cleanPhone = req.body.phone.replace(/\D/g, '');

      try {
        // Find user - don't create if doesn't exist
        let user = await User.findByPhoneOrEmail(cleanPhone);
        if (!user) {
          logger.error('User not found in fallback handler', { phone: cleanPhone });
          return res.status(404).json({
            success: false,
            message: 'User not found. Please sign up first.'
          });
        }

        // Check if user has completed signup
        if (!user.name || !user.email) {
          logger.error('User has not completed signup in fallback handler', { userId: user._id, phone: cleanPhone });
          return res.status(400).json({
            success: false,
            message: 'Please complete your signup first. Name and email are required.'
          });
        }

        user.otp = {
          code: otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        };
        await user.save();

        console.log(`🔧 Fallback OTP Generated - Phone: ${cleanPhone}, OTP: ${otp}`);

        res.status(200).json({
          success: true,
          message: `OTP generated for ${user.formattedPhone}. SMS template approval pending with SMS India Hub.`,
          data: {
            phone: user.formattedPhone,
            messageId: 'fallback-' + Date.now(),
            provider: 'SMS India Hub (Template Pending Approval)',
            smsStatus: 'template_approval_pending',
            otp: otp, // Include OTP in response for testing
            developmentMode: true,
            note: 'SMS India Hub template approval needed. OTP available in response for testing.',
            smsNote: 'SMS template approval required from SMS India Hub for sender ID: SMSHUB'
          }
        });
        return;
      } catch (dbError) {
        logger.error('Database error during fallback OTP generation:', dbError);
      }
    }

    // Generic error response for other issues
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Verify OTP and login/signup user
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, name, email, fcmToken, platform } = req.body;

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
    // Find user by phone - explicitly select FCM token fields
    const cleanPhone = phone.replace(/\D/g, '');
    let user = await User.findByPhoneOrEmail(cleanPhone);
    if (user) {
      // Explicitly select FCM token fields since they have select: false
      user = await User.findById(user._id).select('+fcmTokens +fcmTokenMobile');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please sign up first.'
      });
    }

    // Check if user has completed signup (has name and email)
    if (!user.name || !user.email) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your signup first. Name and email are required.'
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

    // Save FCM token if provided - detect platform and save to correct array
    if (fcmToken) {
      try {
        // Detect platform from request body first, then check headers
        const userAgent = req.headers['user-agent'] || '';
        const flutterBridge = req.headers['x-flutter-bridge'] || req.body.isFlutter;
        const detectedPlatform = platform || 
          (flutterBridge ? 'mobile' : 
          (userAgent.toLowerCase().includes('wv') || 
           userAgent.toLowerCase().includes('webview') ||
           userAgent.toLowerCase().includes('mobile') || 
           userAgent.toLowerCase().includes('android') || 
           userAgent.toLowerCase().includes('ios') ? 'mobile' : 'web'));
        
        logger.info(`🔔 Platform detection (verifyOTP) - body: ${platform}, flutter: ${flutterBridge}, ua: ${userAgent.substring(0, 50)}, detected: ${detectedPlatform}`);
        logger.info(`🔔 Saving FCM token for user ${user._id} (platform: ${detectedPlatform})`);

        if (detectedPlatform === 'mobile' || detectedPlatform === 'android' || detectedPlatform === 'ios') {
          // Save to fcmTokenMobile array for mobile devices
          if (!user.fcmTokenMobile || !Array.isArray(user.fcmTokenMobile)) {
            user.fcmTokenMobile = [];
          }

          // Remove token if already exists to avoid duplicates
          user.fcmTokenMobile = user.fcmTokenMobile.filter(t => t !== fcmToken);

          // Add new token at the beginning
          user.fcmTokenMobile.unshift(fcmToken);

          // Keep only the most recent 10 tokens
          if (user.fcmTokenMobile.length > 10) {
            user.fcmTokenMobile = user.fcmTokenMobile.slice(0, 10);
          }

          user.markModified('fcmTokenMobile');

          // Use updateOne for more reliable persistence of select: false fields
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                fcmTokenMobile: user.fcmTokenMobile,
                updatedAt: new Date()
              }
            }
          );
          // Also save the document to ensure all changes are persisted
          await user.save({ validateBeforeSave: false });

          // Verify the save
          const verifyUser = await User.findById(user._id).select('+fcmTokenMobile');
          const tokenSaved = verifyUser?.fcmTokenMobile?.includes(fcmToken) || false;

          if (tokenSaved) {
            logger.info(`✅ FCM mobile token saved successfully for user ${user._id}`, {
              tokenCount: verifyUser.fcmTokenMobile.length,
              tokenExists: true
            });
          } else {
            logger.error(`❌ FCM mobile token NOT saved for user ${user._id} - verification failed`);
          }
        } else {
          // Save to fcmTokens array for web devices
          if (!user.fcmTokens || !Array.isArray(user.fcmTokens)) {
            user.fcmTokens = [];
          }

          // Remove token if already exists to avoid duplicates
          user.fcmTokens = user.fcmTokens.filter(t => t !== fcmToken);

          // Add new token at the beginning
          user.fcmTokens.unshift(fcmToken);

          // Keep only the most recent 10 tokens
          if (user.fcmTokens.length > 10) {
            user.fcmTokens = user.fcmTokens.slice(0, 10);
          }

          user.markModified('fcmTokens');

          // Use updateOne for more reliable persistence of select: false fields
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                fcmTokens: user.fcmTokens,
                updatedAt: new Date()
              }
            }
          );
          // Also save the document to ensure all changes are persisted
          await user.save({ validateBeforeSave: false });

          // Verify the save
          const verifyUser = await User.findById(user._id).select('+fcmTokens');
          const tokenSaved = verifyUser?.fcmTokens?.includes(fcmToken) || false;

          if (tokenSaved) {
            logger.info(`✅ FCM web token saved successfully for user ${user._id}`, {
              tokenCount: verifyUser.fcmTokens.length,
              tokenExists: true
            });
          } else {
            logger.error(`❌ FCM web token NOT saved for user ${user._id} - verification failed`);
          }
        }
      } catch (error) {
        logger.error('❌ Error saving FCM token:', error);
        // Don't fail login if FCM token saving fails
      }
    }

    // Update last login (but don't overwrite FCM tokens)
    await user.updateLastLogin();
    // Save without validation to preserve FCM tokens
    await user.save({ validateBeforeSave: false });

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
      message: 'Login successful!',
      data: {
        user: userData,
        token,
        redirectTo: '/' // Redirect to home page after login
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
  const { name, email, phone, address, fcmToken } = req.body;

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
      // If user is already verified, block registration
      if (existingUser.isPhoneVerified) {
        const field = existingUser.email === email.toLowerCase() ? 'email' : 'phone';
        return res.status(400).json({
          success: false,
          message: `User with this ${field} already exists`
        });
      }

      // If user is NOT verified, we'll update the existing record and send a new OTP
      logger.info('Updating unverified user for re-registration', { userId: existingUser._id, phone: cleanPhone });

      existingUser.name = name.trim();
      existingUser.email = email.toLowerCase();
      existingUser.phone = cleanPhone;

      if (address) {
        existingUser.address = {
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          pincode: address.pincode || '',
          landmark: address.landmark || ''
        };
      }

      // We'll proceed with this user
      var user = existingUser;
    } else {
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

      var user = new User(userData);
    }

    // Save FCM token if provided during registration
    if (fcmToken) {
      try {
        // Detect platform from request body first, then check headers
        const userAgent = req.headers['user-agent'] || '';
        const flutterBridge = req.headers['x-flutter-bridge'] || req.body.isFlutter;
        const detectedPlatform = req.body.platform || 
          (flutterBridge ? 'mobile' : 
          (userAgent.toLowerCase().includes('wv') || 
           userAgent.toLowerCase().includes('webview') ||
           userAgent.toLowerCase().includes('mobile') || 
           userAgent.toLowerCase().includes('android') || 
           userAgent.toLowerCase().includes('ios') ? 'mobile' : 'web'));
        
        logger.info(`🔔 Platform detection - body: ${req.body.platform}, flutter: ${flutterBridge}, ua: ${userAgent.substring(0, 50)}, detected: ${detectedPlatform}`);
        logger.info(`🔔 Saving FCM token for user registration ${user._id || 'new'} (platform: ${detectedPlatform})`);

        if (detectedPlatform === 'mobile' || detectedPlatform === 'android' || detectedPlatform === 'ios') {
          // Save to fcmTokenMobile array for mobile devices
          if (!user.fcmTokenMobile || !Array.isArray(user.fcmTokenMobile)) {
            user.fcmTokenMobile = [];
          }

          // Remove token if already exists to avoid duplicates
          user.fcmTokenMobile = user.fcmTokenMobile.filter(t => t !== fcmToken);

          // Add new token at the beginning
          user.fcmTokenMobile.unshift(fcmToken);

          // Keep only the most recent 10 tokens
          if (user.fcmTokenMobile.length > 10) {
            user.fcmTokenMobile = user.fcmTokenMobile.slice(0, 10);
          }

          user.markModified('fcmTokenMobile');
        } else {
          // Save to fcmTokens array for web devices
          if (!user.fcmTokens || !Array.isArray(user.fcmTokens)) {
            user.fcmTokens = [];
          }

          // Remove token if already exists to avoid duplicates
          user.fcmTokens = user.fcmTokens.filter(t => t !== fcmToken);

          // Add new token at the beginning
          user.fcmTokens.unshift(fcmToken);

          // Keep only the most recent 10 tokens
          if (user.fcmTokens.length > 10) {
            user.fcmTokens = user.fcmTokens.slice(0, 10);
          }

          user.markModified('fcmTokens');
        }
      } catch (error) {
        logger.error('❌ Error saving FCM token during registration:', error);
        // Don't fail registration if FCM token saving fails
      }
    }

    await user.save();

    // After saving, if FCM token was provided, verify it was saved correctly
    if (fcmToken && user._id) {
      try {
        const userAgent = req.headers['user-agent'] || '';
        const platform = req.body.platform || (userAgent.toLowerCase().includes('mobile') || userAgent.toLowerCase().includes('android') || userAgent.toLowerCase().includes('ios') ? 'mobile' : 'web');

        if (platform === 'mobile' || platform === 'android' || platform === 'ios') {
          const verifyUser = await User.findById(user._id).select('+fcmTokenMobile');
          const tokenSaved = verifyUser?.fcmTokenMobile?.includes(fcmToken) || false;

          if (tokenSaved) {
            logger.info(`✅ FCM mobile token saved successfully during registration for user ${user._id}`, {
              tokenCount: verifyUser.fcmTokenMobile.length,
              tokenExists: true
            });
          } else {
            // Try to save again using updateOne
            await User.updateOne(
              { _id: user._id },
              {
                $set: {
                  fcmTokenMobile: verifyUser.fcmTokenMobile || [fcmToken],
                  updatedAt: new Date()
                }
              }
            );
            logger.info(`⚠️ FCM mobile token re-saved using updateOne for user ${user._id}`);
          }
        } else {
          const verifyUser = await User.findById(user._id).select('+fcmTokens');
          const tokenSaved = verifyUser?.fcmTokens?.includes(fcmToken) || false;

          if (tokenSaved) {
            logger.info(`✅ FCM web token saved successfully during registration for user ${user._id}`, {
              tokenCount: verifyUser.fcmTokens.length,
              tokenExists: true
            });
          } else {
            // Try to save again using updateOne
            await User.updateOne(
              { _id: user._id },
              {
                $set: {
                  fcmTokens: verifyUser.fcmTokens || [fcmToken],
                  updatedAt: new Date()
                }
              }
            );
            logger.info(`⚠️ FCM web token re-saved using updateOne for user ${user._id}`);
          }
        }
      } catch (error) {
        logger.error('❌ Error verifying FCM token save during registration:', error);
      }
    }

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
  const { phone, otp, fcmToken } = req.body;

  // Validate required fields
  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required'
    });
  }

  try {
    // Find user by phone - explicitly select FCM token fields
    const cleanPhone = phone.replace(/\D/g, '');
    let user = await User.findByPhoneOrEmail(cleanPhone);
    if (user) {
      // Explicitly select FCM token fields since they have select: false
      user = await User.findById(user._id).select('+fcmTokens +fcmTokenMobile');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please sign up first.'
      });
    }

    // Check if user has completed signup (has name and email)
    if (!user.name || !user.email) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your signup first. Name and email are required.'
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

    // Save FCM token if provided - detect platform and save to correct array
    if (fcmToken) {
      try {
        // Detect platform from request body first, then check headers
        const userAgent = req.headers['user-agent'] || '';
        const flutterBridge = req.headers['x-flutter-bridge'] || req.body.isFlutter;
        const detectedPlatform = platform || 
          (flutterBridge ? 'mobile' : 
          (userAgent.toLowerCase().includes('wv') || 
           userAgent.toLowerCase().includes('webview') ||
           userAgent.toLowerCase().includes('mobile') || 
           userAgent.toLowerCase().includes('android') || 
           userAgent.toLowerCase().includes('ios') ? 'mobile' : 'web'));
        
        logger.info(`🔔 Platform detection - body: ${platform}, flutter: ${flutterBridge}, ua: ${userAgent.substring(0, 50)}, detected: ${detectedPlatform}`);
        logger.info(`🔔 Saving FCM token for user login ${user._id} (platform: ${detectedPlatform})`);

        if (detectedPlatform === 'mobile' || detectedPlatform === 'android' || detectedPlatform === 'ios') {
          // Save to fcmTokenMobile array for mobile devices
          if (!user.fcmTokenMobile || !Array.isArray(user.fcmTokenMobile)) {
            user.fcmTokenMobile = [];
          }

          // Remove token if already exists to avoid duplicates
          user.fcmTokenMobile = user.fcmTokenMobile.filter(t => t !== fcmToken);

          // Add new token at the beginning
          user.fcmTokenMobile.unshift(fcmToken);

          // Keep only the most recent 10 tokens
          if (user.fcmTokenMobile.length > 10) {
            user.fcmTokenMobile = user.fcmTokenMobile.slice(0, 10);
          }

          user.markModified('fcmTokenMobile');

          // Use updateOne for more reliable persistence of select: false fields
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                fcmTokenMobile: user.fcmTokenMobile,
                updatedAt: new Date()
              }
            }
          );
          // Also save the document to ensure all changes are persisted
          await user.save({ validateBeforeSave: false });

          // Verify the save
          const verifyUser = await User.findById(user._id).select('+fcmTokenMobile');
          const tokenSaved = verifyUser?.fcmTokenMobile?.includes(fcmToken) || false;

          if (tokenSaved) {
            logger.info(`✅ FCM mobile token saved successfully for user login ${user._id}`, {
              tokenCount: verifyUser.fcmTokenMobile.length,
              tokenExists: true
            });
          } else {
            logger.error(`❌ FCM mobile token NOT saved for user login ${user._id} - verification failed`);
          }
        } else {
          // Save to fcmTokens array for web devices
          if (!user.fcmTokens || !Array.isArray(user.fcmTokens)) {
            user.fcmTokens = [];
          }

          // Remove token if already exists to avoid duplicates
          user.fcmTokens = user.fcmTokens.filter(t => t !== fcmToken);

          // Add new token at the beginning
          user.fcmTokens.unshift(fcmToken);

          // Keep only the most recent 10 tokens
          if (user.fcmTokens.length > 10) {
            user.fcmTokens = user.fcmTokens.slice(0, 10);
          }

          user.markModified('fcmTokens');

          // Use updateOne for more reliable persistence of select: false fields
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                fcmTokens: user.fcmTokens,
                updatedAt: new Date()
              }
            }
          );
          // Also save the document to ensure all changes are persisted
          await user.save({ validateBeforeSave: false });

          // Verify the save
          const verifyUser = await User.findById(user._id).select('+fcmTokens');
          const tokenSaved = verifyUser?.fcmTokens?.includes(fcmToken) || false;

          if (tokenSaved) {
            logger.info(`✅ FCM web token saved successfully for user login ${user._id}`, {
              tokenCount: verifyUser.fcmTokens.length,
              tokenExists: true
            });
          } else {
            logger.error(`❌ FCM web token NOT saved for user login ${user._id} - verification failed`);
          }
        }
      } catch (error) {
        logger.error('❌ Error saving FCM token during login:', error);
        // Don't fail login if FCM token saving fails
      }
    }

    // Clear OTP and update login info (but don't overwrite FCM tokens)
    user.clearOTP();
    await user.updateLastLogin();
    // Save without validation to preserve FCM tokens
    await user.save({ validateBeforeSave: false });

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
      message: 'Login successful! Welcome back to Fixfly.',
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

// @desc    Send OTP for user forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const sendForgotPasswordOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, an OTP has been sent.'
      });
    }

    // Check if user is active
    if (!user.isActive || user.isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated or blocked. Please contact support.'
      });
    }

    // Check if user has email
    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'Email not found for this account.'
      });
    }

    // Generate OTP
    const otp = user.generateForgotPasswordOTP();
    await user.save();

    logger.info('OTP generated for user forgot password', {
      email: user.email,
      userId: user._id
    });

    // Check if email service is configured
    if (!emailService.isEmailConfigured()) {
      logger.error('Email service not configured for forgot password OTP', {
        email: user.email
      });

      // Clear OTP if email service is not configured
      user.clearForgotPasswordOTP();
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please contact support.'
      });
    }

    // Send OTP via email
    try {
      logger.info('Attempting to send forgot password OTP email', {
        email: user.email,
        userName: user.name
      });

      const emailResult = await emailService.sendUserForgotPasswordOTP(user.email, otp, user.name || 'User');

      logger.info('Email service response for forgot password OTP', {
        email: user.email,
        success: emailResult?.success,
        message: emailResult?.message,
        error: emailResult?.error
      });

      // Check if email was sent successfully
      if (!emailResult || !emailResult.success) {
        const errorMessage = emailResult?.message || emailResult?.error || 'Unknown error';
        const rawError = emailResult?.error || '';

        logger.error('Failed to send forgot password OTP email', {
          emailResult: emailResult,
          email: user.email,
          userId: user._id,
          error: errorMessage,
          rawError: rawError
        });

        // Clear OTP if email failed
        user.clearForgotPasswordOTP();
        await user.save();

        // Return more specific error message - check both message and error fields
        let userMessage = emailResult?.message || 'Failed to send OTP email. Please try again later.';

        // Check raw error for specific patterns if message doesn't already contain them
        if (!userMessage.includes('Daily email sending limit') && !userMessage.includes('limit reached') && !userMessage.includes('Incorrect email password')) {
          const combinedError = (rawError + ' ' + errorMessage).toLowerCase();

          // Check for authentication/credential errors first
          if (combinedError.includes('incorrect email password') ||
            combinedError.includes('badcredentials') ||
            combinedError.includes('username and password not accepted') ||
            combinedError.includes('invalid login') ||
            combinedError.includes('authentication failed') ||
            combinedError.includes('eauth') ||
            errorMessage.includes('Incorrect email password')) {
            userMessage = 'Incorrect email password. Please contact administrator to fix SMTP configuration.';
          } else if (combinedError.includes('not configured') || combinedError.includes('smtp')) {
            userMessage = 'Email service is temporarily unavailable. Please contact support.';
          } else if (combinedError.includes('connection') || combinedError.includes('timeout')) {
            userMessage = 'Email service connection failed. Please try again later.';
          } else if (combinedError.includes('550-5.4.5') || combinedError.includes('daily user sending') ||
            combinedError.includes('quota') || combinedError.includes('rate limit')) {
            userMessage = 'Daily email sending limit exceeded. Please try again tomorrow or contact support at info@fixfly.in';
          } else if (combinedError.includes('550')) {
            userMessage = 'Email sending limit reached. Please contact support at info@fixfly.in or try again later.';
          }
        }

        return res.status(500).json({
          success: false,
          message: userMessage,
          error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
      }

      logger.info('Forgot password OTP sent to user successfully', {
        email: user.email,
        userId: user._id,
        messageId: emailResult.messageId
      });

      res.status(200).json({
        success: true,
        message: 'OTP has been sent to your email address'
      });
    } catch (emailError) {
      logger.error('Exception while sending forgot password OTP email', {
        error: emailError.message,
        stack: emailError.stack,
        email: user.email
      });

      // Clear OTP if email failed
      user.clearForgotPasswordOTP();
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again later.'
      });
    }

  } catch (error) {
    logger.error('Send forgot password OTP failed', {
      error: error.message,
      email: email
    });

    res.status(500).json({
      success: false,
      message: 'Failed to process request. Please try again.'
    });
  }
});

// @desc    Verify forgot password OTP
// @route   POST /api/auth/verify-forgot-password-otp
// @access  Public
const verifyForgotPasswordOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Validate inputs
  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required'
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
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    const isValidOTP = user.verifyForgotPasswordOTP(otp);

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please try again.'
      });
    }

    logger.info('Forgot password OTP verified successfully', {
      email: user.email,
      userId: user._id
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.'
    });

  } catch (error) {
    logger.error('Verify forgot password OTP failed', {
      error: error.message,
      email: email
    });

    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    });
  }
});

// @desc    Reset password after OTP verification
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Validate inputs
  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, OTP, and new password are required'
    });
  }

  // Validate password
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
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
    // Find user by email and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    const isValidOTP = user.verifyForgotPasswordOTP(otp);

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please try again.'
      });
    }

    // Update password - explicitly mark as modified to ensure hashing
    user.password = newPassword;
    user.markModified('password'); // Explicitly mark password as modified
    user.clearForgotPasswordOTP(); // Clear OTP after successful password reset

    // Save user - pre-save middleware will hash the password
    await user.save();

    // Verify password was saved correctly
    const verifyUser = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (verifyUser && verifyUser.password) {
      const isPasswordValid = await verifyUser.comparePassword(newPassword);
      if (!isPasswordValid) {
        logger.error('Password verification failed after reset', {
          email: user.email,
          userId: user._id
        });
        return res.status(500).json({
          success: false,
          message: 'Password reset failed. Please try again.'
        });
      }
    }

    logger.info('User password reset successfully and verified', {
      email: user.email,
      userId: user._id
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });

  } catch (error) {
    logger.error('Reset password failed', {
      error: error.message,
      email: email
    });

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
      message: 'Failed to reset password. Please try again.'
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
  updateProfile,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword
};
