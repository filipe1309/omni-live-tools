import { describe, it, expect, vi } from 'vitest';
import {
  ok,
  err,
  tryAsync,
  trySync,
  normalizeError,
  getErrorMessage,
  withTimeout,
  retry,
  logError,
  logWarning,
  isErrorType,
  createDeferred,
} from '@/utils/errorHandling';

describe('errorHandling utilities', () => {
  describe('ok', () => {
    it('should create a successful result', () => {
      const result = ok('data');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('data');
      }
    });
  });

  describe('err', () => {
    it('should create a failed result', () => {
      const error = new Error('test error');
      const result = err(error);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('tryAsync', () => {
    it('should return success when promise resolves', async () => {
      const result = await tryAsync(() => Promise.resolve('data'));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('data');
      }
    });

    it('should return error when promise rejects', async () => {
      const result = await tryAsync(() => Promise.reject(new Error('failed')));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('failed');
      }
    });

    it('should normalize non-Error rejections', async () => {
      const result = await tryAsync(() => Promise.reject('string error'));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('string error');
      }
    });
  });

  describe('trySync', () => {
    it('should return success when function succeeds', () => {
      const result = trySync(() => 'data');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('data');
      }
    });

    it('should return error when function throws', () => {
      const result = trySync(() => {
        throw new Error('failed');
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('failed');
      }
    });
  });

  describe('normalizeError', () => {
    it('should return Error as-is', () => {
      const error = new Error('test');
      expect(normalizeError(error)).toBe(error);
    });

    it('should convert string to Error', () => {
      const result = normalizeError('string error');
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('string error');
    });

    it('should convert object with message to Error', () => {
      const result = normalizeError({ message: 'object error' });
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('object error');
    });

    it('should convert other types to Error', () => {
      const result = normalizeError(123);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('123');
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error', () => {
      expect(getErrorMessage(new Error('test'))).toBe('test');
    });

    it('should return string as-is', () => {
      expect(getErrorMessage('string error')).toBe('string error');
    });

    it('should extract message from object', () => {
      expect(getErrorMessage({ message: 'object error' })).toBe('object error');
    });

    it('should return default for unknown', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
    });
  });

  describe('withTimeout', () => {
    it('should resolve if promise completes before timeout', async () => {
      const result = await withTimeout(Promise.resolve('data'), 1000);
      expect(result).toBe('data');
    });

    it('should reject with timeout error if promise takes too long', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 500));
      await expect(withTimeout(slowPromise, 50)).rejects.toThrow('Operation timed out');
    });

    it('should use custom timeout message', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 500));
      await expect(withTimeout(slowPromise, 50, 'Custom timeout')).rejects.toThrow('Custom timeout');
    });
  });

  describe('retry', () => {
    it('should return on first success', async () => {
      const fn = vi.fn().mockResolvedValue('data');
      const result = await retry(fn, { maxAttempts: 3 });
      expect(result).toBe('data');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('data');

      const result = await retry(fn, { maxAttempts: 3, initialDelay: 10 });
      expect(result).toBe('data');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      await expect(retry(fn, { maxAttempts: 2, initialDelay: 10 })).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('data');
      const onRetry = vi.fn();

      await retry(fn, { maxAttempts: 2, initialDelay: 10, onRetry });
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it('should respect isRetryable function', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));
      const isRetryable = vi.fn().mockReturnValue(false);

      await expect(retry(fn, { maxAttempts: 3, isRetryable })).rejects.toThrow('non-retryable');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      logError('TestContext', new Error('test error'));
      expect(consoleSpy).toHaveBeenCalledWith('[TestContext] Error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('logWarning', () => {
    it('should log warning with context', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      logWarning('TestContext', 'warning message');
      expect(consoleSpy).toHaveBeenCalledWith('[TestContext] Warning:', 'warning message');
      consoleSpy.mockRestore();
    });
  });

  describe('isErrorType', () => {
    it('should return true for matching error type', () => {
      class CustomError extends Error { }
      const error = new CustomError('test');
      expect(isErrorType(error, CustomError as new (...args: unknown[]) => CustomError)).toBe(true);
    });

    it('should return false for non-matching error type', () => {
      class CustomError extends Error { }
      const error = new Error('test');
      expect(isErrorType(error, CustomError as new (...args: unknown[]) => CustomError)).toBe(false);
    });
  });

  describe('createDeferred', () => {
    it('should create a deferred promise that can be resolved', async () => {
      const deferred = createDeferred<string>();
      deferred.resolve('resolved');
      const result = await deferred.promise;
      expect(result).toBe('resolved');
    });

    it('should create a deferred promise that can be rejected', async () => {
      const deferred = createDeferred<string>();
      deferred.reject(new Error('rejected'));
      await expect(deferred.promise).rejects.toThrow('rejected');
    });
  });
});
