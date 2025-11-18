const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/asyncHandler');
const imageUploadService = require('../utils/imageUpload');
const { logger } = require('../utils/logger');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const user = await User.findById(userId).select('-otp -__v');

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
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { name, email, address, preferences, profileImage } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic information
    if (name !== undefined) {
      user.name = name.trim();
    }

    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }

      // Check if email is already taken by another user
      if (email) {
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
    }

    // Update address information
    if (address !== undefined) {
      user.address = {
        street: address.street || user.address?.street || '',
        city: address.city || user.address?.city || '',
        state: address.state || user.address?.state || '',
        pincode: address.pincode || user.address?.pincode || '',
        landmark: address.landmark || user.address?.landmark || ''
      };
    }

    // Update preferences
    if (preferences !== undefined) {
      user.preferences = {
        notifications: {
          email: preferences.notifications?.email ?? user.preferences?.notifications?.email ?? true,
          sms: preferences.notifications?.sms ?? user.preferences?.notifications?.sms ?? true,
          push: preferences.notifications?.push ?? user.preferences?.notifications?.push ?? true
        },
        language: preferences.language || user.preferences?.language || 'en'
      };
    }

    // Update profile image
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
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

// @desc    Upload profile image
// @route   POST /api/users/profile/image
// @access  Private
const uploadProfileImage = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info('Starting profile image upload', {
      userId: userId,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

    // Upload image to Cloudinary
    const uploadResult = await imageUploadService.uploadProfileImage(req.file, userId);

    if (uploadResult.success) {
      // Delete old profile image from Cloudinary if exists
      if (user.profileImage) {
        try {
          const oldPublicId = imageUploadService.extractPublicId(user.profileImage);
          if (oldPublicId) {
            await imageUploadService.deleteProfileImage(oldPublicId, userId);
          }
        } catch (deleteError) {
          logger.warn('Failed to delete old profile image', {
            userId: userId,
            oldImageUrl: user.profileImage,
            error: deleteError.message
          });
        }
      }

      // Update user profile image with Cloudinary URL
      user.profileImage = uploadResult.data.secureUrl;
      await user.save();

      logger.info('Profile image uploaded successfully', {
        userId: userId,
        newImageUrl: user.profileImage
      });

      res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          profileImage: user.profileImage,
          imageUrl: user.profileImage,
          publicId: uploadResult.data.publicId
        }
      });
    } else {
      throw new Error('Failed to upload image to Cloudinary');
    }

  } catch (error) {
    logger.error('Upload Profile Image Error:', {
      userId: userId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile image. Please try again.'
    });
  }
});

// @desc    Delete profile image
// @route   DELETE /api/users/profile/image
// @access  Private
const deleteProfileImage = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete image from Cloudinary if exists
    if (user.profileImage) {
      try {
        const publicId = imageUploadService.extractPublicId(user.profileImage);
        if (publicId) {
          const deleteResult = await imageUploadService.deleteProfileImage(publicId, userId);
          
          if (!deleteResult.success) {
            logger.warn('Failed to delete image from Cloudinary', {
              userId: userId,
              publicId: publicId,
              imageUrl: user.profileImage
            });
          }
        }
      } catch (deleteError) {
        logger.error('Error deleting image from Cloudinary', {
          userId: userId,
          imageUrl: user.profileImage,
          error: deleteError.message
        });
      }
    }

    // Remove profile image reference from user
    user.profileImage = null;
    await user.save();

    logger.info('Profile image deleted successfully', {
      userId: userId
    });

    res.status(200).json({
      success: true,
      message: 'Profile image deleted successfully'
    });

  } catch (error) {
    logger.error('Delete Profile Image Error:', {
      userId: userId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile image. Please try again.'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const user = await User.findById(userId).select('stats');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      stats: user.stats
    }
  });
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updateUserPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { notifications, language } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    if (notifications !== undefined) {
      user.preferences.notifications = {
        email: notifications.email ?? user.preferences.notifications.email,
        sms: notifications.sms ?? user.preferences.notifications.sms,
        push: notifications.push ?? user.preferences.notifications.push
      };
    }

    if (language !== undefined) {
      user.preferences.language = language;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update Preferences Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences. Please try again.'
    });
  }
});

// @desc    Deactivate user account
// @route   PUT /api/users/deactivate
// @access  Private
const deactivateAccount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account. Please try again.'
    });
  }
});

