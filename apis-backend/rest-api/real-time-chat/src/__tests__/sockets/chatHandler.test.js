// Mock the database module before importing anything else
jest.mock('../../utils/db', () => require('../helpers/mockDb'));

const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const ChatHandler = require('../../sockets/chatHandler');
const authService = require('../../services/authService');
const roomService = require('../../services/roomService');
const { clearMocks } = require('../helpers/mockDb');

describe('ChatHandler', () => {
  let io, serverSocket, clientSocket, httpServer;
  let user1, user2, token1, token2, room;

  beforeAll((done) => {
    httpServer = http.createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      done();
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  beforeEach(async () => {
    clearMocks();

    // Setup users and room
    const result1 = await authService.register('user1', 'user1@example.com', 'password123');
    const result2 = await authService.register('user2', 'user2@example.com', 'password123');
    user1 = result1.user;
    user2 = result2.user;
    token1 = result1.token;
    token2 = result2.token;

    room = await roomService.createRoom(user1.id, 'Test Room', 'Description');
    await roomService.joinRoom(room.id, user2.id);

    // Initialize chat handler
    const chatHandler = new ChatHandler(io);
    chatHandler.initialize();
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
  });

  describe('Socket Connection', () => {
    it('should connect with valid token', (done) => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: token1 },
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });

    it('should reject connection without token', (done) => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`);

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication error');
        done();
      });
    });

    it('should reject connection with invalid token', (done) => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: 'invalid-token' },
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toMatch(/Authentication error|Invalid token/);
        done();
      });
    });
  });

  describe('Room Join/Leave', () => {
    beforeEach((done) => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: token1 },
      });

      clientSocket.on('connect', () => {
        done();
      });
    });

    it('should emit room:joined event after joining room', (done) => {
      clientSocket.on('room:joined', (data) => {
        expect(data.roomId).toBe(room.id);
        done();
      });

      clientSocket.emit('room:join', { roomId: room.id });
    });

    it('should emit room:left event after leaving room', (done) => {
      clientSocket.emit('room:join', { roomId: room.id });

      clientSocket.on('room:left', (data) => {
        expect(data.roomId).toBe(room.id);
        done();
      });

      setTimeout(() => {
        clientSocket.emit('room:leave', { roomId: room.id });
      }, 100);
    });
  });

  describe('Message Sending', () => {
    beforeEach((done) => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: token1 },
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('room:join', { roomId: room.id });
        setTimeout(done, 100);
      });
    });

    it('should broadcast new message to room', (done) => {
      clientSocket.on('message:new', (message) => {
        expect(message).toHaveProperty('id');
        expect(message.content).toBe('Hello, room!');
        expect(message.room_id).toBe(room.id);
        done();
      });

      clientSocket.emit('message:send', {
        roomId: room.id,
        content: 'Hello, room!',
      });
    });

    it('should emit error if user not a member', (done) => {
      const port = httpServer.address().port;
      const client2 = Client(`http://localhost:${port}`, {
        auth: { token: token2 },
      });

      client2.on('connect', () => {
        const nonMemberRoom = 'non-member-room-id';

        client2.on('error', (error) => {
          expect(error.message).toBeTruthy();
          client2.disconnect();
          done();
        });

        client2.emit('message:send', {
          roomId: nonMemberRoom,
          content: 'Test',
        });
      });
    });
  });

  describe('Typing Indicators', () => {
    let client1, client2;

    beforeEach((done) => {
      const port = httpServer.address().port;

      client1 = Client(`http://localhost:${port}`, {
        auth: { token: token1 },
      });

      client2 = Client(`http://localhost:${port}`, {
        auth: { token: token2 },
      });

      let connectedCount = 0;
      const onConnect = () => {
        connectedCount++;
        if (connectedCount === 2) {
          client1.emit('room:join', { roomId: room.id });
          client2.emit('room:join', { roomId: room.id });
          setTimeout(done, 100);
        }
      };

      client1.on('connect', onConnect);
      client2.on('connect', onConnect);
    });

    afterEach(() => {
      if (client1) client1.disconnect();
      if (client2) client2.disconnect();
    });

    it('should broadcast typing started event', (done) => {
      client2.on('typing:started', (data) => {
        expect(data.roomId).toBe(room.id);
        expect(data.userId).toBe(user1.id);
        done();
      });

      client1.emit('typing:start', { roomId: room.id });
    });

    it('should broadcast typing stopped event', (done) => {
      client2.on('typing:stopped', (data) => {
        expect(data.roomId).toBe(room.id);
        expect(data.userId).toBe(user1.id);
        done();
      });

      client1.emit('typing:stop', { roomId: room.id });
    });
  });

  describe('User Online/Offline Status', () => {
    it('should broadcast online status on connection', (done) => {
      const port = httpServer.address().port;

      io.on('connection', (socket) => {
        socket.on('disconnect', () => {
          // Test handled in next test
        });
      });

      const client = Client(`http://localhost:${port}`, {
        auth: { token: token1 },
      });

      // Create a second client to receive the broadcast
      const client2 = Client(`http://localhost:${port}`, {
        auth: { token: token2 },
      });

      client2.on('user:online', (data) => {
        expect(data.userId).toBeTruthy();
        client.disconnect();
        client2.disconnect();
        done();
      });
    });

    it('should broadcast offline status on disconnect', (done) => {
      const port = httpServer.address().port;

      const client1 = Client(`http://localhost:${port}`, {
        auth: { token: token1 },
      });

      const client2 = Client(`http://localhost:${port}`, {
        auth: { token: token2 },
      });

      client2.on('user:offline', (data) => {
        expect(data.userId).toBeTruthy();
        client2.disconnect();
        done();
      });

      client1.on('connect', () => {
        setTimeout(() => {
          client1.disconnect();
        }, 100);
      });
    });
  });
});
