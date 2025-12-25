/**
 * Unit tests for Logger
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel } from '../../src/logger.js';

describe('Logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log level filtering', () => {
    it('should log error messages at ERROR level', () => {
      const logger = new Logger('error');
      logger.error('test error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not log debug messages at ERROR level', () => {
      const logger = new Logger('error');
      logger.debug('test debug');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should log all messages at DEBUG level', () => {
      const logger = new Logger('debug');
      logger.error('error');
      logger.warn('warn');
      logger.info('info');
      logger.debug('debug');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should respect INFO level boundary', () => {
      const logger = new Logger('info');
      logger.debug('should not appear');
      logger.info('should appear');
      
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('log formatting', () => {
    it('should include timestamp in log output', () => {
      const logger = new Logger('info');
      logger.info('test message');
      
      const call = consoleInfoSpy.mock.calls[0][0] as string;
      // Should contain ISO timestamp pattern
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include log level in output', () => {
      const logger = new Logger('info');
      logger.info('test message');
      
      const call = consoleInfoSpy.mock.calls[0][0] as string;
      expect(call).toContain('[INFO]');
    });

    it('should include message in output', () => {
      const logger = new Logger('info');
      logger.info('my specific message');
      
      const call = consoleInfoSpy.mock.calls[0][0] as string;
      expect(call).toContain('my specific message');
    });
  });

  describe('sensitive data sanitization', () => {
    it('should sanitize password fields', () => {
      const logger = new Logger('info');
      const data = { username: 'user', password: 'secret123' };
      const sanitized = logger.sanitize(data) as Record<string, string>;
      
      expect(sanitized.username).toBe('user');
      expect(sanitized.password).toBe('[REDACTED]');
    });

    it('should sanitize token fields', () => {
      const logger = new Logger('info');
      const data = { authToken: 'abc123', accessToken: 'xyz789' };
      const sanitized = logger.sanitize(data) as Record<string, string>;
      
      expect(sanitized.authToken).toBe('[REDACTED]');
      expect(sanitized.accessToken).toBe('[REDACTED]');
    });

    it('should sanitize cookie fields', () => {
      const logger = new Logger('info');
      const data = { cookie: 'session=abc123' };
      const sanitized = logger.sanitize(data) as Record<string, string>;
      
      expect(sanitized.cookie).toBe('[REDACTED]');
    });

    it('should handle nested objects', () => {
      const logger = new Logger('info');
      const data = { 
        user: { 
          name: 'test',
          password: 'secret' // password at this level
        }
      };
      const sanitized = logger.sanitize(data) as { user: { name: string; password: string } };
      
      expect(sanitized.user.name).toBe('test');
      expect(sanitized.user.password).toBe('[REDACTED]');
    });

    it('should handle arrays', () => {
      const logger = new Logger('info');
      const data = [
        { username: 'user1', password: 'pass1' },
        { username: 'user2', password: 'pass2' },
      ];
      const sanitized = logger.sanitize(data) as Array<{ username: string; password: string }>;
      
      expect(sanitized[0].password).toBe('[REDACTED]');
      expect(sanitized[1].password).toBe('[REDACTED]');
    });

    it('should not modify original object', () => {
      const logger = new Logger('info');
      const original = { password: 'secret' };
      logger.sanitize(original);
      
      expect(original.password).toBe('secret');
    });

    it('should handle primitive values', () => {
      const logger = new Logger('info');
      expect(logger.sanitize('string')).toBe('string');
      expect(logger.sanitize(123)).toBe(123);
      expect(logger.sanitize(null)).toBe(null);
    });
  });

  describe('setLevel', () => {
    it('should allow changing log level', () => {
      const logger = new Logger('error');
      logger.debug('should not log');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      
      logger.setLevel('debug');
      logger.debug('should log now');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });
});
