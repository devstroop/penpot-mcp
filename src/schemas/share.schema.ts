import { z } from 'zod';

/**
 * Schema for Share tool parameters
 * Manages share links for Penpot files
 */
export const shareParamsSchema = z
  .object({
    action: z.enum(['list', 'create', 'delete']),
    fileId: z.string().uuid('Invalid file UUID').optional(),
    shareId: z.string().uuid('Invalid share UUID').optional(),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    permission: z.enum(['all', 'team', 'authenticated']).optional(),
  })
  .refine(
    (data) => {
      // list and create require fileId
      if (['list', 'create'].includes(data.action) && !data.fileId) {
        return false;
      }
      // delete requires shareId
      if (data.action === 'delete' && !data.shareId) {
        return false;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type ShareParams = z.infer<typeof shareParamsSchema>;
