/**
 * Tests for User Authentication (register, login, me)
 */

const { GraphQLError } = require('graphql');
const {
  createMockQuery,
  createMockContext,
  createUnauthenticatedContext,
  mockSuccessfulQuery,
  mockEmptyQuery,
  mockData
} = require('./helpers');

// Mock the dependencies
jest.mock('../utils/db');
jest.mock('../utils/auth');

const db = require('../utils/db');
const auth = require('../utils/auth');

// Import resolvers after mocking
const resolvers = require('../resolvers');

describe('User Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default auth mock implementations
    auth.generateToken.mockReturnValue('mock-jwt-token-123');
    auth.hashPassword.mockResolvedValue('$2a$10$mockhashedpassword');
    auth.comparePassword.mockReset();
    auth.requireAuth.mockReset();
  });

  describe('register mutation', () => {
    test('should register a new user successfully', async () => {
      // Mock: check if email exists (should return empty)
      mockEmptyQuery(db.query);

      // Mock: create user
      const newUser = {
        id: 'user-3',
        name: 'New User',
        email: 'newuser@example.com',
        password: '$2a$10$mockhashedpassword',
        created_at: '2024-01-01T00:00:00Z'
      };
      mockSuccessfulQuery(db.query, newUser);

      const result = await resolvers.Mutation.register(
        null,
        {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'securepassword123'
        },
        {}
      );

      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-token-123');
      expect(result.user.name).toBe('New User');
      expect(result.user.email).toBe('newuser@example.com');

      // Verify password was hashed
      expect(auth.hashPassword).toHaveBeenCalledWith('securepassword123');

      // Verify user was created with hashed password
      expect(db.query).toHaveBeenNthCalledWith(
        2,
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
        ['New User', 'newuser@example.com', '$2a$10$mockhashedpassword']
      );

      // Verify token was generated
      expect(auth.generateToken).toHaveBeenCalledWith('user-3');
    });

    test('should throw error if email already exists', async () => {
      // Mock: email already exists
      mockSuccessfulQuery(db.query, mockData.users[0]);

      await expect(
        resolvers.Mutation.register(
          null,
          {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
          },
          {}
        )
      ).rejects.toThrow(GraphQLError);

      // Verify it checked for existing email
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );

      // Should not create user
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('should validate email field in error', async () => {
      mockSuccessfulQuery(db.query, mockData.users[0]);

      try {
        await resolvers.Mutation.register(
          null,
          {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
          },
          {}
        );
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect(error.extensions.code).toBe('BAD_USER_INPUT');
        expect(error.extensions.field).toBe('email');
      }
    });
  });

  describe('login mutation', () => {
    test('should login user with valid credentials', async () => {
      // Mock: find user by email
      mockSuccessfulQuery(db.query, mockData.users[0]);

      // Mock: password comparison
      auth.comparePassword.mockResolvedValue(true);

      const result = await resolvers.Mutation.login(
        null,
        {
          email: 'test@example.com',
          password: 'correctpassword'
        },
        {}
      );

      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-token-123');
      expect(result.user.email).toBe('test@example.com');

      // Verify user lookup
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );

      // Verify password comparison
      expect(auth.comparePassword).toHaveBeenCalledWith(
        'correctpassword',
        '$2a$10$mockhashedpassword'
      );

      // Verify token generation
      expect(auth.generateToken).toHaveBeenCalledWith('user-1');
    });

    test('should throw error if user not found', async () => {
      // Mock: user not found
      mockEmptyQuery(db.query);

      await expect(
        resolvers.Mutation.login(
          null,
          {
            email: 'nonexistent@example.com',
            password: 'password123'
          },
          {}
        )
      ).rejects.toThrow(GraphQLError);

      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['nonexistent@example.com']
      );
    });

    test('should throw error if password is invalid', async () => {
      // Mock: find user
      mockSuccessfulQuery(db.query, mockData.users[0]);

      // Mock: password comparison fails
      auth.comparePassword.mockResolvedValue(false);

      await expect(
        resolvers.Mutation.login(
          null,
          {
            email: 'test@example.com',
            password: 'wrongpassword'
          },
          {}
        )
      ).rejects.toThrow(GraphQLError);

      expect(auth.comparePassword).toHaveBeenCalledWith(
        'wrongpassword',
        '$2a$10$mockhashedpassword'
      );
    });

    test('should return UNAUTHENTICATED error code for invalid credentials', async () => {
      mockEmptyQuery(db.query);

      try {
        await resolvers.Mutation.login(
          null,
          {
            email: 'test@example.com',
            password: 'wrongpassword'
          },
          {}
        );
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect(error.extensions.code).toBe('UNAUTHENTICATED');
      }
    });
  });

  describe('me query', () => {
    test('should return current user when authenticated', async () => {
      const context = createMockContext('user-1');
      mockSuccessfulQuery(db.query, mockData.users[0]);

      const result = await resolvers.Query.me(null, {}, context);

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
      expect(result.email).toBe('test@example.com');

      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['user-1']
      );
    });

    test('should return null when not authenticated', async () => {
      const context = createUnauthenticatedContext();

      const result = await resolvers.Query.me(null, {}, context);

      expect(result).toBeNull();
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should return null if user not found in database', async () => {
      const context = createMockContext('non-existent-user');
      mockEmptyQuery(db.query);

      const result = await resolvers.Query.me(null, {}, context);

      expect(result).toBeNull();
    });
  });
});

