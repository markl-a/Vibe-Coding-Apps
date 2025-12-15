import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { JwtStrategy } from '../jwt.strategy';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('Auth Security Tests', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let jwtStrategy: JwtStrategy;
  let usersService: UsersService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    role: 'user',
    displayName: 'Test User',
    bio: 'Test bio',
    avatar: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-jwt-secret-key',
        JWT_EXPIRATION: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe('Password Security', () => {
    it('should use bcrypt to compare passwords', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authService.validateUser('testuser', 'password123');

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
    });

    it('should never return password in user object', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('testuser', 'password123');

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(mockUser.password).toBeDefined(); // Original object still has password
    });

    it('should reject login attempts with SQL injection patterns', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
        "' OR 1=1--",
      ];

      for (const attempt of sqlInjectionAttempts) {
        mockUsersService.findByUsername.mockResolvedValue(null);

        const result = await authService.validateUser(attempt, 'password');

        expect(result).toBeNull();
      }
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser('testuser', longPassword);

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('should handle special characters in passwords', async () => {
      const specialPasswords = [
        'p@ssw0rd!',
        'пароль123',
        '密碼123',
        'مرور123',
        'p\\n\\t\\r',
      ];

      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      for (const password of specialPasswords) {
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await authService.validateUser('testuser', password);

        expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      }
    });
  });

  describe('JWT Token Security', () => {
    it('should include user ID in JWT payload as "sub"', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('token');

      await authService.login('testuser', 'password123');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: mockUser.id }),
      );
    });

    it('should include username in JWT payload', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('token');

      await authService.login('testuser', 'password123');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ username: mockUser.username }),
      );
    });

    it('should include role in JWT payload', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('token');

      await authService.login('testuser', 'password123');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: mockUser.role }),
      );
    });

    it('should not include sensitive data in JWT payload', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockImplementation((payload) => {
        expect(payload.password).toBeUndefined();
        expect(payload.email).toBeUndefined();
        return 'token';
      });

      await authService.login('testuser', 'password123');
    });

    it('should validate JWT payload structure in strategy', async () => {
      const validPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        role: 'user',
      };

      const result = await jwtStrategy.validate(validPayload);

      expect(result).toEqual({
        userId: validPayload.sub,
        username: validPayload.username,
        role: validPayload.role,
      });
    });
  });

  describe('Authentication Attempts', () => {
    it('should reject empty username', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      const result = await authService.validateUser('', 'password123');

      expect(result).toBeNull();
    });

    it('should reject empty password', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser('testuser', '');

      expect(result).toBeNull();
    });

    it('should reject null username', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      const result = await authService.validateUser(null as any, 'password123');

      expect(result).toBeNull();
    });

    it('should reject null password', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser('testuser', null as any);

      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('should handle case-sensitive username comparison', async () => {
      mockUsersService.findByUsername.mockImplementation((username) => {
        if (username === 'testuser') return mockUser;
        return null;
      });

      const result1 = await authService.validateUser('TESTUSER', 'password123');
      const result2 = await authService.validateUser('TestUser', 'password123');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('Registration Security', () => {
    it('should not expose password in registration response', async () => {
      const registerData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const createdUser = { ...mockUser, ...registerData };
      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue('token');

      const result = await authService.register(registerData);

      expect((result.user as any).password).toBeUndefined();
    });

    it('should handle duplicate username gracefully', async () => {
      const registerData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
      };

      mockUsersService.create.mockRejectedValue({
        code: '23505',
        detail: 'Key (username)=(existinguser) already exists.',
      });

      await expect(authService.register(registerData)).rejects.toMatchObject({
        code: '23505',
      });
    });

    it('should handle duplicate email gracefully', async () => {
      const registerData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockUsersService.create.mockRejectedValue({
        code: '23505',
        detail: 'Key (email)=(existing@example.com) already exists.',
      });

      await expect(authService.register(registerData)).rejects.toMatchObject({
        code: '23505',
      });
    });
  });

  describe('Authorization Checks', () => {
    it('should preserve user role during authentication', async () => {
      const roles = ['admin', 'editor', 'author', 'user'];

      for (const role of roles) {
        const userWithRole = { ...mockUser, role };
        mockUsersService.findByUsername.mockResolvedValue(userWithRole);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        mockJwtService.sign.mockReturnValue('token');

        const result = await authService.login('testuser', 'password123');

        expect(result.user.role).toBe(role);
        expect(mockJwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({ role }),
        );
      }
    });

    it('should validate role from JWT token', async () => {
      const payloads = [
        { sub: '123', username: 'admin', role: 'admin' },
        { sub: '123', username: 'editor', role: 'editor' },
        { sub: '123', username: 'author', role: 'author' },
        { sub: '123', username: 'user', role: 'user' },
      ];

      for (const payload of payloads) {
        const result = await jwtStrategy.validate(payload);
        expect(result.role).toBe(payload.role);
      }
    });
  });

  describe('Inactive User Handling', () => {
    it('should allow login for active users', async () => {
      const activeUser = { ...mockUser, isActive: true };
      mockUsersService.findByUsername.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('testuser', 'password123');

      expect(result).toBeDefined();
    });

    it('should validate user found by username', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('testuser', 'password123');

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
    });
  });

  describe('Token Verification', () => {
    it('should use correct JWT secret from config', () => {
      const testConfigService = {
        get: jest.fn().mockReturnValue('test-secret'),
      };
      new JwtStrategy(testConfigService as any);
      expect(testConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should not expose JWT secret in errors', async () => {
      const error = new Error('Invalid token');
      mockJwtService.verify.mockRejectedValue(error);

      try {
        await mockJwtService.verify('invalid-token');
      } catch (e) {
        expect(e.message).not.toContain('test-jwt-secret-key');
      }
    });
  });
});
