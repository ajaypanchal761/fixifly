const { Booking } = require('../models/Booking');
const Vendor = require('../models/Vendor');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const RazorpayService = require('../services/razorpayService');

// @desc    Get all bookings for admin
// @route   GET /api/admin/bookings
// @access  Admin
const getAllBookings = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      paymentStatus, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (paymentStatus) {
      filter['payment.status'] = paymentStatus;
    }
    
    if (search) {
      filter.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
        { 'payment.razorpayPaymentId': { $regex: search, $options: 'i' } },
        { 'payment.razorpayOrderId': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const bookings = await Booking.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true });

    // Manually populate vendor data and review data
    for (const booking of bookings) {
      if (booking.vendor && booking.vendor.vendorId) {
        const vendor = await Vendor.findOne({ vendorId: booking.vendor.vendorId })
          .select('firstName lastName email phone');
        if (vendor) {
          booking.vendor.vendorId = vendor;
        }
      }
      
      // Get review data for this booking
      const Review = require('../models/Review');
      const review = await Review.findOne({ bookingId: booking._id })
        .select('rating comment createdAt')
        .lean();
      
      if (review) {
        booking.review = {
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt
        };
      } else {
        booking.review = null;
      }
    }

    const totalBookings = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalBookings / parseInt(limit));

    // Calculate statistics
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          waitingForEngineerBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'waiting_for_engineer'] }, 1, 0] }
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          inProgressBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          paidBookings: {
            $sum: { $cond: [{ $eq: ['$payment.status', 'completed'] }, 1, 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$payment.status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    const bookingStats = stats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      pendingBookings: 0,
      waitingForEngineerBookings: 0,
      confirmedBookings: 0,
      inProgressBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      paidBookings: 0,
      pendingPayments: 0
    };

    logger.info(`Admin retrieved bookings: ${bookings.length}`, {
      totalBookings,
      page: parseInt(page),
      filters: { status, paymentStatus, search }
    });

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBookings,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: parseInt(limit)
        },
        stats: bookingStats
      }
    });
  } catch (error) {
    logger.error('Error retrieving admin bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving bookings',
      error: error.message
    });
  }
});

// @desc    Get single booking for admin
// @route   GET /api/admin/bookings/:id
// @access  Admin
const getBookingById = asyncHandler(async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).lean();

    // Manually populate vendor data
    if (booking && booking.vendor && booking.vendor.vendorId) {
      const vendor = await Vendor.findOne({ vendorId: booking.vendor.vendorId })
        .select('firstName lastName email phone address');
      if (vendor) {
        booking.vendor.vendorId = vendor;
      }
    }

    // Get review data for this booking
    if (booking) {
      const Review = require('../models/Review');
      const review = await Review.findOne({ bookingId: booking._id })
        .populate('userId', 'name email')
        .lean();
      
      if (review) {
        booking.review = {
          rating: review.rating,
          comment: review.comment,
          category: review.category,
          isAnonymous: review.isAnonymous,
          createdAt: review.createdAt,
          user: review.userId
        };
      } else {
        booking.review = null;
      }
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    logger.info(`Admin retrieved booking: ${booking.bookingReference}`, {
      bookingId: booking._id,
      status: booking.status
    });

    res.json({
      success: true,
      data: {
        booking,
        bookingReference: booking.bookingReference
      }
    });
  } catch (error) {
    logger.error('Error retrieving admin booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving booking',
      error: error.message
    });
  }
});

