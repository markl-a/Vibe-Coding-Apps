/**
 * Logging Utilities Examples
 *
 * Demonstrates comprehensive logging patterns and best practices including:
 * - Structured logging
 * - Log levels and filtering
 * - Multiple transports (console, file, remote)
 * - Log rotation and archiving
 * - Performance logging
 * - Error tracking
 * - Contextual logging
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { createWriteStream, WriteStream } from 'fs';

// ============================================================================
// Example 1: Basic Logger with Log Levels
// ============================================================================

enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private level: LogLevel;
  private context: Record<string, any> = {};

  constructor(level: LogLevel = LogLevel.INFO, context?: Record<string, any>) {
    this.level = level;
    if (context) {
      this.context = context;
    }
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Add context to all log messages
   */
  addContext(key: string, value: any): void {
    this.context[key] = value;
  }

  /**
   * Trace level logging
   */
  trace(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context);
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, { ...context, error });
  }

  /**
   * Fatal level logging
   */
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, { ...context, error });
  }

  /**
   * Core logging method
   */
  protected log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): void {
    if (level < this.level) {
      return; // Skip logs below minimum level
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    this.output(entry);
  }

  /**
   * Output log entry (can be overridden)
   */
  protected output(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();
    const contextStr = Object.keys(entry.context || {}).length
      ? ` ${JSON.stringify(entry.context)}`
      : '';

    console.log(`[${timestamp}] ${levelName}: ${entry.message}${contextStr}`);
  }
}

// ============================================================================
// Example 2: Colored Console Logger
// ============================================================================

class ColoredLogger extends Logger {
  private colors: Record<LogLevel, (text: string) => string> = {
    [LogLevel.TRACE]: chalk.gray,
    [LogLevel.DEBUG]: chalk.blue,
    [LogLevel.INFO]: chalk.green,
    [LogLevel.WARN]: chalk.yellow,
    [LogLevel.ERROR]: chalk.red,
    [LogLevel.FATAL]: chalk.bgRed.white,
  };

