import { z } from 'zod';

/**
 * Schema for analysis options
 */
const analysisOptionsSchema = z.object({
  includeComponents: z.boolean().optional(),
  includeTokens: z.boolean().optional(),
  minContrastRatio: z.number().positive().max(21).optional(),
  minFontSize: z.number().positive().optional(),
  // Overlap detection options
  overlapThreshold: z.number().min(0).max(100).optional(), // Percentage overlap to trigger (default: 50)
  positionTolerance: z.number().min(0).optional(), // Pixels tolerance for "same position" (default: 5)
  textOverlapTolerance: z.number().min(0).optional(), // Pixels for text-specific overlap (default: 2)
  // Emoji detection options
  replaceEmojis: z.boolean().optional(), // Whether to include replacement suggestions
  // Truncation detection options
  checkBoundsOverflow: z.boolean().optional(), // Check if text overflows parent bounds
  // Spacing analysis options
  expectedSpacing: z.number().min(0).optional(), // Expected spacing between elements
  spacingTolerance: z.number().min(0).optional(), // Tolerance for spacing variance (default: 4px)
  // Redundancy detection options
  similarityThreshold: z.number().min(0).max(100).optional(), // Text similarity percentage (default: 80)
  // Fix options
  autoFix: z.boolean().optional(), // Whether to automatically apply fixes
  fixStrategy: z.enum(['hide', 'delete', 'move']).optional(), // Strategy for fixing overlaps
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
      // Design quality analysis actions
      'overlaps', // Detect overlapping elements (bounding box)
      'text_overlaps', // Detect overlapping text elements specifically
      'emojis', // Detect emoji characters in text
      'truncation', // Detect truncated/clipped text
      'spacing', // Analyze spacing consistency
      'redundancy', // Detect duplicate/redundant content
      'hierarchy', // Analyze visual hierarchy issues
      'quality', // Comprehensive quality check (all checks)
      'fix_overlaps', // Automatically fix overlapping elements
      'fix_emojis', // Automatically fix emoji characters
      'fix_all', // Fix all detected issues
    ]),
    fileId: z.string().uuid('Invalid file UUID'),
    pageId: z.string().uuid('Invalid page UUID').optional(),
    frameId: z.string().uuid('Invalid frame UUID').optional(), // NEW: Analyze specific frame/screen
    compareFileId: z.string().uuid('Invalid compare file UUID').optional(),
    options: analysisOptionsSchema.optional(),
    // For fix actions - specify which issues to fix
    issueIds: z.array(z.string()).optional(), // Specific issue IDs to fix
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
