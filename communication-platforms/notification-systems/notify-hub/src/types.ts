/**
 * Notification Hub Types
 */

// Notification channels
export type NotificationChannel =
  | 'email'
  | 'sms'
  | 'push'
  | 'in_app'
  | 'webhook'
  | 'slack'
  | 'discord';

// Notification priority
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Notification status
export type NotificationStatus =
  | 'pending'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'cancelled';

// Recipient
export interface Recipient {
  id: string;
  email?: string;
  phone?: string;
  deviceTokens?: string[];
  userId?: string;
  name?: string;
  preferences?: NotificationPreferences;
  metadata?: Record<string, unknown>;
}

// Notification preferences
export interface NotificationPreferences {
  channels: NotificationChannel[];
  quietHours?: {
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
  frequency?: 'immediate' | 'digest_daily' | 'digest_weekly';
  categories?: Record<string, boolean>;
}

// Template
export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  htmlBody?: string;
  variables: string[];
  category?: string;
  metadata?: Record<string, unknown>;
}

// Notification payload
export interface NotificationPayload {
  id?: string;
  template?: string;
  channel: NotificationChannel;
  recipient: Recipient | string;
  subject?: string;
  body?: string;
  htmlBody?: string;
  data?: Record<string, unknown>;
  priority?: NotificationPriority;
  category?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  groupId?: string;
  metadata?: Record<string, unknown>;
}

// Notification record
export interface Notification {
  id: string;
  channel: NotificationChannel;
  recipient: Recipient;
  subject?: string;
  body: string;
  htmlBody?: string;
  data?: Record<string, unknown>;
  priority: NotificationPriority;
  category?: string;
  status: NotificationStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  error?: string;
  retryCount: number;
  groupId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Delivery result
export interface DeliveryResult {
  notificationId: string;
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

// Channel provider interface
export interface ChannelProvider {
  channel: NotificationChannel;
  send(notification: Notification): Promise<DeliveryResult>;
  validateRecipient(recipient: Recipient): boolean;
}

// Notification filter
export interface NotificationFilter {
  channels?: NotificationChannel[];
  status?: NotificationStatus[];
  priority?: NotificationPriority[];
  category?: string;
  recipientId?: string;
  groupId?: string;
  from?: Date;
  to?: Date;
}

// Statistics
export interface NotificationStats {
  total: number;
  byChannel: Record<NotificationChannel, number>;
  byStatus: Record<NotificationStatus, number>;
  byPriority: Record<NotificationPriority, number>;
  deliveryRate: number;
  avgDeliveryTime: number; // ms
}

// Event types
export type NotificationEventType =
  | 'created'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'clicked'
  | 'dismissed';

// Notification event
export interface NotificationEvent {
  type: NotificationEventType;
  notificationId: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// Hub configuration
export interface NotifyHubConfig {
  providers: Partial<Record<NotificationChannel, ChannelProvider>>;
  defaultChannel?: NotificationChannel;
  maxRetries?: number;
  retryDelay?: number; // ms
  batchSize?: number;
  rateLimits?: Partial<Record<NotificationChannel, { max: number; window: number }>>;
}
