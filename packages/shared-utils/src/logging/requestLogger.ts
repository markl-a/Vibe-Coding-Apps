/**
 * 請求日誌中間件
 * 記錄HTTP請求的詳細信息
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger';

/**
 * 敏感信息字段列表（需要過濾）
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'sessionId',
  'session_id',
  'creditCard',
  'credit_card',
  'ssn',
  'private_key',
  'privateKey',
];

/**
 * 過濾敏感信息
 */
function sanitize(obj: any, depth = 0): any {
  if (depth > 5) return '[Max Depth Reached]';
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some(field =>
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitize(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * 過濾請求頭中的敏感信息
 */
function sanitizeHeaders(headers: any): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value as string;
    }
  }

  return sanitized;
}

export interface RequestLoggerOptions {
  /**
   * 是否記錄請求頭
   * @default true
   */
  logHeaders?: boolean;

  /**
   * 是否記錄請求體
   * @default true
   */
  logBody?: boolean;

  /**
   * 是否記錄查詢參數
   * @default true
   */
  logQuery?: boolean;

  /**
   * 需要額外過濾的敏感字段
   */
  additionalSensitiveFields?: string[];

  /**
   * 要排除的路徑（不記錄日誌）
   */
  excludePaths?: string[];

  /**
   * 自定義日誌級別判斷函數
   */
  getLogLevel?: (req: Request, res: Response) => 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 請求日誌中間件
 *
 * @example
 * ```typescript
 * import { createLogger } from '@vibe/shared-utils';
 * import { requestLogger } from '@vibe/shared-utils/logging';
 *
 * const logger = createLogger('my-service');
 * app.use(requestLogger(logger));
 * ```
 */
export function requestLogger(logger: Logger, options: RequestLoggerOptions = {}) {
  const {
    logHeaders = true,
    logBody = true,
    logQuery = true,
    additionalSensitiveFields = [],
    excludePaths = [],
    getLogLevel,
  } = options;

  // 合併敏感字段列表
  if (additionalSensitiveFields.length > 0) {
    SENSITIVE_FIELDS.push(...additionalSensitiveFields);
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // 檢查是否應該跳過此路徑
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();

    // 構建日誌上下文
    const logContext: any = {
      traceId: req.correlationId,
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    // 添加請求頭
    if (logHeaders) {
      logContext.headers = sanitizeHeaders(req.headers);
    }

    // 添加查詢參數
    if (logQuery && Object.keys(req.query).length > 0) {
      logContext.query = sanitize(req.query);
    }

    // 添加請求體
    if (logBody && req.body && Object.keys(req.body).length > 0) {
      logContext.body = sanitize(req.body);
    }

    // 記錄請求開始
    logger.debug('HTTP Request Started', logContext);

    // 監聽響應完成事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      const responseContext = {
        ...logContext,
        statusCode,
        duration: `${duration}ms`,
        contentLength: res.getHeader('content-length'),
      };

      // 根據狀態碼決定日誌級別
      let level: 'debug' | 'info' | 'warn' | 'error' = 'info';

      if (getLogLevel) {
        level = getLogLevel(req, res);
      } else if (statusCode >= 500) {
        level = 'error';
      } else if (statusCode >= 400) {
        level = 'warn';
      } else if (statusCode >= 300) {
        level = 'info';
      }

      const message = `HTTP ${req.method} ${req.path} ${statusCode} - ${duration}ms`;

      switch (level) {
        case 'debug':
          logger.debug(message, responseContext);
          break;
        case 'warn':
          logger.warn(message, responseContext);
          break;
        case 'error':
          logger.error(message, undefined, responseContext);
          break;
        default:
          logger.info(message, responseContext);
      }
    });

    next();
  };
}

/**
 * 導出工具函數
 */
export { sanitize, sanitizeHeaders };
