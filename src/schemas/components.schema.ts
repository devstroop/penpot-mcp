import { z } from 'zod';

/**
 * Schema for Components tool parameters
 */
export const componentsParamsSchema = z
  .object({
    action: z.enum([
      'list',
      'get',
      'search',
      'instances',
      'structure',
      'create',
      'delete',
      'rename',
      'annotate',
      'stats',
      'detach',
      'reset',
    ]),
    fileId: z.string().uuid('Invalid file UUID'),
    componentId: z.string().uuid('Invalid component UUID').optional(),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    objectId: z.string().uuid('Invalid object UUID').optional(),
    instanceId: z.string().uuid('Invalid instance UUID').optional(),
    name: z.string().min(1).max(255).optional(),
    annotation: z.string().max(2000).optional(),
    query: z.string().optional(),
  })
  .refine(
    (data) => {
      // Actions that require componentId
      if (['get', 'instances', 'structure', 'delete', 'rename', 'annotate'].includes(data.action)) {
        return !!data.componentId;
      }
      // create requires objectId
      if (data.action === 'create') {
        return !!data.objectId;
      }
      // detach/reset require instanceId
      if (['detach', 'reset'].includes(data.action)) {
        return !!data.instanceId;
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

export type ComponentsParams = z.infer<typeof componentsParamsSchema>;
