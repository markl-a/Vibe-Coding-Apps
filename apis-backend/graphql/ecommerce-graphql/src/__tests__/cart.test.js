/**
 * Tests for Cart operations (myCart query, cart mutations)
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

describe('Cart Queries', () => {
  let context;

  beforeEach(() => {


    context = createMockContext('user-1');
    jest.clearAllMocks();
  });

  describe('myCart query', () => {
    test('should return user cart items', async () => {
      mockSuccessfulQuery(db.query, mockData.cartItems);

      const result = await resolvers.Query.myCart(null, {}, context);

      expect(result).toHaveLength(2);
      expect(result[0].product_id).toBe('product-1');
      expect(result[0].quantity).toBe(2);

      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM cart_items WHERE user_id = $1 ORDER BY created_at DESC',
        ['user-1']
      );
    });

    test('should return empty array for empty cart', async () => {
      mockEmptyQuery(db.query);

      const result = await resolvers.Query.myCart(null, {}, context);

      expect(result).toHaveLength(0);
      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      await expect(
        resolvers.Query.myCart(null, {}, { userId: null })
      ).rejects.toThrow('Authentication required');

      expect(db.query).not.toHaveBeenCalled();
    });
  });
});

describe('Cart Mutations', () => {
  let context;

  beforeEach(() => {


    context = createMockContext('user-1');
    jest.clearAllMocks();
  });

  describe('addToCart mutation', () => {
    test('should add new item to cart', async () => {
      // Mock: check product exists and has stock
      mockSuccessfulQuery(db.query, mockData.products[0]);

      // Mock: check if item already in cart (not found)
      mockEmptyQuery(db.query);

      // Mock: insert new cart item
      const newCartItem = {
        id: 'cart-3',
        user_id: 'user-1',
        product_id: 'product-1',
        quantity: 3,
        created_at: '2024-01-05T00:00:00Z'
      };
      mockSuccessfulQuery(db.query, newCartItem);

      const result = await resolvers.Mutation.addToCart(
        null,
        { productId: 'product-1', quantity: 3 },
        context
      );

      expect(result).toBeDefined();
      expect(result.quantity).toBe(3);

      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');

      // Verify product was checked
      expect(db.query).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM products WHERE id = $1',
        ['product-1']
      );

      // Verify cart item was inserted
      expect(db.query).toHaveBeenNthCalledWith(
        3,
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        ['user-1', 'product-1', 3]
      );
    });

    test('should update quantity if item already in cart', async () => {
      // Mock: check product exists
      mockSuccessfulQuery(db.query, mockData.products[0]);

      // Mock: item already in cart
      const existingCartItem = {
        id: 'cart-1',
        user_id: 'user-1',
        product_id: 'product-1',
        quantity: 2,
        created_at: '2024-01-01T00:00:00Z'
      };
      mockSuccessfulQuery(db.query, existingCartItem);

      // Mock: update cart item
      const updatedCartItem = {
        ...existingCartItem,
        quantity: 5
      };
      mockSuccessfulQuery(db.query, updatedCartItem);

      const result = await resolvers.Mutation.addToCart(
        null,
        { productId: 'product-1', quantity: 3 },
        context
      );

      expect(result.quantity).toBe(5); // 2 + 3

      // Verify update was called with new quantity
      expect(db.query).toHaveBeenNthCalledWith(
        3,
        'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
        [5, 'user-1', 'product-1']
      );
    });

    test('should throw error if product not found', async () => {
      mockEmptyQuery(db.query);

      await expect(
        resolvers.Mutation.addToCart(
          null,
          { productId: 'non-existent', quantity: 1 },
          context
        )
      ).rejects.toThrow(GraphQLError);

      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE id = $1',
        ['non-existent']
      );
    });

    test('should throw error if insufficient stock', async () => {
      const lowStockProduct = {
        ...mockData.products[0],
        stock: 5
      };
      mockSuccessfulQuery(db.query, lowStockProduct);

      await expect(
        resolvers.Mutation.addToCart(
          null,
          { productId: 'product-1', quantity: 10 },
          context
        )
      ).rejects.toThrow(GraphQLError);
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      await expect(
        resolvers.Mutation.addToCart(
          null,
          { productId: 'product-1', quantity: 1 },
          { userId: null }
        )
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('updateCartItem mutation', () => {
    test('should update cart item quantity', async () => {
      const updatedCartItem = {
        ...mockData.cartItems[0],
        quantity: 5
      };
      mockSuccessfulQuery(db.query, updatedCartItem);

      const result = await resolvers.Mutation.updateCartItem(
        null,
        { productId: 'product-1', quantity: 5 },
        context
      );

      expect(result.quantity).toBe(5);

      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
        [5, 'user-1', 'product-1']
      );
    });

    test('should throw error if quantity is 0 or negative', async () => {
      await expect(
        resolvers.Mutation.updateCartItem(
          null,
          { productId: 'product-1', quantity: 0 },
          context
        )
      ).rejects.toThrow(GraphQLError);

      await expect(
        resolvers.Mutation.updateCartItem(
          null,
          { productId: 'product-1', quantity: -1 },
          context
        )
      ).rejects.toThrow(GraphQLError);

      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw error if cart item not found', async () => {
      mockEmptyQuery(db.query);

      await expect(
        resolvers.Mutation.updateCartItem(
          null,
          { productId: 'non-existent', quantity: 5 },
          context
        )
      ).rejects.toThrow(GraphQLError);
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      await expect(
        resolvers.Mutation.updateCartItem(
          null,
          { productId: 'product-1', quantity: 5 },
          { userId: null }
        )
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('removeFromCart mutation', () => {
    test('should remove item from cart', async () => {
      mockSuccessfulQuery(db.query, { id: 'cart-1' });

      const result = await resolvers.Mutation.removeFromCart(
        null,
        { productId: 'product-1' },
        context
      );

      expect(result).toBe(true);

      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
        ['user-1', 'product-1']
      );
    });

    test('should return true even if item not in cart', async () => {
      mockEmptyQuery(db.query);

      const result = await resolvers.Mutation.removeFromCart(
        null,
        { productId: 'non-existent' },
        context
      );

      expect(result).toBe(true);
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      await expect(
        resolvers.Mutation.removeFromCart(
          null,
          { productId: 'product-1' },
          { userId: null }
        )
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('clearCart mutation', () => {
    test('should clear all items from user cart', async () => {
      mockSuccessfulQuery(db.query, mockData.cartItems);

      const result = await resolvers.Mutation.clearCart(null, {}, context);

      expect(result).toBe(true);

      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM cart_items WHERE user_id = $1',
        ['user-1']
      );
    });

    test('should return true even if cart is already empty', async () => {
      mockEmptyQuery(db.query);

      const result = await resolvers.Mutation.clearCart(null, {}, context);

      expect(result).toBe(true);
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      await expect(
        resolvers.Mutation.clearCart(null, {}, { userId: null })
      ).rejects.toThrow('Authentication required');
    });
  });
});

describe('CartItem Field Resolvers', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CartItem.product', () => {
    test('should resolve product for cart item', async () => {
      mockSuccessfulQuery(db.query, mockData.products[0]);

      const result = await resolvers.CartItem.product(mockData.cartItems[0]);

      expect(result).toBeDefined();
      expect(result.id).toBe('product-1');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE id = $1',
        ['product-1']
      );
    });
  });

  describe('CartItem.subtotal', () => {
    test('should calculate subtotal for cart item', async () => {
      mockSuccessfulQuery(db.query, { price: 29.99 });

      const cartItem = mockData.cartItems[0]; // quantity: 2
      const result = await resolvers.CartItem.subtotal(cartItem);

      expect(result).toBe(59.98); // 29.99 * 2

      expect(db.query).toHaveBeenCalledWith(
        'SELECT price FROM products WHERE id = $1',
        ['product-1']
      );
    });

    test('should handle decimal precision correctly', async () => {
      mockSuccessfulQuery(db.query, { price: 19.99 });

      const cartItem = { ...mockData.cartItems[0], quantity: 3 };
      const result = await resolvers.CartItem.subtotal(cartItem);

      expect(result).toBe(59.97); // 19.99 * 3
    });
  });
});
