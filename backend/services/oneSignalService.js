const axios = require('axios');
const { logger } = require('../utils/logger');

class OneSignalService {
  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID || 'fee060ab-695d-45ca-8e35-8fa71ae5b6e0';
    this.apiKey = process.env.ONESIGNAL_API_KEY || 'os_v2_app_73qgbk3jlvc4vdrvr6trvznw4buukfady27utmekcy6zqprcvost75euwqmlfnupyl7jnht5pyr3ipc2pxmqed6nnt4w6cm26xv4f7q';
    this.baseUrl = 'https://onesignal.com/api/v1';
    this.isConfigured = this.appId && this.apiKey;
  }

  /**
   * Check if OneSignal service is configured
   */
  isServiceConfigured() {
    return this.isConfigured;
  }

  /**
   * Send notification to specific users by external user IDs
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.heading - Notification heading
   * @param {string} notificationData.message - Notification message
   * @param {Array} notificationData.targetExternalIds - Array of external user IDs
   * @param {Object} notificationData.data - Additional data to send with notification
   * @param {string} notificationData.url - URL to open when notification is clicked
   * @returns {Promise<Object>} - Response object
   */
  async sendNotificationToUsers(notificationData) {
    if (!this.isServiceConfigured()) {
      logger.warn('OneSignal service not configured. Skipping notification send.');
      return {
        success: false,
        message: 'OneSignal service not configured',
        error: 'Missing OneSignal credentials'
      };
    }

    try {
      const {
        heading = 'Fixifly Notification',
        message,
        targetExternalIds = [],
        data = {},
        url = null
      } = notificationData;

      if (!message) {
        throw new Error('Notification message is required');
      }

      if (!targetExternalIds || targetExternalIds.length === 0) {
        throw new Error('Target external user IDs are required');
      }

      const payload = {
        app_id: this.appId,
        headings: { en: heading },
        contents: { en: message },
        include_external_user_ids: targetExternalIds,
        data: data
      };

      // Add URL if provided
      if (url) {
        payload.url = url;
      }

      logger.info('Sending OneSignal notification', {
        heading,
        message,
        targetCount: targetExternalIds.length,
        targetIds: targetExternalIds
      });

      const response = await axios.post(`${this.baseUrl}/notifications`, payload, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Basic ${this.apiKey}`
        }
      });

      logger.info('OneSignal notification sent successfully', {
        notificationId: response.data.id,
        recipients: response.data.recipients
      });

      return {
        success: true,
        message: 'Notification sent successfully',
        data: response.data
      };

    } catch (error) {
      logger.error('Failed to send OneSignal notification:', {
        error: error.message,
        response: error.response?.data,
        notificationData
      });

      return {
        success: false,
        message: 'Failed to send notification',
        error: error.response?.data?.errors || error.message
      };
    }
  }

  /**
   * Send notification to all subscribed users
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.heading - Notification heading
   * @param {string} notificationData.message - Notification message
   * @param {Object} notificationData.data - Additional data to send with notification
   * @param {string} notificationData.url - URL to open when notification is clicked
   * @returns {Promise<Object>} - Response object
   */
  async sendNotificationToAll(notificationData) {
    if (!this.isServiceConfigured()) {
      logger.warn('OneSignal service not configured. Skipping notification send.');
      return {
        success: false,
        message: 'OneSignal service not configured',
        error: 'Missing OneSignal credentials'
      };
    }

    try {
      const {
        heading = 'Fixifly Notification',
        message,
        data = {},
        url = null
      } = notificationData;

      if (!message) {
        throw new Error('Notification message is required');
      }

      const payload = {
        app_id: this.appId,
        headings: { en: heading },
        contents: { en: message },
        included_segments: ['Subscribed Users'],
        data: data
      };

      // Add URL if provided
      if (url) {
        payload.url = url;
      }

      logger.info('Sending OneSignal notification to all users', {
        heading,
        message
      });

      const response = await axios.post(`${this.baseUrl}/notifications`, payload, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Basic ${this.apiKey}`
        }
      });

      logger.info('OneSignal notification sent to all users successfully', {
        notificationId: response.data.id,
        recipients: response.data.recipients
      });

      return {
        success: true,
        message: 'Notification sent successfully',
        data: response.data
      };

    } catch (error) {
      logger.error('Failed to send OneSignal notification to all users:', {
        error: error.message,
        response: error.response?.data,
        notificationData
      });

      return {
        success: false,
        message: 'Failed to send notification',
        error: error.response?.data?.errors || error.message
      };
    }
  }

  /**
   * Send vendor assignment notification
   * @param {string} vendorId - Vendor ID (external user ID)
   * @param {Object} assignmentData - Assignment data
   * @param {string} assignmentData.type - Type of assignment (booking, support_ticket, warranty_claim)
   * @param {string} assignmentData.id - Assignment ID
   * @param {string} assignmentData.title - Assignment title
   * @param {string} assignmentData.description - Assignment description
   * @param {string} assignmentData.priority - Assignment priority
   * @param {string} assignmentData.customerName - Customer name
   * @param {string} assignmentData.customerPhone - Customer phone
   * @param {string} assignmentData.scheduledDate - Scheduled date (optional)
   * @param {string} assignmentData.scheduledTime - Scheduled time (optional)
   * @returns {Promise<Object>} - Response object
   */
  async sendVendorAssignmentNotification(vendorId, assignmentData) {
    try {
      const {
        type,
        id,
        title,
        description,
        priority = 'medium',
        customerName,
        customerPhone,
        scheduledDate,
        scheduledTime
      } = assignmentData;

      // Create notification message based on assignment type
      let heading, message, url;

      switch (type) {
        case 'booking':
          heading = '🔧 New Service Request Assigned';
          message = `You have been assigned a new service request: ${title}`;
          url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/bookings/${id}`;
          break;
        case 'support_ticket':
          heading = '🎫 New Support Ticket Assigned';
          message = `A new support ticket has been assigned to you: ${title}`;
          url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/support-tickets/${id}`;
          break;
        case 'warranty_claim':
          heading = '🛡️ New Warranty Claim Assigned';
          message = `A new warranty claim has been assigned to you: ${title}`;
          url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/warranty-claims/${id}`;
          break;
        default:
          heading = '📋 New Assignment';
          message = `You have been assigned a new task: ${title}`;
          url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/dashboard`;
      }

      // Add priority and scheduling info to message
      if (priority === 'high' || priority === 'urgent') {
        message += ' (High Priority)';
      }

      if (scheduledDate && scheduledTime) {
        message += ` - Scheduled: ${scheduledDate} at ${scheduledTime}`;
      }

      const notificationData = {
        heading,
        message,
        targetExternalIds: [vendorId],
        data: {
          type: 'vendor_assignment',
          assignmentType: type,
          assignmentId: id,
          priority,
          customerName,
          customerPhone,
          scheduledDate,
          scheduledTime,
          timestamp: new Date().toISOString()
        },
        url
      };

      return await this.sendNotificationToUsers(notificationData);

    } catch (error) {
      logger.error('Error sending vendor assignment notification:', {
        error: error.message,
        vendorId,
        assignmentData
      });

      return {
        success: false,
        message: 'Failed to send vendor assignment notification',
        error: error.message
      };
    }
  }

  /**
   * Send vendor wallet notification
   * @param {string} vendorId - Vendor ID (external user ID)
   * @param {Object} walletData - Wallet transaction data
   * @param {string} walletData.type - Transaction type (deposit, earning, withdrawal, penalty)
   * @param {number} walletData.amount - Transaction amount
   * @param {string} walletData.description - Transaction description
   * @param {string} walletData.transactionId - Transaction ID
   * @param {number} walletData.newBalance - New wallet balance
   * @returns {Promise<Object>} - Response object
   */
  async sendVendorWalletNotification(vendorId, walletData) {
    try {
      const {
        type,
        amount,
        description,
        transactionId,
        newBalance
      } = walletData;

      const isCredit = amount > 0;
      const emoji = isCredit ? '💰' : '💸';
      const action = isCredit ? 'Credited' : 'Debited';

      const heading = `${emoji} Wallet ${action}`;
      const message = `Your wallet has been ${action.toLowerCase()} with ₹${Math.abs(amount).toLocaleString()}. New balance: ₹${newBalance.toLocaleString()}`;

      const notificationData = {
        heading,
        message,
        targetExternalIds: [vendorId],
        data: {
          type: 'wallet_transaction',
          transactionType: type,
          amount,
          description,
          transactionId,
          newBalance,
          timestamp: new Date().toISOString()
        },
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/wallet`
      };

      return await this.sendNotificationToUsers(notificationData);

    } catch (error) {
      logger.error('Error sending vendor wallet notification:', {
        error: error.message,
        vendorId,
        walletData
      });

      return {
        success: false,
        message: 'Failed to send vendor wallet notification',
        error: error.message
      };
    }
  }

  /**
   * Send vendor account status notification
   * @param {string} vendorId - Vendor ID (external user ID)
   * @param {Object} statusData - Status data
   * @param {string} statusData.status - Status (approved, rejected, blocked, suspended)
   * @param {string} statusData.reason - Reason for status change (optional)
   * @returns {Promise<Object>} - Response object
   */
  async sendVendorStatusNotification(vendorId, statusData) {
    try {
      const { status, reason } = statusData;

      let heading, message, emoji;

      switch (status) {
        case 'approved':
          emoji = '🎉';
          heading = 'Account Approved';
          message = 'Congratulations! Your vendor account has been approved. You can now start accepting service requests.';
          break;
        case 'rejected':
          emoji = '❌';
          heading = 'Account Rejected';
          message = reason ? `Your vendor account application was rejected. Reason: ${reason}` : 'Your vendor account application was rejected.';
          break;
        case 'blocked':
          emoji = '🚫';
          heading = 'Account Blocked';
          message = reason ? `Your vendor account has been blocked. Reason: ${reason}` : 'Your vendor account has been blocked.';
          break;
        case 'suspended':
          emoji = '⏸️';
          heading = 'Account Suspended';
          message = reason ? `Your vendor account has been suspended. Reason: ${reason}` : 'Your vendor account has been suspended.';
          break;
        default:
          emoji = '📢';
          heading = 'Account Status Update';
          message = 'Your vendor account status has been updated.';
      }

      const notificationData = {
        heading: `${emoji} ${heading}`,
        message,
        targetExternalIds: [vendorId],
        data: {
          type: 'account_status',
          status,
          reason,
          timestamp: new Date().toISOString()
        },
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/dashboard`
      };

      return await this.sendNotificationToUsers(notificationData);

    } catch (error) {
      logger.error('Error sending vendor status notification:', {
        error: error.message,
        vendorId,
        statusData
      });

      return {
        success: false,
        message: 'Failed to send vendor status notification',
        error: error.message
      };
    }
  }

  /**
   * Test OneSignal service configuration
   * @returns {Promise<Object>} - Test result
   */
  async testConfiguration() {
    try {
      if (!this.isServiceConfigured()) {
        return {
          success: false,
          message: 'OneSignal service not configured',
          error: 'Missing OneSignal credentials'
        };
      }

      // Try to get app info to test configuration
      const response = await axios.get(`${this.baseUrl}/apps/${this.appId}`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`
        }
      });

      logger.info('OneSignal configuration test successful', {
        appId: this.appId,
        appName: response.data.name
      });

      return {
        success: true,
        message: 'OneSignal service configured correctly',
        data: {
          appId: this.appId,
          appName: response.data.name
        }
      };

    } catch (error) {
      logger.error('OneSignal configuration test failed:', {
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        message: 'OneSignal configuration test failed',
        error: error.response?.data?.errors || error.message
      };
    }
  }
}

// Create singleton instance
const oneSignalService = new OneSignalService();

module.exports = oneSignalService;
