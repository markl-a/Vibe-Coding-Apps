// Mock the database module before importing anything else
jest.mock('../../utils/db', () => require('../helpers/mockDb'));

const messageService = require('../../services/messageService');
const roomService = require('../../services/roomService');
const authService = require('../../services/authService');
const { clearMocks } = require('../helpers/mockDb');

describe('MessageService', () => {
  let user1, user2, room;

  beforeEach(async () => {
    clearMocks();
    const result1 = await authService.register('user1', 'user1@example.com', 'password123');
    const result2 = await authService.register('user2', 'user2@example.com', 'password123');
    user1 = result1.user;
    user2 = result2.user;

    room = await roomService.createRoom(user1.id, 'Test Room', 'Description');
    await roomService.joinRoom(room.id, user2.id);
  });

  describe('sendMessage', () => {
    it('should send a text message successfully', async () => {
      const message = await messageService.sendMessage(room.id, user1.id, 'Hello, world!');

      expect(message).toHaveProperty('id');
      expect(message.room_id).toBe(room.id);
      expect(message.user_id).toBe(user1.id);
      expect(message.content).toBe('Hello, world!');
      expect(message.message_type).toBe('text');
    });

    it('should send a message with file', async () => {
      const message = await messageService.sendMessage(
        room.id,
        user1.id,
        'Check this file',
        'file',
        'https://example.com/file.pdf'
      );

      expect(message.message_type).toBe('file');
      expect(message.file_url).toBe('https://example.com/file.pdf');
    });

    it('should throw error if user is not a room member', async () => {
      const result3 = await authService.register('user3', 'user3@example.com', 'password123');

      await expect(
        messageService.sendMessage(room.id, result3.user.id, 'Hello')
      ).rejects.toThrow('You are not a member of this room');
    });

    it('should create message with timestamp', async () => {
      const message = await messageService.sendMessage(room.id, user1.id, 'Test message');

      expect(message).toHaveProperty('created_at');
      expect(new Date(message.created_at)).toBeInstanceOf(Date);
    });
  });

  describe('getMessages', () => {
    beforeEach(async () => {
      await messageService.sendMessage(room.id, user1.id, 'Message 1');
      await messageService.sendMessage(room.id, user2.id, 'Message 2');
      await messageService.sendMessage(room.id, user1.id, 'Message 3');
    });

    it('should get messages for a room', async () => {
      const messages = await messageService.getMessages(room.id, user1.id);

      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('Message 1');
      expect(messages[1].content).toBe('Message 2');
      expect(messages[2].content).toBe('Message 3');
    });

    it('should include sender information in messages', async () => {
      const messages = await messageService.getMessages(room.id, user1.id);

      expect(messages[0]).toHaveProperty('username');
      expect(messages[0]).toHaveProperty('display_name');
    });

    it('should respect limit parameter', async () => {
      const messages = await messageService.getMessages(room.id, user1.id, 2);

      expect(messages.length).toBeLessThanOrEqual(2);
    });

    it('should throw error if user is not a room member', async () => {
      const result3 = await authService.register('user3', 'user3@example.com', 'password123');

      await expect(
        messageService.getMessages(room.id, result3.user.id)
      ).rejects.toThrow('You are not a member of this room');
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      const message = await messageService.sendMessage(room.id, user1.id, 'Test message');
      const result = await messageService.markAsRead(message.id, user2.id);

      expect(result).toBe(true);
    });

    it('should handle duplicate read marks gracefully', async () => {
      const message = await messageService.sendMessage(room.id, user1.id, 'Test message');
      await messageService.markAsRead(message.id, user2.id);
      const result = await messageService.markAsRead(message.id, user2.id);

      expect(result).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count', async () => {
      const count = await messageService.getUnreadCount(user1.id);

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getMessageById', () => {
    it('should return message by ID', async () => {
      const sentMessage = await messageService.sendMessage(room.id, user1.id, 'Test message');
      const message = await messageService.getMessageById(sentMessage.id);

      expect(message.id).toBe(sentMessage.id);
      expect(message.content).toBe('Test message');
    });

    it('should throw error if message not found', async () => {
      await expect(
        messageService.getMessageById('non-existent-id')
      ).rejects.toThrow('Message not found');
    });
  });

  describe('deleteMessage', () => {
    it('should delete own message', async () => {
      const message = await messageService.sendMessage(room.id, user1.id, 'Test message');
      const result = await messageService.deleteMessage(message.id, user1.id);

      expect(result).toBe(true);

      await expect(
        messageService.getMessageById(message.id)
      ).rejects.toThrow('Message not found');
    });

    it('should throw error when deleting other user message', async () => {
      const message = await messageService.sendMessage(room.id, user1.id, 'Test message');

      await expect(
        messageService.deleteMessage(message.id, user2.id)
      ).rejects.toThrow('You can only delete your own messages');
    });
  });
});
