const City = require('../models/City');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

// @desc    Get all cities (Admin)
// @route   GET /api/admin/cities
// @access  Private (Admin)
const getAllCities = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    state, 
    isActive, 
    sortBy = 'name', 
    sortOrder = 'asc' 
  } = req.query;

  // Build query
  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { state: { $regex: search, $options: 'i' } },
      { 'coverage.areas': { $in: [new RegExp(search, 'i')] } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  if (state && state !== 'all') {
    query.state = { $regex: state, $options: 'i' };
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const cities = await City.find(query)
    .populate('createdBy', 'name email adminId')
    .populate('lastModifiedBy', 'name email adminId')
    .sort(sort)
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await City.countDocuments(query);

  res.json({
    success: true,
    data: {
      cities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCities: total,
        hasNext: endIndex < total,
        hasPrev: startIndex > 0
      }
    }
  });
});

// @desc    Get single city (Admin)
// @route   GET /api/admin/cities/:id
// @access  Private (Admin)
const getCityById = asyncHandler(async (req, res) => {
  const city = await City.findById(req.params.id)
    .populate('createdBy', 'name email adminId')
    .populate('lastModifiedBy', 'name email adminId');

  if (!city) {
    return res.status(404).json({
      success: false,
      message: 'City not found'
    });
  }

  res.json({
    success: true,
    data: { city }
  });
});

// @desc    Create new city (Admin)
// @route   POST /api/admin/cities
// @access  Private (Admin)
const createCity = asyncHandler(async (req, res) => {
  const {
    name,
    state,
    isActive,
    estimatedDeliveryTime,
    coverage,
    pricing,
    description,
    tags
  } = req.body;

  // Validation
  if (!name || !state) {
    return res.status(400).json({
      success: false,
      message: 'Please provide city name and state'
    });
  }

  // Check if city already exists
  const existingCity = await City.findOne({ 
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    state: { $regex: new RegExp(`^${state}$`, 'i') }
  });

  if (existingCity) {
    return res.status(400).json({
      success: false,
      message: 'City already exists in this state'
    });
  }

  // Create city
  const city = await City.create({
    name,
    state,
    isActive: isActive !== undefined ? isActive : true,
    estimatedDeliveryTime: estimatedDeliveryTime || 'Same Day',
    coverage: coverage || { pincodes: [], areas: [] },
    pricing: pricing || { baseServiceFee: 0, travelFee: 0, currency: 'INR' },
    description: description || '',
    tags: tags || [],
    createdBy: req.admin._id
  });

  // Log activity
  logger.info('New city created', {
    cityId: city._id,
    name: city.name,
    state: city.state,
    createdBy: req.admin._id
  });

  res.status(201).json({
    success: true,
    message: 'City created successfully',
    data: { city }
  });
});

// @desc    Update city (Admin)
// @route   PUT /api/admin/cities/:id
// @access  Private (Admin)
const updateCity = asyncHandler(async (req, res) => {
  const city = await City.findById(req.params.id);

  if (!city) {
    return res.status(404).json({
      success: false,
      message: 'City not found'
    });
  }

  // Check for duplicate city name and state
  if (req.body.name || req.body.state) {
    const name = req.body.name || city.name;
    const state = req.body.state || city.state;
    
    const existingCity = await City.findOne({ 
      _id: { $ne: city._id },
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      state: { $regex: new RegExp(`^${state}$`, 'i') }
    });

    if (existingCity) {
      return res.status(400).json({
        success: false,
        message: 'City already exists in this state'
      });
    }
  }

  // Update fields
  const allowedFields = [
    'name', 'state', 'isActive', 'estimatedDeliveryTime',
    'coverage', 'pricing', 'description', 'tags'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      city[field] = req.body[field];
    }
  });

  city.lastModifiedBy = req.admin._id;
  await city.save();

  // Log activity
  logger.info('City updated', {
    cityId: city._id,
    name: city.name,
    state: city.state,
    updatedBy: req.admin._id,
    updatedFields: Object.keys(req.body)
  });

  res.json({
    success: true,
    message: 'City updated successfully',
    data: { city }
  });
});

