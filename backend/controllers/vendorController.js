const Vendor = require('../models/Vendor');
const WalletTransaction = require('../models/WalletTransaction');
const VendorWallet = require('../models/VendorWallet');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const imageUploadService = require('../utils/imageUpload');
const RazorpayService = require('../services/razorpayService');
const emailService = require('../services/emailService');
const crypto = require('crypto');
const ONE_SIGNAL_USER_AUTH_KEY = process.env.ONESIGNAL_USER_AUTH_KEY;

// Generate JWT Token
const generateToken = (vendorId) => {
  return jwt.sign({ vendorId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// @desc    Register new vendor
// @route   POST /api/vendors/register
// @access  Public
const registerVendor = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    alternatePhone,
    fatherName,
    homePhone,
    currentAddress,
    password,
    serviceCategories,
    experience
  } = req.body;

  // Normalize phone numbers by removing leading 0 if present
  const normalizePhone = (phoneNumber) => {
    if (!phoneNumber) return phoneNumber;
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.substring(1);
    }
    return digits;
  };

  const normalizedPhone = normalizePhone(phone);
  const normalizedAlternatePhone = normalizePhone(alternatePhone);
  const normalizedHomePhone = normalizePhone(homePhone);

  // Parse serviceCategories if it's a JSON string
  let parsedServiceCategories = serviceCategories;
  if (typeof serviceCategories === 'string') {
    try {
      parsedServiceCategories = JSON.parse(serviceCategories);
    } catch (error) {
      logger.error('Failed to parse serviceCategories', { serviceCategories, error: error.message });
      return res.status(400).json({
        success: false,
        message: 'Invalid service categories format'
      });
    }
  }

  logger.info('Vendor registration request received', {
    email: req.body.email,
    phone: req.body.phone,
    serviceCategories: parsedServiceCategories,
    hasFiles: !!(req.files),
    filesCount: req.files ? Object.keys(req.files).length : 0,
    allBodyFields: Object.keys(req.body),
    bodyData: req.body
  });

  try {
    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({
      $or: [{ email }, { phone: normalizedPhone }]
    });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: existingVendor.email === email 
          ? 'Email is already registered' 
          : 'Phone number is already registered'
      });
    }

    // Handle file uploads
    let aadhaarFrontUrl = null;
    let aadhaarBackUrl = null;
    let profileImageUrl = null;

    try {
      logger.info('Processing file uploads for vendor registration', {
        hasFiles: !!(req.files),
        filesKeys: req.files ? Object.keys(req.files) : [],
        email: req.body.email
      });

      // Upload Aadhaar Front
      if (req.files && req.files.aadhaarFront && req.files.aadhaarFront[0]) {
        logger.info('Uploading Aadhaar front image');
        const aadhaarFrontResult = await imageUploadService.uploadImage(
          req.files.aadhaarFront[0],
          'vendor-documents'
        );
        aadhaarFrontUrl = aadhaarFrontResult.secure_url;
        logger.info('Aadhaar front uploaded successfully', { url: aadhaarFrontUrl });
      }

      // Upload Aadhaar Back
      if (req.files && req.files.aadhaarBack && req.files.aadhaarBack[0]) {
        logger.info('Uploading Aadhaar back image');
        const aadhaarBackResult = await imageUploadService.uploadImage(
          req.files.aadhaarBack[0],
          'vendor-documents'
        );
        aadhaarBackUrl = aadhaarBackResult.secure_url;
        logger.info('Aadhaar back uploaded successfully', { url: aadhaarBackUrl });
      }

      // Upload Profile Image
      if (req.files && req.files.profilePhoto && req.files.profilePhoto[0]) {
        logger.info('Uploading profile image');
        const profileImageResult = await imageUploadService.uploadImage(
          req.files.profilePhoto[0],
          'vendor-profiles'
        );
        profileImageUrl = profileImageResult.secure_url;
        logger.info('Profile image uploaded successfully', { url: profileImageUrl });
      }

      logger.info('All file uploads completed', {
        aadhaarFrontUrl: !!aadhaarFrontUrl,
        aadhaarBackUrl: !!aadhaarBackUrl,
        profileImageUrl: !!profileImageUrl
      });

    } catch (uploadError) {
      logger.error('File upload failed during vendor registration', {
        error: uploadError.message,
        stack: uploadError.stack,
        email: req.body.email
      });
      return res.status(400).json({
        success: false,
        message: 'File upload failed. Please try again.'
      });
    }

    // Generate unique vendor ID
    logger.info('Generating vendor ID...');
    const vendorId = await Vendor.generateVendorId();
    logger.info('Generated vendor ID:', vendorId);

    // Create vendor
    logger.info('Creating vendor with data:', {
      vendorId,
      firstName,
      lastName,
      email,
      phone,
      alternatePhone,
      fatherName,
      homePhone,
      currentAddress,
      serviceCategories: parsedServiceCategories,
      experience,
      profileImage: profileImageUrl,
      aadhaarFront: aadhaarFrontUrl,
      aadhaarBack: aadhaarBackUrl
    });

    const vendor = await Vendor.create({
      vendorId,
      firstName,
      lastName,
      email,
      phone: normalizedPhone,
      alternatePhone: normalizedAlternatePhone,
      fatherName,
      homePhone: normalizedHomePhone,
      currentAddress,
      password,
      serviceCategories: parsedServiceCategories,
      experience,
      profileImage: profileImageUrl,
      documents: {
        aadhaarFront: aadhaarFrontUrl,
        aadhaarBack: aadhaarBackUrl
      },
      isApproved: false,  // Admin approval for verification features
      isActive: true,     // Allow immediate login
      isBlocked: false
    });

    // Check if profile is complete
    vendor.checkProfileComplete();
    await vendor.save();

    // Generate token
    const token = generateToken(vendor._id);

    // Prepare vendor data for response
    const vendorData = {
      id: vendor._id,
      vendorId: vendor.vendorId,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      fullName: vendor.fullName,
      email: vendor.email,
      phone: vendor.formattedPhone,
      alternatePhone: vendor.alternatePhone,
      fatherName: vendor.fatherName,
      homePhone: vendor.homePhone,
      currentAddress: vendor.currentAddress,
      serviceCategories: vendor.serviceCategories,
      experience: vendor.experience,
      profileImage: vendor.profileImage,
      documents: vendor.documents,
      isProfileComplete: vendor.isProfileComplete,
      isApproved: vendor.isApproved,
      rating: vendor.rating,
      stats: vendor.stats
    };

    logger.info('Vendor registered successfully', {
      vendorId: vendor._id,
      email: vendor.email,
      phone: vendor.phone
    });

    res.status(201).json({
      success: true,
      message: 'Vendor registered successfully. You can now login and access your account.',
      data: {
        vendor: vendorData,
        token
      }
    });

  } catch (error) {
    logger.error('Vendor registration failed', {
      error: error.message,
      stack: error.stack,
      email: req.body.email,
      phone: req.body.phone
    });

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      logger.error('Validation errors:', { errors });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      logger.error('Duplicate key error:', { field, value: error.keyValue[field] });
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different ${field}.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

// @desc    Create verification payment order
// @route   POST /api/vendors/verification-payment
// @access  Private (Vendor)
const createVerificationPayment = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if already paid
    if (vendor.verificationPayment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Verification payment already completed'
      });
    }

    const amount = 3999 * 100; // Convert to paise
    const currency = 'INR';

    // Create Razorpay order
    const orderOptions = {
      amount: amount,
      currency: currency,
      receipt: `verification_${vendor.vendorId}_${Date.now()}`,
      notes: {
        vendorId: vendor.vendorId,
        type: 'verification_payment'
      }
    };

    const order = await RazorpayService.createOrder(orderOptions);

    // Update vendor with order ID
    vendor.verificationPayment.razorpayOrderId = order.id;
    vendor.verificationPayment.status = 'pending';
    vendor.verificationStatus = 'payment_pending';
    await vendor.save();

    logger.info('Verification payment order created', {
      vendorId: vendor.vendorId,
      orderId: order.id,
      amount: amount
    });

    res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: order.id,
        amount: amount,
        currency: currency
      }
    });

  } catch (error) {
    logger.error('Verification payment creation failed', {
      error: error.message,
      vendorId: req.vendor?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// @desc    Verify verification payment
// @route   POST /api/vendors/verify-verification-payment
// @access  Private (Vendor)
const verifyVerificationPayment = asyncHandler(async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const vendorId = req.vendor.id;

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Verify payment signature
    const isSignatureValid = RazorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update vendor verification status
    vendor.verificationPayment.razorpayPaymentId = razorpay_payment_id;
    vendor.verificationPayment.razorpaySignature = razorpay_signature;
    vendor.verificationPayment.status = 'completed';
    vendor.verificationPayment.paidAt = new Date();
    vendor.verificationStatus = 'under_review';
    vendor.verificationSubmittedAt = new Date();
    await vendor.save();

    logger.info('Verification payment verified successfully', {
      vendorId: vendor.vendorId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully. Your verification is under review.',
      data: {
        verificationStatus: vendor.verificationStatus,
        paidAt: vendor.verificationPayment.paidAt
      }
    });

  } catch (error) {
    logger.error('Verification payment verification failed', {
      error: error.message,
      vendorId: req.vendor?.id
    });

    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// @desc    Login vendor
// @route   POST /api/vendors/login
// @access  Public
const loginVendor = asyncHandler(async (req, res) => {
  const { email, password, deviceToken } = req.body;

  try {
    logger.info('Vendor login attempt', { email, hasPassword: !!password, hasDeviceToken: !!deviceToken });
    
    // Check if vendor exists and include password
    const vendor = await Vendor.findOne({ email }).select('+password');

    if (!vendor) {
      logger.info('Vendor not found for login', { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    logger.info('Vendor found for login', { 
      email: vendor.email, 
      isActive: vendor.isActive, 
      isApproved: vendor.isApproved, 
      isBlocked: vendor.isBlocked 
    });

    // Allow vendors to login without admin approval
    // Admin approval is only required for certain features, not for basic login

    // Check if vendor is active
    if (!vendor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if vendor is blocked
    if (vendor.isBlocked) {
      return res.status(401).json({
        success: false,
        message: 'You are blocked by admin. Please contact support for assistance.'
      });
    }

    // Check password
    const isPasswordValid = await vendor.comparePassword(password);
    logger.info('Password validation result', { email, isPasswordValid });

    if (!isPasswordValid) {
      logger.info('Invalid password for vendor login', { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await vendor.updateLastLogin();

    // Save FCM token if provided - only for mobile/webview devices
    if (deviceToken) {
      try {
        logger.info(`🔔 Saving FCM token for vendor ${vendor._id} (mobile/webview only)`);
        
        // Fetch vendor with fcmTokenMobile field explicitly selected
        const vendorWithTokens = await Vendor.findById(vendor._id).select('+fcmTokenMobile');
        
        // Save to fcmTokenMobile array (mobile/webview only, no web tokens)
        if (!vendorWithTokens.fcmTokenMobile || !Array.isArray(vendorWithTokens.fcmTokenMobile)) {
          vendorWithTokens.fcmTokenMobile = [];
        }
        
        // Remove token if already exists to avoid duplicates
        vendorWithTokens.fcmTokenMobile = vendorWithTokens.fcmTokenMobile.filter(t => t !== deviceToken);
        
        // Add new token at the beginning
        vendorWithTokens.fcmTokenMobile.unshift(deviceToken);
        
        // Keep only the most recent 10 tokens
        if (vendorWithTokens.fcmTokenMobile.length > 10) {
          vendorWithTokens.fcmTokenMobile = vendorWithTokens.fcmTokenMobile.slice(0, 10);
        }
        
        vendorWithTokens.markModified('fcmTokenMobile');
        vendorWithTokens.notificationSettings.pushNotifications = true;
        await vendorWithTokens.save({ validateBeforeSave: false });
        
        // Verify save
        const verifyVendor = await Vendor.findById(vendor._id).select('+fcmTokenMobile');
        logger.info(`✅ FCM mobile/webview token saved successfully for vendor ${vendor._id}`, {
          tokenCount: verifyVendor.fcmTokenMobile?.length || 0,
          tokenExists: verifyVendor.fcmTokenMobile?.includes(deviceToken) || false
        });
      } catch (error) {
        logger.error('❌ Error saving device token:', {
          error: error.message,
          stack: error.stack,
          vendorId: vendor._id
        });
        // Don't fail login if device token saving fails
      }
    } else {
      logger.info('No deviceToken provided during vendor login', {
        vendorId: vendor._id,
        email: vendor.email
      });
    }

    // Generate token
    const token = generateToken(vendor._id);

    // Get or create vendor wallet
    let vendorWallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });
    if (!vendorWallet) {
      // Temporarily bypass wallet creation due to index issue
      console.log('Skipping wallet creation for vendor:', vendor.vendorId);
      vendorWallet = {
        currentBalance: 0,
        securityDeposit: 4000,
        availableBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0
      };
    }

    // Prepare vendor data for response
    const vendorData = {
      id: vendor._id,
      vendorId: vendor.vendorId,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      fullName: vendor.fullName,
      email: vendor.email,
      phone: vendor.formattedPhone,
      serviceCategories: vendor.serviceCategories,
      customServiceCategory: vendor.customServiceCategory,
      experience: vendor.experience,
      address: vendor.address,
      serviceLocations: vendor.serviceLocations,
      profileImage: vendor.profileImage,
      specialty: vendor.specialty,
      bio: vendor.bio,
      isEmailVerified: vendor.isEmailVerified,
      isPhoneVerified: vendor.isPhoneVerified,
      isProfileComplete: vendor.isProfileComplete,
      isApproved: vendor.isApproved,
      isActive: vendor.isActive,
      isBlocked: vendor.isBlocked,
      rating: vendor.rating,
      stats: vendor.stats,
      preferences: vendor.preferences,
      wallet: {
        currentBalance: vendorWallet.currentBalance,
        hasInitialDeposit: vendorWallet.currentBalance >= 4000,
        initialDepositAmount: vendorWallet.currentBalance >= 4000 ? 4000 : 0,
        totalDeposits: vendorWallet.totalDeposits,
        totalWithdrawals: vendorWallet.totalWithdrawals
      }
    };

    logger.info('Vendor logged in successfully', {
      vendorId: vendor._id,
      email: vendor.email
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        vendor: vendorData,
        token
      }
    });

  } catch (error) {
    logger.error('Vendor login failed', {
      error: error.message,
      email: req.body.email
    });

    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// @desc    Get vendor profile
// @route   GET /api/vendors/profile
// @access  Private
const getVendorProfile = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id; // Use _id instead of vendorId

  try {
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get vendor wallet
    let vendorWallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });
    if (!vendorWallet) {
      vendorWallet = new VendorWallet({
        vendorId: vendor.vendorId,
        currentBalance: 0,
        securityDeposit: 4000,
        availableBalance: 0
      });
      await vendorWallet.save();
    }

    const vendorData = {
      id: vendor._id,
      vendorId: vendor.vendorId,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      fullName: vendor.fullName,
      email: vendor.email,
      phone: vendor.formattedPhone,
      alternatePhone: vendor.alternatePhone,
      fatherName: vendor.fatherName,
      homePhone: vendor.homePhone,
      currentAddress: vendor.currentAddress,
      serviceCategories: vendor.serviceCategories,
      customServiceCategory: vendor.customServiceCategory,
      experience: vendor.experience,
      address: vendor.address,
      serviceLocations: vendor.serviceLocations,
      profileImage: vendor.profileImage,
      specialty: vendor.specialty,
      bio: vendor.bio,
      isEmailVerified: vendor.isEmailVerified,
      isPhoneVerified: vendor.isPhoneVerified,
      isProfileComplete: vendor.isProfileComplete,
      isApproved: vendor.isApproved,
      isActive: vendor.isActive,
      isBlocked: vendor.isBlocked,
      rating: vendor.rating,
      stats: vendor.stats,
      preferences: vendor.preferences,
      documents: vendor.documents,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
      wallet: {
        currentBalance: vendorWallet.currentBalance,
        hasInitialDeposit: vendorWallet.currentBalance >= 4000,
        initialDepositAmount: vendorWallet.currentBalance >= 4000 ? 4000 : 0,
        totalDeposits: vendorWallet.totalDeposits,
        totalWithdrawals: vendorWallet.totalWithdrawals
      }
    };

    res.status(200).json({
      success: true,
      data: {
        vendor: vendorData
      }
    });

  } catch (error) {
    logger.error('Get vendor profile failed', {
      error: error.message,
      vendorId: vendorId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile. Please try again.'
    });
  }
});

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private
const updateVendorProfile = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id; // Use _id instead of vendorId
  const updateData = req.body;

  try {
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'alternatePhone', 'fatherName', 'homePhone', 'currentAddress',
      'serviceCategories', 'customServiceCategory', 'experience', 'address', 'specialty', 
      'bio', 'preferences', 'serviceLocations'
    ];

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        // Special handling for phone number to avoid uniqueness conflicts
        if (field === 'phone') {
          // Clean both phone numbers for comparison
          const currentPhone = vendor.phone.replace(/\D/g, '');
          const newPhone = updateData[field].replace(/\D/g, '');
          if (currentPhone === newPhone) {
            // Skip update if phone number is the same
            return;
          }
        }
        vendor[field] = updateData[field];
      }
    });

    // Check if profile is complete after update
    vendor.checkProfileComplete();
    await vendor.save();

    const vendorData = {
      id: vendor._id,
      vendorId: vendor.vendorId,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      fullName: vendor.fullName,
      email: vendor.email,
      phone: vendor.formattedPhone,
      alternatePhone: vendor.alternatePhone,
      fatherName: vendor.fatherName,
      homePhone: vendor.homePhone,
      currentAddress: vendor.currentAddress,
      serviceCategories: vendor.serviceCategories,
      customServiceCategory: vendor.customServiceCategory,
      experience: vendor.experience,
      address: vendor.address,
      serviceLocations: vendor.serviceLocations,
      profileImage: vendor.profileImage,
      specialty: vendor.specialty,
      bio: vendor.bio,
      isEmailVerified: vendor.isEmailVerified,
      isPhoneVerified: vendor.isPhoneVerified,
      isProfileComplete: vendor.isProfileComplete,
      isApproved: vendor.isApproved,
      isActive: vendor.isActive,
      isBlocked: vendor.isBlocked,
      rating: vendor.rating,
      stats: vendor.stats,
      preferences: vendor.preferences
    };

    logger.info('Vendor profile updated successfully', {
      vendorId: vendor._id
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        vendor: vendorData
      }
    });

  } catch (error) {
    logger.error('Update vendor profile failed', {
      error: error.message,
      vendorId: vendorId
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
      message: 'Failed to update profile. Please try again.'
    });
  }
});

