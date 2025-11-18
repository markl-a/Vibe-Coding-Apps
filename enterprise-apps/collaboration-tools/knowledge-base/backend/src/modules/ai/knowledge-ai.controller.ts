import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { KnowledgeAIService } from './knowledge-ai.service';

@Controller('knowledge/ai')
@UseGuards(JwtAuthGuard)
export class KnowledgeAIController {
  constructor(private readonly knowledgeAIService: KnowledgeAIService) {}

  /**
   * 提取關鍵詞和實體
   * POST /api/knowledge/ai/extract-keywords
   */
  @Post('extract-keywords')
  async extractKeywords(@Body() body: { content: string }) {
    const result = await this.knowledgeAIService.extractKeywords(body.content);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 建議相關鏈接
   * POST /api/knowledge/ai/suggest-links
   */
  @Post('suggest-links')
  async suggestRelatedLinks(
    @Body()
    body: {
      currentPage: { title: string; content: string };
      allPages: Array<{ id: string; title: string; summary: string }>;
    },
  ) {
    const links = await this.knowledgeAIService.suggestRelatedLinks(
      body.currentPage,
      body.allPages,
    );

    return {
      success: true,
      data: { links },
    };
  }

  /**
   * 生成目錄
   * POST /api/knowledge/ai/generate-toc
   */
  @Post('generate-toc')
  async generateTableOfContents(@Body() body: { content: string }) {
    const toc = await this.knowledgeAIService.generateTableOfContents(
      body.content,
    );

    return {
      success: true,
      data: { toc },
    };
  }

  /**
   * 識別內容空缺
   * POST /api/knowledge/ai/content-gaps
   */
  @Post('content-gaps')
  async identifyContentGaps(
    @Body()
    body: {
      existingPages: Array<{ title: string; topics: string[] }>;
      organizationContext?: string;
    },
  ) {
    const gaps = await this.knowledgeAIService.identifyContentGaps(
      body.existingPages,
      body.organizationContext,
    );

    return {
      success: true,
      data: { gaps },
    };
  }

  /**
   * 內容擴展建議
   * POST /api/knowledge/ai/expansion-suggestions
   */
  @Post('expansion-suggestions')
  async suggestContentExpansion(@Body() body: { currentContent: string }) {
    const suggestions = await this.knowledgeAIService.suggestContentExpansion(
      body.currentContent,
    );

    return {
      success: true,
      data: { suggestions },
    };
  }

  /**
   * 生成 FAQ
   * POST /api/knowledge/ai/generate-faq
   */
  @Post('generate-faq')
  async generateFAQ(@Body() body: { content: string }) {
    const faq = await this.knowledgeAIService.generateFAQ(body.content);

    return {
      success: true,
      data: { faq },
    };
  }

  /**
   * 評估內容質量
   * POST /api/knowledge/ai/assess-quality
   */
  @Post('assess-quality')
  async assessContentQuality(@Body() body: { content: string }) {
    const assessment = await this.knowledgeAIService.assessContentQuality(
      body.content,
    );

    return {
      success: true,
      data: assessment,
    };
  }

  /**
   * 標準化術語
   * POST /api/knowledge/ai/standardize-terms
   */
  @Post('standardize-terms')
  async standardizeTerminology(
    @Body()
    body: {
      content: string;
      glossary?: { [key: string]: string };
    },
  ) {
    const glossaryMap = body.glossary
      ? new Map(Object.entries(body.glossary))
      : undefined;

    const result = await this.knowledgeAIService.standardizeTerminology(
      body.content,
      glossaryMap,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 生成多層次摘要
   * POST /api/knowledge/ai/multi-level-summary
   */
  @Post('multi-level-summary')
  async generateMultiLevelSummary(@Body() body: { content: string }) {
    const summary = await this.knowledgeAIService.generateMultiLevelSummary(
      body.content,
    );

    return {
      success: true,
      data: summary,
    };
  }

  /**
   * 建議層級位置
   * POST /api/knowledge/ai/suggest-placement
   */
  @Post('suggest-placement')
  async suggestHierarchyPlacement(
    @Body()
    body: {
      pageContent: { title: string; content: string; tags: string[] };
      existingStructure: Array<{ path: string; description: string }>;
    },
  ) {
    const placement = await this.knowledgeAIService.suggestHierarchyPlacement(
      body.pageContent,
      body.existingStructure,
    );

    return {
      success: true,
      data: placement,
    };
  }

  /**
   * 檢測過時內容
   * POST /api/knowledge/ai/detect-outdated
   */
  @Post('detect-outdated')
  async detectOutdatedContent(
    @Body() body: { content: string; lastUpdated: string },
  ) {
    const result = await this.knowledgeAIService.detectOutdatedContent(
      body.content,
      new Date(body.lastUpdated),
    );

    return {
      success: true,
      data: result,
    };
  }
}
