import { describe, it, expect, beforeEach } from 'vitest';
import { CodeReviewer, ReviewComment } from '../reviewer';

describe('CodeReviewer', () => {
  let reviewer: CodeReviewer;

  beforeEach(() => {
    reviewer = new CodeReviewer();
  });

  describe('reviewFile', () => {
    it('should return array of review comments', async () => {
      const result = await reviewer.reviewFile('test.ts');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('reviewPullRequest', () => {
    it('should return comments and summary', async () => {
      const result = await reviewer.reviewPullRequest('main', 'feature');
      expect(result).toHaveProperty('comments');
      expect(result).toHaveProperty('summary');
    });

    it('should return summary with correct structure', async () => {
      const result = await reviewer.reviewPullRequest('main', 'feature');
      expect(result.summary).toHaveProperty('totalComments');
      expect(result.summary).toHaveProperty('bySeverity');
      expect(result.summary).toHaveProperty('byCategory');
      expect(result.summary).toHaveProperty('overallScore');
      expect(result.summary).toHaveProperty('recommendations');
    });
  });

  describe('generateReviewReport', () => {
    it('should generate markdown report', async () => {
      const comments: ReviewComment[] = [];
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('# Code Review Report');
      expect(report).toContain('## Summary');
    });

    it('should include total issues count', async () => {
      const comments: ReviewComment[] = [
        {
          file: 'test.ts',
          line: 10,
          severity: 'minor',
          category: 'style',
          message: 'Consider using const',
        },
      ];
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('**Total Issues**: 1');
    });

    it('should calculate overall score based on severity', async () => {
      const comments: ReviewComment[] = [];
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('**Overall Score**: 100/100');
    });

    it('should reduce score for critical issues', async () => {
      const comments: ReviewComment[] = [
        {
          file: 'test.ts',
          line: 10,
          severity: 'critical',
          category: 'security',
          message: 'SQL injection vulnerability',
        },
      ];
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('**Overall Score**: 80/100');
    });

    it('should reduce score for major issues', async () => {
      const comments: ReviewComment[] = [
        {
          file: 'test.ts',
          line: 10,
          severity: 'major',
          category: 'bug',
          message: 'Potential null reference',
        },
      ];
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('**Overall Score**: 90/100');
    });

    it('should include severity breakdown', async () => {
      const comments: ReviewComment[] = [
        {
          file: 'test.ts',
          line: 10,
          severity: 'minor',
          category: 'style',
          message: 'Style issue',
        },
      ];
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('### By Severity');
      expect(report).toContain('minor: 1');
    });

    it('should include category breakdown', async () => {
      const comments: ReviewComment[] = [
        {
          file: 'test.ts',
          line: 10,
          severity: 'minor',
          category: 'style',
          message: 'Style issue',
        },
      ];
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('### By Category');
      expect(report).toContain('style: 1');
    });

    it('should include security recommendation for security issues', async () => {
      const comments: ReviewComment[] = [
        {
          file: 'test.ts',
          line: 10,
          severity: 'critical',
          category: 'security',
          message: 'Security vulnerability',
        },
      ];
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('Address all security vulnerabilities immediately');
    });

    it('should include performance recommendation for performance issues', async () => {
      const comments: ReviewComment[] = [
        {
          file: 'test.ts',
          line: 10,
          severity: 'minor',
          category: 'performance',
          message: 'Performance issue',
        },
      ];
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('Consider performance optimizations before merge');
    });

    it('should recommend smaller PRs for large reviews', async () => {
      const comments: ReviewComment[] = Array.from({ length: 11 }, (_, i) => ({
        file: `test${i}.ts`,
        line: 10,
        severity: 'minor' as const,
        category: 'style' as const,
        message: 'Style issue',
      }));
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('consider breaking it into smaller PRs');
    });

    it('should group comments by file in detailed section', async () => {
      const comments: ReviewComment[] = [
        {
          file: 'fileA.ts',
          line: 10,
          severity: 'minor',
          category: 'style',
          message: 'Issue in A',
        },
        {
          file: 'fileB.ts',
          line: 20,
          severity: 'minor',
          category: 'style',
          message: 'Issue in B',
        },
      ];
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('### fileA.ts');
      expect(report).toContain('### fileB.ts');
    });

    it('should include suggestion if provided', async () => {
      const comments: ReviewComment[] = [
        {
          file: 'test.ts',
          line: 10,
          severity: 'minor',
          category: 'style',
          message: 'Use const instead of let',
          suggestion: 'const x = 1;',
        },
      ];
      const report = await reviewer.generateReviewReport(comments);
      expect(report).toContain('**Suggestion**: const x = 1;');
    });
  });
});
