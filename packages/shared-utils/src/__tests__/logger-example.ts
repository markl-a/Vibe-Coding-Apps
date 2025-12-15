/**
 * Logger Usage Examples
 * This file demonstrates how to use the logger utility
 */

import { createLogger, Logger, LogLevel } from '../logger';

// Example 1: Basic logger usage
export function basicExample() {
  const logger = new Logger('MyApp');

  logger.debug('Application started');
  logger.info('User logged in', { userId: 123 });
  logger.warn('API rate limit approaching', { remaining: 10 });
  logger.error('Failed to save data', new Error('Database connection lost'));
}

// Example 2: Using factory function
export function factoryExample() {
  const logger = createLogger('DatabaseService');

  logger.info('Connecting to database', { host: 'localhost', port: 5432 });
  logger.debug('Query executed', { sql: 'SELECT * FROM users', duration: '45ms' });
}

// Example 3: Setting minimum log level
export function minLevelExample() {
  const logger = new Logger('ProductionApp', { minLevel: LogLevel.WARN });

  logger.debug('This will not be logged');
  logger.info('This will not be logged either');
  logger.warn('This will be logged');
  logger.error('This will definitely be logged');
}

// Example 4: Custom formatter
export function customFormatterExample() {
  const logger = new Logger('CustomApp', {
    formatter: (entry) => {
      return `${entry.level.toUpperCase()}: ${entry.message}`;
    },
  });

  logger.info('Simple formatted message');
}

// Example 5: Complex error logging
export function errorLoggingExample() {
  const logger = createLogger('PaymentService');

  try {
    // Simulate payment processing
    throw new Error('Payment gateway timeout');
  } catch (error) {
    logger.error(
      'Payment processing failed',
      error as Error,
      {
        orderId: 'ORD-12345',
        amount: 99.99,
        retryCount: 3,
      }
    );
  }
}

// Example 6: Changing log level at runtime
export function dynamicLevelExample() {
  const logger = createLogger('DynamicApp');

  logger.setMinLevel(LogLevel.ERROR);
  logger.info('Not logged');

  logger.setMinLevel(LogLevel.DEBUG);
  logger.info('Now this is logged');
}
