/**
 * Inspect Tool - Deep file and design inspection
 */

import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { InspectParams } from './types.js';

export class InspectTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: InspectParams): Promise<MCPResponse> {
    const { action, fileId } = params;

    switch (action) {
      case 'file':
        return this.getFileMetadata(fileId);
      case 'structure':
        return this.analyzeStructure(fileId);
      case 'page':
        return this.getPageDetails(params);
      case 'object':
        return this.getObjectDetails(params);
      case 'tree':
        return this.getDocumentTree(params);
      default:
        return ResponseFormatter.formatError(
          `Unknown action: ${action}. Use: file, structure, page, object, tree`
        );
    }
  }

  private async getFileMetadata(fileId: string): Promise<MCPResponse> {
    const client = this.clientFactory.createFilesClient();
    return client.getFileMeta(fileId);
  }

  private async analyzeStructure(fileId: string): Promise<MCPResponse> {
    const client = this.clientFactory.createFilesClient();
    return client.analyzeFileStructure(fileId);
  }

  private async getPageDetails(params: InspectParams): Promise<MCPResponse> {
    const { fileId, pageId } = params;

    if (!pageId) {
      return ResponseFormatter.formatError('pageId is required for page action');
    }

    const client = this.clientFactory.createFilesClient();
    return client.getPageObjects(fileId, pageId);
  }

  private async getObjectDetails(params: InspectParams): Promise<MCPResponse> {
    const { fileId, pageId, objectId } = params;

    if (!pageId || !objectId) {
      return ResponseFormatter.formatError('pageId and objectId are required for object action');
    }

    const client = this.clientFactory.createFilesClient();
    return client.getObject(fileId, pageId, objectId);
  }

  private async getDocumentTree(params: InspectParams): Promise<MCPResponse> {
    const { fileId, pageId, depth = 3 } = params;

    const client = this.clientFactory.createFilesClient();

    try {
      // Get file data
      const response = await client.getFile(fileId);

      if (response.isError) {
        return response;
      }

      const content = response.content[0];
      const fileData = JSON.parse(content.type === 'text' ? content.text : '{}');
      const data = fileData.data?.data || {};
      const pagesIndex = data.pagesIndex || {};

      // Build tree structure
      const buildTree = (
        objects: Record<string, unknown>,
        parentId: string | null,
        currentDepth: number
      ): unknown[] => {
        if (currentDepth > depth) return [];

        return Object.entries(objects)
          .filter(([, obj]) => {
            const o = obj as Record<string, unknown>;
            return o['parentId'] === parentId || (parentId === null && !o['parentId']);
          })
          .map(([id, obj]) => {
            const o = obj as Record<string, unknown>;
            const node: Record<string, unknown> = {
              id,
              name: o['name'],
              type: o['type'],
            };

            if (currentDepth < depth) {
              const children = buildTree(objects, id, currentDepth + 1);
              if (children.length > 0) {
                node['children'] = children;
              }
            }

            return node;
          });
      };

      // If pageId is specified, only show that page's tree
      if (pageId) {
        const page = pagesIndex[pageId] as Record<string, unknown> | undefined;
        if (!page) {
          return ResponseFormatter.formatError(`Page not found: ${pageId}`);
        }

        const objects = (page['objects'] || {}) as Record<string, unknown>;
        const tree = buildTree(objects, null, 0);

        return ResponseFormatter.formatSuccess(
          {
            fileId,
            pageId,
            pageName: page['name'],
            depth,
            tree,
          },
          `Document tree for page: ${page['name']}`
        );
      }

      // Show tree for all pages
      const allTrees: Record<string, unknown> = {};

      for (const [pId, page] of Object.entries(pagesIndex)) {
        const p = page as Record<string, unknown>;
        const objects = (p['objects'] || {}) as Record<string, unknown>;
        allTrees[pId] = {
          name: p['name'],
          tree: buildTree(objects, null, 0),
        };
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          depth,
          pages: allTrees,
        },
        `Document tree (depth: ${depth})`
      );
    } catch (error) {
      return ResponseFormatter.formatError(`Failed to build tree: ${error}`);
    }
  }
}
