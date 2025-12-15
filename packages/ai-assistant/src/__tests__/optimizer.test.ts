import { describe, it, expect, beforeEach } from 'vitest';
import { CodeOptimizer, OptimizationSuggestion } from '../optimizer';

describe('CodeOptimizer', () => {
  let optimizer: CodeOptimizer;

  beforeEach(() => {
    optimizer = new CodeOptimizer();
  });

  describe('optimizeFile', () => {
    it('should return array of optimization suggestions', async () => {
      const result = await optimizer.optimizeFile('test.ts');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('optimizeProject', () => {
    it('should return files and summary', async () => {
      const result = await optimizer.optimizeProject('/path/to/project');
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('summary');
    });

    it('should return summary with correct structure', async () => {
      const result = await optimizer.optimizeProject('/path/to/project');
      expect(result.summary).toHaveProperty('totalSuggestions');
      expect(result.summary).toHaveProperty('byType');
      expect(result.summary).toHaveProperty('byImpact');
    });
  });

  describe('generateOptimizationReport', () => {
    it('should generate markdown report', async () => {
      const suggestions: OptimizationSuggestion[] = [];
      const report = await optimizer.generateOptimizationReport(suggestions);
      expect(report).toContain('# Code Optimization Report');
    });

    it('should include performance section for performance suggestions', async () => {
      const suggestions: OptimizationSuggestion[] = [
        {
          type: 'performance',
          title: 'Use array method',
          description: 'Replace loop with array method',
          impact: 'high',
          before: 'for loop',
          after: 'map()',
        },
      ];
      const report = await optimizer.generateOptimizationReport(suggestions);
      expect(report).toContain('Performance Optimizations');
    });

    it('should include memory section for memory suggestions', async () => {
      const suggestions: OptimizationSuggestion[] = [
        {
          type: 'memory',
          title: 'Clear references',
          description: 'Clear unused references',
          impact: 'medium',
          before: 'let obj = {}',
          after: 'obj = null',
        },
      ];
      const report = await optimizer.generateOptimizationReport(suggestions);
      expect(report).toContain('Memory Optimizations');
    });

    it('should include before and after code blocks', async () => {
      const suggestions: OptimizationSuggestion[] = [
        {
          type: 'performance',
          title: 'Test',
          description: 'Test description',
          impact: 'high',
          before: 'old code',
          after: 'new code',
        },
      ];
      const report = await optimizer.generateOptimizationReport(suggestions);
      expect(report).toContain('**Before:**');
      expect(report).toContain('**After:**');
      expect(report).toContain('old code');
      expect(report).toContain('new code');
    });

    it('should include estimated improvement if provided', async () => {
      const suggestions: OptimizationSuggestion[] = [
        {
          type: 'performance',
          title: 'Test',
          description: 'Test description',
          impact: 'high',
          before: 'old',
          after: 'new',
          estimatedImprovement: '50% faster',
        },
      ];
      const report = await optimizer.generateOptimizationReport(suggestions);
      expect(report).toContain('**Estimated Improvement**: 50% faster');
    });

    it('should include impact level', async () => {
      const suggestions: OptimizationSuggestion[] = [
        {
          type: 'performance',
          title: 'Test',
          description: 'Test description',
          impact: 'high',
          before: 'old',
          after: 'new',
        },
      ];
      const report = await optimizer.generateOptimizationReport(suggestions);
      expect(report).toContain('**Impact**: high');
    });
  });
});
