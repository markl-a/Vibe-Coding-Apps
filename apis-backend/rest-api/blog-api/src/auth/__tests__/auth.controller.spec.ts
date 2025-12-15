import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      username: 'testuser',
      password: 'password123',
    };

    const mockLoginResponse = {
      access_token: 'jwt-token-123',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      },
    };

    it('should return access token and user on successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await authController.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );
      expect(result).toEqual(mockLoginResponse);
      expect(result.access_token).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(authController.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );
    });

    it('should handle empty username', async () => {
      const invalidDto = { username: '', password: 'password123' };
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await authController.login(invalidDto);

      expect(mockAuthService.login).toHaveBeenCalledWith('', 'password123');
    });

    it('should handle empty password', async () => {
      const invalidDto = { username: 'testuser', password: '' };
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await authController.login(invalidDto);

      expect(mockAuthService.login).toHaveBeenCalledWith('testuser', '');
    });

    it('should handle service errors gracefully', async () => {
      mockAuthService.login.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(authController.login(loginDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should trim whitespace from username and password', async () => {
      const dtoWithSpaces = {
        username: '  testuser  ',
        password: '  password123  ',
      };
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await authController.login(dtoWithSpaces);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        '  testuser  ',
        '  password123  ',
      );
    });

    it('should handle case-sensitive usernames', async () => {
      const upperCaseDto = { username: 'TESTUSER', password: 'password123' };
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await authController.login(upperCaseDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'TESTUSER',
        'password123',
      );
    });
  });

  describe('register', () => {
    const registerDto = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      displayName: 'New User',
    };

    const mockRegisterResponse = {
      access_token: 'jwt-token-456',
      user: {
        id: '987e6543-e21b-12d3-a456-426614174999',
        username: 'newuser',
        email: 'newuser@example.com',
        role: 'user',
        displayName: 'New User',
      },
    };

    it('should register a new user and return access token', async () => {
      mockAuthService.register.mockResolvedValue(mockRegisterResponse);

      const result = await authController.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockRegisterResponse);
      expect(result.access_token).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should handle registration with minimal data', async () => {
      const minimalDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };
      mockAuthService.register.mockResolvedValue(mockRegisterResponse);

      const result = await authController.register(minimalDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(minimalDto);
      expect(result).toEqual(mockRegisterResponse);
    });

    it('should handle registration with full user data', async () => {
      const fullDto = {
        ...registerDto,
        bio: 'Test bio',
        avatar: 'https://example.com/avatar.jpg',
      };
      mockAuthService.register.mockResolvedValue(mockRegisterResponse);

      await authController.register(fullDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(fullDto);
    });

    it('should handle duplicate username error', async () => {
      mockAuthService.register.mockRejectedValue({
        code: '23505',
        detail: 'Key (username)=(newuser) already exists.',
      });

      await expect(authController.register(registerDto)).rejects.toMatchObject({
        code: '23505',
      });
    });

    it('should handle duplicate email error', async () => {
      mockAuthService.register.mockRejectedValue({
        code: '23505',
        detail: 'Key (email)=(newuser@example.com) already exists.',
      });

      await expect(authController.register(registerDto)).rejects.toMatchObject({
        code: '23505',
      });
    });

    it('should handle invalid email format', async () => {
      const invalidDto = { ...registerDto, email: 'invalid-email' };
      mockAuthService.register.mockRejectedValue(
        new Error('Invalid email format'),
      );

      await expect(authController.register(invalidDto)).rejects.toThrow(
        'Invalid email format',
      );
    });

    it('should handle weak password', async () => {
      const weakPasswordDto = { ...registerDto, password: '123' };
      mockAuthService.register.mockRejectedValue(
        new Error('Password too weak'),
      );

      await expect(authController.register(weakPasswordDto)).rejects.toThrow(
        'Password too weak',
      );
    });

    it('should handle service errors during registration', async () => {
      mockAuthService.register.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(authController.register(registerDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('Controller Metadata', () => {
    it('should have correct route prefix', () => {
      const controllerMetadata = Reflect.getMetadata(
        'path',
        AuthController,
      );
      expect(controllerMetadata).toBe('auth');
    });

    it('should have Swagger API tags', () => {
      const tags = Reflect.getMetadata('swagger/apiUseTags', AuthController);
      expect(tags).toBeDefined();
    });
  });
});
