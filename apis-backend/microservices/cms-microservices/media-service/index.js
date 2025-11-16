const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 6002;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const minioClient = new Minio.Client({
  endPoint: process.env.S3_ENDPOINT?.replace('http://', '').replace('https://', '') || 'localhost',
  port: parseInt(process.env.S3_PORT) || 9000,
  useSSL: process.env.S3_USE_SSL === 'true',
  accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.S3_SECRET_KEY || 'minioadmin'
});

const BUCKET = process.env.S3_BUCKET || 'media';

const initBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
      await minioClient.makeBucket(BUCKET, 'us-east-1');
      console.log(`✅ Bucket ${BUCKET} created`);
    } else {
      console.log(`✅ Connected to MinIO (Bucket: ${BUCKET})`);
    }
  } catch (error) {
    console.error('❌ MinIO error:', error);
  }
};

initBucket();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Media Service' });
});

// Upload file
app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const metaData = {
      'Content-Type': req.file.mimetype
    };

    await minioClient.putObject(
      BUCKET,
      fileName,
      req.file.buffer,
      req.file.size,
      metaData
    );

    res.status(201).json({
      message: 'File uploaded',
      file: {
        name: fileName,
        size: req.file.size,
        type: req.file.mimetype,
        url: `/api/media/${fileName}`
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get file
app.get('/api/media/:filename', async (req, res) => {
  try {
    const dataStream = await minioClient.getObject(BUCKET, req.params.filename);
    dataStream.pipe(res);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// List files
app.get('/api/media/list', async (req, res) => {
  try {
    const stream = minioClient.listObjects(BUCKET, '', true);
    const files = [];

    stream.on('data', (obj) => files.push({
      name: obj.name,
      size: obj.size,
      lastModified: obj.lastModified
    }));

    stream.on('end', () => {
      res.json({ files, total: files.length });
    });

    stream.on('error', (err) => {
      res.status(500).json({ error: 'Server error' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete file
app.delete('/api/media/:filename', async (req, res) => {
  try {
    await minioClient.removeObject(BUCKET, req.params.filename);
    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Media Service running on port ${PORT}`);
});
