const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const VendorNotification = require('../models/VendorNotification');
const SupportTicket = require('../models/SupportTicket');
const Vendor = require('../models/Vendor');
const notificationService = require('../services/notificationService');
const firebasePushService = require('../services/firebasePushService');
const firebaseRealtimeService = require('../services/firebaseRealtimeService');
const notificationConnectionService = require('../services/notificationConnectionService');

// @desc    Get vendor notifications
// @route   GET /api/vendor/notifications
// @access  Private (Vendor)
const getVendorNotifications = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  // Build filter
  const filter = { vendorId };
  if (unreadOnly === 'true') {
    filter.isRead = false;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const notifications = await VendorNotification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalNotifications = await VendorNotification.countDocuments(filter);
  const unreadCount = await VendorNotification.countDocuments({ vendorId, isRead: false });

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalNotifications / parseInt(limit)),
        totalNotifications,
        unreadCount,
        hasNext: skip + notifications.length < totalNotifications,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/vendor/notifications/:id/read
// @access  Private (Vendor)
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.vendor._id;

  const notification = await VendorNotification.findOne({
    _id: id,
    vendorId
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: {
      notification: {
        id: notification._id,
        isRead: notification.isRead,
        readAt: notification.readAt
      }
    }
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/vendor/notifications/read-all
// @access  Private (Vendor)
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;

  const result = await VendorNotification.updateMany(
    { vendorId, isRead: false },
    {
      isRead: true,
      readAt: new Date()
    }
  );

  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: {
      updatedCount: result.modifiedCount
    }
  });
});

