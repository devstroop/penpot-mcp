import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { LibraryParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Library Tool - Shared library management
 */
export class LibraryTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: LibraryParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('LibraryTool executing', { action, params });

    switch (action) {
      case 'shared':
        if (!params.teamId) {
          return ResponseFormatter.formatError('teamId is required for shared action');
        }
        return client.library.getSharedLibraries(params.teamId);

      case 'link':
        if (!params.fileId || !params.libraryId) {
          return ResponseFormatter.formatError('fileId and libraryId are required for link action');
        }
        return client.library.linkLibrary(params.fileId, params.libraryId);

      case 'unlink':
        if (!params.fileId || !params.libraryId) {
          return ResponseFormatter.formatError('fileId and libraryId are required for unlink action');
        }
        return client.library.unlinkLibrary(params.fileId, params.libraryId);

      case 'linked':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for linked action');
        }
        return client.library.getLinkedLibraries(params.fileId);

      case 'publish':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for publish action');
        }
        return client.library.publishAsLibrary(params.fileId);

      case 'unpublish':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for unpublish action');
        }
        return client.library.unpublishLibrary(params.fileId);

      case 'summary':
        if (!params.libraryId) {
          return ResponseFormatter.formatError('libraryId is required for summary action');
        }
        return client.library.getLibrarySummary(params.libraryId);

      case 'sync':
        if (!params.fileId || !params.libraryId) {
          return ResponseFormatter.formatError('fileId and libraryId are required for sync action');
        }
        return client.library.syncLibraryUpdates(params.fileId, params.libraryId);

      case 'colors':
        if (!params.libraryId) {
          return ResponseFormatter.formatError('libraryId is required for colors action');
        }
        return client.library.getLibraryColors(params.libraryId);

      case 'typography':
        if (!params.libraryId) {
          return ResponseFormatter.formatError('libraryId is required for typography action');
        }
        return client.library.getLibraryTypographies(params.libraryId);

      case 'components':
        if (!params.libraryId) {
          return ResponseFormatter.formatError('libraryId is required for components action');
        }
        return client.library.getLibraryComponents(params.libraryId);

      case 'search':
        if (!params.teamId) {
          return ResponseFormatter.formatError('teamId is required for search action');
        }
        return client.library.searchLibraries(params.teamId, params.query || '');

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
