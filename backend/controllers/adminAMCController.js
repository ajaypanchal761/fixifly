const AMCPlan = require('../models/AMCPlan');
const AMCSubscription = require('../models/AMCSubscription');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

// ==================== AMC PLANS MANAGEMENT ====================

// @desc    Get all AMC plans
// @route   GET /api/admin/amc/plans
// @access  Private (Admin with amcManagement permission)
const getAMCPlans = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    status, 
    sortBy = 'sortOrder', 
    sortOrder = 'asc' 
  } = req.query;

  // Build query
  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  if (status && status !== 'all') {
    query.status = status;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [plans, totalPlans] = await Promise.all([
    AMCPlan.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy lastModifiedBy', 'name email adminId'),
    AMCPlan.countDocuments(query)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalPlans / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  logger.info('AMC plans fetched successfully', {
    adminId: req.admin._id,
    totalPlans,
    page,
    limit
  });

  res.json({
    success: true,
    data: {
      plans,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPlans,
        hasNext,
        hasPrev,
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Get single AMC plan
// @route   GET /api/admin/amc/plans/:id
// @access  Private (Admin with amcManagement permission)
const getAMCPlan = asyncHandler(async (req, res) => {
  const plan = await AMCPlan.findById(req.params.id)
    .populate('createdBy lastModifiedBy', 'name email adminId');

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'AMC plan not found'
    });
  }

  // Get subscription statistics for this plan
  const subscriptionStats = await AMCSubscription.aggregate([
    { $match: { planId: plan._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$amount' }
      }
    }
  ]);

  logger.info('AMC plan fetched successfully', {
    adminId: req.admin._id,
    planId: plan._id
  });

  res.json({
    success: true,
    data: {
      plan,
      subscriptionStats
    }
  });
});

// @desc    Create new AMC plan
// @route   POST /api/admin/amc/plans
// @access  Private (Admin with amcManagement permission)
const createAMCPlan = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    period,
    description,
    shortDescription,
    features,
    limitations,
    benefits,
    status,
    isPopular,
    isRecommended,
    sortOrder,
    image,
    validityPeriod,
    tags,
    metaTitle,
    metaDescription
  } = req.body;

  // Validation
  if (!name || !price || !description) {
    return res.status(400).json({
      success: false,
      message: 'Name, price, and description are required'
    });
  }

  // Check if plan with same name exists
  const existingPlan = await AMCPlan.findOne({ name });
  if (existingPlan) {
    return res.status(400).json({
      success: false,
      message: 'Plan with this name already exists'
    });
  }

  // Create plan
  const plan = await AMCPlan.create({
    name,
    price,
    period: period || 'yearly',
    description,
    shortDescription,
    features: features || [],
    limitations: limitations || [],
    benefits: benefits || {},
    status: status || 'active',
    isPopular: isPopular || false,
    isRecommended: isRecommended || false,
    sortOrder: sortOrder || 0,
    image,
    validityPeriod: validityPeriod || 365,
    tags: tags || [],
    metaTitle,
    metaDescription,
    createdBy: req.admin._id
  });

  // Log activity
  await req.admin.logActivity(
    'CREATE_AMC_PLAN',
    `Created AMC plan: ${plan.name}`,
    'admin',
    req.admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('AMC plan created successfully', {
    adminId: req.admin._id,
    planId: plan._id,
    planName: plan.name
  });

  res.status(201).json({
    success: true,
    message: 'AMC plan created successfully',
    data: { plan }
  });
});

// @desc    Update AMC plan
// @route   PUT /api/admin/amc/plans/:id
// @access  Private (Admin with amcManagement permission)
const updateAMCPlan = asyncHandler(async (req, res) => {
  const plan = await AMCPlan.findById(req.params.id);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'AMC plan not found'
    });
  }

  // Update fields
  const updateFields = [
    'name', 'price', 'period', 'description', 'shortDescription',
    'features', 'limitations', 'benefits', 'status', 'isPopular',
    'isRecommended', 'sortOrder', 'image', 'validityPeriod',
    'tags', 'metaTitle', 'metaDescription'
  ];

  updateFields.forEach(field => {
    if (req.body[field] !== undefined) {
      plan[field] = req.body[field];
    }
  });

  plan.lastModifiedBy = req.admin._id;

  await plan.save();

  // Log activity
  await req.admin.logActivity(
    'UPDATE_AMC_PLAN',
    `Updated AMC plan: ${plan.name}`,
    'admin',
    req.admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('AMC plan updated successfully', {
    adminId: req.admin._id,
    planId: plan._id,
    planName: plan.name
  });

  res.json({
    success: true,
    message: 'AMC plan updated successfully',
    data: { plan }
  });
});

