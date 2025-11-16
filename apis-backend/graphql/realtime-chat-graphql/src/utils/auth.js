const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

const getUserFromContext = (context) => {
  // 支援 HTTP 和 WebSocket 認證
  const authHeader = context.req?.headers?.authorization ||
                     context.connectionParams?.authorization || '';

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

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const requireAuth = (userId) => {
  if (!userId) {
    throw new Error('Authentication required');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  getUserFromContext,
  hashPassword,
  comparePassword,
  requireAuth
};
