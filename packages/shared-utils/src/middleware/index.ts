/**
 * 共享驗證中間件
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 資源所有權驗證中間件
 */
export function checkOwnership(resourceField: string = 'userId') {
  return async (req: Request & { user?: any; resource?: any }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resource = req.resource;
      if (!resource) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Resource not found' }
        });
        return;
      }

      const resourceOwner = resource[resourceField]?.toString();
      const userId = req.user?._id?.toString() || req.user?.id?.toString();

      if (resourceOwner !== userId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Not authorized to access this resource' }
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 請求體驗證中間件 (使用 Zod 或類似庫)
 */
export function validateBody<T>(schema: { parse: (data: unknown) => T }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.errors || error.message
        }
      });
    }
  };
}

/**
 * 查詢參數驗證中間件
 */
export function validateQuery<T>(schema: { parse: (data: unknown) => T }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query validation failed',
          details: error.errors || error.message
        }
      });
    }
  };
}

/**
 * 分頁參數解析中間件
 */
export function parsePagination(defaults: { page?: number; limit?: number; maxLimit?: number } = {}) {
  const { page: defaultPage = 1, limit: defaultLimit = 20, maxLimit = 100 } = defaults;

  return (req: Request & { pagination?: any }, _res: Response, next: NextFunction) => {
    const page = Math.max(1, parseInt(req.query.page as string) || defaultPage);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit as string) || defaultLimit));
    const skip = (page - 1) * limit;

    req.pagination = { page, limit, skip };
    next();
  };
}