describe('Review Mutations', () => {
  let context;

  beforeEach(() => {
    jest.clearAllMocks();
    context = createMockContext('user-1');
    auth.requireAuth.mockReset();
  });

  describe('addReview mutation', () => {
    test('should add a review successfully', async () => {
      const newReview = {
        id: 'review-3',
        product_id: 'product-1',
        user_id: 'user-1',
        rating: 5,
        comment: 'Excellent product!',
        created_at: '2024-01-06T00:00:00Z'
      };

      mockSuccessfulQuery(db.query, newReview);

      const result = await resolvers.Mutation.addReview(
        null,
        {
          productId: 'product-1',
          rating: 5,
          comment: 'Excellent product!'
        },
        context
      );

      expect(result).toBeDefined();
      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Excellent product!');

      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');

      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
        ['product-1', 'user-1', 5, 'Excellent product!']
      );
    });

    test('should add a review without comment', async () => {
      const newReview = {
        id: 'review-4',
        product_id: 'product-1',
        user_id: 'user-1',
        rating: 4,
        comment: null,
        created_at: '2024-01-06T00:00:00Z'
      };

      mockSuccessfulQuery(db.query, newReview);

      const result = await resolvers.Mutation.addReview(
        null,
        {
          productId: 'product-1',
          rating: 4
        },
        context
      );

      expect(result).toBeDefined();
      expect(result.rating).toBe(4);

      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
        ['product-1', 'user-1', 4, undefined]
      );
    });

    test('should throw error if rating is less than 1', async () => {
      await expect(
        resolvers.Mutation.addReview(
          null,
          {
            productId: 'product-1',
            rating: 0,
            comment: 'Bad rating'
          },
          context
        )
      ).rejects.toThrow(GraphQLError);

      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw error if rating is greater than 5', async () => {
      await expect(
        resolvers.Mutation.addReview(
          null,
          {
            productId: 'product-1',
            rating: 6,
            comment: 'Too high rating'
          },
          context
        )
      ).rejects.toThrow(GraphQLError);

      expect(db.query).not.toHaveBeenCalled();
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      await expect(
        resolvers.Mutation.addReview(
          null,
          {
            productId: 'product-1',
            rating: 5,
            comment: 'Great!'
          },
          { userId: null }
        )
      ).rejects.toThrow('Authentication required');
    });
  });
});

describe('Review Field Resolvers', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Review.product', () => {
    test('should resolve product for review', async () => {
      mockSuccessfulQuery(db.query, mockData.products[0]);

      const result = await resolvers.Review.product(mockData.reviews[0]);

      expect(result).toBeDefined();
      expect(result.id).toBe('product-1');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE id = $1',
        ['product-1']
      );
    });
  });

  describe('Review.user', () => {
    test('should resolve user for review', async () => {
      mockSuccessfulQuery(db.query, mockData.users[0]);

      const result = await resolvers.Review.user(mockData.reviews[0]);

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['user-1']
      );
    });
  });
});
