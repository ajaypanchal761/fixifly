const Admin = require('../models/Admin');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Blog = require('../models/Blog');
const Card = require('../models/Card');
const { Booking } = require('../models/Booking');
const AMCSubscription = require('../models/AMCSubscription');
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
      pendingVendors,
      activeVendors,
      totalBlogs,
      totalCards,
      activeAMCSubscriptions
    ] = await Promise.all([
      User.countDocuments(),
      Vendor.countDocuments(),
      Card.countDocuments({ status: 'active' }),
      Booking.countDocuments(),
      Vendor.countDocuments({ isApproved: false }),
      Vendor.countDocuments({ isApproved: true, isActive: true }),
      Blog.countDocuments(),
      Card.countDocuments(),
      AMCSubscription.countDocuments({ status: 'active' })
    ]);

    // Get revenue calculations from actual bookings
    const [monthlyRevenueResult, totalRevenueResult, pendingBookingsResult] = await Promise.all([
      // Monthly revenue from completed bookings
      Booking.aggregate([
        {
          $match: {
            status: 'completed',
            'payment.status': 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.totalAmount' }
          }
        }
      ]),
      // Total revenue from all completed bookings
      Booking.aggregate([
        {
          $match: {
            status: 'completed',
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.totalAmount' }
          }
        }
      ]),
      // Pending bookings count
      Booking.countDocuments({ status: 'pending' })
    ]);

    const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
    const pendingBookings = pendingBookingsResult;

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
        totalRevenue,
        monthlyRevenue,
        pendingVendors,
        activeVendors,
        pendingBookings,
        activeAMCSubscriptions
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

// @desc    Update FCM token for push notifications
// @route   POST /api/admin/update-fcm-token
// @access  Private (Admin)
const updateFCMToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  const adminId = req.admin._id;

  if (!fcmToken) {
    return res.status(400).json({
      success: false,
      message: 'FCM token is required'
    });
  }

  try {
    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { 
        fcmToken,
        'notificationSettings.pushNotifications': true
      },
      { new: true }
    ).select('fcmToken notificationSettings');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    logger.info('FCM token updated for admin', {
      adminId: adminId.toString(),
      adminEmail: req.admin.email,
      hasToken: !!admin.fcmToken
    });

    res.json({
      success: true,
      message: 'FCM token updated successfully',
      data: {
        fcmToken: admin.fcmToken,
        pushNotificationsEnabled: admin.notificationSettings.pushNotifications
      }
    });
  } catch (error) {
    logger.error('Error updating FCM token:', {
      error: error.message,
      adminId: adminId.toString()
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update FCM token',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
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
  getDashboardStats,
  updateFCMToken
};
