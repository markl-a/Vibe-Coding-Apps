const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())

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

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id)

  const userId = socket.handshake.auth.userId
  const nickname = socket.handshake.auth.nickname

  if (userId && nickname) {
    users.set(socket.id, {
      id: userId,
      nickname,
      joinedAt: new Date(),
    })
    console.log(`👤 User registered: ${nickname} (${userId})`)
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
    console.log(`🏠 New room created: ${data.name} (${roomId})`)

    // Broadcast updated room list to all clients
    io.emit('room:list', getRoomList())
  })

  // Join a room
  socket.on('room:join', (data) => {
    const room = rooms.get(data.roomId)
    if (!room) {
      console.error(`❌ Room not found: ${data.roomId}`)
      return
    }

    socket.join(data.roomId)
    room.users.add(socket.id)

    const user = users.get(socket.id)
    console.log(`📥 ${user?.nickname || 'Unknown'} joined room: ${room.name}`)

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
    console.log(`📤 ${user?.nickname || 'Unknown'} left room: ${room.name}`)

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
  socket.on('message:send', (data) => {
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

    console.log(`💬 Message in ${room.name}: ${data.username}: ${data.content.substring(0, 50)}`)

    // Broadcast message to all users in the room
    io.to(data.roomId).emit('message:new', message)
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

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id)

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
  console.log('=================================')
  console.log('🚀 Socket.io Server Started')
  console.log(`📡 Listening on port: ${PORT}`)
  console.log(`🏠 Default rooms: ${defaultRooms.length}`)
  console.log('=================================')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
