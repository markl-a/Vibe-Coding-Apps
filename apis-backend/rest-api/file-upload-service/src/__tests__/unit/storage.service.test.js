const storageService = require('../../services/storage.service');
const { STORAGE_PROVIDERS, s3Client, minioClient } = require('../../config/storage');

// Mock AWS SDK
jest.mock('aws-sdk', () => {
  const mockUpload = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      Location: 'https://s3.amazonaws.com/bucket/test-file.jpg',
      ETag: '"abc123"',
      Key: 'test-file.jpg'
    })
  });

  const mockGetObject = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      Body: Buffer.from('test content'),
      ContentType: 'image/jpeg',
      ContentLength: 1024
    })
  });

  const mockDeleteObject = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({})
  });

  const mockListObjectsV2 = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      Contents: [
        { Key: 'file1.jpg', Size: 1024, LastModified: new Date() },
        { Key: 'file2.jpg', Size: 2048, LastModified: new Date() }
      ]
    })
  });

  const mockHeadObject = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      ContentLength: 1024,
      ContentType: 'image/jpeg',
      LastModified: new Date(),
      ETag: '"abc123"'
    })
  });

  return {
    S3: jest.fn().mockImplementation(() => ({
      upload: mockUpload,
      getObject: mockGetObject,
      deleteObject: mockDeleteObject,
      listObjectsV2: mockListObjectsV2,
      headObject: mockHeadObject
    }))
  };
});

// Mock MinIO
jest.mock('minio', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      putObject: jest.fn().mockResolvedValue('test-etag'),
      getObject: jest.fn().mockImplementation(() => {
        const { Readable } = require('stream');
        const stream = new Readable();
        stream.push('test content');
        stream.push(null);
        return Promise.resolve(stream);
      }),
      removeObject: jest.fn().mockResolvedValue(),
      listObjects: jest.fn().mockImplementation(() => {
        const { EventEmitter } = require('events');
        const stream = new EventEmitter();
        setTimeout(() => {
          stream.emit('data', { name: 'file1.jpg', size: 1024, lastModified: new Date() });
          stream.emit('data', { name: 'file2.jpg', size: 2048, lastModified: new Date() });
          stream.emit('end');
        }, 10);
        return stream;
      }),
      statObject: jest.fn().mockResolvedValue({
        size: 1024,
        metaData: { 'content-type': 'image/jpeg' },
        lastModified: new Date(),
        etag: 'test-etag'
      })
    }))
  };
});

// Mock Google Cloud Storage
jest.mock('@google-cloud/storage', () => {
  return {
    Storage: jest.fn().mockImplementation(() => ({
      bucket: jest.fn().mockReturnValue({
        file: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue(),
          download: jest.fn().mockResolvedValue([Buffer.from('test content')]),
          getMetadata: jest.fn().mockResolvedValue([{
            contentType: 'image/jpeg',
            size: 1024
          }]),
          delete: jest.fn().mockResolvedValue()
        }),
        getFiles: jest.fn().mockResolvedValue([[
          {
            name: 'file1.jpg',
            metadata: { size: '1024', updated: new Date().toISOString() }
          }
        ]])
      })
    }))
  };
});

