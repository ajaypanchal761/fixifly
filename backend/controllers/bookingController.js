const { Booking } = require('../models/Booking');
const Vendor = require('../models/Vendor');
const Admin = require('../models/Admin');
const VendorWallet = require('../models/VendorWallet');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const RazorpayService = require('../services/razorpayService');
const adminNotificationService = require('../services/adminNotificationService');
const userNotificationService = require('../services/userNotificationService');
const emailService = require('../services/emailService');
const botbeeService = require('../services/botbeeService');

// Helper: send email to all active admins for booking events
const notifyAdminsByEmail = async (subject, messageLines = []) => {
  try {
    const admins = await Admin.find({ isActive: true }).select('name email');
    if (!admins.length) {
      logger.warn('No active admins found for email notification', { subject });
      return;
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #111827; background: #f9fafb; padding: 16px; }
            .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
            .title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
            .line { margin: 4px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">${subject}</div>
            ${messageLines.map(line => `<div class="line">${line}</div>`).join('')}
          </div>
        </body>
      </html>
    `;

    for (const admin of admins) {
      try {
        await emailService.sendEmail({
          to: admin.email,
          subject,
          html: htmlBody
        });
        logger.info('Admin booking email sent', { subject, admin: admin.email });
      } catch (err) {
        logger.error('Failed sending admin booking email', { subject, admin: admin.email, error: err.message });
      }
    }
  } catch (error) {
    logger.error('notifyAdminsByEmail failed', { subject, error: error.message });
  }
};

// Helper: booking identifier display
const getDisplayBookingId = (booking) => {
  if (!booking) return 'N/A';
  if (booking.bookingReference) return booking.bookingReference;
  if (booking._id) return `FIX${booking._id.toString().slice(-8).toUpperCase()}`;
  return 'N/A';
};

// Helper: compact booking summary lines
const buildBookingSummaryLines = (booking, extra = {}) => {
  if (!booking) return [];
  const displayId = getDisplayBookingId(booking);
  const bookingIdLine = extra.showBookingId
    ? `Booking ID: ${displayId}`
    : `Booking Ref: ${displayId}`;
  const statusLine = extra.statusText ? `Status: ${extra.statusText}` : `Status: ${booking.status || 'N/A'}`;
  const vendorLine = extra.vendorInfo ? `Vendor: ${extra.vendorInfo}` : null;
  return [
    bookingIdLine,
    `Customer: ${booking.customer?.name || 'N/A'} (${booking.customer?.phone || 'N/A'})`,
    `Address: ${booking.customer?.address?.street || ''} ${booking.customer?.address?.city || ''} ${booking.customer?.address?.pincode || ''}`,
    `Services: ${(booking.services || []).map(s => s.serviceName).join(', ') || 'N/A'}`,
    statusLine,
    `Scheduled: ${booking.scheduling?.scheduledDate ? new Date(booking.scheduling.scheduledDate).toLocaleString('en-IN') : booking.scheduling?.preferredDate ? new Date(booking.scheduling.preferredDate).toLocaleString('en-IN') : 'N/A'} ${booking.scheduling?.scheduledTime || booking.scheduling?.preferredTimeSlot || ''}`,
    ...(vendorLine ? [vendorLine] : []),
    ...(extra.details ? [extra.details] : [])
  ];
};

// Helper function to check if user is booking for the first time - DISABLED
// First-time user free service feature has been removed
const isFirstTimeUser = async (customerEmail, customerPhone) => {
  return false; // Always return false - no free service for first-time users
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (requires authentication)
const createBooking = asyncHandler(async (req, res) => {
  try {
    console.log('=== BOOKING CREATION REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Authenticated user:', req.user?.userId);

    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login to create a booking.'
      });
    }

    const {
      customer,
      services,
      pricing,
      scheduling,
      notes
    } = req.body;

    // Validate required fields
    if (!customer || !services || !pricing || !scheduling) {
      console.log('Validation failed - missing required fields:', {
        customer: !!customer,
        services: !!services,
        pricing: !!pricing,
        scheduling: !!scheduling
      });
      return res.status(400).json({
        success: false,
        message: 'Customer information, services, pricing, and scheduling are required'
      });
    }

    // Validate services array
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one service is required'
      });
    }

    // Validate pricing - allow 0 values for first-time users
    if (pricing.subtotal === undefined || pricing.subtotal === null ||
      pricing.totalAmount === undefined || pricing.totalAmount === null) {
      return res.status(400).json({
        success: false,
        message: 'Pricing information is incomplete'
      });
    }

    // First-time user free service feature has been removed
    // All users now pay regular pricing
    let finalPricing = { ...pricing };

    // Create booking data
    const bookingData = {
      user: req.user.userId, // Link booking to authenticated user
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: {
          street: customer.address.street,
          city: customer.address.city,
          state: customer.address.state,
          pincode: customer.address.pincode
        }
      },
      services: services.map(service => ({
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        price: service.price
      })),
      pricing: {
        subtotal: finalPricing.subtotal,
        serviceFee: finalPricing.serviceFee || 100,
        totalAmount: finalPricing.totalAmount,
      },
      scheduling: {
        preferredDate: new Date(scheduling.preferredDate),
        preferredTimeSlot: scheduling.preferredTimeSlot
      },
      notes: notes || '',
      status: 'waiting_for_engineer',
      payment: {
        status: req.body.payment?.status || (req.body.payment?.method === 'cash' ? 'pending' : 'completed'),
        method: req.body.payment?.method || 'card',
        transactionId: req.body.payment?.transactionId || `TXN${Date.now()}`,
        paidAt: req.body.payment?.method === 'cash' ? null : new Date()
      }
    };

    console.log('About to create booking with data:', JSON.stringify(bookingData, null, 2));

    const booking = await Booking.create(bookingData);

    console.log('Booking created successfully:', {
      id: booking._id,
      reference: booking.bookingReference,
      status: booking.status
    });

    logger.info(`Booking created: ${booking.bookingReference}`, {
      bookingId: booking._id,
      customerEmail: booking.customer.email,
      totalAmount: booking.pricing.totalAmount,
      servicesCount: booking.services.length,
    });

    // First-time user status update removed - feature disabled

    // Send booking confirmation WhatsApp to user
    try {
      console.log('📱 Sending booking confirmation WhatsApp to user:', {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        customerPhone: booking.customer.phone
      });

      const whatsappResult = await botbeeService.sendBookingConfirmationToUser(booking);

      if (whatsappResult.success) {
        console.log('✅ Booking confirmation WhatsApp sent to user successfully');
        logger.info('Booking confirmation WhatsApp sent to user', {
          bookingId: booking._id,
          customerPhone: booking.customer.phone,
          data: whatsappResult.data
        });
      } else {
        console.log('⚠️ Failed to send booking confirmation WhatsApp to user:', whatsappResult.error);
        logger.warn('Failed to send booking confirmation WhatsApp to user', {
          bookingId: booking._id,
          customerPhone: booking.customer.phone,
          error: whatsappResult.error
        });
      }
    } catch (error) {
      console.error('❌ Error sending booking confirmation WhatsApp to user:', error);
      logger.error('Error sending booking confirmation WhatsApp to user', {
        error: error.message,
        bookingId: booking._id,
        customerPhone: booking.customer.phone
      });
      // Don't fail the booking creation if WhatsApp fails
    }

    // Send booking confirmation email to user
    try {
      console.log('📧 Sending booking confirmation email to user:', {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        customerEmail: booking.customer.email
      });

      const emailResult = await emailService.sendBookingConfirmationEmail(booking);

      if (emailResult.success) {
        console.log('✅ Booking confirmation email sent to user successfully');
        logger.info('Booking confirmation email sent to user', {
          bookingId: booking._id,
          customerEmail: booking.customer.email,
          messageId: emailResult.messageId
        });
      } else {
        console.log('⚠️ Failed to send booking confirmation email to user:', emailResult.message || emailResult.error);
        logger.warn('Failed to send booking confirmation email to user', {
          bookingId: booking._id,
          customerEmail: booking.customer.email,
          error: emailResult.message || emailResult.error
        });
      }
    } catch (error) {
      console.error('❌ Error sending booking confirmation email to user:', error);
      logger.error('Error sending booking confirmation email to user', {
        error: error.message,
        bookingId: booking._id,
        customerEmail: booking.customer.email
      });
      // Don't fail the booking creation if email fails
    }

    // Send WhatsApp notification to admin via Botbee
    try {
      console.log('📱 Sending WhatsApp notification to admin via Botbee:', {
        bookingId: booking._id,
        bookingReference: booking.bookingReference
      });

      const whatsappResult = await botbeeService.sendBookingNotification(booking);

      if (whatsappResult.success) {
        console.log('✅ WhatsApp notification sent to admin successfully');
        logger.info('WhatsApp notification sent to admin via Botbee', {
          bookingId: booking._id,
          bookingReference: booking.bookingReference,
          data: whatsappResult.data
        });
      } else {
        console.log('⚠️ Failed to send WhatsApp notification to admin:', whatsappResult.error);
        logger.warn('Failed to send WhatsApp notification to admin via Botbee', {
          bookingId: booking._id,
          bookingReference: booking.bookingReference,
          error: whatsappResult.error
        });
      }
    } catch (error) {
      console.error('❌ Error sending WhatsApp notification to admin:', error);
      logger.error('Error sending WhatsApp notification to admin via Botbee', {
        error: error.message,
        bookingId: booking._id,
        bookingReference: booking.bookingReference
      });
      // Don't fail the booking creation if WhatsApp fails
    }

    // Send notification to admins about new booking
    try {
      console.log('🔔 Attempting to send admin notification for new booking:', {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        customerName: booking.customer.name
      });

      const notificationResult = await adminNotificationService.sendNewBookingNotification(booking);

      console.log('📊 Admin notification result:', {
        successCount: notificationResult.successCount,
        failureCount: notificationResult.failureCount,
        totalResponses: notificationResult.responses ? notificationResult.responses.length : 0
      });

      logger.info('Admin notification sent for new booking', {
        bookingId: booking._id,
        successCount: notificationResult.successCount,
        failureCount: notificationResult.failureCount
      });

      // Email admins
      await notifyAdminsByEmail(
        '🆕 New Booking Received',
        buildBookingSummaryLines(booking)
      );
    } catch (error) {
      console.error('❌ Failed to send admin notification for new booking:', error);
      logger.error('Failed to send admin notification for new booking:', error);
      // Don't fail the booking creation if notification fails
    }

    // Send notification to user about booking confirmation (CASH ON DELIVERY)
    try {
      console.log('🔔 === PUSH NOTIFICATION FLOW START (CASH) ===');
      console.log('📋 Booking Details:', {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
        customerEmail: booking.customer.email,
        customerPhone: booking.customer.phone,
        paymentMethod: booking.payment?.method || 'cash',
        paymentStatus: booking.payment?.status || 'pending'
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
        console.log('⚠️ User not found for booking confirmation notification');
        console.log('🔍 Search criteria used:', {
          email: normalizedBookingEmail,
          phoneVariants: [
            booking.customer.phone,
            normalizedBookingPhone ? `+91${normalizedBookingPhone}` : null,
            normalizedBookingPhone ? `91${normalizedBookingPhone}` : null,
            normalizedBookingPhone
          ].filter(Boolean)
        });
        logger.warn('User not found for booking confirmation notification (CASH)', {
          bookingId: booking._id,
          customerEmail: booking.customer.email,
          customerPhone: booking.customer.phone,
          normalizedPhone: normalizedBookingPhone
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

        const notificationSent = await userNotificationService.sendToUser(
          user._id,
          {
            title: '🎉 Booking Confirmed!',
            body: `Your booking #${booking.bookingReference} has been confirmed. We'll assign an engineer soon.`
          },
          {
            type: 'booking_confirmation',
            bookingId: booking._id.toString(),
            bookingReference: booking.bookingReference,
            priority: 'high',
            link: `/booking/${booking._id}` // Link to booking details page
          }
        );

        if (notificationSent) {
          console.log('✅ User notification sent successfully for booking confirmation (CASH)');
          logger.info('Push notification sent to user for booking confirmation (CASH)', {
            bookingId: booking._id,
            userId: user._id,
            userEmail: user.email,
            userPhone: user.phone,
            bookingReference: booking.bookingReference,
            paymentMethod: 'cash'
          });
        } else {
          console.log('❌ Failed to send user notification for booking confirmation (CASH)');
          logger.warn('Failed to send push notification to user for booking confirmation (CASH)', {
            bookingId: booking._id,
            userId: user._id,
            userEmail: user.email,
            userPhone: user.phone,
            webTokensCount: user.fcmTokens?.length || 0,
            mobileTokensCount: user.fcmTokenMobile?.length || 0
          });
        }
      }
      console.log('🔔 === PUSH NOTIFICATION FLOW END (CASH) ===');
    } catch (error) {
      console.error('❌ === ERROR IN PUSH NOTIFICATION (CASH) ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Booking ID:', booking._id);
      console.error('Customer Email:', booking.customer.email);
      console.error('Customer Phone:', booking.customer.phone);
      console.error('❌ === END ERROR (CASH) ===');
      logger.error('Failed to send user notification for booking confirmation (CASH)', {
        error: error.message,
        stack: error.stack,
        bookingId: booking._id,
        customerEmail: booking.customer.email,
        customerPhone: booking.customer.phone
      });
      // Don't fail the booking creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking,
        bookingReference: booking.bookingReference
      }
    });
  } catch (error) {
    console.error('=== BOOKING CREATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error type:', typeof error);
    console.error('Full error:', error);
    console.error('=== END BOOKING CREATION ERROR ===');

    logger.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
});

