import { AxiosError } from 'axios';
import { logger } from '../../logger.js';
import { MCPResponse, ResponseFormatter } from './response-formatter.js';

export class ErrorHandler {
  /**
   * Handle errors and convert to MCP response format
   */
  static handle(error: unknown, context: string): MCPResponse {
    logger.api('error', `Error in ${context}`, {
      context,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack?.split('\n').slice(0, 3).join('\n'),
            }
          : error,
    });

    if (error instanceof AxiosError) {
      return this.handleAxiosError(error, context);
    }

    if (error instanceof Error) {
      return ResponseFormatter.formatError(error.message, error);
    }

    return ResponseFormatter.formatError(`Unknown error in ${context}`, error);
  }

  private static handleAxiosError(error: AxiosError, context: string): MCPResponse {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;

    let message: string;

    switch (status) {
      case 400:
        message = `Bad request: ${data?.['message'] || 'Invalid parameters'}`;
        break;
      case 401:
        message = 'Authentication failed. Please check your credentials.';
        break;
      case 403:
        message = 'Access denied. You may not have permission for this operation.';
        break;
      case 404:
        message = `Resource not found: ${context}`;
        break;
      case 429:
        message = 'Rate limited. Please wait before making more requests.';
        break;
      case 500:
      case 502:
      case 503:
        message = 'Penpot server error. Please try again later.';
        break;
      default:
        message = `Request failed: ${error.message}`;
    }

    logger.api('warn', `HTTP ${status || 'error'} in ${context}`, {
      status,
      message,
      url: error.config?.url,
    });

    return ResponseFormatter.formatError(message, {
      status,
      context,
      details: data,
    });
  }
}
