const { logger } = require('../utils/logger');
const emailService = require('./emailService');
const smsService = require('./smsService');

/**
 * Notification Service - Email/SMS Only
 * Handles vendor notifications via email and SMS instead of push notifications
 */
class NotificationService {
  constructor() {
    this.serviceName = 'Email/SMS Notification Service';
  }

  /**
   * Send task assignment notification to vendor via email and SMS
   * @param {string} vendorId - Vendor ID
   * @param {Object} taskData - Task data (ticket or booking)
   * @param {string} taskType - 'support_ticket' or 'booking'
   */
  async sendTaskAssignmentNotification(vendorId, taskData, taskType = 'support_ticket') {
    try {
      // EMAIL/SMS NOTIFICATIONS DISABLED - Using Firebase Realtime Database + Push notifications only
      logger.info('Email/SMS notifications disabled - using Firebase Realtime Database + Push notifications only', {
        vendorId,
        taskType,
        taskId: taskData.ticketId || taskData._id
      });

      return { success: true, message: 'Email/SMS notifications disabled - using Firebase notifications' };

      // Import Vendor model to get vendor details
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        logger.warn('Vendor not found for notification', { vendorId });
        return { success: false, error: 'Vendor not found' };
      }

      let title, message, emailSubject, emailContent, smsMessage;

      if (taskType === 'support_ticket') {
        title = '🎯 New Support Ticket Assigned';
        message = `New ticket: ${taskData.subject}`;
        emailSubject = `New Support Ticket Assigned - ${taskData.ticketId}`;
        emailContent = this._generateSupportTicketEmail(vendor, taskData);
        smsMessage = `Fixfly: New support ticket ${taskData.ticketId} assigned to you. Subject: ${taskData.subject}. Priority: ${taskData.priority}. Please check your dashboard.`;
      } else if (taskType === 'booking') {
        title = '🔧 New Service Booking Assigned';
        message = `New booking for ${taskData.customer?.name}`;
        emailSubject = `New Service Booking Assigned - ${taskData._id}`;
        emailContent = this._generateBookingEmail(vendor, taskData);
        smsMessage = `Fixfly: New booking assigned to you for ${taskData.customer?.name}. Services: ${taskData.services?.map(s => s.serviceName).join(', ')}. Please check your dashboard.`;
      }

      // Send email notification
      try {
        const emailData = {
          to: vendor.email,
          subject: emailSubject,
          html: emailContent,
          text: this._generatePlainTextEmail(vendor, taskData, taskType)
        };

        const emailResult = await emailService.sendEmail(emailData);

        if (emailResult.success) {
          logger.info('Task assignment email sent successfully', {
            vendorId,
            vendorEmail: vendor.email,
            taskType,
            messageId: emailResult.messageId
          });
        } else {
          logger.warn('Failed to send task assignment email', {
            vendorId,
            vendorEmail: vendor.email,
            taskType,
            error: emailResult.error
          });
        }
      } catch (emailError) {
        logger.error('Error sending task assignment email', {
          vendorId,
          vendorEmail: vendor.email,
          taskType,
          error: emailError.message
        });
      }

      // Send SMS notification
      try {
        const smsResult = await smsService.sendSMS({
          to: vendor.phone,
          message: smsMessage
        });

        if (smsResult.success) {
          logger.info('Task assignment SMS sent successfully', {
            vendorId,
            vendorPhone: vendor.phone,
            taskType,
            messageId: smsResult.messageId
          });
        } else {
          logger.warn('Failed to send task assignment SMS', {
            vendorId,
            vendorPhone: vendor.phone,
            taskType,
            error: smsResult.error
          });
        }
      } catch (smsError) {
        logger.error('Error sending task assignment SMS', {
          vendorId,
          vendorPhone: vendor.phone,
          taskType,
          error: smsError.message
        });
      }

      return {
        success: true,
        method: 'email/sms',
        vendorId,
        taskType,
        taskId: taskData.ticketId || taskData._id
      };

    } catch (error) {
      logger.error('Error sending task assignment notification', {
        error: error.message,
        vendorId,
        taskType,
        taskId: taskData.ticketId || taskData._id
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send urgent task notification
   * @param {string} vendorId - Vendor ID
   * @param {Object} taskData - Task data
   * @param {string} taskType - Task type
   */
  async sendUrgentTaskNotification(vendorId, taskData, taskType = 'support_ticket') {
    try {
      logger.info('Sending urgent task notification via email/SMS', {
        vendorId,
        taskType,
        taskId: taskData.ticketId || taskData._id
      });

      // Import Vendor model to get vendor details
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        logger.warn('Vendor not found for urgent notification', { vendorId });
        return { success: false, error: 'Vendor not found' };
      }

      const title = '🚨 URGENT: Immediate Action Required';
      const message = taskType === 'support_ticket'
        ? `Urgent ticket: ${taskData.subject}`
        : `Urgent booking for ${taskData.customer?.name}`;

      const emailSubject = `🚨 URGENT: ${title}`;
      const emailContent = this._generateUrgentTaskEmail(vendor, taskData, taskType);
      const smsMessage = `🚨 URGENT Fixfly Alert: ${message}. Please check your dashboard immediately!`;

      // Send urgent email notification
      try {
        const emailData = {
          to: vendor.email,
          subject: emailSubject,
          html: emailContent,
          text: this._generatePlainTextUrgentEmail(vendor, taskData, taskType)
        };

        const emailResult = await emailService.sendEmail(emailData);

        if (emailResult.success) {
          logger.info('Urgent task email sent successfully', {
            vendorId,
            vendorEmail: vendor.email,
            taskType,
            messageId: emailResult.messageId
          });
        } else {
          logger.warn('Failed to send urgent task email', {
            vendorId,
            vendorEmail: vendor.email,
            taskType,
            error: emailResult.error
          });
        }
      } catch (emailError) {
        logger.error('Error sending urgent task email', {
          vendorId,
          vendorEmail: vendor.email,
          taskType,
          error: emailError.message
        });
      }

      // Send urgent SMS notification
      try {
        const smsResult = await smsService.sendSMS({
          to: vendor.phone,
          message: smsMessage
        });

        if (smsResult.success) {
          logger.info('Urgent task SMS sent successfully', {
            vendorId,
            vendorPhone: vendor.phone,
            taskType,
            messageId: smsResult.messageId
          });
        } else {
          logger.warn('Failed to send urgent task SMS', {
            vendorId,
            vendorPhone: vendor.phone,
            taskType,
            error: smsResult.error
          });
        }
      } catch (smsError) {
        logger.error('Error sending urgent task SMS', {
          vendorId,
          vendorPhone: vendor.phone,
          taskType,
          error: smsError.message
        });
      }

      return {
        success: true,
        method: 'email/sms',
        priority: 'urgent',
        vendorId,
        taskType,
        taskId: taskData.ticketId || taskData._id
      };

    } catch (error) {
      logger.error('Error sending urgent task notification', {
        error: error.message,
        vendorId,
        taskType,
        taskId: taskData.ticketId || taskData._id
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send custom notification to vendor
   * @param {string} vendorId - Vendor ID
   * @param {Object} notificationData - Notification data
   */
  async sendToVendor(vendorId, notificationData) {
    try {
      logger.info('Sending custom notification via email/SMS', {
        vendorId,
        title: notificationData.title
      });

      // Import Vendor model to get vendor details
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        logger.warn('Vendor not found for custom notification', { vendorId });
        return { success: false, error: 'Vendor not found' };
      }

      const emailSubject = notificationData.title || 'Fixfly Notification';
      const emailContent = this._generateCustomEmail(vendor, notificationData);
      const smsMessage = `Fixfly: ${notificationData.message || notificationData.title}`;

      // Send email notification
      try {
        const emailData = {
          to: vendor.email,
          subject: emailSubject,
          html: emailContent,
          text: notificationData.message || notificationData.title
        };

        const emailResult = await emailService.sendEmail(emailData);

        if (emailResult.success) {
          logger.info('Custom notification email sent successfully', {
            vendorId,
            vendorEmail: vendor.email,
            messageId: emailResult.messageId
          });
        } else {
          logger.warn('Failed to send custom notification email', {
            vendorId,
            vendorEmail: vendor.email,
            error: emailResult.error
          });
        }
      } catch (emailError) {
        logger.error('Error sending custom notification email', {
          vendorId,
          vendorEmail: vendor.email,
          error: emailError.message
        });
      }

      // Send SMS notification
      try {
        const smsResult = await smsService.sendSMS({
          to: vendor.phone,
          message: smsMessage
        });

        if (smsResult.success) {
          logger.info('Custom notification SMS sent successfully', {
            vendorId,
            vendorPhone: vendor.phone,
            messageId: smsResult.messageId
          });
        } else {
          logger.warn('Failed to send custom notification SMS', {
            vendorId,
            vendorPhone: vendor.phone,
            error: smsResult.error
          });
        }
      } catch (smsError) {
        logger.error('Error sending custom notification SMS', {
          vendorId,
          vendorPhone: vendor.phone,
          error: smsError.message
        });
      }

      return {
        success: true,
        method: 'email/sms',
        vendorId,
        title: notificationData.title
      };

    } catch (error) {
      logger.error('Error sending custom notification', {
        error: error.message,
        vendorId,
        title: notificationData.title
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate support ticket email content
   */
  _generateSupportTicketEmail(vendor, ticketData) {
    return `
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
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
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
            <h1>🎯 New Support Ticket Assigned</h1>
            <p>A new support ticket has been assigned to you</p>
          </div>
          <div class="content">
            <h2>Hello ${vendor.firstName} ${vendor.lastName},</h2>
            <p>A new support ticket has been assigned to you. Please review the details below and take appropriate action.</p>
            
            <div class="ticket-info">
              <h3>📋 Ticket Information</h3>
              <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
              <p><strong>Subject:</strong> ${ticketData.subject}</p>
              <p><strong>Customer:</strong> ${ticketData.userName}</p>
              <p><strong>Customer Email:</strong> ${ticketData.userEmail}</p>
              <p><strong>Customer Phone:</strong> ${ticketData.userPhone}</p>
              <p><strong>Type:</strong> ${ticketData.type}</p>
              <p><strong>Priority:</strong> <span class="priority-badge priority-${ticketData.priority?.toLowerCase()}">${ticketData.priority}</span></p>
              <p><strong>Description:</strong></p>
              <div style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #3B82F6;">${ticketData.description}</div>
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

            <a href="${process.env.FRONTEND_URL || 'https://getfixfly.com'}/vendor/dashboard" class="cta-button">
              View in Dashboard
            </a>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fixfly Support Team</p>
            <p>This is an automated assignment notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate booking email content
   */
  _generateBookingEmail(vendor, bookingData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Service Booking Assignment</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .cta-button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 New Service Booking Assigned</h1>
            <p>A new service booking has been assigned to you</p>
          </div>
          <div class="content">
            <h2>Hello ${vendor.firstName} ${vendor.lastName},</h2>
            <p>A new service booking has been assigned to you. Please review the details below and take appropriate action.</p>
            
            <div class="booking-info">
              <h3>📋 Booking Information</h3>
              <p><strong>Booking ID:</strong> ${bookingData._id}</p>
              <p><strong>Customer:</strong> ${bookingData.customer?.name}</p>
              <p><strong>Customer Email:</strong> ${bookingData.customer?.email}</p>
              <p><strong>Customer Phone:</strong> ${bookingData.customer?.phone}</p>
              <p><strong>Services:</strong> ${bookingData.services?.map(s => s.serviceName).join(', ')}</p>
              <p><strong>Scheduled Date:</strong> ${bookingData.scheduling?.scheduledDate ? new Date(bookingData.scheduling.scheduledDate).toLocaleDateString() : 'Not set'}</p>
              <p><strong>Scheduled Time:</strong> ${bookingData.scheduling?.scheduledTime || 'Not set'}</p>
              <p><strong>Total Amount:</strong> ₹${bookingData.pricing?.totalAmount || 0}</p>
            </div>

            <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
              <h3 style="color: #0284c7; margin-top: 0;">⚡ Action Required</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Contact the customer to confirm the booking</li>
                <li>Review the service requirements</li>
                <li>Prepare necessary tools and parts</li>
                <li>Arrive on time for the scheduled service</li>
                <li>Update the booking status as you progress</li>
              </ul>
            </div>

            <a href="${process.env.FRONTEND_URL || 'https://getfixfly.com'}/vendor/dashboard" class="cta-button">
              View in Dashboard
            </a>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fixfly Support Team</p>
            <p>This is an automated assignment notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate urgent task email content
   */
  _generateUrgentTaskEmail(vendor, taskData, taskType) {
    const title = taskType === 'support_ticket' ? 'URGENT Support Ticket' : 'URGENT Service Booking';
    const taskInfo = taskType === 'support_ticket'
      ? `<p><strong>Ticket ID:</strong> ${taskData.ticketId}</p><p><strong>Subject:</strong> ${taskData.subject}</p>`
      : `<p><strong>Booking ID:</strong> ${taskData._id}</p><p><strong>Customer:</strong> ${taskData.customer?.name}</p>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>URGENT Task Assignment</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .urgent-info { background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626; border: 2px solid #FECACA; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .cta-button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 URGENT: Immediate Action Required</h1>
            <p>An urgent task has been assigned to you</p>
          </div>
          <div class="content">
            <h2>Hello ${vendor.firstName} ${vendor.lastName},</h2>
            <p><strong style="color: #DC2626; font-size: 18px;">URGENT TASK ASSIGNMENT - IMMEDIATE ATTENTION REQUIRED</strong></p>
            
            <div class="urgent-info">
              <h3>🚨 URGENT TASK DETAILS</h3>
              ${taskInfo}
              <p><strong>Priority:</strong> <span style="color: #DC2626; font-weight: bold;">URGENT</span></p>
              <p><strong>Assigned At:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
              <h3 style="color: #92400E; margin-top: 0;">⚡ IMMEDIATE ACTION REQUIRED</h3>
              <ul style="margin: 0; padding-left: 20px; color: #92400E;">
                <li><strong>Contact the customer IMMEDIATELY</strong></li>
                <li>Drop other tasks if necessary to handle this urgent case</li>
                <li>Provide immediate response and resolution</li>
                <li>Keep admin team informed of progress</li>
                <li>Escalate if additional support is needed</li>
              </ul>
            </div>

            <a href="${process.env.FRONTEND_URL || 'https://getfixfly.com'}/vendor/dashboard" class="cta-button">
              VIEW URGENT TASK NOW
            </a>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fixfly Support Team</p>
            <p><strong>This is an urgent notification. Please respond immediately.</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate custom email content
   */
  _generateCustomEmail(vendor, notificationData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fixfly Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6B7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .notification-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6B7280; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📱 Fixfly Notification</h1>
            <p>${notificationData.title || 'System Notification'}</p>
          </div>
          <div class="content">
            <h2>Hello ${vendor.firstName} ${vendor.lastName},</h2>
            
            <div class="notification-info">
              <p>${notificationData.message || notificationData.title}</p>
              ${notificationData.data ? `
                <h3>Additional Information:</h3>
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #6B7280;">
                  <pre style="margin: 0; font-family: inherit;">${JSON.stringify(notificationData.data, null, 2)}</pre>
                </div>
              ` : ''}
            </div>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fixfly Team</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email content
   */
  _generatePlainTextEmail(vendor, taskData, taskType) {
    if (taskType === 'support_ticket') {
      return `
New Support Ticket Assignment - Fixfly

Hello ${vendor.firstName} ${vendor.lastName},

A new support ticket has been assigned to you. Please review the details below and take appropriate action.

Ticket Information:
- Ticket ID: ${taskData.ticketId}
- Subject: ${taskData.subject}
- Customer: ${taskData.userName}
- Customer Email: ${taskData.userEmail}
- Customer Phone: ${taskData.userPhone}
- Type: ${taskData.type}
- Priority: ${taskData.priority}
- Description: ${taskData.description}

Action Required:
- Contact the customer within 24 hours
- Review the issue description carefully
- Schedule a service visit if needed
- Update the ticket status as you progress
- Communicate with the customer throughout the process

View in Dashboard: ${process.env.FRONTEND_URL || 'https://getfixfly.com'}/vendor/dashboard

Best regards,
The Fixfly Support Team
      `;
    } else {
      return `
New Service Booking Assignment - Fixfly

Hello ${vendor.firstName} ${vendor.lastName},

A new service booking has been assigned to you. Please review the details below and take appropriate action.

Booking Information:
- Booking ID: ${taskData._id}
- Customer: ${taskData.customer?.name}
- Customer Email: ${taskData.customer?.email}
- Customer Phone: ${taskData.customer?.phone}
- Services: ${taskData.services?.map(s => s.serviceName).join(', ')}
- Scheduled Date: ${taskData.scheduling?.scheduledDate ? new Date(taskData.scheduling.scheduledDate).toLocaleDateString() : 'Not set'}
- Scheduled Time: ${taskData.scheduling?.scheduledTime || 'Not set'}
- Total Amount: ₹${taskData.pricing?.totalAmount || 0}

Action Required:
- Contact the customer to confirm the booking
- Review the service requirements
- Prepare necessary tools and parts
- Arrive on time for the scheduled service
- Update the booking status as you progress

View in Dashboard: ${process.env.FRONTEND_URL || 'https://getfixfly.com'}/vendor/dashboard

Best regards,
The Fixfly Support Team
      `;
    }
  }

  /**
   * Generate plain text urgent email content
   */
  _generatePlainTextUrgentEmail(vendor, taskData, taskType) {
    const taskInfo = taskType === 'support_ticket'
      ? `Ticket ID: ${taskData.ticketId}\nSubject: ${taskData.subject}`
      : `Booking ID: ${taskData._id}\nCustomer: ${taskData.customer?.name}`;

    return `
URGENT TASK ASSIGNMENT - Fixfly

Hello ${vendor.firstName} ${vendor.lastName},

URGENT TASK ASSIGNMENT - IMMEDIATE ATTENTION REQUIRED

URGENT TASK DETAILS:
${taskInfo}
Priority: URGENT
Assigned At: ${new Date().toLocaleString()}

IMMEDIATE ACTION REQUIRED:
- Contact the customer IMMEDIATELY
- Drop other tasks if necessary to handle this urgent case
- Provide immediate response and resolution
- Keep admin team informed of progress
- Escalate if additional support is needed

View Urgent Task: ${process.env.FRONTEND_URL || 'https://getfixfly.com'}/vendor/dashboard

Best regards,
The Fixfly Support Team

This is an urgent notification. Please respond immediately.
    `;
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
module.exports = notificationService;
