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
 */
export class TrashAPIClient extends BaseAPIClient {
  /**
   * Get deleted files for a team
   */
  async getDeletedFiles(teamId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
      };

      const response = await this.post<unknown>(
        '/rpc/command/get-deleted-team-files',
        payload,
        true
      );

      const data = this.normalizeTransitResponse(response);
      const files = Array.isArray(data) ? data : [];

      return ResponseFormatter.formatList(files, 'deletedFile', {
        teamId,
        total: files.length,
      });
    } catch (error) {
      logger.error('Failed to get deleted files', error);
      return ErrorHandler.handle(error, `getDeletedFiles(${teamId})`);
    }
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
