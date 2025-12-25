import { z } from 'zod';

/**
 * Schema for Search tool parameters
 */
export const searchParamsSchema = z
  .object({
    action: z.enum([
      'files',
      'objects',
      'components',
      'colors',
      'typography',
      'recent',
      'global',
    ]),
    query: z.string().optional(),
    teamId: z.string().uuid('Invalid team UUID').optional(),
    projectId: z.string().uuid('Invalid project UUID').optional(),
    fileId: z.string().uuid('Invalid file UUID').optional(),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    objectType: z.string().optional(),
    limit: z.number().int().positive().max(100, 'Limit cannot exceed 100').optional(),
  })
  .refine(
    (data) => {
      // global and files search require query
      if (['global', 'files'].includes(data.action)) {
        return !!data.query;
      }
      // objects search requires fileId
      if (data.action === 'objects') {
        return !!data.fileId;
      }
      // components, colors, typography search require fileId
      if (['components', 'colors', 'typography'].includes(data.action)) {
        return !!data.fileId;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type SearchParams = z.infer<typeof searchParamsSchema>;
