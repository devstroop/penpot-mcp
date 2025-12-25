/**
 * Comprehensive Type definitions for orchestration tools
 * Following youtrack-mcp patterns for full capability coverage
 */

// ==================== Projects Tool Types ====================
export interface ProjectsParams {
  action: 'list' | 'get' | 'create' | 'rename' | 'delete' | 'duplicate' | 'move' | 'files' | 'stats';
  teamId?: string;
  projectId?: string;
  name?: string;
  targetTeamId?: string;
}

// ==================== Files Tool Types ====================
export interface FilesParams {
  action: 'get' | 'create' | 'rename' | 'delete' | 'duplicate' | 'move' | 'pages' | 'page' | 'objects' | 'object' | 'tree' | 'search' | 'analyze' | 'history' | 'snapshot' | 'add_frame' | 'add_rectangle' | 'add_ellipse' | 'add_text' | 'add_path' | 'modify_object' | 'delete_object';
  fileId?: string;
  projectId?: string;
  pageId?: string;
  objectId?: string;
  name?: string;
  query?: string;
  objectType?: string;
  depth?: number;
  snapshotAction?: 'create' | 'restore' | 'list';
  snapshotId?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  fillOpacity?: number;
  // Text element options
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  // Path options
  stroke?: string;
  strokeWidth?: number;
  pathPoints?: Array<{ x: number; y: number; command?: string }>;
  // Modify object options
  operations?: Array<{ attr: string; val: unknown }>;
}

// ==================== Components Tool Types ====================
export interface ComponentsParams {
  action: 'list' | 'get' | 'search' | 'instances' | 'structure' | 'create' | 'delete' | 'rename' | 'annotate' | 'stats' | 'detach' | 'reset';
  fileId: string;
  componentId?: string;
  pageId?: string;
  objectId?: string;
  instanceId?: string;
  name?: string;
  annotation?: string;
  query?: string;
}

// ==================== Tokens Tool Types ====================
export interface TokensParams {
  action: 'colors' | 'color_get' | 'color_create' | 'color_update' | 'color_delete' | 
          'typography' | 'typography_get' | 'typography_create' | 'typography_update' | 'typography_delete' |
          'all' | 'search' | 'export_css' | 'export_json' | 'export_scss' | 'export_tailwind' | 'stats';
  fileId: string;
  colorId?: string;
  typographyId?: string;
  name?: string;
  color?: string;
  opacity?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  query?: string;
}

// ==================== Exports Tool Types ====================
export interface ExportsParams {
  action: 'export' | 'batch' | 'page' | 'file_pdf' | 'multi_scale' | 'multi_format' | 'list' | 'settings' | 'download' | 'formats';
  fileId?: string;
  pageId?: string;
  objectId?: string;
  objectIds?: string[];
  pageIds?: string[];
  format?: 'png' | 'svg' | 'pdf' | 'jpeg' | 'webp';
  formats?: string[];
  scale?: number;
  scales?: number[];
  resourceId?: string;
}

// ==================== Comments Tool Types ====================
export interface CommentsParams {
  action: 'list' | 'thread' | 'create_thread' | 'add' | 'update' | 'delete' | 'delete_thread' | 'resolve' | 'reopen' | 'unread';
  fileId: string;
  threadId?: string;
  commentId?: string;
  pageId?: string;
  content?: string;
  frameId?: string;
  position?: { x: number; y: number };
}

// ==================== Team Tool Types ====================
export interface TeamParams {
  action: 'list' | 'get' | 'create' | 'rename' | 'delete' | 'members' | 'invite' | 'remove_member' | 'update_role' | 'invitations' | 'cancel_invite' | 'leave' | 'stats';
  teamId?: string;
  name?: string;
  email?: string;
  memberId?: string;
  role?: 'admin' | 'editor' | 'viewer';
  invitationId?: string;
}

// ==================== Profile Tool Types ====================
export interface ProfileParams {
  action: 'get' | 'update' | 'password' | 'props' | 'update_props' | 'email' | 'delete' | 'recent' | 'notifications' | 'mark_read';
  fullname?: string;
  lang?: string;
  theme?: string;
  oldPassword?: string;
  newPassword?: string;
  newEmail?: string;
  notificationId?: string;
  props?: Record<string, unknown>;
}

// ==================== Library Tool Types ====================
export interface LibraryParams {
  action: 'shared' | 'link' | 'unlink' | 'linked' | 'publish' | 'unpublish' | 'summary' | 'sync' | 'colors' | 'typography' | 'components' | 'search';
  teamId?: string;
  fileId?: string;
  libraryId?: string;
  query?: string;
}

// ==================== Search Tool Types ====================
export interface SearchParams {
  action: 'files' | 'objects' | 'components' | 'colors' | 'typography' | 'recent' | 'global';
  query?: string;
  teamId?: string;
  projectId?: string;
  fileId?: string;
  pageId?: string;
  objectType?: string;
  limit?: number;
}

// ==================== Analyze Tool Types ====================
export interface AnalyzeParams {
  action: 'file_structure' | 'design_system' | 'accessibility' | 'naming' | 'components' | 'duplicates' | 'unused' | 'compare';
  fileId: string;
  pageId?: string;
  compareFileId?: string;
  options?: {
    includeComponents?: boolean;
    includeTokens?: boolean;
    minContrastRatio?: number;
    minFontSize?: number;
  };
}

// ==================== Shapes Tool Types ====================
export interface ShapesParams {
  action: 'add_frame' | 'add_rectangle' | 'add_ellipse' | 'delete' | 'list';
  fileId: string;
  pageId?: string;
  shapeId?: string;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  fillOpacity?: number;
}

// ==================== Legacy Types (for backward compatibility) ====================
export interface NavigateParams {
  action: 'projects' | 'files' | 'pages' | 'search';
  projectId?: string;
  fileId?: string;
  query?: string;
}

export interface InspectParams {
  action: 'file' | 'structure' | 'page' | 'object' | 'tree';
  fileId: string;
  pageId?: string;
  objectId?: string;
  depth?: number;
}

export interface AssetsParams {
  action: 'export' | 'list';
  fileId: string;
  pageId?: string;
  objectId?: string;
  format?: 'png' | 'svg' | 'pdf';
  scale?: number;
}
