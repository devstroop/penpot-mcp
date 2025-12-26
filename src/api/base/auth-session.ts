import axios from 'axios';
import { logger } from '../../logger.js';

/**
 * Auth Session Manager
 *
 * Singleton class that manages authentication state shared across all API clients.
 * Supports two authentication modes:
 * 1. Access Token - Direct token (preferred for cloud/social login)
 * 2. Username/Password - Login flow (for self-hosted or password accounts)
 */
export class AuthSessionManager {
  private authToken: string | null = null;
  private profileId: string | null = null;
  private authPromise: Promise<void> | null = null;
  private lastAuthTime: number = 0;
  private readonly AUTH_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly useAccessToken: boolean;

  constructor(
    private readonly baseURL: string,
    private readonly accessToken?: string,
    private readonly username?: string,
    private readonly password?: string
  ) {
    this.useAccessToken = !!accessToken;

    // If using access token, set it immediately
    if (this.useAccessToken && accessToken) {
      this.authToken = accessToken;
      this.lastAuthTime = Date.now();
      logger.auth('info', 'Using access token authentication');
    }
  }

  /**
   * Get the current auth token, authenticating if necessary.
   * Uses lock to prevent duplicate auth requests.
   */
  async getAuthToken(): Promise<string> {
    // If using access token, return it directly (no expiry for access tokens)
    if (this.useAccessToken && this.authToken) {
      // Fetch profile ID on first use if needed
      if (!this.profileId) {
        await this.fetchProfileId();
      }
      return this.authToken;
    }

    // If we have a valid cached token, return it
    if (this.authToken && this.isTokenValid()) {
      return this.authToken;
    }

    // If auth is already in progress, wait for it
    if (this.authPromise) {
      await this.authPromise;
      if (this.authToken) {
        return this.authToken;
      }
    }

    // Start new authentication (password flow)
    this.authPromise = this.authenticate();

    try {
      await this.authPromise;
    } finally {
      this.authPromise = null;
    }

    if (!this.authToken) {
      throw new Error('Authentication failed - no token received');
    }

    return this.authToken;
  }

  /**
   * Get the profile ID (requires authentication first)
   */
  async getProfileId(): Promise<string | null> {
    await this.getAuthToken();
    return this.profileId;
  }

  /**
   * Check if the current token is still valid
   */
  private isTokenValid(): boolean {
    if (!this.authToken || !this.lastAuthTime) {
      return false;
    }
    return Date.now() - this.lastAuthTime < this.AUTH_CACHE_TTL;
  }

  /**
   * Perform authentication (password flow only)
   */
  private async authenticate(): Promise<void> {
    if (this.useAccessToken) {
      // Access token doesn't need login flow
      return;
    }

    if (!this.username || !this.password) {
      throw new Error('Username and password required for password authentication');
    }

    const url = `${this.baseURL}/rpc/command/login-with-password`;

    const payload = {
      '~:email': this.username,
      '~:password': this.password,
    };

    logger.auth('info', 'Authenticating...', {
      email: this.username,
      url: this.baseURL,
    });

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/transit+json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        withCredentials: true,
      });

      // Extract auth token from cookies
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        for (const cookie of setCookie) {
          if (cookie.includes('auth-token=')) {
            const match = cookie.match(/auth-token=([^;]+)/);
            if (match) {
              this.authToken = match[1];
              this.lastAuthTime = Date.now();
              logger.auth('info', 'Authentication successful');
            }
          }
        }
      }

      // Extract profile ID from response
      const data = response.data;
      this.extractProfileId(data);

      if (!this.authToken) {
        throw new Error('Auth token not found in response');
      }

      // If profile ID wasn't in login response, fetch it from profile endpoint
      if (!this.profileId && this.authToken) {
        await this.fetchProfileId();
      }
    } catch (error) {
      logger.auth('error', 'Authentication failed', error);
      this.authToken = null;
      this.profileId = null;
      this.lastAuthTime = 0;
      throw error;
    }
  }

  /**
   * Clear the session (for logout or re-auth)
   */
  clearSession(): void {
    this.authToken = null;
    this.profileId = null;
    this.lastAuthTime = 0;
    this.authPromise = null;
    logger.auth('debug', 'Session cleared');
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  /**
   * Extract profile ID from various response formats
   */
  private extractProfileId(data: unknown): void {
    if (!data) return;

    // Try object format first (most common)
    if (typeof data === 'object' && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;

      // Direct id field
      if (obj['id']) {
        this.setProfileId(obj['id']);
        return;
      }

      // Transit key formats
      if (obj['~:id']) {
        this.setProfileId(obj['~:id']);
        return;
      }
    }

    // Transit+JSON array format: ["^ ", "~:key1", value1, "~:key2", value2, ...]
    if (Array.isArray(data)) {
      // Check for Transit map marker
      if (data[0] === '^ ') {
        for (let i = 1; i < data.length - 1; i += 2) {
          if (data[i] === '~:id' || data[i] === 'id') {
            this.setProfileId(data[i + 1]);
            return;
          }
        }
      }

      // Standard array format
      for (let i = 1; i < data.length - 1; i += 2) {
        if (data[i] === '~:id' || data[i] === 'id') {
          this.setProfileId(data[i + 1]);
          return;
        }
      }
    }
  }

  /**
   * Set profile ID, handling Transit UUID prefix
   */
  private setProfileId(value: unknown): void {
    if (!value) return;

    let profileId = String(value);
    if (profileId.startsWith('~u')) {
      profileId = profileId.slice(2);
    }
    this.profileId = profileId;
    logger.auth('debug', 'Profile ID set', { profileId });
  }

  /**
   * Fetch profile ID from profile endpoint if not available from login
   */
  private async fetchProfileId(): Promise<void> {
    try {
      const url = `${this.baseURL}/rpc/command/get-profile`;

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            'Content-Type': 'application/transit+json',
            Accept: 'application/transit+json',
            Cookie: `auth-token=${this.authToken}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
        }
      );

      this.extractProfileId(response.data);

      if (this.profileId) {
        logger.auth('info', 'Profile ID fetched successfully', { profileId: this.profileId });
      } else {
        logger.auth('warn', 'Could not extract profile ID from profile response');
      }
    } catch (error) {
      logger.auth('error', 'Failed to fetch profile ID', error);
    }
  }
}
