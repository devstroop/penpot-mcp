export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log categories for filtering and organizing logs
 */
export type LogCategory =
  | 'AUTH' // Authentication related
  | 'API' // API requests/responses
  | 'TOOL' // Tool execution
  | 'CACHE' // Cache operations
  | 'FILE' // File operations
  | 'SHAPE' // Shape/object operations
  | 'SERVER' // Server lifecycle
  | 'SYSTEM'; // General system logs

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  category?: LogCategory;
  correlationId?: string;
  duration?: number;
  data?: unknown;
}

interface TimingContext {
  startTime: number;
  operation: string;
  category?: LogCategory;
  data?: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Category icons (no ANSI colors - just unicode)
const CATEGORY_ICONS: Record<LogCategory, string> = {
  AUTH: '🔐',
  API: '🌐',
  TOOL: '🔧',
  CACHE: '📦',
  FILE: '📄',
  SHAPE: '🎨',
  SERVER: '🖥️',
  SYSTEM: '⚙️',
};

// Level icons
const LEVEL_ICONS: Record<LogLevel, string> = {
  debug: '🔍',
  info: '✅',
  warn: '⚠️',
  error: '❌',
};

export class Logger {
  private minLevel: LogLevel;
  private correlationId: string | null = null;
  private activeTimings: Map<string, TimingContext> = new Map();
  private requestCounter = 0;
  private enabledCategories: Set<LogCategory> | null = null; // null = all enabled

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

  // Maximum length for logged data before truncation
  private readonly MAX_DATA_LENGTH = 500;

  constructor(level?: LogLevel) {
    // Default to info for cleaner output, debug for development
    this.minLevel = level ?? (process.env['LOG_LEVEL'] as LogLevel) ?? 'info';
  }

  /**
   * Change the minimum log level at runtime
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Filter logs to specific categories (null = all)
   */
  setCategories(categories: LogCategory[] | null): void {
    this.enabledCategories = categories ? new Set(categories) : null;
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(id: string | null): void {
    this.correlationId = id;
  }

  /**
   * Generate a new correlation ID
   */
  generateCorrelationId(): string {
    const id = `req-${++this.requestCounter}-${Date.now().toString(36)}`;
    this.correlationId = id;
    return id;
  }

  private shouldLog(level: LogLevel, category?: LogCategory): boolean {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) return false;
    if (category && this.enabledCategories && !this.enabledCategories.has(category)) return false;
    return true;
  }

