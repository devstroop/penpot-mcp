import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';
import { v4 as uuidv4 } from 'uuid';

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
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

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
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as {
        data?: { componentsIndex?: Record<string, unknown> };
      };

      const component = fileData.data?.componentsIndex?.[componentId];

      if (!component) {
        return ResponseFormatter.formatError(`Component not found: ${componentId}`);
      }

      return ResponseFormatter.formatSuccess(
        component,
        `Component: ${(component as Record<string, unknown>)['name']}`
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getComponent(${fileId}, ${componentId})`);
    }
  }

  /**
   * Search components by name
   */
  async searchComponents(fileId: string, query: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as {
        data?: { componentsIndex?: Record<string, unknown> };
      };

      const componentsIndex = fileData.data?.componentsIndex || {};
      const pattern = new RegExp(query, 'i');

      const matches = Object.entries(componentsIndex)
        .filter(([, data]) => {
          const comp = data as Record<string, unknown>;
          const name = String(comp['name'] || '');
          const path = ((comp['path'] as string[]) || []).join('/');
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
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

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
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as {
        data?: {
          componentsIndex?: Record<string, unknown>;
          pagesIndex?: Record<string, { objects?: Record<string, unknown> }>;
        };
      };

      const component = fileData.data?.componentsIndex?.[componentId] as
        | Record<string, unknown>
        | undefined;

      if (!component) {
        return ResponseFormatter.formatError(`Component not found: ${componentId}`);
      }

      const mainInstanceId = component['mainInstanceId'] as string;
      const mainInstancePage = component['mainInstancePage'] as string;

      if (!mainInstanceId || !mainInstancePage) {
        return ResponseFormatter.formatSuccess(
          {
            component: {
              id: componentId,
              name: component['name'],
              path: component['path'],
            },
            structure: null,
            message: 'Component has no main instance',
          },
          'Component structure'
        );
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

      return ResponseFormatter.formatSuccess(
        {
          component: {
            id: componentId,
            name: component['name'],
            path: component['path'],
            annotation: component['annotation'],
          },
          structure,
        },
        'Component structure retrieved'
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getComponentStructure(${fileId}, ${componentId})`);
    }
  }

  /**
   * Create a component from an object
   */
  async createComponent(
    fileId: string,
    pageId: string,
    objectId: string,
    name?: string
  ): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:file-id': `~u${fileId}`,
        '~:page-id': `~u${pageId}`,
        '~:id': `~u${objectId}`,
      };

      if (name) {
        payload['~:name'] = name;
      }

      const response = await this.post<unknown>('/rpc/command/add-component', payload, true);

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

      await this.post<unknown>('/rpc/command/delete-component', payload, true);

      return ResponseFormatter.formatSuccess({ deleted: true, componentId }, 'Component deleted');
    } catch (error) {
      logger.error('Failed to delete component', error);
      return ErrorHandler.handle(error, 'deleteComponent');
    }
  }

  /**
   * Rename a component
   */
  async renameComponent(
    fileId: string,
    componentId: string,
    newName: string
  ): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:id': `~u${componentId}`,
        '~:name': newName,
      };

      const response = await this.post<unknown>('/rpc/command/rename-component', payload, true);

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
  async updateComponentAnnotation(
    fileId: string,
    componentId: string,
    annotation: string
  ): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:id': `~u${componentId}`,
        '~:annotation': annotation,
      };

      const response = await this.post<unknown>('/rpc/command/update-component', payload, true);

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

      const response = await this.post<unknown>('/rpc/command/detach-component', payload, true);

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

      const response = await this.post<unknown>('/rpc/command/restore-component', payload, true);

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, 'Component instance reset to main');
    } catch (error) {
      logger.error('Failed to reset instance', error);
      return ErrorHandler.handle(error, 'resetInstance');
    }
  }

  /**
   * Instantiate a component (create a copy/instance) in a target file/page
   * ISSUE-002: Component instantiation
   *
   * This creates an instance of a library component at the specified position.
   * The instance maintains a link to the original component through shape-ref.
   */
  async instantiateComponent(
    targetFileId: string,
    targetPageId: string,
    sourceFileId: string,
    componentId: string,
    options: {
      x: number;
      y: number;
      name?: string;
      frameId?: string; // Optional parent frame
    }
  ): Promise<MCPResponse> {
    try {
      // Get the source file data to access the component
      const sourceResponse = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: sourceFileId },
        false
      );

      const sourceFileData = this.normalizeTransitResponse(sourceResponse) as {
        id: string;
        data?: {
          componentsIndex?: Record<string, unknown>;
          pagesIndex?: Record<string, { objects?: Record<string, unknown> }>;
        };
      };

      // Get component info
      const component = sourceFileData.data?.componentsIndex?.[componentId] as
        | Record<string, unknown>
        | undefined;

      if (!component) {
        return ResponseFormatter.formatError(`Component not found: ${componentId}`);
      }

      const mainInstanceId = component['mainInstanceId'] as string;
      const mainInstancePage = component['mainInstancePage'] as string;

      if (!mainInstanceId || !mainInstancePage) {
        return ResponseFormatter.formatError('Component has no main instance');
      }

      // Get the main instance shapes
      const pageObjects = sourceFileData.data?.pagesIndex?.[mainInstancePage]?.objects || {};
      const mainInstanceShape = pageObjects[mainInstanceId] as Record<string, unknown> | undefined;

      if (!mainInstanceShape) {
        return ResponseFormatter.formatError('Main instance shape not found');
      }

      // Collect all shapes in the component (main instance + all children)
      const componentShapes = this.collectShapesRecursively(pageObjects, mainInstanceId);

      if (componentShapes.length === 0) {
        return ResponseFormatter.formatError('No shapes found in component');
      }

      // Calculate position delta (from original position to target position)
      const originalX = (mainInstanceShape['x'] as number) || 0;
      const originalY = (mainInstanceShape['y'] as number) || 0;
      const deltaX = options.x - originalX;
      const deltaY = options.y - originalY;

      // Generate new IDs for all shapes
      const idMap = new Map<string, string>();
      for (const shape of componentShapes) {
        const oldId = shape['id'] as string;
        idMap.set(oldId, uuidv4());
      }

      // Determine parent frame
      const rootFrameId = '00000000-0000-0000-0000-000000000000';
      const parentFrameId = options.frameId || rootFrameId;

      // Clone shapes with new IDs and component references
      const newRootId = idMap.get(mainInstanceId)!;
      const clonedShapes = componentShapes.map((shape, index) => {
        const oldId = shape['id'] as string;
        const newId = idMap.get(oldId)!;
        const isRoot = oldId === mainInstanceId;

        // Clone the shape with updated properties
        const cloned = this.cloneShapeForInstance(
          shape,
          newId,
          idMap,
          deltaX,
          deltaY,
          sourceFileId,
          componentId,
          isRoot,
          parentFrameId,
          index === 0 ? options.name || (component['name'] as string) || 'Component' : undefined
        );

        return cloned;
      });

      // Get target file metadata for update-file
      const targetResponse = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: targetFileId },
        false
      );

      const targetFileData = this.normalizeTransitResponse(targetResponse) as {
        revn?: number;
        vern?: number;
      };

      const revn = targetFileData.revn || 0;
      const vern = targetFileData.vern || 0;

      // Build changes array
      const changes = clonedShapes.map((shape) => {
        const shapeId = shape['id'] as string;
        const shapeParentId = shape['parent-id'] as string;
        const shapeFrameId = shape['frame-id'] as string;

        return {
          '~:type': '~:add-obj',
          '~:id': `~u${shapeId}`,
          '~:page-id': `~u${targetPageId}`,
          '~:frame-id': `~u${shapeFrameId}`,
          '~:parent-id': `~u${shapeParentId}`,
          '~:ignore-touched': true,
          '~:components-v2': true,
          '~:obj': this.shapeToTransit(shape),
        };
      });

      // Submit changes via update-file
      const sessionId = uuidv4();
      const payload = {
        '~:id': `~u${targetFileId}`,
        '~:session-id': `~u${sessionId}`,
        '~:revn': revn,
        '~:vern': vern,
        '~:changes': changes,
      };

      const response = await this.postTransit<unknown>('/rpc/command/update-file', payload);

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(
        {
          instanceId: newRootId,
          componentId,
          sourceFileId,
          shapeCount: clonedShapes.length,
          position: { x: options.x, y: options.y },
          result,
        },
        `Component instance created: ${options.name || component['name'] || 'Component'}`
      );
    } catch (error) {
      logger.error('Failed to instantiate component', error);
      return ErrorHandler.handle(error, 'instantiateComponent');
    }
  }

  /**
   * Collect all shapes in a hierarchy recursively
   */
  private collectShapesRecursively(
    objects: Record<string, unknown>,
    rootId: string
  ): Array<Record<string, unknown>> {
    const result: Array<Record<string, unknown>> = [];
    const visited = new Set<string>();

    const collectShape = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const shape = objects[id] as Record<string, unknown> | undefined;
      if (!shape) return;

      result.push(shape);

      // Collect children
      const children = shape['shapes'] as string[] | undefined;
      if (children && Array.isArray(children)) {
        for (const childId of children) {
          collectShape(childId);
        }
      }
    };

    collectShape(rootId);
    return result;
  }

  /**
   * Clone a shape for component instantiation
   */
  private cloneShapeForInstance(
    original: Record<string, unknown>,
    newId: string,
    idMap: Map<string, string>,
    deltaX: number,
    deltaY: number,
    componentFileId: string,
    componentId: string,
    isRoot: boolean,
    parentFrameId: string,
    name?: string
  ): Record<string, unknown> {
    const cloned: Record<string, unknown> = { ...original };
    const originalId = original['id'] as string;

    // Update ID
    cloned['id'] = newId;

    // Update name if provided (only for root)
    if (name) {
      cloned['name'] = name;
    }

    // Set component reference properties
    if (isRoot) {
      // Root shape of the instance
      cloned['component-id'] = componentId;
      cloned['component-file'] = componentFileId;
      cloned['component-root'] = true;
      cloned['shape-ref'] = originalId; // Points to main instance shape
      // Remove main-instance flag (this is a copy, not the main)
      delete cloned['main-instance'];
      // Set parent to the target frame
      cloned['parent-id'] = parentFrameId;
      cloned['frame-id'] = parentFrameId;
    } else {
      // Child shapes
      cloned['shape-ref'] = originalId; // Points to corresponding main shape
      // Don't set component-id on children
      delete cloned['component-id'];
      delete cloned['component-file'];
      delete cloned['component-root'];
      delete cloned['main-instance'];

      // Update parent-id to new ID
      const originalParentId = original['parent-id'] as string;
      if (originalParentId && idMap.has(originalParentId)) {
        cloned['parent-id'] = idMap.get(originalParentId);
      }

      // Update frame-id
      const originalFrameId = original['frame-id'] as string;
      if (originalFrameId && idMap.has(originalFrameId)) {
        cloned['frame-id'] = idMap.get(originalFrameId);
      } else {
        cloned['frame-id'] = parentFrameId;
      }
    }

    // Update shapes array (children IDs) to new IDs
    const children = original['shapes'] as string[] | undefined;
    if (children && Array.isArray(children)) {
      cloned['shapes'] = children.map((childId) => idMap.get(childId) || childId);
    }

    // Apply position offset
    if (typeof cloned['x'] === 'number') {
      cloned['x'] = (cloned['x'] as number) + deltaX;
    }
    if (typeof cloned['y'] === 'number') {
      cloned['y'] = (cloned['y'] as number) + deltaY;
    }

    // Update selrect with offset
    if (cloned['selrect'] && typeof cloned['selrect'] === 'object') {
      const selrect = cloned['selrect'] as Record<string, number>;
      cloned['selrect'] = {
        x: selrect.x + deltaX,
        y: selrect.y + deltaY,
        width: selrect.width,
        height: selrect.height,
        x1: selrect.x1 + deltaX,
        y1: selrect.y1 + deltaY,
        x2: selrect.x2 + deltaX,
        y2: selrect.y2 + deltaY,
      };
    }

    // Update points with offset
    if (Array.isArray(cloned['points'])) {
      cloned['points'] = (cloned['points'] as Array<{ x: number; y: number }>).map((p) => ({
        x: p.x + deltaX,
        y: p.y + deltaY,
      }));
    }

    return cloned;
  }

  /**
   * Convert a shape object to transit format
   */
  private shapeToTransit(shape: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(shape)) {
      const transitKey = key.startsWith('~:') ? key : `~:${key}`;

      if (
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
      ) {
        // UUID value
        result[transitKey] = `~u${value}`;
      } else if (Array.isArray(value)) {
        // Array - recursively convert each element
        result[transitKey] = value.map((item) => {
          if (typeof item === 'object' && item !== null) {
            return this.shapeToTransit(item as Record<string, unknown>);
          }
          // Check if array item is a UUID
          if (
            typeof item === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item)
          ) {
            return `~u${item}`;
          }
          return item;
        });
      } else if (typeof value === 'object' && value !== null) {
        // Nested object
        result[transitKey] = this.shapeToTransit(value as Record<string, unknown>);
      } else {
        result[transitKey] = value;
      }
    }

    return result;
  }
}
