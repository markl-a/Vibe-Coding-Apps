import {
  Controller,
  Post,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MeetingAIService } from './meeting-ai.service';

@Controller('meetings/ai')
@UseGuards(JwtAuthGuard)
export class MeetingAIController {
  constructor(private readonly meetingAIService: MeetingAIService) {}

  /**
   * 上傳音頻進行轉錄
   * POST /api/meetings/ai/transcribe
   */
  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        success: false,
        error: 'No audio file provided',
      };
    }

    const segments = await this.meetingAIService.transcribeAudio(file.buffer);

    return {
      success: true,
      data: { segments },
    };
  }

  /**
   * 生成會議摘要
   * POST /api/meetings/ai/summary
   */
  @Post('summary')
  async generateSummary(
    @Body()
    body: {
      transcripts: Array<{
        speaker: string;
        text: string;
        timestamp: number;
      }>;
      meetingInfo: {
        title: string;
        participants: string[];
        duration: number;
      };
    },
  ) {
    const summary = await this.meetingAIService.generateMeetingSummary(
      body.transcripts as any,
      body.meetingInfo,
    );

    return {
      success: true,
      data: summary,
    };
  }

  /**
   * 生成即時字幕
   * POST /api/meetings/ai/captions
   */
  @Post('captions')
  @UseInterceptors(FileInterceptor('audioChunk'))
  async generateCaptions(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        success: false,
        error: 'No audio chunk provided',
      };
    }

    const caption = await this.meetingAIService.generateRealTimeCaptions(
      file.buffer,
    );

    return {
      success: true,
      data: caption,
    };
  }

  /**
   * 分析會議對話
   * POST /api/meetings/ai/analyze
   */
  @Post('analyze')
  async analyzeConversation(
    @Body()
    body: {
      transcripts: Array<{
        speaker: string;
        text: string;
        timestamp: number;
      }>;
    },
  ) {
    const analysis = await this.meetingAIService.analyzeConversation(
      body.transcripts as any,
    );

    // Convert Map to Object for JSON serialization
    const speakingTimeObj: any = {};
    analysis.speakingTime.forEach((time, speaker) => {
      speakingTimeObj[speaker] = time;
    });

    return {
      success: true,
      data: {
        engagement: analysis.engagement,
        speakingTime: speakingTimeObj,
        topicDrift: analysis.topicDrift,
        suggestions: analysis.suggestions,
      },
    };
  }

  /**
   * 情感分析
   * POST /api/meetings/ai/sentiment
   */
  @Post('sentiment')
  async analyzeSentiment(@Body() body: { transcript: string }) {
    const result = await this.meetingAIService.analyzeSentiment(
      body.transcript,
    );

    // Convert Map to Object
    const emotionsObj: any = {};
    result.emotions.forEach((value, key) => {
      emotionsObj[key] = value;
    });

    return {
      success: true,
      data: {
        sentiment: result.sentiment,
        score: result.score,
        emotions: emotionsObj,
      },
    };
  }

  /**
   * 獲取智能建議
   * POST /api/meetings/ai/suggestions
   */
  @Post('suggestions')
  async getSmartSuggestions(
    @Body()
    body: {
      currentTopic: string;
      recentTranscripts: Array<{
        speaker: string;
        text: string;
        timestamp: number;
      }>;
      timeElapsed: number;
      scheduledDuration: number;
    },
  ) {
    const suggestions = await this.meetingAIService.getSmartSuggestions({
      currentTopic: body.currentTopic,
      recentTranscripts: body.recentTranscripts as any,
      timeElapsed: body.timeElapsed,
      scheduledDuration: body.scheduledDuration,
    });

    return {
      success: true,
      data: { suggestions },
    };
  }

  /**
   * 生成會議提醒
   * POST /api/meetings/ai/reminders
   */
  @Post('reminders')
  async generateReminders(
    @Body()
    body: {
      summary: any;
    },
  ) {
    const reminders = await this.meetingAIService.generateMeetingReminders(
      body.summary,
    );

    return {
      success: true,
      data: { reminders },
    };
  }
}
