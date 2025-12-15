const request = require('supertest');
const app = require('../../index');
const storageService = require('../../services/storage.service');

// Mock storage service for E2E tests
jest.mock('../../services/storage.service');

describe('File Upload Service - E2E Tests', () => {
  const uploadedFiles = new Map();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock implementation that tracks uploaded files
    storageService.uploadFile = jest.fn().mockImplementation((file, options) => {
      const fileKey = `${options?.folder || ''}${options?.prefix || 'file'}-${Date.now()}-${file.originalname}`;
      const fileData = {
        fileKey,
        url: `https://example.com/${fileKey}`,
        provider: 's3',
        size: file.size,
        mimetype: file.mimetype,
        buffer: file.buffer
      };
      uploadedFiles.set(fileKey, fileData);
      return Promise.resolve(fileData);
    });

    storageService.downloadFile = jest.fn().mockImplementation((fileKey) => {
      const file = uploadedFiles.get(fileKey);
      if (!file) {
        return Promise.reject(new Error('File not found'));
      }
      return Promise.resolve({
        buffer: file.buffer,
        contentType: file.mimetype,
        size: file.size
      });
    });

    storageService.deleteFile = jest.fn().mockImplementation((fileKey) => {
      if (!uploadedFiles.has(fileKey)) {
        return Promise.reject(new Error('File not found'));
      }
      uploadedFiles.delete(fileKey);
      return Promise.resolve({ success: true, fileKey });
    });

    storageService.listFiles = jest.fn().mockImplementation((prefix) => {
      const files = Array.from(uploadedFiles.values())
        .filter(f => !prefix || f.fileKey.startsWith(prefix))
        .map(f => ({
          key: f.fileKey,
          size: f.size,
          lastModified: new Date()
        }));
      return Promise.resolve(files);
    });

    storageService.getFileMetadata = jest.fn().mockImplementation((fileKey) => {
      const file = uploadedFiles.get(fileKey);
      if (!file) {
        return Promise.reject(new Error('File not found'));
      }
      return Promise.resolve({
        size: file.size,
        contentType: file.mimetype,
        lastModified: new Date(),
        etag: 'test-etag'
      });
    });
  });

  afterEach(() => {
    uploadedFiles.clear();
  });

  describe('Complete file lifecycle', () => {
    test('should handle complete file upload, download, and delete workflow', async () => {
      // 1. Upload file
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('test content'), 'test-document.pdf')
        .expect(201);

      expect(uploadResponse.body.success).toBe(true);
      const fileKey = uploadResponse.body.data.fileKey;

      // 2. Verify file exists via metadata
      const metadataResponse = await request(app)
        .get(`/api/metadata/${fileKey}`)
        .expect(200);

      expect(metadataResponse.body.data.size).toBeGreaterThan(0);

      // 3. Download file
      const downloadResponse = await request(app)
        .get(`/api/files/${fileKey}`)
        .expect(200);

      expect(downloadResponse.headers['content-type']).toBeTruthy();

      // 4. Delete file
      const deleteResponse = await request(app)
        .delete(`/api/files/${fileKey}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // 5. Verify file is deleted
      await request(app)
        .get(`/api/metadata/${fileKey}`)
        .expect(404);
    });

    test('should handle multiple file uploads and batch operations', async () => {
      // Upload multiple files
      const files = [
        { name: 'image1.jpg', content: 'image1 content' },
        { name: 'image2.jpg', content: 'image2 content' },
        { name: 'image3.jpg', content: 'image3 content' }
      ];

      const uploadPromises = files.map(file =>
        request(app)
          .post('/api/upload')
          .field('folder', 'images')
          .attach('file', Buffer.from(file.content), file.name)
      );

      const responses = await Promise.all(uploadPromises);

      // Verify all uploads succeeded
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // List all uploaded files
      const listResponse = await request(app)
        .get('/api/files?prefix=images/')
        .expect(200);

      expect(listResponse.body.data.files.length).toBeGreaterThanOrEqual(3);

      // Delete all files
      const deletePromises = responses.map(response =>
        request(app).delete(`/api/files/${response.body.data.fileKey}`)
      );

      const deleteResponses = await Promise.all(deletePromises);
      deleteResponses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should organize files in different folders', async () => {
      // Upload files to different folders
      const folders = ['images', 'documents', 'videos'];
      const uploadPromises = folders.map(folder =>
        request(app)
          .post('/api/upload')
          .field('folder', folder)
          .attach('file', Buffer.from(`${folder} content`), `test.${folder}`)
      );

      await Promise.all(uploadPromises);

      // Verify files in each folder
      for (const folder of folders) {
        const listResponse = await request(app)
          .get(`/api/files?prefix=${folder}/`)
          .expect(200);

        expect(listResponse.body.data.files.length).toBeGreaterThanOrEqual(1);
      }
    });

    test('should handle file replacement workflow', async () => {
      const fileName = 'document.pdf';

      // Upload original file
      const upload1 = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('original content'), fileName)
        .expect(201);

      const fileKey1 = upload1.body.data.fileKey;

      // Upload new version
      const upload2 = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('updated content'), fileName)
        .expect(201);

      const fileKey2 = upload2.body.data.fileKey;

      // Verify both versions exist
      expect(fileKey1).not.toBe(fileKey2);

      // Delete old version
      await request(app)
        .delete(`/api/files/${fileKey1}`)
        .expect(200);

      // Verify new version still exists
      await request(app)
        .get(`/api/metadata/${fileKey2}`)
        .expect(200);
    });
  });

  describe('Multiple file upload workflow', () => {
    test('should upload multiple files at once', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .attach('files', Buffer.from('file1'), 'file1.jpg')
        .attach('files', Buffer.from('file2'), 'file2.jpg')
        .attach('files', Buffer.from('file3'), 'file3.pdf')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(3);
      expect(response.body.results.every(r => r.success)).toBe(true);

      // Verify all files are accessible
      const fileKeys = response.body.results.map(r => r.data.fileKey);
      for (const fileKey of fileKeys) {
        await request(app)
          .get(`/api/metadata/${fileKey}`)
          .expect(200);
      }
    });

    test('should handle mixed success/failure in batch upload', async () => {
      // First upload should succeed
      const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // Too large

      const response = await request(app)
        .post('/api/upload/multiple')
        .attach('files', Buffer.from('small file'), 'small.jpg')
        .attach('files', largeBuffer, 'large.jpg');

      // Should have partial success
      expect(response.body.results).toHaveLength(2);
      expect(response.body.results.some(r => r.success)).toBe(true);
      expect(response.body.results.some(r => !r.success)).toBe(true);
    });
  });

  describe('Error recovery scenarios', () => {
    test('should handle download of non-existent file gracefully', async () => {
      const response = await request(app)
        .get('/api/files/non-existent-file.jpg')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('File not found');
    });

    test('should handle deletion of non-existent file gracefully', async () => {
      const response = await request(app)
        .delete('/api/files/non-existent-file.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('should handle metadata request for non-existent file', async () => {
      const response = await request(app)
        .get('/api/metadata/non-existent-file.jpg')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should handle empty file list gracefully', async () => {
      const response = await request(app)
        .get('/api/files?prefix=non-existent-folder/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(0);
    });
  });

  describe('File organization and filtering', () => {
    beforeEach(async () => {
      // Setup test files in different folders
      const testFiles = [
        { folder: 'images', name: 'photo1.jpg' },
        { folder: 'images', name: 'photo2.jpg' },
        { folder: 'documents', name: 'report.pdf' },
        { folder: 'documents/2024', name: 'annual.pdf' },
        { folder: 'videos', name: 'clip.mp4' }
      ];

      for (const file of testFiles) {
        await request(app)
          .post('/api/upload')
          .field('folder', file.folder)
          .attach('file', Buffer.from('test'), file.name);
      }
    });

    test('should list files by folder prefix', async () => {
      const imagesResponse = await request(app)
        .get('/api/files?prefix=images/')
        .expect(200);

      expect(imagesResponse.body.data.files.length).toBeGreaterThanOrEqual(2);
      expect(imagesResponse.body.data.files.every(f => f.key.startsWith('images/'))).toBe(true);
    });

    test('should list files in nested folders', async () => {
      const response = await request(app)
        .get('/api/files?prefix=documents/2024/')
        .expect(200);

      expect(response.body.data.files.length).toBeGreaterThanOrEqual(1);
    });

    test('should list all files when no prefix specified', async () => {
      const response = await request(app)
        .get('/api/files')
        .expect(200);

      expect(response.body.data.files.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Concurrent operations', () => {
    test('should handle concurrent uploads', async () => {
      const concurrentUploads = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/upload')
          .attach('file', Buffer.from(`content${i}`), `file${i}.txt`)
      );

      const responses = await Promise.all(concurrentUploads);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify all files have unique keys
      const fileKeys = responses.map(r => r.body.data.fileKey);
      const uniqueKeys = new Set(fileKeys);
      expect(uniqueKeys.size).toBe(5);
    });

    test('should handle concurrent downloads', async () => {
      // First upload a file
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('shared content'), 'shared.txt')
        .expect(201);

      const fileKey = uploadResponse.body.data.fileKey;

      // Concurrent downloads
      const concurrentDownloads = Array.from({ length: 3 }, () =>
        request(app).get(`/api/files/${fileKey}`)
      );

      const responses = await Promise.all(concurrentDownloads);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Service health and availability', () => {
    test('should respond to health check during operations', async () => {
      // Start an upload
      const uploadPromise = request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('test'), 'test.txt');

      // Check health while uploading
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);

      expect(healthResponse.body.status).toBe('OK');

      // Wait for upload to complete
      await uploadPromise;
    });

    test('should provide service information', async () => {
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
});