describe('StorageService - Unit Tests', () => {
  const mockFile = {
    originalname: 'test.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test content'),
    size: 1024
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFileName', () => {
    test('should generate unique filename with timestamp', () => {
      const fileName = storageService.generateFileName('test.jpg');
      expect(fileName).toMatch(/test-\d+-[a-f0-9-]+\.jpg/);
    });

    test('should include prefix when provided', () => {
      const fileName = storageService.generateFileName('test.jpg', 'avatar');
      expect(fileName).toMatch(/^avatar-\d+-[a-f0-9-]+\.jpg$/);
    });

    test('should preserve file extension', () => {
      const fileName = storageService.generateFileName('document.pdf');
      expect(fileName).toMatch(/\.pdf$/);
    });

    test('should handle files without extension', () => {
      const fileName = storageService.generateFileName('README');
      expect(fileName).toMatch(/README-\d+-[a-f0-9-]+$/);
    });

    test('should generate different names for same file', () => {
      const name1 = storageService.generateFileName('test.jpg');
      const name2 = storageService.generateFileName('test.jpg');
      expect(name1).not.toBe(name2);
    });
  });

  describe('uploadToS3', () => {
    beforeEach(() => {
      storageService.provider = STORAGE_PROVIDERS.S3;
    });

    test('should upload file to S3 successfully', async () => {
      const result = await storageService.uploadToS3(mockFile, 'test-file.jpg');

      expect(result).toMatchObject({
        fileKey: 'test-file.jpg',
        provider: STORAGE_PROVIDERS.S3,
        size: mockFile.size,
        mimetype: mockFile.mimetype
      });
      expect(result.url).toBeDefined();
    });

    test('should include correct S3 parameters', async () => {
      await storageService.uploadToS3(mockFile, 'test-file.jpg');

      const mockS3 = require('aws-sdk').S3;
      const s3Instance = new mockS3();
      expect(s3Instance.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: 'test-file.jpg',
          Body: mockFile.buffer,
          ContentType: mockFile.mimetype
        })
      );
    });
  });

  describe('downloadFromS3', () => {
    beforeEach(() => {
      storageService.provider = STORAGE_PROVIDERS.S3;
    });

    test('should download file from S3 successfully', async () => {
      const result = await storageService.downloadFromS3('test-file.jpg');

      expect(result).toMatchObject({
        buffer: expect.any(Buffer),
        contentType: 'image/jpeg',
        size: 1024
      });
    });

    test('should call S3 getObject with correct parameters', async () => {
      await storageService.downloadFromS3('test-file.jpg');

      const mockS3 = require('aws-sdk').S3;
      const s3Instance = new mockS3();
      expect(s3Instance.getObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: 'test-file.jpg'
        })
      );
    });
  });

  describe('deleteFromS3', () => {
    beforeEach(() => {
      storageService.provider = STORAGE_PROVIDERS.S3;
    });

    test('should delete file from S3 successfully', async () => {
      const result = await storageService.deleteFromS3('test-file.jpg');

      expect(result).toEqual({
        success: true,
        fileKey: 'test-file.jpg'
      });
    });

    test('should call S3 deleteObject with correct parameters', async () => {
      await storageService.deleteFromS3('test-file.jpg');

      const mockS3 = require('aws-sdk').S3;
      const s3Instance = new mockS3();
      expect(s3Instance.deleteObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: 'test-file.jpg'
        })
      );
    });
  });

  describe('listFromS3', () => {
    beforeEach(() => {
      storageService.provider = STORAGE_PROVIDERS.S3;
    });

    test('should list files from S3 successfully', async () => {
      const result = await storageService.listFromS3('');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toMatchObject({
        key: expect.any(String),
        size: expect.any(Number),
        lastModified: expect.any(Date)
      });
    });

    test('should list files with prefix', async () => {
      await storageService.listFromS3('images/');

      const mockS3 = require('aws-sdk').S3;
      const s3Instance = new mockS3();
      expect(s3Instance.listObjectsV2).toHaveBeenCalledWith(
        expect.objectContaining({
          Prefix: 'images/'
        })
      );
    });
  });

  describe('getS3Metadata', () => {
    beforeEach(() => {
      storageService.provider = STORAGE_PROVIDERS.S3;
    });

    test('should get file metadata from S3', async () => {
      const result = await storageService.getS3Metadata('test-file.jpg');

      expect(result).toMatchObject({
        size: expect.any(Number),
        contentType: expect.any(String),
        lastModified: expect.any(Date),
        etag: expect.any(String)
      });
    });
  });

  describe('uploadToMinio', () => {
    beforeEach(() => {
      storageService.provider = STORAGE_PROVIDERS.MINIO;
    });

    test('should upload file to MinIO successfully', async () => {
      const result = await storageService.uploadToMinio(mockFile, 'test-file.jpg');

      expect(result).toMatchObject({
        fileKey: 'test-file.jpg',
        provider: STORAGE_PROVIDERS.MINIO,
        size: mockFile.size,
        mimetype: mockFile.mimetype
      });
    });
  });

  describe('downloadFromMinio', () => {
    beforeEach(() => {
      storageService.provider = STORAGE_PROVIDERS.MINIO;
    });

    test('should download file from MinIO successfully', async () => {
      const result = await storageService.downloadFromMinio('test-file.jpg');

      expect(result).toMatchObject({
        buffer: expect.any(Buffer),
        contentType: expect.any(String),
        size: expect.any(Number)
      });
    });
  });

  describe('deleteFromMinio', () => {
    beforeEach(() => {
      storageService.provider = STORAGE_PROVIDERS.MINIO;
    });

    test('should delete file from MinIO successfully', async () => {
      const result = await storageService.deleteFromMinio('test-file.jpg');

      expect(result).toEqual({
        success: true,
        fileKey: 'test-file.jpg'
      });
    });
  });

  describe('listFromMinio', () => {
    beforeEach(() => {
      storageService.provider = STORAGE_PROVIDERS.MINIO;
    });

    test('should list files from MinIO successfully', async () => {
      const result = await storageService.listFromMinio('');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getMinioMetadata', () => {
    beforeEach(() => {
      storageService.provider = STORAGE_PROVIDERS.MINIO;
    });

    test('should get file metadata from MinIO', async () => {
      const result = await storageService.getMinioMetadata('test-file.jpg');

      expect(result).toMatchObject({
        size: expect.any(Number),
        contentType: expect.any(String),
        lastModified: expect.any(Date)
      });
    });
  });

  describe('uploadFile (main method)', () => {
    test('should route to S3 upload when provider is S3', async () => {
      storageService.provider = STORAGE_PROVIDERS.S3;
      const spy = jest.spyOn(storageService, 'uploadToS3');

      await storageService.uploadFile(mockFile);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should route to MinIO upload when provider is MinIO', async () => {
      storageService.provider = STORAGE_PROVIDERS.MINIO;
      const spy = jest.spyOn(storageService, 'uploadToMinio');

      await storageService.uploadFile(mockFile);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should throw error for unsupported provider', async () => {
      storageService.provider = 'unsupported';

      await expect(storageService.uploadFile(mockFile))
        .rejects.toThrow('Unsupported storage provider');
    });

    test('should apply folder option', async () => {
      storageService.provider = STORAGE_PROVIDERS.S3;
      const spy = jest.spyOn(storageService, 'uploadToS3');

      await storageService.uploadFile(mockFile, { folder: 'images' });

      expect(spy).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining('images/')
      );
      spy.mockRestore();
    });
  });

  describe('downloadFile (main method)', () => {
    test('should route to correct download method based on provider', async () => {
      storageService.provider = STORAGE_PROVIDERS.S3;
      const spy = jest.spyOn(storageService, 'downloadFromS3');

      await storageService.downloadFile('test-file.jpg');

      expect(spy).toHaveBeenCalledWith('test-file.jpg');
      spy.mockRestore();
    });
  });

  describe('deleteFile (main method)', () => {
    test('should route to correct delete method based on provider', async () => {
      storageService.provider = STORAGE_PROVIDERS.S3;
      const spy = jest.spyOn(storageService, 'deleteFromS3');

      await storageService.deleteFile('test-file.jpg');

      expect(spy).toHaveBeenCalledWith('test-file.jpg');
      spy.mockRestore();
    });
  });

  describe('listFiles (main method)', () => {
    test('should route to correct list method based on provider', async () => {
      storageService.provider = STORAGE_PROVIDERS.S3;
      const spy = jest.spyOn(storageService, 'listFromS3');

      await storageService.listFiles('images/');

      expect(spy).toHaveBeenCalledWith('images/');
      spy.mockRestore();
    });
  });

  describe('getFileMetadata (main method)', () => {
    test('should route to correct metadata method based on provider', async () => {
      storageService.provider = STORAGE_PROVIDERS.S3;
      const spy = jest.spyOn(storageService, 'getS3Metadata');

      await storageService.getFileMetadata('test-file.jpg');

      expect(spy).toHaveBeenCalledWith('test-file.jpg');
      spy.mockRestore();
    });
  });
});
