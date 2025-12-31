/**
 * SMS Notifications Example
 *
 * Demonstrates SMS sending with Twilio, AWS SNS, and other providers,
 * including verification codes, alerts, and two-way messaging.
 */

import type {
  ChannelProvider,
  DeliveryResult,
  Notification,
  Recipient,
  NotificationPayload,
} from '../notify-hub/src/types.js';

// SMS configuration
export interface SMSConfig {
  fromNumber?: string;
  maxLength?: number;
  unicode?: boolean;
  validityPeriod?: number; // seconds
  statusCallback?: string;
}

// SMS delivery status
export type SMSStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'undelivered';

// SMS webhook event
export interface SMSWebhookEvent {
  messageId: string;
  to: string;
  from: string;
  status: SMSStatus;
  timestamp: Date;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Twilio SMS Provider
 */
export class TwilioSMSProvider implements ChannelProvider {
  readonly channel = 'sms' as const;
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  validateRecipient(recipient: Recipient): boolean {
    return !!recipient.phone && this.isValidPhoneNumber(recipient.phone);
  }

  async send(notification: Notification): Promise<DeliveryResult> {
    try {
      const recipient = notification.recipient;
      if (!recipient.phone) {
        throw new Error('No phone number provided');
      }

      const smsConfig = notification.metadata as SMSConfig;
      const message = this.truncateMessage(notification.body, smsConfig?.maxLength ?? 160);

      const payload = {
        from: smsConfig?.fromNumber ?? this.fromNumber,
        to: this.formatPhoneNumber(recipient.phone),
        body: message,
        statusCallback: smsConfig?.statusCallback,
        validityPeriod: smsConfig?.validityPeriod,
      };

      // Use Twilio SDK in production
      // const client = require('twilio')(this.accountSid, this.authToken);
      // const twilioMessage = await client.messages.create(payload);

      console.log('Sending SMS via Twilio');
      console.log('To:', recipient.phone);
      console.log('Message:', message);

      // Simulate sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        notificationId: notification.id,
        channel: 'sms',
        success: true,
        messageId: `twilio_${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        notificationId: notification.id,
        channel: 'sms',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Basic validation - should use libphonenumber in production
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  private formatPhoneNumber(phone: string): string {
    // Remove spaces and dashes
    let formatted = phone.replace(/[\s-]/g, '');

    // Add + prefix if not present
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }

    return formatted;
  }

  private truncateMessage(message: string, maxLength: number): string {
    if (message.length <= maxLength) {
      return message;
    }

    return message.substring(0, maxLength - 3) + '...';
  }
}

/**
 * AWS SNS SMS Provider
 */
export class SNSSMSProvider implements ChannelProvider {
  readonly channel = 'sms' as const;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor(region: string, accessKeyId: string, secretAccessKey: string) {
    this.region = region;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
  }

  validateRecipient(recipient: Recipient): boolean {
    return !!recipient.phone;
  }

  async send(notification: Notification): Promise<DeliveryResult> {
    try {
      const recipient = notification.recipient;
      if (!recipient.phone) {
        throw new Error('No phone number provided');
      }

      const params = {
        Message: notification.body,
        PhoneNumber: recipient.phone,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'MyApp',
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: notification.priority === 'high' ? 'Transactional' : 'Promotional',
          },
        },
      };

      // Use AWS SDK in production
      // const sns = new AWS.SNS({
      //   region: this.region,
      //   accessKeyId: this.accessKeyId,
      //   secretAccessKey: this.secretAccessKey,
      // });
      // const result = await sns.publish(params).promise();

      console.log('Sending SMS via AWS SNS');
      console.log('To:', recipient.phone);
      console.log('Params:', JSON.stringify(params, null, 2));

      // Simulate sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        notificationId: notification.id,
        channel: 'sms',
        success: true,
        messageId: `sns_${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        notificationId: notification.id,
        channel: 'sms',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }
}

/**
 * SMS Verification Manager
 *
 * Manages phone verification with OTP codes
 */
export class SMSVerificationManager {
  private verificationCodes: Map<
    string,
    {
      code: string;
      phone: string;
      expiresAt: Date;
      attempts: number;
    }
  > = new Map();
  private maxAttempts: number = 3;
  private codeLength: number = 6;
  private expiryMinutes: number = 10;

  /**
   * Generate verification code
   */
  generateCode(): string {
    const digits = '0123456789';
    let code = '';

    for (let i = 0; i < this.codeLength; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }

    return code;
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(
    phone: string,
    notifyHub: any
  ): Promise<{ success: boolean; expiresAt: Date }> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

    // Store verification code
    this.verificationCodes.set(phone, {
      code,
      phone,
      expiresAt,
      attempts: 0,
    });

    // Send SMS
    try {
      await notifyHub.send({
        channel: 'sms',
        recipient: {
          id: `verify_${phone}`,
          phone,
        },
        body: `Your verification code is: ${code}. Valid for ${this.expiryMinutes} minutes.`,
        priority: 'high',
      } as NotificationPayload);

      return { success: true, expiresAt };
    } catch (error) {
      console.error('Failed to send verification code:', error);
      return { success: false, expiresAt };
    }
  }

  /**
   * Verify code
   */
  verifyCode(phone: string, code: string): {
    success: boolean;
    error?: string;
  } {
    const verification = this.verificationCodes.get(phone);

    if (!verification) {
      return {
        success: false,
        error: 'No verification code found',
      };
    }

    // Check expiry
    if (verification.expiresAt < new Date()) {
      this.verificationCodes.delete(phone);
      return {
        success: false,
        error: 'Verification code expired',
      };
    }

    // Check attempts
    if (verification.attempts >= this.maxAttempts) {
      this.verificationCodes.delete(phone);
      return {
        success: false,
        error: 'Maximum verification attempts exceeded',
      };
    }

    // Verify code
    verification.attempts++;

    if (verification.code === code) {
      this.verificationCodes.delete(phone);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid verification code',
    };
  }

  /**
   * Resend verification code
   */
  async resendCode(phone: string, notifyHub: any): Promise<boolean> {
    // Clear existing code
    this.verificationCodes.delete(phone);

    // Send new code
    const result = await this.sendVerificationCode(phone, notifyHub);
    return result.success;
  }
}

/**
 * SMS Campaign Manager
 *
 * Manages SMS marketing campaigns
 */
export class SMSCampaignManager {
  private campaigns: Map<
    string,
    {
      id: string;
      name: string;
      message: string;
      recipients: string[];
      scheduledAt?: Date;
      sentCount: number;
      deliveredCount: number;
      failedCount: number;
    }
  > = new Map();

  /**
   * Create campaign
   */
  createCampaign(
    name: string,
    message: string,
    recipients: string[],
    scheduledAt?: Date
  ): string {
    const campaignId = `campaign_${Date.now()}`;

    this.campaigns.set(campaignId, {
      id: campaignId,
      name,
      message,
      recipients,
      scheduledAt,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
    });

    return campaignId;
  }

  /**
   * Send campaign
   */
  async sendCampaign(campaignId: string, notifyHub: any): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    console.log(`Sending campaign "${campaign.name}" to ${campaign.recipients.length} recipients`);

    // Send to each recipient with rate limiting
    for (const phone of campaign.recipients) {
      try {
        await notifyHub.send({
          channel: 'sms',
          recipient: {
            id: `sms_${phone}`,
            phone,
          },
          body: campaign.message,
          metadata: {
            campaignId,
          },
        } as NotificationPayload);

        campaign.sentCount++;

        // Rate limiting - wait between messages
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send to ${phone}:`, error);
        campaign.failedCount++;
      }
    }

    console.log(`Campaign sent: ${campaign.sentCount} sent, ${campaign.failedCount} failed`);
  }

  /**
   * Get campaign stats
   */
  getCampaignStats(campaignId: string) {
    return this.campaigns.get(campaignId);
  }
}

/**
 * Two-Way SMS Handler
 *
 * Handles incoming SMS messages
 */
export class TwoWaySMSHandler {
  private handlers: Map<string, (from: string, message: string) => Promise<string | void>> =
    new Map();
  private conversations: Map<string, { messages: Array<{ from: string; body: string; timestamp: Date }> }> =
    new Map();

  /**
   * Register keyword handler
   */
  onKeyword(
    keyword: string,
    handler: (from: string, message: string) => Promise<string | void>
  ): void {
    this.handlers.set(keyword.toLowerCase(), handler);
  }

  /**
   * Handle incoming message
   */
  async handleIncoming(from: string, body: string): Promise<string | void> {
    // Store message
    let conversation = this.conversations.get(from);
    if (!conversation) {
      conversation = { messages: [] };
      this.conversations.set(from, conversation);
    }

    conversation.messages.push({
      from,
      body,
      timestamp: new Date(),
    });

    // Check for keyword
    const firstWord = body.trim().split(/\s+/)[0].toLowerCase();
    const handler = this.handlers.get(firstWord);

    if (handler) {
      return await handler(from, body);
    }

    // Default handler
    return 'Thank you for your message. Reply HELP for assistance.';
  }

  /**
   * Get conversation history
   */
  getConversation(phone: string) {
    return this.conversations.get(phone);
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Send simple SMS
 */
export async function exampleSimpleSMS(notifyHub: any) {
  const recipient: Recipient = {
    id: 'user-123',
    phone: '+1234567890',
    name: 'John Doe',
  };

  notifyHub.registerRecipient(recipient);

  await notifyHub.send({
    channel: 'sms',
    recipient: 'user-123',
    body: 'Your appointment is confirmed for tomorrow at 2 PM.',
  } as NotificationPayload);

  console.log('SMS sent');
}

/**
 * Example: Phone verification
 */
export async function examplePhoneVerification(notifyHub: any) {
  const verificationManager = new SMSVerificationManager();
  const phone = '+1234567890';

  // Send verification code
  const result = await verificationManager.sendVerificationCode(phone, notifyHub);

  if (result.success) {
    console.log('Verification code sent, expires at:', result.expiresAt);

    // User enters code
    const userEnteredCode = '123456'; // From user input

    // Verify code
    const verification = verificationManager.verifyCode(phone, userEnteredCode);

    if (verification.success) {
      console.log('Phone verified successfully!');
    } else {
      console.error('Verification failed:', verification.error);
    }
  }
}

/**
 * Example: SMS alerts
 */
export async function exampleSMSAlerts(notifyHub: any) {
  // Critical alert
  await notifyHub.send({
    channel: 'sms',
    recipient: {
      id: 'admin-123',
      phone: '+1234567890',
    },
    body: 'CRITICAL: Server CPU usage exceeded 90%',
    priority: 'urgent',
  } as NotificationPayload);

  // Security alert
  await notifyHub.send({
    channel: 'sms',
    recipient: 'user-123',
    body: 'Security Alert: New login detected from unknown device. If this was not you, please secure your account immediately.',
    priority: 'high',
  } as NotificationPayload);
}

/**
 * Example: SMS campaign
 */
export async function exampleSMSCampaign(notifyHub: any) {
  const campaignManager = new SMSCampaignManager();

  const recipients = ['+1111111111', '+2222222222', '+3333333333'];

  const campaignId = campaignManager.createCampaign(
    'Summer Sale',
    'Flash Sale! Get 50% off all items this weekend. Use code: SUMMER50 at checkout.',
    recipients
  );

  await campaignManager.sendCampaign(campaignId, notifyHub);

  const stats = campaignManager.getCampaignStats(campaignId);
  console.log('Campaign stats:', stats);
}

/**
 * Example: Two-way SMS
 */
export async function exampleTwoWaySMS(notifyHub: any) {
  const handler = new TwoWaySMSHandler();

  // Register keyword handlers
  handler.onKeyword('help', async (from, message) => {
    return 'Available commands: HELP, STATUS, SUBSCRIBE, UNSUBSCRIBE';
  });

  handler.onKeyword('status', async (from, message) => {
    // Check user status
    return 'Your account is active. Last login: 2 hours ago.';
  });

  handler.onKeyword('subscribe', async (from, message) => {
    // Subscribe user to alerts
    console.log(`Subscribing ${from} to alerts`);
    return 'You are now subscribed to alerts. Reply UNSUBSCRIBE to stop.';
  });

  handler.onKeyword('unsubscribe', async (from, message) => {
    // Unsubscribe user
    console.log(`Unsubscribing ${from} from alerts`);
    return 'You have been unsubscribed. Reply SUBSCRIBE to re-enable alerts.';
  });

  // Simulate incoming message
  const response = await handler.handleIncoming('+1234567890', 'HELP');
  console.log('Auto-reply:', response);

  // Send response
  if (response) {
    await notifyHub.send({
      channel: 'sms',
      recipient: {
        id: 'reply',
        phone: '+1234567890',
      },
      body: response,
    } as NotificationPayload);
  }
}

/**
 * Example: Delivery tracking
 */
export async function exampleSMSDeliveryTracking(notifyHub: any) {
  await notifyHub.send({
    channel: 'sms',
    recipient: 'user-123',
    body: 'Your package has been shipped. Tracking: ABC123',
    metadata: {
      statusCallback: 'https://api.example.com/sms/status',
    } as SMSConfig,
  } as NotificationPayload);

  // Handle webhook callback
  const handleWebhook = (event: SMSWebhookEvent) => {
    console.log('SMS status update:', {
      messageId: event.messageId,
      status: event.status,
      timestamp: event.timestamp,
    });

    if (event.status === 'delivered') {
      console.log('SMS delivered successfully');
    } else if (event.status === 'failed') {
      console.error('SMS delivery failed:', event.errorMessage);
      // Implement retry logic
    }
  };
}

/**
 * Example: Scheduled SMS reminders
 */
export async function exampleScheduledSMS(notifyHub: any) {
  const reminderTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  await notifyHub.send({
    channel: 'sms',
    recipient: 'user-123',
    body: 'Reminder: Your appointment is in 1 hour.',
    scheduledAt: reminderTime,
  } as NotificationPayload);

  console.log('SMS reminder scheduled for:', reminderTime);
}

/**
 * Example: Multi-language SMS
 */
export async function exampleMultiLanguageSMS(notifyHub: any) {
  const messages: Record<string, string> = {
    en: 'Your verification code is: 123456',
    es: 'Su código de verificación es: 123456',
    fr: 'Votre code de vérification est: 123456',
    de: 'Ihr Verifizierungscode lautet: 123456',
  };

  const userLanguage = 'es'; // From user preferences

  await notifyHub.send({
    channel: 'sms',
    recipient: 'user-123',
    body: messages[userLanguage] ?? messages.en,
  } as NotificationPayload);
}

/**
 * Example: SMS with rate limiting
 */
export async function exampleRateLimitedSMS(notifyHub: any) {
  const recipients = Array.from({ length: 100 }, (_, i) => ({
    id: `user-${i}`,
    phone: `+1${String(i).padStart(10, '0')}`,
  }));

  const batchSize = 10;
  const delayBetweenBatches = 1000; // 1 second

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    await Promise.all(
      batch.map((recipient) =>
        notifyHub.send({
          channel: 'sms',
          recipient,
          body: 'Important update from our service.',
        } as NotificationPayload)
      )
    );

    console.log(`Sent batch ${Math.floor(i / batchSize) + 1}`);

    // Wait before next batch
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  console.log('All SMS messages sent');
}

/**
 * Example: SMS analytics
 */
export function exampleSMSAnalytics(notifyHub: any) {
  const stats = notifyHub.getStats();

  console.log('SMS Analytics:', {
    totalSent: stats.byChannel.sms,
    delivered: stats.byStatus.delivered,
    failed: stats.byStatus.failed,
    deliveryRate: (stats.deliveryRate * 100).toFixed(2) + '%',
    avgDeliveryTime: stats.avgDeliveryTime + 'ms',
  });

  // Track by priority
  console.log('By Priority:', {
    urgent: stats.byPriority.urgent,
    high: stats.byPriority.high,
    normal: stats.byPriority.normal,
  });
}
