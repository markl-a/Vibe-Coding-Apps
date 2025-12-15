/**
 * Test helpers and utilities for ecommerce GraphQL API tests
 */

// Mock database query function
const createMockQuery = () => {
  const mockQuery = jest.fn();
  return mockQuery;
};

// Mock context with authenticated user
const createMockContext = (userId = 'test-user-id') => {
  return {
    userId,
    request: {
      headers: {
        get: jest.fn().mockReturnValue(`Bearer mock-token-${userId}`)
      }
    }
  };
};

// Mock context for unauthenticated user
const createUnauthenticatedContext = () => {
  return {
    userId: null,
    request: {
      headers: {
        get: jest.fn().mockReturnValue('')
      }
    }
  };
};

// Mock product data
const mockProducts = [
  {
    id: 'product-1',
    name: 'Test Product 1',
    description: 'A test product',
    price: 29.99,
    stock: 100,
    category_id: 'category-1',
    image_url: 'https://example.com/image1.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'product-2',
    name: 'Test Product 2',
    description: 'Another test product',
    price: 49.99,
    stock: 50,
    category_id: 'category-2',
    image_url: 'https://example.com/image2.jpg',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

// Mock category data
const mockCategories = [
  {
    id: 'category-1',
    name: 'Electronics',
    description: 'Electronic products',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'category-2',
    name: 'Clothing',
    description: 'Clothing items',
    created_at: '2024-01-01T00:00:00Z'
  }
];

// Mock user data
const mockUsers = [
  {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2a$10$mockhashedpassword',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user-2',
    name: 'Another User',
    email: 'another@example.com',
    password: '$2a$10$anothermockhashedpassword',
    created_at: '2024-01-02T00:00:00Z'
  }
];

// Mock cart items
const mockCartItems = [
  {
    id: 'cart-1',
    user_id: 'user-1',
    product_id: 'product-1',
    quantity: 2,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cart-2',
    user_id: 'user-1',
    product_id: 'product-2',
    quantity: 1,
    created_at: '2024-01-02T00:00:00Z'
  }
];

// Mock orders
const mockOrders = [
  {
    id: 'order-1',
    user_id: 'user-1',
    total_amount: 109.97,
    status: 'pending',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  }
];

// Mock order items
const mockOrderItems = [
  {
    id: 'order-item-1',
    order_id: 'order-1',
    product_id: 'product-1',
    quantity: 2,
    price: 29.99,
    created_at: '2024-01-03T00:00:00Z'
  },
  {
    id: 'order-item-2',
    order_id: 'order-1',
    product_id: 'product-2',
    quantity: 1,
    price: 49.99,
    created_at: '2024-01-03T00:00:00Z'
  }
];

// Mock reviews
const mockReviews = [
  {
    id: 'review-1',
    product_id: 'product-1',
    user_id: 'user-1',
    rating: 5,
    comment: 'Great product!',
    created_at: '2024-01-04T00:00:00Z'
  },
  {
    id: 'review-2',
    product_id: 'product-1',
    user_id: 'user-2',
    rating: 4,
    comment: 'Good quality',
    created_at: '2024-01-05T00:00:00Z'
  }
];

// Mock PubSub
const createMockPubSub = () => {
  return {
    publish: jest.fn(),
    subscribe: jest.fn()
  };
};

// Helper to mock successful database query
const mockSuccessfulQuery = (mockQuery, data) => {
  const result = {
    rows: Array.isArray(data) ? data : [data],
    rowCount: Array.isArray(data) ? data.length : 1
  };
  mockQuery.mockResolvedValueOnce(result);
  return result;
};

// Helper to mock empty database query
const mockEmptyQuery = (mockQuery) => {
  const result = {
    rows: [],
    rowCount: 0
  };
  mockQuery.mockResolvedValueOnce(result);
  return result;
};

// Helper to mock database error
const mockQueryError = (mockQuery, error) => {
  mockQuery.mockRejectedValueOnce(error);
};

// Helper to mock auth functions
const createMockAuth = () => {
  return {
    generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
    hashPassword: jest.fn().mockResolvedValue('$2a$10$mockhashedpassword'),
    comparePassword: jest.fn(),
    requireAuth: jest.fn((userId) => {
      if (!userId) {
        throw new Error('Authentication required');
      }
    }),
    verifyToken: jest.fn().mockReturnValue({ userId: 'test-user-id' }),
    getUserFromRequest: jest.fn().mockReturnValue('test-user-id')
  };
};

// Helper to execute a resolver with mocked dependencies
const executeResolver = async (resolver, args, context, mocks = {}) => {
  // Mock db module
  if (mocks.query) {
    jest.mock('../utils/db', () => ({
      query: mocks.query
    }));
  }

  // Mock auth module
  if (mocks.auth) {
    jest.mock('../utils/auth', () => mocks.auth);
  }

  // Execute resolver
  return await resolver(null, args, context);
};

module.exports = {
  createMockQuery,
  createMockContext,
  createUnauthenticatedContext,
  createMockPubSub,
  mockSuccessfulQuery,
  mockEmptyQuery,
  mockQueryError,
  createMockAuth,
  executeResolver,
  mockData: {
    products: mockProducts,
    categories: mockCategories,
    users: mockUsers,
    cartItems: mockCartItems,
    orders: mockOrders,
    orderItems: mockOrderItems,
    reviews: mockReviews
  }
};
