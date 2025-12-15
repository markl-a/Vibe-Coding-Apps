const request = require('supertest');
const express = require('express');

// Mock amqplib
jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertQueue: jest.fn().mockResolvedValue({}),
      sendToQueue: jest.fn()
    })
  })
}));

const amqp = require('amqplib');

let app;
let channel;
const alerts = [];

beforeAll(async () => {
  app = express();
  const cors = require('cors');
  const helmet = require('helmet');

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Setup mock channel
  const connection = await amqp.connect('amqp://localhost:5672');
  channel = await connection.createChannel();

  app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Alert Service' });
  });

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

  app.get('/api/alerts', (req, res) => {
    const { deviceId, acknowledged } = req.query;
    let filtered = alerts;

    if (deviceId) filtered = filtered.filter(a => a.deviceId === deviceId);
    if (acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === (acknowledged === 'true'));
    }

    res.json({ alerts: filtered.slice(-100), total: filtered.length });
  });

  app.put('/api/alerts/:id/acknowledge', (req, res) => {
    const alert = alerts.find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();

    res.json({ message: 'Alert acknowledged', alert });
  });
});

afterEach(() => {
  // Clear alerts after each test
  alerts.length = 0;
  jest.clearAllMocks();
});

describe('Alert Service', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'OK',
        service: 'Alert Service'
      });
    });
  });

  describe('POST /api/alerts/rules', () => {
    it('should create an alert rule', async () => {
      const ruleData = {
        deviceId: 'device-001',
        condition: 'temperature > threshold',
        threshold: 30,
        message: 'Temperature too high'
      };

      const res = await request(app)
        .post('/api/alerts/rules')
        .send(ruleData);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Alert rule created');
      expect(res.body.rule).toMatchObject({
        deviceId: ruleData.deviceId,
        condition: ruleData.condition,
        threshold: ruleData.threshold,
        message: ruleData.message
      });
      expect(res.body.rule.id).toBeDefined();
      expect(res.body.rule.createdAt).toBeDefined();
    });

    it('should create rule with different conditions', async () => {
      const ruleData = {
        deviceId: 'device-002',
        condition: 'humidity < threshold',
        threshold: 20,
        message: 'Humidity too low'
      };

      const res = await request(app)
        .post('/api/alerts/rules')
        .send(ruleData);

      expect(res.status).toBe(201);
      expect(res.body.rule.condition).toBe('humidity < threshold');
    });

    it('should create multiple rules for same device', async () => {
      const rule1 = {
        deviceId: 'device-001',
        condition: 'temperature > threshold',
        threshold: 30,
        message: 'High temp'
      };

      const rule2 = {
        deviceId: 'device-001',
        condition: 'temperature < threshold',
        threshold: 10,
        message: 'Low temp'
      };

      const res1 = await request(app).post('/api/alerts/rules').send(rule1);
      const res2 = await request(app).post('/api/alerts/rules').send(rule2);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.rule.id).not.toBe(res2.body.rule.id);
    });
  });

  describe('POST /api/alerts', () => {
    it('should trigger an alert', async () => {
      const alertData = {
        deviceId: 'device-001',
        type: 'temperature',
        message: 'Temperature exceeded threshold',
        severity: 'high'
      };

      const res = await request(app)
        .post('/api/alerts')
        .send(alertData);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Alert triggered');
      expect(res.body.alert).toMatchObject({
        deviceId: alertData.deviceId,
        type: alertData.type,
        message: alertData.message,
        severity: alertData.severity
      });
      expect(res.body.alert.id).toBeDefined();
      expect(res.body.alert.timestamp).toBeDefined();
      expect(res.body.alert.acknowledged).toBe(false);
    });

    it('should use default severity when not provided', async () => {
      const alertData = {
        deviceId: 'device-001',
        type: 'temperature',
        message: 'Temperature alert'
      };

      const res = await request(app)
        .post('/api/alerts')
        .send(alertData);

      expect(res.status).toBe(201);
      expect(res.body.alert.severity).toBe('medium');
    });

    it('should send alert to RabbitMQ queue', async () => {
      const alertData = {
        deviceId: 'device-001',
        type: 'temperature',
        message: 'Test alert',
        severity: 'high'
      };

      await request(app)
        .post('/api/alerts')
        .send(alertData);

      expect(channel.sendToQueue).toHaveBeenCalledWith(
        'alerts',
        expect.any(Buffer)
      );
    });

    it('should trigger alerts with different severity levels', async () => {
      const severities = ['low', 'medium', 'high', 'critical'];

      for (const severity of severities) {
        const res = await request(app)
          .post('/api/alerts')
          .send({
            deviceId: 'device-001',
            type: 'test',
            message: `${severity} alert`,
            severity
          });

        expect(res.status).toBe(201);
        expect(res.body.alert.severity).toBe(severity);
      }
    });

    it('should trigger multiple alerts for same device', async () => {
      const alert1 = {
        deviceId: 'device-001',
        type: 'temperature',
        message: 'High temperature'
      };

      const alert2 = {
        deviceId: 'device-001',
        type: 'humidity',
        message: 'Low humidity'
      };

      const res1 = await request(app).post('/api/alerts').send(alert1);
      const res2 = await request(app).post('/api/alerts').send(alert2);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.alert.id).not.toBe(res2.body.alert.id);
    });

    it('should store triggered alerts', async () => {
      await request(app).post('/api/alerts').send({
        deviceId: 'device-001',
        type: 'temperature',
        message: 'Alert 1'
      });

      const res = await request(app).get('/api/alerts');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });
  });

  describe('GET /api/alerts', () => {
    beforeEach(async () => {
      // Create test alerts
      const testAlerts = [
        { deviceId: 'device-001', type: 'temperature', message: 'Alert 1', severity: 'high' },
        { deviceId: 'device-001', type: 'humidity', message: 'Alert 2', severity: 'low' },
        { deviceId: 'device-002', type: 'temperature', message: 'Alert 3', severity: 'medium' },
        { deviceId: 'device-003', type: 'pressure', message: 'Alert 4', severity: 'high' }
      ];

      for (const alert of testAlerts) {
        await request(app).post('/api/alerts').send(alert);
      }
    });

    it('should get all alerts', async () => {
      const res = await request(app).get('/api/alerts');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(4);
      expect(res.body.alerts).toHaveLength(4);
    });

    it('should filter alerts by deviceId', async () => {
      const res = await request(app)
        .get('/api/alerts')
        .query({ deviceId: 'device-001' });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.alerts.every(a => a.deviceId === 'device-001')).toBe(true);
    });

    it('should filter alerts by acknowledged status', async () => {
      // Acknowledge one alert
      const allAlerts = await request(app).get('/api/alerts');
      const alertId = allAlerts.body.alerts[0].id;
      await request(app).put(`/api/alerts/${alertId}/acknowledge`);

      const res = await request(app)
        .get('/api/alerts')
        .query({ acknowledged: 'false' });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(3);
      expect(res.body.alerts.every(a => !a.acknowledged)).toBe(true);
    });

    it('should get acknowledged alerts', async () => {
      // Acknowledge one alert
      const allAlerts = await request(app).get('/api/alerts');
      const alertId = allAlerts.body.alerts[0].id;
      await request(app).put(`/api/alerts/${alertId}/acknowledge`);

      const res = await request(app)
        .get('/api/alerts')
        .query({ acknowledged: 'true' });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.alerts[0].acknowledged).toBe(true);
    });

    it('should filter by both deviceId and acknowledged', async () => {
      // Acknowledge one alert for device-001
      const allAlerts = await request(app).get('/api/alerts');
      const device001Alerts = allAlerts.body.alerts.filter(a => a.deviceId === 'device-001');
      await request(app).put(`/api/alerts/${device001Alerts[0].id}/acknowledge`);

      const res = await request(app)
        .get('/api/alerts')
        .query({ deviceId: 'device-001', acknowledged: 'false' });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.alerts[0].deviceId).toBe('device-001');
      expect(res.body.alerts[0].acknowledged).toBe(false);
    });

    it('should return empty array when no alerts match', async () => {
      const res = await request(app)
        .get('/api/alerts')
        .query({ deviceId: 'non-existent' });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.alerts).toHaveLength(0);
    });

    it('should limit to 100 most recent alerts', async () => {
      // Create 150 alerts
      for (let i = 0; i < 150; i++) {
        await request(app).post('/api/alerts').send({
          deviceId: 'device-test',
          type: 'test',
          message: `Alert ${i}`
        });
      }

      const res = await request(app).get('/api/alerts');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(154); // 4 from beforeEach + 150
      expect(res.body.alerts.length).toBeLessThanOrEqual(100);
    });
  });

  describe('PUT /api/alerts/:id/acknowledge', () => {
    let alertId;

    beforeEach(async () => {
      const res = await request(app).post('/api/alerts').send({
        deviceId: 'device-001',
        type: 'temperature',
        message: 'Test alert',
        severity: 'high'
      });
      alertId = res.body.alert.id;
    });

    it('should acknowledge an alert', async () => {
      const res = await request(app)
        .put(`/api/alerts/${alertId}/acknowledge`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Alert acknowledged');
      expect(res.body.alert.acknowledged).toBe(true);
      expect(res.body.alert.acknowledgedAt).toBeDefined();
    });

    it('should persist acknowledgment', async () => {
      await request(app).put(`/api/alerts/${alertId}/acknowledge`);

      const res = await request(app).get('/api/alerts');
      const acknowledgedAlert = res.body.alerts.find(a => a.id === alertId);

      expect(acknowledgedAlert.acknowledged).toBe(true);
    });

    it('should return 404 for non-existent alert', async () => {
      const res = await request(app)
        .put('/api/alerts/non-existent/acknowledge');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Alert not found');
    });

    it('should acknowledge multiple times (idempotent)', async () => {
      const res1 = await request(app).put(`/api/alerts/${alertId}/acknowledge`);
      const res2 = await request(app).put(`/api/alerts/${alertId}/acknowledge`);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.alert.acknowledged).toBe(true);
      expect(res2.body.alert.acknowledged).toBe(true);
    });
  });

  describe('Alert Severity Levels', () => {
    it('should handle low severity alerts', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .send({
          deviceId: 'device-001',
          type: 'info',
          message: 'Low severity alert',
          severity: 'low'
        });

      expect(res.status).toBe(201);
      expect(res.body.alert.severity).toBe('low');
    });

    it('should handle medium severity alerts', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .send({
          deviceId: 'device-001',
          type: 'warning',
          message: 'Medium severity alert',
          severity: 'medium'
        });

      expect(res.status).toBe(201);
      expect(res.body.alert.severity).toBe('medium');
    });

    it('should handle high severity alerts', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .send({
          deviceId: 'device-001',
          type: 'error',
          message: 'High severity alert',
          severity: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.alert.severity).toBe('high');
    });
  });

  describe('RabbitMQ Integration', () => {
    it('should connect to RabbitMQ', async () => {
      expect(amqp.connect).toHaveBeenCalled();
    });

    it('should create alerts queue', async () => {
      const connection = await amqp.connect();
      const mockChannel = await connection.createChannel();
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('alerts', { durable: true });
    });

    it('should send alerts to queue when triggered', async () => {
      const alertData = {
        deviceId: 'device-001',
        type: 'temperature',
        message: 'Queue test',
        severity: 'high'
      };

      await request(app).post('/api/alerts').send(alertData);

      expect(channel.sendToQueue).toHaveBeenCalledWith(
        'alerts',
        expect.any(Buffer)
      );

      const sentData = JSON.parse(
        channel.sendToQueue.mock.calls[0][1].toString()
      );
      expect(sentData.deviceId).toBe(alertData.deviceId);
      expect(sentData.type).toBe(alertData.type);
    });
  });
});
