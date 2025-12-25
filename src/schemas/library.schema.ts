import { z } from 'zod';

/**
 * Schema for Library tool parameters
 */
export const libraryParamsSchema = z
  .object({
    action: z.enum([
      'shared',
      'link',
      'unlink',
      'linked',
      'publish',
      'unpublish',
      'summary',
      'sync',
      'colors',
      'typography',
      'components',
      'search',
    ]),
    teamId: z.string().uuid('Invalid team UUID').optional(),
    fileId: z.string().uuid('Invalid file UUID').optional(),
    libraryId: z.string().uuid('Invalid library UUID').optional(),
    query: z.string().optional(),
  })
  .refine(
    (data) => {
      // shared requires teamId
      if (data.action === 'shared') {
        return !!data.teamId;
      }
      // link/unlink require fileId and libraryId
      if (['link', 'unlink'].includes(data.action)) {
        return !!data.fileId && !!data.libraryId;
      }
      // linked, publish, unpublish, summary, sync, colors, typography, components require fileId
      if (['linked', 'publish', 'unpublish', 'summary', 'sync', 'colors', 'typography', 'components'].includes(data.action)) {
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

export type LibraryParams = z.infer<typeof libraryParamsSchema>;
