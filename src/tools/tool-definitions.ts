/**
 * Comprehensive Tool Definitions for Penpot MCP Server
 * Following youtrack-mcp patterns for full capability coverage
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export function createToolDefinitions(): ToolDefinition[] {
  return [
    // ==================== Projects Tool ====================
    {
      name: 'projects',
      description: `Manage Penpot projects and workspace organization.

Actions:
- list: List all projects in a team
- get: Get project details by ID
- create: Create a new project
- rename: Rename a project
- delete: Delete a project
- duplicate: Duplicate a project with all files
- move: Move a project to another team
- files: List all files in a project
- stats: Get project statistics`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'get', 'create', 'rename', 'delete', 'duplicate', 'move', 'files', 'stats'],
            description: 'Action to perform',
          },
          teamId: {
            type: 'string',
            description: 'Team ID (for list, create actions)',
          },
          projectId: {
            type: 'string',
            description: 'Project ID (for get, rename, delete, duplicate, move, files, stats)',
          },
          name: {
            type: 'string',
            description: 'Project name (for create, rename)',
          },
          targetTeamId: {
            type: 'string',
            description: 'Target team ID (for move action)',
          },
        },
        required: ['action'],
      },
    },

    // ==================== Files Tool ====================
    {
      name: 'files',
      description: `Manage Penpot design files and their content.

Actions:
- get: Get file metadata and details
- create: Create a new file in a project
- rename: Rename a file
- delete: Delete a file
- duplicate: Duplicate a file
- move: Move file to another project
- pages: List all pages in a file
- page: Get specific page details
- objects: Get objects on a page
- object: Get specific object details
- tree: Get document hierarchy tree
- search: Search objects by name/type
- analyze: Analyze file structure and composition
- history: Get file version history
- snapshot: Create/restore file snapshots
- add_frame: Add a new frame (artboard/screen) to a page
- add_rectangle: Add a rectangle shape to a page
- add_ellipse: Add an ellipse shape to a page
- add_text: Add a text element to a page
- add_path: Add a path/line to a page
- modify_object: Modify an existing object's properties
- delete_object: Delete an object from a page`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['get', 'create', 'rename', 'delete', 'duplicate', 'move', 'pages', 'page', 'objects', 'object', 'tree', 'search', 'analyze', 'history', 'snapshot', 'add_frame', 'add_rectangle', 'add_ellipse', 'add_text', 'add_path', 'modify_object', 'delete_object'],
            description: 'Action to perform',
          },
          fileId: {
            type: 'string',
            description: 'File ID',
          },
          projectId: {
            type: 'string',
            description: 'Project ID (for create, move)',
          },
          pageId: {
            type: 'string',
            description: 'Page ID (for page, objects, object, tree, add_frame, add_rectangle, add_ellipse, add_text)',
          },
          objectId: {
            type: 'string',
            description: 'Object ID (for object, modify_object, delete_object actions)',
          },
          name: {
            type: 'string',
            description: 'File/shape name (for create, rename, add_frame, add_rectangle, add_ellipse, add_text)',
          },
          query: {
            type: 'string',
            description: 'Search query (for search action)',
          },
          objectType: {
            type: 'string',
            description: 'Filter by object type (for search)',
          },
          depth: {
            type: 'number',
            description: 'Tree depth limit (for tree action)',
            minimum: 1,
            maximum: 50,
          },
          snapshotAction: {
            type: 'string',
            enum: ['create', 'restore', 'list'],
            description: 'Snapshot operation (for snapshot action)',
          },
          snapshotId: {
            type: 'string',
            description: 'Snapshot ID (for restore)',
          },
          x: {
            type: 'number',
            description: 'X position (for add_frame, add_rectangle, add_ellipse, add_text)',
          },
          y: {
            type: 'number',
            description: 'Y position (for add_frame, add_rectangle, add_ellipse, add_text)',
          },
          width: {
            type: 'number',
            description: 'Width (for add_frame, add_rectangle, add_ellipse, add_text)',
          },
          height: {
            type: 'number',
            description: 'Height (for add_frame, add_rectangle, add_ellipse, add_text)',
          },
          fill: {
            type: 'string',
            description: 'Fill color hex (for add_frame, add_rectangle, add_ellipse, add_text)',
          },
          fillOpacity: {
            type: 'number',
            description: 'Fill opacity 0-1 (for add_rectangle, add_ellipse)',
          },
          content: {
            type: 'string',
            description: 'Text content (for add_text)',
          },
          fontSize: {
            type: 'number',
            description: 'Font size in pixels (for add_text)',
          },
          fontFamily: {
            type: 'string',
            description: 'Font family (for add_text)',
          },
          fontWeight: {
            type: 'string',
            description: 'Font weight (for add_text)',
          },
          stroke: {
            type: 'string',
            description: 'Stroke color hex (for add_path)',
          },
          strokeWidth: {
            type: 'number',
            description: 'Stroke width (for add_path)',
          },
          pathPoints: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                command: { type: 'string', enum: ['move-to', 'line-to', 'curve-to', 'close-path'] },
              },
            },
            description: 'Array of path points (for add_path)',
          },
          operations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                attr: { type: 'string', description: 'Attribute name to modify' },
                val: { description: 'New value for the attribute' },
              },
            },
            description: 'Array of modification operations (for modify_object)',
          },
        },
        required: ['action'],
      },
    },

    // ==================== Components Tool ====================
    {
      name: 'components',
      description: `Manage Penpot component library and instances.

Actions:
- list: List all components in a file
- get: Get specific component details
- search: Search components by name
- instances: Get all instances of a component
- structure: Get component structure/hierarchy
- create: Create component from an object
- delete: Delete a component
- rename: Rename a component
- annotate: Update component annotation
- stats: Get component usage statistics
- detach: Detach an instance (convert to shapes)
- reset: Reset instance to main component`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'get', 'search', 'instances', 'structure', 'create', 'delete', 'rename', 'annotate', 'stats', 'detach', 'reset'],
            description: 'Action to perform',
          },
          fileId: {
            type: 'string',
            description: 'File ID (required)',
          },
          componentId: {
            type: 'string',
            description: 'Component ID (for get, instances, structure, delete, rename, annotate)',
          },
          pageId: {
            type: 'string',
            description: 'Page ID (for create, detach, reset)',
          },
          objectId: {
            type: 'string',
            description: 'Object ID (for create action)',
          },
          instanceId: {
            type: 'string',
            description: 'Instance ID (for detach, reset)',
          },
          name: {
            type: 'string',
            description: 'Component name (for create, rename)',
          },
          annotation: {
            type: 'string',
            description: 'Component annotation (for annotate)',
          },
          query: {
            type: 'string',
            description: 'Search query (for search action)',
          },
        },
        required: ['action', 'fileId'],
      },
    },

    // ==================== Tokens Tool ====================
    {
      name: 'tokens',
      description: `Manage design tokens (colors, typography) in Penpot files.

Actions:
- colors: Get color palette
- color_get: Get specific color token
- color_create: Create a new color token
- color_update: Update a color token
- color_delete: Delete a color token
- typography: Get typography styles
- typography_get: Get specific typography token
- typography_create: Create a new typography token
- typography_update: Update a typography token
- typography_delete: Delete a typography token
- all: Get all design tokens
- search: Search tokens by name
- export_css: Export tokens as CSS variables
- export_json: Export as design token JSON
- export_scss: Export as SCSS variables
- export_tailwind: Export as Tailwind config
- stats: Get token usage statistics`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['colors', 'color_get', 'color_create', 'color_update', 'color_delete', 'typography', 'typography_get', 'typography_create', 'typography_update', 'typography_delete', 'all', 'search', 'export_css', 'export_json', 'export_scss', 'export_tailwind', 'stats'],
            description: 'Action to perform',
          },
          fileId: {
            type: 'string',
            description: 'File ID (required)',
          },
          colorId: {
            type: 'string',
            description: 'Color token ID (for color_get, color_update, color_delete)',
          },
          typographyId: {
            type: 'string',
            description: 'Typography token ID (for typography_get, typography_update, typography_delete)',
          },
          name: {
            type: 'string',
            description: 'Token name (for create/update)',
          },
          color: {
            type: 'string',
            description: 'Color value (for color_create, color_update)',
          },
          opacity: {
            type: 'number',
            description: 'Color opacity 0-1 (for color_create, color_update)',
          },
          fontFamily: {
            type: 'string',
            description: 'Font family (for typography)',
          },
          fontSize: {
            type: 'number',
            description: 'Font size in pixels (for typography)',
          },
          fontWeight: {
            type: 'string',
            description: 'Font weight (for typography)',
          },
          lineHeight: {
            type: 'number',
            description: 'Line height (for typography)',
          },
          query: {
            type: 'string',
            description: 'Search query (for search action)',
          },
        },
        required: ['action', 'fileId'],
      },
    },

    // ==================== Exports Tool ====================
    {
      name: 'exports',
      description: `Export design assets from Penpot in various formats.

Actions:
- export: Export single object to PNG/SVG/PDF/JPEG/WebP
- batch: Export multiple objects at once
- page: Export entire page
- file_pdf: Export all pages as PDF
- multi_scale: Export at multiple scales (1x, 2x, 3x)
- multi_format: Export in multiple formats at once
- list: List exportable objects on a page
- settings: Get export settings for an object
- download: Download previously created export
- formats: List supported export formats`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['export', 'batch', 'page', 'file_pdf', 'multi_scale', 'multi_format', 'list', 'settings', 'download', 'formats'],
            description: 'Action to perform',
          },
          fileId: {
            type: 'string',
            description: 'File ID',
          },
          pageId: {
            type: 'string',
            description: 'Page ID (for export, batch, page, list, settings)',
          },
          objectId: {
            type: 'string',
            description: 'Object ID (for export, multi_scale, multi_format, settings)',
          },
          objectIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of object IDs (for batch export)',
          },
          pageIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of page IDs (for file_pdf)',
          },
          format: {
            type: 'string',
            enum: ['png', 'svg', 'pdf', 'jpeg', 'webp'],
            description: 'Export format (default: png)',
          },
          formats: {
            type: 'array',
            items: { type: 'string', enum: ['png', 'svg', 'pdf', 'jpeg', 'webp'] },
            description: 'Array of formats (for multi_format)',
          },
          scale: {
            type: 'number',
            description: 'Scale factor (default: 1)',
            minimum: 0.1,
            maximum: 4,
          },
          scales: {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of scales (for multi_scale)',
          },
          resourceId: {
            type: 'string',
            description: 'Resource ID (for download action)',
          },
        },
        required: ['action'],
      },
    },

    // ==================== Comments Tool ====================
    {
      name: 'comments',
      description: `Manage comments and review feedback on Penpot files.

Actions:
- list: List all comment threads in a file
- thread: Get comments in a specific thread
- create_thread: Create a new comment thread
- add: Add a comment to a thread
- update: Update a comment
- delete: Delete a comment
- delete_thread: Delete entire thread
- resolve: Mark thread as resolved
- reopen: Reopen a resolved thread
- unread: Get unread comment count`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'thread', 'create_thread', 'add', 'update', 'delete', 'delete_thread', 'resolve', 'reopen', 'unread'],
            description: 'Action to perform',
          },
          fileId: {
            type: 'string',
            description: 'File ID (required)',
          },
          threadId: {
            type: 'string',
            description: 'Thread ID (for thread, add, delete_thread, resolve, reopen)',
          },
          commentId: {
            type: 'string',
            description: 'Comment ID (for update, delete)',
          },
          pageId: {
            type: 'string',
            description: 'Page ID (for create_thread)',
          },
          content: {
            type: 'string',
            description: 'Comment content (for create_thread, add, update)',
          },
          frameId: {
            type: 'string',
            description: 'Frame ID to attach thread to (for create_thread)',
          },
          position: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            description: 'Position for comment thread (for create_thread)',
          },
        },
        required: ['action', 'fileId'],
      },
    },

    // ==================== Team Tool ====================
    {
      name: 'team',
      description: `Manage teams, members, and invitations in Penpot.

Actions:
- list: List all teams
- get: Get team details
- create: Create a new team
- rename: Rename a team
- delete: Delete a team
- members: List team members
- invite: Invite a user to the team
- remove_member: Remove a member from team
- update_role: Update member role (admin, editor, viewer)
- invitations: List pending invitations
- cancel_invite: Cancel a pending invitation
- leave: Leave a team
- stats: Get team statistics`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'get', 'create', 'rename', 'delete', 'members', 'invite', 'remove_member', 'update_role', 'invitations', 'cancel_invite', 'leave', 'stats'],
            description: 'Action to perform',
          },
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          name: {
            type: 'string',
            description: 'Team name (for create, rename)',
          },
          email: {
            type: 'string',
            description: 'Email address (for invite)',
          },
          memberId: {
            type: 'string',
            description: 'Member/Profile ID (for remove_member, update_role)',
          },
          role: {
            type: 'string',
            enum: ['admin', 'editor', 'viewer'],
            description: 'Member role (for invite, update_role)',
          },
          invitationId: {
            type: 'string',
            description: 'Invitation ID (for cancel_invite)',
          },
        },
        required: ['action'],
      },
    },

    // ==================== Profile Tool ====================
    {
      name: 'profile',
      description: `Manage user profile and account settings.

Actions:
- get: Get current user profile
- update: Update profile information
- password: Change password
- props: Get profile properties
- update_props: Update profile properties
- email: Request email change
- delete: Delete account
- recent: Get recently accessed files
- notifications: Get notifications
- mark_read: Mark notification as read`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['get', 'update', 'password', 'props', 'update_props', 'email', 'delete', 'recent', 'notifications', 'mark_read'],
            description: 'Action to perform',
          },
          fullname: {
            type: 'string',
            description: 'Full name (for update)',
          },
          lang: {
            type: 'string',
            description: 'Language preference (for update)',
          },
          theme: {
            type: 'string',
            description: 'UI theme (for update)',
          },
          oldPassword: {
            type: 'string',
            description: 'Current password (for password)',
          },
          newPassword: {
            type: 'string',
            description: 'New password (for password)',
          },
          newEmail: {
            type: 'string',
            description: 'New email address (for email)',
          },
          notificationId: {
            type: 'string',
            description: 'Notification ID (for mark_read)',
          },
          props: {
            type: 'object',
            description: 'Profile properties object (for update_props)',
          },
        },
        required: ['action'],
      },
    },

    // ==================== Library Tool ====================
    {
      name: 'library',
      description: `Manage shared libraries and linked assets.

Actions:
- shared: List shared libraries in a team
- link: Link a library to a file
- unlink: Unlink a library from a file
- linked: Get libraries linked to a file
- publish: Publish a file as a shared library
- unpublish: Unpublish a shared library
- summary: Get library summary (colors, typography, components)
- sync: Sync library updates to linked files
- colors: Get library colors
- typography: Get library typography
- components: Get library components
- search: Search across shared libraries`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['shared', 'link', 'unlink', 'linked', 'publish', 'unpublish', 'summary', 'sync', 'colors', 'typography', 'components', 'search'],
            description: 'Action to perform',
          },
          teamId: {
            type: 'string',
            description: 'Team ID (for shared, search)',
          },
          fileId: {
            type: 'string',
            description: 'File ID',
          },
          libraryId: {
            type: 'string',
            description: 'Library ID (for link, unlink, summary, sync, colors, typography, components)',
          },
          query: {
            type: 'string',
            description: 'Search query (for search action)',
          },
        },
        required: ['action'],
      },
    },

    // ==================== Search Tool ====================
    {
      name: 'search',
      description: `Search across Penpot workspace for files, objects, and assets.

Actions:
- files: Search files by name across projects
- objects: Search objects in a file by name/type
- components: Search components across files
- colors: Search color tokens by name/value
- typography: Search typography tokens by name
- recent: Get recently accessed items
- global: Global search across all content`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['files', 'objects', 'components', 'colors', 'typography', 'recent', 'global'],
            description: 'Action to perform',
          },
          query: {
            type: 'string',
            description: 'Search query (required for most actions)',
          },
          teamId: {
            type: 'string',
            description: 'Team ID (for files, components search)',
          },
          projectId: {
            type: 'string',
            description: 'Project ID (to narrow search)',
          },
          fileId: {
            type: 'string',
            description: 'File ID (for objects, colors, typography)',
          },
          pageId: {
            type: 'string',
            description: 'Page ID (to narrow object search)',
          },
          objectType: {
            type: 'string',
            description: 'Filter by object type (frame, text, rect, etc.)',
          },
          limit: {
            type: 'number',
            description: 'Maximum results to return',
            minimum: 1,
            maximum: 100,
          },
        },
        required: ['action'],
      },
    },

    // ==================== Analyze Tool ====================
    {
      name: 'analyze',
      description: `Analyze Penpot designs for insights and optimization.

Actions:
- file_structure: Analyze file composition and complexity
- design_system: Extract design system patterns (colors, fonts, spacing)
- accessibility: Check accessibility issues (contrast, text size)
- naming: Analyze layer naming conventions
- components: Analyze component usage and coverage
- duplicates: Find duplicate styles or components
- unused: Find unused tokens or components
- compare: Compare two files for differences`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['file_structure', 'design_system', 'accessibility', 'naming', 'components', 'duplicates', 'unused', 'compare'],
            description: 'Action to perform',
          },
          fileId: {
            type: 'string',
            description: 'File ID (required)',
          },
          pageId: {
            type: 'string',
            description: 'Page ID (to narrow analysis)',
          },
          compareFileId: {
            type: 'string',
            description: 'Second file ID (for compare action)',
          },
          options: {
            type: 'object',
            properties: {
              includeComponents: { type: 'boolean' },
              includeTokens: { type: 'boolean' },
              minContrastRatio: { type: 'number' },
              minFontSize: { type: 'number' },
            },
            description: 'Analysis options',
          },
        },
        required: ['action', 'fileId'],
      },
    },

    // ==================== Shapes Tool ====================
    {
      name: 'shapes',
      description: `Create and manage shapes on Penpot pages.

Actions:
- add_frame: Add a new frame (artboard/screen) to a page
- add_rectangle: Add a rectangle shape
- add_ellipse: Add an ellipse/circle shape
- delete: Delete a shape by ID
- list: List all shapes on a page`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['add_frame', 'add_rectangle', 'add_ellipse', 'delete', 'list'],
            description: 'Action to perform',
          },
          fileId: {
            type: 'string',
            description: 'File ID (required)',
          },
          pageId: {
            type: 'string',
            description: 'Page ID (required for add/delete operations)',
          },
          shapeId: {
            type: 'string',
            description: 'Shape ID (for delete action)',
          },
          name: {
            type: 'string',
            description: 'Name for the shape',
          },
          x: {
            type: 'number',
            description: 'X position',
          },
          y: {
            type: 'number',
            description: 'Y position',
          },
          width: {
            type: 'number',
            description: 'Width of the shape',
          },
          height: {
            type: 'number',
            description: 'Height of the shape',
          },
          fill: {
            type: 'string',
            description: 'Fill color (hex, e.g., #FFFFFF)',
          },
          fillOpacity: {
            type: 'number',
            description: 'Fill opacity (0-1)',
            minimum: 0,
            maximum: 1,
          },
        },
        required: ['action', 'fileId'],
      },
    },
  ];
}
