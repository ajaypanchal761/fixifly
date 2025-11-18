const fs = require('fs');
const path = require('path');

/**
 * Comprehensive logging utility for the backend
 */
class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get log file path for today
   */
  getLogFilePath(type = 'general') {
    const today = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${type}-${today}.log`);
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  }

  /**
   * Write to log file
   */
  writeToFile(type, level, message, meta = {}) {
    try {
      const logFile = this.getLogFilePath(type);
      const formattedMessage = this.formatMessage(level, message, meta);
      fs.appendFileSync(logFile, formattedMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    console.log(`ℹ️ ${message}`, meta);
    this.writeToFile('general', 'info', message, meta);
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    console.warn(`⚠️ ${message}`, meta);
    this.writeToFile('general', 'warn', message, meta);
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    console.error(`❌ ${message}`, meta);
    this.writeToFile('error', 'error', message, meta);
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    // Always show debug logs in production for troubleshooting
    console.log(`🐛 ${message}`, meta);
    this.writeToFile('debug', 'debug', message, meta);
  }

  /**
   * Log SMS specific messages
   */
  sms(level, message, meta = {}) {
    const emoji = {
      info: '📱',
      warn: '⚠️',
      error: '❌',
      debug: '🐛'
    }[level] || '📱';

    console.log(`${emoji} ${message}`, meta);
    this.writeToFile('sms', level, message, meta);
  }

  /**
   * Log API requests
   */
  api(method, url, status, duration, meta = {}) {
    const message = `${method} ${url} - ${status} (${duration}ms)`;
    const level = status >= 400 ? 'error' : 'info';
    
    console.log(`🌐 ${message}`, meta);
    this.writeToFile('api', level, message, { method, url, status, duration, ...meta });
  }

  /**
   * Log database operations
   */
  database(operation, collection, duration, meta = {}) {
    const message = `${operation} on ${collection} (${duration}ms)`;
    console.log(`🗄️ ${message}`, meta);
    this.writeToFile('database', 'info', message, { operation, collection, duration, ...meta });
  }

  /**
   * Log authentication events
   */
  auth(event, userId, meta = {}) {
    const message = `Auth ${event} for user ${userId}`;
    console.log(`🔐 ${message}`, meta);
    this.writeToFile('auth', 'info', message, { event, userId, ...meta });
  }

  /**
   * Log security events
   */
  security(event, meta = {}) {
    const message = `Security: ${event}`;
    console.warn(`🔒 ${message}`, meta);
    this.writeToFile('security', 'warn', message, meta);
  }

  /**
   * Log performance metrics
   */
  performance(metric, value, unit = 'ms', meta = {}) {
    const message = `Performance: ${metric} = ${value}${unit}`;
    console.log(`⚡ ${message}`, meta);
    this.writeToFile('performance', 'info', message, { metric, value, unit, ...meta });
  }

  /**
   * Log system events
   */
  system(event, meta = {}) {
    const message = `System: ${event}`;
    console.log(`🖥️ ${message}`, meta);
    this.writeToFile('system', 'info', message, meta);
  }

  /**
   * Get log statistics
   */
  getLogStats() {
    try {
      const files = fs.readdirSync(this.logDir);
      const stats = {
        totalFiles: files.length,
        files: files.map(file => {
          const filePath = path.join(this.logDir, file);
          const stat = fs.statSync(filePath);
          return {
            name: file,
            size: stat.size,
            modified: stat.mtime
          };
        })
      };
      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Clean old log files (older than 7 days)
   */
  cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let cleanedCount = 0;
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.mtime < sevenDaysAgo) {
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        this.info(`Cleaned ${cleanedCount} old log files`);
      }
    } catch (error) {
      this.error('Failed to clean old logs', { error: error.message });
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup
logger.cleanOldLogs();

module.exports = { logger };
