const WarrantyClaim = require('../models/WarrantyClaim');
const AMCSubscription = require('../models/AMCSubscription');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

// Force nodemon restart

// @desc    Get all warranty claims (Admin)
// @route   GET /api/admin/warranty-claims
// @access  Private (Admin with amcManagement permission)
const getWarrantyClaims = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    search,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  // Build query
  const query = {};
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (search) {
    query.$or = [
      { item: { $regex: search, $options: 'i' } },
      { subscriptionId: { $regex: search, $options: 'i' } },
      { planName: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [claims, totalClaims] = await Promise.all([
    WarrantyClaim.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email phone')
      .populate('assignedVendor', 'name email phone')
      .populate('approvedBy rejectedBy assignedBy', 'name email'),
    WarrantyClaim.countDocuments(query)
  ]);

  console.log('=== ADMIN GET WARRANTY CLAIMS DEBUG ===');
  console.log('Query params:', { page, limit, status, search, sortBy, sortOrder });
  console.log('Database query:', query);
  console.log('Found claims:', claims.length);
  console.log('Total claims:', totalClaims);
  claims.forEach((claim, index) => {
    console.log(`Claim ${index + 1}:`, {
      id: claim._id,
      status: claim.status,
      item: claim.item,
      subscriptionId: claim.subscriptionId,
      userId: claim.userId
    });
  });

  // Calculate pagination info
  const totalPages = Math.ceil(totalClaims / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  logger.info('Warranty claims fetched successfully', {
    adminId: req.admin._id,
    totalClaims,
    page,
    limit
  });

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

// @desc    Get single warranty claim (Admin)
// @route   GET /api/admin/warranty-claims/:id
// @access  Private (Admin with amcManagement permission)
const getWarrantyClaim = asyncHandler(async (req, res) => {
  const claim = await WarrantyClaim.findById(req.params.id)
    .populate('userId', 'name email phone address')
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

// @desc    Approve warranty claim
// @route   PUT /api/admin/warranty-claims/:id/approve
// @access  Private (Admin with amcManagement permission)
const approveWarrantyClaim = asyncHandler(async (req, res) => {
  const { adminNotes } = req.body;

  const claim = await WarrantyClaim.findById(req.params.id);

  if (!claim) {
    return res.status(404).json({
      success: false,
      message: 'Warranty claim not found'
    });
  }

  if (claim.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending claims can be approved'
    });
  }

  // Update claim status
  claim.status = 'approved';
  claim.approvedBy = req.admin._id;
  claim.approvedAt = new Date();
  if (adminNotes) {
    claim.adminNotes = adminNotes.trim();
  }

  await claim.save();

  // Update user's subscription usage based on service type
  const AMCSubscription = require('../models/AMCSubscription');
  const subscription = await AMCSubscription.findOne({
    subscriptionId: claim.subscriptionId,
    userId: claim.userId
  });

  if (subscription && subscription.usage) {
    // Update usage based on the service type
    if (claim.item === 'Remote Support Service') {
      if (subscription.usage.remoteSupport) {
        subscription.usage.remoteSupport.used = (subscription.usage.remoteSupport.used || 0) + 1;
        // Update remaining if limit is not unlimited
        if (subscription.usage.remoteSupport.limit !== 'unlimited') {
          subscription.usage.remoteSupport.remaining = Math.max(0, subscription.usage.remoteSupport.limit - subscription.usage.remoteSupport.used);
        }
      }
    } else if (claim.item === 'Home Visit Service') {
      if (subscription.usage.homeVisits) {
        subscription.usage.homeVisits.used = (subscription.usage.homeVisits.used || 0) + 1;
        subscription.usage.homeVisits.remaining = Math.max(0, subscription.usage.homeVisits.limit - subscription.usage.homeVisits.used);
      }
    }
    
    await subscription.save();
    
    logger.info('Updated subscription usage after approval', {
      subscriptionId: claim.subscriptionId,
      serviceType: claim.item,
      updatedUsage: subscription.usage
    });
  }

  // Log activity
  await req.admin.logActivity(
    'APPROVE_WARRANTY_CLAIM',
    `Approved warranty claim ${claim._id} for ${claim.item}`,
    'admin',
    req.admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('Warranty claim approved successfully', {
    adminId: req.admin._id,
    claimId: claim._id,
    subscriptionId: claim.subscriptionId
  });

  res.json({
    success: true,
    message: 'Warranty claim approved successfully',
    data: { claim }
  });
});

// @desc    Reject warranty claim
// @route   PUT /api/admin/warranty-claims/:id/reject
// @access  Private (Admin with amcManagement permission)
const rejectWarrantyClaim = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required'
    });
  }

  const claim = await WarrantyClaim.findById(req.params.id);

  if (!claim) {
    return res.status(404).json({
      success: false,
      message: 'Warranty claim not found'
    });
  }

  if (claim.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending claims can be rejected'
    });
  }

  // Update claim status
  claim.status = 'rejected';
  claim.rejectedBy = req.admin._id;
  claim.rejectedAt = new Date();
  claim.rejectionReason = rejectionReason.trim();

  await claim.save();

  // Refund the warranty claim usage
  const subscription = await AMCSubscription.findOne({
    subscriptionId: claim.subscriptionId,
    userId: claim.userId
  });

  if (subscription && subscription.usage?.warrantyClaims) {
    subscription.usage.warrantyClaims.used = Math.max(0, (subscription.usage.warrantyClaims.used || 0) - 1);
    subscription.usage.warrantyClaims.remaining = (subscription.usage.warrantyClaims.limit || 0) - subscription.usage.warrantyClaims.used;
    await subscription.save();
  }

  // Log activity
  await req.admin.logActivity(
    'REJECT_WARRANTY_CLAIM',
    `Rejected warranty claim ${claim._id} for ${claim.item}`,
    'admin',
    req.admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('Warranty claim rejected successfully', {
    adminId: req.admin._id,
    claimId: claim._id,
    subscriptionId: claim.subscriptionId
  });

  res.json({
    success: true,
    message: 'Warranty claim rejected successfully',
    data: { claim }
  });
});