// @desc    Reactivate user account
// @route   PUT /api/users/reactivate
// @access  Private
const reactivateAccount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account reactivated successfully'
    });

  } catch (error) {
    console.error('Reactivate Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate account. Please try again.'
    });
  }
});

// @desc    Change phone number
// @route   POST /api/users/change-phone
// @access  Private
const changePhoneNumber = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { newPhone, otp } = req.body;

  // Validate phone number
  if (!newPhone) {
    return res.status(400).json({
      success: false,
      message: 'New phone number is required'
    });
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = newPhone.replace(/\D/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit Indian phone number'
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if new phone number is already taken
    const existingUser = await User.findOne({ 
      phone: `+91${cleanPhone}`,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already registered with another account'
      });
    }

    // Verify OTP if provided
    if (otp) {
      const isValidOTP = user.verifyOTP(otp);
      
      if (!isValidOTP) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please try again.'
        });
      }

      // Update phone number and clear OTP
      user.phone = `+91${cleanPhone}`;
      user.isPhoneVerified = true;
      user.clearOTP();
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Phone number changed successfully',
        data: {
          phone: user.formattedPhone
        }
      });
    } else {
      // Generate and send OTP for new phone number
      const otp = user.generateOTP();
      await user.save();

      // Here you would send OTP to the new phone number
      // For now, we'll just return the OTP in development
      res.status(200).json({
        success: true,
        message: 'OTP sent to new phone number',
        data: {
          phone: `+91 ${cleanPhone}`,
          otp: process.env.NODE_ENV === 'development' ? otp : undefined
        }
      });
    }

  } catch (error) {
    console.error('Change Phone Number Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change phone number. Please try again.'
    });
  }
});

// @desc    Get user activity log
// @route   GET /api/users/activity
// @access  Private
const getUserActivity = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 10 } = req.query;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For now, return basic activity info
    // In a real application, you would have a separate Activity model
    const activity = [
      {
        id: 1,
        type: 'login',
        description: 'Logged in successfully',
        timestamp: user.stats.lastLoginAt || user.updatedAt,
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      },
      {
        id: 2,
        type: 'profile_update',
        description: 'Profile updated',
        timestamp: user.updatedAt,
        metadata: {}
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        activity,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: activity.length
        }
      }
    });

  } catch (error) {
    console.error('Get User Activity Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity. Please try again.'
    });
  }
});

// @desc    Export user data
// @route   GET /api/users/export
// @access  Private
const exportUserData = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId).select('-otp -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare user data for export
    const exportData = {
      personalInfo: {
        name: user.name,
        email: user.email,
        phone: user.formattedPhone,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      address: user.address,
      preferences: user.preferences,
      stats: user.stats,
      exportDate: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'User data exported successfully',
      data: exportData
    });

  } catch (error) {
    console.error('Export User Data Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export user data. Please try again.'
    });
  }
});

