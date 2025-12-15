const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { upload, handleMulterError } = require('../middleware/upload.middleware');

// Health check
router.get('/health', uploadController.healthCheck);

// Upload single file
router.post(
  '/upload',
  upload.single('file'),
  handleMulterError,
  uploadController.uploadSingle
);

// Upload multiple files
router.post(
  '/upload/multiple',
  upload.array('files', 10),
  handleMulterError,
  uploadController.uploadMultiple
);

// Download file
router.get('/files/:fileKey(*)', uploadController.downloadFile);

// Get file metadata
router.get('/metadata/:fileKey(*)', uploadController.getFileMetadata);

// List files
router.get('/files', uploadController.listFiles);

// Delete file
router.delete('/files/:fileKey(*)', uploadController.deleteFile);

module.exports = router;
