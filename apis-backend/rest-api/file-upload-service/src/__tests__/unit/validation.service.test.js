const validationService = require('../../services/validation.service');
const { storageConfig } = require('../../config/storage');

describe('ValidationService - Unit Tests', () => {
  describe('validateFileSize', () => {
    test('should pass validation for file within size limit', () => {
      const file = { size: 5 * 1024 * 1024 }; // 5MB
      const result = validationService.validateFileSize(file);
      expect(result.valid).toBe(true);
    });

    test('should fail validation for file exceeding size limit', () => {
      const file = { size: 50 * 1024 * 1024 }; // 50MB
      const result = validationService.validateFileSize(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    test('should pass validation for file at exact size limit', () => {
      const file = { size: storageConfig.maxFileSize };
      const result = validationService.validateFileSize(file);
      expect(result.valid).toBe(true);
    });

    test('should fail validation for file just over size limit', () => {
      const file = { size: storageConfig.maxFileSize + 1 };
      const result = validationService.validateFileSize(file);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFileType', () => {
    test('should pass validation for allowed JPEG type', () => {
      const file = { mimetype: 'image/jpeg' };
      const result = validationService.validateFileType(file);
      expect(result.valid).toBe(true);
    });

    test('should pass validation for allowed PNG type', () => {
      const file = { mimetype: 'image/png' };
      const result = validationService.validateFileType(file);
      expect(result.valid).toBe(true);
    });

    test('should pass validation for allowed PDF type', () => {
      const file = { mimetype: 'application/pdf' };
      const result = validationService.validateFileType(file);
      expect(result.valid).toBe(true);
    });

    test('should fail validation for disallowed file type', () => {
      const file = { mimetype: 'application/x-executable' };
      const result = validationService.validateFileType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    test('should fail validation for video file type', () => {
      const file = { mimetype: 'video/mp4' };
      const result = validationService.validateFileType(file);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFileExtension', () => {
    test('should pass validation when no extensions specified', () => {
      const result = validationService.validateFileExtension('test.jpg', []);
      expect(result.valid).toBe(true);
    });

    test('should pass validation for allowed extension', () => {
      const result = validationService.validateFileExtension('test.jpg', ['jpg', 'png']);
      expect(result.valid).toBe(true);
    });

    test('should fail validation for disallowed extension', () => {
      const result = validationService.validateFileExtension('test.exe', ['jpg', 'png']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    test('should handle uppercase extensions', () => {
      const result = validationService.validateFileExtension('test.JPG', ['jpg', 'png']);
      expect(result.valid).toBe(true);
    });

    test('should handle files with multiple dots', () => {
      const result = validationService.validateFileExtension('my.file.test.jpg', ['jpg']);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateFileName', () => {
    test('should pass validation for normal filename', () => {
      const result = validationService.validateFileName('test-file_123.jpg');
      expect(result.valid).toBe(true);
    });

    test('should fail validation for filename with invalid characters', () => {
      const result = validationService.validateFileName('test<file>.jpg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('should fail validation for filename with forward slash', () => {
      const result = validationService.validateFileName('path/to/file.jpg');
      expect(result.valid).toBe(false);
    });

    test('should fail validation for filename with backslash', () => {
      const result = validationService.validateFileName('path\\to\\file.jpg');
      expect(result.valid).toBe(false);
    });

    test('should fail validation for filename exceeding 255 characters', () => {
      const longName = 'a'.repeat(256) + '.jpg';
      const result = validationService.validateFileName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should pass validation for filename with 255 characters', () => {
      const name = 'a'.repeat(251) + '.jpg'; // 255 total
      const result = validationService.validateFileName(name);
      expect(result.valid).toBe(true);
    });
  });

  describe('sanitizeFileName', () => {
    test('should remove invalid characters', () => {
      const result = validationService.sanitizeFileName('test<file>.jpg');
      expect(result).toBe('test_file_.jpg');
    });

    test('should replace spaces with underscores', () => {
      const result = validationService.sanitizeFileName('my test file.jpg');
      expect(result).toBe('my_test_file.jpg');
    });

    test('should collapse multiple underscores', () => {
      const result = validationService.sanitizeFileName('test___file.jpg');
      expect(result).toBe('test_file.jpg');
    });

    test('should truncate long filenames', () => {
      const longName = 'a'.repeat(300) + '.jpg';
      const result = validationService.sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    test('should preserve hyphens and dots', () => {
      const result = validationService.sanitizeFileName('my-test.file.v2.jpg');
      expect(result).toBe('my-test.file.v2.jpg');
    });
  });

  describe('isImage', () => {
    test('should return true for JPEG image', () => {
      expect(validationService.isImage('image/jpeg')).toBe(true);
    });

    test('should return true for PNG image', () => {
      expect(validationService.isImage('image/png')).toBe(true);
    });

    test('should return true for GIF image', () => {
      expect(validationService.isImage('image/gif')).toBe(true);
    });

    test('should return false for PDF document', () => {
      expect(validationService.isImage('application/pdf')).toBe(false);
    });

    test('should return false for video file', () => {
      expect(validationService.isImage('video/mp4')).toBe(false);
    });
  });

  describe('isDocument', () => {
    test('should return true for PDF', () => {
      expect(validationService.isDocument('application/pdf')).toBe(true);
    });

    test('should return true for plain text', () => {
      expect(validationService.isDocument('text/plain')).toBe(true);
    });

    test('should return true for CSV', () => {
      expect(validationService.isDocument('text/csv')).toBe(true);
    });

    test('should return false for image', () => {
      expect(validationService.isDocument('image/jpeg')).toBe(false);
    });

    test('should return false for video', () => {
      expect(validationService.isDocument('video/mp4')).toBe(false);
    });
  });

  describe('getFileCategory', () => {
    test('should return "image" for image files', () => {
      expect(validationService.getFileCategory('image/jpeg')).toBe('image');
      expect(validationService.getFileCategory('image/png')).toBe('image');
    });

    test('should return "document" for document files', () => {
      expect(validationService.getFileCategory('application/pdf')).toBe('document');
      expect(validationService.getFileCategory('text/plain')).toBe('document');
    });

    test('should return "video" for video files', () => {
      expect(validationService.getFileCategory('video/mp4')).toBe('video');
    });

    test('should return "audio" for audio files', () => {
      expect(validationService.getFileCategory('audio/mpeg')).toBe('audio');
    });

    test('should return "other" for unknown types', () => {
      expect(validationService.getFileCategory('application/octet-stream')).toBe('other');
    });
  });
});
