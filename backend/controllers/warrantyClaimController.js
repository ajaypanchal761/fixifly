const WarrantyClaim = require('../models/WarrantyClaim');
const AMCSubscription = require('../models/AMCSubscription');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

// @desc    Submit a warranty claim
// @route   POST /api/warranty-claims
// @access  Private (User)
const submitWarrantyClaim = asyncHandler(async (req, res) => {
  const { subscriptionId, serviceType, issueDescription, planName } = req.body;

  // Validate required fields
  if (!subscriptionId || !serviceType || !issueDescription) {
    return res.status(400).json({
      success: false,
      message: 'Subscription ID, service type, and issue description are required'
    });
  }

  const userId = req.user.userId || req.user._id;
  
  // Convert userId to ObjectId if it's a string
  let userIdToSearch;
  try {
    if (typeof userId === 'string') {
      userIdToSearch = new require('mongoose').Types.ObjectId(userId);
    } else {
      userIdToSearch = userId;
    }
  } catch (error) {
    userIdToSearch = userId;
  }

  console.log('=== DATABASE SEARCH DEBUG ===');
  
  // First, let's see ALL subscriptions for this user (try both userId formats)
  const allUserSubscriptions = await AMCSubscription.find({ 
    $or: [
      { userId: userId },
      { userId: userIdToSearch }
    ]
  });
  console.log('All subscriptions for user:', allUserSubscriptions.length);
  allUserSubscriptions.forEach((sub, index) => {
    console.log(`Subscription ${index + 1}:`, {
      id: sub._id,
      subscriptionId: sub.subscriptionId,
      status: sub.status,
      userId: sub.userId,
      userIdType: typeof sub.userId,
      endDate: sub.endDate,
      isExpired: sub.endDate && sub.endDate < new Date()
    });
  });

  // Try to find subscription by subscriptionId first (try both userId formats)
  console.log('Searching by subscriptionId:', subscriptionId);
  let subscription = await AMCSubscription.findOne({
    subscriptionId: subscriptionId,
    $or: [
      { userId: userId },
      { userId: userIdToSearch }
    ]
  });
  
  if (subscription) {
    console.log('Found by subscriptionId:', {
      id: subscription._id,
      subscriptionId: subscription.subscriptionId,
      status: subscription.status,
      userId: subscription.userId
    });
  } else {
    console.log('Not found by subscriptionId, trying by _id...');
    subscription = await AMCSubscription.findOne({
      _id: subscriptionId,
      $or: [
        { userId: userId },
        { userId: userIdToSearch }
      ]
    });
    
    if (subscription) {
      console.log('Found by _id:', {
        id: subscription._id,
        subscriptionId: subscription.subscriptionId,
        status: subscription.status,
        userId: subscription.userId
      });
    } else {
      console.log('Not found by _id either');
    }
  }

  if (!subscription) {
    console.log('=== NO SUBSCRIPTION FOUND ===');
    console.log('Searched for:', {
      subscriptionId: subscriptionId,
      userId: userId,
      userIdType: typeof userId
    });
    
    return res.status(404).json({
      success: false,
      message: 'Active subscription not found',
      debug: {
        searchedSubscriptionId: subscriptionId,
        searchedUserId: userId,
        searchedUserIdToSearch: userIdToSearch,
        totalUserSubscriptions: allUserSubscriptions.length
      }
    });
  }

  console.log('=== SUBSCRIPTION FOUND ===');
  console.log('Subscription details:', {
    id: subscription._id,
    subscriptionId: subscription.subscriptionId,
    status: subscription.status,
    userId: subscription.userId,
    endDate: subscription.endDate,
    isExpired: subscription.endDate && subscription.endDate < new Date()
  });

  // Check if subscription is actually active (not expired)
  const now = new Date();
  if (subscription.endDate && subscription.endDate < now) {
    return res.status(400).json({
      success: false,
      message: 'Subscription has expired'
    });
  }

  // Check warranty claims availability
  // Ensure usage object exists
  if (!subscription.usage) {
    subscription.usage = {};
  }
  
  // Ensure warranty claims object exists
  if (!subscription.usage.warrantyClaims) {
    subscription.usage.warrantyClaims = {
      used: 0,
      limit: 3, // Increased default limit to 3
      remaining: 3
    };
    await subscription.save();
  }
  
  const warrantyClaimsUsage = subscription.usage.warrantyClaims;
  const used = warrantyClaimsUsage.used || 0;
  const limit = warrantyClaimsUsage.limit || 0;
  const remaining = warrantyClaimsUsage.remaining || 0;

  // If no warranty claims limit is set or limit is too low, increase it
  if (limit === 0 || limit < 3) {
    subscription.usage.warrantyClaims = {
      used: used,
      limit: 3,
      remaining: Math.max(0, 3 - used)
    };
    await subscription.save();
  }

  // Check if user has remaining warranty claims
  const finalRemainingClaims = subscription.usage.warrantyClaims.remaining || 0;
  
  if (finalRemainingClaims <= 0) {
    // Offer to reset warranty claims for testing purposes
    if (process.env.NODE_ENV === 'development') {
      subscription.usage.warrantyClaims.remaining = subscription.usage.warrantyClaims.limit;
      subscription.usage.warrantyClaims.used = 0;
      await subscription.save();
    } else {
      return res.status(400).json({
        success: false,
        message: 'No remaining warranty claims available. Please contact support to increase your warranty claims limit.'
      });
    }
  }

  // Create warranty claim
  const warrantyClaim = new WarrantyClaim({
    userId: subscription.userId, // Use the userId from the found subscription
    subscriptionId: subscriptionId,
    planName: planName || subscription.planName,
    item: serviceType === 'remote-support' ? 'Remote Support Service' : 'Home Visit Service',
    issueDescription: issueDescription.trim(),
    status: 'pending'
  });

  await warrantyClaim.save();

  // Update subscription usage
  console.log('=== UPDATING WARRANTY CLAIMS USAGE ===');
  console.log('Before update:', subscription.usage.warrantyClaims);
  
  if (subscription.usage?.warrantyClaims) {
    subscription.usage.warrantyClaims.used = (subscription.usage.warrantyClaims.used || 0) + 1;
    subscription.usage.warrantyClaims.remaining = Math.max(0, (subscription.usage.warrantyClaims.limit || 0) - subscription.usage.warrantyClaims.used);
    
    console.log('After update:', subscription.usage.warrantyClaims);
  }

  await subscription.save();

  logger.info('Warranty claim submitted successfully', {
    userId: subscription.userId,
    subscriptionId: subscriptionId,
    claimId: warrantyClaim._id,
    serviceType: serviceType
  });

  res.status(201).json({
    success: true,
    message: 'Warranty claim submitted successfully',
    data: { 
      warrantyClaim,
      debug: {
        remainingClaims: subscription.usage.warrantyClaims.remaining,
        usedClaims: subscription.usage.warrantyClaims.used,
        totalClaims: subscription.usage.warrantyClaims.limit
      }
    }
  });
});

