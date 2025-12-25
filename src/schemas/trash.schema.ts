import { z } from 'zod';

/**
 * Schema for Trash tool parameters
 * Manages deleted files in Penpot
 */
export const trashParamsSchema = z
  .object({
    action: z.enum(['list', 'restore', 'delete_permanently']),
    teamId: z.string().uuid('Invalid team UUID').optional(),
    fileIds: z.array(z.string().uuid('Invalid file UUID')).optional(),
  })
  .refine(
    (data) => {
      // all actions require teamId
      if (!data.teamId) {
        return false;
      }
      // restore and delete_permanently require fileIds
      if (
        ['restore', 'delete_permanently'].includes(data.action) &&
        (!data.fileIds || data.fileIds.length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type TrashParams = z.infer<typeof trashParamsSchema>;
