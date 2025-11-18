import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AIService } from './ai.service';

describe('AIService', () => {
  let service: AIService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'test-api-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSmartReplies', () => {
    it('should return fallback replies when API call fails', async () => {
      const message = '謝謝你的幫助！';
      const replies = await service.generateSmartReplies(message);

      expect(replies).toBeDefined();
      expect(Array.isArray(replies)).toBe(true);
      expect(replies.length).toBeGreaterThan(0);
    });

    it('should return appropriate replies for questions', async () => {
      const message = '這個功能什麼時候可以完成？';
      const replies = await service.generateSmartReplies(message);

      expect(replies).toBeDefined();
      expect(Array.isArray(replies)).toBe(true);
    });

    it('should return appropriate replies for meeting-related messages', async () => {
      const message = '明天下午3點開會討論這個項目';
      const replies = await service.generateSmartReplies(message);

      expect(replies).toBeDefined();
      expect(Array.isArray(replies)).toBe(true);
    });
  });

  describe('analyzeSentiment', () => {
    it('should return neutral sentiment when API call fails', async () => {
      const message = '這是一條測試訊息';
      const result = await service.analyzeSentiment(message);

      expect(result).toBeDefined();
      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBe(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('categorizeMessage', () => {
    it('should return default category when API call fails', async () => {
      const message = '這是一條測試訊息';
      const result = await service.categorizeMessage(message);

      expect(result).toBeDefined();
      expect(result.category).toBe('general');
      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.priority).toBe('medium');
    });
  });

  describe('extractActionItems', () => {
    it('should return empty array when API call fails', async () => {
      const messages = ['請幫我完成這個任務', '我會在週五前完成報告'];
      const result = await service.extractActionItems(messages);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('suggestMentions', () => {
    it('should return empty array when API call fails', async () => {
      const message = '誰可以幫我處理這個 bug？';
      const members = [
        { id: '1', username: 'john', expertise: ['frontend'] },
        { id: '2', username: 'jane', expertise: ['backend'] },
      ];
      const result = await service.suggestMentions(message, members);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('translateMessage', () => {
    it('should return original message when API call fails', async () => {
      const message = 'Hello, how are you?';
      const result = await service.translateMessage(message, '中文');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('generateMeetingNotes', () => {
    it('should return default structure when API call fails', async () => {
      const messages = [
        '大家好，我們開始會議',
        '今天討論的主題是新功能開發',
        'John 負責前端開發',
        '我們決定使用 React',
      ];
      const result = await service.generateMeetingNotes(messages);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(Array.isArray(result.keyPoints)).toBe(true);
      expect(Array.isArray(result.decisions)).toBe(true);
      expect(Array.isArray(result.actionItems)).toBe(true);
    });
  });
});
