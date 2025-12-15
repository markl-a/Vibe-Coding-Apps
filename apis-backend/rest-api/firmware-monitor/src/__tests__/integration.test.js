const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const StatusReport = require('../models/StatusReport');
const User = require('../models/User');

jest.mock('../config/database', () => jest.fn());

describe('Integration Tests - Complete Workflow', () => {
  let authToken;
  let userId;
  let deviceId;

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
  });

  afterEach(async () => {
    await StatusReport.deleteMany({});
    await Alert.deleteMany({});
    await Device.deleteMany({});
    await User.deleteMany({});
  });

  describe('完整的設備監控流程', () => {
    test('應該完成從註冊到監控的完整流程', async () => {
      // 1. 用戶註冊
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin',
          email: 'admin@example.com',
          password: 'admin123'
        });

      expect(registerResponse.status).toBe(201);
      authToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user.id;

      // 2. 創建設備
      const deviceResponse = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'SENSOR-001',
          name: 'Temperature Sensor',
          type: 'sensor',
          firmwareVersion: '1.0.0',
          location: 'Server Room A',
          manufacturer: 'SensorCorp'
        });

      expect(deviceResponse.status).toBe(201);
      deviceId = deviceResponse.body.data.device._id;

      // 3. 提交正常狀態報告
      const normalReportResponse = await request(app)
        .post('/api/status-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: deviceId,
          cpuUsage: 45,
          memoryUsage: 60,
          temperature: 50,
          uptime: 86400,
          batteryLevel: 85
        });

      expect(normalReportResponse.status).toBe(201);

      // 4. 提交異常狀態報告（觸發告警）
      const alertReportResponse = await request(app)
        .post('/api/status-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: deviceId,
          cpuUsage: 95, // 超過閾值
          memoryUsage: 92, // 超過閾值
          temperature: 85, // 超過閾值
          uptime: 86400,
          batteryLevel: 15
        });

      expect(alertReportResponse.status).toBe(201);

      // 5. 檢查告警是否被創建
      const alertsResponse = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(alertsResponse.status).toBe(200);
      expect(alertsResponse.body.data.alerts.length).toBeGreaterThan(0);

      const criticalAlerts = alertsResponse.body.data.alerts.filter(a => a.severity === 'critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);

      // 6. 確認一個告警
      const alertId = alertsResponse.body.data.alerts[0]._id;
      const acknowledgeResponse = await request(app)
        .patch(`/api/alerts/${alertId}/acknowledge`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Investigating the issue' });

      expect(acknowledgeResponse.status).toBe(200);
      expect(acknowledgeResponse.body.data.alert.status).toBe('acknowledged');

      // 7. 解決告警
      const resolveResponse = await request(app)
        .patch(`/api/alerts/${alertId}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Issue resolved, service restarted' });

      expect(resolveResponse.status).toBe(200);
      expect(resolveResponse.body.data.alert.status).toBe('resolved');

      // 8. 獲取設備統計
      const deviceStatsResponse = await request(app)
        .get('/api/devices/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(deviceStatsResponse.status).toBe(200);
      expect(deviceStatsResponse.body.data.summary.total).toBe(1);

      // 9. 獲取告警統計
      const alertStatsResponse = await request(app)
        .get('/api/alerts/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(alertStatsResponse.status).toBe(200);
      expect(alertStatsResponse.body.data.total).toBeGreaterThan(0);

      // 10. 獲取設備最新狀態
      const latestStatusResponse = await request(app)
        .get(`/api/status-reports/device/${deviceId}/latest`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(latestStatusResponse.status).toBe(200);
      expect(latestStatusResponse.body.data.report.cpuUsage).toBe(95);

      // 11. 更新設備狀態為維護模式
      const updateStatusResponse = await request(app)
        .patch(`/api/devices/${deviceId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'maintenance' });

      expect(updateStatusResponse.status).toBe(200);
      expect(updateStatusResponse.body.data.device.status).toBe('maintenance');
    });

    test('應該正確處理多設備場景', async () => {
      // 註冊用戶
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin',
          email: 'admin@example.com',
          password: 'admin123'
        });

      authToken = registerResponse.body.data.token;

      // 創建多個設備
      const devices = [];
      for (let i = 1; i <= 5; i++) {
        const deviceResponse = await request(app)
          .post('/api/devices')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            deviceId: `DEV00${i}`,
            name: `Device ${i}`,
            type: i % 2 === 0 ? 'sensor' : 'gateway',
            firmwareVersion: '1.0.0'
          });

        devices.push(deviceResponse.body.data.device);
      }

      expect(devices).toHaveLength(5);

      // 為每個設備提交狀態報告
      for (const device of devices) {
        await request(app)
          .post('/api/status-reports')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            deviceId: device._id,
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            temperature: 40 + Math.random() * 40
          });
      }

      // 獲取所有設備
      const allDevicesResponse = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(allDevicesResponse.body.data.devices).toHaveLength(5);

      // 按類型過濾
      const sensorsResponse = await request(app)
        .get('/api/devices?type=sensor')
        .set('Authorization', `Bearer ${authToken}`);

      const gatewaysResponse = await request(app)
        .get('/api/devices?type=gateway')
        .set('Authorization', `Bearer ${authToken}`);

      expect(sensorsResponse.body.data.devices.length + gatewaysResponse.body.data.devices.length).toBe(5);
    });
  });

  describe('API 健康檢查', () => {
    test('應該返回 API 健康狀態', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Firmware Monitor API');
    });
  });

  describe('錯誤處理', () => {
    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = registerResponse.body.data.token;
    });

    test('應該正確處理 404 錯誤', async () => {
      const response = await request(app)
        .get('/api/nonexistent-route')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
    });

    test('應該正確處理無效的 ObjectId', async () => {
      const response = await request(app)
        .get('/api/devices/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
