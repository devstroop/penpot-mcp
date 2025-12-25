import { z } from 'zod';

/**
 * Schema for Fonts tool parameters
 * ISSUE-014: Font Management Support
 */
export const fontsParamsSchema = z
  .object({
    action: z.enum([
      'list', // List all fonts for a team
      'upload', // Upload a font file
      'delete', // Delete a font family
      'delete_variant', // Delete a specific font variant
    ]),
    teamId: z.string().uuid('Invalid team UUID'),
    // For upload action
    fontFamily: z.string().min(1).optional(),
    fontWeight: z.string().optional(),
    fontStyle: z.enum(['normal', 'italic']).optional(),
    base64Data: z.string().optional(), // Base64 encoded font data
    fontData: z.string().optional(), // Raw font data as string (for advanced use)
    filename: z.string().optional(), // Original filename with extension (.ttf, .otf, .woff, .woff2)
    // For delete action
    fontId: z.string().uuid('Invalid font UUID').optional(),
    // For delete_variant action
    fontVariantId: z.string().uuid('Invalid font variant UUID').optional(),
  })
  .refine(
    (data) => {
      // upload requires fontFamily, filename, and either base64Data or fontData
      if (data.action === 'upload') {
        const hasFontData = !!data.base64Data || !!data.fontData;
        return !!data.fontFamily && !!data.filename && hasFontData;
      }
      // delete requires fontId
      if (data.action === 'delete') {
        return !!data.fontId;
      }
      // delete_variant requires fontVariantId
      if (data.action === 'delete_variant') {
        return !!data.fontVariantId;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type FontsParams = z.infer<typeof fontsParamsSchema>;
