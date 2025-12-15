const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('No token provided');
      err.statusCode = 401;
      err.code = 'NO_TOKEN';
      throw err;
    }

    const token = authHeader.substring(7);

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    const decoded = jwt.verify(token, jwtSecret);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      const err = new Error('Invalid token');
      err.statusCode = 401;
      err.code = 'INVALID_TOKEN';
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Account is inactive');
      err.statusCode = 403;
      err.code = 'ACCOUNT_INACTIVE';
      throw err;
    }

    // Attach user to request
    req.user = { id: user._id.toString() };

    next();
  } catch (error) {
    // Pass to error handler middleware
    next(error);
  }
};

exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive) {
        req.user = { id: user._id.toString() };
      }
    }

    next();
  } catch (error) {
    // Don't fail on auth errors, just continue without user
    next();
  }
};
