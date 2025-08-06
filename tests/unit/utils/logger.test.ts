import { Logger, LogLevel, LogContext } from '../../../src/utils/logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    // Get a fresh logger instance for each test
    logger = Logger.getInstance();
    logger.clearLogs();
    logger.setLogLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env['MUSHCODE_LOG_LEVEL'];
    delete process.env['NODE_ENV'];
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      
      expect(logger1).toBe(logger2);
    });
  });

  describe('Log Level Management', () => {
    it('should set and get log level', () => {
      logger.setLogLevel(LogLevel.WARN);
      expect(logger.getLogLevel()).toBe(LogLevel.WARN);
    });

    it('should respect log level filtering', () => {
      logger.setLogLevel(LogLevel.WARN);
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0]?.level).toBe(LogLevel.WARN);
      expect(logs[1]?.level).toBe(LogLevel.ERROR);
    });

    it('should read log level from environment variable', () => {
      process.env['MUSHCODE_LOG_LEVEL'] = 'error';
      
      // Create a new logger instance to test environment variable reading
      const testLogger = new (Logger as any)();
      expect(testLogger.getLogLevel()).toBe(LogLevel.ERROR);
    });
  });

  describe('Basic Logging', () => {
    it('should log debug messages', () => {
      const context: LogContext = { toolName: 'test_tool' };
      logger.debug('debug message', context);
      
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe(LogLevel.DEBUG);
      expect(logs[0]?.message).toBe('debug message');
      expect(logs[0]?.context).toEqual(context);
    });

    it('should log info messages', () => {
      logger.info('info message');
      
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe(LogLevel.INFO);
      expect(logs[0]?.message).toBe('info message');
    });

    it('should log warning messages', () => {
      logger.warn('warning message');
      
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe(LogLevel.WARN);
      expect(logs[0]?.message).toBe('warning message');
    });

    it('should log error messages with error objects', () => {
      const error = new Error('test error');
      error.stack = 'test stack trace';
      
      logger.error('error message', error);
      
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe(LogLevel.ERROR);
      expect(logs[0]?.message).toBe('error message');
      expect(logs[0]?.error).toEqual({
        name: 'Error',
        message: 'test error',
        stack: 'test stack trace',
        code: undefined
      });
    });

    it('should log fatal messages', () => {
      const error = new Error('fatal error');
      logger.fatal('fatal message', error);
      
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe(LogLevel.FATAL);
      expect(logs[0]?.message).toBe('fatal message');
      expect(logs[0]?.error?.message).toBe('fatal error');
    });
  });

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      const context: LogContext = { operation: 'test_operation' };
      logger.performance('test_operation', 150, context);
      
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe(LogLevel.INFO);
      expect(logs[0]?.message).toBe('Performance: test_operation completed in 150ms');
      expect(logs[0]?.performance).toEqual({
        duration: 150,
        operation: 'test_operation'
      });
    });

    it('should create and use performance timers', (done) => {
      const endTimer = logger.startTimer('timer_test');
      
      setTimeout(() => {
        endTimer();
        
        const logs = logger.getRecentLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0]?.message).toContain('Performance: timer_test completed in');
        expect(logs[0]?.performance?.operation).toBe('timer_test');
        expect(logs[0]?.performance?.duration).toBeGreaterThan(0);
        done();
      }, 10);
    });
  });

  describe('Log Retrieval and Management', () => {
    beforeEach(() => {
      logger.debug('debug 1');
      logger.info('info 1');
      logger.warn('warn 1');
      logger.error('error 1');
      logger.fatal('fatal 1');
    });

    it('should get recent logs with limit', () => {
      const logs = logger.getRecentLogs(3);
      expect(logs).toHaveLength(3);
      expect(logs[0]?.message).toBe('warn 1');
      expect(logs[1]?.message).toBe('error 1');
      expect(logs[2]?.message).toBe('fatal 1');
    });

    it('should get logs by level', () => {
      const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0]?.message).toBe('error 1');
      
      const warnLogs = logger.getLogsByLevel(LogLevel.WARN);
      expect(warnLogs).toHaveLength(1);
      expect(warnLogs[0]?.message).toBe('warn 1');
    });

    it('should clear all logs', () => {
      expect(logger.getRecentLogs()).toHaveLength(5);
      
      logger.clearLogs();
      expect(logger.getRecentLogs()).toHaveLength(0);
    });

    it('should provide log statistics', () => {
      const stats = logger.getLogStats();
      
      expect(stats['total']).toBe(5);
      expect(stats['debug']).toBe(1);
      expect(stats['info']).toBe(1);
      expect(stats['warn']).toBe(1);
      expect(stats['error']).toBe(1);
      expect(stats['fatal']).toBe(1);
    });
  });

  describe('Log Rotation', () => {
    it('should rotate logs when max entries exceeded', () => {
      // Set a small max for testing
      (logger as any).maxLogEntries = 3;
      
      logger.info('message 1');
      logger.info('message 2');
      logger.info('message 3');
      logger.info('message 4');
      logger.info('message 5');
      
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0]?.message).toBe('message 3');
      expect(logs[1]?.message).toBe('message 4');
      expect(logs[2]?.message).toBe('message 5');
    });
  });

  describe('Context Handling', () => {
    it('should handle complex context objects', () => {
      const context: LogContext = {
        toolName: 'generate_mushcode',
        operation: 'code_generation',
        userId: 'user123',
        sessionId: 'session456',
        requestId: 'req789',
        serverType: 'PennMUSH',
        customField: 'custom_value'
      };
      
      logger.info('test message', context);
      
      const logs = logger.getRecentLogs();
      expect(logs[0]?.context).toEqual(context);
    });

    it('should handle undefined context gracefully', () => {
      logger.info('test message');
      
      const logs = logger.getRecentLogs();
      expect(logs[0]?.context).toBeUndefined();
    });
  });

  describe('Timestamp Handling', () => {
    it('should include ISO timestamp in log entries', () => {
      const beforeTime = new Date().toISOString();
      logger.info('test message');
      const afterTime = new Date().toISOString();
      
      const logs = logger.getRecentLogs();
      const logTime = logs[0]?.timestamp;
      
      expect(logTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(logTime! >= beforeTime).toBe(true);
      expect(logTime! <= afterTime).toBe(true);
    });
  });

  describe('Console Output', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      jest.spyOn(console, 'debug').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should output to console in non-production environment', () => {
      process.env['NODE_ENV'] = 'development';
      
      logger.info('test message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: test message')
      );
    });

    it('should not output to console in production environment', () => {
      process.env['NODE_ENV'] = 'production';
      
      logger.info('test message');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});

describe('logMethodCall decorator', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = Logger.getInstance();
    logger.clearLogs();
    logger.setLogLevel(LogLevel.DEBUG);
  });

  it('should be available for import', async () => {
    const { logMethodCall } = await import('../../../src/utils/logger');
    expect(typeof logMethodCall).toBe('function');
  });
});