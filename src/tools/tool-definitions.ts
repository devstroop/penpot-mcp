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
            enum: [
              'list',
              'get',
              'create',
              'rename',
              'delete',
              'duplicate',
              'move',
              'files',
              'stats',
            ],
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
- delete_object: Delete an object from a page
- import_svg: Import SVG content as vector paths`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
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
              'import_svg',
            ],
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
            description:
              'Page ID (for page, objects, object, tree, add_frame, add_rectangle, add_ellipse, add_text)',
          },
          objectId: {
            type: 'string',
            description: 'Object ID (for object, modify_object, delete_object actions)',
          },
          name: {
            type: 'string',
            description:
              'File/shape name (for create, rename, add_frame, add_rectangle, add_ellipse, add_text)',
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
          frameId: {
            type: 'string',
            description:
              'Parent frame ID to attach the shape to (for add_rectangle, add_ellipse, add_text, add_frame)',
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
          // SVG import options (ISSUE-007)
          svgContent: {
            type: 'string',
            description: 'SVG string content to import (for import_svg)',
          },
          scale: {
            type: 'number',
            description: 'Scale factor for imported SVG (default: 1)',
            minimum: 0.01,
            maximum: 100,
          },
          groupShapes: {
            type: 'boolean',
            description: 'Whether to group imported shapes (default: true for multiple shapes)',
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
- reset: Reset instance to main component
- instantiate: Create an instance of a library component at specified position`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
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
              'instantiate',
            ],
            description: 'Action to perform',
          },
          fileId: {
            type: 'string',
            description: 'File ID (required - target file for instantiate)',
          },
          componentId: {
            type: 'string',
            description:
              'Component ID (for get, instances, structure, delete, rename, annotate, instantiate)',
          },
          pageId: {
            type: 'string',
            description: 'Page ID (for create, detach, reset, instantiate)',
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
            description: 'Component name (for create, rename, instantiate)',
          },
          annotation: {
            type: 'string',
            description: 'Component annotation (for annotate)',
          },
          query: {
            type: 'string',
            description: 'Search query (for search action)',
          },
          sourceFileId: {
            type: 'string',
            description: 'Source file ID containing the component (for instantiate)',
          },
          x: {
            type: 'number',
            description: 'X coordinate for placement (for instantiate)',
          },
          y: {
            type: 'number',
            description: 'Y coordinate for placement (for instantiate)',
          },
          frameId: {
            type: 'string',
            description: 'Parent frame ID (optional for instantiate, defaults to page root)',
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
            enum: [
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
            ],
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
            description:
              'Typography token ID (for typography_get, typography_update, typography_delete)',
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
- formats: List supported export formats
- preview: Generate visual preview for AI feedback (returns PNG base64)`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
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
            ],
            description: 'Action to perform',
          },
          fileId: {
            type: 'string',
            description: 'File ID',
          },
          pageId: {
            type: 'string',
            description: 'Page ID (for export, batch, page, list, settings, preview)',
          },
          objectId: {
            type: 'string',
            description: 'Object ID (for export, multi_scale, multi_format, settings, preview)',
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
          maxWidth: {
            type: 'number',
            description: 'Max width in pixels for preview (default: 800)',
          },
          maxHeight: {
            type: 'number',
            description: 'Max height in pixels for preview (default: 600)',
          },
          quality: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Preview quality - affects scale (default: medium)',
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
            enum: [
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
            ],
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
            enum: [
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
            ],
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
            enum: [
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
            ],
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
            enum: [
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
            ],
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
            description:
              'Library ID (for link, unlink, summary, sync, colors, typography, components)',
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
            enum: [
              'file_structure',
              'design_system',
              'accessibility',
              'naming',
              'components',
              'duplicates',
              'unused',
              'compare',
            ],
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
- add_frame: Add a new frame (artboard/screen) to a page with optional auto-layout
- add_rectangle: Add a rectangle shape with optional border radius and constraints
- add_ellipse: Add an ellipse/circle shape with optional constraints
- add_text: Add a text element with styling options
- delete: Delete a shape by ID
- list: List all shapes on a page
- bring_to_front: Move object(s) to the front (top of z-order)
- send_to_back: Move object(s) to the back (bottom of z-order)
- move_to_index: Move object(s) to a specific z-index position
- group: Group multiple objects together
- ungroup: Dissolve a group, releasing its children
- duplicate: Create a copy of an object with offset

Features:
- Border radius support for rectangles and frames (uniform or per-corner)
- Stroke/border properties (color, width, style, alignment)
- Drop shadow and inner shadow effects
- Gradient fills (linear and radial)
- Constraints (horizontal and vertical alignment rules)
- Auto-layout (flex) for frames with direction, gap, padding, alignment
- Text alignment and styling (horizontal, line height, letter spacing, decoration)
- Layer ordering (z-index management)
- Object grouping and ungrouping
- Object duplication with offset`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'add_frame',
              'add_rectangle',
              'add_ellipse',
              'add_text',
              'delete',
              'list',
              'bring_to_front',
              'send_to_back',
              'move_to_index',
              'group',
              'ungroup',
              'duplicate',
            ],
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
            description: 'Shape ID (for delete, ungroup, duplicate actions)',
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
          frameId: {
            type: 'string',
            description: 'Parent frame ID to attach the shape to',
          },
          // Border radius
          borderRadius: {
            type: 'number',
            description: 'Uniform border radius for all corners (rectangles/frames)',
            minimum: 0,
          },
          r1: {
            type: 'number',
            description: 'Top-left corner radius',
            minimum: 0,
          },
          r2: {
            type: 'number',
            description: 'Top-right corner radius',
            minimum: 0,
          },
          r3: {
            type: 'number',
            description: 'Bottom-right corner radius',
            minimum: 0,
          },
          r4: {
            type: 'number',
            description: 'Bottom-left corner radius',
            minimum: 0,
          },
          // Stroke properties
          stroke: {
            type: 'string',
            description: 'Stroke/border color (hex, e.g., #000000)',
          },
          strokeWidth: {
            type: 'number',
            description: 'Stroke width in pixels',
            minimum: 0,
          },
          strokeOpacity: {
            type: 'number',
            description: 'Stroke opacity (0-1)',
            minimum: 0,
            maximum: 1,
          },
          strokeStyle: {
            type: 'string',
            enum: ['solid', 'dotted', 'dashed', 'mixed'],
            description: 'Stroke style',
          },
          strokeAlignment: {
            type: 'string',
            enum: ['center', 'inner', 'outer'],
            description: 'Stroke alignment relative to shape edge',
          },
          // Shadow
          shadow: {
            type: 'object',
            description: 'Shadow effect configuration',
            properties: {
              style: {
                type: 'string',
                enum: ['drop-shadow', 'inner-shadow'],
                description: 'Shadow type (default: drop-shadow)',
              },
              color: {
                type: 'string',
                description: 'Shadow color (hex, default: #000000)',
              },
              opacity: {
                type: 'number',
                description: 'Shadow opacity 0-1 (default: 0.25)',
                minimum: 0,
                maximum: 1,
              },
              offsetX: {
                type: 'number',
                description: 'Horizontal offset (default: 0)',
              },
              offsetY: {
                type: 'number',
                description: 'Vertical offset (default: 4)',
              },
              blur: {
                type: 'number',
                description: 'Blur radius (default: 8)',
                minimum: 0,
              },
              spread: {
                type: 'number',
                description: 'Spread radius (default: 0)',
              },
            },
          },
          // Gradient (ISSUE-021)
          gradient: {
            type: 'object',
            description: 'Gradient fill configuration (overrides solid fill)',
            properties: {
              type: {
                type: 'string',
                enum: ['linear', 'radial'],
                description: 'Gradient type',
              },
              startX: {
                type: 'number',
                description: 'Start X position (0-1, default: 0.5)',
                minimum: 0,
                maximum: 1,
              },
              startY: {
                type: 'number',
                description: 'Start Y position (0-1, default: 0)',
                minimum: 0,
                maximum: 1,
              },
              endX: {
                type: 'number',
                description: 'End X position (0-1, default: 0.5)',
                minimum: 0,
                maximum: 1,
              },
              endY: {
                type: 'number',
                description: 'End Y position (0-1, default: 1)',
                minimum: 0,
                maximum: 1,
              },
              stops: {
                type: 'array',
                description: 'Color stops (at least 2 required)',
                items: {
                  type: 'object',
                  properties: {
                    color: {
                      type: 'string',
                      description: 'Stop color (hex)',
                    },
                    opacity: {
                      type: 'number',
                      description: 'Stop opacity (0-1, default: 1)',
                      minimum: 0,
                      maximum: 1,
                    },
                    offset: {
                      type: 'number',
                      description: 'Stop position (0-1)',
                      minimum: 0,
                      maximum: 1,
                    },
                  },
                  required: ['color', 'offset'],
                },
              },
            },
            required: ['type', 'stops'],
          },
          // Constraints (ISSUE-013)
          constraintsH: {
            type: 'string',
            enum: ['left', 'right', 'leftright', 'center', 'scale'],
            description: 'Horizontal constraint (for rectangles/ellipses)',
          },
          constraintsV: {
            type: 'string',
            enum: ['top', 'bottom', 'topbottom', 'center', 'scale'],
            description: 'Vertical constraint (for rectangles/ellipses)',
          },
          // Auto-layout (ISSUE-013) - for frames only
          layout: {
            type: 'string',
            enum: ['flex', 'grid'],
            description: 'Layout type for frames (enables auto-layout)',
          },
          layoutFlexDir: {
            type: 'string',
            enum: ['row', 'column', 'row-reverse', 'column-reverse'],
            description: 'Flex direction for auto-layout frames',
          },
          layoutGap: {
            oneOf: [
              { type: 'number', description: 'Uniform gap between children' },
              {
                type: 'object',
                properties: {
                  rowGap: { type: 'number', description: 'Vertical gap' },
                  columnGap: { type: 'number', description: 'Horizontal gap' },
                },
              },
            ],
            description: 'Gap between children in auto-layout',
          },
          layoutPadding: {
            oneOf: [
              { type: 'number', description: 'Uniform padding' },
              {
                type: 'object',
                properties: {
                  top: { type: 'number' },
                  right: { type: 'number' },
                  bottom: { type: 'number' },
                  left: { type: 'number' },
                },
              },
            ],
            description: 'Padding inside auto-layout frame',
          },
          layoutJustifyContent: {
            type: 'string',
            enum: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
            description: 'Main axis alignment for auto-layout',
          },
          layoutAlignItems: {
            type: 'string',
            enum: ['start', 'center', 'end', 'stretch'],
            description: 'Cross axis alignment for auto-layout',
          },
          layoutWrap: {
            type: 'string',
            enum: ['nowrap', 'wrap'],
            description: 'Whether children wrap to next line',
          },
          // Text properties
          content: {
            type: 'string',
            description: 'Text content (required for add_text)',
          },
          fontSize: {
            type: 'number',
            description: 'Font size in pixels (default: 16)',
          },
          fontFamily: {
            type: 'string',
            description: 'Font family (default: sourcesanspro)',
          },
          fontWeight: {
            type: 'string',
            description: 'Font weight (default: 400)',
          },
          textAlign: {
            type: 'string',
            enum: ['left', 'center', 'right', 'justify'],
            description: 'Horizontal text alignment',
          },
          verticalAlign: {
            type: 'string',
            enum: ['top', 'center', 'bottom'],
            description: 'Vertical text alignment within bounds',
          },
          lineHeight: {
            type: 'number',
            description: 'Line height multiplier (default: 1.2)',
          },
          letterSpacing: {
            type: 'number',
            description: 'Letter spacing in pixels',
          },
          textDecoration: {
            type: 'string',
            enum: ['none', 'underline', 'line-through'],
            description: 'Text decoration',
          },
          textTransform: {
            type: 'string',
            enum: ['none', 'uppercase', 'lowercase', 'capitalize'],
            description: 'Text transform',
          },
          // Layer ordering properties (ISSUE-009)
          objectIds: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Array of object IDs (for bring_to_front, send_to_back, move_to_index, group)',
          },
          parentId: {
            type: 'string',
            description: 'Parent frame/group ID (for layer ordering operations and ungroup target)',
          },
          index: {
            type: 'number',
            description: 'Target z-index position (for move_to_index action)',
            minimum: 0,
          },
          // Grouping properties (ISSUE-010)
          childIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Child object IDs (required for ungroup action)',
          },
          // Duplicate properties (ISSUE-011)
          offsetX: {
            type: 'number',
            description: 'Horizontal offset for duplicate (default: 20)',
          },
          offsetY: {
            type: 'number',
            description: 'Vertical offset for duplicate (default: 20)',
          },
        },
        required: ['action', 'fileId'],
      },
    },

    // ==================== Media Tool ====================
    {
      name: 'media',
      description: `Upload and manage images in Penpot files.

Actions:
- upload_url: Upload an image from a URL
- upload_base64: Upload an image from base64 data
- list: List all media objects in a file
- delete: Delete a media object
- add_image: Add an uploaded image as a shape on a page

Workflow:
1. First upload an image using upload_url or upload_base64
2. Note the mediaId, mediaWidth, mediaHeight from the response
3. Use add_image with those values to place the image on a page`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['upload_url', 'upload_base64', 'list', 'delete', 'add_image'],
            description: 'Action to perform',
          },
          fileId: {
            type: 'string',
            description: 'File ID (required)',
          },
          pageId: {
            type: 'string',
            description: 'Page ID (required for add_image)',
          },
          url: {
            type: 'string',
            description: 'URL of image to upload (for upload_url)',
          },
          base64: {
            type: 'string',
            description: 'Base64-encoded image data (for upload_base64)',
          },
          filename: {
            type: 'string',
            description: 'Filename for the image',
          },
          mimeType: {
            type: 'string',
            description: 'MIME type (default: image/png)',
          },
          mediaId: {
            type: 'string',
            description: 'Media object ID (from upload response, for add_image/delete)',
          },
          x: {
            type: 'number',
            description: 'X position for image placement',
          },
          y: {
            type: 'number',
            description: 'Y position for image placement',
          },
          width: {
            type: 'number',
            description: 'Display width (defaults to original)',
          },
          height: {
            type: 'number',
            description: 'Display height (defaults to original)',
          },
          name: {
            type: 'string',
            description: 'Name for the image shape',
          },
          frameId: {
            type: 'string',
            description: 'Parent frame ID to attach image to',
          },
          mediaWidth: {
            type: 'number',
            description: 'Original image width (from upload response)',
          },
          mediaHeight: {
            type: 'number',
            description: 'Original image height (from upload response)',
          },
          shadow: {
            type: 'object',
            description: 'Shadow effect for the image',
            properties: {
              style: { type: 'string', enum: ['drop-shadow', 'inner-shadow'] },
              color: { type: 'string' },
              opacity: { type: 'number', minimum: 0, maximum: 1 },
              offsetX: { type: 'number' },
              offsetY: { type: 'number' },
              blur: { type: 'number', minimum: 0 },
              spread: { type: 'number' },
            },
          },
        },
        required: ['action', 'fileId'],
      },
    },

    // ==================== Fonts Tool ====================
    {
      name: 'fonts',
      description: `Manage custom fonts for a Penpot team.

Actions:
- list: List all fonts available for a team
- upload: Upload a new font file (supports .ttf, .otf, .woff, .woff2)
- delete: Delete a font family
- delete_variant: Delete a specific font variant (e.g., bold, italic)

Upload workflow:
1. Provide teamId and fontFamily name
2. Include base64Data (base64-encoded font file) and filename
3. Optionally specify fontWeight and fontStyle`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'upload', 'delete', 'delete_variant'],
            description: 'Action to perform',
          },
          teamId: {
            type: 'string',
            description: 'Team ID (required)',
          },
          fontFamily: {
            type: 'string',
            description: 'Font family name (for upload)',
          },
          fontWeight: {
            type: 'string',
            description: 'Font weight (e.g., "400", "700", "normal", "bold")',
          },
          fontStyle: {
            type: 'string',
            enum: ['normal', 'italic'],
            description: 'Font style (default: normal)',
          },
          base64Data: {
            type: 'string',
            description: 'Base64-encoded font file data (for upload)',
          },
          fontData: {
            type: 'string',
            description: 'Raw font data as string (advanced use)',
          },
          filename: {
            type: 'string',
            description: 'Original filename with extension (.ttf, .otf, .woff, .woff2)',
          },
          fontId: {
            type: 'string',
            description: 'Font ID (for delete action)',
          },
          fontVariantId: {
            type: 'string',
            description: 'Font variant ID (for delete_variant action)',
          },
        },
        required: ['action', 'teamId'],
      },
    },

    // ==================== Share Tool ====================
    {
      name: 'share',
      description: `Manage share links for Penpot files.

Actions:
- list: List all share links for a file
- create: Create a new share link for a file
- delete: Delete a share link

Share links allow you to share files with others without giving them access to your team.`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'create', 'delete'],
            description: 'Action to perform',
          },
          fileId: {
            type: 'string',
            description: 'File ID (required for list, create)',
          },
          shareId: {
            type: 'string',
            description: 'Share link ID (required for delete)',
          },
          pageId: {
            type: 'string',
            description: 'Page ID to share (optional, shares whole file if not specified)',
          },
          permission: {
            type: 'string',
            enum: ['all', 'team', 'authenticated'],
            description:
              'Who can access: all (public), team (team members), authenticated (logged-in users)',
          },
        },
        required: ['action'],
      },
    },

    // ==================== Webhooks Tool ====================
    {
      name: 'webhooks',
      description: `Manage webhooks for Penpot teams.

Actions:
- list: List all webhooks for a team
- create: Create a new webhook
- update: Update an existing webhook
- delete: Delete a webhook

Webhooks notify external services when events occur in your Penpot team.`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'create', 'update', 'delete'],
            description: 'Action to perform',
          },
          teamId: {
            type: 'string',
            description: 'Team ID (required for list, create)',
          },
          webhookId: {
            type: 'string',
            description: 'Webhook ID (required for update, delete)',
          },
          uri: {
            type: 'string',
            description: 'Webhook URL endpoint (required for create)',
          },
          mtype: {
            type: 'string',
            enum: ['json', 'transit'],
            description: 'Payload format: json or transit (default: json)',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the webhook is active (for update)',
          },
        },
        required: ['action'],
      },
    },

    // ==================== Templates Tool ====================
    {
      name: 'templates',
      description: `Access and clone builtin Penpot templates.

Actions:
- list: List all available builtin templates
- clone: Clone a template to create a new file

Templates provide pre-made designs that can be used as starting points for new projects.
Note: Templates are server-configured and may not be available on all Penpot instances.`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'clone'],
            description: 'Action to perform',
          },
          templateId: {
            type: 'string',
            description: 'Template ID string (required for clone) - e.g., "test", "welcome"',
          },
          projectId: {
            type: 'string',
            description: 'Target project UUID (required for clone)',
          },
        },
        required: ['action'],
      },
    },

    // ==================== Trash Tool ====================
    {
      name: 'trash',
      description: `Manage deleted files (trash) in Penpot.

Actions:
- list: List all deleted files for a team
- restore: Restore deleted files
- delete_permanently: Permanently delete files (cannot be recovered)

Files stay in trash for a limited time before automatic permanent deletion.`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'restore', 'delete_permanently'],
            description: 'Action to perform',
          },
          teamId: {
            type: 'string',
            description: 'Team ID (required)',
          },
          fileIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of file IDs to restore or permanently delete',
          },
        },
        required: ['action', 'teamId'],
      },
    },

    // ==================== Access Tokens Tool ====================
    {
      name: 'accessTokens',
      description: `Manage programmatic access tokens for Penpot API.

Actions:
- list: List all access tokens for your account
- create: Create a new access token
- delete: Delete an access token

Access tokens allow programmatic access to the Penpot API without user credentials.`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'create', 'delete'],
            description: 'Action to perform',
          },
          tokenId: {
            type: 'string',
            description: 'Token UUID (required for delete)',
          },
          name: {
            type: 'string',
            description: 'Token name, max 250 chars (required for create)',
          },
          expiration: {
            type: 'string',
            description:
              'Token expiration as duration string, e.g., "30d" (30 days), "1y" (1 year). Optional.',
          },
        },
        required: ['action'],
      },
    },
  ];
}
