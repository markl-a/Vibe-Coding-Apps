const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const {
  STORAGE_PROVIDERS,
  s3Client,
  gcsClient,
  minioClient,
  storageConfig
} = require('../config/storage');

class StorageService {
  constructor() {
    this.provider = storageConfig.provider;
    this.bucket = storageConfig.bucket;
  }

  /**
   * Upload file to cloud storage
   */
  async uploadFile(file, options = {}) {
    const fileName = this.generateFileName(file.originalname, options.prefix);
    const fileKey = options.folder ? `${options.folder}/${fileName}` : fileName;

    switch (this.provider) {
      case STORAGE_PROVIDERS.S3:
        return await this.uploadToS3(file, fileKey);
      case STORAGE_PROVIDERS.GCS:
        return await this.uploadToGCS(file, fileKey);
      case STORAGE_PROVIDERS.MINIO:
        return await this.uploadToMinio(file, fileKey);
      case STORAGE_PROVIDERS.LOCAL:
        return await this.uploadToLocal(file, fileKey);
      default:
        throw new Error(`Unsupported storage provider: ${this.provider}`);
    }
  }

  /**
   * Download file from cloud storage
   */
  async downloadFile(fileKey) {
    switch (this.provider) {
      case STORAGE_PROVIDERS.S3:
        return await this.downloadFromS3(fileKey);
      case STORAGE_PROVIDERS.GCS:
        return await this.downloadFromGCS(fileKey);
      case STORAGE_PROVIDERS.MINIO:
        return await this.downloadFromMinio(fileKey);
      case STORAGE_PROVIDERS.LOCAL:
        return await this.downloadFromLocal(fileKey);
      default:
        throw new Error(`Unsupported storage provider: ${this.provider}`);
    }
  }

  /**
   * Delete file from cloud storage
   */
  async deleteFile(fileKey) {
    switch (this.provider) {
      case STORAGE_PROVIDERS.S3:
        return await this.deleteFromS3(fileKey);
      case STORAGE_PROVIDERS.GCS:
        return await this.deleteFromGCS(fileKey);
      case STORAGE_PROVIDERS.MINIO:
        return await this.deleteFromMinio(fileKey);
      case STORAGE_PROVIDERS.LOCAL:
        return await this.deleteFromLocal(fileKey);
      default:
        throw new Error(`Unsupported storage provider: ${this.provider}`);
    }
  }

