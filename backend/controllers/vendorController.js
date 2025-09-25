const Vendor = require('../models/Vendor');
const WalletTransaction = require('../models/WalletTransaction');
const VendorWallet = require('../models/VendorWallet');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const imageUploadService = require('../utils/imageUpload');
const RazorpayService = require('../services/razorpayService');
const emailService = require('../services/emailService');

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
    password,
    serviceCategories,
    customServiceCategory,
    experience,
    address,
    specialty,
    bio
  } = req.body;

  try {
    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: existingVendor.email === email 
          ? 'Email is already registered' 
          : 'Phone number is already registered'
      });
    }

    // Generate unique vendor ID
    const vendorId = await Vendor.generateVendorId();

    // Create vendor
    const vendor = await Vendor.create({
      vendorId,
      firstName,
      lastName,
      email,
      phone,
      password,
      serviceCategories,
      customServiceCategory,
      experience,
      address,
      specialty,
      bio,
      isApproved: false,  // Require admin approval
      isActive: false,    // Set as inactive until approved
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
      serviceCategories: vendor.serviceCategories,
      customServiceCategory: vendor.customServiceCategory,
      experience: vendor.experience,
      address: vendor.address,
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
      message: 'Vendor registered successfully. Your account is pending admin approval. You will be notified once approved.',
      data: {
        vendor: vendorData,
        token
      }
    });

  } catch (error) {
    logger.error('Vendor registration failed', {
      error: error.message,
      email: req.body.email,
      phone: req.body.phone
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
      message: 'Registration failed. Please try again.'
    });
  }
});

// @desc    Login vendor
// @route   POST /api/vendors/login
// @access  Public
const loginVendor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if vendor exists and include password
    const vendor = await Vendor.findOne({ email }).select('+password');

    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if vendor is approved
    if (!vendor.isApproved) {
      return res.status(401).json({
        success: false,
        message: 'Your account is pending admin approval. Please wait for approval before logging in.'
      });
    }

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
        message: 'Account is blocked. Please contact support.'
      });
    }

    // Check password
    const isPasswordValid = await vendor.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await vendor.updateLastLogin();

    // Generate token
    const token = generateToken(vendor._id);

    // Get or create vendor wallet
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
      serviceCategories: vendor.serviceCategories,
      customServiceCategory: vendor.customServiceCategory,
      experience: vendor.experience,
      address: vendor.address,
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
      'firstName', 'lastName', 'serviceCategories', 'customServiceCategory', 'experience', 
      'address', 'specialty', 'bio', 'preferences'
    ];

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
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
      serviceCategories: vendor.serviceCategories,
      customServiceCategory: vendor.customServiceCategory,
      experience: vendor.experience,
      address: vendor.address,
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

    // Check if this is the initial deposit (minimum ₹4,000 required for first deposit)
    const isInitialDeposit = !vendor.wallet.hasInitialDeposit;
    
    // Validate amount based on deposit type
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid deposit amount'
      });
    }
    
    if (isInitialDeposit && amount < 4000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum initial deposit amount is ₹4,000'
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

// @desc    Get vendor wallet information
// @route   GET /api/vendors/wallet
// @access  Private
const getVendorWallet = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { page = 1, limit = 20 } = req.query;
    
    const vendor = await Vendor.findById(vendorId).select('wallet vendorId');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get transaction history with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = await WalletTransaction.find({ vendorId: vendor.vendorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTransactions = await WalletTransaction.countDocuments({ vendorId: vendor.vendorId });

    // Get wallet summary
    const summary = await WalletTransaction.getVendorSummary(vendor.vendorId);

    res.status(200).json({
      success: true,
      data: {
        wallet: {
          ...vendor.wallet,
          summary: summary
        },
        transactions: transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalTransactions / parseInt(limit)),
          totalTransactions: totalTransactions,
          hasNextPage: skip + transactions.length < totalTransactions,
          hasPrevPage: parseInt(page) > 1
        }
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
  getVendorWallet
};
