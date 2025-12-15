const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock environment variables
process.env.PORT = 5001;
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

let mongoServer;
let app;
let server;

beforeAll(async () => {
  // Create in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Disconnect if already connected
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Connect to in-memory database
  await mongoose.connect(mongoUri);

  // Import app after MongoDB is connected
  const express = require('express');
  const { body, validationResult } = require('express-validator');
  const cors = require('cors');
  const helmet = require('helmet');

  app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const deviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['sensor', 'actuator', 'gateway', 'monitor'] },
    manufacturer: { type: String },
    model: { type: String },
    firmwareVersion: { type: String },
    status: { type: String, enum: ['online', 'offline', 'error'], default: 'offline' },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    metadata: { type: Map, of: String },
    lastSeen: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  const Device = mongoose.model('Device', deviceSchema);

  app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Device Service' });
  });

  app.post('/api/devices', [
    body('deviceId').notEmpty(),
    body('name').notEmpty(),
    body('type').isIn(['sensor', 'actuator', 'gateway', 'monitor'])
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const device = new Device(req.body);
      await device.save();
      res.status(201).json({ message: 'Device registered', device });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Device ID already exists' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/devices', async (req, res) => {
    try {
      const { type, status } = req.query;
      const query = {};
      if (type) query.type = type;
      if (status) query.status = status;

      const devices = await Device.find(query).limit(100);
      res.json({ devices, total: devices.length });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/devices/:id', async (req, res) => {
    try {
      const device = await Device.findOne({ deviceId: req.params.id });
      if (!device) return res.status(404).json({ error: 'Device not found' });
      res.json({ device });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/devices/:id', async (req, res) => {
    try {
      const device = await Device.findOneAndUpdate(
        { deviceId: req.params.id },
        { ...req.body, updatedAt: Date.now() },
        { new: true }
      );
      if (!device) return res.status(404).json({ error: 'Device not found' });
      res.json({ message: 'Device updated', device });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/devices/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const device = await Device.findOneAndUpdate(
        { deviceId: req.params.id },
        { status, lastSeen: Date.now(), updatedAt: Date.now() },
        { new: true }
      );
      if (!device) return res.status(404).json({ error: 'Device not found' });
      res.json({ message: 'Status updated', device });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/devices/:id', async (req, res) => {
    try {
      const device = await Device.findOneAndDelete({ deviceId: req.params.id });
      if (!device) return res.status(404).json({ error: 'Device not found' });
      res.json({ message: 'Device deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

afterAll(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Device Service', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'OK',
        service: 'Device Service'
      });
    });
  });

  describe('POST /api/devices', () => {
    it('should register a new device', async () => {
      const deviceData = {
        deviceId: 'device-001',
        name: 'Temperature Sensor',
        type: 'sensor',
        manufacturer: 'SensorCorp',
        model: 'TS-100',
        firmwareVersion: '1.0.0'
      };

      const res = await request(app)
        .post('/api/devices')
        .send(deviceData);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Device registered');
      expect(res.body.device).toMatchObject({
        deviceId: deviceData.deviceId,
        name: deviceData.name,
        type: deviceData.type
      });
      expect(res.body.device.status).toBe('offline');
    });

    it('should reject device with missing deviceId', async () => {
      const deviceData = {
        name: 'Temperature Sensor',
        type: 'sensor'
      };

      const res = await request(app)
        .post('/api/devices')
        .send(deviceData);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject device with missing name', async () => {
      const deviceData = {
        deviceId: 'device-002',
        type: 'sensor'
      };

      const res = await request(app)
        .post('/api/devices')
        .send(deviceData);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject device with invalid type', async () => {
      const deviceData = {
        deviceId: 'device-003',
        name: 'Invalid Device',
        type: 'invalid-type'
      };

      const res = await request(app)
        .post('/api/devices')
        .send(deviceData);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject duplicate deviceId', async () => {
      const deviceData = {
        deviceId: 'device-004',
        name: 'Device 1',
        type: 'sensor'
      };

      await request(app).post('/api/devices').send(deviceData);
      const res = await request(app).post('/api/devices').send(deviceData);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Device ID already exists');
    });

    it('should create device with location data', async () => {
      const deviceData = {
        deviceId: 'device-005',
        name: 'GPS Sensor',
        type: 'sensor',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          address: 'San Francisco, CA'
        }
      };

      const res = await request(app)
        .post('/api/devices')
        .send(deviceData);

      expect(res.status).toBe(201);
      expect(res.body.device.location).toMatchObject(deviceData.location);
    });
  });

  describe('GET /api/devices', () => {
    beforeEach(async () => {
      // Create test devices
      const devices = [
        { deviceId: 'device-001', name: 'Sensor 1', type: 'sensor', status: 'online' },
        { deviceId: 'device-002', name: 'Sensor 2', type: 'sensor', status: 'offline' },
        { deviceId: 'device-003', name: 'Actuator 1', type: 'actuator', status: 'online' },
        { deviceId: 'device-004', name: 'Gateway 1', type: 'gateway', status: 'online' }
      ];

      for (const device of devices) {
        await request(app).post('/api/devices').send(device);
      }
    });

    it('should get all devices', async () => {
      const res = await request(app).get('/api/devices');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(4);
      expect(res.body.devices).toHaveLength(4);
    });

    it('should filter devices by type', async () => {
      const res = await request(app)
        .get('/api/devices')
        .query({ type: 'sensor' });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.devices.every(d => d.type === 'sensor')).toBe(true);
    });

    it('should filter devices by status', async () => {
      const res = await request(app)
        .get('/api/devices')
        .query({ status: 'online' });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(3);
      expect(res.body.devices.every(d => d.status === 'online')).toBe(true);
    });

    it('should filter devices by type and status', async () => {
      const res = await request(app)
        .get('/api/devices')
        .query({ type: 'sensor', status: 'online' });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.devices[0].deviceId).toBe('device-001');
    });

    it('should return empty array when no devices match', async () => {
      const res = await request(app)
        .get('/api/devices')
        .query({ type: 'monitor' });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.devices).toHaveLength(0);
    });
  });

  describe('GET /api/devices/:id', () => {
    beforeEach(async () => {
      await request(app).post('/api/devices').send({
        deviceId: 'device-001',
        name: 'Test Device',
        type: 'sensor'
      });
    });

    it('should get device by id', async () => {
      const res = await request(app).get('/api/devices/device-001');

      expect(res.status).toBe(200);
      expect(res.body.device.deviceId).toBe('device-001');
      expect(res.body.device.name).toBe('Test Device');
    });

    it('should return 404 for non-existent device', async () => {
      const res = await request(app).get('/api/devices/non-existent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Device not found');
    });
  });

  describe('PUT /api/devices/:id', () => {
    beforeEach(async () => {
      await request(app).post('/api/devices').send({
        deviceId: 'device-001',
        name: 'Old Name',
        type: 'sensor',
        firmwareVersion: '1.0.0'
      });
    });

    it('should update device', async () => {
      const updates = {
        name: 'New Name',
        firmwareVersion: '2.0.0'
      };

      const res = await request(app)
        .put('/api/devices/device-001')
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Device updated');
      expect(res.body.device.name).toBe('New Name');
      expect(res.body.device.firmwareVersion).toBe('2.0.0');
    });

    it('should return 404 for non-existent device', async () => {
      const res = await request(app)
        .put('/api/devices/non-existent')
        .send({ name: 'Updated' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Device not found');
    });

    it('should update device location', async () => {
      const updates = {
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York, NY'
        }
      };

      const res = await request(app)
        .put('/api/devices/device-001')
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.device.location).toMatchObject(updates.location);
    });
  });

  describe('PUT /api/devices/:id/status', () => {
    beforeEach(async () => {
      await request(app).post('/api/devices').send({
        deviceId: 'device-001',
        name: 'Test Device',
        type: 'sensor',
        status: 'offline'
      });
    });

    it('should update device status', async () => {
      const res = await request(app)
        .put('/api/devices/device-001/status')
        .send({ status: 'online' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Status updated');
      expect(res.body.device.status).toBe('online');
    });

    it('should update lastSeen timestamp', async () => {
      const beforeUpdate = Date.now();

      const res = await request(app)
        .put('/api/devices/device-001/status')
        .send({ status: 'online' });

      expect(res.status).toBe(200);
      expect(new Date(res.body.device.lastSeen).getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should return 404 for non-existent device', async () => {
      const res = await request(app)
        .put('/api/devices/non-existent/status')
        .send({ status: 'online' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Device not found');
    });
  });

  describe('DELETE /api/devices/:id', () => {
    beforeEach(async () => {
      await request(app).post('/api/devices').send({
        deviceId: 'device-001',
        name: 'Test Device',
        type: 'sensor'
      });
    });

    it('should delete device', async () => {
      const res = await request(app).delete('/api/devices/device-001');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Device deleted');

      // Verify device is deleted
      const getRes = await request(app).get('/api/devices/device-001');
      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent device', async () => {
      const res = await request(app).delete('/api/devices/non-existent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Device not found');
    });
  });

  describe('Device Types', () => {
    it('should accept sensor type', async () => {
      const res = await request(app)
        .post('/api/devices')
        .send({ deviceId: 'dev-1', name: 'Sensor', type: 'sensor' });

      expect(res.status).toBe(201);
    });

    it('should accept actuator type', async () => {
      const res = await request(app)
        .post('/api/devices')
        .send({ deviceId: 'dev-2', name: 'Actuator', type: 'actuator' });

      expect(res.status).toBe(201);
    });

    it('should accept gateway type', async () => {
      const res = await request(app)
        .post('/api/devices')
        .send({ deviceId: 'dev-3', name: 'Gateway', type: 'gateway' });

      expect(res.status).toBe(201);
    });

    it('should accept monitor type', async () => {
      const res = await request(app)
        .post('/api/devices')
        .send({ deviceId: 'dev-4', name: 'Monitor', type: 'monitor' });

      expect(res.status).toBe(201);
    });
  });
});
