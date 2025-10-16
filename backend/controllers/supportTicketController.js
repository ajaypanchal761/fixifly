const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const Admin = require('../models/Admin');
const emailService = require('../services/emailService');

// @desc    Create a new support ticket
// @route   POST /api/support-tickets
// @access  Private (User)
const createSupportTicket = asyncHandler(async (req, res) => {
  const {
    supportType,
    caseId,
    subscriptionId,
    subject,
    description
  } = req.body;

  const userId = req.user.userId || req.user._id;

  // Validate required fields
  if (!supportType || !subject || !description) {
    return res.status(400).json({
      success: false,
      message: 'Support type, subject, and description are required'
    });
  }

  // Validate case ID for service and product types
  if ((supportType === 'service' || supportType === 'product') && !caseId) {
    return res.status(400).json({
      success: false,
      message: 'Case ID is required for service and product warranty claims'
    });
  }

  // Validate subscription ID for AMC claims
  if (supportType === 'amc' && !subscriptionId) {
    return res.status(400).json({
      success: false,
      message: 'Subscription ID is required for AMC claims'
    });
  }

  // Get user details
  const user = await User.findById(userId).select('email name phone');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Determine ticket type based on support type
  let ticketType;
  switch (supportType) {
    case 'service':
      ticketType = 'Service Warranty Claim';
      break;
    case 'product':
      ticketType = 'Product Warranty Claim';
      break;
    case 'amc':
      ticketType = 'AMC Claim';
      break;
    default:
      ticketType = 'Others';
  }

  // Create support ticket
  const supportTicket = new SupportTicket({
    userId,
    userEmail: user.email,
    userName: user.name || 'Unknown User',
    userPhone: user.phone,
    supportType,
    type: ticketType,
    caseId: caseId || null,
    subscriptionId: subscriptionId || null,
    subject,
    description,
    metadata: {
      source: 'web',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    }
  });

  await supportTicket.save();

  // Send email notification to user about ticket submission
  try {
    const emailData = {
      to: user.email,
      subject: `Support Ticket Submitted - ${supportTicket.ticketId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Support Ticket Submitted</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
            .ticket-description { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #fef3c7; color: #92400e; }
            .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .priority-high { background: #fecaca; color: #991b1b; }
            .priority-medium { background: #fef3c7; color: #92400e; }
            .priority-low { background: #d1fae5; color: #065f46; }
            .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Support Ticket Submitted Successfully!</h1>
              <p>Thank you for contacting Fixfly Support</p>
            </div>
            <div class="content">
              <h2>Hello ${user.name},</h2>
              <p>We have successfully received your support ticket and our team will contact you soon.</p>
              
              <div class="ticket-info">
                <h3>📋 Ticket Information</h3>
                <p><strong>Ticket ID:</strong> ${supportTicket.ticketId}</p>
                <p><strong>Subject:</strong> ${supportTicket.subject}</p>
                <p><strong>Type:</strong> ${supportTicket.type}</p>
                <p><strong>Status:</strong> <span class="status-badge">${supportTicket.status}</span></p>
                <p><strong>Priority:</strong> <span class="priority-badge priority-${supportTicket.priority.toLowerCase()}">${supportTicket.priority}</span></p>
                ${supportTicket.caseId ? `<p><strong>Case ID:</strong> ${supportTicket.caseId}</p>` : ''}
                <p><strong>Submitted:</strong> ${new Date(supportTicket.createdAt).toLocaleDateString('en-IN')} at ${new Date(supportTicket.createdAt).toLocaleTimeString('en-IN')}</p>
              </div>

              <div class="ticket-description">
                <h3>📝 Your Message:</h3>
                <div style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #059669;">${supportTicket.description}</div>
              </div>

              <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
                <h3 style="color: #0284c7; margin-top: 0;">⏰ What Happens Next?</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Our support team will review your ticket within 24 hours</li>
                  <li>You will receive updates via email as we work on your request</li>
                  <li>Our team will contact you directly if additional information is needed</li>
                  <li>You can track your ticket status anytime through your Fixfly account</li>
                </ul>
              </div>

              <p><strong>Need immediate assistance?</strong> For urgent matters, please call our customer support hotline.</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support" class="cta-button">
                View Your Tickets
              </a>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Fixfly Support Team</p>
              <p>This is an automated confirmation. Please do not reply directly to this email.</p>
              <p>For any queries, please contact us through your Fixfly account or visit our support center.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Support Ticket Submitted Successfully - Fixfly
        
        Hello ${user.name},
        
        We have successfully received your support ticket and our team will contact you soon.
        
        Ticket Information:
        - Ticket ID: ${supportTicket.ticketId}
        - Subject: ${supportTicket.subject}
        - Type: ${supportTicket.type}
        - Status: ${supportTicket.status}
        - Priority: ${supportTicket.priority}
        ${supportTicket.caseId ? `- Case ID: ${supportTicket.caseId}` : ''}
        - Submitted: ${new Date(supportTicket.createdAt).toLocaleDateString('en-IN')} at ${new Date(supportTicket.createdAt).toLocaleTimeString('en-IN')}
        
        Your Message:
        ${supportTicket.description}
        
        What Happens Next?
        - Our support team will review your ticket within 24 hours
        - You will receive updates via email as we work on your request
        - Our team will contact you directly if additional information is needed
        - You can track your ticket status anytime through your Fixfly account
        
        Need immediate assistance? For urgent matters, please call our customer support hotline.
        
        View your tickets: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/support
        
        Best regards,
        The Fixfly Support Team
        
        This is an automated confirmation. Please do not reply directly to this email.
      `
    };

    const emailResult = await emailService.sendEmail(emailData);
    
    if (emailResult.success) {
      logger.info(`Ticket submission confirmation email sent: ${supportTicket.ticketId}`, {
        ticketId: supportTicket.ticketId,
        userEmail: user.email,
        userId: userId,
        messageId: emailResult.messageId
      });
    } else {
      logger.warn(`Failed to send ticket submission confirmation email: ${supportTicket.ticketId}`, {
        ticketId: supportTicket.ticketId,
        userEmail: user.email,
        error: emailResult.error
      });
    }
  } catch (emailError) {
    logger.error(`Error sending ticket submission confirmation email: ${supportTicket.ticketId}`, {
      ticketId: supportTicket.ticketId,
      userEmail: user.email,
      error: emailError.message
    });
    // Don't fail the ticket creation if email fails
  }

  logger.info(`New support ticket created: ${supportTicket.ticketId} by user: ${userId}`);

  // Send FCM notification to all active vendors about new support ticket
  try {
    const firebasePushService = require('../services/firebasePushService');
    
    const notification = {
      title: '🎯 New Support Ticket Available',
      body: `${supportTicket.type}: ${supportTicket.subject}`
    };

    const data = {
      type: 'new_support_ticket',
      ticketId: supportTicket.ticketId,
      subject: supportTicket.subject,
      supportType: supportTicket.supportType,
      priority: supportTicket.priority,
      customerName: supportTicket.userName,
      caseId: supportTicket.caseId || null
    };

    // Send to all active vendors
    const result = await firebasePushService.sendToAllVendors(notification, data);
    
    logger.info('FCM notification sent for new support ticket', {
      ticketId: supportTicket.ticketId,
      successCount: result.successCount,
      failureCount: result.failureCount
    });
  } catch (notificationError) {
    logger.error('Failed to send FCM notification for new support ticket', {
      ticketId: supportTicket.ticketId,
      error: notificationError.message
    });
    // Don't fail ticket creation if notification fails
  }

  res.status(201).json({
    success: true,
    message: 'Support ticket created successfully',
    data: {
      ticket: {
        id: supportTicket.ticketId,
        subject: supportTicket.subject,
        type: supportTicket.type,
        status: supportTicket.status,
        priority: supportTicket.priority,
        created: supportTicket.formattedCreatedAt,
        lastUpdate: supportTicket.lastUpdate,
        responses: supportTicket.responseCount
      }
    }
  });
});

