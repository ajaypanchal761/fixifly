const express = require('express');
const uploadMiddleware = require('../middleware/upload');
const {
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
} = require('../controllers/adminController');

const {
  getWarrantyClaims,
  getWarrantyClaim,
  approveWarrantyClaim,
  rejectWarrantyClaim,
  assignVendorToClaim,
  completeWarrantyClaim
} = require('../controllers/adminWarrantyClaimController');

const {
  getAllUsers,
  getUserStats,
  getUserById,
  updateUserStatus,
  updateUser,
  deleteUser,
  sendEmailToUser
} = require('../controllers/adminUserController');

const router = express.Router();

const {
  protectAdmin,
  authorizeAdmin,
  requirePermission,
  requireSuperAdmin,
  logAdminActivity
} = require('../middleware/adminAuth');

// Import upload controller
const { uploadImage } = require('../controllers/uploadController');

// @desc    Admin authentication routes
// @route   POST /api/admin/register
// @access  Public (should be restricted in production)
router.post('/register', registerAdmin);

// @route   POST /api/admin/login
// @access  Public
router.post('/login', loginAdmin);

// @route   POST /api/admin/refresh-token
// @access  Public
router.post('/refresh-token', refreshAccessToken);

// @desc    Admin profile routes
// @route   GET /api/admin/profile
// @access  Private (Admin)
router.get('/profile', protectAdmin, getAdminProfile);

// @route   PUT /api/admin/profile
// @access  Private (Admin)
router.put('/profile', protectAdmin, updateAdminProfile);

// @desc    Admin password routes
// @route   PUT /api/admin/change-password
// @access  Private (Admin)
router.put('/change-password', protectAdmin, changePassword);
// @desc    Admin activity routes
// @route   GET /api/admin/activity-log
// @access  Private (Admin)
router.get('/activity-log', protectAdmin, getActivityLog);

// @route   POST /api/admin/logout
// @access  Private (Admin)
router.post('/logout', protectAdmin, logoutAdmin);

// @desc    Admin statistics routes
// @route   GET /api/admin/stats
// @access  Private (Admin)
router.get('/stats', protectAdmin, getAdminStats);

// @desc    Admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
router.get('/dashboard', protectAdmin, getDashboardStats);

// @desc    Admin management routes (Super Admin only)
// @route   GET /api/admin/list
// @access  Private (Super Admin)
router.get('/list', protectAdmin, requireSuperAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin list endpoint - to be implemented'
  });
});

// @route   PUT /api/admin/:id/activate
// @access  Private (Super Admin)
router.put('/:id/activate', protectAdmin, requireSuperAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin activation endpoint - to be implemented'
  });
});

// @route   PUT /api/admin/:id/deactivate
// @access  Private (Super Admin)
router.put('/:id/deactivate', protectAdmin, requireSuperAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin deactivation endpoint - to be implemented'
  });
});

// @route   PUT /api/admin/:id/block
// @access  Private (Super Admin)
router.put('/:id/block', protectAdmin, requireSuperAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin block endpoint - to be implemented'
  });
});

// @route   PUT /api/admin/:id/unblock
// @access  Private (Super Admin)
router.put('/:id/unblock', protectAdmin, requireSuperAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin unblock endpoint - to be implemented'
  });
});

// @desc    Permission-based routes
// @route   GET /api/admin/users
// @access  Private (Admin with userManagement permission)
router.get('/users', protectAdmin, requirePermission('userManagement'), getAllUsers);

// @route   GET /api/admin/users/stats
// @access  Private (Admin with userManagement permission)
router.get('/users/stats', protectAdmin, requirePermission('userManagement'), getUserStats);

// @route   GET /api/admin/users/:id
// @access  Private (Admin with userManagement permission)
router.get('/users/:id', protectAdmin, requirePermission('userManagement'), getUserById);

// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin with userManagement permission)
router.put('/users/:id/status', protectAdmin, requirePermission('userManagement'), updateUserStatus);

// @route   PUT /api/admin/users/:id
// @access  Private (Admin with userManagement permission)
router.put('/users/:id', protectAdmin, requirePermission('userManagement'), updateUser);

// @route   DELETE /api/admin/users/:id
// @access  Private (Admin with userManagement permission)
router.delete('/users/:id', protectAdmin, requirePermission('userManagement'), deleteUser);

// @route   POST /api/admin/users/:id/send-email
// @access  Private (Admin with userManagement permission)
router.post('/users/:id/send-email', protectAdmin, requirePermission('userManagement'), sendEmailToUser);

