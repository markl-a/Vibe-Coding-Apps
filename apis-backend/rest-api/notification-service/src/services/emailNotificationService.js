const sgMail = require('@sendgrid/mail');

class EmailNotificationService {
  constructor() {
    this.initialized = false;
    this.fromEmail = null;
  }

  initialize(apiKey, fromEmail) {
    if (this.initialized) {
      return;
    }

    if (!apiKey) {
      throw new Error('SendGrid API key is required');
    }

    sgMail.setApiKey(apiKey);
    this.fromEmail = fromEmail || 'noreply@example.com';
    this.initialized = true;
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.initialized) {
      throw new Error('Email notification service not initialized');
    }

    const msg = {
      to,
      from: this.fromEmail,
      subject,
      html,
      text: text || this._stripHtml(html)
    };

    try {
      const response = await sgMail.send(msg);
      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async sendBulkEmail(recipients, subject, html, text = null) {
    if (!this.initialized) {
      throw new Error('Email notification service not initialized');
    }

    if (!recipients || recipients.length === 0) {
      return {
        success: false,
        error: 'No recipients provided'
      };
    }

    const messages = recipients.map(to => ({
      to,
      from: this.fromEmail,
      subject,
      html,
      text: text || this._stripHtml(html)
    }));

    try {
      const response = await sgMail.send(messages);
      return {
        success: true,
        count: recipients.length,
        messageIds: response.map(r => r.headers['x-message-id'])
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async sendTemplateEmail(to, templateId, dynamicData = {}) {
    if (!this.initialized) {
      throw new Error('Email notification service not initialized');
    }

    const msg = {
      to,
      from: this.fromEmail,
      templateId,
      dynamicTemplateData: dynamicData
    };

    try {
      const response = await sgMail.send(msg);
      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async sendWithAttachment(to, subject, html, attachments = []) {
    if (!this.initialized) {
      throw new Error('Email notification service not initialized');
    }

    const msg = {
      to,
      from: this.fromEmail,
      subject,
      html,
      attachments: attachments.map(att => ({
        content: att.content,
        filename: att.filename,
        type: att.type || 'application/octet-stream',
        disposition: att.disposition || 'attachment'
      }))
    };

    try {
      const response = await sgMail.send(msg);
      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  createNotificationEmail(title, body, actionUrl = null, actionText = 'View Details') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <p>${body}</p>
            ${actionUrl ? `<a href="${actionUrl}" class="button">${actionText}</a>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  _stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

module.exports = new EmailNotificationService();
