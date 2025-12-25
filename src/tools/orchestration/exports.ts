import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { ExportsParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Exports Tool - Comprehensive asset export
 */
export class ExportsTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: ExportsParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('ExportsTool executing', { action, params });

    switch (action) {
      case 'export':
        if (!params.fileId || !params.pageId || !params.objectId) {
          return ResponseFormatter.formatError('fileId, pageId and objectId are required for export action');
        }
        return client.exports.exportObject({
          fileId: params.fileId,
          pageId: params.pageId,
          objectId: params.objectId,
          format: params.format,
          scale: params.scale,
        });

      case 'batch':
        if (!params.fileId || !params.pageId || !params.objectIds || params.objectIds.length === 0) {
          return ResponseFormatter.formatError('fileId, pageId and objectIds array are required for batch action');
        }
        return client.exports.batchExport({
          fileId: params.fileId,
          pageId: params.pageId,
          objectIds: params.objectIds,
          format: params.format,
          scale: params.scale,
        });

      case 'page':
        if (!params.fileId || !params.pageId) {
          return ResponseFormatter.formatError('fileId and pageId are required for page action');
        }
        return client.exports.exportPage({
          fileId: params.fileId,
          pageId: params.pageId,
          format: params.format,
          scale: params.scale,
        });

      case 'file_pdf':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for file_pdf action');
        }
        return client.exports.exportFileAsPdf(params.fileId, params.pageIds);

      case 'multi_scale':
        if (!params.fileId || !params.pageId || !params.objectId) {
          return ResponseFormatter.formatError('fileId, pageId and objectId are required for multi_scale action');
        }
        return client.exports.exportMultiScale(
          {
            fileId: params.fileId,
            pageId: params.pageId,
            objectId: params.objectId,
            format: params.format,
          },
          params.scales || [1, 2, 3]
        );

      case 'multi_format':
        if (!params.fileId || !params.pageId || !params.objectId) {
          return ResponseFormatter.formatError('fileId, pageId and objectId are required for multi_format action');
        }
        return client.exports.exportMultiFormat(
          {
            fileId: params.fileId,
            pageId: params.pageId,
            objectId: params.objectId,
            scale: params.scale,
          },
          (params.formats as any) || ['png', 'svg']
        );

      case 'list':
        if (!params.fileId || !params.pageId) {
          return ResponseFormatter.formatError('fileId and pageId are required for list action');
        }
        return client.exports.listExportableObjects(params.fileId, params.pageId);

      case 'settings':
        if (!params.fileId || !params.pageId || !params.objectId) {
          return ResponseFormatter.formatError('fileId, pageId and objectId are required for settings action');
        }
        return client.exports.getExportSettings(params.fileId, params.pageId, params.objectId);

      case 'download':
        if (!params.resourceId) {
          return ResponseFormatter.formatError('resourceId is required for download action');
        }
        return client.exports.downloadExport(params.resourceId);

      case 'formats':
        return client.exports.getSupportedFormats();

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
