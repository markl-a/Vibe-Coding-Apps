/**
 * Tests for GraphQL Subscriptions and PubSub functionality
 */

const { createMockPubSub } = require('./helpers');

// Mock the graphql-yoga PubSub
const mockPubSub = createMockPubSub();
jest.mock('graphql-yoga', () => ({
  createPubSub: jest.fn(() => mockPubSub),
  GraphQLError: require('graphql').GraphQLError
}));

// Mock the dependencies
jest.mock('../utils/db');
jest.mock('../utils/auth');

// Import resolvers after mocking
const resolvers = require('../resolvers');

describe('GraphQL Subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('productStockUpdated subscription', () => {
    test('should subscribe to all product stock updates when no productId specified', () => {
      mockPubSub.subscribe.mockReturnValue('subscription-iterator');

      const result = resolvers.Subscription.productStockUpdated.subscribe(null, {});

      expect(result).toBe('subscription-iterator');
      expect(mockPubSub.subscribe).toHaveBeenCalledWith('PRODUCT_STOCK_UPDATED');
    });

    test('should subscribe to specific product stock updates with filter', () => {
      mockPubSub.subscribe.mockReturnValue('subscription-iterator');

      const result = resolvers.Subscription.productStockUpdated.subscribe(
        null,
        { productId: 'product-1' }
      );

      expect(result).toBe('subscription-iterator');
      expect(mockPubSub.subscribe).toHaveBeenCalledWith(
        'PRODUCT_STOCK_UPDATED',
        expect.any(Function)
      );
    });

    test('should filter events for specific product', () => {
      let filterFunction;

      mockPubSub.subscribe.mockImplementation((channel, filter) => {
        filterFunction = filter;
        return 'subscription-iterator';
      });

      resolvers.Subscription.productStockUpdated.subscribe(
        null,
        { productId: 'product-1' }
      );

      // Test the filter function
      expect(filterFunction).toBeDefined();

      // Should pass for matching product
      const matchingPayload = {
        productStockUpdated: { id: 'product-1', stock: 50 }
      };
      expect(filterFunction(matchingPayload)).toBe(true);

      // Should not pass for different product
      const nonMatchingPayload = {
        productStockUpdated: { id: 'product-2', stock: 30 }
      };
      expect(filterFunction(nonMatchingPayload)).toBe(false);
    });
  });

  describe('newOrder subscription', () => {
    test('should subscribe to new order events', () => {
      mockPubSub.subscribe.mockReturnValue('subscription-iterator');

      const result = resolvers.Subscription.newOrder.subscribe();

      expect(result).toBe('subscription-iterator');
      expect(mockPubSub.subscribe).toHaveBeenCalledWith('NEW_ORDER');
    });
  });
});

describe('PubSub Events', () => {
  let db.query;
  let context;

  beforeEach(() => {
    const db = require('../utils/db');
    const auth = require('../utils/auth');
    const { createMockQuery, createMockContext, mockSuccessfulQuery } = require('./helpers');

    db.query = createMockQuery();
    db.query = db.query;

    auth.requireAuth = auth.requireAuth;

    context = createMockContext('user-1');
    jest.clearAllMocks();
  });

  describe('PRODUCT_STOCK_UPDATED event', () => {
    test('should publish event when order is created and stock is updated', async () => {
      const { mockSuccessfulQuery } = require('./helpers');

      // Setup cart items with products
      const cartItems = [
        {
          product_id: 'product-1',
          quantity: 2,
          price: 29.99,
          stock: 100,
          name: 'Product 1'
        }
      ];
      mockSuccessfulQuery(db.query, cartItems);

      // Mock order creation
      mockSuccessfulQuery(db.query, {
        id: 'order-1',
        user_id: 'user-1',
        total_amount: 59.98,
        status: 'pending'
      });

      // Mock order item creation
      mockSuccessfulQuery(db.query, {});

      // Mock stock update
      mockSuccessfulQuery(db.query, {});

      // Mock updated product for pubsub
      const updatedProduct = {
        id: 'product-1',
        name: 'Product 1',
        stock: 98, // Decreased by 2
        price: 29.99
      };
      mockSuccessfulQuery(db.query, updatedProduct);

      // Mock clear cart
      mockSuccessfulQuery(db.query, {});

      await resolvers.Mutation.createOrder(null, {}, context);

      // Verify pubsub.publish was called with correct data
      expect(mockPubSub.publish).toHaveBeenCalledWith(
        'PRODUCT_STOCK_UPDATED',
        { productStockUpdated: updatedProduct }
      );
    });
  });

  describe('NEW_ORDER event', () => {
    test('should publish event when new order is created', async () => {
      const { mockSuccessfulQuery } = require('./helpers');

      // Setup cart items
      const cartItems = [
        {
          product_id: 'product-1',
          quantity: 1,
          price: 29.99,
          stock: 100,
          name: 'Product 1'
        }
      ];
      mockSuccessfulQuery(db.query, cartItems);

      // Mock order creation
      const newOrder = {
        id: 'order-new',
        user_id: 'user-1',
        total_amount: 29.99,
        status: 'pending',
        created_at: '2024-01-05T00:00:00Z'
      };
      mockSuccessfulQuery(db.query, newOrder);

      // Mock remaining operations
      for (let i = 0; i < 4; i++) {
        mockSuccessfulQuery(db.query, {});
      }

      await resolvers.Mutation.createOrder(null, {}, context);

      // Verify pubsub.publish was called with new order
      expect(mockPubSub.publish).toHaveBeenCalledWith(
        'NEW_ORDER',
        { newOrder }
      );
    });
  });
});

