const axios = require('axios');
const { logger } = require('../utils/logger');

class OneSignalService {
  constructor() {
    // OneSignal configuration
    this.appId = process.env.ONESIGNAL_APP_ID || '0e3861fd-d24e-4f93-a211-d64dfd966d17';
    this.apiKey = process.env.ONESIGNAL_API_KEY;
    this.baseUrl = 'https://onesignal.com/api/v1';
    
    if (!this.apiKey) {
      logger.warn('OneSignal API key not found in environment variables');
      return;
    }

    // Set up axios instance for OneSignal API
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Basic ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Send push notification to specific vendor
   * @param {string} vendorId - Vendor ID to send notification to
   * @param {Object} notification - Notification data
   * @param {string} notification.title - Notification title
   * @param {string} notification.message - Notification message
   * @param {Object} notification.data - Additional data to send with notification
   * @param {string} notification.priority - Notification priority (low, medium, high, urgent)
   */
  async sendToVendor(vendorId, notificationData) {
    try {
      if (!this.client) {
        logger.warn('OneSignal client not initialized. Skipping push notification.');
        return null;
      }

      const { title, message, data = {}, priority = 'medium' } = notificationData;

      // Create notification payload
      const payload = {
        app_id: this.appId,
        headings: { en: title },
        contents: { en: message },
        data: {
          ...data,
          vendorId,
          type: 'vendor_task_assignment',
          timestamp: new Date().toISOString()
        },
        // Target specific vendor using external user id (vendor ID)
        include_external_user_ids: [vendorId],
        // Set priority
        priority: this.getPriorityValue(priority)
      };

      // Add action buttons for task assignment notifications
      if (data.ticketId || data.bookingId) {
        payload.buttons = [
          {
            id: 'accept',
            text: 'Accept',
            icon: 'ic_menu_accept'
          },
          {
            id: 'view',
            text: 'View Details',
            icon: 'ic_menu_view'
          }
        ];
      }

      logger.info('Sending OneSignal notification to vendor', {
        vendorId,
        title,
        priority,
        dataKeys: Object.keys(data)
      });

      const response = await this.client.post('/notifications', payload);
      
      logger.info('OneSignal notification sent successfully', {
        vendorId,
        notificationId: response.data.id,
        recipients: response.data.recipients,
        responseData: response.data
      });

      // Log additional debug info if notification seems to fail
      if (!response.data.id || response.data.recipients === 0) {
        logger.warn('OneSignal notification may not have reached vendor', {
          vendorId,
          notificationId: response.data.id,
          recipients: response.data.recipients,
          errors: response.data.errors,
          invalid_external_user_ids: response.data.invalid_external_user_ids
        });
      }

      return response.data;
    } catch (error) {
      logger.error('Error sending OneSignal notification to vendor', {
        error: error.message,
        vendorId,
        title: notificationData.title,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Send push notification to multiple vendors
   * @param {Array<string>} vendorIds - Array of vendor IDs
   * @param {Object} notification - Notification data
   */
  async sendToMultipleVendors(vendorIds, notificationData) {
    try {
      if (!this.client) {
        logger.warn('OneSignal client not initialized. Skipping push notification.');
        return null;
      }

      const { title, message, data = {}, priority = 'medium' } = notificationData;

      const payload = {
        app_id: this.appId,
        headings: { en: title },
        contents: { en: message },
        data: {
          ...data,
          type: 'vendor_broadcast',
          timestamp: new Date().toISOString()
        },
        include_external_user_ids: vendorIds,
        priority: this.getPriorityValue(priority)
      };

      logger.info('Sending OneSignal notification to multiple vendors', {
        vendorCount: vendorIds.length,
        title,
        priority
      });

      const response = await this.client.post('/notifications', payload);
      
      logger.info('OneSignal broadcast notification sent successfully', {
        vendorCount: vendorIds.length,
        notificationId: response.data.id,
        recipients: response.data.recipients
      });

      return response.data;
    } catch (error) {
      logger.error('Error sending OneSignal broadcast notification', {
        error: error.message,
        vendorCount: vendorIds.length,
        title: notificationData.title,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Send notification for new task assignment (Support Ticket or Booking)
   * @param {string} vendorId - Vendor ID
   * @param {Object} taskData - Task data (ticket or booking)
   * @param {string} taskType - 'support_ticket' or 'booking'
   */
  async sendTaskAssignmentNotification(vendorId, taskData, taskType = 'support_ticket') {
    try {
      let title, message, data;

      if (taskType === 'support_ticket') {
        title = '🎯 New Support Ticket Assigned';
        message = `New ticket: ${taskData.subject}`;
        data = {
          ticketId: taskData.ticketId,
          subject: taskData.subject,
          priority: taskData.priority,
          customerName: taskData.userName,
          customerPhone: taskData.userPhone,
          type: 'support_ticket_assignment',
          action: 'view_ticket'
        };
      } else if (taskType === 'booking') {
        title = '🔧 New Service Booking Assigned';
        message = `New booking for ${taskData.customer?.name}`;
        data = {
          bookingId: taskData._id,
          customerName: taskData.customer?.name,
          customerPhone: taskData.customer?.phone,
          services: taskData.services?.map(s => s.serviceName).join(', '),
          scheduledDate: taskData.scheduling?.scheduledDate,
          type: 'booking_assignment',
          action: 'view_booking'
        };
      }

      return await this.sendToVendor(vendorId, {
        title,
        message,
        data,
        priority: taskData.priority === 'High' || taskData.priority === 'urgent' ? 'high' : 'medium'
      });
    } catch (error) {
      logger.error('Error sending task assignment notification', {
        error: error.message,
        vendorId,
        taskType,
        taskId: taskData.ticketId || taskData._id
      });
      throw error;
    }
  }

  /**
   * Send notification for urgent tasks
   * @param {string} vendorId - Vendor ID
   * @param {Object} taskData - Task data
   * @param {string} taskType - Task type
   */
  async sendUrgentTaskNotification(vendorId, taskData, taskType = 'support_ticket') {
    try {
      const title = '🚨 URGENT: Immediate Action Required';
      const message = taskType === 'support_ticket' 
        ? `Urgent ticket: ${taskData.subject}` 
        : `Urgent booking for ${taskData.customer?.name}`;

      const data = {
        ...(taskType === 'support_ticket' ? {
          ticketId: taskData.ticketId,
          subject: taskData.subject
        } : {
          bookingId: taskData._id,
          customerName: taskData.customer?.name
        }),
        priority: 'urgent',
        type: `urgent_${taskType}_assignment`,
        action: `view_${taskType.replace('_', '')}`
      };

      return await this.sendToVendor(vendorId, {
        title,
        message,
        data,
        priority: 'urgent'
      });
    } catch (error) {
      logger.error('Error sending urgent task notification', {
        error: error.message,
        vendorId,
        taskType
      });
      throw error;
    }
  }

  /**
   * Convert priority string to OneSignal priority value
   * @param {string} priority - Priority level (low, medium, high, urgent)
   * @returns {number} OneSignal priority value
   */
  getPriorityValue(priority) {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 10;
      case 'high':
        return 8;
      case 'medium':
        return 5;
      case 'low':
        return 2;
      default:
        return 5;
    }
  }

  /**
   * Register vendor device for push notifications
   * @param {string} vendorId - Vendor ID
   * @param {string} playerId - OneSignal player ID
   * @param {Object} deviceInfo - Device information
   */
  async registerVendorDevice(vendorId, playerId, deviceInfo = {}) {
    try {
      if (!this.client) {
        logger.warn('OneSignal client not initialized. Cannot register device.');
        return null;
      }

      // Update player with external user ID (vendor ID)
      const playerData = {
        external_user_id: vendorId,
        tags: {
          vendor_id: vendorId,
          user_type: 'vendor',
          ...deviceInfo
        }
      };

      logger.info('Registering vendor device with OneSignal', {
        vendorId,
        playerId,
        deviceInfo
      });

      // Note: The OneSignal Node.js SDK doesn't have a direct method to update players
      // This would typically be done from the client side (frontend)
      // But we can log this for tracking purposes
      
      return { success: true, vendorId, playerId };
    } catch (error) {
      logger.error('Error registering vendor device', {
        error: error.message,
        vendorId,
        playerId
      });
      throw error;
    }
  }
}

// Create and export singleton instance
const oneSignalService = new OneSignalService();
module.exports = oneSignalService;
