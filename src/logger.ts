type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel;

  // Keys that should have their values redacted in logs
  private readonly SENSITIVE_KEYS = [
    'password',
    'token',
    'auth',
    'secret',
    'key',
    'cookie',
    'credential',
    'authorization',
    'apikey',
    'api_key',
    'access_token',
    'refresh_token',
  ];

  constructor() {
    this.minLevel = (process.env['LOG_LEVEL'] as LogLevel) || 'info';
  }

  private get isMcpServer(): boolean {
    return process.env['MCP_SERVER'] === 'true';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  /**
   * Recursively sanitizes data to redact sensitive values before logging.
   * Prevents accidental exposure of credentials, tokens, and other secrets.
   */
  private sanitize(data: unknown, depth = 0): unknown {
    // Prevent infinite recursion on deeply nested or circular structures
    if (depth > 10) return '[MAX_DEPTH]';
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item, depth + 1));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (this.SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private formatEntry(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    if (entry.data !== undefined) {
      return `${base} ${JSON.stringify(this.sanitize(entry.data))}`;
    }
    return base;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    const formatted = this.formatEntry(entry);

    // In MCP server mode, write to stderr to avoid interfering with stdio protocol
    if (this.isMcpServer) {
      console.error(formatted);
    } else {
      if (level === 'error') {
        console.error(formatted);
      } else {
        console.log(formatted);
      }
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }
}

export const logger = new Logger();
