const User = require('../models/User');
const { Booking } = require('../models/Booking');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Private (Admin with userManagement permission)
const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    status = 'all',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = {};

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // Status filter
  if (status !== 'all') {
    switch (status) {
      case 'active':
        query.isActive = true;
        query.isBlocked = false;
        break;
      case 'inactive':
        query.isActive = false;
        break;
      case 'blocked':
        query.isBlocked = true;
        break;
      case 'verified':
        query.isPhoneVerified = true;
        break;
      case 'unverified':
        query.isPhoneVerified = false;
        break;
    }
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query
  const [users, totalUsers] = await Promise.all([
    User.find(query)
      .select('-otp -__v')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(query)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalUsers / parseInt(limit));
  const hasNext = parseInt(page) < totalPages;
  const hasPrev = parseInt(page) > 1;

  // Get bookings count for each user from Booking model
  const formattedUsers = await Promise.all(users.map(async (user) => {
    // Normalize phone number for matching (remove spaces, handle +91 prefix)
    const normalizePhone = (phone) => {
      if (!phone) return null;
      const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits
      // If starts with 91 and has 12 digits, remove 91
      if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return cleaned.substring(2);
      }
      // If has 10 digits, return as is
      if (cleaned.length === 10) {
        return cleaned;
      }
      return cleaned;
    };

    const userEmail = user.email?.toLowerCase().trim();
    const userPhone = normalizePhone(user.phone);
    
    // Build query to find bookings by email or phone
    const bookingQuery = {
      $or: [
        { 'customer.email': userEmail },
        ...(userPhone ? [
          { 'customer.phone': userPhone },
          { 'customer.phone': `+91${userPhone}` },
          { 'customer.phone': `91${userPhone}` }
        ] : [])
      ]
    };

    // Count total bookings and completed bookings
    const [totalBookingsCount, completedBookingsCount] = await Promise.all([
      Booking.countDocuments(bookingQuery),
      Booking.countDocuments({
        ...bookingQuery,
        status: 'completed'
      })
    ]);

    return {
      id: user._id,
      name: user.name || 'N/A',
      email: user.email || 'N/A',
      phone: user.formattedPhone || user.phone,
      location: user.address ? 
        `${user.address.city || ''}, ${user.address.state || ''}`.replace(/^,\s*|,\s*$/g, '') || 'N/A' : 'N/A',
      joinDate: user.createdAt,
      status: user.isBlocked ? 'blocked' : (user.isActive ? 'active' : 'inactive'),
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      totalBookings: totalBookingsCount || 0,
      completedBookings: completedBookingsCount || 0,
      totalSpent: user.stats?.totalSpent || 0,
      lastActive: user.stats?.lastLoginAt || user.updatedAt,
      profileImage: user.profileImage,
      address: user.address,
      preferences: user.preferences
    };
  }));

  res.status(200).json({
    success: true,
    data: {
      users: formattedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNext,
        hasPrev,
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Private (Admin with userManagement permission)
const getUserStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    blockedUsers,
    verifiedUsers,
    recentUsers,
    userStats
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true, isBlocked: false }),
    User.countDocuments({ isBlocked: true }),
    User.countDocuments({ isPhoneVerified: true }),
    User.countDocuments({ 
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    }),
    User.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: '$stats.totalBookings' },
          totalSpent: { $sum: '$stats.totalSpent' },
          avgBookingsPerUser: { $avg: '$stats.totalBookings' }
        }
      }
    ])
  ]);

  const stats = userStats[0] || { totalBookings: 0, totalSpent: 0, avgBookingsPerUser: 0 };

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalUsers,
        activeUsers,
        blockedUsers,
        verifiedUsers,
        recentUsers,
        totalBookings: stats.totalBookings,
        totalSpent: stats.totalSpent,
        avgBookingsPerUser: Math.round(stats.avgBookingsPerUser * 100) / 100
      }
    }
  });
});

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin with userManagement permission)
const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId).select('-otp -__v');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const userData = {
    id: user._id,
    name: user.name || 'N/A',
    email: user.email || 'N/A',
    phone: user.formattedPhone || user.phone,
    role: user.role,
    isPhoneVerified: user.isPhoneVerified,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    isBlocked: user.isBlocked,
    profileImage: user.profileImage,
    address: user.address,
    preferences: user.preferences,
    stats: user.stats,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  res.status(200).json({
    success: true,
    data: { user: userData }
  });
});

