import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DocumentAIService } from './document-ai.service';

@Controller('documents/ai')
@UseGuards(JwtAuthGuard)
export class DocumentAIController {
  constructor(private readonly documentAIService: DocumentAIService) {}

  /**
   * 生成文本補全建議
   * POST /api/documents/ai/completion
   */
  @Post('completion')
  async generateCompletion(
    @Body()
    body: {
      currentText: string;
      context?: {
        documentType?: 'email' | 'report' | 'article' | 'note';
        tone?: 'formal' | 'casual' | 'technical';
      };
    },
  ) {
    const suggestions = await this.documentAIService.generateCompletion(
      body.currentText,
      body.context,
    );

    return {
      success: true,
      data: { suggestions },
    };
  }

  /**
   * 語法檢查
   * POST /api/documents/ai/grammar-check
   */
  @Post('grammar-check')
  async checkGrammar(@Body() body: { text: string }) {
    const errors = await this.documentAIService.checkGrammar(body.text);

    return {
      success: true,
      data: { errors },
    };
  }

  /**
   * 改寫建議
   * POST /api/documents/ai/improvements
   */
  @Post('improvements')
  async suggestImprovements(
    @Body()
    body: {
      text: string;
      improvementType: 'clarity' | 'conciseness' | 'tone' | 'formality';
    },
  ) {
    const result = await this.documentAIService.suggestImprovements(
      body.text,
      body.improvementType,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 生成摘要
   * POST /api/documents/ai/summary
   */
  @Post('summary')
  async generateSummary(
    @Body()
    body: {
      text: string;
      summaryLength?: 'short' | 'medium' | 'long';
    },
  ) {
    const summary = await this.documentAIService.generateSummary(
      body.text,
      body.summaryLength,
    );

    return {
      success: true,
      data: summary,
    };
  }

  /**
   * 文檔分析
   * POST /api/documents/ai/analyze
   */
  @Post('analyze')
  async analyzeDocument(@Body() body: { text: string }) {
    const analysis = await this.documentAIService.analyzeDocument(body.text);

    return {
      success: true,
      data: analysis,
    };
  }

  /**
   * 格式化文檔
   * POST /api/documents/ai/format
   */
  @Post('format')
  async formatDocument(
    @Body() body: { text: string; format: 'markdown' | 'html' | 'plain' },
  ) {
    const formatted = await this.documentAIService.formatDocument(
      body.text,
      body.format,
    );

    return {
      success: true,
      data: { formatted },
    };
  }

  /**
   * 翻譯文檔
   * POST /api/documents/ai/translate
   */
  @Post('translate')
  async translateDocument(
    @Body() body: { text: string; targetLanguage: string },
  ) {
    const translation = await this.documentAIService.translateDocument(
      body.text,
      body.targetLanguage,
    );

    return {
      success: true,
      data: translation,
    };
  }

  /**
   * 生成大綱
   * POST /api/documents/ai/outline
   */
  @Post('outline')
  async generateOutline(@Body() body: { text: string }) {
    const outline = await this.documentAIService.generateOutline(body.text);

    return {
      success: true,
      data: outline,
    };
  }

  /**
   * 文檔問答
   * POST /api/documents/ai/ask
   */
  @Post('ask')
  async answerQuestion(
    @Body() body: { documentText: string; question: string },
  ) {
    const answer = await this.documentAIService.answerQuestion(
      body.documentText,
      body.question,
    );

    return {
      success: true,
      data: answer,
    };
  }

  /**
   * 語氣和情感分析
   * POST /api/documents/ai/tone-analysis
   */
  @Post('tone-analysis')
  async analyzeTone(@Body() body: { text: string }) {
    const analysis = await this.documentAIService.analyzeToneAndSentiment(
      body.text,
    );

    // Convert Map to Object
    const emotionsObj: any = {};
    analysis.emotions.forEach((value, key) => {
      emotionsObj[key] = value;
    });

    return {
      success: true,
      data: {
        sentiment: analysis.sentiment,
        tone: analysis.tone,
        formality: analysis.formality,
        emotions: emotionsObj,
      },
    };
  }
}
