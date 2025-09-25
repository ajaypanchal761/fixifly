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
              <p>Thank you for contacting Fixifly Support</p>
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
                  <li>You can track your ticket status anytime through your Fixifly account</li>
                </ul>
              </div>

              <p><strong>Need immediate assistance?</strong> For urgent matters, please call our customer support hotline.</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support" class="cta-button">
                View Your Tickets
              </a>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Fixifly Support Team</p>
              <p>This is an automated confirmation. Please do not reply directly to this email.</p>
              <p>For any queries, please contact us through your Fixifly account or visit our support center.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Support Ticket Submitted Successfully - Fixifly
        
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
        - You can track your ticket status anytime through your Fixifly account
        
        Need immediate assistance? For urgent matters, please call our customer support hotline.
        
        View your tickets: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/support
        
        Best regards,
        The Fixifly Support Team
        
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
    .select('ticketId subject type status priority createdAt lastResponseAt responseCount caseId')
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
    caseId: ticket.caseId
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
      { caseId: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tickets = await SupportTicket.find(filter)
    .populate('assignedTo', 'name email')
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
    assignedTo: ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned',
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
    vendorPerformance: ticket.vendorPerformance
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
    .populate('assignedTo', 'name email')
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
        assignedTo: ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned',
        estimatedResolution: ticket.estimatedResolution,
        tags: ticket.tags,
        resolution: ticket.resolution,
        resolvedAt: ticket.resolvedAt,
        resolvedBy: ticket.resolvedBy ? ticket.resolvedBy.name : null,
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
                  <p>Best regards,<br>The Fixifly Support Team</p>
                  <p>This is an automated assignment notification. Please do not reply directly to this email.</p>
                  <p>For any questions about this assignment, please contact the admin team.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
            New Support Ticket Assignment - Fixifly
            
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
            The Fixifly Support Team
            
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
  if (!isInternal) {
    try {
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
                <p>Thank you for contacting Fixifly support. We have received your ticket and our team has responded.</p>
                
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
                    <strong>Responded by:</strong> ${admin.name} (Fixifly Support Team)<br>
                    <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}
                  </p>
                </div>

                <p>If you need further assistance or have additional questions, please reply to this ticket through your Fixifly account or contact our support team.</p>
                
                <p>We appreciate your patience and look forward to resolving your concern.</p>
              </div>
              <div class="footer">
                <p>Best regards,<br>The Fixifly Support Team</p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
                <p>To view your ticket or submit a new one, please visit: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support">Fixifly Support</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Support Ticket Response - Fixifly
          
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
          
          Responded by: ${admin.name} (Fixifly Support Team)
          Date: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}
          
          If you need further assistance, please reply to this ticket through your Fixifly account.
          
          Best regards,
          The Fixifly Support Team
          
          To view your ticket: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/support
        `
      };

      const emailResult = await emailService.sendEmail(emailData);
      
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

  // Use the new declineByVendor method
  await ticket.declineByVendor(vendorId, reason || '');

  res.json({
    success: true,
    message: 'Support ticket declined successfully',
    data: {
      ticketId: ticket.ticketId,
      vendorStatus: ticket.vendorStatus
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

  if (completionData) {
    // Complex completion data (matching booking task format)
    resolutionText = completionData.resolutionNote || resolutionText;
    spareParts = completionData.spareParts || [];
    paymentMethod = completionData.paymentMethod || 'cash';
    totalAmount = completionData.totalAmount || 0;
    includeGST = completionData.includeGST || false;
    gstAmount = completionData.gstAmount || 0;
  }

  // Use the new completeByVendor method
  await ticket.completeByVendor(vendorId, completionData);

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
  acceptSupportTicket,
  declineSupportTicket,
  completeSupportTicket,
  cancelSupportTicket
};