// @desc    Update booking status
// @route   PATCH /api/admin/bookings/:id/status
// @access  Admin
const updateBookingStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'waiting_for_engineer', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, waiting_for_engineer, confirmed, in_progress, completed, cancelled'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        'tracking.updatedAt': new Date(),
        ...(status === 'completed' && { 'tracking.completedAt': new Date() })
      },
      { new: true, runValidators: true }
    ).lean();

    // Manually populate vendor data
    if (booking && booking.vendor && booking.vendor.vendorId) {
      const vendor = await Vendor.findOne({ vendorId: booking.vendor.vendorId })
        .select('firstName lastName email phone');
      if (vendor) {
        booking.vendor.vendorId = vendor;
      }
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    logger.info(`Admin updated booking status: ${booking.bookingReference} to ${status}`, {
      bookingId: booking._id,
      newStatus: status,
      adminId: req.admin._id
    });

    // Send WhatsApp notification to user about status update
    try {
      await WhatsAppService.sendStatusUpdateToUser(booking, status);
      logger.info('WhatsApp status update sent to user', {
        bookingId: booking._id,
        customerPhone: booking.customer.phone,
        newStatus: status
      });
    } catch (error) {
      logger.error('Failed to send WhatsApp status update to user:', error);
      // Don't fail the status update if WhatsApp fails
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        booking,
        bookingReference: booking.bookingReference
      }
    });
  } catch (error) {
    logger.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
});

// @desc    Update booking priority
// @route   PATCH /api/admin/bookings/:id/priority
// @access  Admin
const updateBookingPriority = asyncHandler(async (req, res) => {
  try {
    const { priority } = req.body;
    
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Must be one of: low, medium, high, urgent'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        priority,
        'tracking.updatedAt': new Date()
      },
      { new: true, runValidators: true }
    ).lean();

    // Manually populate vendor data
    if (booking && booking.vendor && booking.vendor.vendorId) {
      const vendor = await Vendor.findOne({ vendorId: booking.vendor.vendorId })
        .select('firstName lastName email phone');
      if (vendor) {
        booking.vendor.vendorId = vendor;
      }
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    logger.info(`Admin updated booking priority: ${booking.bookingReference} to ${priority}`, {
      bookingId: booking._id,
      newPriority: priority,
      adminId: req.admin._id
    });

    res.json({
      success: true,
      message: 'Booking priority updated successfully',
      data: {
        booking,
        bookingReference: booking.bookingReference
      }
    });
  } catch (error) {
    logger.error('Error updating booking priority:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking priority',
      error: error.message
    });
  }
});

