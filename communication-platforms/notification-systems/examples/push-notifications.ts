/**
 * Push Notifications Example
 *
 * Demonstrates push notification delivery using Web Push API,
 * Firebase Cloud Messaging (FCM), and Apple Push Notification Service (APNS).
 */

import type {
  NotifyHub,
  Recipient,
  NotificationPayload,
  ChannelProvider,
  DeliveryResult,
  Notification,
} from '../notify-hub/src/types.js';

// Push notification payload
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: PushAction[];
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  sound?: string;
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
  ttl?: number; // Time to live in seconds
}

// Push notification action
export interface PushAction {
  action: string;
  title: string;
  icon?: string;
}

// Device info
export interface DeviceInfo {
  token: string;
  platform: 'web' | 'ios' | 'android';
  endpoint?: string; // For Web Push
  keys?: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Web Push Provider
 *
 * Implements Web Push API for browser notifications
 */
export class WebPushProvider implements ChannelProvider {
  readonly channel = 'push' as const;
  private vapidPublicKey: string;
  private vapidPrivateKey: string;
  private subject: string;

  constructor(vapidPublicKey: string, vapidPrivateKey: string, subject: string) {
    this.vapidPublicKey = vapidPublicKey;
    this.vapidPrivateKey = vapidPrivateKey;
    this.subject = subject;
  }

  /**
   * Validate recipient has device tokens
   */
  validateRecipient(recipient: Recipient): boolean {
    return (recipient.deviceTokens?.length ?? 0) > 0;
  }