// @desc    Get user's support tickets
// @route   GET /api/support-tickets
// @access  Private (User)
const getUserSupportTickets = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user._id;

  const tickets = await SupportTicket.find({ userId })
    .select('ticketId subject type status priority createdAt lastResponseAt responseCount caseId subscriptionId paymentMode paymentStatus billingAmount vendorStatus completionData description')
    .sort({ createdAt: -1 });

  const formattedTickets = tickets.map(ticket => ({
    id: ticket.ticketId,
    subject: ticket.subject,
    type: ticket.type,
    status: ticket.status,
    priority: ticket.priority,
    created: ticket.formattedCreatedAt,
    lastUpdate: ticket.lastUpdate,
    responses: ticket.responseCount,
    caseId: ticket.caseId,
    subscriptionId: ticket.subscriptionId,
    description: ticket.description,
    paymentMode: ticket.paymentMode,
    paymentStatus: ticket.paymentStatus,
    billingAmount: ticket.billingAmount || 0,
    totalAmount: ticket.completionData?.totalAmount || 0,
    vendorStatus: ticket.vendorStatus
  }));

  res.json({
    success: true,
    data: {
      tickets: formattedTickets
    }
  });
});

// @desc    Get single support ticket
// @route   GET /api/support-tickets/:id
// @access  Private (User)
const getSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId || req.user._id;

  const ticket = await SupportTicket.findOne({ 
    ticketId: id, 
    userId 
  }).populate('assignedTo', 'name email')
    .populate('userId', 'name email phone address');

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  res.json({
    success: true,
    data: {
      ticket: {
        id: ticket.ticketId,
        subject: ticket.subject,
        type: ticket.type,
        status: ticket.status,
        priority: ticket.priority,
        created: ticket.formattedCreatedAt,
        lastUpdate: ticket.lastUpdate,
        responses: ticket.responseCount,
        caseId: ticket.caseId,
        description: ticket.description,
        address: ticket.userId?.address?.street || ticket.userId?.address || 'Not provided',
        pincode: ticket.userId?.address?.pincode || 'Not provided',
        assignedTo: ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned',
        resolution: ticket.resolution,
        responses: ticket.responses.map(response => ({
          message: response.message,
          sender: response.sender,
          senderName: response.senderName,
          createdAt: response.createdAt,
          isInternal: response.isInternal
        }))
      }
    }
  });
});

// @desc    Add response to support ticket
// @route   POST /api/support-tickets/:id/response
// @access  Private (User)
const addTicketResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.userId || req.user._id;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Response message is required'
    });
  }

  const ticket = await SupportTicket.findOne({ 
    ticketId: id, 
    userId 
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  // Get user details
  const user = await User.findById(userId).select('name');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  await ticket.addResponse(
    message.trim(),
    'user',
    userId,
    user.name
  );

  logger.info(`User response added to ticket: ${ticket.ticketId} by user: ${userId}`);

  res.json({
    success: true,
    message: 'Response added successfully',
    data: {
      ticket: {
        id: ticket.ticketId,
        status: ticket.status,
        lastUpdate: ticket.lastUpdate,
        responses: ticket.responseCount
      }
    }
  });
});

// @desc    Get all support tickets (Admin)
// @route   GET /api/admin/support-tickets
// @access  Private (Admin)
const getAllSupportTickets = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
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
      { caseId: { $regex: search, $options: 'i' } },
      { subscriptionId: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tickets = await SupportTicket.find(filter)
    .populate('assignedTo', 'firstName lastName email phone')
    .populate('userId', 'name email phone address')
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
    subscriptionId: ticket.subscriptionId,
    assignedTo: ticket.assignedTo ? {
      id: ticket.assignedTo._id,
      name: `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`,
      email: ticket.assignedTo.email,
      phone: ticket.assignedTo.phone
    } : null,
    assignedVendor: ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Not Assigned',
    assignedAt: ticket.assignedAt,
    assignedBy: ticket.assignedBy,
    vendorAcceptedAt: ticket.vendorAcceptedAt,
    vendorDeclinedAt: ticket.vendorDeclinedAt,
    vendorDeclineReason: ticket.vendorDeclineReason,
    vendorCompletedAt: ticket.vendorCompletedAt,
    scheduledDate: ticket.scheduledDate,
    scheduledTime: ticket.scheduledTime,
    scheduleNotes: ticket.scheduleNotes,
    estimatedResolution: ticket.estimatedResolution,
    tags: ticket.tags,
    resolution: ticket.resolution,
    description: ticket.description,
    vendorAssignmentHistory: ticket.vendorAssignmentHistory,
    vendorCommunications: ticket.vendorCommunications,
    vendorPerformance: ticket.vendorPerformance,
    completionData: ticket.completionData,
    paymentMode: ticket.paymentMode,
    paymentStatus: ticket.paymentStatus,
    billingAmount: ticket.billingAmount,
    totalAmount: ticket.completionData?.totalAmount || 0
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

// @desc    Get single support ticket (Admin)
// @route   GET /api/admin/support-tickets/:id
// @access  Private (Admin)
const getAdminSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ticket = await SupportTicket.findOne({ ticketId: id })
    .populate('assignedTo', 'firstName lastName email phone')
    .populate('userId', 'name email phone address')
    .populate('resolvedBy', 'name email');

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  res.json({
    success: true,
    data: {
      ticket: {
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
        created: ticket.formattedCreatedAt,
        lastUpdate: ticket.lastUpdate,
        responses: ticket.responseCount,
        caseId: ticket.caseId,
        description: ticket.description,
        assignedTo: ticket.assignedTo ? {
          id: ticket.assignedTo._id,
          name: `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`,
          email: ticket.assignedTo.email,
          phone: ticket.assignedTo.phone
        } : null,
        assignedVendor: ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Not Assigned',
        estimatedResolution: ticket.estimatedResolution,
        tags: ticket.tags,
        resolution: ticket.resolution,
        resolvedAt: ticket.resolvedAt,
        resolvedBy: ticket.resolvedBy ? ticket.resolvedBy.name : null,
        completionData: ticket.completionData,
        paymentMode: ticket.paymentMode,
        paymentStatus: ticket.paymentStatus,
        billingAmount: ticket.billingAmount,
        totalAmount: ticket.completionData?.totalAmount || 0,
        vendorStatus: ticket.vendorStatus,
        assignedAt: ticket.assignedAt,
        scheduledDate: ticket.scheduledDate,
        scheduledTime: ticket.scheduledTime,
        scheduleNotes: ticket.scheduleNotes,
        vendorCompletedAt: ticket.vendorCompletedAt,
        vendorAssignmentHistory: ticket.vendorAssignmentHistory,
        responses: ticket.responses.map(response => ({
          message: response.message,
          sender: response.sender,
          senderName: response.senderName,
          createdAt: response.createdAt,
          isInternal: response.isInternal
        }))
      }
    }
  });
});

