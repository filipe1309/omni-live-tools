import {
  ConnectionState,
  ConnectionOptions,
  sanitizeConnectionOptions,
} from '../../../../domain/entities/ConnectionState';

describe('ConnectionState Entity', () => {
  describe('ConnectionState interface', () => {
    it('should create a valid connection state object', () => {
      const state: ConnectionState = {
        roomId: 'room123',
        upgradedToWebsocket: true,
        isConnected: true,
      };

      expect(state.roomId).toBe('room123');
      expect(state.upgradedToWebsocket).toBe(true);
      expect(state.isConnected).toBe(true);
    });

    it('should allow disconnected state', () => {
      const state: ConnectionState = {
        roomId: '',
        upgradedToWebsocket: false,
        isConnected: false,
      };

      expect(state.isConnected).toBe(false);
      expect(state.upgradedToWebsocket).toBe(false);
    });
  });

  describe('ConnectionOptions interface', () => {
    it('should create valid connection options', () => {
      const options: ConnectionOptions = {
        sessionId: 'session123',
        enableExtendedGiftInfo: true,
      };

      expect(options.sessionId).toBe('session123');
      expect(options.enableExtendedGiftInfo).toBe(true);
    });

    it('should allow empty options', () => {
      const options: ConnectionOptions = {};

      expect(options.sessionId).toBeUndefined();
      expect(options.enableExtendedGiftInfo).toBeUndefined();
    });
  });

  describe('sanitizeConnectionOptions', () => {
    it('should return empty object for null input', () => {
      const result = sanitizeConnectionOptions(null);
      expect(result).toEqual({});
    });

    it('should return empty object for undefined input', () => {
      const result = sanitizeConnectionOptions(undefined);
      expect(result).toEqual({});
    });

    it('should return empty object for non-object input', () => {
      expect(sanitizeConnectionOptions('string')).toEqual({});
      expect(sanitizeConnectionOptions(123)).toEqual({});
      expect(sanitizeConnectionOptions(true)).toEqual({});
    });

    it('should preserve safe properties', () => {
      const input = {
        sessionId: 'session123',
        enableExtendedGiftInfo: true,
      };

      const result = sanitizeConnectionOptions(input);

      expect(result.sessionId).toBe('session123');
      expect(result.enableExtendedGiftInfo).toBe(true);
    });

    it('should remove requestOptions for security', () => {
      const input = {
        sessionId: 'session123',
        requestOptions: { headers: { 'X-Evil': 'malicious' } },
      };

      const result = sanitizeConnectionOptions(input);

      expect(result.sessionId).toBe('session123');
      expect(result.requestOptions).toBeUndefined();
    });

    it('should remove websocketOptions for security', () => {
      const input = {
        sessionId: 'session123',
        websocketOptions: { origin: 'evil.com' },
      };

      const result = sanitizeConnectionOptions(input);

      expect(result.sessionId).toBe('session123');
      expect(result.websocketOptions).toBeUndefined();
    });

    it('should remove both dangerous options', () => {
      const input = {
        sessionId: 'session123',
        enableExtendedGiftInfo: true,
        requestOptions: { timeout: 5000 },
        websocketOptions: { reconnect: true },
      };

      const result = sanitizeConnectionOptions(input);

      expect(result.sessionId).toBe('session123');
      expect(result.enableExtendedGiftInfo).toBe(true);
      expect(result.requestOptions).toBeUndefined();
      expect(result.websocketOptions).toBeUndefined();
    });

    it('should not mutate the original input', () => {
      const input = {
        sessionId: 'session123',
        requestOptions: { timeout: 5000 },
      };
      const originalInput = { ...input };

      sanitizeConnectionOptions(input);

      expect(input).toEqual(originalInput);
    });
  });
});
