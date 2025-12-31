import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from '../modules/message/message.service';
import { Message, MessageType } from '../modules/message/message.entity';
import { CreateMessageDto, UpdateMessageDto } from '../modules/message/dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('MessageService', () => {
  let service: MessageService;
  let messageRepository: Repository<Message>;
  let messageGateway: any;
  let notificationService: any;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockChannel = {
    id: 'channel-123',
    name: 'test-channel',
  };

  const mockMessage: Message = {
    id: 'message-123',
    channelId: 'channel-123',
    userId: 'user-123',
    content: 'Test message',
    type: MessageType.TEXT,
    attachments: [],
    reactions: [],
    mentions: [],
    threadId: null,
    replyCount: 0,
    isEdited: false,
    isDeleted: false,
    isPinned: false,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    editedAt: null,
    deletedAt: null,
    user: mockUser as any,
    channel: mockChannel as any,
    thread: null,
    replies: [],
  };

  beforeEach(() => {
    // Mock repository
    messageRepository = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      createQueryBuilder: vi.fn(),
    } as any;

    // Mock gateway
    messageGateway = {
      broadcastMessage: vi.fn(),
      broadcastMessageUpdate: vi.fn(),
      broadcastMessageDelete: vi.fn(),
      broadcastReactionAdded: vi.fn(),
      broadcastReactionRemoved: vi.fn(),
    };

    // Mock notification service
    notificationService = {
      sendMentionNotification: vi.fn(),
    };

    service = new MessageService(
      messageRepository,
      messageGateway,
      notificationService,
    );
  });

  describe('create (Send Message)', () => {
    it('should create and send a text message successfully', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'Hello world',
        type: MessageType.TEXT,
      };

      const createdMessage = { ...mockMessage, id: 'new-message-id' };
      const fullMessage = { ...createdMessage };

      vi.spyOn(messageRepository, 'create').mockReturnValue(createdMessage as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(createdMessage as any);
      vi.spyOn(service, 'findOne').mockResolvedValue(fullMessage as any);

      const result = await service.create(createDto, 'user-123');

      expect(messageRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId: 'user-123',
        mentions: [],
      });
      expect(messageRepository.save).toHaveBeenCalled();
      expect(messageGateway.broadcastMessage).toHaveBeenCalledWith(
        'channel-123',
        fullMessage,
      );
      expect(result).toEqual(fullMessage);
    });

    it('should create message with attachments', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'Check this file',
        type: MessageType.FILE,
        attachments: [
          {
            id: 'att-1',
            filename: 'document.pdf',
            url: 'https://storage.example.com/document.pdf',
            size: 1024000,
            mimeType: 'application/pdf',
            uploadedAt: new Date(),
          },
        ],
      };

      const messageWithAttachment = {
        ...mockMessage,
        attachments: createDto.attachments,
        type: MessageType.FILE,
      };

      vi.spyOn(messageRepository, 'create').mockReturnValue(messageWithAttachment as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(messageWithAttachment as any);
      vi.spyOn(service, 'findOne').mockResolvedValue(messageWithAttachment as any);

      const result = await service.create(createDto, 'user-123');

      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].filename).toBe('document.pdf');
      expect(result.type).toBe(MessageType.FILE);
    });

    it('should extract and handle mentions correctly', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'Hey @john and @jane, check this out!',
        type: MessageType.TEXT,
      };

      const messageWithMentions = {
        ...mockMessage,
        content: createDto.content,
        mentions: [
          { userId: 'john', username: 'john' },
          { userId: 'jane', username: 'jane' },
        ],
      };

      vi.spyOn(messageRepository, 'create').mockReturnValue(messageWithMentions as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(messageWithMentions as any);
      vi.spyOn(service, 'findOne').mockResolvedValue(messageWithMentions as any);

      const result = await service.create(createDto, 'user-123');

      expect(result.mentions).toHaveLength(2);
      expect(result.mentions[0].username).toBe('john');
      expect(result.mentions[1].username).toBe('jane');
    });

    it('should send mention notifications to mentioned users', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'Hey @john!',
        type: MessageType.TEXT,
      };

      const messageWithMentions = {
        ...mockMessage,
        mentions: [{ userId: 'john', username: 'john' }],
      };

      vi.spyOn(messageRepository, 'create').mockReturnValue(messageWithMentions as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(messageWithMentions as any);
      vi.spyOn(service, 'findOne').mockResolvedValue(messageWithMentions as any);

      await service.create(createDto, 'user-123');

      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        'john',
        messageWithMentions,
      );
    });

    it('should create threaded message (reply)', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'This is a reply',
        type: MessageType.TEXT,
        threadId: 'parent-message-id',
      };

      const threadedMessage = {
        ...mockMessage,
        threadId: 'parent-message-id',
      };

      vi.spyOn(messageRepository, 'create').mockReturnValue(threadedMessage as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(threadedMessage as any);
      vi.spyOn(service, 'findOne').mockResolvedValue(threadedMessage as any);

      const result = await service.create(createDto, 'user-123');

      expect(result.threadId).toBe('parent-message-id');
    });

    it('should broadcast message to channel after creation', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'Broadcast test',
        type: MessageType.TEXT,
      };

      vi.spyOn(messageRepository, 'create').mockReturnValue(mockMessage as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(mockMessage as any);
      vi.spyOn(service, 'findOne').mockResolvedValue(mockMessage as any);

      await service.create(createDto, 'user-123');

      expect(messageGateway.broadcastMessage).toHaveBeenCalledWith(
        'channel-123',
        mockMessage,
      );
    });
  });

  describe('update (Edit Message)', () => {
    it('should update message content successfully', async () => {
      const updateDto: UpdateMessageDto = {
        content: 'Updated content',
      };

      const updatedMessage = {
        ...mockMessage,
        content: 'Updated content',
        isEdited: true,
        editedAt: new Date(),
      };

      vi.spyOn(service, 'findOne').mockResolvedValue(mockMessage as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(updatedMessage as any);

      const result = await service.update('message-123', updateDto, 'user-123');

      expect(result.content).toBe('Updated content');
      expect(result.isEdited).toBe(true);
      expect(result.editedAt).toBeDefined();
      expect(messageGateway.broadcastMessageUpdate).toHaveBeenCalled();
    });

    it('should update mentions when editing message', async () => {
      const updateDto: UpdateMessageDto = {
        content: 'Updated with @alice mention',
      };

      const updatedMessage = {
        ...mockMessage,
        content: updateDto.content,
        mentions: [{ userId: 'alice', username: 'alice' }],
        isEdited: true,
      };

      vi.spyOn(service, 'findOne').mockResolvedValue(mockMessage as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(updatedMessage as any);

      const result = await service.update('message-123', updateDto, 'user-123');

      expect(result.mentions).toHaveLength(1);
      expect(result.mentions[0].username).toBe('alice');
    });

    it('should throw ForbiddenException when user tries to edit others message', async () => {
      vi.spyOn(service, 'findOne').mockResolvedValue(mockMessage as any);

      await expect(
        service.update('message-123', { content: 'Hack' }, 'different-user'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.update('message-123', { content: 'Hack' }, 'different-user'),
      ).rejects.toThrow('You can only edit your own messages');
    });

    it('should broadcast update to channel', async () => {
      const updateDto: UpdateMessageDto = {
        content: 'Updated content',
      };

      vi.spyOn(service, 'findOne').mockResolvedValue(mockMessage as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(mockMessage as any);

      await service.update('message-123', updateDto, 'user-123');

      expect(messageGateway.broadcastMessageUpdate).toHaveBeenCalledWith(
        'channel-123',
        mockMessage,
      );
    });

    it('should throw NotFoundException when message does not exist', async () => {
      vi.spyOn(service, 'findOne').mockRejectedValue(
        new NotFoundException('Message with ID invalid-id not found'),
      );

      await expect(
        service.update('invalid-id', { content: 'Test' }, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete (Delete Message)', () => {
    it('should soft delete message successfully', async () => {
      const deletedMessage = {
        ...mockMessage,
        isDeleted: true,
        deletedAt: new Date(),
      };

      vi.spyOn(service, 'findOne').mockResolvedValue(mockMessage as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(deletedMessage as any);

      await service.delete('message-123', 'user-123');

      expect(messageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isDeleted: true,
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('should throw ForbiddenException when user tries to delete others message', async () => {
      vi.spyOn(service, 'findOne').mockResolvedValue(mockMessage as any);

      await expect(
        service.delete('message-123', 'different-user'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.delete('message-123', 'different-user'),
      ).rejects.toThrow('You can only delete your own messages');
    });

    it('should broadcast delete notification to channel', async () => {
      vi.spyOn(service, 'findOne').mockResolvedValue(mockMessage as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(mockMessage as any);

      await service.delete('message-123', 'user-123');

      expect(messageGateway.broadcastMessageDelete).toHaveBeenCalledWith(
        'channel-123',
        'message-123',
      );
    });

    it('should throw NotFoundException when message does not exist', async () => {
      vi.spyOn(service, 'findOne').mockRejectedValue(
        new NotFoundException('Message with ID invalid-id not found'),
      );

      await expect(
        service.delete('invalid-id', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByChannel (Get Messages by Channel)', () => {
    it('should return messages for a channel', async () => {
      const messages = [
        { ...mockMessage, id: 'msg-1', createdAt: new Date('2024-01-01T10:00:00Z') },
        { ...mockMessage, id: 'msg-2', createdAt: new Date('2024-01-01T11:00:00Z') },
        { ...mockMessage, id: 'msg-3', createdAt: new Date('2024-01-01T12:00:00Z') },
      ];

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([...messages].reverse()),
      };

      vi.spyOn(messageRepository, 'createQueryBuilder').mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findByChannel('channel-123', 50);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('msg-1');
      expect(result[2].id).toBe('msg-3');
    });

    it('should filter out deleted messages', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([mockMessage]),
      };

      vi.spyOn(messageRepository, 'createQueryBuilder').mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.findByChannel('channel-123');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'message.isDeleted = :isDeleted',
        { isDeleted: false },
      );
    });

    it('should support pagination with before parameter', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([mockMessage]),
      };

      vi.spyOn(messageRepository, 'createQueryBuilder').mockReturnValue(
        mockQueryBuilder as any,
      );

      const beforeDate = '2024-01-01T10:00:00Z';
      await service.findByChannel('channel-123', 50, beforeDate);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'message.createdAt < :before',
        { before: new Date(beforeDate) },
      );
    });

    it('should respect limit parameter', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };

      vi.spyOn(messageRepository, 'createQueryBuilder').mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.findByChannel('channel-123', 100);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(100);
    });

    it('should include user information with messages', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([mockMessage]),
      };

      vi.spyOn(messageRepository, 'createQueryBuilder').mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.findByChannel('channel-123');

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'message.user',
        'user',
      );
    });
  });

  describe('findOne', () => {
    it('should return a message by id with relations', async () => {
      vi.spyOn(messageRepository, 'findOne').mockResolvedValue(mockMessage as any);

      const result = await service.findOne('message-123');

      expect(result).toEqual(mockMessage);
      expect(messageRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'message-123' },
        relations: ['user', 'channel'],
      });
    });

    it('should throw NotFoundException when message not found', async () => {
      vi.spyOn(messageRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Message with ID invalid-id not found',
      );
    });
  });

  describe('addReaction', () => {
    it('should add reaction to message', async () => {
      const messageWithoutReaction = { ...mockMessage, reactions: [] };
      const messageWithReaction = {
        ...mockMessage,
        reactions: [
          {
            emoji: '👍',
            userId: 'user-123',
            createdAt: expect.any(Date),
          },
        ],
      };

      vi.spyOn(service, 'findOne').mockResolvedValue(messageWithoutReaction as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(messageWithReaction as any);

      const result = await service.addReaction('message-123', '👍', 'user-123');

      expect(messageRepository.save).toHaveBeenCalled();
      expect(messageGateway.broadcastReactionAdded).toHaveBeenCalledWith(
        'channel-123',
        'message-123',
        { emoji: '👍', userId: 'user-123' },
      );
    });

    it('should not add duplicate reaction', async () => {
      const messageWithReaction = {
        ...mockMessage,
        reactions: [
          {
            emoji: '👍',
            userId: 'user-123',
            createdAt: new Date(),
          },
        ],
      };

      vi.spyOn(service, 'findOne').mockResolvedValue(messageWithReaction as any);

      await service.addReaction('message-123', '👍', 'user-123');

      expect(messageRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeReaction', () => {
    it('should remove reaction from message', async () => {
      const messageWithReaction = {
        ...mockMessage,
        reactions: [
          {
            emoji: '👍',
            userId: 'user-123',
            createdAt: new Date(),
          },
        ],
      };

      vi.spyOn(service, 'findOne').mockResolvedValue(messageWithReaction as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(mockMessage as any);

      await service.removeReaction('message-123', '👍', 'user-123');

      expect(messageRepository.save).toHaveBeenCalled();
      expect(messageGateway.broadcastReactionRemoved).toHaveBeenCalledWith(
        'channel-123',
        'message-123',
        { emoji: '👍', userId: 'user-123' },
      );
    });
  });

  describe('getThread', () => {
    it('should return thread replies', async () => {
      const replies = [
        { ...mockMessage, id: 'reply-1', threadId: 'parent-123' },
        { ...mockMessage, id: 'reply-2', threadId: 'parent-123' },
      ];

      vi.spyOn(messageRepository, 'find').mockResolvedValue(replies as any);

      const result = await service.getThread('parent-123');

      expect(result).toHaveLength(2);
      expect(messageRepository.find).toHaveBeenCalledWith({
        where: { threadId: 'parent-123', isDeleted: false },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('pinMessage', () => {
    it('should pin message successfully', async () => {
      const pinnedMessage = { ...mockMessage, isPinned: true };

      vi.spyOn(service, 'findOne').mockResolvedValue(mockMessage as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(pinnedMessage as any);

      const result = await service.pinMessage('message-123', 'user-123');

      expect(result.isPinned).toBe(true);
      expect(messageGateway.broadcastMessageUpdate).toHaveBeenCalled();
    });
  });

  describe('unpinMessage', () => {
    it('should unpin message successfully', async () => {
      const pinnedMessage = { ...mockMessage, isPinned: true };
      const unpinnedMessage = { ...mockMessage, isPinned: false };

      vi.spyOn(service, 'findOne').mockResolvedValue(pinnedMessage as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(unpinnedMessage as any);

      const result = await service.unpinMessage('message-123', 'user-123');

      expect(result.isPinned).toBe(false);
      expect(messageGateway.broadcastMessageUpdate).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'Test',
        type: MessageType.TEXT,
      };

      vi.spyOn(messageRepository, 'create').mockReturnValue(mockMessage as any);
      vi.spyOn(messageRepository, 'save').mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.create(createDto, 'user-123')).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle invalid message id in findOne', async () => {
      vi.spyOn(messageRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle authorization errors in update', async () => {
      vi.spyOn(service, 'findOne').mockResolvedValue(mockMessage as any);

      await expect(
        service.update('message-123', { content: 'Test' }, 'wrong-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle authorization errors in delete', async () => {
      vi.spyOn(service, 'findOne').mockResolvedValue(mockMessage as any);

      await expect(
        service.delete('message-123', 'wrong-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle empty channel query', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };

      vi.spyOn(messageRepository, 'createQueryBuilder').mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findByChannel('empty-channel');

      expect(result).toEqual([]);
    });
  });

  describe('Attachment Handling', () => {
    it('should handle multiple attachments', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'Multiple files',
        type: MessageType.FILE,
        attachments: [
          {
            id: 'att-1',
            filename: 'file1.pdf',
            url: 'https://storage.example.com/file1.pdf',
            size: 1024,
            mimeType: 'application/pdf',
            uploadedAt: new Date(),
          },
          {
            id: 'att-2',
            filename: 'file2.jpg',
            url: 'https://storage.example.com/file2.jpg',
            size: 2048,
            mimeType: 'image/jpeg',
            uploadedAt: new Date(),
          },
        ],
      };

      const messageWithAttachments = {
        ...mockMessage,
        attachments: createDto.attachments,
      };

      vi.spyOn(messageRepository, 'create').mockReturnValue(messageWithAttachments as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(messageWithAttachments as any);
      vi.spyOn(service, 'findOne').mockResolvedValue(messageWithAttachments as any);

      const result = await service.create(createDto, 'user-123');

      expect(result.attachments).toHaveLength(2);
      expect(result.attachments[0].filename).toBe('file1.pdf');
      expect(result.attachments[1].filename).toBe('file2.jpg');
    });

    it('should handle image attachments', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'Check this image',
        type: MessageType.IMAGE,
        attachments: [
          {
            id: 'img-1',
            filename: 'screenshot.png',
            url: 'https://storage.example.com/screenshot.png',
            size: 512000,
            mimeType: 'image/png',
            uploadedAt: new Date(),
          },
        ],
      };

      const messageWithImage = {
        ...mockMessage,
        type: MessageType.IMAGE,
        attachments: createDto.attachments,
      };

      vi.spyOn(messageRepository, 'create').mockReturnValue(messageWithImage as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(messageWithImage as any);
      vi.spyOn(service, 'findOne').mockResolvedValue(messageWithImage as any);

      const result = await service.create(createDto, 'user-123');

      expect(result.type).toBe(MessageType.IMAGE);
      expect(result.attachments[0].mimeType).toBe('image/png');
    });
  });

  describe('Mention Notifications', () => {
    it('should send notifications to all mentioned users', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'Hey @alice, @bob, and @charlie!',
        type: MessageType.TEXT,
      };

      const messageWithMentions = {
        ...mockMessage,
        mentions: [
          { userId: 'alice', username: 'alice' },
          { userId: 'bob', username: 'bob' },
          { userId: 'charlie', username: 'charlie' },
        ],
      };

      vi.spyOn(messageRepository, 'create').mockReturnValue(messageWithMentions as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(messageWithMentions as any);
      vi.spyOn(service, 'findOne').mockResolvedValue(messageWithMentions as any);

      await service.create(createDto, 'user-123');

      expect(notificationService.sendMentionNotification).toHaveBeenCalledTimes(3);
      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        'alice',
        messageWithMentions,
      );
      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        'bob',
        messageWithMentions,
      );
      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        'charlie',
        messageWithMentions,
      );
    });

    it('should not send notifications when no mentions', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'No mentions here',
        type: MessageType.TEXT,
      };

      const messageWithoutMentions = {
        ...mockMessage,
        mentions: [],
      };

      vi.spyOn(messageRepository, 'create').mockReturnValue(messageWithoutMentions as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(messageWithoutMentions as any);
      vi.spyOn(service, 'findOne').mockResolvedValue(messageWithoutMentions as any);

      await service.create(createDto, 'user-123');

      expect(notificationService.sendMentionNotification).not.toHaveBeenCalled();
    });

    it('should extract mentions from message content correctly', async () => {
      const createDto: CreateMessageDto = {
        channelId: 'channel-123',
        content: 'Testing @user1 and @user2 mentions',
        type: MessageType.TEXT,
      };

      const messageWithMentions = {
        ...mockMessage,
        content: createDto.content,
        mentions: [
          { userId: 'user1', username: 'user1' },
          { userId: 'user2', username: 'user2' },
        ],
      };

      vi.spyOn(messageRepository, 'create').mockReturnValue(messageWithMentions as any);
      vi.spyOn(messageRepository, 'save').mockResolvedValue(messageWithMentions as any);
      vi.spyOn(service, 'findOne').mockResolvedValue(messageWithMentions as any);

      const result = await service.create(createDto, 'user-123');

      expect(result.mentions).toHaveLength(2);
      expect(result.mentions.map(m => m.username)).toContain('user1');
      expect(result.mentions.map(m => m.username)).toContain('user2');
    });
  });
});
