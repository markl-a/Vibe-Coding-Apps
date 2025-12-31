/**
 * Logger Utility
 * Provides structured logging capabilities with different log levels
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
  error?: Error;
}

type LogFormatter = (entry: LogEntry) => string;

const DEFAULT_FORMATTER: LogFormatter = (entry: LogEntry): string => {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
  ];

  if (entry.context) {
    parts.push(`[${entry.context}]`);
  }

  parts.push(entry.message);

  if (entry.data !== undefined) {
    parts.push(JSON.stringify(entry.data));
  }

  if (entry.error) {
    parts.push(`\nError: ${entry.error.message}`);
    if (entry.error.stack) {
      parts.push(`\nStack: ${entry.error.stack}`);
    }
  }

  return parts.join(' ');
};

export class Logger {
  private context?: string;
  private formatter: LogFormatter;
  private minLevel: LogLevel;

  private static LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  constructor(
    context?: string,
    options: {
      formatter?: LogFormatter;
      minLevel?: LogLevel;
    } = {}
  ) {
    this.context = context;
    this.formatter = options.formatter || DEFAULT_FORMATTER;
    this.minLevel = options.minLevel || LogLevel.DEBUG;
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      data,
      error,
    };

    const formattedMessage = this.formatter(entry);
    this.output(level, formattedMessage);
  }

  /**
   * Check if a message should be logged based on minimum level
   */
  private shouldLog(level: LogLevel): boolean {
    return (
      Logger.LOG_LEVEL_PRIORITY[level] >=
      Logger.LOG_LEVEL_PRIORITY[this.minLevel]
    );
  }

  /**
   * Output the formatted message to the console
   */
  private output(level: LogLevel, message: string): void {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Set custom formatter
   */
  setFormatter(formatter: LogFormatter): void {
    this.formatter = formatter;
  }
}

/**
 * Factory function to create a new logger instance
 */
export const createLogger = (
  context: string,
  options?: {
    formatter?: LogFormatter;
    minLevel?: LogLevel;
  }
): Logger => {
  return new Logger(context, options);
};
