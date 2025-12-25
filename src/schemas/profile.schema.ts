import { z } from 'zod';

/**
 * Schema for Profile tool parameters
 */
export const profileParamsSchema = z
  .object({
    action: z.enum([
      'get',
      'update',
      'password',
      'props',
      'update_props',
      'email',
      'delete',
      'recent',
      'notifications',
      'mark_read',
    ]),
    fullname: z.string().min(1).max(255).optional(),
    lang: z.string().min(2).max(10).optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    oldPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
    newEmail: z.string().email('Invalid email address').optional(),
    notificationId: z.string().uuid('Invalid notification UUID').optional(),
    props: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) => {
      // password action requires both oldPassword and newPassword
      if (data.action === 'password') {
        return !!data.oldPassword && !!data.newPassword;
      }
      // email action requires newEmail
      if (data.action === 'email') {
        return !!data.newEmail;
      }
      // mark_read requires notificationId
      if (data.action === 'mark_read') {
        return !!data.notificationId;
      }
      // update_props requires props
      if (data.action === 'update_props') {
        return !!data.props;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type ProfileParams = z.infer<typeof profileParamsSchema>;
