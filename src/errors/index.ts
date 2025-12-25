/**
 * Typed Error Hierarchy for Penpot MCP Server
 *
 * Provides programmatic error handling with:
 * - Typed error codes for specific error scenarios
 * - HTTP status code mapping
 * - Automatic MCPResponse conversion
 * - Context preservation for debugging
 */

import { ResponseFormatter, MCPResponse } from '../api/base/index.js';

/**
 * Error codes for programmatic error handling
 */
export enum ErrorCode {
  // Authentication & Authorization
  AUTHENTICATION_FAILED = 'AUTH_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Client Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',

  // Server/External Errors
  API_ERROR = 'API_ERROR',
  CLOUDFLARE_BLOCKED = 'CLOUDFLARE_BLOCKED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Internal Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIGURATION_ERROR = 'CONFIG_ERROR',
}

/**
 * Base error class for all Penpot MCP errors.
 * Provides consistent error handling and MCPResponse conversion.
 */
export class PenpotError extends Error {
  public readonly timestamp: string;

  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode?: number,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PenpotError';
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to MCPResponse format for client consumption
   */
  toMCPResponse(): MCPResponse {
    return ResponseFormatter.formatError(this.message, {
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...this.context,
    });
  }

  /**
   * Create a JSON-serializable representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

/**
 * Authentication failed (invalid credentials, expired session)
 */
export class AuthenticationError extends PenpotError {
  constructor(message = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, ErrorCode.AUTHENTICATION_FAILED, 401, context);
    this.name = 'AuthenticationError';
  }
}

/**
 * User is authenticated but lacks permission for the action
 */
export class ForbiddenError extends PenpotError {
  constructor(message = 'Access forbidden', context?: Record<string, unknown>) {
    super(message, ErrorCode.FORBIDDEN, 403, context);
    this.name = 'ForbiddenError';
  }
}

/**
 * Requested resource not found
 */
export class NotFoundError extends PenpotError {
  constructor(resource: string, id?: string, context?: Record<string, unknown>) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(message, ErrorCode.NOT_FOUND, 404, { resource, id, ...context });
    this.name = 'NotFoundError';
  }
}

/**
 * Input validation failed
 */
export class ValidationError extends PenpotError {
  constructor(message: string, public readonly errors?: Array<{ field: string; message: string }>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, { errors });
    this.name = 'ValidationError';
  }
}

/**
 * Resource conflict (e.g., revision conflicts, duplicate names)
 */
export class ConflictError extends PenpotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.CONFLICT, 409, context);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit exceeded
 */
export class RateLimitError extends PenpotError {
  constructor(public readonly retryAfter?: number) {
    super('Rate limited. Please wait before making more requests.', ErrorCode.RATE_LIMITED, 429, {
      retryAfter,
    });
    this.name = 'RateLimitError';
  }
}

/**
 * CloudFlare protection blocking the request
 */
export class CloudFlareError extends PenpotError {
  constructor() {
    super(
      'CloudFlare protection detected. Please log in via browser first to complete the challenge.',
      ErrorCode.CLOUDFLARE_BLOCKED,
      403
    );
    this.name = 'CloudFlareError';
  }
}

/**
 * Network connectivity issues
 */
export class NetworkError extends PenpotError {
  constructor(message = 'Network error occurred', context?: Record<string, unknown>) {
    super(message, ErrorCode.NETWORK_ERROR, undefined, context);
    this.name = 'NetworkError';
  }
}

/**
 * Request timeout
 */
export class TimeoutError extends PenpotError {
  constructor(operation: string, timeoutMs: number) {
    super(`Operation '${operation}' timed out after ${timeoutMs}ms`, ErrorCode.TIMEOUT, 408, {
      operation,
      timeoutMs,
    });
    this.name = 'TimeoutError';
  }
}

/**
 * API returned an error response
 */
export class ApiError extends PenpotError {
  constructor(
    message: string,
    statusCode?: number,
    public readonly endpoint?: string,
    context?: Record<string, unknown>
  ) {
    super(message, ErrorCode.API_ERROR, statusCode, { endpoint, ...context });
    this.name = 'ApiError';
  }
}

/**
 * Configuration error (missing or invalid config)
 */
export class ConfigurationError extends PenpotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.CONFIGURATION_ERROR, undefined, context);
    this.name = 'ConfigurationError';
  }
}

/**
 * Type guard to check if an error is a PenpotError
 */
export function isPenpotError(error: unknown): error is PenpotError {
  return error instanceof PenpotError;
}

/**
 * Wrap any error as a PenpotError if it isn't already
 */
export function wrapError(error: unknown, context?: Record<string, unknown>): PenpotError {
  if (isPenpotError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new PenpotError(error.message, ErrorCode.INTERNAL_ERROR, undefined, {
      originalError: error.name,
      stack: error.stack,
      ...context,
    });
  }

  return new PenpotError(String(error), ErrorCode.INTERNAL_ERROR, undefined, context);
}
