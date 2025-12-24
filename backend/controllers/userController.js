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

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'FCM token is required'
    });
  }

  try {
    // Fetch user with fcmTokens field explicitly selected (CRITICAL for select: false fields)
    const user = await User.findById(userId).select('+fcmTokens');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure fcmTokens field exists
    if (!user.fcmTokens || !Array.isArray(user.fcmTokens)) {
      user.fcmTokens = [];
    }

    // Check if token already exists
    const tokenExists = user.fcmTokens.some(existingToken => existingToken === token);
    if (tokenExists) {
      return res.json({
        success: true,
        message: 'Token already exists in database',
        updated: false,
        tokenCount: user.fcmTokens.length,
        tokenInDatabase: true,
        platform: platform
      });
    }

    // Remove token if exists (to avoid duplicates)
    user.fcmTokens = user.fcmTokens.filter(t => t !== token);
    
    // Add new token at the beginning
    user.fcmTokens.unshift(token);
    
    // Keep only the most recent tokens (max 10)
    const maxTokens = 10;
    if (user.fcmTokens.length > maxTokens) {
      user.fcmTokens = user.fcmTokens.slice(0, maxTokens);
    }

    // Mark fcmTokens as modified to ensure save (CRITICAL for select: false fields)
    user.markModified('fcmTokens');
    
    // Ensure preferences exist before setting
    if (!user.preferences) {
      user.preferences = { notifications: {} };
    }
    if (!user.preferences.notifications) {
      user.preferences.notifications = {};
    }
    user.preferences.notifications.push = true;
    
    // Use updateOne for more reliable persistence of select: false fields
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          fcmTokens: user.fcmTokens,
          'preferences.notifications.push': true,
          updatedAt: new Date()
        } 
      }
    );
    
    // Also save the document to ensure all changes are persisted
    await user.save({ validateBeforeSave: false });
    logger.info('✅ FCM tokens saved successfully');

    // Verify the save by fetching fresh from database
    const updatedUser = await User.findById(userId).select('+fcmTokens');
    
    if (!updatedUser) {
      logger.error('❌ User not found after save - verification failed');
      return res.status(500).json({
        success: false,
        message: 'Failed to verify token save'
      });
    }

    const tokenSaved = updatedUser?.fcmTokens?.includes(token) || false;
    
    logger.info(`FCM token saved for user ${userId} (platform: ${platform || 'web'})`, {
      tokenCount: updatedUser.fcmTokens?.length || 0,
      tokenSaved: tokenSaved,
      tokenExists: tokenSaved
    });

    // If verification fails, retry save
    if (!tokenSaved) {
      logger.error('❌ Token save verification failed! Token not found in database after save');
      logger.info('🔄 Retrying save...');
      
      // Re-fetch and retry
      const retryUser = await User.findById(userId).select('+fcmTokens');
      if (retryUser) {
        if (!retryUser.fcmTokens || !Array.isArray(retryUser.fcmTokens)) {
          retryUser.fcmTokens = [];
        }
        
        // Remove if exists
        retryUser.fcmTokens = retryUser.fcmTokens.filter(t => t !== token);
        
        // Add token at beginning
        retryUser.fcmTokens.unshift(token);
        
        // Limit
        if (retryUser.fcmTokens.length > maxTokens) {
          retryUser.fcmTokens = retryUser.fcmTokens.slice(0, maxTokens);
        }
        
        retryUser.markModified('fcmTokens');
        // Use updateOne for more reliable persistence
        await User.updateOne(
          { _id: retryUser._id },
          { 
            $set: { 
              fcmTokens: retryUser.fcmTokens,
              updatedAt: new Date()
            } 
          }
        );
        await retryUser.save({ validateBeforeSave: false });
        
        // Verify again
        const verifyUser = await User.findById(userId).select('+fcmTokens');
        if (verifyUser && verifyUser.fcmTokens && verifyUser.fcmTokens.includes(token)) {
          logger.info('✅ Retry successful - token saved');
        } else {
          logger.error('❌ Retry also failed - token still not in database');
        }
      }
    } else {
      logger.info(`✅ Verified saved tokens: ${updatedUser.fcmTokens.length} tokens`);
    }

    res.status(200).json({
      success: true,
      message: 'FCM token saved successfully',
      data: {
        tokenCount: updatedUser.fcmTokens?.length || 0,
        tokenSaved: tokenSaved,
        platform: platform
      }
    });
  } catch (error) {
    logger.error('Error saving FCM token:', error);
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
  // Log request method and path for debugging
  logger.info('=== MOBILE FCM TOKEN SAVE REQUEST ===');
  logger.info('Request Method:', req.method);
  logger.info('Request Path:', req.path);
  logger.info('Request URL:', req.url);
  
  // Check MongoDB connection before proceeding
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    logger.error('❌ MongoDB not connected, cannot save FCM token');
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please try again later.',
      error: 'MongoDB connection not established'
    });
  }

  try {
    logger.info('Request body:', { ...req.body, token: req.body.token ? req.body.token.substring(0, 30) + '...' : 'missing' });
    logger.info('User Agent:', req.headers['user-agent'] || 'Unknown');
    
    const { token, phone, platform = 'mobile' } = req.body;

    // Validate token
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    // Validate phone number
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Clean and format phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian phone number'
      });
    }

    // Find user by phone number - explicitly select fcmTokenMobile field
    const formattedPhone = `+91${cleanPhone}`;
    const user = await User.findOne({ phone: formattedPhone }).select('+fcmTokenMobile');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this phone number. Please register first.'
      });
    }

    // Ensure fcmTokenMobile field exists (for existing users who might not have this field)
    if (!user.fcmTokenMobile || !Array.isArray(user.fcmTokenMobile)) {
      user.fcmTokenMobile = [];
    }

    logger.info('📊 Current FCM tokens before update:', {
      webTokens: user.fcmTokens?.length || 0,
      mobileTokens: user.fcmTokenMobile?.length || 0,
      mobileTokensArray: user.fcmTokenMobile
    });
    logger.info('🆕 New FCM token:', token.substring(0, 30) + '...');
    logger.info('📱 Platform:', platform);

    const oldTokens = [...user.fcmTokenMobile];
    const MAX_TOKENS = 10;
    
    // Check if token already exists in fcmTokenMobile (case-sensitive exact match)
    const tokenExists = user.fcmTokenMobile.some(existingToken => existingToken === token);
    
    if (tokenExists) {
      logger.info('ℹ️ FCM token already exists in fcmTokenMobile database');
      logger.info('📊 Current fcmTokenMobile array:', user.fcmTokenMobile);
      return res.json({
        success: true,
        message: 'Token already exists in database',
        updated: false,
        tokenCount: user.fcmTokenMobile.length,
        tokenInDatabase: true,
        platform: platform
      });
    }

    // Also check if token exists in old fcmTokens array (for migration)
    // If found there, move it to fcmTokenMobile
    const tokenInOldArray = user.fcmTokens && user.fcmTokens.includes(token);
    if (tokenInOldArray) {
      logger.info('🔄 Token found in old fcmTokens array, moving to fcmTokenMobile...');
      user.fcmTokens = user.fcmTokens.filter(t => t !== token);
      user.markModified('fcmTokens');
    }

    // Add new token to fcmTokenMobile
    logger.info('🆕 New mobile token detected, adding to fcmTokenMobile array...');
    
    // Remove token if exists to avoid duplicates (safety check - should already be checked above)
    user.fcmTokenMobile = user.fcmTokenMobile.filter(t => t !== token);
    
    // Add new token at the beginning (most recent first)
    user.fcmTokenMobile.unshift(token);
    
    // Keep only the most recent tokens
    if (user.fcmTokenMobile.length > MAX_TOKENS) {
      logger.info(`⚠️ Token limit reached (${MAX_TOKENS}), removing oldest tokens...`);
      user.fcmTokenMobile = user.fcmTokenMobile.slice(0, MAX_TOKENS);
    }
    
    logger.info(`📱 Added new mobile token to fcmTokenMobile. Total mobile tokens: ${user.fcmTokenMobile.length}/${MAX_TOKENS}`);
    
    // Mark fcmTokenMobile as modified to ensure save (CRITICAL for select: false fields)
    user.markModified('fcmTokenMobile');
    
    logger.info('💾 Saving FCM tokens to database...');
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
    logger.info('✅ FCM tokens saved successfully');
    
    // Verify the save by fetching fresh from database
    const updatedUser = await User.findById(user._id).select('+fcmTokenMobile');
    logger.info('✅ Verification - fcmTokenMobile in database:', updatedUser.fcmTokenMobile);
    
    // Remove duplicates before verification
    if (updatedUser && updatedUser.fcmTokenMobile) {
      // Remove all duplicates using Set
      const uniqueTokens = [...new Set(updatedUser.fcmTokenMobile)];
      if (uniqueTokens.length !== updatedUser.fcmTokenMobile.length) {
        logger.warn(`⚠️ Found ${updatedUser.fcmTokenMobile.length - uniqueTokens.length} duplicate tokens, removing...`);
        updatedUser.fcmTokenMobile = uniqueTokens;
        updatedUser.markModified('fcmTokenMobile');
        await User.updateOne(
          { _id: updatedUser._id },
          { 
            $set: { 
              fcmTokenMobile: updatedUser.fcmTokenMobile,
              updatedAt: new Date()
            } 
          }
        );
        await updatedUser.save({ validateBeforeSave: false });
      }
    }

    if (!updatedUser || !updatedUser.fcmTokenMobile || !updatedUser.fcmTokenMobile.includes(token)) {
      logger.error('❌ Token save verification failed! Token not found in database after save');
      // Retry save with updateOne for reliability
      if (updatedUser && updatedUser.fcmTokenMobile) {
        if (!updatedUser.fcmTokenMobile.includes(token)) {
          // Remove token if exists to avoid duplicates
          updatedUser.fcmTokenMobile = updatedUser.fcmTokenMobile.filter(t => t !== token);
          
          // Add new token at the beginning (not push)
          updatedUser.fcmTokenMobile.unshift(token);
          
          // Keep only the most recent tokens
          if (updatedUser.fcmTokenMobile.length > MAX_TOKENS) {
            updatedUser.fcmTokenMobile = updatedUser.fcmTokenMobile.slice(0, MAX_TOKENS);
          }
          
          updatedUser.markModified('fcmTokenMobile');
          // Use updateOne for more reliable persistence
          await User.updateOne(
            { _id: updatedUser._id },
            { 
              $set: { 
                fcmTokenMobile: updatedUser.fcmTokenMobile,
                updatedAt: new Date()
              } 
            }
          );
          await updatedUser.save({ validateBeforeSave: false });
          logger.info('🔄 Retried saving token');
        }
      }
    } else {
      logger.info(`✅ Verified saved tokens: ${updatedUser.fcmTokenMobile.length} tokens`);
      logger.info(`✅ Total devices registered: ${updatedUser.fcmTokenMobile.length}`);
    }

    logger.info(`✅ Mobile FCM token saved successfully to fcmTokenMobile for user ${user._id}`);

    return res.json({
      success: true,
      message: 'FCM token saved successfully for mobile device',
      updated: true,
      tokenCount: user.fcmTokenMobile.length,
      previousTokenCount: oldTokens.length,
      maxTokens: MAX_TOKENS,
      devicesRegistered: user.fcmTokenMobile.length,
      platform: platform
    });
  } catch (error) {
    logger.error('❌ Error saving mobile FCM token:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to save FCM token',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Remove FCM token
// @route   DELETE /api/users/remove-fcm-token
// @access  Private
const removeFCMToken = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { token, platform } = req.body;

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'FCM token is required'
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

    let removed = false;

    // Remove from web tokens if platform is 'web' or not specified
    if (!platform || platform === 'web') {
      if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
        const beforeLength = user.fcmTokens.length;
        user.fcmTokens = user.fcmTokens.filter(t => t !== token);
        if (user.fcmTokens.length < beforeLength) {
          removed = true;
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
        }
      }
    }

    await user.save();

    logger.info(`FCM token removed for user ${userId} (platform: ${platform || 'all'})`);

    res.status(200).json({
      success: true,
      message: removed ? 'FCM token removed successfully' : 'FCM token not found',
      data: {
        removed
      }
    });
  } catch (error) {
    logger.error('Error removing FCM token:', error);
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