// @desc    Change vendor password
// @route   PUT /api/vendors/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id; // Use _id instead of vendorId
  const { currentPassword, newPassword } = req.body;

  try {
    const vendor = await Vendor.findById(vendorId).select('+password');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await vendor.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    vendor.password = newPassword;
    await vendor.save();

    logger.info('Vendor password changed successfully', {
      vendorId: vendor._id
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change vendor password failed', {
      error: error.message,
      vendorId: vendorId
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
      message: 'Failed to change password. Please try again.'
    });
  }
});

// @desc    Get vendor statistics
// @route   GET /api/vendors/stats
// @access  Private
const getVendorStats = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id; // Use _id instead of vendorId

  try {
    const vendor = await Vendor.findById(vendorId).select('stats rating');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        stats: vendor.stats,
        rating: vendor.rating
      }
    });

  } catch (error) {
    logger.error('Get vendor stats failed', {
      error: error.message,
      vendorId: vendorId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics. Please try again.'
    });
  }
});

// @desc    Deactivate vendor account
// @route   PUT /api/vendors/deactivate
// @access  Private
const deactivateAccount = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id; // Use _id instead of vendorId

  try {
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.isActive = false;
    await vendor.save();

    logger.info('Vendor account deactivated', {
      vendorId: vendor._id
    });

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    logger.error('Deactivate vendor account failed', {
      error: error.message,
      vendorId: vendorId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account. Please try again.'
    });
  }
});

