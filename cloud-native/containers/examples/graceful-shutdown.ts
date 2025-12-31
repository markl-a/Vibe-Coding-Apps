/**
 * Graceful Shutdown Patterns for Containers
 *
 * Comprehensive examples of graceful shutdown handling for containerized applications,
 * ensuring proper cleanup, request draining, and signal handling for zero-downtime deployments.
 */

import http from 'http';
import express, { Express, Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';

// ============================================================================
// 1. Graceful Shutdown Manager
// ============================================================================

export class GracefulShutdownManager extends EventEmitter {
  private isShuttingDown = false;
  private shutdownTimeout: number;
  private shutdownHandlers: Array<() => Promise<void>> = [];
  private signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  constructor(timeout: number = 30000) {
    super();
    this.shutdownTimeout = timeout;
  }

  /**
   * Register a cleanup handler to run during shutdown
   */
  onShutdown(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  /**
   * Initialize signal handlers
   */
  init(): void {
    this.signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n${signal} received, starting graceful shutdown...`);
        await this.shutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught Exception:', error);
      await this.shutdown('uncaughtException');
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      await this.shutdown('unhandledRejection');
      process.exit(1);
    });
  }

  /**
   * Execute graceful shutdown
   */
  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    this.emit('shutdown:start', signal);

    const shutdownPromise = this.executeShutdownHandlers();
    const timeoutPromise = this.createTimeoutPromise();

    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
      console.log('Graceful shutdown completed successfully');
      this.emit('shutdown:complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      this.emit('shutdown:error', error);
      process.exit(1);
    }
  }

  /**
   * Execute all registered shutdown handlers
   */
  private async executeShutdownHandlers(): Promise<void> {
    console.log(`Executing ${this.shutdownHandlers.length} shutdown handlers...`);

    for (const handler of this.shutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        console.error('Shutdown handler error:', error);
      }
    }
  }

  /**
   * Create timeout promise to force shutdown
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Forced shutdown after ${this.shutdownTimeout}ms timeout`));
      }, this.shutdownTimeout);
    });
  }

  /**
   * Check if shutdown is in progress
   */
  isShutdown(): boolean {
    return this.isShuttingDown;
  }
}

// ============================================================================
// 2. HTTP Server with Graceful Shutdown
// ============================================================================

export class GracefulHttpServer {
  private server: http.Server | null = null;
  private connections = new Set<any>();
  private isShuttingDown = false;

  constructor(private app: Express) {}

  /**
   * Start server with connection tracking
   */
  listen(port: number, host: string = '0.0.0.0'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, host, () => {
        console.log(`Server listening on ${host}:${port}`);
        this.setupConnectionTracking();
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Track all active connections
   */
  private setupConnectionTracking(): void {
    if (!this.server) return;

    this.server.on('connection', (connection) => {
      this.connections.add(connection);

      connection.on('close', () => {
        this.connections.delete(connection);
      });
    });
  }

  /**
   * Gracefully shutdown the server
   */
  async shutdown(): Promise<void> {
    if (!this.server || this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log('Closing HTTP server...');

    return new Promise((resolve, reject) => {
      // Stop accepting new connections
      this.server!.close((error) => {
        if (error) {
          console.error('Error closing server:', error);
          reject(error);
        } else {
          console.log('HTTP server closed');
          resolve();
        }
      });

      // Force close idle connections after grace period
      setTimeout(() => {
        console.log(`Forcefully closing ${this.connections.size} remaining connections`);
        this.connections.forEach((connection) => {
          connection.destroy();
        });
      }, 10000); // 10 second grace period
    });
  }
}

// ============================================================================
// 3. Express Middleware for Request Draining
// ============================================================================

export function createShutdownMiddleware(
  shutdownManager: GracefulShutdownManager
): express.RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (shutdownManager.isShutdown()) {
      res.set('Connection', 'close');
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Server is shutting down'
      });
    } else {
      next();
    }
  };
}

// ============================================================================
// 4. Database Connection Manager with Graceful Shutdown
// ============================================================================

export class DatabaseConnectionManager {
  private pool: any; // Your database pool
  private isConnected = false;

  async connect(config: any): Promise<void> {
    console.log('Connecting to database...');
    // Mock connection
    this.pool = { connected: true };
    this.isConnected = true;
    console.log('Database connected');
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      console.log('Database already disconnected');
      return;
    }

