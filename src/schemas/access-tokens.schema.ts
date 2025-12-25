import { z } from 'zod';

/**
 * Schema for Access Tokens tool parameters
 * Manages programmatic access tokens in Penpot
 */
export const accessTokensParamsSchema = z
  .object({
    action: z.enum(['list', 'create', 'delete']),
    tokenId: z.string().uuid('Invalid token UUID').optional(),
    name: z.string().min(1).max(255).optional(),
    expiresAt: z.string().datetime('Invalid datetime format').optional(),
  })
  .refine(
    (data) => {
      // create requires name
      if (data.action === 'create' && !data.name) {
        return false;
      }
      // delete requires tokenId
      if (data.action === 'delete' && !data.tokenId) {
        return false;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type AccessTokensParams = z.infer<typeof accessTokensParamsSchema>;
