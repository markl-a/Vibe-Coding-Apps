const jwt = require('jsonwebtoken');
const { generateToken, authenticateUser } = require('../utils/auth');
const User = require('../models/User');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../models/User');

describe('Auth Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRE = '7d';
  });

  describe('generateToken', () => {
    test('should generate JWT token with user id', () => {
      const userId = 'user123';
      const expectedToken = 'mock-token';

      jwt.sign.mockReturnValue(expectedToken);

      const token = generateToken(userId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(token).toBe(expectedToken);
    });

    test('should use default expiration if JWT_EXPIRE not set', () => {
      delete process.env.JWT_EXPIRE;
      const userId = 'user123';

      generateToken(userId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        'test-secret',
        { expiresIn: '7d' }
      );
    });

    test('should use custom expiration from environment', () => {
      process.env.JWT_EXPIRE = '30d';
      const userId = 'user123';

      generateToken(userId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        'test-secret',
        { expiresIn: '30d' }
      );
    });
  });

  describe('authenticateUser', () => {
    test('should return null if no auth header provided', async () => {
      const result = await authenticateUser(null);
      expect(result).toBeNull();
    });

    test('should return null if auth header does not start with Bearer', async () => {
      const result = await authenticateUser('InvalidToken');
      expect(result).toBeNull();
    });

    test('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      };

      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockResolvedValue(mockUser);

      const result = await authenticateUser('Bearer valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });

    test('should return null if token verification fails', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authenticateUser('Bearer invalid-token');

      expect(result).toBeNull();
    });

    test('should return null if user not found in database', async () => {
      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockResolvedValue(null);

      const result = await authenticateUser('Bearer valid-token');

      expect(result).toBeNull();
    });

    test('should extract token correctly from Bearer header', async () => {
      const token = 'test-token-123';
      const authHeader = `Bearer ${token}`;

      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockResolvedValue({ id: 'user123' });

      await authenticateUser(authHeader);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    });

    test('should handle token with multiple parts correctly', async () => {
      const authHeader = 'Bearer token.with.multiple.parts';

      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockResolvedValue({ id: 'user123' });

      await authenticateUser(authHeader);

      expect(jwt.verify).toHaveBeenCalledWith('token.with.multiple.parts', 'test-secret');
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete authentication flow', async () => {
      const userId = 'user123';
      const mockToken = 'generated-token';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com'
      };

      // Generate token
      jwt.sign.mockReturnValue(mockToken);
      const token = generateToken(userId);

      // Authenticate with token
      jwt.verify.mockReturnValue({ id: userId });
      User.findById.mockResolvedValue(mockUser);
      const user = await authenticateUser(`Bearer ${token}`);

      expect(token).toBe(mockToken);
      expect(user).toEqual(mockUser);
    });

    test('should reject expired token', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const result = await authenticateUser('Bearer expired-token');

      expect(result).toBeNull();
    });

    test('should reject malformed token', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const result = await authenticateUser('Bearer malformed-token');

      expect(result).toBeNull();
    });
  });
});
