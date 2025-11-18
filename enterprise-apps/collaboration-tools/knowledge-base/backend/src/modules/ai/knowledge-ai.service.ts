import { Injectable } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

interface RelatedLink {
  pageId: string;
  title: string;
  relevance: number;
  context: string;
}

interface ContentGap {
  topic: string;
  reason: string;
  suggestedTitle: string;
  priority: 'high' | 'medium' | 'low';
}

@Injectable()
export class KnowledgeAIService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * 自動提取關鍵詞和標籤
   */
  async extractKeywords(content: string): Promise<{
    keywords: string[];
    entities: Array<{ name: string; type: string }>;
    topics: string[];
  }> {
    try {
      const prompt = `分析以下文檔內容，提取關鍵詞、實體和主題。回覆 JSON 格式：
{
  "keywords": ["關鍵詞1", "關鍵詞2"],
  "entities": [
    {"name": "實體名稱", "type": "人物/組織/概念/技術等"}
  ],
  "topics": ["主題1", "主題2"]
}

文檔內容：
${content.substring(0, 2000)}`;

      const response = await this.callOpenAI(prompt);
      const result = JSON.parse(response);

      return {
        keywords: result.keywords || [],
        entities: result.entities || [],
        topics: result.topics || [],
      };
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return {
        keywords: [],
        entities: [],
        topics: [],
      };
    }
  }

  /**
   * 智能建議相關鏈接
   */
  async suggestRelatedLinks(
    currentPage: { title: string; content: string },
    allPages: Array<{ id: string; title: string; summary: string }>,
  ): Promise<RelatedLink[]> {
    try {
      const pagesList = allPages
        .slice(0, 50) // 限制處理數量
        .map(p => `ID: ${p.id}\n標題: ${p.title}\n摘要: ${p.summary}`)
        .join('\n\n---\n\n');

      const prompt = `基於當前頁面內容，從以下頁面列表中選擇最相關的5個頁面，並說明為什麼相關。回覆 JSON 陣列：
[
  {
    "pageId": "頁面ID",
    "relevance": 0-1的相關度,
    "context": "為什麼相關的簡短說明"
  }
]

當前頁面：
標題：${currentPage.title}
內容：${currentPage.content.substring(0, 1000)}

頁面列表：
${pagesList}`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      const suggestions = JSON.parse(response);

      return suggestions.map((s: any) => ({
        pageId: s.pageId,
        title: allPages.find(p => p.id === s.pageId)?.title || '',
        relevance: s.relevance,
        context: s.context,
      }));
    } catch (error) {
      console.error('Error suggesting related links:', error);
      return [];
    }
  }

  /**
   * 自動生成文檔大綱
   */
  async generateTableOfContents(content: string): Promise<Array<{
    level: number;
    title: string;
    anchor: string;
  }>> {
    try {
      const prompt = `為以下文檔生成目錄大綱，回覆 JSON 陣列：
[
  {
    "level": 1-3的標題級別,
    "title": "標題文字",
    "anchor": "URL錨點（小寫英文，用連字號分隔）"
  }
]

文檔內容：
${content}`;

      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating table of contents:', error);
      return [];
    }
  }

  /**
   * 識別內容空缺
   */
  async identifyContentGaps(
    existingPages: Array<{ title: string; topics: string[] }>,
    organizationContext?: string,
  ): Promise<ContentGap[]> {
    try {
      const pagesSummary = existingPages
        .map(p => `${p.title} (主題: ${p.topics.join(', ')})`)
        .join('\n');

      const prompt = `分析以下知識庫現有內容，識別缺少的重要主題和內容空缺。${organizationContext ? `組織背景：${organizationContext}` : ''}

現有頁面：
${pagesSummary}

請回覆 JSON 陣列格式：
[
  {
    "topic": "缺少的主題",
    "reason": "為什麼這個主題重要",
    "suggestedTitle": "建議的頁面標題",
    "priority": "high/medium/low"
  }
]`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error identifying content gaps:', error);
      return [];
    }
  }

  /**
   * 智能內容擴展建議
   */
  async suggestContentExpansion(
    currentContent: string,
  ): Promise<Array<{
    section: string;
    suggestion: string;
    reason: string;
  }>> {
    try {
      const prompt = `分析以下文檔，建議可以擴展或添加的內容部分。回覆 JSON 陣列：
[
  {
    "section": "建議擴展的部分",
    "suggestion": "具體建議添加什麼內容",
    "reason": "為什麼需要擴展"
  }
]

文檔內容：
${currentContent.substring(0, 2000)}`;

      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error suggesting content expansion:', error);
      return [];
    }
  }

  /**
   * FAQ 自動生成
   */
  async generateFAQ(content: string): Promise<Array<{
    question: string;
    answer: string;
  }>> {
    try {
      const prompt = `基於以下文檔內容，生成5-10個常見問題和答案。回覆 JSON 陣列：
[
  {
    "question": "問題",
    "answer": "簡潔的答案"
  }
]

文檔內容：
${content}`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating FAQ:', error);
      return [];
    }
  }

  /**
   * 內容質量評分
   */
  async assessContentQuality(content: string): Promise<{
    overallScore: number;
    scores: {
      completeness: number;
      clarity: number;
      structure: number;
      accuracy: number;
    };
    suggestions: string[];
  }> {
    try {
      const prompt = `評估以下文檔的質量，回覆 JSON 格式：
{
  "overallScore": 0-100的總分,
  "scores": {
    "completeness": 0-100的完整性分數,
    "clarity": 0-100的清晰度分數,
    "structure": 0-100的結構分數,
    "accuracy": 0-100的準確性分數
  },
  "suggestions": ["改進建議1", "改進建議2"]
}

文檔內容：
${content.substring(0, 2000)}`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error assessing content quality:', error);
      return {
        overallScore: 0,
        scores: {
          completeness: 0,
          clarity: 0,
          structure: 0,
          accuracy: 0,
        },
        suggestions: [],
      };
    }
  }

  /**
   * 自動標準化術語
   */
  async standardizeTerminology(
    content: string,
    glossary?: Map<string, string>,
  ): Promise<{
    standardizedContent: string;
    changes: Array<{ original: string; replacement: string; occurrences: number }>;
  }> {
    try {
      const glossaryText = glossary
        ? Array.from(glossary.entries())
            .map(([term, definition]) => `${term}: ${definition}`)
            .join('\n')
        : '';

      const prompt = `檢查並標準化以下文檔中的術語使用${glossary ? `，根據以下術語表：\n\n${glossaryText}` : ''}。回覆 JSON 格式：
{
  "standardizedContent": "標準化後的文檔內容",
  "changes": [
    {
      "original": "原術語",
      "replacement": "標準術語",
      "occurrences": 出現次數
    }
  ]
}

文檔內容：
${content}`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error standardizing terminology:', error);
      return {
        standardizedContent: content,
        changes: [],
      };
    }
  }

  /**
   * 智能摘要生成（多層次）
   */
  async generateMultiLevelSummary(content: string): Promise<{
    oneLine: string;
    short: string;
    detailed: string;
    keyTakeaways: string[];
  }> {
    try {
      const prompt = `為以下文檔生成多層次摘要，回覆 JSON 格式：
{
  "oneLine": "一句話摘要（20字內）",
  "short": "簡短摘要（50-100字）",
  "detailed": "詳細摘要（200-300字）",
  "keyTakeaways": ["要點1", "要點2", "要點3"]
}

文檔內容：
${content}`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating multi-level summary:', error);
      return {
        oneLine: '',
        short: '',
        detailed: '',
        keyTakeaways: [],
      };
    }
  }

  /**
   * 自動分類到知識庫層級結構
   */
  async suggestHierarchyPlacement(
    pageContent: { title: string; content: string; tags: string[] },
    existingStructure: Array<{
      path: string;
      description: string;
    }>,
  ): Promise<{
    suggestedPath: string;
    confidence: number;
    alternatives: string[];
    reason: string;
  }> {
    try {
      const structureList = existingStructure
        .map(s => `${s.path} - ${s.description}`)
        .join('\n');

      const prompt = `基於頁面內容，建議最適合的知識庫層級位置。回覆 JSON 格式：
{
  "suggestedPath": "/類別/子類別/頁面",
  "confidence": 0-1的信心度,
  "alternatives": ["替代路徑1", "替代路徑2"],
  "reason": "為什麼建議這個位置"
}

頁面資訊：
標題：${pageContent.title}
內容：${pageContent.content.substring(0, 1000)}
標籤：${pageContent.tags.join(', ')}

現有結構：
${structureList}`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error suggesting hierarchy placement:', error);
      return {
        suggestedPath: '/未分類',
        confidence: 0,
        alternatives: [],
        reason: '無法確定合適位置',
      };
    }
  }

  /**
   * 檢測過時內容
   */
  async detectOutdatedContent(
    content: string,
    lastUpdated: Date,
  ): Promise<{
    isLikelyOutdated: boolean;
    confidence: number;
    reasons: string[];
    suggestedUpdates: string[];
  }> {
    try {
      const daysSinceUpdate = Math.floor(
        (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24),
      );

      const prompt = `分析以下文檔是否可能已過時（上次更新：${daysSinceUpdate}天前）。回覆 JSON 格式：
{
  "isLikelyOutdated": true/false,
  "confidence": 0-1的信心度,
  "reasons": ["可能過時的原因"],
  "suggestedUpdates": ["建議更新的內容"]
}

文檔內容：
${content.substring(0, 2000)}`;

      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error detecting outdated content:', error);
      return {
        isLikelyOutdated: false,
        confidence: 0,
        reasons: [],
        suggestedUpdates: [],
      };
    }
  }

  // ============ 私有方法 ============

  private async callOpenAI(
    prompt: string,
    model: string = 'gpt-3.5-turbo',
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: '你是一個專業的知識管理助手，幫助組織和優化知識庫內容。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }
}
