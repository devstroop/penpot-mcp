import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { logger } from '../../logger.js';
import { AuthSessionManager } from './auth-session.js';

export interface MCPResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface PenpotClientConfig {
  baseURL: string;
  /** Access token for authentication (preferred for cloud/social login) */
  accessToken?: string;
  /** Username for password authentication */
  username?: string;
  /** Password for password authentication */
  password?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  /** Enable verbose request/response logging for debugging */
  verboseLogging?: boolean;
  /** Shared auth session manager (injected by ClientFactory) */
  authSession?: AuthSessionManager;
}

/**
 * Base API client for Penpot
 * Handles authentication, request/response interceptors, and Transit+JSON format
 */
export abstract class BaseAPIClient {
  protected client: AxiosInstance;
  protected config: PenpotClientConfig;
  protected authSession: AuthSessionManager;
  private requestCounter = 0;

  constructor(config: PenpotClientConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      verboseLogging: true, // Enable verbose logging by default
      ...config,
    };

    // Use shared auth session or create a new one (for backwards compatibility)
    this.authSession =
      config.authSession ||
      new AuthSessionManager(config.baseURL, config.accessToken, config.username, config.password);

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        Accept: 'application/json, application/transit+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const requestId = ++this.requestCounter;
        // Store request ID for response correlation
        (config as InternalAxiosRequestConfig & { __requestId?: number }).__requestId = requestId;
        (config as InternalAxiosRequestConfig & { __startTime?: number }).__startTime = Date.now();

        // Always log API requests with clear formatting
        logger.api('info', `API REQUEST #${requestId}`, {
          method: config.method?.toUpperCase(),
          url: config.url,
          contentType: config.headers?.['Content-Type'],
        });

