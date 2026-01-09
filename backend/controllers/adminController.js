const Admin = require('../models/Admin');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Blog = require('../models/Blog');
const Card = require('../models/Card');
const { Booking } = require('../models/Booking');
const AMCSubscription = require('../models/AMCSubscription');
const SupportTicket = require('../models/SupportTicket');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwtUtils');

// @desc    Register new admin
// @route   POST /api/admin/register
// @access  Public (should be restricted in production)
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password, confirmPassword, department, designation } = req.body;

  // Validation
  if (!name || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  // Check if admin already exists
  const existingAdmin = await Admin.findByEmailOrPhone(email);
  if (existingAdmin) {
    return res.status(400).json({
      success: false,
      message: 'Admin with this email or phone already exists'
    });
  }

  // Generate unique admin ID
  const adminId = await Admin.generateAdminId();

  // Create admin
  const admin = await Admin.create({
    name,
    email,
    phone,
    password,
    adminId,
    department: department || 'Operations',
    designation: designation || 'Admin'
  });

  // Generate JWT token pair (access + refresh)
  const tokens = generateTokenPair(admin);
  
  // Store refresh token in database
  await admin.generateRefreshToken();

  // Log activity
  await admin.logActivity(
    'REGISTER',
    'New admin account created',
    'system',
    admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('New admin registered', {
    adminId: admin.adminId,
    email: admin.email,
    department: admin.department
  });

  res.status(201).json({
    success: true,
    message: 'Admin account created successfully',
    data: {
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.formattedPhone,
        role: admin.role,
        department: admin.department,
        designation: admin.designation,
        isActive: admin.isActive,
        createdAt: admin.createdAt
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresIn: tokens.accessTokenExpiresIn,
      refreshTokenExpiresIn: tokens.refreshTokenExpiresIn
    }
  });
});

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Find admin by email (include password for comparison)
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if account is locked
  if (admin.isAccountLocked()) {
    return res.status(401).json({
      success: false,
      message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
    });
  }

  // Check if admin is active
  if (!admin.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact system administrator.'
    });
  }

  // Check if admin is blocked
  if (admin.isBlocked) {
    return res.status(401).json({
      success: false,
      message: 'Account is blocked. Please contact system administrator.'
    });
  }

  // Check password
  const isPasswordValid = await admin.comparePassword(password);

  if (!isPasswordValid) {
    // Increment login attempts
    await admin.incrementLoginAttempts();
    
    logger.warn('Failed admin login attempt', {
      adminId: admin.adminId,
      email: admin.email,
      ip: req.ip
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  await admin.updateLastLogin(req.ip);

  // Generate JWT token pair (access + refresh)
  const tokens = generateTokenPair(admin);
  
  // Store refresh token in database
  await admin.generateRefreshToken();

  // Log activity
  await admin.logActivity(
    'LOGIN',
    'Admin logged in successfully',
    'system',
    admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('Admin logged in successfully', {
    adminId: admin.adminId,
    email: admin.email,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
        phone: admin.formattedPhone,
        role: admin.role,
        department: admin.department,
        designation: admin.designation,
        permissions: admin.permissions,
        isActive: admin.isActive,
        lastLoginAt: admin.stats.lastLoginAt
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresIn: tokens.accessTokenExpiresIn,
      refreshTokenExpiresIn: tokens.refreshTokenExpiresIn
    }
  });
});

// @desc    Refresh access token
// @route   POST /api/admin/refresh-token
// @access  Public
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find admin by ID
    const admin = await Admin.findById(decoded.adminId).select('+security.refreshToken');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if admin is blocked
    if (admin.isBlocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is blocked'
      });
    }

    // Verify refresh token in database
    if (!admin.verifyRefreshToken(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Generate new token pair
    const tokens = generateTokenPair(admin);
    
    // Update refresh token in database
    await admin.generateRefreshToken();

    // Log activity
    await admin.logActivity(
      'TOKEN_REFRESH',
      'Access token refreshed successfully',
      'system',
      admin._id.toString(),
      req.ip,
      req.get('User-Agent')
    );

    logger.info('Admin token refreshed', {
      adminId: admin.adminId,
      email: admin.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresIn: tokens.accessTokenExpiresIn,
        refreshTokenExpiresIn: tokens.refreshTokenExpiresIn
      }
    });

  } catch (error) {
    logger.error('Token refresh failed', {
      error: error.message,
      ip: req.ip
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @desc    Logout admin
// @route   POST /api/admin/logout
// @access  Private (Admin)
const logoutAdmin = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken && req.admin) {
    try {
      // Find admin and revoke refresh token
      const admin = await Admin.findById(req.admin._id);
      if (admin) {
        await admin.revokeRefreshToken();
        
        // Log activity
        await admin.logActivity(
          'LOGOUT',
          'Admin logged out successfully',
          'system',
          admin._id.toString(),
          req.ip,
          req.get('User-Agent')
        );
      }
    } catch (error) {
      logger.error('Logout error', { error: error.message });
    }
  }

  logger.info('Admin logged out', {
    adminId: req.admin?.adminId,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Get current admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  res.json({
    success: true,
    data: {
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.formattedPhone,
        role: admin.role,
        department: admin.department,
        designation: admin.designation,
        permissions: admin.permissions,
        isActive: admin.isActive,
        isEmailVerified: admin.isEmailVerified,
        isPhoneVerified: admin.isPhoneVerified,
        isProfileComplete: admin.isProfileComplete,
        stats: admin.stats,
        preferences: admin.preferences,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    }
  });
});

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin)
const updateAdminProfile = asyncHandler(async (req, res) => {
  const { name, phone, department, designation, preferences } = req.body;

  const admin = await Admin.findById(req.admin._id);

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  // Update fields
  if (name) admin.name = name;
  if (phone) admin.phone = phone;
  if (department) admin.department = department;
  if (designation) admin.designation = designation;
  if (preferences) {
    admin.preferences = { ...admin.preferences, ...preferences };
  }

  // Check if profile is complete
  admin.checkProfileComplete();

  // Update last modified by
  admin.lastModifiedBy = req.admin._id;

  await admin.save();

  // Log activity
  await admin.logActivity(
    'UPDATE_PROFILE',
    'Admin profile updated',
    'admin',
    admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('Admin profile updated', {
    adminId: admin.adminId,
    email: admin.email,
    updatedFields: Object.keys(req.body)
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.formattedPhone,
        role: admin.role,
        department: admin.department,
        designation: admin.designation,
        permissions: admin.permissions,
        isActive: admin.isActive,
        isProfileComplete: admin.isProfileComplete,
        preferences: admin.preferences,
        updatedAt: admin.updatedAt
      }
    }
  });
});

