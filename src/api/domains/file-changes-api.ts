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
  | 'mov-objects'
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
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

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
      const response = await this.postTransit<unknown>('/rpc/command/update-file', payload);

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
  private buildUpdatePayload(
    metadata: FileMetadata,
    changes: FileChange[]
  ): Record<string, unknown> {
    const transitChanges = changes.map((change) => this.changeToTransit(change));

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
      result['~:operations'] = change.operations.map((op) => {
        const transitOp: Record<string, unknown> = {
          '~:type': `~:${op.type}`,
        };
        if (op.attr) {
          transitOp['~:attr'] = `~:${op.attr}`;
        }
        if (op.val !== undefined) {
          // Convert object values to Transit format
          if (typeof op.val === 'object' && op.val !== null) {
            transitOp['~:val'] = this.objectToTransit(op.val as Record<string, unknown>);
          } else {
            transitOp['~:val'] = op.val;
          }
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
  async addColor(
    fileId: string,
    name: string,
    color: string,
    opacity?: number
  ): Promise<MCPResponse> {
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
  async updateColor(
    fileId: string,
    colorId: string,
    updates: { name?: string; color?: string; opacity?: number }
  ): Promise<MCPResponse> {
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
      return ResponseFormatter.formatSuccess({ id: pageId, name }, `Page "${name}" created`);
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
      frameId?: string; // Optional: parent frame to attach to
      // Border radius support (ISSUE-004)
      borderRadius?: number;
      r1?: number; // top-left
      r2?: number; // top-right
      r3?: number; // bottom-right
      r4?: number; // bottom-left
      // Stroke support (ISSUE-005)
      stroke?: string;
      strokeWidth?: number;
      strokeOpacity?: number;
      strokeStyle?: 'solid' | 'dotted' | 'dashed' | 'mixed';
      strokeAlignment?: 'center' | 'inner' | 'outer';
      // Shadow support (ISSUE-006)
      shadow?: {
        style?: 'drop-shadow' | 'inner-shadow';
        color?: string;
        opacity?: number;
        offsetX?: number;
        offsetY?: number;
        blur?: number;
        spread?: number;
      };
      // Gradient support (ISSUE-021)
      gradient?: {
        type: 'linear' | 'radial';
        startX?: number;
        startY?: number;
        endX?: number;
        endY?: number;
        stops: Array<{ color: string; opacity?: number; offset: number }>;
      };
      // Constraints support (ISSUE-013)
      constraintsH?: 'left' | 'right' | 'leftright' | 'center' | 'scale';
      constraintsV?: 'top' | 'bottom' | 'topbottom' | 'center' | 'scale';
    }
  ): Promise<MCPResponse> {
    const shapeId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    // Use provided frameId or fall back to root
    const parentFrameId = options.frameId || rootFrameId;
    const { x, y, width, height } = options;

    // Calculate border radius values
    const borderRadius = options.borderRadius ?? 0;
    const r1 = options.r1 ?? borderRadius; // top-left
    const r2 = options.r2 ?? borderRadius; // top-right
    const r3 = options.r3 ?? borderRadius; // bottom-right
    const r4 = options.r4 ?? borderRadius; // bottom-left

    // Build strokes array
    const strokes = options.stroke
      ? [
          {
            'stroke-color': options.stroke,
            'stroke-width': options.strokeWidth ?? 1,
            'stroke-opacity': options.strokeOpacity ?? 1,
            'stroke-style': options.strokeStyle ?? 'solid',
            'stroke-alignment': options.strokeAlignment ?? 'center',
          },
        ]
      : [];

    // Build shadow array
    const shadow = options.shadow
      ? [
          {
            id: uuidv4(),
            style: options.shadow.style ?? 'drop-shadow',
            color: {
              color: options.shadow.color ?? '#000000',
              opacity: options.shadow.opacity ?? 0.25,
            },
            'offset-x': options.shadow.offsetX ?? 0,
            'offset-y': options.shadow.offsetY ?? 4,
            blur: options.shadow.blur ?? 8,
            spread: options.shadow.spread ?? 0,
            hidden: false,
          },
        ]
      : [];

    // Build fills array with gradient support
    let fills: Array<Record<string, unknown>> = [];
    if (options.gradient) {
      fills = [
        {
          'fill-color-gradient': {
            type: options.gradient.type,
            'start-x': options.gradient.startX ?? 0,
            'start-y': options.gradient.startY ?? 0,
            'end-x': options.gradient.endX ?? 1,
            'end-y': options.gradient.endY ?? 1,
            width: 1,
            stops: options.gradient.stops.map((stop) => ({
              color: stop.color,
              opacity: stop.opacity ?? 1,
              offset: stop.offset,
            })),
          },
        },
      ];
    } else if (options.fill) {
      fills = [
        {
          'fill-color': options.fill,
          'fill-opacity': options.fillOpacity ?? 1,
        },
      ];
    }

    const shape: Record<string, unknown> = {
      id: shapeId,
      name: options.name || 'Rectangle',
      type: 'rect',
      x: x,
      y: y,
      width: width,
      height: height,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
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
      fills: fills,
      strokes: strokes,
      rotation: 0,
      'proportion-lock': false,
      // Border radius (rx/ry for uniform, r1-r4 for individual corners)
      rx: borderRadius,
      ry: borderRadius,
      r1: r1,
      r2: r2,
      r3: r3,
      r4: r4,
      // Constraints
      ...(options.constraintsH && { 'constraints-h': options.constraintsH }),
      ...(options.constraintsV && { 'constraints-v': options.constraintsV }),
      // Shadow
      ...(shadow.length > 0 && { shadow }),
    };

    const change: ObjectChange = {
      type: 'add-obj',
      id: shapeId,
      'page-id': pageId,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
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
      frameId?: string; // Optional: parent frame to attach to
      // Border radius support (ISSUE-004)
      borderRadius?: number;
      r1?: number; // top-left
      r2?: number; // top-right
      r3?: number; // bottom-right
      r4?: number; // bottom-left
      // Stroke support (ISSUE-005)
      stroke?: string;
      strokeWidth?: number;
      strokeOpacity?: number;
      strokeStyle?: 'solid' | 'dotted' | 'dashed' | 'mixed';
      strokeAlignment?: 'center' | 'inner' | 'outer';
      // Shadow support (ISSUE-006)
      shadow?: {
        style?: 'drop-shadow' | 'inner-shadow';
        color?: string;
        opacity?: number;
        offsetX?: number;
        offsetY?: number;
        blur?: number;
        spread?: number;
      };
      // Gradient support (ISSUE-021)
      gradient?: {
        type: 'linear' | 'radial';
        startX?: number;
        startY?: number;
        endX?: number;
        endY?: number;
        stops: Array<{ color: string; opacity?: number; offset: number }>;
      };
      // Auto-layout support (ISSUE-013)
      layout?: 'flex' | 'grid';
      layoutFlexDir?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
      layoutGap?: number | { rowGap?: number; columnGap?: number };
      layoutPadding?: number | { top?: number; right?: number; bottom?: number; left?: number };
      layoutJustifyContent?:
        | 'start'
        | 'center'
        | 'end'
        | 'space-between'
        | 'space-around'
        | 'space-evenly';
      layoutAlignItems?: 'start' | 'center' | 'end' | 'stretch';
      layoutWrap?: 'nowrap' | 'wrap';
    }
  ): Promise<MCPResponse> {
    const newFrameId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    // Use provided frameId or fall back to root
    const parentFrameId = options.frameId || rootFrameId;
    const { x, y, width, height } = options;

    // Calculate border radius values
    const borderRadius = options.borderRadius ?? 0;
    const r1 = options.r1 ?? borderRadius;
    const r2 = options.r2 ?? borderRadius;
    const r3 = options.r3 ?? borderRadius;
    const r4 = options.r4 ?? borderRadius;

    // Build strokes array
    const strokes = options.stroke
      ? [
          {
            'stroke-color': options.stroke,
            'stroke-width': options.strokeWidth ?? 1,
            'stroke-opacity': options.strokeOpacity ?? 1,
            'stroke-style': options.strokeStyle ?? 'solid',
            'stroke-alignment': options.strokeAlignment ?? 'center',
          },
        ]
      : [];

    // Build shadow array
    const shadowArr = options.shadow
      ? [
          {
            id: uuidv4(),
            style: options.shadow.style ?? 'drop-shadow',
            color: {
              color: options.shadow.color ?? '#000000',
              opacity: options.shadow.opacity ?? 0.25,
            },
            'offset-x': options.shadow.offsetX ?? 0,
            'offset-y': options.shadow.offsetY ?? 4,
            blur: options.shadow.blur ?? 8,
            spread: options.shadow.spread ?? 0,
            hidden: false,
          },
        ]
      : [];

    // Build fills array with gradient support
    let fills: Array<Record<string, unknown>>;
    if (options.gradient) {
      fills = [
        {
          'fill-color-gradient': {
            type: options.gradient.type,
            'start-x': options.gradient.startX ?? 0,
            'start-y': options.gradient.startY ?? 0,
            'end-x': options.gradient.endX ?? 1,
            'end-y': options.gradient.endY ?? 1,
            width: 1,
            stops: options.gradient.stops.map((stop) => ({
              color: stop.color,
              opacity: stop.opacity ?? 1,
              offset: stop.offset,
            })),
          },
        },
      ];
    } else if (options.fill) {
      fills = [
        {
          'fill-color': options.fill,
          'fill-opacity': 1,
        },
      ];
    } else {
      fills = [
        {
          'fill-color': '#FFFFFF',
          'fill-opacity': 1,
        },
      ];
    }

    // Build layout properties for auto-layout frames
    const layoutProps: Record<string, unknown> = {};
    if (options.layout) {
      layoutProps['layout'] = options.layout;
      layoutProps['layout-flex-dir'] = options.layoutFlexDir ?? 'column';

      // Handle gap
      if (typeof options.layoutGap === 'number') {
        layoutProps['layout-gap'] = {
          'row-gap': options.layoutGap,
          'column-gap': options.layoutGap,
        };
      } else if (options.layoutGap) {
        layoutProps['layout-gap'] = {
          'row-gap': options.layoutGap.rowGap ?? 0,
          'column-gap': options.layoutGap.columnGap ?? 0,
        };
      }

      // Handle padding
      if (typeof options.layoutPadding === 'number') {
        layoutProps['layout-padding'] = {
          p1: options.layoutPadding, // top
          p2: options.layoutPadding, // right
          p3: options.layoutPadding, // bottom
          p4: options.layoutPadding, // left
        };
      } else if (options.layoutPadding) {
        layoutProps['layout-padding'] = {
          p1: options.layoutPadding.top ?? 0,
          p2: options.layoutPadding.right ?? 0,
          p3: options.layoutPadding.bottom ?? 0,
          p4: options.layoutPadding.left ?? 0,
        };
      }

      if (options.layoutJustifyContent) {
        layoutProps['layout-justify-content'] = options.layoutJustifyContent;
      }
      if (options.layoutAlignItems) {
        layoutProps['layout-align-items'] = options.layoutAlignItems;
      }
      if (options.layoutWrap) {
        layoutProps['layout-wrap-type'] = options.layoutWrap;
      }
    }

    // Build the complete frame object with all required geometry
    const frame: Record<string, unknown> = {
      id: newFrameId,
      name: options.name || 'Frame',
      type: 'frame',
      x: x,
      y: y,
      width: width,
      height: height,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
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
      fills: fills,
      strokes: strokes,
      rotation: 0,
      shapes: [],
      'proportion-lock': false,
      proportion: 1,
      'hide-fill-on-export': false,
      // Border radius
      rx: borderRadius,
      ry: borderRadius,
      r1: r1,
      r2: r2,
      r3: r3,
      r4: r4,
      // Shadow
      ...(shadowArr.length > 0 && { shadow: shadowArr }),
      // Auto-layout
      ...layoutProps,
    };

    const change: ObjectChange = {
      type: 'add-obj',
      id: newFrameId,
      'page-id': pageId,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
      obj: frame,
    };

    const result = await this.submitChanges(fileId, [change]);

    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: newFrameId, ...options },
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
      frameId?: string; // Optional: parent frame to attach to
      // Stroke support (ISSUE-005)
      stroke?: string;
      strokeWidth?: number;
      strokeOpacity?: number;
      strokeStyle?: 'solid' | 'dotted' | 'dashed' | 'mixed';
      strokeAlignment?: 'center' | 'inner' | 'outer';
      // Shadow support (ISSUE-006)
      shadow?: {
        style?: 'drop-shadow' | 'inner-shadow';
        color?: string;
        opacity?: number;
        offsetX?: number;
        offsetY?: number;
        blur?: number;
        spread?: number;
      };
      // Gradient support (ISSUE-021)
      gradient?: {
        type: 'linear' | 'radial';
        startX?: number;
        startY?: number;
        endX?: number;
        endY?: number;
        stops: Array<{ color: string; opacity?: number; offset: number }>;
      };
      // Constraints support (ISSUE-013)
      constraintsH?: 'left' | 'right' | 'leftright' | 'center' | 'scale';
      constraintsV?: 'top' | 'bottom' | 'topbottom' | 'center' | 'scale';
    }
  ): Promise<MCPResponse> {
    const shapeId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    // Use provided frameId or fall back to root
    const parentFrameId = options.frameId || rootFrameId;
    const { x, y, width, height } = options;

    // Build strokes array
    const strokes = options.stroke
      ? [
          {
            'stroke-color': options.stroke,
            'stroke-width': options.strokeWidth ?? 1,
            'stroke-opacity': options.strokeOpacity ?? 1,
            'stroke-style': options.strokeStyle ?? 'solid',
            'stroke-alignment': options.strokeAlignment ?? 'center',
          },
        ]
      : [];

    // Build shadow array
    const shadowArr = options.shadow
      ? [
          {
            id: uuidv4(),
            style: options.shadow.style ?? 'drop-shadow',
            color: {
              color: options.shadow.color ?? '#000000',
              opacity: options.shadow.opacity ?? 0.25,
            },
            'offset-x': options.shadow.offsetX ?? 0,
            'offset-y': options.shadow.offsetY ?? 4,
            blur: options.shadow.blur ?? 8,
            spread: options.shadow.spread ?? 0,
            hidden: false,
          },
        ]
      : [];

    // Build fills array with gradient support
    let fills: Array<Record<string, unknown>> = [];
    if (options.gradient) {
      fills = [
        {
          'fill-color-gradient': {
            type: options.gradient.type,
            'start-x': options.gradient.startX ?? 0,
            'start-y': options.gradient.startY ?? 0,
            'end-x': options.gradient.endX ?? 1,
            'end-y': options.gradient.endY ?? 1,
            width: 1,
            stops: options.gradient.stops.map((stop) => ({
              color: stop.color,
              opacity: stop.opacity ?? 1,
              offset: stop.offset,
            })),
          },
        },
      ];
    } else if (options.fill) {
      fills = [
        {
          'fill-color': options.fill,
          'fill-opacity': options.fillOpacity ?? 1,
        },
      ];
    }

    const shape: Record<string, unknown> = {
      id: shapeId,
      name: options.name || 'Ellipse',
      type: 'circle',
      x: x,
      y: y,
      width: width,
      height: height,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
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
      fills: fills,
      strokes: strokes,
      rotation: 0,
      'proportion-lock': false,
      // Constraints
      ...(options.constraintsH && { 'constraints-h': options.constraintsH }),
      ...(options.constraintsV && { 'constraints-v': options.constraintsV }),
      // Shadow
      ...(shadowArr.length > 0 && { shadow: shadowArr }),
    };

    const change: ObjectChange = {
      type: 'add-obj',
      id: shapeId,
      'page-id': pageId,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
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
      frameId?: string; // Optional: parent frame to attach to
      // Text alignment support (ISSUE-012)
      textAlign?: 'left' | 'center' | 'right' | 'justify';
      verticalAlign?: 'top' | 'center' | 'bottom';
      lineHeight?: number;
      letterSpacing?: number;
      textDecoration?: 'none' | 'underline' | 'line-through';
      textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    }
  ): Promise<MCPResponse> {
    const shapeId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    // Use provided frameId or fall back to root
    const parentFrameId = options.frameId || rootFrameId;
    const { x, y, content } = options;
    const fontSize = options.fontSize || 16;
    const fontFamily = options.fontFamily || 'sourcesanspro';
    const fontWeight = options.fontWeight || '400';
    const fill = options.fill || '#000000';
    const textAlign = options.textAlign || 'left';
    const lineHeight = options.lineHeight ?? 1.2;
    const letterSpacing = options.letterSpacing ?? 0;
    const textDecoration = options.textDecoration || 'none';
    const textTransform = options.textTransform || 'none';

    // Estimate dimensions based on content
    const width = options.width || Math.max(content.length * fontSize * 0.6, 100);
    const height = options.height || fontSize * 1.5;

    // Build text content structure with alignment
    const textContent = {
      type: 'root',
      children: [
        {
          type: 'paragraph-set',
          children: [
            {
              type: 'paragraph',
              'text-align': textAlign,
              children: [
                {
                  text: content,
                  'font-id': `gfont-${fontFamily}`,
                  'font-family': fontFamily,
                  'font-size': fontSize.toString(),
                  'font-weight': fontWeight,
                  'fill-color': fill,
                  'fill-opacity': 1,
                  'line-height': lineHeight,
                  'letter-spacing': letterSpacing,
                  'text-decoration': textDecoration,
                  'text-transform': textTransform,
                },
              ],
              key: uuidv4().substring(0, 5),
            },
          ],
        },
      ],
    };

    const shape: Record<string, unknown> = {
      id: shapeId,
      name: options.name || 'Text',
      type: 'text',
      x: x,
      y: y,
      width: width,
      height: height,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
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
      ...(options.verticalAlign && { 'vertical-align': options.verticalAlign }),
    };

    const change: ObjectChange = {
      type: 'add-obj',
      id: shapeId,
      'page-id': pageId,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
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
      frameId?: string; // Optional: parent frame to attach to
    }
  ): Promise<MCPResponse> {
    const shapeId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    // Use provided frameId or fall back to root
    const parentFrameId = options.frameId || rootFrameId;
    const { points } = options;

    // Calculate bounding box
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
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
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
      selrect: {
        x: x,
        y: y,
        width: width,
        height: height,
        x1: x,
        y1: y,
        x2: x2,
        y2: y2,
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
      strokes: options.stroke
        ? [
            {
              'stroke-color': options.stroke,
              'stroke-width': options.strokeWidth || 1,
              'stroke-opacity': 1,
              'stroke-style': 'solid',
              'stroke-alignment': 'center',
            },
          ]
        : [],
    };

    const change: ObjectChange = {
      type: 'add-obj',
      id: shapeId,
      'page-id': pageId,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
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
   * Import SVG as paths (ISSUE-007)
   * Parses SVG string and creates path shapes in Penpot
   */
  async importSVG(
    fileId: string,
    pageId: string,
    options: {
      svg: string; // SVG string content
      x?: number; // Position X offset
      y?: number; // Position Y offset
      scale?: number; // Scale factor (default: 1)
      name?: string; // Base name for shapes
      frameId?: string; // Parent frame to attach to
      groupShapes?: boolean; // Whether to group all shapes (default: true)
    }
  ): Promise<MCPResponse> {
    const { parseSVG, calculateOverallBounds } = await import('../../utils/svg-parser.js');

    const parsed = parseSVG(options.svg);

    if (parsed.shapes.length === 0) {
      return ResponseFormatter.formatError('No shapes found in SVG');
    }

    const scale = options.scale ?? 1;
    const offsetX = options.x ?? 0;
    const offsetY = options.y ?? 0;
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    const parentFrameId = options.frameId || rootFrameId;
    const shouldGroup = options.groupShapes !== false && parsed.shapes.length > 1;

    const changes: ObjectChange[] = [];
    const createdIds: string[] = [];

    // Calculate overall bounds for positioning
    const overallBounds = calculateOverallBounds(parsed.shapes);

    // Create each shape as a path
    for (let i = 0; i < parsed.shapes.length; i++) {
      const shape = parsed.shapes[i];
      const shapeId = uuidv4();
      createdIds.push(shapeId);

      // Apply scale and offset to path commands
      const scaledCommands = shape.pathData.map(
        (cmd: { command: string; params: Record<string, number | undefined> }) => {
          const params: Record<string, number> = {};
          if (cmd.params.x !== undefined)
            params.x = (cmd.params.x - overallBounds.x) * scale + offsetX;
          if (cmd.params.y !== undefined)
            params.y = (cmd.params.y - overallBounds.y) * scale + offsetY;
          if (cmd.params.c1x !== undefined)
            params.c1x = (cmd.params.c1x - overallBounds.x) * scale + offsetX;
          if (cmd.params.c1y !== undefined)
            params.c1y = (cmd.params.c1y - overallBounds.y) * scale + offsetY;
          if (cmd.params.c2x !== undefined)
            params.c2x = (cmd.params.c2x - overallBounds.x) * scale + offsetX;
          if (cmd.params.c2y !== undefined)
            params.c2y = (cmd.params.c2y - overallBounds.y) * scale + offsetY;
          return { command: cmd.command, params };
        }
      );

      // Calculate scaled bounds
      const scaledX = offsetX;
      const scaledY = offsetY;
      const scaledWidth = (shape.bounds.width || 1) * scale;
      const scaledHeight = (shape.bounds.height || 1) * scale;

      // Build fills array
      const fills: Record<string, unknown>[] = [];
      if (shape.fill) {
        fills.push({
          'fill-color': shape.fill,
          'fill-opacity': shape.fillOpacity ?? 1,
        });
      }

      // Build strokes array
      const strokes: Record<string, unknown>[] = [];
      if (shape.stroke && shape.strokeWidth) {
        strokes.push({
          'stroke-color': shape.stroke,
          'stroke-width': shape.strokeWidth * scale,
          'stroke-opacity': shape.strokeOpacity ?? 1,
          'stroke-style': 'solid',
          'stroke-alignment': 'center',
        });
      }

      const shapeName = options.name
        ? parsed.shapes.length > 1
          ? `${options.name}-${i + 1}`
          : options.name
        : shape.id || `SVG-Shape-${i + 1}`;

      const pathObj: Record<string, unknown> = {
        id: shapeId,
        name: shapeName,
        type: 'path',
        x: scaledX,
        y: scaledY,
        width: scaledWidth,
        height: scaledHeight,
        'frame-id': parentFrameId,
        'parent-id': parentFrameId,
        selrect: {
          x: scaledX,
          y: scaledY,
          width: scaledWidth,
          height: scaledHeight,
          x1: scaledX,
          y1: scaledY,
          x2: scaledX + scaledWidth,
          y2: scaledY + scaledHeight,
        },
        points: [
          { x: scaledX, y: scaledY },
          { x: scaledX + scaledWidth, y: scaledY },
          { x: scaledX + scaledWidth, y: scaledY + scaledHeight },
          { x: scaledX, y: scaledY + scaledHeight },
        ],
        transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
        'transform-inverse': { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
        rotation: 0,
        content: scaledCommands,
        fills: fills,
        strokes: strokes,
      };

      changes.push({
        type: 'add-obj',
        id: shapeId,
        'page-id': pageId,
        'frame-id': parentFrameId,
        'parent-id': parentFrameId,
        obj: pathObj,
      });
    }

    // If grouping multiple shapes
    let groupId: string | undefined;
    if (shouldGroup) {
      groupId = uuidv4();
      const groupWidth = overallBounds.width * scale;
      const groupHeight = overallBounds.height * scale;

      const groupObj: Record<string, unknown> = {
        id: groupId,
        name: options.name || 'SVG Import',
        type: 'group',
        x: offsetX,
        y: offsetY,
        width: groupWidth,
        height: groupHeight,
        'frame-id': parentFrameId,
        'parent-id': parentFrameId,
        selrect: {
          x: offsetX,
          y: offsetY,
          width: groupWidth,
          height: groupHeight,
          x1: offsetX,
          y1: offsetY,
          x2: offsetX + groupWidth,
          y2: offsetY + groupHeight,
        },
        points: [
          { x: offsetX, y: offsetY },
          { x: offsetX + groupWidth, y: offsetY },
          { x: offsetX + groupWidth, y: offsetY + groupHeight },
          { x: offsetX, y: offsetY + groupHeight },
        ],
        transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
        'transform-inverse': { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
        rotation: 0,
        shapes: createdIds,
      };

      // Insert group change at the beginning
      changes.unshift({
        type: 'add-obj',
        id: groupId,
        'page-id': pageId,
        'frame-id': parentFrameId,
        'parent-id': parentFrameId,
        obj: groupObj,
      });

      // Update all shapes to have the group as parent
      for (const change of changes.slice(1)) {
        if (change.obj) {
          change.obj['parent-id'] = groupId;
          change['parent-id'] = groupId;
        }
      }
    }

    const result = await this.submitChanges(fileId, changes);

    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        {
          groupId: groupId,
          shapeIds: createdIds,
          shapeCount: parsed.shapes.length,
          svgWidth: parsed.width,
          svgHeight: parsed.height,
        },
        `SVG imported: ${parsed.shapes.length} shape(s) created${shouldGroup ? ' (grouped)' : ''}`
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
      operations: operations.map((op) => ({
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
      return ResponseFormatter.formatSuccess({ id: objectId, deleted: true }, `Object deleted`);
    }

    return result;
  }

  /**
   * Add an image shape using a previously uploaded media object
   * ISSUE-001: Image support
   *
   * @param mediaObject - The media object returned from MediaAPIClient.uploadFromUrl or uploadFile
   */
  async addImage(
    fileId: string,
    pageId: string,
    options: {
      x: number;
      y: number;
      width?: number;
      height?: number;
      name?: string;
      frameId?: string;
      // Media object info from upload
      mediaId: string;
      mediaWidth: number;
      mediaHeight: number;
      mimeType?: string;
      // Shadow support
      shadow?: {
        style?: 'drop-shadow' | 'inner-shadow';
        color?: string;
        opacity?: number;
        offsetX?: number;
        offsetY?: number;
        blur?: number;
        spread?: number;
      };
    }
  ): Promise<MCPResponse> {
    const shapeId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    const parentFrameId = options.frameId || rootFrameId;

    // Use media dimensions if not specified, or scale to fit specified dimensions
    const width = options.width || options.mediaWidth;
    const height = options.height || options.mediaHeight;
    const { x, y } = options;

    // Build shadow array
    const shadowArr = options.shadow
      ? [
          {
            id: uuidv4(),
            style: options.shadow.style ?? 'drop-shadow',
            color: {
              color: options.shadow.color ?? '#000000',
              opacity: options.shadow.opacity ?? 0.25,
            },
            'offset-x': options.shadow.offsetX ?? 0,
            'offset-y': options.shadow.offsetY ?? 4,
            blur: options.shadow.blur ?? 8,
            spread: options.shadow.spread ?? 0,
            hidden: false,
          },
        ]
      : [];

    const shape: Record<string, unknown> = {
      id: shapeId,
      name: options.name || 'Image',
      type: 'image',
      x: x,
      y: y,
      width: width,
      height: height,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
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
      'proportion-lock': true,
      // Media metadata - links to uploaded media object
      metadata: {
        id: options.mediaId,
        width: options.mediaWidth,
        height: options.mediaHeight,
        mtype: options.mimeType || 'image/png',
      },
      // Shadow
      ...(shadowArr.length > 0 && { shadow: shadowArr }),
    };

    const change: ObjectChange = {
      type: 'add-obj',
      id: shapeId,
      'page-id': pageId,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
      obj: shape,
    };

    const result = await this.submitChanges(fileId, [change]);

    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: shapeId, mediaId: options.mediaId, width, height },
        `Image "${options.name || 'Image'}" created`
      );
    }

    return result;
  }

  /**
   * Delete a page from a file
   * ISSUE-008: Page management
   */
  async deletePage(fileId: string, pageId: string): Promise<MCPResponse> {
    const change: PageChange = {
      type: 'del-page',
      id: pageId,
    };

    const result = await this.submitChanges(fileId, [change]);

    if (!result.isError) {
      return ResponseFormatter.formatSuccess({ id: pageId, deleted: true }, `Page deleted`);
    }

    return result;
  }

  // ==================== ISSUE-009: Layer Ordering ====================

  /**
   * Move objects to a different position in the z-order
   * Uses mov-objects change type
   */
  async moveObjects(
    fileId: string,
    pageId: string,
    objectIds: string[],
    parentId: string,
    index: number
  ): Promise<MCPResponse> {
    // mov-objects is a special change type for reordering
    const change = {
      type: 'mov-objects' as ChangeType,
      'page-id': pageId,
      'parent-id': parentId,
      shapes: objectIds,
      index: index,
    };

    // We need to extend submitChanges to handle this custom type
    const result = await this.submitMovObjects(fileId, change);

    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { objectIds, parentId, index },
        `Moved ${objectIds.length} object(s) to index ${index}`
      );
    }

    return result;
  }

  /**
   * Submit mov-objects change (different structure from standard changes)
   */
  private async submitMovObjects(
    fileId: string,
    change: {
      type: string;
      'page-id': string;
      'parent-id': string;
      shapes: string[];
      index: number;
    }
  ): Promise<MCPResponse> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return ResponseFormatter.formatError('Failed to get file metadata');
      }

      const transitChange = {
        '~:type': '~:mov-objects',
        '~:page-id': `~u${change['page-id']}`,
        '~:parent-id': `~u${change['parent-id']}`,
        '~:shapes': change.shapes.map((id) => `~u${id}`),
        '~:index': change.index,
      };

      const payload = {
        '~:id': `~u${metadata.id}`,
        '~:session-id': `~u${this.sessionId}`,
        '~:revn': metadata.revn,
        '~:vern': metadata.vern,
        '~:changes': [transitChange],
      };

      const response = await this.postTransit<unknown>('/rpc/command/update-file', payload);
      const result = this.normalizeTransitResponse(response);
      return ResponseFormatter.formatSuccess(result, 'Objects moved');
    } catch (error) {
      logger.error('Failed to move objects', { fileId, error });
      return ErrorHandler.handle(error, 'moveObjects');
    }
  }

  /**
   * Bring object(s) to front (top of z-order)
   */
  async bringToFront(
    fileId: string,
    pageId: string,
    objectIds: string[],
    parentId: string
  ): Promise<MCPResponse> {
    // Index of -1 or a very high number puts it at the end (front)
    return this.moveObjects(fileId, pageId, objectIds, parentId, 999999);
  }

  /**
   * Send object(s) to back (bottom of z-order)
   */
  async sendToBack(
    fileId: string,
    pageId: string,
    objectIds: string[],
    parentId: string
  ): Promise<MCPResponse> {
    // Index 0 puts it at the beginning (back)
    return this.moveObjects(fileId, pageId, objectIds, parentId, 0);
  }

  // ==================== ISSUE-010: Grouping ====================

  /**
   * Group multiple objects together
   */
  async groupObjects(
    fileId: string,
    pageId: string,
    objectIds: string[],
    options?: {
      name?: string;
      frameId?: string;
    }
  ): Promise<MCPResponse> {
    if (objectIds.length < 2) {
      return ResponseFormatter.formatError('At least 2 objects are required to create a group');
    }

    const groupId = uuidv4();
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    const parentFrameId = options?.frameId || rootFrameId;

    // First, we need to get the bounds of all objects to calculate group bounds
    // For simplicity, we'll create a group with placeholder bounds
    // The actual bounds should be calculated from the children
    const group: Record<string, unknown> = {
      id: groupId,
      name: options?.name || 'Group',
      type: 'group',
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
      shapes: objectIds,
      // Placeholder geometry - Penpot will recalculate
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      selrect: { x: 0, y: 0, width: 100, height: 100, x1: 0, y1: 0, x2: 100, y2: 100 },
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      'transform-inverse': { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      rotation: 0,
    };

    // Create the group
    const addGroupChange: ObjectChange = {
      type: 'add-obj',
      id: groupId,
      'page-id': pageId,
      'frame-id': parentFrameId,
      'parent-id': parentFrameId,
      obj: group,
    };

    // Update each child object to have the group as parent
    const updateChildrenChanges: ObjectChange[] = objectIds.map((childId) => ({
      type: 'mod-obj',
      id: childId,
      'page-id': pageId,
      operations: [
        { type: 'set', attr: 'parent-id', val: groupId },
        { type: 'set', attr: 'frame-id', val: parentFrameId },
      ],
    }));

    const allChanges = [addGroupChange, ...updateChildrenChanges];
    const result = await this.submitChanges(fileId, allChanges);

    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: groupId, children: objectIds },
        `Group "${options?.name || 'Group'}" created with ${objectIds.length} objects`
      );
    }

    return result;
  }

  /**
   * Ungroup objects (dissolve a group)
   */
  async ungroupObjects(
    fileId: string,
    pageId: string,
    groupId: string,
    childIds: string[],
    parentId?: string
  ): Promise<MCPResponse> {
    const rootFrameId = '00000000-0000-0000-0000-000000000000';
    const targetParentId = parentId || rootFrameId;

    // Update each child to have the group's parent as their new parent
    const updateChildrenChanges: ObjectChange[] = childIds.map((childId) => ({
      type: 'mod-obj',
      id: childId,
      'page-id': pageId,
      operations: [
        { type: 'set', attr: 'parent-id', val: targetParentId },
        { type: 'set', attr: 'frame-id', val: targetParentId },
      ],
    }));

    // Delete the group
    const deleteGroupChange: ObjectChange = {
      type: 'del-obj',
      id: groupId,
      'page-id': pageId,
    };

    const allChanges = [...updateChildrenChanges, deleteGroupChange];
    const result = await this.submitChanges(fileId, allChanges);

    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { groupId, freedChildren: childIds },
        `Group dissolved, ${childIds.length} objects released`
      );
    }

    return result;
  }

  // ==================== ISSUE-011: Duplicate Objects ====================

  /**
   * Duplicate an object
   */
  async duplicateObject(
    fileId: string,
    pageId: string,
    sourceObject: Record<string, unknown>,
    options?: {
      offsetX?: number;
      offsetY?: number;
      name?: string;
    }
  ): Promise<MCPResponse> {
    const newId = uuidv4();
    const offsetX = options?.offsetX ?? 20;
    const offsetY = options?.offsetY ?? 20;

    // Deep clone the source object
    const duplicatedObj = this.deepCloneObject(sourceObject, newId, offsetX, offsetY);

    // Override name if provided
    if (options?.name) {
      duplicatedObj.name = options.name;
    } else {
      duplicatedObj.name = `${sourceObject.name || 'Object'} (copy)`;
    }

    const parentId =
      (sourceObject['parent-id'] as string) ||
      (sourceObject['frame-id'] as string) ||
      '00000000-0000-0000-0000-000000000000';
    const frameId = (sourceObject['frame-id'] as string) || '00000000-0000-0000-0000-000000000000';

    const change: ObjectChange = {
      type: 'add-obj',
      id: newId,
      'page-id': pageId,
      'frame-id': frameId,
      'parent-id': parentId,
      obj: duplicatedObj,
    };

    const result = await this.submitChanges(fileId, [change]);

    if (!result.isError) {
      return ResponseFormatter.formatSuccess(
        { id: newId, sourceId: sourceObject.id, offset: { x: offsetX, y: offsetY } },
        `Object duplicated as "${duplicatedObj.name}"`
      );
    }

    return result;
  }

  /**
   * Deep clone an object with new ID and offset
   */
  private deepCloneObject(
    obj: Record<string, unknown>,
    newId: string,
    offsetX: number,
    offsetY: number
  ): Record<string, unknown> {
    const cloned: Record<string, unknown> = { ...obj };

    // Update ID
    cloned.id = newId;

    // Apply offset to position
    if (typeof cloned.x === 'number') {
      cloned.x = cloned.x + offsetX;
    }
    if (typeof cloned.y === 'number') {
      cloned.y = cloned.y + offsetY;
    }

    // Update selrect with offset
    if (cloned.selrect && typeof cloned.selrect === 'object') {
      const selrect = cloned.selrect as Record<string, number>;
      cloned.selrect = {
        x: selrect.x + offsetX,
        y: selrect.y + offsetY,
        width: selrect.width,
        height: selrect.height,
        x1: selrect.x1 + offsetX,
        y1: selrect.y1 + offsetY,
        x2: selrect.x2 + offsetX,
        y2: selrect.y2 + offsetY,
      };
    }

    // Update points with offset
    if (Array.isArray(cloned.points)) {
      cloned.points = (cloned.points as Array<{ x: number; y: number }>).map((p) => ({
        x: p.x + offsetX,
        y: p.y + offsetY,
      }));
    }

    // Handle nested children (for groups/frames)
    if (Array.isArray(cloned.shapes)) {
      // Note: For proper duplication of nested structures,
      // each child would need to be duplicated recursively
      // For now, we clear shapes to avoid reference issues
      cloned.shapes = [];
    }

    return cloned;
  }
}
