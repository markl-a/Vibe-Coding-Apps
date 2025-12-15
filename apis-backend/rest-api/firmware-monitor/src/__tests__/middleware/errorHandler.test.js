const errorHandler = require('../../middleware/errorHandler');

describe('Error Handler Middleware Tests', () => {
  let req, res, next;
  let consoleErrorSpy;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('Mongoose Errors', () => {
    test('應該處理 Mongoose CastError', () => {
      const err = {
        name: 'CastError',
        message: 'Cast to ObjectId failed'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Resource not found'
        }
      });
    });

    test('應該處理 Mongoose 重複鍵錯誤', () => {
      const err = {
        code: 11000,
        message: 'Duplicate key error',
        keyValue: { email: 'test@example.com' }
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DUPLICATE_FIELD',
          message: 'Duplicate field value: email'
        }
      });
    });

    test('應該處理多個重複鍵', () => {
      const err = {
        code: 11000,
        message: 'Duplicate key error',
        keyValue: { email: 'test@example.com', username: 'testuser' }
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DUPLICATE_FIELD',
          message: 'Duplicate field value: email'
        }
      });
    });

    test('應該處理 Mongoose ValidationError', () => {
      const err = {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: {
          email: { message: 'Email is required' },
          password: { message: 'Password is required' }
        }
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required, Password is required'
        }
      });
    });

    test('應該處理單一欄位的 ValidationError', () => {
      const err = {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: {
          email: { message: 'Email is invalid' }
        }
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is invalid'
        }
      });
    });
  });

  describe('JWT Errors', () => {
    test('應該處理 JsonWebTokenError', () => {
      const err = {
        name: 'JsonWebTokenError',
        message: 'jwt malformed'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
    });

    test('應該處理 TokenExpiredError', () => {
      const err = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
        expiredAt: new Date()
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token expired'
        }
      });
    });
  });

  describe('Generic Errors', () => {
    test('應該處理帶有自定義狀態碼的通用錯誤', () => {
      const err = {
        message: 'Custom error',
        statusCode: 400,
        code: 'CUSTOM_ERROR'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CUSTOM_ERROR',
          message: 'Custom error'
        }
      });
    });

    test('應該在沒有狀態碼時默認返回 500', () => {
      const err = {
        message: 'Internal error'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal error'
        }
      });
    });

    test('應該在沒有錯誤訊息時使用默認訊息', () => {
      const err = {};

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Server Error'
        }
      });
    });

    test('應該在開發環境中包含 stack trace', () => {
      process.env.NODE_ENV = 'development';
      const err = new Error('Test error');

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            stack: expect.any(String)
          })
        })
      );
    });

    test('應該在生產環境中不包含 stack trace', () => {
      process.env.NODE_ENV = 'production';
      const err = new Error('Test error');

      errorHandler(err, req, res, next);

      const callArg = res.json.mock.calls[0][0];
      expect(callArg.error.stack).toBeUndefined();
    });

    test('應該記錄所有錯誤到 console', () => {
      const err = new Error('Test error');

      errorHandler(err, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', err);
    });
  });

  describe('Error Status Codes', () => {
    test('應該正確處理 400 Bad Request', () => {
      const err = {
        statusCode: 400,
        message: 'Bad request',
        code: 'BAD_REQUEST'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('應該正確處理 401 Unauthorized', () => {
      const err = {
        statusCode: 401,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('應該正確處理 403 Forbidden', () => {
      const err = {
        statusCode: 403,
        message: 'Forbidden',
        code: 'FORBIDDEN'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('應該正確處理 404 Not Found', () => {
      const err = {
        statusCode: 404,
        message: 'Not found',
        code: 'NOT_FOUND'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('應該正確處理 409 Conflict', () => {
      const err = {
        statusCode: 409,
        message: 'Conflict',
        code: 'CONFLICT'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test('應該正確處理 500 Internal Server Error', () => {
      const err = {
        statusCode: 500,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
