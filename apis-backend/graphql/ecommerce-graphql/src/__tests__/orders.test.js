/**
 * Tests for Order queries and mutations
 */

const { GraphQLError } = require('graphql');
const {
  createMockQuery,
  createMockContext,
  createMockPubSub,
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

describe('Order Queries', () => {
  let context;

  beforeEach(() => {


    context = createMockContext('user-1');
    jest.clearAllMocks();
  });

  describe('myOrders query', () => {
    test('should return user orders', async () => {
      mockSuccessfulQuery(db.query, mockData.orders);

      const result = await resolvers.Query.myOrders(null, {}, context);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('order-1');
      expect(result[0].total_amount).toBe(109.97);
      expect(result[0].status).toBe('pending');

      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
        ['user-1']
      );
    });

    test('should return empty array if no orders', async () => {
      mockEmptyQuery(db.query);

      const result = await resolvers.Query.myOrders(null, {}, context);

      expect(result).toHaveLength(0);
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      await expect(
        resolvers.Query.myOrders(null, {}, { userId: null })
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('order query', () => {
    test('should return specific order for authenticated user', async () => {
      mockSuccessfulQuery(db.query, mockData.orders[0]);

      const result = await resolvers.Query.order(null, { id: 'order-1' }, context);

      expect(result).toBeDefined();
      expect(result.id).toBe('order-1');
      expect(result.user_id).toBe('user-1');

      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
        ['order-1', 'user-1']
      );
    });

    test('should throw error if order not found', async () => {
      mockEmptyQuery(db.query);

      await expect(
        resolvers.Query.order(null, { id: 'non-existent' }, context)
      ).rejects.toThrow(GraphQLError);
    });

    test("should throw error if trying to access another user's order", async () => {
      mockEmptyQuery(db.query);

      await expect(
        resolvers.Query.order(null, { id: 'order-1' }, context)
      ).rejects.toThrow(GraphQLError);
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      await expect(
        resolvers.Query.order(null, { id: 'order-1' }, { userId: null })
      ).rejects.toThrow('Authentication required');
    });
  });
});

describe('Order Mutations', () => {
  let context;

  beforeEach(() => {


    context = createMockContext('user-1');
    jest.clearAllMocks();
  });

  describe('createOrder mutation', () => {
    test('should create order from cart items', async () => {
      // Mock: get cart items with product info
      const cartItemsWithProducts = [
        {
          ...mockData.cartItems[0],
          price: 29.99,
          stock: 100,
          name: 'Test Product 1'
        },
        {
          ...mockData.cartItems[1],
          price: 49.99,
          stock: 50,
          name: 'Test Product 2'
        }
      ];
      mockSuccessfulQuery(db.query, cartItemsWithProducts);

      // Mock: create order
      const newOrder = {
        id: 'order-2',
        user_id: 'user-1',
        total_amount: 109.97,
        status: 'pending',
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z'
      };
      mockSuccessfulQuery(db.query, newOrder);

      // Mock: create order items (2 items)
      mockSuccessfulQuery(db.query, { id: 'order-item-1' });
      mockSuccessfulQuery(db.query, { id: 'order-item-2' });

      // Mock: update stock (2 products)
      mockSuccessfulQuery(db.query, { id: 'product-1' });
      mockSuccessfulQuery(db.query, { id: 'product-2' });

      // Mock: get updated product for pubsub (2 products)
      mockSuccessfulQuery(db.query, mockData.products[0]);
      mockSuccessfulQuery(db.query, mockData.products[1]);

      // Mock: clear cart
      mockSuccessfulQuery(db.query, {});

      const result = await resolvers.Mutation.createOrder(null, {}, context);

      expect(result).toBeDefined();
      expect(result.id).toBe('order-2');
      expect(result.total_amount).toBe(109.97);
      expect(result.status).toBe('pending');

      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');

      // Verify cart items were fetched
      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('FROM cart_items'),
        ['user-1']
      );

      // Verify order was created with correct total
      expect(db.query).toHaveBeenNthCalledWith(
        2,
        'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
        ['user-1', 109.97, 'pending']
      );

      // Verify cart was cleared
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM cart_items WHERE user_id = $1',
        ['user-1']
      );
    });

    test('should throw error if cart is empty', async () => {
      mockEmptyQuery(db.query);

      await expect(
        resolvers.Mutation.createOrder(null, {}, context)
      ).rejects.toThrow(GraphQLError);

      // Should only query cart, not create order
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('should throw error if insufficient stock', async () => {
      const cartItemsWithLowStock = [
        {
          ...mockData.cartItems[0],
          price: 29.99,
          stock: 1, // Lower than quantity (2)
          name: 'Test Product 1'
        }
      ];
      mockSuccessfulQuery(db.query, cartItemsWithLowStock);

      await expect(
        resolvers.Mutation.createOrder(null, {}, context)
      ).rejects.toThrow(GraphQLError);

      // Should only query cart, not create order
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('should calculate total amount correctly', async () => {
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
          quantity: 3,
          price: 15.50,
          stock: 50,
          name: 'Product 2'
        }
      ];
      mockSuccessfulQuery(db.query, cartItems);

      const expectedTotal = (2 * 29.99) + (3 * 15.50); // 106.48

      // Mock order creation
      const newOrder = {
        id: 'order-3',
        user_id: 'user-1',
        total_amount: expectedTotal,
        status: 'pending',
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z'
      };
      mockSuccessfulQuery(db.query, newOrder);

      // Mock remaining calls
      for (let i = 0; i < 8; i++) {
        mockSuccessfulQuery(db.query, {});
      }

      await resolvers.Mutation.createOrder(null, {}, context);

      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
        ['user-1', expectedTotal, 'pending']
      );
    });

    test('should create order items for each cart item', async () => {
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
      mockSuccessfulQuery(db.query, mockData.orders[0]);

      // Mock order item creation (2 items)
      mockSuccessfulQuery(db.query, {});
      mockSuccessfulQuery(db.query, {});

      // Mock stock updates and pubsub queries
      for (let i = 0; i < 5; i++) {
        mockSuccessfulQuery(db.query, {});
      }

      await resolvers.Mutation.createOrder(null, {}, context);

      // Verify order items were created
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        ['order-1', 'product-1', 2, 29.99]
      );

      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        ['order-1', 'product-2', 1, 49.99]
      );
    });

    test('should update product stock after order creation', async () => {
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
      mockSuccessfulQuery(db.query, mockData.orders[0]);

      // Mock order item creation
      mockSuccessfulQuery(db.query, {});

      // Mock stock update
      mockSuccessfulQuery(db.query, {});

      // Mock pubsub queries
      mockSuccessfulQuery(db.query, mockData.products[0]);

      // Mock clear cart
      mockSuccessfulQuery(db.query, {});

      await resolvers.Mutation.createOrder(null, {}, context);

      // Verify stock was decreased
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [2, 'product-1']
      );
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      await expect(
        resolvers.Mutation.createOrder(null, {}, { userId: null })
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('updateOrderStatus mutation', () => {
    test('should update order status', async () => {
      const updatedOrder = {
        ...mockData.orders[0],
        status: 'shipped',
        updated_at: '2024-01-06T00:00:00Z'
      };
      mockSuccessfulQuery(db.query, updatedOrder);

      const result = await resolvers.Mutation.updateOrderStatus(
        null,
        { orderId: 'order-1', status: 'shipped' },
        context
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('shipped');

      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        ['shipped', 'order-1']
      );
    });

    test('should handle various status values', async () => {
      const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

      for (const status of statuses) {
        mockSuccessfulQuery(db.query, { ...mockData.orders[0], status });

        const result = await resolvers.Mutation.updateOrderStatus(
          null,
          { orderId: 'order-1', status },
          context
        );

        expect(result.status).toBe(status);
      }
    });

    test('should throw error if order not found', async () => {
      mockEmptyQuery(db.query);

      await expect(
        resolvers.Mutation.updateOrderStatus(
          null,
          { orderId: 'non-existent', status: 'shipped' },
          context
        )
      ).rejects.toThrow(GraphQLError);
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      await expect(
        resolvers.Mutation.updateOrderStatus(
          null,
          { orderId: 'order-1', status: 'shipped' },
          { userId: null }
        )
      ).rejects.toThrow('Authentication required');
    });
  });
});

describe('Order Field Resolvers', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Order.user', () => {
    test('should resolve user for order', async () => {
      mockSuccessfulQuery(db.query, mockData.users[0]);

      const result = await resolvers.Order.user(mockData.orders[0]);

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
      expect(result.email).toBe('test@example.com');

      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['user-1']
      );
    });
  });

  describe('Order.items', () => {
    test('should resolve order items for order', async () => {
      mockSuccessfulQuery(db.query, mockData.orderItems);

      const result = await resolvers.Order.items(mockData.orders[0]);

      expect(result).toHaveLength(2);
      expect(result[0].product_id).toBe('product-1');
      expect(result[0].quantity).toBe(2);

      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM order_items WHERE order_id = $1',
        ['order-1']
      );
    });
  });
});

