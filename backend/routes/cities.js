const express = require('express');
const router = express.Router();
const {
  // Admin endpoints
  getAllCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  toggleCityStatus,
  getCityStats,
  
  // User endpoints
  getActiveCities,
  getActiveCityById,
  searchCities,
  getCitiesByState
} = require('../controllers/cityController');

const { protectAdmin, requirePermission } = require('../middleware/adminAuth');

// ==================== ADMIN ROUTES ====================

// @desc    Admin city management routes
// @route   GET /api/admin/cities
// @access  Private (Admin with cityManagement permission)
router.get('/admin/cities', protectAdmin, requirePermission('cityManagement'), getAllCities);

// @route   GET /api/admin/cities/stats
// @access  Private (Admin with cityManagement permission)
router.get('/admin/cities/stats', protectAdmin, requirePermission('cityManagement'), getCityStats);

// @route   GET /api/admin/cities/:id
// @access  Private (Admin with cityManagement permission)
router.get('/admin/cities/:id', protectAdmin, requirePermission('cityManagement'), getCityById);

// @route   POST /api/admin/cities
// @access  Private (Admin with cityManagement permission)
router.post('/admin/cities', protectAdmin, requirePermission('cityManagement'), createCity);

// @route   PUT /api/admin/cities/:id
// @access  Private (Admin with cityManagement permission)
router.put('/admin/cities/:id', protectAdmin, requirePermission('cityManagement'), updateCity);

// @route   DELETE /api/admin/cities/:id
// @access  Private (Admin with cityManagement permission)
router.delete('/admin/cities/:id', protectAdmin, requirePermission('cityManagement'), deleteCity);

// @route   PUT /api/admin/cities/:id/toggle-status
// @access  Private (Admin with cityManagement permission)
router.put('/admin/cities/:id/toggle-status', protectAdmin, requirePermission('cityManagement'), toggleCityStatus);

// ==================== USER ROUTES ====================

// @desc    Public city routes for users
// @route   GET /api/cities
// @access  Public
router.get('/cities', getActiveCities);

// @route   GET /api/cities/search
// @access  Public
router.get('/cities/search', searchCities);

// @route   GET /api/cities/state/:state
// @access  Public
router.get('/cities/state/:state', getCitiesByState);

// @route   GET /api/cities/:id
// @access  Public
router.get('/cities/:id', getActiveCityById);

module.exports = router;
