/**
 * Notification Hub Examples
 */

import {
  NotifyHub,
  MockEmailProvider,
  MockSMSProvider,
  MockPushProvider,
  InAppProvider,
  TemplateEngine,
} from './index.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Notification Hub Examples');
  console.log('='.repeat(60));

  // Create hub with providers
  const hub = new NotifyHub({
    providers: {
      email: new MockEmailProvider(),
      sms: new MockSMSProvider(),
      push: new MockPushProvider(),
      in_app: new InAppProvider(),
    },
    maxRetries: 3,
    retryDelay: 500,
  });

  // Register recipients
  hub.registerRecipient({
    id: 'user_1',
    email: 'alice@example.com',
    phone: '+1234567890',
    deviceTokens: ['device_token_123'],
    userId: 'user_1',
    name: 'Alice',
    preferences: {
      channels: ['email', 'push'],
      quietHours: {
        start: '22:00',
        end: '08:00',
        timezone: 'America/New_York',
      },
    },
  });

  hub.registerRecipient({
    id: 'user_2',
    email: 'bob@example.com',
    phone: '+0987654321',
    deviceTokens: ['device_token_456'],
    userId: 'user_2',
    name: 'Bob',
  });

  // Example 1: Simple email notification
  console.log('\n📧 Example 1: Simple Email');
  console.log('-'.repeat(40));

  const email = await hub.send({
    channel: 'email',
    recipient: 'user_1',
    subject: 'Test Notification',
    body: 'This is a test email notification.',
    priority: 'normal',
  });

  console.log(`Sent notification: ${email.id}`);
  console.log(`Status: ${email.status}`);

  // Wait for delivery
  await new Promise((r) => setTimeout(r, 600));
  const updated = hub.get(email.id);
  console.log(`Final status: ${updated?.status}`);

  // Example 2: Using templates
  console.log('\n📝 Example 2: Template-based Notification');
  console.log('-'.repeat(40));

  const welcome = await hub.send({
    channel: 'email',
    recipient: 'user_1',
    template: 'welcome',
    data: {
      name: 'Alice',
      appName: 'NotifyHub',
      dashboardUrl: 'https://app.example.com/dashboard',
    },
  });

  console.log(`Sent welcome email: ${welcome.id}`);
  console.log(`Body preview: ${welcome.body.substring(0, 50)}...`);

  // Example 3: SMS notification
  console.log('\n📱 Example 3: SMS Notification');
  console.log('-'.repeat(40));

  const sms = await hub.send({
    channel: 'sms',
    recipient: 'user_2',
    template: 'otp_sms',
    data: {
      code: '123456',
      expiresIn: '5 minutes',
    },
    priority: 'urgent',
  });

  console.log(`Sent OTP SMS: ${sms.id}`);
  console.log(`Body: ${sms.body}`);

  // Example 4: Multi-channel notification
  console.log('\n🔔 Example 4: Multi-channel Notification');
  console.log('-'.repeat(40));

  const multiChannel = await hub.sendMultiChannel(
    'user_1',
    ['email', 'push', 'in_app'],
    {
      subject: 'Important Update',
      body: 'Your account settings have been updated.',
      category: 'account',
      priority: 'high',
    }
  );

  console.log(`Sent to ${multiChannel.length} channels:`);
  multiChannel.forEach((n) => console.log(`  - ${n.channel}: ${n.id}`));

  // Example 5: Bulk notifications
  console.log('\n📢 Example 5: Bulk Notification');
  console.log('-'.repeat(40));

  const bulk = await hub.sendBulk(['user_1', 'user_2'], {
    channel: 'email',
    subject: 'System Maintenance Notice',
    body: 'Scheduled maintenance will occur tonight at midnight.',
    category: 'system',
    groupId: 'maintenance_notice_1',
  });

  console.log(`Sent ${bulk.length} bulk notifications`);
  console.log(`Group ID: ${bulk[0].groupId}`);

  // Example 6: Custom template
  console.log('\n🎨 Example 6: Custom Template');
  console.log('-'.repeat(40));

  const templates = hub.getTemplates();
  templates.register(
    TemplateEngine.create(
      'invoice',
      'Invoice Notification',
      'email',
      'Hi {{customerName}}, your invoice #{{invoiceNumber}} for {{amount}} is ready.',
      {
        subject: 'Invoice #{{invoiceNumber}} - {{amount}}',
        htmlBody: `
          <h2>Invoice #{{invoiceNumber}}</h2>
          <p>Dear {{customerName}},</p>
          <p>Your invoice for <strong>{{amount}}</strong> is now available.</p>
          <p><a href="{{invoiceUrl}}">View Invoice</a></p>
        `,
        category: 'billing',
      }
    )
  );

  const invoice = await hub.send({
    channel: 'email',
    recipient: 'user_1',
    template: 'invoice',
    data: {
      customerName: 'Alice',
      invoiceNumber: 'INV-2024-001',
      amount: '$150.00',
      invoiceUrl: 'https://billing.example.com/invoice/001',
    },
  });

  console.log(`Sent invoice notification: ${invoice.id}`);
  console.log(`Subject: ${invoice.subject}`);

  // Example 7: Scheduled notification
  console.log('\n⏰ Example 7: Scheduled Notification');
  console.log('-'.repeat(40));

  const scheduledTime = new Date(Date.now() + 2000); // 2 seconds from now
  const scheduled = await hub.send({
    channel: 'email',
    recipient: 'user_1',
    subject: 'Scheduled Reminder',
    body: 'This is a scheduled notification.',
    scheduledAt: scheduledTime,
  });

  console.log(`Scheduled notification: ${scheduled.id}`);
  console.log(`Status: ${scheduled.status}`);
  console.log(`Scheduled for: ${scheduledTime.toISOString()}`);

  // Wait for stats
  await new Promise((r) => setTimeout(r, 1500));

  // Example 8: Query notifications
  console.log('\n🔍 Example 8: Query Notifications');
  console.log('-'.repeat(40));

  const emailNotifications = hub.query({
    channels: ['email'],
    status: ['sent', 'delivered'],
  });

  console.log(`Found ${emailNotifications.length} email notifications`);

  const highPriority = hub.query({
    priority: ['high', 'urgent'],
  });

  console.log(`Found ${highPriority.length} high priority notifications`);

  // Example 9: Statistics
  console.log('\n📊 Example 9: Statistics');
  console.log('-'.repeat(40));

  const stats = hub.getStats();
  console.log(`Total notifications: ${stats.total}`);
  console.log('By channel:');
  Object.entries(stats.byChannel).forEach(([ch, count]) => {
    if (count > 0) console.log(`  ${ch}: ${count}`);
  });
  console.log('By status:');
  Object.entries(stats.byStatus).forEach(([st, count]) => {
    if (count > 0) console.log(`  ${st}: ${count}`);
  });
  console.log(`Delivery rate: ${(stats.deliveryRate * 100).toFixed(1)}%`);

  // Example 10: Events
  console.log('\n📜 Example 10: Recent Events');
  console.log('-'.repeat(40));

  const events = hub.getEvents(10);
  console.log(`Last ${events.length} events:`);
  events.slice(-5).forEach((e) => {
    console.log(`  [${e.type}] ${e.notificationId.substring(0, 20)}...`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('Examples complete!');
}

main().catch(console.error);
