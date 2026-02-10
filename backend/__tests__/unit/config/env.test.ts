import { loadConfig, validateConfig, EnvConfig } from '../../../config/env';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    it('should load default values when no environment variables are set', () => {
      delete process.env.PORT;
      delete process.env.SESSIONID;
      delete process.env.ENABLE_RATE_LIMIT;
      delete process.env.MAX_CONNECTIONS;
      delete process.env.MAX_REQUESTS_PER_MINUTE;
      delete process.env.NODE_ENV;

      const config = loadConfig();

      expect(config.port).toBe(8081);
      expect(config.sessionId).toBeUndefined();
      expect(config.enableRateLimit).toBe(false);
      expect(config.maxConnections).toBe(10);
      expect(config.maxRequestsPerMinute).toBe(5);
      expect(config.nodeEnv).toBe('development');
    });

    it('should load port from environment', () => {
      process.env.PORT = '3000';

      const config = loadConfig();

      expect(config.port).toBe(3000);
    });

    it('should load session ID from environment', () => {
      process.env.SESSIONID = 'test-session-123';

      const config = loadConfig();

      expect(config.sessionId).toBe('test-session-123');
    });

    it('should enable rate limit when ENABLE_RATE_LIMIT is true', () => {
      process.env.ENABLE_RATE_LIMIT = 'true';

      const config = loadConfig();

      expect(config.enableRateLimit).toBe(true);
    });

    it('should disable rate limit when ENABLE_RATE_LIMIT is not true', () => {
      process.env.ENABLE_RATE_LIMIT = 'false';

      const config = loadConfig();

      expect(config.enableRateLimit).toBe(false);
    });

    it('should load max connections from environment', () => {
      process.env.MAX_CONNECTIONS = '20';

      const config = loadConfig();

      expect(config.maxConnections).toBe(20);
    });

    it('should load max requests per minute from environment', () => {
      process.env.MAX_REQUESTS_PER_MINUTE = '100';

      const config = loadConfig();

      expect(config.maxRequestsPerMinute).toBe(100);
    });

    it('should load NODE_ENV from environment', () => {
      process.env.NODE_ENV = 'production';

      const config = loadConfig();

      expect(config.nodeEnv).toBe('production');
    });

    it('should include staticFilesPath', () => {
      const config = loadConfig();

      expect(config.staticFilesPath).toBeDefined();
      expect(typeof config.staticFilesPath).toBe('string');
    });
  });

  describe('validateConfig', () => {
    let validConfig: EnvConfig;

    beforeEach(() => {
      validConfig = {
        port: 8081,
        enableRateLimit: false,
        maxConnections: 10,
        maxRequestsPerMinute: 5,
        nodeEnv: 'development',
        staticFilesPath: '/path/to/static',
      };
    });

    it('should not throw for valid configuration', () => {
      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    describe('port validation', () => {
      it('should throw for port less than 1', () => {
        validConfig.port = 0;

        expect(() => validateConfig(validConfig)).toThrow('Invalid port number: 0');
      });

      it('should throw for negative port', () => {
        validConfig.port = -1;

        expect(() => validateConfig(validConfig)).toThrow('Invalid port number: -1');
      });

      it('should throw for port greater than 65535', () => {
        validConfig.port = 65536;

        expect(() => validateConfig(validConfig)).toThrow('Invalid port number: 65536');
      });

      it('should accept port 1', () => {
        validConfig.port = 1;

        expect(() => validateConfig(validConfig)).not.toThrow();
      });

      it('should accept port 65535', () => {
        validConfig.port = 65535;

        expect(() => validateConfig(validConfig)).not.toThrow();
      });
    });

    describe('maxConnections validation', () => {
      it('should throw for maxConnections less than 1', () => {
        validConfig.maxConnections = 0;

        expect(() => validateConfig(validConfig)).toThrow('Invalid max connections: 0');
      });

      it('should throw for negative maxConnections', () => {
        validConfig.maxConnections = -5;

        expect(() => validateConfig(validConfig)).toThrow('Invalid max connections: -5');
      });

      it('should accept maxConnections of 1', () => {
        validConfig.maxConnections = 1;

        expect(() => validateConfig(validConfig)).not.toThrow();
      });
    });

    describe('maxRequestsPerMinute validation', () => {
      it('should throw for maxRequestsPerMinute less than 1', () => {
        validConfig.maxRequestsPerMinute = 0;

        expect(() => validateConfig(validConfig)).toThrow('Invalid max requests per minute: 0');
      });

      it('should throw for negative maxRequestsPerMinute', () => {
        validConfig.maxRequestsPerMinute = -10;

        expect(() => validateConfig(validConfig)).toThrow('Invalid max requests per minute: -10');
      });

      it('should accept maxRequestsPerMinute of 1', () => {
        validConfig.maxRequestsPerMinute = 1;

        expect(() => validateConfig(validConfig)).not.toThrow();
      });
    });

    describe('multiple validation errors', () => {
      it('should throw for first invalid value (port checked first)', () => {
        validConfig.port = 0;
        validConfig.maxConnections = 0;

        expect(() => validateConfig(validConfig)).toThrow('Invalid port number');
      });
    });
  });
});
