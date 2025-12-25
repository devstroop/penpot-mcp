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
      'instantiate',
    ]),
    fileId: z.string().uuid('Invalid file UUID'),
    componentId: z.string().uuid('Invalid component UUID').optional(),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    objectId: z.string().uuid('Invalid object UUID').optional(),
    instanceId: z.string().uuid('Invalid instance UUID').optional(),
    name: z.string().min(1).max(255).optional(),
    annotation: z.string().max(2000).optional(),
    query: z.string().optional(),
    // Instantiate action parameters
    sourceFileId: z.string().uuid('Invalid source file UUID').optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    frameId: z.string().uuid('Invalid frame UUID').optional(),
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
      // instantiate requires sourceFileId, componentId, pageId, x, y
      if (data.action === 'instantiate') {
        return (
          !!data.sourceFileId &&
          !!data.componentId &&
          !!data.pageId &&
          data.x !== undefined &&
          data.y !== undefined
        );
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type ComponentsParams = z.infer<typeof componentsParamsSchema>;