        if (this.config.verboseLogging && config.data) {
          logger.api('debug', 'Request body', {
            body: this.truncateBody(config.data, 1000),
          });
        }
        return config;
      },
      (error) => {
        logger.api('error', 'Request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const config = response.config as InternalAxiosRequestConfig & {
          __requestId?: number;
          __startTime?: number;
        };
        const requestId = config.__requestId;
        const duration = config.__startTime ? Date.now() - config.__startTime : undefined;

        // Always log responses with status and timing
        const statusEmoji = response.status >= 200 && response.status < 300 ? '✅' : '⚠️';
        logger.api('info', `API RESPONSE #${requestId} ${statusEmoji}`, {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          duration: duration ? `${duration}ms` : undefined,
        });

        if (this.config.verboseLogging && response.data) {
          logger.api('debug', 'Response data preview', {
            preview: this.truncateBody(response.data, 500),
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        return this.handleResponseError(error);
      }
    );
  }

  /**
   * Sanitize headers for logging (removes auth tokens)
   */
  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...headers };
    const sensitiveKeys = ['cookie', 'authorization', 'auth-token', 'x-api-key'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Truncate request/response body for logging
   */
  private truncateBody(data: unknown, maxLength = 500): string {
    if (data === undefined || data === null) return '';

    let str: string;
    if (typeof data === 'string') {
      str = data;
    } else {
      try {
        str = JSON.stringify(data);
      } catch {
        str = String(data);
      }
    }

    if (str.length > maxLength) {
      return str.slice(0, maxLength) + `... (${str.length - maxLength} more chars)`;
    }
    return str;
  }

  private async handleResponseError(error: AxiosError): Promise<never> {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;

    logger.api('error', 'Penpot API error', {
      status,
      url: error.config?.url,
      message: data?.['message'] || error.message,
    });

    // Check for CloudFlare protection
    if (this.isCloudFlareError(error.response)) {
      throw new Error(
        'CloudFlare protection detected. Please log in via browser at ' +
          'https://design.penpot.app first to complete verification.'
      );
    }

    // Handle authentication errors with retry
    if (status === 401 || status === 403) {
      const retryCount =
        (error.config as AxiosRequestConfig & { __retryCount?: number })?.__retryCount ?? 0;

      if (retryCount < (this.config.retryAttempts ?? 3)) {
        logger.auth('info', 'Authentication failed, attempting re-login');
        await this.authenticate();

        if (error.config) {
          const config = error.config as AxiosRequestConfig & { __retryCount?: number };
          config.__retryCount = retryCount + 1;
          return this.client.request(config);
        }
      }
    }

    throw error;
  }

  private isCloudFlareError(response?: AxiosError['response']): boolean {
    if (!response) return false;

    const serverHeader = response.headers?.['server']?.toString().toLowerCase() || '';
    const cfRay = response.headers?.['cf-ray'];

    if (serverHeader.includes('cloudflare') || cfRay) {
      return true;
    }

    const text = typeof response.data === 'string' ? response.data.toLowerCase() : '';
    const indicators = ['cloudflare', 'cf-ray', 'attention required', 'checking your browser'];
    return indicators.some((ind) => text.includes(ind));
  }

  /**
   * Authenticate with Penpot using the shared session manager
   */
  async authenticate(): Promise<void> {
    const token = await this.authSession.getAuthToken();
    this.client.defaults.headers['Cookie'] = `auth-token=${token}`;
  }

  /**
   * Ensure authenticated before making requests
   */
  protected async ensureAuthenticated(): Promise<void> {
    const token = await this.authSession.getAuthToken();
    this.client.defaults.headers['Cookie'] = `auth-token=${token}`;
  }

  /**
   * Convert Transit+JSON response to regular JSON
   * Transit uses caching with ^ prefixed keys. Common mappings:
   * ^A = ~:id, ^= = ~:name, ^4 = ~:type, ^T = ~:width, ^18 = ~:height
   */
  protected normalizeTransitResponse(data: unknown): unknown {
    // Transit cache key mappings
    const transitCache: Record<string, string> = {
      '^A': 'id',
      '^=': 'name',
      '^4': 'type',
      '^T': 'width',
      '^18': 'height',
      '^?': 'modified-at',
      '^W': 'point',
      '^R': 'matrix',
    };

    if (Array.isArray(data)) {
      // Transit array format: ["^ ", "~:key1", value1, "~:key2", value2, ...]
      if (data[0] === '^ ') {
        const result: Record<string, unknown> = {};
        for (let i = 1; i < data.length - 1; i += 2) {
          let key = String(data[i]);
          // Handle cache references
          if (key.startsWith('^')) {
            key = transitCache[key] || key;
          } else {
            key = key.replace(/^~:/, '');
          }
          result[key] = this.normalizeTransitResponse(data[i + 1]);
        }
        return result;
      }
      return data.map((item) => this.normalizeTransitResponse(item));
    }

    if (typeof data === 'object' && data !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        let normalizedKey = key;
        // Handle cache references
        if (key.startsWith('^')) {
          normalizedKey = transitCache[key] || key;
        } else if (key.startsWith('~u')) {
          // UUID keys (e.g., pages-index keys like "~u8d8d1fae-...")
          normalizedKey = key.slice(2);
        } else if (key.startsWith('~:')) {
          // Keyword keys
          normalizedKey = key.slice(2);
        }
        result[normalizedKey] = this.normalizeTransitResponse(value);
      }
      return result;
    }

    if (typeof data === 'string') {
      // Remove Transit prefixes
      if (data.startsWith('~u')) return data.slice(2); // UUID
      if (data.startsWith('~:')) return data.slice(2); // Keyword
    }

    return data;
  }

  /**
   * Convert payload to Transit+JSON format
   */
  protected toTransitPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      const transitKey = key.startsWith('~:') ? key : `~:${key}`;

      if (typeof value === 'string' && this.isUUID(value)) {
        result[transitKey] = `~u${value}`;
      } else {
        result[transitKey] = value;
      }
    }

    return result;
  }

  private isUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    await this.ensureAuthenticated();
    const response = await this.client.get<T>(endpoint, { params });
    return response.data;
  }

  protected async post<T>(
    endpoint: string,
    data?: unknown,
    useTransit: boolean = false
  ): Promise<T> {
    await this.ensureAuthenticated();

    const headers: Record<string, string> = {};
    let payload = data;

    if (useTransit && typeof data === 'object' && data !== null) {
      headers['Content-Type'] = 'application/transit+json';
      headers['Accept'] = 'application/transit+json';
      payload = this.toTransitPayload(data as Record<string, unknown>);
    }

    const response = await this.client.post<T>(endpoint, payload, { headers });
    return response.data;
  }

  /**
   * Post with pre-formatted Transit payload (no conversion)
   * Use this when the payload is already in Transit format
   */
  protected async postTransit<T>(endpoint: string, data: unknown): Promise<T> {
    await this.ensureAuthenticated();

    const headers: Record<string, string> = {
      'Content-Type': 'application/transit+json',
      Accept: 'application/transit+json',
    };

    const response = await this.client.post<T>(endpoint, data, { headers });
    return response.data;
  }

  /**
   * Post with multipart/form-data for file uploads
   */
  protected async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    await this.ensureAuthenticated();

    // Get headers from form-data package (includes boundary)
    const formHeaders = (
      formData as FormData & { getHeaders: () => Record<string, string> }
    ).getHeaders();

    const response = await this.client.post<T>(endpoint, formData, {
      headers: {
        ...formHeaders,
        Accept: 'application/json, application/transit+json',
      },
    });
    return response.data;
  }

  /**
   * Post with Node.js form-data package (for font uploads etc.)
   */
  protected async postNodeFormData<T>(endpoint: string, formData: import('form-data')): Promise<T> {
    await this.ensureAuthenticated();

    // Get headers from form-data package (includes boundary)
    const formHeaders = formData.getHeaders();

    const response = await this.client.post<T>(endpoint, formData, {
      headers: {
        ...formHeaders,
        Accept: 'application/json, application/transit+json',
      },
    });
    return response.data;
  }

  /**
   * Get auth token for export operations
   */
  getAuthToken(): string | null {
    return this.authSession.isAuthenticated() ? 'available' : null;
  }

  /**
   * Get auth token string for requests
   */
  async getAuthTokenString(): Promise<string> {
    return this.authSession.getAuthToken();
  }

  /**
   * Get profile ID for export operations
   */
  async getProfileId(): Promise<string | null> {
    return this.authSession.getProfileId();
  }

  /**
   * Get the shared auth session manager
   */
  getAuthSession(): AuthSessionManager {
    return this.authSession;
  }
}
