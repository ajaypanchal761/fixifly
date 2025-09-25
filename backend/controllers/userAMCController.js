const AMCPlan = require('../models/AMCPlan');
const AMCSubscription = require('../models/AMCSubscription');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const RazorpayService = require('../services/razorpayService');

// ==================== AMC PLANS FOR USERS ====================

// @desc    Get all active AMC plans for users
// @route   GET /api/amc/plans
// @access  Public (for viewing plans)
const getAMCPlans = asyncHandler(async (req, res) => {
  const plans = await AMCPlan.find({ status: 'active' })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select('-createdBy -lastModifiedBy -__v');

  // Add additional computed fields for frontend
  const plansWithStats = await Promise.all(
    plans.map(async (plan) => {
      const subscriptionCount = await AMCSubscription.countDocuments({
        planId: plan._id,
        status: 'active'
      });

      return {
        ...plan.toObject(),
        subscriptionCount,
        isPopular: plan.isPopular,
        isRecommended: plan.isRecommended
      };
    })
  );

  logger.info('AMC plans fetched', {
    userId: req.user?._id || 'anonymous',
    plansCount: plansWithStats.length
  });

  res.json({
    success: true,
    data: { plans: plansWithStats }
  });
});

// @desc    Get single AMC plan details
// @route   GET /api/amc/plans/:id
// @access  Public (for viewing plan details)
const getAMCPlan = asyncHandler(async (req, res) => {
  const plan = await AMCPlan.findOne({
    _id: req.params.id,
    status: 'active'
  }).select('-createdBy -lastModifiedBy -__v');

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'AMC plan not found or inactive'
    });
  }

  // Get subscription statistics
  const subscriptionStats = await AMCSubscription.aggregate([
    { $match: { planId: plan._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Check if user already has this plan (only if user is authenticated)
  let userSubscription = null;
  if (req.user) {
    userSubscription = await AMCSubscription.findOne({
      userId: req.user.userId,
      planId: plan._id,
      status: 'active'
    });
  }

  logger.info('AMC plan details fetched', {
    userId: req.user?._id || 'anonymous',
    planId: plan._id
  });

  res.json({
    success: true,
    data: {
      plan,
      subscriptionStats,
      userHasActiveSubscription: !!userSubscription
    }
  });
});

// ==================== USER AMC SUBSCRIPTIONS ====================

// @desc    Get user's AMC subscriptions
// @route   GET /api/user/amc/subscriptions
// @access  Private (User)
const getUserAMCSubscriptions = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const query = { userId: req.user.userId };
  if (status && status !== 'all') {
    query.status = status;
  }

  const subscriptions = await AMCSubscription.find(query)
    .populate('planId', 'name price benefits features')
    .sort({ createdAt: -1 });

  // Add computed fields
  const subscriptionsWithDetails = subscriptions.map(subscription => {
    const subscriptionObj = subscription.toObject();
    return {
      ...subscriptionObj,
      daysRemaining: subscription.daysRemaining,
      isExpired: subscription.isExpired,
      isActive: subscription.isActive,
      formattedAmount: subscription.formattedAmount
    };
  });

  logger.info('User AMC subscriptions fetched', {
    userId: req.user.userId,
    subscriptionsCount: subscriptionsWithDetails.length
  });

  res.json({
    success: true,
    data: { subscriptions: subscriptionsWithDetails }
  });
});

// @desc    Get single user AMC subscription
// @route   GET /api/user/amc/subscriptions/:id
// @access  Private (User)
const getUserAMCSubscription = asyncHandler(async (req, res) => {
  const subscription = await AMCSubscription.findOne({
    _id: req.params.id,
    userId: req.user.userId
  }).populate('planId', 'name price benefits features');

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  // Add computed fields
  const subscriptionWithDetails = {
    ...subscription.toObject(),
    daysRemaining: subscription.daysRemaining,
    isExpired: subscription.isExpired,
    isActive: subscription.isActive,
    formattedAmount: subscription.formattedAmount
  };

  logger.info('User AMC subscription details fetched', {
    userId: req.user.userId,
    subscriptionId: subscription.subscriptionId
  });

  res.json({
    success: true,
    data: { subscription: subscriptionWithDetails }
  });
});

