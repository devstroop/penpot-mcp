import { z } from 'zod';

/**
 * Schema for Templates tool parameters
 * Manages builtin templates in Penpot
 *
 * Note: Template IDs are string identifiers (not UUIDs) that reference
 * server-configured template files. Templates are primarily used in
 * self-hosted Penpot deployments.
 */
export const templatesParamsSchema = z
  .object({
    action: z.enum(['list', 'clone']),
    // Template ID is a string identifier, not UUID (e.g., "test", "welcome")
    templateId: z.string().min(1).max(255).optional(),
    projectId: z.string().uuid('Invalid project UUID').optional(),
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
      message: 'clone action requires templateId and projectId',
      path: ['action'],
    }
  );

export type TemplatesParams = z.infer<typeof templatesParamsSchema>;
