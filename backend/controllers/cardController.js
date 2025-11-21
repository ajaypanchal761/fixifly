const Card = require('../models/Card');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const cloudinaryService = require('../utils/cloudinary');

// @desc    Get all cards (Admin)
// @route   GET /api/admin/cards
// @access  Private (Admin)
const getAllCards = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    speciality, 
    status, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  // Build query - Admin can see all cards regardless of status
  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { speciality: { $regex: search, $options: 'i' } },
      { subtitle: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (speciality && speciality !== 'all') {
    query.speciality = speciality;
  }
  
  // Allow admin to override status filter if needed
  if (status && status !== 'all') {
    query.status = status;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const cards = await Card.find(query)
    .populate('createdBy', 'name email adminId')
    .populate('lastModifiedBy', 'name email adminId')
    .sort(sort)
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await Card.countDocuments(query);

  res.json({
    success: true,
    data: {
      cards,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCards: total,
        hasNext: endIndex < total,
        hasPrev: startIndex > 0
      }
    }
  });
});

// @desc    Get single card (Admin)
// @route   GET /api/admin/cards/:id
// @access  Private (Admin)
const getCardById = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id)
    .populate('createdBy', 'name email adminId')
    .populate('lastModifiedBy', 'name email adminId');

  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }

  res.json({
    success: true,
    data: { card }
  });
});

// @desc    Create new card (Admin)
// @route   POST /api/admin/cards
// @access  Private (Admin)
const createCard = asyncHandler(async (req, res) => {
  const {
    name,
    speciality,
    subtitle,
    price,
    isPopular,
    isFeatured,
    location,
    serviceDetails,
    availability,
    tags,
    displayOrder
  } = req.body;

  // Validation
  if (!name || !speciality || !subtitle) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields (name, speciality, subtitle)'
    });
  }

  let imageUrl = null;

  // Handle image upload to Cloudinary
  if (req.file) {
    try {
      // Validate the uploaded file
      const validation = cloudinaryService.validateImageFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Upload to Cloudinary with card-specific folder
      const uploadResult = await cloudinaryService.uploadFromBuffer(req.file.buffer, {
        folder: 'fixifly/card-images',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
          { quality: 'auto' }
        ]
      });

      imageUrl = uploadResult.secure_url;

      logger.info('Card image uploaded to Cloudinary', {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url
      });
    } catch (error) {
      logger.error('Failed to upload card image to Cloudinary', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image. Please try again.'
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: 'Image is required'
    });
  }

  // Create card
  const cardData = {
    name,
    speciality,
    subtitle,
    image: imageUrl,
    isPopular: isPopular || false,
    isFeatured: isFeatured || false,
    location: location || {},
    serviceDetails: serviceDetails || {},
    availability: availability || {},
    tags: tags || [],
    displayOrder: displayOrder || 0,
    createdBy: req.admin._id
  };

  // Only add price if provided
  if (price !== undefined && price !== null && price !== '') {
    cardData.price = price;
  }

  const card = await Card.create(cardData);

  // Log activity
  logger.info('New card created', {
    cardId: card._id,
    name: card.name,
    speciality: card.speciality,
    createdBy: req.admin._id,
    imageUrl: imageUrl
  });

  res.status(201).json({
    success: true,
    message: 'Card created successfully',
    data: { card }
  });
});

// @desc    Update card (Admin)
// @route   PUT /api/admin/cards/:id
// @access  Private (Admin)
const updateCard = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);

  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }

  // Handle image upload to Cloudinary if new image is provided
  if (req.file) {
    try {
      // Validate the uploaded file
      const validation = cloudinaryService.validateImageFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Delete old image from Cloudinary if it exists
      if (card.image && card.image.includes('cloudinary.com')) {
        try {
          const publicId = cloudinaryService.extractPublicId(card.image);
          if (publicId) {
            await cloudinaryService.deleteImage(publicId);
            logger.info('Old card image deleted from Cloudinary', { public_id: publicId });
          }
        } catch (deleteError) {
          logger.warn('Failed to delete old card image from Cloudinary', { error: deleteError.message });
          // Continue with upload even if deletion fails
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await cloudinaryService.uploadFromBuffer(req.file.buffer, {
        folder: 'fixifly/card-images',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
          { quality: 'auto' }
        ]
      });

      card.image = uploadResult.secure_url;

      logger.info('Card image updated in Cloudinary', {
        cardId: card._id,
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url
      });
    } catch (error) {
      logger.error('Failed to upload card image to Cloudinary', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image. Please try again.'
      });
    }
  }

  // Update other fields
  const allowedFields = [
    'name', 'speciality', 'subtitle', 'price', 'status',
    'isPopular', 'isFeatured', 'location', 'serviceDetails',
    'availability', 'tags', 'displayOrder'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      card[field] = req.body[field];
    }
  });

  card.lastModifiedBy = req.admin._id;
  await card.save();

  // Log activity
  logger.info('Card updated', {
    cardId: card._id,
    name: card.name,
    updatedBy: req.admin._id,
    updatedFields: Object.keys(req.body),
    imageUpdated: !!req.file
  });

  res.json({
    success: true,
    message: 'Card updated successfully',
    data: { card }
  });
});

// @desc    Delete card (Admin)
// @route   DELETE /api/admin/cards/:id
// @access  Private (Admin)
const deleteCard = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);

  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }

  // Delete image from Cloudinary if it exists
  if (card.image && card.image.includes('cloudinary.com')) {
    try {
      const publicId = cloudinaryService.extractPublicId(card.image);
      if (publicId) {
        await cloudinaryService.deleteImage(publicId);
        logger.info('Card image deleted from Cloudinary', { public_id: publicId });
      }
    } catch (deleteError) {
      logger.warn('Failed to delete card image from Cloudinary', { 
        error: deleteError.message,
        cardId: card._id
      });
      // Continue with card deletion even if image deletion fails
    }
  }

  await Card.findByIdAndDelete(req.params.id);

  // Log activity
  logger.info('Card deleted', {
    cardId: card._id,
    name: card.name,
    deletedBy: req.admin._id
  });

  res.json({
    success: true,
    message: 'Card deleted successfully'
  });
});

