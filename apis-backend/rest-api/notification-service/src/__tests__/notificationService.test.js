const mongoose = require('mongoose');
const notificationService = require('../services/notificationService');
const Notification = require('../models/notification');
const NotificationPreference = require('../models/notificationPreference');
const pushNotificationService = require('../services/pushNotificationService');
const emailNotificationService = require('../services/emailNotificationService');

// Mock the external services
jest.mock('../services/pushNotificationService');
jest.mock('../services/emailNotificationService');

describe('NotificationService', () => {
  let userId;

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
    await NotificationPreference.deleteMany({});
    userId = new mongoose.Types.ObjectId();
    jest.clearAllMocks();
  });

  describe('Create Notification', () => {
    test('should create a new notification', async () => {
      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Test Title',
        'Test Body',
        { action: 'view' },
        { priority: 'high' }
      );

      expect(notification._id).toBeDefined();
      expect(notification.title).toBe('Test Title');
      expect(notification.body).toBe('Test Body');
      expect(notification.priority).toBe('high');
      expect(notification.data.action).toBe('view');
    });

    test('should create notification with default priority', async () => {
      const notification = await notificationService.createNotification(
        userId,
        'email',
        'sendgrid',
        'Email Test',
        'Email Body'
      );

      expect(notification.priority).toBe('normal');
    });

    test('should create scheduled notification', async () => {
      const scheduledTime = new Date(Date.now() + 3600000);
      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Scheduled',
        'Scheduled notification',
        {},
        { scheduledAt: scheduledTime }
      );

      expect(notification.scheduledAt).toEqual(scheduledTime);
    });
  });

  describe('Send Notification', () => {
    test('should send push notification successfully', async () => {
      // Create preference with device
      const preference = new NotificationPreference({ userId });
      await preference.addDevice('device-token-123', 'ios');

      // Mock successful push send
      pushNotificationService.sendToDevice.mockResolvedValue({
        success: true,
        messageId: 'msg-123'
      });

      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Test',
        'Test Body'
      );

      const result = await notificationService.sendNotification(notification._id);

      expect(result.success).toBe(true);
      expect(pushNotificationService.sendToDevice).toHaveBeenCalled();

      const updated = await Notification.findById(notification._id);
      expect(updated.status).toBe('delivered');
    });

    test('should send to multiple devices', async () => {
      const preference = new NotificationPreference({ userId });
      await preference.addDevice('token-1', 'ios');
      await preference.addDevice('token-2', 'android');

      pushNotificationService.sendToMultipleDevices.mockResolvedValue({
        success: true,
        successCount: 2
      });

      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Test',
        'Test'
      );

      const result = await notificationService.sendNotification(notification._id);

      expect(result.success).toBe(true);
      expect(pushNotificationService.sendToMultipleDevices).toHaveBeenCalledWith(
        expect.arrayContaining(['token-1', 'token-2']),
        expect.anything(),
        expect.anything()
      );
    });

    test('should block notification during quiet hours', async () => {
      const preference = new NotificationPreference({
        userId,
        quietHours: {
          enabled: true,
          start: '00:00',
          end: '23:59'
        }
      });
      await preference.save();

      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Test',
        'Test',
        {},
        { priority: 'normal' }
      );

      const result = await notificationService.sendNotification(notification._id);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('quiet_hours');
    });

    test('should allow urgent notifications during quiet hours', async () => {
      const preference = new NotificationPreference({
        userId,
        quietHours: {
          enabled: true,
          start: '00:00',
          end: '23:59'
        }
      });
      await preference.addDevice('token-1', 'ios');

      pushNotificationService.sendToDevice.mockResolvedValue({ success: true });

      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Urgent',
        'Urgent notification',
        {},
        { priority: 'urgent' }
      );

      const result = await notificationService.sendNotification(notification._id);

      expect(result.success).toBe(true);
    });

    test('should block disabled notification type', async () => {
      const preference = new NotificationPreference({
        userId,
        preferences: {
          push: {
            enabled: false
          }
        }
      });
      await preference.save();

      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Test',
        'Test'
      );

      const result = await notificationService.sendNotification(notification._id);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('disabled');
    });

    test('should send email notification', async () => {
      emailNotificationService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'email-123'
      });

      const notification = await notificationService.createNotification(
        userId,
        'email',
        'sendgrid',
        'Email Test',
        'Email Body',
        { email: 'user@test.com' }
      );

      const result = await notificationService.sendNotification(notification._id);

      expect(result.success).toBe(true);
      expect(emailNotificationService.sendEmail).toHaveBeenCalled();
    });

    test('should mark notification as failed on error', async () => {
      const preference = new NotificationPreference({ userId });
      await preference.addDevice('token-1', 'ios');

      pushNotificationService.sendToDevice.mockResolvedValue({
        success: false,
        error: 'Invalid token'
      });

      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Test',
        'Test'
      );

      await notificationService.sendNotification(notification._id);

      const updated = await Notification.findById(notification._id);
      expect(updated.status).toBe('failed');
      expect(updated.errorMessage).toBe('Invalid token');
    });

    test('should throw error for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        notificationService.sendNotification(fakeId)
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('Get Notifications', () => {
    beforeEach(async () => {
      // Create test notifications
      for (let i = 0; i < 5; i++) {
        await notificationService.createNotification(
          userId,
          'push',
          'fcm',
          `Notification ${i}`,
          `Body ${i}`,
          {},
          { priority: i % 2 === 0 ? 'high' : 'normal' }
        );
      }
    });

    test('should get all notifications for user', async () => {
      const result = await notificationService.getNotifications(userId);

      expect(result.notifications).toHaveLength(5);
      expect(result.total).toBe(5);
    });

    test('should filter by status', async () => {
      const notifications = await Notification.find({ userId });
      await notifications[0].markAsSent();
      await notifications[1].markAsSent();

      const result = await notificationService.getNotifications(userId, {
        status: 'sent'
      });

      expect(result.notifications).toHaveLength(2);
    });

    test('should filter by type', async () => {
      await notificationService.createNotification(
        userId,
        'email',
        'sendgrid',
        'Email',
        'Email body'
      );

      const result = await notificationService.getNotifications(userId, {
        type: 'email'
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].type).toBe('email');
    });

    test('should paginate results', async () => {
      const page1 = await notificationService.getNotifications(userId, {
        limit: 2,
        skip: 0
      });

      expect(page1.notifications).toHaveLength(2);
      expect(page1.page).toBe(1);
      expect(page1.pages).toBe(3);

      const page2 = await notificationService.getNotifications(userId, {
        limit: 2,
        skip: 2
      });

      expect(page2.notifications).toHaveLength(2);
      expect(page2.page).toBe(2);
    });

    test('should sort notifications', async () => {
      const result = await notificationService.getNotifications(userId, {
        sortBy: 'createdAt',
        sortOrder: 'asc'
      });

      expect(result.notifications[0].title).toBe('Notification 0');
    });
  });

  describe('Mark Notifications as Read', () => {
    test('should mark single notification as read', async () => {
      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Test',
        'Test'
      );

      await notification.markAsSent();

      const result = await notificationService.markAsRead(notification._id, userId);

      expect(result.status).toBe('read');
      expect(result.readAt).toBeDefined();
    });

    test('should throw error for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        notificationService.markAsRead(fakeId, userId)
      ).rejects.toThrow('Notification not found');
    });

    test('should mark all notifications as read', async () => {
      const notifications = [];
      for (let i = 0; i < 3; i++) {
        const notif = await notificationService.createNotification(
          userId,
          'push',
          'fcm',
          `Test ${i}`,
          `Body ${i}`
        );
        await notif.markAsSent();
        notifications.push(notif);
      }

      const result = await notificationService.markAllAsRead(userId);

      expect(result.modifiedCount).toBe(3);

      const updated = await Notification.find({ userId, status: 'read' });
      expect(updated).toHaveLength(3);
    });
  });

  describe('Delete Notification', () => {
    test('should delete notification', async () => {
      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Test',
        'Test'
      );

      await notificationService.deleteNotification(notification._id, userId);

      const deleted = await Notification.findById(notification._id);
      expect(deleted).toBeNull();
    });

    test('should throw error when deleting non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        notificationService.deleteNotification(fakeId, userId)
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('Unread Count', () => {
    test('should get unread notification count', async () => {
      for (let i = 0; i < 5; i++) {
        const notif = await notificationService.createNotification(
          userId,
          'push',
          'fcm',
          `Test ${i}`,
          `Body ${i}`
        );
        if (i < 3) {
          await notif.markAsSent();
        }
      }

      const result = await notificationService.getUnreadCount(userId);

      expect(result.count).toBe(3);
    });
  });

  describe('Scheduled Notifications', () => {
    test('should process scheduled notifications', async () => {
      const preference = new NotificationPreference({ userId });
      await preference.addDevice('token-1', 'ios');

      pushNotificationService.sendToDevice.mockResolvedValue({ success: true });

      // Create past scheduled notification
      const pastTime = new Date(Date.now() - 1000);
      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Scheduled',
        'Scheduled notification',
        {},
        { scheduledAt: pastTime }
      );

      const results = await notificationService.processScheduledNotifications();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    test('should not process future scheduled notifications', async () => {
      const futureTime = new Date(Date.now() + 3600000);
      await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Future',
        'Future notification',
        {},
        { scheduledAt: futureTime }
      );

      const results = await notificationService.processScheduledNotifications();

      expect(results).toHaveLength(0);
    });
  });

  describe('Retry Failed Notifications', () => {
    test('should retry failed notifications', async () => {
      const preference = new NotificationPreference({ userId });
      await preference.addDevice('token-1', 'ios');

      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Test',
        'Test'
      );

      await notification.markAsFailed('Network error');

      pushNotificationService.sendToDevice.mockResolvedValue({ success: true });

      const results = await notificationService.retryFailedNotifications(3);

      expect(results).toHaveLength(1);
      expect(pushNotificationService.sendToDevice).toHaveBeenCalled();
    });

    test('should not retry notifications exceeding max retries', async () => {
      const notification = await notificationService.createNotification(
        userId,
        'push',
        'fcm',
        'Test',
        'Test'
      );

      await notification.markAsFailed('Error 1');
      await notification.markAsFailed('Error 2');
      await notification.markAsFailed('Error 3');

      const results = await notificationService.retryFailedNotifications(3);

      expect(results).toHaveLength(0);
    });
  });
});
