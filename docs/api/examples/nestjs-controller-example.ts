/**
 * NestJS Controller Swagger 注解示例
 * 展示如何在 Controller 中使用 Swagger 装饰器
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CreateMessageDto, UpdateMessageDto, MessageResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Messages')
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * 获取消息列表
   */
  @Get()
  @ApiOperation({
    summary: '获取消息列表',
    description: '根据频道ID获取消息列表，支持分页和消息过滤',
  })
  @ApiQuery({
    name: 'channelId',
    required: true,
    description: '频道ID',
    type: String,
    example: 'ch_789',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '消息数量限制',
    type: Number,
    example: 50,
    schema: {
      minimum: 1,
      maximum: 100,
      default: 50,
    },
  })
  @ApiQuery({
    name: 'before',
    required: false,
    description: '获取此消息ID之前的消息（用于分页）',
    type: String,
    example: 'msg_123',
  })
  @ApiQuery({
    name: 'after',
    required: false,
    description: '获取此消息ID之后的消息',
    type: String,
  })
  @ApiOkResponse({
    description: '成功获取消息列表',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/MessageResponseDto',
          },
        },
        pagination: {
          type: 'object',
          properties: {
            hasMore: { type: 'boolean', example: true },
            nextCursor: { type: 'string', example: 'msg_456' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'channelId 不能为空' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async getMessages(
    @Query('channelId') channelId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
    @Query('after') after?: string,
  ) {
    return this.messageService.getMessages({
      channelId,
      limit: limit || 50,
      before,
      after,
    });
  }

  /**
   * 根据ID获取单条消息
   */
  @Get(':id')
  @ApiOperation({
    summary: '获取单条消息',
    description: '根据消息ID获取消息详情',
  })
  @ApiParam({
    name: 'id',
    description: '消息ID',
    type: String,
    example: 'msg_123',
  })
  @ApiOkResponse({
    description: '成功获取消息',
    type: MessageResponseDto,
  })
  @ApiNotFoundResponse({
    description: '消息不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '消息不存在' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async getMessage(@Param('id') id: string) {
    return this.messageService.getMessage(id);
  }

  /**
   * 发送新消息
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '发送消息',
    description: '在指定频道发送新消息，支持文本、图片、文件等多种消息类型',
  })
  @ApiBody({
    type: CreateMessageDto,
    description: '消息内容',
    examples: {
      textMessage: {
        summary: '文本消息',
        description: '发送普通文本消息',
        value: {
          channelId: 'ch_789',
          content: 'Hello, team!',
          type: 'text',
        },
      },
      imageMessage: {
        summary: '图片消息',
        description: '发送包含图片的消息',
        value: {
          channelId: 'ch_789',
          content: 'Check out this screenshot',
          type: 'image',
          attachments: [
            {
              url: 'https://example.com/image.png',
              type: 'image/png',
              size: 123456,
              name: 'screenshot.png',
            },
          ],
        },
      },
      fileMessage: {
        summary: '文件消息',
        description: '发送包含文件的消息',
        value: {
          channelId: 'ch_789',
          content: 'Here is the document',
          type: 'file',
          attachments: [
            {
              url: 'https://example.com/document.pdf',
              type: 'application/pdf',
              size: 256789,
              name: 'project-proposal.pdf',
            },
          ],
        },
      },
      replyMessage: {
        summary: '回复消息',
        description: '回复某条消息',
        value: {
          channelId: 'ch_789',
          content: 'Great idea!',
          type: 'text',
          replyTo: 'msg_123',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: '消息发送成功',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['channelId 不能为空', 'content 不能为空'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: '未授权访问',
  })
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.messageService.createMessage(createMessageDto, user.id);
  }

  /**
   * 更新消息
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '更新消息',
    description: '更新已发送的消息内容（仅限作者）',
  })
  @ApiParam({
    name: 'id',
    description: '消息ID',
    type: String,
    example: 'msg_123',
  })
  @ApiBody({
    type: UpdateMessageDto,
    description: '更新的消息内容',
    examples: {
      updateContent: {
        summary: '更新消息内容',
        value: {
          content: 'Updated message content',
        },
      },
    },
  })
  @ApiOkResponse({
    description: '消息更新成功',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({ description: '请求参数错误' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  @ApiNotFoundResponse({ description: '消息不存在' })
  @ApiResponse({
    status: 403,
    description: '无权限修改此消息',
  })
  async updateMessage(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.messageService.updateMessage(id, updateMessageDto, user.id);
  }

  /**
   * 删除消息
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '删除消息',
    description: '删除已发送的消息（仅限作者或管理员）',
  })
  @ApiParam({
    name: 'id',
    description: '消息ID',
    type: String,
    example: 'msg_123',
  })
  @ApiResponse({
    status: 204,
    description: '消息删除成功',
  })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  @ApiNotFoundResponse({ description: '消息不存在' })
  @ApiResponse({
    status: 403,
    description: '无权限删除此消息',
  })
  async deleteMessage(@Param('id') id: string, @CurrentUser() user: User) {
    return this.messageService.deleteMessage(id, user.id);
  }

  /**
   * 搜索消息
   */
  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '搜索消息',
    description: '在频道中搜索消息，支持全文搜索',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: '搜索关键词',
    type: String,
    example: 'meeting',
  })
  @ApiQuery({
    name: 'channelId',
    required: false,
    description: '频道ID（可选，不指定则搜索所有频道）',
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '结果数量限制',
    type: Number,
    example: 20,
    schema: {
      minimum: 1,
      maximum: 100,
      default: 20,
    },
  })
  @ApiOkResponse({
    description: '搜索成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/MessageResponseDto',
          },
        },
        total: { type: 'number', example: 15 },
      },
    },
  })
  async searchMessages(
    @Query('q') query: string,
    @Query('channelId') channelId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.messageService.searchMessages({
      query,
      channelId,
      limit: limit || 20,
    });
  }

  /**
   * 标记消息为已读
   */
  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '标记消息为已读',
    description: '将消息标记为已读状态',
  })
  @ApiParam({
    name: 'id',
    description: '消息ID',
    type: String,
    example: 'msg_123',
  })
  @ApiOkResponse({
    description: '标记成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.messageService.markAsRead(id, user.id);
  }

  /**
   * 添加消息反应
   */
  @Post(':id/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '添加消息反应',
    description: '为消息添加 emoji 反应',
  })
  @ApiParam({
    name: 'id',
    description: '消息ID',
    type: String,
    example: 'msg_123',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['emoji'],
      properties: {
        emoji: {
          type: 'string',
          description: 'Emoji 表情',
          example: '👍',
        },
      },
    },
  })
  @ApiOkResponse({
    description: '反应添加成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            emoji: { type: 'string', example: '👍' },
            count: { type: 'number', example: 5 },
            users: {
              type: 'array',
              items: { type: 'string' },
              example: ['user_123', 'user_456'],
            },
          },
        },
      },
    },
  })
  async addReaction(
    @Param('id') id: string,
    @Body('emoji') emoji: string,
    @CurrentUser() user: User,
  ) {
    return this.messageService.addReaction(id, emoji, user.id);
  }
}
