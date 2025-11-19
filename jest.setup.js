// Jest setup file
// Add global test setup here

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(10000);

// Add custom matchers if needed
expect.extend({
  // Custom matchers can be added here
});

// Setup global mocks
global.console = {
  ...console,
  // Suppress console.log in tests, but keep error and warn
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});
