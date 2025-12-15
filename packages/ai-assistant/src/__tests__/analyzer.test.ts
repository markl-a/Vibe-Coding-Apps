import { describe, it, expect, beforeEach } from 'vitest';
import { CodeAnalyzer } from '../analyzer';

describe('CodeAnalyzer', () => {
  let analyzer: CodeAnalyzer;

  beforeEach(() => {
    analyzer = new CodeAnalyzer();
  });

  describe('analyzeFile', () => {
    it('should return analysis result with correct file path', async () => {
      const result = await analyzer.analyzeFile('test.ts');
      expect(result.file).toBe('test.ts');
    });

    it('should detect TypeScript language from .ts extension', async () => {
      const result = await analyzer.analyzeFile('component.ts');
      expect(result.language).toBe('typescript');
    });

    it('should detect TypeScript language from .tsx extension', async () => {
      const result = await analyzer.analyzeFile('component.tsx');
      expect(result.language).toBe('typescript');
    });

    it('should detect JavaScript language from .js extension', async () => {
      const result = await analyzer.analyzeFile('script.js');
      expect(result.language).toBe('javascript');
    });

    it('should detect JavaScript language from .jsx extension', async () => {
      const result = await analyzer.analyzeFile('component.jsx');
      expect(result.language).toBe('javascript');
    });

    it('should detect Python language from .py extension', async () => {
      const result = await analyzer.analyzeFile('script.py');
      expect(result.language).toBe('python');
    });

    it('should detect C language from .c extension', async () => {
      const result = await analyzer.analyzeFile('main.c');
      expect(result.language).toBe('c');
    });

    it('should detect C++ language from .cpp extension', async () => {
      const result = await analyzer.analyzeFile('main.cpp');
      expect(result.language).toBe('cpp');
    });

    it('should detect Rust language from .rs extension', async () => {
      const result = await analyzer.analyzeFile('main.rs');
      expect(result.language).toBe('rust');
    });

    it('should detect Go language from .go extension', async () => {
      const result = await analyzer.analyzeFile('main.go');
      expect(result.language).toBe('go');
    });

    it('should return unknown for unsupported file types', async () => {
      const result = await analyzer.analyzeFile('file.unknown');
      expect(result.language).toBe('unknown');
    });

    it('should return metrics in analysis result', async () => {
      const result = await analyzer.analyzeFile('test.ts');
      expect(result.metrics).toBeDefined();
      expect(result.metrics).toHaveProperty('lines');
      expect(result.metrics).toHaveProperty('complexity');
      expect(result.metrics).toHaveProperty('maintainability');
    });

    it('should return issues array in analysis result', async () => {
      const result = await analyzer.analyzeFile('test.ts');
      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should return suggestions array in analysis result', async () => {
      const result = await analyzer.analyzeFile('test.ts');
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('analyzeProject', () => {
    it('should return array of analysis results', async () => {
      const results = await analyzer.analyzeProject('/path/to/project');
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
