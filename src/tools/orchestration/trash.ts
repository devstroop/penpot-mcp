import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { TrashParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Trash Tool - Manages deleted files and recovery
 */
export class TrashTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: TrashParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('TrashTool executing', { action, params });

    if (!params.teamId) {
      return ResponseFormatter.formatError('teamId is required');
    }

    switch (action) {
      case 'list':
        return client.trash.getDeletedFiles(params.teamId);

      case 'restore':
        if (!params.fileIds || params.fileIds.length === 0) {
          return ResponseFormatter.formatError('fileIds are required for restore action');
        }
        return client.trash.restoreFiles(params.teamId, params.fileIds);

      case 'delete_permanently':
        if (!params.fileIds || params.fileIds.length === 0) {
          return ResponseFormatter.formatError(
            'fileIds are required for delete_permanently action'
          );
        }
        return client.trash.permanentlyDelete(params.teamId, params.fileIds);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
