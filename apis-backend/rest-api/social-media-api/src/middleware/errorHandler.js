/**
 * 全局錯誤處理中間件
 * 統一的錯誤響應格式: { success: false, error: { code, message, details } }
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log 錯誤到控制台（測試環境下不顯示）
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err);
  }

  // Mongoose 驗證錯誤
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: message.join(', '),
        details: err.errors
      }
    });
  }

  // Mongoose 重複鍵錯誤
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    return res.status(400).json({
      success: false,
      error: {
        code: 'DUPLICATE_FIELD',
        message: `${field} already exists`
      }
    });
  }

  // Mongoose 錯誤的 ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid resource ID'
      }
    });
  }

  // JWT 錯誤
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }

  // JWT 過期錯誤
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      }
    });
  }

  // 預設伺服器錯誤
  res.status(error.statusCode || err.status || 500).json({
    success: false,
    error: {
      code: error.code || 'SERVER_ERROR',
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
