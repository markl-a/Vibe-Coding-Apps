// Mock the database module before importing anything else
jest.mock('../../utils/db', () => require('../helpers/mockDb'));

const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/authRoutes');
const roomRoutes = require('../../routes/roomRoutes');
const messageRoutes = require('../../routes/messageRoutes');
const { clearMocks } = require('../helpers/mockDb');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api', messageRoutes);

describe('API Integration Tests', () => {
  let token1, token2, user1Id, user2Id, roomId;

  beforeEach(async () => {
    clearMocks();

    // Setup users
    const reg1 = await request(app).post('/api/auth/register').send({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
    });
    token1 = reg1.body.data.token;
    user1Id = reg1.body.data.user.id;

    const reg2 = await request(app).post('/api/auth/register').send({
      username: 'bob',
      email: 'bob@example.com',
      password: 'password123',
    });
    token2 = reg2.body.data.token;
    user2Id = reg2.body.data.user.id;

    // Create a room
    const roomResponse = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token1}`)
      .send({ name: 'General', description: 'General discussion' });
    roomId = roomResponse.body.data.id;
  });

  describe('Complete Chat Flow', () => {
    it('should handle complete chat conversation flow', async () => {
      // Step 1: Bob joins the room
      const joinResponse = await request(app)
        .post(`/api/rooms/${roomId}/join`)
        .set('Authorization', `Bearer ${token2}`);

      expect(joinResponse.status).toBe(200);

      // Step 2: Alice sends a message
      const msg1Response = await request(app)
        .post(`/api/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Hello, everyone!' });

      expect(msg1Response.status).toBe(201);
      const message1 = msg1Response.body.data;

      // Step 3: Bob sends a reply
      const msg2Response = await request(app)
        .post(`/api/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: 'Hi Alice!' });

      expect(msg2Response.status).toBe(201);

      // Step 4: Get messages
      const messagesResponse = await request(app)
        .get(`/api/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${token1}`);

      expect(messagesResponse.status).toBe(200);
      expect(messagesResponse.body.data).toHaveLength(2);

      // Step 5: Bob marks message as read
      const readResponse = await request(app)
        .post(`/api/messages/${message1.id}/read`)
        .set('Authorization', `Bearer ${token2}`);

      expect(readResponse.status).toBe(200);

      // Step 6: Mark room as read
      const roomReadResponse = await request(app)
        .post(`/api/rooms/${roomId}/read`)
        .set('Authorization', `Bearer ${token2}`);

      expect(roomReadResponse.status).toBe(200);
    });

    it('should handle multiple rooms and messages', async () => {
      // Create another room
      const room2Response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Random', description: 'Random chat' });

      const room2Id = room2Response.body.data.id;

      // Bob joins both rooms
      await request(app)
        .post(`/api/rooms/${roomId}/join`)
        .set('Authorization', `Bearer ${token2}`);

      await request(app)
        .post(`/api/rooms/${room2Id}/join`)
        .set('Authorization', `Bearer ${token2}`);

      // Send messages to both rooms
      await request(app)
        .post(`/api/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Message in General' });

      await request(app)
        .post(`/api/rooms/${room2Id}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Message in Random' });

      // Get Bob's rooms
      const roomsResponse = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${token2}`);

      expect(roomsResponse.status).toBe(200);
      expect(roomsResponse.body.data).toHaveLength(2);
    });

    it('should handle file messages', async () => {
      await request(app)
        .post(`/api/rooms/${roomId}/join`)
        .set('Authorization', `Bearer ${token2}`);

      const fileMessageResponse = await request(app)
        .post(`/api/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          content: 'Check this document',
          messageType: 'file',
          fileUrl: 'https://example.com/document.pdf',
        });

      expect(fileMessageResponse.status).toBe(201);
      expect(fileMessageResponse.body.data.message_type).toBe('file');
      expect(fileMessageResponse.body.data.file_url).toBe('https://example.com/document.pdf');
    });
  });

  describe('Permission and Access Control', () => {
    it('should prevent non-members from sending messages', async () => {
      const response = await request(app)
        .post(`/api/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: 'Unauthorized message' });

      expect(response.status).toBe(400);
    });

    it('should prevent non-members from reading messages', async () => {
      const response = await request(app)
        .get(`/api/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(400);
    });

    it('should prevent users from deleting others messages', async () => {
      await request(app)
        .post(`/api/rooms/${roomId}/join`)
        .set('Authorization', `Bearer ${token2}`);

      const msgResponse = await request(app)
        .post(`/api/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Alice message' });

      const messageId = msgResponse.body.data.id;

      const deleteResponse = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(deleteResponse.status).toBe(400);
    });

    it('should allow users to delete their own messages', async () => {
      const msgResponse = await request(app)
        .post(`/api/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'My message' });

      const messageId = msgResponse.body.data.id;

      const deleteResponse = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(deleteResponse.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid room ID gracefully', async () => {
      const response = await request(app)
        .get('/api/rooms/invalid-id')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });

    it('should handle missing authentication', async () => {
      const response = await request(app)
        .get('/api/rooms');

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token1}`)
        .send({ description: 'Missing name' });

      expect(response.status).toBe(400);
    });
  });

  describe('Pagination and Limits', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/rooms/${roomId}/join`)
        .set('Authorization', `Bearer ${token2}`);

      // Send 10 messages
      for (let i = 1; i <= 10; i++) {
        await request(app)
          .post(`/api/rooms/${roomId}/messages`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ content: `Message ${i}` });
      }
    });

    it('should respect limit parameter for messages', async () => {
      const response = await request(app)
        .get(`/api/rooms/${roomId}/messages?limit=5`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should support pagination with offset', async () => {
      const response = await request(app)
        .get(`/api/rooms/${roomId}/messages?limit=5&offset=5`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
    });
  });
});
