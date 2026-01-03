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
      // Trim whitespace from credentials
      const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
      const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : null;

      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      };

      // Validate configuration
      if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
        logger.warn('SMTP not configured. Email functionality will be disabled.', {
          hasUser: !!smtpConfig.auth.user,
          hasPass: !!smtpConfig.auth.pass,
          userLength: smtpConfig.auth.user ? smtpConfig.auth.user.length : 0,
          passLength: smtpConfig.auth.pass ? smtpConfig.auth.pass.length : 0
        });
        return;
      }

      // Log configuration (without exposing password)
      logger.info('SMTP Configuration loaded', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        user: smtpConfig.auth.user,
        passLength: smtpConfig.auth.pass.length,
        passHasSpaces: smtpConfig.auth.pass.includes(' ')
      });

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
      logger.error('SMTP connection verification failed', {
        error: error.message,
        code: error.code,
        responseCode: error.responseCode,
        command: error.command,
        response: error.response
      });

      // Don't log the full error stack in production
      if (process.env.NODE_ENV === 'development') {
        logger.error('SMTP verification error details:', error);
      }

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
        from: `Fixfly <${from}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: html,
        text: text,
        attachments: attachments
      };

      logger.info('Sending email from admin SMTP', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from,
        smtpUser: process.env.SMTP_USER || 'Getfixfly@gmail.com',
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        sendingFromAdmin: mailOptions.from.includes(process.env.SMTP_USER || 'Getfixfly@gmail.com')
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
      logger.error('Failed to send email:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });

      // Provide more detailed error message
      let errorMessage = 'Failed to send email';
      const errorResponse = error.response || error.message || '';
      const errorResponseLower = errorResponse.toLowerCase();
      const isGmailQuotaError = errorResponse.includes('550-5.4.5') ||
        errorResponse.includes('Daily user sending') ||
        errorResponse.includes('quota') ||
        errorResponse.includes('rate limit');

      // Check for authentication/credential errors
      const isAuthError = error.code === 'EAUTH' ||
        error.responseCode === 535 ||
        errorResponseLower.includes('badcredentials') ||
        errorResponseLower.includes('username and password not accepted') ||
        errorResponseLower.includes('invalid login') ||
        errorResponseLower.includes('authentication failed');

      if (isAuthError) {
        errorMessage = 'Incorrect email password. Please check SMTP credentials in server configuration.';
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Email service connection failed. Please check SMTP configuration.';
      } else if (isGmailQuotaError) {
        errorMessage = 'Daily email sending limit exceeded. Please try again tomorrow or contact support.';
      } else if (error.responseCode === 550 || errorResponse.includes('550')) {
        errorMessage = 'Email sending failed. Please contact support or try again later.';
      } else if (error.responseCode) {
        errorMessage = `Email service error: ${error.responseCode} - ${error.response || error.message}`;
      } else {
        errorMessage = error.message || 'Failed to send email';
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message,
        code: error.code,
        responseCode: error.responseCode
      };
    }
  }

  /**
   * Send vendor deposit confirmation email
   */
  async sendVendorDepositConfirmation(vendorData, transactionData) {
    const { name, email } = vendorData;
    const { amount, transactionId, newBalance } = transactionData;

    const subject = 'Deposit Confirmation - Fixfly';
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
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
            </div>

            <p>You can now access all premium features of the Fixfly platform. Thank you for your trust in our services!</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fixfly Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Deposit Confirmation - Fixfly
      
      Hello ${name},
      
      Your deposit of ₹${amount.toLocaleString()} has been successfully processed.
      
      Transaction Details:
      - Amount: ₹${amount.toLocaleString()}
      - Transaction ID: ${transactionId}
      - Date: ${new Date().toLocaleDateString('en-IN')}
      
      Thank you for using Fixfly!
      
      Best regards,
      The Fixfly Team
    `;

    return await this.sendEmail({
      to: email,
      subject: subject,
      html: html,
      text: text
    });
  }

  /**
   * Send AMC purchase confirmation email with benefits and documentation
   */
  async sendAMCPurchaseConfirmation(subscriptionData, planData, userData) {
    console.log('sendAMCPurchaseConfirmation called with:', {
      subscriptionData,
      planData,
      userData
    });

    const { subscriptionId, amount, baseAmount, gstAmount, gstRate, startDate, endDate, devices } = subscriptionData;
    const { name: planName, benefits, features } = planData;
    const { name: userName, email } = userData;

    // Validate required fields
    if (!email || !userName || !subscriptionId || !planName) {
      console.error('Missing required fields for AMC email:', {
        email: !!email,
        userName: !!userName,
        subscriptionId: !!subscriptionId,
        planName: !!planName
      });
      return {
        success: false,
        error: 'Missing required email fields: to, subject, and content'
      };
    }

    const subject = `AMC Purchase Confirmation - ${planName} | Fixfly`;

    // Generate benefits HTML
    const benefitsHtml = this.generateBenefitsHtml(benefits, features);

    // Generate devices HTML
    const devicesHtml = devices.map(device => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${device.deviceType}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${device.modelNumber}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${device.serialNumber}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AMC Purchase Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
          .section { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .amount { font-size: 28px; font-weight: bold; color: #059669; }
          .subscription-details { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }
          .benefit-item { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6; }
          .devices-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .devices-table th, .devices-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .devices-table th { background: #f3f4f6; font-weight: 600; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 AMC Purchase Successful!</h1>
            <p>Welcome to Fixfly's ${planName}</p>
            <p style="font-size: 18px; margin: 10px 0;">Your Annual Maintenance Contract is now active</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Thank you for choosing Fixfly! We're excited to confirm that your AMC subscription has been successfully activated.</p>
            
            <div class="subscription-details">
              <h3>📋 Subscription Details</h3>
              <p><strong>Plan:</strong> ${planName}</p>
              <p><strong>Base Amount:</strong> ₹${baseAmount ? baseAmount.toLocaleString() : amount.toLocaleString()}</p>
              ${gstAmount ? `<p><strong>GST (${(gstRate * 100).toFixed(0)}%):</strong> ₹${gstAmount.toLocaleString()}</p>` : ''}
              <p><strong>Total Amount Paid:</strong> <span class="amount">₹${amount.toLocaleString()}</span></p>
              <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
              <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString('en-IN')}</p>
              <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString('en-IN')}</p>
              <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Active</span></p>
            </div>

            <div class="section">
              <h3>📱 Registered Devices</h3>
              <table class="devices-table">
                <thead>
                  <tr>
                    <th>Device Type</th>
                    <th>Model Number</th>
                    <th>Serial Number</th>
                  </tr>
                </thead>
                <tbody>
                  ${devicesHtml}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h3>✨ Your AMC Benefits & Features</h3>
              ${benefitsHtml}
            </div>

            <div class="highlight">
              <h4>📞 How to Use Your AMC</h4>
              <ul>
                <li><strong>Call Support:</strong> Dial our 24/7 helpline for immediate assistance</li>
                <li><strong>Remote Support:</strong> Schedule remote sessions through your dashboard</li>
                <li><strong>Home Visits:</strong> Book home visits when needed (as per your plan)</li>
                <li><strong>Online Portal:</strong> Track your service history and manage requests</li>
              </ul>
            </div>

            <div class="section">
              <h3>📚 Important Documentation</h3>
              <p>Please keep this email as your AMC confirmation. You can also:</p>
              <ul>
                <li>Download your AMC certificate from your dashboard</li>
                <li>Access service history and request new services</li>
                <li>View your remaining benefits and usage</li>
                <li>Contact support for any queries</li>
              </ul>
              <a href="${process.env.FRONTEND_URL || 'https://fixfly.com'}/amc" class="cta-button">Access Your AMC Dashboard</a>
            </div>

            <div class="section">
              <h3>🆘 Need Help?</h3>
              <p>Our support team is here to help you make the most of your AMC:</p>
              <ul>
                <li><strong>Phone:</strong> +91-XXXXXXXXXX (24/7 Support)</li>
                <li><strong>Email:</strong> info@fixfly.in</li>
                <li><strong>WhatsApp:</strong> +91-XXXXXXXXXX</li>
                <li><strong>Live Chat:</strong> Available on our website</li>
              </ul>
            </div>

            <p>Thank you for trusting Fixfly with your device maintenance needs. We look forward to providing you with excellent service!</p>
          </div>
          
          <div class="footer">
            <p><strong>Best regards,<br>The Fixfly Team</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, contact us at info@fixfly.in</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      AMC Purchase Confirmation - ${planName} | Fixfly
      
      Hello ${userName},
      
      Thank you for choosing Fixfly! Your AMC subscription has been successfully activated.
      
      SUBSCRIPTION DETAILS:
      - Plan: ${planName}
      - Base Amount: ₹${baseAmount ? baseAmount.toLocaleString() : amount.toLocaleString()}
      ${gstAmount ? `- GST (${(gstRate * 100).toFixed(0)}%): ₹${gstAmount.toLocaleString()}` : ''}
      - Total Amount Paid: ₹${amount.toLocaleString()}
      - Subscription ID: ${subscriptionId}
      - Start Date: ${new Date(startDate).toLocaleDateString('en-IN')}
      - End Date: ${new Date(endDate).toLocaleDateString('en-IN')}
      - Status: Active
      
      REGISTERED DEVICES:
      ${devices.map(device => `- ${device.deviceType} (${device.modelNumber}) - ${device.serialNumber}`).join('\n')}
      
      YOUR AMC BENEFITS:
      ${this.generateBenefitsText(benefits, features)}
      
      HOW TO USE YOUR AMC:
      - Call Support: Dial our 24/7 helpline for immediate assistance
      - Remote Support: Schedule remote sessions through your dashboard
      - Home Visits: Book home visits when needed (as per your plan)
      - Online Portal: Track your service history and manage requests
      
      IMPORTANT DOCUMENTATION:
      - Keep this email as your AMC confirmation
      - Download your AMC certificate from your dashboard
      - Access service history and request new services
      - View your remaining benefits and usage
      
      NEED HELP?
      - Phone: +91-XXXXXXXXXX (24/7 Support)
      - Email: info@fixfly.in
      - WhatsApp: +91-XXXXXXXXXX
      - Live Chat: Available on our website
      
      Thank you for trusting Fixfly with your device maintenance needs!
      
      Best regards,
      The Fixfly Team
    `;

    return await this.sendEmail({
      to: email,
      subject: subject,
      html: html,
      text: text
    });
  }

  /**
   * Generate benefits HTML for AMC email
   */
  generateBenefitsHtml(benefits, features) {
    let html = '<div class="benefits-grid">';

    // Add features
    if (features && features.length > 0) {
      features.forEach(feature => {
        html += `
          <div class="benefit-item">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">${feature.title}</h4>
            <p style="margin: 0; color: #4b5563;">${feature.description}</p>
          </div>
        `;
      });
    }

    // Add specific benefits
    if (benefits) {
      if (benefits.callSupport === 'unlimited') {
        html += `
          <div class="benefit-item">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">📞 Unlimited Call Support</h4>
            <p style="margin: 0; color: #4b5563;">24/7 phone support for all your technical queries</p>
          </div>
        `;
      }

      if (benefits.remoteSupport === 'unlimited') {
        html += `
          <div class="benefit-item">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">💻 Unlimited Remote Support</h4>
            <p style="margin: 0; color: #4b5563;">Unlimited remote assistance sessions</p>
          </div>
        `;
      }

      if (benefits.homeVisits && benefits.homeVisits.count > 0) {
        html += `
          <div class="benefit-item">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">🏠 ${benefits.homeVisits.count} Free Home Visits</h4>
            <p style="margin: 0; color: #4b5563;">${benefits.homeVisits.description || 'Complimentary home visits for service'}</p>
          </div>
        `;
      }

      if (benefits.antivirus && benefits.antivirus.included) {
        html += `
          <div class="benefit-item">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">🛡️ Free Antivirus</h4>
            <p style="margin: 0; color: #4b5563;">${benefits.antivirus.name || 'Premium antivirus'} included</p>
          </div>
        `;
      }

      if (benefits.softwareInstallation && benefits.softwareInstallation.included) {
        html += `
          <div class="benefit-item">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">⚙️ Software Installation</h4>
            <p style="margin: 0; color: #4b5563;">Free software installation and driver updates</p>
          </div>
        `;
      }

      if (benefits.sparePartsDiscount && benefits.sparePartsDiscount.percentage > 0) {
        html += `
          <div class="benefit-item">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">💰 Spare Parts Discount</h4>
            <p style="margin: 0; color: #4b5563;">Up to ${benefits.sparePartsDiscount.percentage}% off on all spare parts</p>
          </div>
        `;
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Generate benefits text for AMC email
   */
  generateBenefitsText(benefits, features) {
    let text = '';

    // Add features
    if (features && features.length > 0) {
      features.forEach(feature => {
        text += `- ${feature.title}: ${feature.description}\n`;
      });
    }

    // Add specific benefits
    if (benefits) {
      if (benefits.callSupport === 'unlimited') {
        text += '- Unlimited Call Support: 24/7 phone support for all your technical queries\n';
      }

      if (benefits.remoteSupport === 'unlimited') {
        text += '- Unlimited Remote Support: Unlimited remote assistance sessions\n';
      }

      if (benefits.homeVisits && benefits.homeVisits.count > 0) {
        text += `- ${benefits.homeVisits.count} Free Home Visits: ${benefits.homeVisits.description || 'Complimentary home visits for service'}\n`;
      }

      if (benefits.antivirus && benefits.antivirus.included) {
        text += `- Free Antivirus: ${benefits.antivirus.name || 'Premium antivirus'} included\n`;
      }

      if (benefits.softwareInstallation && benefits.softwareInstallation.included) {
        text += '- Software Installation: Free software installation and driver updates\n';
      }

      if (benefits.sparePartsDiscount && benefits.sparePartsDiscount.percentage > 0) {
        text += `- Spare Parts Discount: Up to ${benefits.sparePartsDiscount.percentage}% off on all spare parts\n`;
      }
    }

    return text;
  }

  /**
   * Send vendor registration approval email
   */
  async sendVendorApprovalEmail(vendorData) {
    const { name, email, vendorId } = vendorData;

    const subject = 'Welcome to Fixfly - Your Account is Approved!';
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
            <h1>🎉 Welcome to Fixfly!</h1>
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
            
            <a href="${process.env.FRONTEND_URL || 'https://getfixfly.com'}/vendor/login" class="cta-button">
              Login to Your Dashboard
            </a>
            
            <p>If you have any questions, our support team is here to help!</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fixfly Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Fixfly - Account Approved!
      
      Congratulations ${name}!
      
      Your vendor account has been approved. Your Vendor ID is: ${vendorId}
      
      You can now access your dashboard and start accepting service requests.
      
      To get started, please make your initial deposit of ₹4,000.
      
      Login: ${process.env.FRONTEND_URL || 'https://getfixfly.com'}/vendor/login
      
      Best regards,
      The Fixfly Team
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
            <p>Fixfly Admin System</p>
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
      
      Fixfly Admin System
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

    const subject = `${emoji} Wallet ${isCredit ? 'Credit' : 'Debit'} - Fixfly`;
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

            <p>Thank you for using Fixfly!</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fixfly Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Wallet ${isCredit ? 'Credit' : 'Debit'} - Fixfly
      
      Hello ${name},
      
      Your wallet has been ${isCredit ? 'credited' : 'debited'}:
      
      Type: ${type}
      Description: ${description}
      Amount: ${isCredit ? '+' : '-'}₹${Math.abs(amount).toLocaleString()}
      Transaction ID: ${transactionId}
      New Balance: ₹${newBalance.toLocaleString()}
      Date: ${new Date().toLocaleDateString('en-IN')}
      
      Thank you for using Fixfly!
      
      Best regards,
      The Fixfly Team
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
    const subject = 'Test Email - Fixfly SMTP Service';
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

    const subject = 'New Withdrawal Request - Fixfly Admin';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Fixfly Admin</h1>
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
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Fixfly Admin Portal</p>
          <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">This is an automated notification.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: process.env.ADMIN_EMAIL || 'info@fixfly.in',
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

    const subject = 'Withdrawal Approved - Fixfly';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Fixfly</h1>
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
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Thank you for using Fixfly!</p>
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

    const subject = 'Withdrawal Request Declined - Fixfly';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Fixfly</h1>
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
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Thank you for using Fixfly!</p>
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
   * Send booking confirmation email to user (Utility Template)
   * @param {Object} booking - Booking object
   * @returns {Promise<Object>} - Response object
   */
  async sendBookingConfirmationEmail(booking) {
    if (!this.isEmailConfigured()) {
      logger.warn('Email service not configured. Skipping booking confirmation email.');
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    try {
      const bookingReference = booking.bookingReference || `FIX${booking._id.toString().slice(-8).toUpperCase()}`;
      const customerName = booking.customer?.name || 'Customer';
      const customerEmail = booking.customer?.email;
      const customerPhone = booking.customer?.phone || 'N/A';
      const customerAddress = booking.customer?.address
        ? `${booking.customer.address.street}, ${booking.customer.address.city}, ${booking.customer.address.state} - ${booking.customer.address.pincode}`
        : 'N/A';

      const preferredDate = booking.scheduling?.preferredDate
        ? new Date(booking.scheduling.preferredDate).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        : 'N/A';
      const preferredTime = booking.scheduling?.preferredTimeSlot || 'N/A';

      const services = booking.services || [];
      const servicesList = services.map(s => `<li>${s.serviceName} - ₹${s.price.toLocaleString()}</li>`).join('');
      const totalAmount = booking.pricing?.totalAmount ? `₹${booking.pricing.totalAmount.toLocaleString()}` : '₹0';
      const subtotal = booking.pricing?.subtotal ? `₹${booking.pricing.subtotal.toLocaleString()}` : '₹0';
      const serviceFee = booking.pricing?.serviceFee ? `₹${booking.pricing.serviceFee.toLocaleString()}` : '₹0';
      const paymentMethod = booking.payment?.method || 'N/A';
      const paymentStatus = booking.payment?.status || 'pending';
      const notes = booking.notes || 'No additional notes';
      const bookingDate = new Date(booking.createdAt || new Date()).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const subject = `Booking Confirmation - ${bookingReference} | Fixfly`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff;
            }
            .header { 
              background: linear-gradient(135deg, #3B82F6, #1E40AF); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
            }
            .header p { 
              margin: 10px 0 0 0; 
              font-size: 16px; 
              opacity: 0.9;
            }
            .content { 
              padding: 30px 20px; 
            }
            .success-badge {
              background: #ecfdf5;
              border: 2px solid #10b981;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              margin-bottom: 25px;
            }
            .success-badge h2 {
              color: #059669;
              margin: 0;
              font-size: 20px;
            }
            .booking-details { 
              background: #f9fafb; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
              border-left: 4px solid #3B82F6;
            }
            .booking-details h3 {
              color: #1f2937;
              margin: 0 0 15px 0;
              font-size: 18px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              color: #6b7280;
              font-weight: 500;
            }
            .detail-value {
              color: #1f2937;
              font-weight: 600;
              text-align: right;
            }
            .services-list {
              background: #ffffff;
              border-radius: 8px;
              padding: 15px;
              margin: 15px 0;
            }
            .services-list ul {
              margin: 0;
              padding-left: 20px;
            }
            .services-list li {
              margin: 8px 0;
              color: #374151;
            }
            .amount-highlight {
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              margin: 20px 0;
            }
            .amount-highlight .total {
              font-size: 24px;
              font-weight: bold;
              color: #92400e;
              margin: 5px 0;
            }
            .info-box {
              background: #eff6ff;
              border-left: 4px solid #3B82F6;
              border-radius: 4px;
              padding: 15px;
              margin: 20px 0;
            }
            .info-box p {
              margin: 5px 0;
              color: #1e40af;
            }
            .footer { 
              background: #f9fafb;
              padding: 20px; 
              text-align: center; 
              color: #6b7280; 
              font-size: 14px; 
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              margin: 5px 0;
            }
            .contact-info {
              background: #f0f9ff;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .contact-info h4 {
              color: #0c4a6e;
              margin: 0 0 10px 0;
            }
            .contact-info p {
              margin: 5px 0;
              color: #075985;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Fixfly</h1>
              <p>Your Booking Has Been Confirmed!</p>
            </div>
            
            <div class="content">
              <div class="success-badge">
                <h2>✅ Booking Confirmed</h2>
                <p style="margin: 5px 0 0 0; color: #047857;">Your service request has been received and confirmed</p>
              </div>

              <div class="booking-details">
                <h3>📋 Booking Information</h3>
                <div class="detail-row">
                  <span class="detail-label">Booking Reference:</span>
                  <span class="detail-value">${bookingReference}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking Date:</span>
                  <span class="detail-value">${bookingDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value" style="color: #059669; font-weight: bold;">Confirmed</span>
                </div>
              </div>

              <div class="booking-details">
                <h3>👤 Customer Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">${customerName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${customerEmail}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone:</span>
                  <span class="detail-value">${customerPhone}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Address:</span>
                  <span class="detail-value" style="text-align: right; max-width: 60%;">${customerAddress}</span>
                </div>
              </div>

              <div class="booking-details">
                <h3>📅 Scheduled Service</h3>
                <div class="detail-row">
                  <span class="detail-label">Preferred Date:</span>
                  <span class="detail-value">${preferredDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time Slot:</span>
                  <span class="detail-value">${preferredTime}</span>
                </div>
              </div>

              <div class="booking-details">
                <h3>🛠️ Services Requested</h3>
                <div class="services-list">
                  <ul>
                    ${servicesList || '<li>No services specified</li>'}
                  </ul>
                </div>
              </div>

              <div class="booking-details">
                <h3>💰 Payment Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Subtotal:</span>
                  <span class="detail-value">${subtotal}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Service Fee:</span>
                  <span class="detail-value">${serviceFee}</span>
                </div>
                <div class="amount-highlight">
                  <div style="color: #6b7280; font-size: 14px;">Total Amount</div>
                  <div class="total">${totalAmount}</div>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Method:</span>
                  <span class="detail-value">${paymentMethod.toUpperCase()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Status:</span>
                  <span class="detail-value" style="color: ${paymentStatus === 'completed' ? '#059669' : '#f59e0b'};">${paymentStatus.toUpperCase()}</span>
                </div>
              </div>

              ${notes && notes !== 'No additional notes' ? `
              <div class="booking-details">
                <h3>📝 Additional Notes</h3>
                <p style="color: #374151; margin: 0;">${notes}</p>
              </div>
              ` : ''}

              <div class="info-box">
                <p><strong>⏰ What's Next?</strong></p>
                <p>Our team will assign an engineer to your booking shortly. You will receive updates via email and SMS.</p>
                <p style="margin-top: 10px;"><strong>Please keep this email for your records.</strong></p>
              </div>

              <div class="contact-info">
                <h4>📞 Need Help?</h4>
                <p><strong>Phone:</strong> +91-99313-54354 (24/7 Support)</p>
                <p><strong>Email:</strong> info@fixfly.in</p>
                <p><strong>WhatsApp:</strong> +91-99313-54354</p>
              </div>
            </div>

            <div class="footer">
              <p><strong>Thank you for choosing Fixfly!</strong></p>
              <p>We're committed to providing you with excellent service.</p>
              <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                This is an automated confirmation email. Please do not reply to this email.<br>
                For support, contact us at info@fixfly.in
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Booking Confirmation - ${bookingReference} | Fixfly
        
        Hello ${customerName},
        
        Your booking has been confirmed! We're excited to serve you.
        
        BOOKING INFORMATION:
        - Booking Reference: ${bookingReference}
        - Booking Date: ${bookingDate}
        - Status: Confirmed
        
        CUSTOMER DETAILS:
        - Name: ${customerName}
        - Email: ${customerEmail}
        - Phone: ${customerPhone}
        - Address: ${customerAddress}
        
        SCHEDULED SERVICE:
        - Preferred Date: ${preferredDate}
        - Time Slot: ${preferredTime}
        
        SERVICES REQUESTED:
        ${services.map(s => `- ${s.serviceName} - ₹${s.price.toLocaleString()}`).join('\n')}
        
        PAYMENT DETAILS:
        - Subtotal: ${subtotal}
        - Service Fee: ${serviceFee}
        - Total Amount: ${totalAmount}
        - Payment Method: ${paymentMethod.toUpperCase()}
        - Payment Status: ${paymentStatus.toUpperCase()}
        
        ${notes && notes !== 'No additional notes' ? `ADDITIONAL NOTES:\n${notes}\n` : ''}
        
        WHAT'S NEXT?
        Our team will assign an engineer to your booking shortly. You will receive updates via email and SMS.
        
        Please keep this email for your records.
        
        NEED HELP?
        Phone: +91-99313-54354 (24/7 Support)
        Email: info@fixfly.in
        WhatsApp: +91-99313-54354
        
        Thank you for choosing Fixfly!
        We're committed to providing you with excellent service.
        
        This is an automated confirmation email. Please do not reply to this email.
        For support, contact us at info@fixfly.in
      `;

      return await this.sendEmail({
        to: customerEmail,
        subject: subject,
        html: html,
        text: text
      });

    } catch (error) {
      logger.error('Failed to send booking confirmation email:', error);
      return {
        success: false,
        message: 'Failed to send booking confirmation email',
        error: error.message
      };
    }
  }

  /**
   * Send booking rescheduled email to user
   * @param {Object} booking - Booking object
   * @param {Object} rescheduleInfo - Reschedule details
   * @returns {Promise<Object>} - Response object
   */
  async sendBookingRescheduledEmail(booking, rescheduleInfo) {
    if (!this.isEmailConfigured()) {
      logger.warn('Email service not configured. Skipping booking rescheduled email.');
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    try {
      const bookingReference = booking.bookingReference || `FIX${booking._id.toString().slice(-8).toUpperCase()}`;
      const customerName = booking.customer?.name || 'Customer';
      const customerEmail = booking.customer?.email;

      const newDate = rescheduleInfo.newDate ? new Date(rescheduleInfo.newDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'N/A';
      const newTime = rescheduleInfo.newTime || 'N/A';

      const originalDate = rescheduleInfo.originalDate ? new Date(rescheduleInfo.originalDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'N/A';
      const originalTime = rescheduleInfo.originalTime || 'N/A';
      const reason = rescheduleInfo.reason || 'Not provided';
      const rescheduledBy = rescheduleInfo.rescheduledBy === 'vendor' ? 'Service Engineer' : 'You';

      const subject = `Booking Rescheduled - ${bookingReference} | Fixfly`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Rescheduled</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; }
            .reschedule-badge { background: #fffbeb; border: 2px solid #F59E0B; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 25px; }
            .reschedule-badge h2 { color: #D97706; margin: 0; font-size: 20px; }
            .details-box { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #F59E0B; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #6b7280; font-weight: 500; }
            .value { color: #1f2937; font-weight: 600; text-align: right; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .contact-info { background: #fff7ed; border-radius: 8px; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Fixfly</h1>
              <p>Booking Rescheduled</p>
            </div>
            <div class="content">
              <div class="reschedule-badge">
                <h2>Booking Rescheduled</h2>
                <p style="margin: 5px 0 0 0; color: #B45309;">Your booking #${bookingReference} has been rescheduled</p>
              </div>

              <p>Hello ${customerName},</p>
              <p>We're writing to confirm that your service booking has been rescheduled by ${rescheduledBy}.</p>

              <div class="details-box">
                <h3>🗓️ New Schedule</h3>
                <div class="detail-row">
                  <span class="label">New Date:</span>
                  <span class="value">${newDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">New Time:</span>
                  <span class="value">${newTime}</span>
                </div>
              </div>

              <div class="details-box">
                <h3>🕰️ Previous Schedule</h3>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${originalDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value">${originalTime}</span>
                </div>
              </div>

              <div class="details-box">
                <h3>📝 Reschedule Details</h3>
                <div class="detail-row">
                  <span class="label">Reason:</span>
                  <span class="value">${reason}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Rescheduled By:</span>
                  <span class="value">${rescheduledBy}</span>
                </div>
              </div>

              <div class="contact-info">
                <h4>📞 Need to change this?</h4>
                <p>If this new time doesn't work for you, please contact us immediately:</p>
                <p><strong>Phone:</strong> +91-99313-54354</p>
                <p><strong>Email:</strong> info@fixfly.in</p>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for choosing Fixfly!</p>
              <p>For support, contact us at info@fixfly.in</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Booking Rescheduled - ${bookingReference} | Fixfly
        
        Hello ${customerName},
        
        Your booking #${bookingReference} has been rescheduled by ${rescheduledBy}.
        
        NEW SCHEDULE:
        - Date: ${newDate}
        - Time: ${newTime}
        
        PREVIOUS SCHEDULE:
        - Date: ${originalDate}
        - Time: ${originalTime}
        
        RESCHEDULE DETAILS:
        - Reason: ${reason}
        - Rescheduled By: ${rescheduledBy}
        
        If this new time doesn't work for you, please contact us at +91-99313-54354 or info@fixfly.in.
        
        Thank you for choosing Fixfly!
      `;

      return await this.sendEmail({
        to: customerEmail,
        subject: subject,
        html: html,
        text: text
      });

    } catch (error) {
      logger.error('Failed to send booking rescheduled email:', error);
      return {
        success: false,
        message: 'Failed to send booking rescheduled email',
        error: error.message
      };
    }
  }

  /**
   * Send booking assignment email to vendor
   * @param {Object} vendor - Vendor object with firstName, lastName, email
   * @param {Object} booking - Booking object
   * @returns {Promise<Object>} - Response object
   */
  async sendVendorBookingAssignmentEmail(vendor, booking) {
    if (!this.isEmailConfigured()) {
      logger.warn('Email service not configured. Skipping vendor booking assignment email.');
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    try {
      const bookingReference = booking.bookingReference || `FIX${booking._id.toString().slice(-8).toUpperCase()}`;
      const vendorName = `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || 'Vendor';
      const customerName = booking.customer?.name || 'Customer';
      const customerEmail = booking.customer?.email || 'N/A';
      const customerPhone = booking.customer?.phone || 'N/A';
      const customerAddress = booking.customer?.address
        ? `${booking.customer.address.street || ''}, ${booking.customer.address.city || ''}, ${booking.customer.address.state || ''} - ${booking.customer.address.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
        : 'N/A';

      const scheduledDate = booking.scheduling?.scheduledDate
        ? new Date(booking.scheduling.scheduledDate).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        : 'Not set';
      const scheduledTime = booking.scheduling?.scheduledTime || 'Not set';
      const preferredDate = booking.scheduling?.preferredDate
        ? new Date(booking.scheduling.preferredDate).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        : 'Not set';
      const preferredTime = booking.scheduling?.preferredTimeSlot || 'Not set';

      const services = booking.services || [];
      const servicesList = services.map(s => `<li>${s.serviceName} - ₹${s.price?.toLocaleString() || '0'}</li>`).join('');
      const totalAmount = booking.pricing?.totalAmount ? `₹${booking.pricing.totalAmount.toLocaleString()}` : '₹0';
      const priority = booking.priority || 'normal';
      const notes = booking.notes || 'No additional notes';
      const bookingDate = new Date(booking.createdAt || new Date()).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const subject = `New Service Booking Assigned - ${bookingReference} | Fixfly`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Service Booking Assigned</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff;
            }
            .header { 
              background: linear-gradient(135deg, #059669, #047857); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
            }
            .header p { 
              margin: 10px 0 0 0; 
              font-size: 16px; 
              opacity: 0.9;
            }
            .content { 
              padding: 30px 20px; 
            }
            .booking-info { 
              background: #f9fafb; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
              border-left: 4px solid #059669;
            }
            .booking-info h3 {
              margin-top: 0;
              color: #059669;
            }
            .info-box { 
              background: #e0f2fe; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
              border-left: 4px solid #0284c7;
            }
            .info-box h3 {
              margin-top: 0;
              color: #0284c7;
            }
            .cta-button { 
              display: inline-block; 
              background: #059669; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #666; 
              font-size: 14px;
              padding: 20px;
              background: #f9fafb;
            }
            .priority-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              margin-left: 10px;
            }
            .priority-urgent { background: #fee2e2; color: #991b1b; }
            .priority-high { background: #fef3c7; color: #92400e; }
            .priority-normal { background: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔧 New Service Booking Assigned</h1>
              <p>A new service booking has been assigned to you</p>
            </div>
            <div class="content">
              <h2>Hello ${vendorName},</h2>
              <p>A new service booking has been assigned to you. Please review the details below and take appropriate action.</p>
              
              <div class="booking-info">
                <h3>📋 Booking Information</h3>
                <p><strong>Booking Reference:</strong> ${bookingReference}</p>
                <p><strong>Booking ID:</strong> ${booking._id}</p>
                <p><strong>Priority:</strong> ${priority.toUpperCase()} <span class="priority-badge priority-${priority}">${priority}</span></p>
                <p><strong>Assigned Date:</strong> ${bookingDate}</p>
              </div>

              <div class="booking-info">
                <h3>👤 Customer Information</h3>
                <p><strong>Name:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Phone:</strong> ${customerPhone}</p>
                <p><strong>Address:</strong> ${customerAddress}</p>
              </div>

              <div class="booking-info">
                <h3>🛠️ Service Details</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  ${servicesList || '<li>No services specified</li>'}
                </ul>
                <p style="margin-top: 15px;"><strong>Total Amount:</strong> ${totalAmount}</p>
              </div>

              <div class="booking-info">
                <h3>📅 Scheduling</h3>
                <p><strong>Scheduled Date:</strong> ${scheduledDate}</p>
                <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
                <p><strong>Preferred Date:</strong> ${preferredDate}</p>
                <p><strong>Preferred Time:</strong> ${preferredTime}</p>
              </div>

              ${notes && notes !== 'No additional notes' ? `
              <div class="booking-info">
                <h3>📝 Additional Notes</h3>
                <p>${notes}</p>
              </div>
              ` : ''}

              <div class="info-box">
                <h3>⚡ Action Required</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Review the booking details carefully</li>
                  <li>Contact the customer within 24 hours to confirm</li>
                  <li>Prepare necessary tools and parts</li>
                  <li>Arrive on time for the scheduled service</li>
                  <li>Update the booking status as you progress</li>
                  <li>Accept or decline the booking in your dashboard</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://getfixfly.com'}/vendor/dashboard" class="cta-button">
                  View in Dashboard
                </a>
              </div>
            </div>
            <div class="footer">
              <p><strong>Best regards,<br>The Fixfly Support Team</strong></p>
              <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                This is an automated assignment notification. Please do not reply to this email.<br>
                For support, contact us at info@fixfly.in
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        New Service Booking Assigned - ${bookingReference} | Fixfly
        
        Hello ${vendorName},
        
        A new service booking has been assigned to you. Please review the details below and take appropriate action.
        
        BOOKING INFORMATION:
        - Booking Reference: ${bookingReference}
        - Booking ID: ${booking._id}
        - Priority: ${priority.toUpperCase()}
        - Assigned Date: ${bookingDate}
        
        CUSTOMER INFORMATION:
        - Name: ${customerName}
        - Email: ${customerEmail}
        - Phone: ${customerPhone}
        - Address: ${customerAddress}
        
        SERVICE DETAILS:
        ${services.map(s => `- ${s.serviceName} - ₹${s.price?.toLocaleString() || '0'}`).join('\n')}
        - Total Amount: ${totalAmount}
        
        SCHEDULING:
        - Scheduled Date: ${scheduledDate}
        - Scheduled Time: ${scheduledTime}
        - Preferred Date: ${preferredDate}
        - Preferred Time: ${preferredTime}
        
        ${notes && notes !== 'No additional notes' ? `ADDITIONAL NOTES:\n${notes}\n` : ''}
        
        ACTION REQUIRED:
        - Review the booking details carefully
        - Contact the customer within 24 hours to confirm
        - Prepare necessary tools and parts
        - Arrive on time for the scheduled service
        - Update the booking status as you progress
        - Accept or decline the booking in your dashboard
        
        View in Dashboard: ${process.env.FRONTEND_URL || 'https://getfixfly.com'}/vendor/dashboard
        
        Best regards,
        The Fixfly Support Team
        
        This is an automated assignment notification. Please do not reply to this email.
        For support, contact us at info@fixfly.in
      `;

      return await this.sendEmail({
        to: vendor.email,
        subject: subject,
        html: html,
        text: text
      });

    } catch (error) {
      logger.error('Failed to send vendor booking assignment email:', error);
      return {
        success: false,
        message: 'Failed to send vendor booking assignment email',
        error: error.message
      };
    }
  }

  /**
   * Send forgot password OTP to vendor email
   */
  async sendForgotPasswordOTP(email, otp, vendorName) {
    try {
      // Validate inputs
      if (!email || !otp) {
        logger.error('Missing required parameters for forgot password OTP email', {
          hasEmail: !!email,
          hasOTP: !!otp
        });
        return {
          success: false,
          message: 'Missing required parameters for email',
          error: 'Email and OTP are required'
        };
      }

      const subject = 'Password Reset OTP - Fixfly Vendor Portal';
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .otp-code { font-size: 32px; font-weight: bold; color: #3B82F6; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${vendorName},</h2>
            <p>We received a request to reset your password for your Fixfly Vendor Portal account.</p>
            
            <div class="otp-box">
              <p style="margin-bottom: 10px;">Your OTP for password reset is:</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This OTP is valid for 10 minutes only</li>
                <li>Do not share this OTP with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            
            <p>If you didn't request a password reset, please contact our support team immediately.</p>
            
            <div class="footer">
              <p>Best regards,<br>The Fixfly Team</p>
              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Email: info@fixfly.in<br>
                WhatsApp: +91-99313-54354
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

      const text = `
      Password Reset OTP - Fixfly Vendor Portal
      
      Hello ${vendorName},
      
      We received a request to reset your password for your Fixfly Vendor Portal account.
      
      Your OTP for password reset is: ${otp}
      
      This OTP is valid for 10 minutes only.
      Do not share this OTP with anyone.
      
      If you didn't request a password reset, please contact our support team immediately.
      
      Best regards,
      The Fixfly Team
      
      Email: info@fixfly.in
      WhatsApp: +91-99313-54354
    `;

      logger.info('Sending forgot password OTP email', {
        to: email,
        vendorName: vendorName || 'Vendor'
      });

      const result = await this.sendEmail({
        to: email,
        subject: subject,
        html: html,
        text: text
      });

      if (!result.success) {
        logger.error('Failed to send forgot password OTP email', {
          email: email,
          error: result.error || result.message
        });
      }

      return result;
    } catch (error) {
      logger.error('Exception in sendForgotPasswordOTP', {
        error: error.message,
        stack: error.stack,
        email: email
      });
      return {
        success: false,
        message: 'Failed to send forgot password OTP email',
        error: error.message
      };
    }
  }

  /**
   * Send forgot password OTP to user email
   */
  async sendUserForgotPasswordOTP(email, otp, userName) {
    try {
      // Validate inputs
      if (!email || !otp) {
        logger.error('Missing required parameters for user forgot password OTP email', {
          hasEmail: !!email,
          hasOTP: !!otp
        });
        return {
          success: false,
          message: 'Missing required parameters for email',
          error: 'Email and OTP are required'
        };
      }

      const subject = 'Password Reset OTP - Fixfly';
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .otp-code { font-size: 32px; font-weight: bold; color: #3B82F6; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName || 'User'},</h2>
            <p>We received a request to reset your password for your Fixfly account.</p>
            
            <div class="otp-box">
              <p style="margin-bottom: 10px;">Your OTP for password reset is:</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This OTP is valid for 10 minutes only</li>
                <li>Do not share this OTP with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            
            <p>If you didn't request a password reset, please contact our support team immediately.</p>
            
            <div class="footer">
              <p>Best regards,<br>The Fixfly Team</p>
              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Email: info@fixfly.in<br>
                WhatsApp: +91-99313-54354
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

      const text = `
      Password Reset OTP - Fixfly
      
      Hello ${userName || 'User'},
      
      We received a request to reset your password for your Fixfly account.
      
      Your OTP for password reset is: ${otp}
      
      This OTP is valid for 10 minutes only.
      Do not share this OTP with anyone.
      
      If you didn't request a password reset, please contact our support team immediately.
      
      Best regards,
      The Fixfly Team
      
      Email: info@fixfly.in
      WhatsApp: +91-99313-54354
    `;

      logger.info('Sending user forgot password OTP email', {
        to: email,
        userName: userName || 'User'
      });

      const result = await this.sendEmail({
        to: email,
        subject: subject,
        html: html,
        text: text
      });

      if (!result.success) {
        logger.error('Failed to send user forgot password OTP email', {
          email: email,
          error: result.error || result.message
        });
      }

      return result;
    } catch (error) {
      logger.error('Exception in sendUserForgotPasswordOTP', {
        error: error.message,
        stack: error.stack,
        email: email
      });
      return {
        success: false,
        message: 'Failed to send forgot password OTP email',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