// @desc    Create new AMC subscription
// @route   POST /api/user/amc/subscriptions
// @access  Private (User)
const createAMCSubscription = asyncHandler(async (req, res) => {
  const {
    planId,
    devices,
    paymentMethod = 'online',
    autoRenewal = false
  } = req.body;

  // Validation
  if (!planId || !devices || !Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Plan ID and devices are required'
    });
  }

  // Check if plan exists and is active
  const plan = await AMCPlan.findOne({
    _id: planId,
    status: 'active'
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'AMC plan not found or inactive'
    });
  }

  // Allow multiple active subscriptions per plan per user.
  // Previously this endpoint blocked creation if an active subscription existed.
  // That check has been removed intentionally based on product requirements.

  // Check for pending subscriptions and clean them up
  const existingPendingSubscription = await AMCSubscription.findOne({
    userId: req.user.userId,
    planId: planId,
    status: 'inactive',
    paymentStatus: 'pending'
  });

  if (existingPendingSubscription) {
    // Delete the old pending subscription to allow new one
    await AMCSubscription.deleteOne({ _id: existingPendingSubscription._id });
    console.log('Deleted pending subscription to allow new subscription:', existingPendingSubscription._id);
  }

  // Validate devices
  for (const device of devices) {
    if (!device.deviceType || !device.serialNumber || !device.modelNumber) {
      return res.status(400).json({
        success: false,
        message: 'All devices must have device type, serial number, and model number'
      });
    }
  }

  // Calculate total amount (plan price * number of devices)
  const totalAmount = plan.price * devices.length;

  // Fetch user details to store in subscription
  const user = await User.findById(req.user.userId).select('name email phone');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  console.log('Creating AMC subscription with payment integration:', {
    totalAmount,
    userId: req.user.userId,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    planId,
    planName: plan.name,
    deviceCount: devices.length,
    paymentMethod
  });

  // Create subscription with pending payment status
  const subscriptionData = {
    userId: req.user.userId,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    planId: planId,
    planName: plan.name,
    planPrice: plan.price,
    amount: totalAmount,
    paymentMethod: paymentMethod,
    paymentStatus: 'pending', // Set as pending for payment verification
    status: 'inactive', // Set as inactive until payment is verified
    devices,
    autoRenewal: {
      enabled: autoRenewal
    },
    metadata: {
      source: 'web',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
    // Note: subscriptionId and endDate will be auto-generated by pre-save middleware
  };

  console.log('Creating subscription with data:', subscriptionData);

  const subscription = await AMCSubscription.create(subscriptionData);
  
  // Immediately verify the subscription was created
  console.log('Verifying subscription creation...');
  const verifySubscription = await AMCSubscription.findById(subscription._id);
  console.log('Verification - Found subscription:', verifySubscription ? 'YES' : 'NO');
  if (verifySubscription) {
    console.log('Verification - Subscription details:', {
      id: verifySubscription._id,
      userId: verifySubscription.userId,
      status: verifySubscription.status,
      paymentStatus: verifySubscription.paymentStatus
    });
  }

  console.log('AMC subscription created successfully:', {
    subscriptionId: subscription.subscriptionId,
    endDate: subscription.endDate,
    status: subscription.status,
    _id: subscription._id,
    userId: subscription.userId,
    paymentStatus: subscription.paymentStatus,
    fullSubscription: subscription.toObject()
  });

  // Create Razorpay order for payment
  let razorpayOrder = null;
  if (paymentMethod === 'online') {
    try {
      const orderData = {
        amount: totalAmount,
        currency: 'INR',
        receipt: `AMC_${subscription.subscriptionId}`,
        notes: {
          subscriptionId: subscription.subscriptionId,
          planName: plan.name,
          userId: req.user.userId,
          deviceCount: devices.length
        }
      };

      console.log('Creating Razorpay order with data:', orderData);
      razorpayOrder = await RazorpayService.createOrder(orderData);
      
      // Update subscription with Razorpay order ID
      subscription.razorpayOrderId = razorpayOrder.id;
      await subscription.save();

      console.log('Razorpay order created successfully:', razorpayOrder.id);
    } catch (error) {
      console.error('Failed to create Razorpay order:', error);
      // Delete the subscription if payment order creation fails
      await AMCSubscription.deleteOne({ _id: subscription._id });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order. Please try again.',
        error: error.message
      });
    }
  }

  // Populate the created subscription
  await subscription.populate('planId', 'name price benefits features');

  logger.info('AMC subscription created successfully', {
    userId: req.user.userId,
    subscriptionId: subscription.subscriptionId,
    planName: plan.name,
    status: subscription.status,
    paymentMethod: paymentMethod
  });

  // Prepare response
  const subscriptionResponse = subscription.toObject();
  subscriptionResponse._id = subscription._id.toString();
  
  const responseData = {
    subscription: subscriptionResponse
  };

  console.log('Final response data:', {
    subscriptionId: subscriptionResponse._id,
    subscriptionStatus: subscriptionResponse.status,
    paymentStatus: subscriptionResponse.paymentStatus,
    hasPaymentData: !!responseData.payment
  });

  // Add Razorpay order details if payment method is online
  if (paymentMethod === 'online' && razorpayOrder) {
    responseData.payment = {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    };
  }

  console.log('Subscription response structure:', {
    _id: subscriptionResponse._id,
    subscriptionId: subscriptionResponse.subscriptionId,
    status: subscriptionResponse.status,
    paymentStatus: subscriptionResponse.paymentStatus,
    hasPaymentData: !!responseData.payment
  });

  res.status(201).json({
    success: true,
    message: paymentMethod === 'online' 
      ? 'AMC subscription created successfully! Please complete the payment to activate your subscription.'
      : 'AMC subscription created successfully!',
    data: responseData
  });
});

