const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Device = require('../models/Device');
const User = require('../models/User');

// Mock database connection
jest.mock('../config/database', () => jest.fn());

describe('Device API Tests', () => {
  let authToken;
  let userId;
  let deviceId;

  beforeAll(async () => {
    // Mock MongoDB connection
    await mongoose.connect('mongodb://localhost:27017/firmware-monitor-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await Device.deleteMany({});
    await User.deleteMany({});

    // Create a test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = userResponse.body.data.token;
    userId = userResponse.body.data.user.id;
  });

  afterEach(async () => {
    await Device.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/devices', () => {
    test('應該成功創建設備', async () => {
      const deviceData = {
        deviceId: 'DEV001',
        name: 'Test Device',
        type: 'sensor',
        firmwareVersion: '1.0.0',
        location: 'Lab A',
        manufacturer: 'TestCorp'
      };

      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deviceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.device.deviceId).toBe('DEV001');
      expect(response.body.data.device.name).toBe('Test Device');
      expect(response.body.message).toBe('Device created successfully');

      deviceId = response.body.data.device._id;
    });

    test('應該拒絕缺少必填字段的請求', async () => {
      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Device'
          // 缺少 deviceId 和 firmwareVersion
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    test('應該拒絕重複的設備 ID', async () => {
      const deviceData = {
        deviceId: 'DEV002',
        name: 'Device 1',
        firmwareVersion: '1.0.0'
      };

      // 第一次創建
      await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deviceData);

      // 嘗試用相同 deviceId 再次創建
      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deviceData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DEVICE_ALREADY_EXISTS');
    });

    test('應該拒絕未授權的請求', async () => {
      const response = await request(app)
        .post('/api/devices')
        .send({
          deviceId: 'DEV003',
          name: 'Test Device',
          firmwareVersion: '1.0.0'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/devices', () => {
    beforeEach(async () => {
      // 創建測試設備
      await Device.create([
        {
          deviceId: 'DEV001',
          name: 'Sensor 1',
          type: 'sensor',
          firmwareVersion: '1.0.0',
          status: 'online',
          userId: userId
        },
        {
          deviceId: 'DEV002',
          name: 'Gateway 1',
          type: 'gateway',
          firmwareVersion: '1.1.0',
          status: 'offline',
          userId: userId
        },
        {
          deviceId: 'DEV003',
          name: 'Controller 1',
          type: 'controller',
          firmwareVersion: '2.0.0',
          status: 'online',
          userId: userId
        }
      ]);
    });

    test('應該獲取所有設備', async () => {
      const response = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.devices).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    test('應該根據狀態過濾設備', async () => {
      const response = await request(app)
        .get('/api/devices?status=online')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.devices).toHaveLength(2);
      expect(response.body.data.devices.every(d => d.status === 'online')).toBe(true);
    });

    test('應該根據類型過濾設備', async () => {
      const response = await request(app)
        .get('/api/devices?type=sensor')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.devices).toHaveLength(1);
      expect(response.body.data.devices[0].type).toBe('sensor');
    });

    test('應該支持搜索功能', async () => {
      const response = await request(app)
        .get('/api/devices?search=Gateway')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.devices).toHaveLength(1);
      expect(response.body.data.devices[0].name).toContain('Gateway');
    });

    test('應該支持分頁', async () => {
      const response = await request(app)
        .get('/api/devices?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.devices).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.pages).toBe(2);
    });
  });

  describe('GET /api/devices/:id', () => {
    beforeEach(async () => {
      const device = await Device.create({
        deviceId: 'DEV001',
        name: 'Test Device',
        type: 'sensor',
        firmwareVersion: '1.0.0',
        userId: userId
      });
      deviceId = device._id;
    });

    test('應該獲取單個設備詳情', async () => {
      const response = await request(app)
        .get(`/api/devices/${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.device.deviceId).toBe('DEV001');
    });

    test('應該返回 404 如果設備不存在', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/devices/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DEVICE_NOT_FOUND');
    });
  });

  describe('PUT /api/devices/:id', () => {
    beforeEach(async () => {
      const device = await Device.create({
        deviceId: 'DEV001',
        name: 'Test Device',
        type: 'sensor',
        firmwareVersion: '1.0.0',
        userId: userId
      });
      deviceId = device._id;
    });

    test('應該成功更新設備', async () => {
      const updateData = {
        name: 'Updated Device',
        firmwareVersion: '2.0.0',
        location: 'New Location'
      };

      const response = await request(app)
        .put(`/api/devices/${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.device.name).toBe('Updated Device');
      expect(response.body.data.device.firmwareVersion).toBe('2.0.0');
      expect(response.body.data.device.location).toBe('New Location');
    });
  });

  describe('PATCH /api/devices/:id/status', () => {
    beforeEach(async () => {
      const device = await Device.create({
        deviceId: 'DEV001',
        name: 'Test Device',
        type: 'sensor',
        firmwareVersion: '1.0.0',
        status: 'offline',
        userId: userId
      });
      deviceId = device._id;
    });

    test('應該成功更新設備狀態', async () => {
      const response = await request(app)
        .patch(`/api/devices/${deviceId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'online' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.device.status).toBe('online');
    });

    test('應該拒絕無效的狀態值', async () => {
      const response = await request(app)
        .patch(`/api/devices/${deviceId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });
  });

  describe('DELETE /api/devices/:id', () => {
    beforeEach(async () => {
      const device = await Device.create({
        deviceId: 'DEV001',
        name: 'Test Device',
        type: 'sensor',
        firmwareVersion: '1.0.0',
        userId: userId
      });
      deviceId = device._id;
    });

    test('應該成功刪除設備', async () => {
      const response = await request(app)
        .delete(`/api/devices/${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Device deleted successfully');

      // 驗證設備已被刪除
      const device = await Device.findById(deviceId);
      expect(device).toBeNull();
    });
  });

  describe('GET /api/devices/stats', () => {
    beforeEach(async () => {
      await Device.create([
        {
          deviceId: 'DEV001',
          name: 'Device 1',
          type: 'sensor',
          firmwareVersion: '1.0.0',
          status: 'online',
          userId: userId
        },
        {
          deviceId: 'DEV002',
          name: 'Device 2',
          type: 'sensor',
          firmwareVersion: '1.0.0',
          status: 'online',
          userId: userId
        },
        {
          deviceId: 'DEV003',
          name: 'Device 3',
          type: 'gateway',
          firmwareVersion: '1.0.0',
          status: 'offline',
          userId: userId
        },
        {
          deviceId: 'DEV004',
          name: 'Device 4',
          type: 'controller',
          firmwareVersion: '1.0.0',
          status: 'error',
          userId: userId
        }
      ]);
    });

    test('應該獲取設備統計數據', async () => {
      const response = await request(app)
        .get('/api/devices/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.total).toBe(4);
      expect(response.body.data.summary.online).toBe(2);
      expect(response.body.data.summary.offline).toBe(1);
      expect(response.body.data.summary.error).toBe(1);
      expect(response.body.data.byType).toHaveLength(3);
    });
  });
});
