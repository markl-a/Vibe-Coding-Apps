const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');

describe('Rate Limit Middleware Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rate Limiting', () => {
    test('應該允許在限制內的請求', async () => {
      const limiter = rateLimit({
        windowMs: 60000, // 1 分鐘
        max: 5,
        message: 'Too many requests'
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      // 發送 5 個請求，都應該成功
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/api/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    test('應該在超過限制時返回 429', async () => {
      const limiter = rateLimit({
        windowMs: 60000,
        max: 3,
        message: 'Too many requests',
        standardHeaders: true
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      // 發送 3 個請求
      for (let i = 0; i < 3; i++) {
        await request(app).get('/api/test');
      }

      // 第 4 個請求應該被限制
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
    });

    test('應該在超過限制時返回自定義錯誤訊息', async () => {
      const customMessage = 'Rate limit exceeded. Please try again later.';
      const limiter = rateLimit({
        windowMs: 60000,
        max: 2,
        message: customMessage
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      // 發送 2 個請求
      await request(app).get('/api/test');
      await request(app).get('/api/test');

      // 第 3 個請求應該返回自定義訊息
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
      expect(response.text).toContain(customMessage);
    });
  });

  describe('Rate Limit Headers', () => {
    test('應該包含 RateLimit-* headers', async () => {
      const limiter = rateLimit({
        windowMs: 60000,
        max: 5,
        standardHeaders: true
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/api/test');

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    test('應該正確減少 RateLimit-Remaining', async () => {
      const limiter = rateLimit({
        windowMs: 60000,
        max: 5,
        standardHeaders: true
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      const response1 = await request(app).get('/api/test');
      expect(response1.headers['ratelimit-remaining']).toBe('4');

      const response2 = await request(app).get('/api/test');
      expect(response2.headers['ratelimit-remaining']).toBe('3');

      const response3 = await request(app).get('/api/test');
      expect(response3.headers['ratelimit-remaining']).toBe('2');
    });

    test('應該在達到限制時設置 Retry-After header', async () => {
      const limiter = rateLimit({
        windowMs: 60000,
        max: 2,
        standardHeaders: true
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app).get('/api/test');
      await request(app).get('/api/test');

      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
      expect(response.headers['retry-after']).toBeDefined();
    });
  });

  describe('Different Time Windows', () => {
    test('應該在 15 分鐘窗口內正確限制', async () => {
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 分鐘
        max: 100
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/api/test');
      expect(response.status).toBe(200);
      expect(response.headers['ratelimit-limit']).toBe('100');
    });

    test('應該在 1 小時窗口內正確限制', async () => {
      const limiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 小時
        max: 1000
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/api/test');
      expect(response.status).toBe(200);
      expect(response.headers['ratelimit-limit']).toBe('1000');
    });
  });

  describe('Custom Handler', () => {
    test('應該使用自定義處理器', async () => {
      const customHandler = (req, res) => {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP'
          }
        });
      };

      const limiter = rateLimit({
        windowMs: 60000,
        max: 2,
        handler: customHandler
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app).get('/api/test');
      await request(app).get('/api/test');

      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP'
        }
      });
    });
  });

  describe('Skip Conditions', () => {
    test('應該跳過符合條件的請求', async () => {
      const limiter = rateLimit({
        windowMs: 60000,
        max: 2,
        skip: (req) => req.headers['x-skip-rate-limit'] === 'true'
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      // 發送 3 個跳過限制的請求
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .get('/api/test')
          .set('x-skip-rate-limit', 'true');
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Key Generator', () => {
    test('應該使用自定義 key generator', async () => {
      const limiter = rateLimit({
        windowMs: 60000,
        max: 2,
        keyGenerator: (req) => {
          return req.headers['x-user-id'] || req.ip;
        }
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      // 同一用戶的請求
      await request(app).get('/api/test').set('x-user-id', 'user1');
      await request(app).get('/api/test').set('x-user-id', 'user1');

      const response = await request(app)
        .get('/api/test')
        .set('x-user-id', 'user1');
      expect(response.status).toBe(429);

      // 不同用戶應該有獨立的限制
      const response2 = await request(app)
        .get('/api/test')
        .set('x-user-id', 'user2');
      expect(response2.status).toBe(200);
    });
  });

  describe('Multiple Rate Limiters', () => {
    test('應該支持多個不同的限制器', async () => {
      const strictLimiter = rateLimit({
        windowMs: 60000,
        max: 2
      });

      const relaxedLimiter = rateLimit({
        windowMs: 60000,
        max: 10
      });

      app.use('/api/strict', strictLimiter);
      app.use('/api/relaxed', relaxedLimiter);

      app.get('/api/strict/test', (req, res) => {
        res.json({ success: true });
      });

      app.get('/api/relaxed/test', (req, res) => {
        res.json({ success: true });
      });

      // Strict endpoint 應該在 2 個請求後被限制
      await request(app).get('/api/strict/test');
      await request(app).get('/api/strict/test');
      const strictResponse = await request(app).get('/api/strict/test');
      expect(strictResponse.status).toBe(429);

      // Relaxed endpoint 應該仍然可以訪問
      const relaxedResponse = await request(app).get('/api/relaxed/test');
      expect(relaxedResponse.status).toBe(200);
    });
  });

  describe('Environment Configuration', () => {
    test('應該使用環境變量配置限制', async () => {
      process.env.RATE_LIMIT_WINDOW_MS = '60000';
      process.env.RATE_LIMIT_MAX_REQUESTS = '3';

      const limiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
      });

      app.use('/api', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      // 發送 3 個請求
      for (let i = 0; i < 3; i++) {
        const response = await request(app).get('/api/test');
        expect(response.status).toBe(200);
      }

      // 第 4 個請求應該被限制
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
    });
  });
});
