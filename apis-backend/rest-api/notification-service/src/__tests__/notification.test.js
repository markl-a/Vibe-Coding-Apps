const mongoose = require('mongoose');
const Notification = require('../models/notification');

describe('Notification Model', () => {
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
    await Notification.deleteMany({});
  });

  describe('Notification Creation', () => {
    test('should create a valid notification', async () => {
      const notificationData = {
        userId: new mongoose.Types.ObjectId(),
        type: 'push',
        channel: 'fcm',
        title: 'Test Notification',
        body: 'This is a test notification'
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification._id).toBeDefined();
      expect(savedNotification.title).toBe(notificationData.title);
      expect(savedNotification.body).toBe(notificationData.body);
      expect(savedNotification.status).toBe('pending');
      expect(savedNotification.priority).toBe('normal');
    });

    test('should fail to create notification without required fields', async () => {
      const notification = new Notification({
        type: 'push'
      });

      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
      expect(error.errors.channel).toBeDefined();
      expect(error.errors.title).toBeDefined();
      expect(error.errors.body).toBeDefined();
    });

    test('should enforce valid notification types', async () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'invalid-type',
        channel: 'fcm',
        title: 'Test',
        body: 'Test body'
      });

      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });

    test('should set default values correctly', async () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'push',
        channel: 'fcm',
        title: 'Test',
        body: 'Test body'
      });

      const saved = await notification.save();

      expect(saved.status).toBe('pending');
      expect(saved.priority).toBe('normal');
      expect(saved.retryCount).toBe(0);
      expect(saved.data).toEqual({});
      expect(saved.metadata).toEqual({});
    });
  });

  describe('Notification Status Methods', () => {
    let notification;

    beforeEach(async () => {
      notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'push',
        channel: 'fcm',
        title: 'Test Notification',
        body: 'This is a test'
      });
      await notification.save();
    });

    test('should mark notification as sent', async () => {
      const beforeSent = notification.sentAt;
      await notification.markAsSent();

      expect(notification.status).toBe('sent');
      expect(notification.sentAt).toBeDefined();
      expect(notification.sentAt).not.toBe(beforeSent);
    });

    test('should mark notification as failed with error message', async () => {
      const errorMessage = 'Device token invalid';
      await notification.markAsFailed(errorMessage);

      expect(notification.status).toBe('failed');
      expect(notification.errorMessage).toBe(errorMessage);
      expect(notification.retryCount).toBe(1);
    });

    test('should increment retry count on multiple failures', async () => {
      await notification.markAsFailed('Error 1');
      expect(notification.retryCount).toBe(1);

      await notification.markAsFailed('Error 2');
      expect(notification.retryCount).toBe(2);

      await notification.markAsFailed('Error 3');
      expect(notification.retryCount).toBe(3);
    });

    test('should mark notification as delivered', async () => {
      await notification.markAsDelivered();

      expect(notification.status).toBe('delivered');
      expect(notification.deliveredAt).toBeDefined();
    });

    test('should mark notification as read', async () => {
      await notification.markAsRead();

      expect(notification.status).toBe('read');
      expect(notification.readAt).toBeDefined();
    });
  });

  describe('Notification Priority', () => {
    test('should create notification with high priority', async () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'push',
        channel: 'fcm',
        title: 'Urgent',
        body: 'This is urgent',
        priority: 'urgent'
      });

      const saved = await notification.save();
      expect(saved.priority).toBe('urgent');
    });

    test('should only accept valid priority values', async () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'push',
        channel: 'fcm',
        title: 'Test',
        body: 'Test',
        priority: 'invalid-priority'
      });

      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });

  describe('Notification Scheduling', () => {
    test('should create scheduled notification', async () => {
      const scheduledTime = new Date(Date.now() + 3600000); // 1 hour from now

      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'push',
        channel: 'fcm',
        title: 'Scheduled',
        body: 'This is scheduled',
        scheduledAt: scheduledTime
      });

      const saved = await notification.save();
      expect(saved.scheduledAt).toEqual(scheduledTime);
    });

    test('should identify expired scheduled notifications', async () => {
      const pastTime = new Date(Date.now() - 3600000); // 1 hour ago

      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'push',
        channel: 'fcm',
        title: 'Expired',
        body: 'This expired',
        scheduledAt: pastTime,
        status: 'pending'
      });

      await notification.save();
      expect(notification.isExpired).toBe(true);
    });
  });

  describe('Notification Data and Metadata', () => {
    test('should store custom data', async () => {
      const customData = {
        action: 'view',
        itemId: '123',
        category: 'updates'
      };

      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'push',
        channel: 'fcm',
        title: 'Test',
        body: 'Test',
        data: customData
      });

      const saved = await notification.save();
      expect(saved.data).toEqual(customData);
    });

    test('should store metadata', async () => {
      const metadata = {
        source: 'api',
        version: '1.0',
        campaign: 'summer-sale'
      };

      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'email',
        channel: 'sendgrid',
        title: 'Test',
        body: 'Test',
        metadata
      });

      const saved = await notification.save();
      expect(saved.metadata).toEqual(metadata);
    });
  });
});
