/**
 * Mock Channel Providers
 *
 * In production, these would integrate with actual services
 * (SendGrid, Twilio, Firebase, etc.)
 */

import type {
  ChannelProvider,
  Notification,
  DeliveryResult,
  Recipient,
} from './types.js';

/**
 * Console provider for testing
 */
export class ConsoleProvider implements ChannelProvider {
  channel: 'email' | 'sms' | 'push' | 'in_app';

  constructor(channel: 'email' | 'sms' | 'push' | 'in_app' = 'email') {
    this.channel = channel;
  }

  async send(notification: Notification): Promise<DeliveryResult> {
    console.log(`[${this.channel.toUpperCase()}] Sending notification:`);
    console.log(`  To: ${this.getRecipientAddress(notification.recipient)}`);
    if (notification.subject) {
      console.log(`  Subject: ${notification.subject}`);
    }
    console.log(`  Body: ${notification.body.substring(0, 100)}...`);

    // Simulate async delivery
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      notificationId: notification.id,
      channel: this.channel,
      success: true,
      messageId: `mock_${Date.now()}`,
      timestamp: new Date(),
    };
  }

  validateRecipient(recipient: Recipient): boolean {
    switch (this.channel) {
      case 'email':
        return !!recipient.email;
      case 'sms':
        return !!recipient.phone;
      case 'push':
        return !!recipient.deviceTokens?.length;
      case 'in_app':
        return !!recipient.userId;
      default:
        return false;
    }
  }

  private getRecipientAddress(recipient: Recipient): string {
    switch (this.channel) {
      case 'email':
        return recipient.email || 'unknown';
      case 'sms':
        return recipient.phone || 'unknown';
      case 'push':
        return recipient.deviceTokens?.[0] || 'unknown';
      case 'in_app':
        return recipient.userId || 'unknown';
      default:
        return 'unknown';
    }
  }
}

/**
 * Mock Email Provider (simulates SendGrid, Mailgun, etc.)
 */
export class MockEmailProvider implements ChannelProvider {
  channel = 'email' as const;
  private failureRate: number;

  constructor(failureRate: number = 0) {
    this.failureRate = failureRate;
  }

  async send(notification: Notification): Promise<DeliveryResult> {
    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 50 + Math.random() * 100)
    );

    // Simulate occasional failures
    if (Math.random() < this.failureRate) {
      return {
        notificationId: notification.id,
        channel: 'email',
        success: false,
        error: 'SMTP connection failed',
        timestamp: new Date(),
      };
    }

    return {
      notificationId: notification.id,
      channel: 'email',
      success: true,
      messageId: `email_${notification.id}_${Date.now()}`,
      timestamp: new Date(),
    };
  }

  validateRecipient(recipient: Recipient): boolean {
    if (!recipient.email) return false;
    // Basic email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email);
  }
}

/**
 * Mock SMS Provider (simulates Twilio, Vonage, etc.)
 */
export class MockSMSProvider implements ChannelProvider {
  channel = 'sms' as const;

  async send(notification: Notification): Promise<DeliveryResult> {
    await new Promise((resolve) =>
      setTimeout(resolve, 50 + Math.random() * 150)
    );

    // Validate phone number format
    const phone = notification.recipient.phone;
    if (!phone || !/^\+?[1-9]\d{6,14}$/.test(phone.replace(/[\s-]/g, ''))) {
      return {
        notificationId: notification.id,
        channel: 'sms',
        success: false,
        error: 'Invalid phone number format',
        timestamp: new Date(),
      };
    }

    return {
      notificationId: notification.id,
      channel: 'sms',
      success: true,
      messageId: `sms_${notification.id}_${Date.now()}`,
      timestamp: new Date(),
    };
  }

  validateRecipient(recipient: Recipient): boolean {
    return !!recipient.phone;
  }
}

/**
 * Mock Push Provider (simulates Firebase FCM, APNs, etc.)
 */
export class MockPushProvider implements ChannelProvider {
  channel = 'push' as const;

  async send(notification: Notification): Promise<DeliveryResult> {
    await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 50));

    const tokens = notification.recipient.deviceTokens || [];
    if (tokens.length === 0) {
      return {
        notificationId: notification.id,
        channel: 'push',
        success: false,
        error: 'No device tokens available',
        timestamp: new Date(),
      };
    }

    return {
      notificationId: notification.id,
      channel: 'push',
      success: true,
      messageId: `push_${notification.id}_${Date.now()}`,
      timestamp: new Date(),
    };
  }

  validateRecipient(recipient: Recipient): boolean {
    return !!recipient.deviceTokens?.length;
  }
}

/**
 * Mock Webhook Provider
 */
export class MockWebhookProvider implements ChannelProvider {
  channel = 'webhook' as const;
  private webhookUrl: string;

  constructor(webhookUrl: string = 'https://example.com/webhook') {
    this.webhookUrl = webhookUrl;
  }

  async send(notification: Notification): Promise<DeliveryResult> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    // In real implementation, this would POST to the webhook URL
    console.log(`[WEBHOOK] POST ${this.webhookUrl}`, {
      notificationId: notification.id,
      body: notification.body,
      data: notification.data,
    });

    return {
      notificationId: notification.id,
      channel: 'webhook',
      success: true,
      messageId: `webhook_${notification.id}_${Date.now()}`,
      timestamp: new Date(),
    };
  }

  validateRecipient(_recipient: Recipient): boolean {
    return true; // Webhooks don't require specific recipient fields
  }
}

/**
 * In-App Notification Provider (stores in memory)
 */
export class InAppProvider implements ChannelProvider {
  channel = 'in_app' as const;
  private notifications: Map<string, Notification[]> = new Map();

  async send(notification: Notification): Promise<DeliveryResult> {
    const userId = notification.recipient.userId;
    if (!userId) {
      return {
        notificationId: notification.id,
        channel: 'in_app',
        success: false,
        error: 'No userId provided',
        timestamp: new Date(),
      };
    }

    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.push(notification);
    this.notifications.set(userId, userNotifications);

    return {
      notificationId: notification.id,
      channel: 'in_app',
      success: true,
      messageId: `inapp_${notification.id}`,
      timestamp: new Date(),
    };
  }

  validateRecipient(recipient: Recipient): boolean {
    return !!recipient.userId;
  }

  getNotifications(userId: string): Notification[] {
    return this.notifications.get(userId) || [];
  }

  clearNotifications(userId: string): void {
    this.notifications.delete(userId);
  }
}
