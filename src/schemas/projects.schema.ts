import { z } from 'zod';

/**
 * Schema for Projects tool parameters
 */
export const projectsParamsSchema = z
  .object({
    action: z.enum([
      'list',
      'get',
      'create',
      'rename',
      'delete',
      'duplicate',
      'move',
      'files',
      'stats',
    ]),
    teamId: z.string().uuid('Invalid team UUID').optional(),
    projectId: z.string().uuid('Invalid project UUID').optional(),
    name: z.string().min(1, 'Name cannot be empty').max(255, 'Name too long').optional(),
    targetTeamId: z.string().uuid('Invalid target team UUID').optional(),
  })
  .refine(
    (data) => {
      // Actions that require projectId
      if (['get', 'rename', 'delete', 'duplicate', 'files', 'stats'].includes(data.action)) {
        return !!data.projectId;
      }
      // Create requires name
      if (data.action === 'create') {
        return !!data.name;
      }
      // Move requires both projectId and targetTeamId
      if (data.action === 'move') {
        return !!data.projectId && !!data.targetTeamId;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type ProjectsParams = z.infer<typeof projectsParamsSchema>;
