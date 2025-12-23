const Vendor = require('../models/Vendor');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const emailService = require('../services/emailService');

// @desc    Get all vendors (Admin)
// @route   GET /api/admin/vendors
// @access  Private (Admin with vendorManagement permission)
const getVendors = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    verificationStatus,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = {};

  // Search functionality
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { vendorId: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } },
      { 'address.state': { $regex: search, $options: 'i' } }
    ];
  }

  // Status filter
  if (status && status !== 'all') {
    if (status === 'active') {
      query.isActive = true;
      query.isBlocked = false;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'blocked') {
      query.isBlocked = true;
    } else if (status === 'suspended') {
      query.isActive = false;
      query.isBlocked = true;
    }
  }

  // Verification status filter
  if (verificationStatus && verificationStatus !== 'all') {
    if (verificationStatus === 'verified') {
      query.isApproved = true;
    } else if (verificationStatus === 'pending') {
      query.isApproved = false;
      query.isActive = true;
    } else if (verificationStatus === 'rejected') {
      query.isApproved = false;
      query.isActive = false;
    }
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const vendors = await Vendor.find(query)
    .select('-password')
    .sort(sort)
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await Vendor.countDocuments(query);

  // Get bookings count for each vendor from Booking model
  const { Booking } = require('../models/Booking');
  const transformedVendors = await Promise.all(vendors.map(async (vendor) => {
    // Count bookings assigned to this vendor
    const bookingQuery = { 'vendor.vendorId': vendor.vendorId };
    
    // Count total bookings, completed bookings, and pending bookings
    const [totalBookingsCount, completedBookingsCount, pendingBookingsCount] = await Promise.all([
      Booking.countDocuments(bookingQuery),
      Booking.countDocuments({
        ...bookingQuery,
        status: 'completed'
      }),
      Booking.countDocuments({
        ...bookingQuery,
        status: { $in: ['pending', 'waiting_for_engineer', 'confirmed', 'in_progress'] }
      })
    ]);

    return {
      id: vendor._id,
      vendorId: vendor.vendorId,
      name: `${vendor.firstName} ${vendor.lastName}`,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      email: vendor.email,
      phone: vendor.formattedPhone,
      alternatePhone: vendor.alternatePhone,
      fatherName: vendor.fatherName,
      homePhone: vendor.homePhone,
      currentAddress: vendor.currentAddress,
      location: vendor.address ? `${vendor.address.city}, ${vendor.address.state}` : 'Not specified',
      address: vendor.address,
      serviceLocations: vendor.serviceLocations,
      joinDate: vendor.createdAt,
      status: vendor.isBlocked ? 'blocked' : (vendor.isActive ? 'active' : 'inactive'),
      verificationStatus: vendor.isApproved ? 'verified' : 'pending',
      rating: vendor.rating.average || 0,
      totalReviews: vendor.rating.totalReviews || 0,
      totalBookings: totalBookingsCount || 0,
      completedBookings: completedBookingsCount || 0,
      pendingBookings: pendingBookingsCount || 0,
      services: vendor.serviceCategories,
      customServiceCategory: vendor.customServiceCategory,
      lastActive: vendor.stats.lastLoginAt,
      profileImage: vendor.profileImage,
      documents: vendor.documents,
      isEmailVerified: vendor.isEmailVerified,
      isPhoneVerified: vendor.isPhoneVerified,
      isProfileComplete: vendor.isProfileComplete,
      experience: vendor.experience,
      specialty: vendor.specialty,
      bio: vendor.bio,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt
    };
  }));

  res.json({
    success: true,
    data: {
      vendors: transformedVendors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalVendors: total,
        hasNext: endIndex < total,
        hasPrev: startIndex > 0,
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Get vendor statistics (Admin)
// @route   GET /api/admin/vendors/stats
// @access  Private (Admin with vendorManagement permission)
const getVendorStats = asyncHandler(async (req, res) => {
  const totalVendors = await Vendor.countDocuments();
  const activeVendors = await Vendor.countDocuments({ isActive: true, isBlocked: false });
  const verifiedVendors = await Vendor.countDocuments({ isApproved: true });
  const pendingVendors = await Vendor.countDocuments({ isApproved: false, isActive: true });
  const blockedVendors = await Vendor.countDocuments({ isBlocked: true });
  const inactiveVendors = await Vendor.countDocuments({ isActive: false });

  // Get recent vendors (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentVendors = await Vendor.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  // Get vendors by service categories
  const serviceCategoryStats = await Vendor.aggregate([
    { $unwind: '$serviceCategories' },
    { $group: { _id: '$serviceCategories', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Get vendors by location
  const locationStats = await Vendor.aggregate([
    { $match: { 'address.city': { $exists: true, $ne: null } } },
    { $group: { _id: '$address.city', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Get average rating
  const ratingStats = await Vendor.aggregate([
    { $match: { 'rating.count': { $gt: 0 } } },
    { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
  ]);

  const stats = {
    totalVendors,
    activeVendors,
    verifiedVendors,
    pendingVendors,
    blockedVendors,
    inactiveVendors,
    recentVendors,
    averageRating: ratingStats.length > 0 ? Math.round(ratingStats[0].avgRating * 10) / 10 : 0,
    serviceCategoryStats,
    locationStats
  };

  res.json({
    success: true,
    data: { stats }
  });
});

// @desc    Get single vendor (Admin)
// @route   GET /api/admin/vendors/:id
// @access  Private (Admin with vendorManagement permission)
const getVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id).select('-password');

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  // Get bookings count from Booking model
  const { Booking } = require('../models/Booking');
  const bookingQuery = { 'vendor.vendorId': vendor.vendorId };
  
  const [totalBookingsCount, completedBookingsCount, pendingBookingsCount] = await Promise.all([
    Booking.countDocuments(bookingQuery),
    Booking.countDocuments({
      ...bookingQuery,
      status: 'completed'
    }),
    Booking.countDocuments({
      ...bookingQuery,
      status: { $in: ['pending', 'waiting_for_engineer', 'confirmed', 'in_progress'] }
    })
  ]);

  const vendorData = {
    id: vendor._id,
    vendorId: vendor.vendorId,
    name: `${vendor.firstName} ${vendor.lastName}`,
    firstName: vendor.firstName,
    lastName: vendor.lastName,
    email: vendor.email,
    phone: vendor.formattedPhone,
    alternatePhone: vendor.alternatePhone,
    fatherName: vendor.fatherName,
    homePhone: vendor.homePhone,
    currentAddress: vendor.currentAddress,
    location: vendor.address ? `${vendor.address.city}, ${vendor.address.state}` : 'Not specified',
    address: vendor.address,
    serviceLocations: vendor.serviceLocations,
    joinDate: vendor.createdAt,
    status: vendor.isBlocked ? 'blocked' : (vendor.isActive ? 'active' : 'inactive'),
    verificationStatus: vendor.isApproved ? 'verified' : 'pending',
    rating: vendor.rating.average || 0,
    totalReviews: vendor.rating.totalReviews || 0,
    totalBookings: totalBookingsCount || 0,
    completedBookings: completedBookingsCount || 0,
    pendingBookings: pendingBookingsCount || 0,
    services: vendor.serviceCategories,
    customServiceCategory: vendor.customServiceCategory,
    lastActive: vendor.stats.lastLoginAt,
    profileImage: vendor.profileImage,
    documents: vendor.documents,
    isEmailVerified: vendor.isEmailVerified,
    isPhoneVerified: vendor.isPhoneVerified,
    isProfileComplete: vendor.isProfileComplete,
    experience: vendor.experience,
    specialty: vendor.specialty,
    bio: vendor.bio,
    preferences: vendor.preferences,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt
  };

  res.json({
    success: true,
    data: { vendor: vendorData }
  });
});

// @desc    Update vendor status (Admin)
// @route   PUT /api/admin/vendors/:id/status
// @access  Private (Admin with vendorManagement permission)
const updateVendorStatus = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const vendor = await Vendor.findById(req.params.id);

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  switch (action) {
    case 'approve':
      vendor.isApproved = true;
      vendor.isActive = true;
      vendor.isBlocked = false;
      break;
    case 'reject':
      vendor.isApproved = false;
      vendor.isActive = false;
      break;
    case 'activate':
      vendor.isActive = true;
      vendor.isBlocked = false;
      break;
    case 'deactivate':
      vendor.isActive = false;
      break;
    case 'block':
      vendor.isBlocked = true;
      vendor.isActive = false;
      break;
    case 'unblock':
      vendor.isBlocked = false;
      vendor.isActive = true;
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
  }

  await vendor.save();

  // Send email notification for vendor approval
  if (action === 'approve') {
    try {
      await emailService.sendVendorApprovalEmail({
        name: vendor.fullName,
        email: vendor.email,
        vendorId: vendor.vendorId
      });
      logger.info('Vendor approval email sent successfully', {
        vendorId: vendor._id,
        email: vendor.email
      });
    } catch (emailError) {
      logger.error('Failed to send vendor approval email:', emailError);
      // Don't fail the approval if email fails
    }
  }

  // Send push notification for vendor blocking
  if (action === 'block') {
    try {
      const { sendMulticastPushNotification } = require('../services/firebasePushService');
      
      // Get vendor with FCM tokens (mobile/webview only - web tokens removed)
      const vendorWithTokens = await Vendor.findById(vendor._id).select('+fcmTokenMobile');
      
      // Use mobile/webview tokens only
      const uniqueTokens = [...(vendorWithTokens?.fcmTokenMobile || [])];
      
      if (uniqueTokens.length > 0) {
        const notificationData = {
          title: 'Account Blocked',
          body: 'Your account has been blocked by admin. Please contact support for assistance.',
          data: {
            type: 'account_blocked',
            vendorId: vendor.vendorId,
            timestamp: new Date().toISOString()
          }
        };

        const pushResult = await sendMulticastPushNotification(uniqueTokens, notificationData);
        logger.info('Vendor block notification sent successfully', {
          vendorId: vendor._id,
          email: vendor.email,
          successCount: pushResult.successCount,
          failureCount: pushResult.failureCount,
          totalTokens: uniqueTokens.length,
          mobileTokens: vendorWithTokens.fcmTokenMobile?.length || 0
        });
      } else {
        logger.warn('No FCM tokens found for blocked vendor', {
          vendorId: vendor._id,
          email: vendor.email
        });
      }
    } catch (notificationError) {
      logger.error('Failed to send vendor block notification:', notificationError);
      // Don't fail the blocking if notification fails
    }
  }

  logger.info(`Vendor ${action} by admin`, {
    vendorId: vendor._id,
    vendorEmail: vendor.email,
    action: action
  });

  res.json({
    success: true,
    message: `Vendor ${action}d successfully`,
    data: { vendor }
  });
});

// @desc    Update vendor information (Admin)
// @route   PUT /api/admin/vendors/:id
// @access  Private (Admin with vendorManagement permission)
const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  // Update allowed fields
  const allowedUpdates = [
    'firstName', 'lastName', 'email', 'phone', 'serviceCategories', 'customServiceCategory',
    'experience', 'address', 'specialty', 'bio', 'isEmailVerified', 
    'isPhoneVerified', 'isApproved', 'isActive', 'isBlocked'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      vendor[field] = req.body[field];
    }
  });

  // Check if profile is complete after update
  vendor.checkProfileComplete();
  await vendor.save();

  logger.info('Vendor updated by admin', {
    vendorId: vendor._id,
    vendorEmail: vendor.email
  });

  res.json({
    success: true,
    message: 'Vendor updated successfully',
    data: { vendor }
  });
});

// @desc    Delete vendor (Admin)
// @route   DELETE /api/admin/vendors/:id
// @access  Private (Admin with vendorManagement permission)
const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  await Vendor.findByIdAndDelete(req.params.id);

  logger.info('Vendor deleted by admin', {
    vendorId: vendor._id,
    vendorEmail: vendor.email
  });

  res.json({
    success: true,
    message: 'Vendor deleted successfully'
  });
});

// @desc    Send email to vendor (Admin)
// @route   POST /api/admin/vendors/:id/send-email
// @access  Private (Admin with vendorManagement permission)
const sendEmailToVendor = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  const vendor = await Vendor.findById(req.params.id);

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  // TODO: Implement email service
  // For now, just log the email
  logger.info('Email sent to vendor by admin', {
    vendorId: vendor._id,
    vendorEmail: vendor.email,
    subject: subject,
    message: message
  });

  res.json({
    success: true,
    message: 'Email sent successfully to vendor'
  });
});