// @desc    Save FCM token for web push notifications
// @route   POST /api/users/save-fcm-token
// @access  Private
const saveFCMToken = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { token, platform } = req.body;

  logger.info('📱 FCM Token Save Request (Web)', {
    requestId: req.requestId,
    userId,
    platform: platform || 'web',
    tokenLength: token?.length || 0,
    tokenPreview: token ? token.substring(0, 30) + '...' : 'missing'
  });

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    logger.warn('FCM token validation failed - token missing or invalid', {
      requestId: req.requestId,
      userId,
      hasToken: !!token,
      tokenType: typeof token
    });
    return res.status(400).json({
      success: false,
      message: 'FCM token is required'
    });
  }

  try {
    logger.debug('Step 1: Fetching user from database', {
      requestId: req.requestId,
      userId
    });

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('User not found for FCM token save', {
        requestId: req.requestId,
        userId
      });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.debug('Step 2: User found, checking existing FCM tokens', {
      requestId: req.requestId,
      userId,
      existingTokenCount: user.fcmTokens?.length || 0
    });

    // Add token to fcmTokens array if not already present
    // Limit to maximum 10 tokens per user
    const maxTokens = 10;
    if (!user.fcmTokens || !Array.isArray(user.fcmTokens)) {
      logger.debug('Step 3: Initializing empty fcmTokens array', {
        requestId: req.requestId,
        userId
      });
      user.fcmTokens = [];
    }

    const beforeCount = user.fcmTokens.length;
    const tokenExists = user.fcmTokens.includes(token);

    // Remove token if it already exists (to avoid duplicates)
    user.fcmTokens = user.fcmTokens.filter(t => t !== token);
    
    logger.debug('Step 4: Token deduplication', {
      requestId: req.requestId,
      userId,
      tokenExists,
      beforeCount,
      afterDedupCount: user.fcmTokens.length
    });
    
    // Add new token at the beginning
    user.fcmTokens.unshift(token);
    
    // Keep only the most recent tokens
    if (user.fcmTokens.length > maxTokens) {
      const removedCount = user.fcmTokens.length - maxTokens;
      logger.debug('Step 5: Token limit reached, removing oldest tokens', {
        requestId: req.requestId,
        userId,
        currentCount: user.fcmTokens.length,
        maxTokens,
        removedCount
      });
      user.fcmTokens = user.fcmTokens.slice(0, maxTokens);
    }

    logger.debug('Step 6: Saving user with updated FCM tokens', {
      requestId: req.requestId,
      userId,
      finalTokenCount: user.fcmTokens.length
    });

    await user.save();

    logger.info('✅ FCM token saved successfully (Web)', {
      requestId: req.requestId,
      userId,
      platform: platform || 'web',
      tokenCount: user.fcmTokens.length,
      tokenPreview: token.substring(0, 30) + '...',
      wasNewToken: !tokenExists
    });

    res.status(200).json({
      success: true,
      message: 'FCM token saved successfully',
      data: {
        tokenCount: user.fcmTokens.length
      }
    });
  } catch (error) {
    logger.error('❌ Error saving FCM token (Web)', {
      requestId: req.requestId,
      userId,
      error: error.message,
      stack: error.stack,
      tokenPreview: token ? token.substring(0, 30) + '...' : 'missing'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to save FCM token. Please try again.'
    });
  }
});

