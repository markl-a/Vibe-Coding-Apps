const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成 JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * 驗證 JWT Token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * 從請求中獲取用戶
 */
const getUserFromRequest = (request) => {
  const authHeader = request.headers.get('authorization') || '';

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = verifyToken(token);
      return decoded.userId;
    } catch (error) {
      return null;
    }
  }

  return null;
};

/**
 * 加密密碼
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * 驗證密碼
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * 驗證用戶是否已認證
 */
const requireAuth = (userId) => {
  if (!userId) {
    throw new Error('Authentication required');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  getUserFromRequest,
  hashPassword,
  comparePassword,
  requireAuth
};
