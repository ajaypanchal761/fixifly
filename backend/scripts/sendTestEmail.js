require('dotenv').config();
const emailService = require('../services/emailService');

async function sendTestEmail() {
  try {
    console.log('🚀 Starting email test...');
    console.log('📧 SMTP Configuration:');
    console.log(`   Host: ${process.env.SMTP_HOST}`);
    console.log(`   Port: ${process.env.SMTP_PORT}`);
    console.log(`   User: ${process.env.SMTP_USER}`);
    console.log(`   Pass: ${process.env.SMTP_PASS ? '***configured***' : 'NOT SET'}`);
    console.log('');

    // Check if email service is configured
    if (!emailService.isEmailConfigured()) {
      console.error('❌ Email service not configured. Please check your SMTP settings in .env file.');
      return;
    }

    console.log('✅ Email service is configured');
    
    // Verify SMTP connection
    console.log('🔍 Verifying SMTP connection...');
    const isConnected = await emailService.verifyConnection();
    
    if (!isConnected) {
      console.error('❌ SMTP connection verification failed');
      return;
    }
    
    console.log('✅ SMTP connection verified successfully');
    console.log('');

    // Send test email
    const recipientEmail = 'panchalajay717@gmail.com';
    console.log(`📤 Sending test email to: ${recipientEmail}`);
    
    const result = await emailService.sendTestEmail(recipientEmail);
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📬 Recipient: ${recipientEmail}`);
      console.log('');
      console.log('🎉 Email test completed successfully!');
      console.log('Check the recipient\'s inbox (and spam folder) for the test email.');
    } else {
      console.error('❌ Failed to send test email:');
      console.error(`   Error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Error during email test:');
    console.error(error.message);
    console.error('');
    console.error('🔧 Troubleshooting tips:');
    console.error('1. Check your SMTP credentials in .env file');
    console.error('2. Ensure 2FA is enabled and you\'re using an App Password for Gmail');
    console.error('3. Verify your internet connection');
    console.error('4. Check if your email provider allows SMTP access');
  }
}

// Run the test
sendTestEmail();