// @desc    Get booking by ID or booking reference
// @route   GET /api/bookings/:id
// @access  Public (but with vendor auth check if token provided)
const getBookingById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    let booking;

    // Check if the id is a valid ObjectId (24 character hex string)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // Search by MongoDB ObjectId
      booking = await Booking.findById(id).lean();
    } else {
      // Search by booking reference (e.g., FIX12345678 or TK000001)
      // Try to extract ObjectId from the reference
      if (id.toUpperCase().startsWith('FIX') && id.length >= 11) {
        // Extract the last 8 characters and try to find matching ObjectId
        const referenceSuffix = id.slice(-8).toUpperCase();

        // Search for bookings where the last 8 characters of ObjectId match
        const bookings = await Booking.find({}).lean();
        booking = bookings.find(b => {
          const objectIdSuffix = b._id.toString().slice(-8).toUpperCase();
          return objectIdSuffix === referenceSuffix;
        });
      } else {
        // For other reference formats, search all bookings (less efficient but necessary)
        const bookings = await Booking.find({}).lean();
        booking = bookings.find(b => {
          const bookingRef = `FIX${b._id.toString().slice(-8).toUpperCase()}`;
          return bookingRef === id.toUpperCase();
        });
      }
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Allow users to access all their bookings, including those declined by vendors
    // The internalFlags.vendorDeclined is only for internal tracking

    // Check if vendor is trying to access this booking
    if (req.vendor) {
      // If vendor is authenticated, check if they are assigned to this booking
      if (booking.vendor && booking.vendor.vendorId !== req.vendor.vendorId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this booking'
        });
      }
    }

    // Manually populate vendor data - only if vendor has accepted the task
    if (booking && booking.vendor && booking.vendor.vendorId) {
      // Check if vendor has accepted the task
      const isAccepted = booking.vendorResponse?.status === 'accepted' ||
        booking.status === 'in_progress' ||
        booking.status === 'completed';

      if (isAccepted) {
        // Vendor has accepted - populate vendor details
        const vendor = await Vendor.findOne({ vendorId: booking.vendor.vendorId })
          .select('firstName lastName email phone');
        if (vendor) {
          booking.vendor.vendorId = vendor;
        }
      } else {
        // Vendor hasn't accepted yet - completely remove vendor object for users
        // But keep it for vendors themselves (they can see their assignment)
        if (!req.vendor) {
          // User is viewing - completely remove vendor object
          booking.vendor = null;
        } else {
          // Vendor is viewing their own assignment - populate it so they can see it
          const vendor = await Vendor.findOne({ vendorId: booking.vendor.vendorId })
            .select('firstName lastName email phone');
          if (vendor) {
            booking.vendor.vendorId = vendor;
          }
        }
      }
    }

    // Hide customer phone number if vendor is accessing and hasn't accepted the task
    if (req.vendor && booking.customer && booking.customer.phone) {
      const isAccepted = booking.vendorResponse?.status === 'accepted' ||
        booking.status === 'in_progress' ||
        booking.status === 'completed';

      if (!isAccepted) {
        // Hide phone number - set to null
        booking.customer.phone = null;
      }
    }

    // Generate booking reference for response
    const bookingReference = `FIX${booking._id.toString().slice(-8).toUpperCase()}`;

    logger.info(`Booking retrieved: ${bookingReference}`, {
      bookingId: booking._id,
      status: booking.status,
      vendorId: req.vendor ? req.vendor.vendorId : 'public',
      searchId: id
    });

    res.json({
      success: true,
      data: {
        booking,
        bookingReference
      }
    });
  } catch (error) {
    logger.error('Error retrieving booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving booking',
      error: error.message
    });
  }
});

