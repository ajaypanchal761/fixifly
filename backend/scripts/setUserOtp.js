const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');

// Load environment variables (defaults to production.env if no .env is present)
require('dotenv').config({
  path: path.join(__dirname, '../config/production.env'),
});

const DEFAULT_PHONE = '+917610416911';
const DEFAULT_OTP = '110211';

const normalizePhone = (phone) => {
  if (!phone) return null;

  const digits = phone.toString().replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  if (phone.startsWith('+') && digits.length >= 10) {
    return phone;
  }

  return null;
};

const setUserOtp = async () => {
  const phoneInput = process.argv[2] || DEFAULT_PHONE;
  const otpCode = process.argv[3] || DEFAULT_OTP;

  const formattedPhone = normalizePhone(phoneInput);

  if (!formattedPhone) {
    console.error('❌ Invalid phone number provided:', phoneInput);
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ phone: formattedPhone });

    if (!user) {
      console.error(`❌ No user found with phone: ${formattedPhone}`);
      return;
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.otp = {
      code: otpCode,
      expiresAt,
    };

    await user.save();

    console.log('✅ OTP updated successfully for user:');
    console.log('   👤 Name :', user.name || 'N/A');
    console.log('   📱 Phone:', user.phone);
    console.log('   🔐 OTP  :', user.otp.code);
    console.log('   ⏰ Valid Till:', user.otp.expiresAt.toISOString());
  } catch (error) {
    console.error('❌ Error setting OTP:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

setUserOtp();

