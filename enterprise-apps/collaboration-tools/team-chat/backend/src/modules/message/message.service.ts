import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { CreateMessageDto, UpdateMessageDto } from './dto';
import { MessageGateway } from './message.gateway';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private messageGateway: MessageGateway,
    private notificationService: NotificationService,
  ) {}

  async create(createMessageDto: CreateMessageDto, userId: string): Promise<Message> {
    const message = this.messageRepository.create({
      ...createMessageDto,
      userId,
      mentions: this.extractMentions(createMessageDto.content),
    });

    const savedMessage = await this.messageRepository.save(message);

    // 加載關聯數據
    const fullMessage = await this.findOne(savedMessage.id);

    // 實時推送給頻道內的所有用戶
    this.messageGateway.broadcastMessage(fullMessage.channelId, fullMessage);

    // 發送通知給被提及的用戶
    for (const mention of fullMessage.mentions) {
      await this.notificationService.sendMentionNotification(
        mention.userId,
        fullMessage,
      );
    }

    return fullMessage;
  }

  async findByChannel(
    channelId: string,
    limit: number = 50,
    before?: string,
  ): Promise<Message[]> {
    const query = this.messageRepository
      .createQueryBuilder('message')
      .where('message.channelId = :channelId', { channelId })
      .andWhere('message.isDeleted = :isDeleted', { isDeleted: false })
      .leftJoinAndSelect('message.user', 'user')
      .orderBy('message.createdAt', 'DESC')
      .limit(limit);

    if (before) {
      query.andWhere('message.createdAt < :before', { before: new Date(before) });
    }

    const messages = await query.getMany();
    return messages.reverse();
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['user', 'channel'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  async update(
    id: string,
    updateMessageDto: UpdateMessageDto,
    userId: string,
  ): Promise<Message> {
    const message = await this.findOne(id);

    if (message.userId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    message.content = updateMessageDto.content;
    message.isEdited = true;
    message.editedAt = new Date();
    message.mentions = this.extractMentions(updateMessageDto.content);

    const updatedMessage = await this.messageRepository.save(message);

    // 實時更新
    this.messageGateway.broadcastMessageUpdate(message.channelId, updatedMessage);

    return updatedMessage;
  }

  async delete(id: string, userId: string): Promise<void> {
    const message = await this.findOne(id);

    if (message.userId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await this.messageRepository.save(message);

    // 實時通知刪除
    this.messageGateway.broadcastMessageDelete(message.channelId, id);
  }

  async addReaction(messageId: string, emoji: string, userId: string): Promise<Message> {
    const message = await this.findOne(messageId);

    // 檢查是否已經添加過該反應
    const existingReaction = message.reactions.find(
      r => r.emoji === emoji && r.userId === userId,
    );

    if (!existingReaction) {
      message.reactions.push({
        emoji,
        userId,
        createdAt: new Date(),
      });

      await this.messageRepository.save(message);

      // 實時更新
      this.messageGateway.broadcastReactionAdded(message.channelId, messageId, {
        emoji,
        userId,
      });
    }

    return message;
  }

  async removeReaction(messageId: string, emoji: string, userId: string): Promise<Message> {
    const message = await this.findOne(messageId);

    message.reactions = message.reactions.filter(
      r => !(r.emoji === emoji && r.userId === userId),
    );

    await this.messageRepository.save(message);

    // 實時更新
    this.messageGateway.broadcastReactionRemoved(message.channelId, messageId, {
      emoji,
      userId,
    });

    return message;
  }

  async getThread(parentId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { threadId: parentId, isDeleted: false },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async pinMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.findOne(messageId);
    message.isPinned = true;
    await this.messageRepository.save(message);

    this.messageGateway.broadcastMessageUpdate(message.channelId, message);

    return message;
  }

  async unpinMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.findOne(messageId);
    message.isPinned = false;
    await this.messageRepository.save(message);

    this.messageGateway.broadcastMessageUpdate(message.channelId, message);

    return message;
  }

  private extractMentions(content: string): { userId: string; username: string }[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: { userId: string; username: string }[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push({
        userId: match[1], // 實際應該從數據庫查詢用戶ID
        username: match[1],
      });
    }

    return mentions;
  }
}