describe('OrderItem Field Resolvers', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OrderItem.product', () => {
    test('should resolve product for order item', async () => {
      mockSuccessfulQuery(db.query, mockData.products[0]);

      const result = await resolvers.OrderItem.product(mockData.orderItems[0]);

      expect(result).toBeDefined();
      expect(result.id).toBe('product-1');
      expect(result.name).toBe('Test Product 1');

      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE id = $1',
        ['product-1']
      );
    });
  });

  describe('OrderItem.subtotal', () => {
    test('should calculate subtotal for order item', () => {
      const orderItem = mockData.orderItems[0]; // quantity: 2, price: 29.99
      const result = resolvers.OrderItem.subtotal(orderItem);

      expect(result).toBe(59.98); // 2 * 29.99
    });

    test('should handle different quantities and prices', () => {
      const orderItem = {
        ...mockData.orderItems[0],
        quantity: 3,
        price: 19.99
      };

      const result = resolvers.OrderItem.subtotal(orderItem);

      expect(result).toBe(59.97); // 3 * 19.99
    });

    test('should handle single item', () => {
      const orderItem = {
        ...mockData.orderItems[0],
        quantity: 1,
        price: 99.99
      };

      const result = resolvers.OrderItem.subtotal(orderItem);

      expect(result).toBe(99.99);
    });
  });
});
