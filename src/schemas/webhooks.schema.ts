import { z } from 'zod';

/**
 * Schema for Webhooks tool parameters
 * Manages webhooks for Penpot teams
 */
export const webhooksParamsSchema = z
  .object({
    action: z.enum(['list', 'create', 'update', 'delete']),
    teamId: z.string().uuid('Invalid team UUID').optional(),
    webhookId: z.string().uuid('Invalid webhook UUID').optional(),
    uri: z.string().url('Invalid webhook URL').optional(),
    mtype: z.enum(['json', 'transit']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // list and create require teamId
      if (['list', 'create'].includes(data.action) && !data.teamId) {
        return false;
      }
      // create requires uri
      if (data.action === 'create' && !data.uri) {
        return false;
      }
      // update and delete require webhookId
      if (['update', 'delete'].includes(data.action) && !data.webhookId) {
        return false;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type WebhooksParams = z.infer<typeof webhooksParamsSchema>;