// @desc    Verify AMC subscription payment
// @route   POST /api/user/amc/subscriptions/:id/verify-payment
// @access  Private (User)
const verifyAMCSubscriptionPayment = asyncHandler(async (req, res) => {
  const { id: subscriptionId } = req.params;
  const { 
    razorpayOrderId, 
    razorpayPaymentId, 
    razorpaySignature 
  } = req.body;

  console.log('=== PAYMENT VERIFICATION REQUEST ===');
  console.log('Full URL:', req.originalUrl);
  console.log('Method:', req.method);
  console.log('All params:', req.params);
  console.log('Subscription ID from params:', subscriptionId);
  console.log('Subscription ID type:', typeof subscriptionId);
  console.log('Subscription ID length:', subscriptionId?.length);
  console.log('Request body:', req.body);
  console.log('User object:', req.user);
  console.log('User ID:', req.user?.userId);
  console.log('Razorpay Order ID:', razorpayOrderId);
  console.log('Razorpay Payment ID:', razorpayPaymentId);
  console.log('Razorpay Signature:', razorpaySignature);

  // Validate required fields
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    console.log('Missing required fields:', {
      razorpayOrderId: !!razorpayOrderId,
      razorpayPaymentId: !!razorpayPaymentId,
      razorpaySignature: !!razorpaySignature
    });
    return res.status(400).json({
      success: false,
      message: 'Missing required payment verification data'
    });
  }

  // Find the subscription
  console.log('Looking for subscription with:', {
    _id: subscriptionId,
    userId: req.user.userId,
    userIdType: typeof req.user.userId,
    userIdString: String(req.user.userId)
  });

  // Import mongoose for ObjectId conversion
  const mongoose = require('mongoose');
  
  // Try to find subscription with proper ObjectId conversion
  let subscription;
  
  try {
    // Convert subscriptionId to ObjectId and find subscription
    const objectId = new mongoose.Types.ObjectId(subscriptionId);
    console.log('ObjectId conversion:', {
      originalId: subscriptionId,
      convertedId: objectId,
      isValidObjectId: mongoose.Types.ObjectId.isValid(subscriptionId)
    });
    
    subscription = await AMCSubscription.findOne({
      _id: objectId,
      userId: req.user.userId
    });
    
    console.log('Found subscription:', subscription ? 'YES' : 'NO');
    if (subscription) {
      console.log('Subscription details:', {
        id: subscription._id,
        subscriptionId: subscription.subscriptionId,
        status: subscription.status,
        paymentStatus: subscription.paymentStatus,
        razorpayOrderId: subscription.razorpayOrderId
      });
    }
  } catch (error) {
    console.error('Error finding subscription:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid subscription ID format'
    });
  }

  if (!subscription) {
    console.log('Subscription not found for user:', req.user.userId);
    console.log('Attempting to find subscription without user filter...');
    
    // Try to find subscription without user filter for debugging
    const anySubscription = await AMCSubscription.findById(subscriptionId);
    console.log('Found any subscription:', anySubscription ? 'YES' : 'NO');
    if (anySubscription) {
      console.log('Any subscription details:', {
        id: anySubscription._id,
        userId: anySubscription.userId,
        requestedUserId: req.user.userId,
        status: anySubscription.status,
        paymentStatus: anySubscription.paymentStatus
      });
    }
    
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  // Validate subscription state for payment verification
  if (subscription.paymentStatus !== 'pending') {
    console.log('Subscription payment status is not pending:', subscription.paymentStatus);
    return res.status(400).json({
      success: false,
      message: `Payment verification not allowed. Current status: ${subscription.paymentStatus}`
    });
  }

  if (subscription.status !== 'inactive') {
    console.log('Subscription status is not inactive:', subscription.status);
    return res.status(400).json({
      success: false,
      message: `Payment verification not allowed. Current status: ${subscription.status}`
    });
  }

  try {
    console.log('Starting payment verification process...');
    
    // Verify payment signature
    console.log('Verifying payment signature...');
    const isSignatureValid = RazorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    console.log('Signature verification result:', isSignatureValid);

    if (!isSignatureValid) {
      console.log('Payment signature verification failed');
      logger.error('AMC payment signature verification failed', {
        subscriptionId,
        razorpayOrderId,
        razorpayPaymentId
      });
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - invalid signature'
      });
    }

    // Get payment details from Razorpay
    console.log('Fetching payment details from Razorpay...');
    const paymentDetails = await RazorpayService.getPaymentDetails(razorpayPaymentId);
    console.log('Payment details received:', paymentDetails);

    // Update subscription with payment details
    console.log('Updating subscription with payment details...');
    subscription.paymentStatus = 'completed';
    subscription.razorpayPaymentId = razorpayPaymentId;
    subscription.razorpaySignature = razorpaySignature;
    subscription.status = 'active';
    subscription.paymentDetails = {
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      method: paymentDetails.method,
      capturedAt: paymentDetails.capturedAt
    };

    console.log('Saving updated subscription...');
    await subscription.save();
    console.log('Subscription saved successfully');

    logger.info('AMC subscription payment verified successfully', {
      userId: req.user.userId,
      subscriptionId: subscription.subscriptionId,
      paymentId: razorpayPaymentId
    });

    res.json({
      success: true,
      message: 'Payment verified successfully. AMC subscription is now active.',
      data: { subscription }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    logger.error('AMC payment verification failed', {
      subscriptionId,
      razorpayOrderId,
      razorpayPaymentId,
      error: error.message
    });
    
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed. Please contact support.',
      error: error.message
    });
  }
});