// @desc    Assign vendor to support ticket
// @route   PATCH /api/admin/support-tickets/:id/assign-vendor
// @access  Private (Admin)
const assignVendorToSupportTicket = asyncHandler(async (req, res) => {
  try {
    const { vendorId, scheduledDate, scheduledTime, priority, notes } = req.body;
    const { id } = req.params;

    console.log('Assign vendor request body:', {
      vendorId,
      scheduledDate,
      scheduledTime,
      priority,
      notes,
      ticketId: id
    });

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

    const ticket = await SupportTicket.findOne({ ticketId: id });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Check if ticket can be assigned (not resolved or closed, but allow reassignment of declined tickets)
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      // Allow reassignment if the ticket was declined by vendor
      if (ticket.vendorStatus !== 'Declined') {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign vendor to resolved or closed ticket'
        });
      }
    }

    // Use the assignVendor method from SupportTicket model
    await ticket.assignVendor(vendorId, req.admin._id, notes || '');

    // Update additional fields if provided
    const updateData = {};
    
    if (scheduledDate) {
      updateData.scheduledDate = new Date(scheduledDate);
      console.log('Setting scheduledDate:', {
        original: scheduledDate,
        parsed: updateData.scheduledDate,
        iso: updateData.scheduledDate.toISOString()
      });
    }
    if (scheduledTime) {
      updateData.scheduledTime = scheduledTime;
      console.log('Setting scheduledTime:', scheduledTime);
    }
    if (priority) {
      updateData.priority = priority;
    }
    if (notes) {
      updateData.scheduleNotes = notes;
    }

    // Update ticket status to In Progress when vendor is assigned
    updateData.status = 'In Progress';

    console.log('Update data before save:', updateData);

    // Apply updates
    Object.assign(ticket, updateData);
    await ticket.save();

    console.log('Ticket after save:', {
      scheduledDate: ticket.scheduledDate,
      scheduledTime: ticket.scheduledTime,
      status: ticket.status
    });

    // Mark first task assignment for mandatory deposit requirement
    try {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findById(vendorId);
      if (vendor) {
        await vendor.markFirstTaskAssignment();
      }
    } catch (error) {
      console.error('Error marking first task assignment:', error);
      // Don't fail the assignment if this fails
    }

    // Create notification for vendor
    const { createSupportTicketAssignmentNotification } = require('./vendorNotificationController');
    
    try {
      await createSupportTicketAssignmentNotification(vendorId, {
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        type: ticket.type,
        priority: ticket.priority,
        userName: ticket.userName,
        userEmail: ticket.userEmail,
        userPhone: ticket.userPhone,
        description: ticket.description
      });
    } catch (notificationError) {
      console.error('Error creating vendor notification:', notificationError);
      // Don't fail the assignment if notification fails
    }

    // Send FCM notification to assigned vendor
    try {
      const firebasePushService = require('../services/firebasePushService');
      const Vendor = require('../models/Vendor');
      
      const vendor = await Vendor.findById(vendorId).select('fcmToken firstName lastName');
      
      if (vendor && vendor.fcmToken) {
        const notification = {
          title: '🎯 New Support Ticket Assigned to You',
          body: `${ticket.type}: ${ticket.subject}`
        };

        const data = {
          type: 'support_ticket_assigned',
          ticketId: ticket.ticketId,
          subject: ticket.subject,
          supportType: ticket.supportType,
          priority: ticket.priority,
          customerName: ticket.userName,
          customerEmail: ticket.userEmail,
          customerPhone: ticket.userPhone,
          caseId: ticket.caseId || null,
          scheduledDate: ticket.scheduledDate,
          scheduledTime: ticket.scheduledTime
        };

        const pushResult = await firebasePushService.sendPushNotification(vendor.fcmToken, notification, data);
        
        if (pushResult) {
          logger.info('FCM notification sent to assigned vendor for support ticket', {
            vendorId,
            ticketId: ticket.ticketId,
            vendorName: `${vendor.firstName} ${vendor.lastName}`
          });
        } else {
          logger.warn('Failed to send FCM notification to assigned vendor for support ticket', {
            vendorId,
            ticketId: ticket.ticketId
          });
        }
      } else {
        logger.warn('Vendor has no FCM token for support ticket assignment notification', {
          vendorId,
          ticketId: ticket.ticketId,
          hasFcmToken: !!vendor?.fcmToken
        });
      }
    } catch (fcmError) {
      logger.error('Error sending FCM notification to assigned vendor for support ticket:', {
        vendorId,
        ticketId: ticket.ticketId,
        error: fcmError.message
      });
      // Don't fail the assignment if FCM notification fails
    }


    // Populate vendor data for response
    const populatedTicket = await SupportTicket.findOne({ ticketId: id })
      .populate('assignedTo', 'firstName lastName email phone')
      .populate('assignedBy', 'name email');

    logger.info(`Admin assigned vendor to support ticket: ${ticket.ticketId}`, {
      ticketId: ticket.ticketId,
      vendorId,
      adminId: req.admin._id
    });

    res.json({
      success: true,
      message: 'Vendor assigned to support ticket successfully',
      data: {
        ticket: {
          id: populatedTicket.ticketId,
          subject: populatedTicket.subject,
          status: populatedTicket.status,
          priority: populatedTicket.priority,
          vendorStatus: populatedTicket.vendorStatus,
          assignedTo: populatedTicket.assignedTo ? {
            id: populatedTicket.assignedTo._id,
            name: `${populatedTicket.assignedTo.firstName} ${populatedTicket.assignedTo.lastName}`,
            email: populatedTicket.assignedTo.email,
            phone: populatedTicket.assignedTo.phone
          } : null,
          assignedAt: populatedTicket.assignedAt,
          scheduledDate: populatedTicket.scheduledDate,
          scheduledTime: populatedTicket.scheduledTime,
          scheduleNotes: populatedTicket.scheduleNotes
        }
      }
    });

  } catch (error) {
    logger.error('Error assigning vendor to support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign vendor to support ticket',
      error: error.message
    });
  }
});