// @desc    Upload vendor profile image
// @route   POST /api/vendors/profile/image
// @access  Private
const uploadVendorProfileImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Get vendor ID from the authenticated vendor
    const vendorId = req.vendor._id; // Use _id instead of vendorId
    if (!vendorId) {
      logger.error('Vendor ID not found in request', {
        vendor: req.vendor,
        vendorIdType: typeof req.vendor._id
      });
      return res.status(400).json({
        success: false,
        message: 'Vendor ID not found'
      });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      logger.error('Vendor not found for profile image upload', {
        vendorId: vendorId,
        vendorIdType: typeof vendorId
      });
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    logger.info('Vendor found for profile image upload', {
      vendorId: vendor._id,
      vendorIdString: vendor._id.toString(),
      vendorIdType: typeof vendor._id
    });

    // Delete old profile image if exists
    if (vendor.profileImage) {
      try {
        const oldPublicId = imageUploadService.extractPublicId(vendor.profileImage);
        if (oldPublicId) {
          await imageUploadService.deleteProfileImage(oldPublicId, vendor._id.toString());
        }
      } catch (error) {
        logger.warn('Failed to delete old profile image:', error.message);
      }
    }

    // Upload new profile image
    logger.info('Starting image upload to Cloudinary', {
      vendorId: vendor._id.toString(),
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
    
    const uploadResult = await imageUploadService.uploadProfileImage(req.file, vendor._id.toString());
    logger.info('Image upload result', { uploadResult });
    
    // Extract just the URL string from the upload result
    const imageUrl = uploadResult.data.secureUrl;
    
    // Update vendor profile image with just the URL string
    vendor.profileImage = imageUrl;
    await vendor.save();

    logger.info(`Vendor profile image uploaded successfully for vendor: ${vendor.vendorId}`);

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: imageUrl,
        imageUrl: imageUrl
      }
    });
  } catch (error) {
    logger.error('Error uploading vendor profile image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image',
      error: error.message
    });
  }
});

