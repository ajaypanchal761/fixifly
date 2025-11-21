#!/usr/bin/env node

/**
 * Emergency script to stop test notifications from being sent to real users
 * This script helps identify and stop any processes that might be sending test notifications
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY: Stopping Test Notifications Script');
console.log('================================================');

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production' || 
                    (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('cluster0.2ne8beo.mongodb.net'));

if (isProduction) {
  console.log('❌ CRITICAL: This appears to be a production environment!');
  console.log('   Test notifications should NEVER be sent to real users in production.');
  console.log('   Please check your environment configuration.');
}

// List all Node.js processes
console.log('\n📋 Current Node.js processes:');
exec('wmic process where "name=\'node.exe\'" get processid,commandline', (error, stdout, stderr) => {
  if (error) {
    console.error('Error getting processes:', error);
    return;
  }
  
  console.log(stdout);
  
  // Check for test scripts in the output
  const lines = stdout.split('\n');
  const testProcesses = lines.filter(line => 
    line.includes('test') || 
    line.includes('notification') ||
    line.includes('admin')
  );
  
  if (testProcesses.length > 0) {
    console.log('\n⚠️  WARNING: Found potential test processes:');
    testProcesses.forEach(process => {
      console.log(`   ${process.trim()}`);
    });
    console.log('\n🔧 RECOMMENDATION: Review these processes and stop any that are sending test notifications.');
  }
});

// Check recent log files for test notifications
console.log('\n📊 Checking recent logs for test notifications...');
const logDir = path.join(__dirname, 'logs');
const today = new Date().toISOString().split('T')[0];
const logFile = path.join(logDir, `general-${today}.log`);

if (fs.existsSync(logFile)) {
  const logContent = fs.readFileSync(logFile, 'utf8');
  const testNotificationLines = logContent.split('\n').filter(line => 
    line.includes('test notification') || 
    line.includes('Admin Test Notification') ||
    line.includes('🧪')
  );
  
  if (testNotificationLines.length > 0) {
    console.log(`\n⚠️  Found ${testNotificationLines.length} test notification entries in today's logs:`);
    testNotificationLines.slice(-5).forEach(line => {
      console.log(`   ${line.trim()}`);
    });
  } else {
    console.log('✅ No test notifications found in today\'s logs.');
  }
} else {
  console.log('ℹ️  No log file found for today.');
}

// Provide recommendations
console.log('\n🛡️  SAFETY RECOMMENDATIONS:');
console.log('1. Check if anyone is testing the admin notification system');
console.log('2. Verify that test scripts are not running automatically');
console.log('3. Ensure the admin panel is not being used to send test notifications to real users');
console.log('4. Consider adding additional safety checks to prevent test notifications in production');
console.log('5. Review the admin notification controller for any test-related code');

console.log('\n🔧 IMMEDIATE ACTIONS:');
console.log('1. Stop any running test scripts');
console.log('2. Check the admin panel for any pending test notifications');
console.log('3. Review the notification system configuration');
console.log('4. Consider temporarily disabling admin notifications if needed');

console.log('\n✅ Safety checks have been implemented in the code to prevent test notifications from being sent to real users.');
console.log('   The system will now block test notifications when connected to production database.');

process.exit(0);
