import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { ShapesParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Shapes Tool - Create and manage shapes on Penpot pages
 */
export class ShapesTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: ShapesParams): Promise<MCPResponse> {
    const { action, fileId, pageId } = params;
    const client = this.clientFactory.createClient();

    logger.debug('ShapesTool executing', { action, params });

    if (!fileId) {
      return ResponseFormatter.formatError('fileId is required');
    }

    switch (action) {
      case 'add_frame':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for add_frame action');
        }
        return client.fileChanges.addFrame(fileId, pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          width: params.width ?? 1920,
          height: params.height ?? 1080,
          name: params.name,
          fill: params.fill,
        });

      case 'add_rectangle':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for add_rectangle action');
        }
        return client.fileChanges.addRectangle(fileId, pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          width: params.width ?? 100,
          height: params.height ?? 100,
          name: params.name,
          fill: params.fill,
          fillOpacity: params.fillOpacity,
        });

      case 'add_ellipse':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for add_ellipse action');
        }
        return client.fileChanges.addEllipse(fileId, pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          width: params.width ?? 100,
          height: params.height ?? 100,
          name: params.name,
          fill: params.fill,
          fillOpacity: params.fillOpacity,
        });

      case 'delete':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for delete action');
        }
        if (!params.shapeId) {
          return ResponseFormatter.formatError('shapeId is required for delete action');
        }
        return client.fileChanges.deleteObject(fileId, pageId, params.shapeId);

      case 'list':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for list action');
        }
        return client.files.getPageObjects(fileId, pageId);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
