const express = require('express');
const { createClient } = require('redis');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4004;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Redis Client
const redisClient = createClient({ url: REDIS_URL });
const redisPub = createClient({ url: REDIS_URL });
const redisSub = createClient({ url: REDIS_URL });

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    await redisPub.connect();
    await redisSub.connect();
    console.log('✅ Connected to Redis (Notifications)');
  } catch (error) {
    console.error('❌ Redis connection error:', error);
  }
};

connectRedis();

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for real-time notifications
const wss = new WebSocket.Server({ server, path: '/ws' });

// Store active WebSocket connections
const connections = new Map();

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Register user connection
      if (data.type === 'register' && data.userId) {
        connections.set(data.userId, ws);
        console.log(`User ${data.userId} registered for notifications`);
        ws.send(JSON.stringify({ type: 'registered', userId: data.userId }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    // Remove connection
    for (const [userId, socket] of connections.entries()) {
      if (socket === ws) {
        connections.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Subscribe to notification channel
redisSub.subscribe('notifications', (message) => {
  try {
    const notification = JSON.parse(message);

    // Send to specific user via WebSocket
    const ws = connections.get(notification.userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(notification));
    }
  } catch (error) {
    console.error('Redis subscription error:', error);
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await redisClient.ping();
    res.json({
      status: 'OK',
      service: 'Notification Service',
      redis: 'connected',
      websockets: `${connections.size} active`
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      service: 'Notification Service',
      redis: 'disconnected'
    });
  }
});

// Create notification
app.post('/api/notifications', async (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;

    if (!userId || !type || !message) {
      return res.status(400).json({ error: 'userId, type, and message are required' });
    }

    const notification = {
      id: Date.now().toString(),
      userId,
      type,
      title: title || 'New Notification',
      message,
      data: data || {},
      read: false,
      createdAt: new Date().toISOString()
    };

    // Store in Redis (sorted set by timestamp)
    await redisClient.zAdd(
      `notifications:${userId}`,
      { score: Date.now(), value: JSON.stringify(notification) }
    );

    // Publish to Redis Pub/Sub for real-time delivery
    await redisPub.publish('notifications', JSON.stringify(notification));

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const limit = parseInt(req.query.limit) || 50;

    // Get notifications from Redis sorted set (newest first)
    const notifications = await redisClient.zRange(
      `notifications:${userId}`,
      0,
      limit - 1,
      { REV: true }
    );

    const parsedNotifications = notifications.map(n => JSON.parse(n));

    res.json({
      notifications: parsedNotifications,
      total: parsedNotifications.length,
      unread: parsedNotifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const notificationId = req.params.id;

    // Get all notifications
    const notifications = await redisClient.zRange(
      `notifications:${userId}`,
      0,
      -1
    );

    // Find and update the notification
    let updated = false;
    for (const n of notifications) {
      const notification = JSON.parse(n);
      if (notification.id === notificationId) {
        notification.read = true;

        // Remove old and add updated
        await redisClient.zRem(`notifications:${userId}`, n);
        await redisClient.zAdd(
          `notifications:${userId}`,
          { score: parseInt(notification.id), value: JSON.stringify(notification) }
        );

        updated = true;
        break;
      }
    }

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all as read
app.put('/api/notifications/read-all', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const notifications = await redisClient.zRange(
      `notifications:${userId}`,
      0,
      -1
    );

    // Update all notifications
    for (const n of notifications) {
      const notification = JSON.parse(n);
      notification.read = true;

      await redisClient.zRem(`notifications:${userId}`, n);
      await redisClient.zAdd(
        `notifications:${userId}`,
        { score: parseInt(notification.id), value: JSON.stringify(notification) }
      );
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const notificationId = req.params.id;

    const notifications = await redisClient.zRange(
      `notifications:${userId}`,
      0,
      -1
    );

    let deleted = false;
    for (const n of notifications) {
      const notification = JSON.parse(n);
      if (notification.id === notificationId) {
        await redisClient.zRem(`notifications:${userId}`, n);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear all notifications
app.delete('/api/notifications', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    await redisClient.del(`notifications:${userId}`);
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Notification types helper endpoint
app.get('/api/notifications/types', (req, res) => {
  res.json({
    types: [
      'like',
      'comment',
      'follow',
      'mention',
      'reply',
      'system'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);
  console.log(`📡 WebSocket server available at ws://localhost:${PORT}/ws`);
});
