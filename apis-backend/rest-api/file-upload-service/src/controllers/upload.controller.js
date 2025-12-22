const storageService = require('../services/storage.service');
const validationService = require('../services/validation.service');
const { createLogger } = require('@vibe/shared-utils');
const logger = createLogger('file-upload-service:upload-controller');

class UploadController {
  /**
   * Upload a single file
   */
  async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      // Validate file
      const validation = await validationService.validateFile(req.file, {
        allowedExtensions: req.body.allowedExtensions?.split(','),
        imageDimensions: req.body.imageDimensions ? JSON.parse(req.body.imageDimensions) : null
      });

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      // Upload file
      const result = await storageService.uploadFile(req.file, {
        folder: req.body.folder,
        prefix: req.body.prefix
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: result
      });
    } catch (error) {
      logger.error('Upload error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload file',
        message: error.message
      });
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided'
        });
      }

      const uploadPromises = req.files.map(async (file) => {
        try {
          const validation = await validationService.validateFile(file);
          if (!validation.valid) {
            return {
              filename: file.originalname,
              success: false,
              errors: validation.errors
            };
          }

          const result = await storageService.uploadFile(file, {
            folder: req.body.folder,
            prefix: req.body.prefix
          });

          return {
            filename: file.originalname,
            success: true,
            data: result
          };
        } catch (error) {
          return {
            filename: file.originalname,
            success: false,
            error: error.message
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(r => r.success).length;

      res.status(successCount > 0 ? 201 : 400).json({
        success: successCount === results.length,
        message: `${successCount}/${results.length} files uploaded successfully`,
        results
      });
    } catch (error) {
      logger.error('Multiple upload error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload files',
        message: error.message
      });
    }
  }

  /**
   * Download a file
   */
  async downloadFile(req, res) {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(400).json({
          success: false,
          error: 'File key is required'
        });
      }

      const file = await storageService.downloadFile(fileKey);

      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Length', file.size);
      res.setHeader('Content-Disposition', `attachment; filename="${fileKey.split('/').pop()}"`);

      res.send(file.buffer);
    } catch (error) {
      logger.error('Download error', error);
      res.status(404).json({
        success: false,
        error: 'File not found',
        message: error.message
      });
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(req, res) {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(400).json({
          success: false,
          error: 'File key is required'
        });
      }

      const result = await storageService.deleteFile(fileKey);

      res.json({
        success: true,
        message: 'File deleted successfully',
        data: result
      });
    } catch (error) {
      logger.error('Delete error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete file',
        message: error.message
      });
    }
  }

  /**
   * List files
   */
  async listFiles(req, res) {
    try {
      const { prefix } = req.query;
      const files = await storageService.listFiles(prefix || '');

      res.json({
        success: true,
        data: {
          files,
          total: files.length
        }
      });
    } catch (error) {
      logger.error('List error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list files',
        message: error.message
      });
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(req, res) {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(400).json({
          success: false,
          error: 'File key is required'
        });
      }

      const metadata = await storageService.getFileMetadata(fileKey);

      res.json({
        success: true,
        data: metadata
      });
    } catch (error) {
      logger.error('Metadata error', error);
      res.status(404).json({
        success: false,
        error: 'File not found',
        message: error.message
      });
    }
  }

  /**
   * Health check
   */
  async healthCheck(req, res) {
    res.json({
      success: true,
      service: 'File Upload Service',
      status: 'OK',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new UploadController();