// @desc    Update AMC subscription (auto-renewal, devices)
// @route   PUT /api/user/amc/subscriptions/:id
// @access  Private (User)
const updateAMCSubscription = asyncHandler(async (req, res) => {
  const { autoRenewal, devices } = req.body;

  const subscription = await AMCSubscription.findOne({
    _id: req.params.id,
    userId: req.user.userId
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  if (subscription.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update inactive subscription'
    });
  }

  // Update auto-renewal
  if (autoRenewal !== undefined) {
    subscription.autoRenewal.enabled = autoRenewal;
    if (autoRenewal) {
      subscription.autoRenewal.nextRenewalDate = subscription.endDate;
    } else {
      subscription.autoRenewal.nextRenewalDate = null;
    }
  }

  // Update devices
  if (devices && Array.isArray(devices)) {
    // Validate devices
    for (const device of devices) {
      if (!device.deviceType || !device.serialNumber || !device.modelNumber) {
        return res.status(400).json({
          success: false,
          message: 'All devices must have device type, serial number, and model number'
        });
      }
    }
    subscription.devices = devices;
  }

  await subscription.save();

  logger.info('AMC subscription updated successfully', {
    userId: req.user.userId,
    subscriptionId: subscription.subscriptionId
  });

  res.json({
    success: true,
    message: 'AMC subscription updated successfully',
    data: { subscription }
  });
});