// @desc    Delete vendor profile image
// @route   DELETE /api/vendors/profile/image
// @access  Private
const deleteVendorProfileImage = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor._id; // Use _id instead of vendorId
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (!vendor.profileImage) {
      return res.status(400).json({
        success: false,
        message: 'No profile image to delete'
      });
    }

    // Delete image from Cloudinary
    try {
      const publicId = imageUploadService.extractPublicId(vendor.profileImage);
      if (publicId) {
        await imageUploadService.deleteProfileImage(publicId, vendor._id.toString());
      }
    } catch (error) {
      logger.warn('Failed to delete profile image from Cloudinary:', error.message);
    }

    // Remove image URL from vendor profile
    vendor.profileImage = undefined;
    await vendor.save();

    logger.info(`Vendor profile image deleted successfully for vendor: ${vendor.vendorId}`);

    res.status(200).json({
      success: true,
      message: 'Profile image deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting vendor profile image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile image',
      error: error.message
    });
  }
});

// @desc    Create deposit order for vendor
// @route   POST /api/vendors/deposit/create-order
// @access  Private
const createDepositOrder = asyncHandler(async (req, res) => {
  try {
    const { amount } = req.body;
    const vendorId = req.vendor._id;

    // Get vendor details first
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if this is the initial deposit (minimum ₹3,999 required for first deposit)
    const isInitialDeposit = !vendor.wallet.hasInitialDeposit;
    
    // Validate amount based on deposit type
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid deposit amount'
      });
    }
    
    if (isInitialDeposit && amount < 3999) {
      return res.status(400).json({
        success: false,
        message: 'Minimum initial deposit amount is ₹3,999'
      });
    }

    // Generate unique transaction ID
    const transactionId = `DEP_${vendor.vendorId}_${Date.now()}`;

    // Create Razorpay order
    const orderData = {
      amount: parseFloat(amount),
      currency: 'INR',
      receipt: transactionId,
      notes: {
        vendorId: vendor.vendorId,
        vendorName: vendor.fullName,
        type: 'vendor_deposit'
      }
    };

    const razorpayOrder = await RazorpayService.createOrder(orderData);

    // Create pending wallet transaction
    const pendingTransaction = new WalletTransaction({
      vendor: vendor._id,
      vendorId: vendor.vendorId,
      transactionId: transactionId,
      amount: amount,
      type: 'deposit',
      description: isInitialDeposit ? 'Initial vendor deposit' : 'Additional vendor deposit',
      razorpayOrderId: razorpayOrder.id,
      status: 'pending',
      balanceBefore: vendor.wallet.currentBalance,
      balanceAfter: vendor.wallet.currentBalance,
      processedBy: 'system'
    });
    await pendingTransaction.save();

    logger.info('Vendor deposit order created successfully', {
      vendorId: vendor.vendorId,
      amount,
      transactionId,
      razorpayOrderId: razorpayOrder.id
    });

    res.status(200).json({
      success: true,
      message: 'Deposit order created successfully',
      data: {
        orderId: razorpayOrder.id,
        amount: amount,
        currency: 'INR',
        transactionId: transactionId
      }
    });

  } catch (error) {
    logger.error('Error creating vendor deposit order:', {
      error: error.message,
      stack: error.stack,
      vendorId: req.vendor?._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create deposit order',
      error: error.message
    });
  }
});