  /**
   * List files in cloud storage
   */
  async listFiles(prefix = '') {
    switch (this.provider) {
      case STORAGE_PROVIDERS.S3:
        return await this.listFromS3(prefix);
      case STORAGE_PROVIDERS.GCS:
        return await this.listFromGCS(prefix);
      case STORAGE_PROVIDERS.MINIO:
        return await this.listFromMinio(prefix);
      case STORAGE_PROVIDERS.LOCAL:
        return await this.listFromLocal(prefix);
      default:
        throw new Error(`Unsupported storage provider: ${this.provider}`);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileKey) {
    switch (this.provider) {
      case STORAGE_PROVIDERS.S3:
        return await this.getS3Metadata(fileKey);
      case STORAGE_PROVIDERS.GCS:
        return await this.getGCSMetadata(fileKey);
      case STORAGE_PROVIDERS.MINIO:
        return await this.getMinioMetadata(fileKey);
      case STORAGE_PROVIDERS.LOCAL:
        return await this.getLocalMetadata(fileKey);
      default:
        throw new Error(`Unsupported storage provider: ${this.provider}`);
    }
  }

  // S3 Operations
  async uploadToS3(file, fileKey) {
    const params = {
      Bucket: this.bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private'
    };

    const result = await s3Client.upload(params).promise();
    return {
      fileKey,
      url: result.Location,
      provider: STORAGE_PROVIDERS.S3,
      size: file.size,
      mimetype: file.mimetype
    };
  }

  async downloadFromS3(fileKey) {
    const params = {
      Bucket: this.bucket,
      Key: fileKey
    };

    const result = await s3Client.getObject(params).promise();
    return {
      buffer: result.Body,
      contentType: result.ContentType,
      size: result.ContentLength
    };
  }

  async deleteFromS3(fileKey) {
    const params = {
      Bucket: this.bucket,
      Key: fileKey
    };

    await s3Client.deleteObject(params).promise();
    return { success: true, fileKey };
  }

  async listFromS3(prefix) {
    const params = {
      Bucket: this.bucket,
      Prefix: prefix
    };

    const result = await s3Client.listObjectsV2(params).promise();
    return result.Contents.map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified
    }));
  }

  async getS3Metadata(fileKey) {
    const params = {
      Bucket: this.bucket,
      Key: fileKey
    };

    const result = await s3Client.headObject(params).promise();
    return {
      size: result.ContentLength,
      contentType: result.ContentType,
      lastModified: result.LastModified,
      etag: result.ETag
    };
  }

  // GCS Operations
  async uploadToGCS(file, fileKey) {
    if (!gcsClient) {
      throw new Error('GCS client not configured');
    }

    const bucket = gcsClient.bucket(this.bucket);
    const blob = bucket.file(fileKey);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname
      }
    });

    return {
      fileKey,
      url: `gs://${this.bucket}/${fileKey}`,
      provider: STORAGE_PROVIDERS.GCS,
      size: file.size,
      mimetype: file.mimetype
    };
  }

  async downloadFromGCS(fileKey) {
    if (!gcsClient) {
      throw new Error('GCS client not configured');
    }

    const bucket = gcsClient.bucket(this.bucket);
    const file = bucket.file(fileKey);
    const [buffer] = await file.download();
    const [metadata] = await file.getMetadata();

    return {
      buffer,
      contentType: metadata.contentType,
      size: metadata.size
    };
  }

  async deleteFromGCS(fileKey) {
    if (!gcsClient) {
      throw new Error('GCS client not configured');
    }

    const bucket = gcsClient.bucket(this.bucket);
    await bucket.file(fileKey).delete();
    return { success: true, fileKey };
  }

  async listFromGCS(prefix) {
    if (!gcsClient) {
      throw new Error('GCS client not configured');
    }

    const bucket = gcsClient.bucket(this.bucket);
    const [files] = await bucket.getFiles({ prefix });

    return files.map(file => ({
      key: file.name,
      size: parseInt(file.metadata.size),
      lastModified: new Date(file.metadata.updated)
    }));
  }

  async getGCSMetadata(fileKey) {
    if (!gcsClient) {
      throw new Error('GCS client not configured');
    }

    const bucket = gcsClient.bucket(this.bucket);
    const file = bucket.file(fileKey);
    const [metadata] = await file.getMetadata();

    return {
      size: parseInt(metadata.size),
      contentType: metadata.contentType,
      lastModified: new Date(metadata.updated),
      etag: metadata.etag
    };
  }

  // MinIO Operations
  async uploadToMinio(file, fileKey) {
    const metaData = {
      'Content-Type': file.mimetype
    };

    await minioClient.putObject(
      this.bucket,
      fileKey,
      file.buffer,
      file.size,
      metaData
    );

    return {
      fileKey,
      url: `/api/files/${fileKey}`,
      provider: STORAGE_PROVIDERS.MINIO,
      size: file.size,
      mimetype: file.mimetype
    };
  }

  async downloadFromMinio(fileKey) {
    const dataStream = await minioClient.getObject(this.bucket, fileKey);
    const chunks = [];

    return new Promise((resolve, reject) => {
      dataStream.on('data', chunk => chunks.push(chunk));
      dataStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ buffer, contentType: 'application/octet-stream', size: buffer.length });
      });
      dataStream.on('error', reject);
    });
  }

  async deleteFromMinio(fileKey) {
    await minioClient.removeObject(this.bucket, fileKey);
    return { success: true, fileKey };
  }

  async listFromMinio(prefix) {
    const stream = minioClient.listObjects(this.bucket, prefix, true);
    const files = [];

    return new Promise((resolve, reject) => {
      stream.on('data', obj => {
        files.push({
          key: obj.name,
          size: obj.size,
          lastModified: obj.lastModified
        });
      });
      stream.on('end', () => resolve(files));
      stream.on('error', reject);
    });
  }

  async getMinioMetadata(fileKey) {
    const stat = await minioClient.statObject(this.bucket, fileKey);
    return {
      size: stat.size,
      contentType: stat.metaData['content-type'],
      lastModified: stat.lastModified,
      etag: stat.etag
    };
  }

  // Local Storage Operations
  async uploadToLocal(file, fileKey) {
    const uploadDir = process.env.LOCAL_UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, fileKey);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    return {
      fileKey,
      url: `/api/files/${fileKey}`,
      provider: STORAGE_PROVIDERS.LOCAL,
      size: file.size,
      mimetype: file.mimetype
    };
  }

  async downloadFromLocal(fileKey) {
    const uploadDir = process.env.LOCAL_UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, fileKey);
    const buffer = await fs.readFile(filePath);

    return {
      buffer,
      contentType: 'application/octet-stream',
      size: buffer.length
    };
  }

  async deleteFromLocal(fileKey) {
    const uploadDir = process.env.LOCAL_UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, fileKey);
    await fs.unlink(filePath);
    return { success: true, fileKey };
  }

  async listFromLocal(prefix) {
    const uploadDir = process.env.LOCAL_UPLOAD_DIR || './uploads';
    const searchDir = path.join(uploadDir, prefix);

    try {
      const files = await fs.readdir(searchDir, { withFileTypes: true });
      const result = [];

      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(searchDir, file.name);
          const stats = await fs.stat(filePath);
          result.push({
            key: path.join(prefix, file.name),
            size: stats.size,
            lastModified: stats.mtime
          });
        }
      }

      return result;
    } catch (error) {
      return [];
    }
  }

  async getLocalMetadata(fileKey) {
    const uploadDir = process.env.LOCAL_UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, fileKey);
    const stats = await fs.stat(filePath);

    return {
      size: stats.size,
      contentType: 'application/octet-stream',
      lastModified: stats.mtime,
      etag: null
    };
  }

  // Helper methods
  generateFileName(originalName, prefix = '') {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const uuid = uuidv4().slice(0, 8);
    return prefix
      ? `${prefix}-${timestamp}-${uuid}${ext}`
      : `${name}-${timestamp}-${uuid}${ext}`;
  }
}

module.exports = new StorageService();
