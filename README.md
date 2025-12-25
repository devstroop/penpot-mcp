# Penpot MCP Server

A comprehensive Model Context Protocol (MCP) server for [Penpot](https://penpot.app/), the open-source design platform. This server provides full access to Penpot's capabilities through 14 powerful tools covering projects, files, components, design tokens, exports, comments, teams, and more.

## Features

- **🗂️ Project Management**: Full CRUD operations for projects with file organization
- **📁 File Operations**: Create, edit, duplicate, move files with version history
- **🧩 Component Library**: Manage reusable components with instances, annotations, and stats
- **🎨 Design Tokens**: Colors, typography with export to CSS/JSON/SCSS/Tailwind
- **📤 Asset Export**: PNG, SVG, PDF, JPEG, WebP with multi-scale and batch support
- **💬 Comments & Reviews**: Thread-based commenting with resolution tracking
- **👥 Team Collaboration**: Team management, invitations, roles, and permissions
- **👤 Profile Management**: User settings, notifications, recent files
- **📚 Library Sharing**: Shared libraries, linking, publishing, and sync
- **🔍 Global Search**: Search across files, objects, components, tokens
- **📊 Design Analysis**: Design system audits, accessibility, duplicates detection

## Architecture

```
penpot-mcp/
├── src/
│   ├── index.ts              # Entry point
│   ├── server-core.ts        # MCP server implementation
│   ├── config.ts             # Configuration management
│   ├── logger.ts             # Logging utility
│   ├── api/
│   │   ├── client-factory.ts # API client factory (9 domain clients)
│   │   ├── base/             # Base API client & utilities
│   │   │   ├── base-client.ts
│   │   │   ├── error-handler.ts
│   │   │   ├── response-formatter.ts
│   │   │   └── index.ts
│   │   └── domains/          # Domain-specific API clients
│   │       ├── projects-api.ts   # Project CRUD, files, stats
│   │       ├── files-api.ts      # File operations, pages, objects
│   │       ├── components-api.ts # Components, instances, annotations
│   │       ├── tokens-api.ts     # Colors, typography, export
│   │       ├── exports-api.ts    # Asset export (PNG/SVG/PDF/etc)
│   │       ├── comments-api.ts   # Threads, comments, resolution
│   │       ├── team-api.ts       # Team management, invitations
│   │       ├── profile-api.ts    # User profile, settings
│   │       ├── library-api.ts    # Shared libraries, linking
│   │       └── index.ts
│   └── tools/
│       ├── tool-definitions.ts   # MCP tool schemas (14 tools)
│       ├── index.ts
│       └── orchestration/        # High-level orchestration tools
│           ├── projects.ts       # penpot_projects
│           ├── files.ts          # penpot_files
│           ├── components.ts     # penpot_components
│           ├── tokens.ts         # penpot_tokens
│           ├── exports.ts        # penpot_exports
│           ├── comments.ts       # penpot_comments
│           ├── team.ts           # penpot_team
│           ├── profile.ts        # penpot_profile
│           ├── library.ts        # penpot_library
│           ├── search.ts         # penpot_search
│           ├── analyze.ts        # penpot_analyze
│           ├── navigate.ts       # penpot_navigate (legacy)
│           ├── inspect.ts        # penpot_inspect (legacy)
│           ├── assets.ts         # penpot_assets (legacy)
│           ├── types.ts
│           └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

```bash
npm install
npm run build
```

## Configuration

Create a `.env` file:

```env
# Required: Penpot credentials
PENPOT_USERNAME=your-email@example.com
PENPOT_PASSWORD=your-password

# Optional: Custom Penpot instance URL (defaults to design.penpot.app)
PENPOT_API_URL=https://design.penpot.app/api

# Optional: Default project scope
PENPOT_PROJECT_ID=your-project-id

# Optional: Logging level
LOG_LEVEL=info
```

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "penpot": {
      "command": "node",
      "args": ["/path/to/penpot-mcp/dist/index.js"],
      "env": {
        "PENPOT_USERNAME": "your-email@example.com",
        "PENPOT_PASSWORD": "your-password"
      }
    }
  }
}
```

## Available Tools (14 Total)

### Core Tools

| Tool | Description |
|------|-------------|
| `penpot_projects` | Project management: list, create, rename, delete, duplicate, move |
| `penpot_files` | File operations: CRUD, pages, objects, tree, search, history |
| `penpot_components` | Component library: list, search, instances, create, delete, annotations |
| `penpot_tokens` | Design tokens: colors, typography, CRUD, export to CSS/JSON/SCSS/Tailwind |
| `penpot_exports` | Asset export: PNG, SVG, PDF, JPEG, WebP with batch and multi-scale |
| `penpot_comments` | Comment management: threads, replies, resolve, reopen |
| `penpot_team` | Team management: members, invitations, roles, permissions |
| `penpot_profile` | User profile: settings, notifications, recent files |
| `penpot_library` | Shared libraries: link, unlink, publish, sync |
| `penpot_search` | Global search: files, objects, components, tokens |
| `penpot_analyze` | Design analysis: design system, accessibility, duplicates |

### Legacy Tools (Backward Compatibility)

| Tool | Description |
|------|-------------|
| `penpot_navigate` | Navigate projects, files, pages |
| `penpot_inspect` | Deep inspection of file structure |
| `penpot_assets` | Basic asset export |

## Tool Actions Reference

### penpot_projects
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `list` | List all projects | - |
| `get` | Get project details | `projectId` |
| `create` | Create new project | `name` |
| `rename` | Rename project | `projectId`, `name` |
| `delete` | Delete project | `projectId` |
| `duplicate` | Duplicate project | `projectId` |
| `move` | Move to team | `projectId`, `targetTeamId` |
| `files` | List project files | `projectId` |
| `stats` | Project statistics | `projectId` |

### penpot_files
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `get` | Get file details | `fileId` |
| `create` | Create new file | `projectId`, `name` |
| `rename` | Rename file | `fileId`, `name` |
| `delete` | Delete file | `fileId` |
| `duplicate` | Duplicate file | `fileId` |
| `move` | Move to project | `fileId`, `projectId` |
| `pages` | List file pages | `fileId` |
| `page` | Get page objects | `fileId`, `pageId` |
| `objects` | Get page objects | `fileId`, `pageId` |
| `object` | Get specific object | `fileId`, `pageId`, `objectId` |
| `tree` | Get object tree | `fileId`, `objectId` |
| `search` | Search objects | `fileId`, `query` |
| `analyze` | Analyze structure | `fileId` |
| `history` | Version history | `fileId` |
| `snapshot` | Create/restore | `fileId` |

### penpot_components
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `list` | List components | `fileId` |
| `get` | Get component | `fileId`, `componentId` |
| `search` | Search components | `fileId`, `query` |
| `instances` | Get instances | `fileId`, `componentId` |
| `structure` | Get structure | `fileId`, `componentId` |
| `create` | Create component | `fileId`, `objectId`, `name` |
| `delete` | Delete component | `fileId`, `componentId` |
| `rename` | Rename component | `fileId`, `componentId`, `name` |
| `annotate` | Add annotation | `fileId`, `componentId`, `annotation` |
| `stats` | Component stats | `fileId` |
| `detach` | Detach instance | `fileId`, `instanceId` |
| `reset` | Reset instance | `fileId`, `instanceId` |

### penpot_tokens
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `colors` | List colors | `fileId` |
| `color` | Get color | `fileId`, `colorId` |
| `create_color` | Create color | `fileId`, `name`, `color` |
| `update_color` | Update color | `fileId`, `colorId` |
| `delete_color` | Delete color | `fileId`, `colorId` |
| `typography` | List typography | `fileId` |
| `typography_style` | Get style | `fileId`, `styleId` |
| `create_typography` | Create style | `fileId`, `name` |
| `update_typography` | Update style | `fileId`, `styleId` |
| `delete_typography` | Delete style | `fileId`, `styleId` |
| `all` | Get all tokens | `fileId` |
| `search` | Search tokens | `fileId`, `query` |
| `export_css` | Export as CSS | `fileId` |
| `export_json` | Export as JSON | `fileId` |
| `export_scss` | Export as SCSS | `fileId` |
| `export_tailwind` | Export Tailwind | `fileId` |
| `stats` | Token statistics | `fileId` |

### penpot_exports
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `export` | Export object | `fileId`, `objectId`, `format` |
| `batch` | Batch export | `fileId`, `objectIds` |
| `page` | Export page | `fileId`, `pageId` |
| `file_pdf` | Export as PDF | `fileId` |
| `multi_scale` | Multi-scale export | `fileId`, `objectId`, `scales` |
| `multi_format` | Multi-format export | `fileId`, `objectId`, `formats` |
| `list` | List exportable | `fileId` |
| `settings` | Export settings | `fileId`, `objectId` |
| `download` | Download export | `exportId` |
| `formats` | Supported formats | - |

### penpot_comments
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `list` | List threads | `fileId` |
| `thread` | Get thread | `threadId` |
| `create_thread` | Create thread | `fileId`, `pageId`, `content` |
| `add` | Add comment | `threadId`, `content` |
| `update` | Update comment | `commentId`, `content` |
| `delete` | Delete comment | `commentId` |
| `delete_thread` | Delete thread | `threadId` |
| `resolve` | Resolve thread | `threadId` |
| `reopen` | Reopen thread | `threadId` |
| `unread` | Unread count | `fileId` |

### penpot_team
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `list` | List teams | - |
| `get` | Get team | `teamId` |
| `create` | Create team | `name` |
| `rename` | Rename team | `teamId`, `name` |
| `delete` | Delete team | `teamId` |
| `members` | List members | `teamId` |
| `invite` | Invite member | `teamId`, `email`, `role` |
| `remove_member` | Remove member | `teamId`, `memberId` |
| `update_role` | Update role | `teamId`, `memberId`, `role` |
| `invitations` | Pending invites | `teamId` |
| `cancel_invite` | Cancel invite | `invitationId` |
| `leave` | Leave team | `teamId` |
| `stats` | Team statistics | `teamId` |

### penpot_profile
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `get` | Get profile | - |
| `update` | Update profile | - |
| `password` | Change password | `oldPassword`, `newPassword` |
| `props` | Get properties | - |
| `update_props` | Update props | `props` |
| `email` | Request email change | `newEmail` |
| `delete` | Delete account | - |
| `recent` | Recent files | - |
| `notifications` | Notifications | - |
| `mark_read` | Mark as read | `notificationId` |

### penpot_library
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `shared` | List shared | `teamId` |
| `link` | Link library | `fileId`, `libraryId` |
| `unlink` | Unlink library | `fileId`, `libraryId` |
| `linked` | List linked | `fileId` |
| `publish` | Publish library | `fileId` |
| `unpublish` | Unpublish | `fileId` |
| `summary` | Library summary | `fileId` |
| `sync` | Sync library | `fileId`, `libraryId` |
| `colors` | Library colors | `libraryId` |
| `typography` | Library typography | `libraryId` |
| `components` | Library components | `libraryId` |
| `search` | Search libraries | `teamId`, `query` |

### penpot_search
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `files` | Search files | `query` |
| `objects` | Search objects | `fileId`, `query` |
| `components` | Search components | `fileId` |
| `colors` | Search colors | `fileId` |
| `typography` | Search typography | `fileId` |
| `recent` | Recent files | - |
| `global` | Global search | `query` |

### penpot_analyze
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `design_system` | Design system audit | `fileId` |
| `accessibility` | Accessibility check | `fileId` |
| `naming` | Naming conventions | `fileId` |
| `structure` | File structure | `fileId` |
| `colors` | Color analysis | `fileId` |
| `typography` | Typography analysis | `fileId` |
| `components` | Component usage | `fileId` |
| `duplicates` | Find duplicates | `fileId` |

## Example Usage

### List all projects
```json
{
  "tool": "penpot_projects",
  "arguments": {
    "action": "list"
  }
}
```

### Search for files
```json
{
  "tool": "penpot_search",
  "arguments": {
    "action": "files",
    "query": "dashboard"
  }
}
```

### Export component as PNG
```json
{
  "tool": "penpot_exports",
  "arguments": {
    "action": "export",
    "fileId": "file-uuid",
    "objectId": "object-uuid",
    "format": "png",
    "scale": 2
  }
}
```

### Get design tokens as CSS
```json
{
  "tool": "penpot_tokens",
  "arguments": {
    "action": "export_css",
    "fileId": "file-uuid"
  }
}
```

### Analyze design system
```json
{
  "tool": "penpot_analyze",
  "arguments": {
    "action": "design_system",
    "fileId": "file-uuid"
  }
}
```

## Development

```bash
# Development mode with hot reload
npm run dev

# Build
npm run build

# Run tests
npm test
```

## API Reference

This MCP server uses Penpot's RPC API with Transit+JSON encoding:
- UUIDs are encoded with `~u` prefix
- Keywords are encoded with `~:` prefix
- All requests go through `/rpc/command/{command-name}`

## License

MIT
