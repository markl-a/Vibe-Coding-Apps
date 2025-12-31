/**
 * Monitoring Setup Example using Prometheus and Grafana
 * Demonstrates comprehensive application monitoring and observability
 */

import express, { Request, Response, NextFunction } from 'express';
import {
  Counter,
  Gauge,
  Histogram,
  formatMetrics,
  logger,
  Tracer,
} from '../monitoring-observability/simple-metrics/src/index.js';

// ===== Application Metrics Setup =====

/**
 * HTTP request counter - tracks total number of requests
 */
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

/**
 * HTTP request duration histogram - tracks request latency
 */
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

/**
 * Active connections gauge - tracks current active connections
 */
const activeConnections = new Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
});

/**
 * Database connection pool metrics
 */
const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
});

const dbConnectionsIdle = new Gauge({
  name: 'db_connections_idle',
  help: 'Number of idle database connections',
});

const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

/**
 * Cache metrics
 */
const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
});

const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
});

/**
 * Business metrics
 */
const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
});

const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
});

const jobsProcessed = new Counter({
  name: 'jobs_processed_total',
  help: 'Total number of background jobs processed',
  labelNames: ['job_type', 'status'],
});

// ===== Express Middleware for Request Tracking =====

/**
 * Middleware to track HTTP requests with metrics and tracing
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Start timer for request duration
  const startTime = Date.now();

  // Increment active connections
  activeConnections.inc();

  // Create tracer for distributed tracing
  const tracer = new Tracer('http_request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Attach tracer to request for use in handlers
  (req as any).tracer = tracer;

  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  // Hook into response finish event
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;
    const status = res.statusCode.toString();

    // Record metrics
    httpRequestsTotal.inc({ method: req.method, route, status });
    httpRequestDuration.observe({ method: req.method, route, status }, duration);

    // Decrement active connections
    activeConnections.dec();

    // End trace
    tracer.end({ status: res.statusCode });

    // Log request completion
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration.toFixed(3)}s`,
    });
  });

  next();
}

// ===== Database Query Monitoring =====

/**
 * Wrapper for database queries with monitoring
 */
export async function monitoredQuery<T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const tracer = new Tracer('db_query', { operation, table });
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = (Date.now() - startTime) / 1000;

    dbQueryDuration.observe({ operation, table }, duration);

    tracer.end({ success: true });

    logger.debug('Database query completed', {
      operation,
      table,
      duration: `${duration.toFixed(3)}s`,
    });

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    tracer.end({ success: false, error: (error as Error).message });

    logger.error('Database query failed', {
      operation,
      table,
      duration: `${duration.toFixed(3)}s`,
      error: (error as Error).message,
    });

    throw error;
  }
}

/**
 * Example: Monitor database connection pool
 */
export function monitorConnectionPool(pool: any): void {
  setInterval(() => {
    dbConnectionsActive.set(pool.totalCount - pool.idleCount);
    dbConnectionsIdle.set(pool.idleCount);
  }, 5000); // Update every 5 seconds
}

// ===== Cache Monitoring =====

/**
 * Wrapper for cache operations with monitoring
 */
export class MonitoredCache {
  constructor(private cache: any, private cacheType: string) {}

  async get(key: string): Promise<any> {
    const value = await this.cache.get(key);

    if (value !== null && value !== undefined) {
      cacheHits.inc({ cache_type: this.cacheType });
      logger.debug('Cache hit', { cache_type: this.cacheType, key });
    } else {
      cacheMisses.inc({ cache_type: this.cacheType });
      logger.debug('Cache miss', { cache_type: this.cacheType, key });
    }

    return value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl);
    logger.debug('Cache set', { cache_type: this.cacheType, key });
  }
}

// ===== Business Metrics =====

/**
 * Track user registration
 */
export function trackUserRegistration(userId: string, metadata?: Record<string, any>): void {
  userRegistrations.inc();

  logger.info('User registered', { userId, ...metadata });
}

/**
 * Update active users count
 */
export function updateActiveUsers(count: number): void {
  activeUsers.set(count);
}

/**
 * Track background job completion
 */
export function trackJobCompletion(jobType: string, status: 'success' | 'failure'): void {
  jobsProcessed.inc({ job_type: jobType, status });

  logger.info('Job completed', { job_type: jobType, status });
}

