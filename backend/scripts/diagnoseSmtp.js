require('dotenv').config();
require('dotenv').config({ path: './config/production.env' });

const normalizeSmtpValue = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim().replace(/^['"]|['"]$/g, '');
};

console.log('🔍 SMTP Diagnostic Tool\n');
console.log('='.repeat(60));

// Check raw environment variables
console.log('\n📋 Raw Environment Variables:');
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'NOT SET'}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 'NOT SET'}`);
console.log(`   SMTP_SECURE: ${process.env.SMTP_SECURE || 'NOT SET'}`);
console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'NOT SET'}`);
console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? `"${process.env.SMTP_PASS.substring(0, 5)}***" (length: ${process.env.SMTP_PASS.length})` : 'NOT SET'}`);

// Check for common issues
console.log('\n🔍 Checking for Common Issues:');
const rawPass = process.env.SMTP_PASS || '';
const rawUser = process.env.SMTP_USER || '';

if (!rawUser) {
  console.log('   ❌ SMTP_USER is not set');
} else {
  console.log(`   ✅ SMTP_USER is set: ${rawUser}`);
  if (rawUser.startsWith('"') || rawUser.startsWith("'")) {
    console.log('   ⚠️  SMTP_USER has quotes - will be stripped');
  }
}

if (!rawPass) {
  console.log('   ❌ SMTP_PASS is not set');
} else {
  console.log(`   ✅ SMTP_PASS is set (length: ${rawPass.length})`);
  if (rawPass.startsWith('"') || rawPass.startsWith("'")) {
    console.log('   ⚠️  SMTP_PASS has quotes - will be stripped');
  }
  if (rawPass.includes(' ')) {
    console.log('   ⚠️  SMTP_PASS contains spaces');
  }
}

// Normalize values
console.log('\n📋 Normalized Values:');
const normalizedUser = normalizeSmtpValue(process.env.SMTP_USER);
const normalizedPass = normalizeSmtpValue(process.env.SMTP_PASS);

console.log(`   User: ${normalizedUser || 'NULL'}`);
console.log(`   Pass: ${normalizedPass ? `${normalizedPass.substring(0, 3)}*** (length: ${normalizedPass.length})` : 'NULL'}`);

// Test SMTP connection
console.log('\n🔌 Testing SMTP Connection...');
console.log('='.repeat(60));

const nodemailer = require('nodemailer');

const smtpPort = Number.parseInt(process.env.SMTP_PORT, 10) || 465;
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: smtpPort,
  secure: typeof process.env.SMTP_SECURE === 'string'
    ? process.env.SMTP_SECURE.toLowerCase() === 'true'
    : smtpPort === 465,
  auth: {
    user: normalizedUser,
    pass: normalizedPass
  },
  tls: {
    rejectUnauthorized: false
  }
};

console.log('\n📧 SMTP Configuration:');
console.log(`   Host: ${smtpConfig.host}`);
console.log(`   Port: ${smtpConfig.port}`);
console.log(`   Secure: ${smtpConfig.secure}`);
console.log(`   User: ${smtpConfig.auth.user || 'NULL'}`);
console.log(`   Pass Length: ${smtpConfig.auth.pass ? smtpConfig.auth.pass.length : 0}`);

const transporter = nodemailer.createTransport(smtpConfig);

transporter.verify()
  .then(() => {
    console.log('\n✅ SMTP Connection Successful!');
    console.log('   Email service is configured correctly.');
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n❌ SMTP Connection Failed!');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    console.log(`   Response Code: ${error.responseCode}`);
    console.log(`   Response: ${error.response}`);
    
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('   1. Verify the password is correct in Hostinger email settings');
    console.log('   2. Check if SMTP is enabled for the email account');
    console.log('   3. Try resetting the email password in Hostinger');
    console.log('   4. Ensure the password in .env file has no extra quotes');
    console.log('   5. Check if the email account is locked or suspended');
    console.log('   6. Verify SMTP_HOST is correct: smtp.hostinger.com');
    console.log('   7. Verify SMTP_PORT is correct: 465');
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log('\n💡 Authentication Error Detected:');
      console.log('   - The password might be incorrect');
      console.log('   - The password might have expired');
      console.log('   - SMTP authentication might be disabled in Hostinger');
      console.log('   - Try using an App Password if available');
    }
    
    process.exit(1);
  });

