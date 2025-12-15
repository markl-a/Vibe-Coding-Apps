import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatISO, formatDate, timeAgo, addDays, isValidDate } from '../date';

describe('Date Utils', () => {
  describe('formatISO', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatISO(date)).toBe('2024-01-15T10:30:00.000Z');
    });
  });

  describe('formatDate', () => {
    it('should format date in zh-TW locale by default', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toContain('2024');
      expect(result).toContain('1');
      expect(result).toContain('15');
    });

    it('should format date in specified locale', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date, 'en-US');
      expect(result).toContain('2024');
    });
  });

  describe('timeAgo', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "剛剛" for recent time', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      expect(timeAgo(date)).toBe('剛剛');
    });

    it('should return seconds ago', () => {
      const date = new Date('2024-01-15T11:59:30Z');
      expect(timeAgo(date)).toBe('30 秒前');
    });

    it('should return minutes ago', () => {
      const date = new Date('2024-01-15T11:55:00Z');
      expect(timeAgo(date)).toBe('5 分鐘前');
    });

    it('should return hours ago', () => {
      const date = new Date('2024-01-15T09:00:00Z');
      expect(timeAgo(date)).toBe('3 小時前');
    });

    it('should return days ago', () => {
      const date = new Date('2024-01-13T12:00:00Z');
      expect(timeAgo(date)).toBe('2 天前');
    });

    it('should return weeks ago', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      expect(timeAgo(date)).toBe('2 週前');
    });

    it('should return months ago', () => {
      const date = new Date('2023-11-15T12:00:00Z');
      expect(timeAgo(date)).toBe('2 月前');
    });

    it('should return years ago', () => {
      const date = new Date('2022-01-15T12:00:00Z');
      expect(timeAgo(date)).toBe('2 年前');
    });
  });

  describe('addDays', () => {
    it('should add days to date', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(20);
    });

    it('should handle negative days', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });

    it('should handle month overflow', () => {
      const date = new Date('2024-01-30');
      const result = addDays(date, 5);
      expect(result.getMonth()).toBe(1); // February
    });

    it('should not mutate original date', () => {
      const date = new Date('2024-01-15');
      const original = date.getTime();
      addDays(date, 5);
      expect(date.getTime()).toBe(original);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid Date object', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-01-15'))).toBe(true);
    });

    it('should return false for invalid Date object', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });

    it('should return false for non-Date values', () => {
      expect(isValidDate('2024-01-15')).toBe(false);
      expect(isValidDate(1234567890)).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
    });
  });
});
