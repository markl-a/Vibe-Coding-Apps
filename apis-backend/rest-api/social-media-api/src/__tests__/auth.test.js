const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const { createTestUser, generateTestToken } = require('./helpers');

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toMatchObject({
        username: 'newuser',
        email: 'newuser@example.com',
        displayName: 'New User'
      });
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject registration with duplicate email', async () => {
      const existingUser = await createTestUser({
        email: 'existing@example.com'
      });

      const userData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Email already registered');
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should reject registration with duplicate username', async () => {
      const existingUser = await createTestUser({
        username: 'existinguser'
      });

      const userData = {
        username: 'existinguser',
        email: 'newemail@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Username already taken');
      expect(res.body.error.code).toBe('USERNAME_EXISTS');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        username: 'newuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject registration with short password', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: '12345'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(res.body.message).toBe('Login successful');
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toMatchObject({
        email: 'login@example.com'
      });
    });

    it('should reject login with incorrect email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid credentials');
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with incorrect password', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid credentials');
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.user).toMatchObject({
        username: user.username,
        email: user.email
      });
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('No token provided');
      expect(res.body.error.code).toBe('NO_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid token');
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});
