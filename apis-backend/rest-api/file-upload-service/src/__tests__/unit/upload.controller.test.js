const uploadController = require('../../controllers/upload.controller');
const storageService = require('../../services/storage.service');
const validationService = require('../../services/validation.service');

jest.mock('../../services/storage.service');
jest.mock('../../services/validation.service');

describe('UploadController - Unit Tests', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      file: {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024
      },
      files: [],
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('uploadSingle', () => {
    test('should upload file successfully', async () => {
      validationService.validateFile.mockResolvedValue({ valid: true });
      storageService.uploadFile.mockResolvedValue({
        fileKey: 'test-123.jpg',
        url: 'https://example.com/test-123.jpg',
        size: 1024,
        mimetype: 'image/jpeg'
      });

      await uploadController.uploadSingle(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'File uploaded successfully',
          data: expect.objectContaining({
            fileKey: 'test-123.jpg'
          })
        })
      );
    });

    test('should return 400 if no file provided', async () => {
      mockReq.file = null;

      await uploadController.uploadSingle(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'No file provided'
        })
      );
    });

    test('should return 400 if validation fails', async () => {
      validationService.validateFile.mockResolvedValue({
        valid: false,
        errors: ['File too large', 'Invalid type']
      });

      await uploadController.uploadSingle(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.arrayContaining(['File too large'])
        })
      );
    });

    test('should handle upload errors', async () => {
      validationService.validateFile.mockResolvedValue({ valid: true });
      storageService.uploadFile.mockRejectedValue(new Error('Upload failed'));

      await uploadController.uploadSingle(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to upload file'
        })
      );
    });

    test('should pass folder option to storage service', async () => {
      mockReq.body.folder = 'images';
      validationService.validateFile.mockResolvedValue({ valid: true });
      storageService.uploadFile.mockResolvedValue({
        fileKey: 'images/test-123.jpg',
        url: 'https://example.com/images/test-123.jpg'
      });

      await uploadController.uploadSingle(mockReq, mockRes);

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        mockReq.file,
        expect.objectContaining({ folder: 'images' })
      );
    });

    test('should pass prefix option to storage service', async () => {
      mockReq.body.prefix = 'avatar';
      validationService.validateFile.mockResolvedValue({ valid: true });
      storageService.uploadFile.mockResolvedValue({
        fileKey: 'avatar-123.jpg'
      });

      await uploadController.uploadSingle(mockReq, mockRes);

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        mockReq.file,
        expect.objectContaining({ prefix: 'avatar' })
      );
    });
  });

  describe('uploadMultiple', () => {
    beforeEach(() => {
      mockReq.files = [
        {
          originalname: 'file1.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test1'),
          size: 1024
        },
        {
          originalname: 'file2.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test2'),
          size: 2048
        }
      ];
    });

    test('should upload multiple files successfully', async () => {
      validationService.validateFile.mockResolvedValue({ valid: true });
      storageService.uploadFile.mockResolvedValueOnce({
        fileKey: 'file1-123.jpg'
      }).mockResolvedValueOnce({
        fileKey: 'file2-456.jpg'
      });

      await uploadController.uploadMultiple(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.arrayContaining([
            expect.objectContaining({ success: true, filename: 'file1.jpg' }),
            expect.objectContaining({ success: true, filename: 'file2.jpg' })
          ])
        })
      );
    });

    test('should return 400 if no files provided', async () => {
      mockReq.files = [];

      await uploadController.uploadMultiple(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'No files provided'
        })
      );
    });

    test('should handle partial upload failures', async () => {
      validationService.validateFile
        .mockResolvedValueOnce({ valid: true })
        .mockResolvedValueOnce({ valid: false, errors: ['Invalid type'] });
      storageService.uploadFile.mockResolvedValue({
        fileKey: 'file1-123.jpg'
      });

      await uploadController.uploadMultiple(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          results: expect.arrayContaining([
            expect.objectContaining({ success: true, filename: 'file1.jpg' }),
            expect.objectContaining({ success: false, filename: 'file2.jpg' })
          ])
        })
      );
    });

    test('should handle upload errors for individual files', async () => {
      validationService.validateFile.mockResolvedValue({ valid: true });
      storageService.uploadFile
        .mockResolvedValueOnce({ fileKey: 'file1-123.jpg' })
        .mockRejectedValueOnce(new Error('Storage error'));

      await uploadController.uploadMultiple(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({ success: true }),
            expect.objectContaining({ success: false, error: 'Storage error' })
          ])
        })
      );
    });
  });

  describe('downloadFile', () => {
    test('should download file successfully', async () => {
      mockReq.params.fileKey = 'test-123.jpg';
      storageService.downloadFile.mockResolvedValue({
        buffer: Buffer.from('file content'),
        contentType: 'image/jpeg',
        size: 1024
      });

      await uploadController.downloadFile(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Length', 1024);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment')
      );
      expect(mockRes.send).toHaveBeenCalledWith(expect.any(Buffer));
    });

    test('should return 400 if fileKey is missing', async () => {
      mockReq.params.fileKey = '';

      await uploadController.downloadFile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'File key is required'
        })
      );
    });

    test('should return 404 if file not found', async () => {
      mockReq.params.fileKey = 'nonexistent.jpg';
      storageService.downloadFile.mockRejectedValue(new Error('File not found'));

      await uploadController.downloadFile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'File not found'
        })
      );
    });
  });

  describe('deleteFile', () => {
    test('should delete file successfully', async () => {
      mockReq.params.fileKey = 'test-123.jpg';
      storageService.deleteFile.mockResolvedValue({
        success: true,
        fileKey: 'test-123.jpg'
      });

      await uploadController.deleteFile(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'File deleted successfully'
        })
      );
    });

    test('should return 400 if fileKey is missing', async () => {
      mockReq.params.fileKey = '';

      await uploadController.deleteFile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'File key is required'
        })
      );
    });

    test('should handle delete errors', async () => {
      mockReq.params.fileKey = 'test-123.jpg';
      storageService.deleteFile.mockRejectedValue(new Error('Delete failed'));

      await uploadController.deleteFile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to delete file'
        })
      );
    });
  });

  describe('listFiles', () => {
    test('should list files successfully', async () => {
      storageService.listFiles.mockResolvedValue([
        { key: 'file1.jpg', size: 1024, lastModified: new Date() },
        { key: 'file2.jpg', size: 2048, lastModified: new Date() }
      ]);

      await uploadController.listFiles(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            files: expect.any(Array),
            total: 2
          })
        })
      );
    });

    test('should list files with prefix filter', async () => {
      mockReq.query.prefix = 'images/';
      storageService.listFiles.mockResolvedValue([
        { key: 'images/file1.jpg', size: 1024 }
      ]);

      await uploadController.listFiles(mockReq, mockRes);

      expect(storageService.listFiles).toHaveBeenCalledWith('images/');
    });

    test('should handle list errors', async () => {
      storageService.listFiles.mockRejectedValue(new Error('List failed'));

      await uploadController.listFiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to list files'
        })
      );
    });
  });

  describe('getFileMetadata', () => {
    test('should get file metadata successfully', async () => {
      mockReq.params.fileKey = 'test-123.jpg';
      storageService.getFileMetadata.mockResolvedValue({
        size: 1024,
        contentType: 'image/jpeg',
        lastModified: new Date(),
        etag: 'abc123'
      });

      await uploadController.getFileMetadata(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            size: 1024,
            contentType: 'image/jpeg'
          })
        })
      );
    });

    test('should return 400 if fileKey is missing', async () => {
      mockReq.params.fileKey = '';

      await uploadController.getFileMetadata(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should return 404 if file not found', async () => {
      mockReq.params.fileKey = 'nonexistent.jpg';
      storageService.getFileMetadata.mockRejectedValue(new Error('Not found'));

      await uploadController.getFileMetadata(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('healthCheck', () => {
    test('should return health status', async () => {
      await uploadController.healthCheck(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          service: 'File Upload Service',
          status: 'OK',
          timestamp: expect.any(String)
        })
      );
    });
  });
});
