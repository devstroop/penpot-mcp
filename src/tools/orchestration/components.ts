/**
 * Components Tool - Comprehensive component library management
 */

import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { ComponentsParams } from './types.js';
import { logger } from '../../logger.js';

export class ComponentsTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: ComponentsParams): Promise<MCPResponse> {
    const { action, fileId } = params;
    const client = this.clientFactory.createClient();

    logger.debug('ComponentsTool executing', { action, fileId });

    switch (action) {
      case 'list':
        return client.components.getFileComponents(fileId);

      case 'get':
        if (!params.componentId) {
          return ResponseFormatter.formatError('componentId is required for get action');
        }
        return client.components.getComponent(fileId, params.componentId);

      case 'search':
        if (!params.query) {
          return ResponseFormatter.formatError('query is required for search action');
        }
        return client.components.searchComponents(fileId, params.query);

      case 'instances':
        if (!params.componentId) {
          return ResponseFormatter.formatError('componentId is required for instances action');
        }
        return client.components.getComponentInstances(fileId, params.componentId);

      case 'structure':
        if (!params.componentId) {
          return ResponseFormatter.formatError('componentId is required for structure action');
        }
        return client.components.getComponentStructure(fileId, params.componentId);

      case 'create':
        if (!params.pageId || !params.objectId) {
          return ResponseFormatter.formatError(
            'pageId and objectId are required for create action'
          );
        }
        return client.components.createComponent(
          fileId,
          params.pageId,
          params.objectId,
          params.name
        );

      case 'delete':
        if (!params.componentId) {
          return ResponseFormatter.formatError('componentId is required for delete action');
        }
        return client.components.deleteComponent(fileId, params.componentId);

      case 'rename':
        if (!params.componentId || !params.name) {
          return ResponseFormatter.formatError(
            'componentId and name are required for rename action'
          );
        }
        return client.components.renameComponent(fileId, params.componentId, params.name);

      case 'annotate':
        if (!params.componentId || !params.annotation) {
          return ResponseFormatter.formatError(
            'componentId and annotation are required for annotate action'
          );
        }
        return client.components.updateComponentAnnotation(
          fileId,
          params.componentId,
          params.annotation
        );

      case 'stats':
        return client.components.getComponentStats(fileId);

      case 'detach':
        if (!params.pageId || !params.instanceId) {
          return ResponseFormatter.formatError(
            'pageId and instanceId are required for detach action'
          );
        }
        return client.components.detachInstance(fileId, params.pageId, params.instanceId);

      case 'reset':
        if (!params.pageId || !params.instanceId) {
          return ResponseFormatter.formatError(
            'pageId and instanceId are required for reset action'
          );
        }
        return client.components.resetInstance(fileId, params.pageId, params.instanceId);

      case 'instantiate':
        if (
          !params.sourceFileId ||
          !params.componentId ||
          !params.pageId ||
          params.x === undefined ||
          params.y === undefined
        ) {
          return ResponseFormatter.formatError(
            'sourceFileId, componentId, pageId, x, and y are required for instantiate action'
          );
        }
        return client.components.instantiateComponent(
          fileId, // targetFileId
          params.pageId, // targetPageId
          params.sourceFileId,
          params.componentId,
          {
            x: params.x,
            y: params.y,
            name: params.name,
            frameId: params.frameId,
          }
        );

      default:
        return ResponseFormatter.formatError(
          `Unknown action: ${action}. Use: list, get, search, instances, structure, create, delete, rename, annotate, stats, detach, reset, instantiate`
        );
    }
  }
}
