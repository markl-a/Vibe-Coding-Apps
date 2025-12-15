/**
 * Test utility functions for file upload service tests
 */

/**
 * Create a mock file object
 */
function createMockFile(options = {}) {
  const {
    originalname = 'test.jpg',
    mimetype = 'image/jpeg',
    size = 1024,
    content = 'test file content'
  } = options;

  return {
    originalname,
    mimetype,
    size,
    buffer: Buffer.from(content),
    fieldname: 'file',
    encoding: '7bit'
  };
}

/**
 * Create multiple mock files
 */
function createMockFiles(count = 3, options = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockFile({
      originalname: `file${i + 1}.jpg`,
      content: `content${i + 1}`,
      ...options
    })
  );
}

/**
 * Create a mock Express request
 */
function createMockRequest(overrides = {}) {
  return {
    file: null,
    files: [],
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides
  };
}

/**
 * Create a mock Express response
 */
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null
  };

  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn().mockImplementation((data) => {
    res.body = data;
    return res;
  });

  res.send = jest.fn().mockImplementation((data) => {
    res.body = data;
    return res;
  });

  res.setHeader = jest.fn().mockImplementation((name, value) => {
    res.headers[name] = value;
    return res;
  });

  return res;
}

/**
 * Create mock storage result
 */
function createMockStorageResult(fileKey = 'test-file-123.jpg') {
  return {
    fileKey,
    url: `https://example.com/${fileKey}`,
    provider: 's3',
    size: 1024,
    mimetype: 'image/jpeg'
  };
}

/**
 * Create mock file metadata
 */
function createMockMetadata(options = {}) {
  return {
    size: 1024,
    contentType: 'image/jpeg',
    lastModified: new Date(),
    etag: 'abc123',
    ...options
  };
}

/**
 * Wait for async operations
 */
function delay(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert file upload result structure
 */
function assertUploadResult(result) {
  expect(result).toMatchObject({
    fileKey: expect.any(String),
    url: expect.any(String),
    provider: expect.any(String),
    size: expect.any(Number),
    mimetype: expect.any(String)
  });
}

/**
 * Assert API response structure
 */
function assertApiResponse(response, expectedStatus = 200) {
  expect(response.statusCode).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success');

  if (response.body.success) {
    expect(response.body).toHaveProperty('data');
  } else {
    expect(response.body).toHaveProperty('error');
  }
}

/**
 * Generate random file name
 */
function generateRandomFileName(extension = 'jpg') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}.${extension}`;
}

/**
 * Create large buffer for testing file size limits
 */
function createLargeBuffer(sizeInMB = 15) {
  return Buffer.alloc(sizeInMB * 1024 * 1024);
}

module.exports = {
  createMockFile,
  createMockFiles,
  createMockRequest,
  createMockResponse,
  createMockStorageResult,
  createMockMetadata,
  delay,
  assertUploadResult,
  assertApiResponse,
  generateRandomFileName,
  createLargeBuffer
};