// @desc    Update support ticket status/priority (Admin) or reschedule (Vendor)
// @route   PUT /api/admin/support-tickets/:id or PUT /api/support-tickets/vendor/:id
// @access  Private (Admin or Vendor)
const updateSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subject, status, priority, assignedTo, estimatedResolution, tags, scheduledDate, scheduledTime, scheduleNotes, newDate, newTime, reason } = req.body;
  const adminId = req.admin?._id;
  const vendorId = req.vendor?._id;

  console.log('Update support ticket request:', {
    ticketId: id,
    adminId,
    vendorId,
    assignedTo,
    scheduledDate,
    scheduledTime,
    scheduleNotes
  });

  const ticket = await SupportTicket.findOne({ ticketId: id });

  if (!ticket) {
    console.log('Ticket not found:', id);
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  console.log('Found ticket:', {
    ticketId: ticket.ticketId,
    currentAssignedTo: ticket.assignedTo,
    currentVendorStatus: ticket.vendorStatus
  });

  // Handle vendor rescheduling
  if (vendorId && newDate && newTime) {
    // Check if vendor is assigned to this ticket
    if (!ticket.assignedTo || ticket.assignedTo.toString() !== vendorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this ticket'
      });
    }

    // Check if ticket can be rescheduled
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a resolved or closed ticket'
      });
    }

    // Store original scheduling data
    const originalDate = ticket.scheduledDate;
    const originalTime = ticket.scheduledTime;

    // Update with new schedule
    ticket.scheduledDate = new Date(newDate);
    ticket.scheduledTime = newTime;
    ticket.scheduleNotes = reason || 'Rescheduled by vendor';
    
    // Update status to Rescheduled
    ticket.status = 'Rescheduled';

    // Store reschedule data (matching booking task format)
    ticket.rescheduleData = {
      isRescheduled: true,
      originalDate: originalDate,
      originalTime: originalTime,
      rescheduledDate: new Date(newDate),
      rescheduledTime: newTime,
      rescheduleReason: reason || 'Rescheduled by vendor',
      rescheduledAt: new Date(),
      rescheduledBy: 'vendor'
    };

    await ticket.save();

    // Create admin notification for rescheduled ticket
    try {
      const Admin = require('../models/Admin');
      const Vendor = require('../models/Vendor');
      
      // Get vendor details
      const vendor = await Vendor.findById(vendorId).select('firstName lastName email');
      
      // Get all admins to notify them
      const admins = await Admin.find({ isActive: true }).select('name email');
      
      // Create notification for each admin
      for (const admin of admins) {
        try {
          const emailData = {
            to: admin.email,
            subject: `Support Ticket Rescheduled - ${ticket.ticketId}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Support Ticket Rescheduled</title>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                  .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B; }
                  .reschedule-info { background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #F59E0B; }
                  .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                  .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                  .priority-high { background: #fecaca; color: #991b1b; }
                  .priority-medium { background: #fef3c7; color: #92400e; }
                  .priority-low { background: #d1fae5; color: #065f46; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🔄 Support Ticket Rescheduled</h1>
                    <p>A support ticket has been rescheduled by the assigned vendor</p>
                  </div>
                  <div class="content">
                    <h2>Hello ${admin.name},</h2>
                    <p>A support ticket has been rescheduled by the assigned vendor. Please review the details below.</p>
                    
                    <div class="ticket-info">
                      <h3>📋 Ticket Information</h3>
                      <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
                      <p><strong>Subject:</strong> ${ticket.subject}</p>
                      <p><strong>Customer:</strong> ${ticket.userName} (${ticket.userEmail})</p>
                      <p><strong>Priority:</strong> <span class="priority-badge priority-${ticket.priority?.toLowerCase()}">${ticket.priority}</span></p>
                      <p><strong>Status:</strong> <span class="status-badge">${ticket.status}</span></p>
                    </div>

                    <div class="reschedule-info">
                      <h3>🔄 Reschedule Details</h3>
                      <p><strong>Rescheduled by:</strong> ${vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Vendor'}</p>
                      <p><strong>Original Date:</strong> ${originalDate ? new Date(originalDate).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      }) : 'Not set'}</p>
                      <p><strong>Original Time:</strong> ${originalTime || 'Not set'}</p>
                      <p><strong>New Date:</strong> ${new Date(newDate).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}</p>
                      <p><strong>New Time:</strong> ${newTime}</p>
                      <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
                      <p><strong>Rescheduled At:</strong> ${new Date().toLocaleString('en-GB')}</p>
                    </div>

                    <div class="ticket-info">
                      <h3>📝 Description</h3>
                      <p>${ticket.description || 'No description provided'}</p>
                    </div>
                  </div>
                  <div class="footer">
                    <p>This is an automated notification from Fixfly Support System.</p>
                    <p>Please log in to the admin panel to view more details.</p>
                  </div>
                </div>
              </body>
              </html>
            `
          };

          const emailResult = await emailService.sendEmail(emailData);
          
          if (emailResult.success) {
            logger.info(`Admin notification sent for rescheduled ticket: ${ticket.ticketId}`, {
              ticketId: ticket.ticketId,
              adminEmail: admin.email,
              vendorId: vendorId,
              messageId: emailResult.messageId
            });
          } else {
            logger.warn(`Failed to send admin notification for rescheduled ticket: ${ticket.ticketId}`, {
              ticketId: ticket.ticketId,
              adminEmail: admin.email,
              error: emailResult.error
            });
          }
        } catch (emailError) {
          logger.error(`Error sending admin notification for rescheduled ticket: ${ticket.ticketId}`, {
            ticketId: ticket.ticketId,
            adminEmail: admin.email,
            error: emailError.message
          });
        }
      }
    } catch (notificationError) {
      logger.error('Error creating admin notifications for rescheduled ticket:', {
        ticketId: ticket.ticketId,
        vendorId: vendorId,
        error: notificationError.message
      });
      // Don't fail the reschedule if notification fails
    }

    logger.info(`Support ticket rescheduled: ${ticket.ticketId}`, {
      ticketId: ticket.ticketId,
      vendorId: vendorId,
      originalDate: originalDate,
      originalTime: originalTime,
      newDate: newDate,
      newTime: newTime,
      reason: reason
    });

    return res.json({
      success: true,
      message: 'Support ticket rescheduled successfully',
      data: {
        ticketId: ticket.ticketId,
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
  }

  // Store the original assignedTo before any updates
  const originalAssignedTo = ticket.assignedTo;

  // Handle admin updates
  if (adminId) {
    // Update fields
    if (subject) {
      ticket.subject = subject;
    }
    
    if (status) {
      ticket.status = status;
      
      // Set resolvedAt if status is Resolved
      if (status === 'Resolved' && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
        ticket.resolvedBy = adminId;
      }
    }
    
    if (priority) {
      ticket.priority = priority;
    }
    
    if (assignedTo !== undefined) {
      console.log('Processing vendor assignment:', {
        assignedTo,
        currentAssignedTo: ticket.assignedTo,
        originalAssignedTo,
        adminId,
        scheduleNotes
      });
      
      // Use the new assignVendor method for better tracking
      if (assignedTo) {
        console.log('Assigning vendor to ticket...');
        await ticket.assignVendor(assignedTo, adminId, scheduleNotes || '');
        console.log('Vendor assigned successfully');
      } else {
        console.log('Removing vendor assignment...');
        ticket.assignedTo = null;
        ticket.assignedAt = null;
        ticket.assignedBy = null;
        ticket.vendorStatus = 'Pending';
      }
    }
    
    if (estimatedResolution) {
      ticket.estimatedResolution = new Date(estimatedResolution);
    }
    
    if (tags) {
      ticket.tags = tags;
    }
    
    if (scheduledDate) {
      ticket.scheduledDate = new Date(scheduledDate);
    }
    
    if (scheduledTime) {
      ticket.scheduledTime = scheduledTime;
    }
    
    if (scheduleNotes) {
      ticket.scheduleNotes = scheduleNotes;
    }
  }

  console.log('Saving ticket with assignment:', {
    ticketId: ticket.ticketId,
    assignedTo: ticket.assignedTo,
    vendorStatus: ticket.vendorStatus,
    originalAssignedTo
  });

  await ticket.save();

  console.log('Ticket saved successfully');

  // Send email notification to vendor if assigned (new assignment or change)
  if (assignedTo && assignedTo.toString() !== (originalAssignedTo ? originalAssignedTo.toString() : '')) {
    console.log('Sending vendor assignment email:', {
      ticketId: ticket.ticketId,
      assignedTo,
      originalAssignedTo,
      vendorId: assignedTo
    });
    
    try {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findById(assignedTo).select('firstName lastName email');
      
      console.log('Vendor found:', vendor);
      
      if (vendor) {
        const emailData = {
          to: vendor.email,
          subject: `New Support Ticket Assigned - ${ticket.ticketId}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Support Ticket Assignment</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
                .ticket-description { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                .priority-high { background: #fecaca; color: #991b1b; }
                .priority-medium { background: #fef3c7; color: #92400e; }
                .priority-low { background: #d1fae5; color: #065f46; }
                .cta-button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎯 New Support Ticket Assignment</h1>
                  <p>A new support ticket has been assigned to you</p>
                </div>
                <div class="content">
                  <h2>Hello ${vendor.firstName} ${vendor.lastName},</h2>
                  <p>A new support ticket has been assigned to you. Please review the details below and take appropriate action.</p>
                  
                  <div class="ticket-info">
                    <h3>📋 Ticket Information</h3>
                    <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
                    <p><strong>Subject:</strong> ${ticket.subject}</p>
                    <p><strong>Customer:</strong> ${ticket.userName}</p>
                    <p><strong>Customer Email:</strong> ${ticket.userEmail}</p>
                    <p><strong>Customer Phone:</strong> ${ticket.userPhone}</p>
                    <p><strong>Type:</strong> ${ticket.type}</p>
                    <p><strong>Status:</strong> <span class="status-badge">${ticket.status}</span></p>
                    <p><strong>Priority:</strong> <span class="priority-badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span></p>
                    ${ticket.caseId ? `<p><strong>Case ID:</strong> ${ticket.caseId}</p>` : ''}
                    <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleDateString('en-IN')} at ${new Date(ticket.createdAt).toLocaleTimeString('en-IN')}</p>
                    <p><strong>Assigned:</strong> ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
                  </div>

                  <div class="ticket-description">
                    <h3>📝 Customer Issue Description:</h3>
                    <div style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #3B82F6;">${ticket.description}</div>
                  </div>

                  <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
                    <h3 style="color: #0284c7; margin-top: 0;">⚡ Action Required</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                      <li>Contact the customer within 24 hours</li>
                      <li>Review the issue description carefully</li>
                      <li>Schedule a service visit if needed</li>
                      <li>Update the ticket status as you progress</li>
                      <li>Communicate with the customer throughout the process</li>
                    </ul>
                  </div>

                  <p><strong>Customer Contact Information:</strong></p>
                  <p>📧 Email: ${ticket.userEmail}</p>
                  <p>📞 Phone: ${ticket.userPhone}</p>
                  ${ticket.userId?.address ? `<p>📍 Address: ${ticket.userId.address.street || ticket.userId.address}</p>` : ''}
                  ${ticket.userId?.address?.pincode ? `<p>📮 Pincode: ${ticket.userId.address.pincode}</p>` : ''}
                  
                  ${scheduledDate || scheduledTime || scheduleNotes ? `
                  <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                    <h3 style="color: #0ea5e9; margin-top: 0;">📅 Schedule Information</h3>
                    ${scheduledDate ? `<p><strong>Scheduled Date:</strong> ${new Date(scheduledDate).toLocaleDateString('en-IN')}</p>` : ''}
                    ${scheduledTime ? `<p><strong>Scheduled Time:</strong> ${scheduledTime}</p>` : ''}
                    ${scheduleNotes ? `<p><strong>Schedule Notes:</strong><br><em>${scheduleNotes}</em></p>` : ''}
                  </div>
                  ` : ''}
                  
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/dashboard" class="cta-button">
                    View in Dashboard
                  </a>
                </div>
                <div class="footer">
                  <p>Best regards,<br>The Fixfly Support Team</p>
                  <p>This is an automated assignment notification. Please do not reply directly to this email.</p>
                  <p>For any questions about this assignment, please contact the admin team.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
            New Support Ticket Assignment - Fixfly
            
            Hello ${vendor.firstName} ${vendor.lastName},
            
            A new support ticket has been assigned to you. Please review the details below and take appropriate action.
            
            Ticket Information:
            - Ticket ID: ${ticket.ticketId}
            - Subject: ${ticket.subject}
            - Customer: ${ticket.userName}
            - Customer Email: ${ticket.userEmail}
            - Customer Phone: ${ticket.userPhone}
            - Type: ${ticket.type}
            - Status: ${ticket.status}
            - Priority: ${ticket.priority}
            ${ticket.caseId ? `- Case ID: ${ticket.caseId}` : ''}
            - Created: ${new Date(ticket.createdAt).toLocaleDateString('en-IN')} at ${new Date(ticket.createdAt).toLocaleTimeString('en-IN')}
            - Assigned: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}
            
            Customer Issue Description:
            ${ticket.description}
            
            Action Required:
            - Contact the customer within 24 hours
            - Review the issue description carefully
            - Schedule a service visit if needed
            - Update the ticket status as you progress
            - Communicate with the customer throughout the process
            
            Customer Contact Information:
            Email: ${ticket.userEmail}
            Phone: ${ticket.userPhone}
            ${ticket.userId?.address ? `Address: ${ticket.userId.address.street || ticket.userId.address}` : ''}
            ${ticket.userId?.address?.pincode ? `Pincode: ${ticket.userId.address.pincode}` : ''}
            
            ${scheduledDate || scheduledTime || scheduleNotes ? `
            Schedule Information:
            ${scheduledDate ? `Scheduled Date: ${new Date(scheduledDate).toLocaleDateString('en-IN')}` : ''}
            ${scheduledTime ? `Scheduled Time: ${scheduledTime}` : ''}
            ${scheduleNotes ? `Schedule Notes: ${scheduleNotes}` : ''}
            ` : ''}
            
            View in Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/dashboard
            
            Best regards,
            The Fixfly Support Team
            
            This is an automated assignment notification. Please do not reply directly to this email.
          `
        };

        const emailResult = await emailService.sendEmail(emailData);
        
        console.log('Email result:', emailResult);
        
        if (emailResult.success) {
          logger.info(`Vendor assignment notification sent: ${ticket.ticketId}`, {
            ticketId: ticket.ticketId,
            vendorEmail: vendor.email,
            vendorId: assignedTo,
            messageId: emailResult.messageId
          });
        } else {
          logger.warn(`Failed to send vendor assignment notification: ${ticket.ticketId}`, {
            ticketId: ticket.ticketId,
            vendorEmail: vendor.email,
            error: emailResult.error
          });
        }
      } else {
        console.log('Vendor not found with ID:', assignedTo);
        logger.warn(`Vendor not found for assignment: ${ticket.ticketId}`, {
          ticketId: ticket.ticketId,
          vendorId: assignedTo
        });
      }
    } catch (emailError) {
      logger.error(`Error sending vendor assignment notification: ${ticket.ticketId}`, {
        ticketId: ticket.ticketId,
        vendorId: assignedTo,
        error: emailError.message
      });
      // Don't fail the ticket update if email fails
    }

    // Send FCM notification to assigned vendor
    try {
      const firebasePushService = require('../services/firebasePushService');
      const Vendor = require('../models/Vendor');
      
      const vendor = await Vendor.findById(assignedTo).select('fcmToken firstName lastName');
      
      if (vendor && vendor.fcmToken) {
        const notification = {
          title: '🎯 New Support Ticket Assigned to You',
          body: `${ticket.type}: ${ticket.subject}`
        };

        const data = {
          type: 'support_ticket_assigned',
          ticketId: ticket.ticketId,
          subject: ticket.subject,
          supportType: ticket.supportType,
          priority: ticket.priority,
          customerName: ticket.userName,
          customerEmail: ticket.userEmail,
          customerPhone: ticket.userPhone,
          caseId: ticket.caseId || null,
          scheduledDate: ticket.scheduledDate,
          scheduledTime: ticket.scheduledTime
        };

        const pushResult = await firebasePushService.sendPushNotification(vendor.fcmToken, notification, data);
        
        if (pushResult) {
          logger.info('FCM notification sent to assigned vendor for support ticket update', {
            vendorId: assignedTo,
            ticketId: ticket.ticketId,
            vendorName: `${vendor.firstName} ${vendor.lastName}`
          });
        } else {
          logger.warn('Failed to send FCM notification to assigned vendor for support ticket update', {
            vendorId: assignedTo,
            ticketId: ticket.ticketId
          });
        }
      } else {
        logger.warn('Vendor has no FCM token for support ticket assignment notification (update)', {
          vendorId: assignedTo,
          ticketId: ticket.ticketId,
          hasFcmToken: !!vendor?.fcmToken
        });
      }
    } catch (fcmError) {
      logger.error('Error sending FCM notification to assigned vendor for support ticket update:', {
        vendorId: assignedTo,
        ticketId: ticket.ticketId,
        error: fcmError.message
      });
      // Don't fail the ticket update if FCM notification fails
    }
  }

  logger.info(`Support ticket ${ticket.ticketId} updated by admin: ${adminId}`);

  res.json({
    success: true,
    message: 'Support ticket updated successfully',
    data: {
      ticket: {
        id: ticket.ticketId,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedTo,
        estimatedResolution: ticket.estimatedResolution,
        tags: ticket.tags
      }
    }
  });
});

