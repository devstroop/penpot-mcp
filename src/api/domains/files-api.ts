import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export interface PenpotFile {
  id: string;
  name: string;
  projectId: string;
  createdAt?: string;
  modifiedAt?: string;
  revn?: number;
  isShared?: boolean;
}

export interface FileData {
  id: string;
  name: string;
  data?: {
    'pages-index'?: Record<string, PageData>;
    'components-index'?: Record<string, unknown>;
    colors?: Record<string, unknown>;
    typographies?: Record<string, unknown>;
  };
}

export interface PageData {
  id: string;
  name: string;
  objects?: Record<string, ObjectData>;
}

export interface ObjectData {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fills?: unknown[];
  strokes?: unknown[];
  shadows?: unknown[];
  blur?: unknown;
  opacity?: number;
  rotation?: number;
  transform?: unknown;
  componentId?: string;
  componentFile?: string;
  componentRoot?: boolean;
  mainInstance?: boolean;
  shapes?: string[];
  [key: string]: unknown;
}

/**
 * Files API Client - Full file management capabilities
 * Handles all file-related operations for Penpot
 */
export class FilesAPIClient extends BaseAPIClient {
  /**
   * Get file details and content
   */
  async getFile(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as FileData;

      return ResponseFormatter.formatSuccess(fileData, `File: ${fileData.name}`, {
        fileId,
      });
    } catch (error) {
      return ErrorHandler.handle(error, `getFile(${fileId})`);
    }
  }

  /**
   * Get file metadata without full data
   */
  async getFileMeta(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as FileData;

      // Return only metadata, not full data
      const meta = {
        id: fileData.id,
        name: fileData.name,
        pageCount: fileData.data?.['pages-index']
          ? Object.keys(fileData.data['pages-index']).length
          : 0,
        componentCount: fileData.data?.['components-index']
          ? Object.keys(fileData.data['components-index']).length
          : 0,
        colorCount: fileData.data?.colors ? Object.keys(fileData.data.colors).length : 0,
        typographyCount: fileData.data?.typographies
          ? Object.keys(fileData.data.typographies).length
          : 0,
      };

      return ResponseFormatter.formatSuccess(meta, `File metadata: ${fileData.name}`);
    } catch (error) {
      return ErrorHandler.handle(error, `getFileMeta(${fileId})`);
    }
  }

  /**
   * Create a new file
   */
  async createFile(projectId: string, name: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:project-id': `~u${projectId}`,
        '~:name': name,
      };

      const response = await this.post<unknown>('/rpc/command/create-file', payload, true);

      const file = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(file, `File "${name}" created successfully`);
    } catch (error) {
      logger.error('Failed to create file', error);
      return ErrorHandler.handle(error, 'createFile');
    }
  }

  /**
   * Rename a file
   */
  async renameFile(fileId: string, newName: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${fileId}`,
        '~:name': newName,
      };

      const response = await this.post<unknown>('/rpc/command/rename-file', payload, true);

      const file = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(file, `File renamed to "${newName}"`);
    } catch (error) {
      logger.error('Failed to rename file', error);
      return ErrorHandler.handle(error, 'renameFile');
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${fileId}`,
      };

      await this.post<unknown>('/rpc/command/delete-file', payload, true);

      return ResponseFormatter.formatSuccess({ deleted: true, fileId }, `File ${fileId} deleted`);
    } catch (error) {
      logger.error('Failed to delete file', error);
      return ErrorHandler.handle(error, 'deleteFile');
    }
  }

  /**
   * Duplicate a file
   */
  async duplicateFile(fileId: string, newName?: string): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:file-id': `~u${fileId}`,
      };

      if (newName) {
        payload['~:name'] = newName;
      }

      const response = await this.post<unknown>('/rpc/command/duplicate-file', payload, true);

      const file = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(file, 'File duplicated successfully');
    } catch (error) {
      logger.error('Failed to duplicate file', error);
      return ErrorHandler.handle(error, 'duplicateFile');
    }
  }

  /**
   * Move file to another project
   */
  async moveFile(fileId: string, targetProjectId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:ids': [`~u${fileId}`],
        '~:project-id': `~u${targetProjectId}`,
      };

      const response = await this.post<unknown>('/rpc/command/move-files', payload, true);

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, `File moved to project ${targetProjectId}`);
    } catch (error) {
      logger.error('Failed to move file', error);
      return ErrorHandler.handle(error, 'moveFile');
    }
  }

  /**
   * Get pages in a file
   */
  async getFilePages(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as FileData;
      const pagesIndex = fileData.data?.['pages-index'] || {};

      const pages = Object.entries(pagesIndex).map(([id, page]) => {
        // Strip ~u prefix from page ID if present
        const cleanId = id.startsWith('~u') ? id.slice(2) : id;
        return {
          id: cleanId,
          name: (page as PageData).name,
          objectCount: (page as PageData).objects
            ? Object.keys((page as PageData).objects!).length
            : 0,
        };
      });

      return ResponseFormatter.formatList(pages, 'page', {
        total: pages.length,
      });
    } catch (error) {
      return ErrorHandler.handle(error, `getFilePages(${fileId})`);
    }
  }

  /**
   * Get objects in a page
   */
  async getPageObjects(fileId: string, pageId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as FileData;
      const pagesIndex = fileData.data?.['pages-index'] || {};

      // Try multiple key formats: raw, with ~u prefix, without prefix
      const cleanPageId = pageId.startsWith('~u') ? pageId.slice(2) : pageId;
      const page = pagesIndex[pageId] || pagesIndex[`~u${cleanPageId}`] || pagesIndex[cleanPageId];

      if (!page) {
        return ResponseFormatter.formatError(`Page not found: ${pageId}`);
      }

      const objects = Object.entries(page.objects || {}).map(([id, obj]) => {
        const o = obj as ObjectData;
        return {
          id,
          name: o.name,
          type: o.type,
          parentId: o.parentId,
          x: o.x,
          y: o.y,
          width: o.width,
          height: o.height,
        };
      });

      return ResponseFormatter.formatList(objects, 'object', {
        total: objects.length,
      });
    } catch (error) {
      return ErrorHandler.handle(error, `getPageObjects(${fileId}, ${pageId})`);
    }
  }

  /**
   * Get specific object details
   */
  async getObject(fileId: string, pageId: string, objectId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as FileData;
      const pagesIndex = fileData.data?.['pages-index'] || {};

      // Try multiple key formats: raw, with ~u prefix, without prefix
      const cleanPageId = pageId.startsWith('~u') ? pageId.slice(2) : pageId;
      const page = pagesIndex[pageId] || pagesIndex[`~u${cleanPageId}`] || pagesIndex[cleanPageId];

      if (!page) {
        return ResponseFormatter.formatError(`Page not found: ${pageId}`);
      }

      // Try multiple key formats for objectId: raw, with ~u prefix, without prefix
      const cleanObjectId = objectId.startsWith('~u') ? objectId.slice(2) : objectId;
      const obj =
        page.objects?.[objectId] ||
        page.objects?.[`~u${cleanObjectId}`] ||
        page.objects?.[cleanObjectId];

      if (!obj) {
        return ResponseFormatter.formatError(`Object not found: ${objectId}`);
      }

      return ResponseFormatter.formatSuccess(obj, `Object: ${obj.name}`);
    } catch (error) {
      return ErrorHandler.handle(error, `getObject(${fileId}, ${pageId}, ${objectId})`);
    }
  }

  /**
   * Get page tree (all objects on a page in hierarchical format)
   */
  async getPageTree(
    fileId: string,
    pageId: string,
    fields?: string[],
    depth: number = -1
  ): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as FileData;
      const pagesIndex = fileData.data?.['pages-index'] || {};

      // Try multiple key formats: raw, with ~u prefix, without prefix
      const cleanPageId = pageId.startsWith('~u') ? pageId.slice(2) : pageId;
      const page = pagesIndex[pageId] || pagesIndex[`~u${cleanPageId}`] || pagesIndex[cleanPageId];

      if (!page) {
        return ResponseFormatter.formatError(`Page not found: ${pageId}`);
      }

      const objects = page.objects || {};
      const visited = new Set<string>();

      // Find the root object (typically 00000000-0000-0000-0000-000000000000)
      const rootId =
        Object.keys(objects).find((id) => {
          const cleanId = id.startsWith('~u') ? id.slice(2) : id;
          return cleanId === '00000000-0000-0000-0000-000000000000';
        }) || Object.keys(objects)[0];

      // Build filtered object tree
      const buildTree = (objId: string, currentDepth: number): Record<string, unknown> | null => {
        if (!(objId in objects) || visited.has(objId)) {
          return null;
        }

        visited.add(objId);

        const obj = objects[objId] as ObjectData;
        let filteredObj: Record<string, unknown>;

        if (fields && fields.length > 0) {
          filteredObj = { id: objId };
          for (const field of fields) {
            if (field in obj) {
              filteredObj[field] = obj[field];
            }
          }
        } else {
          filteredObj = { ...obj, id: objId };
        }

        // Stop at depth limit
        if (depth !== -1 && currentDepth >= depth) {
          visited.delete(objId);
          return filteredObj;
        }

        // Find children
        const children: Record<string, unknown>[] = [];
        for (const [childId, childObj] of Object.entries(objects)) {
          const child = childObj as ObjectData;
          // Check if parentId matches (with or without ~u prefix)
          const cleanObjId = objId.startsWith('~u') ? objId.slice(2) : objId;
          const parentId = typeof child.parentId === 'string' ? child.parentId : '';
          const cleanParentId = parentId.startsWith('~u') ? parentId.slice(2) : parentId;

          if (cleanParentId === cleanObjId || parentId === objId) {
            const childTree = buildTree(childId, currentDepth + 1);
            if (childTree) {
              children.push(childTree);
            }
          }
        }

        if (children.length > 0) {
          filteredObj.children = children;
        }

        visited.delete(objId);
        return filteredObj;
      };

      const tree = buildTree(rootId, 0);

      if (!tree) {
        return ResponseFormatter.formatError(`Failed to build tree for page ${pageId}`);
      }

      return ResponseFormatter.formatSuccess(
        {
          tree,
          pageId,
          pageName: page.name,
        },
        `Page tree for ${page.name}`
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getPageTree(${fileId}, ${pageId})`);
    }
  }

  /**
   * Get object tree for a specific object and its children
   */
  async getObjectTree(
    fileId: string,
    objectId: string,
    fields?: string[],
    depth: number = -1
  ): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as FileData;
      const data = fileData.data || {};

      // Find which page contains the object
      let pageId: string | null = null;
      let pageData: PageData | null = null;

      for (const [pId, page] of Object.entries(data['pages-index'] || {})) {
        const p = page as PageData;
        if (p.objects?.[objectId]) {
          pageId = pId;
          pageData = p;
          break;
        }
      }

      if (!pageId || !pageData) {
        return ResponseFormatter.formatError(`Object ${objectId} not found in file`);
      }

      const objects = pageData.objects || {};
      const visited = new Set<string>();

      // Build filtered object tree
      const buildTree = (objId: string, currentDepth: number): Record<string, unknown> | null => {
        if (!(objId in objects) || visited.has(objId)) {
          return null;
        }

        visited.add(objId);

        const obj = objects[objId] as ObjectData;
        let filteredObj: Record<string, unknown>;

        if (fields && fields.length > 0) {
          filteredObj = { id: objId };
          for (const field of fields) {
            if (field in obj) {
              filteredObj[field] = obj[field];
            }
          }
        } else {
          filteredObj = { ...obj, id: objId };
        }

        // Stop at depth limit
        if (depth !== -1 && currentDepth >= depth) {
          visited.delete(objId);
          return filteredObj;
        }

        // Find children
        const children: Record<string, unknown>[] = [];
        for (const [childId, childObj] of Object.entries(objects)) {
          const child = childObj as ObjectData;
          if (child.parentId === objId) {
            const childTree = buildTree(childId, currentDepth + 1);
            if (childTree) {
              children.push(childTree);
            }
          }
        }

        if (children.length > 0) {
          filteredObj.children = children;
        }

        visited.delete(objId);
        return filteredObj;
      };

      const tree = buildTree(objectId, 0);

      if (!tree) {
        return ResponseFormatter.formatError(`Failed to build tree for object ${objectId}`);
      }

      return ResponseFormatter.formatSuccess(
        {
          tree,
          pageId,
          objectId,
        },
        `Object tree for ${objectId}`
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getObjectTree(${fileId}, ${objectId})`);
    }
  }

  /**
   * Search objects in a file by name
   */
  async searchObjects(fileId: string, query: string, pageId?: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as FileData;
      const data = fileData.data || {};

      // Handle special cases: empty query, "*", or "." means match all
      const matchAll = !query || query === '*' || query === '.*' || query === '.';
      let pattern: RegExp;
      try {
        pattern = matchAll ? /.*/ : new RegExp(query, 'i');
      } catch {
        // If regex is invalid, escape and treat as literal string
        pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      }

      const matches: Array<{
        id: string;
        name: string;
        pageId: string;
        pageName: string;
        objectType: string;
      }> = [];

      const pagesIndex = data['pages-index'] || {};
      const cleanPageId = pageId?.startsWith('~u') ? pageId.slice(2) : pageId;
      const pagesToSearch = pageId
        ? {
            [pageId]:
              pagesIndex[pageId] || pagesIndex[`~u${cleanPageId}`] || pagesIndex[cleanPageId || ''],
          }
        : pagesIndex;

      for (const [pId, page] of Object.entries(pagesToSearch)) {
        if (!page) continue;
        const p = page as PageData;
        const pageName = p.name || 'Unnamed';

        for (const [objId, obj] of Object.entries(p.objects || {})) {
          const o = obj as ObjectData;
          const objName = o.name || '';

          if (pattern.test(objName)) {
            matches.push({
              id: objId,
              name: objName,
              pageId: pId,
              pageName,
              objectType: o.type || 'unknown',
            });
          }
        }
      }

      return ResponseFormatter.formatList(matches, 'match', {
        total: matches.length,
        query,
      });
    } catch (error) {
      return ErrorHandler.handle(error, `searchObjects(${fileId}, ${query})`);
    }
  }

  /**
   * Analyze file structure
   */
  async analyzeFileStructure(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as FileData;
      const data = fileData.data || {};

      // Count objects by type
      const objectTypes: Record<string, number> = {};
      let totalObjects = 0;

      const pagesIndex = data['pages-index'] || {};
      for (const page of Object.values(pagesIndex)) {
        const pageData = page as PageData;
        const objects = pageData.objects || {};
        totalObjects += Object.keys(objects).length;

        for (const obj of Object.values(objects)) {
          const objData = obj as ObjectData;
          const type = objData.type || 'unknown';
          objectTypes[type] = (objectTypes[type] || 0) + 1;
        }
      }

      const analysis = {
        fileName: fileData.name,
        fileId: fileData.id,
        pageCount: Object.keys(pagesIndex).length,
        objectCount: totalObjects,
        objectTypes,
        componentCount: data['components-index'] ? Object.keys(data['components-index']).length : 0,
        colorCount: data.colors ? Object.keys(data.colors).length : 0,
        typographyCount: data.typographies ? Object.keys(data.typographies).length : 0,
      };

      return ResponseFormatter.formatSuccess(analysis, `File analysis: ${fileData.name}`);
    } catch (error) {
      return ErrorHandler.handle(error, `analyzeFileStructure(${fileId})`);
    }
  }

  /**
   * Get file version history
   */
  async getFileHistory(fileId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
      };

      const response = await this.post<unknown>('/rpc/command/get-file-snapshots', payload, true);

      const snapshots = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatList(snapshots as unknown[], 'snapshot', {
        fileId,
      });
    } catch (error) {
      logger.error('Failed to get file history', error);
      return ErrorHandler.handle(error, 'getFileHistory');
    }
  }

  /**
   * Create file snapshot (version)
   */
  async createFileSnapshot(fileId: string, label?: string): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:file-id': `~u${fileId}`,
      };

      if (label) {
        payload['~:label'] = label;
      }

      const response = await this.post<unknown>('/rpc/command/create-file-snapshot', payload, true);

      const snapshot = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(
        snapshot,
        `Snapshot created${label ? `: ${label}` : ''}`
      );
    } catch (error) {
      logger.error('Failed to create file snapshot', error);
      return ErrorHandler.handle(error, 'createFileSnapshot');
    }
  }

  /**
   * Restore file from snapshot
   */
  async restoreFileSnapshot(fileId: string, snapshotId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:id': `~u${snapshotId}`,
      };

      const response = await this.post<unknown>(
        '/rpc/command/restore-file-snapshot',
        payload,
        true
      );

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, `File restored from snapshot ${snapshotId}`);
    } catch (error) {
      logger.error('Failed to restore file snapshot', error);
      return ErrorHandler.handle(error, 'restoreFileSnapshot');
    }
  }
}
