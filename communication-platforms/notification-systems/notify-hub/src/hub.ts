/**
 * Notification Hub
 *
 * Central notification management system
 */

import type {
  NotificationChannel,
  NotificationPayload,
  Notification,
  NotificationFilter,
  NotificationStats,
  NotificationEvent,
  NotifyHubConfig,
  Recipient,
  DeliveryResult,
  ChannelProvider,
} from './types.js';

import { TemplateEngine, DEFAULT_TEMPLATES } from './template.js';

export class NotifyHub {
  private config: NotifyHubConfig;
  private templates: TemplateEngine;
  private notifications: Map<string, Notification> = new Map();
  private queue: Notification[] = [];
  private events: NotificationEvent[] = [];
  private recipients: Map<string, Recipient> = new Map();
  private idCounter = 0;
  private processing = false;

  constructor(config: NotifyHubConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 10,
      ...config,
    };

    this.templates = new TemplateEngine();

    // Register default templates
    for (const template of DEFAULT_TEMPLATES) {
      this.templates.register(template);
    }
  }

  private generateId(): string {
    return `notif_${Date.now()}_${++this.idCounter}`;
  }

  /**
   * Register a recipient
   */
  registerRecipient(recipient: Recipient): void {
    this.recipients.set(recipient.id, recipient);
  }

  /**
   * Get a recipient by ID
   */
  getRecipient(id: string): Recipient | undefined {
    return this.recipients.get(id);
  }

  /**
   * Get template engine
   */
  getTemplates(): TemplateEngine {
    return this.templates;
  }

  /**
   * Send a notification
   */
  async send(payload: NotificationPayload): Promise<Notification> {
    // Resolve recipient
    let recipient: Recipient;
    if (typeof payload.recipient === 'string') {
      const r = this.recipients.get(payload.recipient);
      if (!r) {
        throw new Error(`Recipient not found: ${payload.recipient}`);
      }
      recipient = r;
    } else {
      recipient = payload.recipient;
    }

    // Resolve template
    let body = payload.body || '';
    let subject = payload.subject;
    let htmlBody = payload.htmlBody;

    if (payload.template) {
      const rendered = this.templates.render(
        payload.template,
        payload.data || {}
      );
      if (rendered) {
        body = rendered.body;
        subject = rendered.subject || subject;
        htmlBody = rendered.htmlBody || htmlBody;
      }
    }

    // Create notification record
    const notification: Notification = {
      id: payload.id || this.generateId(),
      channel: payload.channel,
      recipient,
      subject,
      body,
      htmlBody,
      data: payload.data,
      priority: payload.priority || 'normal',
      category: payload.category,
      status: payload.scheduledAt ? 'pending' : 'queued',
      scheduledAt: payload.scheduledAt,
      retryCount: 0,
      groupId: payload.groupId,
      metadata: payload.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notifications.set(notification.id, notification);
    this.emitEvent('created', notification.id);

    // Schedule or queue immediately
    if (notification.scheduledAt && notification.scheduledAt > new Date()) {
      // Would use a job scheduler in production
      const delay = notification.scheduledAt.getTime() - Date.now();
      setTimeout(() => this.queueNotification(notification), delay);
    } else {
      this.queueNotification(notification);
    }

    return notification;
  }

  /**
   * Send to multiple recipients
   */
  async sendBulk(
    recipients: (Recipient | string)[],
    payload: Omit<NotificationPayload, 'recipient'>
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const recipient of recipients) {
      const notification = await this.send({
        ...payload,
        recipient,
      });
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Send through multiple channels
   */
  async sendMultiChannel(
    recipient: Recipient | string,
    channels: NotificationChannel[],
    payload: Omit<NotificationPayload, 'recipient' | 'channel'>
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const channel of channels) {
      try {
        const notification = await this.send({
          ...payload,
          recipient,
          channel,
        });
        notifications.push(notification);
      } catch {
        // Continue with other channels if one fails
      }
    }

    return notifications;
  }

  private queueNotification(notification: Notification): void {
    notification.status = 'queued';
    notification.updatedAt = new Date();
    this.queue.push(notification);
    this.emitEvent('queued', notification.id);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const batch = this.queue.splice(0, this.config.batchSize || 10);

    await Promise.all(
      batch.map((notification) => this.deliverNotification(notification))
    );

    this.processing = false;

    // Continue processing if more in queue
    if (this.queue.length > 0) {
      setImmediate(() => this.processQueue());
    }
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    const provider = this.config.providers[notification.channel];
    if (!provider) {
      this.markFailed(notification, `No provider for channel: ${notification.channel}`);
      return;
    }

    // Validate recipient
    if (!provider.validateRecipient(notification.recipient)) {
      this.markFailed(notification, 'Invalid recipient for channel');
      return;
    }

    // Check expiration
    if (notification.expiresAt && notification.expiresAt < new Date()) {
      this.markFailed(notification, 'Notification expired');
      return;
    }

    notification.status = 'sending';
    notification.updatedAt = new Date();

    try {
      const result = await provider.send(notification);

      if (result.success) {
        this.markSent(notification, result);
      } else {
        await this.handleDeliveryFailure(notification, result.error || 'Unknown error');
      }
    } catch (error) {
      await this.handleDeliveryFailure(
        notification,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private markSent(notification: Notification, result: DeliveryResult): void {
    notification.status = 'sent';
    notification.sentAt = new Date();
    notification.updatedAt = new Date();
    this.emitEvent('sent', notification.id, { messageId: result.messageId });

    // Simulate delivery confirmation (in production, this would come from webhooks)
    setTimeout(() => {
      notification.status = 'delivered';
      notification.deliveredAt = new Date();
      notification.updatedAt = new Date();
      this.emitEvent('delivered', notification.id);
    }, 500);
  }

  private markFailed(notification: Notification, error: string): void {
    notification.status = 'failed';
    notification.failedAt = new Date();
    notification.error = error;
    notification.updatedAt = new Date();
    this.emitEvent('failed', notification.id, { error });
  }

  private async handleDeliveryFailure(
    notification: Notification,
    error: string
  ): Promise<void> {
    notification.retryCount++;

    if (notification.retryCount < (this.config.maxRetries || 3)) {
      // Retry with exponential backoff
      const delay = (this.config.retryDelay || 1000) * Math.pow(2, notification.retryCount - 1);
      notification.status = 'queued';
      notification.updatedAt = new Date();

      setTimeout(() => {
        this.queue.push(notification);
        this.processQueue();
      }, delay);
    } else {
      this.markFailed(notification, error);
    }
  }

  private emitEvent(
    type: NotificationEvent['type'],
    notificationId: string,
    data?: Record<string, unknown>
  ): void {
    this.events.push({
      type,
      notificationId,
      timestamp: new Date(),
      data,
    });

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }
  }

  /**
   * Get notification by ID
   */
  get(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  /**
   * Cancel a notification
   */
  cancel(id: string): boolean {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    if (['pending', 'queued'].includes(notification.status)) {
      notification.status = 'cancelled';
      notification.updatedAt = new Date();

      // Remove from queue
      const index = this.queue.findIndex((n) => n.id === id);
      if (index !== -1) {
        this.queue.splice(index, 1);
      }

      return true;
    }

    return false;
  }

  /**
   * Query notifications
   */
  query(filter: NotificationFilter): Notification[] {
    let results = Array.from(this.notifications.values());

    if (filter.channels?.length) {
      results = results.filter((n) => filter.channels!.includes(n.channel));
    }

    if (filter.status?.length) {
      results = results.filter((n) => filter.status!.includes(n.status));
    }

    if (filter.priority?.length) {
      results = results.filter((n) => filter.priority!.includes(n.priority));
    }

    if (filter.category) {
      results = results.filter((n) => n.category === filter.category);
    }

    if (filter.recipientId) {
      results = results.filter((n) => n.recipient.id === filter.recipientId);
    }

    if (filter.groupId) {
      results = results.filter((n) => n.groupId === filter.groupId);
    }

    if (filter.from) {
      results = results.filter((n) => n.createdAt >= filter.from!);
    }

    if (filter.to) {
      results = results.filter((n) => n.createdAt <= filter.to!);
    }

    return results;
  }

  /**
   * Get statistics
   */
  getStats(): NotificationStats {
    const all = Array.from(this.notifications.values());

    const byChannel: Record<NotificationChannel, number> = {
      email: 0,
      sms: 0,
      push: 0,
      in_app: 0,
      webhook: 0,
      slack: 0,
      discord: 0,
    };

    const byStatus: Record<string, number> = {
      pending: 0,
      queued: 0,
      sending: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0,
    };

    const byPriority: Record<string, number> = {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
    };

    let totalDeliveryTime = 0;
    let deliveredCount = 0;

    for (const n of all) {
      byChannel[n.channel]++;
      byStatus[n.status]++;
      byPriority[n.priority]++;

      if (n.status === 'delivered' && n.sentAt && n.deliveredAt) {
        totalDeliveryTime += n.deliveredAt.getTime() - n.sentAt.getTime();
        deliveredCount++;
      }
    }

    const sent = byStatus['sent'] + byStatus['delivered'];
    const failed = byStatus['failed'];

    return {
      total: all.length,
      byChannel: byChannel as Record<NotificationChannel, number>,
      byStatus: byStatus as Record<Notification['status'], number>,
      byPriority: byPriority as Record<Notification['priority'], number>,
      deliveryRate: sent + failed > 0 ? sent / (sent + failed) : 0,
      avgDeliveryTime: deliveredCount > 0 ? totalDeliveryTime / deliveredCount : 0,
    };
  }

  /**
   * Get recent events
   */
  getEvents(limit: number = 100): NotificationEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Add a channel provider
   */
  addProvider(channel: NotificationChannel, provider: ChannelProvider): void {
    this.config.providers[channel] = provider;
  }
}
