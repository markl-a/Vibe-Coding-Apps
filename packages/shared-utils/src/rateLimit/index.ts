/**
 * API 限流中間件
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;      // 時間窗口（毫秒）
  max: number;           // 最大請求數
  message?: string;      // 超限消息
  keyGenerator?: (req: Request) => string;  // 生成限流key
  skip?: (req: Request) => boolean;         // 跳過條件
  onLimitReached?: (req: Request, res: Response) => void;  // 超限回調
}

interface RateLimitStore {
  hits: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

// 清理過期記錄
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetTime < now) {
      store.delete(key);
    }
  }
}, 60000);

/**
 * 創建限流中間件
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.ip || 'unknown',
    skip,
    onLimitReached
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // 檢查是否跳過
    if (skip && skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let record = store.get(key);

    // 初始化或重置
    if (!record || record.resetTime < now) {
      record = { hits: 0, resetTime: now + windowMs };
      store.set(key, record);
    }

    record.hits++;

    // 設置響應頭
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.hits));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    // 檢查是否超限
    if (record.hits > max) {
      if (onLimitReached) {
        onLimitReached(req, res);
      }

      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));

      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        }
      });
    }

    next();
  };
}

/**
 * 預設限流配置
 */
export const rateLimitPresets = {
  // 標準 API 限流
  standard: () => rateLimit({
    windowMs: 60 * 1000,  // 1 分鐘
    max: 60               // 60 次請求
  }),

  // 嚴格限流（登入等敏感操作）
  strict: () => rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 分鐘
    max: 5,                     // 5 次嘗試
    message: 'Too many attempts, please try again after 15 minutes.'
  }),

  // 寬鬆限流（公開 API）
  relaxed: () => rateLimit({
    windowMs: 60 * 1000,  // 1 分鐘
    max: 200              // 200 次請求
  }),

  // 認證端點限流
  auth: () => rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts, please try again later.',
    keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || 'unknown'}`
  })
};
