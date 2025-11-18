/**
 * AI 輔助服務
 * 提供 AI 驅動的功能，如內容生成、摘要、SEO 優化等
 *
 * 注意：這些功能展示了如何整合 AI API
 * 實際使用時需要配置對應的 AI 服務（如 OpenAI、Anthropic、本地模型等）
 */

const MOCK_MODE = process.env.AI_MOCK_MODE === 'true' || !process.env.AI_API_KEY;

/**
 * AI 客戶端配置
 * 支持多種 AI 提供商
 */
class AIClient {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.apiKey = process.env.AI_API_KEY;
    this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
    this.mockMode = MOCK_MODE;

    if (this.mockMode) {
      console.log('⚠️  AI Service running in MOCK mode');
    }
  }

  /**
   * 調用 AI API（通用方法）
   */
  async callAI(prompt, options = {}) {
    if (this.mockMode) {
      return this.mockResponse(prompt, options);
    }

    // 實際 API 調用邏輯
    switch (this.provider) {
      case 'openai':
        return this.callOpenAI(prompt, options);
      case 'anthropic':
        return this.callAnthropic(prompt, options);
      case 'local':
        return this.callLocalModel(prompt, options);
      default:
        throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }

  /**
   * OpenAI API 調用
   */
  async callOpenAI(prompt, options = {}) {
    // 這裡應該實現實際的 OpenAI API 調用
    // 需要安裝: npm install openai
    /*
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: this.apiKey });

    const response = await openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      ...options
    });

    return response.choices[0].message.content;
    */
    throw new Error('OpenAI integration not implemented. Set AI_MOCK_MODE=true to use mock responses.');
  }

  /**
   * Anthropic Claude API 調用
   */
  async callAnthropic(prompt, options = {}) {
    // 這裡應該實現實際的 Anthropic API 調用
    // 需要安裝: npm install @anthropic-ai/sdk
    /*
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: this.apiKey });

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      ...options
    });

    return response.content[0].text;
    */
    throw new Error('Anthropic integration not implemented. Set AI_MOCK_MODE=true to use mock responses.');
  }

  /**
   * 本地模型調用（如 Ollama）
   */
  async callLocalModel(prompt, options = {}) {
    // 這裡應該實現本地模型調用
    // 例如使用 Ollama: http://localhost:11434/api/generate
    throw new Error('Local model integration not implemented. Set AI_MOCK_MODE=true to use mock responses.');
  }

  /**
   * Mock 響應（用於測試和演示）
   */
  async mockResponse(prompt, options = {}) {
    // 模擬 API 延遲
    await new Promise((resolve) => setTimeout(resolve, 500));

    const type = options.type || 'general';

    switch (type) {
      case 'summary':
        return this.mockSummary(prompt);
      case 'seo':
        return this.mockSEO(prompt);
      case 'tags':
        return this.mockTags(prompt);
      case 'sentiment':
        return this.mockSentiment(prompt);
      case 'recommendations':
        return this.mockRecommendations(prompt);
      default:
        return `這是一個 AI 生成的響應（Mock 模式）。提示：${prompt.substring(0, 50)}...`;
    }
  }

  mockSummary(content) {
    return `這篇文章主要討論了多個重要觀點。首先，作者強調了主題的重要性。其次，文章詳細探討了相關概念和實踐方法。最後，提出了一些具有啟發性的結論和未來展望。`;
  }

  mockSEO(content) {
    return {
      title: '優化後的 SEO 標題 - 包含關鍵字',
      description: '這是一個優化的 meta 描述，包含重要關鍵字，吸引用戶點擊，長度適中（150-160字符）。',
      keywords: ['關鍵字1', '關鍵字2', '關鍵字3', '長尾關鍵字'],
      slug: 'optimized-url-slug',
    };
  }

  mockTags(content) {
    return ['技術', '教程', 'GraphQL', 'AI', '最佳實踐'];
  }

  mockSentiment(content) {
    return {
      overall: 'positive',
      score: 0.75,
      emotions: {
        joy: 0.6,
        trust: 0.8,
        surprise: 0.3,
        sadness: 0.1,
        anger: 0.05,
      },
      keywords: ['優秀', '實用', '推薦'],
    };
  }

  mockRecommendations(context) {
    return [
      { id: '1', title: '相關文章 1', similarity: 0.85 },
      { id: '2', title: '相關文章 2', similarity: 0.78 },
      { id: '3', title: '相關文章 3', similarity: 0.72 },
    ];
  }
}

// 創建單例
const aiClient = new AIClient();

/**
 * 生成文章摘要
 */
async function generateSummary(content, maxLength = 200) {
  const prompt = `請為以下文章生成一個簡潔的摘要（最多 ${maxLength} 字）：\n\n${content}`;

  const summary = await aiClient.callAI(prompt, { type: 'summary' });
  return summary;
}

/**
 * SEO 優化
 * 生成 SEO 友好的標題、描述和關鍵字
 */
