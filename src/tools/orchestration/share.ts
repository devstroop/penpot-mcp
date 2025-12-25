import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { ShareParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Share Tool - Manages share links for Penpot files
 */
export class ShareTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: ShareParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('ShareTool executing', { action, params });

    switch (action) {
      case 'list':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for list action');
        }
        return client.share.getShareLinks(params.fileId);

      case 'create':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for create action');
        }
        return client.share.createShareLink(params.fileId, {
          pages: params.pageId ? [params.pageId] : undefined,
          whoInspect: params.permission,
        });

      case 'delete':
        if (!params.shareId) {
          return ResponseFormatter.formatError('shareId is required for delete action');
        }
        return client.share.deleteShareLink(params.shareId);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
