/**
 * 響應日誌中間件
 * 記錄HTTP響應的詳細信息，包括響應體
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger';
import { sanitize } from './requestLogger';

// Extend Request to include correlationId
interface RequestWithCorrelation extends Request {
  correlationId?: string;
}

// Response write/end function types
type WriteCallback = (error?: Error | null) => void;
type EndCallback = () => void;

type WriteFunction = {
  (chunk: Buffer | string, encoding?: BufferEncoding, callback?: WriteCallback): boolean;
  (chunk: Buffer | string, callback?: WriteCallback): boolean;
};

type EndFunction = {
  (chunk?: Buffer | string, encoding?: BufferEncoding, callback?: EndCallback): Response;
  (chunk?: Buffer | string, callback?: EndCallback): Response;
  (callback?: EndCallback): Response;
};

// Log context type
interface LogContext {
  traceId?: string;
  method: string;
  url: string;
  path: string;
  statusCode?: number;
  duration?: string;
  ip?: string;
  userAgent?: string;
  headers?: Record<string, unknown>;
  body?: unknown;
  responseHeaders?: Record<string, string | number | string[] | undefined>;
  responseBody?: unknown;
  [key: string]: unknown;
}

/**
 * 響應體攔截器
 * 攔截並記錄響應數據
 */
class ResponseInterceptor {
  private chunks: Buffer[] = [];
  private originalWrite: WriteFunction;
  private originalEnd: EndFunction;

  constructor(private res: Response) {
    this.originalWrite = res.write.bind(res);
    this.originalEnd = res.end.bind(res);
  }

  /**
   * 攔截 res.write
   */
  interceptWrite(): void {
    const self = this;
    this.res.write = function(
      chunk: Buffer | string,
      encodingOrCallback?: BufferEncoding | WriteCallback,
      callback?: WriteCallback
    ): boolean {
      if (chunk) {
        const encoding = typeof encodingOrCallback === 'string' ? encodingOrCallback : undefined;
        self.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }
      if (typeof encodingOrCallback === 'function') {
        return self.originalWrite(chunk, encodingOrCallback);
      }
      return self.originalWrite(chunk, encodingOrCallback, callback);
    } as WriteFunction;
  }

  /**
   * 攔截 res.end
   */
  interceptEnd(): void {
    const self = this;
    this.res.end = function(
      chunkOrCallback?: Buffer | string | EndCallback,
      encodingOrCallback?: BufferEncoding | EndCallback,
      callback?: EndCallback
    ): Response {
      if (chunkOrCallback && typeof chunkOrCallback !== 'function') {
        const encoding = typeof encodingOrCallback === 'string' ? encodingOrCallback : undefined;
        self.chunks.push(Buffer.isBuffer(chunkOrCallback) ? chunkOrCallback : Buffer.from(chunkOrCallback, encoding));
      }
      if (typeof chunkOrCallback === 'function') {
        return self.originalEnd(chunkOrCallback);
      }
      if (typeof encodingOrCallback === 'function') {
        return self.originalEnd(chunkOrCallback, encodingOrCallback);
      }
      return self.originalEnd(chunkOrCallback, encodingOrCallback, callback);
    } as EndFunction;
  }

  /**
   * 獲取響應體
   */
  getBody(): string | null {
    if (this.chunks.length === 0) return null;

    try {
      const buffer = Buffer.concat(this.chunks);
      return buffer.toString('utf8');
    } catch (error) {
      return '[Unable to parse response body]';
    }
  }
}

export interface ResponseLoggerOptions {
  /**
   * 是否記錄響應頭
   * @default true
   */
  logHeaders?: boolean;

  /**
   * 是否記錄響應體
   * @default false (可能很大)
   */
  logBody?: boolean;

  /**
   * 響應體最大長度（字節）
   * @default 1000
   */
  maxBodyLength?: number;

  /**
   * 要排除的路徑（不記錄日誌）
   */
  excludePaths?: string[];

  /**
   * 要排除的Content-Type（不記錄響應體）
   */
  excludeContentTypes?: string[];

  /**
   * 只記錄錯誤響應（4xx, 5xx）
   * @default false
   */
  onlyErrors?: boolean;
}

/**
 * 響應日誌中間件
 *
 * @example
 * ```typescript
 * import { createLogger } from '@vibe/shared-utils';
 * import { responseLogger } from '@vibe/shared-utils/logging';
 *
 * const logger = createLogger('my-service');
 * app.use(responseLogger(logger, {
 *   logBody: true,
 *   maxBodyLength: 500
 * }));
 * ```
 */
