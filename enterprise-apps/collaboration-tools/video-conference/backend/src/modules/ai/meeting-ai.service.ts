import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TranscriptionSegment {
  speaker: string;
  text: string;
  timestamp: number;
  confidence: number;
}

interface MeetingSummary {
  title: string;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: Array<{
    task: string;
    assignee?: string;
    dueDate?: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  participants: string[];
  duration: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface WhisperSegment {
  text: string;
  start: number;
  confidence?: number;
}

interface WhisperApiResponse {
  text?: string;
  segments?: WhisperSegment[];
}

interface MeetingInfo {
  title: string;
  participants: string[];
  duration: number;
}

@Injectable()
export class MeetingAIService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * 即時語音轉文字 (使用 Whisper API)
   */
  async transcribeAudio(audioBuffer: Buffer): Promise<TranscriptionSegment[]> {
    try {
      // 使用 OpenAI Whisper API 進行轉錄
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer]), 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'zh');
      formData.append('response_format', 'verbose_json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.statusText}`);
      }

      const result = await response.json();

      // 處理轉錄結果
      return this.processTranscription(result);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return [];
    }
  }

  /**
   * 生成即時字幕
   */
  async generateRealTimeCaptions(
    audioChunk: Buffer,
  ): Promise<{ text: string; timestamp: number }> {
    try {
      const segments = await this.transcribeAudio(audioChunk);
      if (segments.length > 0) {
        return {
          text: segments[0].text,
          timestamp: segments[0].timestamp,
        };
      }
      return { text: '', timestamp: Date.now() };
    } catch (error) {
      console.error('Error generating captions:', error);
      return { text: '', timestamp: Date.now() };
    }
  }

  /**
   * 生成會議摘要
   */
  async generateMeetingSummary(
    transcripts: TranscriptionSegment[],
    meetingInfo: {
      title: string;
      participants: string[];
      duration: number;
    },
  ): Promise<MeetingSummary> {
    try {
      const transcriptText = transcripts
        .map(t => `[${t.speaker}]: ${t.text}`)
        .join('\n');

      const prompt = `請為以下會議生成詳細摘要，以 JSON 格式回覆：

會議資訊：
- 主題：${meetingInfo.title}
- 參與者：${meetingInfo.participants.join(', ')}
- 時長：${Math.floor(meetingInfo.duration / 60)} 分鐘

會議內容：
${transcriptText}

請回覆以下 JSON 格式：
{
  "summary": "會議摘要（3-5句話）",
  "keyPoints": ["要點1", "要點2", "要點3"],
  "decisions": ["決策1", "決策2"],
  "actionItems": [
    {
      "task": "任務描述",
      "assignee": "負責人",
      "priority": "high/medium/low"
    }
  ],
  "sentiment": "positive/neutral/negative"
}`;

      const response = await this.callOpenAI(prompt, 'gpt-4');
      const result = JSON.parse(response);

      return {
        title: meetingInfo.title,
        summary: result.summary || '無法生成摘要',
        keyPoints: result.keyPoints || [],
        decisions: result.decisions || [],
        actionItems: result.actionItems || [],
        participants: meetingInfo.participants,
        duration: meetingInfo.duration,
        sentiment: result.sentiment || 'neutral',
      };
    } catch (error) {
      console.error('Error generating meeting summary:', error);
      return this.getDefaultSummary(meetingInfo);
    }
  }

  /**
   * 識別發言者 (Speaker Diarization)
   */
  async identifySpeakers(
    audioBuffer: Buffer,
    knownSpeakers?: Array<{ id: string; name: string; voiceSample?: Buffer }>,
  ): Promise<Map<string, string>> {
    // 實際應用中可以使用專門的 Speaker Diarization 服務
    // 例如 AWS Transcribe, Google Cloud Speech-to-Text 等

    try {
      // 簡化版本：根據音頻特徵識別發言者
      // 這裡返回一個模擬結果
      const speakerMap = new Map<string, string>();

      if (knownSpeakers) {
        knownSpeakers.forEach((speaker, index) => {
          speakerMap.set(`speaker_${index}`, speaker.name);
        });
      }

      return speakerMap;
    } catch (error) {
      console.error('Error identifying speakers:', error);
      return new Map();
    }
  }

  /**
   * 智能會議提醒
   */
  async generateMeetingReminders(
    summary: MeetingSummary,
  ): Promise<Array<{
    type: 'action_item' | 'decision' | 'follow_up';
    content: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
  }>> {
    const reminders: Array<any> = [];

    // 行動項提醒
    summary.actionItems.forEach(item => {
      reminders.push({
        type: 'action_item',
        content: `${item.assignee ? `@${item.assignee} ` : ''}${item.task}`,
        priority: item.priority,
        dueDate: item.dueDate,
      });
    });

    // 決策提醒
    summary.decisions.forEach(decision => {
      reminders.push({
        type: 'decision',
        content: decision,
        priority: 'medium',
      });
    });

    return reminders;
  }

  /**
   * 實時會議分析
   */
  async analyzeConversation(
    recentTranscripts: TranscriptionSegment[],
  ): Promise<{
    engagement: number; // 0-100
    speakingTime: Map<string, number>; // 每個人的發言時間
    topicDrift: boolean; // 是否偏離主題
    suggestions: string[]; // 會議建議
  }> {
    try {
      const speakingTime = new Map<string, number>();
      let totalTime = 0;

      // 計算發言時間
      recentTranscripts.forEach(segment => {
        const currentTime = speakingTime.get(segment.speaker) || 0;
        speakingTime.set(segment.speaker, currentTime + 1);
        totalTime += 1;
      });

      // 計算參與度
      const engagement = this.calculateEngagement(speakingTime, totalTime);

      // 生成建議
      const suggestions = this.generateSuggestions(speakingTime, totalTime);

      return {
        engagement,
        speakingTime,
        topicDrift: false, // 可以通過 AI 分析主題漂移
        suggestions,
      };
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return {
        engagement: 0,
        speakingTime: new Map(),
        topicDrift: false,
        suggestions: [],
      };
    }
  }

  /**
   * 智能背景降噪
   */
  async removeBackgroundNoise(audioBuffer: Buffer): Promise<Buffer> {
    // 實際應用中可以使用專門的音頻處理庫
    // 例如 TensorFlow.js 的降噪模型、WebRTC 的音頻處理等

    try {
      // 這裡返回原始音頻，實際應用需要實現降噪算法
      return audioBuffer;
    } catch (error) {
      console.error('Error removing background noise:', error);
      return audioBuffer;
    }
  }

  /**
   * 情感分析
   */
  async analyzeSentiment(transcript: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    emotions: Map<string, number>; // 具體情緒及其強度
  }> {
    try {
      const prompt = `分析以下會議對話的情感，回覆 JSON 格式：
{
  "sentiment": "positive/neutral/negative",
  "score": -1到1的分數,
  "emotions": {
    "happy": 0-1,
    "frustrated": 0-1,
    "excited": 0-1,
    "confused": 0-1
  }
}

對話內容：
${transcript}`;

      const response = await this.callOpenAI(prompt);
      const result = JSON.parse(response);

      return {
        sentiment: result.sentiment || 'neutral',
        score: result.score || 0,
        emotions: new Map(Object.entries(result.emotions || {})),
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        sentiment: 'neutral',
        score: 0,
        emotions: new Map(),
      };
    }
  }

  /**
   * 智能會議助手建議
   */
  async getSmartSuggestions(
    context: {
      currentTopic: string;
      recentTranscripts: TranscriptionSegment[];
      timeElapsed: number;
      scheduledDuration: number;
    },
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // 時間管理建議
    const remainingTime = context.scheduledDuration - context.timeElapsed;
    if (remainingTime < context.scheduledDuration * 0.1) {
      suggestions.push('⏰ 會議即將結束，請準備總結');
    }

    // 參與度建議
    const analysis = await this.analyzeConversation(context.recentTranscripts);
    if (analysis.engagement < 50) {
      suggestions.push('💬 參與度較低，建議鼓勵更多討論');
    }

    // 發言時間平衡建議
    const speakingDistribution = this.analyzeSpeakingDistribution(analysis.speakingTime);
    if (speakingDistribution.isUnbalanced) {
      suggestions.push('🎤 發言時間分配不均，建議讓其他人也分享觀點');
    }

    return suggestions;
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
            content: '你是一個專業的會議助手，幫助團隊提高會議效率。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  private processTranscription(result: WhisperApiResponse): TranscriptionSegment[] {
    // 處理 Whisper API 返回的轉錄結果
    const segments: TranscriptionSegment[] = [];

    if (result.segments) {
      result.segments.forEach((segment, index: number) => {
        segments.push({
          speaker: `speaker_${index % 3}`, // 簡化版本，實際需要 Speaker Diarization
          text: segment.text,
          timestamp: segment.start * 1000,
          confidence: segment.confidence || 1.0,
        });
      });
    } else if (result.text) {
      segments.push({
        speaker: 'speaker_0',
        text: result.text,
        timestamp: Date.now(),
        confidence: 1.0,
      });
    }

    return segments;
  }

  private getDefaultSummary(meetingInfo: MeetingInfo): MeetingSummary {
    return {
      title: meetingInfo.title,
      summary: '無法生成會議摘要',
      keyPoints: [],
      decisions: [],
      actionItems: [],
      participants: meetingInfo.participants,
      duration: meetingInfo.duration,
      sentiment: 'neutral',
    };
  }

  private calculateEngagement(
    speakingTime: Map<string, number>,
    totalTime: number,
  ): number {
    if (speakingTime.size === 0 || totalTime === 0) return 0;

    // 計算發言分布的均勻度
    const avgTime = totalTime / speakingTime.size;
    let variance = 0;

    speakingTime.forEach(time => {
      variance += Math.pow(time - avgTime, 2);
    });

    variance /= speakingTime.size;
    const stdDev = Math.sqrt(variance);

    // 標準差越小，參與度越高
    const engagement = Math.max(0, Math.min(100, 100 - (stdDev / avgTime) * 50));

    return Math.round(engagement);
  }

  private generateSuggestions(
    speakingTime: Map<string, number>,
    totalTime: number,
  ): string[] {
    const suggestions: string[] = [];
    const avgTime = totalTime / speakingTime.size;

    speakingTime.forEach((time, speaker) => {
      if (time > avgTime * 2) {
        suggestions.push(`${speaker} 發言時間較長，可以讓其他人也分享觀點`);
      } else if (time < avgTime * 0.3) {
        suggestions.push(`${speaker} 發言較少，可以邀請分享想法`);
      }
    });

    return suggestions;
  }

  private analyzeSpeakingDistribution(
    speakingTime: Map<string, number>,
  ): { isUnbalanced: boolean; details: string } {
    if (speakingTime.size === 0) {
      return { isUnbalanced: false, details: 'No speakers' };
    }

    const times = Array.from(speakingTime.values());
    const max = Math.max(...times);
    const min = Math.min(...times);

    // 如果最大值是最小值的 3 倍以上，認為不平衡
    const isUnbalanced = max > min * 3;

    return {
      isUnbalanced,
      details: isUnbalanced
        ? '發言時間分配不均'
        : '發言時間分配較為均衡',
    };
  }
}
