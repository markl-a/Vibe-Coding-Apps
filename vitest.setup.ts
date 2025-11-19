import { beforeEach, afterEach, vi } from 'vitest';

// Setup environment
process.env.NODE_ENV = 'test';

// Global mocks
beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

// Suppress console logs in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  // Keep error and warn for debugging
};
