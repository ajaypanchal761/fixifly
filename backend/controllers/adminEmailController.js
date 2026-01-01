const emailService = require('../services/emailService');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

// @desc    Send test email
// @route   POST /api/admin/email/test
// @access  Private (Admin)
const sendTestEmail = asyncHandler(async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required'
      });
    }

    const emailSubject = subject || 'Test Email - Fixfly Admin';
    const emailMessage = message || 'This is a test email sent from the Fixfly admin panel.';

    const result = await emailService.sendTestEmail(to);

    if (result.success) {
      logger.info('Test email sent successfully by admin', {
        adminId: req.admin._id,
        recipient: to,
        messageId: result.messageId
      });

      res.json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          messageId: result.messageId,
          recipient: to
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// @desc    Send custom email to vendor
// @route   POST /api/admin/email/vendor/:vendorId
// @access  Private (Admin)
const sendEmailToVendor = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { subject, message, type = 'custom' } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    // Get vendor details (you might need to import Vendor model)
    const Vendor = require('../models/Vendor');
    // Try to find vendor by vendorId first, then by _id as fallback
    let vendor = await Vendor.findOne({ vendorId });
    if (!vendor) {
      vendor = await Vendor.findById(vendorId);
    }

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const emailData = {
      to: vendor.email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fixfly Admin Message</h1>
            </div>
            <div class="content">
              <h2>Hello ${(vendor.firstName || '') + ' ' + (vendor.lastName || '') || 'Vendor'},</h2>
              <div style="white-space: pre-wrap;">${message}</div>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Fixfly Admin Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Fixfly Admin Message\n\nHello ${(vendor.firstName || '') + ' ' + (vendor.lastName || '') || 'Vendor'},\n\n${message}\n\nBest regards,\nThe Fixfly Admin Team`
    };

    const result = await emailService.sendEmail(emailData);

    if (result.success) {
      logger.info('Custom email sent to vendor by admin', {
        adminId: req.admin._id,
        vendorId: vendor.vendorId,
        vendorEmail: vendor.email,
        subject: subject,
        messageId: result.messageId
      });

      res.json({
        success: true,
        message: 'Email sent to vendor successfully',
        data: {
          messageId: result.messageId,
          vendorId: vendor.vendorId,
          vendorEmail: vendor.email
        }
      });
    } else {
      // Return more detailed error message
      const errorMessage = result.message || result.error || 'Failed to send email to vendor';
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: result.error,
        code: result.code,
        responseCode: result.responseCode
      });
    }

  } catch (error) {
    logger.error('Error sending email to vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email to vendor',
      error: error.message
    });
  }
});

// @desc    Send bulk email to vendors
// @route   POST /api/admin/email/bulk
// @access  Private (Admin)
const sendBulkEmail = asyncHandler(async (req, res) => {
  try {
    const { subject, message, vendorIds, filters } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    const Vendor = require('../models/Vendor');
    let query = {};

    // Build query based on filters or vendor IDs
    if (vendorIds && vendorIds.length > 0) {
      // Support both vendorId and _id formats
      query.$or = [
        { vendorId: { $in: vendorIds } },
        { _id: { $in: vendorIds } }
      ];
    } else if (filters) {
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.isApproved !== undefined) query.isApproved = filters.isApproved;
      if (filters.serviceCategories && filters.serviceCategories.length > 0) {
        query.serviceCategories = { $in: filters.serviceCategories };
      }
    }

    const vendors = await Vendor.find(query).select('vendorId firstName lastName email');

    if (vendors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No vendors found matching the criteria'
      });
    }

    const emailPromises = vendors.map(vendor => {
      const emailData = {
        to: vendor.email,
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Fixfly Announcement</h1>
              </div>
              <div class="content">
                <h2>Hello ${(vendor.firstName || '') + ' ' + (vendor.lastName || '') || 'Vendor'},</h2>
                <div style="white-space: pre-wrap;">${message}</div>
              </div>
              <div class="footer">
                <p>Best regards,<br>The Fixfly Team</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Fixfly Announcement\n\nHello ${(vendor.firstName || '') + ' ' + (vendor.lastName || '') || 'Vendor'},\n\n${message}\n\nBest regards,\nThe Fixfly Team`
      };

      return emailService.sendEmail(emailData);
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
    const failed = results.length - successful;

    logger.info('Bulk email sent by admin', {
      adminId: req.admin._id,
      totalVendors: vendors.length,
      successful: successful,
      failed: failed,
      subject: subject
    });

    res.json({
      success: true,
      message: `Bulk email sent to ${successful} vendors successfully`,
      data: {
        totalVendors: vendors.length,
        successful: successful,
        failed: failed,
        results: results.map((result, index) => ({
          vendorId: vendors[index].vendorId,
          email: vendors[index].email,
          success: result.status === 'fulfilled' && result.value.success,
          error: result.status === 'rejected' ? result.reason.message : (result.value.error || null)
        }))
      }
    });

  } catch (error) {
    logger.error('Error sending bulk email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk email',
      error: error.message
    });
  }
});

// @desc    Get email service status
// @route   GET /api/admin/email/status
// @access  Private (Admin)
const getEmailStatus = asyncHandler(async (req, res) => {
  try {
    const isConfigured = emailService.isEmailConfigured();
    const isConnected = isConfigured ? await emailService.verifyConnection() : false;

    res.json({
      success: true,
      data: {
        isConfigured: isConfigured,
        isConnected: isConnected,
        smtpConfig: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER ? 'configured' : 'not configured'
        }
      }
    });

  } catch (error) {
    logger.error('Error checking email status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email status',
      error: error.message
    });
  }
});

module.exports = {
  sendTestEmail,
  sendEmailToVendor,
  sendBulkEmail,
  getEmailStatus
};
