/**
 * Assets Tool - Export design assets
 */

import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { AssetsParams } from './types.js';

export class AssetsTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: AssetsParams): Promise<MCPResponse> {
    const { action } = params;

    switch (action) {
      case 'export':
        return this.exportAsset(params);
      case 'list':
        return this.listExportable(params);
      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}. Use: export, list`);
    }
  }

  private async exportAsset(params: AssetsParams): Promise<MCPResponse> {
    const { fileId, pageId, objectId, format = 'png', scale = 1 } = params;

    if (!pageId || !objectId) {
      return ResponseFormatter.formatError('pageId and objectId are required for export action');
    }

    const client = this.clientFactory.createExportsClient();
    return client.exportObject({
      fileId,
      pageId,
      objectId,
      format,
      scale,
    });
  }

  private async listExportable(params: AssetsParams): Promise<MCPResponse> {
    const { fileId, pageId } = params;

    if (!pageId) {
      // List all pages with exportable objects count
      const filesClient = this.clientFactory.createFilesClient();
      const response = await filesClient.getFile(fileId);

      if (response.isError) {
        return response;
      }

      try {
        const content = response.content[0];
        const fileData = JSON.parse(content.type === 'text' ? content.text : '{}');
        const data = fileData.data?.data || {};
        const pagesIndex = data.pagesIndex || {};

        const exportableTypes = [
          'frame',
          'group',
          'rect',
          'circle',
          'path',
          'text',
          'image',
          'svg-raw',
        ];

        const pages = Object.entries(pagesIndex).map(([id, page]) => {
          const p = page as Record<string, unknown>;
          const objects = (p['objects'] || {}) as Record<string, unknown>;

          const exportableCount = Object.values(objects).filter((obj) => {
            const type = (obj as Record<string, unknown>)['type'] as string;
            return exportableTypes.includes(type?.toLowerCase());
          }).length;

          return {
            id,
            name: p['name'],
            exportableCount,
          };
        });

        return ResponseFormatter.formatSuccess(
          {
            fileId,
            pages,
            totalExportable: pages.reduce((sum, p) => sum + p.exportableCount, 0),
          },
          'Exportable objects by page'
        );
      } catch (error) {
        return ResponseFormatter.formatError(`Failed to analyze file: ${error}`);
      }
    }

    const client = this.clientFactory.createExportsClient();
    return client.listExportableObjects(fileId, pageId);
  }
}
