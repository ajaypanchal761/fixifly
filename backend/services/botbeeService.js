const axios = require('axios');
const { logger } = require('../utils/logger');

class BotbeeService {
  constructor() {
    this.apiKey = process.env.BOTBEE_API_KEY;
    this.phoneId = process.env.BOTBEE_PHONE_ID;
    this.adminWhatsApp = process.env.ADMIN_WHATSAPP;
    this.bookingTemplateId = process.env.BOTBEE_BOOKING_TEMPLATE_ID || '313747';
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
        mobile: phoneNumber,
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
  async sendTemplateMessage(phoneNumber, templateId, templateParams = []) {
    if (!this.isServiceConfigured()) {
      logger.warn('Botbee service not configured. Skipping WhatsApp template send.');
      return {
        success: false,
        message: 'Botbee service not configured',
        error: 'Missing configuration'
      };
    }

    const url = `${this.baseUrl}/api/v1/whatsapp/send`;
    try {
      // Botbee uses same endpoint for template messages
      // Modified payload to match Botbee's expected format for templates
      const botbeePayload = {
        apiToken: this.apiKey,
        phone_number_id: this.phoneId,
        mobile: phoneNumber,
        type: "template",
      };

      // If templateId is a numeric ID (like in our config), use template_id
      // Otherwise use the Meta-style template object as fallback
      if (templateId && !isNaN(templateId)) {
        // Updated to use the specific format from user's curl request
        // https://app.botbee.io/api/v1/whatsapp/send/template
        const templateUri = `${this.baseUrl}/api/v1/whatsapp/send/template`;

        // Use URLSearchParams for form-data format as seen in the curl example
        const params = new URLSearchParams();
        params.append('apiToken', this.apiKey);
        params.append('phone_number_id', this.phoneId);
        params.append('template_id', String(templateId));
        params.append('phone_number', phoneNumber);

        // Dynamically add template variables based on the curl format:
        // templateVariable-[name]-[index]
        // For booking: serviceName (1), bookingId (2)
        if (Array.isArray(templateParams)) {
          // Mapping array params to specific keys if needed, 
          // but for booking we know the order: 0: customerName, 1: bookingReference
          params.append('templateVariable-serviceName-1', String(templateParams[0] || 'Customer'));
          params.append('templateVariable-bookingId-2', String(templateParams[1] || 'N/A'));
        }

        console.log("📤 BOTBEE DYNAMIC TEMPLATE REQUEST:", templateUri, params.toString());

        const response = await axios.post(templateUri, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000
        });

        const isSuccess = response.status === 200 && (
          String(response.data?.status) === '1' ||
          response.data?.success === true
        );

        if (isSuccess) {
          logger.info('WhatsApp dynamic template message sent successfully', { data: response.data });
          return { success: true, message: 'Sent successfully', data: response.data };
        } else {
          logger.warn('WhatsApp dynamic template failed', { data: response.data });
          return { success: false, message: response.data?.message || 'Failed', data: response.data };
        }
      } else {
        // Fallback for named templates (JSON format)
        const components = [
          {
            type: "body",
            parameters: templateParams.map(param => ({ type: "text", text: String(param) }))
          }
        ];

        botbeePayload.template = {
          name: templateId,
          language: { code: "en_US" },
          components: components
        };
      }

      // Log for fallback/named templates
      console.log("📤 BOTBEE TEMPLATE PAYLOAD (JSON):", JSON.stringify(botbeePayload, null, 2));

      const response = await axios.post(url, botbeePayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      const isSuccess = response.status === 200 && (
        response.data?.status === '1' ||
        response.data?.success === true
      );

      if (isSuccess) {
        return { success: true, message: 'Success', data: response.data };
      } else {
        return { success: false, message: response.data?.message || 'Failed', data: response.data };
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
   * Send a custom template notification with dynamic ID and data
   * @param {string} phoneNumber - Recipient phone number
   * @param {number|string} templateId - Botbee Template ID
   * @param {Array|Object} data - Template parameters (array or object)
   * @returns {Promise<Object>} - Response object
   */
  async sendCustomNotification(phoneNumber, templateId, data) {
    if (!phoneNumber || !templateId) {
      return { success: false, message: 'Phone number and Template ID are required' };
    }

    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      return { success: false, message: 'Invalid phone number format' };
    }

    return await this.sendTemplateMessage(normalizedPhone, templateId, data);
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
      const firstServiceName = booking.services?.[0]?.serviceName || 'Repair';
      const preferredDate = booking.scheduling?.preferredDate
        ? new Date(booking.scheduling.preferredDate).toLocaleDateString('en-US', {
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
      // Template Name: 313747 (Updated based on user request)
      // Locale: en_US (English US)
      // Use configured template ID or fallback to name
      const templateName = this.bookingTemplateId || '313747';

      if (templateName) {
        // Use utility template 
        // Required format: {{1}} = Customer Name (#!serviceName!#), {{2}} = Booking ID (#!bookingId!#)

        const templateData = [
          customerName,
          bookingReference
        ];

        logger.info('Sending booking confirmation via custom template', {
          bookingId: booking._id,
          templateName: templateName,
          phone: normalizedPhone,
          customerName: customerName,
          bookingReference: bookingReference,
          service: firstServiceName
        });

        // Pass 'en_US' as a language parameter if the method supports it, 
        // or ensure sendCustomNotification handles it.
        // For now, we pass the NAME as the ID.
        const templateResult = await this.sendCustomNotification(normalizedPhone, templateName, templateData);

        console.log(`\n🚀 Sending WhatsApp Booking Confirmation to ${normalizedPhone} (Template: ${templateName})...`);

        if (templateResult.success) {
          this.logResult('Template', true, `Sent to ${normalizedPhone}`);
          console.log('✅ Template message sent successfully');
          logger.info('Template message sent successfully', {
            bookingId: booking._id,
            templateName: templateName,
            phone: normalizedPhone
          });
        } else {
          this.logResult('Template', false, `Error: ${templateResult.error}`);
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
        // Exact text required by user:
        // Thank Your For Using Fixfly.Your booking has been confirmed successfully. Hello #!serviceName!#, our team has received your service request for Repair. Your booking ID is #!bookingId!#. Our Team will Assigned Enginner shortly. Thank you for choosing Fixfly.
        const message = `Thank Your For Using Fixfly.Your booking has been confirmed successfully. Hello ${customerName}, our team has received your service request for ${firstServiceName}. Your booking ID is ${bookingReference}. Our Team will Assigned Enginner shortly. Thank you for choosing Fixfly.`;

        logger.info('Sending booking confirmation via plain message', {
          bookingId: booking._id,
          phone: normalizedPhone
        });

        return await this.sendMessage(normalizedPhone, message);
      }

    } catch (error) {
      console.error('❌ Failed to send booking confirmation WhatsApp:', error.message);
      logger.error('Failed to send booking confirmation to user via WhatsApp:', error);
      return {
        success: false,
        message: 'Failed to send booking confirmation',
        error: error.message
      };
    }
  }

  // Helper method to log results prominently
  logResult(type, success, details) {
    if (success) {
      console.log(`\n✅ [WhatsApp ${type}] SUCCESS - ${details}`);
    } else {
      console.log(`\n❌ [WhatsApp ${type}] FAILED - ${details}`);
    }
  }
  /**
   * Send status update to user via WhatsApp
   * @param {Object} booking - Booking object
   * @param {string} status - New status
   * @returns {Promise<Object>} - Response object
   */
  async sendStatusUpdateToUser(booking, status) {
    try {
      const customerPhone = booking.customer?.phone;
      if (!customerPhone) {
        logger.warn('Customer phone not found for WhatsApp status update', {
          bookingId: booking._id
        });
        return {
          success: false,
          message: 'Customer phone number not found'
        };
      }

      const normalizedPhone = this.normalizePhoneNumber(customerPhone);
      if (!normalizedPhone) {
        logger.warn('Invalid phone number format for WhatsApp status update', {
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

      let statusMessage = '';
      let emoji = 'ℹ️';

      switch (status) {
        case 'confirmed':
          statusMessage = 'Your booking has been confirmed! An engineer will be assigned shortly.';
          emoji = '✅';
          break;
        case 'in_progress':
          statusMessage = 'Your service has started! Our engineer is working on your request.';
          emoji = '⚙️';
          break;
        case 'completed':
          statusMessage = 'Your service has been completed successfully! Thank you for choosing Fixfly.';
          emoji = '🎉';
          break;
        case 'cancelled':
          statusMessage = 'Your booking has been cancelled.';
          emoji = '❌';
          break;
        case 'declined':
          statusMessage = 'Your booking request was declined. Please contact support for assistance.';
          emoji = '⚠️';
          break;
        case 'waiting_for_engineer':
          statusMessage = 'We are currently looking for an available engineer for your request.';
          emoji = '🔍';
          break;
        default:
          statusMessage = `Your booking status has been updated to: ${status.replace(/_/g, ' ')}`;
      }

      const message = `${emoji} *Status Update*

Hello ${customerName},

${statusMessage}

📋 *Booking Details:*
Booking ID: ${bookingReference}
Current Status: ${status.toUpperCase().replace(/_/g, ' ')}

You can track your booking in the Fixfly app or website.

For support: +91-99313-54354`;

      logger.info('Sending status update via WhatsApp', {
        bookingId: booking._id,
        phone: normalizedPhone,
        status: status
      });

      return await this.sendMessage(normalizedPhone, message);

    } catch (error) {
      logger.error('Failed to send status update to user via WhatsApp:', error);
      return {
        success: false,
        message: 'Failed to send status update',
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new BotbeeService();

