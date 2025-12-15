// Test setup file for Jest

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.STORAGE_PROVIDER = 's3';
process.env.STORAGE_BUCKET = 'test-bucket';
process.env.MAX_FILE_SIZE = '10485760'; // 10MB
process.env.ALLOWED_FILE_TYPES = 'image/jpeg,image/png,image/gif,application/pdf,text/plain,text/csv';

// AWS credentials for testing
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_REGION = 'us-east-1';

// MinIO credentials for testing
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_ACCESS_KEY = 'test-access-key';
process.env.MINIO_SECRET_KEY = 'test-secret-key';

// Suppress console logs during tests unless debugging
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
