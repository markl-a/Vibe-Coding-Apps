/**
 * AI 智能標籤生成模組
 * 自動為內容生成相關標籤
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * 生成內容標籤
 * @param content 內容文本
 * @param maxTags 最多生成標籤數量
 * @returns 標籤數組
 */
export async function generateTags(
  content: string,
  maxTags: number = 5
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `你是一個專業的內容分析助手。請為給定的內容生成 ${maxTags} 個相關標籤。
要求：
1. 標籤要簡潔明確
2. 涵蓋主題、類別、情感等維度
3. 優先選擇常用標籤
4. 以 JSON 數組格式返回，例如：["區塊鏈", "DeFi", "技術"]`,
        },
        {
          role: 'user',
          content: content,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    const result = response.choices[0].message.content || '[]';

    // 提取 JSON 數組
    const jsonMatch = result.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const tags = JSON.parse(jsonMatch[0]);
      return tags.slice(0, maxTags);
    }

    return [];
  } catch (error) {
    console.error('Tag generation error:', error);
    return extractKeywordsFallback(content, maxTags);
  }
}

/**
 * 降級策略：基於關鍵詞提取
 */
function extractKeywordsFallback(content: string, maxTags: number): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);

  // 簡單的詞頻統計
  const frequency: Record<string, number> = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)
    .map(([word]) => word);
}

/**
 * 生成內容摘要
 * @param content 內容文本
 * @param maxLength 最大長度
 * @returns 摘要文本
 */
export async function summarizeContent(
  content: string,
  maxLength: number = 100
): Promise<string> {
  if (content.length <= maxLength) {
    return content;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `請將以下內容總結為不超過 ${maxLength} 字的簡短摘要。保持核心信息和關鍵觀點。`,
        },
        {
          role: 'user',
          content: content,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    return response.choices[0].message.content || content.substring(0, maxLength);
  } catch (error) {
    console.error('Summarization error:', error);
    return content.substring(0, maxLength) + '...';
  }
}

/**
 * 情感分析
 * @param content 內容文本
 * @returns 情感分析結果
 */
export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1 到 1
  confidence: number; // 0 到 1
  keywords: string[];
}

export async function analyzeSentiment(content: string): Promise<SentimentResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `分析以下內容的情感傾向，以 JSON 格式返回：
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": -1 到 1 之間的數字,
  "confidence": 0 到 1 之間的信心度,
  "keywords": ["關鍵情感詞1", "關鍵情感詞2"]
}`,
        },
        {
          role: 'user',
          content: content,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const result = response.choices[0].message.content || '{}';
    const jsonMatch = result.match(/\{[\s\S]*?\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0.5,
      keywords: [],
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return simpleSentimentAnalysis(content);
  }
}

/**
 * 簡單情感分析（降級策略）
 */
function simpleSentimentAnalysis(content: string): SentimentResult {
  const positiveWords = ['好', '棒', '讚', '優秀', '開心', 'good', 'great', 'awesome'];
  const negativeWords = ['壞', '差', '糟', '失望', 'bad', 'terrible', 'awful'];

  const lowerContent = content.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((word) => {
    if (lowerContent.includes(word)) positiveCount++;
  });

  negativeWords.forEach((word) => {
    if (lowerContent.includes(word)) negativeCount++;
  });

  const score = (positiveCount - negativeCount) / (positiveCount + negativeCount || 1);

  let sentiment: 'positive' | 'negative' | 'neutral';
  if (score > 0.2) sentiment = 'positive';
  else if (score < -0.2) sentiment = 'negative';
  else sentiment = 'neutral';

  return {
    sentiment,
    score,
    confidence: 0.6,
    keywords: [],
  };
}

/**
 * 主題分類
 * @param content 內容文本
 * @returns 主題分類
 */
export interface TopicClassification {
  primary: string;
  secondary: string[];
  confidence: number;
}

export async function classifyTopic(content: string): Promise<TopicClassification> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `將以下內容分類到適當的主題類別，以 JSON 格式返回：
{
  "primary": "主要主題",
  "secondary": ["次要主題1", "次要主題2"],
  "confidence": 0-1之間的信心度
}

可能的主題包括：技術、區塊鏈、DeFi、NFT、遊戲、藝術、音樂、體育、新聞、娛樂、教育、科學等`,
        },
        {
          role: 'user',
          content: content,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const result = response.choices[0].message.content || '{}';
    const jsonMatch = result.match(/\{[\s\S]*?\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      primary: 'general',
      secondary: [],
      confidence: 0.5,
    };
  } catch (error) {
    console.error('Topic classification error:', error);
    return {
      primary: 'general',
      secondary: [],
      confidence: 0.5,
    };
  }
}

/**
 * 批量標籤生成（優化性能）
 */
export async function generateTagsBatch(
  contents: string[],
  maxTags: number = 5
): Promise<string[][]> {
  const results = await Promise.all(
    contents.map((content) => generateTags(content, maxTags))
  );
  return results;
}

/**
 * 智能標籤推薦（基於用戶歷史）
 */
export function recommendTags(
  content: string,
  userHistory: string[]
): string[] {
  // 從用戶歷史中提取常用標籤
  const tagFrequency: Record<string, number> = {};

  userHistory.forEach((tag) => {
    tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
  });

  // 返回最常用的標籤
  return Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);
}
