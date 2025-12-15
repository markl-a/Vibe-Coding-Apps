const express = require('express');
const request = require('supertest');
const messageRoutes = require('../../routes/messageRoutes');
const messageController = require('../../controllers/messageController');
const { authenticate } = require('../../middlewares/auth');

jest.mock('../../controllers/messageController');
jest.mock('../../middlewares/auth');

describe('Message Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/messages', messageRoutes);

    // Mock authenticate middleware to always succeed
    authenticate.mockImplementation((req, res, next) => {
      req.userId = 'test-user-123';
      next();
    });

    jest.clearAllMocks();
  });

  describe('POST /api/messages/rooms/:roomId/messages', () => {
    it('should call messageController.sendMessage', async () => {
      messageController.sendMessage.mockImplementation((req, res) => {
        res.status(201).json({ success: true, data: { id: 'message-1' } });
      });

      const response = await request(app)
        .post('/api/messages/rooms/room-1/messages')
        .send({ content: 'Hello World' });

      expect(messageController.sendMessage).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .post('/api/messages/rooms/room-1/messages')
        .send({ content: 'Hello' });

      expect(response.status).toBe(401);
    });

    it('should pass roomId from params', async () => {
      messageController.sendMessage.mockImplementation((req, res) => {
        expect(req.params.roomId).toBe('room-123');
        res.status(201).json({ success: true });
      });

      await request(app)
        .post('/api/messages/rooms/room-123/messages')
        .send({ content: 'Test message' });

      expect(messageController.sendMessage).toHaveBeenCalled();
    });

    it('should pass request body to controller', async () => {
      const messageData = {
        content: 'Test message',
        messageType: 'text',
      };

      messageController.sendMessage.mockImplementation((req, res) => {
        expect(req.body).toEqual(messageData);
        res.status(201).json({ success: true });
      });

      await request(app)
        .post('/api/messages/rooms/room-1/messages')
        .send(messageData);

      expect(messageController.sendMessage).toHaveBeenCalled();
    });
  });

  describe('GET /api/messages/rooms/:roomId/messages', () => {
    it('should call messageController.getMessages', async () => {
      messageController.getMessages.mockImplementation((req, res) => {
        res.json({ success: true, data: [] });
      });

      const response = await request(app)
        .get('/api/messages/rooms/room-1/messages');

      expect(messageController.getMessages).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .get('/api/messages/rooms/room-1/messages');

      expect(response.status).toBe(401);
    });

    it('should pass query parameters', async () => {
      messageController.getMessages.mockImplementation((req, res) => {
        expect(req.query.limit).toBe('20');
        expect(req.query.offset).toBe('10');
        res.json({ success: true, data: [] });
      });

      await request(app)
        .get('/api/messages/rooms/room-1/messages?limit=20&offset=10');

      expect(messageController.getMessages).toHaveBeenCalled();
    });

    it('should handle requests without query parameters', async () => {
      messageController.getMessages.mockImplementation((req, res) => {
        expect(req.query).toEqual({});
        res.json({ success: true, data: [] });
      });

      await request(app)
        .get('/api/messages/rooms/room-1/messages');

      expect(messageController.getMessages).toHaveBeenCalled();
    });
  });

  describe('POST /api/messages/messages/:messageId/read', () => {
    it('should call messageController.markAsRead', async () => {
      messageController.markAsRead.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/api/messages/messages/message-1/read');

      expect(messageController.markAsRead).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .post('/api/messages/messages/message-1/read');

      expect(response.status).toBe(401);
    });

    it('should pass messageId from params', async () => {
      messageController.markAsRead.mockImplementation((req, res) => {
        expect(req.params.messageId).toBe('message-456');
        res.json({ success: true });
      });

      await request(app)
        .post('/api/messages/messages/message-456/read');

      expect(messageController.markAsRead).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/messages/messages/:messageId', () => {
    it('should call messageController.deleteMessage', async () => {
      messageController.deleteMessage.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .delete('/api/messages/messages/message-1');

      expect(messageController.deleteMessage).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .delete('/api/messages/messages/message-1');

      expect(response.status).toBe(401);
    });

    it('should pass messageId from params', async () => {
      messageController.deleteMessage.mockImplementation((req, res) => {
        expect(req.params.messageId).toBe('message-789');
        res.json({ success: true });
      });

      await request(app)
        .delete('/api/messages/messages/message-789');

      expect(messageController.deleteMessage).toHaveBeenCalled();
    });
  });

  describe('GET /api/messages/unread', () => {
    it('should call messageController.getUnreadCount', async () => {
      messageController.getUnreadCount.mockImplementation((req, res) => {
        res.json({ success: true, data: { count: 5 } });
      });

      const response = await request(app)
        .get('/api/messages/unread');

      expect(messageController.getUnreadCount).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .get('/api/messages/unread');

      expect(response.status).toBe(401);
    });

    it('should pass userId from authentication', async () => {
      authenticate.mockImplementation((req, res, next) => {
        req.userId = 'user-xyz';
        next();
      });

      messageController.getUnreadCount.mockImplementation((req, res) => {
        expect(req.userId).toBe('user-xyz');
        res.json({ success: true, data: { count: 0 } });
      });

      await request(app)
        .get('/api/messages/unread');

      expect(messageController.getUnreadCount).toHaveBeenCalled();
    });
  });

  describe('Middleware application', () => {
    it('should apply authenticate middleware to all routes', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const routes = [
        request(app).post('/api/messages/rooms/room-1/messages').send({ content: 'test' }),
        request(app).get('/api/messages/rooms/room-1/messages'),
        request(app).post('/api/messages/messages/msg-1/read'),
        request(app).delete('/api/messages/messages/msg-1'),
        request(app).get('/api/messages/unread'),
      ];

      const responses = await Promise.all(routes);

      responses.forEach((response) => {
        expect(response.status).toBe(401);
      });
      expect(authenticate).toHaveBeenCalledTimes(5);
    });
  });

  describe('Invalid routes', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/messages/invalid-route');

      expect(response.status).toBe(404);
    });

    it('should return 404 for wrong HTTP method', async () => {
      messageController.sendMessage.mockImplementation((req, res) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .get('/api/messages/rooms/room-1/messages/send');

      expect(response.status).toBe(404);
    });
  });
});
