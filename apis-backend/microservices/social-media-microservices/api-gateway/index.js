const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'social-media-secret-key';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Social Media API Gateway',
    timestamp: new Date().toISOString()
  });
});

// Service URLs
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:4001';
const POST_SERVICE = process.env.POST_SERVICE_URL || 'http://localhost:4002';
const COMMENT_SERVICE = process.env.COMMENT_SERVICE_URL || 'http://localhost:4003';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004';

// Public routes (no auth required)
app.use('/api/auth', createProxyMiddleware({
  target: USER_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api/auth' }
}));

// Protected routes (auth required)
const createAuthProxy = (target, pathRewrite) => {
  return [
    authenticateToken,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite,
      onProxyReq: (proxyReq, req) => {
        // Forward user info to microservices
        if (req.user) {
          proxyReq.setHeader('X-User-Id', req.user.userId);
          proxyReq.setHeader('X-User-Email', req.user.email);
        }
      }
    })
  ];
};

// User routes
app.use('/api/users', ...createAuthProxy(
  USER_SERVICE,
  { '^/api/users': '/api/users' }
));

// Post routes
app.use('/api/posts', ...createAuthProxy(
  POST_SERVICE,
  { '^/api/posts': '/api/posts' }
));

// Comment routes
app.use('/api/comments', ...createAuthProxy(
  COMMENT_SERVICE,
  { '^/api/comments': '/api/comments' }
));

app.use('/api/posts/:postId/comments', ...createAuthProxy(
  COMMENT_SERVICE,
  { '^/api/posts': '/api/posts' }
));

// Notification routes
app.use('/api/notifications', ...createAuthProxy(
  NOTIFICATION_SERVICE,
  { '^/api/notifications': '/api/notifications' }
));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Social Media API Gateway running on port ${PORT}`);
  console.log(`\n📡 Routing Configuration:`);
  console.log(`  Public:`);
  console.log(`    POST /api/auth/*      -> ${USER_SERVICE}`);
  console.log(`  Protected (requires JWT):`);
  console.log(`    /api/users/*          -> ${USER_SERVICE}`);
  console.log(`    /api/posts/*          -> ${POST_SERVICE}`);
  console.log(`    /api/comments/*       -> ${COMMENT_SERVICE}`);
  console.log(`    /api/notifications/*  -> ${NOTIFICATION_SERVICE}`);
  console.log(`\n🔒 Security: Rate limiting, CORS, Helmet enabled`);
});
