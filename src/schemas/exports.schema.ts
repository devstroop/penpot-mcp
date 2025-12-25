import { z } from 'zod';

/**
 * Schema for Exports tool parameters
 */
export const exportsParamsSchema = z
  .object({
    action: z.enum([
      'export',
      'batch',
      'page',
      'file_pdf',
      'multi_scale',
      'multi_format',
      'list',
      'settings',
      'download',
      'formats',
      'preview',
    ]),
    fileId: z.string().uuid('Invalid file UUID').optional(),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    objectId: z.string().uuid('Invalid object UUID').optional(),
    objectIds: z.array(z.string().uuid('Invalid object UUID')).optional(),
    pageIds: z.array(z.string().uuid('Invalid page UUID')).optional(),
    format: z.enum(['png', 'svg', 'pdf', 'jpeg', 'webp']).optional(),
    formats: z.array(z.enum(['png', 'svg', 'pdf', 'jpeg', 'webp'])).optional(),
    scale: z.number().positive().max(10, 'Scale cannot exceed 10x').optional(),
    scales: z.array(z.number().positive().max(10)).optional(),
    resourceId: z.string().optional(),
    // Preview-specific options
    maxWidth: z.number().positive().max(2000).optional(),
    maxHeight: z.number().positive().max(2000).optional(),
    quality: z.enum(['low', 'medium', 'high']).optional(),
  })
  .refine(
    (data) => {
      // export, batch, page, file_pdf require fileId
      if (
        [
          'export',
          'batch',
          'page',
          'file_pdf',
          'multi_scale',
          'multi_format',
          'list',
          'settings',
        ].includes(data.action)
      ) {
        return !!data.fileId;
      }
      // download requires resourceId
      if (data.action === 'download') {
        return !!data.resourceId;
      }
      // preview requires fileId and pageId
      if (data.action === 'preview') {
        return !!data.fileId && !!data.pageId;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type ExportsParams = z.infer<typeof exportsParamsSchema>;
