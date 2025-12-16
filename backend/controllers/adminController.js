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

    // Get revenue calculations from actual bookings and support tickets including admin commission
    const [monthlyRevenueResult, totalRevenueResult, pendingBookingsResult, monthlySupportTicketRevenueResult, totalSupportTicketRevenueResult] = await Promise.all([
      // Monthly revenue from completed bookings (booking amount + admin commission)
      Booking.aggregate([
        {
          $match: {
            status: 'completed',
            'payment.status': 'completed',
            createdAt: { $gte: startDate, $lte: endDate },
            'pricing.totalAmount': { $exists: true, $ne: null, $gt: 0 }
          }
        },
        {
          $addFields: {
            // Calculate admin commission from completion data
            adminCommission: {
              $cond: {
                if: { $and: [
                  { $ne: ['$completionData', null] },
                  { $ne: ['$completionData.billingAmount', null] }
                ]},
                then: {
                  $let: {
                    vars: {
                      billingAmount: { $toDouble: '$completionData.billingAmount' },
                      spareAmount: {
                        $sum: {
                          $map: {
                            input: { $ifNull: ['$completionData.spareParts', []] },
                            as: 'part',
                            in: { $toDouble: { $replaceAll: { input: '$$part.amount', find: '₹', replacement: '' } } }
                          }
                        }
                      },
                      travellingAmount: { $toDouble: { $ifNull: ['$completionData.travelingAmount', 0] } },
                      bookingAmount: { $toDouble: { $ifNull: ['$pricing.totalAmount', 0] } }
                    },
                    in: {
                      $cond: {
                        if: { $lte: ['$$billingAmount', 500] },
                        then: { $multiply: [{ $ifNull: ['$pricing.totalAmount', 0] }, 0.5] }, // For amounts <= 500, admin gets half of booking amount
                        else: {
                          $add: [
                            { $multiply: [{ $subtract: ['$$billingAmount', { $add: ['$$spareAmount', '$$travellingAmount', '$$bookingAmount'] }] }, 0.5] },
                            { $multiply: ['$$bookingAmount', 0.5] } // Admin gets half of booking amount
                          ]
                        }
                      }
                    }
                  }
                },
                else: { $multiply: [{ $ifNull: ['$pricing.totalAmount', 0] }, 0.5] } // Admin gets half of booking amount
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$adminCommission' }
          }
        }
      ]),
      // Total revenue from all completed bookings (booking amount + admin commission)
      Booking.aggregate([
        {
          $match: {
            status: 'completed',
            'payment.status': 'completed',
            'pricing.totalAmount': { $exists: true, $ne: null, $gt: 0 }
          }
        },
        {
          $addFields: {
            // Calculate admin commission from completion data
            adminCommission: {
              $cond: {
                if: { $and: [
                  { $ne: ['$completionData', null] },
                  { $ne: ['$completionData.billingAmount', null] }
                ]},
                then: {
                  $let: {
                    vars: {
                      billingAmount: { $toDouble: '$completionData.billingAmount' },
                      spareAmount: {
                        $sum: {
                          $map: {
                            input: { $ifNull: ['$completionData.spareParts', []] },
                            as: 'part',
                            in: { $toDouble: { $replaceAll: { input: '$$part.amount', find: '₹', replacement: '' } } }
                          }
                        }
                      },
                      travellingAmount: { $toDouble: { $ifNull: ['$completionData.travelingAmount', 0] } },
                      bookingAmount: { $toDouble: { $ifNull: ['$pricing.totalAmount', 0] } }
                    },
                    in: {
                      $cond: {
                        if: { $lte: ['$$billingAmount', 500] },
                        then: { $multiply: [{ $ifNull: ['$pricing.totalAmount', 0] }, 0.5] }, // For amounts <= 500, admin gets half of booking amount
                        else: {
                          $add: [
                            { $multiply: [{ $subtract: ['$$billingAmount', { $add: ['$$spareAmount', '$$travellingAmount', '$$bookingAmount'] }] }, 0.5] },
                            { $multiply: ['$$bookingAmount', 0.5] } // Admin gets half of booking amount
                          ]
                        }
                      }
                    }
                  }
                },
                else: { $multiply: [{ $ifNull: ['$pricing.totalAmount', 0] }, 0.5] } // Admin gets half of booking amount
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$adminCommission' }
          }
        }
      ]),
      // Pending bookings count (bookings that are pending confirmation)
      Booking.countDocuments({ 
        status: { $in: ['pending', 'confirmed', 'in_progress'] },
        'payment.status': { $ne: 'completed' }
      }),
      // Monthly revenue from completed support tickets (admin commission)
      SupportTicket.aggregate([
        {
          $match: {
            status: 'Resolved',
            paymentStatus: 'collected',
            createdAt: { $gte: startDate, $lte: endDate },
            billingAmount: { $exists: true, $ne: null, $gt: 0 }
          }
        },
        {
          $addFields: {
            // Calculate admin commission from support ticket completion data (same logic as bookings)
            adminCommission: {
              $cond: {
                if: { $and: [
                  { $ne: ['$completionData', null] },
                  { $ne: ['$completionData.billingAmount', null] }
                ]},
                then: {
                  $let: {
                    vars: {
                      billingAmount: { $toDouble: '$completionData.billingAmount' },
                      spareAmount: {
                        $sum: {
                          $map: {
                            input: { $ifNull: ['$completionData.spareParts', []] },
                            as: 'part',
                            in: { $toDouble: { $replaceAll: { input: '$$part.amount', find: '₹', replacement: '' } } }
                          }
                        }
                      },
                      travellingAmount: { $toDouble: { $ifNull: ['$completionData.travelingAmount', 0] } },
                      supportTicketBaseAmount: 0 // Support tickets don't have base amount like bookings
                    },
                    in: {
                      $cond: {
                        if: { $lte: ['$$billingAmount', 500] },
                        then: 0, // For amounts <= 500, admin gets nothing (no base amount for support tickets)
                        else: {
                          $multiply: [{ $subtract: ['$$billingAmount', { $add: ['$$spareAmount', '$$travellingAmount', '$$supportTicketBaseAmount'] }] }, 0.5]
                        }
                      }
                    }
                  }
                },
                else: 0 // No completion data means no admin commission
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$adminCommission' }
          }
        }
      ]),
      // Total revenue from all completed support tickets (admin commission)
      SupportTicket.aggregate([
        {
          $match: {
            status: 'Resolved',
            paymentStatus: 'collected',
            billingAmount: { $exists: true, $ne: null, $gt: 0 }
          }
        },
        {
          $addFields: {
            // Calculate admin commission from support ticket completion data (same logic as bookings)
            adminCommission: {
              $cond: {
                if: { $and: [
                  { $ne: ['$completionData', null] },
                  { $ne: ['$completionData.billingAmount', null] }
                ]},
                then: {
                  $let: {
                    vars: {
                      billingAmount: { $toDouble: '$completionData.billingAmount' },
                      spareAmount: {
                        $sum: {
                          $map: {
                            input: { $ifNull: ['$completionData.spareParts', []] },
                            as: 'part',
                            in: { $toDouble: { $replaceAll: { input: '$$part.amount', find: '₹', replacement: '' } } }
                          }
                        }
                      },
                      travellingAmount: { $toDouble: { $ifNull: ['$completionData.travelingAmount', 0] } },
                      supportTicketBaseAmount: 0 // Support tickets don't have base amount like bookings
                    },
                    in: {
                      $cond: {
                        if: { $lte: ['$$billingAmount', 500] },
                        then: 0, // For amounts <= 500, admin gets nothing (no base amount for support tickets)
                        else: {
                          $multiply: [{ $subtract: ['$$billingAmount', { $add: ['$$spareAmount', '$$travellingAmount', '$$supportTicketBaseAmount'] }] }, 0.5]
                        }
                      }
                    }
                  }
                },
                else: 0 // No completion data means no admin commission
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$adminCommission' }
          }
        }
      ])
    ]);

    const monthlyBookingRevenue = monthlyRevenueResult.length > 0 ? (monthlyRevenueResult[0].total || 0) : 0;
    const totalBookingRevenue = totalRevenueResult.length > 0 ? (totalRevenueResult[0].total || 0) : 0;
    const monthlySupportTicketRevenue = monthlySupportTicketRevenueResult.length > 0 ? (monthlySupportTicketRevenueResult[0].total || 0) : 0;
    const totalSupportTicketRevenue = totalSupportTicketRevenueResult.length > 0 ? (totalSupportTicketRevenueResult[0].total || 0) : 0;
    
    // Combine booking and support ticket revenue
    const monthlyRevenue = monthlyBookingRevenue + monthlySupportTicketRevenue;
    const totalRevenue = totalBookingRevenue + totalSupportTicketRevenue;
    const pendingBookings = pendingBookingsResult || 0;

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
