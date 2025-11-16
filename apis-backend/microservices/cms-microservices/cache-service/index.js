const express = require('express');
const { createClient } = require('redis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 6004;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

app.use(cors());
app.use(express.json());

const redisClient = createClient({ url: REDIS_URL });

redisClient.connect()
  .then(() => console.log('✅ Connected to Redis (Cache)'))
  .catch(err => console.error('❌ Redis error:', err));

app.get('/health', async (req, res) => {
  try {
    await redisClient.ping();
    res.json({ status: 'OK', service: 'Cache Service', redis: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', service: 'Cache Service' });
  }
});

// Get cache
app.get('/api/cache/:key', async (req, res) => {
  try {
    const value = await redisClient.get(req.params.key);

    if (!value) {
      return res.status(404).json({ error: 'Key not found' });
    }

    res.json({ key: req.params.key, value: JSON.parse(value) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Set cache
app.post('/api/cache/:key', async (req, res) => {
  try {
    const { value, ttl = 3600 } = req.body;

    await redisClient.set(
      req.params.key,
      JSON.stringify(value),
      { EX: ttl }
    );

    res.status(201).json({
      message: 'Cache set',
      key: req.params.key,
      ttl
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete cache
app.delete('/api/cache/:key', async (req, res) => {
  try {
    const result = await redisClient.del(req.params.key);

    if (result === 0) {
      return res.status(404).json({ error: 'Key not found' });
    }

    res.json({ message: 'Cache deleted', key: req.params.key });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear all cache
app.delete('/api/cache', async (req, res) => {
  try {
    await redisClient.flushAll();
    res.json({ message: 'All cache cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get cache stats
app.get('/api/cache/stats', async (req, res) => {
  try {
    const info = await redisClient.info('stats');
    const dbSize = await redisClient.dbSize();

    res.json({
      keys: dbSize,
      info: info
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Cache Service running on port ${PORT}`);
});