    console.log('Closing database connections...');

    try {
      // Wait for active queries to complete
      await this.waitForActiveQueries(5000);

      // Close the pool
      // await this.pool.end();

      this.isConnected = false;
      console.log('Database disconnected gracefully');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  private async waitForActiveQueries(timeout: number): Promise<void> {
    const start = Date.now();

    while (this.hasActiveQueries() && Date.now() - start < timeout) {
      console.log('Waiting for active queries to complete...');
      await this.sleep(100);
    }

    if (this.hasActiveQueries()) {
      console.warn('Timeout waiting for queries, forcing disconnect');
    }
  }

  private hasActiveQueries(): boolean {
    // Mock implementation
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// 5. Message Queue Consumer with Graceful Shutdown
// ============================================================================

export class MessageQueueConsumer {
  private isConsuming = false;
  private processingMessages = new Set<string>();

  async start(): Promise<void> {
    console.log('Starting message queue consumer...');
    this.isConsuming = true;
    console.log('Consumer started');
  }

  async stop(): Promise<void> {
    if (!this.isConsuming) {
      console.log('Consumer already stopped');
      return;
    }

    console.log('Stopping message queue consumer...');

    // Stop accepting new messages
    this.isConsuming = false;

    // Wait for in-flight messages to complete
    await this.waitForProcessingMessages(10000);

    console.log('Consumer stopped gracefully');
  }

  private async waitForProcessingMessages(timeout: number): Promise<void> {
    const start = Date.now();

    while (this.processingMessages.size > 0 && Date.now() - start < timeout) {
      console.log(`Waiting for ${this.processingMessages.size} messages to complete...`);
      await this.sleep(100);
    }

    if (this.processingMessages.size > 0) {
      console.warn(
        `Timeout: ${this.processingMessages.size} messages still processing`
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// 6. Cache Manager with Graceful Shutdown
// ============================================================================

export class CacheManager {
  private client: any; // Redis client
  private isConnected = false;

  async connect(): Promise<void> {
    console.log('Connecting to cache...');
    this.client = { connected: true };
    this.isConnected = true;
    console.log('Cache connected');
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      console.log('Cache already disconnected');
      return;
    }

    console.log('Disconnecting from cache...');

    try {
      // Flush pending operations
      // await this.client.quit();

      this.isConnected = false;
      console.log('Cache disconnected gracefully');
    } catch (error) {
      console.error('Error disconnecting from cache:', error);
      throw error;
    }
  }
}

// ============================================================================
// 7. Background Job Processor with Graceful Shutdown
// ============================================================================

export class BackgroundJobProcessor {
  private isRunning = false;
  private activeJobs = new Map<string, Promise<void>>();
  private jobInterval: NodeJS.Timeout | null = null;

  start(): void {
    console.log('Starting background job processor...');
    this.isRunning = true;

    this.jobInterval = setInterval(() => {
      if (this.isRunning) {
        this.processJobs();
      }
    }, 5000);

    console.log('Background job processor started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Job processor already stopped');
      return;
    }

    console.log('Stopping background job processor...');

    // Stop scheduling new jobs
    this.isRunning = false;

    if (this.jobInterval) {
      clearInterval(this.jobInterval);
      this.jobInterval = null;
    }

    // Wait for active jobs to complete
    await this.waitForActiveJobs(15000);

    console.log('Background job processor stopped');
  }

  private processJobs(): void {
    const jobId = `job-${Date.now()}`;
    const jobPromise = this.mockJobExecution();

    this.activeJobs.set(jobId, jobPromise);

    jobPromise.finally(() => {
      this.activeJobs.delete(jobId);
    });
  }

  private async mockJobExecution(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async waitForActiveJobs(timeout: number): Promise<void> {
    const start = Date.now();

    while (this.activeJobs.size > 0 && Date.now() - start < timeout) {
      console.log(`Waiting for ${this.activeJobs.size} jobs to complete...`);
      await Promise.race([
        Promise.all(Array.from(this.activeJobs.values())),
        new Promise(resolve => setTimeout(resolve, 100))
      ]);
    }

    if (this.activeJobs.size > 0) {
      console.warn(`Timeout: ${this.activeJobs.size} jobs still running`);
    }
  }
}

// ============================================================================
// 8. Complete Application Example
// ============================================================================

export class GracefulApplication {
  private shutdownManager: GracefulShutdownManager;
  private httpServer: GracefulHttpServer;
  private database: DatabaseConnectionManager;
  private cache: CacheManager;
  private messageQueue: MessageQueueConsumer;
  private jobProcessor: BackgroundJobProcessor;
  private app: Express;

  constructor() {
    this.app = express();
    this.shutdownManager = new GracefulShutdownManager(30000);
    this.httpServer = new GracefulHttpServer(this.app);
    this.database = new DatabaseConnectionManager();
    this.cache = new CacheManager();
    this.messageQueue = new MessageQueueConsumer();
    this.jobProcessor = new BackgroundJobProcessor();

    this.setupMiddleware();
    this.setupRoutes();
    this.registerShutdownHandlers();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(createShutdownMiddleware(this.shutdownManager));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/api/data', async (req, res) => {
      try {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1000));
        res.json({ data: 'Success' });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  private registerShutdownHandlers(): void {
    // Register shutdown handlers in reverse order of dependency
    this.shutdownManager.onShutdown(async () => {
      console.log('1. Stopping HTTP server...');
      await this.httpServer.shutdown();
    });

    this.shutdownManager.onShutdown(async () => {
      console.log('2. Stopping background job processor...');
      await this.jobProcessor.stop();
    });

    this.shutdownManager.onShutdown(async () => {
      console.log('3. Stopping message queue consumer...');
      await this.messageQueue.stop();
    });

    this.shutdownManager.onShutdown(async () => {
      console.log('4. Disconnecting from cache...');
      await this.cache.disconnect();
    });

    this.shutdownManager.onShutdown(async () => {
      console.log('5. Disconnecting from database...');
      await this.database.disconnect();
    });

    this.shutdownManager.onShutdown(async () => {
      console.log('6. Performing final cleanup...');
      await this.finalCleanup();
    });

    // Listen for shutdown events
    this.shutdownManager.on('shutdown:start', (signal) => {
      console.log(`Shutdown initiated by ${signal}`);
    });

    this.shutdownManager.on('shutdown:complete', () => {
      console.log('All resources cleaned up successfully');
    });

    this.shutdownManager.on('shutdown:error', (error) => {
      console.error('Shutdown error:', error);
    });
  }

  async start(): Promise<void> {
    try {
      console.log('Starting application...');

      // Initialize dependencies
      await this.database.connect({});
      await this.cache.connect();
      await this.messageQueue.start();
      this.jobProcessor.start();

      // Start HTTP server
      await this.httpServer.listen(3000);

      // Initialize graceful shutdown
      this.shutdownManager.init();

      console.log('Application started successfully');
    } catch (error) {
      console.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  private async finalCleanup(): Promise<void> {
    // Perform any final cleanup tasks
    console.log('Performing final cleanup tasks...');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// ============================================================================
// 9. Kubernetes PreStop Hook Example
// ============================================================================

/**
 * Kubernetes Deployment with Graceful Shutdown:
 * ----------------------------------------------
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
 *         # Lifecycle hooks
 *         lifecycle:
 *           # PreStop hook - called before SIGTERM
 *           preStop:
 *             exec:
 *               command: ["/bin/sh", "-c", "sleep 5"]
 *
 *         # Graceful termination period
 *         terminationGracePeriodSeconds: 30
 *
 *         # Readiness probe
 *         readinessProbe:
 *           httpGet:
 *             path: /health
 *             port: 3000
 *           initialDelaySeconds: 5
 *           periodSeconds: 5
 *
 * Shutdown sequence:
 * 1. Pod marked for termination
 * 2. Pod removed from service endpoints (stops receiving new traffic)
 * 3. preStop hook executes (if defined)
 * 4. SIGTERM sent to container
 * 5. Container handles graceful shutdown
 * 6. After terminationGracePeriodSeconds, SIGKILL sent if still running
 */

// ============================================================================
// 10. Usage Example
// ============================================================================

if (require.main === module) {
  const app = new GracefulApplication();

  app.start().catch((error) => {
    console.error('Application failed to start:', error);
    process.exit(1);
  });
}

export default GracefulShutdownManager;
