// Mock the database module before importing anything else
jest.mock('../../utils/db', () => require('../helpers/mockDb'));

const request = require('supertest');
const express = require('express');
const roomRoutes = require('../../routes/roomRoutes');
const authRoutes = require('../../routes/authRoutes');
const { clearMocks } = require('../helpers/mockDb');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

describe('RoomController', () => {
  let token1, token2, user1Id, user2Id;

  beforeEach(async () => {
    clearMocks();

    // Register and login users
    const reg1 = await request(app).post('/api/auth/register').send({
      username: 'user1',
      email: 'user1@example.com',
      password: 'password123',
    });
    token1 = reg1.body.data.token;
    user1Id = reg1.body.data.user.id;

    const reg2 = await request(app).post('/api/auth/register').send({
      username: 'user2',
      email: 'user2@example.com',
      password: 'password123',
    });
    token2 = reg2.body.data.token;
    user2Id = reg2.body.data.user.id;
  });

  describe('POST /api/rooms', () => {
    it('should create a new room', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Test Room',
          description: 'A test room',
          type: 'group',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Room');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'A test room',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({
          name: 'Test Room',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/rooms', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Room 1', description: 'First room' });

      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Room 2', description: 'Second room' });
    });

    it('should get user rooms', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array if user has no rooms', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/rooms/:roomId', () => {
    let roomId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Test Room' });
      roomId = response.body.data.id;
    });

    it('should get room by ID for member', async () => {
      const response = await request(app)
        .get(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(roomId);
    });

    it('should return 404 for non-member', async () => {
      const response = await request(app)
        .get(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/rooms/:roomId/join', () => {
    let roomId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Test Room' });
      roomId = response.body.data.id;
    });

    it('should allow user to join room', async () => {
      const response = await request(app)
        .post(`/api/rooms/${roomId}/join`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user can now access the room
      const getResponse = await request(app)
        .get(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(getResponse.status).toBe(200);
    });

    it('should return error if already a member', async () => {
      await request(app)
        .post(`/api/rooms/${roomId}/join`)
        .set('Authorization', `Bearer ${token2}`);

      const response = await request(app)
        .post(`/api/rooms/${roomId}/join`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/rooms/:roomId/leave', () => {
    let roomId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Test Room' });
      roomId = response.body.data.id;

      await request(app)
        .post(`/api/rooms/${roomId}/join`)
        .set('Authorization', `Bearer ${token2}`);
    });

    it('should allow user to leave room', async () => {
      const response = await request(app)
        .post(`/api/rooms/${roomId}/leave`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user can no longer access the room
      const getResponse = await request(app)
        .get(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe('POST /api/rooms/:roomId/invite', () => {
    let roomId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Test Room' });
      roomId = response.body.data.id;
    });

    it('should allow member to invite another user', async () => {
      const response = await request(app)
        .post(`/api/rooms/${roomId}/invite`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2Id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify invited user can access the room
      const getResponse = await request(app)
        .get(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(getResponse.status).toBe(200);
    });

    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .post(`/api/rooms/${roomId}/invite`)
        .set('Authorization', `Bearer ${token1}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error if inviter is not a member', async () => {
      const response = await request(app)
        .post(`/api/rooms/${roomId}/invite`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ userId: user1Id });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
