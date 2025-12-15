import { UserRole } from '../../../users/user.entity';

/**
 * Mock user data for testing
 */
export const mockUserData = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  username: 'testuser',
  email: 'test@example.com',
  password: '$2b$10$hashedpassword',
  role: UserRole.USER,
  displayName: 'Test User',
  bio: 'Test bio',
  avatar: null,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

/**
 * Mock admin user data
 */
export const mockAdminUser = {
  ...mockUserData,
  id: '223e4567-e89b-12d3-a456-426614174001',
  username: 'adminuser',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
  displayName: 'Admin User',
};

/**
 * Mock editor user data
 */
export const mockEditorUser = {
  ...mockUserData,
  id: '323e4567-e89b-12d3-a456-426614174002',
  username: 'editoruser',
  email: 'editor@example.com',
  role: UserRole.EDITOR,
  displayName: 'Editor User',
};

/**
 * Mock author user data
 */
export const mockAuthorUser = {
  ...mockUserData,
  id: '423e4567-e89b-12d3-a456-426614174003',
  username: 'authoruser',
  email: 'author@example.com',
  role: UserRole.AUTHOR,
  displayName: 'Author User',
};

/**
 * Mock JWT tokens
 */
export const mockTokens = {
  validToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwic3ViIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9.test',
  expiredToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwic3ViIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyM30.test',
  invalidToken: 'invalid.token.here',
};

/**
 * Mock JWT payload
 */
export const mockJwtPayload = {
  username: mockUserData.username,
  sub: mockUserData.id,
  role: mockUserData.role,
  iat: 1516239022,
  exp: 1516239022 + 7 * 24 * 60 * 60, // 7 days
};

/**
 * Mock login DTOs
 */
export const mockLoginDto = {
  valid: {
    username: 'testuser',
    password: 'password123',
  },
  invalidUsername: {
    username: 'nonexistent',
    password: 'password123',
  },
  invalidPassword: {
    username: 'testuser',
    password: 'wrongpassword',
  },
  emptyUsername: {
    username: '',
    password: 'password123',
  },
  emptyPassword: {
    username: 'testuser',
    password: '',
  },
};

/**
 * Mock register DTOs
 */
export const mockRegisterDto = {
  valid: {
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'password123',
    displayName: 'New User',
  },
  minimal: {
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'password123',
  },
  full: {
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'password123',
    displayName: 'New User',
    bio: 'I am a new user',
    avatar: 'https://example.com/avatar.jpg',
  },
  invalidEmail: {
    username: 'newuser',
    email: 'invalid-email',
    password: 'password123',
  },
  weakPassword: {
    username: 'newuser',
    email: 'newuser@example.com',
    password: '123',
  },
  duplicateUsername: {
    username: 'testuser', // Already exists
    email: 'different@example.com',
    password: 'password123',
  },
  duplicateEmail: {
    username: 'differentuser',
    email: 'test@example.com', // Already exists
    password: 'password123',
  },
};

/**
 * Mock auth responses
 */
export const mockAuthResponse = {
  login: {
    access_token: mockTokens.validToken,
    user: {
      id: mockUserData.id,
      username: mockUserData.username,
      email: mockUserData.email,
      role: mockUserData.role,
      displayName: mockUserData.displayName,
      bio: mockUserData.bio,
      avatar: mockUserData.avatar,
      createdAt: mockUserData.createdAt,
    },
  },
  register: {
    access_token: mockTokens.validToken,
    user: {
      id: '987e6543-e21b-12d3-a456-426614174999',
      username: 'newuser',
      email: 'newuser@example.com',
      role: UserRole.USER,
      displayName: 'New User',
      bio: null,
      avatar: null,
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
    },
  },
};

/**
 * Mock UsersService
 */
export const mockUsersService = {
  findByUsername: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

/**
 * Mock JwtService
 */
export const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
};

/**
 * Mock ConfigService
 */
export const mockConfigService = {
  get: jest.fn((key: string) => {
    const config = {
      JWT_SECRET: 'test-jwt-secret-key',
      JWT_EXPIRATION: '7d',
    };
    return config[key];
  }),
};

/**
 * Database error mocks
 */
export const mockDatabaseErrors = {
  duplicateUsername: {
    code: '23505',
    detail: 'Key (username)=(testuser) already exists.',
    constraint: 'UQ_username',
  },
  duplicateEmail: {
    code: '23505',
    detail: 'Key (email)=(test@example.com) already exists.',
    constraint: 'UQ_email',
  },
  connectionError: new Error('Database connection failed'),
  queryError: new Error('Query execution failed'),
};

/**
 * Helper function to create a mock user
 */
export function createMockUser(overrides: Partial<typeof mockUserData> = {}) {
  return {
    ...mockUserData,
    ...overrides,
  };
}

/**
 * Helper function to create a mock JWT payload
 */
export function createMockJwtPayload(
  overrides: Partial<typeof mockJwtPayload> = {},
) {
  return {
    ...mockJwtPayload,
    ...overrides,
  };
}

/**
 * Helper function to reset all mocks
 */
export function resetAllMocks() {
  Object.values(mockUsersService).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
  Object.values(mockJwtService).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
  Object.values(mockConfigService).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
}