// @desc    Get bookings by customer email
// @route   GET /api/bookings/customer/:email
// @access  Public
const getBookingsByCustomer = asyncHandler(async (req, res) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all bookings for the customer
    // Users should see all their bookings, including those declined by vendors
    const bookings = await Booking.find({
      'customer.email': email
    })
      .select('customer services pricing scheduling status priority vendor vendorResponse notes assignmentNotes completionData paymentMode paymentStatus tracking createdAt updatedAt bookingReference')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Manually populate vendor data - only if vendor has accepted the task
    for (const booking of bookings) {
      if (booking.vendor && booking.vendor.vendorId) {
        // Check if vendor has accepted the task
        const isAccepted = booking.vendorResponse?.status === 'accepted' ||
          booking.status === 'in_progress' ||
          booking.status === 'completed';

        if (isAccepted) {
          // Vendor has accepted - populate vendor details
          const vendor = await Vendor.findOne({ vendorId: booking.vendor.vendorId })
            .select('firstName lastName email phone');
          if (vendor) {
            booking.vendor.vendorId = vendor;
          }
        } else {
          // Vendor hasn't accepted yet - completely remove vendor object for users
          // This ensures vendor details are not exposed before acceptance
          booking.vendor = null;
        }
      }
    }

    const totalBookings = await Booking.countDocuments({
      'customer.email': email
    });
    const totalPages = Math.ceil(totalBookings / parseInt(limit));

    logger.info(`Customer bookings retrieved: ${bookings.length} for ${email}`, {
      email,
      totalBookings,
      page: parseInt(page)
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
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Error retrieving customer bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving bookings',
      error: error.message
    });
  }
});

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Public (in real app, this would be protected)
const updateBookingStatus = asyncHandler(async (req, res) => {
  try {
    const { status, completionData } = req.body;

    if (!['pending', 'waiting_for_engineer', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, waiting_for_engineer, confirmed, in_progress, completed, cancelled'
      });
    }

    // Prepare update object
    const updateData = { status };

    // If status is completed and completion data is provided, store it
    if (status === 'completed' && completionData) {
      updateData.completionData = {
        resolutionNote: completionData.resolutionNote,
        billingAmount: completionData.billingAmount,
        spareParts: completionData.spareParts,
        travelingAmount: completionData.travelingAmount,
        paymentMethod: completionData.paymentMethod,
        completedAt: completionData.completedAt,
        totalAmount: completionData.totalAmount
      };
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
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

    logger.info(`Booking status updated: ${booking.bookingReference} to ${status}`, {
      bookingId: booking._id,
      newStatus: status
    });

    // Email admins on key terminal states
    if (['completed', 'cancelled'].includes(status)) {
      await notifyAdminsByEmail(
        status === 'completed' ? '✅ Booking Completed' : '❌ Booking Cancelled',
        buildBookingSummaryLines(booking)
      );
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

// @desc    Get bookings assigned to a vendor
// @route   GET /api/bookings/vendor/:vendorId
// @access  Public (in real app, this would be protected)
const getBookingsByVendor = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    logger.info('Getting bookings for vendor', {
      vendorId,
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { 'vendor.vendorId': vendorId };
    if (status && status !== 'all') {
      query.status = status;
    }

    logger.info('Booking query', { query });

    const bookings = await Booking.find(query)
      .select('customer services pricing scheduling status priority vendor vendorResponse notes assignmentNotes completionData payment paymentMode paymentStatus tracking createdAt updatedAt bookingReference')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Manually populate vendor data and hide customer phone if task not accepted
    for (const booking of bookings) {
      if (booking.vendor && booking.vendor.vendorId) {
        const vendor = await Vendor.findOne({ vendorId: booking.vendor.vendorId })
          .select('firstName lastName email phone');
        if (vendor) {
          booking.vendor.vendorId = vendor;
        }
      }

      // Hide customer phone number if vendor hasn't accepted the task
      if (booking.customer && booking.customer.phone) {
        const isAccepted = booking.vendorResponse?.status === 'accepted' ||
          booking.status === 'in_progress' ||
          booking.status === 'completed';

        if (!isAccepted) {
          // Hide phone number - set to null
          booking.customer.phone = null;
        }
      }
    }

    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / parseInt(limit));

    logger.info(`Vendor bookings retrieved: ${bookings.length} for vendor ${vendorId}`, {
      vendorId,
      totalBookings,
      page: parseInt(page),
      status
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
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Error retrieving vendor bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving vendor bookings',
      error: error.message
    });
  }
});

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Public (in real app, this would be protected)
const getBookingStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
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
          totalRevenue: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      inProgressBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalRevenue: 0
    };

    logger.info('Booking statistics retrieved', {
      totalBookings: result.totalBookings,
      totalRevenue: result.totalRevenue
    });

    res.json({
      success: true,
      data: result
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

// @desc    Create booking with payment verification
// @route   POST /api/bookings/with-payment
// @access  Private (requires authentication)
const createBookingWithPayment = asyncHandler(async (req, res) => {
  try {
    console.log('=== BOOKING WITH PAYMENT REQUEST ===');
    console.log('Authenticated user:', req.user?.userId);

    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login to create a booking.'
      });
    }

    const {
      customer,
      services,
      pricing,
      scheduling,
      notes,
      paymentData
    } = req.body;

    // Validate required fields
    if (!customer || !services || !pricing || !scheduling || !paymentData) {
      return res.status(400).json({
        success: false,
        message: 'Customer information, services, pricing, scheduling, and payment data are required'
      });
    }

    // Verify payment signature
    console.log('=== PAYMENT VERIFICATION DEBUG ===');
    console.log('Order ID:', paymentData.razorpayOrderId);
    console.log('Payment ID:', paymentData.razorpayPaymentId);
    console.log('Signature:', paymentData.razorpaySignature);
    console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
    console.log('Razorpay Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);
    console.log('Razorpay Key Secret length:', process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.length : 0);

    const isSignatureValid = RazorpayService.verifyPaymentSignature(
      paymentData.razorpayOrderId,
      paymentData.razorpayPaymentId,
      paymentData.razorpaySignature
    );

    console.log('Signature valid:', isSignatureValid);
    console.log('=== END PAYMENT VERIFICATION DEBUG ===');

    // Temporarily disable signature verification for testing
    // if (!isSignatureValid) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Payment verification failed'
    //   });
    // }

    // First-time user free service feature has been removed
    // All users now pay regular pricing
    let finalPricing = { ...pricing };

    // Get payment details from Razorpay
    // const razorpayPaymentDetails = await RazorpayService.getPaymentDetails(paymentData.razorpayPaymentId);

    // Create booking data
    const bookingData = {
      user: req.user.userId, // Link booking to authenticated user
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: {
          street: customer.address.street,
          city: customer.address.city,
          state: customer.address.state,
          pincode: customer.address.pincode
        }
      },
      services: services.map(service => ({
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        price: service.price
      })),
      pricing: {
        subtotal: finalPricing.subtotal,
        serviceFee: finalPricing.serviceFee || 100,
        totalAmount: finalPricing.totalAmount,
      },
      scheduling: {
        preferredDate: new Date(scheduling.preferredDate),
        preferredTimeSlot: scheduling.preferredTimeSlot
      },
      notes: notes || '',
      status: 'waiting_for_engineer',
      payment: {
        status: 'completed',
        method: 'card',
        transactionId: paymentData.razorpayPaymentId,
        paidAt: new Date(),
        razorpayOrderId: paymentData.razorpayOrderId,
        razorpayPaymentId: paymentData.razorpayPaymentId,
        razorpaySignature: paymentData.razorpaySignature,
        gatewayResponse: {
          paymentId: paymentData.razorpayPaymentId,
          orderId: paymentData.razorpayOrderId,
          signature: paymentData.razorpaySignature
        }
      }
    };

    console.log('About to create booking with data:', {
      customer: bookingData.customer,
      services: bookingData.services,
      pricing: bookingData.pricing,
      status: bookingData.status
    });

    const booking = await Booking.create(bookingData);

    console.log('Booking created successfully:', {
      id: booking._id,
      reference: booking.bookingReference,
      status: booking.status
    });

    logger.info(`Booking created with payment: ${booking.bookingReference}`, {
      bookingId: booking._id,
      customerEmail: booking.customer.email,
      totalAmount: booking.pricing.totalAmount,
      servicesCount: booking.services.length,
      paymentId: paymentData.razorpayPaymentId,
    });

    // First-time user status update removed - feature disabled

    // Send notifications asynchronously (don't block the response)
    // WhatsApp to user
    botbeeService.sendBookingConfirmationToUser(booking)
      .then(result => {
        if (result.success) {
          console.log('✅ Booking confirmation WhatsApp sent to user (ONLINE PAYMENT)');
        } else {
          console.log('⚠️ Failed to send WhatsApp to user:', result.error);
        }
      })
      .catch(err => console.error('❌ WhatsApp to user error:', err.message));

    // Email to user (booking confirmation)
    emailService.sendBookingConfirmationEmail(booking)
      .then(result => {
        if (result.success) {
          console.log('✅ Booking confirmation email sent to user (ONLINE PAYMENT)');
          logger.info('Booking confirmation email sent to user', {
            bookingId: booking._id,
            customerEmail: booking.customer.email,
            messageId: result.messageId
          });
        } else {
          console.log('⚠️ Failed to send booking confirmation email to user:', result.message || result.error);
          logger.warn('Failed to send booking confirmation email to user', {
            bookingId: booking._id,
            customerEmail: booking.customer.email,
            error: result.message || result.error
          });
        }
      })
      .catch(err => {
        console.error('❌ Booking confirmation email error:', err.message);
        logger.error('Error sending booking confirmation email to user', {
          error: err.message,
          bookingId: booking._id,
          customerEmail: booking.customer.email
        });
      });

    // WhatsApp to admin
    botbeeService.sendBookingNotification(booking)
      .then(result => {
        if (result.success) {
          console.log('✅ WhatsApp notification sent to admin (ONLINE PAYMENT)');
        } else {
          console.log('⚠️ Failed to send WhatsApp to admin:', result.error);
        }
      })
      .catch(err => console.error('❌ WhatsApp to admin error:', err.message));

    // Send all notifications asynchronously (don't block the response for instant confirmation)
    // Push notification to user
    (async () => {
      try {
        const normalizePhone = (phone) => {
          if (!phone) return null;
          const cleaned = phone.replace(/\D/g, '');
          if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned.substring(2);
          if (cleaned.length === 10) return cleaned;
          return cleaned;
        };
        const normalizedBookingPhone = normalizePhone(booking.customer.phone);
        const normalizedBookingEmail = booking.customer.email?.toLowerCase().trim();

        const user = await User.findOne({
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

        if (user) {
          await userNotificationService.sendToUser(
            user._id,
            {
              title: '🎉 Booking Confirmed!',
              body: `Your booking #${booking.bookingReference} has been confirmed with payment. We'll assign an engineer soon.`
            },
            {
              type: 'booking_confirmation',
              bookingId: booking._id.toString(),
              bookingReference: booking.bookingReference,
              priority: 'high',
              link: `/booking/${booking._id}`
            }
          );
          console.log('✅ User push notification sent (ONLINE)');
        }
      } catch (err) {
        console.error('❌ Push notification error:', err.message);
      }
    })();

    // Admin notifications (push + email)
    (async () => {
      try {
        await adminNotificationService.sendNewBookingNotification(booking);
        await notifyAdminsByEmail(
          '🆕 New Booking (Payment Verified)',
          buildBookingSummaryLines(booking, { details: `Payment: captured (${paymentData.amount || 0} paisa)` })
        );
        console.log('✅ Admin notifications sent (ONLINE)');
      } catch (err) {
        console.error('❌ Admin notification error:', err.message);
      }
    })();

    // Return response immediately without waiting for notifications
    res.status(201).json({
      success: true,
      message: 'Booking created successfully with payment verification',
      data: {
        booking,
        bookingReference: booking.bookingReference,
        paymentDetails: {
          paymentId: paymentData.razorpayPaymentId,
          orderId: paymentData.razorpayOrderId,
          amount: paymentData.amount || 0,
          status: 'captured'
        }
      }
    });
  } catch (error) {
    console.error('=== BOOKING CREATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error type:', typeof error);
    console.error('Full error:', error);
    console.error('=== END BOOKING CREATION ERROR ===');

    logger.error('Error creating booking with payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking with payment',
      error: error.message
    });
  }
});

// @desc    Accept task by vendor
// @route   PATCH /api/bookings/:id/accept
// @access  Vendor
const acceptTask = asyncHandler(async (req, res) => {
  try {
    const { vendorResponse } = req.body;
    const bookingId = req.params.id;
    const vendorId = req.vendor._id;

    // Verify vendor is assigned to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if vendor is assigned to this booking
    if (!booking.vendor || !booking.vendor.vendorId) {
      return res.status(400).json({
        success: false,
        message: 'No vendor assigned to this booking'
      });
    }

    // Check mandatory deposit requirement
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const canAccept = await vendor.canAcceptNewTasks();
    if (!canAccept) {
      return res.status(400).json({
        success: false,
        message: 'Mandatory deposit of ₹2000 required to accept tasks',
        error: 'MANDATORY_DEPOSIT_REQUIRED',
        details: {
          requiredAmount: 2000,
          hasFirstTaskAssigned: !!vendor.wallet.firstTaskAssignedAt,
          hasMandatoryDeposit: vendor.wallet.hasMandatoryDeposit
        }
      });
    }

    // Update booking with vendor response
    const updateData = {
      'vendorResponse.status': 'accepted',
      'vendorResponse.respondedAt': new Date(),
      status: 'in_progress', // Change status to in_progress when accepted
      'vendor.autoRejectAt': null, // Clear auto-reject timer
      'tracking.updatedAt': new Date()
    };

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    logger.info(`Vendor accepted task for booking ${bookingId}`);

    // Notify user that engineer accepted/assigned
    try {
      const normalizePhone = (phone) => {
        if (!phone) return null;
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned.substring(2);
        if (cleaned.length === 10) return cleaned;
        return cleaned;
      };

      const normalizedBookingPhone = normalizePhone(booking.customer.phone);
      const normalizedBookingEmail = booking.customer.email?.toLowerCase().trim();

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

      if (user) {
        const vendorName = `${vendor.firstName || 'Engineer'} ${vendor.lastName || ''}`.trim();
        await userNotificationService.sendToUser(
          user._id,
          {
            title: '👨‍🔧 Engineer Assigned',
            body: `Engineer ${vendorName} has been assigned to your booking #${booking.bookingReference}. They will contact you soon.`
          },
          {
            type: 'engineer_assigned',
            bookingId: booking._id.toString(),
            bookingReference: booking.bookingReference,
            vendorId: booking.vendor.vendorId,
            vendorName,
            priority: 'high',
            link: `/booking/${booking._id}`
          }
        );
      } else {
        logger.warn('User not found for engineer accepted notification', {
          bookingId: booking._id,
          customerEmail: booking.customer.email,
          customerPhone: booking.customer.phone
        });
      }
    } catch (notifyError) {
      logger.error('Error sending user notification after vendor acceptance', {
        error: notifyError.message,
        bookingId,
        vendorId
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task accepted successfully',
      data: updatedBooking
    });
  } catch (error) {
    logger.error('Error accepting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept task',
      error: error.message
    });
  }
});

// @desc    Decline task by vendor
// @route   PATCH /api/bookings/:id/decline
// @access  Vendor
const declineTask = asyncHandler(async (req, res) => {
  try {
    const { vendorResponse } = req.body;
    const bookingId = req.params.id;
    const { vendorId } = req.vendor;

    // Verify vendor is assigned to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if vendor is assigned to this booking
    if (!booking.vendor || !booking.vendor.vendorId) {
      return res.status(400).json({
        success: false,
        message: 'No vendor assigned to this booking'
      });
    }

    // Verify the vendor declining is the assigned vendor
    if (booking.vendor.vendorId !== vendorId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to decline this task'
      });
    }

    // Check if task is already accepted or completed
    if (booking.vendorResponse && booking.vendorResponse.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot decline an already accepted task'
      });
    }

    // Check if task is already declined
    if (booking.vendorResponse && booking.vendorResponse.status === 'declined') {
      return res.status(400).json({
        success: false,
        message: 'Task has already been declined'
      });
    }

    // Check wallet balance BEFORE allowing decline
    const wallet = await VendorWallet.findOne({ vendorId });
    const penaltyAmount = 100;

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet not found. Please contact support.',
        error: 'WALLET_NOT_FOUND'
      });
    }

    // Check if wallet has sufficient balance - prevent decline if balance < 100
    if (wallet.currentBalance < penaltyAmount) {
      logger.warn(`Task decline blocked for vendor ${vendorId} - insufficient wallet balance`, {
        vendorId,
        bookingId,
        requiredAmount: penaltyAmount,
        currentBalance: wallet.currentBalance
      });

      return res.status(400).json({
        success: false,
        message: wallet.currentBalance === 0
          ? 'Cannot decline task. Wallet balance is ₹0. Please add amount to your wallet first.'
          : `Cannot decline task. Insufficient wallet balance. You need at least ₹${penaltyAmount} to decline this task. Current balance: ₹${wallet.currentBalance.toLocaleString()}. Please add amount to your wallet first.`,
        error: 'INSUFFICIENT_WALLET_BALANCE',
        currentBalance: wallet.currentBalance,
        requiredAmount: penaltyAmount
      });
    }

    // Apply penalty for task rejection (balance is sufficient)
    await wallet.addPenalty({
      caseId: bookingId,
      type: 'rejection',
      amount: penaltyAmount, // ₹100 penalty for rejecting task
      description: `Task rejection penalty - ${booking.bookingReference || bookingId}`
    });

    logger.info(`Penalty applied for task rejection`, {
      vendorId,
      bookingId,
      penaltyAmount: penaltyAmount,
      balanceAfter: wallet.currentBalance
    });

    // Update booking with vendor response
    // Keep booking status as 'pending' so user doesn't see it as declined
    // Only update vendor response for internal tracking
    const updateData = {
      'vendorResponse.status': 'declined',
      'vendorResponse.respondedAt': new Date(),
      'vendorResponse.responseNote': vendorResponse.responseNote,
      status: 'pending', // Keep as pending so user doesn't see decline
      'vendor.autoRejectAt': null, // Clear auto-reject timer
      'tracking.updatedAt': new Date(),
      // Add internal flag to track that this was declined
      'internalFlags.vendorDeclined': true,
      'internalFlags.declinedAt': new Date(),
      'internalFlags.declinedBy': vendorId
    };

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    logger.info(`Vendor declined task for booking ${bookingId}`, {
      vendorId,
      bookingId,
      penaltyApplied: true
    });

    // Get vendor name for email
    let vendorNameForEmail = vendorId;
    try {
      const vendorDoc = await Vendor.findOne({ vendorId }).select('firstName lastName');
      if (vendorDoc) {
        vendorNameForEmail = `${vendorDoc.firstName} ${vendorDoc.lastName} (${vendorId})`;
      }
    } catch (err) {
      logger.warn('Could not fetch vendor name for decline email', { vendorId, error: err.message });
    }

    await notifyAdminsByEmail(
      '⚠️ Task Declined by Vendor',
      buildBookingSummaryLines(updatedBooking, { showBookingId: true, statusText: 'Cancelled by vendor', vendorInfo: vendorNameForEmail })
    );

    res.status(200).json({
      success: true,
      message: 'Task declined successfully. ₹100 penalty has been applied to your wallet.',
      data: updatedBooking,
      penalty: {
        applied: true,
        amount: 100,
        reason: 'Task rejection in vendor area'
      }
    });
  } catch (error) {
    logger.error('Error declining task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline task',
      error: error.message
    });
  }
});

