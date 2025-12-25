import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export type SharePermission = 'all' | 'team' | 'authenticated';

export interface ShareLink {
  id: string;
  fileId: string;
  pages?: string[];
  whoComment: SharePermission;
  whoInspect: SharePermission;
  createdAt?: string;
  flags?: Record<string, boolean>;
}

/**
 * Share API Client - Manage share links for files
 * ISSUE-015: Share Links
 */
export class ShareAPIClient extends BaseAPIClient {
  /**
   * Get all share links for a file
   */
  async getShareLinks(fileId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
      };

      const response = await this.post<unknown>('/rpc/command/get-share-links', payload, true);

      const data = this.normalizeTransitResponse(response);
      const links = Array.isArray(data) ? data : [];

      return ResponseFormatter.formatList(links, 'shareLink', {
        fileId,
        total: links.length,
      });
    } catch (error) {
      logger.error('Failed to get share links', error);
      return ErrorHandler.handle(error, `getShareLinks(${fileId})`);
    }
  }

  /**
   * Create a share link for a file
   */
  async createShareLink(
    fileId: string,
    options: {
      pages?: string[];
      whoComment?: SharePermission;
      whoInspect?: SharePermission;
    } = {}
  ): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:file-id': `~u${fileId}`,
        '~:who-comment': `~:${options.whoComment || 'all'}`,
        '~:who-inspect': `~:${options.whoInspect || 'all'}`,
      };

      if (options.pages && options.pages.length > 0) {
        payload['~:pages'] = options.pages.map((p) => `~u${p}`);
      }

      const response = await this.post<unknown>('/rpc/command/create-share-link', payload, true);

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, 'Share link created');
    } catch (error) {
      logger.error('Failed to create share link', error);
      return ErrorHandler.handle(error, 'createShareLink');
    }
  }

  /**
   * Delete a share link
   */
  async deleteShareLink(shareId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${shareId}`,
      };

      await this.post<unknown>('/rpc/command/delete-share-link', payload, true);

      return ResponseFormatter.formatSuccess({ deleted: true, shareId }, 'Share link deleted');
    } catch (error) {
      logger.error('Failed to delete share link', error);
      return ErrorHandler.handle(error, 'deleteShareLink');
    }
  }
}
