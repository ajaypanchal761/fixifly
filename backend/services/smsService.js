const axios = require('axios');

/**
 * SMSIndia Hub SMS Service
 * Handles OTP sending via SMSIndia Hub API
 * Based on working implementation from Chalo Sawari project
 */
class SMSService {
  constructor() {
    this.apiKey = process.env.SMS_INDIA_HUB_API_KEY;
    this.senderId = process.env.SMS_INDIA_HUB_SENDER_ID;
    this.baseUrl = 'http://cloud.smsindiahub.in/vendorsms/pushsms.aspx';
    
    if (!this.apiKey || !this.senderId) {
      console.warn('⚠️ SMS India Hub credentials not configured. SMS functionality will be disabled.');
    }
  }

  /**
   * Check if SMS India Hub is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    // Load credentials dynamically in case they weren't available during construction
    const apiKey = this.apiKey || process.env.SMS_INDIA_HUB_API_KEY;
    const senderId = this.senderId || process.env.SMS_INDIA_HUB_SENDER_ID;
    
    return !!(apiKey && senderId);
  }

  /**
   * Normalize phone number to Indian format with country code
   * @param {string} phone - Phone number to normalize
   * @returns {string} - Normalized phone number with country code (91XXXXXXXXXX)
   */
  normalizePhoneNumber(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/[^0-9]/g, '');
    
    // If it already has country code 91 and is 12 digits, return as is
    if (digits.startsWith('91') && digits.length === 12) {
      return digits;
    }
    
    // If it's 10 digits, add country code 91
    if (digits.length === 10) {
      return '91' + digits;
    }
    
    // If it's 11 digits and starts with 0, remove the 0 and add country code
    if (digits.length === 11 && digits.startsWith('0')) {
      return '91' + digits.substring(1);
    }
    
