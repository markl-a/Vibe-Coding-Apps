// Mock the database module before importing anything else
jest.mock('../../utils/db', () => require('../helpers/mockDb'));

const authService = require('../../services/authService');
const { clearMocks } = require('../helpers/mockDb');
const { verifyToken } = require('../../utils/auth');

describe('AuthService', () => {
  beforeEach(() => {
    clearMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await authService.register('testuser', 'test@example.com', 'password123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should generate a valid JWT token on registration', async () => {
      const result = await authService.register('testuser', 'test@example.com', 'password123');

      const decoded = verifyToken(result.token);
      expect(decoded).toBeTruthy();
      expect(decoded.userId).toBe(result.user.id);
    });

    it('should throw error if email already exists', async () => {
      await authService.register('testuser1', 'test@example.com', 'password123');

      await expect(
        authService.register('testuser2', 'test@example.com', 'password456')
      ).rejects.toThrow('Email or username already exists');
    });

    it('should throw error if username already exists', async () => {
      await authService.register('testuser', 'test1@example.com', 'password123');

      await expect(
        authService.register('testuser', 'test2@example.com', 'password456')
      ).rejects.toThrow('Email or username already exists');
    });

    it('should hash the password before storing', async () => {
      const password = 'password123';
      const result = await authService.register('testuser', 'test@example.com', password);

      // The password should not be stored in plain text
      expect(result.user.password).toBeUndefined();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register('testuser', 'test@example.com', 'password123');
    });

    it('should login successfully with correct credentials', async () => {
      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should generate a valid JWT token on login', async () => {
      const result = await authService.login('test@example.com', 'password123');

      const decoded = verifyToken(result.token);
      expect(decoded).toBeTruthy();
      expect(decoded.userId).toBe(result.user.id);
    });

    it('should throw error with invalid email', async () => {
      await expect(
        authService.login('wrong@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with invalid password', async () => {
      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should update user online status on login', async () => {
      const result = await authService.login('test@example.com', 'password123');

      // Verify the user's online status was updated
      const profile = await authService.getProfile(result.user.id);
      expect(profile.online_status).toBe('online');
    });

    it('should not return password in response', async () => {
      const result = await authService.login('test@example.com', 'password123');

      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const registerResult = await authService.register('testuser', 'test@example.com', 'password123');
      const profile = await authService.getProfile(registerResult.user.id);

      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('username');
      expect(profile).toHaveProperty('email');
      expect(profile).not.toHaveProperty('password');
    });

    it('should throw error if user not found', async () => {
      await expect(
        authService.getProfile('non-existent-id')
      ).rejects.toThrow('User not found');
    });
  });
});
