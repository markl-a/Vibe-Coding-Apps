const { getUserFromToken } = require('../utils/auth');

/**
 * Authentication middleware
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const userId = getUserFromToken(authHeader);

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  req.userId = userId;
  next();
};

/**
 * Optional authentication middleware
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const userId = getUserFromToken(authHeader);

  if (userId) {
    req.userId = userId;
  }

  next();
};

module.exports = { authenticate, optionalAuth };
