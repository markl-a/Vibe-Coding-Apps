import { describe, it, expect } from 'vitest';
import {
  sanitizeXSS,
  sanitizeHTML,
  hasSQLInjection,
  sanitizeSQL,
  stripHTML,
  sanitizeFilename,
  sanitizeURL,
  sanitizeJSON,
  sanitizeUserInput,
  escapeRegExp
} from '../validation/sanitize';

describe('Sanitization Utilities', () => {
  describe('sanitizeXSS', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeXSS(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should encode HTML entities', () => {
      const input = '<div>Test & "quotes"</div>';
      const result = sanitizeXSS(input);
      expect(result).toBe('&lt;div&gt;Test &amp; &quot;quotes&quot;&lt;&#x2F;div&gt;');
    });

    it('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeXSS(input);
      expect(result).not.toContain('onerror');
    });

    it('should handle empty input', () => {
      expect(sanitizeXSS('')).toBe('');
      expect(sanitizeXSS(null as any)).toBe('');
    });
  });

  describe('sanitizeHTML', () => {
    it('should preserve allowed tags', () => {
      const input = '<p>Safe content</p>';
      const result = sanitizeHTML(input);
      expect(result).toContain('<p>');
      expect(result).toContain('Safe content');
    });

    it('should remove dangerous tags', () => {
      const input = '<p>Safe</p><script>alert("bad")</script>';
      const result = sanitizeHTML(input);
      expect(result).toContain('<p>');
      expect(result).not.toContain('<script>');
    });

    it('should filter attributes', () => {
      const input = '<a href="https://example.com" onclick="alert(1)">Link</a>';
      const result = sanitizeHTML(input);
      expect(result).toContain('href');
      expect(result).not.toContain('onclick');
    });

    it('should respect custom allowed tags', () => {
      const input = '<h1>Title</h1><p>Text</p>';
      const result = sanitizeHTML(input, {
        allowedTags: ['h1']
      });
      expect(result).toContain('<h1>');
      expect(result).not.toContain('<p>');
    });

    it('should validate URL protocols', () => {
      const input = '<a href="javascript:alert(1)">Bad</a>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('SQL Injection Detection', () => {
    it('should detect SQL injection attempts', () => {
      expect(hasSQLInjection("admin' OR '1'='1")).toBe(true);
      expect(hasSQLInjection("1; DROP TABLE users--")).toBe(true);
      expect(hasSQLInjection("UNION SELECT * FROM passwords")).toBe(true);
    });

    it('should not flag normal input', () => {
      expect(hasSQLInjection("John Doe")).toBe(false);
      expect(hasSQLInjection("user@example.com")).toBe(false);
    });

    it('should sanitize SQL strings', () => {
      const input = "admin'--";
      const result = sanitizeSQL(input);
      expect(result).not.toContain("'--");
      expect(result).toContain("''");
    });
  });

  describe('stripHTML', () => {
    it('should remove all HTML tags', () => {
      const input = '<h1>Title</h1><p>Content</p>';
      const result = stripHTML(input);
      expect(result).toBe('TitleContent');
    });

    it('should handle nested tags', () => {
      const input = '<div><span>Nested</span></div>';
      const result = stripHTML(input);
      expect(result).toBe('Nested');
    });
  });

  describe('sanitizeFilename', () => {
    it('should prevent directory traversal', () => {
      const input = '../../../etc/passwd';
      const result = sanitizeFilename(input);
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    it('should remove unsafe characters', () => {
      const input = 'my file (1).txt';
      const result = sanitizeFilename(input);
      expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    it('should limit length', () => {
      const input = 'a'.repeat(300);
      const result = sanitizeFilename(input);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should remove leading dots', () => {
      const input = '...hidden.txt';
      const result = sanitizeFilename(input);
      expect(result).not.toMatch(/^\./);
    });
  });

  describe('sanitizeURL', () => {
    it('should validate safe URLs', () => {
      const input = 'https://example.com/path';
      const result = sanitizeURL(input);
      expect(result).toBe(input);
    });

    it('should reject dangerous protocols', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    it('should enforce domain whitelist', () => {
      const allowed = ['example.com'];
      expect(sanitizeURL('https://example.com', allowed)).toBeTruthy();
      expect(sanitizeURL('https://evil.com', allowed)).toBe('');
    });

    it('should allow subdomains', () => {
      const allowed = ['example.com'];
      const result = sanitizeURL('https://sub.example.com', allowed);
      expect(result).toBeTruthy();
    });
  });

  describe('escapeRegExp', () => {
    it('should escape special regex characters', () => {
      const input = 'Hello (world) [test]';
      const result = escapeRegExp(input);
      expect(result).toBe('Hello \\(world\\) \\[test\\]');
    });

    it('should escape all special chars', () => {
      const input = '.*+?^${}()|[]\\';
      const result = escapeRegExp(input);
      expect(() => new RegExp(result)).not.toThrow();
    });
  });

  describe('sanitizeJSON', () => {
    it('should parse valid JSON', () => {
      const input = '{"name": "test", "value": 123}';
      const result = sanitizeJSON(input);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should remove __proto__', () => {
      const input = '{"__proto__": {"isAdmin": true}, "name": "user"}';
      const result = sanitizeJSON(input);
      expect(result).toEqual({ name: 'user' });
      expect(result).not.toHaveProperty('__proto__');
    });

    it('should remove constructor and prototype', () => {
      const input = '{"constructor": "bad", "prototype": "evil"}';
      const result = sanitizeJSON(input);
      expect(result).toEqual({});
    });

    it('should handle nested objects', () => {
      const input = '{"data": {"__proto__": "bad", "value": "good"}}';
      const result = sanitizeJSON(input);
      expect(result).toEqual({ data: { value: 'good' } });
    });

    it('should return null for invalid JSON', () => {
      const input = 'not valid json';
      const result = sanitizeJSON(input);
      expect(result).toBeNull();
    });
  });

  describe('sanitizeUserInput', () => {
    it('should apply multiple sanitization strategies', () => {
      const input = '  <script>alert(1)</script>Hello  ';
      const result = sanitizeUserInput(input, {
        allowHTML: false,
        stripWhitespace: true,
        maxLength: 100
      });
      expect(result).not.toContain('<script>');
      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });

    it('should respect maxLength', () => {
      const input = 'a'.repeat(100);
      const result = sanitizeUserInput(input, {
        maxLength: 50
      });
      expect(result.length).toBe(50);
    });

    it('should allow HTML when specified', () => {
      const input = '<p>Safe content</p>';
      const result = sanitizeUserInput(input, {
        allowHTML: true
      });
      expect(result).toContain('<p>');
    });

    it('should strip HTML by default', () => {
      const input = '<p>Content</p>';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('<p>');
    });
  });
});
