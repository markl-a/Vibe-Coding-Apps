const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 6000;
const JWT_SECRET = process.env.JWT_SECRET || 'cms-secret';

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'CMS API Gateway' });
});

const CONTENT_SERVICE = process.env.CONTENT_SERVICE_URL || 'http://localhost:6001';
const MEDIA_SERVICE = process.env.MEDIA_SERVICE_URL || 'http://localhost:6002';
const SEARCH_SERVICE = process.env.SEARCH_SERVICE_URL || 'http://localhost:6003';
const CACHE_SERVICE = process.env.CACHE_SERVICE_URL || 'http://localhost:6004';

app.use('/api/auth', createProxyMiddleware({
  target: CONTENT_SERVICE,
  changeOrigin: true
}));

app.use('/api/content', authMiddleware, createProxyMiddleware({
  target: CONTENT_SERVICE,
  changeOrigin: true
}));

app.use('/api/media', authMiddleware, createProxyMiddleware({
  target: MEDIA_SERVICE,
  changeOrigin: true
}));

app.use('/api/search', createProxyMiddleware({
  target: SEARCH_SERVICE,
  changeOrigin: true
}));

app.use('/api/cache', authMiddleware, createProxyMiddleware({
  target: CACHE_SERVICE,
  changeOrigin: true
}));

app.listen(PORT, () => {
  console.log(`🚀 CMS API Gateway running on port ${PORT}`);
});
