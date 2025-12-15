const AWS = require('aws-sdk');
const { Storage } = require('@google-cloud/storage');
const Minio = require('minio');
require('dotenv').config();

// Storage provider types
const STORAGE_PROVIDERS = {
  S3: 's3',
  GCS: 'gcs',
  MINIO: 'minio',
  LOCAL: 'local'
};

// AWS S3 Configuration
const s3Client = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Google Cloud Storage Configuration
const gcsClient = process.env.GCS_KEY_FILE
  ? new Storage({
      keyFilename: process.env.GCS_KEY_FILE,
      projectId: process.env.GCS_PROJECT_ID
    })
  : null;

// MinIO Configuration
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

// Storage configuration
const storageConfig = {
  provider: process.env.STORAGE_PROVIDER || STORAGE_PROVIDERS.S3,
  bucket: process.env.STORAGE_BUCKET || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/zip',
    'text/plain',
    'text/csv'
  ]
};

module.exports = {
  STORAGE_PROVIDERS,
  s3Client,
  gcsClient,
  minioClient,
  storageConfig
};
