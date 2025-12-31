/**
 * 結構化日誌系統
 */

// Express-compatible types (without requiring express dependency)
interface HttpRequest {
  method?: string;
  url?: string;
  path?: string;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  connection?: { remoteAddress?: string };
}

interface HttpResponse {
  statusCode?: number;
  on(event: string, callback: () => void): void;
}

type NextFunction = (err?: unknown) => void;

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  service?: string;
  traceId?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

export class Logger {
  private readonly service: string;
  private readonly minLevel: LogLevel;

  constructor(service: string, minLevel: LogLevel = LogLevel.INFO) {
    this.service = service;
    this.minLevel = minLevel;
  }

  private log(level: LogLevel, levelStr: string, message: string, context?: LogContext, error?: Error) {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      level: levelStr,
      message,
      timestamp: new Date().toISOString(),
      context: {
        service: this.service,
        ...context,
      },
    };

    if (error) {
      const errorInfo: { name: string; message: string; stack?: string } = {
        name: error.name,
        message: error.message,
      };
      if (process.env.NODE_ENV === 'development' && error.stack) {
        errorInfo.stack = error.stack;
      }
      entry.error = errorInfo;
    }

    const output = JSON.stringify(entry);

    if (level >= LogLevel.ERROR) {
      console.error(output);
    } else if (level >= LogLevel.WARN) {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, 'INFO', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, 'WARN', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, 'ERROR', message, context, error);
  }

  // HTTP 請求日誌
  logRequest(req: HttpRequest, res: HttpResponse, duration: number) {
    const userAgent = req.headers?.['user-agent'];
    this.info('HTTP Request', {
      method: req.method,
      path: req.path || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
      ip: req.ip || req.connection?.remoteAddress,
    });
  }
}

/**
 * 創建日誌實例的工廠函數
 */
export function createLogger(service: string, options?: { minLevel?: LogLevel }): Logger {
  const minLevel = options?.minLevel ??
    (process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG :
     process.env.LOG_LEVEL === 'warn' ? LogLevel.WARN :
     process.env.LOG_LEVEL === 'error' ? LogLevel.ERROR : LogLevel.INFO);

  return new Logger(service, minLevel);
}

/**
 * Express 日誌中間件
 */
export function requestLogger(logger: Logger) {
  return (req: HttpRequest, res: HttpResponse, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.logRequest(req, res, Date.now() - start);
    });
    next();
  };
}
