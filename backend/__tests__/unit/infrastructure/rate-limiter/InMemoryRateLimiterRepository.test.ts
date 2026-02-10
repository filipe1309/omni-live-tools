import { InMemoryRateLimiterRepository } from '../../../../infrastructure/rate-limiter/InMemoryRateLimiterRepository';

describe('InMemoryRateLimiterRepository', () => {
  let repository: InMemoryRateLimiterRepository;

  beforeEach(() => {
    // Use a very long reset interval for tests to avoid timing issues
    repository = new InMemoryRateLimiterRepository({
      maxConnections: 10,
      maxRequestsPerMinute: 5,
      resetIntervalMs: 60000, // 1 minute
    });
  });

  afterEach(() => {
    repository.destroy();
  });

  describe('isBlocked', () => {
    it('should return false for new client', () => {
      expect(repository.isBlocked('client1')).toBe(false);
    });

    it('should return false when requests are within limit', () => {
      for (let i = 0; i < 5; i++) {
        repository.recordRequest('client1');
      }

      expect(repository.isBlocked('client1')).toBe(false);
    });

    it('should return true when requests exceed limit', () => {
      for (let i = 0; i < 6; i++) {
        repository.recordRequest('client1');
      }

      expect(repository.isBlocked('client1')).toBe(true);
    });

    it('should track clients independently', () => {
      for (let i = 0; i < 10; i++) {
        repository.recordRequest('client1');
      }

      expect(repository.isBlocked('client1')).toBe(true);
      expect(repository.isBlocked('client2')).toBe(false);
    });
  });

  describe('recordRequest', () => {
    it('should increment request count', () => {
      repository.recordRequest('client1');
      repository.recordRequest('client1');
      repository.recordRequest('client1');

      // After 5 more requests it should be blocked
      repository.recordRequest('client1');
      repository.recordRequest('client1');
      repository.recordRequest('client1');

      expect(repository.isBlocked('client1')).toBe(true);
    });

    it('should start from 0 for new clients', () => {
      expect(repository.isBlocked('newclient')).toBe(false);
    });
  });

  describe('getConnectionCount', () => {
    it('should return 0 for new client', () => {
      expect(repository.getConnectionCount('client1')).toBe(0);
    });

    it('should return current connection count', () => {
      repository.incrementConnectionCount('client1');
      repository.incrementConnectionCount('client1');

      expect(repository.getConnectionCount('client1')).toBe(2);
    });
  });

  describe('incrementConnectionCount', () => {
    it('should increment from 0', () => {
      repository.incrementConnectionCount('client1');

      expect(repository.getConnectionCount('client1')).toBe(1);
    });

    it('should increment multiple times', () => {
      repository.incrementConnectionCount('client1');
      repository.incrementConnectionCount('client1');
      repository.incrementConnectionCount('client1');

      expect(repository.getConnectionCount('client1')).toBe(3);
    });

    it('should track clients independently', () => {
      repository.incrementConnectionCount('client1');
      repository.incrementConnectionCount('client1');
      repository.incrementConnectionCount('client2');

      expect(repository.getConnectionCount('client1')).toBe(2);
      expect(repository.getConnectionCount('client2')).toBe(1);
    });
  });

  describe('decrementConnectionCount', () => {
    it('should decrement connection count', () => {
      repository.incrementConnectionCount('client1');
      repository.incrementConnectionCount('client1');
      repository.decrementConnectionCount('client1');

      expect(repository.getConnectionCount('client1')).toBe(1);
    });

    it('should not go below 0', () => {
      repository.decrementConnectionCount('client1');

      expect(repository.getConnectionCount('client1')).toBe(0);
    });

    it('should handle multiple decrements at zero', () => {
      repository.decrementConnectionCount('client1');
      repository.decrementConnectionCount('client1');
      repository.decrementConnectionCount('client1');

      expect(repository.getConnectionCount('client1')).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear all request counts', () => {
      repository.recordRequest('client1');
      repository.recordRequest('client1');
      repository.recordRequest('client1');
      repository.recordRequest('client2');

      repository.reset();

      expect(repository.isBlocked('client1')).toBe(false);
      expect(repository.isBlocked('client2')).toBe(false);
    });

    it('should not affect connection counts', () => {
      repository.incrementConnectionCount('client1');
      repository.incrementConnectionCount('client1');

      repository.reset();

      expect(repository.getConnectionCount('client1')).toBe(2);
    });
  });

  describe('destroy', () => {
    it('should clear the reset interval', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      repository.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        repository.destroy();
        repository.destroy();
      }).not.toThrow();
    });
  });

  describe('automatic reset interval', () => {
    it('should reset request counts after interval', async () => {
      // Create repository with short interval
      const shortIntervalRepo = new InMemoryRateLimiterRepository({
        maxConnections: 10,
        maxRequestsPerMinute: 5,
        resetIntervalMs: 50, // 50ms for testing
      });

      // Make enough requests to be blocked
      for (let i = 0; i < 10; i++) {
        shortIntervalRepo.recordRequest('client1');
      }
      expect(shortIntervalRepo.isBlocked('client1')).toBe(true);

      // Wait for reset
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be unblocked after reset
      expect(shortIntervalRepo.isBlocked('client1')).toBe(false);

      shortIntervalRepo.destroy();
    });
  });

  describe('default configuration', () => {
    it('should use default config when not provided', () => {
      const defaultRepo = new InMemoryRateLimiterRepository();

      expect(defaultRepo.getConnectionCount('client')).toBe(0);
      expect(defaultRepo.isBlocked('client')).toBe(false);

      defaultRepo.destroy();
    });
  });
});
