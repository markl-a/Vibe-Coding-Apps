module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/src/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage settings
  collectCoverageFrom: [
    'index.js',
    'src/**/*.js',
    '!src/__tests__/**',
    '!src/__mocks__/**',
    '!**/node_modules/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],

  // Test timeout (increase for integration tests)
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Module paths
  modulePaths: ['<rootDir>'],

  // Transform (if using ES6 modules in future)
  transform: {},

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined
};
