const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging with comprehensive details
  logger.error('Error Handler Triggered', {
    requestId: req.requestId,
    message: err.message,
    stack: err.stack,
    url: req.url || req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || req.admin?._id || 'anonymous',
    userRole: req.user?.role || req.admin?.role || 'none',
    errorName: err.name,
    errorCode: err.code,
    timestamp: new Date().toISOString()
  });

  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    logger.warn('CastError - Resource not found', {
      requestId: req.requestId,
      error: err.message,
      path: err.path,
      value: err.value
    });
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    logger.warn('Duplicate Key Error', {
      requestId: req.requestId,
      field,
      keyValue: err.keyValue
    });
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    logger.warn('Validation Error', {
      requestId: req.requestId,
      errors: Object.keys(err.errors),
      details: err.errors
    });
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    logger.warn('JWT Error - Invalid token', {
      requestId: req.requestId,
      error: err.message
    });
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    logger.warn('JWT Error - Token expired', {
      requestId: req.requestId,
      expiredAt: err.expiredAt
    });
    error = { message, statusCode: 401 };
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    logger.warn('Multer Error - File too large', {
      requestId: req.requestId,
      limit: err.limit
    });
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    logger.warn('Multer Error - Unexpected file field', {
      requestId: req.requestId,
      field: err.field
    });
    error = { message, statusCode: 400 };
  }

  // Rate limit errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    logger.warn('Rate Limit Exceeded', {
      requestId: req.requestId,
      ip: req.ip
    });
    error = { message, statusCode: 429 };
  }

  // Default error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Log final error response
  if (statusCode >= 500) {
    logger.error('Internal Server Error Response', {
      requestId: req.requestId,
      statusCode,
      message,
      originalError: err.message
    });
  } else {
    logger.warn('Client Error Response', {
      requestId: req.requestId,
      statusCode,
      message
    });
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: {
        statusCode,
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method,
        requestId: req.requestId
      }
    })
  });
};

module.exports = { errorHandler };
