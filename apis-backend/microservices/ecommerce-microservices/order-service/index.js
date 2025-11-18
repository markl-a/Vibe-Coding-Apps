const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const CircuitBreaker = require('opossum');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const promClient = require('prom-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_orders';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const orderCounter = new promClient.Counter({
  name: 'orders_total',
  help: 'Total number of orders',
  labelNames: ['status'],
  registers: [register]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Request duration middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.route?.path || req.path, res.statusCode).observe(duration);
  });
  next();
});

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (E-commerce Orders)'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Order Schema
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  items: [{
    productId: { type: String, required: true },
    productName: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  totals: {
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  shippingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  payment: {
    method: { type: String, enum: ['credit_card', 'paypal', 'stripe', 'bank_transfer'] },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    transactionId: String,
    paidAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  tracking: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String,
    estimatedDelivery: Date
  },
  notes: String,
  metadata: { type: Map, of: String },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

// Circuit breakers for external service calls
const userServiceBreaker = new CircuitBreaker(async (userId) => {
  const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`, {
    timeout: 5000
  });
  return response.data;
}, {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

const productServiceBreaker = new CircuitBreaker(async (productId) => {
  const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`, {
    timeout: 5000
  });
  return response.data;
}, {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce Order Service API',
      version: '1.0.0',
      description: 'Order Management Service with Inter-Service Communication',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'E-commerce Order Service',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    externalServices: {
      userService: userServiceBreaker.stats,
      productService: productServiceBreaker.stats
    }
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 */
app.post('/api/orders', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('shippingAddress').notEmpty().withMessage('Shipping address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, items, shippingAddress, billingAddress, payment } = req.body;

    // Verify user exists (with circuit breaker)
    try {
      await userServiceBreaker.fire(userId);
    } catch (error) {
      console.error('User service error:', error.message);
      return res.status(400).json({ error: 'Invalid user ID or user service unavailable' });
    }

    // Verify products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      try {
        const { product } = await productServiceBreaker.fire(item.productId);

        if (!product) {
          return res.status(400).json({ error: `Product ${item.productId} not found` });
        }

        if (product.inventory.quantity < item.quantity) {
          return res.status(400).json({
            error: `Insufficient inventory for product ${product.name}`
          });
        }

        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
          subtotal: itemSubtotal
        });
      } catch (error) {
        console.error('Product service error:', error.message);
        return res.status(400).json({
          error: `Product ${item.productId} not available or product service error`
        });
      }
    }

    // Calculate totals
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shipping;

    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      totals: { subtotal, tax, shipping, discount: 0, total },
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      payment: payment || {},
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order created'
      }]
    });

    await order.save();
    orderCounter.labels('pending').inc();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders list
 *     tags: [Orders]
 */
app.get('/api/orders', async (req, res) => {
  try {
    const { userId, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 */
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 */
app.put('/api/orders/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`
    });
    order.updatedAt = Date.now();

    await order.save();
    orderCounter.labels(status).inc();

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel order
 *     tags: [Orders]
 */
app.post('/api/orders/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel order that has been shipped or delivered' });
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: req.body.reason || 'Cancelled by user'
    });
    order.updatedAt = Date.now();

    await order.save();
    orderCounter.labels('cancelled').inc();

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/orders/stats/summary:
 *   get:
 *     summary: Get order statistics
 *     tags: [Analytics]
 */
app.get('/api/orders/stats/summary', async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totals.total' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totals.total' }
        }
      }
    ]);

    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      byStatus: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 E-commerce Order Service running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
});

module.exports = app;
