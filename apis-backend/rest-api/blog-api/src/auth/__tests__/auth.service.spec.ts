import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

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
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const username = 'testuser';
      const password = 'password123';

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(username, password);

      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.username).toBe(username);
    });

    it('should return null when user is not found', async () => {
      const username = 'nonexistent';
      const password = 'password123';

      mockUsersService.findByUsername.mockResolvedValue(null);

      const result = await authService.validateUser(username, password);

      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const username = 'testuser';
      const password = 'wrongpassword';

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser(username, password);

      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toBeNull();
    });

    it('should handle bcrypt errors gracefully', async () => {
      const username = 'testuser';
      const password = 'password123';

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      await expect(authService.validateUser(username, password)).rejects.toThrow(
        'Bcrypt error',
      );
    });
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      const username = 'testuser';
      const password = 'password123';
      const accessToken = 'jwt-token-123';

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await authService.login(username, password);

      expect(result).toBeDefined();
      expect(result.access_token).toBe(accessToken);
      expect(result.user).toBeDefined();
      expect(result.user.password).toBeUndefined();
      expect(result.user.username).toBe(username);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const username = 'testuser';
      const password = 'wrongpassword';

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(username, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(username, password)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const username = 'nonexistent';
      const password = 'password123';

      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(authService.login(username, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should include correct JWT payload', async () => {
      const username = 'testuser';
      const password = 'password123';
      const accessToken = 'jwt-token-123';

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(accessToken);

      await authService.login(username, password);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: mockUser.username,
        sub: mockUser.id,
        role: mockUser.role,
      });
    });

    it('should handle database errors during login', async () => {
      const username = 'testuser';
      const password = 'password123';

      mockUsersService.findByUsername.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(authService.login(username, password)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('register', () => {
    const registerData = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      displayName: 'New User',
    };

    const createdUser = {
      ...mockUser,
      ...registerData,
      id: '987e6543-e21b-12d3-a456-426614174999',
    };

    it('should register a new user and return access token', async () => {
      const accessToken = 'jwt-token-456';

      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await authService.register(registerData);

      expect(mockUsersService.create).toHaveBeenCalledWith(registerData);
      expect(result).toBeDefined();
      expect(result.access_token).toBe(accessToken);
      expect(result.user).toBeDefined();
      expect((result.user as any).password).toBeUndefined();
      expect(result.user.username).toBe(registerData.username);
    });

    it('should exclude password from returned user data', async () => {
      const accessToken = 'jwt-token-456';

      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await authService.register(registerData);

      expect((result.user as any).password).toBeUndefined();
    });

    it('should include correct JWT payload for new user', async () => {
      const accessToken = 'jwt-token-456';

      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(accessToken);

      await authService.register(registerData);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: createdUser.username,
        sub: createdUser.id,
        role: createdUser.role,
      });
    });

    it('should handle duplicate username error', async () => {
      mockUsersService.create.mockRejectedValue({
        code: '23505',
        detail: 'Key (username)=(newuser) already exists.',
      });

      await expect(authService.register(registerData)).rejects.toMatchObject({
        code: '23505',
      });
    });

    it('should handle duplicate email error', async () => {
      mockUsersService.create.mockRejectedValue({
        code: '23505',
        detail: 'Key (email)=(newuser@example.com) already exists.',
      });

      await expect(authService.register(registerData)).rejects.toMatchObject({
        code: '23505',
      });
    });

    it('should handle database errors during registration', async () => {
      mockUsersService.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(authService.register(registerData)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
