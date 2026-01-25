const { Booking } = require('../models/Booking');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const RazorpayService = require('../services/razorpayService');
const userNotificationService = require('../services/userNotificationService');
const emailService = require('../services/emailService');

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
      // Find vendors that match the search term (name or vendor ID)
      const matchingVendors = await Vendor.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { vendorId: { $regex: search, $options: 'i' } }
        ]
      }).select('vendorId');

      const vendorIds = matchingVendors.map(v => v.vendorId);

      filter.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
        { 'payment.razorpayPaymentId': { $regex: search, $options: 'i' } },
        { 'payment.razorpayOrderId': { $regex: search, $options: 'i' } },
        { 'payment.transactionId': { $regex: search, $options: 'i' } },
        { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: search, options: "i" } } },
        // Search by vendor ID (direct match or from vendor lookup)
        { 'vendor.vendorId': { $in: vendorIds } },
        { 'vendor.vendorId': { $regex: search, $options: 'i' } }
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

    // Send push notification to user about status update
    try {
      // Find user by email or phone
      const user = await User.findOne({
        $or: [
          { email: booking.customer.email },
          { phone: booking.customer.phone }
        ]
      });

      if (user) {
        const notificationSent = await userNotificationService.sendBookingStatusUpdate(
          user._id,
          booking,
          status
        );

        if (notificationSent) {
          logger.info('Push notification sent to user for booking status update', {
            bookingId: booking._id,
            userId: user._id,
            userEmail: user.email,
            newStatus: status
          });
        } else {
          logger.warn('Failed to send push notification to user for booking status update', {
            bookingId: booking._id,
            userId: user._id,
            userEmail: user.email,
            newStatus: status
          });
        }
      } else {
        logger.warn('User not found for booking status notification', {
          bookingId: booking._id,
          customerEmail: booking.customer.email,
          customerPhone: booking.customer.phone
        });
      }
    } catch (error) {
      logger.error('Failed to send push notification to user for booking status update:', error);
      // Don't fail the status update if notification fails
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

    // Validation: Check if vendor already has a task for the same date and time
    if (scheduledDate && scheduledTime) {
      const scheduledDateObj = new Date(scheduledDate);
      // Normalize date to start of day for comparison (set hours, minutes, seconds, ms to 0)
      const normalizedDate = new Date(scheduledDateObj);
      normalizedDate.setHours(0, 0, 0, 0);

      // Get end of day for date range query
      const endOfDay = new Date(normalizedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Build conflict filter
      const conflictFilter = {
        _id: { $ne: req.params.id },
        'vendor.vendorId': vendorId,
        'scheduling.scheduledDate': {
          $gte: normalizedDate,
          $lte: endOfDay
        },
        'scheduling.scheduledTime': scheduledTime,
        status: { $nin: ['cancelled', 'declined', 'completed'] },
        // Only count as conflict if vendor hasn't declined it
        $or: [
          { 'vendorResponse.status': { $exists: false } },
          { 'vendorResponse.status': null },
          { 'vendorResponse.status': 'pending' },
          { 'vendorResponse.status': 'accepted' }
        ]
      };

      const conflictingBooking = await Booking.findOne(conflictFilter).select('bookingReference status vendorResponse.status');

      if (conflictingBooking) {
        logger.warn('Vendor conflict detected in bookings', {
          vendorId,
          scheduledDate: normalizedDate,
          scheduledTime,
          conflictingBooking: conflictingBooking.bookingReference,
          conflictingStatus: conflictingBooking.status,
          currentBookingId: req.params.id
        });
        return res.status(400).json({
          success: false,
          message: `Vendor is already assigned to Booking ${conflictingBooking.bookingReference} (Status: ${conflictingBooking.status}) at the same date and time. Please choose a different time or vendor.`
        });
      }

      // Also check for conflicting Support Tickets
      const SupportTicket = require('../models/SupportTicket');
      const VendorModel = require('../models/Vendor');

      // Find the vendor's ObjectId first for accurate cross-collection matching
      const vendorRef = await VendorModel.findOne({ vendorId: vendorId }).select('_id');

      if (vendorRef) {
        const conflictingTicket = await SupportTicket.findOne({
          assignedTo: vendorRef._id,
          scheduledDate: {
            $gte: normalizedDate,
            $lte: endOfDay
          },
          scheduledTime: scheduledTime,
          status: { $nin: ['Resolved', 'Closed', 'Cancelled'] },
          vendorStatus: { $nin: ['Declined', 'Cancelled'] }
        }).select('ticketId status vendorStatus');

        if (conflictingTicket) {
          logger.warn('Vendor conflict detected in support tickets', {
            vendorId,
            scheduledDate: normalizedDate,
            scheduledTime,
            conflictingTicket: conflictingTicket.ticketId,
            currentBookingId: req.params.id
          });
          return res.status(400).json({
            success: false,
            message: `Vendor is already assigned to Support Ticket ${conflictingTicket.ticketId} (Status: ${conflictingTicket.status}) at the same date and time.`
          });
        }
      }

      // Check for conflicting warranty claims
      const WarrantyClaim = require('../models/WarrantyClaim');

      // Get vendor ObjectId for WarrantyClaim check
      const vendorForClaim = await Vendor.findOne({ vendorId: vendorId }).select('_id');

      if (vendorForClaim) {
        const conflictingClaim = await WarrantyClaim.findOne({
          assignedVendor: vendorForClaim._id,
          scheduledDate: {
            $gte: normalizedDate,
            $lte: endOfDay
          },
          scheduledTime: scheduledTime,
          status: { $nin: ['cancelled', 'rejected', 'completed'] }
        });

        if (conflictingClaim) {
          logger.warn('Vendor conflict detected with warranty claim', {
            vendorId,
            scheduledDate: normalizedDate,
            scheduledTime,
            conflictingClaimId: conflictingClaim._id,
            currentBookingId: req.params.id
          });
          return res.status(400).json({
            success: false,
            message: 'Vendor is not available. Already assigned to a warranty claim at the same date and time.'
          });
        }
      }
    }

    const updateData = {
      'vendor.vendorId': vendorId,
      'vendor.assignedAt': new Date(),
      'vendor.autoRejectAt': new Date(Date.now() + 25 * 60 * 1000), // Set 25-minute auto-reject timer
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
    );

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

    console.log('✅ Booking found, proceeding with notifications');
    console.log('Booking ID:', booking._id);
    console.log('Vendor ID to assign:', vendorId);

    // Create notification for vendor (creates notification record + sends push notification)
    // IMPORTANT: Send notification BEFORE user notification to ensure vendor gets notified
    try {
      console.log('🔔 === VENDOR NOTIFICATION CALL START ===');
      console.log('Vendor ID:', vendorId);
      console.log('Booking ID:', booking._id);
      console.log('Booking Reference:', booking.bookingReference);

      logger.info('🔔 Attempting to send vendor push notification for booking assignment', {
        vendorId,
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        bookingStatus: booking.status,
        customerName: booking.customer?.name,
        customerEmail: booking.customer?.email
      });

      console.log('📦 Importing vendorNotificationController...');
      const vendorNotificationController = require('./vendorNotificationController');
      console.log('✅ Controller imported:', Object.keys(vendorNotificationController));

      const { createBookingAssignmentNotification } = vendorNotificationController;
      console.log('✅ Function extracted:', typeof createBookingAssignmentNotification);
      console.log('📞 Calling createBookingAssignmentNotification with:', {
        vendorId,
        bookingId: booking._id,
        bookingRef: booking.bookingReference
      });

      const notificationResult = await createBookingAssignmentNotification(vendorId, booking);
      console.log('✅ Notification function returned:', notificationResult ? 'Success' : 'No result');

      console.log('✅ Vendor notification function completed');
      logger.info('✅ Vendor notification created and sent successfully for booking assignment', {
        vendorId,
        bookingId: booking._id,
        bookingReference: booking.bookingReference
      });

      // Send email to vendor
      try {
        // Fix: Use findOne({ vendorId }) instead of findById for human-readable numeric IDs
        const vendor = await Vendor.findOne({ vendorId: vendorId }).select('firstName lastName email');

        if (vendor && vendor.email) {
          console.log('📧 Sending booking assignment email to vendor:', {
            vendorId: vendor._id,
            vendorEmail: vendor.email,
            bookingReference: booking.bookingReference
          });

          const emailResult = await emailService.sendVendorBookingAssignmentEmail(vendor, booking);

          if (emailResult.success) {
            console.log('✅ Booking assignment email sent to vendor successfully');
            logger.info('Booking assignment email sent to vendor', {
              vendorId: vendor._id,
              vendorEmail: vendor.email,
              bookingId: booking._id,
              bookingReference: booking.bookingReference,
              messageId: emailResult.messageId
            });
          } else {
            console.log('⚠️ Failed to send booking assignment email to vendor:', emailResult.message || emailResult.error);
            logger.warn('Failed to send booking assignment email to vendor', {
              vendorId: vendor._id,
              vendorEmail: vendor.email,
              bookingId: booking._id,
              bookingReference: booking.bookingReference,
              error: emailResult.message || emailResult.error
            });
          }
        } else {
          console.log('⚠️ Vendor not found or email not available for booking assignment email');
          logger.warn('Vendor not found or email not available for booking assignment email', {
            vendorId,
            bookingId: booking._id
          });
        }
      } catch (emailError) {
        console.error('❌ Error sending booking assignment email to vendor:', emailError);
        logger.error('Error sending booking assignment email to vendor', {
          error: emailError.message,
          vendorId,
          bookingId: booking._id,
          bookingReference: booking.bookingReference
        });
        // Don't fail the assignment if email fails
      }
    } catch (notificationError) {
      console.error('❌ === VENDOR NOTIFICATION ERROR ===');
      console.error('Error:', notificationError);
      console.error('Error message:', notificationError?.message);
      console.error('Error stack:', notificationError?.stack);

      logger.error('❌ Error creating vendor notification for booking assignment:', {
        error: notificationError.message,
        stack: notificationError.stack,
        vendorId,
        bookingId: booking._id,
        bookingReference: booking.bookingReference
      });
      // Don't fail the assignment if notification fails
    }

    // Send notification to user about vendor assignment (ENGINEER ASSIGNED) only after vendor accepts
    if (booking.vendorResponse?.status === 'accepted') {
      try {
        console.log('🔔 === PUSH NOTIFICATION FLOW START (ENGINEER ASSIGNED) ===');
        console.log('📋 Booking Details:', {
          bookingId: booking._id.toString(),
          bookingReference: booking.bookingReference,
          customerEmail: booking.customer.email,
          customerPhone: booking.customer.phone,
          vendorId: vendorId,
          status: booking.status
        });

        // Normalize phone number for matching (remove spaces, handle +91 prefix)
        const normalizePhone = (phone) => {
          if (!phone) return null;
          const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits
          // If starts with 91 and has 12 digits, remove 91
          if (cleaned.length === 12 && cleaned.startsWith('91')) {
            return cleaned.substring(2);
          }
          // If has 10 digits, return as is
          if (cleaned.length === 10) {
            return cleaned;
          }
          return cleaned;
        };

        const normalizedBookingPhone = normalizePhone(booking.customer.phone);
        const normalizedBookingEmail = booking.customer.email?.toLowerCase().trim();

        console.log('🔍 Searching for user with:', {
          email: normalizedBookingEmail,
          phone: normalizedBookingPhone,
          originalPhone: booking.customer.phone
        });

        // Find user by email or phone (try multiple phone formats)
        let user = await User.findOne({
          $or: [
            { email: normalizedBookingEmail },
            { phone: booking.customer.phone },
            ...(normalizedBookingPhone ? [
              { phone: `+91${normalizedBookingPhone}` },
              { phone: `91${normalizedBookingPhone}` },
              { phone: normalizedBookingPhone }
            ] : [])
          ]
        }).select('+fcmTokens +fcmTokenMobile');

        if (!user) {
          console.log('⚠️ User not found for engineer assignment notification');
          console.log('🔍 Search criteria used:', {
            email: normalizedBookingEmail,
            phoneVariants: [
              booking.customer.phone,
              normalizedBookingPhone ? `+91${normalizedBookingPhone}` : null,
              normalizedBookingPhone ? `91${normalizedBookingPhone}` : null,
              normalizedBookingPhone
            ].filter(Boolean)
          });
          logger.warn('User not found for vendor assignment notification', {
            bookingId: booking._id,
            customerEmail: booking.customer.email,
            customerPhone: booking.customer.phone,
            normalizedPhone: normalizedBookingPhone,
            vendorId
          });
        } else {
          console.log('✅ User found:', {
            userId: user._id.toString(),
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone,
            webTokensCount: user.fcmTokens?.length || 0,
            mobileTokensCount: user.fcmTokenMobile?.length || 0,
            pushNotificationsEnabled: user.preferences?.notifications?.push !== false
          });

          // Get vendor name for notification
          const vendor = await Vendor.findOne({ vendorId: vendorId })
            .select('firstName lastName');
          const vendorName = vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Engineer';

          const userNotificationSent = await userNotificationService.sendToUser(
            user._id,
            {
              title: '👨‍🔧 Engineer Assigned!',
              body: `Great news! ${vendorName} has been assigned to your booking #${booking.bookingReference}. They will contact you soon to schedule the service.`
            },
            {
              type: 'engineer_assigned',
              bookingId: booking._id.toString(),
              bookingReference: booking.bookingReference,
              vendorId: vendorId,
              vendorName: vendorName,
              priority: 'high',
              link: `/booking/${booking._id}`
            }
          );

          if (userNotificationSent) {
            console.log('✅ User notification sent successfully for engineer assignment');
            logger.info('User notification sent successfully for vendor assignment', {
              userId: user._id,
              userEmail: user.email,
              userPhone: user.phone,
              bookingId: booking._id,
              bookingReference: booking.bookingReference,
              vendorId,
              vendorName
            });
          } else {
            console.log('❌ Failed to send user notification for engineer assignment');
            logger.warn('Failed to send user notification for vendor assignment', {
              userId: user._id,
              userEmail: user.email,
              userPhone: user.phone,
              bookingId: booking._id,
              vendorId,
              webTokensCount: user.fcmTokens?.length || 0,
              mobileTokensCount: user.fcmTokenMobile?.length || 0
            });
          }
        }
        console.log('🔔 === PUSH NOTIFICATION FLOW END (ENGINEER ASSIGNED) ===');
      } catch (userNotificationError) {
        console.error('❌ === ERROR IN PUSH NOTIFICATION (ENGINEER ASSIGNED) ===');
        console.error('Error message:', userNotificationError.message);
        console.error('Error stack:', userNotificationError.stack);
        console.error('Booking ID:', booking._id);
        console.error('Customer Email:', booking.customer.email);
        console.error('Customer Phone:', booking.customer.phone);
        console.error('Vendor ID:', vendorId);
        console.error('❌ === END ERROR (ENGINEER ASSIGNED) ===');
        logger.error('Error creating user notification for vendor assignment', {
          error: userNotificationError.message,
          stack: userNotificationError.stack,
          bookingId: booking._id,
          customerEmail: booking.customer.email,
          customerPhone: booking.customer.phone,
          vendorId
        });
        // Don't fail the assignment if notification fails
      }
    } else {
      logger.info('User notification deferred: vendor has not accepted yet', {
        bookingId: booking._id,
        vendorId,
        vendorResponseStatus: booking.vendorResponse?.status
      });
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

// @desc    Update booking details
// @route   PUT /api/admin/bookings/:id
// @access  Admin
const updateBooking = asyncHandler(async (req, res) => {
  try {
    const { customer, scheduling, notes } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const updateData = {
      'tracking.updatedAt': new Date()
    };

    // Update customer information if provided
    if (customer) {
      if (customer.name) updateData['customer.name'] = customer.name;
      if (customer.email) updateData['customer.email'] = customer.email;
      if (customer.phone) updateData['customer.phone'] = customer.phone;
      if (customer.address) {
        if (customer.address.street) updateData['customer.address.street'] = customer.address.street;
        if (customer.address.city) updateData['customer.address.city'] = customer.address.city;
        if (customer.address.state) updateData['customer.address.state'] = customer.address.state;
        if (customer.address.pincode) updateData['customer.address.pincode'] = customer.address.pincode;
      }
    }

    // Update scheduling if provided
    if (scheduling) {
      const newScheduledDate = scheduling.scheduledDate ? new Date(scheduling.scheduledDate) : booking.scheduling?.scheduledDate;
      const newScheduledTime = scheduling.scheduledTime || booking.scheduling?.scheduledTime;
      const vendorId = booking.vendor?.vendorId;

      if (vendorId && (scheduling.scheduledDate || scheduling.scheduledTime) && newScheduledDate && newScheduledTime) {
        // Normalize date to start of day for comparison
        const normalizedUpdateDate = new Date(newScheduledDate);
        normalizedUpdateDate.setHours(0, 0, 0, 0);

        // Get end of day for date range query
        const endOfUpdateDay = new Date(normalizedUpdateDate);
        endOfUpdateDay.setHours(23, 59, 59, 999);

        // Check for conflicting active bookings
        // Exclude cancelled, declined, completed statuses and bookings where vendor declined
        const conflictingBooking = await Booking.findOne({
          _id: { $ne: req.params.id },
          'vendor.vendorId': vendorId,
          'scheduling.scheduledDate': {
            $gte: normalizedUpdateDate,
            $lte: endOfUpdateDay
          },
          'scheduling.scheduledTime': newScheduledTime,
          status: { $nin: ['cancelled', 'declined', 'completed'] },
          $or: [
            { 'vendorResponse.status': { $exists: false } },
            { 'vendorResponse.status': null },
            { 'vendorResponse.status': 'pending' },
            { 'vendorResponse.status': 'accepted' }
          ]
        }).select('bookingReference status vendorResponse.status');

        if (conflictingBooking) {
          logger.warn('Vendor conflict detected in updateBooking', {
            vendorId,
            scheduledDate: normalizedUpdateDate,
            scheduledTime: newScheduledTime,
            conflictingBooking: conflictingBooking.bookingReference,
            conflictingStatus: conflictingBooking.status,
            currentBookingId: req.params.id
          });
          return res.status(400).json({
            success: false,
            message: `Vendor is not available. Already assigned to booking ${conflictingBooking.bookingReference} (Status: ${conflictingBooking.status}) at the same date and time.`
          });
        }

        // Check for conflicting warranty claims
        const WarrantyClaim = require('../models/WarrantyClaim');
        const vendorForClaim = await Vendor.findOne({ vendorId: vendorId }).select('_id');

        if (vendorForClaim) {
          const conflictingClaim = await WarrantyClaim.findOne({
            assignedVendor: vendorForClaim._id,
            scheduledDate: {
              $gte: normalizedUpdateDate,
              $lte: endOfUpdateDay
            },
            scheduledTime: newScheduledTime,
            status: { $nin: ['cancelled', 'rejected', 'completed'] }
          });

          if (conflictingClaim) {
            logger.warn('Vendor conflict detected with warranty claim in updateBooking', {
              vendorId,
              scheduledDate: normalizedUpdateDate,
              scheduledTime: newScheduledTime,
              conflictingClaimId: conflictingClaim._id,
              currentBookingId: req.params.id
            });
            return res.status(400).json({
              success: false,
              message: 'Vendor is not available. Already assigned to a warranty claim at the same date and time.'
            });
          }
        }
      }

      if (scheduling.scheduledDate) {
        updateData['scheduling.scheduledDate'] = new Date(scheduling.scheduledDate);
      }
      if (scheduling.scheduledTime) {
        updateData['scheduling.scheduledTime'] = scheduling.scheduledTime;
      }
      if (scheduling.preferredDate) {
        updateData['scheduling.preferredDate'] = new Date(scheduling.preferredDate);
      }
      if (scheduling.preferredTimeSlot) {
        updateData['scheduling.preferredTimeSlot'] = scheduling.preferredTimeSlot;
      }
    }

    // Update notes if provided
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    // Manually populate vendor data
    if (updatedBooking && updatedBooking.vendor && updatedBooking.vendor.vendorId) {
      const vendor = await Vendor.findOne({ vendorId: updatedBooking.vendor.vendorId })
        .select('firstName lastName email phone');
      if (vendor) {
        updatedBooking.vendor.vendorId = vendor;
      }
    }

    logger.info(`Admin updated booking: ${updatedBooking.bookingReference}`, {
      bookingId: updatedBooking._id,
      adminId: req.admin._id,
      updates: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: {
        booking: updatedBooking,
        bookingReference: updatedBooking.bookingReference
      }
    });
  } catch (error) {
    logger.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
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
  updateBooking,
  updateBookingStatus,
  updateBookingPriority,
  assignVendor,
  processRefund,
  getBookingStats,
  deleteBooking
};
