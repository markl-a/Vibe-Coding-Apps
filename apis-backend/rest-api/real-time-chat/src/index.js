const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { initDatabase } = require('./utils/db');
const ChatHandler = require('./sockets/chatHandler');
const errorHandler = require('./middlewares/errorHandler');

require('dotenv').config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Initialize database
    console.log('🔄 Initializing database...');
    await initDatabase();

    const app = express();
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
      },
    });

    // Middleware
    app.use(helmet());
    app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Routes
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/rooms', require('./routes/roomRoutes'));
    app.use('/api', require('./routes/messageRoutes'));

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'Route not found'
        }
      });
    });

    // Error handler - use centralized error handling middleware
    app.use(errorHandler);

    // Initialize chat handler
    const chatHandler = new ChatHandler(io);
    chatHandler.initialize();

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   💬 Real-time Chat REST API is running!             ║
║                                                        ║
║   🌐 HTTP Endpoint:                                   ║
║      http://localhost:${PORT}                           ║
║                                                        ║
║   🔌 Socket.io:                                       ║
║      ws://localhost:${PORT}                             ║
║                                                        ║
║   💡 Ready for real-time messaging!                   ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `);
    });

    return { app, httpServer, io };
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal received: closing server');
  process.exit(0);
});

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = startServer;