// @desc    Verify vendor deposit payment
// @route   POST /api/vendors/deposit/verify
// @access  Private
const verifyDepositPayment = asyncHandler(async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, transactionId } = req.body;
    const vendorId = req.vendor._id;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'All payment verification fields are required'
      });
    }

    // Find the vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Find the pending transaction
    const pendingTransaction = await WalletTransaction.findOne({
      transactionId: transactionId,
      vendorId: vendor.vendorId,
      status: 'pending'
    });

    if (!pendingTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Pending transaction not found'
      });
    }

    // Verify payment with Razorpay
    const crypto = require('crypto');
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!razorpaySecret) {
      logger.error('Razorpay secret key not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment verification service not configured'
      });
    }
    
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(body.toString())
      .digest('hex');

    logger.info('Vendor deposit payment verification attempt', {
      vendorId: vendor.vendorId,
      transactionId,
      razorpayOrderId,
      razorpayPaymentId,
      expectedSignature: expectedSignature.substring(0, 10) + '...',
      receivedSignature: razorpaySignature.substring(0, 10) + '...'
    });

    if (expectedSignature !== razorpaySignature) {
      logger.error('Vendor deposit payment signature verification failed', {
        vendorId: vendor.vendorId,
        transactionId,
        expectedSignature: expectedSignature.substring(0, 10) + '...',
        receivedSignature: razorpaySignature.substring(0, 10) + '...'
      });
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Add deposit to wallet using the Vendor model method
    logger.info('Adding deposit to vendor wallet', {
      vendorId: vendor.vendorId,
      amount: pendingTransaction.amount,
      currentBalance: vendor.wallet.currentBalance
    });
    
    // Use the addDeposit method from Vendor model to properly handle the transaction
    await vendor.addDeposit(
      pendingTransaction.amount,
      transactionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
    
    logger.info('Vendor wallet updated after deposit', {
      vendorId: vendor.vendorId,
      newBalance: vendor.wallet.currentBalance,
      hasInitialDeposit: vendor.wallet.hasInitialDeposit
    });

    // Also add deposit to the new VendorWallet system
    let vendorWallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });
    if (!vendorWallet) {
      vendorWallet = new VendorWallet({ vendorId: vendor.vendorId });
    }

    // Add deposit transaction to the new wallet system
    await vendorWallet.addDeposit({
      amount: pendingTransaction.amount,
      description: 'Wallet deposit via Razorpay',
      transactionId: transactionId
    });

    // Check if this deposit fulfills the mandatory deposit requirement
    if (pendingTransaction.amount >= 2000 && vendor.wallet.firstTaskAssignedAt && !vendor.wallet.hasMandatoryDeposit) {
      await vendor.markMandatoryDepositCompleted(pendingTransaction.amount);
      logger.info('Mandatory deposit requirement fulfilled', {
        vendorId: vendor.vendorId,
        amount: pendingTransaction.amount
      });
    }

    logger.info('Vendor deposit payment verified and processed successfully', {
      vendorId: vendor.vendorId,
      transactionId,
      amount: pendingTransaction.amount,
      razorpayPaymentId
    });

    // Send email notification
    try {
      await emailService.sendVendorDepositConfirmation(
        {
          name: vendor.fullName,
          email: vendor.email
        },
        {
          amount: pendingTransaction.amount,
          transactionId: transactionId,
          newBalance: vendor.wallet.currentBalance
        }
      );
      logger.info('Deposit confirmation email sent successfully', {
        vendorId: vendor.vendorId,
        email: vendor.email
      });
    } catch (emailError) {
      logger.error('Failed to send deposit confirmation email:', emailError);
      // Don't fail the transaction if email fails
    }

    // Get updated wallet data
    const updatedVendorWallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });

    res.status(200).json({
      success: true,
      message: 'Deposit payment verified and processed successfully',
      data: {
        transactionId: transactionId,
        amount: pendingTransaction.amount,
        newBalance: updatedVendorWallet?.currentBalance || vendor.wallet.currentBalance,
        hasInitialDeposit: vendor.wallet.hasInitialDeposit,
        walletData: {
          currentBalance: updatedVendorWallet?.currentBalance || vendor.wallet.currentBalance,
          totalDeposits: updatedVendorWallet?.totalDeposits || 0,
          availableBalance: updatedVendorWallet?.availableForWithdrawal || 0
        }
      }
    });

  } catch (error) {
    logger.error('Error verifying vendor deposit payment:', {
      error: error.message,
      stack: error.stack,
      vendorId: req.vendor?._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to verify deposit payment',
      error: error.message
    });
  }
});