// @desc    Delete AMC plan
// @route   DELETE /api/admin/amc/plans/:id
// @access  Private (Admin with amcManagement permission)
const deleteAMCPlan = asyncHandler(async (req, res) => {
  const plan = await AMCPlan.findById(req.params.id);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'AMC plan not found'
    });
  }

  // Check if plan has active subscriptions
  const activeSubscriptions = await AMCSubscription.countDocuments({
    planId: plan._id,
    status: 'active'
  });

  if (activeSubscriptions > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete plan with ${activeSubscriptions} active subscriptions. Please deactivate instead.`
    });
  }

  await AMCPlan.findByIdAndDelete(req.params.id);

  // Log activity
  await req.admin.logActivity(
    'DELETE_AMC_PLAN',
    `Deleted AMC plan: ${plan.name}`,
    'admin',
    req.admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('AMC plan deleted successfully', {
    adminId: req.admin._id,
    planId: plan._id,
    planName: plan.name
  });

  res.json({
    success: true,
    message: 'AMC plan deleted successfully'
  });
});

// ==================== AMC SUBSCRIPTIONS MANAGEMENT ====================

// @desc    Get all AMC subscriptions
// @route   GET /api/admin/amc/subscriptions
// @access  Private (Admin with amcManagement permission)
const getAMCSubscriptions = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    status, 
    planId,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  // Build query
  const query = {};
  
  if (search) {
    query.$or = [
      { subscriptionId: { $regex: search, $options: 'i' } },
      { planName: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (planId) {
    query.planId = planId;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [subscriptions, totalSubscriptions] = await Promise.all([
    AMCSubscription.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email phone')
      .populate('planId', 'name price benefits')
      .populate('createdBy lastModifiedBy', 'name email adminId'),
    AMCSubscription.countDocuments(query)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalSubscriptions / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  logger.info('AMC subscriptions fetched successfully', {
    adminId: req.admin._id,
    totalSubscriptions,
    page,
    limit
  });

  res.json({
    success: true,
    data: {
      subscriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSubscriptions,
        hasNext,
        hasPrev,
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Get single AMC subscription
// @route   GET /api/admin/amc/subscriptions/:id
// @access  Private (Admin with amcManagement permission)
const getAMCSubscription = asyncHandler(async (req, res) => {
  const subscription = await AMCSubscription.findById(req.params.id)
    .populate('userId', 'name email phone address')
    .populate('planId', 'name price benefits features')
    .populate('createdBy lastModifiedBy', 'name email adminId');

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  logger.info('AMC subscription fetched successfully', {
    adminId: req.admin._id,
    subscriptionId: subscription.subscriptionId
  });

  res.json({
    success: true,
    data: { subscription }
  });
});

// @desc    Update AMC subscription status
// @route   PUT /api/admin/amc/subscriptions/:id/status
// @access  Private (Admin with amcManagement permission)
const updateAMCSubscriptionStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  const subscription = await AMCSubscription.findById(req.params.id);

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  const oldStatus = subscription.status;
  subscription.status = status;
  subscription.lastModifiedBy = req.admin._id;

  // Handle cancellation
  if (status === 'cancelled') {
    subscription.cancellation.requestedAt = new Date();
    subscription.cancellation.cancelledAt = new Date();
    subscription.cancellation.reason = reason || 'Cancelled by admin';
  }

  await subscription.save();

  // Log activity
  await req.admin.logActivity(
    'UPDATE_AMC_SUBSCRIPTION_STATUS',
    `Updated AMC subscription ${subscription.subscriptionId} status from ${oldStatus} to ${status}`,
    'admin',
    req.admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('AMC subscription status updated successfully', {
    adminId: req.admin._id,
    subscriptionId: subscription.subscriptionId,
    oldStatus,
    newStatus: status
  });

  res.json({
    success: true,
    message: 'Subscription status updated successfully',
    data: { subscription }
  });
});

// @desc    Update AMC subscription usage
// @route   PUT /api/admin/amc/subscriptions/:id/usage
// @access  Private (Admin with amcManagement permission)
const updateAMCSubscriptionUsage = asyncHandler(async (req, res) => {
  const { usage } = req.body;

  if (!usage) {
    return res.status(400).json({
      success: false,
      message: 'Usage data is required'
    });
  }

  const subscription = await AMCSubscription.findById(req.params.id);

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  // Update usage data
  if (usage.remoteSupport) {
    subscription.usage.remoteSupport = {
      used: usage.remoteSupport.used || 0,
      limit: usage.remoteSupport.limit || 'unlimited'
    };
  }

  if (usage.homeVisits) {
    subscription.usage.homeVisits = {
      used: usage.homeVisits.used || 0,
      limit: usage.homeVisits.limit || 1,
      remaining: Math.max(0, (usage.homeVisits.limit || 1) - (usage.homeVisits.used || 0))
    };
  }

  if (usage.warrantyClaims) {
    subscription.usage.warrantyClaims = {
      used: usage.warrantyClaims.used || 0,
      limit: usage.warrantyClaims.limit || 0,
      remaining: Math.max(0, (usage.warrantyClaims.limit || 0) - (usage.warrantyClaims.used || 0))
    };
  }

  subscription.lastModifiedBy = req.admin._id;
  await subscription.save();

  // Log activity
  await req.admin.logActivity(
    'UPDATE_AMC_SUBSCRIPTION_USAGE',
    `Updated AMC subscription ${subscription.subscriptionId} usage limits`,
    'admin',
    req.admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('AMC subscription usage updated successfully', {
    adminId: req.admin._id,
    subscriptionId: subscription.subscriptionId,
    usage: usage
  });

  res.json({
    success: true,
    message: 'Subscription usage updated successfully',
    data: { subscription }
  });
});

// @desc    Add service to AMC subscription
// @route   POST /api/admin/amc/subscriptions/:id/services
// @access  Private (Admin with amcManagement permission)
const addServiceToSubscription = asyncHandler(async (req, res) => {
  const {
    serviceType,
    deviceId,
    description,
    cost,
    notes
  } = req.body;

  if (!serviceType || !deviceId || !description) {
    return res.status(400).json({
      success: false,
      message: 'Service type, device ID, and description are required'
    });
  }

  const subscription = await AMCSubscription.findById(req.params.id);

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  if (subscription.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Cannot add service to inactive subscription'
    });
  }

  // Add service
  await subscription.addService({
    serviceType,
    deviceId,
    description,
    cost: cost || 0,
    notes,
    serviceDate: new Date(),
    status: 'completed'
  });

  // Log activity
  await req.admin.logActivity(
    'ADD_AMC_SERVICE',
    `Added ${serviceType} service to subscription ${subscription.subscriptionId}`,
    'admin',
    req.admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('Service added to AMC subscription successfully', {
    adminId: req.admin._id,
    subscriptionId: subscription.subscriptionId,
    serviceType
  });

  res.json({
    success: true,
    message: 'Service added successfully',
    data: { subscription }
  });
});

// ==================== AMC STATISTICS ====================

// @desc    Get AMC statistics
// @route   GET /api/admin/amc/stats
// @access  Private (Admin with amcManagement permission)
const getAMCStats = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;

  // Calculate date range
  let startDate, endDate;
  const now = new Date();
  
  if (period === 'week') {
    startDate = new Date(now.setDate(now.getDate() - 7));
    endDate = new Date();
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
  } else {
    startDate = new Date(0);
    endDate = new Date();
  }

  // Get plan statistics
  const [planStats, subscriptionStats, revenueStats] = await Promise.all([
    // Plan statistics
    AMCPlan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // Subscription statistics
    AMCSubscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]),
    
    // Revenue statistics
    AMCSubscription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalSubscriptions: { $sum: 1 }
        }
      }
    ])
  ]);

  // Get popular plans
  const popularPlans = await AMCPlan.find({ isPopular: true, status: 'active' })
    .sort({ sortOrder: 1 })
    .limit(5);

  // Get expiring subscriptions
  const expiringSubscriptions = await AMCSubscription.getExpiringSubscriptions(30);

  // Get recent subscriptions
  const recentSubscriptions = await AMCSubscription.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'name email')
    .populate('planId', 'name price');

  const stats = {
    plans: {
      total: await AMCPlan.countDocuments(),
      active: await AMCPlan.countDocuments({ status: 'active' }),
      inactive: await AMCPlan.countDocuments({ status: 'inactive' }),
      breakdown: planStats
    },
    subscriptions: {
      total: await AMCSubscription.countDocuments(),
      active: await AMCSubscription.countDocuments({ status: 'active' }),
      expired: await AMCSubscription.countDocuments({ status: 'expired' }),
      cancelled: await AMCSubscription.countDocuments({ status: 'cancelled' }),
      breakdown: subscriptionStats
    },
    revenue: {
      total: revenueStats[0]?.totalRevenue || 0,
      period: period,
      periodRevenue: revenueStats[0]?.totalRevenue || 0,
      periodSubscriptions: revenueStats[0]?.totalSubscriptions || 0
    },
    popularPlans,
    expiringSubscriptions: expiringSubscriptions.length,
    recentSubscriptions
  };

  logger.info('AMC statistics fetched successfully', {
    adminId: req.admin._id,
    period
  });

  res.json({
    success: true,
    data: { stats }
  });
});

// ==================== SEED AMC PLANS ====================

// @desc    Seed default AMC plans
// @route   POST /api/admin/amc/seed-plans
// @access  Private (Admin with amcManagement permission)
const seedAMCPlans = asyncHandler(async (req, res) => {
  // Check if plans already exist
  const existingPlans = await AMCPlan.countDocuments();
  if (existingPlans > 0) {
    return res.status(400).json({
      success: false,
      message: 'AMC plans already exist. Use update endpoints to modify them.'
    });
  }

  const defaultPlans = [
    {
      name: 'TRY PLAN',
      price: 17,
      period: 'yearly',
      description: 'Perfect for getting started with basic AMC coverage',
      shortDescription: 'Basic AMC plan with essential features',
      features: [
        { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
        { title: '3 Remote Support Sessions', description: 'Get help remotely for your devices' },
        { title: '1 Free Home Visit & Diagnosis', description: 'One complimentary home visit for diagnosis' },
        { title: 'Free Hidden Tips & Tricks', description: 'Access to exclusive maintenance tips' }
      ],
      benefits: {
        callSupport: 'unlimited',
        remoteSupport: 'limited',
        homeVisits: { count: 1, description: '1 Free Home Visit & Diagnosis' },
        antivirus: { included: false },
        softwareInstallation: { included: false },
        sparePartsDiscount: { percentage: 0 },
        freeSpareParts: { amount: 0 },
        laborCost: { included: false }
      },
      status: 'active',
      isPopular: false,
      sortOrder: 1,
      validityPeriod: 365,
      tags: ['basic', 'starter', 'budget'],
      createdBy: req.admin._id
    },
    {
      name: 'CARE PLAN',
      price: 59,
      period: 'yearly',
      description: 'Comprehensive AMC plan with advanced features and support',
      shortDescription: 'Advanced AMC plan with premium features',
      features: [
        { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
        { title: 'Unlimited Remote Support', description: 'Unlimited remote assistance sessions' },
        { title: 'Free Antivirus Pro For 1 Year', description: 'Premium antivirus protection included' },
        { title: '6 Free Home Visits', description: 'Six complimentary home visits for service' },
        { title: 'Free Software Installation & Driver Updates', description: 'Complete software support and installation' },
        { title: 'Up to 40% Off on All Spare Parts', description: 'Significant discounts on spare parts' }
      ],
      benefits: {
        callSupport: 'unlimited',
        remoteSupport: 'unlimited',
        homeVisits: { count: 6, description: '6 Free Home Visits' },
        antivirus: { 
          included: true, 
          name: 'Antivirus Pro', 
          duration: '1 year' 
        },
        softwareInstallation: { 
          included: true, 
          description: 'Free Software Installation & Driver Updates' 
        },
        sparePartsDiscount: { 
          percentage: 40, 
          description: 'Up to 40% Off on All Spare Parts' 
        },
        freeSpareParts: { amount: 0 },
        laborCost: { included: false }
      },
      status: 'active',
      isPopular: true,
      sortOrder: 2,
      validityPeriod: 365,
      tags: ['premium', 'popular', 'comprehensive'],
      createdBy: req.admin._id
    },
    {
      name: 'RELAX PLAN',
      price: 199,
      period: 'yearly',
      description: 'Premium AMC plan with all-inclusive features and maximum benefits',
      shortDescription: 'Premium AMC plan with maximum benefits',
      features: [
        { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
        { title: 'Unlimited Remote Support', description: 'Unlimited remote assistance sessions' },
        { title: 'Free Quick Heal Pro Antivirus For 1 Year', description: 'Premium antivirus protection for 1 year' },
        { title: 'Free Windows MS Office Installation with Software Support', description: 'Complete software support and installation' },
        { title: '12 Free Home Visits and Diagnosis', description: 'Twelve complimentary home visits for service' },
        { title: 'No Labor Cost for 1 Year', description: 'All labor charges included for one year' },
        { title: 'Free Spare Parts up to ₹2000', description: 'Complimentary spare parts worth ₹2000' },
        { title: 'Up to 60% Off on Premium Spare Parts', description: 'Maximum discounts on premium parts' }
      ],
      benefits: {
        callSupport: 'unlimited',
        remoteSupport: 'unlimited',
        homeVisits: { count: 12, description: '12 Free Home Visits and Diagnosis' },
        antivirus: { 
          included: true, 
          name: 'Quick Heal Pro', 
          duration: '1 year' 
        },
        softwareInstallation: { 
          included: true, 
          description: 'Free Windows MS Office Installation with Software Support' 
        },
        sparePartsDiscount: { 
          percentage: 60, 
          description: 'Up to 60% Off on Premium Spare Parts' 
        },
        freeSpareParts: { 
          amount: 2000, 
          description: 'Free Spare Parts up to ₹2000' 
        },
        laborCost: { 
          included: true, 
          description: 'No Labor Cost for 1 Year' 
        }
      },
      status: 'active',
      isPopular: false,
      isRecommended: true,
      sortOrder: 3,
      validityPeriod: 365,
      tags: ['premium', 'recommended', 'all-inclusive'],
      createdBy: req.admin._id
    }
  ];

  const createdPlans = await AMCPlan.insertMany(defaultPlans);

  // Log activity
  await req.admin.logActivity(
    'SEED_AMC_PLANS',
    'Seeded default AMC plans',
    'admin',
    req.admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('AMC plans seeded successfully', {
    adminId: req.admin._id,
    plansCreated: createdPlans.length
  });

  res.status(201).json({
    success: true,
    message: 'AMC plans seeded successfully',
    data: { plans: createdPlans }
  });
});

module.exports = {
  // AMC Plans
  getAMCPlans,
  getAMCPlan,
  createAMCPlan,
  updateAMCPlan,
  deleteAMCPlan,
  seedAMCPlans,
  
  // AMC Subscriptions
  getAMCSubscriptions,
  getAMCSubscription,
  updateAMCSubscriptionStatus,
  updateAMCSubscriptionUsage,
  addServiceToSubscription,
  
  // Statistics
  getAMCStats
};