// ===== Express App Setup with Monitoring =====

/**
 * Create Express app with monitoring enabled
 */
export function createMonitoredApp(): express.Application {
  const app = express();

  // Apply metrics middleware to all routes
  app.use(metricsMiddleware);

  // ===== Health Check Endpoints =====

  /**
   * Liveness probe - checks if app is running
   */
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Readiness probe - checks if app is ready to serve traffic
   */
  app.get('/ready', async (req: Request, res: Response) => {
    try {
      // Check database connection
      // await checkDatabaseConnection();

      // Check Redis connection
      // await checkRedisConnection();

      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Metrics endpoint for Prometheus scraping
   */
  app.get('/metrics', (req: Request, res: Response) => {
    res.set('Content-Type', 'text/plain');
    res.send(formatMetrics());
  });

  // ===== Example Business Routes =====

  /**
   * User registration endpoint with monitoring
   */
  app.post('/api/users/register', async (req: Request, res: Response) => {
    const tracer = (req as any).tracer as Tracer;
    const childTracer = new Tracer('user_registration', {}, tracer);

    try {
      // Simulate user creation
      const userId = 'user-' + Date.now();

      // Track the registration
      trackUserRegistration(userId, { source: 'web' });

      childTracer.end({ success: true, userId });

      res.status(201).json({
        success: true,
        userId,
      });
    } catch (error) {
      childTracer.end({ success: false, error: (error as Error).message });

      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  /**
   * Data query endpoint with caching
   */
  app.get('/api/data/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const tracer = (req as any).tracer as Tracer;

    try {
      // Check cache first
      const cache = new MonitoredCache(getCacheInstance(), 'redis');
      let data = await cache.get(`data:${id}`);

      if (!data) {
        // Query database if not in cache
        data = await monitoredQuery('SELECT', 'data', async () => {
          // Simulate database query
          return { id, value: 'Sample data' };
        });

        // Store in cache for future requests
        await cache.set(`data:${id}`, data, 300); // 5 minutes TTL
      }

      res.status(200).json(data);
    } catch (error) {
      logger.error('Failed to fetch data', { id, error: (error as Error).message });

      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  return app;
}

// ===== Background Monitoring =====

/**
 * Start background monitoring tasks
 */
export function startBackgroundMonitoring(): void {
  // Update active users every minute
  setInterval(async () => {
    try {
      // Query active users from database or session store
      const count = await getActiveUsersCount();
      updateActiveUsers(count);
    } catch (error) {
      logger.error('Failed to update active users metric', {
        error: (error as Error).message,
      });
    }
  }, 60000); // 1 minute

  logger.info('Background monitoring started');
}

// ===== Helper Functions =====

/**
 * Mock function to get cache instance
 */
function getCacheInstance(): any {
  // In real implementation, return Redis client or other cache
  return {
    get: async (key: string) => null,
    set: async (key: string, value: any, ttl?: number) => {},
  };
}

/**
 * Mock function to get active users count
 */
async function getActiveUsersCount(): Promise<number> {
  // In real implementation, query from database or session store
  return Math.floor(Math.random() * 1000);
}

// ===== Example Usage =====

if (require.main === module) {
  const app = createMonitoredApp();
  const PORT = process.env.PORT || 4000;

  // Start background monitoring
  startBackgroundMonitoring();

  app.listen(PORT, () => {
    logger.info(`Server started with monitoring enabled`, {
      port: PORT,
      metrics_endpoint: `http://localhost:${PORT}/metrics`,
      health_endpoint: `http://localhost:${PORT}/health`,
    });
  });
}

/**
 * Prometheus Configuration Example (prometheus.yml):
 *
 * global:
 *   scrape_interval: 15s
 *   evaluation_interval: 15s
 *
 * scrape_configs:
 *   - job_name: 'vibe-api'
 *     static_configs:
 *       - targets: ['api-service:4000']
 *     metrics_path: '/metrics'
 *     scrape_interval: 10s
 *
 *
 * Grafana Dashboard Queries:
 *
 * 1. Request Rate:
 *    rate(http_requests_total[5m])
 *
 * 2. Error Rate:
 *    rate(http_requests_total{status=~"5.."}[5m])
 *
 * 3. P95 Latency:
 *    histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
 *
 * 4. Cache Hit Rate:
 *    rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
 */
