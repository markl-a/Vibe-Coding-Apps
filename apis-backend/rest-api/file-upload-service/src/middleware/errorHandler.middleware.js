const { createLogger } = require('@vibe/shared-utils');
const logger = createLogger('file-upload-service:error-handler');

/**
 * 全局錯誤處理中間件
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 記錄錯誤
  if (process.env.NODE_ENV !== 'test') {
    logger.error('Request error', err);
  }

  // Multer 錯誤
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = {
        statusCode: 400,
        message: 'File too large',
        code: 'FILE_TOO_LARGE'
      };
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = {
        statusCode: 400,
        message: 'Too many files',
        code: 'TOO_MANY_FILES'
      };
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = {
        statusCode: 400,
        message: 'Unexpected file field',
        code: 'UNEXPECTED_FILE'
      };
    } else {
      error = {
        statusCode: 400,
        message: err.message,
        code: 'UPLOAD_ERROR'
      };
    }
  }

  // JWT 錯誤
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    };
  }

  // Validation 錯誤
  if (err.name === 'ValidationError') {
    error = {
      statusCode: 400,
      message: err.message,
      code: 'VALIDATION_ERROR'
    };
  }

  // AWS S3 錯誤
  if (err.code === 'NoSuchKey') {
    error = {
      statusCode: 404,
      message: 'File not found',
      code: 'FILE_NOT_FOUND'
    };
  }

  if (err.code === 'AccessDenied') {
    error = {
      statusCode: 403,
      message: 'Access denied to storage',
      code: 'STORAGE_ACCESS_DENIED'
    };
  }

  // 發送錯誤響應
  res.status(error.statusCode || err.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || err.message || 'Server Error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  });
};

module.exports = errorHandler;