  /**
   * Recursively sanitizes data to redact sensitive values before logging.
   */
  sanitize(data: unknown, depth = 0): unknown {
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

  /**
   * Compact JSON stringify - single line for small objects
   */
  private compactStringify(data: unknown): string {
    const str = JSON.stringify(data);
    if (str.length <= this.MAX_DATA_LENGTH) {
      return str;
    }
    return str.slice(0, this.MAX_DATA_LENGTH) + `...[truncated]`;
  }

  /**
   * Format timestamp as HH:MM:SS
   */
  private formatTime(timestamp: string): string {
    return timestamp.split('T')[1].split('.')[0];
  }

  /**
   * Format a log entry as a clean, single-line string (no ANSI codes)
   */
  private formatEntry(entry: LogEntry): string {
    const time = this.formatTime(entry.timestamp);
    const levelStr = entry.level.toUpperCase().padEnd(5);

    // Build the log line
    const parts: string[] = [];

    // [TIME] LEVEL
    parts.push(`[${time}]`);
    parts.push(levelStr);

    // Category with icon
    if (entry.category) {
      const icon = CATEGORY_ICONS[entry.category];
      parts.push(`${icon} ${entry.category}`);
    } else {
      parts.push(LEVEL_ICONS[entry.level]);
    }

    // Correlation ID
    if (entry.correlationId) {
      parts.push(`[${entry.correlationId}]`);
    }

    // Duration
    if (entry.duration !== undefined) {
      const durationStr =
        entry.duration < 1000 ? `${entry.duration}ms` : `${(entry.duration / 1000).toFixed(2)}s`;
      parts.push(`(${durationStr})`);
    }

    // Message
    parts.push(entry.message);

    // Data (compact, single line)
    if (entry.data !== undefined) {
      const sanitized = this.sanitize(entry.data);
      const dataStr = this.compactStringify(sanitized);
      parts.push(`| ${dataStr}`);
    }

    return parts.join(' ');
  }

  private log(level: LogLevel, message: string, data?: unknown, category?: LogCategory): void {
    if (!this.shouldLog(level, category)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      category,
      correlationId: this.correlationId ?? undefined,
      data,
    };

    const formatted = this.formatEntry(entry);

    // Always write to stderr to avoid interfering with MCP stdio protocol
    console.error(formatted);
  }

  // ==================== Basic Logging ====================

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

  // ==================== Category-Specific Logging ====================

  auth(level: LogLevel, message: string, data?: unknown): void {
    this.log(level, message, data, 'AUTH');
  }

  api(level: LogLevel, message: string, data?: unknown): void {
    this.log(level, message, data, 'API');
  }

  tool(level: LogLevel, message: string, data?: unknown): void {
    this.log(level, message, data, 'TOOL');
  }

  cache(level: LogLevel, message: string, data?: unknown): void {
    this.log(level, message, data, 'CACHE');
  }

  file(level: LogLevel, message: string, data?: unknown): void {
    this.log(level, message, data, 'FILE');
  }

  shape(level: LogLevel, message: string, data?: unknown): void {
    this.log(level, message, data, 'SHAPE');
  }

  server(level: LogLevel, message: string, data?: unknown): void {
    this.log(level, message, data, 'SERVER');
  }

  // ==================== Performance Timing ====================

  /**
   * Start timing an operation
   */
  startTiming(operation: string, category?: LogCategory, data?: unknown): string {
    const id = `${operation}-${Date.now()}`;
    this.activeTimings.set(id, {
      startTime: performance.now(),
      operation,
      category,
      data,
    });
    this.log('debug', `Starting: ${operation}`, data, category);
    return id;
  }

  /**
   * End timing and log the duration
   */
  endTiming(id: string, level: LogLevel = 'info', additionalData?: unknown): number {
    const timing = this.activeTimings.get(id);
    if (!timing) {
      this.warn(`No timing found for id: ${id}`);
      return 0;
    }

    const duration = Math.round(performance.now() - timing.startTime);
    const data = additionalData
      ? { ...(timing.data as object), ...(additionalData as object) }
      : timing.data;

    const entry: LogEntry = {
      level,
      message: `Completed: ${timing.operation}`,
      timestamp: new Date().toISOString(),
      category: timing.category,
      correlationId: this.correlationId ?? undefined,
      duration,
      data,
    };

    const formatted = this.formatEntry(entry);
    console.error(formatted);

    this.activeTimings.delete(id);
    return duration;
  }

  /**
   * Measure an async operation
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    category?: LogCategory,
    level: LogLevel = 'info'
  ): Promise<T> {
    const id = this.startTiming(operation, category);
    try {
      const result = await fn();
      this.endTiming(id, level, { success: true });
      return result;
    } catch (error) {
      this.endTiming(id, 'error', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ==================== Group Logging ====================

  /**
   * Log the start of a group of related operations
   */
  groupStart(title: string, category?: LogCategory): void {
    const icon = category ? CATEGORY_ICONS[category] : '📋';
    this.log('info', `${icon} ─── ${title} ───`, undefined, category);
  }

  /**
   * Log the end of a group
   */
  groupEnd(title: string, success: boolean, category?: LogCategory): void {
    const icon = success ? '✅' : '❌';
    this.log(
      success ? 'info' : 'error',
      `${icon} ─── ${title} ${success ? 'SUCCESS' : 'FAILED'} ───`,
      undefined,
      category
    );
  }

  // ==================== Utility ====================

  /**
   * Create a child logger with a specific correlation ID
   */
  child(correlationId: string): Logger {
    const child = new Logger(this.minLevel);
    child.enabledCategories = this.enabledCategories;
    child.setCorrelationId(correlationId);
    return child;
  }

  /**
   * Log a simple key-value summary
   */
  summary(title: string, data: Record<string, unknown>, level: LogLevel = 'info'): void {
    const pairs = Object.entries(data)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    this.log(level, `${title}: ${pairs}`);
  }
}

export const logger = new Logger();