// @desc    Get user's warranty claims
// @route   GET /api/warranty-claims
// @access  Private (User)
const getUserWarrantyClaims = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  // Build query
  const query = { userId: req.user._id };
  if (status && status !== 'all') {
    query.status = status;
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [claims, totalClaims] = await Promise.all([
    WarrantyClaim.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedVendor', 'name email phone')
      .populate('approvedBy rejectedBy assignedBy', 'name email'),
    WarrantyClaim.countDocuments(query)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalClaims / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  res.json({
    success: true,
    data: {
      claims,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalClaims,
        hasNext,
        hasPrev,
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Get single warranty claim
// @route   GET /api/warranty-claims/:id
// @access  Private (User)
const getWarrantyClaim = asyncHandler(async (req, res) => {
  const claim = await WarrantyClaim.findOne({
    _id: req.params.id,
    userId: req.user._id
  })
    .populate('assignedVendor', 'name email phone address')
    .populate('approvedBy rejectedBy assignedBy', 'name email');

  if (!claim) {
    return res.status(404).json({
      success: false,
      message: 'Warranty claim not found'
    });
  }

  res.json({
    success: true,
    data: { claim }
  });
});

// @desc    Test subscription data
// @route   GET /api/warranty-claims/test-subscription/:id
// @access  Private (User)
const testSubscription = asyncHandler(async (req, res) => {
  const { id: subscriptionId } = req.params;
  const userId = req.user.userId || req.user._id;
  
  console.log('=== TEST SUBSCRIPTION ===');
  console.log('Subscription ID:', subscriptionId);
  console.log('User ID:', userId);
  
  const subscription = await AMCSubscription.findOne({
    $or: [
      { subscriptionId: subscriptionId },
      { _id: subscriptionId }
    ],
    $or: [
      { userId: userId },
      { userId: new require('mongoose').Types.ObjectId(userId) }
    ]
  });
  
  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'Subscription not found'
    });
  }
  
  res.json({
    success: true,
    data: {
      subscription: {
        id: subscription._id,
        subscriptionId: subscription.subscriptionId,
        status: subscription.status,
        userId: subscription.userId,
        usage: subscription.usage,
        endDate: subscription.endDate
      }
    }
  });
});

module.exports = {
  submitWarrantyClaim,
  getUserWarrantyClaims,
  getWarrantyClaim,
  testSubscription
};
