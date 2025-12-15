const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../../middleware/authMiddleware');
const User = require('../../models/User');

// Mock User model
jest.mock('../../models/User');

describe('Authentication Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    test('應該在沒有 token 時返回 401', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to access this route'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('應該在 Authorization header 不以 Bearer 開頭時返回 401', async () => {
      req.headers.authorization = 'InvalidToken';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to access this route'
        }
      });
    });

    test('應該在 token 無效時返回 401', async () => {
      req.headers.authorization = 'Bearer invalid.token.here';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token is invalid or has expired'
        }
      });
    });

    test('應該在 token 過期時返回 401', async () => {
      const expiredToken = jwt.sign(
        { id: 'user123' },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      // 等待一秒確保 token 過期
      await new Promise(resolve => setTimeout(resolve, 100));
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token is invalid or has expired'
        }
      });
    });

    test('應該在用戶不存在時返回 401', async () => {
      const validToken = jwt.sign(
        { id: 'nonexistent-user' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${validToken}`;
      User.findById.mockResolvedValue(null);

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    });

    test('應該在有效 token 和用戶存在時通過驗證', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      const validToken = jwt.sign(
        { id: mockUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${validToken}`;
      User.findById.mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('應該正確解析 Bearer token', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com' };
      const validToken = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET);

      req.headers.authorization = `Bearer ${validToken}`;
      User.findById.mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
    });

    test('應該處理含有額外空格的 Authorization header', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com' };
      const validToken = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET);

      req.headers.authorization = `Bearer  ${validToken}`; // 額外空格
      User.findById.mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('應該在資料庫查詢失敗時返回 401', async () => {
      const validToken = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${validToken}`;

      User.findById.mockRejectedValue(new Error('Database error'));

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token is invalid or has expired'
        }
      });
    });

    test('應該在 JWT_SECRET 未設置時拋出錯誤', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const validToken = jwt.sign({ id: 'user123' }, 'some-secret');
      req.headers.authorization = `Bearer ${validToken}`;

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('authorize middleware', () => {
    test('應該在用戶角色未被授權時返回 403', () => {
      req.user = { role: 'user' };
      const middleware = authorize('admin', 'moderator');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: "User role 'user' is not authorized to access this route"
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('應該在用戶角色被授權時允許訪問', () => {
      req.user = { role: 'admin' };
      const middleware = authorize('admin', 'moderator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('應該支持單一角色授權', () => {
      req.user = { role: 'admin' };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('應該支持多個角色授權', () => {
      req.user = { role: 'moderator' };
      const middleware = authorize('admin', 'moderator', 'superuser');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('應該在角色列表中的任一角色匹配時允許訪問', () => {
      req.user = { role: 'moderator' };
      const middleware = authorize('admin', 'moderator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('應該正確處理大小寫敏感的角色比較', () => {
      req.user = { role: 'Admin' };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('應該在沒有提供角色時拒絕訪問', () => {
      req.user = { role: 'user' };
      const middleware = authorize();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
