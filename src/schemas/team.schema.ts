import { z } from 'zod';

/**
 * Schema for Team tool parameters
 */
export const teamParamsSchema = z
  .object({
    action: z.enum([
      'list',
      'get',
      'create',
      'rename',
      'delete',
      'members',
      'invite',
      'remove_member',
      'update_role',
      'invitations',
      'cancel_invite',
      'leave',
      'stats',
    ]),
    teamId: z.string().uuid('Invalid team UUID').optional(),
    name: z.string().min(1).max(255).optional(),
    email: z.string().email('Invalid email address').optional(),
    memberId: z.string().uuid('Invalid member UUID').optional(),
    role: z.enum(['admin', 'editor', 'viewer']).optional(),
    invitationId: z.string().uuid('Invalid invitation UUID').optional(),
  })
  .refine(
    (data) => {
      // Actions that require teamId
      const teamIdRequired = [
        'get',
        'rename',
        'delete',
        'members',
        'invite',
        'remove_member',
        'update_role',
        'invitations',
        'cancel_invite',
        'leave',
        'stats',
      ];
      if (teamIdRequired.includes(data.action) && !data.teamId) {
        return false;
      }
      // create requires name
      if (data.action === 'create') {
        return !!data.name;
      }
      // invite requires email
      if (data.action === 'invite') {
        return !!data.email;
      }
      // remove_member/update_role require memberId
      if (['remove_member', 'update_role'].includes(data.action)) {
        return !!data.memberId;
      }
      // update_role also requires role
      if (data.action === 'update_role') {
        return !!data.role;
      }
      // cancel_invite requires invitationId
      if (data.action === 'cancel_invite') {
        return !!data.invitationId;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type TeamParams = z.infer<typeof teamParamsSchema>;
