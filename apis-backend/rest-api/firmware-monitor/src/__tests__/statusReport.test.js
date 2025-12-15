const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const StatusReport = require('../models/StatusReport');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const User = require('../models/User');

jest.mock('../config/database', () => jest.fn());

describe('Status Report API Tests', () => {
  let authToken;
  let userId;
  let deviceId;
  let reportId;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/firmware-monitor-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await StatusReport.deleteMany({});
    await Alert.deleteMany({});
    await Device.deleteMany({});
    await User.deleteMany({});

    // 創建測試用戶
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = userResponse.body.data.token;
    userId = userResponse.body.data.user.id;

    // 創建測試設備
    const device = await Device.create({
      deviceId: 'DEV001',
      name: 'Test Device',
      type: 'sensor',
      firmwareVersion: '1.0.0',
      userId: userId
    });
    deviceId = device._id;
  });

  afterEach(async () => {
    await StatusReport.deleteMany({});
    await Alert.deleteMany({});
    await Device.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/status-reports', () => {
    test('應該成功創建狀態報告', async () => {
      const reportData = {
        deviceId: deviceId,
        cpuUsage: 45,
        memoryUsage: 60,
        temperature: 55,
        uptime: 86400,
        networkStatus: {
          signalStrength: -50,
          bytesReceived: 1024000,
          bytesSent: 512000,
          latency: 25
        },
        batteryLevel: 85,
        firmwareVersion: '1.0.0',
        errorCount: 0,
        warningCount: 1
      };

      const response = await request(app)
        .post('/api/status-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.report.cpuUsage).toBe(45);
      expect(response.body.data.report.memoryUsage).toBe(60);
      expect(response.body.data.report.temperature).toBe(55);
      expect(response.body.message).toBe('Status report created successfully');

      reportId = response.body.data.report._id;
    });

    test('應該拒絕缺少設備 ID 的請求', async () => {
      const response = await request(app)
        .post('/api/status-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cpuUsage: 45,
          memoryUsage: 60
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_DEVICE_ID');
    });

    test('應該在 CPU 超過閾值時自動創建告警', async () => {
      const reportData = {
        deviceId: deviceId,
        cpuUsage: 95, // 超過默認閾值 80
        memoryUsage: 50,
        temperature: 50
      };

      await request(app)
        .post('/api/status-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData);

      // 檢查是否創建了告警
      const alerts = await Alert.find({ deviceId: deviceId, type: 'cpu' });
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('critical');
    });

    test('應該在記憶體超過閾值時自動創建告警', async () => {
      const reportData = {
        deviceId: deviceId,
        cpuUsage: 50,
        memoryUsage: 90, // 超過默認閾值 85
        temperature: 50
      };

      await request(app)
        .post('/api/status-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData);

      // 檢查是否創建了告警
      const alerts = await Alert.find({ deviceId: deviceId, type: 'memory' });
      expect(alerts.length).toBeGreaterThan(0);
    });

    test('應該在溫度超過閾值時自動創建告警', async () => {
      const reportData = {
        deviceId: deviceId,
        cpuUsage: 50,
        memoryUsage: 50,
        temperature: 90 // 超過默認閾值 75
      };

      await request(app)
        .post('/api/status-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData);

      // 檢查是否創建了告警
      const alerts = await Alert.find({ deviceId: deviceId, type: 'temperature' });
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('critical');
    });

    test('應該更新設備的最後在線時間', async () => {
      const beforeReport = await Device.findById(deviceId);
      const lastSeenBefore = beforeReport.lastSeen;

      // 等待一小段時間確保時間戳不同
      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post('/api/status-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: deviceId,
          cpuUsage: 50,
          memoryUsage: 50
        });

      const afterReport = await Device.findById(deviceId);
      expect(afterReport.lastSeen.getTime()).toBeGreaterThan(lastSeenBefore.getTime());
    });
  });

  describe('GET /api/status-reports', () => {
    beforeEach(async () => {
      const now = new Date();
      await StatusReport.create([
        {
          deviceId: deviceId,
          cpuUsage: 40,
          memoryUsage: 50,
          temperature: 45,
          timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
          userId: userId
        },
        {
          deviceId: deviceId,
          cpuUsage: 60,
          memoryUsage: 70,
          temperature: 55,
          timestamp: new Date(now.getTime() - 1800000), // 30 min ago
          userId: userId
        },
        {
          deviceId: deviceId,
          cpuUsage: 80,
          memoryUsage: 85,
          temperature: 65,
          timestamp: now,
          userId: userId
        }
      ]);
    });

    test('應該獲取所有狀態報告', async () => {
      const response = await request(app)
        .get('/api/status-reports')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reports).toHaveLength(3);
    });

    test('應該根據設備 ID 過濾報告', async () => {
      const response = await request(app)
        .get(`/api/status-reports?deviceId=${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.reports).toHaveLength(3);
      expect(response.body.data.reports.every(r => r.deviceId._id.toString() === deviceId.toString())).toBe(true);
    });

    test('應該根據日期範圍過濾報告', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 2000000).toISOString();
      const endDate = now.toISOString();

      const response = await request(app)
        .get(`/api/status-reports?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.reports).toHaveLength(2);
    });

    test('應該支持分頁', async () => {
      const response = await request(app)
        .get('/api/status-reports?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.reports).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/status-reports/:id', () => {
    beforeEach(async () => {
      const report = await StatusReport.create({
        deviceId: deviceId,
        cpuUsage: 50,
        memoryUsage: 60,
        temperature: 55,
        userId: userId
      });
      reportId = report._id;
    });

    test('應該獲取單個狀態報告詳情', async () => {
      const response = await request(app)
        .get(`/api/status-reports/${reportId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.report.cpuUsage).toBe(50);
    });

    test('應該返回 404 如果報告不存在', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/status-reports/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REPORT_NOT_FOUND');
    });
  });

  describe('GET /api/status-reports/device/:deviceId/latest', () => {
    beforeEach(async () => {
      const now = new Date();
      await StatusReport.create([
        {
          deviceId: deviceId,
          cpuUsage: 40,
          memoryUsage: 50,
          timestamp: new Date(now.getTime() - 3600000),
          userId: userId
        },
        {
          deviceId: deviceId,
          cpuUsage: 80,
          memoryUsage: 85,
          timestamp: now, // 最新的
          userId: userId
        }
      ]);
    });

    test('應該獲取設備的最新狀態報告', async () => {
      const response = await request(app)
        .get(`/api/status-reports/device/${deviceId}/latest`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.report.cpuUsage).toBe(80);
      expect(response.body.data.report.memoryUsage).toBe(85);
    });

    test('應該返回 404 如果設備沒有報告', async () => {
      const newDevice = await Device.create({
        deviceId: 'DEV002',
        name: 'New Device',
        type: 'sensor',
        firmwareVersion: '1.0.0',
        userId: userId
      });

      const response = await request(app)
        .get(`/api/status-reports/device/${newDevice._id}/latest`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NO_REPORTS');
    });
  });

  describe('GET /api/status-reports/device/:deviceId/stats', () => {
    beforeEach(async () => {
      const now = new Date();
      await StatusReport.create([
        {
          deviceId: deviceId,
          cpuUsage: 40,
          memoryUsage: 50,
          temperature: 50,
          errorCount: 1,
          warningCount: 2,
          timestamp: new Date(now.getTime() - 3600000),
          userId: userId
        },
        {
          deviceId: deviceId,
          cpuUsage: 60,
          memoryUsage: 70,
          temperature: 60,
          errorCount: 0,
          warningCount: 1,
          timestamp: new Date(now.getTime() - 1800000),
          userId: userId
        },
        {
          deviceId: deviceId,
          cpuUsage: 80,
          memoryUsage: 85,
          temperature: 70,
          errorCount: 2,
          warningCount: 3,
          timestamp: now,
          userId: userId
        }
      ]);
    });

    test('應該獲取設備狀態統計數據', async () => {
      const response = await request(app)
        .get(`/api/status-reports/device/${deviceId}/stats`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.avgCpuUsage).toBe(60);
      expect(response.body.data.stats.maxCpuUsage).toBe(80);
      expect(response.body.data.stats.avgMemoryUsage).toBeCloseTo(68.33, 1);
      expect(response.body.data.stats.maxMemoryUsage).toBe(85);
      expect(response.body.data.stats.totalErrors).toBe(3);
      expect(response.body.data.stats.totalWarnings).toBe(6);
      expect(response.body.data.stats.reportCount).toBe(3);
    });

    test('應該支持自定義時間範圍', async () => {
      const response = await request(app)
        .get(`/api/status-reports/device/${deviceId}/stats?hours=1`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.timeRange.hours).toBe(1);
    });
  });
});
