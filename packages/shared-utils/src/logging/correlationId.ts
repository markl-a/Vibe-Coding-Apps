/**
 * 請求追蹤ID中間件
 * 為每個請求生成唯一的追蹤ID，用於追蹤整個請求生命週期
 */

import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

/**
 * 生成唯一的關聯ID
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${randomBytes(8).toString('hex')}`;
}

/**
 * 擴展Express Request類型以包含關聯ID
 */
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export interface CorrelationIdOptions {
  /**
   * HTTP頭名稱，用於讀取和設置關聯ID
   * @default 'X-Correlation-ID'
   */
  headerName?: string;

  /**
   * 是否在響應頭中返回關聯ID
   * @default true
   */
  includeInResponse?: boolean;

  /**
   * 自定義ID生成函數
   */
  generator?: () => string;
}

/**
 * 關聯ID中間件
 * 從請求頭讀取關聯ID，如果不存在則生成新的
 *
 * @example
 * ```typescript
 * import { correlationId } from '@vibe/shared-utils';
 *
 * app.use(correlationId());
 * ```
 */
export function correlationId(options: CorrelationIdOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const {
    headerName = 'X-Correlation-ID',
    includeInResponse = true,
    generator = generateCorrelationId,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // 從請求頭獲取關聯ID，或生成新的
    const id = (req.headers[headerName.toLowerCase()] as string) || generator();

    // 將關聯ID附加到請求對象
    req.correlationId = id;

    // 在響應頭中設置關聯ID
    if (includeInResponse) {
      res.setHeader(headerName, id);
    }

    next();
  };
}

/**
 * 從請求中獲取關聯ID
 */
export function getCorrelationId(req: Request): string | undefined {
  return req.correlationId;
}
