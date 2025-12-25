import { z } from 'zod';

/**
 * Schema for Media tool parameters
 * ISSUE-001: Image/Media Upload Support
 */
export const mediaParamsSchema = z
  .object({
    action: z.enum([
      'upload_url', // Upload image from URL
      'upload_base64', // Upload image from base64 data
      'list', // List media in a file
      'delete', // Delete media object
      'add_image', // Add an image shape (requires prior upload)
    ]),
    fileId: z.string().uuid('Invalid file UUID'),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    // For upload actions
    url: z.string().url('Invalid URL').optional(),
    base64: z.string().optional(),
    filename: z.string().optional(),
    mimeType: z.string().optional(),
    // For delete action
    mediaId: z.string().uuid('Invalid media UUID').optional(),
    // For add_image action
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    name: z.string().optional(),
    frameId: z.string().uuid('Invalid frame UUID').optional(),
    // Media metadata (from upload response)
    mediaWidth: z.number().positive().optional(),
    mediaHeight: z.number().positive().optional(),
    // Shadow support
    shadow: z
      .object({
        style: z.enum(['drop-shadow', 'inner-shadow']).optional(),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        opacity: z.number().min(0).max(1).optional(),
        offsetX: z.number().optional(),
        offsetY: z.number().optional(),
        blur: z.number().min(0).optional(),
        spread: z.number().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // upload_url requires url
      if (data.action === 'upload_url') {
        return !!data.url;
      }
      // upload_base64 requires base64
      if (data.action === 'upload_base64') {
        return !!data.base64 && !!data.filename;
      }
      // delete requires mediaId
      if (data.action === 'delete') {
        return !!data.mediaId;
      }
      // add_image requires mediaId and page
      if (data.action === 'add_image') {
        return !!data.mediaId && !!data.pageId && !!data.mediaWidth && !!data.mediaHeight;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type MediaParams = z.infer<typeof mediaParamsSchema>;
