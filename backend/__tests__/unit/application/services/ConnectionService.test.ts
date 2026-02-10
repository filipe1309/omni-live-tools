import { ConnectionService } from '../../../../application/services/ConnectionService';
import { ITikTokConnectionRepository } from '../../../../domain/repositories';
import { ConnectionState, ConnectionOptions } from '../../../../domain/entities';
import { TikTokEventType } from '../../../../domain/enums';

describe('ConnectionService', () => {
  let service: ConnectionService;
  let mockConnectionWrapper: jest.Mocked<ITikTokConnectionRepository>;
  let createConnectionWrapper: jest.Mock;

  beforeEach(() => {
    mockConnectionWrapper = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnected: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
    };

    createConnectionWrapper = jest.fn().mockReturnValue(mockConnectionWrapper);
    service = new ConnectionService(createConnectionWrapper);
  });

  describe('connect', () => {
    const mockConnectionState: ConnectionState = {
      roomId: 'room123',
      upgradedToWebsocket: true,
      isConnected: true,
    };

    it('should create a connection wrapper with sanitized options', async () => {
      mockConnectionWrapper.once.mockImplementation((event, handler) => {
        if (event === 'connected') {
          setTimeout(() => handler(mockConnectionState), 0);
        }
      });

      const options = { sessionId: 'test-session' };
      const connectPromise = service.connect('testuser', options);

      await connectPromise;

      expect(createConnectionWrapper).toHaveBeenCalledWith('testuser', expect.any(Object));
    });

    it('should sanitize options before connecting', async () => {
      mockConnectionWrapper.once.mockImplementation((event, handler) => {
        if (event === 'connected') {
          setTimeout(() => handler(mockConnectionState), 0);
        }
      });

      const maliciousOptions = {
        sessionId: 'test-session',
        requestOptions: { evil: true },
        websocketOptions: { malicious: true },
      };

      await service.connect('testuser', maliciousOptions);

      // The second argument should be sanitized (no requestOptions or websocketOptions)
      const passedOptions = createConnectionWrapper.mock.calls[0][1];
      expect(passedOptions.requestOptions).toBeUndefined();
      expect(passedOptions.websocketOptions).toBeUndefined();
    });

    it('should add session ID from parameter', async () => {
      mockConnectionWrapper.once.mockImplementation((event, handler) => {
        if (event === 'connected') {
          setTimeout(() => handler(mockConnectionState), 0);
        }
      });

      await service.connect('testuser', {}, 'custom-session');

      const passedOptions = createConnectionWrapper.mock.calls[0][1];
      expect(passedOptions.sessionId).toBe('custom-session');
    });

    it('should resolve with connection state on success', async () => {
      mockConnectionWrapper.once.mockImplementation((event, handler) => {
        if (event === 'connected') {
          setTimeout(() => handler(mockConnectionState), 0);
        }
      });

      const result = await service.connect('testuser', {});

      expect(result).toEqual(mockConnectionState);
    });

    it('should reject on disconnection during connect', async () => {
      mockConnectionWrapper.once.mockImplementation((event, handler) => {
        if (event === 'disconnected') {
          setTimeout(() => handler('Connection failed'), 0);
        }
      });

      await expect(service.connect('testuser', {})).rejects.toThrow('Connection failed');
    });

    it('should reject if connection wrapper is not initialized', async () => {
      createConnectionWrapper.mockReturnValue(null);
      
      // Need to create new service with factory that returns null
      const badService = new ConnectionService(() => null as any);

      await expect(badService.connect('testuser', {})).rejects.toThrow('Connection wrapper not initialized');
    });
  });

  describe('disconnect', () => {
    it('should call disconnect on wrapper', async () => {
      const mockState: ConnectionState = {
        roomId: 'room123',
        upgradedToWebsocket: true,
        isConnected: true,
      };

      mockConnectionWrapper.once.mockImplementation((event, handler) => {
        if (event === 'connected') {
          setTimeout(() => handler(mockState), 0);
        }
      });

      await service.connect('testuser', {});
      service.disconnect();

      expect(mockConnectionWrapper.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when not connected', () => {
      // Should not throw
      expect(() => service.disconnect()).not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return false when no connection exists', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should delegate to connection wrapper', async () => {
      const mockState: ConnectionState = {
        roomId: 'room123',
        upgradedToWebsocket: true,
        isConnected: true,
      };

      mockConnectionWrapper.once.mockImplementation((event, handler) => {
        if (event === 'connected') {
          setTimeout(() => handler(mockState), 0);
        }
      });
      mockConnectionWrapper.isConnected.mockReturnValue(true);

      await service.connect('testuser', {});

      expect(service.isConnected()).toBe(true);
      expect(mockConnectionWrapper.isConnected).toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    const mockState: ConnectionState = {
      roomId: 'room123',
      upgradedToWebsocket: true,
      isConnected: true,
    };

    beforeEach(async () => {
      mockConnectionWrapper.once.mockImplementation((event, handler) => {
        if (event === 'connected') {
          setTimeout(() => handler(mockState), 0);
        }
      });
    });

    describe('on', () => {
      it('should store event handlers', () => {
        const handler = jest.fn();
        service.on('chat', handler);

        // Handler should be stored internally
        expect(() => service.on('chat', handler)).not.toThrow();
      });

      it('should forward handlers to wrapper after connect', async () => {
        const handler = jest.fn();
        service.on(TikTokEventType.CHAT, handler);

        await service.connect('testuser', {});

        expect(mockConnectionWrapper.on).toHaveBeenCalledWith(TikTokEventType.CHAT, handler);
      });
    });

    describe('off', () => {
      it('should remove event handlers', async () => {
        const handler = jest.fn();
        service.on('chat', handler);

        await service.connect('testuser', {});
        service.off('chat', handler);

        expect(mockConnectionWrapper.off).toHaveBeenCalledWith('chat', handler);
      });

      it('should handle removing non-existent handler', () => {
        const handler = jest.fn();
        expect(() => service.off('chat', handler)).not.toThrow();
      });
    });
  });
});
