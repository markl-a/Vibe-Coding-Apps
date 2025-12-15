const express = require('express');
const request = require('supertest');
const authRoutes = require('../../routes/authRoutes');
const authController = require('../../controllers/authController');
const { authenticate } = require('../../middlewares/auth');

jest.mock('../../controllers/authController');
jest.mock('../../middlewares/auth');

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should call authController.register', async () => {
      authController.register.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          data: { userId: 'user-1', token: 'token-123' },
        });
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(authController.register).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('should not require authentication', async () => {
      authController.register.mockImplementation((req, res) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(authenticate).not.toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('should pass registration data to controller', async () => {
      const registrationData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'securePassword123',
        display_name: 'New User',
      };

      authController.register.mockImplementation((req, res) => {
        expect(req.body).toEqual(registrationData);
        res.status(201).json({ success: true });
      });

      await request(app)
        .post('/api/auth/register')
        .send(registrationData);

      expect(authController.register).toHaveBeenCalled();
    });

    it('should handle registration with minimal data', async () => {
      authController.register.mockImplementation((req, res) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user',
          email: 'user@example.com',
          password: 'pass',
        });

      expect(response.status).toBe(201);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should call authController.login', async () => {
      authController.login.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: { userId: 'user-1', token: 'token-123' },
        });
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(authController.login).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should not require authentication', async () => {
      authController.login.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(authenticate).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should pass login credentials to controller', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'myPassword123',
      };

      authController.login.mockImplementation((req, res) => {
        expect(req.body).toEqual(credentials);
        res.json({ success: true });
      });

      await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(authController.login).toHaveBeenCalled();
    });

    it('should handle login with username instead of email', async () => {
      authController.login.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should call authController.getProfile', async () => {
      authenticate.mockImplementation((req, res, next) => {
        req.userId = 'user-123';
        next();
      });

      authController.getProfile.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: { id: 'user-123', username: 'testuser' },
        });
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(authController.getProfile).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(authController.getProfile).not.toHaveBeenCalled();
    });

    it('should pass userId from authentication', async () => {
      authenticate.mockImplementation((req, res, next) => {
        req.userId = 'user-456';
        next();
      });

      authController.getProfile.mockImplementation((req, res) => {
        expect(req.userId).toBe('user-456');
        res.json({ success: true });
      });

      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token');

      expect(authController.getProfile).toHaveBeenCalled();
    });

    it('should reject requests without authorization header', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('HTTP methods', () => {
    it('should only accept POST for /register', async () => {
      const getResponse = await request(app)
        .get('/api/auth/register');

      const putResponse = await request(app)
        .put('/api/auth/register')
        .send({ username: 'test' });

      expect(getResponse.status).toBe(404);
      expect(putResponse.status).toBe(404);
    });

    it('should only accept POST for /login', async () => {
      const getResponse = await request(app)
        .get('/api/auth/login');

      const deleteResponse = await request(app)
        .delete('/api/auth/login');

      expect(getResponse.status).toBe(404);
      expect(deleteResponse.status).toBe(404);
    });

    it('should only accept GET for /profile', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false });
      });

      const postResponse = await request(app)
        .post('/api/auth/profile')
        .send({ data: 'test' });

      const deleteResponse = await request(app)
        .delete('/api/auth/profile');

      expect(postResponse.status).toBe(404);
      expect(deleteResponse.status).toBe(404);
    });
  });

  describe('Invalid routes', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/auth/invalid-endpoint');

      expect(response.status).toBe(404);
    });

    it('should return 404 for misspelled routes', async () => {
      const response = await request(app)
        .post('/api/auth/registr')
        .send({ username: 'test' });

      expect(response.status).toBe(404);
    });
  });

  describe('Request body handling', () => {
    it('should handle empty request body for register', async () => {
      authController.register.mockImplementation((req, res) => {
        expect(req.body).toEqual({});
        res.status(400).json({ success: false, error: 'Missing fields' });
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(authController.register).toHaveBeenCalled();
      expect(response.status).toBe(400);
    });

    it('should handle empty request body for login', async () => {
      authController.login.mockImplementation((req, res) => {
        expect(req.body).toEqual({});
        res.status(400).json({ success: false, error: 'Missing credentials' });
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(authController.login).toHaveBeenCalled();
      expect(response.status).toBe(400);
    });

    it('should parse JSON request bodies', async () => {
      authController.register.mockImplementation((req, res) => {
        expect(typeof req.body).toBe('object');
        res.status(201).json({ success: true });
      });

      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test',
          email: 'test@example.com',
          password: 'pass',
        });

      expect(authController.register).toHaveBeenCalled();
    });
  });
});
