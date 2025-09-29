const smsIndiaHubService = require('../services/smsService');

/**
 * Send OTP via SMS using SMSIndia Hub
 * @param {string} phone - Phone number to send SMS to
 * @param {string} otp - OTP code to send
 * @returns {Promise<Object>} - Response object
 */
const sendOTP = async (phone, otp) => {
  try {
    console.log(`Attempting to send OTP ${otp} to phone: ${phone}`);
    
    const result = await smsIndiaHubService.sendOTP(phone, otp);
    
    console.log(`SMS sent successfully via SMSIndia Hub:`, result);
    return result;
    
  } catch (error) {
    console.error('Failed to send OTP via SMSIndia Hub:', error.message);
    
    // Re-throw the error to be handled by the calling function
    throw new Error(`SMS sending failed: ${error.message}`);
  }
};

/**
 * Send booking confirmation SMS
 * @param {string} phone - Phone number
 * @param {string} bookingNumber - Booking number
 * @param {string} serviceType - Service type
 * @param {string} date - Booking date
 * @param {string} time - Booking time
 * @returns {Promise}
 */
const sendBookingConfirmationSMS = async (phone, bookingNumber, serviceType, date, time) => {
  try {
    const message = `Your Fixifly booking #${bookingNumber} is confirmed! Service: ${serviceType}, Date: ${date}, Time: ${time}. We'll contact you soon.`;
    return await smsIndiaHubService.sendOTP(phone, message);
  } catch (error) {
    console.error('Error sending booking confirmation SMS:', error);
    throw error;
  }
};

/**
 * Send status update SMS
 * @param {string} phone - Phone number
 * @param {string} status - Booking status
 * @param {string} details - Additional details
 * @returns {Promise}
 */
const sendStatusUpdateSMS = async (phone, status, details) => {
  try {
    const message = `Fixifly Status Update: ${status}. ${details ? details : ''} Thank you for choosing Fixifly.`;
    return await smsIndiaHubService.sendOTP(phone, message);
  } catch (error) {
    console.error('Error sending status update SMS:', error);
    throw error;
  }
};

/**
 * Get SMSIndia Hub account balance
 * @returns {Promise<Object>} - Balance information
 */
const getSMSBalance = async () => {
  try {
    return await smsIndiaHubService.getBalance();
  } catch (error) {
    console.error('Error fetching SMS balance:', error);
    throw error;
  }
};

/**
 * Get delivery status of a message
 * @param {string} messageId - Message ID to check
 * @returns {Promise<Object>} - Delivery status
 */
const getDeliveryStatus = async (messageId) => {
  try {
    return await smsIndiaHubService.getDeliveryStatus(messageId);
  } catch (error) {
    console.error('Error fetching delivery status:', error);
    throw error;
  }
};

/**
 * Test SMSIndia Hub connection
 * @returns {Promise<Object>} - Test result
 */
const testSMSConnection = async () => {
  try {
    return await smsIndiaHubService.testConnection();
  } catch (error) {
    console.error('Error testing SMS connection:', error);
    throw error;
  }
};

module.exports = {
  sendOTP,
  sendBookingConfirmationSMS,
  sendStatusUpdateSMS,
  getSMSBalance,
  getDeliveryStatus,
  testSMSConnection
};
