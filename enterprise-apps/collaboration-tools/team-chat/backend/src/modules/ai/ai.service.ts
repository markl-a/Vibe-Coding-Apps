import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SmartReplyOptions {
  context?: string;
  tone?: 'professional' | 'casual' | 'friendly';
  maxReplies?: number;
}

@Injectable()
export class AIService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * 生成智能回覆建議
   */
  async generateSmartReplies(
    message: string,
    options: SmartReplyOptions = {},
  ): Promise<string[]> {
    const { context = '', tone = 'professional', maxReplies = 3 } = options;

    try {
      const prompt = this.buildSmartReplyPrompt(message, context, tone);
      const response = await this.callOpenAI(prompt, maxReplies);
      return this.parseReplies(response);
    } catch (error) {
      console.error('Error generating smart replies:', error);
      return this.getFallbackReplies(message);
    }
  }

  /**
   * 生成訊息摘要
   */
  async summarizeMessages(messages: string[]): Promise<string> {
    try {
      const prompt = `請為以下對話生成簡潔的摘要（3-5句話）：\n\n${messages.join('\n\n')}`;
      const response = await this.callOpenAI(prompt, 1, 'gpt-4');
      return response || '無法生成摘要';
    } catch (error) {
      console.error('Error summarizing messages:', error);
      return '無法生成摘要';
    }
  }

  /**
   * 訊息情感分析
   */
  async analyzeSentiment(message: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
  }> {
    try {
      const prompt = `分析以下訊息的情感，回覆 JSON 格式 {"sentiment": "positive/neutral/negative", "score": -1到1的分數, "confidence": 0到1的信心度}:\n\n${message}`;
      const response = await this.callOpenAI(prompt, 1);

      try {
        const result = JSON.parse(response);
        return {
          sentiment: result.sentiment || 'neutral',
          score: result.score || 0,
          confidence: result.confidence || 0.5,
        };
      } catch {
        return { sentiment: 'neutral', score: 0, confidence: 0 };
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { sentiment: 'neutral', score: 0, confidence: 0 };
    }
  }

  /**
   * 自動分類訊息
   */
  async categorizeMessage(message: string): Promise<{
    category: string;
    tags: string[];
    priority: 'low' | 'medium' | 'high';
  }> {
    try {
      const prompt = `分析以下訊息並分類，回覆 JSON 格式 {"category": "類別", "tags": ["標籤1", "標籤2"], "priority": "low/medium/high"}:\n\n${message}`;
      const response = await this.callOpenAI(prompt, 1);

      try {
        const result = JSON.parse(response);
        return {
          category: result.category || 'general',
          tags: result.tags || [],
          priority: result.priority || 'medium',
        };
      } catch {
        return { category: 'general', tags: [], priority: 'medium' };
      }
    } catch (error) {
      console.error('Error categorizing message:', error);
      return { category: 'general', tags: [], priority: 'medium' };
    }
  }

  /**
   * 檢測訊息中的行動項
   */
  async extractActionItems(messages: string[]): Promise<Array<{
    task: string;
    assignee?: string;
    dueDate?: string;
    priority: 'low' | 'medium' | 'high';
  }>> {
    try {
      const prompt = `從以下對話中提取所有行動項（待辦事項），回覆 JSON 陣列格式 [{"task": "任務描述", "assignee": "負責人", "priority": "low/medium/high"}]:\n\n${messages.join('\n\n')}`;
      const response = await this.callOpenAI(prompt, 1, 'gpt-4');

      try {
        const result = JSON.parse(response);
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error extracting action items:', error);
      return [];
    }
  }

  /**
   * 智能建議 @提及
   */
  async suggestMentions(
    message: string,
    channelMembers: Array<{ id: string; username: string; expertise?: string[] }>,
  ): Promise<string[]> {
    try {
      const memberList = channelMembers
        .map(m => `${m.username} (專長: ${m.expertise?.join(', ') || '無'})`)
        .join('\n');

      const prompt = `根據以下訊息內容，建議應該 @提及哪些團隊成員（最多3個）。只回覆用戶名，用逗號分隔：\n\n訊息：${message}\n\n團隊成員：\n${memberList}`;

      const response = await this.callOpenAI(prompt, 1);
      return response.split(',').map(s => s.trim()).filter(Boolean);
    } catch (error) {
      console.error('Error suggesting mentions:', error);
      return [];
    }
  }

  /**
   * 翻譯訊息
   */
  async translateMessage(
    message: string,
    targetLanguage: string,
  ): Promise<string> {
    try {
      const prompt = `將以下訊息翻譯成${targetLanguage}，保持原意和語氣：\n\n${message}`;
      const response = await this.callOpenAI(prompt, 1);
      return response || message;
    } catch (error) {
      console.error('Error translating message:', error);
      return message;
    }
  }

  /**
   * 生成會議紀錄
   */
  async generateMeetingNotes(messages: string[]): Promise<{
    summary: string;
    keyPoints: string[];
    decisions: string[];
    actionItems: Array<{ task: string; assignee?: string }>;
  }> {
    try {
      const prompt = `根據以下對話生成會議紀錄，回覆 JSON 格式：
{
  "summary": "會議摘要",
  "keyPoints": ["要點1", "要點2"],
  "decisions": ["決策1", "決策2"],
  "actionItems": [{"task": "任務", "assignee": "負責人"}]
}

對話內容：
${messages.join('\n\n')}`;

      const response = await this.callOpenAI(prompt, 1, 'gpt-4');

      try {
        return JSON.parse(response);
      } catch {
        return {
          summary: '無法生成摘要',
          keyPoints: [],
          decisions: [],
          actionItems: [],
        };
      }
    } catch (error) {
      console.error('Error generating meeting notes:', error);
      return {
        summary: '無法生成摘要',
        keyPoints: [],
        decisions: [],
        actionItems: [],
      };
    }
  }

  // ============ 私有方法 ============

  private buildSmartReplyPrompt(
    message: string,
    context: string,
    tone: string,
  ): string {
    const toneInstructions = {
      professional: '專業、正式的商務用語',
      casual: '輕鬆、隨意的對話風格',
      friendly: '友善、溫暖的語氣',
    };

    return `你是一個專業的商務溝通助手。請為以下訊息提供3個簡短的回覆建議，使用${toneInstructions[tone]}。
${context ? `\n背景：${context}\n` : ''}
訊息：${message}

請只回覆3個建議，每行一個，不需要編號：`;
  }

  private async callOpenAI(
    prompt: string,
    n: number = 1,
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
            content: '你是一個專業、高效的AI助手，專門幫助團隊協作。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        n,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  private parseReplies(response: string): string[] {
    return response
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0 && line.length < 200)
      .slice(0, 3);
  }

  private getFallbackReplies(message: string): string[] {
    const fallbacks = [
      '謝謝你的訊息！',
      '收到，我會處理這件事。',
      '好的，了解了。',
    ];

    // 根據訊息內容提供更智能的備用回覆
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('謝謝') || lowerMessage.includes('感謝')) {
      return ['不客氣！', '很高興能幫上忙！', '隨時樂意協助！'];
    }

    if (lowerMessage.includes('?') || lowerMessage.includes('？')) {
      return ['讓我確認一下再回覆你。', '這是個好問題，我需要調查一下。', '我會盡快給你答覆。'];
    }

    if (lowerMessage.includes('會議') || lowerMessage.includes('開會')) {
      return ['好的，我會準時參加。', '收到，已經加到行事曆了。', '沒問題，到時見！'];
    }

    return fallbacks;
  }
}
