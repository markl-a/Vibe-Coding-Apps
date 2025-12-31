/**
 * NestJS DTO Swagger 注解示例
 * 展示如何在 DTO 中使用 Swagger 装饰器定义数据结构
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 消息类型枚举
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  VIDEO = 'video',
  SYSTEM = 'system',
}

/**
 * 附件数据传输对象
 */
export class AttachmentDto {
  @ApiProperty({
    description: '附件 URL',
    example: 'https://example.com/files/document.pdf',
    type: String,
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: '附件 MIME 类型',
    example: 'application/pdf',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: '附件大小（字节）',
    example: 256789,
    type: Number,
  })
  @IsNumber()
  size: number;

  @ApiPropertyOptional({
    description: '附件名称',
    example: 'project-proposal.pdf',
    type: String,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: '缩略图 URL（仅图片/视频）',
    example: 'https://example.com/thumbnails/image_thumb.jpg',
    type: String,
  })
  @IsUrl()
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({
    description: '文件宽度（仅图片/视频）',
    example: 1920,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({
    description: '文件高度（仅图片/视频）',
    example: 1080,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({
    description: '视频时长（秒，仅视频）',
    example: 120,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  duration?: number;
}

/**
 * 创建消息 DTO
 */
export class CreateMessageDto {
  @ApiProperty({
    description: '频道ID',
    example: 'ch_789',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiProperty({
    description: '消息内容',
    example: 'Hello, team! How is everyone doing?',
    type: String,
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    description: '消息类型',
    enum: MessageType,
    example: MessageType.TEXT,
    default: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({
    description: '附件列表',
    type: [AttachmentDto],
    isArray: true,
    example: [
      {
        url: 'https://example.com/image.png',
        type: 'image/png',
        size: 123456,
        name: 'screenshot.png',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];

  @ApiPropertyOptional({
    description: '回复的消息ID',
    example: 'msg_123',
    type: String,
  })
  @IsString()
  @IsOptional()
  replyTo?: string;

  @ApiPropertyOptional({
    description: '提及的用户ID列表',
    type: [String],
    example: ['user_123', 'user_456'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mentions?: string[];

  @ApiPropertyOptional({
    description: '元数据（自定义数据）',
    type: 'object',
    example: {
      priority: 'high',
      category: 'announcement',
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * 更新消息 DTO
 */
export class UpdateMessageDto extends PartialType(CreateMessageDto) {
  @ApiPropertyOptional({
    description: '消息内容',
    example: 'Updated message content',
    type: String,
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({
    description: '附件列表',
    type: [AttachmentDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];
}

/**
 * 消息响应 DTO
 */
export class MessageResponseDto {
  @ApiProperty({
    description: '消息ID',
    example: 'msg_123',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: '频道ID',
    example: 'ch_789',
    type: String,
  })
  channelId: string;

  @ApiProperty({
    description: '消息内容',
    example: 'Hello, team!',
    type: String,
  })
  content: string;

  @ApiProperty({
    description: '消息类型',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  type: MessageType;

  @ApiProperty({
    description: '发送者用户ID',
    example: 'user_456',
    type: String,
  })
  userId: string;

  @ApiPropertyOptional({
    description: '发送者用户信息',
    type: 'object',
    example: {
      id: 'user_456',
      name: 'John Doe',
      avatar: 'https://example.com/avatars/john.jpg',
    },
  })
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };

  @ApiPropertyOptional({
    description: '附件列表',
    type: [AttachmentDto],
    isArray: true,
  })
  attachments?: AttachmentDto[];

  @ApiPropertyOptional({
    description: '回复的消息ID',
    example: 'msg_122',
    type: String,
  })
  replyTo?: string;

  @ApiPropertyOptional({
    description: '回复的消息对象',
    type: 'object',
    example: {
      id: 'msg_122',
      content: 'Original message',
      userId: 'user_789',
    },
  })
  replyMessage?: {
    id: string;
    content: string;
    userId: string;
  };

  @ApiPropertyOptional({
    description: '提及的用户ID列表',
    type: [String],
    example: ['user_123', 'user_456'],
  })
  mentions?: string[];

  @ApiPropertyOptional({
    description: '消息反应',
    type: 'object',
    example: {
      '👍': { count: 5, users: ['user_123', 'user_456'] },
      '❤️': { count: 3, users: ['user_789'] },
    },
  })
  reactions?: Record<
    string,
    {
      count: number;
      users: string[];
    }
  >;

  @ApiPropertyOptional({
    description: '是否已编辑',
    example: false,
    type: Boolean,
  })
  edited?: boolean;

  @ApiPropertyOptional({
    description: '编辑时间',
    example: '2025-12-21T10:30:00Z',
    type: String,
    format: 'date-time',
  })
  editedAt?: string;

  @ApiPropertyOptional({
    description: '是否已删除',
    example: false,
    type: Boolean,
  })
  deleted?: boolean;

  @ApiPropertyOptional({
    description: '元数据',
    type: 'object',
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: '创建时间',
    example: '2025-12-21T09:00:00Z',
    type: String,
    format: 'date-time',
  })
  createdAt: string;

  @ApiProperty({
    description: '更新时间',
    example: '2025-12-21T09:00:00Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: string;
}

/**
 * 消息列表查询 DTO
 */
export class GetMessagesDto {
  @ApiProperty({
    description: '频道ID',
    example: 'ch_789',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiPropertyOptional({
    description: '消息数量限制',
    example: 50,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsNumber()
  @IsOptional()
  limit?: number = 50;

  @ApiPropertyOptional({
    description: '获取此消息ID之前的消息',
    example: 'msg_123',
    type: String,
  })
  @IsString()
  @IsOptional()
  before?: string;

  @ApiPropertyOptional({
    description: '获取此消息ID之后的消息',
    example: 'msg_125',
    type: String,
  })
  @IsString()
  @IsOptional()
  after?: string;
}

/**
 * 搜索消息 DTO
 */
export class SearchMessagesDto {
  @ApiProperty({
    description: '搜索关键词',
    example: 'meeting',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  query: string;

  @ApiPropertyOptional({
    description: '频道ID（不指定则搜索所有频道）',
    example: 'ch_789',
    type: String,
  })
  @IsString()
  @IsOptional()
  channelId?: string;

  @ApiPropertyOptional({
    description: '结果数量限制',
    example: 20,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsNumber()
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: '消息类型过滤',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @ApiPropertyOptional({
    description: '发送者用户ID',
    example: 'user_456',
    type: String,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: '开始时间',
    example: '2025-12-01T00:00:00Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束时间',
    example: '2025-12-31T23:59:59Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  endDate?: string;
}

/**
 * 批量操作 DTO
 */
export class BulkDeleteMessagesDto {
  @ApiProperty({
    description: '要删除的消息ID列表',
    type: [String],
    example: ['msg_123', 'msg_124', 'msg_125'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  messageIds: string[];

  @ApiPropertyOptional({
    description: '是否永久删除（默认软删除）',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  permanent?: boolean = false;
}

/**
 * 消息统计响应 DTO
 */
export class MessageStatsDto {
  @ApiProperty({
    description: '频道ID',
    example: 'ch_789',
    type: String,
  })
  channelId: string;

  @ApiProperty({
    description: '总消息数',
    example: 1234,
    type: Number,
  })
  totalMessages: number;

  @ApiProperty({
    description: '今日消息数',
    example: 56,
    type: Number,
  })
  todayMessages: number;

  @ApiProperty({
    description: '本周消息数',
    example: 345,
    type: Number,
  })
  weekMessages: number;

  @ApiProperty({
    description: '按类型统计',
    type: 'object',
    example: {
      text: 1000,
      image: 150,
      file: 84,
    },
  })
  byType: Record<MessageType, number>;

  @ApiProperty({
    description: '最活跃用户',
    type: 'array',
    example: [
      { userId: 'user_123', count: 234, name: 'John Doe' },
      { userId: 'user_456', count: 198, name: 'Jane Smith' },
    ],
  })
  topUsers: Array<{
    userId: string;
    count: number;
    name: string;
  }>;
}
