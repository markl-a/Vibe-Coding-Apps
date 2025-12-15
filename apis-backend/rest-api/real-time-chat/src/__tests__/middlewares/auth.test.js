const { authenticate, optionalAuth } = require('../../middlewares/auth');
const { getUserFromToken } = require('../../utils/auth');

jest.mock('../../utils/auth');

describe('Authentication Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token and set userId', () => {
      const userId = 'user-123';
      mockReq.headers.authorization = 'Bearer valid-token';
      getUserFromToken.mockReturnValue(userId);

      authenticate(mockReq, mockRes, mockNext);

      expect(getUserFromToken).toHaveBeenCalledWith('Bearer valid-token');
      expect(mockReq.userId).toBe(userId);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no authorization header is provided', () => {
      getUserFromToken.mockReturnValue(null);

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when invalid token is provided', () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      getUserFromToken.mockReturnValue(null);

      authenticate(mockReq, mockRes, mockNext);

      expect(getUserFromToken).toHaveBeenCalledWith('Bearer invalid-token');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when malformed authorization header is provided', () => {
      mockReq.headers.authorization = 'InvalidFormat token';
      getUserFromToken.mockReturnValue(null);

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when expired token is provided', () => {
      mockReq.headers.authorization = 'Bearer expired-token';
      getUserFromToken.mockReturnValue(null);

      authenticate(mockReq, mockRes, mockNext);

      expect(getUserFromToken).toHaveBeenCalledWith('Bearer expired-token');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty authorization header', () => {
      mockReq.headers.authorization = '';
      getUserFromToken.mockReturnValue(null);

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should set userId when valid token is provided', () => {
      const userId = 'user-456';
      mockReq.headers.authorization = 'Bearer valid-token';
      getUserFromToken.mockReturnValue(userId);

      optionalAuth(mockReq, mockRes, mockNext);

      expect(getUserFromToken).toHaveBeenCalledWith('Bearer valid-token');
      expect(mockReq.userId).toBe(userId);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should proceed without userId when no token is provided', () => {
      getUserFromToken.mockReturnValue(null);

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should proceed without userId when invalid token is provided', () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      getUserFromToken.mockReturnValue(null);

      optionalAuth(mockReq, mockRes, mockNext);

      expect(getUserFromToken).toHaveBeenCalledWith('Bearer invalid-token');
      expect(mockReq.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should proceed without userId when malformed token is provided', () => {
      mockReq.headers.authorization = 'InvalidFormat token';
      getUserFromToken.mockReturnValue(null);

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle empty authorization header gracefully', () => {
      mockReq.headers.authorization = '';
      getUserFromToken.mockReturnValue(null);

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should not throw error when authorization header is missing', () => {
      getUserFromToken.mockReturnValue(null);

      expect(() => {
        optionalAuth(mockReq, mockRes, mockNext);
      }).not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('middleware interaction', () => {
    it('should work correctly in a middleware chain with authenticate', () => {
      const userId = 'user-789';
      mockReq.headers.authorization = 'Bearer valid-token';
      getUserFromToken.mockReturnValue(userId);

      authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.userId).toBe(userId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should work correctly in a middleware chain with optionalAuth', () => {
      const userId = 'user-999';
      mockReq.headers.authorization = 'Bearer valid-token';
      getUserFromToken.mockReturnValue(userId);

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.userId).toBe(userId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
