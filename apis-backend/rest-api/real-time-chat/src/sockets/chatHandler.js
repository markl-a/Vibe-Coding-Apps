const { verifyToken } = require('../utils/auth');
const messageService = require('../services/messageService');
const userService = require('../services/userService');
const { createLogger } = require('@vibe/shared-utils');
const logger = createLogger('real-time-chat:socket');

// Store connected users
const connectedUsers = new Map();

class ChatHandler {
  constructor(io) {
    this.io = io;
  }

  /**
   * Initialize socket handlers
   */
  initialize() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      try {
        const decoded = verifyToken(token);
        if (!decoded) {
          return next(new Error('Invalid token'));
        }
        socket.userId = decoded.userId || decoded.id;
        socket.userRole = decoded.role;
        next();
      } catch(error) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle socket connection
   */
  handleConnection(socket) {
    const userId = socket.userId;
    connectedUsers.set(userId, socket.id);

    logger.info(`User ${userId} connected (socket: ${socket.id})`);

    // Update user online status
    userService.updateOnlineStatus(userId, 'online').catch(err => logger.error('Failed to update online status', err));

    // Broadcast user online status
    socket.broadcast.emit('user:online', { userId });

    // Handle join room
    socket.on('room:join', (data) => this.handleJoinRoom(socket, data));

    // Handle leave room
    socket.on('room:leave', (data) => this.handleLeaveRoom(socket, data));

    // Handle send message
    socket.on('message:send', (data) => this.handleSendMessage(socket, data));

    // Handle typing indicator
    socket.on('typing:start', (data) => this.handleTypingStart(socket, data));
    socket.on('typing:stop', (data) => this.handleTypingStop(socket, data));

    // Handle disconnect
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  /**
   * Handle join room
   */
  async handleJoinRoom(socket, data) {
    try {
      const { roomId } = data;
      socket.join(roomId);

      // Notify room members
      socket.to(roomId).emit('user:joined', {
        roomId,
        userId: socket.userId,
      });

      socket.emit('room:joined', { roomId });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Handle leave room
   */
  handleLeaveRoom(socket, data) {
    const { roomId } = data;
    socket.leave(roomId);

    // Notify room members
    socket.to(roomId).emit('user:left', {
      roomId,
      userId: socket.userId,
    });

    socket.emit('room:left', { roomId });
  }

  /**
   * Handle send message
   */
  async handleSendMessage(socket, data) {
    try {
      const { roomId, content, messageType, fileUrl } = data;

      const message = await messageService.sendMessage(
        roomId,
        socket.userId,
        content,
        messageType,
        fileUrl
      );

      // Broadcast message to room
      this.io.to(roomId).emit('message:new', message);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Handle typing start
   */
  handleTypingStart(socket, data) {
    const { roomId } = data;
    socket.to(roomId).emit('typing:started', {
      roomId,
      userId: socket.userId,
    });
  }

  /**
   * Handle typing stop
   */
  handleTypingStop(socket, data) {
    const { roomId } = data;
    socket.to(roomId).emit('typing:stopped', {
      roomId,
      userId: socket.userId,
    });
  }

  /**
   * Handle disconnect
   */
  async handleDisconnect(socket) {
    const userId = socket.userId;
    connectedUsers.delete(userId);

    logger.info(`User ${userId} disconnected`);

    // Update user offline status
    await userService.updateOnlineStatus(userId, 'offline').catch(err => logger.error('Failed to update offline status', err));

    // Broadcast user offline status
    socket.broadcast.emit('user:offline', { userId });
  }

  /**
   * Get connected users
   */
  getConnectedUsers() {
    return Array.from(connectedUsers.keys());
  }
}

module.exports = ChatHandler;