// @desc    Toggle card status (Admin)
// @route   PUT /api/admin/cards/:id/toggle-status
// @access  Private (Admin)
const toggleCardStatus = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);

  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }

  await card.toggleStatus();
  card.lastModifiedBy = req.admin._id;
  await card.save();

  // Log activity
  logger.info('Card status toggled', {
    cardId: card._id,
    name: card.name,
    newStatus: card.status,
    toggledBy: req.admin._id
  });

  res.json({
    success: true,
    message: `Card ${card.status === 'active' ? 'activated' : 'deactivated'} successfully`,
    data: { card }
  });
});

// @desc    Toggle popular status (Admin)
// @route   PUT /api/admin/cards/:id/toggle-popular
// @access  Private (Admin)
const togglePopularStatus = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);

  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }

  await card.togglePopular();
  card.lastModifiedBy = req.admin._id;
  await card.save();

  // Log activity
  logger.info('Card popular status toggled', {
    cardId: card._id,
    name: card.name,
    isPopular: card.isPopular,
    toggledBy: req.admin._id
  });

  res.json({
    success: true,
    message: `Card ${card.isPopular ? 'marked as popular' : 'removed from popular'} successfully`,
    data: { card }
  });
});

// @desc    Toggle featured status (Admin)
// @route   PUT /api/admin/cards/:id/toggle-featured
// @access  Private (Admin)
const toggleFeaturedStatus = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);

  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }

  await card.toggleFeatured();
  card.lastModifiedBy = req.admin._id;
  await card.save();

  // Log activity
  logger.info('Card featured status toggled', {
    cardId: card._id,
    name: card.name,
    isFeatured: card.isFeatured,
    toggledBy: req.admin._id
  });

  res.json({
    success: true,
    message: `Card ${card.isFeatured ? 'marked as featured' : 'removed from featured'} successfully`,
    data: { card }
  });
});

// @desc    Get card statistics (Admin)
// @route   GET /api/admin/cards/stats
// @access  Private (Admin)
const getCardStats = asyncHandler(async (req, res) => {
  const stats = await Card.getCardStats();

  res.json({
    success: true,
    data: { stats: stats[0] || {} }
  });
});

// ==================== USER ENDPOINTS ====================

// @desc    Get all active cards (User)
// @route   GET /api/cards
// @access  Public
const getActiveCards = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    speciality, 
    sortBy = 'displayOrder', 
    sortOrder = 'asc' 
  } = req.query;

  // Build query for active cards only
  const query = { status: 'active' };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { speciality: { $regex: search, $options: 'i' } },
      { subtitle: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  if (speciality && speciality !== 'all') {
    query.speciality = speciality;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const cards = await Card.find(query)
    .sort(sort)
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await Card.countDocuments(query);

  res.json({
    success: true,
    data: {
      cards,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCards: total,
        hasNext: endIndex < total,
        hasPrev: startIndex > 0
      }
    }
  });
});

// @desc    Get single card (User)
// @route   GET /api/cards/:id
// @access  Public
const getActiveCardById = asyncHandler(async (req, res) => {
  const card = await Card.findOne({ 
    _id: req.params.id, 
    status: 'active' 
  });

  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found or inactive'
    });
  }

  // Increment view count
  await card.incrementViews();

  res.json({
    success: true,
    data: { card }
  });
});

// @desc    Get popular cards (User)
// @route   GET /api/cards/popular
// @access  Public
const getPopularCards = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const cards = await Card.getPopular(parseInt(limit));

  res.json({
    success: true,
    data: { cards }
  });
});

// @desc    Get featured cards (User)
// @route   GET /api/cards/featured
// @access  Public
const getFeaturedCards = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const cards = await Card.getFeatured(parseInt(limit));

  res.json({
    success: true,
    data: { cards }
  });
});

// @desc    Get cards by speciality (User)
// @route   GET /api/cards/speciality/:speciality
// @access  Public
const getCardsBySpeciality = asyncHandler(async (req, res) => {
  const { speciality } = req.params;
  const { limit = 10 } = req.query;

  const cards = await Card.getBySpeciality(speciality, parseInt(limit));

  res.json({
    success: true,
    data: { cards }
  });
});

// @desc    Search cards (User)
// @route   GET /api/cards/search
// @access  Public
const searchCards = asyncHandler(async (req, res) => {
  const { q: query, speciality, city, limit = 20 } = req.query;

  const filters = {};
  if (speciality && speciality !== 'all') {
    filters.speciality = speciality;
  }
  if (city) {
    filters['location.city'] = { $regex: city, $options: 'i' };
  }

  const cards = await Card.searchCards(query, filters)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { cards }
  });
});

// @desc    Increment card clicks (User)
// @route   POST /api/cards/:id/click
// @access  Public
const incrementCardClicks = asyncHandler(async (req, res) => {
  const card = await Card.findOne({ 
    _id: req.params.id, 
    status: 'active' 
  });

  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found or inactive'
    });
  }

  await card.incrementClicks();

  res.json({
    success: true,
    message: 'Click recorded successfully'
  });
});

// @desc    Get available specialities (User)
// @route   GET /api/cards/specialities
// @access  Public
const getSpecialities = asyncHandler(async (req, res) => {
  const specialities = await Card.distinct('speciality', { status: 'active' });

  res.json({
    success: true,
    data: { specialities }
  });
});

module.exports = {
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
};
