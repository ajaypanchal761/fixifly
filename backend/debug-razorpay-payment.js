#!/usr/bin/env node

/**
 * Razorpay Payment Debug Script
 * This script helps diagnose Razorpay payment validation issues
 */

require('dotenv').config({ path: './config/production.env' });
const Razorpay = require('razorpay');

console.log('🔍 Razorpay Payment Debug Script');
console.log('================================');

// Check environment variables
console.log('\n📋 Environment Configuration:');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);
console.log('RAZORPAY_KEY_SECRET length:', process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.length : 0);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Initialize Razorpay
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay instance created successfully');
} catch (error) {
  console.error('❌ Failed to create Razorpay instance:', error.message);
  process.exit(1);
}

// Test Razorpay connection
async function testRazorpayConnection() {
  try {
    console.log('\n🧪 Testing Razorpay Connection...');
    
    // Try to create a test order
    const testOrder = await razorpay.orders.create({
      amount: 100, // 1 INR in paise
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now(),
      notes: {
        test: true,
        debug: true
      }
    });
    
    console.log('✅ Test order created successfully:');
    console.log('   Order ID:', testOrder.id);
    console.log('   Amount:', testOrder.amount);
    console.log('   Currency:', testOrder.currency);
    console.log('   Status:', testOrder.status);
    
    // Clean up - cancel the test order
    try {
      await razorpay.orders.cancel(testOrder.id);
      console.log('✅ Test order cancelled successfully');
    } catch (cancelError) {
      console.log('⚠️  Could not cancel test order (this is usually fine):', cancelError.message);
    }
    
  } catch (error) {
    console.error('❌ Razorpay connection test failed:');
    console.error('   Error:', error.message);
    console.error('   Status:', error.statusCode);
    console.error('   Details:', error.error);
  }
}

// Analyze the session token from the error
function analyzeSessionToken() {
  console.log('\n🔍 Session Token Analysis:');
  const sessionToken = '19F869826D4E74F273195840AE739CF7D52B0B20D7D207A99EB83C232E1D3E0B07340F99CBE08169D96B28340A65163576CC1BE7405C849172B2D2525DF13EAEEAE92238440E1818F4CA17F5207823ECB8297D6BF629A90C54B9C77D321543BB4ECE032C65E12B8E';
  
  console.log('Session Token Length:', sessionToken.length);
  console.log('Session Token Preview:', sessionToken.substring(0, 20) + '...');
  
  // Check if it looks like a valid session token
  if (sessionToken.length < 100) {
    console.log('⚠️  Session token seems too short');
  } else if (sessionToken.length > 200) {
    console.log('⚠️  Session token seems too long');
  } else {
    console.log('✅ Session token length looks reasonable');
  }
}

// Provide recommendations
function provideRecommendations() {
  console.log('\n💡 Recommendations:');
  console.log('1. Check if the session token is expired (Razorpay session tokens have a limited lifespan)');
  console.log('2. Ensure you\'re using the correct Razorpay keys for your environment');
  console.log('3. Verify that the payment flow is using the correct Razorpay integration method');
  console.log('4. Check Razorpay dashboard for any account issues or restrictions');
  console.log('5. Try creating a new payment session instead of reusing an old one');
  
  console.log('\n🔧 Immediate Actions:');
  console.log('1. Generate a new Razorpay order and session token');
  console.log('2. Check your Razorpay dashboard for any failed payments');
  console.log('3. Verify your Razorpay account status and limits');
  console.log('4. Test with a fresh payment flow');
  
  console.log('\n📞 If the issue persists:');
  console.log('1. Contact Razorpay support with the session token and error details');
  console.log('2. Check Razorpay status page for any service outages');
  console.log('3. Review your Razorpay integration documentation');
}

// Run the diagnostic
async function runDiagnostic() {
  analyzeSessionToken();
  await testRazorpayConnection();
  provideRecommendations();
  
  console.log('\n✅ Diagnostic completed');
  process.exit(0);
}

runDiagnostic().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
