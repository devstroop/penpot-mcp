import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { AccessTokensParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Access Tokens Tool - Manages programmatic access tokens
 *
 * Access tokens allow programmatic API access without browser sessions.
 * Tokens can have optional expiration dates using duration format (e.g., "30d", "1y").
 */
export class AccessTokensTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: AccessTokensParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('AccessTokensTool executing', { action, params });

    switch (action) {
      case 'list':
        return client.accessTokens.getAccessTokens();

      case 'create':
        if (!params.name) {
          return ResponseFormatter.formatError('name is required for create action');
        }
        return client.accessTokens.createAccessToken(params.name, params.expiration);

      case 'delete':
        if (!params.tokenId) {
          return ResponseFormatter.formatError('tokenId is required for delete action');
        }
        return client.accessTokens.deleteAccessToken(params.tokenId);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
