import { z } from 'zod';

/**
 * Schema for Templates tool parameters
 * Manages builtin templates in Penpot
 */
export const templatesParamsSchema = z
  .object({
    action: z.enum(['list', 'clone']),
    templateId: z.string().uuid('Invalid template UUID').optional(),
    projectId: z.string().uuid('Invalid project UUID').optional(),
    name: z.string().min(1).max(255).optional(),
  })
  .refine(
    (data) => {
      // clone requires templateId and projectId
      if (data.action === 'clone') {
        return !!data.templateId && !!data.projectId;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type TemplatesParams = z.infer<typeof templatesParamsSchema>;
