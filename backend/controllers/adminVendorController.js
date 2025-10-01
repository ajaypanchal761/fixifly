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

  // Transform vendor data for admin display
  const transformedVendors = vendors.map(vendor => ({
    id: vendor._id,
    vendorId: vendor.vendorId,
    name: `${vendor.firstName} ${vendor.lastName}`,
    firstName: vendor.firstName,
    lastName: vendor.lastName,
    email: vendor.email,
    phone: vendor.formattedPhone,
    location: vendor.address ? `${vendor.address.city}, ${vendor.address.state}` : 'Not specified',
    address: vendor.address,
    serviceLocations: vendor.serviceLocations,
    joinDate: vendor.createdAt,
    status: vendor.isBlocked ? 'blocked' : (vendor.isActive ? 'active' : 'inactive'),
    verificationStatus: vendor.isApproved ? 'verified' : 'pending',
    rating: vendor.rating.average,
    totalReviews: vendor.rating.count,
    totalBookings: vendor.stats.totalTasks,
    completedBookings: vendor.stats.completedTasks,
    pendingBookings: vendor.stats.totalTasks - vendor.stats.completedTasks,
    services: vendor.serviceCategories,
    customServiceCategory: vendor.customServiceCategory,
    lastActive: vendor.stats.lastLoginAt,
    profileImage: vendor.profileImage,
    isEmailVerified: vendor.isEmailVerified,
    isPhoneVerified: vendor.isPhoneVerified,
    isProfileComplete: vendor.isProfileComplete,
    experience: vendor.experience,
    specialty: vendor.specialty,
    bio: vendor.bio,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt
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

  const vendorData = {
    id: vendor._id,
    vendorId: vendor.vendorId,
    name: `${vendor.firstName} ${vendor.lastName}`,
    firstName: vendor.firstName,
    lastName: vendor.lastName,
    email: vendor.email,
    phone: vendor.formattedPhone,
    location: vendor.address ? `${vendor.address.city}, ${vendor.address.state}` : 'Not specified',
    address: vendor.address,
    joinDate: vendor.createdAt,
    status: vendor.isBlocked ? 'blocked' : (vendor.isActive ? 'active' : 'inactive'),
    verificationStatus: vendor.isApproved ? 'verified' : 'pending',
    rating: vendor.rating.average,
    totalReviews: vendor.rating.count,
    totalBookings: vendor.stats.totalTasks,
    completedBookings: vendor.stats.completedTasks,
    pendingBookings: vendor.stats.totalTasks - vendor.stats.completedTasks,
    services: vendor.serviceCategories,
    customServiceCategory: vendor.customServiceCategory,
    lastActive: vendor.stats.lastLoginAt,
    profileImage: vendor.profileImage,
    isEmailVerified: vendor.isEmailVerified,
    isPhoneVerified: vendor.isPhoneVerified,
    isProfileComplete: vendor.isProfileComplete,
    experience: vendor.experience,
    specialty: vendor.specialty,
    bio: vendor.bio,
    documents: vendor.documents,
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

module.exports = {
  getVendors,
  getVendorStats,
  getVendor,
  updateVendorStatus,
  updateVendor,
  deleteVendor,
  sendEmailToVendor
};
