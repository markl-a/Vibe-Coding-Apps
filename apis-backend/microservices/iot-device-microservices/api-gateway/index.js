const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY_SECRET = process.env.API_KEY_SECRET || 'iot-secret';

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests'
});
app.use('/api/', limiter);

// API Key authentication
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY_SECRET) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'IoT API Gateway' });
});

const DEVICE_SERVICE = process.env.DEVICE_SERVICE_URL || 'http://localhost:5001';
const DATA_SERVICE = process.env.DATA_SERVICE_URL || 'http://localhost:5002';
const ANALYTICS_SERVICE = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5003';
const ALERT_SERVICE = process.env.ALERT_SERVICE_URL || 'http://localhost:5004';

app.use('/api/devices', authenticateApiKey, createProxyMiddleware({
  target: DEVICE_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/api/devices': '/api/devices' }
}));

app.use('/api/data', authenticateApiKey, createProxyMiddleware({
  target: DATA_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/api/data': '/api/data' }
}));

app.use('/api/analytics', authenticateApiKey, createProxyMiddleware({
  target: ANALYTICS_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/api/analytics': '/api/analytics' }
}));

app.use('/api/alerts', authenticateApiKey, createProxyMiddleware({
  target: ALERT_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/api/alerts': '/api/alerts' }
}));

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 IoT API Gateway running on port ${PORT}`);
  console.log(`\n📡 Routes: /api/devices, /api/data, /api/analytics, /api/alerts`);
});
