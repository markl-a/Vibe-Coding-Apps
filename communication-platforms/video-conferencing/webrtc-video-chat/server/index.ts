import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT ?? 3001;

// Serve static files in production
app.use(express.static(join(__dirname, '../dist')));

// Room management
const rooms = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on('join-room', (roomId: string, userId: string) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId)!.add(userId);

    // Notify others in the room
    socket.to(roomId).emit('user-joined', userId);

    console.log(`User ${userId} joined room ${roomId}`);
  });

  // WebRTC signaling: offer
  socket.on('offer', (roomId: string, offer: RTCSessionDescriptionInit, targetUserId: string) => {
    socket.to(roomId).emit('offer', offer, socket.id);
  });

  // WebRTC signaling: answer
  socket.on('answer', (roomId: string, answer: RTCSessionDescriptionInit, targetUserId: string) => {
    socket.to(roomId).emit('answer', answer, socket.id);
  });

  // WebRTC signaling: ICE candidate
  socket.on('ice-candidate', (roomId: string, candidate: RTCIceCandidateInit) => {
    socket.to(roomId).emit('ice-candidate', candidate, socket.id);
  });

  // Leave room
  socket.on('leave-room', (roomId: string, userId: string) => {
    socket.leave(roomId);
    rooms.get(roomId)?.delete(userId);

    if (rooms.get(roomId)?.size === 0) {
      rooms.delete(roomId);
    }

    socket.to(roomId).emit('user-left', userId);
    console.log(`User ${userId} left room ${roomId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// API endpoint to get room info
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const users = rooms.get(roomId);
  res.json({
    roomId,
    userCount: users?.size ?? 0,
  });
});

server.listen(PORT, () => {
  console.log(`🚀 WebRTC Signaling Server running at http://localhost:${PORT}`);
});
