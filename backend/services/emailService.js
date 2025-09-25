const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  initializeTransporter() {
    try {
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      };

      // Validate configuration
      if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
        logger.warn('SMTP not configured. Email functionality will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport(smtpConfig);
      this.isConfigured = true;

      // Verify connection
      this.verifyConnection();

      logger.info('SMTP Email service initialized successfully', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        user: smtpConfig.auth.user
      });

    } catch (error) {
      logger.error('Failed to initialize SMTP transporter:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * Check if email service is configured
   */
  isEmailConfigured() {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Send email
   * @param {Object} emailData - Email data
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.html - HTML content
   * @param {string} emailData.text - Plain text content
   * @param {Array} emailData.attachments - Email attachments
   * @param {string} emailData.from - Sender email (optional)
   * @returns {Promise<Object>} - Response object
   */
  async sendEmail(emailData) {
    if (!this.isEmailConfigured()) {
      logger.warn('Email service not configured. Skipping email send.');
      return {
        success: false,
        message: 'Email service not configured',
        error: 'SMTP not configured'
      };
    }

    try {
      const {
        to,
        subject,
        html,
        text,
        attachments = [],
        from = process.env.SMTP_USER
      } = emailData;

      // Validate required fields
      if (!to || !subject || (!html && !text)) {
        throw new Error('Missing required email fields: to, subject, and content');
      }

      const mailOptions = {
        from: `Fixifly <${from}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: html,
        text: text,
        attachments: attachments
      };

      logger.info('Sending email', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from
      });

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        messageId: result.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      };

    } catch (error) {
      logger.error('Failed to send email:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message
      };
    }
  }

  /**
   * Send vendor deposit confirmation email
   */
  async sendVendorDepositConfirmation(vendorData, transactionData) {
    const { name, email } = vendorData;
    const { amount, transactionId, newBalance } = transactionData;

    const subject = 'Deposit Confirmation - Fixifly';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #059669; }
          .transaction-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Deposit Successful!</h1>
            <p>Your wallet has been credited</p>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We're pleased to confirm that your deposit has been successfully processed.</p>
            
            <div class="transaction-details">
              <h3>Transaction Details</h3>
              <p><strong>Amount Deposited:</strong> <span class="amount">₹${amount.toLocaleString()}</span></p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>New Wallet Balance:</strong> ₹${newBalance.toLocaleString()}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
            </div>

            <p>You can now access all premium features of the Fixifly platform. Thank you for your trust in our services!</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fixifly Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Deposit Confirmation - Fixifly
      
      Hello ${name},
      
      Your deposit of ₹${amount.toLocaleString()} has been successfully processed.
      
      Transaction Details:
      - Amount: ₹${amount.toLocaleString()}
      - Transaction ID: ${transactionId}
      - New Balance: ₹${newBalance.toLocaleString()}
      - Date: ${new Date().toLocaleDateString('en-IN')}
      
      Thank you for using Fixifly!
      
      Best regards,
      The Fixifly Team
    `;

    return await this.sendEmail({
      to: email,
      subject: subject,
      html: html,
      text: text
    });
  }

  /**
   * Send vendor registration approval email
   */
  async sendVendorApprovalEmail(vendorData) {
    const { name, email, vendorId } = vendorData;

    const subject = 'Welcome to Fixifly - Your Account is Approved!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Fixifly!</h1>
            <p>Your vendor account has been approved</p>
          </div>
          <div class="content">
            <h2>Congratulations ${name}!</h2>
            <p>Great news! Your vendor account has been reviewed and approved by our team.</p>
            
            <p><strong>Your Vendor ID:</strong> ${vendorId}</p>
            
            <p>You can now:</p>
            <ul>
              <li>Access your vendor dashboard</li>
              <li>View and accept service requests</li>
              <li>Manage your earnings and wallet</li>
              <li>Update your profile and services</li>
            </ul>

            <p>To get started, please make your initial deposit of ₹4,000 to activate all features.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/login" class="cta-button">
              Login to Your Dashboard
            </a>
            
            <p>If you have any questions, our support team is here to help!</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fixifly Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Fixifly - Account Approved!
      
      Congratulations ${name}!
      
      Your vendor account has been approved. Your Vendor ID is: ${vendorId}
      
      You can now access your dashboard and start accepting service requests.
      
      To get started, please make your initial deposit of ₹4,000.
      
      Login: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/login
      
      Best regards,
      The Fixifly Team
    `;

    return await this.sendEmail({
      to: email,
      subject: subject,
      html: html,
      text: text
    });
  }

  /**
   * Send admin notification email
   */
  async sendAdminNotification(adminData, notificationData) {
    const { email } = adminData;
    const { type, title, message, details } = notificationData;

    const subject = `Admin Notification: ${title}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .notification-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Admin Notification</h1>
            <p>${title}</p>
          </div>
          <div class="content">
            <h2>Notification Type: ${type}</h2>
            <p>${message}</p>
            
            ${details ? `
            <div class="notification-details">
              <h3>Details:</h3>
              <pre style="white-space: pre-wrap; font-family: monospace;">${JSON.stringify(details, null, 2)}</pre>
            </div>
            ` : ''}
            
            <p>Please review this notification in your admin dashboard.</p>
          </div>
          <div class="footer">
            <p>Fixifly Admin System</p>
            <p>This is an automated notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Admin Notification: ${title}
      
      Type: ${type}
      
      ${message}
      
      ${details ? `Details:\n${JSON.stringify(details, null, 2)}` : ''}
      
      Please review in your admin dashboard.
      
      Fixifly Admin System
    `;

    return await this.sendEmail({
      to: email,
      subject: subject,
      html: html,
      text: text
    });
  }

  /**
   * Send wallet transaction notification
   */
  async sendWalletTransactionNotification(vendorData, transactionData) {
    const { name, email } = vendorData;
    const { type, amount, description, transactionId, newBalance } = transactionData;

    const isCredit = amount > 0;
    const emoji = isCredit ? '💰' : '💸';
    const color = isCredit ? '#059669' : '#DC2626';

    const subject = `${emoji} Wallet ${isCredit ? 'Credit' : 'Debit'} - Fixifly`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wallet Transaction</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: ${color}; }
          .transaction-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emoji} Wallet ${isCredit ? 'Credit' : 'Debit'}</h1>
            <p>Transaction processed successfully</p>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your wallet has been ${isCredit ? 'credited' : 'debited'} with the following transaction:</p>
            
            <div class="transaction-details">
              <h3>Transaction Details</h3>
              <p><strong>Type:</strong> ${type}</p>
              <p><strong>Description:</strong> ${description}</p>
              <p><strong>Amount:</strong> <span class="amount">${isCredit ? '+' : '-'}₹${Math.abs(amount).toLocaleString()}</span></p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>New Balance:</strong> ₹${newBalance.toLocaleString()}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
            </div>

            <p>Thank you for using Fixifly!</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fixifly Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Wallet ${isCredit ? 'Credit' : 'Debit'} - Fixifly
      
      Hello ${name},
      
      Your wallet has been ${isCredit ? 'credited' : 'debited'}:
      
      Type: ${type}
      Description: ${description}
      Amount: ${isCredit ? '+' : '-'}₹${Math.abs(amount).toLocaleString()}
      Transaction ID: ${transactionId}
      New Balance: ₹${newBalance.toLocaleString()}
      Date: ${new Date().toLocaleDateString('en-IN')}
      
      Thank you for using Fixifly!
      
      Best regards,
      The Fixifly Team
    `;

    return await this.sendEmail({
      to: email,
      subject: subject,
      html: html,
      text: text
    });
  }

  /**
   * Send test email
   */
  async sendTestEmail(to) {
    const subject = 'Test Email - Fixifly SMTP Service';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ SMTP Test Successful!</h1>
          </div>
          <div class="content">
            <p>This is a test email to verify that the SMTP email service is working correctly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p>If you received this email, the email service is properly configured and functioning.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      SMTP Test Successful!
      
      This is a test email to verify that the SMTP email service is working correctly.
      
      Timestamp: ${new Date().toISOString()}
      
      If you received this email, the email service is properly configured and functioning.
    `;

    return await this.sendEmail({
      to: to,
      subject: subject,
      html: html,
      text: text
    });
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
