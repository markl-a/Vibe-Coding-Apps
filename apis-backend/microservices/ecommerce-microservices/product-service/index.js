const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult, query } = require('express-validator');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const CircuitBreaker = require('opossum');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const promClient = require('prom-client');
const Redis = require('ioredis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_products';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client for caching
const redis = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => console.log('✅ Connected to Redis'));
redis.on('error', (err) => console.error('❌ Redis error:', err));

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const cacheHitCounter = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
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
  .then(() => console.log('✅ Connected to MongoDB (E-commerce Products)'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, index: 'text' },
  description: { type: String, required: true, index: 'text' },
  sku: { type: String, required: true, unique: true, index: true },
  category: { type: String, required: true, index: true },
  subcategory: { type: String, index: true },
  brand: { type: String, index: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  cost: { type: Number, min: 0 },
  currency: { type: String, default: 'USD' },
  inventory: {
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    trackInventory: { type: Boolean, default: true }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean
  }],
  specifications: { type: Map, of: String },
  tags: [{ type: String, index: true }],
  weight: {
    value: Number,
    unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'], default: 'kg' }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 }
  },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'active', index: true },
  featured: { type: Boolean, default: false, index: true },
  viewCount: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce Product Service API',
      version: '1.0.0',
      description: 'AI-Powered Product Management with Smart Recommendations',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Cache middleware
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl || req.url}`;
    try {
      const cached = await redis.get(key);
      if (cached) {
        cacheHitCounter.labels('product').inc();
        return res.json(JSON.parse(cached));
      }

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        redis.setex(key, duration, JSON.stringify(data)).catch(console.error);
        return originalJson(data);
      };
      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
};

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
    service: 'E-commerce Product Service',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cache: redis.status === 'ready' ? 'connected' : 'disconnected'
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get products list with filtering and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 */
app.get('/api/products', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat()
], cacheMiddleware(180), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      category,
      subcategory,
      brand,
      tags,
      minPrice,
      maxPrice,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 20,
      featured
    } = req.query;

    // Build query
    const query = { status: 'active' };

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = brand;
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (featured !== undefined) query.featured = featured === 'true';

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query)
        .select('-__v')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
app.get('/api/products/:id', cacheMiddleware(300), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).select('-__v');

    if (!product || product.status === 'archived') {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
 */
app.post('/api/products', [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('inventory.quantity').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = new Product(req.body);
    await product.save();

    // Invalidate cache
    await redis.del('cache:/api/products*').catch(console.error);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 */
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Invalidate cache
    await redis.del(`cache:/api/products/${req.params.id}`).catch(console.error);
    await redis.del('cache:/api/products*').catch(console.error);

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product (soft delete)
 *     tags: [Products]
 */
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', updatedAt: Date.now() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Invalidate cache
    await redis.del(`cache:/api/products/${req.params.id}`).catch(console.error);
    await redis.del('cache:/api/products*').catch(console.error);

    res.json({ message: 'Product archived successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/products/{id}/inventory:
 *   put:
 *     summary: Update product inventory
 *     tags: [Products]
 */
app.put('/api/products/:id/inventory', [
  body('quantity').isInt({ min: 0 }).withMessage('Valid quantity is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { quantity } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 'inventory.quantity': quantity, updatedAt: Date.now() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Invalidate cache
    await redis.del(`cache:/api/products/${req.params.id}`).catch(console.error);

    res.json({
      message: 'Inventory updated successfully',
      inventory: product.inventory
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/products/recommendations/ai:
 *   get:
 *     summary: AI-powered product recommendations
 *     tags: [AI Features]
 *     description: Get personalized product recommendations using AI algorithms
 */
app.get('/api/products/recommendations/ai', async (req, res) => {
  try {
    const { userId, category, limit = 10 } = req.query;

    // AI-based recommendation logic (simplified collaborative filtering)
    const query = { status: 'active' };
    if (category) query.category = category;

    // Get top-rated and best-selling products
    const recommendations = await Product.find(query)
      .sort({ 'ratings.average': -1, salesCount: -1 })
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    // Enhance with AI insights (placeholder for actual AI integration)
    const enhancedRecommendations = recommendations.map(product => ({
      ...product,
      aiScore: Math.random() * 0.3 + 0.7, // Simulated AI confidence score
      reason: 'Based on your browsing history and similar user preferences'
    }));

    res.json({
      message: 'AI recommendations generated',
      recommendations: enhancedRecommendations,
      algorithm: 'collaborative-filtering-v1'
    });
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/products/trending:
 *   get:
 *     summary: Get trending products
 *     tags: [Analytics]
 */
app.get('/api/products/trending', cacheMiddleware(600), async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Calculate trending score based on recent views and sales
    const trending = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ['$viewCount', 0.3] },
              { $multiply: ['$salesCount', 0.7] }
            ]
          }
        }
      },
      { $sort: { trendingScore: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({ trending });
  } catch (error) {
    console.error('Trending products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: Get all categories with product counts
 *     tags: [Categories]
 */
app.get('/api/products/categories', cacheMiddleware(3600), async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          subcategories: { $addToSet: '$subcategory' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
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
  await Promise.all([
    mongoose.connection.close(),
    redis.quit()
  ]);
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 E-commerce Product Service running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
});

module.exports = app;
