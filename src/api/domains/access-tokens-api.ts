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

      // Mask token values for security (only show last 4 chars)
      const safeTokens = tokens.map((token: Record<string, unknown>) => ({
        ...token,
        token: token['token'] ? `****${String(token['token']).slice(-4)}` : undefined,
      }));

      return ResponseFormatter.formatList(safeTokens, 'accessToken', {
        total: tokens.length,
      });
    } catch (error) {
      logger.error('Failed to get access tokens', error);
      return ErrorHandler.handle(error, 'getAccessTokens');
    }
  }

  /**
   * Create a new access token
   */
  async createAccessToken(
    name: string,
    expiresAt?: string // ISO date string or null for no expiration
  ): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:name': name,
      };

      if (expiresAt) {
        // Convert ISO string to Transit datetime
        const date = new Date(expiresAt);
        payload['~:expiration-date'] = `~m${date.getTime()}`;
      }

      const response = await this.post<unknown>('/rpc/command/create-access-token', payload, true);

      const result = this.normalizeTransitResponse(response) as Record<string, unknown>;

      // IMPORTANT: The token value is only returned once at creation time
      // User must save it immediately
      return ResponseFormatter.formatSuccess(
        {
          ...result,
          warning: 'IMPORTANT: Save this token now. It will not be shown again.',
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
