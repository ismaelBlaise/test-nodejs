import pRetry from 'p-retry';
import logger from '../config/logger';

export interface RetryOptions {
  maxAttempts?: number;
  backoffDelay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  onRetry?: (error: Error, attemptNumber: number) => void;
}

export class ResilientService {
  /**
   * Execute function with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      backoffDelay = 1000,
      backoffMultiplier = 2,
      maxDelay = 30000,
      onRetry,
    } = options;

    return pRetry(fn, {
      retries: maxAttempts - 1,
      minTimeout: backoffDelay,
      maxTimeout: maxDelay,
      factor: backoffMultiplier,
      onFailedAttempt: (error) => {
        const attempt = error.attemptNumber;
        const retriesLeft = maxAttempts - attempt;

        logger.warn(
          {
            error: error.message,
            attempt,
            retriesLeft,
            nextDelay: error.message,
          },
          'Operation failed, retrying...'
        );

        if (onRetry) {
          onRetry(error as Error, attempt);
        }
      },
    });
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Execute function with fallback
   */
  async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallbackFn: () => Promise<T> | T
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      logger.warn(error, 'Primary operation failed, using fallback');
      return fallbackFn() instanceof Promise ? await fallbackFn() : fallbackFn();
    }
  }

  /**
   * Execute function with all resilience patterns
   */
  async executeResilient<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      timeoutMs?: number;
      fallback?: (() => Promise<T> | T) | null;
      backoffDelay?: number;
      backoffMultiplier?: number;
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, timeoutMs = 5000, fallback = null, ...retryOptions } = options;

    const executeWithAll = async (): Promise<T> => {
      if (timeoutMs) {
        return this.executeWithTimeout(fn, timeoutMs);
      }
      return fn();
    };

    if (fallback) {
      return this.executeWithFallback(
        () => this.executeWithRetry(executeWithAll, { maxAttempts: maxRetries, ...retryOptions }),
        fallback
      );
    }

    return this.executeWithRetry(executeWithAll, { maxAttempts: maxRetries, ...retryOptions });
  }
}

export default new ResilientService();
