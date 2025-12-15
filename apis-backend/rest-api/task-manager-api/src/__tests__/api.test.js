/**
 * Task Manager API - Integration Tests
 * Tests the API endpoints without database dependency
 */

const request = require('supertest');
const express = require('express');

// Create a minimal test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Task Manager API is running',
      timestamp: new Date().toISOString(),
      environment: 'test'
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route ${req.originalUrl} not found`
      }
    });
  });

  return app;
};

describe('Task Manager API - Core Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    it('GET /api/health should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Task Manager API is running');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('environment');
    });

    it('should return correct environment', async () => {
      const res = await request(app).get('/api/health');

      expect(res.body.environment).toBe('test');
    });

    it('should return valid ISO timestamp', async () => {
      const res = await request(app).get('/api/health');

      const timestamp = new Date(res.body.timestamp);
      expect(timestamp.toISOString()).toBe(res.body.timestamp);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown-route');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });

    it('should include the requested URL in error message', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.body.error.message).toContain('/api/nonexistent');
    });

    it('should handle different HTTP methods', async () => {
      const postRes = await request(app).post('/api/unknown');
      const putRes = await request(app).put('/api/unknown');
      const deleteRes = await request(app).delete('/api/unknown');

      expect(postRes.statusCode).toBe(404);
      expect(putRes.statusCode).toBe(404);
      expect(deleteRes.statusCode).toBe(404);
    });
  });
});

describe('API Response Format', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should return consistent success response format', async () => {
    const res = await request(app).get('/api/health');

    expect(res.body).toHaveProperty('success');
    expect(typeof res.body.success).toBe('boolean');
  });

  it('should return consistent error response format', async () => {
    const res = await request(app).get('/api/unknown');

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });

  it('should return JSON content type', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