// @desc    Get vendor assigned support tickets
// @route   GET /api/vendor/support-tickets
// @access  Private (Vendor)
const getVendorSupportTickets = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const { page = 1, limit = 10, status, priority, search, sortBy = 'assignedAt', sortOrder = 'desc' } = req.query;

  // Build filter object
  const filter = { assignedTo: vendorId };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (priority && priority !== 'all') {
    filter.priority = priority;
  }

  // Build search filter
  if (search) {
    filter.$or = [
      { ticketId: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { userName: { $regex: search, $options: 'i' } },
      { userEmail: { $regex: search, $options: 'i' } },
      { caseId: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tickets = await SupportTicket.find(filter)
    .populate('userId', 'name email phone address')
    .populate('assignedTo', 'firstName lastName email')
    .select('-responses') // Exclude responses for list view
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const totalTickets = await SupportTicket.countDocuments(filter);

  const formattedTickets = tickets.map(ticket => ({
    id: ticket.ticketId,
    customerName: ticket.userName,
    customerEmail: ticket.userEmail,
    customerPhone: ticket.userPhone,
    address: ticket.userId?.address?.street || ticket.userId?.address || 'Not provided',
    pincode: ticket.userId?.address?.pincode || 'Not provided',
    subject: ticket.subject,
    category: ticket.type,
    status: ticket.status,
    priority: ticket.priority,
    vendorStatus: ticket.vendorStatus || 'Pending',
    created: ticket.formattedCreatedAt,
    lastUpdate: ticket.lastUpdate,
    responses: ticket.responseCount,
    caseId: ticket.caseId,
    description: ticket.description,
    scheduledDate: ticket.scheduledDate,
    scheduledTime: ticket.scheduledTime,
    scheduleNotes: ticket.scheduleNotes,
    assignedAt: ticket.assignedAt,
    assignedVendor: ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : null
  }));

  res.json({
    success: true,
    data: {
      tickets: formattedTickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTickets / parseInt(limit)),
        totalTickets,
        hasNext: skip + tickets.length < totalTickets,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

// @desc    Get vendor dashboard data with new tasks
// @route   GET /api/vendor/dashboard
// @access  Private (Vendor)
const getVendorDashboard = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;

  logger.info('Fetching vendor dashboard', {
    vendorId: vendorId.toString(),
    vendorInfo: {
      id: req.vendor._id,
      firstName: req.vendor.firstName,
      lastName: req.vendor.lastName,
      email: req.vendor.email
    }
  });

  try {
    // Get pending support tickets assigned to this vendor
    const pendingTickets = await SupportTicket.find({
      assignedTo: vendorId,
      vendorStatus: 'Pending'
    })
      .populate('userId', 'name email phone address')
      .select('ticketId subject type priority createdAt userName userEmail userPhone description assignedAt')
      .sort({ assignedAt: -1 })
      .limit(5);

    logger.info('Pending tickets found for vendor', {
      vendorId: vendorId.toString(),
      ticketCount: pendingTickets.length,
      tickets: pendingTickets.map(t => ({
        ticketId: t.ticketId,
        subject: t.subject,
        vendorStatus: t.vendorStatus,
        assignedTo: t.assignedTo?.toString()
      }))
    });

    // Get recent notifications
    const recentNotifications = await VendorNotification.find({
      vendorId,
      type: 'support_ticket_assignment'
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get unread notification count
    const unreadNotificationCount = await VendorNotification.countDocuments({
      vendorId,
      isRead: false
    });

    // Get vendor stats
    const vendor = await Vendor.findById(vendorId).select('stats rating');

    // Get total assigned tickets count
    const totalAssignedTickets = await SupportTicket.countDocuments({
      assignedTo: vendorId
    });

    // Get completed tickets count
    const completedTickets = await SupportTicket.countDocuments({
      assignedTo: vendorId,
      vendorStatus: 'Completed'
    });

    // Get pending tickets count
    const pendingTicketsCount = await SupportTicket.countDocuments({
      assignedTo: vendorId,
      vendorStatus: 'Pending'
    });

    // Get accepted tickets count
    const acceptedTicketsCount = await SupportTicket.countDocuments({
      assignedTo: vendorId,
      vendorStatus: 'Accepted'
    });

    const dashboardData = {
      newTasks: pendingTickets.map(ticket => ({
        id: ticket.ticketId,
        subject: ticket.subject,
        type: ticket.type,
        priority: ticket.priority,
        customerName: ticket.userName,
        customerEmail: ticket.userEmail,
        customerPhone: ticket.userPhone,
        description: ticket.description,
        createdAt: ticket.createdAt,
        assignedAt: ticket.assignedAt || ticket.createdAt
      })),
      recentNotifications: recentNotifications.map(notification => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        data: notification.data
      })),
      stats: {
        totalAssignedTickets,
        completedTickets,
        pendingTicketsCount,
        acceptedTicketsCount,
        unreadNotificationCount,
        vendorStats: vendor?.stats || {},
        rating: vendor?.rating || { average: 0, count: 0 }
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Error fetching vendor dashboard:', {
      error: error.message,
      stack: error.stack,
      vendorId: vendorId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      debug: process.env.NODE_ENV !== 'production' ? {
        vendorId,
        errorMessage: error.message,
        stack: error.stack
      } : undefined
    });
  }
});

// @desc    Create support ticket assignment notification
// @route   POST /api/vendor/notifications/create-support-assignment
// @access  Private (Admin) - This will be called from admin controller
const createSupportTicketAssignmentNotification = asyncHandler(async (vendorId, ticketData) => {
  try {
    // Use connection service to ensure MongoDB is ready
    await notificationConnectionService.ensureConnection();

    // Convert vendorId string to ObjectId by finding the vendor if needed
    let vendorObjectId = vendorId;
    if (typeof vendorId === 'string' && !vendorId.match(/^[0-9a-fA-F]{24}$/)) {
      // vendorId is a string like "967", need to find the vendor
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findOne({ vendorId: vendorId });
      if (!vendor) {
        throw new Error(`Vendor with ID ${vendorId} not found`);
      }
      vendorObjectId = vendor._id;

      logger.info('Converted string vendorId to ObjectId for support ticket notification', {
        originalVendorId: vendorId,
        vendorObjectId: vendorObjectId,
        vendorName: `${vendor.firstName} ${vendor.lastName}`,
        ticketId: ticketData.ticketId
      });
    }

    const notification = new VendorNotification({
      vendorId: vendorObjectId,
      type: 'support_ticket_assignment',
      title: 'New Support Ticket Assigned',
      message: `A new support ticket "${ticketData.subject}" has been assigned to you. Please review and take action.`,
      data: {
        ticketId: ticketData.ticketId,
        subject: ticketData.subject,
        type: ticketData.type,
        priority: ticketData.priority,
        customerName: ticketData.userName,
        customerEmail: ticketData.userEmail,
        customerPhone: ticketData.userPhone,
        description: ticketData.description,
        assignedAt: new Date()
      },
      priority: ticketData.priority === 'High' ? 'high' : ticketData.priority === 'Medium' ? 'medium' : 'low'
    });

    await notification.save();

    // Email/SMS notifications disabled - only push notifications
    logger.info('Email/SMS notifications disabled - using push notifications only', {
      vendorId,
      ticketId: ticketData.ticketId
    });

    // Send push notification
    try {
      logger.info('Attempting to send push notification for support ticket assignment', {
        vendorId,
        ticketId: ticketData.ticketId,
        vendorObjectId: vendorObjectId.toString()
      });

      const vendor = await Vendor.findById(vendorObjectId).select('+fcmTokenMobile notificationSettings firstName lastName email');

      // Use mobile/webview tokens only (web tokens removed)
      const uniqueTokens = [...(vendor?.fcmTokenMobile || [])];

      // Check if push notifications are enabled (default to true if not set)
      const pushNotificationsEnabled = vendor.notificationSettings?.pushNotifications !== false;

      logger.info('Vendor details for push notification', {
        vendorId,
        vendorFound: !!vendor,
        mobileTokens: vendor?.fcmTokenMobile?.length || 0,
        totalTokens: uniqueTokens.length,
        pushNotificationsEnabled: pushNotificationsEnabled,
        vendorName: vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Not found'
      });

      if (vendor && uniqueTokens.length > 0 && pushNotificationsEnabled) {
        const pushNotification = {
          title: '🛠️ Support Ticket Assigned',
          body: `A new support ticket "${ticketData.subject}" has been assigned to you. Please review and take action.`
        };

        const pushData = {
          type: 'support_ticket_assignment',
          ticketId: ticketData.ticketId,
          subject: ticketData.subject,
          priority: ticketData.priority,
          customerName: ticketData.userName,
          action: 'view_ticket'
        };

        logger.info('Sending push notification with data', {
          vendorId,
          ticketId: ticketData.ticketId,
          notificationTitle: pushNotification.title,
          notificationBody: pushNotification.body,
          totalTokens: uniqueTokens.length,
          mobileTokens: vendor.fcmTokenMobile?.length || 0
        });

        // Send push notification to all tokens using multicast
        const pushResult = await firebasePushService.sendMulticastPushNotification(
          uniqueTokens,
          pushNotification,
          pushData
        );
        pushNotificationSent = pushResult.successCount > 0;

        // Send realtime notification for in-app UI updates
        // Note: Realtime notifications don't trigger system trays in most web setups unless specifically coded
        const realtimeResult = await firebaseRealtimeService.sendRealtimeNotification(
          vendorId,
          {
            title: pushNotification.title,
            message: pushNotification.body,
            type: 'support_ticket_assignment',
            data: pushData
          }
        );

        logger.info('Notification results for support ticket assignment', {
          vendorId,
          ticketId: ticketData.ticketId,
          pushSuccess: pushNotificationSent,
          realtimeSuccess: realtimeResult
        });
      } else {
        const pushNotificationsEnabled = vendor?.notificationSettings?.pushNotifications !== false;
        logger.warn('Push notification skipped for support ticket assignment', {
          vendorId,
          ticketId: ticketData.ticketId,
          hasTokens: uniqueTokens.length > 0,
          mobileTokens: vendor?.fcmTokenMobile?.length || 0,
          pushEnabled: pushNotificationsEnabled,
          vendorExists: !!vendor,
          reason: !vendor ? 'Vendor not found' :
            uniqueTokens.length === 0 ? 'No FCM tokens' :
              'Push notifications disabled'
        });
      }
    } catch (pushError) {
      logger.error('Failed to send push notification for support ticket assignment', {
        error: pushError.message,
        stack: pushError.stack,
        vendorId,
        ticketId: ticketData.ticketId
      });
      // Don't fail the notification creation if push notification fails
    }

    logger.info('Support ticket assignment notification created', {
      vendorId,
      ticketId: ticketData.ticketId,
      notificationId: notification._id
    });

    return notification;
  } catch (error) {
    logger.error('Error creating support ticket assignment notification:', {
      error: error.message,
      vendorId,
      ticketId: ticketData.ticketId
    });
    throw error;
  }
});

// @desc    Create booking assignment notification
// @route   POST /api/vendor/notifications/create-booking-assignment
// @access  Private (Admin) - This will be called from admin controller
const createBookingAssignmentNotification = async (vendorId, bookingData) => {
  try {
    console.log('🔔 === BOOKING ASSIGNMENT NOTIFICATION START ===');
    console.log('Vendor ID:', vendorId, 'Type:', typeof vendorId);
    console.log('Booking ID:', bookingData._id);
    console.log('Booking Reference:', bookingData.bookingReference);

    logger.info('🔔 === BOOKING ASSIGNMENT NOTIFICATION START ===', {
      vendorId,
      vendorIdType: typeof vendorId,
      bookingId: bookingData._id,
      bookingReference: bookingData.bookingReference
    });

    // Use connection service to ensure MongoDB is ready
    await notificationConnectionService.ensureConnection();

    const Vendor = require('../models/Vendor');

    // Convert vendorId string to ObjectId by finding the vendor
    let vendorObjectId = vendorId;
    let vendorForNotification = null;

    if (typeof vendorId === 'string' && !vendorId.match(/^[0-9a-fA-F]{24}$/)) {
      // vendorId is a string like "967", need to find the vendor
      logger.info('Looking up vendor by vendorId string', { vendorId });
      vendorForNotification = await Vendor.findOne({ vendorId: vendorId });
      if (!vendorForNotification) {
        logger.error('Vendor not found by vendorId string', { vendorId });
        throw new Error(`Vendor with ID ${vendorId} not found`);
      }
      vendorObjectId = vendorForNotification._id;

      logger.info('Converted string vendorId to ObjectId for notification', {
        originalVendorId: vendorId,
        vendorObjectId: vendorObjectId.toString(),
        vendorName: `${vendorForNotification.firstName} ${vendorForNotification.lastName}`
      });
    } else if (typeof vendorId === 'string' && vendorId.match(/^[0-9a-fA-F]{24}$/)) {
      // vendorId is already an ObjectId string
      logger.info('VendorId is already an ObjectId string', { vendorId });
      vendorObjectId = vendorId;
    } else {
      // vendorId might already be ObjectId
      logger.info('VendorId appears to be ObjectId', { vendorId });
      vendorObjectId = vendorId;
    }

    const notification = new VendorNotification({
      vendorId: vendorObjectId,
      type: 'booking_assignment',
      title: 'New Service Booking Assigned',
      message: `A new service booking for ${bookingData.customer?.name} has been assigned to you. Please review and take action.`,
      data: {
        bookingId: bookingData._id,
        customerName: bookingData.customer?.name,
        customerEmail: bookingData.customer?.email,
        customerPhone: bookingData.customer?.phone,
        customerAddress: bookingData.customer?.address,
        services: bookingData.services,
        scheduledDate: bookingData.scheduling?.scheduledDate,
        scheduledTime: bookingData.scheduling?.scheduledTime,
        priority: bookingData.priority,
        totalAmount: bookingData.pricing?.totalAmount,
        assignedAt: new Date()
      },
      priority: bookingData.priority === 'urgent' || bookingData.priority === 'high' ? 'high' : 'medium'
    });

    await notification.save();

    // Email/SMS notifications disabled - only push notifications
    logger.info('Email/SMS notifications disabled - using push notifications only', {
      vendorId,
      bookingId: bookingData._id
    });

    // Send push notification
    try {
      logger.info('🔍 Fetching vendor for push notification', {
        vendorObjectId: vendorObjectId.toString(),
        vendorObjectIdType: typeof vendorObjectId,
        originalVendorId: vendorId
      });

      // Try to find vendor by _id first, then by vendorId if needed
      let vendor = await Vendor.findById(vendorObjectId).select('+fcmTokenMobile notificationSettings firstName lastName email');

      // If not found by _id and we have the original vendorId string, try finding by vendorId
      if (!vendor && vendorForNotification) {
        console.log('🔄 Vendor not found by _id, using vendorForNotification from earlier lookup');
        vendor = vendorForNotification;
        // Re-fetch with fcmTokenMobile field
        vendor = await Vendor.findById(vendor._id).select('+fcmTokenMobile notificationSettings firstName lastName email');
      }

      // If still not found, try finding by vendorId string directly
      if (!vendor && typeof vendorId === 'string' && !vendorId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('🔄 Trying to find vendor by vendorId string:', vendorId);
        vendor = await Vendor.findOne({ vendorId: vendorId }).select('+fcmTokenMobile notificationSettings firstName lastName email');
      }

      // --- SEND EMAIL TO USER ABOUT ENGINEER ASSIGNMENT ---
      try {
        if (bookingData.customer && bookingData.customer.email) {
          console.log('📧 Sending engineer assignment email to user:', bookingData.customer.email);

          const emailService = require('../services/emailService');
          const subject = `Engineer Assigned for your Booking #${bookingData.bookingReference || bookingData._id.toString().substring(0, 8).toUpperCase()}`;

          // Format date and time
          const scheduledDateVal = bookingData.scheduling?.scheduledDate
            ? new Date(bookingData.scheduling.scheduledDate).toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })
            : 'As scheduled';

          const scheduledTimeVal = bookingData.scheduling?.scheduledTime || 'As scheduled';

          const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #2563eb;">Engineer Assigned!</h2>
                        <p style="font-size: 16px; color: #4b5563;">Good news! An engineer has been assigned to your service request.</p>
                    </div>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #1f2937;">Booking Details</h3>
                        <p><strong>Booking ID:</strong> ${bookingData.bookingReference || bookingData._id}</p>
                        <p><strong>Service:</strong> ${bookingData.services && bookingData.services[0] ? bookingData.services[0].name : 'Requested Service'}</p>
                        <p><strong>Date:</strong> ${scheduledDateVal}</p>
                        <p><strong>Time:</strong> ${scheduledTimeVal}</p>
                    </div>

                    ${vendor ? `
                    <div style="background-color: #ecfdf5; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #d1fae5;">
                        <h3 style="margin-top: 0; color: #065f46;">Engineer Details</h3>
                        <p><strong>Name:</strong> ${vendor.firstName} ${vendor.lastName}</p>
                        <p><strong>Experience:</strong> ${vendor.experience || 'Experienced'}</p>
                        <p><strong>Rating:</strong> ${vendor.rating?.average ? '⭐ ' + vendor.rating.average.toFixed(1) : 'New'}</p>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280;">
                        <p>The engineer will arrive at the scheduled time. You can track your booking status in the app.</p>
                        <p>Thank you for choosing Fixfly!</p>
                    </div>
                </div>
            `;

          await emailService.sendEmail({
            to: bookingData.customer.email,
            subject: subject,
            html: htmlContent,
            text: `Engineer Assigned! An engineer has been assigned to your service request (Booking ID: ${bookingData.bookingReference}). They will arrive on ${scheduledDateVal} at ${scheduledTimeVal}.`
          });

          console.log('✅ Engineer assignment email sent successfully');
        } else {
          console.log('⚠️ No customer email found for engineer assignment notification');
        }
      } catch (emailError) {
        console.error('❌ Failed to send engineer assignment email:', emailError);
        // Don't block the rest of the notification flow
      }
      // ----------------------------------------------------

      if (!vendor) {
        logger.error('❌ Vendor not found for push notification', {
          vendorObjectId: vendorObjectId.toString(),
          vendorId,
          vendorIdType: typeof vendorId
        });
        console.error('❌ Vendor lookup failed:', {
          triedById: vendorObjectId.toString(),
          triedByVendorId: typeof vendorId === 'string' && !vendorId.match(/^[0-9a-fA-F]{24}$/) ? vendorId : 'N/A'
        });
        throw new Error(`Vendor not found with ID: ${vendorObjectId} (original: ${vendorId})`);
      }

      logger.info('✅ Vendor found for push notification', {
        vendorId: vendor._id.toString(),
        vendorName: `${vendor.firstName} ${vendor.lastName}`,
        email: vendor.email,
        hasFcmTokenMobile: !!vendor.fcmTokenMobile,
        fcmTokenMobileCount: vendor.fcmTokenMobile?.length || 0,
        notificationSettings: vendor.notificationSettings
      });

      // Use unique mobile/webview tokens (web tokens removed)
      const allMobileTokens = vendor?.fcmTokenMobile || [];
      const uniqueTokens = [...new Set(
        allMobileTokens
          .filter(t => t && typeof t === 'string' && t.trim().length > 0)
          .map(t => t.trim())
      )];

      // Check if push notifications are enabled (default to true if not set)
      const pushNotificationsEnabled = vendor.notificationSettings?.pushNotifications !== false;

      logger.info('📱 Push notification check', {
        vendorId: vendor._id.toString(),
        vendorIdString: vendor.vendorId,
        uniqueTokensCount: uniqueTokens.length,
        pushNotificationsEnabled,
        tokens: uniqueTokens.map(t => t.substring(0, 20) + '...'),
        fcmTokenMobileArray: vendor.fcmTokenMobile
      });

      // Log warning if no tokens found
      if (uniqueTokens.length === 0) {
        logger.warn('⚠️ No FCM tokens found for vendor', {
          vendorId: vendor._id.toString(),
          vendorIdString: vendor.vendorId,
          vendorName: `${vendor.firstName} ${vendor.lastName}`,
          email: vendor.email,
          fcmTokenMobileExists: !!vendor.fcmTokenMobile,
          fcmTokenMobileType: typeof vendor.fcmTokenMobile,
          fcmTokenMobileLength: vendor.fcmTokenMobile?.length || 0
        });
        console.warn('⚠️ No FCM tokens found for vendor:', {
          vendorId: vendor._id.toString(),
          vendorIdString: vendor.vendorId,
          vendorName: `${vendor.firstName} ${vendor.lastName}`
        });
      }

      // Log warning if push notifications disabled
      if (!pushNotificationsEnabled) {
        logger.warn('⚠️ Push notifications disabled for vendor', {
          vendorId: vendor._id.toString(),
          vendorIdString: vendor.vendorId,
          notificationSettings: vendor.notificationSettings
        });
        console.warn('⚠️ Push notifications disabled for vendor:', {
          vendorId: vendor._id.toString(),
          vendorIdString: vendor.vendorId
        });
      }

      if (vendor && uniqueTokens.length > 0 && pushNotificationsEnabled) {
        const customerName = bookingData.customer?.name || 'customer';
        const bookingRef = bookingData.bookingReference || '';
        const pushNotification = {
          title: '📅 New Booking Assigned',
          body: `Booking #${bookingRef} for ${customerName} has been assigned to you. Please review and accept or decline.`,
          priority: 'high', // High priority for instant delivery
          requireInteraction: true // Require user interaction for important notifications
        };

        const pushData = {
          type: 'booking_assignment',
          bookingId: bookingData._id,
          taskId: bookingData._id.toString(), // Use bookingId as taskId for vendor task route
          customerName: bookingData.customer?.name,
          scheduledDate: bookingData.scheduling?.scheduledDate,
          totalAmount: bookingData.pricing?.totalAmount,
          action: 'view_booking',
          link: `/vendor/task/${bookingData._id}`, // Add link to vendor task page
          priority: 'high', // High priority for instant delivery
          timestamp: new Date().toISOString()
        };

        // Send push notification to all tokens using multicast
        console.log('📤 Sending push notification to vendor tokens:', {
          vendorId: vendor._id.toString(),
          tokenCount: uniqueTokens.length,
          tokens: uniqueTokens.map(t => t.substring(0, 30) + '...')
        });

        const firebasePushService = require('../services/firebasePushService');
        const pushResult = await firebasePushService.sendMulticastPushNotification(
          uniqueTokens,
          pushNotification,
          pushData
        );

        console.log('📤 Push notification result:', {
          successCount: pushResult.successCount,
          failureCount: pushResult.failureCount,
          totalTokens: uniqueTokens.length,
          vendorId: vendor._id.toString(),
          invalidTokensCount: pushResult.invalidTokens?.length || 0,
          invalidTokens: pushResult.invalidTokens || [],
          hasInvalidTokens: !!pushResult.invalidTokens,
          pushResult: pushResult
        });

        // Clean up invalid tokens if any
        // Check if invalidTokens exists and has items
        if (pushResult.invalidTokens && Array.isArray(pushResult.invalidTokens) && pushResult.invalidTokens.length > 0) {
          console.log('🗑️ Cleaning up invalid FCM tokens:', {
            vendorId: vendor._id.toString(),
            invalidTokenCount: pushResult.invalidTokens.length,
            tokens: pushResult.invalidTokens.map(t => t.substring(0, 30) + '...')
          });

          try {
            // Remove invalid tokens from vendor's fcmTokenMobile array
            vendor.fcmTokenMobile = vendor.fcmTokenMobile.filter(
              token => !pushResult.invalidTokens.includes(token)
            );
            vendor.markModified('fcmTokenMobile');
            await vendor.save({ validateBeforeSave: false });

            console.log('✅ Invalid tokens removed from vendor:', {
              vendorId: vendor._id.toString(),
              removedCount: pushResult.invalidTokens.length,
              remainingTokens: vendor.fcmTokenMobile.length
            });

            logger.info(`Cleaned up ${pushResult.invalidTokens.length} invalid tokens for vendor ${vendor._id}`, {
              vendorId: vendor._id.toString(),
              removedTokens: pushResult.invalidTokens.length,
              remainingTokens: vendor.fcmTokenMobile.length
            });
          } catch (cleanupError) {
            console.error('❌ Error cleaning up invalid tokens:', cleanupError);
            logger.error('Error cleaning up invalid FCM tokens for vendor', {
              error: cleanupError.message,
              vendorId: vendor._id.toString()
            });
          }
        }



        // Send realtime notification for in-app updates
        const realtimeResult = await firebaseRealtimeService.sendRealtimeNotification(
          vendorId,
          {
            title: pushNotification.title,
            message: pushNotification.body,
            type: 'booking_assignment',
            data: pushData
          }
        );

        logger.info('✅ Notification sent for booking assignment', {
          vendorId: vendor._id.toString(),
          bookingReference: bookingData.bookingReference,
          pushSuccess: pushResult.successCount > 0,
          realtimeSuccess: realtimeResult
        });

        if (pushResult.successCount === 0) {
          logger.warn('⚠️ Push notification sent but successCount is 0', {
            vendorId: vendor._id.toString(),
            vendorIdString: vendor.vendorId,
            pushResult,
            tokens: uniqueTokens,
            failureCount: pushResult.failureCount,
            error: pushResult.error
          });
          console.error('❌ All push notifications failed:', {
            vendorId: vendor._id.toString(),
            vendorIdString: vendor.vendorId,
            failureCount: pushResult.failureCount,
            totalTokens: uniqueTokens.length,
            error: pushResult.error
          });
        }
      } else {
        // Log why push notification was not sent
        if (uniqueTokens.length === 0) {
          logger.warn('⚠️ Push notification not sent - no FCM tokens found', {
            vendorId: vendor._id.toString(),
            vendorIdString: vendor.vendorId
          });
        } else if (!pushNotificationsEnabled) {
          logger.warn('⚠️ Push notification not sent - notifications disabled', {
            vendorId: vendor._id.toString(),
            vendorIdString: vendor.vendorId
          });
        }
        const pushNotificationsEnabled = vendor?.notificationSettings?.pushNotifications !== false;
        const reason = !vendor ? 'Vendor not found' :
          uniqueTokens.length === 0 ? 'No FCM tokens' :
            !pushNotificationsEnabled ? 'Push notifications disabled' : 'Unknown';

        console.warn('⚠️ Push notification skipped for booking assignment:', {
          vendorId: vendor?._id?.toString() || vendorId,
          vendorName: vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Not found',
          hasTokens: uniqueTokens.length > 0,
          mobileTokens: vendor?.fcmTokenMobile?.length || 0,
          pushEnabled: pushNotificationsEnabled,
          reason: reason
        });

        logger.warn('⚠️ Push notification skipped for booking assignment', {
          vendorId: vendor?._id?.toString() || vendorId,
          vendorName: vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Not found',
          hasTokens: uniqueTokens.length > 0,
          mobileTokens: vendor?.fcmTokenMobile?.length || 0,
          pushEnabled: pushNotificationsEnabled,
          reason: reason
        });
      }
    } catch (pushError) {
      console.error('❌ === PUSH NOTIFICATION ERROR ===');
      console.error('Error:', pushError);
      console.error('Error message:', pushError?.message);
      console.error('Error stack:', pushError?.stack);
      console.error('Vendor ID:', vendorId);
      console.error('Booking ID:', bookingData._id);

      logger.error('❌ Failed to send push notification for booking assignment', {
        error: pushError.message,
        stack: pushError.stack,
        vendorId,
        bookingId: bookingData._id,
        bookingReference: bookingData.bookingReference
      });
      // Don't fail the notification creation if push notification fails
    }

    logger.info('✅ Booking assignment notification created', {
      vendorId,
      vendorObjectId: vendorObjectId.toString(),
      bookingId: bookingData._id,
      bookingReference: bookingData.bookingReference,
      notificationId: notification._id
    });

    logger.info('🔔 === BOOKING ASSIGNMENT NOTIFICATION END ===');

    return notification;
  } catch (error) {
    logger.error('Error creating booking assignment notification:', {
      error: error.message,
      vendorId,
      bookingId: bookingData._id
    });
    throw error;
  }
};

// @desc    Create warranty claim assignment notification
// @route   POST /api/vendor/notifications/create-warranty-assignment
// @access  Private (Admin) - This will be called from admin controller
const createWarrantyClaimAssignmentNotification = asyncHandler(async (vendorId, claimData) => {
  try {
    // Ensure MongoDB connection is active
    if (mongoose.connection.readyState !== 1) {
      logger.warn('MongoDB connection not ready, attempting to reconnect...');
      await mongoose.connect(process.env.MONGODB_URI);
      // Wait for connection to be established
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) {
          resolve();
        } else {
          mongoose.connection.once('connected', resolve);
        }
      });
    }
    // Convert vendorId string to ObjectId by finding the vendor if needed
    let vendorObjectId = vendorId;
    if (typeof vendorId === 'string' && !vendorId.match(/^[0-9a-fA-F]{24}$/)) {
      // vendorId is a string like "967", need to find the vendor
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findOne({ vendorId: vendorId });
      if (!vendor) {
        throw new Error(`Vendor with ID ${vendorId} not found`);
      }
      vendorObjectId = vendor._id;

      logger.info('Converted string vendorId to ObjectId for warranty claim notification', {
        originalVendorId: vendorId,
        vendorObjectId: vendorObjectId,
        vendorName: `${vendor.firstName} ${vendor.lastName}`,
        claimId: claimData._id
      });
    }

    const notification = new VendorNotification({
      vendorId: vendorObjectId,
      type: 'warranty_claim',
      title: 'New Warranty Claim Assignment',
      message: `You have been assigned a new warranty claim for ${claimData.item}. Please review the details and take action.`,
      data: {
        claimId: claimData._id,
        subscriptionId: claimData.subscriptionId,
        item: claimData.item,
        issueDescription: claimData.issueDescription,
        userId: claimData.userId,
        userPhone: claimData.userId?.phone || claimData.userId?.mobile,
        userAddress: claimData.userId?.address,
        assignedAt: new Date()
      },
      priority: 'high'
    });

    await notification.save();

    // Email/SMS notifications disabled - only push notifications
    logger.info('Email/SMS notifications disabled - using push notifications only', {
      vendorId,
      claimId: claimData._id
    });

    // Send push notification
    try {
      const vendor = await Vendor.findById(vendorObjectId).select('+fcmTokens +fcmTokenMobile notificationSettings');

      // Use mobile/webview tokens only (web tokens removed)
      const uniqueTokens = [...(vendor?.fcmTokenMobile || [])];

      // Check if push notifications are enabled (default to true if not set)
      const pushNotificationsEnabled = vendor.notificationSettings?.pushNotifications !== false;

      if (vendor && uniqueTokens.length > 0 && pushNotificationsEnabled) {
        const pushNotification = {
          title: '🛠️ New Warranty Claim Assigned',
          body: `You have been assigned a new warranty claim for ${claimData.item}`
        };

        const pushData = {
          type: 'warranty_claim_assignment',
          claimId: claimData._id,
          item: claimData.item,
          issueDescription: claimData.issueDescription,
          action: 'view_claim'
        };

        // Send push notification to all tokens using multicast
        const firebasePushService = require('../services/firebasePushService');
        const pushResult = await firebasePushService.sendMulticastPushNotification(
          uniqueTokens,
          pushNotification,
          pushData
        );

        logger.info('Push notification sent for warranty claim assignment', {
          vendorId,
          claimId: claimData._id,
          pushSuccessCount: pushResult.successCount,
          pushFailureCount: pushResult.failureCount,
          totalTokens: uniqueTokens.length,
          mobileTokens: vendor.fcmTokenMobile?.length || 0
        });
      } else {
        const pushNotificationsEnabled = vendor?.notificationSettings?.pushNotifications !== false;
        logger.info('Push notification skipped - no FCM token or disabled', {
          vendorId,
          hasTokens: uniqueTokens.length > 0,
          mobileTokens: vendor?.fcmTokenMobile?.length || 0,
          pushEnabled: pushNotificationsEnabled
        });
      }
    } catch (pushError) {
      logger.error('Failed to send push notification for warranty claim assignment', {
        error: pushError.message,
        vendorId,
        claimId: claimData._id
      });
      // Don't fail the notification creation if push notification fails
    }

    logger.info('Warranty claim assignment notification created', {
      vendorId,
      claimId: claimData._id,
      notificationId: notification._id
    });

    return notification;
  } catch (error) {
    logger.error('Error creating warranty claim assignment notification:', {
      error: error.message,
      vendorId,
      claimId: claimData._id
    });
    throw error;
  }
});

module.exports = {
  getVendorNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getVendorSupportTickets,
  getVendorDashboard,
  createSupportTicketAssignmentNotification,
  createBookingAssignmentNotification,
  createWarrantyClaimAssignmentNotification
};
