const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendDirectEmail() {
  try {
    console.log('🚀 Starting direct email test...');
    console.log('📧 SMTP Configuration:');
    console.log(`   Host: ${process.env.SMTP_HOST}`);
    console.log(`   Port: ${process.env.SMTP_PORT}`);
    console.log(`   User: ${process.env.SMTP_USER}`);
    console.log(`   Pass: ${process.env.SMTP_PASS ? '***configured***' : 'NOT SET'}`);
    console.log('');

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    console.log('');

    // Send email
    const recipientEmail = 'panchalajay717@gmail.com';
    console.log(`📤 Sending email to: ${recipientEmail}`);

    const mailOptions = {
      from: `Fixifly <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: '🎉 Test Email from Fixifly - SMTP Integration Working!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .success { color: #059669; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 SMTP Integration Successful!</h1>
              <p>Fixifly Email Service is Working</p>
            </div>
            <div class="content">
              <h2>Hello Ajay!</h2>
              <p class="success">✅ Great news! The SMTP email integration is working perfectly.</p>
              
              <h3>What this means:</h3>
              <ul>
                <li>✅ Vendor deposit confirmations will be sent automatically</li>
                <li>✅ Vendor approval emails will be delivered</li>
                <li>✅ Wallet transaction notifications will work</li>
                <li>✅ Admin notifications are functional</li>
                <li>✅ Bulk email campaigns can be sent</li>
              </ul>

              <h3>Email Features Now Active:</h3>
              <ul>
                <li>📧 Vendor deposit confirmations (₹4,000+ deposits)</li>
                <li>📧 Vendor account approval notifications</li>
                <li>📧 Wallet transaction notifications</li>
                <li>📧 Admin custom emails</li>
                <li>📧 Bulk vendor communications</li>
              </ul>

              <p><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN')}</p>
              <p><strong>From:</strong> Fixifly Admin System</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Fixifly Development Team</p>
              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Email: info@getfixfly.com<br>
                Phone: 022-6964-7030<br>
                WhatsApp: +91-9931-354-354
              </p>
              <p>This is an automated test email to verify SMTP functionality.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        SMTP Integration Successful!
        
        Hello Ajay!
        
        ✅ Great news! The SMTP email integration is working perfectly.
        
        What this means:
        - Vendor deposit confirmations will be sent automatically
        - Vendor approval emails will be delivered
        - Wallet transaction notifications will work
        - Admin notifications are functional
        - Bulk email campaigns can be sent
        
        Email Features Now Active:
        - Vendor deposit confirmations (₹4,000+ deposits)
        - Vendor account approval notifications
        - Wallet transaction notifications
        - Admin custom emails
        - Bulk vendor communications
        
        Timestamp: ${new Date().toLocaleString('en-IN')}
        From: Fixifly Admin System
        
        Best regards,
        The Fixifly Development Team
        
        This is an automated test email to verify SMTP functionality.
      `
    };

    const result = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📬 Recipient: ${recipientEmail}`);
    console.log(`📤 From: ${process.env.SMTP_USER}`);
    console.log('');
    console.log('🎉 Email test completed successfully!');
    console.log('Check panchalajay717@gmail.com inbox (and spam folder) for the test email.');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Check the recipient\'s email inbox');
    console.log('2. Verify the email appears correctly');
    console.log('3. Test vendor deposit flow to see automatic emails');
    console.log('4. Test admin email features in the admin panel');

  } catch (error) {
    console.error('❌ Error during email test:');
    console.error(error.message);
    console.error('');
    console.error('🔧 Troubleshooting tips:');
    console.error('1. Check your SMTP credentials in .env file');
    console.error('2. Ensure SMTP is enabled for your Hostinger email account');
    console.error('3. Verify SMTP_HOST is smtp.hostinger.com and SMTP_PORT is 465');
    console.error('4. Check if your IP is blacklisted or if there are any restrictions on Hostinger side');
    console.error('5. Make sure the password is correct in .env file');
  }
}

// Run the test
sendDirectEmail();
