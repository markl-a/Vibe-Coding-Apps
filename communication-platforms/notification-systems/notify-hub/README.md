# NotifyHub

A multi-channel notification system with templates, scheduling, and delivery tracking.

## Features

- **Multi-Channel**: Email, SMS, Push, In-App, Webhook, Slack, Discord
- **Templates**: Variable interpolation with modifiers
- **Scheduling**: Send notifications at specific times
- **Bulk Sending**: Send to multiple recipients
- **Delivery Tracking**: Status updates and statistics
- **Retry Logic**: Automatic retry with exponential backoff
- **Event Stream**: Track notification lifecycle events

## Quick Start

```bash
pnpm install
pnpm example
```

## Usage

### Basic Setup

```typescript
import { NotifyHub, MockEmailProvider, MockPushProvider } from '@vibe/notify-hub';

const hub = new NotifyHub({
  providers: {
    email: new MockEmailProvider(),
    push: new MockPushProvider(),
  },
  maxRetries: 3,
});

// Register recipient
hub.registerRecipient({
  id: 'user_1',
  email: 'user@example.com',
  deviceTokens: ['token_123'],
  name: 'John Doe',
});
```

### Send Notification

```typescript
const notification = await hub.send({
  channel: 'email',
  recipient: 'user_1',
  subject: 'Welcome!',
  body: 'Thanks for signing up.',
  priority: 'normal',
});

console.log(notification.status); // 'queued' -> 'sent' -> 'delivered'
```

### Using Templates

```typescript
// Built-in templates: welcome, password_reset, order_confirmation, otp_sms

await hub.send({
  channel: 'email',
  recipient: 'user_1',
  template: 'welcome',
  data: {
    name: 'John',
    appName: 'MyApp',
    dashboardUrl: 'https://app.example.com',
  },
});
```

### Custom Templates

```typescript
import { TemplateEngine } from '@vibe/notify-hub';

hub.getTemplates().register(
  TemplateEngine.create(
    'invoice',
    'Invoice Email',
    'email',
    'Invoice #{{invoiceId}} for {{amount}} is ready.',
    {
      subject: 'Invoice #{{invoiceId}}',
      htmlBody: '<h1>Invoice #{{invoiceId}}</h1><p>Amount: {{amount}}</p>',
    }
  )
);
```

### Multi-Channel

```typescript
await hub.sendMultiChannel('user_1', ['email', 'push', 'in_app'], {
  subject: 'Important Update',
  body: 'Your settings have changed.',
  priority: 'high',
});
```

### Bulk Notifications

```typescript
await hub.sendBulk(['user_1', 'user_2', 'user_3'], {
  channel: 'email',
  subject: 'Newsletter',
  body: 'Check out our latest updates!',
  groupId: 'newsletter_jan_2024',
});
```

### Scheduled Notifications

```typescript
await hub.send({
  channel: 'email',
  recipient: 'user_1',
  subject: 'Reminder',
  body: 'Your appointment is tomorrow.',
  scheduledAt: new Date('2024-01-15T09:00:00Z'),
});
```

## Template Syntax

```
{{variable}}              - Insert variable value
{{variable|default}}      - Use default if undefined
{{variable|uppercase}}    - Convert to uppercase
{{variable|lowercase}}    - Convert to lowercase
{{variable|capitalize}}   - Capitalize first letter
```

Example:
```
Hi {{name|Guest}}, your order {{orderId|uppercase}} is ready!
```

## Notification Channels

| Channel | Provider Required | Recipient Fields |
|---------|------------------|------------------|
| email | Email provider | `email` |
| sms | SMS provider | `phone` |
| push | Push provider | `deviceTokens` |
| in_app | In-app provider | `userId` |
| webhook | Webhook provider | (any) |
| slack | Slack provider | `slackId` |
| discord | Discord provider | `discordId` |

## Priority Levels

- `low` - Batch with other notifications
- `normal` - Standard delivery (default)
- `high` - Prioritize in queue
- `urgent` - Immediate delivery

## Notification Status

```
pending    → scheduled, waiting for time
queued     → in delivery queue
sending    → being sent
sent       → provider accepted
delivered  → confirmed delivered
failed     → delivery failed
cancelled  → manually cancelled
```

## Query Notifications

```typescript
const results = hub.query({
  channels: ['email', 'sms'],
  status: ['sent', 'delivered'],
  priority: ['high', 'urgent'],
  category: 'transactional',
  recipientId: 'user_1',
  groupId: 'campaign_1',
  from: new Date('2024-01-01'),
  to: new Date('2024-01-31'),
});
```

## Statistics

```typescript
const stats = hub.getStats();

console.log(stats.total);        // Total notifications
console.log(stats.byChannel);    // Count by channel
console.log(stats.byStatus);     // Count by status
console.log(stats.deliveryRate); // Success rate (0-1)
console.log(stats.avgDeliveryTime); // Average delivery time (ms)
```

## Events

```typescript
const events = hub.getEvents(100);

events.forEach(event => {
  console.log(event.type);          // created, queued, sent, delivered, failed
  console.log(event.notificationId);
  console.log(event.timestamp);
  console.log(event.data);          // Additional event data
});
```

## Custom Providers

```typescript
import { ChannelProvider, Notification, DeliveryResult } from '@vibe/notify-hub';

class MyEmailProvider implements ChannelProvider {
  channel = 'email' as const;

  async send(notification: Notification): Promise<DeliveryResult> {
    // Integrate with your email service (SendGrid, Mailgun, etc.)
    const response = await myEmailService.send({
      to: notification.recipient.email,
      subject: notification.subject,
      html: notification.htmlBody || notification.body,
    });

    return {
      notificationId: notification.id,
      channel: 'email',
      success: response.ok,
      messageId: response.id,
      error: response.error,
      timestamp: new Date(),
    };
  }

  validateRecipient(recipient: Recipient): boolean {
    return !!recipient.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email);
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       NotifyHub                              │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │   Template   │  │   Recipient   │  │    Queue     │     │
│  │    Engine    │  │   Registry    │  │   Manager    │     │
│  └──────────────┘  └───────────────┘  └──────────────┘     │
│         │                 │                   │             │
│         ▼                 ▼                   ▼             │
│  ┌──────────────────────────────────────────────────┐      │
│  │              Delivery Pipeline                    │      │
│  │  1. Resolve template & recipient                 │      │
│  │  2. Queue notification                           │      │
│  │  3. Select provider                              │      │
│  │  4. Send with retry logic                        │      │
│  │  5. Track status & emit events                   │      │
│  └──────────────────────────────────────────────────┘      │
│                           │                                  │
│         ┌─────────────────┴─────────────────┐               │
│         │         Channel Providers          │               │
│  ┌──────┴──────┬──────────┬───────────┬────┴─────┐        │
│  │    Email    │   SMS    │   Push    │  Webhook │        │
│  │  (SendGrid) │ (Twilio) │  (FCM)    │          │        │
│  └─────────────┴──────────┴───────────┴──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

```typescript
interface NotifyHubConfig {
  providers: Partial<Record<NotificationChannel, ChannelProvider>>;
  defaultChannel?: NotificationChannel;
  maxRetries?: number;        // Default: 3
  retryDelay?: number;        // Default: 1000ms
  batchSize?: number;         // Default: 10
  rateLimits?: Partial<Record<NotificationChannel, {
    max: number;              // Max per window
    window: number;           // Window in ms
  }>>;
}
```

## License

MIT
