// Jest setup file - runs before all tests

// Increase timeout for integration tests
jest.setTimeout(10000);

// Suppress console output during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ecommerce_payments_test';
process.env.PORT = '3999'; // Use different port for tests

// Mock external services (like actual Stripe/PayPal APIs)
// This is handled in individual test files

// Global test utilities
global.testUtils = {
  // Generate random string
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  // Wait utility
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create test payment data
  createPaymentData: (overrides = {}) => ({
    orderId: `ORD-${Date.now()}`,
    userId: `USER-${Math.random().toString(36).substring(7)}`,
    amount: 99.99,
    currency: 'USD',
    method: 'credit_card',
    ...overrides
  })
};

// Clean up after all tests
afterAll(async () => {
  // Close any remaining connections
  await new Promise(resolve => setTimeout(resolve, 500));
});
