import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { FilesParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Files Tool - Comprehensive file management
 */
export class FilesTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: FilesParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('FilesTool executing', { action, params });

    switch (action) {
      case 'get':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for get action');
        }
        return client.files.getFile(params.fileId);

      case 'create':
        if (!params.projectId || !params.name) {
          return ResponseFormatter.formatError('projectId and name are required for create action');
        }
        return client.files.createFile(params.projectId, params.name);

      case 'rename':
        if (!params.fileId || !params.name) {
          return ResponseFormatter.formatError('fileId and name are required for rename action');
        }
        return client.files.renameFile(params.fileId, params.name);

      case 'delete':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for delete action');
        }
        return client.files.deleteFile(params.fileId);

      case 'duplicate':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for duplicate action');
        }
        return client.files.duplicateFile(params.fileId, params.name);

      case 'move':
        if (!params.fileId || !params.projectId) {
          return ResponseFormatter.formatError('fileId and projectId are required for move action');
        }
        return client.files.moveFile(params.fileId, params.projectId);

      case 'pages':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for pages action');
        }
        return client.files.getFilePages(params.fileId);

      case 'page':
        if (!params.fileId || !params.pageId) {
          return ResponseFormatter.formatError('fileId and pageId are required for page action');
        }
        return client.files.getPageObjects(params.fileId, params.pageId);

      case 'objects':
        if (!params.fileId || !params.pageId) {
          return ResponseFormatter.formatError('fileId and pageId are required for objects action');
        }
        return client.files.getPageObjects(params.fileId, params.pageId);

      case 'object':
        if (!params.fileId || !params.pageId || !params.objectId) {
          return ResponseFormatter.formatError('fileId, pageId and objectId are required for object action');
        }
        return client.files.getObject(params.fileId, params.pageId, params.objectId);

      case 'tree':
        if (!params.fileId || !params.objectId) {
          return ResponseFormatter.formatError('fileId and objectId are required for tree action');
        }
        // getObjectTree(fileId, objectId, fields?, depth?)
        return client.files.getObjectTree(params.fileId, params.objectId, undefined, params.depth);

      case 'search':
        if (!params.fileId || !params.query) {
          return ResponseFormatter.formatError('fileId and query are required for search action');
        }
        // searchObjects(fileId, query, pageId?)
        return client.files.searchObjects(params.fileId, params.query, params.pageId);

      case 'analyze':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for analyze action');
        }
        return client.files.analyzeFileStructure(params.fileId);

      case 'history':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for history action');
        }
        return client.files.getFileHistory(params.fileId);

      case 'snapshot':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for snapshot action');
        }
        return this.handleSnapshot(params);

      // Shape creation actions
      case 'add_frame':
        if (!params.fileId || !params.pageId) {
          return ResponseFormatter.formatError('fileId and pageId are required for add_frame action');
        }
        return client.fileChanges.addFrame(params.fileId, params.pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          width: params.width ?? 1920,
          height: params.height ?? 1080,
          name: params.name,
          fill: params.fill,
        });

      case 'add_rectangle':
        if (!params.fileId || !params.pageId) {
          return ResponseFormatter.formatError('fileId and pageId are required for add_rectangle action');
        }
        return client.fileChanges.addRectangle(params.fileId, params.pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          width: params.width ?? 100,
          height: params.height ?? 100,
          name: params.name,
          fill: params.fill,
          fillOpacity: params.fillOpacity,
        });

      case 'add_ellipse':
        if (!params.fileId || !params.pageId) {
          return ResponseFormatter.formatError('fileId and pageId are required for add_ellipse action');
        }
        return client.fileChanges.addEllipse(params.fileId, params.pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          width: params.width ?? 100,
          height: params.height ?? 100,
          name: params.name,
          fill: params.fill,
          fillOpacity: params.fillOpacity,
        });

      case 'add_text':
        if (!params.fileId || !params.pageId || !params.content) {
          return ResponseFormatter.formatError('fileId, pageId and content are required for add_text action');
        }
        return client.fileChanges.addText(params.fileId, params.pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          content: params.content,
          name: params.name,
          fontSize: params.fontSize,
          fontFamily: params.fontFamily,
          fontWeight: params.fontWeight,
          fill: params.fill,
          width: params.width,
          height: params.height,
        });

      case 'add_path':
        if (!params.fileId || !params.pageId || !params.pathPoints) {
          return ResponseFormatter.formatError('fileId, pageId and pathPoints are required for add_path action');
        }
        return client.fileChanges.addPath(params.fileId, params.pageId, {
          points: params.pathPoints,
          name: params.name,
          stroke: params.stroke,
          strokeWidth: params.strokeWidth,
          fill: params.fill,
        });

      case 'modify_object':
        if (!params.fileId || !params.pageId || !params.objectId || !params.operations) {
          return ResponseFormatter.formatError('fileId, pageId, objectId and operations are required for modify_object action');
        }
        return client.fileChanges.modifyObject(params.fileId, params.pageId, params.objectId, params.operations);

      case 'delete_object':
        if (!params.fileId || !params.pageId || !params.objectId) {
          return ResponseFormatter.formatError('fileId, pageId and objectId are required for delete_object action');
        }
        return client.fileChanges.deleteObject(params.fileId, params.pageId, params.objectId);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }

  private async handleSnapshot(params: FilesParams): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();
    const { fileId, snapshotAction, snapshotId } = params;

    if (!fileId) {
      return ResponseFormatter.formatError('fileId is required');
    }

    switch (snapshotAction) {
      case 'create':
        return client.files.createFileSnapshot(fileId);
      case 'restore':
        if (!snapshotId) {
          return ResponseFormatter.formatError('snapshotId is required for restore');
        }
        return client.files.restoreFileSnapshot(fileId, snapshotId);
      case 'list':
      default:
        return client.files.getFileHistory(fileId);
    }
  }
}