// @desc    Delete city (Admin)
// @route   DELETE /api/admin/cities/:id
// @access  Private (Admin)
const deleteCity = asyncHandler(async (req, res) => {
  const city = await City.findById(req.params.id);

  if (!city) {
    return res.status(404).json({
      success: false,
      message: 'City not found'
    });
  }

  await City.findByIdAndDelete(req.params.id);

  // Log activity
  logger.info('City deleted', {
    cityId: city._id,
    name: city.name,
    state: city.state,
    deletedBy: req.admin._id
  });

  res.json({
    success: true,
    message: 'City deleted successfully'
  });
});

// @desc    Toggle city active status (Admin)
// @route   PUT /api/admin/cities/:id/toggle-status
// @access  Private (Admin)
const toggleCityStatus = asyncHandler(async (req, res) => {
  const city = await City.findById(req.params.id);

  if (!city) {
    return res.status(404).json({
      success: false,
      message: 'City not found'
    });
  }

  await city.toggleActive();
  city.lastModifiedBy = req.admin._id;
  await city.save();

  // Log activity
  logger.info('City status toggled', {
    cityId: city._id,
    name: city.name,
    state: city.state,
    newStatus: city.isActive,
    toggledBy: req.admin._id
  });

  res.json({
    success: true,
    message: `City ${city.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { city }
  });
});

// @desc    Get city statistics (Admin)
// @route   GET /api/admin/cities/stats
// @access  Private (Admin)
const getCityStats = asyncHandler(async (req, res) => {
  const stats = await City.getCityStats();

  res.json({
    success: true,
    data: { stats: stats[0] || {} }
  });
});

// ==================== USER ENDPOINTS ====================

// @desc    Get all active cities (User)
// @route   GET /api/cities
// @access  Public
const getActiveCities = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    search, 
    state, 
    sortBy = 'name', 
    sortOrder = 'asc' 
  } = req.query;

  // Build query for active cities only
  const query = { isActive: true };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { state: { $regex: search, $options: 'i' } },
      { 'coverage.areas': { $in: [new RegExp(search, 'i')] } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  if (state && state !== 'all') {
    query.state = { $regex: state, $options: 'i' };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const cities = await City.find(query)
    .select('name state isActive serviceCount estimatedDeliveryTime coverage pricing stats')
    .sort(sort)
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await City.countDocuments(query);

  res.json({
    success: true,
    data: {
      cities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCities: total,
        hasNext: endIndex < total,
        hasPrev: startIndex > 0
      }
    }
  });
});

// @desc    Get single city (User)
// @route   GET /api/cities/:id
// @access  Public
const getActiveCityById = asyncHandler(async (req, res) => {
  const city = await City.findOne({ 
    _id: req.params.id, 
    isActive: true 
  })
  .select('name state isActive serviceCount estimatedDeliveryTime coverage pricing stats description tags');

  if (!city) {
    return res.status(404).json({
      success: false,
      message: 'City not found or inactive'
    });
  }

  res.json({
    success: true,
    data: { city }
  });
});

// @desc    Search cities (User)
// @route   GET /api/cities/search
// @access  Public
const searchCities = asyncHandler(async (req, res) => {
  const { q: query, state, limit = 20 } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const cities = await City.searchCities(query)
    .select('name state isActive serviceCount estimatedDeliveryTime coverage pricing stats')
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { cities }
  });
});

// @desc    Get cities by state (User)
// @route   GET /api/cities/state/:state
// @access  Public
const getCitiesByState = asyncHandler(async (req, res) => {
  const { state } = req.params;
  const { limit = 50 } = req.query;

  const cities = await City.getCitiesByState(state)
    .select('name state isActive serviceCount estimatedDeliveryTime coverage pricing stats')
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { cities }
  });
});

module.exports = {
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
};