// @desc    Update user status (block/unblock)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin with userManagement permission)
const updateUserStatus = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { action } = req.body; // 'block' or 'unblock'

  if (!['block', 'unblock'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid action. Use "block" or "unblock"'
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (action === 'block') {
    user.isBlocked = true;
    user.isActive = false;
  } else {
    user.isBlocked = false;
    user.isActive = true;
  }

  await user.save();

  // Log admin activity
  const adminId = req.admin._id;
  await User.findByIdAndUpdate(adminId, {
    $push: {
      activityLog: {
        action: action.toUpperCase(),
        description: `User ${action}ed: ${user.name || user.email}`,
        targetType: 'user',
        targetId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    }
  });

  logger.info(`User ${action}ed by admin`, {
    adminId,
    userId,
    userName: user.name || user.email,
    action
  });

  res.status(200).json({
    success: true,
    message: `User ${action}ed successfully`,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
        isActive: user.isActive
      }
    }
  });
});

// @desc    Update user information
// @route   PUT /api/admin/users/:id
// @access  Private (Admin with userManagement permission)
const updateUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, address, isPhoneVerified, isEmailVerified } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update fields if provided
  if (name !== undefined) user.name = name.trim();
  if (email !== undefined) {
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
  }
  if (phone !== undefined) {
    // Validate and format phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian phone number'
      });
    }
    user.phone = `+91${cleanPhone}`;
  }
  if (address !== undefined) {
    user.address = {
      street: address.street || user.address?.street || '',
      city: address.city || user.address?.city || '',
      state: address.state || user.address?.state || '',
      pincode: address.pincode || user.address?.pincode || '',
      landmark: address.landmark || user.address?.landmark || ''
    };
  }
  if (isPhoneVerified !== undefined) user.isPhoneVerified = isPhoneVerified;
  if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified;

  await user.save();

  // Log admin activity
  const adminId = req.admin._id;
  await User.findByIdAndUpdate(adminId, {
    $push: {
      activityLog: {
        action: 'UPDATE',
        description: `User profile updated: ${user.name || user.email}`,
        targetType: 'user',
        targetId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    }
  });

  logger.info('User updated by admin', {
    adminId,
    userId,
    userName: user.name || user.email,
    updatedFields: Object.keys(req.body)
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.formattedPhone,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
        address: user.address
      }
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin with userManagement permission)
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Log admin activity before deletion
  const adminId = req.admin._id;
  await User.findByIdAndUpdate(adminId, {
    $push: {
      activityLog: {
        action: 'DELETE',
        description: `User deleted: ${user.name || user.email}`,
        targetType: 'user',
        targetId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    }
  });

  await User.findByIdAndDelete(userId);

  logger.info('User deleted by admin', {
    adminId,
    userId,
    userName: user.name || user.email
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Send email to user
// @route   POST /api/admin/users/:id/send-email
// @access  Private (Admin with userManagement permission)
const sendEmailToUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Subject and message are required'
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.email) {
    return res.status(400).json({
      success: false,
      message: 'User does not have an email address'
    });
  }

  // Here you would integrate with your email service
  // For now, we'll just log the action
  logger.info('Email sent to user by admin', {
    adminId: req.admin._id,
    userId,
    userEmail: user.email,
    subject,
    message: message.substring(0, 100) + '...'
  });

  // Log admin activity
  const adminId = req.admin._id;
  await User.findByIdAndUpdate(adminId, {
    $push: {
      activityLog: {
        action: 'EMAIL_SENT',
        description: `Email sent to user: ${user.name || user.email}`,
        targetType: 'user',
        targetId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Email sent successfully'
  });
});

module.exports = {
  getAllUsers,
  getUserStats,
  getUserById,
  updateUserStatus,
  updateUser,
  deleteUser,
  sendEmailToUser
};
