import { z } from 'zod';

/**
 * Schema for position in comments
 */
const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

/**
 * Schema for Comments tool parameters
 */
export const commentsParamsSchema = z
  .object({
    action: z.enum([
      'list',
      'thread',
      'create_thread',
      'add',
      'update',
      'delete',
      'delete_thread',
      'resolve',
      'reopen',
      'unread',
    ]),
    fileId: z.string().uuid('Invalid file UUID'),
    threadId: z.string().uuid('Invalid thread UUID').optional(),
    commentId: z.string().uuid('Invalid comment UUID').optional(),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    content: z.string().min(1, 'Content cannot be empty').max(10000).optional(),
    frameId: z.string().uuid('Invalid frame UUID').optional(),
    position: positionSchema.optional(),
  })
  .refine(
    (data) => {
      // Actions that require threadId
      if (['thread', 'add', 'delete_thread', 'resolve', 'reopen'].includes(data.action)) {
        return !!data.threadId;
      }
      // create_thread requires content and position
      if (data.action === 'create_thread') {
        return !!data.content && !!data.position;
      }
      // update/delete require commentId
      if (['update', 'delete'].includes(data.action)) {
        return !!data.commentId;
      }
      // update also requires content
      if (data.action === 'update') {
        return !!data.content;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type CommentsParams = z.infer<typeof commentsParamsSchema>;