// @desc    Generate OneSignal identity token for vendor
// @route   GET /api/vendors/onesignal/identity-token
// @access  Private
const generateOneSignalIdentityToken = asyncHandler(async (req, res) => {
  try {
    if (!ONE_SIGNAL_USER_AUTH_KEY) {
      return res.status(500).json({ success: false, message: 'OneSignal user auth key not configured' });
    }

    const vendorMongoId = req.vendor._id.toString();

    const hmac = crypto.createHmac('sha256', ONE_SIGNAL_USER_AUTH_KEY);
    hmac.update(vendorMongoId);
    const token = hmac.digest('base64');

    return res.json({ success: true, data: { externalId: vendorMongoId, token } });
  } catch (error) {
    logger.error('Failed to generate OneSignal identity token', { error: error.message, vendorId: req.vendor?._id });
    return res.status(500).json({ success: false, message: 'Failed to generate identity token' });
  }
});

// @desc    Get vendor wallet information
// @route   GET /api/vendors/wallet
// @access  Private
const getVendorWallet = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { page = 1, limit = 20 } = req.query;
    
    const vendor = await Vendor.findById(vendorId).select('vendorId');
    const vendorWalletId = vendor?.vendorId;

    if (!vendor || !vendorWalletId) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get wallet data from VendorWallet model
    const VendorWallet = require('../models/VendorWallet');
    let wallet = await VendorWallet.findOne({ vendorId: vendorWalletId });
    
    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = new VendorWallet({
        vendorId: vendorWalletId,
        currentBalance: 0,
        securityDeposit: 4000,
        availableBalance: 0
      });
      await wallet.save();
    }

    const summary = await VendorWallet.getVendorSummary(vendorWalletId);
    const recentTransactions = await VendorWallet.getRecentTransactions(vendorWalletId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        wallet: {
          currentBalance: wallet.currentBalance,
          securityDeposit: wallet.securityDeposit,
          availableBalance: wallet.availableForWithdrawal,
          totalEarnings: wallet.totalEarnings,
          totalPenalties: wallet.totalPenalties,
          totalWithdrawals: wallet.totalWithdrawals,
          totalDeposits: wallet.totalDeposits,
          totalTaskAcceptanceFees: wallet.totalTaskAcceptanceFees,
          totalCashCollections: wallet.totalCashCollections,
          totalRefunds: wallet.totalRefunds,
          totalTasksCompleted: wallet.totalTasksCompleted,
          totalTasksRejected: wallet.totalTasksRejected,
          totalTasksCancelled: wallet.totalTasksCancelled,
          lastTransactionAt: wallet.lastTransactionAt,
          isActive: wallet.isActive
        },
        summary,
        recentTransactions
      }
    });

  } catch (error) {
    logger.error('Error fetching vendor wallet:', {
      error: error.message,
      vendorId: req.vendor?._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet information',
      error: error.message
    });
  }
});

// @desc    Add service location
// @route   POST /api/vendors/service-locations
// @access  Private
const addServiceLocation = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const { from, to } = req.body;

  try {
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'From and To locations are required'
      });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    await vendor.addServiceLocation(from, to);

    logger.info('Service location added successfully', {
      vendorId: vendor._id,
      from,
      to
    });

    res.status(201).json({
      success: true,
      message: 'Service location added successfully',
      data: {
        serviceLocations: vendor.serviceLocations
      }
    });

  } catch (error) {
    logger.error('Add service location failed', {
      error: error.message,
      vendorId: vendorId
    });

    if (error.message === 'Service location already exists') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add service location. Please try again.'
    });
  }
});

