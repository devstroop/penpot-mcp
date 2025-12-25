import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export interface Component {
  id: string;
  name: string;
  path?: string[];
  shape?: string;
  fileId?: string;
  mainInstanceId?: string;
  mainInstancePage?: string;
  annotation?: string;
  created?: string;
  modified?: string;
}

export interface ComponentInstance {
  id: string;
  name: string;
  componentId: string;
  componentFile?: string;
  pageId: string;
  componentRoot?: boolean;
  mainInstance?: boolean;
}

/**
 * Components API Client - Full component library management
 * Handles all component-related operations for Penpot
 */
export class ComponentsAPIClient extends BaseAPIClient {
  
  /**
   * Get components from a file
   */
  async getFileComponents(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        id: string;
        name: string;
        data?: { componentsIndex?: Record<string, unknown> };
      };

      const componentsIndex = fileData.data?.componentsIndex || {};
      
      const components = Object.entries(componentsIndex).map(([id, data]) => {
        const comp = data as Record<string, unknown>;
        return {
          id,
          name: comp['name'] || 'Unnamed',
          path: comp['path'] || [],
          shape: comp['shape'],
          fileId: comp['fileId'] || fileId,
          annotation: comp['annotation'],
          mainInstanceId: comp['mainInstanceId'],
          mainInstancePage: comp['mainInstancePage'],
        };
      });

