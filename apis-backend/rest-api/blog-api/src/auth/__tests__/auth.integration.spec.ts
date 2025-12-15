import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('Auth Integration Tests', () => {
  let authController: AuthController;
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
    decode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
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

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('Complete Login Flow', () => {
    it('should handle complete login flow from controller to service', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };
      const accessToken = 'jwt-token-123';

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await authController.login(loginDto);

      expect(mockUsersService.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: mockUser.username,
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(result.access_token).toBe(accessToken);
      expect(result.user).toBeDefined();
      expect((result.user as any).password).toBeUndefined();
    });

    it('should reject login with wrong password at controller level', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authController.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Complete Registration Flow', () => {
    it('should handle complete registration flow from controller to service', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
      };

      const createdUser = {
        ...mockUser,
        ...registerDto,
        id: '987e6543-e21b-12d3-a456-426614174999',
      };

      const accessToken = 'jwt-token-456';

      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await authController.register(registerDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: createdUser.username,
        sub: createdUser.id,
        role: createdUser.role,
      });
      expect(result.access_token).toBe(accessToken);
      expect(result.user).toBeDefined();
      expect((result.user as any).password).toBeUndefined();
    });
  });

  describe('Token Generation and Validation', () => {
    it('should generate valid JWT token with correct payload', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const expectedPayload = {
        username: mockUser.username,
        sub: mockUser.id,
        role: mockUser.role,
      };

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      await authController.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
    });

    it('should include user role in JWT payload', async () => {
      const adminUser = { ...mockUser, role: 'admin' };
      const loginDto = {
        username: 'adminuser',
        password: 'password123',
      };

      mockUsersService.findByUsername.mockResolvedValue(adminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      await authController.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin' }),
      );
    });
  });

  describe('Error Handling Flow', () => {
    it('should propagate database errors from service to controller', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };

      mockUsersService.findByUsername.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(authController.login(loginDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle user service errors during registration', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      mockUsersService.create.mockRejectedValue(
        new Error('User creation failed'),
      );

      await expect(authController.register(registerDto)).rejects.toThrow(
        'User creation failed',
      );
    });
  });

  describe('Password Security', () => {
    it('should never expose password in response', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const loginResult = await authController.login(loginDto);
      expect((loginResult.user as any).password).toBeUndefined();

      const registerDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const newUser = { ...mockUser, ...registerDto };
      mockUsersService.create.mockResolvedValue(newUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const registerResult = await authController.register(registerDto);
      expect((registerResult.user as any).password).toBeUndefined();
    });
  });

  describe('Multiple User Roles', () => {
    const roles = ['admin', 'editor', 'author', 'user'];

    roles.forEach((role) => {
      it(`should handle ${role} role correctly`, async () => {
        const userWithRole = { ...mockUser, role };
        const loginDto = {
          username: 'testuser',
          password: 'password123',
        };

        mockUsersService.findByUsername.mockResolvedValue(userWithRole);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        mockJwtService.sign.mockReturnValue('jwt-token');

        const result = await authController.login(loginDto);

        expect(mockJwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({ role }),
        );
        expect(result.user.role).toBe(role);
      });
    });
  });
});
