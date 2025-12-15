const mongoose = require('mongoose');
const NotificationPreference = require('../models/notificationPreference');

describe('NotificationPreference Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/notification-service-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await NotificationPreference.deleteMany({});
  });

  describe('Preference Creation', () => {
    test('should create preference with default values', async () => {
      const userId = new mongoose.Types.ObjectId();
      const preference = new NotificationPreference({ userId });
      const saved = await preference.save();

      expect(saved.preferences.push.enabled).toBe(true);
      expect(saved.preferences.email.enabled).toBe(true);
      expect(saved.preferences.sms.enabled).toBe(false);
      expect(saved.preferences.inApp.enabled).toBe(true);
    });

    test('should enforce unique userId', async () => {
      const userId = new mongoose.Types.ObjectId();

      const pref1 = new NotificationPreference({ userId });
      await pref1.save();

      const pref2 = new NotificationPreference({ userId });

      let error;
      try {
        await pref2.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });

    test('should set default category preferences', async () => {
      const preference = new NotificationPreference({
        userId: new mongoose.Types.ObjectId()
      });
      const saved = await preference.save();

      expect(saved.preferences.push.categories.marketing).toBe(true);
      expect(saved.preferences.push.categories.updates).toBe(true);
      expect(saved.preferences.push.categories.security).toBe(true);
      expect(saved.preferences.email.categories.marketing).toBe(false);
    });
  });

  describe('Quiet Hours', () => {
    test('should create preference with default quiet hours', async () => {
      const preference = new NotificationPreference({
        userId: new mongoose.Types.ObjectId()
      });
      const saved = await preference.save();

      expect(saved.quietHours.enabled).toBe(false);
      expect(saved.quietHours.start).toBe('22:00');
      expect(saved.quietHours.end).toBe('08:00');
      expect(saved.quietHours.timezone).toBe('UTC');
    });

    test('should validate time format for quiet hours', async () => {
      const preference = new NotificationPreference({
        userId: new mongoose.Types.ObjectId(),
        quietHours: {
          enabled: true,
          start: 'invalid-time',
          end: '08:00'
        }
      });

      let error;
      try {
        await preference.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });

    test('should check if current time is in quiet hours', async () => {
      const preference = new NotificationPreference({
        userId: new mongoose.Types.ObjectId(),
        quietHours: {
          enabled: true,
          start: '00:00',
          end: '23:59'
        }
      });

      await preference.save();
      expect(preference.isQuietHours()).toBe(true);
    });

    test('should return false when quiet hours disabled', async () => {
      const preference = new NotificationPreference({
        userId: new mongoose.Types.ObjectId(),
        quietHours: {
          enabled: false,
          start: '00:00',
          end: '23:59'
        }
      });

      await preference.save();
      expect(preference.isQuietHours()).toBe(false);
    });
  });

  describe('Notification Type Preferences', () => {
    let preference;

    beforeEach(async () => {
      preference = new NotificationPreference({
        userId: new mongoose.Types.ObjectId()
      });
      await preference.save();
    });

    test('should check if push notifications are enabled', () => {
      expect(preference.isNotificationEnabled('push')).toBe(true);
    });

    test('should check if email notifications are enabled', () => {
      expect(preference.isNotificationEnabled('email')).toBe(true);
    });

    test('should check if SMS notifications are disabled by default', () => {
      expect(preference.isNotificationEnabled('sms')).toBe(false);
    });

    test('should check category-specific preferences', () => {
      expect(preference.isNotificationEnabled('push', 'marketing')).toBe(true);
      expect(preference.isNotificationEnabled('email', 'marketing')).toBe(false);
    });

    test('should return false when notification type disabled', async () => {
      preference.preferences.push.enabled = false;
      await preference.save();

      expect(preference.isNotificationEnabled('push')).toBe(false);
      expect(preference.isNotificationEnabled('push', 'updates')).toBe(false);
    });
  });

  describe('Device Management', () => {
    let preference;

    beforeEach(async () => {
      preference = new NotificationPreference({
        userId: new mongoose.Types.ObjectId()
      });
      await preference.save();
    });

    test('should add new device', async () => {
      const token = 'device-token-123';
      const platform = 'ios';

      await preference.addDevice(token, platform);

      expect(preference.devices).toHaveLength(1);
      expect(preference.devices[0].token).toBe(token);
      expect(preference.devices[0].platform).toBe(platform);
      expect(preference.devices[0].active).toBe(true);
    });

    test('should update existing device on duplicate add', async () => {
      const token = 'device-token-123';
      const platform = 'ios';

      await preference.addDevice(token, platform);
      const firstAddTime = preference.devices[0].lastUsedAt;

      // Wait a bit and add again
      await new Promise(resolve => setTimeout(resolve, 100));
      await preference.addDevice(token, platform);

      expect(preference.devices).toHaveLength(1);
      expect(preference.devices[0].lastUsedAt.getTime()).toBeGreaterThan(firstAddTime.getTime());
    });

    test('should add multiple devices', async () => {
      await preference.addDevice('token-1', 'ios');
      await preference.addDevice('token-2', 'android');
      await preference.addDevice('token-3', 'web');

      expect(preference.devices).toHaveLength(3);
    });

    test('should remove device by token', async () => {
      await preference.addDevice('token-1', 'ios');
      await preference.addDevice('token-2', 'android');

      expect(preference.devices).toHaveLength(2);

      await preference.removeDevice('token-1');

      expect(preference.devices).toHaveLength(1);
      expect(preference.devices[0].token).toBe('token-2');
    });

    test('should reactivate inactive device', async () => {
      const token = 'device-token-123';
      await preference.addDevice(token, 'ios');

      preference.devices[0].active = false;
      await preference.save();

      await preference.addDevice(token, 'ios');

      expect(preference.devices[0].active).toBe(true);
    });
  });

  describe('Email Frequency Settings', () => {
    test('should set email frequency to daily', async () => {
      const preference = new NotificationPreference({
        userId: new mongoose.Types.ObjectId(),
        preferences: {
          email: {
            frequency: 'daily'
          }
        }
      });

      const saved = await preference.save();
      expect(saved.preferences.email.frequency).toBe('daily');
    });

    test('should only accept valid frequency values', async () => {
      const preference = new NotificationPreference({
        userId: new mongoose.Types.ObjectId(),
        preferences: {
          email: {
            frequency: 'invalid'
          }
        }
      });

      let error;
      try {
        await preference.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });

  describe('Custom Preference Updates', () => {
    test('should update specific category preferences', async () => {
      const preference = new NotificationPreference({
        userId: new mongoose.Types.ObjectId()
      });
      await preference.save();

      preference.preferences.push.categories.marketing = false;
      preference.preferences.email.categories.social = false;
      await preference.save();

      expect(preference.preferences.push.categories.marketing).toBe(false);
      expect(preference.preferences.email.categories.social).toBe(false);
    });

    test('should disable all push notifications', async () => {
      const preference = new NotificationPreference({
        userId: new mongoose.Types.ObjectId()
      });
      await preference.save();

      preference.preferences.push.enabled = false;
      await preference.save();

      expect(preference.isNotificationEnabled('push')).toBe(false);
    });
  });
});
