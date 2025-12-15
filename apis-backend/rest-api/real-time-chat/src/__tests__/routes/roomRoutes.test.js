const express = require('express');
const request = require('supertest');
const roomRoutes = require('../../routes/roomRoutes');
const roomController = require('../../controllers/roomController');
const { authenticate } = require('../../middlewares/auth');

jest.mock('../../controllers/roomController');
jest.mock('../../middlewares/auth');

describe('Room Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/rooms', roomRoutes);

    // Mock authenticate middleware to always succeed
    authenticate.mockImplementation((req, res, next) => {
      req.userId = 'test-user-123';
      next();
    });

    jest.clearAllMocks();
  });

  describe('POST /api/rooms', () => {
    it('should call roomController.createRoom', async () => {
      roomController.createRoom.mockImplementation((req, res) => {
        res.status(201).json({ success: true, data: { id: 'room-1' } });
      });

      const response = await request(app)
        .post('/api/rooms')
        .send({ name: 'Test Room' });

      expect(roomController.createRoom).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .post('/api/rooms')
        .send({ name: 'Test Room' });

      expect(response.status).toBe(401);
    });

    it('should pass room data to controller', async () => {
      const roomData = {
        name: 'Development Team',
        description: 'Team chat room',
        type: 'group',
      };

      roomController.createRoom.mockImplementation((req, res) => {
        expect(req.body).toEqual(roomData);
        res.status(201).json({ success: true });
      });

      await request(app)
        .post('/api/rooms')
        .send(roomData);

      expect(roomController.createRoom).toHaveBeenCalled();
    });
  });

  describe('GET /api/rooms', () => {
    it('should call roomController.getUserRooms', async () => {
      roomController.getUserRooms.mockImplementation((req, res) => {
        res.json({ success: true, data: [] });
      });

      const response = await request(app)
        .get('/api/rooms');

      expect(roomController.getUserRooms).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .get('/api/rooms');

      expect(response.status).toBe(401);
    });

    it('should pass userId from authentication', async () => {
      authenticate.mockImplementation((req, res, next) => {
        req.userId = 'user-456';
        next();
      });

      roomController.getUserRooms.mockImplementation((req, res) => {
        expect(req.userId).toBe('user-456');
        res.json({ success: true, data: [] });
      });

      await request(app)
        .get('/api/rooms');

      expect(roomController.getUserRooms).toHaveBeenCalled();
    });
  });

  describe('GET /api/rooms/:roomId', () => {
    it('should call roomController.getRoom', async () => {
      roomController.getRoom.mockImplementation((req, res) => {
        res.json({ success: true, data: { id: 'room-1' } });
      });

      const response = await request(app)
        .get('/api/rooms/room-1');

      expect(roomController.getRoom).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .get('/api/rooms/room-1');

      expect(response.status).toBe(401);
    });

    it('should pass roomId from params', async () => {
      roomController.getRoom.mockImplementation((req, res) => {
        expect(req.params.roomId).toBe('room-456');
        res.json({ success: true });
      });

      await request(app)
        .get('/api/rooms/room-456');

      expect(roomController.getRoom).toHaveBeenCalled();
    });
  });

  describe('POST /api/rooms/:roomId/join', () => {
    it('should call roomController.joinRoom', async () => {
      roomController.joinRoom.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/api/rooms/room-1/join');

      expect(roomController.joinRoom).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .post('/api/rooms/room-1/join');

      expect(response.status).toBe(401);
    });

    it('should pass roomId from params', async () => {
      roomController.joinRoom.mockImplementation((req, res) => {
        expect(req.params.roomId).toBe('room-789');
        res.json({ success: true });
      });

      await request(app)
        .post('/api/rooms/room-789/join');

      expect(roomController.joinRoom).toHaveBeenCalled();
    });
  });

  describe('POST /api/rooms/:roomId/leave', () => {
    it('should call roomController.leaveRoom', async () => {
      roomController.leaveRoom.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/api/rooms/room-1/leave');

      expect(roomController.leaveRoom).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .post('/api/rooms/room-1/leave');

      expect(response.status).toBe(401);
    });

    it('should pass roomId from params', async () => {
      roomController.leaveRoom.mockImplementation((req, res) => {
        expect(req.params.roomId).toBe('room-101');
        res.json({ success: true });
      });

      await request(app)
        .post('/api/rooms/room-101/leave');

      expect(roomController.leaveRoom).toHaveBeenCalled();
    });
  });

  describe('POST /api/rooms/:roomId/invite', () => {
    it('should call roomController.inviteToRoom', async () => {
      roomController.inviteToRoom.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/api/rooms/room-1/invite')
        .send({ userId: 'user-2' });

      expect(roomController.inviteToRoom).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .post('/api/rooms/room-1/invite')
        .send({ userId: 'user-2' });

      expect(response.status).toBe(401);
    });

    it('should pass invite data to controller', async () => {
      const inviteData = { userId: 'user-to-invite' };

      roomController.inviteToRoom.mockImplementation((req, res) => {
        expect(req.body).toEqual(inviteData);
        expect(req.params.roomId).toBe('room-1');
        res.json({ success: true });
      });

      await request(app)
        .post('/api/rooms/room-1/invite')
        .send(inviteData);

      expect(roomController.inviteToRoom).toHaveBeenCalled();
    });
  });

  describe('GET /api/rooms/:roomId/members', () => {
    it('should call roomController.getRoomMembers', async () => {
      roomController.getRoomMembers.mockImplementation((req, res) => {
        res.json({ success: true, data: [] });
      });

      const response = await request(app)
        .get('/api/rooms/room-1/members');

      expect(roomController.getRoomMembers).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .get('/api/rooms/room-1/members');

      expect(response.status).toBe(401);
    });

    it('should pass roomId from params', async () => {
      roomController.getRoomMembers.mockImplementation((req, res) => {
        expect(req.params.roomId).toBe('room-555');
        res.json({ success: true, data: [] });
      });

      await request(app)
        .get('/api/rooms/room-555/members');

      expect(roomController.getRoomMembers).toHaveBeenCalled();
    });
  });

  describe('POST /api/rooms/:roomId/read', () => {
    it('should call roomController.markAsRead', async () => {
      roomController.markAsRead.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/api/rooms/room-1/read');

      expect(roomController.markAsRead).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const response = await request(app)
        .post('/api/rooms/room-1/read');

      expect(response.status).toBe(401);
    });

    it('should pass roomId from params', async () => {
      roomController.markAsRead.mockImplementation((req, res) => {
        expect(req.params.roomId).toBe('room-999');
        res.json({ success: true });
      });

      await request(app)
        .post('/api/rooms/room-999/read');

      expect(roomController.markAsRead).toHaveBeenCalled();
    });
  });

  describe('Middleware application', () => {
    it('should apply authenticate middleware to all routes', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ success: false, error: 'Authentication required' });
      });

      const routes = [
        request(app).post('/api/rooms').send({ name: 'test' }),
        request(app).get('/api/rooms'),
        request(app).get('/api/rooms/room-1'),
        request(app).post('/api/rooms/room-1/join'),
        request(app).post('/api/rooms/room-1/leave'),
        request(app).post('/api/rooms/room-1/invite').send({ userId: 'user-1' }),
        request(app).get('/api/rooms/room-1/members'),
        request(app).post('/api/rooms/room-1/read'),
      ];

      const responses = await Promise.all(routes);

      responses.forEach((response) => {
        expect(response.status).toBe(401);
      });
      expect(authenticate).toHaveBeenCalledTimes(8);
    });
  });

  describe('Invalid routes', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/rooms/invalid-endpoint');

      expect(response.status).toBe(404);
    });

    it('should return 404 for wrong HTTP methods', async () => {
      const response = await request(app)
        .delete('/api/rooms/room-1/join');

      expect(response.status).toBe(404);
    });
  });

  describe('Route parameters', () => {
    it('should handle special characters in roomId', async () => {
      roomController.getRoom.mockImplementation((req, res) => {
        expect(req.params.roomId).toBe('room-abc-123-xyz');
        res.json({ success: true });
      });

      await request(app)
        .get('/api/rooms/room-abc-123-xyz');

      expect(roomController.getRoom).toHaveBeenCalled();
    });

    it('should handle numeric roomIds', async () => {
      roomController.getRoom.mockImplementation((req, res) => {
        expect(req.params.roomId).toBe('12345');
        res.json({ success: true });
      });

      await request(app)
        .get('/api/rooms/12345');

      expect(roomController.getRoom).toHaveBeenCalled();
    });
  });

  describe('Request body handling', () => {
    it('should handle empty request body for create room', async () => {
      roomController.createRoom.mockImplementation((req, res) => {
        expect(req.body).toEqual({});
        res.status(400).json({ success: false, error: 'Room name is required' });
      });

      const response = await request(app)
        .post('/api/rooms')
        .send({});

      expect(roomController.createRoom).toHaveBeenCalled();
      expect(response.status).toBe(400);
    });

    it('should parse JSON request bodies correctly', async () => {
      const roomData = {
        name: 'Test Room',
        description: 'A test room',
        type: 'private',
      };

      roomController.createRoom.mockImplementation((req, res) => {
        expect(req.body).toEqual(roomData);
        res.status(201).json({ success: true });
      });

      await request(app)
        .post('/api/rooms')
        .send(roomData);

      expect(roomController.createRoom).toHaveBeenCalled();
    });
  });
});