// @desc    Save FCM token for mobile/APK push notifications
// @route   POST /api/users/save-fcm-token-mobile
// @access  Public (no auth required, uses phone number)
const saveFCMTokenMobile = asyncHandler(async (req, res) => {
  const { token, phone, platform } = req.body;

  logger.info('📱 FCM Token Save Request (Mobile)', {
    requestId: req.requestId,
    phone: phone ? phone.replace(/\d(?=\d{4})/g, '*') : 'missing',
    platform: platform || 'mobile',
    tokenLength: token?.length || 0,
    tokenPreview: token ? token.substring(0, 30) + '...' : 'missing'
  });

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    logger.warn('FCM mobile token validation failed - token missing or invalid', {
      requestId: req.requestId,
      phone: phone ? phone.replace(/\d(?=\d{4})/g, '*') : 'missing',
      hasToken: !!token,
      tokenType: typeof token
    });
    return res.status(400).json({
      success: false,
      message: 'FCM token is required'
    });
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    logger.warn('FCM mobile token validation failed - phone missing', {
      requestId: req.requestId,
      hasPhone: !!phone
    });
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  try {
    logger.debug('Step 1: Formatting phone number', {
      requestId: req.requestId,
      originalPhone: phone
    });

    // Format phone number (add +91 if needed)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      logger.warn('Invalid phone number format', {
        requestId: req.requestId,
        cleanPhone: cleanPhone.replace(/\d(?=\d{4})/g, '*')
      });
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian phone number'
      });
    }

    const formattedPhone = `+91${cleanPhone}`;
    
    logger.debug('Step 2: Searching for user by phone number', {
      requestId: req.requestId,
      formattedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*')
    });
    
    // Find user by phone number (don't use select, just find normally)
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      logger.warn('User not found for FCM mobile token save', {
        requestId: req.requestId,
        formattedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*')
      });
      return res.status(404).json({
        success: false,
        message: 'User not found with this phone number. Please register first.'
      });
    }

    logger.debug('Step 3: User found, checking existing mobile FCM tokens', {
      requestId: req.requestId,
      userId: user._id,
      existingTokenCount: user.fcmTokenMobile?.length || 0
    });

    // Ensure fcmTokenMobile field exists (for existing users who might not have this field)
    if (!user.fcmTokenMobile || !Array.isArray(user.fcmTokenMobile)) {
      logger.debug('Step 4: Initializing empty fcmTokenMobile array', {
        requestId: req.requestId,
        userId: user._id
      });
      user.fcmTokenMobile = [];
    }

    const MAX_TOKENS = 10;
    const oldTokens = [...user.fcmTokenMobile];
    
    logger.debug('Step 5: Checking if token already exists', {
      requestId: req.requestId,
      userId: user._id,
      currentTokenCount: user.fcmTokenMobile.length,
      tokenPreview: token.substring(0, 30) + '...'
    });
    
    // Check if token already exists in fcmTokenMobile (case-sensitive exact match)
    const tokenExists = user.fcmTokenMobile.some(existingToken => existingToken === token);
    
    if (tokenExists) {
      logger.info('✅ FCM mobile token already exists', {
        requestId: req.requestId,
        userId: user._id,
        phone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
        tokenCount: user.fcmTokenMobile.length,
        platform: platform || 'mobile'
      });
      return res.status(200).json({
        success: true,
        message: 'Token already exists in database',
        updated: false,
        tokenCount: user.fcmTokenMobile.length,
        tokenInDatabase: true,
        platform: platform || 'mobile'
      });
    }

    // Also check if token exists in old fcmTokens array (for migration)
    // If found there, move it to fcmTokenMobile
    const tokenInOldArray = user.fcmTokens && user.fcmTokens.includes(token);
    if (tokenInOldArray) {
      logger.info('Token found in old fcmTokens array, migrating to fcmTokenMobile', {
        requestId: req.requestId,
        userId: user._id,
        oldArrayCount: user.fcmTokens.length
      });
      user.fcmTokens = user.fcmTokens.filter(t => t !== token);
    }

    // Add new token to fcmTokenMobile
    if (user.fcmTokenMobile.length >= MAX_TOKENS) {
      logger.debug('Step 6: Token limit reached, removing oldest token', {
        requestId: req.requestId,
        userId: user._id,
        currentCount: user.fcmTokenMobile.length,
        maxTokens: MAX_TOKENS
      });
      user.fcmTokenMobile.shift();
    }
    
    user.fcmTokenMobile.push(token);
    
    logger.debug('Step 7: Marking fcmTokenMobile as modified and saving', {
      requestId: req.requestId,
      userId: user._id,
      newTokenCount: user.fcmTokenMobile.length
    });
    
    // Mark fcmTokenMobile as modified to ensure save (CRITICAL for select: false fields)
    user.markModified('fcmTokenMobile');
    await user.save();

    // Verify the save by fetching fresh from database
    logger.debug('Step 8: Verifying token save by fetching from database', {
      requestId: req.requestId,
      userId: user._id
    });

    const updatedUser = await User.findById(user._id).select('+fcmTokenMobile');
    if (!updatedUser || !updatedUser.fcmTokenMobile.includes(token)) {
      logger.warn('Token save verification failed, retrying save', {
        requestId: req.requestId,
        userId: user._id,
        tokenFound: updatedUser?.fcmTokenMobile?.includes(token) || false
      });
      // Retry save
      if (!updatedUser.fcmTokenMobile.includes(token)) {
        if (updatedUser.fcmTokenMobile.length >= MAX_TOKENS) {
          updatedUser.fcmTokenMobile.shift();
        }
        updatedUser.fcmTokenMobile.push(token);
        updatedUser.markModified('fcmTokenMobile');
        await updatedUser.save();
        logger.info('Token save retry completed', {
          requestId: req.requestId,
          userId: user._id,
          finalTokenCount: updatedUser.fcmTokenMobile.length
        });
      }
    } else {
      logger.debug('Token save verified successfully', {
        requestId: req.requestId,
        userId: user._id,
        verifiedTokenCount: updatedUser.fcmTokenMobile.length
      });
    }

    logger.info('✅ FCM mobile token saved successfully', {
      requestId: req.requestId,
      userId: user._id,
      phone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
      platform: platform || 'mobile',
      tokenCount: user.fcmTokenMobile.length,
      previousTokenCount: oldTokens.length,
      tokenPreview: token.substring(0, 30) + '...',
      wasNewToken: !tokenExists
    });

    res.status(200).json({
      success: true,
      message: 'FCM mobile token saved successfully for mobile device',
      updated: true,
      tokenCount: user.fcmTokenMobile.length,
      previousTokenCount: oldTokens.length,
      maxTokens: MAX_TOKENS,
      devicesRegistered: user.fcmTokenMobile.length,
      platform: platform || 'mobile'
    });
  } catch (error) {
    logger.error('❌ Error saving FCM mobile token', {
      requestId: req.requestId,
      phone: phone ? phone.replace(/\d(?=\d{4})/g, '*') : 'missing',
      error: error.message,
      stack: error.stack,
      tokenPreview: token ? token.substring(0, 30) + '...' : 'missing'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to save FCM mobile token. Please try again.'
    });
  }
});

