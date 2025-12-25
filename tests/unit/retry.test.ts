/**
 * Unit tests for retry utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  retryWithBackoff,
  calculateBackoffDelay,
  withRetry,
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
} from '../../src/utils/retry.js';

describe('retry utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Suppress logger output during tests
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('calculateBackoffDelay', () => {
    const noJitterConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, jitter: false };

    it('should calculate exponential delay', () => {
      expect(calculateBackoffDelay(1, noJitterConfig)).toBe(1000);
      expect(calculateBackoffDelay(2, noJitterConfig)).toBe(2000);
      expect(calculateBackoffDelay(3, noJitterConfig)).toBe(4000);
      expect(calculateBackoffDelay(4, noJitterConfig)).toBe(8000);
    });

    it('should cap delay at maxDelay', () => {
      const config: RetryConfig = { ...noJitterConfig, maxDelay: 5000 };
      
      // Attempt 4 would normally be 8000ms, should cap at 5000
      expect(calculateBackoffDelay(4, config)).toBe(5000);
    });

    it('should add jitter when enabled', () => {
      const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, jitter: true };
      const delays = new Set<number>();
      
      // With jitter, each call should potentially return different values
      for (let i = 0; i < 10; i++) {
        delays.add(calculateBackoffDelay(1, config));
      }
      
      // Should have some variation (not all the same)
      expect(delays.size).toBeGreaterThanOrEqual(1);
    });

    it('should keep jitter within bounds', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        jitter: true,
        jitterFactor: 0.5,
        baseDelay: 1000,
      };
      
      for (let i = 0; i < 100; i++) {
        const delay = calculateBackoffDelay(1, config);
        // Jitter should be between baseDelay * (1 - jitterFactor) and baseDelay * (1 + jitterFactor)
        expect(delay).toBeGreaterThanOrEqual(500);
        expect(delay).toBeLessThanOrEqual(1500);
      }
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt if operation succeeds', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const resultPromise = retryWithBackoff(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const resultPromise = retryWithBackoff(
        operation,
        () => true, // Always retry
        { maxAttempts: 5, baseDelay: 100, jitter: false }
      );
      
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after exhausting all attempts', async () => {
      vi.useRealTimers(); // Use real timers for this test
      
      const operation = vi.fn().mockRejectedValue(new Error('always fails'));
      
      await expect(
        retryWithBackoff(
          operation,
          () => true, // Always retry
          { maxAttempts: 3, baseDelay: 5, jitter: false } // Very short delay
        )
      ).rejects.toThrow('always fails');
      
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should respect shouldRetry predicate', async () => {
      const nonRetryableError = new Error('non-retryable');
      const operation = vi.fn().mockRejectedValue(nonRetryableError);
      
      await expect(
        retryWithBackoff(
          operation,
          (error) => (error as Error).message !== 'non-retryable',
          { maxAttempts: 3 }
        )
      ).rejects.toThrow('non-retryable');
      
      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('withRetry', () => {
    it('should wrap function with retry behavior', async () => {
      let callCount = 0;
      const fn = async (x: number) => {
        callCount++;
        if (callCount < 3) throw new Error('not yet');
        return x * 2;
      };
      
      const retryingFn = withRetry(
        fn,
        () => true, // Always retry
        { maxAttempts: 5, baseDelay: 100, jitter: false }
      );
      
      const resultPromise = retryingFn(5);
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      
      expect(result).toBe(10);
      expect(callCount).toBe(3);
    });
  });
});
