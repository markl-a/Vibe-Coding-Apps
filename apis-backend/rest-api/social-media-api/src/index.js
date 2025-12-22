const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { doubleCsrf } = require('csrf-csrf');
const { createLogger } = require('@vibe/shared-utils');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = createLogger('social-media-api');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social_media';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// CSRF Protection Configuration
const csrfSecret = process.env.CSRF_SECRET || 'your-csrf-secret-change-in-production';
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => csrfSecret,
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token']
});

// CSRF Token endpoint - must be before routes that need protection
app.get('/api/csrf-token', (req, res) => {
  const token = generateToken(req, res);
  res.json({
    success: true,
    token
  });
});

// Apply CSRF protection to all API routes (except token generation)
app.use('/api', (req, res, next) => {
  // Skip CSRF for token endpoint and health check
  if (req.path === '/csrf-token' || req.path === '/health') {
    return next();
  }
  // Apply CSRF protection
  doubleCsrfProtection(req, res, next);
});

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error', err));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Social Media API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handler - use centralized error handling middleware
app.use(errorHandler);

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info('Social Media API running', {
      port: PORT,
      endpoint: `http://localhost:${PORT}/api`
    });
  });
}

module.exports = app;
