import type { LogLevel, LogEntry } from './types.js';

/**
 * Structured Logger
 *
 * Provides structured logging with:
 * - Log levels (debug, info, warn, error, fatal)
 * - Contextual data
 * - Trace correlation
 * - JSON output for log aggregation
 */

type LogHandler = (entry: LogEntry) => void;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

class Logger {
  private level: LogLevel = 'info';
  private handlers: LogHandler[] = [];
  private defaultContext: Record<string, unknown> = {};

  constructor() {
    // Default handler: console output
    this.handlers.push((entry) => {
      const output = this.formatEntry(entry);
      const method = entry.level === 'error' || entry.level === 'fatal' ? 'error' : 'log';
      console[method](output);
    });
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Set default context (added to all logs)
   */
  setDefaultContext(context: Record<string, unknown>): void {
    this.defaultContext = context;
  }

  /**
   * Add log handler
   */
  addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Create child logger with additional context
   */
  child(context: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, context);
  }

  /**
   * Log methods
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  fatal(message: string, context?: Record<string, unknown>): void {
    this.log('fatal', message, context);
  }

  /**
   * Core log method
   */
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...this.defaultContext, ...context },
    };

    // Get trace context if available
    const traceContext = getTraceContext();
    if (traceContext) {
      entry.traceId = traceContext.traceId;
      entry.spanId = traceContext.spanId;
    }

    for (const handler of this.handlers) {
      try {
        handler(entry);
      } catch {
        // Ignore handler errors
      }
    }
  }

  /**
   * Format entry for console output
   */
  private formatEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);

    let line = `${timestamp} [${level}] ${entry.message}`;

    if (entry.traceId) {
      line += ` trace=${entry.traceId.slice(0, 8)}`;
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      line += ` ${JSON.stringify(entry.context)}`;
    }

    return line;
  }
}

/**
 * Child logger with additional context
 */
class ChildLogger {
  private parent: Logger;
  private context: Record<string, unknown>;

  constructor(parent: Logger, context: Record<string, unknown>) {
    this.parent = parent;
    this.context = context;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.parent.debug(message, { ...this.context, ...context });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.parent.info(message, { ...this.context, ...context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.parent.warn(message, { ...this.context, ...context });
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.parent.error(message, { ...this.context, ...context });
  }

  fatal(message: string, context?: Record<string, unknown>): void {
    this.parent.fatal(message, { ...this.context, ...context });
  }

  child(context: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this.parent, { ...this.context, ...context });
  }
}

// Trace context storage (simplified - in production use AsyncLocalStorage)
let currentTraceContext: { traceId: string; spanId: string } | null = null;

export function setTraceContext(traceId: string, spanId: string): void {
  currentTraceContext = { traceId, spanId };
}

export function clearTraceContext(): void {
  currentTraceContext = null;
}

export function getTraceContext(): { traceId: string; spanId: string } | null {
  return currentTraceContext;
}

// Export singleton logger
export const logger = new Logger();

// Export Logger class for custom instances
export { Logger, ChildLogger };
