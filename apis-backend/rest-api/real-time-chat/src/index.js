const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { createLogger } = require('@shared-utils/logger');
const { initDatabase } = require('./utils/db');
const ChatHandler = require('./sockets/chatHandler');
const errorHandler = require('./middlewares/errorHandler');

require('dotenv').config();

const logger = createLogger('real-time-chat');

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Initialize database
    logger.info('Initializing database');
    await initDatabase();

    const app = express();
    const httpServer = http.createServer(app);

    // CORS configuration
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
    const corsOptions = {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS policy violation'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };

    // Initialize Socket.io
    const io = new Server(httpServer, {
      cors: corsOptions
    });

    // Middleware
    app.use(helmet());
    app.use(cors(corsOptions));
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
      logger.info('Real-time Chat REST API is running', {
        httpEndpoint: `http://localhost:${PORT}`,
        socketEndpoint: `ws://localhost:${PORT}`,
        port: PORT
      });
    });

    return { app, httpServer, io };
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing server');
  process.exit(0);
});

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = startServer;
