/**
 * Comprehensive Type definitions for orchestration tools
 * Following youtrack-mcp patterns for full capability coverage
 * 
 * NOTE: Runtime validation is now handled by Zod schemas in src/schemas/
 * These interfaces are kept for backwards compatibility and documentation.
 * The canonical types are exported from the schema files.
 */

// Re-export types from schemas for backwards compatibility
export type { ProjectsParams } from '../../schemas/projects.schema.js';
export type { FilesParams } from '../../schemas/files.schema.js';
export type { ComponentsParams } from '../../schemas/components.schema.js';
export type { TokensParams } from '../../schemas/tokens.schema.js';
export type { ExportsParams } from '../../schemas/exports.schema.js';
export type { CommentsParams } from '../../schemas/comments.schema.js';
export type { TeamParams } from '../../schemas/team.schema.js';
export type { ProfileParams } from '../../schemas/profile.schema.js';
export type { LibraryParams } from '../../schemas/library.schema.js';
export type { SearchParams } from '../../schemas/search.schema.js';
export type { AnalyzeParams } from '../../schemas/analyze.schema.js';
export type { ShapesParams } from '../../schemas/shapes.schema.js';
export type { NavigateParams, InspectParams, AssetsParams } from '../../schemas/legacy.schema.js';