export function responseLogger(logger: Logger, options: ResponseLoggerOptions = {}) {
  const {
    logHeaders = true,
    logBody = false,
    maxBodyLength = 1000,
    excludePaths = [],
    excludeContentTypes = ['image/', 'video/', 'audio/', 'application/octet-stream'],
    onlyErrors = false,
  } = options;

  return (req: RequestWithCorrelation, res: Response, next: NextFunction) => {
    // 檢查是否應該跳過此路徑
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    let responseInterceptor: ResponseInterceptor | null = null;

    // 如果需要記錄響應體，設置攔截器
    if (logBody) {
      responseInterceptor = new ResponseInterceptor(res);
      responseInterceptor.interceptWrite();
      responseInterceptor.interceptEnd();
    }

    // 監聽響應完成事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // 如果只記錄錯誤且當前不是錯誤，跳過
      if (onlyErrors && statusCode < 400) {
        return;
      }

      const logContext: LogContext = {
        traceId: req.correlationId,
        method: req.method,
        url: req.originalUrl || req.url,
        path: req.path,
        statusCode,
        duration: `${duration}ms`,
      };

      // 添加響應頭
      if (logHeaders) {
        const headers: Record<string, string | number | string[] | undefined> = {};
        res.getHeaderNames().forEach(name => {
          headers[name] = res.getHeader(name);
        });
        logContext.responseHeaders = headers;
      }

      // 添加響應體
      if (logBody && responseInterceptor) {
        const contentType = res.getHeader('content-type')?.toString() || '';

        // 檢查是否應該排除此Content-Type
        const shouldExclude = excludeContentTypes.some(type =>
          contentType.toLowerCase().startsWith(type.toLowerCase())
        );

        if (!shouldExclude) {
          const body = responseInterceptor.getBody();
          if (body) {
            // 截斷過長的響應體
            const truncatedBody = body.length > maxBodyLength
              ? `${body.substring(0, maxBodyLength)}... [truncated ${body.length - maxBodyLength} bytes]`
              : body;

            // 嘗試解析JSON並過濾敏感信息
            try {
              const parsed = JSON.parse(truncatedBody);
              logContext.responseBody = sanitize(parsed);
            } catch {
              logContext.responseBody = truncatedBody;
            }
          }
        }
      }

      // 根據狀態碼決定日誌級別和消息
      const message = `HTTP Response ${statusCode} - ${req.method} ${req.path} - ${duration}ms`;

      if (statusCode >= 500) {
        logger.error(message, undefined, logContext);
      } else if (statusCode >= 400) {
        logger.warn(message, logContext);
      } else {
        logger.info(message, logContext);
      }
    });

    next();
  };
}

/**
 * 組合請求和響應日誌中間件
 * 提供完整的HTTP日誌記錄功能
 *
 * @example
 * ```typescript
 * import { createLogger } from '@vibe/shared-utils';
 * import { httpLogger } from '@vibe/shared-utils/logging';
 *
 * const logger = createLogger('my-service');
 * app.use(httpLogger(logger, {
 *   logRequestBody: true,
 *   logResponseBody: false,
 *   excludePaths: ['/health', '/metrics']
 * }));
 * ```
 */
export interface HttpLoggerOptions {
  logRequestBody?: boolean;
  logRequestHeaders?: boolean;
  logResponseBody?: boolean;
  logResponseHeaders?: boolean;
  maxBodyLength?: number;
  excludePaths?: string[];
  onlyErrors?: boolean;
}

export function httpLogger(logger: Logger, options: HttpLoggerOptions = {}) {
  const {
    logRequestBody = true,
    logRequestHeaders = true,
    logResponseBody = false,
    logResponseHeaders = true,
    maxBodyLength = 1000,
    excludePaths = [],
    onlyErrors = false,
  } = options;

  return (req: RequestWithCorrelation, res: Response, next: NextFunction) => {
    // 檢查是否應該跳過此路徑
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    let responseInterceptor: ResponseInterceptor | null = null;

    // 如果需要記錄響應體，設置攔截器
    if (logResponseBody) {
      responseInterceptor = new ResponseInterceptor(res);
      responseInterceptor.interceptWrite();
      responseInterceptor.interceptEnd();
    }

    // 記錄請求
    const requestContext: LogContext = {
      traceId: req.correlationId,
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    if (logRequestHeaders) {
      requestContext.headers = sanitize(req.headers) as Record<string, unknown>;
    }

    if (logRequestBody && req.body && Object.keys(req.body as object).length > 0) {
      requestContext.body = sanitize(req.body);
    }

    logger.debug('HTTP Request', requestContext);

    // 監聽響應完成事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // 如果只記錄錯誤且當前不是錯誤，跳過
      if (onlyErrors && statusCode < 400) {
        return;
      }

      const responseContext: LogContext = {
        ...requestContext,
        statusCode,
        duration: `${duration}ms`,
      };

      if (logResponseHeaders) {
        const headers: Record<string, string | number | string[] | undefined> = {};
        res.getHeaderNames().forEach(name => {
          headers[name] = res.getHeader(name);
        });
        responseContext.responseHeaders = headers;
      }

      if (logResponseBody && responseInterceptor) {
        const body = responseInterceptor.getBody();
        if (body) {
          const truncatedBody = body.length > maxBodyLength
            ? `${body.substring(0, maxBodyLength)}... [truncated]`
            : body;

          try {
            const parsed = JSON.parse(truncatedBody);
            responseContext.responseBody = sanitize(parsed);
          } catch {
            responseContext.responseBody = truncatedBody;
          }
        }
      }

      const message = `HTTP ${req.method} ${req.path} ${statusCode} - ${duration}ms`;

      if (statusCode >= 500) {
        logger.error(message, undefined, responseContext);
      } else if (statusCode >= 400) {
        logger.warn(message, responseContext);
      } else {
        logger.info(message, responseContext);
      }
    });

    next();
  };
}
