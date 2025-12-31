/**
 * 健康檢查模塊
 */

import { Request, Response, Router } from 'express';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version?: string;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    responseTime?: number;
  }[];
}

export type HealthChecker = () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string }>;

/**
 * 創建健康檢查路由
 */
export function createHealthRouter(options: {
  version?: string;
  checks?: Record<string, HealthChecker>;
} = {}): Router {
  const router = Router();
  const startTime = Date.now();

  // 簡單的 liveness 探針
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000)
    });
  });

  // 詳細的 readiness 探針
  router.get('/health/ready', async (_req: Request, res: Response) => {
    const checks: HealthCheckResult['checks'] = [];
    let overallStatus: HealthCheckResult['status'] = 'healthy';

    if (options.checks) {
      for (const [name, checker] of Object.entries(options.checks)) {
        const start = Date.now();
        try {
          const result = await checker();
          const checkResult: HealthCheckResult['checks'][number] = {
            name,
            status: result.status,
          };
          if (result.message !== undefined) {
            checkResult.message = result.message;
          }
          checkResult.responseTime = Date.now() - start;
          checks.push(checkResult);
          if (result.status === 'fail') overallStatus = 'unhealthy';
          else if (result.status === 'warn' && overallStatus === 'healthy') overallStatus = 'degraded';
        } catch (error: unknown) {
          checks.push({
            name,
            status: 'fail',
            message: error instanceof Error ? error.message : 'Unknown error',
            responseTime: Date.now() - start
          });
          overallStatus = 'unhealthy';
        }
      }
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks
    };

    if (options.version !== undefined) {
      result.version = options.version;
    }

    res.status(overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503).json(result);
  });

  return router;
}

/**
 * 常用健康檢查器
 */
export const healthCheckers = {
  // MongoDB 檢查
  mongodb: (mongoose: { connection: { readyState: number } }): HealthChecker => async () => {
    if (mongoose.connection.readyState === 1) {
      return { status: 'pass', message: 'MongoDB connected' };
    }
    return { status: 'fail', message: 'MongoDB disconnected' };
  },

  // Redis 檢查
  redis: (client: { ping: () => Promise<void> }): HealthChecker => async () => {
    try {
      await client.ping();
      return { status: 'pass', message: 'Redis connected' };
    } catch {
      return { status: 'fail', message: 'Redis disconnected' };
    }
  },

  // 內存檢查
  memory: (maxHeapMB: number = 512): HealthChecker => async () => {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    if (used > maxHeapMB) {
      return { status: 'warn', message: `High memory usage: ${used.toFixed(2)}MB` };
    }
    return { status: 'pass', message: `Memory: ${used.toFixed(2)}MB` };
  }
};