// @desc    Cancel AMC subscription
// @route   POST /api/user/amc/subscriptions/:id/cancel
// @access  Private (User)
const cancelAMCSubscription = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const subscription = await AMCSubscription.findOne({
    _id: req.params.id,
    userId: req.user.userId
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  if (subscription.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Subscription is not active'
    });
  }

  // Calculate refund amount (pro-rated)
  const now = new Date();
  const startDate = new Date(subscription.startDate);
  const endDate = new Date(subscription.endDate);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const usedDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, totalDays - usedDays);
  const refundAmount = Math.round((subscription.amount * remainingDays) / totalDays);

  // Cancel subscription
  await subscription.cancelSubscription(reason || 'Cancelled by user', refundAmount);

  logger.info('AMC subscription cancelled successfully', {
    userId: req.user.userId,
    subscriptionId: subscription.subscriptionId,
    refundAmount
  });

  res.json({
    success: true,
    message: 'AMC subscription cancelled successfully',
    data: { 
      subscription,
      refundAmount,
      refundStatus: refundAmount > 0 ? 'pending' : null
    }
  });
});

// @desc    Renew AMC subscription
// @route   POST /api/user/amc/subscriptions/:id/renew
// @access  Private (User)
const renewAMCSubscription = asyncHandler(async (req, res) => {
  const { period = 365 } = req.body;

  const subscription = await AMCSubscription.findOne({
    _id: req.params.id,
    userId: req.user.userId
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  if (subscription.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Subscription is not active'
    });
  }

  // Renew subscription
  await subscription.renewSubscription(period);

  logger.info('AMC subscription renewed successfully', {
    userId: req.user.userId,
    subscriptionId: subscription.subscriptionId,
    period
  });

  res.json({
    success: true,
    message: 'AMC subscription renewed successfully',
    data: { subscription }
  });
});

// ==================== AMC SERVICES ====================

// @desc    Request AMC service
// @route   POST /api/user/amc/subscriptions/:id/services
// @access  Private (User)
const requestAMCService = asyncHandler(async (req, res) => {
  const {
    serviceType,
    deviceId,
    description,
    preferredDate,
    preferredTime,
    address
  } = req.body;

  if (!serviceType || !deviceId || !description) {
    return res.status(400).json({
      success: false,
      message: 'Service type, device ID, and description are required'
    });
  }

  const subscription = await AMCSubscription.findOne({
    _id: req.params.id,
    userId: req.user.userId
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  if (subscription.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Subscription is not active'
    });
  }

  // Check if device exists in subscription
  const device = subscription.devices.find(d => d._id.toString() === deviceId);
  if (!device) {
    return res.status(400).json({
      success: false,
      message: 'Device not found in subscription'
    });
  }

  // Check service limits
  if (serviceType === 'home_visit') {
    if (subscription.usage.homeVisits.remaining <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No home visits remaining in your plan'
      });
    }
  }

  // Add service request
  await subscription.addService({
    serviceType,
    deviceId,
    description,
    serviceDate: preferredDate ? new Date(preferredDate) : new Date(),
    status: 'pending',
    notes: `Preferred time: ${preferredTime || 'Any'}, Address: ${address || 'As per profile'}`
  });

  logger.info('AMC service requested successfully', {
    userId: req.user.userId,
    subscriptionId: subscription.subscriptionId,
    serviceType
  });

  res.json({
    success: true,
    message: 'Service request submitted successfully',
    data: { subscription }
  });
});

