const request = require('supertest');
const express = require('express');
const axios = require('axios');

// Mock axios
jest.mock('axios');

// Mock Redis
const mockRedisClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  quit: jest.fn().mockResolvedValue(undefined)
};

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
}));

let app;

beforeAll(async () => {
  app = express();
  const cors = require('cors');
  const helmet = require('helmet');

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Analytics Service' });
  });

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

      await mockRedisClient.set('analytics:summary', JSON.stringify(summary), { EX: 60 });

      res.json(summary);
    } catch (error) {
      console.error('Summary error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

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
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Analytics Service', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'OK',
        service: 'Analytics Service'
      });
    });
  });

  describe('GET /api/analytics/summary', () => {
    it('should calculate summary statistics', async () => {
      const mockDevices = [
        { deviceId: 'dev-1', status: 'online' },
        { deviceId: 'dev-2', status: 'online' },
        { deviceId: 'dev-3', status: 'offline' },
        { deviceId: 'dev-4', status: 'online' }
      ];

      axios.get.mockResolvedValue({
        data: {
          devices: mockDevices,
          total: mockDevices.length
        }
      });

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalDevices).toBe(4);
      expect(res.body.onlineDevices).toBe(3);
      expect(res.body.offlineDevices).toBe(1);
      expect(res.body.uptime).toBe('75.00%');
      expect(res.body.timestamp).toBeDefined();
    });

    it('should handle all devices online', async () => {
      const mockDevices = [
        { deviceId: 'dev-1', status: 'online' },
        { deviceId: 'dev-2', status: 'online' }
      ];

      axios.get.mockResolvedValue({
        data: {
          devices: mockDevices,
          total: mockDevices.length
        }
      });

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalDevices).toBe(2);
      expect(res.body.onlineDevices).toBe(2);
      expect(res.body.offlineDevices).toBe(0);
      expect(res.body.uptime).toBe('100.00%');
    });

    it('should handle all devices offline', async () => {
      const mockDevices = [
        { deviceId: 'dev-1', status: 'offline' },
        { deviceId: 'dev-2', status: 'offline' }
      ];

      axios.get.mockResolvedValue({
        data: {
          devices: mockDevices,
          total: mockDevices.length
        }
      });

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalDevices).toBe(2);
      expect(res.body.onlineDevices).toBe(0);
      expect(res.body.offlineDevices).toBe(2);
      expect(res.body.uptime).toBe('0.00%');
    });

    it('should handle no devices', async () => {
      axios.get.mockResolvedValue({
        data: {
          devices: [],
          total: 0
        }
      });

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalDevices).toBe(0);
      expect(res.body.onlineDevices).toBe(0);
      expect(res.body.offlineDevices).toBe(0);
      expect(res.body.uptime).toBe('0%');
    });

    it('should call device service with correct URL', async () => {
      axios.get.mockResolvedValue({
        data: {
          devices: [],
          total: 0
        }
      });

      await request(app).get('/api/analytics/summary');

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:5001/api/devices'
      );
    });

    it('should cache results in Redis', async () => {
      const mockDevices = [
        { deviceId: 'dev-1', status: 'online' }
      ];

      axios.get.mockResolvedValue({
        data: {
          devices: mockDevices,
          total: 1
        }
      });

      await request(app).get('/api/analytics/summary');

      expect(mockRedisClient.set).toHaveBeenCalled();
      const cacheKey = mockRedisClient.set.mock.calls[0][0];
      const cacheValue = JSON.parse(mockRedisClient.set.mock.calls[0][1]);
      const cacheOptions = mockRedisClient.set.mock.calls[0][2];

      expect(cacheKey).toBe('analytics:summary');
      expect(cacheValue.totalDevices).toBe(1);
      expect(cacheOptions.EX).toBe(60);
    });

    it('should handle device service error', async () => {
      axios.get.mockRejectedValue(new Error('Service unavailable'));

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Server error');
    });

    it('should handle mixed device statuses', async () => {
      const mockDevices = [
        { deviceId: 'dev-1', status: 'online' },
        { deviceId: 'dev-2', status: 'offline' },
        { deviceId: 'dev-3', status: 'error' },
        { deviceId: 'dev-4', status: 'online' },
        { deviceId: 'dev-5', status: 'offline' }
      ];

      axios.get.mockResolvedValue({
        data: {
          devices: mockDevices,
          total: mockDevices.length
        }
      });

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalDevices).toBe(5);
      expect(res.body.onlineDevices).toBe(2);
      expect(res.body.offlineDevices).toBe(2);
      expect(res.body.uptime).toBe('40.00%');
    });

    it('should calculate correct uptime percentage', async () => {
      const mockDevices = [
        { deviceId: 'dev-1', status: 'online' },
        { deviceId: 'dev-2', status: 'online' },
        { deviceId: 'dev-3', status: 'offline' }
      ];

      axios.get.mockResolvedValue({
        data: {
          devices: mockDevices,
          total: mockDevices.length
        }
      });

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.uptime).toBe('66.67%');
    });
  });

  describe('GET /api/analytics/device/:id', () => {
    it('should get device analytics', async () => {
      const deviceId = 'device-001';
      const mockDataResponse = {
        data: {
          count: 1440,
          data: []
        }
      };

      axios.get.mockResolvedValue(mockDataResponse);

      const res = await request(app).get(`/api/analytics/device/${deviceId}`);

      expect(res.status).toBe(200);
      expect(res.body.deviceId).toBe(deviceId);
      expect(res.body.dataPoints).toBe(1440);
      expect(res.body.period).toBe('24h');
      expect(res.body.timestamp).toBeDefined();
    });

    it('should call data service with correct parameters', async () => {
      const deviceId = 'device-001';

      axios.get.mockResolvedValue({
        data: {
          count: 100,
          data: []
        }
      });

      await request(app).get(`/api/analytics/device/${deviceId}`);

      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:5002/api/data/${deviceId}?start=-24h`
      );
    });

    it('should handle zero data points', async () => {
      const deviceId = 'device-002';

      axios.get.mockResolvedValue({
        data: {
          count: 0,
          data: []
        }
      });

      const res = await request(app).get(`/api/analytics/device/${deviceId}`);

      expect(res.status).toBe(200);
      expect(res.body.dataPoints).toBe(0);
    });

    it('should handle large number of data points', async () => {
      const deviceId = 'device-003';

      axios.get.mockResolvedValue({
        data: {
          count: 86400, // One reading per second for 24h
          data: []
        }
      });

      const res = await request(app).get(`/api/analytics/device/${deviceId}`);

      expect(res.status).toBe(200);
      expect(res.body.dataPoints).toBe(86400);
    });

    it('should handle data service error', async () => {
      const deviceId = 'device-004';

      axios.get.mockRejectedValue(new Error('Data service unavailable'));

      const res = await request(app).get(`/api/analytics/device/${deviceId}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Server error');
    });

    it('should handle different device IDs', async () => {
      const deviceIds = ['dev-001', 'dev-002', 'dev-003'];

      for (const deviceId of deviceIds) {
        axios.get.mockResolvedValue({
          data: {
            count: 100,
            data: []
          }
        });

        const res = await request(app).get(`/api/analytics/device/${deviceId}`);

        expect(res.status).toBe(200);
        expect(res.body.deviceId).toBe(deviceId);
      }
    });

    it('should include timestamp in response', async () => {
      const deviceId = 'device-005';
      const beforeRequest = new Date().toISOString();

      axios.get.mockResolvedValue({
        data: {
          count: 50,
          data: []
        }
      });

      const res = await request(app).get(`/api/analytics/device/${deviceId}`);

      expect(res.status).toBe(200);
      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeRequest).getTime()
      );
    });

    it('should handle special characters in device ID', async () => {
      const deviceId = 'device-001_special';

      axios.get.mockResolvedValue({
        data: {
          count: 10,
          data: []
        }
      });

      const res = await request(app).get(`/api/analytics/device/${deviceId}`);

      expect(res.status).toBe(200);
      expect(res.body.deviceId).toBe(deviceId);
    });
  });

  describe('External Service Integration', () => {
    it('should handle timeout from device service', async () => {
      axios.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout'
      });

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Server error');
    });

    it('should handle 404 from data service', async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'Device not found' }
        }
      });

      const res = await request(app).get('/api/analytics/device/non-existent');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Server error');
    });

    it('should handle network error', async () => {
      axios.get.mockRejectedValue({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND localhost'
      });

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Server error');
    });
  });

  describe('Data Processing', () => {
    it('should correctly count online devices', async () => {
      const mockDevices = Array.from({ length: 10 }, (_, i) => ({
        deviceId: `dev-${i}`,
        status: i < 7 ? 'online' : 'offline'
      }));

      axios.get.mockResolvedValue({
        data: {
          devices: mockDevices,
          total: mockDevices.length
        }
      });

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.onlineDevices).toBe(7);
    });

    it('should correctly count offline devices', async () => {
      const mockDevices = Array.from({ length: 10 }, (_, i) => ({
        deviceId: `dev-${i}`,
        status: i < 3 ? 'online' : 'offline'
      }));

      axios.get.mockResolvedValue({
        data: {
          devices: mockDevices,
          total: mockDevices.length
        }
      });

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.offlineDevices).toBe(7);
    });

    it('should format uptime to 2 decimal places', async () => {
      const mockDevices = [
        { deviceId: 'dev-1', status: 'online' },
        { deviceId: 'dev-2', status: 'offline' },
        { deviceId: 'dev-3', status: 'offline' }
      ];

      axios.get.mockResolvedValue({
        data: {
          devices: mockDevices,
          total: mockDevices.length
        }
      });

      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.uptime).toMatch(/^\d+\.\d{2}%$/);
    });
  });

  describe('Redis Caching', () => {
    it('should set cache expiration to 60 seconds', async () => {
      axios.get.mockResolvedValue({
        data: {
          devices: [],
          total: 0
        }
      });

      await request(app).get('/api/analytics/summary');

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'analytics:summary',
        expect.any(String),
        { EX: 60 }
      );
    });

    it('should cache complete summary data', async () => {
      const mockDevices = [
        { deviceId: 'dev-1', status: 'online' },
        { deviceId: 'dev-2', status: 'offline' }
      ];

      axios.get.mockResolvedValue({
        data: {
          devices: mockDevices,
          total: mockDevices.length
        }
      });

      await request(app).get('/api/analytics/summary');

      const cachedData = JSON.parse(mockRedisClient.set.mock.calls[0][1]);
      expect(cachedData).toHaveProperty('totalDevices');
      expect(cachedData).toHaveProperty('onlineDevices');
      expect(cachedData).toHaveProperty('offlineDevices');
      expect(cachedData).toHaveProperty('uptime');
      expect(cachedData).toHaveProperty('timestamp');
    });
  });
});