// Import admin vendor controller
const {
  getVendors,
  getVendorStats,
  getVendor,
  updateVendorStatus,
  updateVendor,
  deleteVendor,
  sendEmailToVendor,
  updateVendorRatings
} = require('../controllers/adminVendorController');

// @route   GET /api/admin/vendors
// @access  Private (Admin with vendorManagement permission)
router.get('/vendors', protectAdmin, requirePermission('vendorManagement'), getVendors);

// @route   GET /api/admin/vendors/stats
// @access  Private (Admin with vendorManagement permission)
router.get('/vendors/stats', protectAdmin, requirePermission('vendorManagement'), getVendorStats);

// @route   GET /api/admin/vendors/:id
// @access  Private (Admin with vendorManagement permission)
router.get('/vendors/:id', protectAdmin, requirePermission('vendorManagement'), getVendor);

// @route   PUT /api/admin/vendors/:id/status
// @access  Private (Admin with vendorManagement permission)
router.put('/vendors/:id/status', protectAdmin, requirePermission('vendorManagement'), updateVendorStatus);

// @route   PUT /api/admin/vendors/:id
// @access  Private (Admin with vendorManagement permission)
router.put('/vendors/:id', protectAdmin, requirePermission('vendorManagement'), updateVendor);

// @route   DELETE /api/admin/vendors/:id
// @access  Private (Admin with vendorManagement permission)
router.delete('/vendors/:id', protectAdmin, requirePermission('vendorManagement'), deleteVendor);

// @route   POST /api/admin/vendors/:id/send-email
// @access  Private (Admin with vendorManagement permission)
router.post('/vendors/:id/send-email', protectAdmin, requirePermission('vendorManagement'), sendEmailToVendor);

// @route   POST /api/admin/vendors/update-ratings
// @access  Private (Admin with vendorManagement permission)
router.post('/vendors/update-ratings', protectAdmin, requirePermission('vendorManagement'), updateVendorRatings);

// Note: Booking management routes are handled by adminBookingRoutes in server.js

// @route   GET /api/admin/payments
// @access  Private (Admin with paymentManagement permission)
router.get('/payments', protectAdmin, requirePermission('paymentManagement'), (req, res) => {
  res.json({
    success: true,
    message: 'Payment management endpoint - to be implemented'
  });
});

// @route   GET /api/admin/services
// @access  Private (Admin with serviceManagement permission)
router.get('/services', protectAdmin, requirePermission('serviceManagement'), (req, res) => {
  res.json({
    success: true,
    message: 'Service management endpoint - to be implemented'
  });
});



// Note: AMC management routes are handled by amcRoutes in server.js

// Warranty Claims Management
router.get('/warranty-claims', protectAdmin, requirePermission('amcManagement'), getWarrantyClaims);
router.get('/warranty-claims/:id', protectAdmin, requirePermission('amcManagement'), getWarrantyClaim);
router.put('/warranty-claims/:id/approve', protectAdmin, requirePermission('amcManagement'), approveWarrantyClaim);
router.put('/warranty-claims/:id/reject', protectAdmin, requirePermission('amcManagement'), rejectWarrantyClaim);
router.put('/warranty-claims/:id/assign-vendor', protectAdmin, requirePermission('amcManagement'), assignVendorToClaim);
router.put('/warranty-claims/:id/complete', protectAdmin, requirePermission('amcManagement'), completeWarrantyClaim);

// @route   GET /api/admin/support
// @access  Private (Admin with supportManagement permission)
router.get('/support', protectAdmin, requirePermission('supportManagement'), (req, res) => {
  res.json({
    success: true,
    message: 'Support management endpoint - to be implemented'
  });
});

// @route   GET /api/admin/analytics
// @access  Private (Admin with analytics permission)
router.get('/analytics', protectAdmin, requirePermission('analytics'), (req, res) => {
  res.json({
    success: true,
    message: 'Analytics endpoint - to be implemented'
  });
});

// @route   GET /api/admin/settings
// @access  Private (Admin with systemSettings permission)
router.get('/settings', protectAdmin, requirePermission('systemSettings'), (req, res) => {
  res.json({
    success: true,
    message: 'System settings endpoint - to be implemented'
  });
});

// @desc    Admin image upload route
// @route   POST /api/admin/upload/image
// @access  Private (Admin)
router.post('/upload/image', 
  protectAdmin,
  uploadMiddleware.getProfileImageUpload().single('file'),
  uploadMiddleware.handleUploadError,
  uploadImage
);


module.exports = router;