// @desc    Get AMC service history
// @route   GET /api/user/amc/subscriptions/:id/services
// @access  Private (User)
const getAMCServiceHistory = asyncHandler(async (req, res) => {
  const subscription = await AMCSubscription.findOne({
    _id: req.params.id,
    userId: req.user.userId
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  const serviceHistory = subscription.serviceHistory.sort((a, b) => 
    new Date(b.serviceDate) - new Date(a.serviceDate)
  );

  logger.info('AMC service history fetched', {
    userId: req.user.userId,
    subscriptionId: subscription.subscriptionId,
    servicesCount: serviceHistory.length
  });

  res.json({
    success: true,
    data: { serviceHistory }
  });
});

// ==================== AMC USAGE TRACKING ====================

// @desc    Get AMC usage details
// @route   GET /api/user/amc/subscriptions/:id/usage
// @access  Private (User)
const getAMCUsage = asyncHandler(async (req, res) => {
  const subscription = await AMCSubscription.findOne({
    _id: req.params.id,
    userId: req.user.userId
  }).populate('planId', 'name benefits');

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'AMC subscription not found'
    });
  }

  const usage = {
    callSupport: {
      used: subscription.usage.callSupport.used,
      limit: subscription.usage.callSupport.limit,
      remaining: subscription.usage.callSupport.limit === 'unlimited' ? 'unlimited' : 
        (subscription.usage.callSupport.limit - subscription.usage.callSupport.used)
    },
    remoteSupport: {
      used: subscription.usage.remoteSupport.used,
      limit: subscription.usage.remoteSupport.limit,
      remaining: subscription.usage.remoteSupport.limit === 'unlimited' ? 'unlimited' : 
        (subscription.usage.remoteSupport.limit - subscription.usage.remoteSupport.used)
    },
    homeVisits: {
      used: subscription.usage.homeVisits.used,
      limit: subscription.usage.homeVisits.limit,
      remaining: subscription.usage.homeVisits.remaining
    },
    antivirus: {
      activated: subscription.usage.antivirus.activated,
      activationDate: subscription.usage.antivirus.activationDate,
      expiryDate: subscription.usage.antivirus.expiryDate
    },
    sparePartsDiscount: {
      used: subscription.usage.sparePartsDiscount.used,
      limit: subscription.usage.sparePartsDiscount.limit
    },
    freeSpareParts: {
      used: subscription.usage.freeSpareParts.used,
      limit: subscription.usage.freeSpareParts.limit,
      remaining: subscription.usage.freeSpareParts.remaining
    }
  };

  logger.info('AMC usage details fetched', {
    userId: req.user.userId,
    subscriptionId: subscription.subscriptionId
  });

  res.json({
    success: true,
    data: { usage }
  });
});

module.exports = {
  // AMC Plans
  getAMCPlans,
  getAMCPlan,
  
  // AMC Subscriptions
  getUserAMCSubscriptions,
  getUserAMCSubscription,
  createAMCSubscription,
  verifyAMCSubscriptionPayment,
  updateAMCSubscription,
  cancelAMCSubscription,
  renewAMCSubscription,
  
  // AMC Services
  requestAMCService,
  getAMCServiceHistory,
  
  // Usage Tracking
  getAMCUsage
};

// @desc    Debug subscription lookup
// @route   GET /api/user/amc/subscriptions/:id/debug
// @access  Private (User)
const debugSubscription = asyncHandler(async (req, res) => {
  const { id: subscriptionId } = req.params;
  
  console.log('=== DEBUG SUBSCRIPTION LOOKUP ===');
  console.log('Subscription ID:', subscriptionId);
  console.log('User ID:', req.user?.userId);
  
  try {
    // Try to find subscription with user filter
    const subscription = await AMCSubscription.findOne({
      _id: subscriptionId,
      userId: req.user.userId
    });
    
    console.log('Found subscription with user filter:', subscription ? 'YES' : 'NO');
    
    // Try to find subscription without user filter
    const anySubscription = await AMCSubscription.findById(subscriptionId);
    console.log('Found subscription without user filter:', anySubscription ? 'YES' : 'NO');
    
    // Get all subscriptions for this user
    const userSubscriptions = await AMCSubscription.find({
      userId: req.user.userId
    });
    
    console.log('Total subscriptions for user:', userSubscriptions.length);
    
    res.json({
      success: true,
      data: {
        requestedId: subscriptionId,
        userId: req.user.userId,
        foundWithUserFilter: !!subscription,
        foundWithoutUserFilter: !!anySubscription,
        subscriptionWithFilter: subscription,
        subscriptionWithoutFilter: anySubscription,
        allUserSubscriptions: userSubscriptions.map(sub => ({
          id: sub._id,
          subscriptionId: sub.subscriptionId,
          status: sub.status,
          paymentStatus: sub.paymentStatus,
          userId: sub.userId
        }))
      }
    });
  } catch (error) {
    console.error('Debug subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

module.exports.debugSubscription = debugSubscription;
