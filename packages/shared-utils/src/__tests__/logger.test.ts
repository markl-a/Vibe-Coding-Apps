import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel, createLogger, type LogEntry } from '../logger';

describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Logger construction', () => {
    it('should create logger without context', () => {
      const logger = new Logger();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create logger with context', () => {
      const logger = new Logger('TestContext');
      logger.info('test message');
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext]')
      );
    });

    it('should create logger with custom min level', () => {
      const logger = new Logger(undefined, { minLevel: LogLevel.WARN });
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe('createLogger factory', () => {
    it('should create logger instance', () => {
      const logger = createLogger('Factory');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create logger with options', () => {
      const logger = createLogger('Factory', { minLevel: LogLevel.ERROR });
      logger.warn('test');
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('Log levels', () => {
    it('should log debug messages', () => {
      const logger = new Logger('Test');
      logger.debug('debug message');

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]')
      );
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('debug message')
      );
    });

    it('should log info messages', () => {
      const logger = new Logger('Test');
      logger.info('info message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]')
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('info message')
      );
    });

    it('should log warn messages', () => {
      const logger = new Logger('Test');
      logger.warn('warn message');

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      );
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('warn message')
      );
    });

    it('should log error messages', () => {
      const logger = new Logger('Test');
      logger.error('error message');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('error message')
      );
    });
  });

  describe('Data logging', () => {
    it('should log with data object', () => {
      const logger = new Logger('Test');
      const data = { userId: 123, action: 'login' };
      logger.info('User action', data);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(data))
      );
    });

    it('should log with primitive data', () => {
      const logger = new Logger('Test');
      logger.info('Count', 42);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('42')
      );
    });

    it('should log with array data', () => {
      const logger = new Logger('Test');
      const data = [1, 2, 3];
      logger.info('Numbers', data);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(data))
      );
    });
  });

  describe('Error logging', () => {
    it('should log error with Error object', () => {
      const logger = new Logger('Test');
      const error = new Error('Something went wrong');
      logger.error('Failed operation', error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Something went wrong')
      );
    });

    it('should log error with data', () => {
      const logger = new Logger('Test');
      const error = new Error('Failed');
      const data = { attemptCount: 3 };
      logger.error('Retry failed', error, data);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(data))
      );
    });

    it('should include error stack trace', () => {
      const logger = new Logger('Test');
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Stack:')
      );
    });
  });

  describe('Timestamp', () => {
    it('should include timestamp in log', () => {
      const logger = new Logger('Test');
      logger.info('test');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      );
    });
  });

  describe('Context', () => {
    it('should include context when provided', () => {
      const logger = new Logger('MyService');
      logger.info('test message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[MyService]')
      );
    });

    it('should not include context when not provided', () => {
      const logger = new Logger();
      logger.info('test message');

      const call = consoleSpy.info.mock.calls[0][0];
      expect(call).not.toMatch(/\[.*\] \[INFO\] \[.*\]/);
    });
  });

  describe('Min level filtering', () => {
    it('should filter logs below min level', () => {
      const logger = new Logger('Test', { minLevel: LogLevel.WARN });

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should allow changing min level', () => {
      const logger = new Logger('Test', { minLevel: LogLevel.ERROR });

      logger.warn('warn 1');
      expect(consoleSpy.warn).not.toHaveBeenCalled();

      logger.setMinLevel(LogLevel.WARN);
      logger.warn('warn 2');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should respect debug level', () => {
      const logger = new Logger('Test', { minLevel: LogLevel.DEBUG });

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleSpy.debug).toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Custom formatter', () => {
    it('should use custom formatter', () => {
      const customFormatter = vi.fn(() => 'CUSTOM FORMAT');
      const logger = new Logger('Test', { formatter: customFormatter });

      logger.info('test message', { data: 'value' });

      expect(customFormatter).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'test message',
          context: 'Test',
          data: { data: 'value' },
        })
      );
      expect(consoleSpy.info).toHaveBeenCalledWith('CUSTOM FORMAT');
    });

    it('should allow changing formatter', () => {
      const logger = new Logger('Test');
      const newFormatter = () => 'NEW FORMAT';

      logger.setFormatter(newFormatter);
      logger.info('test');

      expect(consoleSpy.info).toHaveBeenCalledWith('NEW FORMAT');
    });

    it('should receive error in formatter', () => {
      let receivedEntry: LogEntry | null = null;
      const customFormatter = vi.fn((entry) => {
        receivedEntry = entry;
        return 'formatted';
      });

      const logger = new Logger('Test', { formatter: customFormatter });
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(receivedEntry?.error).toBe(error);
    });
  });

  describe('Log entry structure', () => {
    it('should create proper log entry with all fields', () => {
      let capturedEntry: LogEntry | null = null;
      const logger = new Logger('TestContext', {
        formatter: (entry) => {
          capturedEntry = entry;
          return 'test';
        },
      });

      const error = new Error('Test');
      const data = { key: 'value' };
      logger.error('Test message', error, data);

      expect(capturedEntry).toMatchObject({
        level: LogLevel.ERROR,
        message: 'Test message',
        context: 'TestContext',
        data: { key: 'value' },
        error: error,
      });
      expect(capturedEntry?.timestamp).toBeDefined();
    });
  });
});
