const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

/**
 * Notification Connection Service
 * Handles MongoDB connections for notification operations
 */
class NotificationConnectionService {
  constructor() {
    this.isConnected = false;
  }

  /**
   * Ensure MongoDB connection is active for notifications
   * @returns {Promise<boolean>} - Connection status
   */
  async ensureConnection() {
    try {
      // Check if already connected
      if (mongoose.connection.readyState === 1) {
        this.isConnected = true;
        return true;
      }

      logger.warn('MongoDB connection not ready for notifications, attempting to reconnect...');
      
      // Connect with proper options
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0
      });

      // Wait for connection to be established
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout for notifications'));
        }, 10000);
        
        if (mongoose.connection.readyState === 1) {
          clearTimeout(timeout);
          resolve();
        } else {
          mongoose.connection.once('connected', () => {
            clearTimeout(timeout);
            resolve();
          });
          mongoose.connection.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      });

      this.isConnected = true;
      logger.info('MongoDB connection established for notifications');
      return true;
    } catch (error) {
      logger.error('Failed to establish MongoDB connection for notifications:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Execute notification operation with proper connection handling
   * @param {Function} operation - The notification operation to execute
   * @returns {Promise<any>} - Operation result
   */
  async executeWithConnection(operation) {
    try {
      // Ensure connection is active
      const connected = await this.ensureConnection();
      if (!connected) {
        throw new Error('MongoDB connection failed for notification operation');
      }

      // Execute the operation
      const result = await operation();
      return result;
    } catch (error) {
      logger.error('Notification operation failed:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   * @returns {boolean} - Connection status
   */
  getConnectionStatus() {
    return mongoose.connection.readyState === 1;
  }
}

// Export singleton instance
module.exports = new NotificationConnectionService();
