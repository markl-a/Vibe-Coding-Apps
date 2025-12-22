const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { createLogger } = require('@shared-utils/logger')
const aiBot = require('./aiBot')

const logger = createLogger('real-time-messenger')
const app = express()
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000']),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
app.use(cors(corsOptions))

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// In-memory storage for rooms and users
const rooms = new Map()
const users = new Map()

// Default rooms
const defaultRooms = [
  {
    id: 'general',
    name: '一般討論',
    description: '自由交流的空間',
    userCount: 0,
  },
  {
    id: 'tech',
    name: '技術討論',
    description: '技術相關話題',
    userCount: 0,
  },
  {
    id: 'random',
    name: '隨機聊天',
    description: '隨便聊聊',
    userCount: 0,
  },
]

// Initialize default rooms
defaultRooms.forEach((room) => {
  rooms.set(room.id, {
    ...room,
    messages: [],
    users: new Set(),
  })
})

// Helper function to get room list
const getRoomList = () => {
  return Array.from(rooms.values()).map((room) => ({
    id: room.id,
    name: room.name,
    description: room.description,
    userCount: room.users.size,
  }))
}

// JWT authentication middleware for Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch(error) {
    next(new Error('Invalid token'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id })

  const userId = socket.handshake.auth.userId
  const nickname = socket.handshake.auth.nickname

  if (userId && nickname) {
    users.set(socket.id, {
      id: userId,
      nickname,
      joinedAt: new Date(),
    })
    logger.info('User registered', { nickname, userId })
  }

  // Send room list to newly connected user
  socket.on('room:list', () => {
    socket.emit('room:list', getRoomList())
  })

  // Create a new room
  socket.on('room:create', (data) => {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newRoom = {
      id: roomId,
      name: data.name,
      description: data.description || '',
      messages: [],
      users: new Set(),
    }

    rooms.set(roomId, newRoom)
    logger.info('New room created', { roomName: data.name, roomId })

    // Broadcast updated room list to all clients
    io.emit('room:list', getRoomList())
  })

  // Join a room
  socket.on('room:join', (data) => {
    const room = rooms.get(data.roomId)
    if (!room) {
      logger.error('Room not found', new Error('Room not found'), { roomId: data.roomId })
      return
    }

    socket.join(data.roomId)
    room.users.add(socket.id)

    const user = users.get(socket.id)
    logger.info('User joined room', { nickname: user?.nickname || 'Unknown', roomName: room.name })

    // Send message history to the user
    socket.emit('message:history', room.messages)

    // Send online users list to all users in the room
    const onlineUsers = Array.from(room.users)
      .map((id) => users.get(id))
      .filter(Boolean)
    io.to(data.roomId).emit('users:online', onlineUsers)

    // Notify other users that someone joined
    if (user) {
      socket.to(data.roomId).emit('user:joined', user)
    }

    // Broadcast updated room list
    io.emit('room:list', getRoomList())
  })

  // Leave a room
  socket.on('room:leave', (data) => {
    const room = rooms.get(data.roomId)
    if (!room) return

    socket.leave(data.roomId)
    room.users.delete(socket.id)

    const user = users.get(socket.id)
    logger.info('User left room', { nickname: user?.nickname || 'Unknown', roomName: room.name })

    // Notify other users that someone left
    if (user) {
      socket.to(data.roomId).emit('user:left', user)
    }

    // Send updated online users list
    const onlineUsers = Array.from(room.users)
      .map((id) => users.get(id))
      .filter(Boolean)
    io.to(data.roomId).emit('users:online', onlineUsers)

    // Broadcast updated room list
    io.emit('room:list', getRoomList())
  })

  // Handle new message
  socket.on('message:send', async (data) => {
    const room = rooms.get(data.roomId)
    if (!room) return

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      username: data.username,
      content: data.content,
      timestamp: data.timestamp,
      roomId: data.roomId,
    }

    // Store message in room history
    room.messages.push(message)

    // Keep only last 100 messages per room to prevent memory issues
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100)
    }

    // Broadcast message to all users in the room
    io.to(data.roomId).emit('message:new', message)

    // Check if AI bot should respond
    try {
      const aiResponse = await aiBot.processMessage(message, room)
      if (aiResponse) {
        // Wait a bit before responding (simulate thinking)
        setTimeout(() => {
          // Store AI response
          room.messages.push(aiResponse)

          // Broadcast AI response
          io.to(data.roomId).emit('message:new', aiResponse)
          logger.info('AI Bot responded', { roomName: room.name })
        }, 1000 + Math.random() * 1000) // 1-2 seconds delay
      }
    } catch (error) {
      logger.error('AI Bot error', error)
    }
  })

  // Handle typing start
  socket.on('typing:start', (data) => {
    socket.to(data.roomId).emit('typing:start', {
      userId: data.userId,
      username: data.username,
      roomId: data.roomId,
    })
  })

  // Handle typing stop
  socket.on('typing:stop', (data) => {
    socket.to(data.roomId).emit('typing:stop', {
      userId: data.userId,
      roomId: data.roomId,
    })
  })

  // Handle message reaction (emoji reaction)
  socket.on('message:react', (data) => {
    const { roomId, messageId, emoji, userId, username } = data
    const room = rooms.get(roomId)
    if (!room) return

    // Find the message and add reaction
    const message = room.messages.find(m => m.id === messageId)
    if (message) {
      if (!message.reactions) {
        message.reactions = {}
      }
      if (!message.reactions[emoji]) {
        message.reactions[emoji] = []
      }

      // Toggle reaction (add or remove)
      const index = message.reactions[emoji].findIndex(u => u.userId === userId)
      if (index > -1) {
        message.reactions[emoji].splice(index, 1)
        if (message.reactions[emoji].length === 0) {
          delete message.reactions[emoji]
        }
      } else {
        message.reactions[emoji].push({ userId, username })
      }

      // Broadcast updated reactions
      io.to(roomId).emit('message:reaction', {
        messageId,
        reactions: message.reactions,
      })
    }
  })

  // Handle private message
  socket.on('message:private', async (data) => {
    const { toUserId, content, fromUserId, fromUsername } = data

    // Find the recipient's socket
    let recipientSocketId = null
    for (const [socketId, user] of users.entries()) {
      if (user.id === toUserId) {
        recipientSocketId = socketId
        break
      }
    }

    if (recipientSocketId) {
      const privateMessage = {
        id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromUserId,
        fromUsername,
        content,
        timestamp: new Date().toISOString(),
        isPrivate: true,
      }

      // Send to recipient
      io.to(recipientSocketId).emit('message:private', privateMessage)

      // Send back to sender (for confirmation)
      socket.emit('message:private:sent', privateMessage)

      logger.info('Private message sent', { fromUsername, toUserId })
    } else {
      socket.emit('message:private:error', {
        error: 'User not online',
        toUserId,
      })
    }
  })

  // Handle message deletion
  socket.on('message:delete', (data) => {
    const { roomId, messageId, userId } = data
    const room = rooms.get(roomId)
    if (!room) return

    const messageIndex = room.messages.findIndex(m =>
      m.id === messageId && m.userId === userId
    )

    if (messageIndex > -1) {
      room.messages.splice(messageIndex, 1)

      // Broadcast deletion
      io.to(roomId).emit('message:deleted', { messageId })
    }
  })

  // Handle message edit
  socket.on('message:edit', (data) => {
    const { roomId, messageId, userId, newContent } = data
    const room = rooms.get(roomId)
    if (!room) return

    const message = room.messages.find(m =>
      m.id === messageId && m.userId === userId
    )

    if (message) {
      message.content = newContent
      message.edited = true
      message.editedAt = new Date().toISOString()

      // Broadcast edit
      io.to(roomId).emit('message:edited', {
        messageId,
        content: newContent,
        editedAt: message.editedAt,
      })
    }
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info('User disconnected', { socketId: socket.id })

    const user = users.get(socket.id)

    // Remove user from all rooms
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id)

        // Notify other users
        if (user) {
          socket.to(roomId).emit('user:left', user)
        }

        // Send updated online users list
        const onlineUsers = Array.from(room.users)
          .map((id) => users.get(id))
          .filter(Boolean)
        io.to(roomId).emit('users:online', onlineUsers)
      }
    })

    // Remove user from users map
    users.delete(socket.id)

    // Broadcast updated room list
    io.emit('room:list', getRoomList())
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
    rooms: rooms.size,
    users: users.size,
  })
})

// Start server
const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  logger.info('Socket.io Server Started', {
    port: PORT,
    defaultRooms: defaultRooms.length
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, closing server')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})
