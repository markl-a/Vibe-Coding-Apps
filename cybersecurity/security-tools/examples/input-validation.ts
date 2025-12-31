/**
 * Secure Input Validation Example
 *
 * This example demonstrates comprehensive input validation and sanitization
 * to prevent security vulnerabilities:
 * 1. SQL Injection prevention
 * 2. XSS (Cross-Site Scripting) prevention
 * 3. Command Injection prevention
 * 4. Path Traversal prevention
 * 5. Email validation
 * 6. URL validation
 * 7. File upload validation
 *
 * Security Principles:
 * - Never trust user input
 * - Validate on server-side (client-side is convenience, not security)
 * - Use allowlists over denylists
 * - Sanitize output context-appropriately
 * - Fail securely (reject invalid input)
 *
 * Security Best Practices:
 * 1. Validate all input (type, length, format, range)
 * 2. Sanitize based on usage context (HTML, SQL, shell, etc.)
 * 3. Use parameterized queries for databases
 * 4. Encode output properly for display context
 * 5. Implement rate limiting on input endpoints
 * 6. Log validation failures for security monitoring
 */

import validator from 'validator';

// Type definitions
interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: any;
}

interface FileValidationOptions {
  maxSize: number;          // Maximum file size in bytes
  allowedTypes: string[];   // Allowed MIME types
  allowedExtensions: string[]; // Allowed file extensions
}

/**
 * Input Validator Class
 */