// @desc    Assign vendor to booking
// @route   PATCH /api/admin/bookings/:id/assign-vendor
// @access  Admin
const assignVendor = asyncHandler(async (req, res) => {
  try {
    const { vendorId, scheduledDate, scheduledTime, priority, notes } = req.body;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

    const updateData = {
      'vendor.vendorId': vendorId,
      'vendor.assignedAt': new Date(),
      'vendor.autoRejectAt': new Date(Date.now() + 10 * 60 * 1000), // Set 10-minute auto-reject timer
      'tracking.updatedAt': new Date(),
      status: 'confirmed', // Automatically confirm booking when vendor is assigned
      // Reset vendor response when reassigning to new vendor
      'vendorResponse.status': 'pending',
      'vendorResponse.respondedAt': null,
      'vendorResponse.responseNote': null
    };

    // Add scheduled date and time if provided
    if (scheduledDate) {
      updateData['scheduling.scheduledDate'] = new Date(scheduledDate);
    }
    if (scheduledTime) {
      updateData['scheduling.scheduledTime'] = scheduledTime;
    }

    // Add priority if provided
    if (priority) {
      updateData.priority = priority;
    }

    // Add assignment notes if provided
    if (notes) {
      updateData.assignmentNotes = notes;
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    // Manually populate vendor data and mark first task assignment
    if (booking && booking.vendor && booking.vendor.vendorId) {
      const vendor = await Vendor.findOne({ vendorId: booking.vendor.vendorId })
        .select('firstName lastName email phone address');
      if (vendor) {
        booking.vendor.vendorId = vendor;
        
        // Mark first task assignment for mandatory deposit requirement
        await vendor.markFirstTaskAssignment();
      }
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Create notification for vendor using simple notification service
    try {
      const simpleNotificationService = require('../services/simpleNotificationService');
      const notificationSent = await simpleNotificationService.sendBookingAssignmentNotification(vendorId, booking);
      
      if (notificationSent) {
        logger.info('Vendor notification sent successfully for booking assignment', {
          vendorId,
          bookingId: booking._id
        });
      } else {
        logger.warn('Failed to send vendor notification for booking assignment', {
          vendorId,
          bookingId: booking._id
        });
      }
    } catch (notificationError) {
      logger.error('Error creating vendor notification for booking assignment:', notificationError);
      // Don't fail the assignment if notification fails
    }

    logger.info(`Admin assigned vendor to booking: ${booking.bookingReference}`, {
      bookingId: booking._id,
      vendorId,
      adminId: req.admin._id
    });

    res.json({
      success: true,
      message: 'Vendor assigned successfully',
      data: {
        booking,
        bookingReference: booking.bookingReference
      }
    });
  } catch (error) {
    logger.error('Error assigning vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning vendor',
      error: error.message
    });
  }
});

// @desc    Process refund for booking
// @route   POST /api/admin/bookings/:id/refund
// @access  Admin
const processRefund = asyncHandler(async (req, res) => {
  try {
    const { amount, reason = 'Admin processed refund' } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund booking with incomplete payment'
      });
    }

    if (!booking.payment.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'No Razorpay payment ID found for this booking'
      });
    }

    const refundAmount = amount || booking.pricing.totalAmount;

    // Process refund through Razorpay
    const refund = await RazorpayService.processRefund(
      booking.payment.razorpayPaymentId,
      refundAmount,
      reason
    );

    // Update booking with refund information
    booking.payment.status = 'refunded';
    booking.payment.refundId = refund.refundId;
    booking.payment.refundAmount = refund.amount;
    booking.payment.refundReason = reason;
    booking.payment.refundedAt = new Date();
    booking.status = 'cancelled';
    booking['tracking.updatedAt'] = new Date();

    await booking.save();

    logger.info(`Admin processed refund for booking: ${booking.bookingReference}`, {
      bookingId: booking._id,
      refundId: refund.refundId,
      refundAmount,
      adminId: req.admin._id
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        booking,
        bookingReference: booking.bookingReference,
        refund
      }
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
});

// @desc    Get booking statistics for admin dashboard
// @route   GET /api/admin/bookings/stats
// @access  Admin
const getBookingStats = asyncHandler(async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
        break;
      case '1y':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const stats = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          averageOrderValue: { $avg: '$pricing.totalAmount' },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          waitingForEngineerBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'waiting_for_engineer'] }, 1, 0] }
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          inProgressBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          paidBookings: {
            $sum: { $cond: [{ $eq: ['$payment.status', 'completed'] }, 1, 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$payment.status', 'pending'] }, 1, 0] }
          },
          refundedBookings: {
            $sum: { $cond: [{ $eq: ['$payment.status', 'refunded'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get daily booking trends for the last 30 days
    const dailyTrends = await Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const result = stats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      pendingBookings: 0,
      waitingForEngineerBookings: 0,
      confirmedBookings: 0,
      inProgressBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      paidBookings: 0,
      pendingPayments: 0,
      refundedBookings: 0
    };

    logger.info(`Admin retrieved booking statistics for period: ${period}`, {
      totalBookings: result.totalBookings,
      totalRevenue: result.totalRevenue
    });

    res.json({
      success: true,
      data: {
        ...result,
        dailyTrends,
        period
      }
    });
  } catch (error) {
    logger.error('Error retrieving booking statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving booking statistics',
      error: error.message
    });
  }
});

// @desc    Delete booking (soft delete)
// @route   DELETE /api/admin/bookings/:id
// @access  Admin
const deleteBooking = asyncHandler(async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    logger.info(`Admin deleted booking: ${booking.bookingReference}`, {
      bookingId: booking._id,
      adminId: req.admin._id
    });

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting booking',
      error: error.message
    });
  }
});

module.exports = {
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  updateBookingPriority,
  assignVendor,
  processRefund,
  getBookingStats,
  deleteBooking
};
