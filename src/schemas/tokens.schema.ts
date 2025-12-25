import { z } from 'zod';

/**
 * Schema for Tokens tool parameters (colors and typography)
 */
export const tokensParamsSchema = z
  .object({
    action: z.enum([
      'colors',
      'color_get',
      'color_create',
      'color_update',
      'color_delete',
      'typography',
      'typography_get',
      'typography_create',
      'typography_update',
      'typography_delete',
      'all',
      'search',
      'export_css',
      'export_json',
      'export_scss',
      'export_tailwind',
      'stats',
    ]),
    fileId: z.string().uuid('Invalid file UUID'),
    colorId: z.string().uuid('Invalid color UUID').optional(),
    typographyId: z.string().uuid('Invalid typography UUID').optional(),
    name: z.string().min(1).max(255).optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value (e.g., #FF0000)')
      .optional(),
    opacity: z.number().min(0).max(1).optional(),
    fontFamily: z.string().optional(),
    fontSize: z.number().positive().optional(),
    fontWeight: z.string().optional(),
    lineHeight: z.number().positive().optional(),
    query: z.string().optional(),
  })
  .refine(
    (data) => {
      // color_get, color_update, color_delete require colorId
      if (['color_get', 'color_update', 'color_delete'].includes(data.action)) {
        return !!data.colorId;
      }
      // color_create requires name and color
      if (data.action === 'color_create') {
        return !!data.name && !!data.color;
      }
      // typography_get, typography_update, typography_delete require typographyId
      if (['typography_get', 'typography_update', 'typography_delete'].includes(data.action)) {
        return !!data.typographyId;
      }
      // typography_create requires name and font details
      if (data.action === 'typography_create') {
        return !!data.name && !!data.fontFamily;
      }
      // search requires query
      if (data.action === 'search') {
        return !!data.query;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type TokensParams = z.infer<typeof tokensParamsSchema>;