  protected output(entry: LogEntry): void {
    const levelName = LogLevel[entry.level].padEnd(5);
    const timestamp = chalk.gray(entry.timestamp.toISOString());
    const colorFn = this.colors[entry.level];
    const levelStr = colorFn(`[${levelName}]`);

    let output = `${timestamp} ${levelStr} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      if (entry.context.error) {
        const error = entry.context.error as Error;
        output += `\n${chalk.red(error.stack || error.message)}`;
        delete entry.context.error;
      }

      if (Object.keys(entry.context).length > 0) {
        output += `\n${chalk.gray(JSON.stringify(entry.context, null, 2))}`;
      }
    }

    console.log(output);
  }
}

// ============================================================================
// Example 3: File Logger with Rotation
// ============================================================================

interface FileLoggerOptions {
  directory: string;
  filename: string;
  maxSize?: number; // bytes
  maxFiles?: number;
  compress?: boolean;
}

class FileLogger extends Logger {
  private options: FileLoggerOptions;
  private currentStream: WriteStream | null = null;
  private currentSize: number = 0;
  private currentFile: string = '';

  constructor(level: LogLevel, options: FileLoggerOptions) {
    super(level);
    this.options = {
      maxSize: 10 * 1024 * 1024, // 10MB default
      maxFiles: 5,
      compress: false,
      ...options,
    };

    this.initializeStream();
  }

  /**
   * Initialize write stream
   */
  private async initializeStream(): Promise<void> {
    await fs.mkdir(this.options.directory, { recursive: true });

    this.currentFile = path.join(
      this.options.directory,
      this.options.filename
    );

    // Check if file exists and get size
    try {
      const stats = await fs.stat(this.currentFile);
      this.currentSize = stats.size;

      if (this.currentSize >= (this.options.maxSize || 0)) {
        await this.rotate();
      }
    } catch {
      this.currentSize = 0;
    }

    this.currentStream = createWriteStream(this.currentFile, { flags: 'a' });
  }

  protected output(entry: LogEntry): void {
    if (!this.currentStream) {
      this.initializeStream();
      return;
    }

    const logLine = JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: LogLevel[entry.level],
      message: entry.message,
      context: entry.context,
    }) + '\n';

    this.currentStream.write(logLine);
    this.currentSize += Buffer.byteLength(logLine);

    // Check if rotation is needed
    if (this.currentSize >= (this.options.maxSize || Infinity)) {
      this.rotate();
    }
  }

  /**
   * Rotate log files
   */
  private async rotate(): Promise<void> {
    if (this.currentStream) {
      this.currentStream.end();
      this.currentStream = null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = path.join(
      this.options.directory,
      `${this.options.filename}.${timestamp}`
    );

    try {
      await fs.rename(this.currentFile, rotatedFile);

      // Compress if enabled
      if (this.options.compress) {
        // You would use a compression library here
        // For now, we'll just note it would be compressed
        console.log(`Would compress: ${rotatedFile}`);
      }

      // Clean up old files
      await this.cleanupOldFiles();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }

    this.currentSize = 0;
    this.currentStream = createWriteStream(this.currentFile, { flags: 'a' });
  }

  /**
   * Clean up old log files
   */
  private async cleanupOldFiles(): Promise<void> {
    const files = await fs.readdir(this.options.directory);
    const logFiles = files
      .filter(f => f.startsWith(this.options.filename) && f !== this.options.filename)
      .sort()
      .reverse();

    // Keep only maxFiles
    const filesToDelete = logFiles.slice(this.options.maxFiles);

    for (const file of filesToDelete) {
      const filePath = path.join(this.options.directory, file);
      await fs.unlink(filePath);
      console.log(`Deleted old log file: ${file}`);
    }
  }

  /**
   * Close logger
   */
  async close(): Promise<void> {
    if (this.currentStream) {
      return new Promise(resolve => {
        this.currentStream!.end(() => {
          this.currentStream = null;
          resolve();
        });
      });
    }
  }
}

// ============================================================================
// Example 4: Multi-Transport Logger
// ============================================================================

interface Transport {
  name: string;
  level: LogLevel;
  write: (entry: LogEntry) => void | Promise<void>;
}

class MultiTransportLogger extends Logger {
  private transports: Transport[] = [];

  /**
   * Add a transport
   */
  addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  /**
   * Remove a transport
   */
  removeTransport(name: string): void {
    this.transports = this.transports.filter(t => t.name !== name);
  }

  protected output(entry: LogEntry): void {
    for (const transport of this.transports) {
      if (entry.level >= transport.level) {
        transport.write(entry);
      }
    }
  }
}

// ============================================================================
// Example 5: Structured Logger with JSON Output
// ============================================================================

class StructuredLogger extends Logger {
  private serviceName: string;
  private version: string;
  private environment: string;

  constructor(
    serviceName: string,
    version: string,
    environment: string,
    level: LogLevel = LogLevel.INFO
  ) {
    super(level);
    this.serviceName = serviceName;
    this.version = version;
    this.environment = environment;
  }

  protected output(entry: LogEntry): void {
    const structured = {
      '@timestamp': entry.timestamp.toISOString(),
      'log.level': LogLevel[entry.level].toLowerCase(),
      message: entry.message,
      service: {
        name: this.serviceName,
        version: this.version,
        environment: this.environment,
      },
      ...entry.context,
    };

    if (entry.context?.error) {
      const error = entry.context.error as Error;
      structured.error = {
        type: error.name,
        message: error.message,
        stack_trace: error.stack,
      };
    }

    console.log(JSON.stringify(structured));
  }
}

// ============================================================================
// Example 6: Performance Logger
// ============================================================================

class PerformanceLogger {
  private logger: Logger;
  private timers: Map<string, number> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Start timing an operation
   */
  start(operation: string): void {
    this.timers.set(operation, Date.now());
  }

  /**
   * End timing and log duration
   */
  end(operation: string, context?: Record<string, any>): void {
    const startTime = this.timers.get(operation);

    if (!startTime) {
      this.logger.warn(`No timer found for operation: ${operation}`);
      return;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(operation);

    this.logger.info(`${operation} completed`, {
      duration_ms: duration,
      ...context,
    });
  }

  /**
   * Measure and log a function execution
   */
  async measure<T>(
    operation: string,
    fn: () => T | Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      this.logger.info(`${operation} completed`, {
        duration_ms: duration,
        status: 'success',
        ...context,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(
        `${operation} failed`,
        error as Error,
        {
          duration_ms: duration,
          status: 'error',
          ...context,
        }
      );

      throw error;
    }
  }

  /**
   * Create a decorator for measuring method execution
   */
  measureMethod() {
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const startTime = Date.now();
        const operation = `${target.constructor.name}.${propertyKey}`;

        try {
          const result = await originalMethod.apply(this, args);
          const duration = Date.now() - startTime;

          this.logger?.info(`${operation} completed`, {
            duration_ms: duration,
          });

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;

          this.logger?.error(`${operation} failed`, error, {
            duration_ms: duration,
          });

          throw error;
        }
      };

      return descriptor;
    };
  }
}

// ============================================================================
// Example 7: Request/Response Logger Middleware
// ============================================================================

interface RequestContext {
  method: string;
  path: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

class RequestLogger {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Log incoming request
   */
  logRequest(context: RequestContext): void {
    this.logger.info('Incoming request', {
      http: {
        method: context.method,
        path: context.path,
        request_id: context.requestId,
      },
      client: {
        ip: context.ip,
        user_agent: context.userAgent,
      },
    });
  }

  /**
   * Log response
   */
  logResponse(
    context: RequestContext,
    statusCode: number,
    duration: number
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    const message = `${context.method} ${context.path} ${statusCode}`;

    this.log(level, message, {
      http: {
        method: context.method,
        path: context.path,
        status_code: statusCode,
        request_id: context.requestId,
      },
      duration_ms: duration,
    });
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    switch (level) {
      case LogLevel.ERROR:
        this.logger.error(message, undefined, context);
        break;
      case LogLevel.WARN:
        this.logger.warn(message, context);
        break;
      default:
        this.logger.info(message, context);
    }
  }

  /**
   * Express middleware
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] || this.generateRequestId();

      const context: RequestContext = {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId,
      };

      this.logRequest(context);

      // Log response when it's sent
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logResponse(context, res.statusCode, duration);
      });

      next();
    };
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Example 8: Error Tracking Logger
// ============================================================================

interface ErrorReport {
  error: Error;
  context?: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
}

class ErrorTracker {
  private logger: Logger;
  private errors: ErrorReport[] = [];
  private maxErrors: number;

  constructor(logger: Logger, maxErrors: number = 100) {
    this.logger = logger;
    this.maxErrors = maxErrors;
  }

  /**
   * Track an error
   */
  trackError(
    error: Error,
    severity: ErrorReport['severity'] = 'medium',
    context?: Record<string, any>,
    tags?: string[]
  ): void {
    const report: ErrorReport = {
      error,
      context,
      timestamp: new Date(),
      severity,
      tags,
    };

    this.errors.push(report);

    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    this.logger.error(
      `${severity.toUpperCase()}: ${error.message}`,
      error,
      {
        severity,
        tags,
        ...context,
      }
    );
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    bySeverity: Record<string, number>;
    recent: ErrorReport[];
  } {
    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const error of this.errors) {
      bySeverity[error.severity]++;
    }

    return {
      total: this.errors.length,
      bySeverity,
      recent: this.errors.slice(-10),
    };
  }

  /**
   * Clear error history
   */
  clear(): void {
    this.errors = [];
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function demonstrateLogging() {
  console.log('=== Logging Examples ===\n');

  // Example 1: Basic colored logger
  const logger = new ColoredLogger(LogLevel.DEBUG);

  logger.debug('Debug message', { userId: 123 });
  logger.info('Application started');
  logger.warn('This is a warning');
  logger.error('An error occurred', new Error('Something went wrong'));

  // Example 2: File logger
  const fileLogger = new FileLogger(LogLevel.INFO, {
    directory: './logs',
    filename: 'app.log',
    maxSize: 1024 * 1024, // 1MB
    maxFiles: 3,
  });

  fileLogger.info('Logging to file');
  fileLogger.error('File error', new Error('File operation failed'));

  // Example 3: Multi-transport logger
  const multiLogger = new MultiTransportLogger(LogLevel.DEBUG);

  multiLogger.addTransport({
    name: 'console',
    level: LogLevel.INFO,
    write: (entry) => {
      console.log(`[CONSOLE] ${entry.message}`);
    },
  });

  multiLogger.addTransport({
    name: 'file',
    level: LogLevel.ERROR,
    write: (entry) => {
      // Write to file
      console.log(`[FILE] ${entry.message}`);
    },
  });

  multiLogger.info('Info message to console');
  multiLogger.error('Error message to both');

  // Example 4: Structured logger
  const structuredLogger = new StructuredLogger(
    'my-service',
    '1.0.0',
    'production',
    LogLevel.INFO
  );

  structuredLogger.info('User logged in', {
    user: { id: 123, email: 'user@example.com' },
    ip: '192.168.1.1',
  });

  // Example 5: Performance logging
  const perfLogger = new PerformanceLogger(logger);

  perfLogger.start('database-query');
  await new Promise(resolve => setTimeout(resolve, 100));
  perfLogger.end('database-query', { query: 'SELECT * FROM users' });

  // Measure a function
  await perfLogger.measure('api-call', async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return 'result';
  });

  // Example 6: Request logging
  const requestLogger = new RequestLogger(logger);

  requestLogger.logRequest({
    method: 'GET',
    path: '/api/users',
    ip: '192.168.1.1',
    requestId: 'req-123',
  });

  setTimeout(() => {
    requestLogger.logResponse(
      {
        method: 'GET',
        path: '/api/users',
        requestId: 'req-123',
      },
      200,
      150
    );
  }, 150);

  // Example 7: Error tracking
  const errorTracker = new ErrorTracker(logger);

  errorTracker.trackError(
    new Error('Database connection failed'),
    'high',
    { database: 'postgres', host: 'localhost' },
    ['database', 'connection']
  );

  const stats = errorTracker.getStats();
  console.log('\nError Statistics:', stats);

  // Cleanup
  await fileLogger.close();
}

// Run if executed directly
if (require.main === module) {
  demonstrateLogging().catch(console.error);
}

export {
  LogLevel,
  Logger,
  ColoredLogger,
  FileLogger,
  MultiTransportLogger,
  StructuredLogger,
  PerformanceLogger,
  RequestLogger,
  ErrorTracker,
};