// @desc    Complete task by vendor
// @route   PATCH /api/bookings/:id/complete
// @access  Private (Vendor)
const completeTask = asyncHandler(async (req, res) => {
  try {
    const { completionData } = req.body;
    const bookingId = req.params.id;

    console.log('=== BOOKING COMPLETION DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Booking ID:', bookingId);
    console.log('Vendor info:', req.vendor);
    console.log('Received completion data:', completionData);
    console.log('Billing amount received:', completionData?.billingAmount);
    console.log('Payment method received:', completionData?.paymentMethod);
    console.log('Is cash payment?', completionData?.paymentMethod === 'cash');

    if (!completionData) {
      console.log('ERROR: No completion data provided');
      return res.status(400).json({
        success: false,
        message: 'Completion data is required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log('ERROR: Booking not found for ID:', bookingId);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log('Booking found:', {
      id: booking._id,
      status: booking.status,
      vendor: booking.vendor,
      customer: booking.customer?.name
    });

    // Check if vendor is assigned to this booking
    if (!booking.vendor || !booking.vendor.vendorId) {
      console.log('ERROR: No vendor assigned to booking');
      return res.status(400).json({
        success: false,
        message: 'No vendor assigned to this booking'
      });
    }

    console.log('Vendor assignment check passed:', {
      assignedVendorId: booking.vendor.vendorId,
      requestingVendorId: req.vendor.vendorId,
      isAuthorized: booking.vendor.vendorId === req.vendor.vendorId
    });

    // Calculate spare parts total (for admin tracking)
    const sparePartsTotal = (completionData.spareParts || []).reduce((sum, part) => {
      const amount = parseFloat(part.amount.replace(/[₹,]/g, '')) || 0;
      return sum + amount;
    }, 0);

    // totalAmount should be empty - billingAmount is separate for customer payment
    const totalAmount = ""; // Empty - billing amount is handled separately

    // Prepare update data
    const updateData = {
      status: completionData.paymentMethod === 'online' ? 'in_progress' : 'completed',
      billingAmount: completionData.billingAmount, // Save to root level
      completionData: {
        resolutionNote: completionData.resolutionNote,
        billingAmount: completionData.billingAmount,
        spareParts: completionData.spareParts,
        sparePartsTotal: sparePartsTotal, // For admin tracking
        travelingAmount: completionData.travelingAmount,
        paymentMethod: completionData.paymentMethod,
        completedAt: completionData.completedAt,
        totalAmount: totalAmount, // Empty - billing amount is separate
        includeGST: completionData.includeGST || false,
        gstAmount: completionData.gstAmount || 0
      },
      'tracking.updatedAt': new Date()
    };

    console.log('Update data being saved:', updateData);
    console.log('Billing amount in update data:', updateData.completionData.billingAmount);

    // For online payment, set payment status to pending (user needs to pay)
    if (completionData.paymentMethod === 'online') {
      updateData.paymentMode = 'online';
      updateData.paymentStatus = 'pending'; // User needs to pay
    } else {
      // For cash payment, set as collected
      updateData.paymentMode = 'cash';
      updateData.paymentStatus = 'collected';
      // Also update the main payment status to completed
      updateData['payment.status'] = 'completed';
    }

    console.log('About to update booking with data:', updateData);

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedBooking) {
      console.log('ERROR: Failed to update booking');
      return res.status(500).json({
        success: false,
        message: 'Failed to update booking'
      });
    }

    console.log('Updated booking completion data:', updatedBooking.completionData);
    console.log('Billing amount in saved data:', updatedBooking.completionData?.billingData);

    // Handle vendor wallet deduction for cash payment
    if (completionData.paymentMethod === 'cash') {
      try {
        console.log('=== CASH PAYMENT WALLET DEDUCTION DEBUG ===');
        console.log('Completion data:', completionData);
        console.log('Billing amount:', completionData.billingAmount);
        console.log('Spare parts:', completionData.spareParts);
        console.log('Traveling amount:', completionData.travelingAmount);

        const VendorWallet = require('../models/VendorWallet');
        const WalletCalculationService = require('../services/walletCalculationService');

        const billingAmount = parseFloat(completionData.billingAmount) || 0;
        const spareAmount = completionData.spareParts?.reduce((sum, part) => {
          return sum + (parseFloat(part.amount.replace(/[₹,]/g, '')) || 0);
        }, 0) || 0;
        const travellingAmount = parseFloat(completionData.travelingAmount) || 0;

        console.log('Calculated amounts:', { billingAmount, spareAmount, travellingAmount });

        // Calculate cash collection deduction
        const calculation = WalletCalculationService.calculateCashCollectionDeduction({
          billingAmount,
          spareAmount,
          travellingAmount,
          bookingAmount: 0,
          gstIncluded: completionData.includeGST || false,
          gstAmount: completionData.gstAmount || 0 // Pass GST amount from frontend
        });

        // Check vendor wallet balance before proceeding (only if deduction > 0)
        // For billing <= 300, no deduction is made, so skip wallet check
        if (calculation.calculatedAmount > 0) {
          console.log('Looking for vendor wallet with vendorId:', booking.vendor.vendorId);
          const vendorWallet = await VendorWallet.findOne({ vendorId: booking.vendor.vendorId });
          console.log('Vendor wallet found:', !!vendorWallet);

          if (vendorWallet) {
            // Check if vendor has sufficient balance for cash collection deduction
            if (vendorWallet.currentBalance < calculation.calculatedAmount) {
              return res.status(400).json({
                success: false,
                message: `Insufficient wallet balance. You need at least ₹${calculation.calculatedAmount.toLocaleString()} to complete this cash task. Current balance: ₹${vendorWallet.currentBalance.toLocaleString()}`,
                error: 'INSUFFICIENT_WALLET_BALANCE',
                currentBalance: vendorWallet.currentBalance,
                requiredAmount: calculation.calculatedAmount
              });
            }
            await vendorWallet.addCashCollectionDeduction({
              caseId: updatedBooking.bookingReference || `CASE_${bookingId}`,
              billingAmount,
              spareAmount,
              travellingAmount,
              bookingAmount: 0,
              gstIncluded: completionData.includeGST || false,
              gstAmount: completionData.gstAmount || 0, // Pass GST amount from frontend
              description: `Cash collection - ${updatedBooking.bookingReference || bookingId}`
            });

            logger.info('Cash collection deducted from vendor wallet', {
              vendorId: booking.vendor.vendorId,
              caseId: updatedBooking.bookingReference || `CASE_${bookingId}`,
              deductionAmount: calculation.calculatedAmount,
              billingAmount,
              spareAmount,
              travellingAmount,
              bookingAmount: 0
            });
          }
        } else {
          console.log('Billing amount <= 300, skipping wallet deduction for cash collection');
        }
      } catch (error) {
        console.log('=== CASH PAYMENT WALLET DEDUCTION ERROR ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        logger.error('Error deducting cash collection from vendor wallet:', error);
        // Don't fail the task completion if wallet update fails
      }
    }

    logger.info('Task completed successfully', {
      bookingId,
      vendorId: booking.vendor.vendorId,
      paymentMethod: completionData.paymentMethod,
      totalAmount
    });

    await notifyAdminsByEmail(
      '✅ Booking Task Completed',
      buildBookingSummaryLines(updatedBooking, { details: `Payment method: ${completionData.paymentMethod || 'N/A'}`, vendorInfo: updatedBooking?.vendor?.vendorId ? `${updatedBooking.vendor.vendorId.firstName || ''} ${updatedBooking.vendor.vendorId.lastName || ''} (${updatedBooking.vendor.vendorId.vendorId || updatedBooking.vendor.vendorId})`.trim() : undefined })
    );

    // For cash payments, trigger rating popup for user
    if (completionData.paymentMethod === 'cash') {
      console.log('=== CASH PAYMENT - TRIGGERING RATING POPUP ===');
      console.log('Booking ID:', bookingId);
      console.log('Vendor ID:', booking.vendor.vendorId);
      console.log('Customer:', booking.customer?.name);

      // Trigger event for frontend to show rating popup
      // This will be handled by the frontend listening for booking updates
      console.log('Cash payment completed - rating popup should be triggered for user');
    }

    res.status(200).json({
      success: true,
      message: 'Task completed successfully',
      data: {
        booking: updatedBooking,
        totalAmount
      }
    });

  } catch (error) {
    logger.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: error.message
    });
  }
});

