const express = require('express');
const router = express.Router();
const {
  // Admin endpoints
  getAllCards,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
  toggleCardStatus,
  togglePopularStatus,
  toggleFeaturedStatus,
  getCardStats,
  
  // User endpoints
  getActiveCards,
  getActiveCardById,
  getPopularCards,
  getFeaturedCards,
  getCardsBySpeciality,
  searchCards,
  incrementCardClicks,
  getSpecialities
} = require('../controllers/cardController');

const { protectAdmin, requirePermission } = require('../middleware/adminAuth');
const uploadMiddleware = require('../middleware/upload');

// ==================== ADMIN ROUTES ====================

// @desc    Admin card management routes
// @route   GET /api/admin/cards
// @access  Private (Admin with cardManagement permission)
router.get('/admin/cards', protectAdmin, requirePermission('cardManagement'), getAllCards);

// @route   GET /api/admin/cards/stats
// @access  Private (Admin with cardManagement permission)
router.get('/admin/cards/stats', protectAdmin, requirePermission('cardManagement'), getCardStats);

// @route   GET /api/admin/cards/:id
// @access  Private (Admin with cardManagement permission)
router.get('/admin/cards/:id', protectAdmin, requirePermission('cardManagement'), getCardById);

// @route   POST /api/admin/cards
// @access  Private (Admin with cardManagement permission)
router.post('/admin/cards', protectAdmin, requirePermission('cardManagement'), uploadMiddleware.singleProfileImage(), createCard);

// @route   PUT /api/admin/cards/:id
// @access  Private (Admin with cardManagement permission)
router.put('/admin/cards/:id', protectAdmin, requirePermission('cardManagement'), uploadMiddleware.singleProfileImage(), updateCard);

// @route   DELETE /api/admin/cards/:id
// @access  Private (Admin with cardManagement permission)
router.delete('/admin/cards/:id', protectAdmin, requirePermission('cardManagement'), deleteCard);

// @route   PUT /api/admin/cards/:id/toggle-status
// @access  Private (Admin with cardManagement permission)
router.put('/admin/cards/:id/toggle-status', protectAdmin, requirePermission('cardManagement'), toggleCardStatus);

// @route   PUT /api/admin/cards/:id/toggle-popular
// @access  Private (Admin with cardManagement permission)
router.put('/admin/cards/:id/toggle-popular', protectAdmin, requirePermission('cardManagement'), togglePopularStatus);

// @route   PUT /api/admin/cards/:id/toggle-featured
// @access  Private (Admin with cardManagement permission)
router.put('/admin/cards/:id/toggle-featured', protectAdmin, requirePermission('cardManagement'), toggleFeaturedStatus);

// ==================== USER ROUTES ====================

// @desc    Public card routes for users
// @route   GET /api/cards
// @access  Public
router.get('/cards', getActiveCards);

// @route   GET /api/cards/popular
// @access  Public
router.get('/cards/popular', getPopularCards);

// @route   GET /api/cards/featured
// @access  Public
router.get('/cards/featured', getFeaturedCards);

// @route   GET /api/cards/specialities
// @access  Public
router.get('/cards/specialities', getSpecialities);

// @route   GET /api/cards/search
// @access  Public
router.get('/cards/search', searchCards);

// @route   GET /api/cards/speciality/:speciality
// @access  Public
router.get('/cards/speciality/:speciality', getCardsBySpeciality);

// @route   GET /api/cards/:id
// @access  Public
router.get('/cards/:id', getActiveCardById);

// @route   POST /api/cards/:id/click
// @access  Public
router.post('/cards/:id/click', incrementCardClicks);

module.exports = router;
