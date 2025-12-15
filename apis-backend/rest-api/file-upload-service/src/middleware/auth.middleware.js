const jwt = require('jsonwebtoken');

/**
 * 驗證 JWT token
 */
exports.authenticate = async (req, res, next) => {
  try {
    let token;

    // 從 Authorization header 獲取 token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 檢查 token 是否存在
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
        code: 'UNAUTHORIZED'
      });
    }

    try {
      // 驗證 token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

      // 將用戶信息添加到請求對象
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token is invalid or has expired',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * 授權特定角色
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`,
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

/**
 * 可選的認證（允許匿名訪問）
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        };
      } catch (error) {
        // Token 無效但不拋出錯誤，允許繼續
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
