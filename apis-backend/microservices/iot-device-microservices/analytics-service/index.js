const express = require('express');
const { createClient } = require('redis');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5003;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

app.use(cors());
app.use(express.json());

const redisClient = createClient({ url: REDIS_URL });
redisClient.connect().then(() => console.log('✅ Connected to Redis'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Analytics Service' });
});

// Get summary statistics
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const DEVICE_SERVICE = process.env.DEVICE_SERVICE_URL || 'http://localhost:5001';
    const devicesRes = await axios.get(`${DEVICE_SERVICE}/api/devices`);

    const total = devicesRes.data.total;
    const online = devicesRes.data.devices.filter(d => d.status === 'online').length;
    const offline = devicesRes.data.devices.filter(d => d.status === 'offline').length;

    const summary = {
      totalDevices: total,
      onlineDevices: online,
      offlineDevices: offline,
      uptime: total > 0 ? ((online / total) * 100).toFixed(2) + '%' : '0%',
      timestamp: new Date().toISOString()
    };

    await redisClient.set('analytics:summary', JSON.stringify(summary), { EX: 60 });

    res.json(summary);
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Device analytics
app.get('/api/analytics/device/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const DATA_SERVICE = process.env.DATA_SERVICE_URL || 'http://localhost:5002';

    const dataRes = await axios.get(`${DATA_SERVICE}/api/data/${id}?start=-24h`);

    const analytics = {
      deviceId: id,
      dataPoints: dataRes.data.count,
      period: '24h',
      timestamp: new Date().toISOString()
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Analytics Service running on port ${PORT}`);
});
