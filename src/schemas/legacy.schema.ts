import { z } from 'zod';

/**
 * Schema for Navigate tool parameters (legacy)
 */
export const navigateParamsSchema = z
  .object({
    action: z.enum(['projects', 'files', 'pages', 'search']),
    projectId: z.string().uuid('Invalid project UUID').optional(),
    fileId: z.string().uuid('Invalid file UUID').optional(),
    query: z.string().optional(),
  })
  .refine(
    (data) => {
      // files requires projectId
      if (data.action === 'files') {
        return !!data.projectId;
      }
      // pages requires fileId
      if (data.action === 'pages') {
        return !!data.fileId;
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

export type NavigateParams = z.infer<typeof navigateParamsSchema>;

/**
 * Schema for Inspect tool parameters (legacy)
 */
export const inspectParamsSchema = z
  .object({
    action: z.enum(['file', 'structure', 'page', 'object', 'tree']),
    fileId: z.string().uuid('Invalid file UUID'),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    objectId: z.string().uuid('Invalid object UUID').optional(),
    depth: z.number().int().min(0).max(100).optional(),
  })
  .refine(
    (data) => {
      // page requires pageId
      if (data.action === 'page') {
        return !!data.pageId;
      }
      // object requires objectId
      if (data.action === 'object') {
        return !!data.objectId;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type InspectParams = z.infer<typeof inspectParamsSchema>;

/**
 * Schema for Assets tool parameters (legacy)
 */
export const assetsParamsSchema = z
  .object({
    action: z.enum(['export', 'list']),
    fileId: z.string().uuid('Invalid file UUID'),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    objectId: z.string().uuid('Invalid object UUID').optional(),
    format: z.enum(['png', 'svg', 'pdf']).optional(),
    scale: z.number().positive().max(10).optional(),
  })
  .refine(
    (data) => {
      // export requires objectId
      if (data.action === 'export') {
        return !!data.objectId;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type AssetsParams = z.infer<typeof assetsParamsSchema>;
