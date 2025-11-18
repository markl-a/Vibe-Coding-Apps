/**
 * AI 內容審核模組
 * 使用 OpenAI Moderation API 和 Claude 進行雙重檢測
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // 注意：生產環境應使用後端
});

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface ModerationResult {
  safe: boolean;
  categories: {
    hate: number;
    harassment: number;
    violence: number;
    sexual: number;
    selfHarm: number;
    spam: number;
  };
  flaggedCategories: string[];
  aiAnalysis: string;
  confidence: number;
}

/**
 * 使用 OpenAI Moderation API 進行內容審核
 */
async function moderateWithOpenAI(content: string): Promise<any> {
  try {
    const moderation = await openai.moderations.create({
      input: content,
    });

    return moderation.results[0];
  } catch (error) {
    console.error('OpenAI moderation error:', error);
    throw error;
  }
}

/**
 * 使用 Claude 進行深度內容分析
 */
async function analyzeWithClaude(content: string): Promise<any> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `請分析以下內容是否包含不當信息（仇恨言論、騷擾、暴力、色情、垃圾郵件等）。
請以 JSON 格式回應：
{
  "safe": true/false,
  "issues": ["問題1", "問題2"],
  "analysis": "詳細分析",
  "confidence": 0-100
}

內容：
${content}`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (textContent && 'text' in textContent) {
      // 提取 JSON
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return { safe: true, issues: [], analysis: 'No issues detected', confidence: 50 };
  } catch (error) {
    console.error('Claude analysis error:', error);
    throw error;
  }
}

/**
 * 綜合審核函數
 * @param content 要審核的內容
 * @returns 審核結果
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  if (!content || content.trim().length === 0) {
    return {
      safe: false,
      categories: {
        hate: 0,
        harassment: 0,
        violence: 0,
        sexual: 0,
        selfHarm: 0,
        spam: 0,
      },
      flaggedCategories: ['empty'],
      aiAnalysis: '內容為空',
      confidence: 100,
    };
  }

  try {
    // 並行執行兩個 API 調用
    const [openaiResult, claudeResult] = await Promise.all([
      moderateWithOpenAI(content),
      analyzeWithClaude(content),
    ]);

    // 合併結果
    const categories = {
      hate: openaiResult.category_scores.hate,
      harassment: openaiResult.category_scores.harassment,
      violence: openaiResult.category_scores.violence,
      sexual: openaiResult.category_scores.sexual,
      selfHarm: openaiResult.category_scores['self-harm'] || 0,
      spam: claudeResult.issues?.includes('spam') ? 0.8 : 0.1,
    };

    const flaggedCategories: string[] = [];
    Object.entries(categories).forEach(([category, score]) => {
      if (score > 0.5) {
        flaggedCategories.push(category);
      }
    });

    // 如果 OpenAI 或 Claude 任一判定不安全，則標記為不安全
    const safe = !openaiResult.flagged && claudeResult.safe;

    return {
      safe,
      categories,
      flaggedCategories,
      aiAnalysis: claudeResult.analysis || 'Content analyzed successfully',
      confidence: claudeResult.confidence || 85,
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    // 降級策略：如果 API 失敗，進行基本的關鍵詞檢測
    return fallbackModeration(content);
  }
}

/**
 * 降級策略：基本關鍵詞檢測
 */
function fallbackModeration(content: string): ModerationResult {
  const lowerContent = content.toLowerCase();

  const badWords = ['spam', 'scam', 'fuck', 'shit', 'hate', 'kill'];
  const flaggedCategories: string[] = [];

  if (badWords.some((word) => lowerContent.includes(word))) {
    flaggedCategories.push('potential_violation');
  }

  return {
    safe: flaggedCategories.length === 0,
    categories: {
      hate: 0,
      harassment: 0,
      violence: 0,
      sexual: 0,
      selfHarm: 0,
      spam: flaggedCategories.length > 0 ? 0.6 : 0.1,
    },
    flaggedCategories,
    aiAnalysis: 'Fallback moderation - API unavailable',
    confidence: 50,
  };
}

/**
 * 批量審核（優化性能）
 */
export async function moderateContentBatch(
  contents: string[]
): Promise<ModerationResult[]> {
  const results = await Promise.all(contents.map((content) => moderateContent(content)));
  return results;
}

/**
 * 實時審核（用於輸入框）
 * @param content 當前輸入內容
 * @param onResult 回調函數
 */
export function moderateRealtime(
  content: string,
  onResult: (result: ModerationResult) => void
) {
  let timeout: NodeJS.Timeout;

  return (newContent: string) => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      const result = await moderateContent(newContent);
      onResult(result);
    }, 500); // 500ms 防抖
  };
}
