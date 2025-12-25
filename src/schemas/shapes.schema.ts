import { z } from 'zod';

/**
 * Shadow configuration schema
 */
const shadowSchema = z
  .object({
    style: z.enum(['drop-shadow', 'inner-shadow']).optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Shadow color must be a hex color')
      .optional(),
    opacity: z.number().min(0).max(1).optional(),
    offsetX: z.number().optional(),
    offsetY: z.number().optional(),
    blur: z.number().min(0).optional(),
    spread: z.number().optional(),
  })
  .optional();

/**
 * Gradient configuration schema (ISSUE-021)
 */
const gradientSchema = z
  .object({
    type: z.enum(['linear', 'radial']),
    startX: z.number().min(0).max(1).optional(),
    startY: z.number().min(0).max(1).optional(),
    endX: z.number().min(0).max(1).optional(),
    endY: z.number().min(0).max(1).optional(),
    stops: z
      .array(
        z.object({
          color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Stop color must be a hex color'),
          opacity: z.number().min(0).max(1).optional(),
          offset: z.number().min(0).max(1),
        })
      )
      .min(2, 'At least 2 color stops required'),
  })
  .optional();

/**
 * Layout gap schema (ISSUE-013)
 */
const layoutGapSchema = z
  .union([
    z.number().min(0),
    z.object({
      rowGap: z.number().min(0).optional(),
      columnGap: z.number().min(0).optional(),
    }),
  ])
  .optional();

/**
 * Layout padding schema (ISSUE-013)
 */
const layoutPaddingSchema = z
  .union([
    z.number().min(0),
    z.object({
      top: z.number().min(0).optional(),
      right: z.number().min(0).optional(),
      bottom: z.number().min(0).optional(),
      left: z.number().min(0).optional(),
    }),
  ])
  .optional();

/**
 * Schema for Shapes tool parameters
 */
export const shapesParamsSchema = z
  .object({
    action: z.enum([
      'add_frame',
      'add_rectangle',
      'add_ellipse',
      'add_text',
      'delete',
      'list',
      // ISSUE-009: Layer ordering
      'bring_to_front',
      'send_to_back',
      'move_to_index',
      // ISSUE-010: Grouping
      'group',
      'ungroup',
      // ISSUE-011: Duplicate
      'duplicate',
    ]),
    fileId: z.string().uuid('Invalid file UUID'),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    shapeId: z.string().uuid('Invalid shape UUID').optional(),
    frameId: z.string().uuid('Invalid frame UUID').optional(),
    name: z.string().min(1).max(255).optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().positive('Width must be positive').optional(),
    height: z.number().positive('Height must be positive').optional(),
    fill: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Fill must be a hex color (e.g., #FF0000)')
      .optional(),
    fillOpacity: z.number().min(0).max(1).optional(),
    // Border radius support (ISSUE-004)
    borderRadius: z.number().min(0).optional(),
    r1: z.number().min(0).optional(), // top-left
    r2: z.number().min(0).optional(), // top-right
    r3: z.number().min(0).optional(), // bottom-right
    r4: z.number().min(0).optional(), // bottom-left
    // Stroke support (ISSUE-005)
    stroke: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Stroke must be a hex color (e.g., #000000)')
      .optional(),
    strokeWidth: z.number().positive('Stroke width must be positive').optional(),
    strokeOpacity: z.number().min(0).max(1).optional(),
    strokeStyle: z.enum(['solid', 'dotted', 'dashed', 'mixed']).optional(),
    strokeAlignment: z.enum(['center', 'inner', 'outer']).optional(),
    // Shadow support (ISSUE-006)
    shadow: shadowSchema,
    // Gradient support (ISSUE-021)
    gradient: gradientSchema,
    // Constraints support (ISSUE-013)
    constraintsH: z.enum(['left', 'right', 'leftright', 'center', 'scale']).optional(),
    constraintsV: z.enum(['top', 'bottom', 'topbottom', 'center', 'scale']).optional(),
    // Auto-layout support (ISSUE-013) - for frames only
    layout: z.enum(['flex', 'grid']).optional(),
    layoutFlexDir: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional(),
    layoutGap: layoutGapSchema,
    layoutPadding: layoutPaddingSchema,
    layoutJustifyContent: z
      .enum(['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'])
      .optional(),
    layoutAlignItems: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    layoutWrap: z.enum(['nowrap', 'wrap']).optional(),
    // Text support (ISSUE-012)
    content: z.string().optional(), // Text content
    fontSize: z.number().positive().optional(),
    fontFamily: z.string().optional(),
    fontWeight: z.string().optional(),
    textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
    verticalAlign: z.enum(['top', 'center', 'bottom']).optional(),
    lineHeight: z.number().positive().optional(),
    letterSpacing: z.number().optional(),
    textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
    // ISSUE-009: Layer ordering
    objectIds: z.array(z.string().uuid()).optional(), // For bulk operations
    parentId: z.string().uuid().optional(), // Target parent for move/group operations
    index: z.number().int().min(0).optional(), // Target index for move_to_index
    // ISSUE-010: Grouping
    childIds: z.array(z.string().uuid()).optional(), // Child IDs for ungroup
    // ISSUE-011: Duplicate
    offsetX: z.number().optional(),
    offsetY: z.number().optional(),
  })
  .refine(
    (data) => {
      // delete requires shapeId
      if (data.action === 'delete') {
        return !!data.shapeId;
      }
      // add_text requires content
      if (data.action === 'add_text') {
        return !!data.content;
      }
      // Layer ordering actions require objectIds and parentId
      if (['bring_to_front', 'send_to_back', 'move_to_index'].includes(data.action)) {
        return !!(data.objectIds && data.objectIds.length > 0 && data.parentId);
      }
      // move_to_index also requires index
      if (data.action === 'move_to_index') {
        return data.index !== undefined;
      }
      // group requires objectIds (at least 2)
      if (data.action === 'group') {
        return !!(data.objectIds && data.objectIds.length >= 2);
      }
      // ungroup requires shapeId (group to dissolve) and childIds
      if (data.action === 'ungroup') {
        return !!(data.shapeId && data.childIds && data.childIds.length > 0);
      }
      // duplicate requires shapeId
      if (data.action === 'duplicate') {
        return !!data.shapeId;
      }
      // add actions should have dimensions (but can have defaults)
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type ShapesParams = z.infer<typeof shapesParamsSchema>;