// @desc    Update service location
// @route   PUT /api/vendors/service-locations/:locationId
// @access  Private
const updateServiceLocation = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const { locationId } = req.params;
  const { from, to, isActive } = req.body;

  try {
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'From and To locations are required'
      });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    await vendor.updateServiceLocation(locationId, from, to, isActive);

    logger.info('Service location updated successfully', {
      vendorId: vendor._id,
      locationId,
      from,
      to
    });

    res.status(200).json({
      success: true,
      message: 'Service location updated successfully',
      data: {
        serviceLocations: vendor.serviceLocations
      }
    });

  } catch (error) {
    logger.error('Update service location failed', {
      error: error.message,
      vendorId: vendorId,
      locationId
    });

    if (error.message === 'Service location not found' || error.message === 'Service location already exists') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update service location. Please try again.'
    });
  }
});

// @desc    Remove service location
// @route   DELETE /api/vendors/service-locations/:locationId
// @access  Private
const removeServiceLocation = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const { locationId } = req.params;

  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    await vendor.removeServiceLocation(locationId);

    logger.info('Service location removed successfully', {
      vendorId: vendor._id,
      locationId
    });

    res.status(200).json({
      success: true,
      message: 'Service location removed successfully',
      data: {
        serviceLocations: vendor.serviceLocations
      }
    });

  } catch (error) {
    logger.error('Remove service location failed', {
      error: error.message,
      vendorId: vendorId,
      locationId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to remove service location. Please try again.'
    });
  }
});

// @desc    Remove FCM token (mobile/webview only - web tokens removed)
// @route   DELETE /api/vendors/remove-fcm-token
// @access  Private
const removeFCMToken = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const { token } = req.body;

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'FCM token is required'
    });
  }

  try {
    const vendor = await Vendor.findById(vendorId).select('+fcmTokenMobile');
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    let removed = false;

    // Remove from mobile tokens only (web tokens removed)
    if (vendor.fcmTokenMobile && Array.isArray(vendor.fcmTokenMobile)) {
      const beforeLength = vendor.fcmTokenMobile.length;
      vendor.fcmTokenMobile = vendor.fcmTokenMobile.filter(t => t !== token);
      if (vendor.fcmTokenMobile.length < beforeLength) {
        removed = true;
        vendor.markModified('fcmTokenMobile');
      }
    }

    if (removed) {
      await vendor.save();
      logger.info(`FCM token removed for vendor ${vendorId}`);
    }

    res.status(200).json({
      success: true,
      message: removed ? 'FCM token removed successfully' : 'Token not found',
      removed
    });
  } catch (error) {
    logger.error('Error removing FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove FCM token. Please try again.'
    });
  }
});

// DEPRECATED: Web FCM token endpoint removed - use save-fcm-token-mobile instead
// This endpoint is kept for backward compatibility but returns error
const saveFCMToken = asyncHandler(async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Web FCM token endpoint has been removed. Please use /api/vendors/save-fcm-token-mobile for mobile/webview devices only.',
    deprecated: true
  });
});

