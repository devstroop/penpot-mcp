/**
 * Constants Module
 *
 * Centralized constants for tool names, API endpoints, and actions.
 * Eliminates magic strings throughout the codebase.
 */

/**
 * Tool names registered with MCP
 */
export const TOOL_NAMES = {
  // New comprehensive tools
  PROJECTS: 'projects',
  FILES: 'files',
  COMPONENTS: 'components',
  TOKENS: 'tokens',
  EXPORTS: 'exports',
  COMMENTS: 'comments',
  TEAM: 'team',
  PROFILE: 'profile',
  LIBRARY: 'library',
  SEARCH: 'search',
  ANALYZE: 'analyze',
  SHAPES: 'shapes',
  // Legacy tools (backward compatibility)
  NAVIGATE: 'navigate',
  INSPECT: 'inspect',
  ASSETS: 'assets',
} as const;

export type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES];

/**
 * All tool names as an array
 */
export const ALL_TOOL_NAMES = Object.values(TOOL_NAMES);

/**
 * Penpot API RPC endpoints
 */
export const ENDPOINTS = {
  // Authentication
  LOGIN: '/rpc/command/login-with-password',
  LOGOUT: '/rpc/command/logout',

  // Profile
  GET_PROFILE: '/rpc/command/get-profile',
  UPDATE_PROFILE: '/rpc/command/update-profile',
  GET_PROFILE_PROPS: '/rpc/command/get-profile-props',
  UPDATE_PROFILE_PROPS: '/rpc/command/update-profile-props',

  // Teams
  GET_TEAMS: '/rpc/command/get-teams',
  GET_TEAM: '/rpc/command/get-team',
  CREATE_TEAM: '/rpc/command/create-team',
  UPDATE_TEAM: '/rpc/command/update-team',
  DELETE_TEAM: '/rpc/command/delete-team',
  GET_TEAM_MEMBERS: '/rpc/command/get-team-members',
  GET_TEAM_INVITATIONS: '/rpc/command/get-team-invitations',

  // Projects
  GET_ALL_PROJECTS: '/rpc/command/get-all-projects',
  GET_PROJECTS: '/rpc/command/get-projects',
  GET_PROJECT: '/rpc/command/get-project',
  CREATE_PROJECT: '/rpc/command/create-project',
  RENAME_PROJECT: '/rpc/command/rename-project',
  DELETE_PROJECT: '/rpc/command/delete-project',
  DUPLICATE_PROJECT: '/rpc/command/duplicate-project',
  MOVE_PROJECT: '/rpc/command/move-project',
  GET_PROJECT_FILES: '/rpc/command/get-project-files',

  // Files
  GET_FILE: '/rpc/command/get-file',
  GET_FILE_SUMMARY: '/rpc/command/get-file-summary',
  CREATE_FILE: '/rpc/command/create-file',
  RENAME_FILE: '/rpc/command/rename-file',
  DELETE_FILE: '/rpc/command/delete-file',
  DUPLICATE_FILE: '/rpc/command/duplicate-file',
  MOVE_FILES: '/rpc/command/move-files',
  GET_FILE_OBJECT_THUMBNAILS: '/rpc/command/get-file-object-thumbnails',
  GET_FILE_THUMBNAIL: '/rpc/command/get-file-thumbnail',
  GET_FILE_FRAGMENT: '/rpc/command/get-file-fragment',
  UPDATE_FILE: '/rpc/command/update-file',

  // Comments
  GET_COMMENT_THREADS: '/rpc/command/get-comment-threads',
  GET_UNREAD_COMMENT_THREADS: '/rpc/command/get-unread-comment-threads',
  CREATE_COMMENT_THREAD: '/rpc/command/create-comment-thread',
  UPDATE_COMMENT_THREAD: '/rpc/command/update-comment-thread',
  DELETE_COMMENT_THREAD: '/rpc/command/delete-comment-thread',
  CREATE_COMMENT: '/rpc/command/create-comment',
  UPDATE_COMMENT: '/rpc/command/update-comment',
  DELETE_COMMENT: '/rpc/command/delete-comment',

  // Libraries
  GET_TEAM_SHARED_FILES: '/rpc/command/get-team-shared-files',
  GET_FILE_LIBRARIES: '/rpc/command/get-file-libraries',
  LINK_FILE_TO_LIBRARY: '/rpc/command/link-file-to-library',
  UNLINK_FILE_FROM_LIBRARY: '/rpc/command/unlink-file-from-library',
  SET_FILE_SHARED: '/rpc/command/set-file-shared',

  // Exports
  EXPORT_BINFILE: '/rpc/command/export-binfile',
} as const;

export type Endpoint = (typeof ENDPOINTS)[keyof typeof ENDPOINTS];

/**
 * Actions for each tool type
 */
export const ACTIONS = {
  PROJECTS: [
    'list',
    'get',
    'create',
    'rename',
    'delete',
    'duplicate',
    'move',
    'files',
    'stats',
  ] as const,

  FILES: [
    'get',
    'create',
    'rename',
    'delete',
    'duplicate',
    'move',
    'pages',
    'page',
    'objects',
    'object',
    'tree',
    'search',
    'analyze',
    'history',
    'snapshot',
    'add_frame',
    'add_rectangle',
    'add_ellipse',
    'add_text',
    'add_path',
    'modify_object',
    'delete_object',
  ] as const,

  COMPONENTS: [
    'list',
    'get',
    'search',
    'instances',
    'structure',
    'create',
    'delete',
    'rename',
    'annotate',
    'stats',
    'detach',
    'reset',
  ] as const,

  TOKENS: [
    'colors',
    'color_get',
    'color_create',
    'color_update',
    'color_delete',
    'typography',
    'typography_get',
    'typography_create',
    'typography_update',
    'typography_delete',
    'all',
    'search',
    'export_css',
    'export_json',
    'export_scss',
    'export_tailwind',
    'stats',
  ] as const,

  EXPORTS: [
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
  ] as const,

  COMMENTS: [
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
  ] as const,

  TEAM: [
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
  ] as const,

  PROFILE: [
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
  ] as const,

  LIBRARY: [
    'shared',
    'link',
    'unlink',
    'linked',
    'publish',
    'unpublish',
    'summary',
    'sync',
    'colors',
    'typography',
    'components',
    'search',
  ] as const,

  SEARCH: ['files', 'objects', 'components', 'colors', 'typography', 'recent', 'global'] as const,

  ANALYZE: [
    'file_structure',
    'design_system',
    'accessibility',
    'naming',
    'components',
    'duplicates',
    'unused',
    'compare',
  ] as const,

  SHAPES: ['add_frame', 'add_rectangle', 'add_ellipse', 'delete', 'list'] as const,

  // Legacy
  NAVIGATE: ['projects', 'files', 'pages', 'search'] as const,
  INSPECT: ['file', 'structure', 'page', 'object', 'tree'] as const,
  ASSETS: ['export', 'list'] as const,
} as const;

/**
 * Default configuration values
 */
export const DEFAULTS = {
  API_URL: 'https://design.penpot.app/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  LOG_LEVEL: 'info' as const,
  PORT: 3002,
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Export format options
 */
export const EXPORT_FORMATS = ['png', 'svg', 'pdf', 'jpeg', 'webp'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/**
 * Team member roles
 */
export const TEAM_ROLES = ['admin', 'editor', 'viewer'] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];
