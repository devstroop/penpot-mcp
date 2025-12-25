/**
 * Unit tests for Config validation
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';

describe('Config', () => {
  describe('ConfigSchema validation', () => {
    // Define the schema inline for testing (same as config.ts)
    const ConfigSchema = z.object({
      PENPOT_BASE_URL: z.string().url().default('https://design.penpot.app').transform(url => url.replace(/\/$/, '')),
      PENPOT_USERNAME: z.string().default(''),
      PENPOT_PASSWORD: z.string().default(''),
      LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    });

    it('should parse valid configuration', () => {
      const input = {
        PENPOT_BASE_URL: 'https://test.penpot.app',
        PENPOT_USERNAME: 'testuser',
        PENPOT_PASSWORD: 'testpass',
        LOG_LEVEL: 'debug',
      };

      const result = ConfigSchema.safeParse(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PENPOT_BASE_URL).toBe('https://test.penpot.app');
        expect(result.data.PENPOT_USERNAME).toBe('testuser');
        expect(result.data.PENPOT_PASSWORD).toBe('testpass');
        expect(result.data.LOG_LEVEL).toBe('debug');
      }
    });

    it('should use default base URL when not provided', () => {
      const input = {
        PENPOT_USERNAME: 'testuser',
        PENPOT_PASSWORD: 'testpass',
      };

      const result = ConfigSchema.safeParse(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PENPOT_BASE_URL).toBe('https://design.penpot.app');
      }
    });

    it('should default log level to info', () => {
      const input = {
        PENPOT_USERNAME: 'testuser',
        PENPOT_PASSWORD: 'testpass',
      };

      const result = ConfigSchema.safeParse(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.LOG_LEVEL).toBe('info');
      }
    });

    it('should accept valid log levels', () => {
      const validLevels = ['debug', 'info', 'warn', 'error'] as const;
      
      for (const level of validLevels) {
        const result = ConfigSchema.safeParse({
          PENPOT_USERNAME: 'testuser',
          PENPOT_PASSWORD: 'testpass',
          LOG_LEVEL: level,
        });
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.LOG_LEVEL).toBe(level);
        }
      }
    });

    it('should reject invalid log levels', () => {
      const result = ConfigSchema.safeParse({
        PENPOT_USERNAME: 'testuser',
        PENPOT_PASSWORD: 'testpass',
        LOG_LEVEL: 'invalid',
      });
      
      expect(result.success).toBe(false);
    });

    it('should transform base URL to remove trailing slash', () => {
      const result = ConfigSchema.safeParse({
        PENPOT_BASE_URL: 'https://test.penpot.app/',
        PENPOT_USERNAME: 'testuser',
        PENPOT_PASSWORD: 'testpass',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PENPOT_BASE_URL).toBe('https://test.penpot.app');
      }
    });

    it('should default missing username to empty string', () => {
      const result = ConfigSchema.safeParse({
        PENPOT_PASSWORD: 'testpass',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PENPOT_USERNAME).toBe('');
      }
    });

    it('should default missing password to empty string', () => {
      const result = ConfigSchema.safeParse({
        PENPOT_USERNAME: 'testuser',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PENPOT_PASSWORD).toBe('');
      }
    });

    it('should reject invalid URL format', () => {
      const result = ConfigSchema.safeParse({
        PENPOT_BASE_URL: 'not-a-url',
        PENPOT_USERNAME: 'testuser',
        PENPOT_PASSWORD: 'testpass',
      });
      
      expect(result.success).toBe(false);
    });
  });
});
