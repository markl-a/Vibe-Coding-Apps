const emailNotificationService = require('../services/emailNotificationService');

// Mock @sendgrid/mail
jest.mock('@sendgrid/mail', () => {
  const mockSend = jest.fn();
  return {
    setApiKey: jest.fn(),
    send: mockSend,
    _getMockSend: () => mockSend
  };
});

const sgMail = require('@sendgrid/mail');

describe('EmailNotificationService', () => {
  beforeEach(() => {
    emailNotificationService.initialized = false;
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('should initialize with API key and from email', () => {
      emailNotificationService.initialize('test-api-key', 'sender@example.com');

      expect(sgMail.setApiKey).toHaveBeenCalledWith('test-api-key');
      expect(emailNotificationService.fromEmail).toBe('sender@example.com');
      expect(emailNotificationService.initialized).toBe(true);
    });

    test('should use default from email if not provided', () => {
      emailNotificationService.initialize('test-api-key');

      expect(emailNotificationService.fromEmail).toBe('noreply@example.com');
    });

    test('should throw error if API key not provided', () => {
      expect(() => {
        emailNotificationService.initialize();
      }).toThrow('SendGrid API key is required');
    });

    test('should not reinitialize if already initialized', () => {
      emailNotificationService.initialize('key1', 'email1@test.com');
      emailNotificationService.initialize('key2', 'email2@test.com');

      expect(sgMail.setApiKey).toHaveBeenCalledTimes(1);
    });
  });

  describe('Send Email', () => {
    beforeEach(() => {
      emailNotificationService.initialize('test-api-key', 'sender@example.com');
    });

    test('should send email successfully', async () => {
      const mockSend = sgMail._getMockSend();
      mockSend.mockResolvedValue([{
        statusCode: 202,
        headers: { 'x-message-id': 'msg-123' }
      }]);

      const result = await emailNotificationService.sendEmail(
        'recipient@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test text'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text'
      }));
    });

    test('should auto-generate text from HTML if not provided', async () => {
      const mockSend = sgMail._getMockSend();
      mockSend.mockResolvedValue([{
        statusCode: 202,
        headers: { 'x-message-id': 'msg-123' }
      }]);

      await emailNotificationService.sendEmail(
        'recipient@example.com',
        'Test',
        '<p>Hello <strong>World</strong></p>'
      );

      const sentMessage = mockSend.mock.calls[0][0];
      expect(sentMessage.text).toBe('Hello World');
    });

    test('should handle send failure', async () => {
      const mockSend = sgMail._getMockSend();
      mockSend.mockRejectedValue({
        message: 'Invalid recipient email',
        code: 400
      });

      const result = await emailNotificationService.sendEmail(
        'invalid-email',
        'Test',
        '<p>Test</p>'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid recipient email');
      expect(result.code).toBe(400);
    });

    test('should throw error if not initialized', async () => {
      emailNotificationService.initialized = false;

      await expect(
        emailNotificationService.sendEmail('test@test.com', 'Subject', '<p>Body</p>')
      ).rejects.toThrow('Email notification service not initialized');
    });
  });

  describe('Send Bulk Email', () => {
    beforeEach(() => {
      emailNotificationService.initialize('test-api-key', 'sender@example.com');
    });

    test('should send bulk emails', async () => {
      const mockSend = sgMail._getMockSend();
      mockSend.mockResolvedValue([
        { statusCode: 202, headers: { 'x-message-id': 'msg-1' } },
        { statusCode: 202, headers: { 'x-message-id': 'msg-2' } }
      ]);

      const recipients = ['user1@test.com', 'user2@test.com'];
      const result = await emailNotificationService.sendBulkEmail(
        recipients,
        'Bulk Test',
        '<p>Bulk message</p>'
      );

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.messageIds).toHaveLength(2);
    });

    test('should return error for empty recipients', async () => {
      const result = await emailNotificationService.sendBulkEmail(
        [],
        'Test',
        '<p>Test</p>'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No recipients provided');
    });
  });

  describe('Send Template Email', () => {
    beforeEach(() => {
      emailNotificationService.initialize('test-api-key', 'sender@example.com');
    });

    test('should send email with template', async () => {
      const mockSend = sgMail._getMockSend();
      mockSend.mockResolvedValue([{
        statusCode: 202,
        headers: { 'x-message-id': 'msg-123' }
      }]);

      const dynamicData = {
        username: 'John',
        confirmationUrl: 'https://example.com/confirm'
      };

      const result = await emailNotificationService.sendTemplateEmail(
        'user@test.com',
        'template-id-123',
        dynamicData
      );

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@test.com',
        templateId: 'template-id-123',
        dynamicTemplateData: dynamicData
      }));
    });
  });

  describe('Send Email with Attachment', () => {
    beforeEach(() => {
      emailNotificationService.initialize('test-api-key', 'sender@example.com');
    });

    test('should send email with attachments', async () => {
      const mockSend = sgMail._getMockSend();
      mockSend.mockResolvedValue([{
        statusCode: 202,
        headers: { 'x-message-id': 'msg-123' }
      }]);

      const attachments = [
        {
          content: 'base64-content',
          filename: 'document.pdf',
          type: 'application/pdf'
        }
      ];

      const result = await emailNotificationService.sendWithAttachment(
        'user@test.com',
        'Document Attached',
        '<p>Please find attached</p>',
        attachments
      );

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: 'document.pdf',
            type: 'application/pdf'
          })
        ])
      }));
    });

    test('should use default content type for attachments', async () => {
      const mockSend = sgMail._getMockSend();
      mockSend.mockResolvedValue([{
        statusCode: 202,
        headers: { 'x-message-id': 'msg-123' }
      }]);

      const attachments = [{
        content: 'content',
        filename: 'file.txt'
      }];

      await emailNotificationService.sendWithAttachment(
        'user@test.com',
        'Test',
        '<p>Test</p>',
        attachments
      );

      const sentMessage = mockSend.mock.calls[0][0];
      expect(sentMessage.attachments[0].type).toBe('application/octet-stream');
    });
  });

  describe('Create Notification Email Template', () => {
    test('should create HTML email template', () => {
      const html = emailNotificationService.createNotificationEmail(
        'Welcome',
        'Thank you for signing up',
        'https://example.com/verify',
        'Verify Email'
      );

      expect(html).toContain('Welcome');
      expect(html).toContain('Thank you for signing up');
      expect(html).toContain('https://example.com/verify');
      expect(html).toContain('Verify Email');
    });

    test('should create template without action button', () => {
      const html = emailNotificationService.createNotificationEmail(
        'Notification',
        'This is a simple notification'
      );

      expect(html).toContain('Notification');
      expect(html).toContain('This is a simple notification');
      expect(html).not.toContain('View Details');
    });
  });

  describe('HTML Stripping Utility', () => {
    test('should strip HTML tags from text', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const text = emailNotificationService._stripHtml(html);

      expect(text).toBe('Hello World');
    });

    test('should handle multiple spaces', () => {
      const html = '<p>Text   with    spaces</p>';
      const text = emailNotificationService._stripHtml(html);

      expect(text).toBe('Text with spaces');
    });

    test('should handle nested HTML', () => {
      const html = '<div><p><span>Nested <strong>HTML</strong></span></p></div>';
      const text = emailNotificationService._stripHtml(html);

      expect(text).toBe('Nested HTML');
    });
  });
});