// @desc    Assign vendor to warranty claim
// @route   PUT /api/admin/warranty-claims/:id/assign-vendor
// @access  Private (Admin with amcManagement permission)
const assignVendorToClaim = asyncHandler(async (req, res) => {
  const { vendorId } = req.body;

  if (!vendorId) {
    return res.status(400).json({
      success: false,
      message: 'Vendor ID is required'
    });
  }

  const claim = await WarrantyClaim.findById(req.params.id);

  if (!claim) {
    return res.status(404).json({
      success: false,
      message: 'Warranty claim not found'
    });
  }

  if (claim.status !== 'approved') {
    return res.status(400).json({
      success: false,
      message: 'Only approved claims can have vendors assigned'
    });
  }

  // Update claim with vendor assignment
  claim.assignedVendor = vendorId;
  claim.assignedBy = req.admin._id;
  claim.assignedAt = new Date();
  claim.status = 'in_progress';

  await claim.save();

  // Create notification for vendor
  try {
    const { createWarrantyClaimAssignmentNotification } = require('./vendorNotificationController');
    await createWarrantyClaimAssignmentNotification(vendorId, claim);
  } catch (notificationError) {
    logger.error('Error creating vendor notification for warranty claim assignment:', notificationError);
    // Don't fail the assignment if notification fails
  }

  // Log activity
  await req.admin.logActivity(
    'ASSIGN_VENDOR_WARRANTY_CLAIM',
    `Assigned vendor ${vendorId} to warranty claim ${claim._id}`,
    'admin',
    req.admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('Vendor assigned to warranty claim successfully', {
    adminId: req.admin._id,
    claimId: claim._id,
    vendorId: vendorId
  });

  res.json({
    success: true,
    message: 'Vendor assigned successfully',
    data: { claim }
  });
});

// @desc    Complete warranty claim
// @route   PUT /api/admin/warranty-claims/:id/complete
// @access  Private (Admin with amcManagement permission)
const completeWarrantyClaim = asyncHandler(async (req, res) => {
  const { completionNotes } = req.body;

  const claim = await WarrantyClaim.findById(req.params.id);

  if (!claim) {
    return res.status(404).json({
      success: false,
      message: 'Warranty claim not found'
    });
  }

  if (claim.status !== 'approved' && claim.status !== 'assigned') {
    return res.status(400).json({
      success: false,
      message: 'Claim must be approved or assigned before completion'
    });
  }

  // Update claim status
  claim.status = 'completed';
  claim.completedBy = req.admin._id;
  claim.completedAt = new Date();
  claim.completionNotes = completionNotes?.trim();

  await claim.save();

  // Log activity
  await req.admin.logActivity(
    'COMPLETE_WARRANTY_CLAIM',
    `Completed warranty claim ${claim._id} for ${claim.item}`,
    'admin',
    req.admin._id.toString(),
    req.ip,
    req.get('User-Agent')
  );

  logger.info('Warranty claim completed successfully', {
    adminId: req.admin._id,
    claimId: claim._id,
    subscriptionId: claim.subscriptionId
  });

  res.json({
    success: true,
    message: 'Warranty claim completed successfully',
    data: { claim }
  });
});

module.exports = {
  getWarrantyClaims,
  getWarrantyClaim,
  approveWarrantyClaim,
  rejectWarrantyClaim,
  assignVendorToClaim,
  completeWarrantyClaim,
};
