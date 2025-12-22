const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { doubleCsrf } = require('csrf-csrf');
const { createLogger } = require('@vibe/shared-utils');
require('dotenv').config();

const uploadRoutes = require('./routes/upload.routes');

const logger = createLogger('file-upload-service');
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS Configuration: Parse allowed origins from environment variable
// Support comma-separated list or single value
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001']; // Secure default for development

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) in development
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later'
});

app.use('/api', limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Apply CSRF protection to all API routes (except token generation and health check)
app.use('/api', (req, res, next) => {
  // Skip CSRF for token endpoint and health check
  if (req.path === '/csrf-token' || req.path === '/health') {
    return next();
  }
  // Apply CSRF protection
  doubleCsrfProtection(req, res, next);
});

// Routes
app.use('/api', uploadRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'File Upload Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      upload: '/api/upload',
      uploadMultiple: '/api/upload/multiple',
      files: '/api/files',
      listFiles: '/api/files?prefix=folder',
      metadata: '/api/metadata/:fileKey'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Request error', err, {
    method: req.method,
    path: req.path,
    status: err.status
  });
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('File Upload Service running', {
      port: PORT,
      storageProvider: process.env.STORAGE_PROVIDER || 's3',
      storageBucket: process.env.STORAGE_BUCKET || 'uploads'
    });
  });
}

module.exports = app;
