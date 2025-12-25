import { z } from 'zod';

/**
 * Schema for Shapes tool parameters
 */
export const shapesParamsSchema = z
  .object({
    action: z.enum(['add_frame', 'add_rectangle', 'add_ellipse', 'delete', 'list']),
    fileId: z.string().uuid('Invalid file UUID'),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    shapeId: z.string().uuid('Invalid shape UUID').optional(),
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
  })
  .refine(
    (data) => {
      // delete requires shapeId
      if (data.action === 'delete') {
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
