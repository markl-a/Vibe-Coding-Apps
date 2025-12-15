const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Alert = require('../models/Alert');
const Device = require('../models/Device');
const User = require('../models/User');

jest.mock('../config/database', () => jest.fn());

describe('Alert API Tests', () => {
  let authToken;
  let userId;
  let deviceId;
  let alertId;

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
    await Alert.deleteMany({});
    await Device.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/alerts', () => {
    test('應該成功創建告警', async () => {
      const alertData = {
        deviceId: deviceId,
        severity: 'warning',
        type: 'cpu',
        message: 'CPU usage is high',
        value: 85,
        threshold: 80
      };

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(alertData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.severity).toBe('warning');
      expect(response.body.data.alert.type).toBe('cpu');
      expect(response.body.data.alert.status).toBe('active');
      expect(response.body.message).toBe('Alert created successfully');

      alertId = response.body.data.alert._id;
    });

    test('應該拒絕缺少必填字段的請求', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          severity: 'warning'
          // 缺少 deviceId, type, message
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    test('應該拒絕不存在的設備 ID', async () => {
      const fakeDeviceId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: fakeDeviceId,
          type: 'cpu',
          message: 'Test alert'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DEVICE_NOT_FOUND');
    });
  });

  describe('GET /api/alerts', () => {
    beforeEach(async () => {
      await Alert.create([
        {
          deviceId: deviceId,
          severity: 'critical',
          type: 'cpu',
          message: 'Critical CPU alert',
          status: 'active',
          userId: userId
        },
        {
          deviceId: deviceId,
          severity: 'warning',
          type: 'memory',
          message: 'Memory warning',
          status: 'acknowledged',
          userId: userId
        },
        {
          deviceId: deviceId,
          severity: 'info',
          type: 'network',
          message: 'Network info',
          status: 'resolved',
          userId: userId
        }
      ]);
    });

    test('應該獲取所有告警', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toHaveLength(3);
    });

    test('應該根據嚴重性過濾告警', async () => {
      const response = await request(app)
        .get('/api/alerts?severity=critical')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.alerts).toHaveLength(1);
      expect(response.body.data.alerts[0].severity).toBe('critical');
    });

    test('應該根據類型過濾告警', async () => {
      const response = await request(app)
        .get('/api/alerts?type=memory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.alerts).toHaveLength(1);
      expect(response.body.data.alerts[0].type).toBe('memory');
    });

    test('應該根據狀態過濾告警', async () => {
      const response = await request(app)
        .get('/api/alerts?status=active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.alerts).toHaveLength(1);
      expect(response.body.data.alerts[0].status).toBe('active');
    });

    test('應該根據設備 ID 過濾告警', async () => {
      const response = await request(app)
        .get(`/api/alerts?deviceId=${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.alerts).toHaveLength(3);
    });
  });

  describe('GET /api/alerts/:id', () => {
    beforeEach(async () => {
      const alert = await Alert.create({
        deviceId: deviceId,
        severity: 'warning',
        type: 'cpu',
        message: 'Test alert',
        userId: userId
      });
      alertId = alert._id;
    });

    test('應該獲取單個告警詳情', async () => {
      const response = await request(app)
        .get(`/api/alerts/${alertId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.message).toBe('Test alert');
    });

    test('應該返回 404 如果告警不存在', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/alerts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ALERT_NOT_FOUND');
    });
  });

  describe('PATCH /api/alerts/:id/acknowledge', () => {
    beforeEach(async () => {
      const alert = await Alert.create({
        deviceId: deviceId,
        severity: 'warning',
        type: 'cpu',
        message: 'Test alert',
        status: 'active',
        userId: userId
      });
      alertId = alert._id;
    });

    test('應該成功確認告警', async () => {
      const response = await request(app)
        .patch(`/api/alerts/${alertId}/acknowledge`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Acknowledged by admin' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.status).toBe('acknowledged');
      expect(response.body.data.alert.notes).toBe('Acknowledged by admin');
      expect(response.body.data.alert.acknowledgedBy).toBeDefined();
      expect(response.body.message).toBe('Alert acknowledged successfully');
    });

    test('應該拒絕確認非活動狀態的告警', async () => {
      // 先確認一次
      await request(app)
        .patch(`/api/alerts/${alertId}/acknowledge`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // 嘗試再次確認
      const response = await request(app)
        .patch(`/api/alerts/${alertId}/acknowledge`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ALERT_STATUS');
    });
  });

  describe('PATCH /api/alerts/:id/resolve', () => {
    beforeEach(async () => {
      const alert = await Alert.create({
        deviceId: deviceId,
        severity: 'warning',
        type: 'cpu',
        message: 'Test alert',
        status: 'active',
        userId: userId
      });
      alertId = alert._id;
    });

    test('應該成功解決告警', async () => {
      const response = await request(app)
        .patch(`/api/alerts/${alertId}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Issue resolved' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.status).toBe('resolved');
      expect(response.body.data.alert.notes).toBe('Issue resolved');
      expect(response.body.data.alert.resolvedBy).toBeDefined();
      expect(response.body.message).toBe('Alert resolved successfully');
    });

    test('應該拒絕解決已解決的告警', async () => {
      // 先解決一次
      await request(app)
        .patch(`/api/alerts/${alertId}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // 嘗試再次解決
      const response = await request(app)
        .patch(`/api/alerts/${alertId}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ALREADY_RESOLVED');
    });

    test('應該可以解決已確認的告警', async () => {
      // 先確認
      await request(app)
        .patch(`/api/alerts/${alertId}/acknowledge`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // 然後解決
      const response = await request(app)
        .patch(`/api/alerts/${alertId}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Fixed' });

      expect(response.status).toBe(200);
      expect(response.body.data.alert.status).toBe('resolved');
    });
  });

  describe('DELETE /api/alerts/:id', () => {
    beforeEach(async () => {
      const alert = await Alert.create({
        deviceId: deviceId,
        severity: 'warning',
        type: 'cpu',
        message: 'Test alert',
        userId: userId
      });
      alertId = alert._id;
    });

    test('應該成功刪除告警', async () => {
      const response = await request(app)
        .delete(`/api/alerts/${alertId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Alert deleted successfully');

      // 驗證告警已被刪除
      const alert = await Alert.findById(alertId);
      expect(alert).toBeNull();
    });
  });

  describe('GET /api/alerts/stats', () => {
    beforeEach(async () => {
      await Alert.create([
        {
          deviceId: deviceId,
          severity: 'critical',
          type: 'cpu',
          message: 'Alert 1',
          status: 'active',
          userId: userId
        },
        {
          deviceId: deviceId,
          severity: 'critical',
          type: 'memory',
          message: 'Alert 2',
          status: 'active',
          userId: userId
        },
        {
          deviceId: deviceId,
          severity: 'warning',
          type: 'temperature',
          message: 'Alert 3',
          status: 'acknowledged',
          userId: userId
        },
        {
          deviceId: deviceId,
          severity: 'info',
          type: 'network',
          message: 'Alert 4',
          status: 'resolved',
          userId: userId
        }
      ]);
    });

    test('應該獲取告警統計數據', async () => {
      const response = await request(app)
        .get('/api/alerts/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(4);
      expect(response.body.data.active).toBe(2);
      expect(response.body.data.acknowledged).toBe(1);
      expect(response.body.data.resolved).toBe(1);
      expect(response.body.data.critical).toBe(2);
      expect(response.body.data.warning).toBe(1);
    });
  });
});
