const { query } = require('../utils/db');
const { generateToken, hashPassword, comparePassword, requireAuth } = require('../utils/auth');
const { GraphQLError } = require('graphql');
const { createPubSub } = require('graphql-yoga');

// 創建 PubSub 實例用於訂閱
const pubsub = createPubSub();

const resolvers = {
  Query: {
    // 查詢商品列表
    products: async (parent, args) => {
      const { limit = 50, offset = 0, category, minPrice, maxPrice, search } = args;

      let queryText = 'SELECT * FROM products WHERE 1=1';
      const params = [];
      let paramCount = 1;

      // 分類篩選
      if (category) {
        queryText += ` AND category_id = (SELECT id FROM categories WHERE name = $${paramCount})`;
        params.push(category);
        paramCount++;
      }

      // 價格範圍
      if (minPrice !== undefined) {
        queryText += ` AND price >= $${paramCount}`;
        params.push(minPrice);
        paramCount++;
      }

      if (maxPrice !== undefined) {
        queryText += ` AND price <= $${paramCount}`;
        params.push(maxPrice);
        paramCount++;
      }

      // 搜尋關鍵字
      if (search) {
        queryText += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
        paramCount++;
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    },

    // 查詢單一商品
    product: async (parent, { id }) => {
      const result = await query('SELECT * FROM products WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        throw new GraphQLError('Product not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }
      return result.rows[0];
    },

    // 查詢所有分類
    categories: async () => {
      const result = await query('SELECT * FROM categories ORDER BY name');
      return result.rows;
    },

    // 查詢單一分類
    category: async (parent, { id }) => {
      const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        throw new GraphQLError('Category not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }
      return result.rows[0];
    },

    // 查詢我的購物車
    myCart: async (parent, args, context) => {
      requireAuth(context.userId);

      const result = await query(
        'SELECT * FROM cart_items WHERE user_id = $1 ORDER BY created_at DESC',
        [context.userId]
      );
      return result.rows;
    },

    // 查詢我的訂單
    myOrders: async (parent, args, context) => {
      requireAuth(context.userId);

      const result = await query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
        [context.userId]
      );
      return result.rows;
    },

    // 查詢單一訂單
    order: async (parent, { id }, context) => {
      requireAuth(context.userId);

      const result = await query(
        'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
        [id, context.userId]
      );

      if (result.rows.length === 0) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return result.rows[0];
    },

    // 查詢當前用戶
    me: async (parent, args, context) => {
      if (!context.userId) return null;

      const result = await query('SELECT * FROM users WHERE id = $1', [context.userId]);
      return result.rows[0] || null;
    }
  },

  Mutation: {
    // 用戶註冊
    register: async (parent, { name, email, password }) => {
      // 檢查 email 是否已存在
      const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        throw new GraphQLError('Email already registered', {
          extensions: { code: 'BAD_USER_INPUT', field: 'email' }
        });
      }

      // 加密密碼
      const hashedPassword = await hashPassword(password);

      // 創建用戶
      const result = await query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
        [name, email, hashedPassword]
      );

      const user = result.rows[0];
      const token = generateToken(user.id);

      return { token, user };
    },

    // 用戶登入
    login: async (parent, { email, password }) => {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const user = result.rows[0];
      const isValid = await comparePassword(password, user.password);

      if (!isValid) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const token = generateToken(user.id);
      return { token, user };
    },

    // 添加到購物車
    addToCart: async (parent, { productId, quantity }, context) => {
      requireAuth(context.userId);

      // 檢查商品是否存在且有庫存
      const productResult = await query('SELECT * FROM products WHERE id = $1', [productId]);
      if (productResult.rows.length === 0) {
        throw new GraphQLError('Product not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      const product = productResult.rows[0];
      if (product.stock < quantity) {
        throw new GraphQLError('Insufficient stock', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // 檢查購物車中是否已有該商品
      const existingItem = await query(
        'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
        [context.userId, productId]
      );

      let cartItem;
      if (existingItem.rows.length > 0) {
        // 更新數量
        const newQuantity = existingItem.rows[0].quantity + quantity;
        const result = await query(
          'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
          [newQuantity, context.userId, productId]
        );
        cartItem = result.rows[0];
      } else {
        // 新增項目
        const result = await query(
          'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
          [context.userId, productId, quantity]
        );
        cartItem = result.rows[0];
      }

      return cartItem;
    },

    // 更新購物車項目
    updateCartItem: async (parent, { productId, quantity }, context) => {
      requireAuth(context.userId);

      if (quantity <= 0) {
        throw new GraphQLError('Quantity must be greater than 0', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const result = await query(
        'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
        [quantity, context.userId, productId]
      );

      if (result.rows.length === 0) {
        throw new GraphQLError('Cart item not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return result.rows[0];
    },

    // 從購物車移除
    removeFromCart: async (parent, { productId }, context) => {
      requireAuth(context.userId);

      await query(
        'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
        [context.userId, productId]
      );

      return true;
    },

    // 清空購物車
    clearCart: async (parent, args, context) => {
      requireAuth(context.userId);

      await query('DELETE FROM cart_items WHERE user_id = $1', [context.userId]);
      return true;
    },

    // 創建訂單
    createOrder: async (parent, args, context) => {
      requireAuth(context.userId);

      // 獲取購物車項目
      const cartItems = await query(
        `SELECT ci.*, p.price, p.stock, p.name
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = $1`,
        [context.userId]
      );

      if (cartItems.rows.length === 0) {
        throw new GraphQLError('Cart is empty', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // 計算總金額並檢查庫存
      let totalAmount = 0;
      for (const item of cartItems.rows) {
        if (item.stock < item.quantity) {
          throw new GraphQLError(`Insufficient stock for ${item.name}`, {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        totalAmount += item.price * item.quantity;
      }

      // 創建訂單
      const orderResult = await query(
        'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
        [context.userId, totalAmount, 'pending']
      );

      const order = orderResult.rows[0];

      // 創建訂單項目並更新庫存
      for (const item of cartItems.rows) {
        await query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [order.id, item.product_id, item.quantity, item.price]
        );

        // 減少庫存
        await query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );

        // 發布庫存更新事件
        const updatedProduct = await query('SELECT * FROM products WHERE id = $1', [item.product_id]);
        pubsub.publish('PRODUCT_STOCK_UPDATED', { productStockUpdated: updatedProduct.rows[0] });
      }

      // 清空購物車
      await query('DELETE FROM cart_items WHERE user_id = $1', [context.userId]);

      // 發布新訂單事件
      pubsub.publish('NEW_ORDER', { newOrder: order });

      return order;
    },

    // 更新訂單狀態
    updateOrderStatus: async (parent, { orderId, status }, context) => {
      requireAuth(context.userId);

      const result = await query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, orderId]
      );

      if (result.rows.length === 0) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return result.rows[0];
    },

    // 創建商品
    createProduct: async (parent, { input }, context) => {
      requireAuth(context.userId);

      const { name, description, price, stock, categoryId, imageUrl } = input;

      const result = await query(
        `INSERT INTO products (name, description, price, stock, category_id, image_url)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [name, description, price, stock, categoryId, imageUrl]
      );

      return result.rows[0];
    },

    // 更新商品
    updateProduct: async (parent, { id, input }, context) => {
      requireAuth(context.userId);

      const updates = [];
      const values = [];
      let paramCount = 1;

      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = key === 'categoryId' ? 'category_id' : key === 'imageUrl' ? 'image_url' : key;
          updates.push(`${dbKey} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (updates.length === 0) {
        throw new GraphQLError('No fields to update', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      values.push(id);
      const queryText = `UPDATE products SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

      const result = await query(queryText, values);

      if (result.rows.length === 0) {
        throw new GraphQLError('Product not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return result.rows[0];
    },

    // 刪除商品
    deleteProduct: async (parent, { id }, context) => {
      requireAuth(context.userId);

      const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        throw new GraphQLError('Product not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return true;
    },

    // 創建分類
    createCategory: async (parent, { name, description }, context) => {
      requireAuth(context.userId);

      const result = await query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
        [name, description]
      );

      return result.rows[0];
    },

    // 添加評論
    addReview: async (parent, { productId, rating, comment }, context) => {
      requireAuth(context.userId);

      if (rating < 1 || rating > 5) {
        throw new GraphQLError('Rating must be between 1 and 5', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const result = await query(
        'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
        [productId, context.userId, rating, comment]
      );

      return result.rows[0];
    }
  },

  Subscription: {
    // 商品庫存更新訂閱
    productStockUpdated: {
      subscribe: (parent, { productId }) => {
        if (productId) {
          // 訂閱特定商品
          return pubsub.subscribe('PRODUCT_STOCK_UPDATED', (payload) => {
            return payload.productStockUpdated.id === productId;
          });
        }
        // 訂閱所有商品
        return pubsub.subscribe('PRODUCT_STOCK_UPDATED');
      }
    },

    // 新訂單訂閱
    newOrder: {
      subscribe: () => pubsub.subscribe('NEW_ORDER')
    }
  },

  // 欄位 Resolvers
  Product: {
    category: async (parent) => {
      if (!parent.category_id) return null;
      const result = await query('SELECT * FROM categories WHERE id = $1', [parent.category_id]);
      return result.rows[0] || null;
    },

    reviews: async (parent) => {
      const result = await query('SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC', [parent.id]);
      return result.rows;
    },

    averageRating: async (parent) => {
      const result = await query(
        'SELECT AVG(rating)::float as avg_rating FROM reviews WHERE product_id = $1',
        [parent.id]
      );
      return result.rows[0]?.avg_rating || null;
    }
  },

  Category: {
    products: async (parent) => {
      const result = await query('SELECT * FROM products WHERE category_id = $1', [parent.id]);
      return result.rows;
    }
  },

  CartItem: {
    product: async (parent) => {
      const result = await query('SELECT * FROM products WHERE id = $1', [parent.product_id]);
      return result.rows[0];
    },

    subtotal: async (parent) => {
      const product = await query('SELECT price FROM products WHERE id = $1', [parent.product_id]);
      return product.rows[0].price * parent.quantity;
    }
  },

  Order: {
    user: async (parent) => {
      const result = await query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return result.rows[0];
    },

    items: async (parent) => {
      const result = await query('SELECT * FROM order_items WHERE order_id = $1', [parent.id]);
      return result.rows;
    }
  },

  OrderItem: {
    product: async (parent) => {
      const result = await query('SELECT * FROM products WHERE id = $1', [parent.product_id]);
      return result.rows[0];
    },

    subtotal: (parent) => {
      return parent.price * parent.quantity;
    }
  },

  Review: {
    product: async (parent) => {
      const result = await query('SELECT * FROM products WHERE id = $1', [parent.product_id]);
      return result.rows[0];
    },

    user: async (parent) => {
      const result = await query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return result.rows[0];
    }
  }
};

module.exports = resolvers;