export class InputValidator {
  /**
   * Validate and sanitize string input
   *
   * @param input - Input string to validate
   * @param options - Validation options
   * @returns Validation result
   */
  public validateString(
    input: any,
    options: {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      allowEmpty?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];

    // Type check
    if (typeof input !== 'string') {
      return { valid: false, errors: ['Input must be a string'] };
    }

    // Empty check
    if (!options.allowEmpty && input.trim().length === 0) {
      errors.push('Input cannot be empty');
    }

    // Length validation
    if (options.minLength !== undefined && input.length < options.minLength) {
      errors.push(`Input must be at least ${options.minLength} characters`);
    }

    if (options.maxLength !== undefined && input.length > options.maxLength) {
      errors.push(`Input must not exceed ${options.maxLength} characters`);
    }

    // Pattern validation
    if (options.pattern && !options.pattern.test(input)) {
      errors.push('Input does not match required pattern');
    }

    // Sanitize (trim and remove null bytes)
    const sanitized = input.trim().replace(/\0/g, '');

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validate email address
   *
   * @param email - Email address to validate
   * @returns Validation result
   */
  public validateEmail(email: any): ValidationResult {
    const errors: string[] = [];

    if (typeof email !== 'string') {
      return { valid: false, errors: ['Email must be a string'] };
    }

    // Basic format validation
    if (!validator.isEmail(email)) {
      errors.push('Invalid email format');
    }

    // Length check (RFC 5321)
    if (email.length > 254) {
      errors.push('Email address too long (max 254 characters)');
    }

    // Normalize email (lowercase, trim)
    const sanitized = validator.normalizeEmail(email) || email.toLowerCase().trim();

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validate URL
   *
   * @param url - URL to validate
   * @param options - URL validation options
   * @returns Validation result
   */
  public validateURL(
    url: any,
    options: {
      protocols?: string[];
      requireProtocol?: boolean;
      allowQueryString?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];

    if (typeof url !== 'string') {
      return { valid: false, errors: ['URL must be a string'] };
    }

    const validatorOptions = {
      protocols: options.protocols || ['http', 'https'],
      require_protocol: options.requireProtocol ?? true,
      require_valid_protocol: true,
    };

    if (!validator.isURL(url, validatorOptions)) {
      errors.push('Invalid URL format');
    }

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    if (dangerousProtocols.some((proto) => url.toLowerCase().startsWith(proto))) {
      errors.push('URL contains dangerous protocol');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: url.trim(),
    };
  }

  /**
   * Validate integer
   *
   * @param value - Value to validate
   * @param options - Integer validation options
   * @returns Validation result
   */
  public validateInteger(
    value: any,
    options: {
      min?: number;
      max?: number;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];

    // Try to convert to integer
    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
      return { valid: false, errors: ['Value must be a valid integer'] };
    }

    // Range validation
    if (options.min !== undefined && parsed < options.min) {
      errors.push(`Value must be at least ${options.min}`);
    }

    if (options.max !== undefined && parsed > options.max) {
      errors.push(`Value must not exceed ${options.max}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: parsed,
    };
  }

  /**
   * Validate and sanitize HTML input (prevent XSS)
   *
   * @param html - HTML input to sanitize
   * @param allowedTags - Allowed HTML tags (allowlist approach)
   * @returns Validation result with sanitized HTML
   *
   * SECURITY: This is a basic example. Use DOMPurify or similar
   * libraries for production HTML sanitization.
   */
  public sanitizeHTML(
    html: string,
    allowedTags: string[] = []
  ): ValidationResult {
    const errors: string[] = [];

    if (typeof html !== 'string') {
      return { valid: false, errors: ['HTML must be a string'] };
    }

    // If no tags allowed, strip all HTML
    if (allowedTags.length === 0) {
      const sanitized = html.replace(/<[^>]*>/g, '');
      return { valid: true, errors: [], sanitized };
    }

    // Basic sanitization (NOT production-ready - use DOMPurify!)
    let sanitized = html;

    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');

    // Warn about limitations
    console.warn('⚠ Using basic HTML sanitization. Use DOMPurify for production!');

    return {
      valid: true,
      errors,
      sanitized,
    };
  }

  /**
   * Validate SQL input (prevent SQL injection)
   * NOTE: Best practice is to use parameterized queries, not sanitization
   *
   * @param input - Input to validate for SQL safety
   * @returns Validation result
   */
  public validateSQLInput(input: string): ValidationResult {
    const errors: string[] = [];

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(--|;|\/\*|\*\/)/g,
      /(\bOR\b.*=.*)/gi,
      /(\bAND\b.*=.*)/gi,
      /(\bUNION\b)/gi,
    ];

    sqlInjectionPatterns.forEach((pattern, index) => {
      if (pattern.test(input)) {
        errors.push(`Potential SQL injection detected (pattern ${index + 1})`);
      }
    });

    // IMPORTANT: This is detection only!
    // Always use parameterized queries for actual SQL safety
    if (errors.length > 0) {
      console.error('⚠ SQL injection attempt detected! Use parameterized queries!');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: input,
    };
  }

  /**
   * Validate file path (prevent path traversal)
   *
   * @param path - File path to validate
   * @param allowedBasePath - Allowed base directory
   * @returns Validation result
   */
  public validateFilePath(path: string, allowedBasePath: string = ''): ValidationResult {
    const errors: string[] = [];

    // Check for path traversal attempts
    const pathTraversalPatterns = [
      /\.\./g,  // Parent directory
      /~\//g,   // Home directory
      /\/\//g,  // Double slashes
    ];

    pathTraversalPatterns.forEach((pattern) => {
      if (pattern.test(path)) {
        errors.push('Path traversal attempt detected');
      }
    });

    // Check for null bytes (path termination attack)
    if (path.includes('\0')) {
      errors.push('Null byte detected in path');
    }

    // Validate against base path if provided
    if (allowedBasePath) {
      const normalizedPath = path.replace(/^\.\//, '');
      if (!normalizedPath.startsWith(allowedBasePath)) {
        errors.push('Path outside allowed directory');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: path,
    };
  }

  /**
   * Validate file upload
   *
   * @param file - File object with name, size, type
   * @param options - File validation options
   * @returns Validation result
   */
  public validateFileUpload(
    file: {
      name: string;
      size: number;
      type: string;
    },
    options: FileValidationOptions
  ): ValidationResult {
    const errors: string[] = [];

    // Validate file size
    if (file.size > options.maxSize) {
      errors.push(`File size exceeds maximum (${options.maxSize} bytes)`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Validate MIME type
    if (!options.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed`);
    }

    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !options.allowedExtensions.includes(extension)) {
      errors.push(`File extension .${extension} not allowed`);
    }

    // Check for double extensions (exploit attempt)
    const parts = file.name.split('.');
    if (parts.length > 2) {
      errors.push('Multiple file extensions detected (possible exploit)');
    }

    // Validate filename
    const fileNamePattern = /^[a-zA-Z0-9._-]+$/;
    if (!fileNamePattern.test(file.name)) {
      errors.push('Filename contains invalid characters');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: {
        name: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
        size: file.size,
        type: file.type,
      },
    };
  }

  /**
   * Validate command line input (prevent command injection)
   *
   * @param input - Command line input to validate
   * @returns Validation result
   */
  public validateCommandInput(input: string): ValidationResult {
    const errors: string[] = [];

    // Dangerous characters for command injection
    const dangerousChars = [';', '|', '&', '$', '`', '\n', '\r', '(', ')', '<', '>'];

    dangerousChars.forEach((char) => {
      if (input.includes(char)) {
        errors.push(`Dangerous character detected: ${char}`);
      }
    });

    // Command substitution patterns
    if (input.includes('$(') || input.includes('`')) {
      errors.push('Command substitution detected');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: input,
    };
  }

