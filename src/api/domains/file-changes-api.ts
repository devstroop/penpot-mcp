import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Change types supported by Penpot's update-file API
 */
export type ChangeType = 
  | 'add-obj'
  | 'mod-obj'
  | 'del-obj'
  | 'add-page'
  | 'mod-page'
  | 'del-page'
  | 'add-color'
  | 'mod-color'
  | 'del-color'
  | 'add-typography'
  | 'mod-typography'
  | 'del-typography'
  | 'add-component'
  | 'mod-component'
  | 'del-component';

/**
 * Base change interface
 */
export interface BaseChange {
  type: ChangeType;
}

/**
 * Color change for add-color/mod-color
 */
export interface ColorChange extends BaseChange {
  type: 'add-color' | 'mod-color' | 'del-color';
  color: {
    id: string;
    name: string;
    color?: string;
    opacity?: number;
    path?: string;
  };
}

/**
 * Typography change
 */
export interface TypographyChange extends BaseChange {
  type: 'add-typography' | 'mod-typography' | 'del-typography';
  typography: {
    id: string;
    name: string;
    'font-family'?: string;
    'font-size'?: string;
    'font-weight'?: string;
    'font-style'?: string;
    'line-height'?: string;
    'letter-spacing'?: string;
    'text-transform'?: string;
    path?: string;
  };
}

/**
 * Object change for shapes
 */
export interface ObjectChange extends BaseChange {
  type: 'add-obj' | 'mod-obj' | 'del-obj';
  id: string;
  'page-id'?: string;
  'frame-id'?: string;
  'parent-id'?: string;
  obj?: Record<string, unknown>;
  operations?: Array<{
    type: 'set' | 'assign';
    attr?: string;
    val?: unknown;
    value?: Record<string, unknown>;
  }>;
}

/**
 * Page change
 */
export interface PageChange extends BaseChange {
  type: 'add-page' | 'mod-page' | 'del-page';
  id?: string;
  name?: string;
  page?: Record<string, unknown>;
}

export type FileChange = ColorChange | TypographyChange | ObjectChange | PageChange;

/**
 * File metadata needed for updates
 */
export interface FileMetadata {
  id: string;
  revn: number;
  vern: number;
  name: string;
}

/**
 * File Changes API Client
 * Handles all file modifications through the update-file endpoint
 */
export class FileChangesAPIClient extends BaseAPIClient {
  private sessionId: string;

  constructor(config: ConstructorParameters<typeof BaseAPIClient>[0]) {
    super(config);
    this.sessionId = uuidv4();
  }

