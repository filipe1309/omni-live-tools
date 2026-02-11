/**
 * Centralized error handling utilities
 * Provides consistent error handling patterns across the application
 */

/**
 * Result type for operations that can fail
 * Use this instead of throwing errors for recoverable operations
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful result
 */
export function ok<T> (data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function err<E> (error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Wrap an async function to catch errors and return a Result
 * @param fn - Async function that may throw
 * @returns Result with data or error
 *
 * @example
 * const result = await tryAsync(() => fetch('/api/data'));
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */
export async function tryAsync<T> (fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    return err(normalizeError(error));
  }
}

/**
 * Wrap a sync function to catch errors and return a Result
 * @param fn - Function that may throw
 * @returns Result with data or error
 */
export function trySync<T> (fn: () => T): Result<T, Error> {
  try {
    const data = fn();
    return ok(data);
  } catch (error) {
    return err(normalizeError(error));
  }
}

/**
 * Normalize any thrown value to an Error object
 */
export function normalizeError (error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error(String(error));
}

/**
 * Extract error message from any error type
 */
export function getErrorMessage (error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
export function timeout (ms: number, message = 'Operation timed out'): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Race a promise against a timeout
 * @param promise - Promise to execute
 * @param ms - Timeout in milliseconds
 * @param message - Custom timeout message
 */
export async function withTimeout<T> (
  promise: Promise<T>,
  ms: number,
  message?: string
): Promise<T> {
  return Promise.race([promise, timeout(ms, message)]);
}

/**
 * Retry an async operation with exponential backoff
 * @param fn - Async function to retry
 * @param options - Retry options
 */
export async function retry<T> (
  fn: () => Promise<T>,
  options: {
    /** Maximum number of attempts (default: 3) */
    maxAttempts?: number;
    /** Initial delay in ms (default: 1000) */
    initialDelay?: number;
    /** Maximum delay in ms (default: 10000) */
    maxDelay?: number;
    /** Backoff multiplier (default: 2) */
    backoff?: number;
    /** Function to check if error is retryable (default: all errors) */
    isRetryable?: (error: Error) => boolean;
    /** Callback on each retry attempt */
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoff = 2,
    isRetryable = () => true,
    onRetry,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = normalizeError(error);

      if (attempt === maxAttempts || !isRetryable(lastError)) {
        throw lastError;
      }

      onRetry?.(lastError, attempt);

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoff, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Log error to console with consistent formatting
 */
export function logError (context: string, error: unknown): void {
  console.error(`[${context}] Error:`, normalizeError(error));
}

/**
 * Log warning to console with consistent formatting
 */
export function logWarning (context: string, message: string): void {
  console.warn(`[${context}] Warning:`, message);
}

/**
 * Check if an error is a specific type of error
 */
export function isErrorType<T extends Error> (
  error: unknown,
  errorClass: new (...args: unknown[]) => T
): error is T {
  return error instanceof errorClass;
}

/**
 * Create a deferred promise for manual resolve/reject control
 */
export function createDeferred<T> (): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
