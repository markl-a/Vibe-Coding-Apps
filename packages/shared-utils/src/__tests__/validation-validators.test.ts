import { describe, it, expect } from 'vitest';
import {
  isEmail,
  isURL,
  isPhoneNumber,
  validatePassword,
  isUUID,
  isCreditCard,
  isIPAddress,
  isDate,
  isISODate,
  isJSON,
  isHexColor,
  isPort,
  isMACAddress,
  isBase64,
  isJWT,
  isAlphanumeric,
  isNumeric,
  isInteger,
  isPositive,
  isNonNegative,
  isInRange,
  hasLength,
  isUsername,
  isSlug,
  isMongoId,
  isMimeType,
  hasExtension
} from '../validation/validators';

describe('Validation Utilities', () => {
  describe('isEmail', () => {
    it('should validate correct emails', () => {
      expect(isEmail('user@example.com')).toBe(true);
      expect(isEmail('john.doe@example.co.uk')).toBe(true);
      expect(isEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isEmail('invalid')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
      expect(isEmail('user@')).toBe(false);
      expect(isEmail('')).toBe(false);
    });
  });

  describe('isURL', () => {
    it('should validate URLs', () => {
      expect(isURL('https://example.com')).toBe(true);
      expect(isURL('http://example.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isURL('not a url')).toBe(false);
      expect(isURL('example.com')).toBe(false);
    });

    it('should respect protocol options', () => {
      expect(isURL('ftp://files.com', { protocols: ['ftp'] })).toBe(true);
      expect(isURL('ftp://files.com', { protocols: ['http', 'https'] })).toBe(false);
    });
  });

  describe('isPhoneNumber', () => {
    it('should validate Taiwan phone numbers', () => {
      expect(isPhoneNumber('0912345678', 'TW')).toBe(true);
      expect(isPhoneNumber('+886912345678', 'TW')).toBe(true);
      expect(isPhoneNumber('886 912 345 678', 'TW')).toBe(true);
    });

    it('should validate US phone numbers', () => {
      expect(isPhoneNumber('2025551234', 'US')).toBe(true);
      expect(isPhoneNumber('+1-555-123-4567', 'US')).toBe(true);
    });

    it('should validate international format', () => {
      expect(isPhoneNumber('+886912345678')).toBe(true);
      expect(isPhoneNumber('+1234567890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isPhoneNumber('123', 'TW')).toBe(false);
      expect(isPhoneNumber('abcd', 'US')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('MyP@ssw0rd123');
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.strength).toMatch(/strong|very-strong/);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('12345');
      expect(result.isValid).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
      expect(result.strength).toMatch(/very-weak|weak/);
    });

    it('should detect sequential patterns', () => {
      const result = validatePassword('12345678');
      expect(result.feedback.some(f => f.includes('sequential'))).toBe(true);
    });

    it('should provide detailed feedback', () => {
      const result = validatePassword('weak');
      expect(result.feedback).toContain('Password must be at least 8 characters');
    });

    it('should respect custom requirements', () => {
      const result = validatePassword('simple', {
        minLength: 5,
        requireUppercase: false,
        requireSpecialChars: false
      });
      expect(result.isValid).toBe(false); // Still needs numbers
    });
  });

  describe('isUUID', () => {
    it('should validate UUIDs', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000', 4)).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isUUID('not-a-uuid')).toBe(false);
      expect(isUUID('550e8400-e29b-41d4')).toBe(false);
    });

    it('should validate specific versions', () => {
      const v4 = '550e8400-e29b-41d4-a716-446655440000';
      expect(isUUID(v4, 4)).toBe(true);
      expect(isUUID(v4, 1)).toBe(false);
    });
  });

  describe('isCreditCard', () => {
    it('should validate credit card numbers using Luhn', () => {
      expect(isCreditCard('4532015112830366')).toBe(true); // Valid Visa
      expect(isCreditCard('6011-1111-1111-1117')).toBe(true); // Valid Discover
    });

    it('should reject invalid credit cards', () => {
      expect(isCreditCard('1234567890123456')).toBe(false);
      expect(isCreditCard('not a card')).toBe(false);
    });
  });

  describe('isIPAddress', () => {
    it('should validate IPv4', () => {
      expect(isIPAddress('192.168.1.1')).toBe(true);
      expect(isIPAddress('255.255.255.255')).toBe(true);
      expect(isIPAddress('192.168.1.1', 4)).toBe(true);
    });

    it('should validate IPv6', () => {
      expect(isIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(isIPAddress('2001:db8::1', 6)).toBe(true);
    });

    it('should reject invalid IPs', () => {
      expect(isIPAddress('256.256.256.256')).toBe(false);
      expect(isIPAddress('not an ip')).toBe(false);
    });
  });

  describe('isDate', () => {
    it('should validate dates', () => {
      expect(isDate('2024-01-01')).toBe(true);
      expect(isDate(new Date())).toBe(true);
      expect(isDate('January 1, 2024')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(isDate('not a date')).toBe(false);
      expect(isDate('2024-13-01')).toBe(false);
    });
  });

  describe('isISODate', () => {
    it('should validate ISO 8601 dates', () => {
      expect(isISODate('2024-01-01')).toBe(true);
      expect(isISODate('2024-01-01T12:00:00Z')).toBe(true);
      expect(isISODate('2024-01-01T12:00:00.000Z')).toBe(true);
    });

    it('should reject non-ISO dates', () => {
      expect(isISODate('01/01/2024')).toBe(false);
      expect(isISODate('not a date')).toBe(false);
    });
  });

  describe('isJSON', () => {
    it('should validate JSON strings', () => {
      expect(isJSON('{"key": "value"}')).toBe(true);
      expect(isJSON('[]')).toBe(true);
      expect(isJSON('null')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(isJSON('not json')).toBe(false);
      expect(isJSON('{key: value}')).toBe(false);
    });
  });

  describe('isHexColor', () => {
    it('should validate hex colors', () => {
      expect(isHexColor('#FF5733')).toBe(true);
      expect(isHexColor('#F57')).toBe(true);
    });

    it('should validate with alpha channel', () => {
      expect(isHexColor('#FF5733AA', true)).toBe(true);
      expect(isHexColor('#FF5733AA', false)).toBe(false);
    });

    it('should reject invalid colors', () => {
      expect(isHexColor('FF5733')).toBe(false);
      expect(isHexColor('#GG5733')).toBe(false);
    });
  });

  describe('isPort', () => {
    it('should validate port numbers', () => {
      expect(isPort(80)).toBe(true);
      expect(isPort(8080)).toBe(true);
      expect(isPort('3000')).toBe(true);
      expect(isPort(65535)).toBe(true);
    });

    it('should reject invalid ports', () => {
      expect(isPort(70000)).toBe(false);
      expect(isPort(-1)).toBe(false);
      expect(isPort(3.14)).toBe(false);
    });
  });

  describe('isMACAddress', () => {
    it('should validate MAC addresses', () => {
      expect(isMACAddress('00:1B:44:11:3A:B7')).toBe(true);
      expect(isMACAddress('00-1B-44-11-3A-B7')).toBe(true);
    });

    it('should reject invalid MAC addresses', () => {
      expect(isMACAddress('00:1B:44:11:3A')).toBe(false);
      expect(isMACAddress('not a mac')).toBe(false);
    });
  });

  describe('isBase64', () => {
    it('should validate base64 strings', () => {
      expect(isBase64('SGVsbG8gV29ybGQ=')).toBe(true);
      expect(isBase64('YWJjMTIz')).toBe(true);
    });

    it('should reject invalid base64', () => {
      expect(isBase64('not base64!')).toBe(false);
      expect(isBase64('SGVsbG8=')).toBe(false); // Invalid padding
    });
  });

  describe('isJWT', () => {
    it('should validate JWT structure', () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      expect(isJWT(validJWT)).toBe(true);
    });

    it('should reject invalid JWT', () => {
      expect(isJWT('not.a.jwt')).toBe(false);
      expect(isJWT('only.two')).toBe(false);
    });
  });

  describe('String validators', () => {
    it('isAlphanumeric should work', () => {
      expect(isAlphanumeric('abc123')).toBe(true);
      expect(isAlphanumeric('abc-123')).toBe(false);
    });

    it('isNumeric should work', () => {
      expect(isNumeric('123')).toBe(true);
      expect(isNumeric('123.45')).toBe(true);
      expect(isNumeric('-123')).toBe(true);
      expect(isNumeric('abc')).toBe(false);
    });

    it('isInteger should work', () => {
      expect(isInteger(123)).toBe(true);
      expect(isInteger('123')).toBe(true);
      expect(isInteger(123.45)).toBe(false);
    });
  });

  describe('Number validators', () => {
    it('isPositive should work', () => {
      expect(isPositive(5)).toBe(true);
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-5)).toBe(false);
    });

    it('isNonNegative should work', () => {
      expect(isNonNegative(0)).toBe(true);
      expect(isNonNegative(5)).toBe(true);
      expect(isNonNegative(-5)).toBe(false);
    });

    it('isInRange should work', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });
  });

  describe('hasLength', () => {
    it('should validate exact length', () => {
      expect(hasLength('hello', { exact: 5 })).toBe(true);
      expect(hasLength('hello', { exact: 4 })).toBe(false);
    });

    it('should validate min/max length', () => {
      expect(hasLength('hello', { min: 3, max: 10 })).toBe(true);
      expect(hasLength('hello', { min: 10 })).toBe(false);
      expect(hasLength('hello', { max: 3 })).toBe(false);
    });
  });

  describe('isUsername', () => {
    it('should validate usernames', () => {
      expect(isUsername('john_doe')).toBe(true);
      expect(isUsername('user123')).toBe(true);
      expect(isUsername('user-name')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(isUsername('ab')).toBe(false); // Too short
      expect(isUsername('user@name')).toBe(false); // Invalid chars
    });
  });

  describe('isSlug', () => {
    it('should validate slugs', () => {
      expect(isSlug('my-blog-post')).toBe(true);
      expect(isSlug('hello-world-123')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(isSlug('My-Blog')).toBe(false); // Uppercase
      expect(isSlug('blog_post')).toBe(false); // Underscore
      expect(isSlug('blog--post')).toBe(false); // Double dash
    });
  });

  describe('isMongoId', () => {
    it('should validate MongoDB ObjectIds', () => {
      expect(isMongoId('507f1f77bcf86cd799439011')).toBe(true);
      expect(isMongoId('507f191e810c19729de860ea')).toBe(true);
    });

    it('should reject invalid ObjectIds', () => {
      expect(isMongoId('507f1f77bcf86cd79943901')).toBe(false); // Too short
      expect(isMongoId('not-an-objectid')).toBe(false);
    });
  });

  describe('isMimeType', () => {
    it('should validate mime types', () => {
      expect(isMimeType('text/html')).toBe(true);
      expect(isMimeType('application/json')).toBe(true);
      expect(isMimeType('image/png')).toBe(true);
    });

    it('should reject invalid mime types', () => {
      expect(isMimeType('not-a-mime')).toBe(false);
      expect(isMimeType('text/')).toBe(false);
    });
  });

  describe('hasExtension', () => {
    it('should validate file extensions', () => {
      expect(hasExtension('file.txt', ['txt'])).toBe(true);
      expect(hasExtension('image.PNG', ['png', 'jpg'])).toBe(true);
    });

    it('should reject invalid extensions', () => {
      expect(hasExtension('file.txt', ['pdf'])).toBe(false);
      expect(hasExtension('file', ['txt'])).toBe(false);
    });
  });
});
