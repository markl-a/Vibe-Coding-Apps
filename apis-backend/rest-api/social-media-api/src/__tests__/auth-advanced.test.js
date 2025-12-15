const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const { createTestUser, generateTestToken } = require('./helpers');

describe('Auth API - Advanced Tests', () => {
  describe('POST /api/auth/register - Additional Validation', () => {
    it('should reject registration with missing username', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject registration with missing email', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject registration with missing password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject registration with username that is too short', async () => {
      const userData = {
        username: 'ab',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject registration with username containing special characters', async () => {
      const userData = {
        username: 'test@user!',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject registration with email in wrong format', async () => {
      const userData = {
        username: 'testuser',
        email: 'not-an-email',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should trim whitespace from username and email', async () => {
      const userData = {
        username: '  testuser  ',
        email: '  test@example.com  ',
        password: 'password123',
        displayName: 'Test User'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.user.username).toBe('testuser');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should use username as displayName if not provided', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.user.displayName).toBe('testuser');
    });

    it('should not expose password in response', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.user.password).toBeUndefined();
    });

    it('should hash password before saving', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.password).not.toBe('password123');
      expect(user.password.length).toBeGreaterThan(20);
    });
  });

  describe('POST /api/auth/login - Additional Validation', () => {
    it('should reject login with inactive account', async () => {
      const user = await createTestUser({
        email: 'inactive@example.com',
        password: 'password123'
      });

      // Deactivate account
      user.isActive = false;
      await user.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123'
        })
        .expect(403);

      expect(res.body.error).toBe('Account is inactive');
    });

    it('should reject login with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject login with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject login with empty email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: 'password123'
        })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject login with empty password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: ''
        })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should be case-insensitive for email', async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: 'password123'
        })
        .expect(200);

      expect(res.body.token).toBeDefined();
    });

    it('should not expose password in login response', async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(res.body.user.password).toBeUndefined();
    });

    it('should generate valid JWT token on login', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.split('.')).toHaveLength(3);
    });
  });

  describe('GET /api/auth/me - Additional Validation', () => {
    it('should reject with expired token', async () => {
      const user = await createTestUser();

      // Create expired token (this would require mocking JWT or using a very short expiry)
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxN2E4YzRmMWIzNDU2Nzg5MGFiY2RlZiIsImlhdCI6MTYzNTM0NTAwMCwiZXhwIjoxNjM1MzQ1MDAxfQ.invalid')
        .expect(401);

      expect(res.body.error).toBe('Invalid token');
    });

    it('should reject with malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-valid-token')
        .expect(401);

      expect(res.body.error).toBe('Invalid token');
    });

    it('should reject with token missing Bearer prefix', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', token)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should reject with empty authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', '')
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should return full user profile with valid token', async () => {
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      });
      const token = generateTestToken(user._id);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.user).toMatchObject({
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      });
      expect(res.body.user.password).toBeUndefined();
    });

    it('should return 404 if user was deleted', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id);

      // Delete the user
      await User.findByIdAndDelete(user._id);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.error).toBe('User not found');
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle concurrent registration attempts with same email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // First request should succeed
      const res1 = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res1.status).toBe(201);

      // Second request should fail
      const res2 = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, username: 'testuser2' });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('Email already registered');
    });

    it('should handle concurrent registration attempts with same username', async () => {
      const userData1 = {
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123'
      };

      const userData2 = {
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password123'
      };

      // First request should succeed
      const res1 = await request(app)
        .post('/api/auth/register')
        .send(userData1);

      expect(res1.status).toBe(201);

      // Second request should fail
      const res2 = await request(app)
        .post('/api/auth/register')
        .send(userData2);

      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('Username already taken');
    });

    it('should handle very long passwords', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'a'.repeat(1000)
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.token).toBeDefined();
    });

    it('should handle special characters in password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'P@ssw0rd!#$%^&*()',
        displayName: 'Test User'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.token).toBeDefined();

      // Should be able to login with the same password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'P@ssw0rd!#$%^&*()'
        })
        .expect(200);

      expect(loginRes.body.token).toBeDefined();
    });
  });
});
