import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { MediaParams } from '../../schemas/media.schema.js';
import { logger } from '../../logger.js';

/**
 * Media Tool - Upload and manage images in Penpot files
 * ISSUE-001: Image/Media Upload Support
 */
export class MediaTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: MediaParams): Promise<MCPResponse> {
    const { action, fileId } = params;
    const client = this.clientFactory.createClient();

    logger.debug('MediaTool executing', { action, params });

    if (!fileId) {
      return ResponseFormatter.formatError('fileId is required');
    }

    switch (action) {
      case 'upload_url':
        if (!params.url) {
          return ResponseFormatter.formatError('url is required for upload_url action');
        }
        return client.media.uploadFromUrl(fileId, params.url, params.filename);

      case 'upload_base64':
        if (!params.base64 || !params.filename) {
          return ResponseFormatter.formatError(
            'base64 and filename are required for upload_base64 action'
          );
        }
        return client.media.uploadFromBase64(
          fileId,
          params.base64,
          params.filename,
          params.mimeType || 'image/png'
        );

      case 'list':
        return client.media.listMedia(fileId);

      case 'delete':
        if (!params.mediaId) {
          return ResponseFormatter.formatError('mediaId is required for delete action');
        }
        return client.media.deleteMedia(fileId, params.mediaId);

      case 'add_image':
        if (!params.pageId) {
          return ResponseFormatter.formatError('pageId is required for add_image action');
        }
        if (!params.mediaId || !params.mediaWidth || !params.mediaHeight) {
          return ResponseFormatter.formatError(
            'mediaId, mediaWidth, and mediaHeight are required for add_image action'
          );
        }
        return client.fileChanges.addImage(fileId, params.pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          width: params.width,
          height: params.height,
          name: params.name,
          frameId: params.frameId,
          mediaId: params.mediaId,
          mediaWidth: params.mediaWidth,
          mediaHeight: params.mediaHeight,
          mimeType: params.mimeType,
          shadow: params.shadow,
        });

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
