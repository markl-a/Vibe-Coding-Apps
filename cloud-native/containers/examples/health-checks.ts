/**
 * Container Health Checks
 *
 * Comprehensive health check implementations for containerized applications
 * including liveness, readiness, and startup probes compatible with Docker,
 * Kubernetes, and container orchestration platforms.
 */

import http from 'http';
import https from 'https';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// ============================================================================
// 1. Basic Health Check Interface
// ============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: Record<string, CheckResult>;
  version?: string;
  uptime?: number;
}

export interface CheckResult {
  status: 'up' | 'down' | 'degraded';
  message?: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// 2. Health Check Manager
// ============================================================================

export class HealthCheckManager {
  private checks: Map<string, HealthCheck> = new Map();
  private startTime: number = Date.now();

  /**
   * Register a health check
   */
  register(name: string, check: HealthCheck): void {
    this.checks.set(name, check);
  }

  /**
   * Perform all health checks
   */
  async check(): Promise<HealthCheckResult> {
    const results: Record<string, CheckResult> = {};
    const promises: Promise<void>[] = [];

    for (const [name, check] of this.checks) {
      promises.push(
        (async () => {
          try {
            const start = Date.now();
            const result = await check.check();
            results[name] = {
              ...result,
              responseTime: Date.now() - start
            };
          } catch (error) {
            results[name] = {
              status: 'down',
              message: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })()
      );
    }

    await Promise.all(promises);

    // Determine overall status
    const statuses = Object.values(results).map(r => r.status);
    const overallStatus = statuses.includes('down')
      ? 'unhealthy'
      : statuses.includes('degraded')
      ? 'degraded'
      : 'healthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results,
      version: process.env.npm_package_version,
      uptime: (Date.now() - this.startTime) / 1000
    };
  }

  /**
   * Liveness probe - checks if application is alive
   */
  async liveness(): Promise<boolean> {
    // Simple check - if we can respond, we're alive
    return true;
  }

  /**
   * Readiness probe - checks if application is ready to serve traffic
   */
  async readiness(): Promise<boolean> {
    const result = await this.check();
    // Ready if all critical checks are up
    return result.status !== 'unhealthy';
  }

  /**
   * Startup probe - checks if application has started
   */
  async startup(): Promise<boolean> {
    // Check if critical dependencies are initialized
    const criticalChecks = ['database', 'cache'];
    const result = await this.check();

    for (const checkName of criticalChecks) {
      if (result.checks[checkName]?.status === 'down') {
        return false;
      }
    }

    return true;
  }
}

// ============================================================================
// 3. Health Check Interface
// ============================================================================

export interface HealthCheck {
  check(): Promise<CheckResult>;
}

// ============================================================================
// 4. Database Health Check
// ============================================================================

export class DatabaseHealthCheck implements HealthCheck {
  constructor(
    private connection: any, // Your DB connection
    private timeout: number = 5000
  ) {}

  async check(): Promise<CheckResult> {
    try {
      const start = Date.now();

      // Execute simple query with timeout
      const result = await Promise.race([
        this.executeQuery(),
        this.timeoutPromise()
      ]);

      const responseTime = Date.now() - start;

      return {
        status: 'up',
        message: 'Database connection healthy',
        responseTime,
        metadata: {
          connected: true,
          type: 'postgresql' // or mysql, mongodb, etc.
        }
      };
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Database check failed'
      };
    }
  }

  private async executeQuery(): Promise<void> {
    // Mock implementation - replace with actual query
    // await this.connection.query('SELECT 1');
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database check timeout')), this.timeout);
    });
  }
}

// ============================================================================
// 5. Redis/Cache Health Check
// ============================================================================

export class CacheHealthCheck implements HealthCheck {
  constructor(
    private client: any, // Redis client
    private timeout: number = 3000
  ) {}

  async check(): Promise<CheckResult> {
    try {
      const start = Date.now();

      await Promise.race([
        this.pingCache(),
        this.timeoutPromise()
      ]);

      const responseTime = Date.now() - start;

      return {
        status: 'up',
        message: 'Cache connection healthy',
        responseTime,
        metadata: {
          connected: true,
          type: 'redis'
        }
      };
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Cache check failed'
      };
    }
  }

  private async pingCache(): Promise<void> {
    // Mock implementation
    // await this.client.ping();
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cache check timeout')), this.timeout);
    });
  }
}

// ============================================================================
// 6. HTTP Endpoint Health Check
// ============================================================================

