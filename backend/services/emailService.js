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

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(to, subject, content, ticketId) {
    try {
      if (!this.isConfigured) {
        logger.warn('Email service not configured, skipping invoice email');
        return { success: false, error: 'Email service not configured' };
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>FixFly Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background-color: #3B82F6; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .header h2 { margin: 10px 0 0 0; font-size: 18px; opacity: 0.9; }
            .content { padding: 30px; }
            .invoice-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .invoice-details h3 { margin-top: 0; color: #333; }
            .invoice-content { background-color: #f1f1f1; padding: 20px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; }
            .footer { background-color: #e9ecef; padding: 20px; text-align: center; color: #666; }
            .amount { background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .amount h3 { margin: 0; color: #155724; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>FIXFLY</h1>
              <h2>INVOICE</h2>
            </div>
            
            <div class="content">
              <div class="invoice-details">
                <h3>Invoice Details</h3>
                <p><strong>Invoice No:</strong> INV-${ticketId}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="invoice-content">${content}</div>
              
              <div class="amount">
                <h3>Thank you for using FixFly services!</h3>
              </div>
            </div>
            
            <div class="footer">
              <p>For any queries, contact us at support@fixfly.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"FixFly" <${process.env.SMTP_USER || 'fixfly.service@gmail.com'}>`,
        to: to,
        subject: subject,
        text: content,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Invoice email sent successfully to ${to}`, { messageId: result.messageId });
      
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      logger.error('Error sending invoice email:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Send withdrawal request notification to admin
   */
  async sendWithdrawalRequestNotification({ vendorName, vendorEmail, amount, requestId }) {
    if (!this.isConfigured) {
      logger.warn('Email service not configured. Skipping withdrawal request notification.');
      return;
    }

    const subject = 'New Withdrawal Request - Fixifly Admin';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Fixifly Admin</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Vendor Management Portal</p>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #92400e; margin: 0 0 15px 0;">⚠️ New Withdrawal Request</h2>
          <p style="color: #92400e; margin: 0;">A vendor has submitted a withdrawal request that requires your approval.</p>
        </div>
        
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Vendor Name:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${vendorName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Vendor Email:</td>
              <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${vendorEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Amount:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Request ID:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace; border-bottom: 1px solid #f3f4f6;">${requestId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Date:</td>
              <td style="padding: 8px 0; color: #1f2937;">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #1e40af; margin: 0; font-weight: 500;">📋 Please review and process this request in the admin panel.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Fixifly Admin Portal</p>
          <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">This is an automated notification.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@fixifly.com',
      subject,
      html
    });
  }

  /**
   * Send withdrawal approval notification to vendor
   */
  async sendWithdrawalApprovalNotification({ vendorName, vendorEmail, amount, requestId }) {
    if (!this.isConfigured) {
      logger.warn('Email service not configured. Skipping withdrawal approval notification.');
      return;
    }

    const subject = 'Withdrawal Approved - Fixifly';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Fixifly</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Professional Service Platform</p>
        </div>
        
        <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #065f46; margin: 0 0 15px 0;">✅ Withdrawal Approved</h2>
          <p style="color: #374151; margin: 0;">Dear ${vendorName},</p>
          <p style="color: #374151; margin: 10px 0;">Your withdrawal request has been approved and processed!</p>
        </div>
        
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Transaction Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Amount:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Request ID:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace; border-bottom: 1px solid #f3f4f6;">${requestId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Date:</td>
              <td style="padding: 8px 0; color: #1f2937;">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #0c4a6e; margin: 0; font-weight: 500;">💰 The amount will be transferred to your registered bank account within 1-2 business days.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Thank you for using Fixifly!</p>
          <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">If you have any questions, please contact our support team.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: vendorEmail,
      subject,
      html
    });
  }

  /**
   * Send withdrawal decline notification to vendor
   */
  async sendWithdrawalDeclineNotification({ vendorName, vendorEmail, amount, requestId, reason }) {
    if (!this.isConfigured) {
      logger.warn('Email service not configured. Skipping withdrawal decline notification.');
      return;
    }

    const subject = 'Withdrawal Request Declined - Fixifly';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Fixifly</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Professional Service Platform</p>
        </div>
        
        <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #dc2626; margin: 0 0 15px 0;">❌ Withdrawal Request Declined</h2>
          <p style="color: #374151; margin: 0;">Dear ${vendorName},</p>
          <p style="color: #374151; margin: 10px 0;">Unfortunately, your withdrawal request could not be processed at this time.</p>
        </div>
        
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Amount:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Request ID:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace; border-bottom: 1px solid #f3f4f6;">${requestId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Reason:</td>
              <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${reason || 'No specific reason provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Date:</td>
              <td style="padding: 8px 0; color: #1f2937;">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #92400e; margin: 0; font-weight: 500;">💡 You can submit a new withdrawal request once the issue is resolved.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Thank you for using Fixifly!</p>
          <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">If you have any questions, please contact our support team.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: vendorEmail,
      subject,
      html
    });
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