  /**
   * Validate credit card number (using Luhn algorithm)
   *
   * @param cardNumber - Credit card number to validate
   * @returns Validation result
   */
  public validateCreditCard(cardNumber: string): ValidationResult {
    const errors: string[] = [];

    // Remove spaces and hyphens
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    // Check if it's all digits
    if (!/^\d+$/.test(cleaned)) {
      errors.push('Credit card number must contain only digits');
    }

    // Check length (13-19 digits)
    if (cleaned.length < 13 || cleaned.length > 19) {
      errors.push('Credit card number must be 13-19 digits');
    }

    // Luhn algorithm validation
    if (!this.luhnCheck(cleaned)) {
      errors.push('Invalid credit card number (failed Luhn check)');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: cleaned,
    };
  }

  /**
   * Luhn algorithm for credit card validation
   */
  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate phone number
   *
   * @param phone - Phone number to validate
   * @param locale - Locale for phone validation
   * @returns Validation result
   */
  public validatePhone(phone: string, locale: string = 'en-US'): ValidationResult {
    const errors: string[] = [];

    // Use validator library for locale-specific validation
    if (!validator.isMobilePhone(phone, locale as any)) {
      errors.push(`Invalid phone number for locale ${locale}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: phone.replace(/\D/g, ''), // Keep only digits
    };
  }

  /**
   * Validate JSON input
   *
   * @param json - JSON string to validate
   * @param maxDepth - Maximum nesting depth
   * @returns Validation result
   */
  public validateJSON(json: string, maxDepth: number = 10): ValidationResult {
    const errors: string[] = [];

    try {
      const parsed = JSON.parse(json);

      // Check nesting depth (prevent stack overflow)
      const depth = this.getJSONDepth(parsed);
      if (depth > maxDepth) {
        errors.push(`JSON nesting too deep (max ${maxDepth})`);
      }

      return {
        valid: errors.length === 0,
        errors,
        sanitized: parsed,
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid JSON format'],
      };
    }
  }

  /**
   * Calculate JSON nesting depth
   */
  private getJSONDepth(obj: any, depth: number = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return depth;
    }

    const depths = Object.values(obj).map((value) =>
      this.getJSONDepth(value, depth + 1)
    );

    return depths.length > 0 ? Math.max(...depths) : depth;
  }
}

/**
 * Example: Comprehensive Input Validation Demonstration
 */
export function demonstrateInputValidation() {
  console.log('\n=== Secure Input Validation Example ===\n');

  const validator = new InputValidator();

  // =============================================================================
  // Test 1: String Validation
  // =============================================================================
  console.log('Test 1: String Validation');
  console.log('═════════════════════════════════════════════════════════\n');

  const testStrings = [
    { input: 'Valid username', options: { minLength: 3, maxLength: 20 } },
    { input: 'ab', options: { minLength: 3, maxLength: 20 } },
    { input: 'a'.repeat(25), options: { minLength: 3, maxLength: 20 } },
  ];

  testStrings.forEach(({ input, options }) => {
    console.log(`Input: "${input}"`);
    const result = validator.validateString(input, options);
    console.log(`Valid: ${result.valid}`);
    if (!result.valid) {
      console.log(`Errors: ${result.errors.join(', ')}`);
    }
    console.log('');
  });

  // =============================================================================
  // Test 2: Email Validation
  // =============================================================================
  console.log('Test 2: Email Validation');
  console.log('═════════════════════════════════════════════════════════\n');

  const testEmails = [
    'user@example.com',
    'invalid.email',
    'user+tag@example.co.uk',
    '@example.com',
  ];

  testEmails.forEach((email) => {
    console.log(`Email: "${email}"`);
    const result = validator.validateEmail(email);
    console.log(`Valid: ${result.valid}`);
    if (result.valid) {
      console.log(`Sanitized: ${result.sanitized}`);
    } else {
      console.log(`Errors: ${result.errors.join(', ')}`);
    }
    console.log('');
  });

  // =============================================================================
  // Test 3: URL Validation
  // =============================================================================
  console.log('Test 3: URL Validation');
  console.log('═════════════════════════════════════════════════════════\n');

  const testURLs = [
    'https://example.com',
    'http://example.com/path?query=value',
    'javascript:alert(1)',  // XSS attempt
    'not-a-url',
  ];

  testURLs.forEach((url) => {
    console.log(`URL: "${url}"`);
    const result = validator.validateURL(url);
    console.log(`Valid: ${result.valid}`);
    if (!result.valid) {
      console.log(`Errors: ${result.errors.join(', ')}`);
    }
    console.log('');
  });

  // =============================================================================
  // Test 4: SQL Injection Detection
  // =============================================================================
  console.log('Test 4: SQL Injection Detection');
  console.log('═════════════════════════════════════════════════════════\n');

  const sqlInputs = [
    'John Doe',
    "'; DROP TABLE users; --",
    '1 OR 1=1',
    'admin\' OR \'1\'=\'1',
  ];

  sqlInputs.forEach((input) => {
    console.log(`Input: "${input}"`);
    const result = validator.validateSQLInput(input);
    console.log(`Valid: ${result.valid}`);
    if (!result.valid) {
      console.log(`Errors: ${result.errors.join(', ')}`);
    }
    console.log('');
  });

  // =============================================================================
  // Test 5: Path Traversal Prevention
  // =============================================================================
  console.log('Test 5: Path Traversal Prevention');
  console.log('═════════════════════════════════════════════════════════\n');

  const filePaths = [
    'uploads/document.pdf',
    '../../../etc/passwd',
    'uploads/../config.json',
    'valid/path/file.txt',
  ];

  filePaths.forEach((path) => {
    console.log(`Path: "${path}"`);
    const result = validator.validateFilePath(path, 'uploads/');
    console.log(`Valid: ${result.valid}`);
    if (!result.valid) {
      console.log(`Errors: ${result.errors.join(', ')}`);
    }
    console.log('');
  });

  // =============================================================================
  // Test 6: File Upload Validation
  // =============================================================================
  console.log('Test 6: File Upload Validation');
  console.log('═════════════════════════════════════════════════════════\n');

  const fileOptions: FileValidationOptions = {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
  };

  const testFiles = [
    { name: 'photo.jpg', size: 1024 * 1024, type: 'image/jpeg' },
    { name: 'document.pdf', size: 10 * 1024 * 1024, type: 'application/pdf' }, // Too large
    { name: 'script.exe', size: 1024, type: 'application/exe' }, // Wrong type
  ];

  testFiles.forEach((file) => {
    console.log(`File: "${file.name}" (${file.size} bytes, ${file.type})`);
    const result = validator.validateFileUpload(file, fileOptions);
    console.log(`Valid: ${result.valid}`);
    if (!result.valid) {
      console.log(`Errors: ${result.errors.join(', ')}`);
    }
    console.log('');
  });

  // =============================================================================
  // Test 7: Command Injection Prevention
  // =============================================================================
  console.log('Test 7: Command Injection Prevention');
  console.log('═════════════════════════════════════════════════════════\n');

  const commandInputs = [
    'filename.txt',
    'file; rm -rf /',
    'file && cat /etc/passwd',
    'file | grep secret',
  ];

  commandInputs.forEach((input) => {
    console.log(`Command Input: "${input}"`);
    const result = validator.validateCommandInput(input);
    console.log(`Valid: ${result.valid}`);
    if (!result.valid) {
      console.log(`Errors: ${result.errors.join(', ')}`);
    }
    console.log('');
  });

  // =============================================================================
  // Best Practices Summary
  // =============================================================================
  console.log('═════════════════════════════════════════════════════════');
  console.log('Input Validation Best Practices:');
  console.log('═════════════════════════════════════════════════════════');
  console.log('General Principles:');
  console.log('  ✓ Never trust user input');
  console.log('  ✓ Validate on server-side (client-side is convenience)');
  console.log('  ✓ Use allowlists over denylists');
  console.log('  ✓ Validate type, length, format, and range');
  console.log('  ✓ Fail securely (reject invalid input)');
  console.log('');
  console.log('Specific Validations:');
  console.log('  ✓ SQL: Use parameterized queries (not sanitization)');
  console.log('  ✓ XSS: Sanitize HTML with DOMPurify or similar');
  console.log('  ✓ Command Injection: Avoid shell execution, use APIs');
  console.log('  ✓ Path Traversal: Validate against base directory');
  console.log('  ✓ File Uploads: Check size, type, and extension');
  console.log('  ✓ URLs: Verify protocol and format');
  console.log('  ✓ Emails: Use standard validation libraries');
  console.log('');
  console.log('Output Encoding:');
  console.log('  ✓ HTML context: Encode <, >, &, \', "');
  console.log('  ✓ JavaScript context: JSON.stringify');
  console.log('  ✓ URL context: encodeURIComponent');
  console.log('  ✓ SQL context: Use parameterized queries');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('=== Input Validation Example Complete ===\n');
}

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateInputValidation();
}
