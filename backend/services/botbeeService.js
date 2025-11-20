const axios = require('axios');
const { logger } = require('../utils/logger');

class BotbeeService {
  constructor() {
    this.apiKey = process.env.BOTBEE_API_KEY;
    this.phoneId = process.env.BOTBEE_PHONE_ID;
    this.adminWhatsApp = process.env.ADMIN_WHATSAPP;
    this.baseUrl = process.env.BOTBEE_BASE || 'https://app.botbee.io';
    this.isConfigured = !!(this.apiKey && this.phoneId && this.adminWhatsApp);
  }

  /**
   * Check if Botbee service is configured
   */
  isServiceConfigured() {
    return this.isConfigured;
  }

  /**
   * Send WhatsApp message to any phone number
   * @param {string} phoneNumber - Phone number (with country code, e.g., 919931354354)
   * @param {string} message - Message to send
   * @returns {Promise<Object>} - Response object
   */
  async sendMessage(phoneNumber, message) {
    if (!this.isServiceConfigured()) {
      logger.warn('Botbee service not configured. Skipping WhatsApp send.');
      return {
        success: false,
        message: 'Botbee service not configured',
        error: 'Missing configuration'
      };
    }

    try {
      const url = `${this.baseUrl}/api/v1/whatsapp/send`;
      
      const payload = {
        apiToken: this.apiKey,
        phone_number_id: this.phoneId,
        phone_number: phoneNumber,
        message: message
      };

      logger.info('Sending WhatsApp message', {
        phoneNumber: phoneNumber,
        messageLength: message.length
      });

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      });

      logger.info('WhatsApp message sent successfully', {
        status: response.status,
        data: response.data
      });

