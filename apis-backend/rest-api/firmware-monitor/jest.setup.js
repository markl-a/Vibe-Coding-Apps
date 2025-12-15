// Jest setup file
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/firmware-monitor-test';
process.env.ALERT_THRESHOLD_CPU = '80';
process.env.ALERT_THRESHOLD_MEMORY = '85';
process.env.ALERT_THRESHOLD_TEMPERATURE = '75';

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