// @desc    Add admin response to support ticket
// @route   POST /api/admin/support-tickets/:id/response
// @access  Private (Admin)
const addAdminResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message, isInternal = false } = req.body;
  const adminId = req.admin._id;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Response message is required'
    });
  }

  const ticket = await SupportTicket.findOne({ ticketId: id });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  // Get admin details
  const admin = await Admin.findById(adminId).select('name');
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  await ticket.addResponse(
    message.trim(),
    'admin',
    adminId,
    admin.name,
    isInternal
  );

  // Send email notification to user (only if not internal)
  console.log('Admin response - isInternal:', isInternal, 'userEmail:', ticket.userEmail);
  if (!isInternal) {
    try {
      console.log('Attempting to send email notification...');
      const emailData = {
        to: ticket.userEmail,
        subject: `Response to Your Support Ticket #${ticket.ticketId}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Support Ticket Response</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
              .response-content { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
              .status-submitted { background: #fef3c7; color: #92400e; }
              .status-progress { background: #dbeafe; color: #1e40af; }
              .status-waiting { background: #fce7f3; color: #be185d; }
              .status-resolved { background: #d1fae5; color: #065f46; }
              .status-closed { background: #f3f4f6; color: #374151; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📧 Support Ticket Response</h1>
                <p>We have responded to your support request</p>
              </div>
              <div class="content">
                <h2>Hello ${ticket.userName},</h2>
                <p>Thank you for contacting Fixfly support. We have received your ticket and our team has responded.</p>
                
                <div class="ticket-info">
                  <h3>Ticket Information</h3>
                  <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
                  <p><strong>Subject:</strong> ${ticket.subject}</p>
                  <p><strong>Status:</strong> <span class="status-badge status-${ticket.status.toLowerCase().replace(' ', '')}">${ticket.status}</span></p>
                  <p><strong>Priority:</strong> ${ticket.priority}</p>
                  <p><strong>Support Type:</strong> ${ticket.supportType}</p>
                  <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleDateString('en-IN')}</p>
                </div>

                <div class="response-content">
                  <h3>Our Response:</h3>
                  <div style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #3B82F6;">${message.trim()}</div>
                  <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
                    <strong>Responded by:</strong> ${admin.name} (Fixfly Support Team)<br>
                    <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}
                  </p>
                </div>

                <p>If you need further assistance or have additional questions, please reply to this ticket through your Fixfly account or contact our support team.</p>
                
                <p>We appreciate your patience and look forward to resolving your concern.</p>
              </div>
              <div class="footer">
                <p>Best regards,<br>The Fixfly Support Team</p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
                <p>To view your ticket or submit a new one, please visit: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support">Fixfly Support</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Support Ticket Response - Fixfly
          
          Hello ${ticket.userName},
          
          We have responded to your support ticket #${ticket.ticketId}.
          
          Ticket Information:
          - Ticket ID: ${ticket.ticketId}
          - Subject: ${ticket.subject}
          - Status: ${ticket.status}
          - Priority: ${ticket.priority}
          - Support Type: ${ticket.supportType}
          - Created: ${new Date(ticket.createdAt).toLocaleDateString('en-IN')}
          
          Our Response:
          ${message.trim()}
          
          Responded by: ${admin.name} (Fixfly Support Team)
          Date: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}
          
          If you need further assistance, please reply to this ticket through your Fixfly account.
          
          Best regards,
          The Fixfly Support Team
          
          To view your ticket: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/support
        `
      };

      const emailResult = await emailService.sendEmail(emailData);
      console.log('Email sending result:', emailResult);
      
      if (emailResult.success) {
        logger.info(`Email notification sent for ticket response: ${ticket.ticketId}`, {
          ticketId: ticket.ticketId,
          userEmail: ticket.userEmail,
          adminId: adminId,
          messageId: emailResult.messageId
        });
      } else {
        logger.warn(`Failed to send email notification for ticket: ${ticket.ticketId}`, {
          ticketId: ticket.ticketId,
          userEmail: ticket.userEmail,
          error: emailResult.error
        });
      }
    } catch (emailError) {
      logger.error(`Error sending email notification for ticket: ${ticket.ticketId}`, {
        ticketId: ticket.ticketId,
        userEmail: ticket.userEmail,
        error: emailError.message
      });
      // Don't fail the response if email fails
    }
  }

  logger.info(`Admin response added to ticket: ${ticket.ticketId} by admin: ${adminId}`);

  res.json({
    success: true,
    message: 'Response added successfully',
    data: {
      ticket: {
        id: ticket.ticketId,
        status: ticket.status,
        lastUpdate: ticket.lastUpdate,
        responses: ticket.responseCount
      }
    }
  });
});

