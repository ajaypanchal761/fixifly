const express = require('express');
const {
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
} = require('../controllers/vendorController');
const {
  getVendorNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getVendorSupportTickets,
  getVendorDashboard
} = require('../controllers/vendorNotificationController');
const { protectVendor, requireCompleteProfile, requireApproval } = require('../middleware/vendorAuth');
const uploadMiddleware = require('../middleware/upload');

const router = express.Router();

// Public routes
// @route   GET /api/vendors/test
// @desc    Test endpoint
// @access  Public
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Vendor API is working',
    timestamp: new Date().toISOString()
  });
});

// @route   POST /api/vendors/register
// @desc    Register new vendor
// @access  Public
router.post('/register', registerVendor);

// @route   POST /api/vendors/login
// @desc    Login vendor
// @access  Public
router.post('/login', loginVendor);

// Protected routes (require authentication)
// @route   GET /api/vendors/profile
// @desc    Get vendor profile
// @access  Private
router.get('/profile', protectVendor, getVendorProfile);

// @route   PUT /api/vendors/profile
// @desc    Update vendor profile
// @access  Private
router.put('/profile', protectVendor, updateVendorProfile);

// @route   PUT /api/vendors/change-password
// @desc    Change vendor password
// @access  Private
router.put('/change-password', protectVendor, changePassword);

// @route   POST /api/vendors/profile/image
// @desc    Upload vendor profile image
// @access  Private
router.post('/profile/image', 
  protectVendor,
  uploadMiddleware.singleProfileImage(),
  uploadMiddleware.handleUploadError,
  uploadVendorProfileImage
);

// @route   DELETE /api/vendors/profile/image
// @desc    Delete vendor profile image
// @access  Private
router.delete('/profile/image', protectVendor, deleteVendorProfileImage);

// @route   GET /api/vendors/stats
// @desc    Get vendor statistics
// @access  Private
router.get('/stats', protectVendor, getVendorStats);

// @route   PUT /api/vendors/deactivate
// @desc    Deactivate vendor account
// @access  Private
router.put('/deactivate', protectVendor, deactivateAccount);

// @route   GET /api/vendors/wallet
// @desc    Get vendor wallet information
// @access  Private
router.get('/wallet', protectVendor, getVendorWallet);

// @route   POST /api/vendors/deposit/create-order
// @desc    Create deposit order for vendor
// @access  Private
router.post('/deposit/create-order', protectVendor, createDepositOrder);

// @route   POST /api/vendors/deposit/verify
// @desc    Verify vendor deposit payment
// @access  Private
router.post('/deposit/verify', protectVendor, verifyDepositPayment);

// Routes that require complete profile

// Routes that require approval
// @route   GET /api/vendors/tasks
// @desc    Get available tasks for vendor
// @access  Private (Approval Required)
router.get('/tasks', protectVendor, requireCompleteProfile, requireApproval, (req, res) => {
  res.json({
    success: true,
    message: 'Tasks access granted',
    data: {
      vendorId: req.vendor.vendorId,
      message: 'Available tasks would be here'
    }
  });
});

// Notification routes
// @route   GET /api/vendors/notifications
// @desc    Get vendor notifications
// @access  Private
router.get('/notifications', protectVendor, getVendorNotifications);

// @route   PUT /api/vendors/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', protectVendor, markNotificationAsRead);

// @route   PUT /api/vendors/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', protectVendor, markAllNotificationsAsRead);

// Support ticket routes
// @route   GET /api/vendors/support-tickets
// @desc    Get vendor assigned support tickets
// @access  Private
router.get('/support-tickets', protectVendor, getVendorSupportTickets);

// @route   PUT /api/vendors/support-tickets/:id/accept
// @desc    Accept support ticket
// @access  Private
router.put('/support-tickets/:id/accept', protectVendor, async (req, res) => {
  const { acceptSupportTicket } = require('../controllers/supportTicketController');
  return acceptSupportTicket(req, res);
});

// @route   PUT /api/vendors/support-tickets/:id/decline
// @desc    Decline support ticket
// @access  Private
router.put('/support-tickets/:id/decline', protectVendor, async (req, res) => {
  const { declineSupportTicket } = require('../controllers/supportTicketController');
  return declineSupportTicket(req, res);
});

// @route   PUT /api/vendors/support-tickets/:id/complete
// @desc    Complete support ticket
// @access  Private
router.put('/support-tickets/:id/complete', protectVendor, async (req, res) => {
  const { completeSupportTicket } = require('../controllers/supportTicketController');
  return completeSupportTicket(req, res);
});

// Dashboard route
// @route   GET /api/vendors/dashboard
// @desc    Get vendor dashboard with new tasks
// @access  Private
router.get('/dashboard', protectVendor, getVendorDashboard);

module.exports = router;
