import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { WebhooksParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Webhooks Tool - Manages webhooks for Penpot teams
 */
export class WebhooksTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: WebhooksParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('WebhooksTool executing', { action, params });

    switch (action) {
      case 'list':
        if (!params.teamId) {
          return ResponseFormatter.formatError('teamId is required for list action');
        }
        return client.webhooks.getTeamWebhooks(params.teamId);

      case 'create':
        if (!params.teamId || !params.uri) {
          return ResponseFormatter.formatError('teamId and uri are required for create action');
        }
        return client.webhooks.createWebhook(params.teamId, params.uri, params.mtype || 'json');

      case 'update':
        if (!params.webhookId) {
          return ResponseFormatter.formatError('webhookId is required for update action');
        }
        return client.webhooks.updateWebhook(params.webhookId, {
          uri: params.uri,
          mtype: params.mtype,
          isActive: params.isActive,
        });

      case 'delete':
        if (!params.webhookId) {
          return ResponseFormatter.formatError('webhookId is required for delete action');
        }
        return client.webhooks.deleteWebhook(params.webhookId);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