      return ResponseFormatter.formatList(components, 'component', {
        total: components.length,
      });
    } catch (error) {
      return ErrorHandler.handle(error, `getFileComponents(${fileId})`);
    }
  }

  /**
   * Get a specific component by ID
   */
  async getComponent(fileId: string, componentId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        data?: { componentsIndex?: Record<string, unknown> };
      };

      const component = fileData.data?.componentsIndex?.[componentId];

      if (!component) {
        return ResponseFormatter.formatError(`Component not found: ${componentId}`);
      }

      return ResponseFormatter.formatSuccess(component, `Component: ${(component as Record<string, unknown>)['name']}`);
    } catch (error) {
      return ErrorHandler.handle(error, `getComponent(${fileId}, ${componentId})`);
    }
  }

  /**
   * Search components by name
   */
  async searchComponents(fileId: string, query: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        data?: { componentsIndex?: Record<string, unknown> };
      };

      const componentsIndex = fileData.data?.componentsIndex || {};
      const pattern = new RegExp(query, 'i');

      const matches = Object.entries(componentsIndex)
        .filter(([, data]) => {
          const comp = data as Record<string, unknown>;
          const name = String(comp['name'] || '');
          const path = (comp['path'] as string[] || []).join('/');
          return pattern.test(name) || pattern.test(path);
        })
        .map(([id, data]) => {
          const comp = data as Record<string, unknown>;
          return {
            id,
            name: comp['name'] || 'Unnamed',
            path: comp['path'] || [],
            annotation: comp['annotation'],
          };
        });

      return ResponseFormatter.formatList(matches, 'component', {
        total: matches.length,
        query,
      });
    } catch (error) {
      return ErrorHandler.handle(error, `searchComponents(${fileId}, ${query})`);
    }
  }

  /**
   * Get all instances of a component in a file
   */
  async getComponentInstances(fileId: string, componentId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        data?: { 
          pagesIndex?: Record<string, { objects?: Record<string, unknown> }>;
        };
      };

      const instances: ComponentInstance[] = [];
      const pagesIndex = fileData.data?.pagesIndex || {};

      for (const [pageId, page] of Object.entries(pagesIndex)) {
        const objects = page.objects || {};
        
        for (const [objId, obj] of Object.entries(objects)) {
          const o = obj as Record<string, unknown>;
          if (o['componentId'] === componentId) {
            instances.push({
              id: objId,
              name: String(o['name'] || 'Unnamed'),
              componentId,
              componentFile: String(o['componentFile'] || fileId),
              pageId,
              componentRoot: Boolean(o['componentRoot']),
              mainInstance: Boolean(o['mainInstance']),
            });
          }
        }
      }

      return ResponseFormatter.formatList(instances, 'instance', {
        componentId,
        total: instances.length,
      });
    } catch (error) {
      return ErrorHandler.handle(error, `getComponentInstances(${fileId}, ${componentId})`);
    }
  }

  /**
   * Get component hierarchy/structure
   */
  async getComponentStructure(fileId: string, componentId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        data?: { 
          componentsIndex?: Record<string, unknown>;
          pagesIndex?: Record<string, { objects?: Record<string, unknown> }>;
        };
      };

      const component = fileData.data?.componentsIndex?.[componentId] as Record<string, unknown> | undefined;
      
      if (!component) {
        return ResponseFormatter.formatError(`Component not found: ${componentId}`);
      }

      const mainInstanceId = component['mainInstanceId'] as string;
      const mainInstancePage = component['mainInstancePage'] as string;
      
      if (!mainInstanceId || !mainInstancePage) {
        return ResponseFormatter.formatSuccess({
          component: {
            id: componentId,
            name: component['name'],
            path: component['path'],
          },
          structure: null,
          message: 'Component has no main instance',
        }, 'Component structure');
      }

      const pageObjects = fileData.data?.pagesIndex?.[mainInstancePage]?.objects || {};
      const visited = new Set<string>();

      const buildStructure = (objId: string, depth: number = 0): Record<string, unknown> | null => {
        if (visited.has(objId) || depth > 50) return null;
        visited.add(objId);

        const obj = pageObjects[objId] as Record<string, unknown> | undefined;
        if (!obj) return null;

        const children: Record<string, unknown>[] = [];
        
        for (const [childId, childObj] of Object.entries(pageObjects)) {
          const c = childObj as Record<string, unknown>;
          if (c['parentId'] === objId) {
            const childStructure = buildStructure(childId, depth + 1);
            if (childStructure) {
              children.push(childStructure);
            }
          }
        }

        return {
          id: objId,
          name: obj['name'],
          type: obj['type'],
          ...(children.length > 0 && { children }),
        };
      };

      const structure = buildStructure(mainInstanceId);

      return ResponseFormatter.formatSuccess({
        component: {
          id: componentId,
          name: component['name'],
          path: component['path'],
          annotation: component['annotation'],
        },
        structure,
      }, 'Component structure retrieved');
    } catch (error) {
      return ErrorHandler.handle(error, `getComponentStructure(${fileId}, ${componentId})`);
    }
  }

  /**
   * Create a component from an object
   */
  async createComponent(fileId: string, pageId: string, objectId: string, name?: string): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:file-id': `~u${fileId}`,
        '~:page-id': `~u${pageId}`,
        '~:id': `~u${objectId}`,
      };

      if (name) {
        payload['~:name'] = name;
      }

      const response = await this.post<unknown>(
        '/rpc/command/add-component',
        payload,
        true
      );

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, 'Component created');
    } catch (error) {
      logger.error('Failed to create component', error);
      return ErrorHandler.handle(error, 'createComponent');
    }
  }

  /**
   * Delete a component
   */
  async deleteComponent(fileId: string, componentId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:id': `~u${componentId}`,
      };

      await this.post<unknown>(
        '/rpc/command/delete-component',
        payload,
        true
      );

      return ResponseFormatter.formatSuccess({ deleted: true, componentId }, 'Component deleted');
    } catch (error) {
      logger.error('Failed to delete component', error);
      return ErrorHandler.handle(error, 'deleteComponent');
    }
  }

  /**
   * Rename a component
   */
  async renameComponent(fileId: string, componentId: string, newName: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:id': `~u${componentId}`,
        '~:name': newName,
      };

      const response = await this.post<unknown>(
        '/rpc/command/rename-component',
        payload,
        true
      );

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, `Component renamed to "${newName}"`);
    } catch (error) {
      logger.error('Failed to rename component', error);
      return ErrorHandler.handle(error, 'renameComponent');
    }
  }

  /**
   * Update component annotation
   */
  async updateComponentAnnotation(fileId: string, componentId: string, annotation: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:id': `~u${componentId}`,
        '~:annotation': annotation,
      };

      const response = await this.post<unknown>(
        '/rpc/command/update-component',
        payload,
        true
      );

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, 'Component annotation updated');
    } catch (error) {
      logger.error('Failed to update annotation', error);
      return ErrorHandler.handle(error, 'updateComponentAnnotation');
    }
  }

  /**
   * Get component statistics for a file
   */
  async getComponentStats(fileId: string): Promise<MCPResponse> {
    try {
      const componentsResult = await this.getFileComponents(fileId);
      
      if (componentsResult.isError) {
        return componentsResult;
      }

      const components = JSON.parse((componentsResult.content[0] as any).text)?.items || [];
      
      // Group by path
      const byPath: Record<string, number> = {};
      for (const comp of components) {
        const path = (comp.path || []).join('/') || 'root';
        byPath[path] = (byPath[path] || 0) + 1;
      }

      // Count with annotations
      const withAnnotations = components.filter((c: Component) => c.annotation).length;

      const stats = {
        fileId,
        totalComponents: components.length,
        withAnnotations,
        withoutAnnotations: components.length - withAnnotations,
        byPath,
      };

      return ResponseFormatter.formatSuccess(stats, `File has ${components.length} components`);
    } catch (error) {
      logger.error('Failed to get component stats', error);
      return ErrorHandler.handle(error, 'getComponentStats');
    }
  }

  /**
   * Detach component instance (convert to regular shapes)
   */
  async detachInstance(fileId: string, pageId: string, instanceId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:page-id': `~u${pageId}`,
        '~:id': `~u${instanceId}`,
      };

      const response = await this.post<unknown>(
        '/rpc/command/detach-component',
        payload,
        true
      );

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, 'Component instance detached');
    } catch (error) {
      logger.error('Failed to detach instance', error);
      return ErrorHandler.handle(error, 'detachInstance');
    }
  }

  /**
   * Reset component instance to main
   */
  async resetInstance(fileId: string, pageId: string, instanceId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:page-id': `~u${pageId}`,
        '~:id': `~u${instanceId}`,
      };

      const response = await this.post<unknown>(
        '/rpc/command/restore-component',
        payload,
        true
      );

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, 'Component instance reset to main');
    } catch (error) {
      logger.error('Failed to reset instance', error);
      return ErrorHandler.handle(error, 'resetInstance');
    }
  }
}
