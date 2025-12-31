/**
 * Usage Examples for Validation and Sanitization Utilities
 *
 * This file demonstrates how to use the validation utilities in real-world scenarios
 */

import {
  sanitizeHTML,
  sanitizeUserInput,
  hasSQLInjection,
  sanitizeFilename,
  sanitizeURL,
  isEmail,
  isPhoneNumber,
  validatePassword,
  isURL,
  isCreditCard,
  isIPAddress
} from './index';

// =============================================================================
// Example 1: User Registration Form Validation
// =============================================================================

export interface UserRegistrationInput {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export function validateUserRegistration(input: UserRegistrationInput) {
  const errors: Record<string, string> = {};

  // Sanitize username (remove XSS attempts)
  const cleanUsername = sanitizeUserInput(input.username, {
    allowHTML: false,
    maxLength: 50,
    stripWhitespace: true
  });

  // Validate email
  if (!isEmail(input.email)) {
    errors.email = 'Invalid email format';
  }

  // Validate password strength
  const passwordResult = validatePassword(input.password, {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  });

  if (!passwordResult.isValid) {
    errors.password = passwordResult.feedback.join(', ');
  }

  // Validate phone if provided
  if (input.phone && !isPhoneNumber(input.phone, 'TW')) {
    errors.phone = 'Invalid phone number format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: {
      username: cleanUsername,
      email: input.email.toLowerCase().trim(),
      password: input.password,
      phone: input.phone?.replace(/[\s\-()]/g, '')
    }
  };
}

// =============================================================================
// Example 2: Blog Post Content Sanitization
// =============================================================================

export interface BlogPostInput {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
}

export function sanitizeBlogPost(input: BlogPostInput) {
  return {
    // Strip all HTML from title
    title: sanitizeUserInput(input.title, {
      allowHTML: false,
      maxLength: 200,
      stripWhitespace: true
    }),

    // Allow safe HTML tags in content
    content: sanitizeHTML(input.content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'],
      allowedAttributes: {
        'a': ['href', 'title', 'rel'],
        'code': ['class'],
        'pre': ['class']
      },
      allowedProtocols: ['http', 'https']
    }),

    // Strip HTML from excerpt
    excerpt: sanitizeUserInput(input.excerpt, {
      allowHTML: false,
      maxLength: 500,
      stripWhitespace: true
    }),

    // Sanitize slug
    slug: input.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
  };
}

// =============================================================================
// Example 3: File Upload Validation
// =============================================================================

export interface FileUploadInput {
  filename: string;
  url?: string;
  size: number;
  mimetype: string;
}

export function validateFileUpload(input: FileUploadInput) {
  const errors: string[] = [];

  // Sanitize filename to prevent directory traversal
  const safeFilename = sanitizeFilename(input.filename);

  if (!safeFilename) {
    errors.push('Invalid filename');
  }

  // Validate file size (max 10MB)
  if (input.size > 10 * 1024 * 1024) {
    errors.push('File size exceeds 10MB limit');
  }

  // Validate URL if provided
  if (input.url && !isURL(input.url, { protocols: ['http', 'https'] })) {
    errors.push('Invalid file URL');
  }

  // Validate mime type
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
  ];

  if (!allowedMimeTypes.includes(input.mimetype)) {
    errors.push('File type not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedFilename: safeFilename
  };
}

// =============================================================================
// Example 4: Comment System with XSS Protection
// =============================================================================

export interface CommentInput {
  author: string;
  email: string;
  content: string;
  website?: string;
}

