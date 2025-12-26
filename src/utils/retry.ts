/**
 * Retry Utilities
 *
 * Provides retry functionality with:
 * - Exponential backoff
 * - Jitter to prevent thundering herd
 * - Configurable retry conditions
 * - Circuit breaker pattern (optional)
 */

import { logger } from '../logger.js';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelay: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay: number;
  /** Exponential base for backoff calculation (default: 2) */
  exponentialBase: number;
  /** Whether to add random jitter to delays (default: true) */
  jitter: boolean;
  /** Jitter factor 0-1, how much randomness to add (default: 0.5) */
  jitterFactor: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  exponentialBase: 2,
  jitter: true,
  jitterFactor: 0.5,
};

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

/**
 * Calculates the delay for a given attempt using exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  // Calculate exponential delay: baseDelay * (exponentialBase ^ (attempt - 1))
  const exponentialDelay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);

  // Cap at maxDelay
  let delay = Math.min(exponentialDelay, config.maxDelay);

  // Add jitter if enabled
  if (config.jitter) {
    // Jitter adds randomness between (1 - jitterFactor) and (1 + jitterFactor) of the delay
    const jitterRange = delay * config.jitterFactor;
    const jitter = (Math.random() * 2 - 1) * jitterRange;
    delay = Math.max(0, delay + jitter);
  }

  return Math.round(delay);
}

/**
 * Default retry condition - retries on network errors and 5xx status codes
 */
export function defaultShouldRetry(error: unknown, _attempt: number): boolean {
  if (!error) return false;

  // Check for Axios errors
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as { response?: { status?: number }; code?: string };

    // Don't retry client errors (4xx) except 429 (rate limit)
    if (axiosError.response?.status) {
      const status = axiosError.response.status;
      if (status === 429) return true; // Rate limited - retry
      if (status >= 400 && status < 500) return false; // Client error - don't retry
      if (status >= 500) return true; // Server error - retry
    }

    // Retry on network errors
    if (axiosError.code === 'ECONNRESET' || axiosError.code === 'ETIMEDOUT') {
      return true;
    }
  }

  // Retry on generic errors
  return true;
}

/**
 * Sleep for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes an operation with retry and exponential backoff
 *
 * @param operation - The async operation to execute
 * @param shouldRetry - Function to determine if retry should happen (default: network/5xx errors)
 * @param config - Retry configuration
 * @returns The result of the operation
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: unknown, attempt: number) => boolean = defaultShouldRetry,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === cfg.maxAttempts;
      const willRetry = !isLastAttempt && shouldRetry(error, attempt);

      logger.api('debug', 'Operation failed, evaluating retry', {
        attempt,
        maxAttempts: cfg.maxAttempts,
        willRetry,
        error: error instanceof Error ? error.message : String(error),
      });

      if (!willRetry) {
        throw error;
      }

      const delay = calculateBackoffDelay(attempt, cfg);
      logger.api('debug', `Retrying in ${delay}ms`, { attempt, delay });
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError;
}

/**
 * Wraps an operation with retry logic, returning a detailed result
 */
export async function retryWithResult<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: unknown, attempt: number) => boolean = defaultShouldRetry,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  let attempts = 0;

  try {
    const data = await retryWithBackoff(
      async () => {
        attempts++;
        return operation();
      },
      shouldRetry,
      config
    );

    return {
      success: true,
      data,
      attempts,
      totalTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      attempts,
      totalTime: Date.now() - startTime,
    };
  }
}

/**
 * Creates a retryable version of an async function
 */
export function withRetry<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  shouldRetry: (error: unknown, attempt: number) => boolean = defaultShouldRetry,
  config: Partial<RetryConfig> = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => retryWithBackoff(() => fn(...args), shouldRetry, config);
}