async function generateSEOContent(title, content) {
  const prompt = `基於以下標題和內容，生成 SEO 優化的元數據：

標題：${title}
內容：${content.substring(0, 500)}...

請提供：
1. 優化的標題（包含關鍵字，50-60字符）
2. Meta 描述（150-160字符）
3. 主要關鍵字（5-8個）
4. URL slug`;

  const seoData = await aiClient.callAI(prompt, { type: 'seo' });
  return seoData;
}

/**
 * 智能標籤生成
 * 基於文章內容自動生成相關標籤
 */
async function generateTags(content, maxTags = 5) {
  const prompt = `分析以下內容並生成 ${maxTags} 個最相關的標籤：\n\n${content}`;

  const tags = await aiClient.callAI(prompt, { type: 'tags' });
  return Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
}

/**
 * 內容改進建議
 */
async function suggestImprovements(content) {
  const prompt = `請分析以下內容並提供改進建議：\n\n${content}\n\n請提供：
1. 內容結構建議
2. 語言改進建議
3. 需要補充的信息
4. SEO 優化建議`;

  return await aiClient.callAI(prompt);
}

/**
 * 情感分析
 * 分析文章或評論的情感傾向
 */
async function analyzeSentiment(text) {
  const prompt = `分析以下文本的情感傾向：\n\n${text}`;

  const sentiment = await aiClient.callAI(prompt, { type: 'sentiment' });
  return sentiment;
}

/**
 * 智能搜尋增強
 * 使用 AI 理解搜尋意圖並改進搜尋結果
 */
async function enhanceSearch(query, results) {
  if (results.length === 0) {
    return results;
  }

  // 如果結果少於 3 個，嘗試生成搜尋建議
  if (results.length < 3) {
    const suggestions = await generateSearchSuggestions(query);
    return {
      results,
      suggestions,
      enhanced: true,
    };
  }

  // 使用 AI 重新排序結果（基於相關性）
  const rankedResults = await rankSearchResults(query, results);

  return {
    results: rankedResults,
    enhanced: true,
  };
}

/**
 * 生成搜尋建議
 */
async function generateSearchSuggestions(query) {
  const prompt = `用戶搜尋了 "${query}" 但結果很少。請生成 5 個相關的搜尋建議。`;

  const suggestions = await aiClient.callAI(prompt);
  return Array.isArray(suggestions)
    ? suggestions
    : suggestions.split('\n').filter((s) => s.trim());
}

/**
 * 排序搜尋結果
 */
async function rankSearchResults(query, results) {
  // 在實際應用中，這裡應該使用向量嵌入和相似度計算
  // 目前返回原始結果
  return results;
}

/**
 * 內容推薦
 * 基於用戶閱讀歷史和當前文章推薦相關內容
 */
async function generateRecommendations(currentPost, userHistory = [], limit = 5) {
  const context = `
當前文章：${currentPost.title}
用戶歷史：${userHistory.map((p) => p.title).join(', ')}
`;

  const recommendations = await aiClient.callAI(context, {
    type: 'recommendations',
  });

  return recommendations.slice(0, limit);
}

/**
 * 自動生成文章大綱
 */
async function generateOutline(topic, keywords = []) {
  const prompt = `請為以下主題生成一個文章大綱：

主題：${topic}
關鍵字：${keywords.join(', ')}

請提供：
1. 引言
2. 主要章節（3-5個）
3. 每個章節的要點
4. 結論`;

  return await aiClient.callAI(prompt);
}

/**
 * 內容擴展
 * 基於大綱生成完整內容
 */
async function expandContent(outline, section) {
  const prompt = `基於以下大綱，為「${section}」部分生成詳細內容：\n\n${outline}`;

  return await aiClient.callAI(prompt);
}

/**
 * 校對和糾錯
 */
async function proofread(content) {
  const prompt = `請校對以下內容，糾正語法錯誤、拼寫錯誤和標點符號問題：\n\n${content}`;

  return await aiClient.callAI(prompt);
}

/**
 * 多語言翻譯
 */
async function translate(content, targetLanguage) {
  const prompt = `請將以下內容翻譯成${targetLanguage}：\n\n${content}`;

  return await aiClient.callAI(prompt);
}

/**
 * 問答生成
 * 基於文章內容生成 FAQ
 */
async function generateFAQ(content, numQuestions = 5) {
  const prompt = `基於以下內容生成 ${numQuestions} 個常見問題和答案：\n\n${content}`;

  const faq = await aiClient.callAI(prompt);

  // 解析 FAQ（假設返回格式為 Q: ... A: ...）
  return faq;
}

module.exports = {
  // 核心功能
  generateSummary,
  generateSEOContent,
  generateTags,
  suggestImprovements,
  analyzeSentiment,

  // 搜尋和推薦
  enhanceSearch,
  generateSearchSuggestions,
  rankSearchResults,
  generateRecommendations,

  // 內容創作
  generateOutline,
  expandContent,
  proofread,
  translate,
  generateFAQ,

  // 客戶端（用於自定義使用）
  aiClient,
};