export class HttpHealthCheck implements HealthCheck {
  constructor(
    private url: string,
    private options: {
      timeout?: number;
      expectedStatus?: number;
      method?: string;
    } = {}
  ) {}

  async check(): Promise<CheckResult> {
    const {
      timeout = 5000,
      expectedStatus = 200,
      method = 'GET'
    } = this.options;

    try {
      const start = Date.now();
      const statusCode = await this.makeRequest(method, timeout);
      const responseTime = Date.now() - start;

      if (statusCode === expectedStatus) {
        return {
          status: 'up',
          message: `HTTP endpoint responding with ${statusCode}`,
          responseTime,
          metadata: { statusCode }
        };
      } else {
        return {
          status: 'degraded',
          message: `Unexpected status code: ${statusCode}`,
          responseTime,
          metadata: { statusCode }
        };
      }
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'HTTP check failed'
      };
    }
  }

  private makeRequest(method: string, timeout: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.url);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method,
          timeout
        },
        (res) => {
          res.resume(); // Consume response
          resolve(res.statusCode || 0);
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }
}

// ============================================================================
// 7. Disk Space Health Check
// ============================================================================

export class DiskSpaceHealthCheck implements HealthCheck {
  constructor(
    private path: string = '/',
    private thresholds: {
      warning: number; // percentage
      critical: number; // percentage
    } = { warning: 80, critical: 90 }
  ) {}

  async check(): Promise<CheckResult> {
    try {
      const usage = await this.getDiskUsage();
      const usedPercentage = (usage.used / usage.total) * 100;

      if (usedPercentage >= this.thresholds.critical) {
        return {
          status: 'down',
          message: `Critical: Disk usage at ${usedPercentage.toFixed(2)}%`,
          metadata: { ...usage, usedPercentage }
        };
      } else if (usedPercentage >= this.thresholds.warning) {
        return {
          status: 'degraded',
          message: `Warning: Disk usage at ${usedPercentage.toFixed(2)}%`,
          metadata: { ...usage, usedPercentage }
        };
      } else {
        return {
          status: 'up',
          message: `Disk usage at ${usedPercentage.toFixed(2)}%`,
          metadata: { ...usage, usedPercentage }
        };
      }
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Disk check failed'
      };
    }
  }

  private async getDiskUsage(): Promise<{
    total: number;
    used: number;
    available: number;
  }> {
    try {
      const { stdout } = await execAsync(`df -k ${this.path} | tail -1`);
      const parts = stdout.trim().split(/\s+/);

      return {
        total: parseInt(parts[1]) * 1024, // Convert to bytes
        used: parseInt(parts[2]) * 1024,
        available: parseInt(parts[3]) * 1024
      };
    } catch {
      // Fallback values if df command fails
      return {
        total: 0,
        used: 0,
        available: 0
      };
    }
  }
}

// ============================================================================
// 8. Memory Health Check
// ============================================================================

export class MemoryHealthCheck implements HealthCheck {
  constructor(
    private thresholds: {
      warning: number; // percentage
      critical: number; // percentage
    } = { warning: 80, critical: 90 }
  ) {}

  async check(): Promise<CheckResult> {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const usedPercentage = (memUsage.heapUsed / totalMemory) * 100;

    const metadata = {
      heapUsed: this.formatBytes(memUsage.heapUsed),
      heapTotal: this.formatBytes(memUsage.heapTotal),
      external: this.formatBytes(memUsage.external),
      rss: this.formatBytes(memUsage.rss),
      usedPercentage: usedPercentage.toFixed(2)
    };

    if (usedPercentage >= this.thresholds.critical) {
      return {
        status: 'down',
        message: `Critical: Memory usage at ${usedPercentage.toFixed(2)}%`,
        metadata
      };
    } else if (usedPercentage >= this.thresholds.warning) {
      return {
        status: 'degraded',
        message: `Warning: Memory usage at ${usedPercentage.toFixed(2)}%`,
        metadata
      };
    } else {
      return {
        status: 'up',
        message: `Memory usage at ${usedPercentage.toFixed(2)}%`,
        metadata
      };
    }
  }

  private formatBytes(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
}

// ============================================================================
// 9. Custom Dependency Health Check
// ============================================================================

export class CustomHealthCheck implements HealthCheck {
  constructor(
    private checkFn: () => Promise<boolean>,
    private name: string
  ) {}

  async check(): Promise<CheckResult> {
    try {
      const isHealthy = await this.checkFn();

      return {
        status: isHealthy ? 'up' : 'down',
        message: `${this.name} is ${isHealthy ? 'healthy' : 'unhealthy'}`
      };
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : `${this.name} check failed`
      };
    }
  }
}

