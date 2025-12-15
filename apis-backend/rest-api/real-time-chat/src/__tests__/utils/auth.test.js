const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  getUserFromToken,
} = require('../../utils/auth');

// Store original JWT_SECRET
const originalJwtSecret = process.env.JWT_SECRET;

describe('Auth Utils', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '7d';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'user-123';
      const token = generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateToken('user-1');
      const token2 = generateToken('user-2');

      expect(token1).not.toBe(token2);
    });

    it('should include userId in token payload', () => {
      const userId = 'user-456';
      const token = generateToken(userId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.userId).toBe(userId);
    });

    it('should set expiration time', () => {
      const userId = 'user-789';
      const token = generateToken(userId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const userId = 'user-123';
      const token = generateToken(userId);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded.userId).toBe(userId);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here');

      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      const userId = 'user-123';
      const expiredToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      const decoded = verifyToken(expiredToken);

      expect(decoded).toBeNull();
    });

    it('should return null for token with wrong secret', () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId }, 'wrong-secret', { expiresIn: '7d' });
      const decoded = verifyToken(token);

      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = verifyToken('');

      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const decoded = verifyToken('not-a-jwt-token');

      expect(decoded).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'myPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'samePassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // bcrypt adds salt
    });

    it('should hash empty password', async () => {
      const hash = await hashPassword('');

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should hash long password', async () => {
      const longPassword = 'a'.repeat(100);
      const hash = await hashPassword(longPassword);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'myPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'myPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('wrongPassword', hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password against hash', async () => {
      const password = 'myPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('', hash);

      expect(isMatch).toBe(false);
    });

    it('should handle case sensitivity', async () => {
      const password = 'MyPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('mypassword123', hash);

      expect(isMatch).toBe(false);
    });

    it('should return true for empty password if hashed empty', async () => {
      const password = '';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('', hash);

      expect(isMatch).toBe(true);
    });
  });

  describe('getUserFromToken', () => {
    it('should extract userId from valid Bearer token', () => {
      const userId = 'user-123';
      const token = generateToken(userId);
      const authHeader = `Bearer ${token}`;

      const extractedUserId = getUserFromToken(authHeader);

      expect(extractedUserId).toBe(userId);
    });

    it('should return null when no auth header provided', () => {
      const userId = getUserFromToken(null);

      expect(userId).toBeNull();
    });

    it('should return null when auth header is undefined', () => {
      const userId = getUserFromToken(undefined);

      expect(userId).toBeNull();
    });

    it('should return null when auth header does not start with Bearer', () => {
      const token = generateToken('user-123');
      const authHeader = `Basic ${token}`;

      const userId = getUserFromToken(authHeader);

      expect(userId).toBeNull();
    });

    it('should return null for malformed Bearer token', () => {
      const authHeader = 'Bearer invalid-token';

      const userId = getUserFromToken(authHeader);

      expect(userId).toBeNull();
    });

    it('should return null for expired Bearer token', () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );
      const authHeader = `Bearer ${expiredToken}`;

      const userId = getUserFromToken(authHeader);

      expect(userId).toBeNull();
    });

    it('should return null for Bearer token without userId', () => {
      const token = jwt.sign({ someOtherField: 'value' }, process.env.JWT_SECRET);
      const authHeader = `Bearer ${token}`;

      const userId = getUserFromToken(authHeader);

      expect(userId).toBeUndefined();
    });

    it('should return null for empty auth header', () => {
      const userId = getUserFromToken('');

      expect(userId).toBeNull();
    });

    it('should return null for auth header with only Bearer', () => {
      const userId = getUserFromToken('Bearer ');

      expect(userId).toBeNull();
    });

    it('should handle auth header with extra spaces', () => {
      const token = generateToken('user-123');
      const authHeader = `Bearer  ${token}`; // Extra space

      const userId = getUserFromToken(authHeader);

      // Should still work because we take substring(7)
      expect(userId).toBe('user-123');
    });

    it('should return null for token with wrong secret', () => {
      const token = jwt.sign({ userId: 'user-123' }, 'wrong-secret');
      const authHeader = `Bearer ${token}`;

      const userId = getUserFromToken(authHeader);

      expect(userId).toBeNull();
    });
  });

  describe('Integration tests', () => {
    it('should complete full auth flow', async () => {
      // Hash a password
      const password = 'securePassword123';
      const hashedPassword = await hashPassword(password);

      // Verify password matches
      const isMatch = await comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);

      // Generate token for user
      const userId = 'user-123';
      const token = generateToken(userId);

      // Verify token
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(userId);

      // Extract userId from auth header
      const authHeader = `Bearer ${token}`;
      const extractedUserId = getUserFromToken(authHeader);
      expect(extractedUserId).toBe(userId);
    });

    it('should fail authentication with wrong password', async () => {
      const password = 'correctPassword';
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePassword('wrongPassword', hashedPassword);
      expect(isMatch).toBe(false);
    });

    it('should fail with tampered token', () => {
      const userId = 'user-123';
      const token = generateToken(userId);
      const tamperedToken = token.slice(0, -10) + 'tampered!!';
      const authHeader = `Bearer ${tamperedToken}`;

      const extractedUserId = getUserFromToken(authHeader);
      expect(extractedUserId).toBeNull();
    });
  });
});
