import { z } from 'zod';

/**
 * Schema for Access Tokens tool parameters
 * Manages programmatic access tokens in Penpot
 *
 * Note: Penpot's access token expiration uses duration format like "30d", "1y"
 * rather than ISO datetime strings.
 */
export const accessTokensParamsSchema = z
  .object({
    action: z.enum(['list', 'create', 'delete']),
    tokenId: z.string().uuid('Invalid token UUID').optional(),
    name: z.string().min(1).max(250).optional(),
    // Expiration as duration string (e.g., "30d" for 30 days, "1y" for 1 year)
    expiration: z.string().optional(),
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