// @desc    Change admin password
// @route   PUT /api/admin/change-password
// @access  Private (Admin)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all password fields'
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'New passwords do not match'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  // Find admin with password
  const admin = await Admin.findById(req.admin._id).select('+password');

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  // Check current password
  const isCurrentPasswordValid = await admin.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  admin.password = newPassword;
  await admin.save();

  // Log activity
  await admin.logActivity(
    'CHANGE_PASSWORD',
    'Admin password changed',
    'admin',
    admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('Admin password changed', {
    adminId: admin.adminId,
    email: admin.email,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Get admin activity log
// @route   GET /api/admin/activity-log
// @access  Private (Admin)
const getActivityLog = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const admin = await Admin.findById(req.admin._id);

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  // Get activity log with pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const activities = admin.activityLog
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(admin.activityLog.length / limit),
        totalActivities: admin.activityLog.length,
        hasNext: endIndex < admin.activityLog.length,
        hasPrev: startIndex > 0
      }
    }
  });
});

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  res.json({
    success: true,
    data: {
      stats: admin.stats,
      permissions: admin.permissions,
      role: admin.role
    }
  });
});

// @desc    Get comprehensive dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Set date range for monthly stats
    let startDate, endDate;
    if (month && year) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Get total counts
    const [
      totalUsers,
      totalVendors,
      totalServices,
      totalBookings,
      totalSupportTickets,
      pendingVendors,
      activeVendors,
      blockedVendors,
      totalBlogs,
      totalCards,
      activeAMCSubscriptionsResult,
      pendingWithdrawalRequests
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Vendor.countDocuments(),
      Card.countDocuments({ status: 'active' }),
      Booking.countDocuments(),
      SupportTicket.countDocuments(),
      // Pending vendors: not approved but active (waiting for approval)
      Vendor.countDocuments({ 
        isApproved: false, 
        isActive: true, 
        isBlocked: false 
      }),
      // Active vendors: approved, active, and not blocked
      Vendor.countDocuments({ 
        isApproved: true, 
        isActive: true, 
        isBlocked: false 
      }),
      // Blocked vendors
      Vendor.countDocuments({ isBlocked: true }),
      Blog.countDocuments(),
      Card.countDocuments(),
      // Get AMC subscription count and total amount
      AMCSubscription.aggregate([
        {
          $match: { status: 'active' }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      // Pending withdrawal requests
      WithdrawalRequest.countDocuments({ status: 'pending' })
    ]);

    // Extract AMC subscription data
    const activeAMCSubscriptions = activeAMCSubscriptionsResult.length > 0 ? activeAMCSubscriptionsResult[0].count : 0;
    const totalAMCAmount = activeAMCSubscriptionsResult.length > 0 ? activeAMCSubscriptionsResult[0].totalAmount : 0;

    // First check what bookings exist
    const allBookings = await Booking.find({}).select('status payment paymentMode paymentStatus createdAt pricing completionData bookingReference').lean();
    console.log('🔍 ALL BOOKINGS IN DB:', JSON.stringify(allBookings, null, 2));
    
    const completedBookings = await Booking.find({
      status: 'completed'
    }).select('status payment paymentMode paymentStatus createdAt pricing completionData bookingReference').lean();
    console.log('🔍 COMPLETED BOOKINGS (status=completed):', JSON.stringify(completedBookings, null, 2));
    
    const completedWithPayment = await Booking.find({
      status: 'completed',
      'payment.status': 'completed'
    }).select('status payment paymentMode paymentStatus createdAt pricing completionData bookingReference').lean();
    console.log('🔍 COMPLETED BOOKINGS WITH PAYMENT:', JSON.stringify(completedWithPayment, null, 2));

    // Reusable expressions for admin commission calculation
    // Match completed bookings that have billing/pricing data (more flexible payment status)
    // billingAmount is stored as String, so we check for existence and non-empty
    const bookingMatchBase = {
      status: 'completed',
      $or: [
        { 
          'completionData.billingAmount': { 
            $exists: true, 
            $ne: null, 
            $ne: '',
            $nin: ['0', '0.00', '0.0']
          } 
        },
        { 'pricing.totalAmount': { $exists: true, $ne: null, $gt: 0 } },
        { 'billingAmount': { $exists: true, $ne: null, $ne: '' } }
      ]
    };

    // Helper function to safely convert to double with error handling (v2)
    const safeToDouble = (field, defaultValue = 0) => ({
      $convert: {
        input: field,
        to: 'double',
        onError: defaultValue,
        onNull: defaultValue
      }
    });

    // Helper function to safely parse spare part amount (handles null, undefined, and ₹ symbol)
    const safeSpareAmount = (amountField) => ({
      $convert: {
        input: {
          $replaceAll: {
            input: { $toString: { $ifNull: [amountField, '0'] } },
            find: '₹',
            replacement: ''
          }
        },
        to: 'double',
        onError: 0,
        onNull: 0
      }
    });

    // Stage 1: Calculate adminCommission
    const bookingCommissionAddFieldsStage1 = {
      $addFields: {
        adminCommission: {
          $cond: {
            if: {
              $and: [
                { $ne: ['$completionData', null] },
                { $ne: ['$completionData.billingAmount', null] }
              ]
            },
            then: {
              $let: {
                vars: {
                  billingAmount: safeToDouble('$completionData.billingAmount'),
                  spareAmount: {
                    $sum: {
                      $map: {
                        input: { $ifNull: ['$completionData.spareParts', []] },
                        as: 'part',
                        in: safeSpareAmount('$$part.amount')
                      }
                    }
                  },
                  travellingAmount: safeToDouble({ $ifNull: ['$completionData.travelingAmount', 0] })
                },
                in: {
                  $cond: {
                    if: { $lte: ['$$billingAmount', 300] },
                    then: 0, // Admin gets nothing if billing <= 300
                    else: {
                      $cond: {
                        if: { $lte: ['$$billingAmount', 500] },
                        then: { $multiply: ['$$billingAmount', 0.5] },
                        else: {
                          $multiply: [{ $subtract: ['$$billingAmount', { $add: ['$$spareAmount', '$$travellingAmount'] }] }, 0.5]
                        }
                      }
                    }
                  }
                }
              }
            },
            else: { $multiply: [{ $ifNull: ['$pricing.totalAmount', 0] }, 0.5] }
          }
        }
      }
    };
    // Stage 2: Calculate adminCommissionWithGST (needs adminCommission from previous stage)
    const bookingCommissionAddFieldsStage2 = {
      $addFields: {
        adminCommissionWithGST: {
          $cond: {
            // If adminCommission is 0 (billing <= 300), then adminCommissionWithGST should also be 0
            // Admin should not get GST if they're not getting any commission
            if: { $eq: ['$adminCommission', 0] },
            then: 0,
            else: {
              $add: [
                '$adminCommission',
                {
                  $cond: [
                    { $ifNull: ['$completionData.includeGST', false] },
                    safeToDouble({ $ifNull: ['$completionData.gstAmount', 0] }),
                    0
                  ]
                }
              ]
            }
          }
        }
      }
    };

    // Stage 1: Calculate adminCommission for support tickets
    const supportCommissionAddFieldsStage1 = {
      $addFields: {
        adminCommission: {
          $cond: {
            if: {
              $and: [
                { $ne: ['$completionData', null] },
                { $ne: ['$completionData.billingAmount', null] }
              ]
            },
            then: {
              $let: {
                vars: {
                  billingAmount: safeToDouble('$completionData.billingAmount'),
                  spareAmount: {
                    $sum: {
                      $map: {
                        input: { $ifNull: ['$completionData.spareParts', []] },
                        as: 'part',
                        in: safeSpareAmount('$$part.amount')
                      }
                    }
                  },
                  travellingAmount: safeToDouble({ $ifNull: ['$completionData.travelingAmount', 0] }),
                  supportTicketBaseAmount: 0
                },
                in: {
                  $cond: {
                    if: { $lte: ['$$billingAmount', 500] },
                    then: 0,
                    else: {
                      $multiply: [{ $subtract: ['$$billingAmount', { $add: ['$$spareAmount', '$$travellingAmount', '$$supportTicketBaseAmount'] }] }, 0.5]
                    }
                  }
                }
              }
            },
            else: 0
          }
        }
      }
    };
    // Stage 2: Calculate adminCommissionWithGST for support tickets
    const supportCommissionAddFieldsStage2 = {
      $addFields: {
        adminCommissionWithGST: {
          $cond: {
            // If adminCommission is 0 (billing <= 500 for support tickets), then adminCommissionWithGST should also be 0
            // Admin should not get GST if they're not getting any commission
            if: { $eq: ['$adminCommission', 0] },
            then: 0,
            else: {
              $add: [
                '$adminCommission',
                {
                  $cond: [
                    { $ifNull: ['$completionData.includeGST', false] },
                    safeToDouble({ $ifNull: ['$completionData.gstAmount', 0] }),
                    0
                  ]
                }
              ]
            }
          }
        }
      }
    };

    const buildBookingBreakdownPipeline = (dateRange) => {
      const matchStage = { ...bookingMatchBase };
      if (dateRange) {
        matchStage.createdAt = dateRange;
      }

      return [
        { $match: matchStage },
        bookingCommissionAddFieldsStage1,
        bookingCommissionAddFieldsStage2,
        {
          $lookup: {
            from: 'vendors',
            localField: 'vendor.vendorId',
            foreignField: 'vendorId',
            as: 'vendorInfo'
          }
        },
        { $unwind: { path: '$vendorInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            source: { $literal: 'booking' },
            reference: {
              $ifNull: [
                '$bookingReference',
                {
                  $let: {
                    vars: {
                      idStr: { $toString: '$_id' }
                    },
                    in: {
                      $concat: [
                        'FIX',
                        {
                          $toUpper: {
                            $substrBytes: [
                              '$$idStr',
                              {
                                $max: [
                                  { $subtract: [{ $strLenBytes: '$$idStr' }, 8] },
                                  0
                                ]
                              },
                              8
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              ]
            },
            vendorId: '$vendor.vendorId',
            vendorName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$vendorInfo.firstName', ''] },
                    ' ',
                    { $ifNull: ['$vendorInfo.lastName', ''] }
                  ]
                }
              }
            },
            paymentMethod: { $ifNull: ['$completionData.paymentMethod', '$payment.method'] },
            billingAmount: safeToDouble({
              $ifNull: [
                '$completionData.billingAmount',
                { $ifNull: ['$pricing.totalAmount', 0] }
              ]
            }),
            // Raw booking amount paid by user (platform fee / booking charge)
            bookingAmount: safeToDouble({ $ifNull: ['$pricing.totalAmount', 0] }),
            gstAmount: safeToDouble({ $ifNull: ['$completionData.gstAmount', 0] }),
            includeGST: { $ifNull: ['$completionData.includeGST', false] },
            effectiveBilling: {
              $add: [
                safeToDouble({
                  $ifNull: [
                    '$completionData.billingAmount',
                    { $ifNull: ['$pricing.totalAmount', 0] }
                  ]
                }),
                {
                  $cond: [
                    { $ifNull: ['$completionData.includeGST', false] },
                    safeToDouble({ $ifNull: ['$completionData.gstAmount', 0] }),
                    0
                  ]
                }
              ]
            },
            adminCommission: { $round: ['$adminCommission', 2] },
            adminCommissionWithGST: { $round: ['$adminCommissionWithGST', 2] },
            createdAt: '$createdAt'
          }
        },
        { $sort: { createdAt: -1 } }
      ];
    };

    const buildSupportBreakdownPipeline = (dateRange) => {
      const matchStage = {
        status: 'Resolved',
        paymentStatus: 'collected',
        billingAmount: { $exists: true, $ne: null, $gt: 0 }
      };
      if (dateRange) {
        matchStage.createdAt = dateRange;
      }

      return [
        { $match: matchStage },
        supportCommissionAddFieldsStage1,
        supportCommissionAddFieldsStage2,
        {
          $lookup: {
            from: 'vendors',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'vendorInfo'
          }
        },
        { $unwind: { path: '$vendorInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            source: { $literal: 'supportTicket' },
            reference: '$ticketId',
            vendorId: { $ifNull: ['$vendorInfo.vendorId', '$assignedTo'] },
            vendorName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$vendorInfo.firstName', ''] },
                    ' ',
                    { $ifNull: ['$vendorInfo.lastName', ''] }
                  ]
                }
              }
            },
            paymentMethod: { $ifNull: ['$completionData.paymentMethod', '$paymentMethod'] },
            billingAmount: safeToDouble({
              $ifNull: [
                '$completionData.billingAmount',
                { $ifNull: ['$billingAmount', 0] }
              ]
            }),
            gstAmount: safeToDouble({ $ifNull: ['$completionData.gstAmount', 0] }),
            includeGST: { $ifNull: ['$completionData.includeGST', false] },
            effectiveBilling: {
              $add: [
                safeToDouble({
                  $ifNull: [
                    '$completionData.billingAmount',
                    { $ifNull: ['$billingAmount', 0] }
                  ]
                }),
                {
                  $cond: [
                    { $ifNull: ['$completionData.includeGST', false] },
                    safeToDouble({ $ifNull: ['$completionData.gstAmount', 0] }),
                    0
                  ]
                }
              ]
            },
            adminCommission: { $round: ['$adminCommission', 2] },
            adminCommissionWithGST: { $round: ['$adminCommissionWithGST', 2] },
            createdAt: '$createdAt'
          }
        },
        { $sort: { createdAt: -1 } }
      ];
    };

    // Get revenue calculations from actual bookings and support tickets including admin commission
    const [
      monthlyRevenueResult,
      totalRevenueResult,
      pendingBookingsResult,
      monthlySupportTicketRevenueResult,
      totalSupportTicketRevenueResult,
      monthlyBookingBreakdown,
      totalBookingBreakdown,
      monthlySupportBreakdown,
      totalSupportBreakdown
    ] = await Promise.all([
      // Monthly revenue from completed bookings (booking amount + admin commission)
      Booking.aggregate([
        { $match: { ...bookingMatchBase, createdAt: { $gte: startDate, $lte: endDate } } },
        bookingCommissionAddFieldsStage1,
        bookingCommissionAddFieldsStage2,
        { $group: { _id: null, total: { $sum: '$adminCommissionWithGST' } } }
      ]),
      // Total revenue from all completed bookings (booking amount + admin commission)
      Booking.aggregate([
        { $match: bookingMatchBase },
        bookingCommissionAddFieldsStage1,
        bookingCommissionAddFieldsStage2,
        { $group: { _id: null, total: { $sum: '$adminCommissionWithGST' } } }
      ]),
      // Pending bookings count (bookings waiting for engineer assignment)
      Booking.countDocuments({ 
        status: 'waiting_for_engineer'
      }),
      // Monthly revenue from completed support tickets (admin commission)
      SupportTicket.aggregate([
        { $match: { status: 'Resolved', paymentStatus: 'collected', createdAt: { $gte: startDate, $lte: endDate }, billingAmount: { $exists: true, $ne: null, $gt: 0 } } },
        supportCommissionAddFieldsStage1,
        supportCommissionAddFieldsStage2,
        { $group: { _id: null, total: { $sum: '$adminCommissionWithGST' } } }
      ]),
      // Total revenue from all completed support tickets (admin commission)
      SupportTicket.aggregate([
        { $match: { status: 'Resolved', paymentStatus: 'collected', billingAmount: { $exists: true, $ne: null, $gt: 0 } } },
        supportCommissionAddFieldsStage1,
        supportCommissionAddFieldsStage2,
        { $group: { _id: null, total: { $sum: '$adminCommissionWithGST' } } }
      ]),
      // Detailed breakdowns (monthly & total)
      Booking.aggregate(buildBookingBreakdownPipeline({ $gte: startDate, $lte: endDate })),
      Booking.aggregate(buildBookingBreakdownPipeline(undefined)),
      SupportTicket.aggregate(buildSupportBreakdownPipeline({ $gte: startDate, $lte: endDate })),
      SupportTicket.aggregate(buildSupportBreakdownPipeline(undefined))
    ]);

    const monthlyBookingRevenue = monthlyRevenueResult.length > 0 ? (monthlyRevenueResult[0].total || 0) : 0;
    const totalBookingRevenue = totalRevenueResult.length > 0 ? (totalRevenueResult[0].total || 0) : 0;
    const monthlySupportTicketRevenue = monthlySupportTicketRevenueResult.length > 0 ? (monthlySupportTicketRevenueResult[0].total || 0) : 0;
    const totalSupportTicketRevenue = totalSupportTicketRevenueResult.length > 0 ? (totalSupportTicketRevenueResult[0].total || 0) : 0;
    
    // Log breakdown results for debugging
    console.log('🔍 BREAKDOWN DEBUG:', {
      monthlyBookingBreakdownCount: monthlyBookingBreakdown?.length || 0,
      totalBookingBreakdownCount: totalBookingBreakdown?.length || 0,
      monthlySupportBreakdownCount: monthlySupportBreakdown?.length || 0,
      totalSupportBreakdownCount: totalSupportBreakdown?.length || 0,
      monthlyBookingBreakdownSample: monthlyBookingBreakdown?.slice(0, 2) || [],
      totalBookingBreakdownSample: totalBookingBreakdown?.slice(0, 2) || []
    });
    
    // Build detailed breakdowns (merged booking + support tickets)
    const monthlyRevenueBreakdown = [
      ...(monthlyBookingBreakdown || []),
      ...(monthlySupportBreakdown || [])
    ].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const totalRevenueBreakdown = [
      ...(totalBookingBreakdown || []),
      ...(totalSupportBreakdown || [])
    ].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Combine booking and support ticket revenue
    let monthlyRevenue = monthlyBookingRevenue + monthlySupportTicketRevenue;
    let totalRevenue = totalBookingRevenue + totalSupportTicketRevenue;
    const pendingBookings = pendingBookingsResult || 0;

    // Fallback: if aggregation returned 0 but breakdown has entries, derive totals from breakdown (uses GST-inclusive commission when present)
    if (monthlyRevenue === 0 && Array.isArray(monthlyRevenueBreakdown) && monthlyRevenueBreakdown.length > 0) {
      monthlyRevenue = monthlyRevenueBreakdown.reduce((sum, item) => {
        if (item.adminCommissionWithGST !== undefined) return sum + (item.adminCommissionWithGST || 0);
        return sum + (item.adminCommission || 0);
      }, 0);
    }
    if (totalRevenue === 0 && Array.isArray(totalRevenueBreakdown) && totalRevenueBreakdown.length > 0) {
      totalRevenue = totalRevenueBreakdown.reduce((sum, item) => {
        if (item.adminCommissionWithGST !== undefined) return sum + (item.adminCommissionWithGST || 0);
        return sum + (item.adminCommission || 0);
      }, 0);
    }

    // Log revenue calculation for debugging
    console.log('🔍 REVENUE CALCULATION DEBUG:', {
      monthlyRevenue,
      totalRevenue,
      monthlyBookingRevenue,
      totalBookingRevenue,
      monthlySupportTicketRevenue,
      totalSupportTicketRevenue,
      pendingBookings,
      activeAMCSubscriptions,
      totalAMCAmount,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
      startDate,
      endDate
    });
    
    // Log detailed aggregation results
    console.log('🔍 MONTHLY REVENUE RESULT:', monthlyRevenueResult);
    console.log('🔍 TOTAL REVENUE RESULT:', totalRevenueResult);
    
    logger.info('Admin dashboard revenue calculation', {
      monthlyRevenue,
      totalRevenue,
      monthlyBookingRevenue,
      totalBookingRevenue,
      monthlySupportTicketRevenue,
      totalSupportTicketRevenue,
      pendingBookings,
      activeAMCSubscriptions,
      totalAMCAmount,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
      startDate,
      endDate
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      recentUsers,
      recentVendors,
      recentBookings
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Vendor.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);


    const dashboardStats = {
      overview: {
        totalUsers,
        totalVendors,
        totalServices,
        totalBookings,
        totalSupportTickets,
        totalRevenue,
        monthlyRevenue,
        pendingVendors,
        activeVendors,
        blockedVendors,
        pendingBookings,
        activeAMCSubscriptions,
        totalAMCAmount,
        pendingWithdrawalRequests: pendingWithdrawalRequests || 0
      },
      recentActivity: {
        recentUsers,
        recentVendors,
        recentBookings
      },
      dateRange: {
        startDate,
        endDate,
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear()
      },
      revenueBreakdown: {
        monthly: monthlyRevenueBreakdown,
        total: totalRevenueBreakdown
      }
    };

    logger.info('Dashboard stats fetched successfully', {
      adminId: req.admin._id,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear()
    });

    res.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    logger.error('Error fetching dashboard stats', {
      error: error.message,
      adminId: req.admin._id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

module.exports = {
  registerAdmin,
  loginAdmin,
  refreshAccessToken,
  logoutAdmin,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  getActivityLog,
  getAdminStats,
  getDashboardStats
};