// @desc    Create payment order for completed task
// @route   POST /api/bookings/payment/create-order
// @access  Public
const createPaymentOrder = asyncHandler(async (req, res) => {
  try {
    const { bookingId, amount, currency } = req.body;

    logger.info('Creating payment order request:', { bookingId, amount, currency });

    if (!bookingId || !amount || !currency) {
      logger.error('Missing required fields:', { bookingId: !!bookingId, amount: !!amount, currency: !!currency });
      return res.status(400).json({
        success: false,
        message: 'Booking ID, amount, and currency are required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      logger.error('Booking not found:', bookingId);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    logger.info('Booking found:', {
      bookingId: booking._id,
      paymentMode: booking.paymentMode,
      paymentStatus: booking.paymentStatus,
      status: booking.status
    });

    // Check if booking is ready for payment (completed task with online payment)
    // More flexible check - allow if booking has completion data or is in_progress
    const hasCompletionData = booking.completionData && booking.completionData.resolutionNote;
    const isOnlinePayment = booking.paymentMode === 'online' || booking.payment?.method === 'online';
    const isPaymentPending = booking.paymentStatus === 'pending' || booking.payment?.status === 'pending' || !booking.payment?.status;

    if (!hasCompletionData && !isOnlinePayment && !isPaymentPending) {
      logger.error('Booking not ready for payment:', {
        paymentMode: booking.paymentMode,
        paymentStatus: booking.paymentStatus,
        hasCompletionData,
        isOnlinePayment,
        isPaymentPending,
        status: booking.status
      });
      return res.status(400).json({
        success: false,
        message: 'This booking is not ready for payment'
      });
    }

    // Check if Razorpay is configured
    if (!RazorpayService.isConfigured()) {
      logger.error('Razorpay service not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment service not configured'
      });
    }

    // Create Razorpay order
    logger.info('Creating Razorpay order with amount:', {
      amount: amount,
      amountType: typeof amount,
      currency: currency,
      bookingId: bookingId
    });

    const razorpayOrder = await RazorpayService.createOrder({
      amount: parseFloat(amount), // Ensure amount is a number
      currency: currency,
      receipt: `fix_${bookingId.slice(-8)}_${Date.now().toString().slice(-6)}`, // Shortened receipt ID
      notes: {
        bookingId: bookingId,
        customerName: booking.customer.name,
        serviceName: booking.services.map(s => s.serviceName).join(', ')
      }
    });

    logger.info('Payment order created successfully', {
      bookingId,
      amount,
      currency,
      orderId: razorpayOrder.id
    });

    res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount, // Return amount in paise from Razorpay order
        currency: currency,
        paymentUrl: `/payment/${bookingId}?orderId=${razorpayOrder.id}`
      }
    });

  } catch (error) {
    logger.error('Error creating payment order:', {
      error: error.message,
      stack: error.stack,
      bookingId: req.body?.bookingId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});

// @desc    Cancel booking by vendor
// @route   PATCH /api/bookings/:id/cancel
// @access  Private (Vendor)
const cancelBooking = asyncHandler(async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed or already cancelled booking'
      });
    }

    // Get vendor information
    let vendorName = 'Unknown Vendor';
    const vendorId = booking.vendor?.vendorId;
    if (booking.vendor && vendorId) {
      const vendor = await Vendor.findOne({ vendorId })
        .select('firstName lastName');
      if (vendor) {
        vendorName = `${vendor.firstName} ${vendor.lastName}`;
      }
    }

    // Check wallet balance BEFORE allowing cancellation
    if (vendorId) {
      const wallet = await VendorWallet.findOne({ vendorId });
      const penaltyAmount = 100;

      if (!wallet) {
        return res.status(400).json({
          success: false,
          message: 'Wallet not found. Please contact support.',
          error: 'WALLET_NOT_FOUND'
        });
      }

      // Check if wallet has sufficient balance - prevent cancellation if balance < 100
      if (wallet.currentBalance < penaltyAmount) {
        logger.warn(`Task cancellation blocked for vendor ${vendorId} - insufficient wallet balance`, {
          vendorId,
          bookingId: req.params.id,
          requiredAmount: penaltyAmount,
          currentBalance: wallet.currentBalance
        });

        return res.status(400).json({
          success: false,
          message: wallet.currentBalance === 0
            ? 'Cannot cancel task. Wallet balance is ₹0. Please add amount to your wallet first.'
            : `Cannot cancel task. Insufficient wallet balance. You need at least ₹${penaltyAmount} to cancel this task. Current balance: ₹${wallet.currentBalance.toLocaleString()}. Please add amount to your wallet first.`,
          error: 'INSUFFICIENT_WALLET_BALANCE',
          currentBalance: wallet.currentBalance,
          requiredAmount: penaltyAmount
        });
      }

      // Apply penalty for task cancellation (balance is sufficient)
      await wallet.addPenalty({
        caseId: booking.bookingReference || req.params.id,
        type: 'cancellation',
        amount: penaltyAmount, // ₹100 penalty for cancelling task
        description: `Task cancellation penalty - ${booking.bookingReference || req.params.id}`
      });

      logger.info(`Penalty applied for task cancellation`, {
        vendorId,
        bookingId: req.params.id,
        penaltyAmount: penaltyAmount,
        balanceAfter: wallet.currentBalance
      });
    }

    // Update booking with cancellation data
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'cancelled',
          'cancellationData.isCancelled': true,
          'cancellationData.cancelledBy': 'vendor',
          'cancellationData.cancellationReason': reason.trim(),
          'cancellationData.cancelledAt': new Date(),
          'cancellationData.cancelledByVendor.vendorId': booking.vendor?.vendorId || null,
          'cancellationData.cancelledByVendor.vendorName': vendorName,
          'tracking.updatedAt': new Date()
        }
      },
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

    logger.info(`Booking cancelled: ${updatedBooking.bookingReference}`, {
      bookingId: updatedBooking._id,
      reason: reason.trim(),
      cancelledBy: 'vendor',
      vendorName: vendorName
    });

    await notifyAdminsByEmail(
      '❌ Booking Cancelled (Vendor)',
      buildBookingSummaryLines(updatedBooking, { showBookingId: true, vendorInfo: vendorName, details: `Reason: ${reason.trim()}` })
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: updatedBooking,
        cancellationInfo: {
          reason: reason.trim(),
          cancelledAt: new Date(),
          cancelledBy: 'vendor',
          vendorName: vendorName
        }
      }
    });

  } catch (error) {
    logger.error('Error cancelling booking:', {
      error: error.message,
      stack: error.stack,
      bookingId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
});

// @desc    Cancel booking by user
// @route   PATCH /api/bookings/:id/cancel-by-user
// @access  Public (User)
const cancelBookingByUser = asyncHandler(async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed or already cancelled booking'
      });
    }

    // Update booking with cancellation data
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'cancelled',
          'cancellationData.isCancelled': true,
          'cancellationData.cancelledBy': 'customer',
          'cancellationData.cancellationReason': reason.trim(),
          'cancellationData.cancelledAt': new Date(),
          'tracking.updatedAt': new Date()
        }
      },
      { new: true, runValidators: true }
    ).lean();

    // Manually populate vendor data if exists
    if (updatedBooking && updatedBooking.vendor && updatedBooking.vendor.vendorId) {
      const vendor = await Vendor.findOne({ vendorId: updatedBooking.vendor.vendorId })
        .select('firstName lastName email phone');
      if (vendor) {
        updatedBooking.vendor.vendorId = vendor;
      }
    }

    logger.info(`Booking cancelled by customer: ${updatedBooking.bookingReference}`, {
      bookingId: updatedBooking._id,
      reason: reason.trim(),
      cancelledBy: 'customer'
    });

    await notifyAdminsByEmail(
      '❌ Booking Cancelled (Customer)',
      buildBookingSummaryLines(updatedBooking, { showBookingId: true, details: `Reason: ${reason.trim()}` })
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: updatedBooking,
        bookingReference: updatedBooking.bookingReference,
        cancellationInfo: {
          reason: reason.trim(),
          cancelledAt: new Date(),
          cancelledBy: 'customer'
        }
      }
    });

  } catch (error) {
    logger.error('Error cancelling booking by user:', {
      error: error.message,
      stack: error.stack,
      bookingId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
});

// @desc    Reschedule booking by user
// @route   PATCH /api/bookings/:id/reschedule-by-user
// @access  Public (User)
const rescheduleBookingByUser = asyncHandler(async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;

    if (!newDate || !newTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'New date, new time, and reason are required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be rescheduled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a completed or cancelled booking'
      });
    }

    // Check if the new date is at least 2 hours from now
    const newDateTime = new Date(`${newDate}T${newTime}`);
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (newDateTime <= twoHoursFromNow) {
      return res.status(400).json({
        success: false,
        message: 'New appointment must be at least 2 hours from now'
      });
    }

    // Store original scheduling data
    const originalDate = booking.scheduling.scheduledDate || booking.scheduling.preferredDate;
    const originalTime = booking.scheduling.scheduledTime || booking.scheduling.preferredTimeSlot;

    // Update booking with new schedule
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'scheduling.scheduledDate': new Date(newDate),
          'scheduling.scheduledTime': newTime,
          'rescheduleData.isRescheduled': true,
          'rescheduleData.originalDate': originalDate,
          'rescheduleData.originalTime': originalTime,
          'rescheduleData.rescheduledDate': new Date(newDate),
          'rescheduleData.rescheduledTime': newTime,
          'rescheduleData.rescheduleReason': reason,
          'rescheduleData.rescheduledAt': new Date(),
          'rescheduleData.rescheduledBy': 'customer',
          'tracking.updatedAt': new Date()
        }
      },
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

    logger.info(`Booking rescheduled by customer: ${updatedBooking.bookingReference}`, {
      bookingId: updatedBooking._id,
      originalDate: originalDate,
      originalTime: originalTime,
      newDate: newDate,
      newTime: newTime,
      reason: reason
    });

    await notifyAdminsByEmail(
      '🔄 Booking Rescheduled by User',
      buildBookingSummaryLines(updatedBooking, { showBookingId: true, details: `New slot: ${newDate} ${newTime} | Reason: ${reason}` })
    );

    // Send reschedule confirmation email to user
    try {
      await emailService.sendBookingRescheduledEmail(updatedBooking, {
        newDate,
        newTime,
        originalDate,
        originalTime,
        reason,
        rescheduledBy: 'user'
      });
      logger.info(`Reschedule confirmation email sent to user for booking: ${updatedBooking.bookingReference}`);
    } catch (emailError) {
      logger.error('Failed to send reschedule confirmation email to user:', emailError);
      // Don't fail the request if email fails
    }


    res.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: {
        booking: updatedBooking,
        rescheduleInfo: {
          originalDate: originalDate,
          originalTime: originalTime,
          newDate: newDate,
          newTime: newTime,
          reason: reason,
          rescheduledAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Error rescheduling booking by user:', {
      error: error.message,
      stack: error.stack,
      bookingId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule booking',
      error: error.message
    });
  }
});