export function sanitizeComment(input: CommentInput) {
  const errors: Record<string, string> = {};

  // Sanitize author name
  const cleanAuthor = sanitizeUserInput(input.author, {
    allowHTML: false,
    maxLength: 100,
    stripWhitespace: true
  });

  if (!cleanAuthor) {
    errors.author = 'Author name is required';
  }

  // Validate email
  if (!isEmail(input.email)) {
    errors.email = 'Invalid email address';
  }

  // Sanitize content (allow basic formatting)
  const cleanContent = sanitizeHTML(input.content, {
    allowedTags: ['p', 'br', 'strong', 'em', 'a'],
    allowedAttributes: {
      'a': ['href', 'rel']
    },
    allowedProtocols: ['http', 'https']
  });

  if (!cleanContent) {
    errors.content = 'Comment content is required';
  }

  // Validate website URL if provided
  let cleanWebsite = '';
  if (input.website) {
    cleanWebsite = sanitizeURL(input.website);
    if (!cleanWebsite) {
      errors.website = 'Invalid website URL';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: {
      author: cleanAuthor,
      email: input.email.toLowerCase().trim(),
      content: cleanContent,
      website: cleanWebsite
    }
  };
}

// =============================================================================
// Example 5: Search Query Sanitization
// =============================================================================

export function sanitizeSearchQuery(query: string): {
  sanitized: string;
  isSafe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for SQL injection attempts
  if (hasSQLInjection(query)) {
    warnings.push('Potential SQL injection detected');
  }

  // Sanitize the query
  const sanitized = sanitizeUserInput(query, {
    allowHTML: false,
    maxLength: 200,
    stripWhitespace: true
  });

  return {
    sanitized,
    isSafe: warnings.length === 0,
    warnings
  };
}

// =============================================================================
// Example 6: API Input Validation
// =============================================================================

export interface APIRequestInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  filter?: Record<string, unknown>;
}

export function validateAPIRequest(input: APIRequestInput) {
  const errors: Record<string, string> = {};

  // Validate pagination
  if (input.page !== undefined) {
    const page = Number(input.page);
    if (!Number.isInteger(page) || page < 1) {
      errors.page = 'Page must be a positive integer';
    }
  }

  if (input.limit !== undefined) {
    const limit = Number(input.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      errors.limit = 'Limit must be between 1 and 100';
    }
  }

  // Validate sortBy
  if (input.sortBy) {
    const allowedFields = ['createdAt', 'updatedAt', 'name', 'email'];
    const sanitizedSort = sanitizeUserInput(input.sortBy, {
      allowHTML: false,
      maxLength: 50
    });

    if (!allowedFields.includes(sanitizedSort)) {
      errors.sortBy = 'Invalid sort field';
    }
  }

  // Check filter for SQL injection
  if (input.filter) {
    for (const [key, value] of Object.entries(input.filter)) {
      if (typeof value === 'string' && hasSQLInjection(value)) {
        errors[`filter.${key}`] = 'Invalid filter value';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// =============================================================================
// Example 7: Payment Information Validation
// =============================================================================

export interface PaymentInput {
  cardNumber: string;
  email: string;
  amount: number;
}

export function validatePayment(input: PaymentInput) {
  const errors: Record<string, string> = {};

  // Validate credit card
  const cleanCardNumber = input.cardNumber.replace(/[\s-]/g, '');
  if (!isCreditCard(cleanCardNumber)) {
    errors.cardNumber = 'Invalid credit card number';
  }

  // Validate email
  if (!isEmail(input.email)) {
    errors.email = 'Invalid email address';
  }

  // Validate amount
  if (typeof input.amount !== 'number' || input.amount <= 0) {
    errors.amount = 'Amount must be a positive number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: {
      cardNumber: cleanCardNumber,
      email: input.email.toLowerCase().trim(),
      amount: input.amount
    }
  };
}

// =============================================================================
// Example 8: IP Address Whitelist Validation
// =============================================================================

export function validateIPWhitelist(ip: string, allowedIPs: string[]) {
  // Validate IP format
  if (!isIPAddress(ip)) {
    return {
      isValid: false,
      error: 'Invalid IP address format'
    };
  }

  // Check if IP is in whitelist
  const isAllowed = allowedIPs.includes(ip);

  return {
    isValid: isAllowed,
    error: isAllowed ? null : 'IP address not in whitelist'
  };
}

// =============================================================================
// Example 9: Express Middleware Integration
// =============================================================================

export const createSanitizationMiddleware = () => {
  return (req: Record<string, unknown>, res: Record<string, unknown>, next: () => void) => {
    // Sanitize query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = sanitizeUserInput(value, {
            allowHTML: false,
            maxLength: 500
          });
        }
      }
    }

    // Sanitize body
    if (req.body) {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          // Check for SQL injection
          if (hasSQLInjection(value)) {
            return res.status(400).json({
              error: 'Invalid input detected',
              field: key
            });
          }

          // Sanitize
          req.body[key] = sanitizeUserInput(value, {
            allowHTML: false,
            maxLength: 10000
          });
        }
      }
    }

    next();
  };
};

// =============================================================================
// Example 10: Batch Validation
// =============================================================================

export function validateEmailList(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    const cleaned = email.trim().toLowerCase();
    if (isEmail(cleaned)) {
      valid.push(cleaned);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}