  /**
   * Send push notification
   */
  async send(notification: Notification): Promise<DeliveryResult> {
    try {
      const recipient = notification.recipient;
      if (!recipient.deviceTokens?.length) {
        throw new Error('No device tokens available');
      }

      const payload: PushNotificationPayload = {
        title: notification.subject ?? 'Notification',
        body: notification.body,
        icon: '/icon.png',
        badge: '/badge.png',
        data: notification.data,
        tag: notification.id,
        ...notification.metadata,
      };

      // Send to all devices
      const results = await Promise.allSettled(
        recipient.deviceTokens.map((token) =>
          this.sendToDevice(token, payload)
        )
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;

      if (successCount === 0) {
        throw new Error('Failed to send to any device');
      }

      return {
        notificationId: notification.id,
        channel: 'push',
        success: true,
        messageId: `push_${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        notificationId: notification.id,
        channel: 'push',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send to specific device
   */
  private async sendToDevice(
    subscription: string,
    payload: PushNotificationPayload
  ): Promise<void> {
    // Parse subscription (should be JSON with endpoint and keys)
    const subscriptionObj = JSON.parse(subscription);

    // Use web-push library in production
    // await webpush.sendNotification(subscriptionObj, JSON.stringify(payload), {
    //   vapidDetails: {
    //     subject: this.subject,
    //     publicKey: this.vapidPublicKey,
    //     privateKey: this.vapidPrivateKey,
    //   },
    // });

    console.log('Sending web push to:', subscriptionObj.endpoint);
    console.log('Payload:', payload);

    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Firebase Cloud Messaging (FCM) Provider
 *
 * Implements FCM for Android and iOS notifications
 */
export class FCMProvider implements ChannelProvider {
  readonly channel = 'push' as const;
  private serverKey: string;
  private senderId: string;

  constructor(serverKey: string, senderId: string) {
    this.serverKey = serverKey;
    this.senderId = senderId;
  }

  validateRecipient(recipient: Recipient): boolean {
    return (recipient.deviceTokens?.length ?? 0) > 0;
  }

  async send(notification: Notification): Promise<DeliveryResult> {
    try {
      const recipient = notification.recipient;
      if (!recipient.deviceTokens?.length) {
        throw new Error('No device tokens available');
      }

      const payload = {
        notification: {
          title: notification.subject ?? 'Notification',
          body: notification.body,
        },
        data: notification.data,
        android: {
          priority: this.mapPriority(notification.priority),
          notification: {
            sound: 'default',
            color: '#1976d2',
            icon: 'notification_icon',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        tokens: recipient.deviceTokens,
      };

      // Use Firebase Admin SDK in production
      // const response = await admin.messaging().sendMulticast(payload);

      console.log('Sending FCM to', recipient.deviceTokens.length, 'devices');
      console.log('Payload:', payload);

      // Simulate sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        notificationId: notification.id,
        channel: 'push',
        success: true,
        messageId: `fcm_${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        notificationId: notification.id,
        channel: 'push',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  private mapPriority(priority: string): string {
    const mapping: Record<string, string> = {
      low: 'normal',
      normal: 'normal',
      high: 'high',
      urgent: 'high',
    };
    return mapping[priority] ?? 'normal';
  }
}

/**
 * Apple Push Notification Service (APNS) Provider
 */
export class APNSProvider implements ChannelProvider {
  readonly channel = 'push' as const;
  private teamId: string;
  private keyId: string;
  private privateKey: string;
  private bundleId: string;

  constructor(teamId: string, keyId: string, privateKey: string, bundleId: string) {
    this.teamId = teamId;
    this.keyId = keyId;
    this.privateKey = privateKey;
    this.bundleId = bundleId;
  }

  validateRecipient(recipient: Recipient): boolean {
    return (recipient.deviceTokens?.length ?? 0) > 0;
  }

  async send(notification: Notification): Promise<DeliveryResult> {
    try {
      const recipient = notification.recipient;
      if (!recipient.deviceTokens?.length) {
        throw new Error('No device tokens available');
      }

      const payload = {
        aps: {
          alert: {
            title: notification.subject ?? 'Notification',
            body: notification.body,
          },
          badge: 1,
          sound: 'default',
          'content-available': 1,
        },
        data: notification.data,
      };

      // Use apn library in production
      // const apnProvider = new apn.Provider({
      //   token: {
      //     key: this.privateKey,
      //     keyId: this.keyId,
      //     teamId: this.teamId,
      //   },
      // });

      console.log('Sending APNS to', recipient.deviceTokens.length, 'devices');
      console.log('Payload:', payload);

      // Simulate sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        notificationId: notification.id,
        channel: 'push',
        success: true,
        messageId: `apns_${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        notificationId: notification.id,
        channel: 'push',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }
}

/**
 * Push Notification Manager
 *
 * High-level manager for push notifications across platforms
 */
export class PushNotificationManager {
  private devices: Map<string, DeviceInfo[]> = new Map();

  /**
   * Register device for push notifications
   */
  registerDevice(userId: string, device: DeviceInfo): void {
    let userDevices = this.devices.get(userId);
    if (!userDevices) {
      userDevices = [];
      this.devices.set(userId, userDevices);
    }

    // Remove existing device with same token
    const existingIndex = userDevices.findIndex((d) => d.token === device.token);
    if (existingIndex !== -1) {
      userDevices.splice(existingIndex, 1);
    }

    userDevices.push(device);
  }

  /**
   * Unregister device
   */
  unregisterDevice(userId: string, token: string): boolean {
    const userDevices = this.devices.get(userId);
    if (!userDevices) return false;

    const index = userDevices.findIndex((d) => d.token === token);
    if (index === -1) return false;

    userDevices.splice(index, 1);
    return true;
  }

  /**
   * Get user devices
   */
  getUserDevices(userId: string): DeviceInfo[] {
    return this.devices.get(userId) ?? [];
  }

  /**
   * Get device tokens for recipient
   */
  getDeviceTokens(userId: string): string[] {
    const devices = this.getUserDevices(userId);
    return devices.map((d) => d.token);
  }

  /**
   * Subscribe to Web Push
   */
  async subscribeWebPush(userId: string): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'YOUR_VAPID_PUBLIC_KEY' // Replace with actual key
        ),
      });

      // Register device
      this.registerDevice(userId, {
        token: JSON.stringify(subscription.toJSON()),
        platform: 'web',
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
        },
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from Web Push
   */
  async unsubscribeWebPush(userId: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        this.unregisterDevice(userId, JSON.stringify(subscription.toJSON()));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Show local notification (fallback)
   */
  async showLocalNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    const permission = await this.requestPermission();

    if (permission !== 'granted') {
      console.error('Notification permission denied');
      return;
    }

    new Notification(title, options);
  }

  /**
   * Helper: Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Setup Web Push
 */
export async function exampleWebPush() {
  const manager = new PushNotificationManager();

  // Request permission
  const permission = await manager.requestPermission();
  if (permission !== 'granted') {
    console.error('Permission denied');
    return;
  }

  // Subscribe to push
  const userId = 'user-123';
  const subscription = await manager.subscribeWebPush(userId);

  if (subscription) {
    console.log('Subscribed to push notifications');
    console.log('Endpoint:', subscription.endpoint);

    // Send subscription to server
    // await sendSubscriptionToServer(userId, subscription);
  }

  return manager;
}

/**
 * Example: Send push notification with NotifyHub
 */
export async function exampleSendPushNotification(notifyHub: any) {
  const manager = new PushNotificationManager();

  // Register user with device tokens
  const recipient: Recipient = {
    id: 'user-123',
    email: 'user@example.com',
    deviceTokens: manager.getDeviceTokens('user-123'),
  };

  notifyHub.registerRecipient(recipient);

  // Send notification
  const notification = await notifyHub.send({
    channel: 'push',
    recipient: 'user-123',
    subject: 'New Message',
    body: 'You have a new message from John',
    data: {
      type: 'message',
      messageId: 'msg-456',
      senderId: 'user-789',
    },
    priority: 'high',
  } as NotificationPayload);

  console.log('Push notification sent:', notification.id);
}

/**
 * Example: Multi-platform push
 */
export async function exampleMultiPlatformPush() {
  const manager = new PushNotificationManager();

  const userId = 'user-123';

  // Register devices across platforms
  manager.registerDevice(userId, {
    token: 'web-push-token-123',
    platform: 'web',
  });

  manager.registerDevice(userId, {
    token: 'fcm-android-token-456',
    platform: 'android',
  });

  manager.registerDevice(userId, {
    token: 'apns-ios-token-789',
    platform: 'ios',
  });

  const devices = manager.getUserDevices(userId);
  console.log('Registered devices:', devices.length);

  devices.forEach((device) => {
    console.log(`- ${device.platform}: ${device.token.substring(0, 20)}...`);
  });
}

/**
 * Example: Rich push notifications
 */
export async function exampleRichPushNotification(manager: PushNotificationManager) {
  await manager.showLocalNotification('New Photo', {
    body: 'John shared a new photo with you',
    icon: '/icon.png',
    badge: '/badge.png',
    image: 'https://example.com/photo.jpg',
    vibrate: [200, 100, 200],
    tag: 'photo-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Photo',
        icon: '/view-icon.png',
      },
      {
        action: 'like',
        title: 'Like',
        icon: '/like-icon.png',
      },
    ],
    data: {
      url: '/photos/123',
    },
  });
}

/**
 * Example: Silent push notification
 */
export async function exampleSilentPush() {
  const payload: PushNotificationPayload = {
    title: '',
    body: '',
    silent: true,
    data: {
      type: 'sync',
      syncType: 'messages',
      timestamp: Date.now(),
    },
  };

  console.log('Sending silent push for background sync');
  // Send via provider
}

/**
 * Example: Scheduled push notification
 */
export async function exampleScheduledPush(notifyHub: any) {
  const scheduledTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  await notifyHub.send({
    channel: 'push',
    recipient: 'user-123',
    subject: 'Meeting Reminder',
    body: 'Your meeting starts in 15 minutes',
    scheduledAt: scheduledTime,
    data: {
      type: 'reminder',
      meetingId: 'meeting-456',
    },
  } as NotificationPayload);

  console.log('Scheduled push for:', scheduledTime);
}

/**
 * Example: Handle push notification click
 */
export function exampleHandleNotificationClick() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'notification-click') {
        const { action, notification } = event.data;

        console.log('Notification clicked:', action);

        if (action === 'view') {
          // Navigate to content
          window.location.href = notification.data.url;
        } else if (action === 'like') {
          // Handle like action
          console.log('Liked:', notification.data);
        }
      }
    });
  }
}

/**
 * Example: Analytics and tracking
 */
export async function examplePushAnalytics(notifyHub: any) {
  // Track notification events
  notifyHub.on('sent', (notificationId: string) => {
    console.log('Push sent:', notificationId);
    // Track in analytics
    // analytics.track('push_sent', { notificationId });
  });

  notifyHub.on('delivered', (notificationId: string) => {
    console.log('Push delivered:', notificationId);
    // Track in analytics
    // analytics.track('push_delivered', { notificationId });
  });

  // Get statistics
  const stats = notifyHub.getStats();
  console.log('Push Statistics:', {
    total: stats.total,
    pushSent: stats.byChannel.push,
    deliveryRate: (stats.deliveryRate * 100).toFixed(2) + '%',
  });
}

/**
 * Example: A/B testing push notifications
 */
export async function exampleABTestingPush(notifyHub: any) {
  const users = ['user-1', 'user-2', 'user-3', 'user-4'];

  // Variant A
  const variantA = users.slice(0, 2);
  for (const userId of variantA) {
    await notifyHub.send({
      channel: 'push',
      recipient: userId,
      subject: 'Check out our new features!',
      body: 'We have exciting updates for you',
      metadata: { variant: 'A' },
    } as NotificationPayload);
  }

  // Variant B
  const variantB = users.slice(2);
  for (const userId of variantB) {
    await notifyHub.send({
      channel: 'push',
      recipient: userId,
      subject: 'New features available',
      body: 'Discover what we have built for you',
      metadata: { variant: 'B' },
    } as NotificationPayload);
  }

  console.log('A/B test push sent to', users.length, 'users');
}
