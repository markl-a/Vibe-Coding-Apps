const multer = require('multer');
const { storageConfig } = require('../config/storage');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  if (storageConfig.allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: storageConfig.maxFileSize
  },
  fileFilter
});

// Error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: `Maximum file size is ${storageConfig.maxFileSize / 1024 / 1024}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: err.message
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: err.message
    });
  }

  next();
};

module.exports = {
  upload,
  handleMulterError
};
