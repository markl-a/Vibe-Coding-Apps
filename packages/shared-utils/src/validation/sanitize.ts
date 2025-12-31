/**
 * Sanitization utilities for preventing XSS, SQL injection, and other security vulnerabilities
 */

/**
 * Configuration options for HTML sanitization
 */
export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  allowDataAttributes?: boolean;
  allowedProtocols?: string[];
}

/**
 * Default safe HTML tags
 */
const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'span', 'div'
];

/**
 * Default allowed attributes per tag
 */
const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'div': ['class', 'id'],
  'span': ['class', 'id'],
  'p': ['class'],
  'code': ['class'],
  'pre': ['class']
};

/**
 * Safe URL protocols
 */
const DEFAULT_ALLOWED_PROTOCOLS = ['http', 'https', 'mailto', 'tel'];

/**
 * XSS-dangerous patterns to remove
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
  /<meta\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
];

/**
 * SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
  /(--|\;|\/\*|\*\/)/g,
  /(\bOR\b.*=.*)/gi,
  /('|(\\')|(--)|(\#)|(%23)|(\/\*))/gi,
];

/**
 * Sanitize string to prevent XSS attacks
 * Removes dangerous HTML/JavaScript patterns
 */
export function sanitizeXSS(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove dangerous patterns
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

/**
 * Sanitize HTML while preserving allowed tags and attributes
 */
export function sanitizeHTML(
  html: string,
  options: SanitizeOptions = {}
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const allowedTags = options.allowedTags || DEFAULT_ALLOWED_TAGS;
  const allowedAttributes = options.allowedAttributes || DEFAULT_ALLOWED_ATTRIBUTES;
  const allowedProtocols = options.allowedProtocols || DEFAULT_ALLOWED_PROTOCOLS;

  let sanitized = html;

  // First, remove all dangerous patterns
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove all tags except allowed ones
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    if (!allowedTags.includes(tagName.toLowerCase())) {
      return '';
    }

    // Clean attributes
    const attributeRegex = /\s([a-z\-]+)=["']([^"']*)["']/gi;
    let cleanMatch = `<${tagName}`;
    const allowedAttrs = allowedAttributes[tagName.toLowerCase()] || [];

    let attrMatch;
    while ((attrMatch = attributeRegex.exec(match)) !== null) {
      const [, attrName, attrValue] = attrMatch;

      // Check if attribute exists
      if (!attrName || !attrValue) continue;

      // Check if attribute is allowed
      if (allowedAttrs.includes(attrName.toLowerCase())) {
        // Validate URL attributes
        if (['href', 'src'].includes(attrName.toLowerCase())) {
          const protocol = attrValue.split(':')[0]?.toLowerCase();
          if ((protocol && allowedProtocols.includes(protocol)) || attrValue.startsWith('/') || attrValue.startsWith('#')) {
            cleanMatch += ` ${attrName}="${attrValue}"`;
          }
        } else {
          // For non-URL attributes, encode special characters
          const cleanValue = attrValue
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
          cleanMatch += ` ${attrName}="${cleanValue}"`;
        }
      } else if (options.allowDataAttributes && attrName.startsWith('data-')) {
        const cleanValue = attrValue
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
        cleanMatch += ` ${attrName}="${cleanValue}"`;
      }
    }

    cleanMatch += match.includes('/>') ? ' />' : '>';
    return cleanMatch;
  });

  return sanitized;
}

/**
 * Check if string contains potential SQL injection patterns
 */
export function hasSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize SQL input by escaping special characters
 * Note: This is basic sanitization. Always use parameterized queries!
 */
export function sanitizeSQL(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
}

/**
 * Remove all HTML tags from string
 */
export function stripHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize filename to prevent directory traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe characters
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}

/**
 * Sanitize URL to prevent malicious redirects
 */
export function sanitizeURL(url: string, allowedDomains?: string[]): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(url);

    // Check protocol
    if (!DEFAULT_ALLOWED_PROTOCOLS.includes(parsed.protocol.replace(':', ''))) {
      return '';
    }

    // Check domain if allowed domains specified
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );
      if (!isAllowed) {
        return '';
      }
    }

    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Escape special regex characters in string
 */
export function escapeRegExp(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize JSON input to prevent prototype pollution
 */
export function sanitizeJSON(input: string): Record<string, unknown> | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(input);

    // Remove dangerous keys
    const dangerous = ['__proto__', 'constructor', 'prototype'];

    const sanitize = (obj: unknown): unknown => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      const clean: Record<string, unknown> = {};
      for (const key in obj as Record<string, unknown>) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && !dangerous.includes(key)) {
          clean[key] = sanitize((obj as Record<string, unknown>)[key]);
        }
      }

      return clean;
    };

    return sanitize(parsed);
  } catch {
    return null;
  }
}

/**
 * Sanitize user input for display
 * Combines multiple sanitization strategies
 */
export function sanitizeUserInput(
  input: string,
  options: {
    allowHTML?: boolean;
    maxLength?: number;
    stripWhitespace?: boolean;
  } = {}
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Trim whitespace if requested
  if (options.stripWhitespace) {
    sanitized = sanitized.trim();
  }

  // Enforce max length
  if (options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Sanitize based on HTML allowance
  if (options.allowHTML) {
    sanitized = sanitizeHTML(sanitized);
  } else {
    sanitized = sanitizeXSS(sanitized);
  }

  return sanitized;
}