// @desc    Resolve support ticket
// @route   POST /api/admin/support-tickets/:id/resolve
// @access  Private (Admin)
const resolveSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolution } = req.body;
  const adminId = req.admin._id;

  if (!resolution || !resolution.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Resolution details are required'
    });
  }

  const ticket = await SupportTicket.findOne({ ticketId: id });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  await ticket.resolveTicket(resolution.trim(), adminId);

  logger.info(`Support ticket ${ticket.ticketId} resolved by admin: ${adminId}`);

  res.json({
    success: true,
    message: 'Support ticket resolved successfully',
    data: {
      ticket: {
        id: ticket.ticketId,
        status: ticket.status,
        resolution: ticket.resolution,
        resolvedAt: ticket.resolvedAt
      }
    }
  });
});

// @desc    Get support ticket statistics
// @route   GET /api/admin/support-tickets/stats
// @access  Private (Admin)
const getSupportTicketStats = asyncHandler(async (req, res) => {
  const totalTickets = await SupportTicket.countDocuments();
  const openTickets = await SupportTicket.countDocuments({ 
    status: { $nin: ['Resolved', 'Closed'] } 
  });
  const resolvedTickets = await SupportTicket.countDocuments({ 
    status: 'Resolved' 
  });
  const closedTickets = await SupportTicket.countDocuments({ 
    status: 'Closed' 
  });

  // Calculate average response time (simplified)
  const ticketsWithResponses = await SupportTicket.find({ 
    responseCount: { $gt: 0 } 
  }).select('createdAt lastResponseAt');

  let avgResponseTime = 0;
  if (ticketsWithResponses.length > 0) {
    const totalResponseTime = ticketsWithResponses.reduce((sum, ticket) => {
      const responseTime = ticket.lastResponseAt - ticket.createdAt;
      return sum + responseTime;
    }, 0);
    avgResponseTime = Math.round(totalResponseTime / ticketsWithResponses.length / (1000 * 60 * 60)); // in hours
  }

  res.json({
    success: true,
    data: {
      stats: {
        totalTickets,
        openTickets,
        resolvedTickets,
        closedTickets,
        avgResponseTime: `${avgResponseTime} hours`
      }
    }
  });
});

// @desc    Get support tickets assigned to vendor
// @route   GET /api/vendor/support-tickets
// @access  Private (Vendor)
const getVendorSupportTickets = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  console.log('Fetching support tickets for vendor:', vendorId);
  
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = { assignedTo: vendorId };
  
  console.log('Filter for vendor support tickets:', filter);
  
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
      { caseId: { $regex: search, $options: 'i' } },
      { subscriptionId: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tickets = await SupportTicket.find(filter)
    .populate('userId', 'name email phone address')
    .populate('assignedTo', 'firstName lastName email phone')
    .select('-responses') // Exclude responses for list view
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const totalTickets = await SupportTicket.countDocuments(filter);
  
  console.log('Found support tickets for vendor:', {
    vendorId,
    ticketsFound: tickets.length,
    totalTickets,
    filter
  });

  const formattedTickets = tickets.map(ticket => ({
    id: ticket.ticketId,
    customerName: ticket.userName,
    customerEmail: ticket.userEmail,
    customerPhone: ticket.userPhone,
    address: ticket.userId?.address?.street || ticket.userId?.address || 'Not provided',
    street: ticket.userId?.address?.street || 'Not provided',
    city: ticket.userId?.address?.city || 'Not provided',
    state: ticket.userId?.address?.state || 'Not provided',
    pincode: ticket.userId?.address?.pincode || 'Not provided',
    landmark: ticket.userId?.address?.landmark || 'Not provided',
    userId: ticket.userId, // Include full user object for address access
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
    assignedBy: ticket.assignedBy,
    vendorAcceptedAt: ticket.vendorAcceptedAt,
    vendorDeclinedAt: ticket.vendorDeclinedAt,
    vendorDeclineReason: ticket.vendorDeclineReason,
    vendorCompletedAt: ticket.vendorCompletedAt,
    assignedVendor: ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : null,
    vendorAssignmentHistory: ticket.vendorAssignmentHistory,
    vendorCommunications: ticket.vendorCommunications,
    vendorPerformance: ticket.vendorPerformance,
    completionData: ticket.completionData
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

// @desc    Get a single support ticket by ID for vendor
// @route   GET /api/support-tickets/vendor/:id
// @access  Private (Vendor)
const getVendorSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.vendor._id;

  console.log('Fetching support ticket for vendor:', { ticketId: id, vendorId });

  const ticket = await SupportTicket.findOne({ ticketId: id })
    .populate('userId', 'firstName lastName email phone address')
    .populate('assignedTo', 'firstName lastName email phone serviceCategories')
    .populate('assignedBy', 'name email');

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  // Check if vendor is assigned to this ticket
  if (!ticket.assignedTo || ticket.assignedTo._id.toString() !== vendorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this ticket'
    });
  }

  // Format the ticket data
  const formattedTicket = {
    id: ticket.ticketId,
    caseId: ticket.caseId,
    subject: ticket.subject,
    description: ticket.description,
    supportType: ticket.supportType,
    type: ticket.type,
    status: ticket.status,
    priority: ticket.priority,
    vendorStatus: ticket.vendorStatus || 'Pending',
    created: ticket.formattedCreatedAt,
    lastUpdate: ticket.lastUpdate,
    responses: ticket.responseCount,
    scheduledDate: ticket.scheduledDate,
    scheduledTime: ticket.scheduledTime,
    scheduleNotes: ticket.scheduleNotes,
    assignedAt: ticket.assignedAt,
    assignedBy: ticket.assignedBy,
    vendorAcceptedAt: ticket.vendorAcceptedAt,
    vendorDeclinedAt: ticket.vendorDeclinedAt,
    vendorDeclineReason: ticket.vendorDeclineReason,
    vendorCompletedAt: ticket.vendorCompletedAt,
    assignedVendor: ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : null,
    vendorAssignmentHistory: ticket.vendorAssignmentHistory,
    vendorCommunications: ticket.vendorCommunications,
    vendorPerformance: ticket.vendorPerformance,
    completionData: ticket.completionData,
    rescheduleData: ticket.rescheduleData,
    rescheduleInfo: ticket.rescheduleInfo,
    // Customer information
    customerName: ticket.userId ? `${ticket.userId.firstName} ${ticket.userId.lastName}` : 'Unknown',
    customerEmail: ticket.userId?.email || 'Unknown',
    customerPhone: ticket.userId?.phone || 'Unknown',
    customerAddress: ticket.userId?.address || null,
    // Address details
    street: ticket.userId?.address?.street || ticket.street || null,
    city: ticket.userId?.address?.city || ticket.city || null,
    state: ticket.userId?.address?.state || ticket.state || null,
    pincode: ticket.userId?.address?.pincode || ticket.pincode || null,
    landmark: ticket.userId?.address?.landmark || ticket.landmark || null,
    // User ID for reference
    userId: ticket.userId
  };

  res.json({
    success: true,
    data: {
      ticket: formattedTicket
    }
  });
});

