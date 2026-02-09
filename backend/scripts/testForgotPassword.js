require('dotenv').config();
const emailService = require('../services/emailService');

/**
 * Test script for forgot password functionality
 * Tests both vendor and user forgot password flows
 */

async function testForgotPassword() {
  console.log('🔐 Testing Forgot Password Email Functionality\n');
  console.log('='.repeat(60));

  // Check email service configuration
  console.log('\n📧 SMTP Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST || 'smtp.hostinger.com'}`);
  console.log(`   Port: ${process.env.SMTP_PORT || 465}`);
  console.log(`   User: ${process.env.SMTP_USER || 'NOT SET'}`);
  console.log(`   Pass: ${process.env.SMTP_PASS ? '***configured***' : 'NOT SET'}`);
  console.log(`   Pass Length: ${process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0} characters`);
  console.log('');

  // Check for common issues
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP credentials not found in .env file');
    console.error('   Please ensure SMTP_USER and SMTP_PASS are set');
    return;
  }

  if (process.env.SMTP_PASS.includes(' ')) {
    console.log('⚠️  Warning: Password contains spaces. Make sure it\'s correctly formatted in .env file');
  }

  // Check if email service is configured
  if (!emailService.isEmailConfigured()) {
    console.error('❌ Email service not configured. Please check your SMTP settings in .env file.');
    return;
  }

  console.log('✅ Email service is configured');

  // Verify SMTP connection
  console.log('\n🔍 Verifying SMTP connection...');
  const isConnected = await emailService.verifyConnection();

  if (!isConnected) {
    console.error('❌ SMTP connection verification failed');
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Verify Hostinger Email Password is correct');
    console.error('   2. Ensure SMTP is enabled for your Hostinger email account');
    console.error('   3. Verify SMTP_HOST is smtp.hostinger.com and SMTP_PORT is 465');
    console.error('   4. Verify SMTP_PASS in .env file has no extra quotes or spaces');
    console.error('   5. Check if your IP is blacklisted or if there are any restrictions on Hostinger side');
    return;
  }

  console.log('✅ SMTP connection verified successfully');
  console.log('');

  // Test email addresses
  const testEmail = 'panchalajay717@gmail.com';
  const testOTP = '123456';
  const testName = 'Test User';

  console.log('='.repeat(60));
  console.log('\n📤 Testing Vendor Forgot Password OTP Email');
  console.log('='.repeat(60));

  try {
    const vendorResult = await emailService.sendForgotPasswordOTP(
      testEmail,
      testOTP,
      testName
    );

    if (vendorResult.success) {
      console.log('✅ Vendor forgot password OTP email sent successfully!');
      console.log(`📧 Message ID: ${vendorResult.messageId}`);
      console.log(`📬 Recipient: ${testEmail}`);
      console.log(`🔑 OTP: ${testOTP}`);
    } else {
      console.error('❌ Failed to send vendor forgot password OTP email:');
      console.error(`   Error: ${vendorResult.error || vendorResult.message}`);
    }
  } catch (error) {
    console.error('❌ Exception while sending vendor forgot password OTP email:');
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📤 Testing User Forgot Password OTP Email');
  console.log('='.repeat(60));

  try {
    const userResult = await emailService.sendUserForgotPasswordOTP(
      testEmail,
      testOTP,
      testName
    );

    if (userResult.success) {
      console.log('✅ User forgot password OTP email sent successfully!');
      console.log(`📧 Message ID: ${userResult.messageId}`);
      console.log(`📬 Recipient: ${testEmail}`);
      console.log(`🔑 OTP: ${testOTP}`);
    } else {
      console.error('❌ Failed to send user forgot password OTP email:');
      console.error(`   Error: ${userResult.error || userResult.message}`);
    }
  } catch (error) {
    console.error('❌ Exception while sending user forgot password OTP email:');
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 Forgot Password Email Test Completed!');
  console.log('='.repeat(60));
  console.log('\n📝 Next Steps:');
  console.log('   1. Check the recipient email inbox (and spam folder)');
  console.log('   2. Verify that OTP emails are received');
  console.log('   3. Test the complete forgot password flow in the application');
  console.log('');
}

// Run the test
testForgotPassword()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });

