const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT Token Configuration
const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '1h', // 1 hour
  REFRESH_TOKEN_EXPIRES_IN: '7d', // 7 days
  ALGORITHM: 'HS256'
};

/**
 * Generate JWT Access Token
 * @param {Object} payload - Token payload
 * @param {string} payload.adminId - Admin ID
 * @param {string} payload.role - Admin role
 * @param {string} payload.email - Admin email
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
  const tokenPayload = {
    adminId: payload.adminId,
    role: payload.role,
    email: payload.email,
    type: 'access'
  };

  return jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET,
    {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      algorithm: JWT_CONFIG.ALGORITHM
    }
  );
};

/**
 * Generate JWT Refresh Token
 * @param {Object} payload - Token payload
 * @param {string} payload.adminId - Admin ID
 * @param {string} payload.role - Admin role
 * @param {string} payload.email - Admin email
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  const tokenPayload = {
    adminId: payload.adminId,
    role: payload.role,
    email: payload.email,
    type: 'refresh'
  };

  return jwt.sign(
    tokenPayload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
      algorithm: JWT_CONFIG.ALGORITHM
    }
  );
};

/**
 * Verify JWT Access Token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM]
    });
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error(`Access token verification failed: ${error.message}`);
  }
};

/**
 * Verify JWT Refresh Token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM]
    });
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error(`Refresh token verification failed: ${error.message}`);
  }
};

/**
 * Generate both access and refresh tokens
 * @param {Object} admin - Admin object
 * @returns {Object} Object containing both tokens
 */
const generateTokenPair = (admin) => {
  const payload = {
    adminId: admin._id.toString(),
    role: admin.role,
    email: admin.email
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN
  };
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Generate secure random token (for refresh tokens stored in DB)
 * @param {number} length - Token length in bytes
 * @returns {string} Random token
 */
const generateSecureToken = (length = 40) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash token for storage
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify hashed token
 * @param {string} token - Plain token
 * @param {string} hashedToken - Hashed token
 * @returns {boolean} True if tokens match
 */
const verifyHashedToken = (token, hashedToken) => {
  const hashed = hashToken(token);
  return hashed === hashedToken;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  extractTokenFromHeader,
  isTokenExpired,
  getTokenExpiration,
  generateSecureToken,
  hashToken,
  verifyHashedToken,
  JWT_CONFIG
};