    // Return with country code as fallback
    return '91' + digits.slice(-10);
  }

  /**
   * Send OTP via SMS using SMS India Hub
   * @param {string} phone - Phone number to send SMS to
   * @param {string} otp - OTP code to send
   * @returns {Promise<Object>} - Response object
   */
  async sendOTP(phone, otp) {
    try {
      // Load credentials dynamically
      const apiKey = this.apiKey || process.env.SMS_INDIA_HUB_API_KEY;
      const senderId = this.senderId || process.env.SMS_INDIA_HUB_SENDER_ID;
      
      if (!apiKey || !senderId) {
        throw new Error('SMS India Hub not configured. Please check your environment variables.');
      }

      const normalizedPhone = this.normalizePhoneNumber(phone);
      
      // Validate phone number (should be 12 digits with country code)
      if (normalizedPhone.length !== 12 || !normalizedPhone.startsWith('91')) {
        throw new Error(`Invalid phone number format: ${phone}. Expected 10-digit Indian mobile number.`);
      }

      // For now, use a simple message without template approval
      // Once template is approved by SMS India Hub, we can use proper message
      const message = `OTP:${otp}`;
      
      // Build the API URL with query parameters (as shown in the working example)
      const params = new URLSearchParams({
        APIKey: apiKey,
        msisdn: normalizedPhone,
        sid: senderId,
        msg: message,
        fl: '0', // Flash message flag (0 = normal SMS)
        dc: '0' // Delivery confirmation (0 = no confirmation)
        // Removed gwid to use default routing
      });

      const apiUrl = `${this.baseUrl}?${params.toString()}`;

      console.log(`📱 Sending OTP to ${normalizedPhone}: ${otp}`);

      // Make GET request to SMS India Hub API
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'Fixifly/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000 // 15 second timeout
      });

      console.log('📱 SMS India Hub Response Status:', response.status);
      console.log('📱 SMS India Hub Response Data:', response.data);

      // SMS India Hub typically returns HTML or plain text response
      const responseText = response.data.toString();
      
      // Parse the JSON response for specific error handling
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { ErrorCode: 'unknown', ErrorMessage: responseText };
      }

      // Check for specific error codes
      if (responseData.ErrorCode === '006') {
        // Invalid template error - but allow fallback for now
        console.log('⚠️ SMS template needs approval. Using fallback mechanism.');
        return {
          success: false,
          messageId: `fallback-${Date.now()}`,
          status: 'fallback',
          to: normalizedPhone,
          body: message,
          provider: 'SMS India Hub (Template Pending Approval)',
          response: responseText,
          error: 'Template needs approval from SMS India Hub'
        };
      } else if (responseData.ErrorCode === '000') {
        // Success
        return {
          success: true,
          messageId: responseData.JobId || `sms_${Date.now()}`,
          status: 'sent',
          to: normalizedPhone,
          body: message,
          provider: 'SMS India Hub',
          response: responseText
        };
      } else if (responseData.ErrorMessage && responseData.ErrorMessage.includes('Invalid template')) {
        // Template validation error
        throw new Error(`SMS template not approved: ${responseData.ErrorMessage}`);
      } else if (responseText.includes('success') || responseText.includes('sent') || responseText.includes('accepted')) {
        return {
          success: true,
          messageId: `sms_${Date.now()}`,
          status: 'sent',
          to: normalizedPhone,
          body: message,
          provider: 'SMS India Hub',
          response: responseText
        };
      } else {
        // Generic error response
        throw new Error(`SMS India Hub API error: ${responseText}`);
      }

    } catch (error) {
      // Handle specific error cases
      if (error.response) {
        const errorData = error.response.data;
        
        if (error.response.status === 401) {
          throw new Error('SMS India Hub authentication failed. Please check your API key.');
        } else if (error.response.status === 400) {
          throw new Error(`SMS India Hub request error: Invalid request parameters`);
        } else if (error.response.status === 429) {
          throw new Error('SMS India Hub rate limit exceeded. Please try again later.');
        } else if (error.response.status === 500) {
          throw new Error('SMS India Hub server error. Please try again later.');
        } else {
          throw new Error(`SMS India Hub API error (${error.response.status}): ${errorData}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('SMS India Hub request timeout. Please try again.');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Unable to connect to SMS India Hub service. Please check your internet connection.');
      } else if (error.code === 'ECONNRESET') {
        throw new Error('SMS India Hub connection was reset. Please try again.');
      }
      
      // Fallback: Log OTP for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Development Mode - OTP for ${phone}: ${otp}`);
        return {
          success: true,
          messageId: 'dev-' + Date.now(),
          message: 'OTP logged for development',
          data: { mode: 'development' }
        };
      }
      
      throw error;
    }
  }

  /**
   * Test SMS India Hub API connection and credentials
   * @returns {Promise<Object>} - Test result
   */
  async testConnection() {
    try {
      // Load credentials dynamically
      const apiKey = this.apiKey || process.env.SMS_INDIA_HUB_API_KEY;
      const senderId = this.senderId || process.env.SMS_INDIA_HUB_SENDER_ID;
      
      if (!apiKey || !senderId) {
        throw new Error('SMS India Hub not configured.');
      }

      // Test with a simple SMS to verify connection
      const testPhone = '919109992290'; // Use a test phone number
      const testMessage = 'Welcome to the Fixifly powered by SMSINDIAHUB. Your OTP for registration is 12345';
      
      const params = new URLSearchParams({
        APIKey: apiKey,
        msisdn: testPhone,
        sid: senderId,
        msg: testMessage,
        fl: '0',
        dc: '0',
        gwid: '2'
      });

      const testUrl = `${this.baseUrl}?${params.toString()}`;

      const response = await axios.get(testUrl, {
        headers: {
          'User-Agent': 'Fixifly/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });

      return {
        success: true,
        message: 'SMS India Hub connection successful',
        response: response.data.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get account balance from SMS India Hub
   * @returns {Promise<Object>} - Balance information
   */
  async getBalance() {
    try {
      // Load credentials dynamically
      const apiKey = this.apiKey || process.env.SMS_INDIA_HUB_API_KEY;
      
      if (!apiKey) {
        throw new Error('SMS India Hub not configured.');
      }

      // SMS India Hub balance API endpoint
      const balanceUrl = `http://cloud.smsindiahub.in/vendorsms/checkbalance.aspx?APIKey=${apiKey}`;
      
      const response = await axios.get(balanceUrl, {
        headers: {
          'User-Agent': 'Fixifly/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });

      const responseText = response.data.toString();

      // Parse balance from response (SMS India Hub typically returns balance as text)
      const balanceMatch = responseText.match(/(\d+\.?\d*)/);
      const balance = balanceMatch ? parseFloat(balanceMatch[1]) : 0;

      return {
        success: true,
        balance: balance,
        currency: 'INR',
        response: responseText
      };
    } catch (error) {
      throw new Error(`Failed to fetch SMS India Hub balance: ${error.message}`);
    }
  }

  /**
   * Get delivery status of a message
   * @param {string} messageId - Message ID to check
   * @returns {Promise<Object>} - Delivery status
   */
  async getDeliveryStatus(messageId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('SMS India Hub not configured.');
      }

      const response = await axios.get(`${this.baseUrl}delivery-status`, {
        params: {
          api_key: this.apiKey,
          message_id: messageId
        },
        timeout: 10000
      });

      return {
        success: true,
        messageId: messageId,
        status: response.data.status || 'unknown',
        deliveryTime: response.data.delivery_time || null
      };
    } catch (error) {
      console.error('Error fetching delivery status:', error.message);
      throw error;
    }
  }

  /**
   * Format phone number for Indian numbers (legacy method for compatibility)
   * @param {string} phoneNumber - Raw phone number
   * @returns {string|null} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    return this.normalizePhoneNumber(phoneNumber);
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - Is valid
   */
  validatePhoneNumber(phoneNumber) {
    const formatted = this.normalizePhoneNumber(phoneNumber);
    return formatted !== null && formatted.length === 12 && formatted.startsWith('91');
  }
}

// Create singleton instance
const smsService = new SMSService();

// Export both class and instance for flexibility
module.exports = smsService;
module.exports.SMSService = SMSService;
module.exports.default = smsService;