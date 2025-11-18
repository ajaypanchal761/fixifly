const { logger } = require('../utils/logger');

/**
 * Comprehensive request logging middleware
 * Logs every API request with detailed information
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to request object for tracking
  req.requestId = requestId;

  // Log incoming request
  logger.info('📥 Incoming Request', {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    authorization: req.headers.authorization ? 'Bearer ***' : 'No auth',
    timestamp: new Date().toISOString()
  });

  // Log request body (excluding sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.otp) sanitizedBody.otp = '***';
    if (sanitizedBody.token) sanitizedBody.token = '***';
    
    logger.debug('📦 Request Body', {
      requestId,
      body: sanitizedBody
    });
  }

  // Log request params
  if (req.params && Object.keys(req.params).length > 0) {
    logger.debug('🔖 Request Params', {
      requestId,
      params: req.params
    });
  }

  // Capture response data
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;

  let responseBody = null;

  // Override res.json to capture response
  res.json = function(body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Override res.send to capture response
  res.send = function(body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Override res.end to capture response
  res.end = function(chunk, encoding) {
    if (chunk && !responseBody) {
      try {
        responseBody = JSON.parse(chunk.toString());
      } catch (e) {
        responseBody = chunk.toString();
      }
    }
    return originalEnd.call(this, chunk, encoding);
  };

  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Log response
    logger.api(
      req.method,
      req.originalUrl || req.url,
      statusCode,
      duration,
      {
        requestId,
        statusCode,
        duration: `${duration}ms`,
        success: statusCode < 400,
        responseSize: responseBody ? JSON.stringify(responseBody).length : 0,
        userId: req.user?.userId || req.admin?._id || 'anonymous',
        userRole: req.user?.role || req.admin?.role || 'none'
      }
    );

    // Log response body for debugging (only for errors or in development)
    if (statusCode >= 400 || process.env.NODE_ENV !== 'production') {
      logger.debug('📤 Response Body', {
        requestId,
        statusCode,
        response: responseBody
      });
    }

    // Log slow requests
    if (duration > 1000) {
      logger.warn('⚠️ Slow Request Detected', {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        duration: `${duration}ms`,
        threshold: '1000ms'
      });
    }
  });

  // Log errors
  res.on('error', (error) => {
    logger.error('❌ Response Error', {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      error: error.message,
      stack: error.stack
    });
  });

  next();
};

module.exports = { requestLogger };

