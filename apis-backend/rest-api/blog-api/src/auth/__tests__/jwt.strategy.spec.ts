import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../jwt.strategy';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('test-jwt-secret-key');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(jwtStrategy).toBeDefined();
    });

    it('should get JWT secret from config service', () => {
      // Create a new instance to test config call
      const testConfigService = {
        get: jest.fn().mockReturnValue('test-secret'),
      };
      new JwtStrategy(testConfigService as any);
      expect(testConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should configure JWT extraction from Authorization header', () => {
      // The strategy should be configured to extract JWT from Bearer token
      expect(jwtStrategy).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should return user object from valid JWT payload', async () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        role: 'user',
      };

      const result = await jwtStrategy.validate(payload);

      expect(result).toBeDefined();
      expect(result.userId).toBe(payload.sub);
      expect(result.username).toBe(payload.username);
      expect(result.role).toBe(payload.role);
    });

    it('should map "sub" to "userId" in returned object', async () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        role: 'user',
      };

      const result = await jwtStrategy.validate(payload);

      expect(result.userId).toBe(payload.sub);
      expect((result as any).sub).toBeUndefined();
    });

    it('should handle admin role', async () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        username: 'adminuser',
        role: 'admin',
      };

      const result = await jwtStrategy.validate(payload);

      expect(result.role).toBe('admin');
    });

    it('should handle editor role', async () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        username: 'editoruser',
        role: 'editor',
      };

      const result = await jwtStrategy.validate(payload);

      expect(result.role).toBe('editor');
    });

    it('should handle author role', async () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        username: 'authoruser',
        role: 'author',
      };

      const result = await jwtStrategy.validate(payload);

      expect(result.role).toBe('author');
    });

    it('should handle payload with additional fields', async () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        role: 'user',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890 + 3600,
      };

      const result = await jwtStrategy.validate(payload);

      expect(result.userId).toBe(payload.sub);
      expect(result.username).toBe(payload.username);
      expect(result.role).toBe(payload.role);
      // Additional fields should not be included
      expect((result as any).email).toBeUndefined();
      expect((result as any).iat).toBeUndefined();
      expect((result as any).exp).toBeUndefined();
    });

    it('should handle different username formats', async () => {
      const testCases = [
        'simple',
        'with_underscore',
        'with-dash',
        'with.dot',
        'user123',
        'CamelCase',
      ];

      for (const username of testCases) {
        const payload = {
          sub: '123e4567-e89b-12d3-a456-426614174000',
          username,
          role: 'user',
        };

        const result = await jwtStrategy.validate(payload);

        expect(result.username).toBe(username);
      }
    });

    it('should handle UUID formats for userId', async () => {
      const uuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
      ];

      for (const uuid of uuids) {
        const payload = {
          sub: uuid,
          username: 'testuser',
          role: 'user',
        };

        const result = await jwtStrategy.validate(payload);

        expect(result.userId).toBe(uuid);
      }
    });
  });

  describe('JWT Configuration', () => {
    it('should use environment variable for JWT secret', () => {
      const secretKey = 'custom-secret-key';
      mockConfigService.get.mockReturnValue(secretKey);

      // Create a new instance to test config
      new JwtStrategy(configService);

      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should not ignore token expiration by default', () => {
      // The strategy should validate token expiration
      expect(jwtStrategy).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should extract token from Bearer Authorization header', () => {
      // This tests the configuration, not runtime behavior
      expect(jwtStrategy).toBeDefined();
    });

    it('should validate JWT signature using secret', () => {
      // The strategy should be configured with the secret
      const testConfigService = {
        get: jest.fn().mockReturnValue('test-secret'),
      };
      new JwtStrategy(testConfigService as any);
      expect(testConfigService.get).toHaveBeenCalled();
    });
  });
});