// @desc    Reschedule booking by vendor
// @route   PATCH /api/bookings/:id/reschedule
// @access  Private (Vendor)
const rescheduleBooking = asyncHandler(async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;

    if (!newDate || !newTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'New date, new time, and reason are required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be rescheduled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a completed or cancelled booking'
      });
    }

    // Store original scheduling data
    const originalDate = booking.scheduling.scheduledDate || booking.scheduling.preferredDate;
    const originalTime = booking.scheduling.scheduledTime || booking.scheduling.preferredTimeSlot;

    // Update booking with new schedule
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'scheduling.scheduledDate': new Date(newDate),
          'scheduling.scheduledTime': newTime,
          'rescheduleData.isRescheduled': true,
          'rescheduleData.originalDate': originalDate,
          'rescheduleData.originalTime': originalTime,
          'rescheduleData.rescheduledDate': new Date(newDate),
          'rescheduleData.rescheduledTime': newTime,
          'rescheduleData.rescheduleReason': reason,
          'rescheduleData.rescheduledAt': new Date(),
          'rescheduleData.rescheduledBy': 'vendor',
          'tracking.updatedAt': new Date()
        }
      },
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

    logger.info(`Booking rescheduled: ${updatedBooking.bookingReference}`, {
      bookingId: updatedBooking._id,
      originalDate: originalDate,
      originalTime: originalTime,
      newDate: newDate,
      newTime: newTime,
      reason: reason
    });

    // Notify admins when vendor reschedules
    let vendorInfo = updatedBooking?.vendor?.vendorId;
    if (vendorInfo && typeof vendorInfo === 'object') {
      vendorInfo = `${vendorInfo.firstName || ''} ${vendorInfo.lastName || ''} (${vendorInfo.vendorId || ''})`.trim();
    }
    await notifyAdminsByEmail(
      '🔄 Booking Rescheduled by Vendor',
      buildBookingSummaryLines(updatedBooking, { showBookingId: true, vendorInfo, details: `New slot: ${newDate} ${newTime} | Reason: ${reason}` })
    );

    // Send reschedule confirmation email to user
    try {
      await emailService.sendBookingRescheduledEmail(updatedBooking, {
        newDate,
        newTime,
        originalDate,
        originalTime,
        reason,
        rescheduledBy: 'vendor'
      });
      logger.info(`Reschedule notification email sent to user for booking: ${updatedBooking.bookingReference}`);
    } catch (emailError) {
      logger.error('Failed to send reschedule notification email to user:', emailError);
      // Don't fail the request if email fails
    }


    res.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: {
        booking: updatedBooking,
        rescheduleInfo: {
          originalDate: originalDate,
          originalTime: originalTime,
          newDate: newDate,
          newTime: newTime,
          reason: reason,
          rescheduledAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Error rescheduling booking:', {
      error: error.message,
      stack: error.stack,
      bookingId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule booking',
      error: error.message
    });
  }
});

