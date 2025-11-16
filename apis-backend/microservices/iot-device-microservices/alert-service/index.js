const express = require('express');
const amqp = require('amqplib');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5004;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

app.use(cors());
app.use(express.json());

let channel;
const alerts = [];

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('alerts', { durable: true });
    console.log('✅ Connected to RabbitMQ');
  } catch (error) {
    console.error('❌ RabbitMQ connection error:', error);
    setTimeout(connectRabbitMQ, 5000);
  }
};

connectRabbitMQ();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Alert Service' });
});

// Create alert rule
app.post('/api/alerts/rules', (req, res) => {
  const { deviceId, condition, threshold, message } = req.body;
  const rule = {
    id: Date.now().toString(),
    deviceId,
    condition,
    threshold,
    message,
    createdAt: new Date().toISOString()
  };

  res.status(201).json({ message: 'Alert rule created', rule });
});

// Trigger alert
app.post('/api/alerts', async (req, res) => {
  try {
    const { deviceId, type, message, severity = 'medium' } = req.body;

    const alert = {
      id: Date.now().toString(),
      deviceId,
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    alerts.push(alert);

    if (channel) {
      channel.sendToQueue('alerts', Buffer.from(JSON.stringify(alert)));
    }

    res.status(201).json({ message: 'Alert triggered', alert });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get alerts
app.get('/api/alerts', (req, res) => {
  const { deviceId, acknowledged } = req.query;
  let filtered = alerts;

  if (deviceId) filtered = filtered.filter(a => a.deviceId === deviceId);
  if (acknowledged !== undefined) {
    filtered = filtered.filter(a => a.acknowledged === (acknowledged === 'true'));
  }

  res.json({ alerts: filtered.slice(-100), total: filtered.length });
});

// Acknowledge alert
app.put('/api/alerts/:id/acknowledge', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  alert.acknowledged = true;
  alert.acknowledgedAt = new Date().toISOString();

  res.json({ message: 'Alert acknowledged', alert });
});

app.listen(PORT, () => {
  console.log(`🚀 Alert Service running on port ${PORT}`);
});
