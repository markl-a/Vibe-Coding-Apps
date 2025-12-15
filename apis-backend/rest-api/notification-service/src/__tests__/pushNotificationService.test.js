const pushNotificationService = require('../services/pushNotificationService');

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const mockSend = jest.fn();
  const mockSendMulticast = jest.fn();
  const mockSubscribeToTopic = jest.fn();
  const mockUnsubscribeFromTopic = jest.fn();

  return {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn()
    },
    messaging: () => ({
      send: mockSend,
      sendMulticast: mockSendMulticast,
      subscribeToTopic: mockSubscribeToTopic,
      unsubscribeFromTopic: mockUnsubscribeFromTopic
    }),
    _getMockSend: () => mockSend,
    _getMockSendMulticast: () => mockSendMulticast,
    _getMockSubscribeToTopic: () => mockSubscribeToTopic,
    _getMockUnsubscribeFromTopic: () => mockUnsubscribeFromTopic
  };
});

const admin = require('firebase-admin');

describe('PushNotificationService', () => {
  beforeEach(() => {
    // Reset the service
    pushNotificationService.initialized = false;
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('should initialize Firebase Admin SDK', () => {
      const serviceAccount = {
        projectId: 'test-project',
        clientEmail: 'test@test.com',
        privateKey: 'test-key'
      };

      pushNotificationService.initialize(serviceAccount);

      expect(admin.initializeApp).toHaveBeenCalledWith({
        credential: expect.anything()
      });
      expect(pushNotificationService.initialized).toBe(true);
    });

    test('should not reinitialize if already initialized', () => {
      const serviceAccount = { projectId: 'test' };

      pushNotificationService.initialize(serviceAccount);
      pushNotificationService.initialize(serviceAccount);

      expect(admin.initializeApp).toHaveBeenCalledTimes(1);
    });

    test('should throw error on initialization failure', () => {
      admin.initializeApp.mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });

      expect(() => {
        pushNotificationService.initialize({});
      }).toThrow('Initialization failed');
    });
  });

  describe('Send to Single Device', () => {
    beforeEach(() => {
      pushNotificationService.initialize({ projectId: 'test' });
    });

    test('should send notification to single device', async () => {
      const mockSend = admin._getMockSend();
      mockSend.mockResolvedValue('message-id-123');

      const token = 'device-token-123';
      const notification = {
        title: 'Test Title',
        body: 'Test Body',
        priority: 'high'
      };
      const data = { action: 'view', itemId: '123' };

      const result = await pushNotificationService.sendToDevice(token, notification, data);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('message-id-123');
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        token,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: expect.objectContaining({
          action: 'view',
          itemId: '123'
        })
      }));
    });

    test('should handle send failure', async () => {
      const mockSend = admin._getMockSend();
      mockSend.mockRejectedValue({
        message: 'Invalid token',
        code: 'messaging/invalid-registration-token'
      });

      const result = await pushNotificationService.sendToDevice(
        'invalid-token',
        { title: 'Test', body: 'Test' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.code).toBe('messaging/invalid-registration-token');
    });

    test('should throw error if service not initialized', async () => {
      pushNotificationService.initialized = false;

      await expect(
        pushNotificationService.sendToDevice('token', { title: 'Test', body: 'Test' })
      ).rejects.toThrow('Push notification service not initialized');
    });

    test('should convert data to strings', async () => {
      const mockSend = admin._getMockSend();
      mockSend.mockResolvedValue('message-id');

      const data = {
        stringValue: 'test',
        numberValue: 123,
        objectValue: { nested: 'data' },
        boolValue: true
      };

      await pushNotificationService.sendToDevice(
        'token',
        { title: 'Test', body: 'Test' },
        data
      );

      const sentMessage = mockSend.mock.calls[0][0];
      expect(typeof sentMessage.data.stringValue).toBe('string');
      expect(typeof sentMessage.data.numberValue).toBe('string');
      expect(typeof sentMessage.data.objectValue).toBe('string');
      expect(typeof sentMessage.data.boolValue).toBe('string');
    });
  });

  describe('Send to Multiple Devices', () => {
    beforeEach(() => {
      pushNotificationService.initialize({ projectId: 'test' });
    });

    test('should send notification to multiple devices', async () => {
      const mockSendMulticast = admin._getMockSendMulticast();
      mockSendMulticast.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [
          { success: true, messageId: 'msg-1' },
          { success: true, messageId: 'msg-2' }
        ]
      });

      const tokens = ['token-1', 'token-2'];
      const notification = { title: 'Test', body: 'Test' };

      const result = await pushNotificationService.sendToMultipleDevices(tokens, notification);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    test('should handle partial failures', async () => {
      const mockSendMulticast = admin._getMockSendMulticast();
      mockSendMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 1,
        responses: [
          { success: true, messageId: 'msg-1' },
          { success: false, error: { message: 'Invalid token' } }
        ]
      });

      const result = await pushNotificationService.sendToMultipleDevices(
        ['token-1', 'token-2'],
        { title: 'Test', body: 'Test' }
      );

      expect(result.success).toBe(false);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });

    test('should return error for empty token array', async () => {
      const result = await pushNotificationService.sendToMultipleDevices(
        [],
        { title: 'Test', body: 'Test' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No tokens provided');
    });
  });

  describe('Topic Messaging', () => {
    beforeEach(() => {
      pushNotificationService.initialize({ projectId: 'test' });
    });

    test('should send notification to topic', async () => {
      const mockSend = admin._getMockSend();
      mockSend.mockResolvedValue('message-id-123');

      const result = await pushNotificationService.sendToTopic(
        'news',
        { title: 'Breaking News', body: 'Important update' },
        { category: 'news' }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('message-id-123');
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        topic: 'news'
      }));
    });

    test('should subscribe devices to topic', async () => {
      const mockSubscribe = admin._getMockSubscribeToTopic();
      mockSubscribe.mockResolvedValue({
        successCount: 2,
        failureCount: 0
      });

      const tokens = ['token-1', 'token-2'];
      const result = await pushNotificationService.subscribeToTopic(tokens, 'sports');

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(mockSubscribe).toHaveBeenCalledWith(tokens, 'sports');
    });

    test('should unsubscribe devices from topic', async () => {
      const mockUnsubscribe = admin._getMockUnsubscribeFromTopic();
      mockUnsubscribe.mockResolvedValue({
        successCount: 1,
        failureCount: 0
      });

      const result = await pushNotificationService.unsubscribeFromTopic(['token-1'], 'sports');

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
      expect(mockUnsubscribe).toHaveBeenCalledWith(['token-1'], 'sports');
    });
  });

  describe('Priority Mapping', () => {
    test('should map priority levels correctly', () => {
      expect(pushNotificationService._mapPriority('low')).toBe('normal');
      expect(pushNotificationService._mapPriority('normal')).toBe('normal');
      expect(pushNotificationService._mapPriority('high')).toBe('high');
      expect(pushNotificationService._mapPriority('urgent')).toBe('high');
      expect(pushNotificationService._mapPriority('unknown')).toBe('normal');
    });
  });
});
