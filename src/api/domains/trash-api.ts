import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export interface DeletedFile {
  id: string;
  name: string;
  deletedAt: string;
  projectId?: string;
}

/**
 * Trash API Client - Manage deleted files
 * ISSUE-018: Trash/Recovery
 *
 * NOTE: Penpot doesn't have a dedicated "get deleted files" endpoint in the public API.
 * The restore functionality exists but listing deleted files requires frontend state.
 * We provide restore and permanent delete operations which ARE supported.
 */
export class TrashAPIClient extends BaseAPIClient {
  /**
   * Get deleted files for a team
   * NOTE: This endpoint may not be available in all Penpot versions.
   * The Penpot UI tracks deleted files client-side before permanent deletion.
   */
  async getDeletedFiles(_teamId: string): Promise<MCPResponse> {
    // Penpot doesn't have a public get-deleted-team-files endpoint
    // Return an informative message
    return ResponseFormatter.formatSuccess(
      {
        files: [],
        note: 'Penpot does not expose a public API to list deleted files. Deleted files are tracked in the UI until permanently deleted. Use restore action with known file IDs.',
      },
      'Deleted files listing not available via API'
    );
  }

  /**
   * Restore deleted files
   */
  async restoreFiles(teamId: string, fileIds: string[]): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
        '~:ids': fileIds.map((id) => `~u${id}`),
      };

      const response = await this.post<unknown>(
        '/rpc/command/restore-deleted-team-files',
        payload,
        true
      );

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(
        {
          restored: true,
          fileIds,
          count: fileIds.length,
          result,
        },
        `Restored ${fileIds.length} file(s)`
      );
    } catch (error) {
      logger.error('Failed to restore files', error);
      return ErrorHandler.handle(error, 'restoreFiles');
    }
  }

  /**
   * Permanently delete files from trash
   */
  async permanentlyDelete(teamId: string, fileIds: string[]): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
        '~:ids': fileIds.map((id) => `~u${id}`),
      };

      await this.post<unknown>('/rpc/command/delete-team-files', payload, true);

      return ResponseFormatter.formatSuccess(
        {
          deleted: true,
          fileIds,
          count: fileIds.length,
        },
        `Permanently deleted ${fileIds.length} file(s)`
      );
    } catch (error) {
      logger.error('Failed to permanently delete files', error);
      return ErrorHandler.handle(error, 'permanentlyDelete');
    }
  }
}