// @desc    Remove FCM token
// @route   DELETE /api/users/remove-fcm-token
// @access  Private
const removeFCMToken = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { token, platform } = req.body;

  logger.info('🗑️ FCM Token Remove Request', {
    requestId: req.requestId,
    userId,
    platform: platform || 'all',
    tokenLength: token?.length || 0,
    tokenPreview: token ? token.substring(0, 30) + '...' : 'missing'
  });

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    logger.warn('FCM token removal validation failed - token missing', {
      requestId: req.requestId,
      userId
    });
    return res.status(400).json({
      success: false,
      message: 'FCM token is required'
    });
  }

  try {
    logger.debug('Step 1: Fetching user for token removal', {
      requestId: req.requestId,
      userId
    });

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('User not found for FCM token removal', {
        requestId: req.requestId,
        userId
      });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.debug('Step 2: Checking existing tokens before removal', {
      requestId: req.requestId,
      userId,
      webTokenCount: user.fcmTokens?.length || 0,
      mobileTokenCount: user.fcmTokenMobile?.length || 0
    });

    let removed = false;
    let removedFromWeb = false;
    let removedFromMobile = false;

    // Remove from web tokens if platform is 'web' or not specified
    if (!platform || platform === 'web') {
      if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
        const beforeLength = user.fcmTokens.length;
        user.fcmTokens = user.fcmTokens.filter(t => t !== token);
        if (user.fcmTokens.length < beforeLength) {
          removed = true;
          removedFromWeb = true;
          logger.debug('Token removed from web tokens', {
            requestId: req.requestId,
            userId,
            beforeCount: beforeLength,
            afterCount: user.fcmTokens.length
          });
        }
      }
    }

    // Remove from mobile tokens if platform is 'mobile'
    if (platform === 'mobile') {
      if (user.fcmTokenMobile && Array.isArray(user.fcmTokenMobile)) {
        const beforeLength = user.fcmTokenMobile.length;
        user.fcmTokenMobile = user.fcmTokenMobile.filter(t => t !== token);
        if (user.fcmTokenMobile.length < beforeLength) {
          removed = true;
          removedFromMobile = true;
          logger.debug('Token removed from mobile tokens', {
            requestId: req.requestId,
            userId,
            beforeCount: beforeLength,
            afterCount: user.fcmTokenMobile.length
          });
        }
      }
    }

    // If platform not specified, try both
    if (!platform) {
      if (user.fcmTokenMobile && Array.isArray(user.fcmTokenMobile)) {
        const beforeLength = user.fcmTokenMobile.length;
        user.fcmTokenMobile = user.fcmTokenMobile.filter(t => t !== token);
        if (user.fcmTokenMobile.length < beforeLength) {
          removed = true;
          removedFromMobile = true;
          logger.debug('Token removed from mobile tokens (no platform specified)', {
            requestId: req.requestId,
            userId,
            beforeCount: beforeLength,
            afterCount: user.fcmTokenMobile.length
          });
        }
      }
    }

    logger.debug('Step 3: Saving user after token removal', {
      requestId: req.requestId,
      userId,
      removed,
      removedFromWeb,
      removedFromMobile
    });

    await user.save();

    logger.info('✅ FCM token removal completed', {
      requestId: req.requestId,
      userId,
      platform: platform || 'all',
      removed,
      removedFromWeb,
      removedFromMobile,
      finalWebTokenCount: user.fcmTokens?.length || 0,
      finalMobileTokenCount: user.fcmTokenMobile?.length || 0
    });

    res.status(200).json({
      success: true,
      message: removed ? 'FCM token removed successfully' : 'FCM token not found',
      data: {
        removed
      }
    });
  } catch (error) {
    logger.error('❌ Error removing FCM token', {
      requestId: req.requestId,
      userId,
      error: error.message,
      stack: error.stack,
      tokenPreview: token ? token.substring(0, 30) + '...' : 'missing'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to remove FCM token. Please try again.'
    });
  }
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  deleteProfileImage,
  getUserStats,
  updateUserPreferences,
  deactivateAccount,
  reactivateAccount,
  changePhoneNumber,
  getUserActivity,
  exportUserData,
  saveFCMToken,
  saveFCMTokenMobile,
  removeFCMToken
};