// @desc    Vendor accepts a support ticket
// @route   PUT /api/vendor/support-tickets/:id/accept
// @access  Private (Vendor)
const acceptSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.vendor._id;

  const ticket = await SupportTicket.findOne({ ticketId: id });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  // Check if vendor is assigned to this ticket
  if (!ticket.assignedTo || ticket.assignedTo.toString() !== vendorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this ticket'
    });
  }

  // Check mandatory deposit requirement
  const Vendor = require('../models/Vendor');
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  if (!vendor.canAcceptNewTasks()) {
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

  // Use the new acceptByVendor method
  await ticket.acceptByVendor(vendorId);
  ticket.status = 'In Progress';
  await ticket.save();

  res.json({
    success: true,
    message: 'Support ticket accepted successfully',
    data: {
      ticketId: ticket.ticketId,
      vendorStatus: ticket.vendorStatus,
      status: ticket.status
    }
  });
});

// @desc    Vendor declines a support ticket
// @route   PUT /api/vendor/support-tickets/:id/decline
// @access  Private (Vendor)
const declineSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const vendorId = req.vendor._id;

  const ticket = await SupportTicket.findOne({ ticketId: id });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  // Check if vendor is assigned to this ticket
  if (!ticket.assignedTo || ticket.assignedTo.toString() !== vendorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this ticket'
    });
  }

  // Use the new declineByVendor method (includes penalty application)
  await ticket.declineByVendor(vendorId, reason || '');

  res.json({
    success: true,
    message: 'Support ticket declined successfully. ₹100 penalty has been applied to your wallet.',
    data: {
      ticketId: ticket.ticketId,
      vendorStatus: ticket.vendorStatus
    },
    penalty: {
      applied: true,
      amount: 100,
      reason: 'Task rejection in vendor area'
    }
  });
});

// @desc    Vendor completes a support ticket
// @route   PUT /api/vendor/support-tickets/:id/complete
// @access  Private (Vendor)
const completeSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolution, completionData } = req.body;
  const vendorId = req.vendor._id;

  const ticket = await SupportTicket.findOne({ ticketId: id });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  // Check if vendor is assigned to this ticket
  if (!ticket.assignedTo || ticket.assignedTo.toString() !== vendorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this ticket'
    });
  }

  // Handle both simple resolution and complex completion data
  let resolutionText = resolution || 'Task completed by vendor';
  let spareParts = [];
  let paymentMethod = 'cash';
  let totalAmount = 0;
  let includeGST = false;
  let gstAmount = 0;
  let billingAmount = 0;

  if (completionData) {
    // Complex completion data (matching booking task format)
    console.log('🔧 COMPLETION DEBUG: Support ticket completion data received:', completionData);
    resolutionText = completionData.resolutionNote || resolutionText;
    spareParts = completionData.spareParts || [];
    paymentMethod = completionData.paymentMethod || 'cash';
    totalAmount = completionData.totalAmount || 0;
    includeGST = completionData.includeGST || false;
    gstAmount = completionData.gstAmount || 0;
    billingAmount = completionData.billingAmount || 0;
    console.log('🔧 COMPLETION DEBUG: Extracted values:', {
      paymentMethod,
      billingAmount,
      totalAmount,
      includeGST,
      sparePartsCount: spareParts.length
    });
  }

  // Use the new completeByVendor method (payment info is handled in the model)
  await ticket.completeByVendor(vendorId, completionData);

  // Handle vendor wallet operations based on payment method
  try {
    console.log('🔧 WALLET DEBUG: Starting vendor wallet operations...');
    console.log('🔧 WALLET DEBUG: Payment method:', paymentMethod);
    console.log('🔧 WALLET DEBUG: Billing amount:', billingAmount);
    console.log('🔧 WALLET DEBUG: Spare parts:', spareParts);
    console.log('🔧 WALLET DEBUG: GST included:', includeGST);
    
    const VendorWallet = require('../models/VendorWallet');
    const WalletCalculationService = require('../services/walletCalculationService');
    
    const parsedBillingAmount = parseFloat(billingAmount) || 0;
    const spareAmount = spareParts?.reduce((sum, part) => {
      return sum + (parseFloat(part.amount.replace(/[₹,]/g, '')) || 0);
    }, 0) || 0;
    const travellingAmount = parseFloat(completionData?.travelingAmount || completionData?.travellingAmount || '0') || 0;
    
    console.log('🔧 WALLET DEBUG: Calculated amounts:', {
      billingAmount: parsedBillingAmount,
      spareAmount,
      travellingAmount
    });
    
  const vendorWallet = await VendorWallet.findOne({ vendorId: req.vendor.vendorId });
  console.log('🔧 WALLET DEBUG: Vendor wallet found:', !!vendorWallet);
  console.log('🔧 WALLET DEBUG: Current balance:', vendorWallet?.currentBalance);
  console.log('🔧 WALLET DEBUG: Vendor ID:', req.vendor.vendorId);
  console.log('🔧 WALLET DEBUG: Vendor ID type:', typeof req.vendor.vendorId);
    
    if (vendorWallet) {
      if (paymentMethod === 'cash') {
        // Handle cash collection deduction
        const calculation = WalletCalculationService.calculateCashCollectionDeduction({
          billingAmount: parsedBillingAmount,
          spareAmount,
          travellingAmount,
          gstIncluded: includeGST || false
        });
        
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
        
        console.log('🔧 WALLET DEBUG: About to call addCashCollectionDeduction with:', {
          caseId: ticket.ticketId,
          billingAmount: parsedBillingAmount,
          spareAmount,
          travellingAmount,
          gstIncluded: includeGST || false
        });
        
        const deductionResult = await vendorWallet.addCashCollectionDeduction({
          caseId: ticket.ticketId,
          billingAmount: parsedBillingAmount,
          spareAmount,
          travellingAmount,
          gstIncluded: includeGST || false,
          description: `Support ticket cash collection - ${ticket.ticketId}`
        });
        
        console.log('🔧 WALLET DEBUG: Cash collection deduction result:', deductionResult);
        
        logger.info('Support ticket cash collection deducted from vendor wallet', {
          vendorId: vendorId,
          ticketId: ticket.ticketId,
          deductionAmount: calculation.calculatedAmount,
          billingAmount: parsedBillingAmount,
          spareAmount
        });
      } else if (paymentMethod === 'online') {
        console.log('🔧 WALLET DEBUG: Online payment detected - vendor wallet will be credited after payment verification');
        // For online payments, don't credit wallet immediately
        // Wallet will be credited after payment verification via /api/support-tickets/payment/verify
        console.log('🔧 WALLET DEBUG: Skipping immediate wallet credit for online payment');
        console.log('🔧 WALLET DEBUG: Vendor earning will be processed after user payment verification');
      } else {
        console.log('🔧 WALLET DEBUG: Unknown payment method:', paymentMethod);
      }
    }
  } catch (error) {
    logger.error('Error updating vendor wallet for support ticket completion:', {
      error: error.message,
      stack: error.stack,
      vendorId: req.vendor.vendorId,
      ticketId: ticket.ticketId,
      paymentMethod,
      billingAmount: parsedBillingAmount,
      spareAmount,
      travellingAmount
    });
    
    // Return error response if wallet update fails for cash payments
    if (paymentMethod === 'cash') {
      return res.status(500).json({
        success: false,
        message: 'Failed to process wallet deduction. Please contact support.',
        error: 'WALLET_DEDUCTION_FAILED',
        details: error.message
      });
    }
    // For online payments, don't fail the completion since wallet will be credited after payment
  }

  res.json({
    success: true,
    message: 'Support ticket completed successfully',
    data: {
      ticketId: ticket.ticketId,
      vendorStatus: ticket.vendorStatus,
      status: ticket.status,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod
    }
  });
});

