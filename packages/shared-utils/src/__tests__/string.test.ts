import { describe, it, expect } from 'vitest';
import {
  capitalize,
  kebabCase,
  camelCase,
  pascalCase,
  truncate,
  randomString,
} from '../string';

describe('String Utils', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle already capitalized string', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('should not change rest of string', () => {
      expect(capitalize('hELLO')).toBe('HELLO');
    });
  });

  describe('kebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(kebabCase('helloWorld')).toBe('hello-world');
    });

    it('should convert spaces to dashes', () => {
      expect(kebabCase('hello world')).toBe('hello-world');
    });

    it('should convert underscores to dashes', () => {
      expect(kebabCase('hello_world')).toBe('hello-world');
    });

    it('should handle PascalCase', () => {
      expect(kebabCase('HelloWorld')).toBe('hello-world');
    });

    it('should handle mixed cases', () => {
      expect(kebabCase('myTestString')).toBe('my-test-string');
    });
  });

  describe('camelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(camelCase('hello-world')).toBe('helloWorld');
    });

    it('should convert spaces to camelCase', () => {
      expect(camelCase('hello world')).toBe('helloWorld');
    });

    it('should convert underscores to camelCase', () => {
      expect(camelCase('hello_world')).toBe('helloWorld');
    });

    it('should handle already camelCase', () => {
      expect(camelCase('helloWorld')).toBe('helloWorld');
    });

    it('should handle PascalCase', () => {
      expect(camelCase('HelloWorld')).toBe('helloWorld');
    });
  });

  describe('pascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(pascalCase('hello-world')).toBe('HelloWorld');
    });

    it('should convert spaces to PascalCase', () => {
      expect(pascalCase('hello world')).toBe('HelloWorld');
    });

    it('should handle already PascalCase', () => {
      expect(pascalCase('HelloWorld')).toBe('HelloWorld');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should handle exact length', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });

    it('should handle very short maxLength', () => {
      expect(truncate('hello world', 5)).toBe('he...');
    });
  });

  describe('randomString', () => {
    it('should generate string of specified length', () => {
      expect(randomString(10)).toHaveLength(10);
    });

    it('should generate different strings', () => {
      const str1 = randomString(10);
      const str2 = randomString(10);
      expect(str1).not.toBe(str2);
    });

    it('should only contain alphanumeric characters', () => {
      const str = randomString(100);
      expect(str).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should use default length of 10', () => {
      expect(randomString()).toHaveLength(10);
    });
  });
});
