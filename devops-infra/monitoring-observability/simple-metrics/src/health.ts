import type { HealthCheck, HealthCheckResult, HealthStatus } from './types.js';

/**
 * Health Checks
 *
 * Provides health check functionality for:
 * - Readiness probes (can handle traffic?)
 * - Liveness probes (is the process alive?)
 * - Dependency checks (database, cache, etc.)
 */

const healthChecks: Map<string, HealthCheck> = new Map();

/**
 * Register a health check
 */
export function registerHealthCheck(name: string, check: () => Promise<HealthCheckResult>): void {
  healthChecks.set(name, { name, check });
}

/**
 * Run all health checks
 */
export async function runHealthChecks(): Promise<HealthStatus> {
  const checks: { [name: string]: HealthCheckResult } = {};
  let overallStatus: HealthStatus['status'] = 'healthy';

  const promises = Array.from(healthChecks.entries()).map(async ([name, healthCheck]) => {
    try {
      const result = await Promise.race([
        healthCheck.check(),
        new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        ),
      ]);
      checks[name] = result;

      if (result.status === 'unhealthy') {
        overallStatus = 'unhealthy';
      } else if (result.status === 'degraded' && overallStatus !== 'unhealthy') {
        overallStatus = 'degraded';
      }
    } catch (error) {
      checks[name] = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      overallStatus = 'unhealthy';
    }
  });

  await Promise.all(promises);

  return {
    status: overallStatus,
    checks,
    timestamp: new Date(),
  };
}

/**
 * Simple liveness check (is the process running?)
 */
export async function livenessCheck(): Promise<HealthCheckResult> {
  return {
    status: 'healthy',
    message: 'Process is running',
  };
}

/**
 * Readiness check (can handle requests?)
 */
export async function readinessCheck(): Promise<HealthStatus> {
  return runHealthChecks();
}

/**
 * Common health check factories
 */
export const healthCheckFactories = {
  /**
   * Memory usage check
   */
  memory(thresholdPercent = 90): () => Promise<HealthCheckResult> {
    return async () => {
      const used = process.memoryUsage();
      const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;

      if (heapUsedPercent > thresholdPercent) {
        return {
          status: 'unhealthy',
          message: `Memory usage too high: ${heapUsedPercent.toFixed(1)}%`,
          details: {
            heapUsed: used.heapUsed,
            heapTotal: used.heapTotal,
            percent: heapUsedPercent,
          },
        };
      }

      if (heapUsedPercent > thresholdPercent * 0.8) {
        return {
          status: 'degraded',
          message: `Memory usage elevated: ${heapUsedPercent.toFixed(1)}%`,
          details: {
            heapUsed: used.heapUsed,
            heapTotal: used.heapTotal,
            percent: heapUsedPercent,
          },
        };
      }

      return {
        status: 'healthy',
        message: `Memory usage: ${heapUsedPercent.toFixed(1)}%`,
        details: {
          heapUsed: used.heapUsed,
          heapTotal: used.heapTotal,
          percent: heapUsedPercent,
        },
      };
    };
  },

  /**
   * HTTP endpoint check
   */
  http(url: string, timeoutMs = 5000): () => Promise<HealthCheckResult> {
    return async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) {
          return {
            status: 'healthy',
            message: `HTTP ${response.status}`,
            details: { url, statusCode: response.status },
          };
        }

        return {
          status: 'unhealthy',
          message: `HTTP ${response.status}`,
          details: { url, statusCode: response.status },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Request failed',
          details: { url },
        };
      }
    };
  },

  /**
   * Custom check with async function
   */
  custom(
    checkFn: () => Promise<boolean>,
    healthyMessage = 'Check passed',
    unhealthyMessage = 'Check failed'
  ): () => Promise<HealthCheckResult> {
    return async () => {
      try {
        const result = await checkFn();
        return {
          status: result ? 'healthy' : 'unhealthy',
          message: result ? healthyMessage : unhealthyMessage,
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : unhealthyMessage,
        };
      }
    };
  },
};

/**
 * Clear all health checks (for testing)
 */
export function clearHealthChecks(): void {
  healthChecks.clear();
}
