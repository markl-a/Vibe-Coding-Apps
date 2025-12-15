import { describe, it, expect } from 'vitest';
import {
  isEmail,
  isURL,
  isPhoneTW,
  isUUID,
  isJSON,
  isStrongPassword,
} from '../validation';

describe('Validation Utils', () => {
  describe('isEmail', () => {
    it('should validate correct email', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(isEmail('invalid')).toBe(false);
      expect(isEmail('invalid@')).toBe(false);
      expect(isEmail('@invalid.com')).toBe(false);
      expect(isEmail('test @example.com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isEmail('')).toBe(false);
      expect(isEmail('a@b.c')).toBe(true);
    });
  });

  describe('isURL', () => {
    it('should validate correct URLs', () => {
      expect(isURL('https://example.com')).toBe(true);
      expect(isURL('http://localhost:3000')).toBe(true);
      expect(isURL('https://example.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isURL('invalid')).toBe(false);
      expect(isURL('example.com')).toBe(false);
      expect(isURL('')).toBe(false);
    });
  });

  describe('isPhoneTW', () => {
    it('should validate Taiwan mobile numbers', () => {
      expect(isPhoneTW('0912345678')).toBe(true);
      expect(isPhoneTW('0987654321')).toBe(true);
    });

    it('should handle spaces', () => {
      expect(isPhoneTW('09 12 34 56 78')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isPhoneTW('091234567')).toBe(false); // too short
      expect(isPhoneTW('09123456789')).toBe(false); // too long
      expect(isPhoneTW('0812345678')).toBe(false); // wrong prefix
      expect(isPhoneTW('1234567890')).toBe(false);
    });
  });

  describe('isUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isUUID('invalid')).toBe(false);
      expect(isUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isUUID('550e8400-e29b-61d4-a716-446655440000')).toBe(false); // invalid version
      expect(isUUID('')).toBe(false);
    });
  });

  describe('isJSON', () => {
    it('should validate JSON strings', () => {
      expect(isJSON('{"key": "value"}')).toBe(true);
      expect(isJSON('[1, 2, 3]')).toBe(true);
      expect(isJSON('"string"')).toBe(true);
      expect(isJSON('123')).toBe(true);
      expect(isJSON('true')).toBe(true);
      expect(isJSON('null')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(isJSON('invalid')).toBe(false);
      expect(isJSON('{key: value}')).toBe(false);
      expect(isJSON("{'key': 'value'}")).toBe(false);
      expect(isJSON('')).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('should validate strong passwords', () => {
      expect(isStrongPassword('Password1!')).toBe(true);
      expect(isStrongPassword('MyP@ssw0rd')).toBe(true);
      expect(isStrongPassword('Str0ng$Pass')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isStrongPassword('password')).toBe(false); // no uppercase, number, special
      expect(isStrongPassword('Password')).toBe(false); // no number, special
      expect(isStrongPassword('Password1')).toBe(false); // no special
      expect(isStrongPassword('Pass1!')).toBe(false); // too short
      expect(isStrongPassword('12345678')).toBe(false); // no letters
    });

    it('should handle empty string', () => {
      expect(isStrongPassword('')).toBe(false);
    });
  });
});
