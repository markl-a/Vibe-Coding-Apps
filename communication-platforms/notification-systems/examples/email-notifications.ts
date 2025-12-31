/**
 * Email Notifications Example
 *
 * Demonstrates email sending with templates, attachments,
 * HTML rendering, and integration with popular email services.
 */

import type {
  ChannelProvider,
  DeliveryResult,
  Notification,
  Recipient,
  NotificationPayload,
} from '../notify-hub/src/types.js';

// Email attachment
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
  encoding?: 'base64' | 'utf8';
  cid?: string; // Content ID for inline images
}

// Email configuration
export interface EmailConfig {
  from: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
  trackOpens?: boolean;
  trackClicks?: boolean;
}

/**
 * SMTP Email Provider
 *
 * Generic SMTP email provider
 */
export class SMTPEmailProvider implements ChannelProvider {
  readonly channel = 'email' as const;
  private config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };

  constructor(config: SMTPEmailProvider['config']) {
    this.config = config;
  }

  validateRecipient(recipient: Recipient): boolean {
    return !!recipient.email && this.isValidEmail(recipient.email);
  }

  async send(notification: Notification): Promise<DeliveryResult> {
    try {
      const recipient = notification.recipient;
      if (!recipient.email) {
        throw new Error('No email address provided');
      }

      const emailConfig = notification.metadata as EmailConfig;

      // Use nodemailer in production
      // const transporter = nodemailer.createTransport(this.config);
      //
      // const info = await transporter.sendMail({
      //   from: emailConfig?.from ?? this.config.auth.user,
      //   to: recipient.email,
      //   subject: notification.subject,
      //   text: notification.body,
      //   html: notification.htmlBody,
      //   attachments: emailConfig?.attachments,
      //   replyTo: emailConfig?.replyTo,
      //   cc: emailConfig?.cc,
      //   bcc: emailConfig?.bcc,
      //   headers: emailConfig?.headers,
      //   priority: emailConfig?.priority ?? 'normal',
      // });

      console.log('Sending email via SMTP');
      console.log('To:', recipient.email);
      console.log('Subject:', notification.subject);

      // Simulate sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        notificationId: notification.id,
        channel: 'email',
        success: true,
        messageId: `smtp_${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        notificationId: notification.id,
        channel: 'email',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * SendGrid Email Provider
 */
export class SendGridProvider implements ChannelProvider {
  readonly channel = 'email' as const;
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  validateRecipient(recipient: Recipient): boolean {
    return !!recipient.email;
  }

  async send(notification: Notification): Promise<DeliveryResult> {
    try {
      const recipient = notification.recipient;
      if (!recipient.email) {
        throw new Error('No email address provided');
      }

      const emailConfig = notification.metadata as EmailConfig;

      const payload = {
        personalizations: [
          {
            to: [{ email: recipient.email, name: recipient.name }],
            cc: emailConfig?.cc?.map((email) => ({ email })),
            bcc: emailConfig?.bcc?.map((email) => ({ email })),
          },
        ],
        from: {
          email: emailConfig?.from ?? this.fromEmail,
        },
        reply_to: emailConfig?.replyTo ? { email: emailConfig.replyTo } : undefined,
        subject: notification.subject ?? 'Notification',
        content: [
          {
            type: 'text/plain',
            value: notification.body,
          },
          notification.htmlBody
            ? {
                type: 'text/html',
                value: notification.htmlBody,
              }
            : undefined,
        ].filter(Boolean),
        attachments: emailConfig?.attachments?.map((att) => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
          type: att.contentType,
          disposition: 'attachment',
          content_id: att.cid,
        })),
        tracking_settings: {
          click_tracking: {
            enable: emailConfig?.trackClicks ?? false,
          },
          open_tracking: {
            enable: emailConfig?.trackOpens ?? false,
          },
        },
      };

      // Use @sendgrid/mail in production
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.apiKey);
      // await sgMail.send(payload);

      console.log('Sending email via SendGrid');
      console.log('To:', recipient.email);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      // Simulate sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        notificationId: notification.id,
        channel: 'email',
        success: true,
        messageId: `sendgrid_${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        notificationId: notification.id,
        channel: 'email',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }
}

/**
 * AWS SES Email Provider
 */
export class SESProvider implements ChannelProvider {
  readonly channel = 'email' as const;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private fromEmail: string;

  constructor(
    region: string,
    accessKeyId: string,
    secretAccessKey: string,
    fromEmail: string
  ) {
    this.region = region;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.fromEmail = fromEmail;
  }

  validateRecipient(recipient: Recipient): boolean {
    return !!recipient.email;
  }

  async send(notification: Notification): Promise<DeliveryResult> {
    try {
      const recipient = notification.recipient;
      if (!recipient.email) {
        throw new Error('No email address provided');
      }

      const emailConfig = notification.metadata as EmailConfig;

      const params = {
        Source: emailConfig?.from ?? this.fromEmail,
        Destination: {
          ToAddresses: [recipient.email],
          CcAddresses: emailConfig?.cc,
          BccAddresses: emailConfig?.bcc,
        },
        Message: {
          Subject: {
            Data: notification.subject ?? 'Notification',
            Charset: 'UTF-8',
          },
          Body: {
            Text: {
              Data: notification.body,
              Charset: 'UTF-8',
            },
            Html: notification.htmlBody
              ? {
                  Data: notification.htmlBody,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
        ReplyToAddresses: emailConfig?.replyTo ? [emailConfig.replyTo] : undefined,
      };

      // Use AWS SDK in production
      // const ses = new AWS.SES({
      //   region: this.region,
      //   accessKeyId: this.accessKeyId,
      //   secretAccessKey: this.secretAccessKey,
      // });
      // const result = await ses.sendEmail(params).promise();

      console.log('Sending email via AWS SES');
      console.log('To:', recipient.email);
      console.log('Params:', JSON.stringify(params, null, 2));

      // Simulate sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        notificationId: notification.id,
        channel: 'email',
        success: true,
        messageId: `ses_${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        notificationId: notification.id,
        channel: 'email',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }
}

/**
 * Email Template Builder
 *
 * Helper to build HTML email templates
 */
export class EmailTemplateBuilder {
  private template: string = '';
  private variables: Record<string, string> = {};

  /**
   * Set base template
   */
  setTemplate(template: string): this {
    this.template = template;
    return this;
  }

  /**
   * Set variable value
   */
  setVariable(key: string, value: string): this {
    this.variables[key] = value;
    return this;
  }

  /**
   * Set multiple variables
   */
  setVariables(variables: Record<string, string>): this {
    Object.assign(this.variables, variables);
    return this;
  }

  /**
   * Build HTML email
   */
  build(): string {
    let html = this.template;

    // Replace variables
    for (const [key, value] of Object.entries(this.variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    }

    return html;
  }

  /**
   * Create welcome email
   */
  static welcomeEmail(userName: string, activationLink: string): string {
    const builder = new EmailTemplateBuilder();

    builder.setTemplate(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f5f5f5; }
          .button { display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Platform!</h1>
          </div>
          <div class="content">
            <h2>Hello {{userName}},</h2>
            <p>Thank you for signing up! We're excited to have you on board.</p>
            <p>Please click the button below to activate your account:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="{{activationLink}}" class="button">Activate Account</a>
            </p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Our Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `);

    builder.setVariables({
      userName,
      activationLink,
    });

    return builder.build();
  }

  /**
   * Create password reset email
   */
  static passwordResetEmail(userName: string, resetLink: string): string {
    const builder = new EmailTemplateBuilder();

    builder.setTemplate(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hello {{userName}},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" class="button">Reset Password</a>
          </p>
          <div class="warning">
            <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </div>
        </div>
      </body>
      </html>
    `);

    builder.setVariables({
      userName,
      resetLink,
    });

    return builder.build();
  }

  /**
   * Create notification email
   */
  static notificationEmail(
    userName: string,
    title: string,
    message: string,
    actionUrl?: string
  ): string {
    const builder = new EmailTemplateBuilder();

    builder.setTemplate(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .notification { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #2196f3; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>{{title}}</h2>
          <p>Hello {{userName}},</p>
          <div class="notification">
            <p>{{message}}</p>
          </div>
          {{actionButton}}
        </div>
      </body>
      </html>
    `);

    builder.setVariables({
      userName,
      title,
      message,
      actionButton: actionUrl
        ? `<p style="text-align: center; margin: 30px 0;"><a href="${actionUrl}" class="button">View Details</a></p>`
        : '',
    });

    return builder.build();
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Send simple email
 */
export async function exampleSimpleEmail(notifyHub: any) {
  const recipient: Recipient = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'John Doe',
  };

  notifyHub.registerRecipient(recipient);

  await notifyHub.send({
    channel: 'email',
    recipient: 'user-123',
    subject: 'Welcome to Our Platform',
    body: 'Thank you for signing up! We are excited to have you on board.',
  } as NotificationPayload);

  console.log('Simple email sent');
}

/**
 * Example: Send HTML email with template
 */
export async function exampleHTMLEmail(notifyHub: any) {
  const htmlBody = EmailTemplateBuilder.welcomeEmail(
    'John Doe',
    'https://example.com/activate/abc123'
  );

  await notifyHub.send({
    channel: 'email',
    recipient: 'user-123',
    subject: 'Activate Your Account',
    body: 'Please activate your account by clicking the link in this email.',
    htmlBody,
  } as NotificationPayload);

  console.log('HTML email sent');
}

/**
 * Example: Email with attachments
 */
export async function exampleEmailWithAttachments(notifyHub: any) {
  const attachments: EmailAttachment[] = [
    {
      filename: 'invoice.pdf',
      content: Buffer.from('PDF content here'),
      contentType: 'application/pdf',
    },
    {
      filename: 'logo.png',
      content: 'base64-encoded-image-data',
      contentType: 'image/png',
      cid: 'logo',
      encoding: 'base64',
    },
  ];

  await notifyHub.send({
    channel: 'email',
    recipient: 'user-123',
    subject: 'Your Invoice',
    body: 'Please find your invoice attached.',
    htmlBody: '<p>Please find your invoice attached.</p><img src="cid:logo" />',
    metadata: {
      attachments,
    } as EmailConfig,
  } as NotificationPayload);

  console.log('Email with attachments sent');
}

/**
 * Example: Bulk email sending
 */
export async function exampleBulkEmail(notifyHub: any) {
  const recipients: Recipient[] = [
    { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
    { id: 'user-2', email: 'user2@example.com', name: 'User 2' },
    { id: 'user-3', email: 'user3@example.com', name: 'User 3' },
  ];

  // Register all recipients
  recipients.forEach((recipient) => notifyHub.registerRecipient(recipient));

  // Send to all
  const notifications = await notifyHub.sendBulk(
    recipients.map((r) => r.id),
    {
      channel: 'email',
      subject: 'Important Announcement',
      body: 'We have an important announcement for you.',
    }
  );

  console.log(`Bulk email sent to ${notifications.length} recipients`);
}

/**
 * Example: Scheduled email
 */
export async function exampleScheduledEmail(notifyHub: any) {
  const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

  await notifyHub.send({
    channel: 'email',
    recipient: 'user-123',
    subject: 'Reminder: Meeting Tomorrow',
    body: 'This is a reminder about your meeting tomorrow at 2 PM.',
    scheduledAt: scheduledTime,
  } as NotificationPayload);

  console.log('Scheduled email for:', scheduledTime);
}

/**
 * Example: Transactional email
 */
export async function exampleTransactionalEmail(notifyHub: any) {
  const orderDetails = {
    orderId: 'ORD-12345',
    total: '$99.99',
    items: ['Item 1', 'Item 2'],
  };

  const htmlBody = `
    <h2>Order Confirmation</h2>
    <p>Thank you for your order!</p>
    <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
    <p><strong>Total:</strong> ${orderDetails.total}</p>
    <h3>Items:</h3>
    <ul>
      ${orderDetails.items.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  `;

  await notifyHub.send({
    channel: 'email',
    recipient: 'user-123',
    subject: `Order Confirmation - ${orderDetails.orderId}`,
    body: 'Your order has been confirmed.',
    htmlBody,
    priority: 'high',
    metadata: {
      from: 'orders@example.com',
      replyTo: 'support@example.com',
    } as EmailConfig,
  } as NotificationPayload);

  console.log('Transactional email sent');
}

/**
 * Example: Email with tracking
 */
export async function exampleTrackedEmail(notifyHub: any) {
  await notifyHub.send({
    channel: 'email',
    recipient: 'user-123',
    subject: 'Check out our new features',
    htmlBody: `
      <h2>New Features Available</h2>
      <p>We have released some exciting new features!</p>
      <a href="https://example.com/features">Learn More</a>
    `,
    metadata: {
      trackOpens: true,
      trackClicks: true,
    } as EmailConfig,
  } as NotificationPayload);

  console.log('Tracked email sent');
}

/**
 * Example: Personalized email campaign
 */
export async function examplePersonalizedCampaign(notifyHub: any) {
  const users = [
    { id: 'user-1', email: 'alice@example.com', name: 'Alice', plan: 'premium' },
    { id: 'user-2', email: 'bob@example.com', name: 'Bob', plan: 'free' },
  ];

  for (const user of users) {
    notifyHub.registerRecipient(user);

    const message =
      user.plan === 'premium'
        ? 'Thank you for being a premium member!'
        : 'Upgrade to premium for more features!';

    const htmlBody = EmailTemplateBuilder.notificationEmail(
      user.name,
      'Special Offer',
      message,
      'https://example.com/upgrade'
    );

    await notifyHub.send({
      channel: 'email',
      recipient: user.id,
      subject: 'Special Offer Just for You',
      htmlBody,
      metadata: {
        from: 'marketing@example.com',
      } as EmailConfig,
    } as NotificationPayload);
  }

  console.log('Personalized campaign sent to', users.length, 'users');
}

/**
 * Example: Email with CC and BCC
 */
export async function exampleEmailCCBCC(notifyHub: any) {
  await notifyHub.send({
    channel: 'email',
    recipient: 'user-123',
    subject: 'Project Update',
    body: 'Here is the latest project update.',
    metadata: {
      cc: ['manager@example.com'],
      bcc: ['archive@example.com'],
    } as EmailConfig,
  } as NotificationPayload);

  console.log('Email sent with CC and BCC');
}

/**
 * Example: Monitor email delivery
 */
export function exampleEmailMonitoring(notifyHub: any) {
  notifyHub.on('sent', (notificationId: string) => {
    console.log('Email sent:', notificationId);
  });

  notifyHub.on('delivered', (notificationId: string) => {
    console.log('Email delivered:', notificationId);
  });

  notifyHub.on('failed', (notificationId: string, data: any) => {
    console.error('Email failed:', notificationId, data.error);
    // Implement retry logic or alert admins
  });

  // Get email statistics
  const stats = notifyHub.getStats();
  console.log('Email Statistics:', {
    total: stats.byChannel.email,
    delivered: stats.byStatus.delivered,
    failed: stats.byStatus.failed,
    deliveryRate: (stats.deliveryRate * 100).toFixed(2) + '%',
  });
}
