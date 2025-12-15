const request = require('supertest');
const app = require('../../index');
const storageService = require('../../services/storage.service');
const { STORAGE_PROVIDERS } = require('../../config/storage');

// Mock storage service for integration tests
jest.mock('../../services/storage.service');

describe('Upload API - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    storageService.uploadFile = jest.fn().mockResolvedValue({
      fileKey: 'test-file-123.jpg',
      url: 'https://example.com/test-file-123.jpg',
      provider: STORAGE_PROVIDERS.S3,
      size: 1024,
      mimetype: 'image/jpeg'
    });

    storageService.downloadFile = jest.fn().mockResolvedValue({
      buffer: Buffer.from('test file content'),
      contentType: 'image/jpeg',
      size: 1024
    });

    storageService.deleteFile = jest.fn().mockResolvedValue({
      success: true,
      fileKey: 'test-file-123.jpg'
    });

    storageService.listFiles = jest.fn().mockResolvedValue([
      { key: 'file1.jpg', size: 1024, lastModified: new Date() },
      { key: 'file2.jpg', size: 2048, lastModified: new Date() }
    ]);

    storageService.getFileMetadata = jest.fn().mockResolvedValue({
      size: 1024,
      contentType: 'image/jpeg',
      lastModified: new Date(),
      etag: 'abc123'
    });
  });

  describe('POST /api/upload', () => {
    test('should upload a single file successfully', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('test image content'), 'test.jpg')
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'File uploaded successfully',
        data: expect.objectContaining({
          fileKey: expect.any(String),
          url: expect.any(String)
        })
      });

      expect(storageService.uploadFile).toHaveBeenCalled();
    });

    test('should return 400 when no file is provided', async () => {
      const response = await request(app)
        .post('/api/upload')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'No file provided'
      });
    });

    test('should upload file with folder option', async () => {
      const response = await request(app)
        .post('/api/upload')
        .field('folder', 'images')
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(201);

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ folder: 'images' })
      );
    });

    test('should upload file with prefix option', async () => {
      const response = await request(app)
        .post('/api/upload')
        .field('prefix', 'avatar')
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(201);

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ prefix: 'avatar' })
      );
    });

    test('should handle storage service errors', async () => {
      storageService.uploadFile.mockRejectedValue(new Error('Storage error'));

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to upload file'
      });
    });

    test('should reject file exceeding size limit', async () => {
      const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // 20MB

      const response = await request(app)
        .post('/api/upload')
        .attach('file', largeBuffer, 'large.jpg')
        .expect(400);

      expect(response.body.error).toContain('File too large');
    });
  });

  describe('POST /api/upload/multiple', () => {
    test('should upload multiple files successfully', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .attach('files', Buffer.from('test1'), 'file1.jpg')
        .attach('files', Buffer.from('test2'), 'file2.jpg')
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        results: expect.arrayContaining([
          expect.objectContaining({ success: true, filename: 'file1.jpg' }),
          expect.objectContaining({ success: true, filename: 'file2.jpg' })
        ])
      });

      expect(storageService.uploadFile).toHaveBeenCalledTimes(2);
    });

    test('should return 400 when no files are provided', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'No files provided'
      });
    });

    test('should handle partial upload failures', async () => {
      storageService.uploadFile
        .mockResolvedValueOnce({ fileKey: 'file1.jpg' })
        .mockRejectedValueOnce(new Error('Upload failed'));

      const response = await request(app)
        .post('/api/upload/multiple')
        .attach('files', Buffer.from('test1'), 'file1.jpg')
        .attach('files', Buffer.from('test2'), 'file2.jpg');

      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0].success).toBe(true);
      expect(response.body.results[1].success).toBe(false);
    });
  });

  describe('GET /api/files/:fileKey', () => {
    test('should download file successfully', async () => {
      const response = await request(app)
        .get('/api/files/test-file-123.jpg')
        .expect(200);

      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(storageService.downloadFile).toHaveBeenCalledWith('test-file-123.jpg');
    });

    test('should handle file not found', async () => {
      storageService.downloadFile.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .get('/api/files/nonexistent.jpg')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'File not found'
      });
    });

    test('should handle nested file paths', async () => {
      const response = await request(app)
        .get('/api/files/images/subfolder/test.jpg')
        .expect(200);

      expect(storageService.downloadFile).toHaveBeenCalledWith('images/subfolder/test.jpg');
    });
  });

  describe('DELETE /api/files/:fileKey', () => {
    test('should delete file successfully', async () => {
      const response = await request(app)
        .delete('/api/files/test-file-123.jpg')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'File deleted successfully'
      });

      expect(storageService.deleteFile).toHaveBeenCalledWith('test-file-123.jpg');
    });

    test('should handle delete errors', async () => {
      storageService.deleteFile.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/files/test.jpg')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to delete file'
      });
    });

    test('should handle nested file paths in delete', async () => {
      const response = await request(app)
        .delete('/api/files/images/test.jpg')
        .expect(200);

      expect(storageService.deleteFile).toHaveBeenCalledWith('images/test.jpg');
    });
  });

  describe('GET /api/files', () => {
    test('should list all files', async () => {
      const response = await request(app)
        .get('/api/files')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          files: expect.any(Array),
          total: 2
        })
      });

      expect(storageService.listFiles).toHaveBeenCalledWith('');
    });

    test('should list files with prefix filter', async () => {
      const response = await request(app)
        .get('/api/files?prefix=images/')
        .expect(200);

      expect(storageService.listFiles).toHaveBeenCalledWith('images/');
    });

    test('should handle list errors', async () => {
      storageService.listFiles.mockRejectedValue(new Error('List failed'));

      const response = await request(app)
        .get('/api/files')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to list files'
      });
    });
  });

  describe('GET /api/metadata/:fileKey', () => {
    test('should get file metadata successfully', async () => {
      const response = await request(app)
        .get('/api/metadata/test-file-123.jpg')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          size: expect.any(Number),
          contentType: expect.any(String)
        })
      });

      expect(storageService.getFileMetadata).toHaveBeenCalledWith('test-file-123.jpg');
    });

    test('should handle metadata not found', async () => {
      storageService.getFileMetadata.mockRejectedValue(new Error('Not found'));

      const response = await request(app)
        .get('/api/metadata/nonexistent.jpg')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'File not found'
      });
    });
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        service: 'File Upload Service',
        status: 'OK'
      });
    });
  });

  describe('GET /', () => {
    test('should return service information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        service: 'File Upload Service',
        version: expect.any(String),
        status: 'running',
        endpoints: expect.any(Object)
      });
    });
  });

  describe('Error handling', () => {
    test('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/undefined-route')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Not found'
      });
    });

    test('should handle method not allowed', async () => {
      const response = await request(app)
        .patch('/api/health')
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });
  });

  describe('CORS', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
