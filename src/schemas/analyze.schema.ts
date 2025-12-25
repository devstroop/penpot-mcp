import { z } from 'zod';

/**
 * Schema for analysis options
 */
const analysisOptionsSchema = z.object({
  includeComponents: z.boolean().optional(),
  includeTokens: z.boolean().optional(),
  minContrastRatio: z.number().positive().max(21).optional(),
  minFontSize: z.number().positive().optional(),
});

/**
 * Schema for Analyze tool parameters
 */
export const analyzeParamsSchema = z
  .object({
    action: z.enum([
      'file_structure',
      'design_system',
      'accessibility',
      'naming',
      'components',
      'duplicates',
      'unused',
      'compare',
    ]),
    fileId: z.string().uuid('Invalid file UUID'),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    compareFileId: z.string().uuid('Invalid compare file UUID').optional(),
    options: analysisOptionsSchema.optional(),
  })
  .refine(
    (data) => {
      // compare action requires compareFileId
      if (data.action === 'compare') {
        return !!data.compareFileId;
      }
      return true;
    },
    {
      message: 'Missing required parameters for action',
      path: ['action'],
    }
  );

export type AnalyzeParams = z.infer<typeof analyzeParamsSchema>;
