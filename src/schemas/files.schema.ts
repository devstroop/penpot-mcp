import { z } from 'zod';

/**
 * Schema for path point in path elements
 */
const pathPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  command: z.string().optional(),
});

/**
 * Schema for object modification operations
 */
const operationSchema = z.object({
  attr: z.string().min(1, 'Attribute name required'),
  val: z.unknown(),
});

/**
 * Schema for Files tool parameters
 */
export const filesParamsSchema = z
  .object({
    action: z.enum([
      'get',
      'create',
      'rename',
      'delete',
      'duplicate',
      'move',
      'pages',
      'page',
      'objects',
      'object',
      'tree',
      'search',
      'analyze',
      'history',
      'snapshot',
      'add_frame',
      'add_rectangle',
      'add_ellipse',
      'add_text',
      'add_path',
      'modify_object',
      'delete_object',
      'import_svg', // ISSUE-007: SVG Import
    ]),
    fileId: z.string().uuid('Invalid file UUID').optional(),
    projectId: z.string().uuid('Invalid project UUID').optional(),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    objectId: z.string().uuid('Invalid object UUID').optional(),
    name: z.string().min(1).max(255).optional(),
    query: z.string().optional(),
    objectType: z.string().optional(),
    depth: z.number().int().min(0).max(100).optional(),
    snapshotAction: z.enum(['create', 'restore', 'list']).optional(),
    snapshotId: z.string().uuid('Invalid snapshot UUID').optional(),
    // Position and dimensions
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().positive('Width must be positive').optional(),
    height: z.number().positive('Height must be positive').optional(),
    // Fill options
    fill: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Fill must be a hex color (e.g., #FF0000)')
      .optional(),
    fillOpacity: z.number().min(0).max(1).optional(),
    // Parent frame for shape attachment
    frameId: z.string().uuid('Invalid frame UUID').optional(),
    // Text element options
    content: z.string().optional(),
    fontSize: z.number().positive().optional(),
    fontFamily: z.string().optional(),
    fontWeight: z.string().optional(),
    // Path/stroke options
    stroke: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Stroke must be a hex color')
      .optional(),
    strokeWidth: z.number().positive().optional(),
    pathPoints: z.array(pathPointSchema).optional(),
    // Modify object options
    operations: z.array(operationSchema).optional(),
    // SVG import options (ISSUE-007)
    svgContent: z.string().optional(),
    scale: z.number().positive().optional(),
    groupShapes: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Most actions require fileId
      const fileIdRequired = [
        'get',
        'rename',
        'delete',
        'duplicate',
        'move',
        'pages',
        'page',
        'objects',
        'object',
        'tree',
        'search',
        'analyze',
        'history',
        'snapshot',
        'add_frame',
        'add_rectangle',
        'add_ellipse',
        'add_text',
        'add_path',
        'modify_object',
        'delete_object',
        'import_svg',
      ];
      if (fileIdRequired.includes(data.action) && !data.fileId) {
        return false;
      }
      // Create requires projectId and name
      if (data.action === 'create') {
        return !!data.projectId && !!data.name;
      }
      // page, objects, object actions require pageId
      if (['page', 'objects'].includes(data.action) && !data.pageId) {
        return false;
      }
      // object action requires objectId
      if (data.action === 'object' && !data.objectId) {
        return false;
      }
      // modify_object requires objectId and operations
      if (data.action === 'modify_object') {
        return !!data.objectId && !!data.operations && data.operations.length > 0;
      }
      // delete_object requires objectId
      if (data.action === 'delete_object' && !data.objectId) {
        return false;
      }
      // import_svg requires pageId and svgContent
      if (data.action === 'import_svg') {
        return !!data.pageId && !!data.svgContent;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type FilesParams = z.infer<typeof filesParamsSchema>;
