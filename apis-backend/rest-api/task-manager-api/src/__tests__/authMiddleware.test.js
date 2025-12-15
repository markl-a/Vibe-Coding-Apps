const jwt = require('jsonwebtoken');

// Mock User model
jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

describe('Auth Middleware - protect', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'UNAUTHORIZED',
        }),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not start with Bearer', async () => {
    mockReq.headers.authorization = 'Basic some-token';

    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    mockReq.headers.authorization = 'Bearer invalid-token';

    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_TOKEN',
        }),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if user not found', async () => {
    const token = jwt.sign({ id: 'user-id' }, process.env.JWT_SECRET);
    mockReq.headers.authorization = `Bearer ${token}`;
    User.findById.mockResolvedValue(null);

    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        }),
      })
    );
  });

  it('should call next and set user on request if token is valid', async () => {
    const mockUser = { _id: 'user-id', name: 'Test User', email: 'test@example.com' };
    const token = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET);
    mockReq.headers.authorization = `Bearer ${token}`;
    User.findById.mockResolvedValue(mockUser);

    await protect(mockReq, mockRes, mockNext);

    expect(mockReq.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should handle expired token', async () => {
    const token = jwt.sign({ id: 'user-id' }, process.env.JWT_SECRET, { expiresIn: '-1h' });
    mockReq.headers.authorization = `Bearer ${token}`;

    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_TOKEN',
        }),
      })
    );
  });

  it('should handle malformed JWT token', async () => {
    mockReq.headers.authorization = 'Bearer malformed.token.here';

    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_TOKEN',
        }),
      })
    );
  });
});