describe('Integration: Subscriptions with Mutations', () => {
  let db.query;
  let context;

  beforeEach(() => {
    const db = require('../utils/db');
    const auth = require('../utils/auth');
    const { createMockQuery, createMockContext, mockSuccessfulQuery } = require('./helpers');

    db.query = createMockQuery();
    db.query = db.query;

    auth.requireAuth = auth.requireAuth;

    context = createMockContext('user-1');
    jest.clearAllMocks();
  });

  test('should publish PRODUCT_STOCK_UPDATED for each product in order', async () => {
    const { mockSuccessfulQuery } = require('./helpers');

    // Setup cart with multiple products
    const cartItems = [
      {
        product_id: 'product-1',
        quantity: 2,
        price: 29.99,
        stock: 100,
        name: 'Product 1'
      },
      {
        product_id: 'product-2',
        quantity: 1,
        price: 49.99,
        stock: 50,
        name: 'Product 2'
      }
    ];
    mockSuccessfulQuery(db.query, cartItems);

    // Mock order creation
    mockSuccessfulQuery(db.query, {
      id: 'order-1',
      user_id: 'user-1',
      total_amount: 109.97,
      status: 'pending'
    });

    // Mock order items and stock updates
    for (let i = 0; i < 4; i++) {
      mockSuccessfulQuery(db.query, {});
    }

    // Mock updated products for pubsub
    mockSuccessfulQuery(db.query, {
      id: 'product-1',
      name: 'Product 1',
      stock: 98
    });

    mockSuccessfulQuery(db.query, {
      id: 'product-2',
      name: 'Product 2',
      stock: 49
    });

    // Mock clear cart
    mockSuccessfulQuery(db.query, {});

    await resolvers.Mutation.createOrder(null, {}, context);

    // Should publish stock update for each product
    expect(mockPubSub.publish).toHaveBeenCalledWith(
      'PRODUCT_STOCK_UPDATED',
      expect.objectContaining({
        productStockUpdated: expect.objectContaining({ id: 'product-1' })
      })
    );

    expect(mockPubSub.publish).toHaveBeenCalledWith(
      'PRODUCT_STOCK_UPDATED',
      expect.objectContaining({
        productStockUpdated: expect.objectContaining({ id: 'product-2' })
      })
    );

    // Should also publish new order event
    expect(mockPubSub.publish).toHaveBeenCalledWith(
      'NEW_ORDER',
      expect.any(Object)
    );

    // Total of 3 publish calls (2 stock updates + 1 new order)
    expect(mockPubSub.publish).toHaveBeenCalledTimes(3);
  });

  test('should not publish events if order creation fails', async () => {
    const { mockEmptyQuery } = require('./helpers');

    // Mock empty cart
    mockEmptyQuery(db.query);

    try {
      await resolvers.Mutation.createOrder(null, {}, context);
    } catch (error) {
      // Expected to fail
    }

    // Should not publish any events
    expect(mockPubSub.publish).not.toHaveBeenCalled();
  });
});
