/**
 * Orchestration Module - Comprehensive Penpot Tool Suite
 *
 * Domain-based tools with action parameters for comprehensive Penpot workflows.
 * Each tool covers a domain and supports multiple actions.
 *
 * Tools (17 total):
 * - penpot_projects: Project management (list, get, create, rename, delete, duplicate, move, files, stats)
 * - penpot_files: File management (get, create, rename, delete, duplicate, move, pages, objects, tree, search, analyze, history, snapshot)
 * - penpot_components: Component library (list, get, search, instances, structure, create, delete, rename, annotate, stats, detach, reset)
 * - penpot_tokens: Design tokens (colors, typography, create, update, delete, export_css/json/scss/tailwind, stats)
 * - penpot_exports: Asset export (export, batch, page, file_pdf, multi_scale, multi_format, list, settings, download, formats)
 * - penpot_comments: Comments/reviews (list, thread, create_thread, add, update, delete, resolve, reopen, unread)
 * - penpot_team: Team management (list, get, create, rename, delete, members, invite, remove_member, update_role, invitations, leave, stats)
 * - penpot_profile: User profile (get, update, password, props, email, delete, recent, notifications)
 * - penpot_library: Shared libraries (shared, link, unlink, linked, publish, unpublish, summary, sync, colors, typography, components, search)
 * - penpot_search: Global search (files, objects, components, colors, typography, recent, global)
 * - penpot_analyze: Design analysis (file_structure, design_system, accessibility, naming, components, duplicates, unused, compare)
 * - penpot_shapes: Shape creation (add_frame, add_rectangle, add_ellipse, add_text, delete, list) with border radius, strokes, shadows
 * - penpot_media: Image upload and management (upload_url, upload_base64, list, delete, add_image)
 * - penpot_share: Share link management (list, create, delete)
 * - penpot_webhooks: Webhook management (list, create, update, delete)
 * - penpot_templates: Template access (list, clone)
 * - penpot_trash: Trash management (list, restore, delete_permanently)
 * - penpot_access_tokens: Access token management (list, create, delete)
 *
 * Legacy tools (for backward compatibility):
 * - penpot_navigate: Navigation (projects, files, pages, search)
 * - penpot_inspect: Inspection (file, structure, page, object, tree)
 * - penpot_assets: Asset export (export, list)
 */

export * from './types.js';

// New comprehensive tools
export { ProjectsTool } from './projects.js';
export { FilesTool } from './files.js';
export { ComponentsTool } from './components.js';
export { TokensTool } from './tokens.js';
export { ExportsTool } from './exports.js';
export { CommentsTool } from './comments.js';
export { TeamTool } from './team.js';
export { ProfileTool } from './profile.js';
export { LibraryTool } from './library.js';
export { SearchTool } from './search.js';
export { AnalyzeTool } from './analyze.js';
export { ShapesTool } from './shapes.js';
export { MediaTool } from './media.js';
export { FontsTool } from './fonts.js';
export { ShareTool } from './share.js';
export { WebhooksTool } from './webhooks.js';
export { TemplatesTool } from './templates.js';
export { TrashTool } from './trash.js';
export { AccessTokensTool } from './access-tokens.js';

// Legacy tools (for backward compatibility)
export { NavigateTool } from './navigate.js';
export { InspectTool } from './inspect.js';
export { AssetsTool } from './assets.js';