// @desc    Save FCM token for mobile/APK push notifications
// @route   POST /api/vendors/save-fcm-token-mobile
// @access  Public (no auth required, uses email)
const saveFCMTokenMobile = asyncHandler(async (req, res) => {
  // Enhanced logging to help debug
  logger.info('=== VENDOR MOBILE FCM TOKEN SAVE REQUEST ===');
  logger.info('Request Method:', req.method);
  logger.info('Request Path:', req.path);
  logger.info('Request URL:', req.url);
  logger.info('Request Headers:', {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent'],
    'origin': req.headers['origin'],
    'referer': req.headers['referer']
  });
  
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
    
    const { token, email, platform = 'mobile' } = req.body;

    // Validate token
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!emailRegex.test(normalizedEmail)) {
      logger.error('Invalid email format', {
        email: email,
        normalizedEmail: normalizedEmail
      });
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    logger.info('Email validation', {
      originalEmail: email,
      normalizedEmail: normalizedEmail
    });

    // Find vendor by email - explicitly select fcmTokenMobile field
    const vendor = await Vendor.findOne({ email: normalizedEmail }).select('+fcmTokenMobile');
    
    logger.info('Vendor lookup attempt', {
      email: normalizedEmail,
      found: !!vendor,
      vendorId: vendor?.vendorId || 'not found'
    });
    
    if (!vendor) {
      logger.error('Vendor not found with email', {
        email: normalizedEmail
      });
      return res.status(404).json({
        success: false,
        message: 'Vendor not found with this email. Please register first.',
        debug: {
          email: normalizedEmail,
          hint: 'Make sure the email matches the one used during registration'
        }
      });
    }
    
    logger.info('✅ Vendor found for FCM token save', {
      vendorId: vendor._id.toString(),
      vendorIdString: vendor.vendorId,
      email: vendor.email,
      phone: vendor.phone
    });

    // Ensure fcmTokenMobile field exists (for existing vendors who might not have this field)
    if (!vendor.fcmTokenMobile || !Array.isArray(vendor.fcmTokenMobile)) {
      vendor.fcmTokenMobile = [];
    }

    logger.info('📊 Current FCM tokens before update:', {
      mobileTokens: vendor.fcmTokenMobile?.length || 0,
      mobileTokensArray: vendor.fcmTokenMobile
    });
    logger.info('🆕 New FCM token:', token.substring(0, 30) + '...');
    logger.info('📱 Platform:', platform);

    const oldTokens = [...vendor.fcmTokenMobile];
    const MAX_TOKENS = 10;
    
    // Check if token already exists in fcmTokenMobile (case-sensitive exact match)
    const tokenExists = vendor.fcmTokenMobile.some(existingToken => existingToken === token);
    
    if (tokenExists) {
      logger.info('ℹ️ FCM token already exists in fcmTokenMobile database');
      logger.info('📊 Current fcmTokenMobile array:', vendor.fcmTokenMobile);
      return res.json({
        success: true,
        message: 'Token already exists in database',
        updated: false,
        tokenCount: vendor.fcmTokenMobile.length,
        tokenInDatabase: true,
        platform: platform
      });
    }

    // Note: Web tokens (fcmTokens) are no longer used - only mobile/webview tokens

    // Add new token to fcmTokenMobile
    logger.info('🆕 New mobile token detected, adding to fcmTokenMobile array...');
    
    // Remove token if exists (shouldn't happen but safety check)
    vendor.fcmTokenMobile = vendor.fcmTokenMobile.filter(t => t !== token);
    
    // Add new token at the beginning (most recent first)
    vendor.fcmTokenMobile.unshift(token);
    
    // Keep only the most recent tokens
    if (vendor.fcmTokenMobile.length > MAX_TOKENS) {
      logger.info(`⚠️ Token limit reached (${MAX_TOKENS}), removing oldest tokens...`);
      vendor.fcmTokenMobile = vendor.fcmTokenMobile.slice(0, MAX_TOKENS);
    }
    
    logger.info(`📱 Added new mobile token to fcmTokenMobile. Total mobile tokens: ${vendor.fcmTokenMobile.length}/${MAX_TOKENS}`);
    logger.info(`📋 Token array preview: ${vendor.fcmTokenMobile.slice(0, 3).map(t => t.substring(0, 20) + '...').join(', ')}`);
    
    // Mark fcmTokenMobile as modified to ensure save (CRITICAL for select: false fields)
    vendor.markModified('fcmTokenMobile');
    
    logger.info('💾 Saving FCM tokens to database...', {
      vendorId: vendor._id.toString(),
      vendorIdString: vendor.vendorId,
      email: vendor.email,
      tokensBeforeSave: oldTokens.length,
      tokensAfterSave: vendor.fcmTokenMobile.length,
      newToken: token.substring(0, 30) + '...'
    });
    
    // Save with explicit options to ensure persistence
    await vendor.save({ validateBeforeSave: false });
    logger.info('✅ FCM tokens saved successfully');
    
    // Verify the save by fetching fresh from database
    const updatedVendor = await Vendor.findById(vendor._id).select('+fcmTokenMobile');
    
    if (!updatedVendor) {
      logger.error('❌ Vendor not found after save - verification failed');
      return res.status(500).json({
        success: false,
        message: 'Failed to verify token save'
      });
    }
    
    logger.info('✅ Verification - fcmTokenMobile in database:', {
      vendorId: updatedVendor._id.toString(),
      tokenCount: updatedVendor.fcmTokenMobile?.length || 0,
      tokenExists: updatedVendor.fcmTokenMobile?.includes(token) || false,
      tokensArray: updatedVendor.fcmTokenMobile?.map(t => t.substring(0, 20) + '...') || []
    });
    
    // If verification fails, retry save
    if (!updatedVendor.fcmTokenMobile || !updatedVendor.fcmTokenMobile.includes(token)) {
      logger.error('❌ Token save verification failed! Token not found in database after save');
      logger.info('🔄 Retrying save...');
      
      // Re-fetch and retry
      const retryVendor = await Vendor.findById(vendor._id).select('+fcmTokenMobile');
      if (retryVendor) {
        if (!retryVendor.fcmTokenMobile || !Array.isArray(retryVendor.fcmTokenMobile)) {
          retryVendor.fcmTokenMobile = [];
        }
        
        // Remove if exists
        retryVendor.fcmTokenMobile = retryVendor.fcmTokenMobile.filter(t => t !== token);
        
        // Add token at beginning
        retryVendor.fcmTokenMobile.unshift(token);
        
        // Limit
        if (retryVendor.fcmTokenMobile.length > MAX_TOKENS) {
          retryVendor.fcmTokenMobile = retryVendor.fcmTokenMobile.slice(0, MAX_TOKENS);
        }
        
        retryVendor.markModified('fcmTokenMobile');
        await retryVendor.save({ validateBeforeSave: false });
        
        // Verify again
        const verifyVendor = await Vendor.findById(vendor._id).select('+fcmTokenMobile');
        if (verifyVendor && verifyVendor.fcmTokenMobile && verifyVendor.fcmTokenMobile.includes(token)) {
          logger.info('✅ Retry successful - token saved');
        } else {
          logger.error('❌ Retry also failed - token still not in database');
        }
      }
    } else {
      logger.info(`✅ Verified saved tokens: ${updatedVendor.fcmTokenMobile.length} tokens`);
      logger.info(`✅ Total devices registered: ${updatedVendor.fcmTokenMobile.length}`);
    }

    logger.info(`✅ Mobile FCM token saved successfully to fcmTokenMobile for vendor ${vendor._id}`);

    return res.json({
      success: true,
      message: 'FCM token saved successfully for mobile device',
      updated: true,
      tokenCount: vendor.fcmTokenMobile.length,
      previousTokenCount: oldTokens.length,
      maxTokens: MAX_TOKENS,
      devicesRegistered: vendor.fcmTokenMobile.length,
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


module.exports = {
  registerVendor,
  loginVendor,
  getVendorProfile,
  updateVendorProfile,
  changePassword,
  getVendorStats,
  deactivateAccount,
  uploadVendorProfileImage,
  deleteVendorProfileImage,
  createDepositOrder,
  verifyDepositPayment,
  getVendorWallet,
  addServiceLocation,
  updateServiceLocation,
  removeServiceLocation,
  generateOneSignalIdentityToken,
  createVerificationPayment,
  verifyVerificationPayment,
  saveFCMTokenMobile,
  removeFCMToken
};
