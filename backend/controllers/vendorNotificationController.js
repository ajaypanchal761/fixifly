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
  const { page = 1, limit = 10, status, priority, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

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
    .select('ticketId subject type priority createdAt userName userEmail userPhone description')
    .sort({ createdAt: -1 })
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

      const vendor = await Vendor.findById(vendorObjectId).select('fcmToken notificationSettings firstName lastName email');
      
      logger.info('Vendor details for push notification', {
        vendorId,
        vendorFound: !!vendor,
        hasFcmToken: !!vendor?.fcmToken,
        fcmTokenLength: vendor?.fcmToken?.length || 0,
        pushNotificationsEnabled: vendor?.notificationSettings?.pushNotifications,
        vendorName: vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Not found'
      });

      if (vendor && vendor.fcmToken && vendor.notificationSettings?.pushNotifications) {
        const pushNotification = {
          title: '🛠️ New Support Ticket Assigned',
          body: `You have been assigned a new support ticket: ${ticketData.subject}`
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
          fcmTokenPreview: vendor.fcmToken.substring(0, 20) + '...'
        });

        // Send complete notification (both push and realtime database)
        const results = await firebaseRealtimeService.sendCompleteNotification(
          vendorId,
          vendor.fcmToken,
          pushNotification,
          pushData
        );

        logger.info('Complete notification result for support ticket assignment', {
          vendorId,
          ticketId: ticketData.ticketId,
          pushNotification: results.pushNotification,
          realtimeNotification: results.realtimeNotification,
          fcmToken: vendor.fcmToken ? 'present' : 'missing'
        });
      } else {
        logger.warn('Push notification skipped for support ticket assignment', {
          vendorId,
          ticketId: ticketData.ticketId,
          hasToken: !!vendor?.fcmToken,
          pushEnabled: vendor?.notificationSettings?.pushNotifications,
          vendorExists: !!vendor,
          reason: !vendor ? 'Vendor not found' : 
                  !vendor.fcmToken ? 'No FCM token' : 
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
const createBookingAssignmentNotification = asyncHandler(async (vendorId, bookingData) => {
  try {
    // Use connection service to ensure MongoDB is ready
    await notificationConnectionService.ensureConnection();

    // Convert vendorId string to ObjectId by finding the vendor
    let vendorObjectId = vendorId;
    if (typeof vendorId === 'string' && !vendorId.match(/^[0-9a-fA-F]{24}$/)) {
      // vendorId is a string like "967", need to find the vendor
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findOne({ vendorId: vendorId });
      if (!vendor) {
        throw new Error(`Vendor with ID ${vendorId} not found`);
      }
      vendorObjectId = vendor._id;
      
      logger.info('Converted string vendorId to ObjectId for notification', {
        originalVendorId: vendorId,
        vendorObjectId: vendorObjectId,
        vendorName: `${vendor.firstName} ${vendor.lastName}`
      });
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
      const vendor = await Vendor.findById(vendorObjectId).select('fcmToken notificationSettings');
      if (vendor && vendor.fcmToken && vendor.notificationSettings?.pushNotifications) {
        const pushNotification = {
          title: '📅 New Service Booking Assigned',
          body: `You have been assigned a new service booking for ${bookingData.customer?.name}`
        };

        const pushData = {
          type: 'booking_assignment',
          bookingId: bookingData._id,
          customerName: bookingData.customer?.name,
          scheduledDate: bookingData.scheduling?.scheduledDate,
          totalAmount: bookingData.pricing?.totalAmount,
          action: 'view_booking'
        };

        // Send complete notification (both push and realtime database)
        const results = await firebaseRealtimeService.sendCompleteNotification(
          vendorId,
          vendor.fcmToken,
          pushNotification,
          pushData
        );

        logger.info('Complete notification sent for booking assignment', {
          vendorId,
          bookingId: bookingData._id,
          pushNotification: results.pushNotification,
          realtimeNotification: results.realtimeNotification,
          fcmToken: vendor.fcmToken ? 'present' : 'missing'
        });
      } else {
        logger.info('Push notification skipped - no FCM token or disabled', {
        vendorId,
          hasToken: !!vendor?.fcmToken,
          pushEnabled: vendor?.notificationSettings?.pushNotifications
        });
      }
    } catch (pushError) {
      logger.error('Failed to send push notification for booking assignment', {
        error: pushError.message,
        vendorId,
        bookingId: bookingData._id
      });
      // Don't fail the notification creation if push notification fails
    }

    logger.info('Booking assignment notification created', {
      vendorId,
      bookingId: bookingData._id,
      notificationId: notification._id
    });

    return notification;
  } catch (error) {
    logger.error('Error creating booking assignment notification:', {
      error: error.message,
      vendorId,
      bookingId: bookingData._id
    });
    throw error;
  }
});

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
      const vendor = await Vendor.findById(vendorObjectId).select('fcmToken notificationSettings');
      if (vendor && vendor.fcmToken && vendor.notificationSettings?.pushNotifications) {
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

        await firebasePushService.sendPushNotification(
          vendor.fcmToken,
          pushNotification,
        pushData
      );
      
        logger.info('Push notification sent for warranty claim assignment', {
          vendorId,
          claimId: claimData._id,
          fcmToken: vendor.fcmToken ? 'present' : 'missing'
        });
      } else {
        logger.info('Push notification skipped - no FCM token or disabled', {
        vendorId,
          hasToken: !!vendor?.fcmToken,
          pushEnabled: vendor?.notificationSettings?.pushNotifications
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
