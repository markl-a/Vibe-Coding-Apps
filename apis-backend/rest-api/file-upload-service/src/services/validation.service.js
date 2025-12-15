const mime = require('mime-types');
const { storageConfig } = require('../config/storage');

class ValidationService {
  /**
   * Validate file size
   */
  validateFileSize(file) {
    if (file.size > storageConfig.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${storageConfig.maxFileSize / 1024 / 1024}MB`
      };
    }
    return { valid: true };
  }

  /**
   * Validate file type
   */
  validateFileType(file) {
    if (!storageConfig.allowedFileTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed. Allowed types: ${storageConfig.allowedFileTypes.join(', ')}`
      };
    }
    return { valid: true };
  }

  /**
   * Validate file extension
   */
  validateFileExtension(filename, allowedExtensions = []) {
    if (allowedExtensions.length === 0) {
      return { valid: true };
    }

    const ext = filename.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File extension .${ext} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
      };
    }
    return { valid: true };
  }

  /**
   * Validate file name
   */
  validateFileName(filename) {
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(filename)) {
      return {
        valid: false,
        error: 'File name contains invalid characters'
      };
    }

    if (filename.length > 255) {
      return {
        valid: false,
        error: 'File name is too long (max 255 characters)'
      };
    }

    return { valid: true };
  }

  /**
   * Validate image dimensions (if applicable)
   */
  async validateImageDimensions(buffer, options = {}) {
    const { maxWidth, maxHeight, minWidth, minHeight } = options;

    if (!maxWidth && !maxHeight && !minWidth && !minHeight) {
      return { valid: true };
    }

    try {
      const sharp = require('sharp');
      const metadata = await sharp(buffer).metadata();

      if (maxWidth && metadata.width > maxWidth) {
        return {
          valid: false,
          error: `Image width ${metadata.width}px exceeds maximum ${maxWidth}px`
        };
      }

      if (maxHeight && metadata.height > maxHeight) {
        return {
          valid: false,
          error: `Image height ${metadata.height}px exceeds maximum ${maxHeight}px`
        };
      }

      if (minWidth && metadata.width < minWidth) {
        return {
          valid: false,
          error: `Image width ${metadata.width}px is below minimum ${minWidth}px`
        };
      }

      if (minHeight && metadata.height < minHeight) {
        return {
          valid: false,
          error: `Image height ${metadata.height}px is below minimum ${minHeight}px`
        };
      }

      return { valid: true, dimensions: { width: metadata.width, height: metadata.height } };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate image dimensions'
      };
    }
  }

  /**
   * Validate complete file
   */
  async validateFile(file, options = {}) {
    const errors = [];

    // Validate file name
    const nameValidation = this.validateFileName(file.originalname);
    if (!nameValidation.valid) {
      errors.push(nameValidation.error);
    }

    // Validate file size
    const sizeValidation = this.validateFileSize(file);
    if (!sizeValidation.valid) {
      errors.push(sizeValidation.error);
    }

    // Validate file type
    const typeValidation = this.validateFileType(file);
    if (!typeValidation.valid) {
      errors.push(typeValidation.error);
    }

    // Validate file extension if specified
    if (options.allowedExtensions) {
      const extValidation = this.validateFileExtension(
        file.originalname,
        options.allowedExtensions
      );
      if (!extValidation.valid) {
        errors.push(extValidation.error);
      }
    }

    // Validate image dimensions if it's an image
    if (file.mimetype.startsWith('image/') && options.imageDimensions) {
      const dimValidation = await this.validateImageDimensions(
        file.buffer,
        options.imageDimensions
      );
      if (!dimValidation.valid) {
        errors.push(dimValidation.error);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Sanitize file name
   */
  sanitizeFileName(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 255);
  }

  /**
   * Check if file is an image
   */
  isImage(mimetype) {
    return mimetype.startsWith('image/');
  }

  /**
   * Check if file is a document
   */
  isDocument(mimetype) {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    return documentTypes.includes(mimetype);
  }

  /**
   * Get file category
   */
  getFileCategory(mimetype) {
    if (this.isImage(mimetype)) return 'image';
    if (this.isDocument(mimetype)) return 'document';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'other';
  }
}

module.exports = new ValidationService();