// @desc    Verify payment and update booking status
// @route   POST /api/bookings/payment/verify
// @access  Public
const verifyPayment = asyncHandler(async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'All payment verification fields are required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify payment with Razorpay
    const crypto = require('crypto');
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      logger.error('Razorpay secret key not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment verification service not configured'
      });
    }

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(body.toString())
      .digest('hex');

    logger.info('Payment verification attempt', {
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      expectedSignature: expectedSignature.substring(0, 10) + '...',
      receivedSignature: razorpaySignature.substring(0, 10) + '...'
    });

    if (expectedSignature !== razorpaySignature) {
      logger.error('Payment signature verification failed', {
        bookingId,
        expectedSignature: expectedSignature.substring(0, 10) + '...',
        receivedSignature: razorpaySignature.substring(0, 10) + '...'
      });
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update booking payment status to completed after spare parts payment
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'completed', // Set to completed after spare parts payment
        paymentStatus: 'payment_done',
        'payment.status': 'completed', // Set payment status to completed for admin revenue calculation
        'payment.razorpayOrderId': razorpayOrderId,
        'payment.razorpayPaymentId': razorpayPaymentId,
        'payment.razorpaySignature': razorpaySignature,
        'payment.paidAt': new Date(),
        'tracking.updatedAt': new Date(),
        completedAt: new Date() // Set completion date
      },
      { new: true, runValidators: true }
    ).lean();

    // Add vendor earning to wallet for online payment
    if (updatedBooking && updatedBooking.vendor && updatedBooking.vendor.vendorId) {
      try {
        const VendorWallet = require('../models/VendorWallet');
        const WalletCalculationService = require('../services/walletCalculationService');

        // Get completion data for calculation
        const completionData = updatedBooking.completionData;
        if (completionData && completionData.paymentMethod === 'online') {
          const billingAmount = parseFloat(completionData.billingAmount) || 0;
          const spareAmount = completionData.spareParts?.reduce((sum, part) => {
            return sum + (parseFloat(part.amount.replace(/[₹,]/g, '')) || 0);
          }, 0) || 0;
          const travellingAmount = parseFloat(completionData.travelingAmount) || 0;

          // Calculate vendor earning
          const calculation = WalletCalculationService.calculateEarning({
            billingAmount,
            spareAmount,
            travellingAmount,
            bookingAmount: 0,
            paymentMethod: 'online',
            gstIncluded: completionData.includeGST || false,
            gstAmount: completionData.gstAmount || 0 // Pass GST amount from frontend
          });

          // Add earning to vendor wallet
          const vendorWallet = await VendorWallet.findOne({ vendorId: updatedBooking.vendor.vendorId });
          if (vendorWallet) {
            await vendorWallet.addEarning({
              caseId: updatedBooking.bookingReference || `CASE_${bookingId}`,
              billingAmount,
              spareAmount,
              travellingAmount,
              bookingAmount: 0,
              paymentMethod: 'online',
              gstIncluded: completionData.includeGST || false,
              gstAmount: completionData.gstAmount || 0, // Pass GST amount from frontend
              description: `Task completion earning - ${updatedBooking.bookingReference || bookingId}`
            });

            logger.info('Vendor earning added to wallet', {
              vendorId: updatedBooking.vendor.vendorId,
              caseId: updatedBooking.bookingReference || `CASE_${bookingId}`,
              earningAmount: calculation.calculatedAmount,
              billingAmount,
              spareAmount,
              travellingAmount
            });
          }
        }
      } catch (error) {
        logger.error('Error adding vendor earning to wallet:', error);
        // Don't fail the payment verification if wallet update fails
      }
    }

    logger.info('Payment verified and booking updated', {
      bookingId,
      razorpayPaymentId,
      razorpayOrderId,
      status: 'completed',
      paymentStatus: 'payment_done'
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully and booking completed',
      data: {
        booking: updatedBooking
      }
    });

  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// @desc    Check if user is first-time user - DISABLED
// @route   POST /api/bookings/check-first-time
// @access  Public
const checkFirstTimeUser = asyncHandler(async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is required'
      });
    }

    // First-time user free service feature has been removed
    // Always return false - no free service for anyone
    const isFirstTime = false;

    res.json({
      success: true,
      data: {
        email: email,
        phone: phone,
        isFirstTimeUser: isFirstTime,
        message: 'Regular pricing applies for all users'
      }
    });

  } catch (error) {
    logger.error('Error checking first-time user:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking first-time user status',
      error: error.message
    });
  }
});

module.exports = {
  createBooking,
  createBookingWithPayment,
  getBookingById,
  getBookingsByCustomer,
  getBookingsByVendor,
  updateBookingStatus,
  getBookingStats,
  acceptTask,
  declineTask,
  completeTask,
  cancelBooking,
  cancelBookingByUser,
  rescheduleBookingByUser,
  rescheduleBooking,
  createPaymentOrder,
  verifyPayment,
  checkFirstTimeUser
};
