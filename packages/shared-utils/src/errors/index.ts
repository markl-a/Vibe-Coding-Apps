/**
 * 從 unknown 類型的錯誤中安全地提取錯誤訊息
 * 用於 catch 塊中處理 unknown 類型的錯誤
 *
 * @param error - 捕獲的錯誤（unknown 類型）
 * @param fallback - 預設錯誤訊息
 * @returns 錯誤訊息字串
 *
 * @example
 * try {
 *   await someAsyncOperation();
 * } catch (error: unknown) {
 *   res.status(400).json({ error: getErrorMessage(error) });
 * }
 */
export function getErrorMessage(error: unknown, fallback = '發生未知錯誤'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}

/**
 * 從 unknown 類型的錯誤中提取完整的錯誤信息
 *
 * @param error - 捕獲的錯誤（unknown 類型）
 * @returns 包含訊息、名稱和堆棧的錯誤信息對象
 */
export function getErrorInfo(error: unknown): {
  message: string;
  name: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
  return {
    message: getErrorMessage(error),
    name: 'UnknownError',
  };
}

/**
 * 統一的應用錯誤基類
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    if (details !== undefined) {
      this.details = details;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

// Express-compatible types (without requiring express dependency)
interface ExpressRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string | string[] | undefined>;
}

interface ExpressResponse {
  status(code: number): this;
  json(body: unknown): void;
}

type NextFunction = (err?: unknown) => void;

type AsyncRequestHandler = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
) => Promise<void> | void;

/**
 * Express 錯誤處理中間件
 */
export function errorHandler(
  err: Error,
  _req: ExpressRequest,
  res: ExpressResponse,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV === 'development';

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        timestamp: err.timestamp,
        ...(err.details && { details: err.details }),
        ...(isDev && { stack: err.stack }),
      },
    });
    return;
  }

  // 未知錯誤 - 使用結構化日誌記錄
  const errorLog = {
    type: 'unhandled_error',
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  };
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(errorLog));

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      ...(isDev && { stack: err.stack }),
    },
  });
}

/**
 * 異步處理包裝器
 */
export function asyncHandler(fn: AsyncRequestHandler): AsyncRequestHandler {
  return (req: ExpressRequest, res: ExpressResponse, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