// ============================================================================
// 10. Express.js Health Check Endpoints
// ============================================================================

import express, { Express, Request, Response } from 'express';

export function setupHealthEndpoints(
  app: Express,
  healthManager: HealthCheckManager
): void {
  // Liveness probe - simple check if app is running
  app.get('/healthz', async (req: Request, res: Response) => {
    try {
      const isAlive = await healthManager.liveness();

      if (isAlive) {
        res.status(200).json({ status: 'alive' });
      } else {
        res.status(503).json({ status: 'dead' });
      }
    } catch (error) {
      res.status(503).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Readiness probe - check if app is ready to serve traffic
  app.get('/readyz', async (req: Request, res: Response) => {
    try {
      const isReady = await healthManager.readiness();

      if (isReady) {
        res.status(200).json({ status: 'ready' });
      } else {
        res.status(503).json({ status: 'not ready' });
      }
    } catch (error) {
      res.status(503).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Startup probe - check if app has started
  app.get('/startupz', async (req: Request, res: Response) => {
    try {
      const hasStarted = await healthManager.startup();

      if (hasStarted) {
        res.status(200).json({ status: 'started' });
      } else {
        res.status(503).json({ status: 'not started' });
      }
    } catch (error) {
      res.status(503).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Detailed health check
  app.get('/health', async (req: Request, res: Response) => {
    try {
      const result = await healthManager.check();

      const statusCode = result.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json(result);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });
}

// ============================================================================
// 11. Usage Example
// ============================================================================

export function createHealthCheckExample(): HealthCheckManager {
  const healthManager = new HealthCheckManager();

  // Register various health checks
  healthManager.register('memory', new MemoryHealthCheck({
    warning: 80,
    critical: 90
  }));

  healthManager.register('disk', new DiskSpaceHealthCheck('/', {
    warning: 80,
    critical: 90
  }));

  // Mock database check
  healthManager.register('database', new CustomHealthCheck(
    async () => {
      // Replace with actual database check
      return true;
    },
    'Database'
  ));

  // Mock cache check
  healthManager.register('cache', new CustomHealthCheck(
    async () => {
      // Replace with actual cache check
      return true;
    },
    'Cache'
  ));

  // External API check
  healthManager.register('external-api', new HttpHealthCheck(
    'https://api.example.com/health',
    { timeout: 3000, expectedStatus: 200 }
  ));

  return healthManager;
}

/**
 * ============================================================================
 * Kubernetes Health Check Configuration Examples
 * ============================================================================
 *
 * deployment.yaml:
 * ----------------
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp
 * spec:
 *   replicas: 3
 *   template:
 *     spec:
 *       containers:
 *       - name: app
 *         image: myapp:latest
 *         ports:
 *         - containerPort: 3000
 *
 *         # Liveness probe - restart if fails
 *         livenessProbe:
 *           httpGet:
 *             path: /healthz
 *             port: 3000
 *           initialDelaySeconds: 30
 *           periodSeconds: 10
 *           timeoutSeconds: 5
 *           failureThreshold: 3
 *
 *         # Readiness probe - remove from service if fails
 *         readinessProbe:
 *           httpGet:
 *             path: /readyz
 *             port: 3000
 *           initialDelaySeconds: 5
 *           periodSeconds: 5
 *           timeoutSeconds: 3
 *           failureThreshold: 3
 *
 *         # Startup probe - for slow-starting apps
 *         startupProbe:
 *           httpGet:
 *             path: /startupz
 *             port: 3000
 *           initialDelaySeconds: 0
 *           periodSeconds: 10
 *           timeoutSeconds: 3
 *           failureThreshold: 30
 *
 *         resources:
 *           requests:
 *             memory: "256Mi"
 *             cpu: "250m"
 *           limits:
 *             memory: "512Mi"
 *             cpu: "500m"
 */

/**
 * ============================================================================
 * Docker Health Check Configuration
 * ============================================================================
 *
 * Dockerfile:
 * -----------
 * HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
 *   CMD node -e "require('http').get('http://localhost:3000/healthz', (r) => { \
 *     process.exit(r.statusCode === 200 ? 0 : 1); \
 *   }).on('error', () => process.exit(1));"
 *
 * docker-compose.yml:
 * -------------------
 * version: '3.8'
 * services:
 *   app:
 *     image: myapp:latest
 *     healthcheck:
 *       test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/healthz', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"]
 *       interval: 30s
 *       timeout: 3s
 *       retries: 3
 *       start_period: 5s
 */

export default HealthCheckManager;