// @desc    Update vendor ratings (Admin)
// @route   POST /api/admin/vendors/update-ratings
// @access  Private (Admin)
const updateVendorRatings = asyncHandler(async (req, res) => {
  try {
    const vendors = await Vendor.find({});
    let updatedCount = 0;
    
    for (const vendor of vendors) {
      try {
        await vendor.updateRating();
        updatedCount++;
      } catch (error) {
        console.error(`Error updating rating for vendor ${vendor.vendorId}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      message: `Successfully updated ratings for ${updatedCount} vendors`,
      data: { updatedCount, totalVendors: vendors.length }
    });
  } catch (error) {
    console.error('Error updating vendor ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor ratings',
      error: error.message
    });
  }
});

// @desc    Grant account access to vendor (Admin) - Enable account without ₹3999 deposit
// @route   POST /api/admin/vendors/:id/grant-access
// @access  Private (Admin with vendorManagement permission)
const grantAccountAccess = asyncHandler(async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Update vendor wallet to mark initial deposit as done
    vendor.wallet.hasInitialDeposit = true;
    vendor.wallet.initialDepositAmount = 3999;
    
    // Also update VendorWallet model if it exists
    const VendorWallet = require('../models/VendorWallet');
    let vendorWallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });
    
    if (vendorWallet) {
      // Update wallet to reflect initial deposit
      if (!vendorWallet.totalDeposits || vendorWallet.totalDeposits < 3999) {
        vendorWallet.totalDeposits = 3999;
      }
      if (vendorWallet.currentBalance < 3999) {
        vendorWallet.currentBalance = 3999;
      }
      await vendorWallet.save();
    } else {
      // Create wallet if it doesn't exist
      vendorWallet = new VendorWallet({
        vendorId: vendor.vendorId,
        currentBalance: 3999,
        securityDeposit: 3999,
        availableBalance: 0,
        totalDeposits: 3999
      });
      await vendorWallet.save();
    }

    // Also ensure vendor is active and approved
    vendor.isActive = true;
    vendor.isApproved = true;
    vendor.isBlocked = false;
    
    await vendor.save();

    // Send push notification to vendor about account access granted
    try {
      const { sendMulticastPushNotification } = require('../services/firebasePushService');
      
      // Get vendor with FCM tokens
      const vendorWithTokens = await Vendor.findById(vendor._id).select('+fcmTokenMobile');
      
      // Use mobile/webview tokens only
      const uniqueTokens = [...(vendorWithTokens?.fcmTokenMobile || [])];
      
      if (uniqueTokens.length > 0) {
        const notificationData = {
          title: '✅ Account Access Granted',
          body: 'Your account has been activated! You can now access all features without ₹3999 deposit.',
          data: {
            type: 'account_access_granted',
            vendorId: vendor.vendorId,
            timestamp: new Date().toISOString(),
            action: 'refresh_profile'
          }
        };

        const pushResult = await sendMulticastPushNotification(uniqueTokens, notificationData);
        logger.info('Account access notification sent successfully', {
          vendorId: vendor._id,
          email: vendor.email,
          successCount: pushResult.successCount,
          failureCount: pushResult.failureCount,
          totalTokens: uniqueTokens.length
        });
      } else {
        logger.warn('No FCM tokens found for vendor to send account access notification', {
          vendorId: vendor._id,
          email: vendor.email
        });
      }
    } catch (notificationError) {
      logger.error('Failed to send account access notification:', notificationError);
      // Don't fail the grant access if notification fails
    }

    logger.info('Account access granted to vendor by admin', {
      vendorId: vendor._id,
      vendorEmail: vendor.email,
      adminId: req.admin?._id
    });

    res.json({
      success: true,
      message: 'Account access granted successfully. Vendor can now access all features without ₹3999 deposit.',
      data: { 
        vendor: {
          id: vendor._id,
          vendorId: vendor.vendorId,
          hasInitialDeposit: vendor.wallet.hasInitialDeposit
        }
      }
    });
  } catch (error) {
    logger.error('Error granting account access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grant account access',
      error: error.message
    });
  }
});

module.exports = {
  getVendors,
  getVendorStats,
  getVendor,
  updateVendorStatus,
  updateVendor,
  deleteVendor,
  sendEmailToVendor,
  updateVendorRatings,
  grantAccountAccess
};