  /**
   * Get file metadata needed for updates (revn, vern)
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const data = this.normalizeTransitResponse(response) as Record<string, unknown>;
      
      return {
        id: fileId,
        revn: (data['revn'] as number) || 0,
        vern: (data['vern'] as number) || 0,
        name: (data['name'] as string) || 'Untitled',
      };
    } catch (error) {
      logger.error('Failed to get file metadata', { fileId, error });
      return null;
    }
  }

  /**
   * Submit changes to a file using update-file endpoint
   */
  async submitChanges(fileId: string, changes: FileChange[]): Promise<MCPResponse> {
    try {
      // Get current file metadata
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return ResponseFormatter.formatError('Failed to get file metadata');
      }

      // Build the transit-encoded payload
      const payload = this.buildUpdatePayload(metadata, changes);

      logger.debug('Submitting file changes', { 
        fileId, 
        changeCount: changes.length,
        revn: metadata.revn,
        vern: metadata.vern,
        payload: JSON.stringify(payload),
      });

      // Use postRaw to send already-formatted Transit payload
      const response = await this.postTransit<unknown>(
        '/rpc/command/update-file',
        payload
      );

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, `Applied ${changes.length} change(s) to file`);
    } catch (error) {
      logger.error('Failed to submit file changes', { fileId, error });
      return ErrorHandler.handle(error, 'submitChanges');
    }
  }

  /**
   * Build the update-file payload with proper transit encoding
   */
  private buildUpdatePayload(metadata: FileMetadata, changes: FileChange[]): Record<string, unknown> {
    const transitChanges = changes.map(change => this.changeToTransit(change));

    return {
      '~:id': `~u${metadata.id}`,
      '~:session-id': `~u${this.sessionId}`,
      '~:revn': metadata.revn,
      '~:vern': metadata.vern,
      '~:changes': transitChanges,
    };
  }

  /**
   * Convert a change object to transit format
   */
  private changeToTransit(change: FileChange): Record<string, unknown> {
    switch (change.type) {
      case 'add-color':
      case 'mod-color':
        return this.colorChangeToTransit(change as ColorChange);
      case 'del-color':
        return this.deleteColorToTransit(change as ColorChange);
      case 'add-typography':
      case 'mod-typography':
        return this.typographyChangeToTransit(change as TypographyChange);
      case 'del-typography':
        return this.deleteTypographyToTransit(change as TypographyChange);
      case 'add-obj':
        return this.addObjectToTransit(change as ObjectChange);
      case 'mod-obj':
        return this.modObjectToTransit(change as ObjectChange);
      case 'del-obj':
        return this.deleteObjectToTransit(change as ObjectChange);
      case 'add-page':
        return this.addPageToTransit(change as PageChange);
      case 'mod-page':
        return this.modPageToTransit(change as PageChange);
      case 'del-page':
        return this.deletePageToTransit(change as PageChange);
      default:
        logger.warn('Unknown change type', { type: (change as BaseChange).type });
        return { '~:type': `~:${(change as BaseChange).type}` };
    }
  }

  private colorChangeToTransit(change: ColorChange): Record<string, unknown> {
    const color: Record<string, unknown> = {
      '~:id': `~u${change.color.id}`,
      '~:name': change.color.name,
    };

    if (change.color.color) {
      color['~:color'] = change.color.color;
    }
    if (change.color.opacity !== undefined) {
      color['~:opacity'] = change.color.opacity;
    }
    if (change.color.path !== undefined) {
      color['~:path'] = change.color.path;
    }

    return {
      '~:type': `~:${change.type}`,
      '~:color': color,
    };
  }

  private deleteColorToTransit(change: ColorChange): Record<string, unknown> {
    return {
      '~:type': '~:del-color',
      '~:id': `~u${change.color.id}`,
    };
  }

  private typographyChangeToTransit(change: TypographyChange): Record<string, unknown> {
    const typography: Record<string, unknown> = {
      '~:id': `~u${change.typography.id}`,
      '~:name': change.typography.name,
    };

    if (change.typography['font-family']) {
      typography['~:font-family'] = change.typography['font-family'];
    }
    if (change.typography['font-size']) {
      typography['~:font-size'] = change.typography['font-size'];
    }
    if (change.typography['font-weight']) {
      typography['~:font-weight'] = change.typography['font-weight'];
    }
    if (change.typography['font-style']) {
      typography['~:font-style'] = change.typography['font-style'];
    }
    if (change.typography['line-height']) {
      typography['~:line-height'] = change.typography['line-height'];
    }
    if (change.typography['letter-spacing']) {
      typography['~:letter-spacing'] = change.typography['letter-spacing'];
    }
    if (change.typography['text-transform']) {
      typography['~:text-transform'] = change.typography['text-transform'];
    }
    if (change.typography.path !== undefined) {
      typography['~:path'] = change.typography.path;
    }

    return {
      '~:type': `~:${change.type}`,
      '~:typography': typography,
    };
  }

  private deleteTypographyToTransit(change: TypographyChange): Record<string, unknown> {
    return {
      '~:type': '~:del-typography',
      '~:id': `~u${change.typography.id}`,
    };
  }

  private addObjectToTransit(change: ObjectChange): Record<string, unknown> {
    const result: Record<string, unknown> = {
      '~:type': '~:add-obj',
      '~:id': `~u${change.id}`,
    };

    if (change['page-id']) {
      result['~:page-id'] = `~u${change['page-id']}`;
    }
    if (change['frame-id']) {
      result['~:frame-id'] = `~u${change['frame-id']}`;
    }
    if (change['parent-id']) {
      result['~:parent-id'] = `~u${change['parent-id']}`;
    }
    if (change.obj) {
      result['~:obj'] = this.objectToTransit(change.obj);
    }

    return result;
  }

  private modObjectToTransit(change: ObjectChange): Record<string, unknown> {
    const result: Record<string, unknown> = {
      '~:type': '~:mod-obj',
      '~:id': `~u${change.id}`,
    };

    if (change['page-id']) {
      result['~:page-id'] = `~u${change['page-id']}`;
    }
    if (change.operations) {
      result['~:operations'] = change.operations.map(op => {
        const transitOp: Record<string, unknown> = {
          '~:type': `~:${op.type}`,
        };
        if (op.attr) {
          transitOp['~:attr'] = `~:${op.attr}`;
        }
        if (op.val !== undefined) {
          transitOp['~:val'] = op.val;
        }
        if (op.value) {
          transitOp['~:value'] = this.objectToTransit(op.value);
        }
        return transitOp;
      });
    }

    return result;
  }

  private deleteObjectToTransit(change: ObjectChange): Record<string, unknown> {
    const result: Record<string, unknown> = {
      '~:type': '~:del-obj',
      '~:id': `~u${change.id}`,
    };

    if (change['page-id']) {
      result['~:page-id'] = `~u${change['page-id']}`;
    }

    return result;
  }

  private addPageToTransit(change: PageChange): Record<string, unknown> {
    const result: Record<string, unknown> = {
      '~:type': '~:add-page',
    };

    if (change.id) {
      result['~:id'] = `~u${change.id}`;
    }
    if (change.name) {
      result['~:name'] = change.name;
    }

    return result;
  }

  private modPageToTransit(change: PageChange): Record<string, unknown> {
    const result: Record<string, unknown> = {
      '~:type': '~:mod-page',
      '~:id': `~u${change.id}`,
    };

    if (change.name) {
      result['~:name'] = change.name;
    }

    return result;
  }

  private deletePageToTransit(change: PageChange): Record<string, unknown> {
    return {
      '~:type': '~:del-page',
      '~:id': `~u${change.id}`,
    };
  }

  /**
   * Convert a generic object to transit format
   */
  private objectToTransit(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const transitKey = key.startsWith('~:') ? key : `~:${key}`;
      
      if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        // UUID value
        result[transitKey] = `~u${value}`;
      } else if (Array.isArray(value)) {
        // Array - recursively convert each element
        result[transitKey] = value.map(item => {
          if (typeof item === 'object' && item !== null) {
            return this.objectToTransit(item as Record<string, unknown>);
          }
          return item;
        });
      } else if (typeof value === 'object' && value !== null) {
        // Nested object
        result[transitKey] = this.objectToTransit(value as Record<string, unknown>);
      } else {
        result[transitKey] = value;
      }
    }

    return result;
  }

  // ==================== Convenience Methods ====================

  /**
   * Add a color to a file
   */
  async addColor(fileId: string, name: string, color: string, opacity?: number): Promise<MCPResponse> {
    const colorId = uuidv4();
    const change: ColorChange = {
      type: 'add-color',
      color: {
        id: colorId,
        name,
        color,
        opacity: opacity ?? 1,
        path: '',
      },
    };

    const result = await this.submitChanges(fileId, [change]);
    
    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: colorId, name, color, opacity: opacity ?? 1 },
        `Color "${name}" created`
      );
    }
    
    return result;
  }

  /**
   * Update a color in a file
   */
  async updateColor(fileId: string, colorId: string, updates: { name?: string; color?: string; opacity?: number }): Promise<MCPResponse> {
    const change: ColorChange = {
      type: 'mod-color',
      color: {
        id: colorId,
        name: updates.name || '',
        ...(updates.color && { color: updates.color }),
        ...(updates.opacity !== undefined && { opacity: updates.opacity }),
      },
    };

    return this.submitChanges(fileId, [change]);
  }

  /**
   * Delete a color from a file
   */
  async deleteColor(fileId: string, colorId: string): Promise<MCPResponse> {
    const change: ColorChange = {
      type: 'del-color',
      color: { id: colorId, name: '' },
    };

    return this.submitChanges(fileId, [change]);
  }

  /**
   * Add typography to a file
   */
  async addTypography(
    fileId: string, 
    name: string, 
    style: {
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: string;
      fontStyle?: string;
      lineHeight?: string;
      letterSpacing?: string;
      textTransform?: string;
    }
  ): Promise<MCPResponse> {
    const typographyId = uuidv4();
    const change: TypographyChange = {
      type: 'add-typography',
      typography: {
        id: typographyId,
        name,
        'font-family': style.fontFamily,
        'font-size': style.fontSize,
        'font-weight': style.fontWeight,
        'font-style': style.fontStyle || 'normal',
        'line-height': style.lineHeight || '1.2',
        'letter-spacing': style.letterSpacing || '0',
        'text-transform': style.textTransform || 'none',
        path: '',
      },
    };

    const result = await this.submitChanges(fileId, [change]);
    
    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: typographyId, name, ...style },
        `Typography "${name}" created`
      );
    }
    
    return result;
  }

  /**
   * Add a new page to a file
   */
  async addPage(fileId: string, name: string): Promise<MCPResponse> {
    const pageId = uuidv4();
    const change: PageChange = {
      type: 'add-page',
      id: pageId,
      name,
    };

    const result = await this.submitChanges(fileId, [change]);
    
    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: pageId, name },
        `Page "${name}" created`
      );
    }
    
    return result;
  }

  /**
   * Rename a page
   */
  async renamePage(fileId: string, pageId: string, newName: string): Promise<MCPResponse> {
    const change: PageChange = {
      type: 'mod-page',
      id: pageId,
      name: newName,
    };

    return this.submitChanges(fileId, [change]);
  }

  /**
   * Add a rectangle shape
   */
  async addRectangle(
    fileId: string,
    pageId: string,
    options: {
      x: number;
      y: number;
      width: number;
      height: number;
      name?: string;
      fill?: string;
      fillOpacity?: number;
    }
  ): Promise<MCPResponse> {
    const shapeId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    const { x, y, width, height } = options;

    const shape: Record<string, unknown> = {
      id: shapeId,
      name: options.name || 'Rectangle',
      type: 'rect',
      x: x,
      y: y,
      width: width,
      height: height,
      'frame-id': rootFrameId,
      'parent-id': rootFrameId,
      // Selection rectangle
      selrect: {
        x: x,
        y: y,
        width: width,
        height: height,
        x1: x,
        y1: y,
        x2: x + width,
        y2: y + height,
      },
      // Points (4 corners)
      points: [
        { x: x, y: y },
        { x: x + width, y: y },
        { x: x + width, y: y + height },
        { x: x, y: y + height },
      ],
      // Identity transform matrix
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      'transform-inverse': { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      fills: options.fill ? [{
        'fill-color': options.fill,
        'fill-opacity': options.fillOpacity ?? 1,
      }] : [],
      strokes: [],
      rotation: 0,
      'proportion-lock': false,
      rx: 0,
      ry: 0,
    };

    const change: ObjectChange = {
      type: 'add-obj',
      id: shapeId,
      'page-id': pageId,
      'frame-id': rootFrameId,
      'parent-id': rootFrameId,
      obj: shape,
    };

    const result = await this.submitChanges(fileId, [change]);
    
    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: shapeId, ...options },
        `Rectangle "${options.name || 'Rectangle'}" created`
      );
    }
    
    return result;
  }

  /**
   * Add a frame
   */
  async addFrame(
    fileId: string,
    pageId: string,
    options: {
      x: number;
      y: number;
      width: number;
      height: number;
      name?: string;
      fill?: string;
    }
  ): Promise<MCPResponse> {
    const frameId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    const { x, y, width, height } = options;

    // Build the complete frame object with all required geometry
    const frame: Record<string, unknown> = {
      id: frameId,
      name: options.name || 'Frame',
      type: 'frame',
      x: x,
      y: y,
      width: width,
      height: height,
      'frame-id': rootFrameId,
      'parent-id': rootFrameId,
      // Selection rectangle
      selrect: {
        x: x,
        y: y,
        width: width,
        height: height,
        x1: x,
        y1: y,
        x2: x + width,
        y2: y + height,
      },
      // Points (4 corners)
      points: [
        { x: x, y: y },
        { x: x + width, y: y },
        { x: x + width, y: y + height },
        { x: x, y: y + height },
      ],
      // Identity transform matrix
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      'transform-inverse': { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      fills: options.fill ? [{
        'fill-color': options.fill,
        'fill-opacity': 1,
      }] : [{
        'fill-color': '#FFFFFF',
        'fill-opacity': 1,
      }],
      strokes: [],
      rotation: 0,
      shapes: [],
      'proportion-lock': false,
      proportion: 1,
      'hide-fill-on-export': false,
      rx: 0,
      ry: 0,
    };

    const change: ObjectChange = {
      type: 'add-obj',
      id: frameId,
      'page-id': pageId,
      'frame-id': rootFrameId,
      'parent-id': rootFrameId,
      obj: frame,
    };

    const result = await this.submitChanges(fileId, [change]);
    
    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: frameId, ...options },
        `Frame "${options.name || 'Frame'}" created`
      );
    }
    
    return result;
  }

  /**
   * Add an ellipse shape
   */
  async addEllipse(
    fileId: string,
    pageId: string,
    options: {
      x: number;
      y: number;
      width: number;
      height: number;
      name?: string;
      fill?: string;
      fillOpacity?: number;
    }
  ): Promise<MCPResponse> {
    const shapeId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    const { x, y, width, height } = options;

    const shape: Record<string, unknown> = {
      id: shapeId,
      name: options.name || 'Ellipse',
      type: 'circle',
      x: x,
      y: y,
      width: width,
      height: height,
      'frame-id': rootFrameId,
      'parent-id': rootFrameId,
      // Selection rectangle
      selrect: {
        x: x,
        y: y,
        width: width,
        height: height,
        x1: x,
        y1: y,
        x2: x + width,
        y2: y + height,
      },
      // Points (4 corners)
      points: [
        { x: x, y: y },
        { x: x + width, y: y },
        { x: x + width, y: y + height },
        { x: x, y: y + height },
      ],
      // Identity transform matrix
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      'transform-inverse': { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      fills: options.fill ? [{
        'fill-color': options.fill,
        'fill-opacity': options.fillOpacity ?? 1,
      }] : [],
      strokes: [],
      rotation: 0,
      'proportion-lock': false,
    };

    const change: ObjectChange = {
      type: 'add-obj',
      id: shapeId,
      'page-id': pageId,
      'frame-id': rootFrameId,
      'parent-id': rootFrameId,
      obj: shape,
    };

    const result = await this.submitChanges(fileId, [change]);
    
    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: shapeId, ...options },
        `Ellipse "${options.name || 'Ellipse'}" created`
      );
    }
    
    return result;
  }

  /**
   * Add a text element
   */
  async addText(
    fileId: string,
    pageId: string,
    options: {
      x: number;
      y: number;
      content: string;
      name?: string;
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      fill?: string;
      width?: number;
      height?: number;
    }
  ): Promise<MCPResponse> {
    const shapeId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    const { x, y, content } = options;
    const fontSize = options.fontSize || 16;
    const fontFamily = options.fontFamily || 'sourcesanspro';
    const fontWeight = options.fontWeight || '400';
    const fill = options.fill || '#000000';
    
    // Estimate dimensions based on content
    const width = options.width || Math.max(content.length * fontSize * 0.6, 100);
    const height = options.height || fontSize * 1.5;

    // Build text content structure
    const textContent = {
      type: 'root',
      children: [
        {
          type: 'paragraph-set',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  text: content,
                  'font-id': `gfont-${fontFamily}`,
                  'font-family': fontFamily,
                  'font-size': fontSize.toString(),
                  'font-weight': fontWeight,
                  'fill-color': fill,
                  'fill-opacity': 1,
                }
              ],
              key: uuidv4().substring(0, 5),
            }
          ]
        }
      ]
    };

    const shape: Record<string, unknown> = {
      id: shapeId,
      name: options.name || 'Text',
      type: 'text',
      x: x,
      y: y,
      width: width,
      height: height,
      'frame-id': rootFrameId,
      'parent-id': rootFrameId,
      selrect: {
        x: x,
        y: y,
        width: width,
        height: height,
        x1: x,
        y1: y,
        x2: x + width,
        y2: y + height,
      },
      points: [
        { x: x, y: y },
        { x: x + width, y: y },
        { x: x + width, y: y + height },
        { x: x, y: y + height },
      ],
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      'transform-inverse': { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      rotation: 0,
      content: textContent,
      'grow-type': 'auto-width',
      'position-data': null,
    };

    const change: ObjectChange = {
      type: 'add-obj',
      id: shapeId,
      'page-id': pageId,
      'frame-id': rootFrameId,
      'parent-id': rootFrameId,
      obj: shape,
    };

    const result = await this.submitChanges(fileId, [change]);
    
    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: shapeId, text: content, ...options },
        `Text "${options.name || 'Text'}" created`
      );
    }
    
    return result;
  }

  /**
   * Add a path/line
   */
  async addPath(
    fileId: string,
    pageId: string,
    options: {
      points: Array<{ x: number; y: number; command?: string }>;
      name?: string;
      stroke?: string;
      strokeWidth?: number;
      fill?: string;
    }
  ): Promise<MCPResponse> {
    const shapeId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    const { points } = options;
    
    // Calculate bounding box
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const x2 = Math.max(...xs);
    const y2 = Math.max(...ys);
    const width = x2 - x || 1;
    const height = y2 - y || 1;

    // Build path content
    const pathContent = points.map((p, i) => ({
      command: p.command || (i === 0 ? 'move-to' : 'line-to'),
      params: { x: p.x, y: p.y },
    }));

    const shape: Record<string, unknown> = {
      id: shapeId,
      name: options.name || 'Path',
      type: 'path',
      x: x,
      y: y,
      width: width,
      height: height,
      'frame-id': rootFrameId,
      'parent-id': rootFrameId,
      selrect: {
        x: x, y: y, width: width, height: height,
        x1: x, y1: y, x2: x2, y2: y2,
      },
      points: [
        { x: x, y: y },
        { x: x2, y: y },
        { x: x2, y: y2 },
        { x: x, y: y2 },
      ],
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      'transform-inverse': { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      rotation: 0,
      content: pathContent,
      fills: options.fill ? [{ 'fill-color': options.fill, 'fill-opacity': 1 }] : [],
      strokes: options.stroke ? [{
        'stroke-color': options.stroke,
        'stroke-width': options.strokeWidth || 1,
        'stroke-opacity': 1,
        'stroke-style': 'solid',
        'stroke-alignment': 'center',
      }] : [],
    };

    const change: ObjectChange = {
      type: 'add-obj',
      id: shapeId,
      'page-id': pageId,
      'frame-id': rootFrameId,
      'parent-id': rootFrameId,
      obj: shape,
    };

    const result = await this.submitChanges(fileId, [change]);
    
    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: shapeId, ...options },
        `Path "${options.name || 'Path'}" created`
      );
    }
    
    return result;
  }

  /**
   * Modify an existing object's properties
   */
  async modifyObject(
    fileId: string,
    pageId: string,
    objectId: string,
    operations: Array<{ attr: string; val: unknown }>
  ): Promise<MCPResponse> {
    const change: ObjectChange = {
      type: 'mod-obj',
      id: objectId,
      'page-id': pageId,
      operations: operations.map(op => ({
        type: 'set',
        attr: op.attr,
        val: op.val,
      })),
    };

    const result = await this.submitChanges(fileId, [change]);
    
    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: objectId, modified: operations.length },
        `Object modified with ${operations.length} operation(s)`
      );
    }
    
    return result;
  }

  /**
   * Delete an object from a page
   */
  async deleteObject(fileId: string, pageId: string, objectId: string): Promise<MCPResponse> {
    const change: ObjectChange = {
      type: 'del-obj',
      id: objectId,
      'page-id': pageId,
    };

    const result = await this.submitChanges(fileId, [change]);
    
    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: objectId, deleted: true },
        `Object deleted`
      );
    }
    
    return result;
  }
}
