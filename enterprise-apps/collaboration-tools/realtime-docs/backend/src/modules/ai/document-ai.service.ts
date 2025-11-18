import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SmartSuggestion {
  type: 'completion' | 'correction' | 'improvement' | 'formatting';
  original: string;
  suggestion: string;
  confidence: number;
  reason: string;
}

interface DocumentAnalysis {
  readabilityScore: number;
  toneAnalysis: string;
  keyTopics: string[];
  wordCount: number;
  estimatedReadingTime: number;
  suggestions: SmartSuggestion[];
}

@Injectable()
export class DocumentAIService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * 智能文本補全
   */
  async generateCompletion(
    currentText: string,
    context?: {
      documentType?: 'email' | 'report' | 'article' | 'note';
      tone?: 'formal' | 'casual' | 'technical';
    },
  ): Promise<string[]> {
    try {
      const prompt = this.buildCompletionPrompt(currentText, context);
      const response = await this.callOpenAI(prompt);

      // 解析多個建議
      const suggestions = response
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3);

      return suggestions;
    } catch (error) {
      console.error('Error generating completion:', error);
      return [];
    }
  }

  /**
   * 語法和拼寫檢查
   */
  async checkGrammar(text: string): Promise<Array<{
    position: { start: number; end: number };
    original: string;
    correction: string;
    type: 'grammar' | 'spelling' | 'punctuation';
    message: string;
  }>> {
    try {
      const prompt = `請檢查以下文本的語法、拼寫和標點符號錯誤，以 JSON 陣列格式回覆：
[
  {
    "original": "錯誤的文字",
    "correction": "正確的文字",
    "type": "grammar/spelling/punctuation",
    "message": "錯誤說明"
  }
]

文本：
${text}`;

      const response = await this.callOpenAI(prompt);

      try {
        const errors = JSON.parse(response);
        // 在實際文本中找到錯誤位置
        return errors.map((error: any) => {
          const start = text.indexOf(error.original);
          const end = start + error.original.length;

          return {
            position: { start, end },
            original: error.original,
            correction: error.correction,
            type: error.type,
            message: error.message,
          };
        });
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error checking grammar:', error);
      return [];
    }
  }

  /**
   * 智能改寫建議
   */
  async suggestImprovements(
    text: string,
    improvementType: 'clarity' | 'conciseness' | 'tone' | 'formality',
  ): Promise<{
    original: string;
    improved: string;
    changes: Array<{ type: string; description: string }>;
  }> {
    try {
      const prompts = {
        clarity: '使文本更清晰易懂',
        conciseness: '使文本更簡潔',
        tone: '調整文本的語氣使其更合適',
        formality: '使文本更正式專業',
      };

      const prompt = `請${prompts[improvementType]}，回覆 JSON 格式：
{
  "improved": "改進後的文本",
  "changes": [
    {"type": "變更類型", "description": "變更說明"}
  ]
}

原文：
${text}`;

      const response = await this.callOpenAI(prompt);
      const result = JSON.parse(response);

      return {
        original: text,
        improved: result.improved || text,
        changes: result.changes || [],
      };
    } catch (error) {
      console.error('Error suggesting improvements:', error);
      return {
        original: text,
        improved: text,
        changes: [],
      };
    }
  }

  /**
   * 文檔摘要生成
   */
  async generateSummary(
    text: string,
    summaryLength: 'short' | 'medium' | 'long' = 'medium',
  ): Promise<{
    summary: string;
    keyPoints: string[];
    highlights: string[];
  }> {
    try {
      const lengthInstructions = {
        short: '1-2句話',
        medium: '1個段落（3-5句話）',
        long: '2-3個段落',
      };

      const prompt = `請為以下文本生成摘要，回覆 JSON 格式：
{
  "summary": "${lengthInstructions[summaryLength]}的摘要",
  "keyPoints": ["要點1", "要點2", "要點3"],
  "highlights": ["重點片段1", "重點片段2"]
}

文本：
${text}`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      const result = JSON.parse(response);

      return {
        summary: result.summary || '無法生成摘要',
        keyPoints: result.keyPoints || [],
        highlights: result.highlights || [],
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        summary: '無法生成摘要',
        keyPoints: [],
        highlights: [],
      };
    }
  }

  /**
   * 文檔分析
   */
  async analyzeDocument(text: string): Promise<DocumentAnalysis> {
    try {
      // 基礎統計
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      const estimatedReadingTime = Math.ceil(wordCount / 200); // 假設每分鐘200字

      // AI 分析
      const prompt = `請分析以下文檔，回覆 JSON 格式：
{
  "readabilityScore": 0-100的可讀性分數,
  "toneAnalysis": "文檔的語氣（如：專業、友好、中立等）",
  "keyTopics": ["主題1", "主題2", "主題3"]
}

文檔內容：
${text.substring(0, 2000)}...`;

      const response = await this.callOpenAI(prompt);
      const result = JSON.parse(response);

      // 獲取改進建議
      const suggestions = await this.getSmartSuggestions(text);

      return {
        readabilityScore: result.readabilityScore || 0,
        toneAnalysis: result.toneAnalysis || '中立',
        keyTopics: result.keyTopics || [],
        wordCount,
        estimatedReadingTime,
        suggestions,
      };
    } catch (error) {
      console.error('Error analyzing document:', error);
      return {
        readabilityScore: 0,
        toneAnalysis: '無法分析',
        keyTopics: [],
        wordCount: 0,
        estimatedReadingTime: 0,
        suggestions: [],
      };
    }
  }

  /**
   * 智能格式化
   */
  async formatDocument(
    text: string,
    format: 'markdown' | 'html' | 'plain',
  ): Promise<string> {
    try {
      const prompt = `請將以下文本轉換為${format}格式，保持內容不變，只調整格式：

原文：
${text}

請直接回覆轉換後的文本，不需要其他說明。`;

      const response = await this.callOpenAI(prompt);
      return response;
    } catch (error) {
      console.error('Error formatting document:', error);
      return text;
    }
  }

  /**
   * 翻譯文檔
   */
  async translateDocument(
    text: string,
    targetLanguage: string,
  ): Promise<{
    translation: string;
    sourceLanguage: string;
    confidence: number;
  }> {
    try {
      const prompt = `請將以下文本翻譯成${targetLanguage}，保持格式和專業術語的準確性。回覆 JSON 格式：
{
  "translation": "翻譯後的文本",
  "sourceLanguage": "原語言",
  "confidence": 0-1的信心度
}

原文：
${text}`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      const result = JSON.parse(response);

      return {
        translation: result.translation || text,
        sourceLanguage: result.sourceLanguage || 'unknown',
        confidence: result.confidence || 0,
      };
    } catch (error) {
      console.error('Error translating document:', error);
      return {
        translation: text,
        sourceLanguage: 'unknown',
        confidence: 0,
      };
    }
  }

  /**
   * 生成大綱
   */
  async generateOutline(text: string): Promise<{
    title: string;
    sections: Array<{
      heading: string;
      summary: string;
      subsections?: string[];
    }>;
  }> {
    try {
      const prompt = `請為以下文檔生成大綱，回覆 JSON 格式：
{
  "title": "文檔標題",
  "sections": [
    {
      "heading": "章節標題",
      "summary": "章節摘要",
      "subsections": ["子章節1", "子章節2"]
    }
  ]
}

文檔：
${text}`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      const result = JSON.parse(response);

      return {
        title: result.title || '未命名文檔',
        sections: result.sections || [],
      };
    } catch (error) {
      console.error('Error generating outline:', error);
      return {
        title: '未命名文檔',
        sections: [],
      };
    }
  }

  /**
   * 問答助手
   */
  async answerQuestion(
    documentText: string,
    question: string,
  ): Promise<{
    answer: string;
    confidence: number;
    sources: string[];
  }> {
    try {
      const prompt = `基於以下文檔內容，回答問題。回覆 JSON 格式：
{
  "answer": "答案",
  "confidence": 0-1的信心度,
  "sources": ["相關文檔片段1", "相關文檔片段2"]
}

文檔內容：
${documentText.substring(0, 3000)}...

問題：${question}`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      const result = JSON.parse(response);

      return {
        answer: result.answer || '無法回答',
        confidence: result.confidence || 0,
        sources: result.sources || [],
      };
    } catch (error) {
      console.error('Error answering question:', error);
      return {
        answer: '無法回答',
        confidence: 0,
        sources: [],
      };
    }
  }

  /**
   * 情感和語氣分析
   */
  async analyzeToneAndSentiment(text: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    tone: string[];
    formality: number;
    emotions: Map<string, number>;
  }> {
    try {
      const prompt = `分析以下文本的情感和語氣，回覆 JSON 格式：
{
  "sentiment": "positive/neutral/negative",
  "tone": ["語氣特徵1", "語氣特徵2"],
  "formality": 0-1的正式程度,
  "emotions": {
    "joy": 0-1,
    "confidence": 0-1,
    "urgency": 0-1
  }
}

文本：
${text}`;

      const response = await this.callOpenAI(prompt);
      const result = JSON.parse(response);

      return {
        sentiment: result.sentiment || 'neutral',
        tone: result.tone || [],
        formality: result.formality || 0.5,
        emotions: new Map(Object.entries(result.emotions || {})),
      };
    } catch (error) {
      console.error('Error analyzing tone and sentiment:', error);
      return {
        sentiment: 'neutral',
        tone: [],
        formality: 0.5,
        emotions: new Map(),
      };
    }
  }

  // ============ 私有方法 ============

  private buildCompletionPrompt(
    currentText: string,
    context?: any,
  ): string {
    const contextInfo = context
      ? `文檔類型：${context.documentType || '一般'}
語氣：${context.tone || '中性'}`
      : '';

    return `請為以下文本提供3個可能的續寫建議，每行一個建議：

${contextInfo ? contextInfo + '\n\n' : ''}當前文本：
${currentText}

建議：`;
  }

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
            content: '你是一個專業的文檔寫作助手，幫助用戶提升文檔質量。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  private async getSmartSuggestions(text: string): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // 簡化版本的建議邏輯
    if (text.length > 1000) {
      suggestions.push({
        type: 'improvement',
        original: '',
        suggestion: '文檔較長，建議添加章節標題和小標題以提升可讀性',
        confidence: 0.8,
        reason: '長文檔需要清晰的結構',
      });
    }

    // 可以添加更多規則或使用 AI 生成建議

    return suggestions;
  }
}
