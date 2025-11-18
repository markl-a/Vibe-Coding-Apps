import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  /**
   * 生成智能回覆建議
   * POST /api/ai/smart-replies
   */
  @Post('smart-replies')
  async generateSmartReplies(
    @Body()
    body: {
      message: string;
      context?: string;
      tone?: 'professional' | 'casual' | 'friendly';
    },
  ) {
    const replies = await this.aiService.generateSmartReplies(body.message, {
      context: body.context,
      tone: body.tone,
    });

    return {
      success: true,
      data: { replies },
    };
  }

  /**
   * 生成訊息摘要
   * POST /api/ai/summarize
   */
  @Post('summarize')
  async summarizeMessages(@Body() body: { messages: string[] }) {
    const summary = await this.aiService.summarizeMessages(body.messages);

    return {
      success: true,
      data: { summary },
    };
  }

  /**
   * 情感分析
   * POST /api/ai/sentiment
   */
  @Post('sentiment')
  async analyzeSentiment(@Body() body: { message: string }) {
    const result = await this.aiService.analyzeSentiment(body.message);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 訊息分類
   * POST /api/ai/categorize
   */
  @Post('categorize')
  async categorizeMessage(@Body() body: { message: string }) {
    const result = await this.aiService.categorizeMessage(body.message);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 提取行動項
   * POST /api/ai/action-items
   */
  @Post('action-items')
  async extractActionItems(@Body() body: { messages: string[] }) {
    const actionItems = await this.aiService.extractActionItems(body.messages);

    return {
      success: true,
      data: { actionItems },
    };
  }

  /**
   * 建議 @提及
   * POST /api/ai/suggest-mentions
   */
  @Post('suggest-mentions')
  async suggestMentions(
    @Body()
    body: {
      message: string;
      channelMembers: Array<{
        id: string;
        username: string;
        expertise?: string[];
      }>;
    },
  ) {
    const mentions = await this.aiService.suggestMentions(
      body.message,
      body.channelMembers,
    );

    return {
      success: true,
      data: { mentions },
    };
  }

  /**
   * 翻譯訊息
   * POST /api/ai/translate
   */
  @Post('translate')
  async translateMessage(
    @Body() body: { message: string; targetLanguage: string },
  ) {
    const translation = await this.aiService.translateMessage(
      body.message,
      body.targetLanguage,
    );

    return {
      success: true,
      data: { translation },
    };
  }

  /**
   * 生成會議紀錄
   * POST /api/ai/meeting-notes
   */
  @Post('meeting-notes')
  async generateMeetingNotes(@Body() body: { messages: string[] }) {
    const notes = await this.aiService.generateMeetingNotes(body.messages);

    return {
      success: true,
      data: notes,
    };
  }
}
