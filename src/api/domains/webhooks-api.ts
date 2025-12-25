import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export type WebhookMimeType = 'json' | 'transit';

export interface Webhook {
  id: string;
  teamId: string;
  uri: string;
  mtype: WebhookMimeType;
  isActive?: boolean;
  errorCode?: string;
  errorCount?: number;
}

/**
 * Webhooks API Client - Manage webhooks for teams
 * ISSUE-016: Webhooks
 */
export class WebhooksAPIClient extends BaseAPIClient {
  /**
   * Get all webhooks for a team
   */
  async getTeamWebhooks(teamId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
      };

      const response = await this.post<unknown>('/rpc/command/get-webhooks', payload, true);

      const data = this.normalizeTransitResponse(response);
      const webhooks = Array.isArray(data) ? data : [];

      return ResponseFormatter.formatList(webhooks, 'webhook', {
        teamId,
        total: webhooks.length,
      });
    } catch (error) {
      logger.error('Failed to get webhooks', error);
      return ErrorHandler.handle(error, `getTeamWebhooks(${teamId})`);
    }
  }

  /**
   * Create a webhook for a team
   */
  async createWebhook(
    teamId: string,
    uri: string,
    mtype: WebhookMimeType = 'json'
  ): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
        '~:uri': uri,
        '~:mtype': `~:${mtype}`,
      };

      const response = await this.post<unknown>('/rpc/command/create-webhook', payload, true);

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, 'Webhook created');
    } catch (error) {
      logger.error('Failed to create webhook', error);
      return ErrorHandler.handle(error, 'createWebhook');
    }
  }

  /**
   * Update a webhook
   */
  async updateWebhook(
    webhookId: string,
    updates: {
      uri?: string;
      mtype?: WebhookMimeType;
      isActive?: boolean;
    }
  ): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:id': `~u${webhookId}`,
      };

      if (updates.uri !== undefined) {
        payload['~:uri'] = updates.uri;
      }
      if (updates.mtype !== undefined) {
        payload['~:mtype'] = `~:${updates.mtype}`;
      }
      if (updates.isActive !== undefined) {
        payload['~:is-active'] = updates.isActive;
      }

      const response = await this.post<unknown>('/rpc/command/update-webhook', payload, true);

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, 'Webhook updated');
    } catch (error) {
      logger.error('Failed to update webhook', error);
      return ErrorHandler.handle(error, 'updateWebhook');
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${webhookId}`,
      };

      await this.post<unknown>('/rpc/command/delete-webhook', payload, true);

      return ResponseFormatter.formatSuccess({ deleted: true, webhookId }, 'Webhook deleted');
    } catch (error) {
      logger.error('Failed to delete webhook', error);
      return ErrorHandler.handle(error, 'deleteWebhook');
    }
  }
}
