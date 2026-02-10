import { ConsoleLogger, createLogger, ILogger } from '../../../shared/logger';

describe('Logger', () => {
  describe('ConsoleLogger', () => {
    let logger: ConsoleLogger;
    let consoleSpy: {
      info: jest.SpyInstance;
      warn: jest.SpyInstance;
      error: jest.SpyInstance;
      debug: jest.SpyInstance;
    };

    beforeEach(() => {
      // Restore console methods for this test suite
      jest.restoreAllMocks();
      
      consoleSpy = {
        info: jest.spyOn(console, 'info').mockImplementation(),
        warn: jest.spyOn(console, 'warn').mockImplementation(),
        error: jest.spyOn(console, 'error').mockImplementation(),
        debug: jest.spyOn(console, 'debug').mockImplementation(),
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('without prefix', () => {
      beforeEach(() => {
        logger = new ConsoleLogger();
      });

      it('should log info messages', () => {
        logger.info('Test message');

        expect(consoleSpy.info).toHaveBeenCalledTimes(1);
        expect(consoleSpy.info).toHaveBeenCalledWith(
          expect.stringContaining('Test message')
        );
      });

      it('should log warn messages', () => {
        logger.warn('Warning message');

        expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('Warning message')
        );
      });

      it('should log error messages', () => {
        logger.error('Error message');

        expect(consoleSpy.error).toHaveBeenCalledTimes(1);
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('Error message')
        );
      });

      it('should log debug messages', () => {
        logger.debug('Debug message');

        expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
        expect(consoleSpy.debug).toHaveBeenCalledWith(
          expect.stringContaining('Debug message')
        );
      });

      it('should include timestamp in log messages', () => {
        logger.info('Test message');

        const loggedMessage = consoleSpy.info.mock.calls[0][0];
        // Check for ISO timestamp format
        expect(loggedMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });

      it('should pass additional arguments', () => {
        const extraData = { key: 'value' };
        logger.info('Test message', extraData);

        expect(consoleSpy.info).toHaveBeenCalledWith(
          expect.stringContaining('Test message'),
          extraData
        );
      });

      it('should pass multiple additional arguments', () => {
        logger.info('Test message', 'arg1', 'arg2', 123);

        expect(consoleSpy.info).toHaveBeenCalledWith(
          expect.stringContaining('Test message'),
          'arg1',
          'arg2',
          123
        );
      });
    });

    describe('with prefix', () => {
      beforeEach(() => {
        logger = new ConsoleLogger('MyModule');
      });

      it('should include prefix in log messages', () => {
        logger.info('Test message');

        const loggedMessage = consoleSpy.info.mock.calls[0][0];
        expect(loggedMessage).toContain('[MyModule]');
      });

      it('should format message with timestamp and prefix', () => {
        logger.info('Test message');

        const loggedMessage = consoleSpy.info.mock.calls[0][0];
        // Format: [timestamp] [prefix] message
        expect(loggedMessage).toMatch(/\[.*\] \[MyModule\] Test message/);
      });

      it('should include prefix in all log levels', () => {
        logger.info('Info');
        logger.warn('Warn');
        logger.error('Error');
        logger.debug('Debug');

        expect(consoleSpy.info.mock.calls[0][0]).toContain('[MyModule]');
        expect(consoleSpy.warn.mock.calls[0][0]).toContain('[MyModule]');
        expect(consoleSpy.error.mock.calls[0][0]).toContain('[MyModule]');
        expect(consoleSpy.debug.mock.calls[0][0]).toContain('[MyModule]');
      });
    });
  });

  describe('createLogger', () => {
    it('should create a ConsoleLogger with the given prefix', () => {
      const logger = createLogger('TestModule');

      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should return an ILogger instance', () => {
      const logger: ILogger = createLogger('TestModule');

      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.debug).toBeDefined();
    });
  });

  describe('ILogger interface', () => {
    it('should be implemented by ConsoleLogger', () => {
      const logger: ILogger = new ConsoleLogger('Test');

      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });
});
