import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sleep, retry, debounce, throttle, timeout } from '../async';

describe('Async Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('retry', () => {
    it('should return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const promise = retry(fn, { retries: 3, delay: 100 });

      // First call fails
      await vi.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after all retries exhausted', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      const promise = retry(fn, { retries: 2, delay: 100 });

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(200);

      await expect(promise).rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const promise = retry(fn, { retries: 3, delay: 100, backoff: 2 });

      await vi.advanceTimersByTimeAsync(100); // first retry
      await vi.advanceTimersByTimeAsync(200); // second retry (100 * 2)

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should reset timer on each call', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      vi.advanceTimersByTime(50);
      debounced();
      vi.advanceTimersByTime(50);
      debounced();
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to throttled function', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled('arg1', 'arg2');

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should allow calls after delay', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      vi.advanceTimersByTime(50);
      throttled(); // ignored
      vi.advanceTimersByTime(50);
      throttled(); // allowed

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('timeout', () => {
    it('should resolve if promise completes in time', async () => {
      const promise = Promise.resolve('success');
      await expect(timeout(promise, 1000)).resolves.toBe('success');
    });

    it('should reject if promise times out', async () => {
      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve('success'), 2000);
      });

      const timeoutPromise = timeout(slowPromise, 1000);

      vi.advanceTimersByTime(1000);

      await expect(timeoutPromise).rejects.toThrow('Timeout');
    });

    it('should reject with original error if promise fails', async () => {
      const failingPromise = Promise.reject(new Error('Original error'));
      await expect(timeout(failingPromise, 1000)).rejects.toThrow(
        'Original error'
      );
    });
  });
});
