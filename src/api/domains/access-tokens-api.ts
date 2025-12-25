import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export interface AccessToken {
  id: string;
  name: string;
  createdAt: string;
  expiresAt?: string;
  perms?: string[];
}

/**
 * Access Tokens API Client - Manage programmatic access tokens
 * ISSUE-019: Access Tokens
 *
 * Note: Access tokens allow programmatic API access without user session.
 * These are created per-profile and can have optional expiration dates.
 */
export class AccessTokensAPIClient extends BaseAPIClient {
  /**
   * Get all access tokens for the current user
   */
  async getAccessTokens(): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-access-tokens', {}, true);

      const data = this.normalizeTransitResponse(response);
      const tokens = Array.isArray(data) ? data : [];

      // Format tokens for consistent output (token value is NOT returned for security)
      const formattedTokens = tokens.map((token: Record<string, unknown>) => ({
        id: token['id'] || token['~:id'],
        name: token['name'] || token['~:name'],
        createdAt: token['created-at'] || token['~:created-at'],
        updatedAt: token['updated-at'] || token['~:updated-at'],
        expiresAt: token['expires-at'] || token['~:expires-at'],
      }));

      return ResponseFormatter.formatList(formattedTokens, 'accessToken', {
        total: tokens.length,
      });
    } catch (error) {
      logger.error('Failed to get access tokens', error);

      // Handle CloudFlare or auth errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('CloudFlare') || errorMessage.includes('403')) {
        return ResponseFormatter.formatSuccess(
          {
            tokens: [],
            note: 'Access token management requires authentication. The current session may not have sufficient permissions.',
          },
          'Access token info'
        );
      }

      return ErrorHandler.handle(error, 'getAccessTokens');
    }
  }

  /**
   * Create a new access token
   *
   * @param name - Token name (max 250 characters)
   * @param expiration - Optional duration string like "30d" (30 days), "1y" (1 year)
   */
  async createAccessToken(name: string, expiration?: string): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:name': name,
      };

      // Penpot expects expiration as a duration, not a date
      // e.g., "30d" for 30 days, "1y" for 1 year
      if (expiration) {
        payload['~:expiration'] = expiration;
      }

      const response = await this.post<unknown>('/rpc/command/create-access-token', payload, true);

      const result = this.normalizeTransitResponse(response) as Record<string, unknown>;

      // Format the result
      const formattedResult = {
        id: result['id'] || result['~:id'],
        name: result['name'] || result['~:name'],
        token: result['token'] || result['~:token'], // ONLY returned at creation time
        createdAt: result['created-at'] || result['~:created-at'],
        expiresAt: result['expires-at'] || result['~:expires-at'],
      };

      // IMPORTANT: The token value is only returned once at creation time
      return ResponseFormatter.formatSuccess(
        {
          ...formattedResult,
          warning: 'IMPORTANT: Save this token now. It will NOT be shown again.',
        },
        `Access token "${name}" created`
      );
    } catch (error) {
      logger.error('Failed to create access token', error);
      return ErrorHandler.handle(error, 'createAccessToken');
    }
  }

  /**
   * Delete an access token
   */
  async deleteAccessToken(tokenId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${tokenId}`,
      };

      await this.post<unknown>('/rpc/command/delete-access-token', payload, true);

      return ResponseFormatter.formatSuccess({ deleted: true, tokenId }, 'Access token deleted');
    } catch (error) {
      logger.error('Failed to delete access token', error);
      return ErrorHandler.handle(error, 'deleteAccessToken');
    }
  }
}