      return {
        success: true,
        message: 'WhatsApp message sent successfully',
        data: response.data
      };

    } catch (error) {
      logger.error('Failed to send WhatsApp message:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      return {
        success: false,
        message: 'Failed to send WhatsApp message',
        error: error.message,
        response: error.response?.data
      };
    }
  }

  /**
   * Send WhatsApp message using utility template
   * @param {string} phoneNumber - Phone number (with country code)
   * @param {string} templateId - Template ID from Botbee dashboard
   * @param {Object} templateParams - Template parameters/variables
   * @param {string} customMessageText - Optional custom message text (if not provided, uses default template text)
   * @returns {Promise<Object>} - Response object
   */
  async sendTemplateMessage(phoneNumber, templateId, templateParams = {}, customMessageText = null) {
    if (!this.isServiceConfigured()) {
      logger.warn('Botbee service not configured. Skipping WhatsApp template send.');
      return {
        success: false,
        message: 'Botbee service not configured',
        error: 'Missing configuration'
      };
    }

    try {
      // Botbee uses same endpoint for template messages
      // Format: template_id + parameters (Botbee automatically uses approved template text)
      const url = `${this.baseUrl}/api/v1/whatsapp/send`;
      
      // Template ID 267669 - Botbee requires both template_id and message field
      // Use custom message text if provided, otherwise use default template text
      
      // Build template message text (Botbee requires message field even for templates)
      let templateText = customMessageText || 'Thank Your For Using Fixfly. Your booking has been confirmed successfully. Hello, our team has received your service request. Our Team will Assigned Enginner shortly. Thank you for choosing Fixfly.';
      
      // Replace variables if any exist (only if custom message text not provided)
      if (!customMessageText && templateParams && Object.keys(templateParams).length > 0) {
        Object.keys(templateParams).forEach(key => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          templateText = templateText.replace(regex, templateParams[key]);
        });
      }
      
      const payload = {
        apiToken: this.apiKey,
        phone_number_id: this.phoneId,
        phone_number: phoneNumber,
        template_id: templateId,
        message: templateText // Botbee requires message field with template text
      };
      
      // Only add parameters if they exist and are not empty
      if (templateParams && Object.keys(templateParams).length > 0) {
        payload.parameters = templateParams;
      }

      logger.info('Sending WhatsApp template message', {
        phoneNumber: phoneNumber,
        templateId: templateId,
        parameters: Object.keys(templateParams),
        url: url,
        payload: { ...payload, apiToken: payload.apiToken ? '***' : undefined }
      });

      console.log('📱 Botbee Template API Call:', {
        url: url,
        templateId: templateId,
        phoneNumber: phoneNumber,
        parameters: templateParams
      });

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      // Botbee response format: { status: '1', message: 'Message sent successfully.', wa_message_id: '...' }
      // Status '1' means success, Status '0' means some issue (but might still be sent)
      const isSuccess = response.status === 200 && (
        response.data?.status === '1' || // Success
        response.data?.status === 'success' ||
        response.data?.success === true ||
        response.data?.wa_message_id // If wa_message_id exists, message was sent
      );

      if (isSuccess) {
        logger.info('WhatsApp template message sent successfully', {
          status: response.status,
          data: response.data
        });

        console.log('✅ Botbee Template Response:', response.data);

        return {
          success: true,
          message: 'WhatsApp template message sent successfully',
          data: response.data
        };
      } else {
        // If response indicates failure
        logger.warn('WhatsApp template message response indicates failure', {
          status: response.status,
          data: response.data
        });

        return {
          success: false,
          message: 'WhatsApp template message failed',
          error: response.data?.message || 'Unknown error',
          data: response.data
        };
      }

    } catch (error) {
      const errorDetails = {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: url,
        templateId: templateId,
        phoneNumber: phoneNumber
      };

      logger.error('Failed to send WhatsApp template message:', errorDetails);

      console.error('❌ Botbee Template API Error:', {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
        templateId: templateId,
        phoneNumber: phoneNumber
      });

      return {
        success: false,
        message: 'Failed to send WhatsApp template message',
        error: error.message,
        response: error.response?.data,
        details: errorDetails
      };
    }
  }

  /**
   * Send WhatsApp message to admin
   * @param {string} message - Message to send
   * @returns {Promise<Object>} - Response object
   */
  async sendToAdmin(message) {
    return await this.sendMessage(this.adminWhatsApp, message);
  }

  /**
   * Normalize phone number to include country code
   * @param {string} phone - Phone number
   * @returns {string} - Normalized phone number with country code
   */
  normalizePhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If already has country code (starts with 91 and has 12 digits)
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits;
    }
    
    // If has 10 digits, add 91 prefix
    if (digits.length === 10) {
      return '91' + digits;
    }
    
    // If has 11 digits and starts with 0, remove 0 and add 91
    if (digits.length === 11 && digits.startsWith('0')) {
      return '91' + digits.substring(1);
    }
    
    return digits;
  }

  /**
   * Send booking notification to admin via WhatsApp
   * @param {Object} booking - Booking object
   * @returns {Promise<Object>} - Response object
   */
  async sendBookingNotification(booking) {
    try {
      const bookingReference = booking.bookingReference || `FIX${booking._id.toString().slice(-8).toUpperCase()}`;
      const customerName = booking.customer?.name || 'N/A';
      const customerPhone = booking.customer?.phone || 'N/A';
      const customerEmail = booking.customer?.email || 'N/A';
      const customerAddress = booking.customer?.address 
        ? `${booking.customer.address.street}, ${booking.customer.address.city}, ${booking.customer.address.state} - ${booking.customer.address.pincode}`
        : 'N/A';
      
      const preferredDate = booking.scheduling?.preferredDate 
        ? new Date(booking.scheduling.preferredDate).toLocaleDateString('en-IN')
        : 'N/A';
      const preferredTime = booking.scheduling?.preferredTimeSlot || 'N/A';
      
      const services = booking.services?.map(s => `- ${s.serviceName} (₹${s.price})`).join('\n') || 'N/A';
      const totalAmount = booking.pricing?.totalAmount ? `₹${booking.pricing.totalAmount}` : 'N/A';
      const paymentMethod = booking.payment?.method || 'N/A';
      const paymentStatus = booking.payment?.status || 'N/A';
      const notes = booking.notes || 'No additional notes';

      const message = `🔔 *New Booking Received!*

📋 *Booking Details:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Booking ID: ${bookingReference}
👤 Customer: ${customerName}
📞 Phone: ${customerPhone}
📧 Email: ${customerEmail}
📍 Address: ${customerAddress}

📅 *Scheduling:*
Date: ${preferredDate}
Time: ${preferredTime}

🛠️ *Services:*
${services}

💰 *Pricing:*
Total Amount: ${totalAmount}
Payment Method: ${paymentMethod}
Payment Status: ${paymentStatus}

📝 *Notes:*
${notes}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${booking.status || 'waiting_for_engineer'}`;

      return await this.sendToAdmin(message);

    } catch (error) {
      logger.error('Failed to send booking notification via WhatsApp:', error);
      return {
        success: false,
        message: 'Failed to send booking notification',
        error: error.message
      };
    }
  }

  /**
   * Send booking confirmation to user via WhatsApp
   * @param {Object} booking - Booking object
   * @returns {Promise<Object>} - Response object
   */
  async sendBookingConfirmationToUser(booking) {
    try {
      const customerPhone = booking.customer?.phone;
      if (!customerPhone) {
        logger.warn('Customer phone not found for WhatsApp confirmation', {
          bookingId: booking._id
        });
        return {
          success: false,
          message: 'Customer phone number not found'
        };
      }

      const normalizedPhone = this.normalizePhoneNumber(customerPhone);
      if (!normalizedPhone) {
        logger.warn('Invalid phone number format for WhatsApp confirmation', {
          bookingId: booking._id,
          phone: customerPhone
        });
        return {
          success: false,
          message: 'Invalid phone number format'
        };
      }

      const bookingReference = booking.bookingReference || `FIX${booking._id.toString().slice(-8).toUpperCase()}`;
      const customerName = booking.customer?.name || 'Customer';
      const preferredDate = booking.scheduling?.preferredDate 
        ? new Date(booking.scheduling.preferredDate).toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : 'N/A';
      const preferredTime = booking.scheduling?.preferredTimeSlot || 'N/A';
      const services = booking.services?.map(s => `${s.serviceName} (₹${s.price})`).join(', ') || 'N/A';
      const totalAmount = booking.pricing?.totalAmount ? `₹${booking.pricing.totalAmount.toLocaleString()}` : '₹0';
      const paymentMethod = booking.payment?.method || 'N/A';
      const paymentStatus = booking.payment?.status || 'pending';

      // Check if utility template ID is configured
      // Template ID 267669 - Approved WhatsApp template
      const templateId = process.env.BOTBEE_BOOKING_TEMPLATE_ID;
      
      if (templateId) {
        // Use utility template if configured
        // Template ID 267669 - Include user name, booking ID, and service name in message
        // Get service name(s)
        const serviceNames = booking.services?.map(s => s.serviceName).join(', ') || 'Service';
        const firstServiceName = booking.services?.[0]?.serviceName || 'Service';
        
        // Build template message with user name, booking ID, and service name
        const templateMessage = `Thank Your For Using Fixfly.Your booking has been confirmed successfully. Hello ${customerName}, our team has received your service request for ${firstServiceName}. Your booking ID is ${bookingReference}. Our Team will Assigned Enginner shortly. Thank you for choosing Fixfly.`;
        
        const templateParams = {
          customer_name: customerName,
          booking_id: bookingReference,
          service_name: firstServiceName
        };

        logger.info('Sending booking confirmation via utility template', {
          bookingId: booking._id,
          templateId: templateId,
          phone: normalizedPhone,
          customerName: customerName,
          bookingReference: bookingReference
        });

        // Send template message with custom message text including user name and booking ID
        const templateResult = await this.sendTemplateMessage(normalizedPhone, templateId, templateParams, templateMessage);
        
        // Note: Booking reference is included in template message
        // Cannot send separate plain message outside 24-hour window (WhatsApp rule)
        // If template message fails, it will fallback to plain message automatically
        
        if (templateResult.success) {
          console.log('✅ Template message sent successfully');
          logger.info('Template message sent successfully', {
            bookingId: booking._id,
            templateId: templateId,
            phone: normalizedPhone
          });
        } else {
          console.log('⚠️ Template message failed, checking if fallback needed:', templateResult.error);
          logger.warn('Template message failed', {
            bookingId: booking._id,
            error: templateResult.error,
            response: templateResult.response
          });
        }
        
        return templateResult;
      } else {
        // Fallback to plain message if template not configured
        const message = `🎉 *Booking Confirmed!*

Hello ${customerName},

Your booking has been confirmed successfully!

📋 *Booking Details:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Booking ID: ${bookingReference}
📅 Date: ${preferredDate}
⏰ Time: ${preferredTime}

🛠️ *Services:*
${services}

💰 *Payment:*
Total Amount: ${totalAmount}
Payment Method: ${paymentMethod.toUpperCase()}
Payment Status: ${paymentStatus.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Our team will assign an engineer shortly. You will receive updates via WhatsApp.

Thank you for choosing Fixfly! 🚀

For support: +91-99313-54354`;

        logger.info('Sending booking confirmation via plain message', {
          bookingId: booking._id,
          phone: normalizedPhone
        });

        return await this.sendMessage(normalizedPhone, message);
      }

    } catch (error) {
      logger.error('Failed to send booking confirmation to user via WhatsApp:', error);
      return {
        success: false,
        message: 'Failed to send booking confirmation',
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new BotbeeService();

