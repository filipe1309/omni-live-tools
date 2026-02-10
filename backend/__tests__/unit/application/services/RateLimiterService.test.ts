import { RateLimiterService } from '../../../../application/services/RateLimiterService';
import { IRateLimiterRepository } from '../../../../domain/repositories';

describe('RateLimiterService', () => {
  let service: RateLimiterService;
  let mockRepository: jest.Mocked<IRateLimiterRepository>;

  beforeEach(() => {
    mockRepository = {
      isBlocked: jest.fn(),
      recordRequest: jest.fn(),
      getConnectionCount: jest.fn(),
      incrementConnectionCount: jest.fn(),
      decrementConnectionCount: jest.fn(),
      reset: jest.fn(),
    };
  });

  describe('when rate limiting is disabled', () => {
    beforeEach(() => {
      service = new RateLimiterService(mockRepository, 10, 5, false);
    });

    it('should never block any client', () => {
      mockRepository.getConnectionCount.mockReturnValue(100);
      mockRepository.isBlocked.mockReturnValue(true);

      const result = service.shouldBlockClient('client1');

      expect(result).toBe(false);
    });

    it('should not check connection count when disabled', () => {
      service.shouldBlockClient('client1');

      expect(mockRepository.getConnectionCount).not.toHaveBeenCalled();
    });

    it('should not check if client is blocked when disabled', () => {
      service.shouldBlockClient('client1');

      expect(mockRepository.isBlocked).not.toHaveBeenCalled();
    });
  });

  describe('when rate limiting is enabled', () => {
    beforeEach(() => {
      service = new RateLimiterService(mockRepository, 10, 5, true);
    });

    describe('shouldBlockClient', () => {
      it('should block client when connection count exceeds max', () => {
        mockRepository.getConnectionCount.mockReturnValue(11);
        mockRepository.isBlocked.mockReturnValue(false);

        const result = service.shouldBlockClient('client1');

        expect(result).toBe(true);
        expect(mockRepository.getConnectionCount).toHaveBeenCalledWith('client1');
      });

      it('should block client when request limit is exceeded', () => {
        mockRepository.getConnectionCount.mockReturnValue(5);
        mockRepository.isBlocked.mockReturnValue(true);

        const result = service.shouldBlockClient('client1');

        expect(result).toBe(true);
        expect(mockRepository.isBlocked).toHaveBeenCalledWith('client1');
      });

      it('should not block client when within limits', () => {
        mockRepository.getConnectionCount.mockReturnValue(5);
        mockRepository.isBlocked.mockReturnValue(false);

        const result = service.shouldBlockClient('client1');

        expect(result).toBe(false);
      });

      it('should not block client at exactly max connections', () => {
        mockRepository.getConnectionCount.mockReturnValue(10);
        mockRepository.isBlocked.mockReturnValue(false);

        const result = service.shouldBlockClient('client1');

        expect(result).toBe(false);
      });

      it('should check connection count before request limit', () => {
        mockRepository.getConnectionCount.mockReturnValue(15);
        mockRepository.isBlocked.mockReturnValue(true);

        service.shouldBlockClient('client1');

        expect(mockRepository.getConnectionCount).toHaveBeenCalled();
        // Should return early after connection check fails
        expect(mockRepository.isBlocked).not.toHaveBeenCalled();
      });
    });

    describe('recordRequest', () => {
      it('should delegate to repository', () => {
        service.recordRequest('client1');

        expect(mockRepository.recordRequest).toHaveBeenCalledWith('client1');
        expect(mockRepository.recordRequest).toHaveBeenCalledTimes(1);
      });
    });

    describe('incrementConnection', () => {
      it('should delegate to repository', () => {
        service.incrementConnection('client1');

        expect(mockRepository.incrementConnectionCount).toHaveBeenCalledWith('client1');
        expect(mockRepository.incrementConnectionCount).toHaveBeenCalledTimes(1);
      });
    });

    describe('decrementConnection', () => {
      it('should delegate to repository', () => {
        service.decrementConnection('client1');

        expect(mockRepository.decrementConnectionCount).toHaveBeenCalledWith('client1');
        expect(mockRepository.decrementConnectionCount).toHaveBeenCalledTimes(1);
      });
    });

    describe('getRateLimitMessage', () => {
      it('should return informative rate limit message', () => {
        const message = service.getRateLimitMessage();

        expect(message).toContain('too many connections');
        expect(message).toContain('host your own server');
      });
    });
  });

  describe('with custom limits', () => {
    it('should use custom max connections limit', () => {
      service = new RateLimiterService(mockRepository, 3, 5, true);
      mockRepository.getConnectionCount.mockReturnValue(4);
      mockRepository.isBlocked.mockReturnValue(false);

      const result = service.shouldBlockClient('client1');

      expect(result).toBe(true);
    });

    it('should respect custom request limit through repository', () => {
      service = new RateLimiterService(mockRepository, 10, 2, true);
      mockRepository.getConnectionCount.mockReturnValue(1);
      mockRepository.isBlocked.mockReturnValue(true);

      const result = service.shouldBlockClient('client1');

      expect(result).toBe(true);
    });
  });
});
