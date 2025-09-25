const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  deleteProfileImage,
  getUserStats,
  updateUserPreferences,
  deactivateAccount,
  reactivateAccount,
  changePhoneNumber,
  getUserActivity,
  exportUserData
} = require('../controllers/userController');

const router = express.Router();
const { protect } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');

// All routes are protected (require authentication)
router.use(protect);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', updateUserProfile);

// @route   POST /api/users/profile/image
// @desc    Upload profile image
// @access  Private
router.post('/profile/image', 
  uploadMiddleware.singleProfileImage(),
  uploadMiddleware.handleUploadError,
  uploadProfileImage
);

// @route   DELETE /api/users/profile/image
// @desc    Delete profile image
// @access  Private
router.delete('/profile/image', deleteProfileImage);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', getUserStats);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', updateUserPreferences);

// @route   PUT /api/users/deactivate
// @desc    Deactivate user account
// @access  Private
router.put('/deactivate', deactivateAccount);

// @route   PUT /api/users/reactivate
// @desc    Reactivate user account
// @access  Private
router.put('/reactivate', reactivateAccount);

// @route   POST /api/users/change-phone
// @desc    Change phone number
// @access  Private
router.post('/change-phone', changePhoneNumber);

// @route   GET /api/users/activity
// @desc    Get user activity log
// @access  Private
router.get('/activity', getUserActivity);

// @route   GET /api/users/export
// @desc    Export user data
// @access  Private
router.get('/export', exportUserData);

module.exports = router;