// @desc    Verify support ticket payment and credit vendor wallet
// @route   POST /api/support-tickets/payment/verify
// @access  Public
const verifySupportTicketPayment = asyncHandler(async (req, res) => {
  try {
    const { ticketId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!ticketId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'All payment verification fields are required'
      });
    }

    // Find the support ticket
    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
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

    logger.info('Support ticket payment verification attempt', {
      ticketId,
      razorpayOrderId,
      razorpayPaymentId,
      expectedSignature: expectedSignature.substring(0, 10) + '...',
      receivedSignature: razorpaySignature.substring(0, 10) + '...'
    });

    if (expectedSignature !== razorpaySignature) {
      logger.error('Support ticket payment signature verification failed', {
        ticketId,
        expectedSignature: expectedSignature.substring(0, 10) + '...',
        receivedSignature: razorpaySignature.substring(0, 10) + '...'
      });
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update ticket payment status and mark as resolved
    ticket.paymentStatus = 'collected';
    ticket.status = 'Resolved';
    ticket.resolvedAt = new Date();
    ticket.paymentDetails = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paidAt: new Date()
    };
    await ticket.save();

    logger.info('Support ticket payment verified and status updated to Resolved', {
      ticketId,
      status: ticket.status,
      paymentStatus: ticket.paymentStatus,
      resolvedAt: ticket.resolvedAt
    });

    // Credit vendor wallet after payment verification
    if (ticket.assignedTo) {
      try {
        const VendorWallet = require('../models/VendorWallet');
        // Get vendor details first to get the vendorId string
        const Vendor = require('../models/Vendor');
        const vendor = await Vendor.findById(ticket.assignedTo);
        if (!vendor) {
          logger.error('Vendor not found for ticket assignment:', ticket.assignedTo);
          return;
        }
        
        const vendorWallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });
        
        if (vendorWallet && ticket.completionData) {
          // Check if earning already exists for this ticket
          const existingEarning = vendorWallet.transactions.find(t => 
            t.caseId === ticket.ticketId && 
            t.type === 'earning' && 
            t.paymentMethod === 'online'
          );

          if (existingEarning) {
            logger.info('Earning already exists for ticket, skipping duplicate credit', {
              ticketId: ticket.ticketId,
              existingAmount: existingEarning.amount
            });
            return;
          }

          const completionData = ticket.completionData;
          const billingAmount = parseFloat(completionData.billingAmount) || 0;
          const spareAmount = completionData.spareParts?.reduce((sum, part) => {
            return sum + (parseFloat(part.amount.replace(/[₹,]/g, '')) || 0);
          }, 0) || 0;
          const travellingAmount = parseFloat(completionData.travelingAmount || completionData.travellingAmount || '0') || 0;
          
          console.log('🔧 PAYMENT VERIFICATION: Crediting vendor wallet after payment verification', {
            ticketId,
            vendorId: ticket.assignedTo,
            billingAmount,
            spareAmount,
            travellingAmount
          });
          
          const earningResult = await vendorWallet.addEarning({
            caseId: ticket.ticketId,
            billingAmount,
            spareAmount,
            travellingAmount,
            bookingAmount: 0,
            paymentMethod: 'online',
            gstIncluded: completionData.includeGST || false,
            description: `Support ticket payment verified earning - ${ticket.ticketId}`
          });
          
          console.log('🔧 PAYMENT VERIFICATION: Vendor earning added to wallet', {
            ticketId,
            vendorId: ticket.assignedTo,
            earningAmount: earningResult.amount,
            newBalance: vendorWallet.currentBalance
          });
          
          logger.info('Support ticket vendor earning added to wallet after payment verification', {
            ticketId,
            vendorId: ticket.assignedTo,
            earningAmount: earningResult.amount,
            billingAmount,
            spareAmount
          });
        }
      } catch (error) {
        logger.error('Error crediting vendor wallet after support ticket payment verification:', error);
        // Don't fail the payment verification if wallet update fails
      }
    }

    // Update ticket status to Resolved after successful payment verification
    ticket.status = 'Resolved';
    ticket.paymentStatus = 'collected';
    ticket.resolvedAt = new Date();
    await ticket.save();

    console.log('🔧 PAYMENT VERIFICATION: Ticket status updated to Resolved', {
      ticketId,
      status: ticket.status,
      paymentStatus: ticket.paymentStatus
    });

    logger.info('Support ticket payment verified successfully', {
      ticketId,
      razorpayOrderId,
      razorpayPaymentId
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        ticketId: ticket.ticketId,
        status: ticket.status,
        paymentStatus: ticket.paymentStatus
      }
    });

  } catch (error) {
    logger.error('Support ticket payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during payment verification'
    });
  }
});

// @desc    Vendor cancels a support ticket
// @route   PUT /api/vendor/support-tickets/:id/cancel
// @access  Private (Vendor)
const cancelSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const vendorId = req.vendor._id;

  if (!reason || !reason.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Cancellation reason is required'
    });
  }

  const ticket = await SupportTicket.findOne({ ticketId: id });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  // Check if vendor is assigned to this ticket
  if (!ticket.assignedTo || ticket.assignedTo.toString() !== vendorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this ticket'
    });
  }

  // Check if ticket can be cancelled
  if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel a resolved or closed ticket'
    });
  }

  // Get vendor name for cancellation data
  const Vendor = require('../models/Vendor');
  const vendor = await Vendor.findById(vendorId);
  const vendorName = vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Unknown Vendor';

  // Use the new cancelByVendor method
  await ticket.cancelByVendor(vendorId, reason.trim());
  
  // Update cancellation data with vendor name
  ticket.cancellationData.cancelledByVendor.vendorName = vendorName;
  await ticket.save();

  res.json({
    success: true,
    message: 'Support ticket cancelled successfully',
    data: {
      ticketId: ticket.ticketId,
      vendorStatus: ticket.vendorStatus,
      status: ticket.status,
      cancellationInfo: {
        reason: reason.trim(),
        cancelledAt: new Date(),
        cancelledBy: 'vendor',
        vendorName: vendorName
      }
    }
  });
});

// @desc    Send invoice via email
// @route   POST /api/support-tickets/send-invoice
// @access  Private (User)
const sendInvoiceEmail = asyncHandler(async (req, res) => {
  try {
    const { ticketId, customerEmail, customerName, amount, subject } = req.body;
    const userId = req.user.userId || req.user._id;

    // Find the ticket
    const ticket = await SupportTicket.findOne({ ticketId, userId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Create invoice content
    const invoiceContent = `
      FIXFLY INVOICE
      ===============
      
      Invoice No: INV-${ticketId}
      Date: ${new Date().toLocaleDateString()}
      
      BILL TO:
      ${customerName}
      ${customerEmail}
      
      SERVICE DETAILS:
      Ticket ID: ${ticketId}
      Case ID: ${ticket.caseId || 'N/A'}
      Subject: ${subject}
      Service Date: ${ticket.formattedCreatedAt}
      Completion Date: ${ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : 'N/A'}
      
      PAYMENT DETAILS:
      Payment Mode: ${ticket.paymentMode || 'N/A'}
      Status: ${ticket.status}
      
      AMOUNT:
      Service Amount: ₹${amount}
      
      TOTAL AMOUNT: ₹${amount}
      
      Thank you for using FixFly services!
      
      For any queries, contact us at support@fixfly.com
    `;

    // Send email using email service
    console.log('Invoice email content:', invoiceContent);
    console.log('Sending invoice to:', customerEmail);

    try {
      const emailResult = await emailService.sendInvoiceEmail(
        customerEmail,
        `FixFly Invoice - ${ticketId}`,
        invoiceContent,
        ticketId
      );
      
      if (emailResult.success) {
        console.log('Invoice email sent successfully:', emailResult.messageId);
      } else {
        console.error('Failed to send invoice email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending invoice email:', emailError);
    }

    res.json({
      success: true,
      message: 'Invoice sent successfully',
      data: {
        ticketId,
        customerEmail,
        invoiceContent
      }
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice email',
      error: error.message
    });
  }
});

module.exports = {
  createSupportTicket,
  getUserSupportTickets,
  getSupportTicket,
  addTicketResponse,
  getAllSupportTickets,
  getAdminSupportTicket,
  updateSupportTicket,
  addAdminResponse,
  resolveSupportTicket,
  getSupportTicketStats,
  getVendorSupportTickets,
  getVendorSupportTicket,
  acceptSupportTicket,
  declineSupportTicket,
  completeSupportTicket,
  cancelSupportTicket,
  assignVendorToSupportTicket,
  sendInvoiceEmail,
  verifySupportTicketPayment
};
