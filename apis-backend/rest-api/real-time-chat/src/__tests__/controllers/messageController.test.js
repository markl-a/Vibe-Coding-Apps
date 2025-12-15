const messageController = require('../../controllers/messageController');
const messageService = require('../../services/messageService');

jest.mock('../../services/messageService');

describe('MessageController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      query: {},
      userId: 'user-123',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const messageData = {
        id: 'message-1',
        room_id: 'room-1',
        user_id: 'user-123',
        content: 'Hello World',
        message_type: 'text',
        created_at: new Date().toISOString(),
      };

      mockReq.params = { roomId: 'room-1' };
      mockReq.body = { content: 'Hello World' };
      messageService.sendMessage.mockResolvedValue(messageData);

      await messageController.sendMessage(mockReq, mockRes);

      expect(messageService.sendMessage).toHaveBeenCalledWith(
        'room-1',
        'user-123',
        'Hello World',
        undefined,
        undefined
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: messageData,
      });
    });

    it('should send message with file attachment', async () => {
      const messageData = {
        id: 'message-2',
        room_id: 'room-1',
        user_id: 'user-123',
        content: 'Check this file',
        message_type: 'file',
        file_url: 'https://example.com/file.pdf',
        created_at: new Date().toISOString(),
      };

      mockReq.params = { roomId: 'room-1' };
      mockReq.body = {
        content: 'Check this file',
        messageType: 'file',
        fileUrl: 'https://example.com/file.pdf',
      };
      messageService.sendMessage.mockResolvedValue(messageData);

      await messageController.sendMessage(mockReq, mockRes);

      expect(messageService.sendMessage).toHaveBeenCalledWith(
        'room-1',
        'user-123',
        'Check this file',
        'file',
        'https://example.com/file.pdf'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: messageData,
      });
    });

    it('should return 400 when content is missing', async () => {
      mockReq.params = { roomId: 'room-1' };
      mockReq.body = {};

      await messageController.sendMessage(mockReq, mockRes);

      expect(messageService.sendMessage).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Message content is required',
      });
    });

    it('should return 400 when content is empty string', async () => {
      mockReq.params = { roomId: 'room-1' };
      mockReq.body = { content: '' };

      await messageController.sendMessage(mockReq, mockRes);

      expect(messageService.sendMessage).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Message content is required',
      });
    });

    it('should handle service errors', async () => {
      mockReq.params = { roomId: 'room-1' };
      mockReq.body = { content: 'Hello' };
      messageService.sendMessage.mockRejectedValue(new Error('User not in room'));

      await messageController.sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not in room',
      });
    });
  });

  describe('getMessages', () => {
    it('should get messages with default pagination', async () => {
      const messages = [
        { id: 'message-1', content: 'Hello' },
        { id: 'message-2', content: 'World' },
      ];

      mockReq.params = { roomId: 'room-1' };
      messageService.getMessages.mockResolvedValue(messages);

      await messageController.getMessages(mockReq, mockRes);

      expect(messageService.getMessages).toHaveBeenCalledWith(
        'room-1',
        'user-123',
        50,
        0
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: messages,
      });
    });

    it('should get messages with custom pagination', async () => {
      const messages = [{ id: 'message-3', content: 'Test' }];

      mockReq.params = { roomId: 'room-1' };
      mockReq.query = { limit: '20', offset: '10' };
      messageService.getMessages.mockResolvedValue(messages);

      await messageController.getMessages(mockReq, mockRes);

      expect(messageService.getMessages).toHaveBeenCalledWith(
        'room-1',
        'user-123',
        20,
        10
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: messages,
      });
    });

    it('should handle service errors', async () => {
      mockReq.params = { roomId: 'room-1' };
      messageService.getMessages.mockRejectedValue(new Error('Room not found'));

      await messageController.getMessages(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Room not found',
      });
    });

    it('should parse string limit and offset to integers', async () => {
      mockReq.params = { roomId: 'room-1' };
      mockReq.query = { limit: '100', offset: '50' };
      messageService.getMessages.mockResolvedValue([]);

      await messageController.getMessages(mockReq, mockRes);

      expect(messageService.getMessages).toHaveBeenCalledWith(
        'room-1',
        'user-123',
        100,
        50
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read successfully', async () => {
      mockReq.params = { messageId: 'message-1' };
      messageService.markAsRead.mockResolvedValue(true);

      await messageController.markAsRead(mockReq, mockRes);

      expect(messageService.markAsRead).toHaveBeenCalledWith('message-1', 'user-123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Message marked as read',
      });
    });

    it('should handle service errors', async () => {
      mockReq.params = { messageId: 'message-1' };
      messageService.markAsRead.mockRejectedValue(new Error('Message not found'));

      await messageController.markAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Message not found',
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread message count successfully', async () => {
      messageService.getUnreadCount.mockResolvedValue(5);

      await messageController.getUnreadCount(mockReq, mockRes);

      expect(messageService.getUnreadCount).toHaveBeenCalledWith('user-123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 5 },
      });
    });

    it('should return zero when no unread messages', async () => {
      messageService.getUnreadCount.mockResolvedValue(0);

      await messageController.getUnreadCount(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 0 },
      });
    });

    it('should handle service errors', async () => {
      messageService.getUnreadCount.mockRejectedValue(new Error('Database error'));

      await messageController.getUnreadCount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
      });
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      mockReq.params = { messageId: 'message-1' };
      messageService.deleteMessage.mockResolvedValue(true);

      await messageController.deleteMessage(mockReq, mockRes);

      expect(messageService.deleteMessage).toHaveBeenCalledWith('message-1', 'user-123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Message deleted successfully',
      });
    });

    it('should handle unauthorized deletion attempts', async () => {
      mockReq.params = { messageId: 'message-1' };
      messageService.deleteMessage.mockRejectedValue(
        new Error('Not authorized to delete this message')
      );

      await messageController.deleteMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to delete this message',
      });
    });

    it('should handle message not found errors', async () => {
      mockReq.params = { messageId: 'nonexistent-message' };
      messageService.deleteMessage.mockRejectedValue(new Error('Message not found'));

      await messageController.deleteMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Message not found',
      });
    });
  });
});
