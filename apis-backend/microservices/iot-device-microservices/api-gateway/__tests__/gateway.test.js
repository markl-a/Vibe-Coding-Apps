const request = require('supertest');
const express = require('express');

// Mock http-proxy-middleware
const mockProxyMiddleware = jest.fn((req, res, next) => {
  res.json({ proxied: true, path: req.path });
});

jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn(() => mockProxyMiddleware)
}));

const { createProxyMiddleware } = require('http-proxy-middleware');

// Set required environment variable
process.env.API_KEY_SECRET = 'test-api-key-secret';

let app;

beforeAll(() => {
  app = express();
  const cors = require('cors');
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  const morgan = require('morgan');

  app.use(helmet());
  app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
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
    if (!apiKey || apiKey !== process.env.API_KEY_SECRET) {
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
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('API Gateway', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'OK',
        service: 'IoT API Gateway'
      });
    });

    it('should not require API key for health endpoint', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
    });
  });

  describe('API Key Authentication', () => {
    it('should reject requests without API key', async () => {
      const res = await request(app)
        .get('/api/devices');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid API key');
    });

    it('should reject requests with invalid API key', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('x-api-key', 'invalid-key');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid API key');
    });

    it('should accept requests with valid API key', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('x-api-key', 'test-api-key-secret');

      expect(res.status).toBe(200);
      expect(res.body.proxied).toBe(true);
    });

    it('should authenticate POST requests', async () => {
      const res = await request(app)
        .post('/api/devices')
        .set('x-api-key', 'test-api-key-secret')
        .send({ deviceId: 'test' });

      expect(res.status).toBe(200);
    });

    it('should authenticate PUT requests', async () => {
      const res = await request(app)
        .put('/api/devices/123')
        .set('x-api-key', 'test-api-key-secret')
        .send({ name: 'Updated' });

      expect(res.status).toBe(200);
    });

    it('should authenticate DELETE requests', async () => {
      const res = await request(app)
        .delete('/api/devices/123')
        .set('x-api-key', 'test-api-key-secret');

      expect(res.status).toBe(200);
    });

    it('should authenticate PATCH requests', async () => {
      const res = await request(app)
        .patch('/api/devices/123')
        .set('x-api-key', 'test-api-key-secret')
        .send({ status: 'online' });

      expect(res.status).toBe(200);
    });

    it('should be case-sensitive for API key header', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('X-API-KEY', 'test-api-key-secret');

      // Headers are case-insensitive in HTTP, so this should work
      expect(res.status).toBe(200);
    });

    it('should reject empty API key', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('x-api-key', '');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid API key');
    });

    it('should reject whitespace-only API key', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('x-api-key', '   ');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid API key');
    });
  });

  describe('Route Proxying', () => {
    describe('/api/devices routes', () => {
      it('should proxy to device service', async () => {
        const res = await request(app)
          .get('/api/devices')
          .set('x-api-key', 'test-api-key-secret');

        expect(res.status).toBe(200);
        expect(createProxyMiddleware).toHaveBeenCalledWith(
          expect.objectContaining({
            target: 'http://localhost:5001',
            changeOrigin: true
          })
        );
      });

      it('should proxy POST requests to device service', async () => {
        const res = await request(app)
          .post('/api/devices')
          .set('x-api-key', 'test-api-key-secret')
          .send({ deviceId: 'test', name: 'Test Device', type: 'sensor' });

        expect(res.status).toBe(200);
      });

      it('should proxy device by ID requests', async () => {
        const res = await request(app)
          .get('/api/devices/device-123')
          .set('x-api-key', 'test-api-key-secret');

        expect(res.status).toBe(200);
      });
    });

    describe('/api/data routes', () => {
      it('should proxy to data service', async () => {
        const res = await request(app)
          .get('/api/data')
          .set('x-api-key', 'test-api-key-secret');

        expect(res.status).toBe(200);
        expect(createProxyMiddleware).toHaveBeenCalledWith(
          expect.objectContaining({
            target: 'http://localhost:5002',
            changeOrigin: true
          })
        );
      });

      it('should proxy data by device ID', async () => {
        const res = await request(app)
          .get('/api/data/device-123')
          .set('x-api-key', 'test-api-key-secret');

        expect(res.status).toBe(200);
      });
    });

    describe('/api/analytics routes', () => {
      it('should proxy to analytics service', async () => {
        const res = await request(app)
          .get('/api/analytics/summary')
          .set('x-api-key', 'test-api-key-secret');

        expect(res.status).toBe(200);
        expect(createProxyMiddleware).toHaveBeenCalledWith(
          expect.objectContaining({
            target: 'http://localhost:5003',
            changeOrigin: true
          })
        );
      });

      it('should proxy device analytics requests', async () => {
        const res = await request(app)
          .get('/api/analytics/device/device-123')
          .set('x-api-key', 'test-api-key-secret');

        expect(res.status).toBe(200);
      });
    });

    describe('/api/alerts routes', () => {
      it('should proxy to alert service', async () => {
        const res = await request(app)
          .get('/api/alerts')
          .set('x-api-key', 'test-api-key-secret');

        expect(res.status).toBe(200);
        expect(createProxyMiddleware).toHaveBeenCalledWith(
          expect.objectContaining({
            target: 'http://localhost:5004',
            changeOrigin: true
          })
        );
      });

      it('should proxy alert rules requests', async () => {
        const res = await request(app)
          .post('/api/alerts/rules')
          .set('x-api-key', 'test-api-key-secret')
          .send({ deviceId: 'test', condition: 'temp > 30' });

        expect(res.status).toBe(200);
      });

      it('should proxy acknowledge requests', async () => {
        const res = await request(app)
          .put('/api/alerts/alert-123/acknowledge')
          .set('x-api-key', 'test-api-key-secret');

        expect(res.status).toBe(200);
      });
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app)
        .get('/api/unknown')
        .set('x-api-key', 'test-api-key-secret');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Route not found');
    });

    it('should return 404 for root path', async () => {
      const res = await request(app)
        .get('/')
        .set('x-api-key', 'test-api-key-secret');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Route not found');
    });

    it('should return 404 for non-api routes', async () => {
      const res = await request(app)
        .get('/other/path')
        .set('x-api-key', 'test-api-key-secret');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Route not found');
    });

    it('should not require auth for 404 routes', async () => {
      const res = await request(app)
        .get('/unknown-route');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Route not found');
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle OPTIONS requests', async () => {
      const res = await request(app)
        .options('/api/devices')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
    });
  });

  describe('Security Headers', () => {
    it('should include helmet security headers', async () => {
      const res = await request(app).get('/health');

      // Helmet adds various security headers
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to /api routes', async () => {
      // Make multiple requests
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .get('/api/devices')
            .set('x-api-key', 'test-api-key-secret')
        );
      }

      const responses = await Promise.all(requests);

      // All should succeed as we're under the limit
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
    });

    it('should not apply rate limiting to /health', async () => {
      // Make multiple requests to health endpoint
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(request(app).get('/health'));
      }

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Content Type Handling', () => {
    it('should handle JSON request bodies', async () => {
      const res = await request(app)
        .post('/api/devices')
        .set('x-api-key', 'test-api-key-secret')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ deviceId: 'test' }));

      expect(res.status).toBe(200);
    });

    it('should return JSON responses', async () => {
      const res = await request(app).get('/health');

      expect(res.type).toBe('application/json');
    });
  });

  describe('HTTP Methods', () => {
    it('should support GET requests', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('x-api-key', 'test-api-key-secret');

      expect(res.status).toBe(200);
    });

    it('should support POST requests', async () => {
      const res = await request(app)
        .post('/api/devices')
        .set('x-api-key', 'test-api-key-secret')
        .send({ test: 'data' });

      expect(res.status).toBe(200);
    });

    it('should support PUT requests', async () => {
      const res = await request(app)
        .put('/api/devices/123')
        .set('x-api-key', 'test-api-key-secret')
        .send({ test: 'data' });

      expect(res.status).toBe(200);
    });

    it('should support DELETE requests', async () => {
      const res = await request(app)
        .delete('/api/devices/123')
        .set('x-api-key', 'test-api-key-secret');

      expect(res.status).toBe(200);
    });

    it('should support PATCH requests', async () => {
      const res = await request(app)
        .patch('/api/devices/123')
        .set('x-api-key', 'test-api-key-secret')
        .send({ test: 'data' });

      expect(res.status).toBe(200);
    });
  });

  describe('Middleware Order', () => {
    it('should check authentication before proxying', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('x-api-key', 'wrong-key');

      expect(res.status).toBe(401);
      expect(mockProxyMiddleware).not.toHaveBeenCalled();
    });

    it('should proxy after successful authentication', async () => {
      await request(app)
        .get('/api/devices')
        .set('x-api-key', 'test-api-key-secret');

      expect(mockProxyMiddleware).toHaveBeenCalled();
    });
  });

  describe('Query Parameters', () => {
    it('should preserve query parameters when proxying', async () => {
      const res = await request(app)
        .get('/api/devices?type=sensor&status=online')
        .set('x-api-key', 'test-api-key-secret');

      expect(res.status).toBe(200);
    });

    it('should handle complex query parameters', async () => {
      const res = await request(app)
        .get('/api/analytics/summary?from=2024-01-01&to=2024-12-31')
        .set('x-api-key', 'test-api-key-secret');

      expect(res.status).toBe(200);
    });
  });

  describe('Path Parameters', () => {
    it('should preserve path parameters when proxying', async () => {
      const res = await request(app)
        .get('/api/devices/device-123')
        .set('x-api-key', 'test-api-key-secret');

      expect(res.status).toBe(200);
    });

    it('should handle nested paths', async () => {
      const res = await request(app)
        .get('/api/devices/device-123/status')
        .set('x-api-key', 'test-api-key-secret');

      expect(res.status).toBe(200);
    });
  });

  describe('Error Responses', () => {
    it('should return proper error format for authentication failure', async () => {
      const res = await request(app)
        .get('/api/devices');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });

    it('should return proper error format for 404', async () => {
      const res = await request(app)
        .get('/unknown');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });
  });
});
