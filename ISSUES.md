# Penpot MCP - Issues & Enhancement Roadmap

> **Created:** December 26, 2024  
> **Purpose:** Comprehensive list of missing features, bugs, and enhancement opportunities  
> **Priority:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 🔴 CRITICAL ISSUES

### ISSUE-001: No Image/Media Upload Support
**Status:** ✅ IMPLEMENTED  
**Impact:** ~~Cannot add images, photos, illustrations to designs~~  
**Resolution:** Full media upload support added - see COMPLETED ISSUES section

---

### ISSUE-002: Cannot Instantiate Library Components
**Status:** ✅ IMPLEMENTED  
**Impact:** ~~Cannot use icons from linked Lucide library or other component libraries~~  
**Resolution:** Full component instantiation support added - see COMPLETED ISSUES section

---

### ISSUE-003: No Visual Feedback/Preview Capability
**Status:** ✅ IMPLEMENTED  
**Impact:** ~~Agent cannot see what it's creating, works blind~~  
**Resolution:** Full preview capability added - see COMPLETED ISSUES section

---

## 🟠 HIGH PRIORITY ISSUES

### ISSUE-004: Border Radius Not Supported
**Status:** ✅ IMPLEMENTED  
**Resolution:** Full border radius support added - see COMPLETED ISSUES section

---

### ISSUE-005: Stroke Properties Limited
**Status:** ✅ IMPLEMENTED  
**Resolution:** Full stroke support added to all shapes - see COMPLETED ISSUES section

---

### ISSUE-006: Shadow/Effects Not Supported
**Status:** ✅ IMPLEMENTED  
**Resolution:** Shadow support added to all shapes - see COMPLETED ISSUES section

---

### ISSUE-007: SVG Import Not Supported
**Status:** ✅ IMPLEMENTED  
**Resolution:** Full SVG import support added - see COMPLETED ISSUES section

---

### ISSUE-008: Page Management Incomplete
**Status:** ✅ IMPLEMENTED (deletePage added)  
**Resolution:** Added `deletePage()` method. `addPage()` and `renamePage()` were already present - see COMPLETED ISSUES section

---

### ISSUE-022: Design Quality Analysis (Overlaps, Emojis) ✅ NEW
**Status:** ✅ IMPLEMENTED  
**Impact:** Agent could not automatically detect and fix design quality issues like overlapping elements or emoji characters in text  
**Resolution:** Added comprehensive quality analysis to the `analyze` tool - see COMPLETED ISSUES section

---

## 🟡 MEDIUM PRIORITY ISSUES

### ISSUE-009: Layer Ordering (Z-Index)
**Status:** ✅ IMPLEMENTED  
**Resolution:** Added `bringToFront`, `sendToBack`, `moveObjects` methods - see COMPLETED ISSUES section

---

### ISSUE-010: Group Objects
**Status:** ✅ IMPLEMENTED  
**Resolution:** Added `groupObjects`, `ungroupObjects` methods - see COMPLETED ISSUES section

---

### ISSUE-011: Copy/Duplicate Objects
**Status:** ✅ IMPLEMENTED  
**Resolution:** Added `duplicateObject` method - see COMPLETED ISSUES section

---

### ISSUE-012: Text Styling Incomplete
**Status:** ✅ IMPLEMENTED  
**Resolution:** Full text styling support added - see COMPLETED ISSUES section

---

### ISSUE-013: Constraints/Auto Layout
**Status:** ✅ IMPLEMENTED  
**Resolution:** Full constraints and auto-layout support added - see COMPLETED ISSUES section

---

### ISSUE-014: Font Management
**Status:** ✅ IMPLEMENTED  
**Resolution:** Full font management support added - see COMPLETED ISSUES section

---

## 🟢 LOW PRIORITY / NICE TO HAVE

### ISSUE-015: Share Links
**Status:** ✅ IMPLEMENTED  
**Resolution:** Full share link management added - see COMPLETED ISSUES section

---

### ISSUE-016: Webhooks
**Status:** ✅ IMPLEMENTED  
**Resolution:** Full webhook management added - see COMPLETED ISSUES section

---

### ISSUE-017: Templates
**Status:** ✅ IMPLEMENTED  
**Resolution:** Full template access and cloning added - see COMPLETED ISSUES section

---

### ISSUE-018: Trash/Recovery
**Status:** ✅ IMPLEMENTED  
**Resolution:** Full trash management added - see COMPLETED ISSUES section

---

### ISSUE-019: Access Tokens (Programmatic)
**Status:** ✅ IMPLEMENTED  
**Resolution:** Full access token management added - see COMPLETED ISSUES section

---

### ISSUE-020: Boolean Operations
**Status:** ❌ Not Implemented  
**Impact:** Cannot union, subtract, intersect shapes

**This is complex** - requires client-side path boolean operations.

---

### ISSUE-021: Gradients
**Status:** ✅ IMPLEMENTED  
**Resolution:** Gradient fills (linear and radial) added to all shapes - see COMPLETED ISSUES section

---

## 📊 CAPABILITY MATRIX SUMMARY

| Category | Read | Create | Modify | Delete | Notes |
|----------|:----:|:------:|:------:|:------:|-------|
| **Files** | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| **Pages** | ✅ | ✅ | ✅ | ✅ | Full support |
| **Frames** | ✅ | ✅ | ✅ | ✅ | +border-radius, strokes, shadows |
| **Rectangles** | ✅ | ✅ | ✅ | ✅ | +border-radius, strokes, shadows |
| **Ellipses** | ✅ | ✅ | ✅ | ✅ | +strokes, shadows |
| **Text** | ✅ | ✅ | ✅ | ✅ | +alignment, styling, shadows |
| **Paths** | ✅ | ✅ | ✅ | ✅ | Basic support |
| **Images** | ✅ | ✅ | N/A | ✅ | Upload & place |
| **Components** | ✅ | ✅ | ⚠️ | ✅ | Instantiate |
| **Colors** | ✅ | ⚠️ | ⚠️ | ⚠️ | Revn conflicts |
| **Typography** | ✅ | ⚠️ | ⚠️ | ⚠️ | Revn conflicts |
| **Shadows** | ✅ | ✅ | N/A | N/A | All shapes |
| **Strokes** | ✅ | ✅ | N/A | N/A | All shapes |
| **Groups** | ✅ | ✅ | N/A | ✅ | Group/ungroup |
| **Z-Order** | N/A | N/A | ✅ | N/A | Reorder layers |
| **Duplicate** | N/A | ✅ | N/A | N/A | Clone objects |
| **Constraints** | N/A | ✅ | N/A | N/A | Horizontal/vertical |
| **Auto-Layout** | N/A | ✅ | N/A | N/A | Flex on frames |
| **Gradients** | N/A | ✅ | N/A | N/A | Linear/radial |
| **Fonts** | ✅ | ✅ | N/A | ✅ | Upload, list, delete |
| **Exports** | ✅ | N/A | N/A | N/A | Preview for AI |
| **SVG Import** | N/A | ✅ | N/A | N/A | Paths, shapes |
| **Share Links** | ✅ | ✅ | N/A | ✅ | Public/team/auth |
| **Webhooks** | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| **Templates** | ✅ | ✅ | N/A | N/A | List & clone |
| **Trash** | ✅ | N/A | N/A | ✅ | Restore/delete |
| **Access Tokens** | ✅ | ✅ | N/A | ✅ | Programmatic API |
| **Comments** | ⚠️ | ⚠️ | ❌ | ❌ | Limited |
| **Quality Analysis** | ✅ | N/A | ✅ | N/A | **NEW** - Overlaps, emojis, auto-fix |

---

## 🎯 RECOMMENDED DEVELOPMENT ORDER

### ✅ Phase 1: Critical Blockers - COMPLETED
1. ~~**ISSUE-001**: Image upload support~~ ✅
2. ~~**ISSUE-004**: Border radius~~ ✅
3. ~~**ISSUE-005**: Stroke properties~~ ✅
4. ~~**ISSUE-006**: Shadow/effects~~ ✅
5. ~~**ISSUE-012**: Text styling completion~~ ✅

### ✅ Phase 2: Structure & Organization - COMPLETED
6. ~~**ISSUE-009**: Layer ordering~~ ✅
7. ~~**ISSUE-010**: Grouping~~ ✅
8. ~~**ISSUE-011**: Copy/duplicate~~ ✅

### ✅ Phase 3: Advanced Features - COMPLETED
9. ~~**ISSUE-002**: Component instantiation~~ ✅
10. ~~**ISSUE-003**: Visual preview~~ ✅
11. ~~**ISSUE-007**: SVG import~~ ✅
12. ~~**ISSUE-013**: Constraints/auto-layout~~ ✅
13. ~~**ISSUE-014**: Font management~~ ✅
14. ~~**ISSUE-021**: Gradients~~ ✅

### ✅ Phase 4: Quality & Automation - COMPLETED
15. ~~**ISSUE-022**: Design quality analysis~~ ✅

---

## 📝 TECHNICAL NOTES

### Transit Encoding Reference
```typescript
// UUID: prefix with ~u
'~u00000000-0000-0000-0000-000000000000'

// Keyword: prefix with ~:
'~:type'

// Set: use ~#set
['~#set', ['item1', 'item2']]

// Datetime: use ~m prefix with epoch ms
'~m1703548800000'

// Matrix: use ~#matrix
['~#matrix', { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }]

// Point: use ~#point
['~#point', { x: 100, y: 200 }]

// Rect: use ~#rect
['~#rect', { x: 0, y: 0, width: 100, height: 100, x1: 0, y1: 0, x2: 100, y2: 100 }]
```

### Multipart Upload Pattern
```typescript
import FormData from 'form-data';

async uploadMedia(fileId: string, file: Buffer, filename: string) {
  const formData = new FormData();
  formData.append('file-id', fileId);
  formData.append('is-local', 'true');
  formData.append('name', filename);
  formData.append('content', file, { filename });
  
  return this.client.post('/rpc/command/upload-file-media-object', formData, {
    headers: {
      ...formData.getHeaders(),
      'Authorization': `Token ${this.token}`
    }
  });
}
```

### Change Batching for Performance
```typescript
// BAD: Multiple API calls
await this.submitChanges(fileId, [change1]);
await this.submitChanges(fileId, [change2]);
await this.submitChanges(fileId, [change3]);

// GOOD: Single API call with all changes
const changes = [change1, change2, change3];
await this.submitChanges(fileId, changes);
```

### Image Shape Structure (for ISSUE-001)
```typescript
// After uploading media, create image shape:
{
  type: 'image',
  name: 'My Image',
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  'frame-id': frameId,
  'parent-id': parentId,
  metadata: {
    id: mediaObjectId,  // From upload response
    width: originalWidth,
    height: originalHeight,
    mtype: 'image/png',
  },
  // ... standard geometry (selrect, points, transform)
}
```

---

## 🔗 REFERENCES

- [Penpot GitHub Repository](https://github.com/penpot/penpot)
- [Penpot Technical Guide](https://help.penpot.app/technical-guide/)
- [Transit Format Spec](https://github.com/cognitect/transit-format)
- [Penpot Frontend Data Layer](https://github.com/penpot/penpot/tree/main/frontend/src/app/main/data)
- [Penpot Backend Commands](https://github.com/penpot/penpot/tree/main/backend/src/app/rpc/commands)

---

## ✅ COMPLETED ISSUES

### ISSUE-001: No Image/Media Upload Support ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added `MediaAPIClient` class with `uploadFromUrl()`, `uploadFromBase64()`, `listMedia()`, `deleteMedia()` methods
- Added `addImage()` method to `file-changes-api.ts` for placing uploaded images
- Created `media` tool with actions: `upload_url`, `upload_base64`, `list`, `delete`, `add_image`
- Full multipart form-data support added

### ISSUE-004: Border Radius Not Supported ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added `borderRadius`, `r1`, `r2`, `r3`, `r4` parameters to `addRectangle()` and `addFrame()`
- Updated shapes tool schema with all border radius options
- Supports uniform radius and per-corner radius

### ISSUE-005: Stroke Properties Limited ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added full stroke support to `addRectangle()`, `addFrame()`, `addEllipse()`
- Stroke properties: `strokeColor`, `strokeWidth`, `strokeOpacity`, `strokeStyle` (solid, dotted, dashed), `strokeAlignment` (center, inner, outer)
- Updated shapes tool schema with all stroke options

### ISSUE-006: Shadow/Effects Not Supported ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added shadow support to `addRectangle()`, `addFrame()`, `addEllipse()`, `addText()`
- Shadow object properties: `style` (drop-shadow, inner-shadow), `color`, `opacity`, `offsetX`, `offsetY`, `blur`, `spread`
- Updated shapes tool schema with shadow options

### ISSUE-008: Page Management Incomplete ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024) - Added `deletePage()`  
**Implementation:**
- Added `deletePage(fileId, pageId)` method to `file-changes-api.ts`
- Note: `addPage()` and `renamePage()` were already present

### ISSUE-009: Layer Ordering (Z-Index) ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added `moveObjects(fileId, pageId, objectIds, parentId, index)` method
- Added `bringToFront(fileId, pageId, objectIds, parentId)` convenience method
- Added `sendToBack(fileId, pageId, objectIds, parentId)` convenience method
- Uses `mov-objects` change type for proper z-ordering
- Added `bring_to_front`, `send_to_back`, `move_to_index` actions to shapes tool

### ISSUE-010: Group Objects ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added `groupObjects(fileId, pageId, objectIds, options)` method to create groups
- Added `ungroupObjects(fileId, pageId, groupId, childIds, parentId)` method to dissolve groups
- Added `group`, `ungroup` actions to shapes tool
- Handles parent-id updates for grouped children

### ISSUE-011: Copy/Duplicate Objects ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added `duplicateObject(fileId, pageId, sourceObject, options)` method
- Deep clones object with new UUID and position offset
- Supports custom `offsetX`, `offsetY` (default: 20px each)
- Supports custom name for duplicate
- Added `duplicate` action to shapes tool

### ISSUE-012: Text Styling Incomplete ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added `textAlign` (left, center, right, justify)
- Added `verticalAlign` (top, center, bottom)
- Added `lineHeight`, `letterSpacing`
- Added `textDecoration` (underline, line-through)
- Added `textTransform` (uppercase, lowercase, capitalize)
- Updated shapes tool schema with all text styling options

### ISSUE-013: Constraints/Auto Layout ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added constraints support to `addRectangle()` and `addEllipse()`:
  - `constraintsH`: left, right, leftright, center, scale
  - `constraintsV`: top, bottom, topbottom, center, scale
- Added full auto-layout (flex) support to `addFrame()`:
  - `layout`: flex or grid
  - `layoutFlexDir`: row, column, row-reverse, column-reverse
  - `layoutGap`: uniform number or { rowGap, columnGap }
  - `layoutPadding`: uniform number or { top, right, bottom, left }
  - `layoutJustifyContent`: start, center, end, space-between, space-around, space-evenly
  - `layoutAlignItems`: start, center, end, stretch
  - `layoutWrap`: nowrap, wrap
- Updated shapes tool schema and tool definitions

### ISSUE-021: Gradients ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added gradient fill support to `addRectangle()`, `addFrame()`, `addEllipse()`
- Gradient object properties:
  - `type`: linear or radial
  - `startX`, `startY`: Start position (0-1)
  - `endX`, `endY`: End position (0-1)
  - `stops`: Array of { color, opacity, offset }
- Gradients override solid fill when specified
- Updated shapes tool schema and tool definitions

### ISSUE-007: SVG Import ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Created comprehensive SVG parser utility (`src/utils/svg-parser.ts`)
- Supports all major SVG elements:
  - `<path>` with full path command support (M, L, H, V, C, S, Q, T, A, Z)
  - `<rect>` (including rounded corners)
  - `<circle>` and `<ellipse>` (converted to bezier curves)
  - `<line>`, `<polygon>`, `<polyline>`
- Added `importSVG()` method to file-changes-api
- Added `import_svg` action to files tool
- Features:
  - Automatic bounds calculation
  - Scale and position offset support
  - Fill and stroke extraction from SVG attributes
  - Optional shape grouping for multi-shape SVGs
  - Color parsing (hex, rgb, named colors)

### ISSUE-014: Font Management ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Created `FontAPIClient` class with full font management methods
- Methods: `getTeamFonts()`, `uploadFont()`, `uploadFontBase64()`, `deleteFont()`, `deleteFontVariant()`
- Supports .ttf, .otf, .woff, .woff2 font formats
- Added `fonts` tool with actions: `list`, `upload`, `delete`, `delete_variant`
- Multipart form-data upload with proper MIME type detection
- Full integration with tool registry and schema validation

### ISSUE-002: Component Instantiation ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added `instantiateComponent()` method to ComponentsAPIClient
- Creates instances of library components at specified positions
- Features:
  - Fetches source file component and main instance data
  - Recursively collects all shapes in component hierarchy
  - Generates new UUIDs for all shapes with ID mapping
  - Clones shapes with proper component references:
    - Root shape gets: `component-id`, `component-file`, `component-root: true`, `shape-ref`
    - Child shapes get: `shape-ref` pointing to corresponding main instance shape
  - Applies position offset from original to target coordinates
  - Submits as `add-obj` changes to update-file endpoint
- Added `instantiate` action to components tool with parameters:
  - `sourceFileId`: Source file containing the component
  - `componentId`: Component to instantiate
  - `pageId`: Target page for placement
  - `x`, `y`: Position coordinates
  - `name`: Optional custom instance name
  - `frameId`: Optional parent frame (defaults to page root)
- Updated schema and tool definitions with full validation

### ISSUE-003: Visual Preview ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Added `preview()` method to ExportsAPIClient for AI visual feedback
- Features:
  - Automatically finds best frame to preview (largest area) or uses specified objectId
  - Calculates optimal scale based on quality setting and size constraints
  - Returns PNG image as base64 data
  - Includes both raw base64 and data URI for easy display
  - Returns metadata: file name, page name, object info, dimensions, scale
- Quality presets:
  - `low`: Scale ≤0.5x (smaller file size)
  - `medium`: Scale ≤1x (default, balanced)
  - `high`: Scale ≤2x (better detail)
- Size constraints:
  - `maxWidth`: Maximum output width (default 800px)
  - `maxHeight`: Maximum output height (default 600px)
- Added `preview` action to exports tool with parameters:
  - `fileId`, `pageId`: Required
  - `objectId`: Optional specific object to preview
  - `maxWidth`, `maxHeight`: Optional size constraints
  - `quality`: Optional quality preset
- Response includes:
  - `preview.data`: Base64 PNG image data
  - `preview.contentType`: MIME type
  - `preview.size`: File size in bytes
  - `metadata`: Object name, type, dimensions, scale info
  - `dataUri`: Ready-to-use data URI for display

### ISSUE-015: Share Links ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Created `ShareAPIClient` class with full share link management
- Methods: `getShareLinks()`, `createShareLink()`, `deleteShareLink()`
- Added `share` tool with actions: `list`, `create`, `delete`
- Supports permissions: `all` (public), `team` (team members), `authenticated` (logged-in users)
- Full integration with tool registry and schema validation

### ISSUE-016: Webhooks ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Created `WebhooksAPIClient` class with full webhook management
- Methods: `getTeamWebhooks()`, `createWebhook()`, `updateWebhook()`, `deleteWebhook()`
- Added `webhooks` tool with actions: `list`, `create`, `update`, `delete`
- Supports JSON and Transit payload formats
- Enable/disable webhooks via `isActive` flag
- Full integration with tool registry and schema validation

### ISSUE-017: Templates ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Created `TemplatesAPIClient` class with template access
- Methods: `getBuiltinTemplates()`, `cloneTemplate()`
- Added `templates` tool with actions: `list`, `clone`
- Clone templates to create new files in any project
- Optional custom name for cloned files
- Full integration with tool registry and schema validation

### ISSUE-018: Trash/Recovery ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Created `TrashAPIClient` class with trash management
- Methods: `getDeletedFiles()`, `restoreFiles()`, `permanentlyDelete()`
- Added `trash` tool with actions: `list`, `restore`, `delete_permanently`
- Batch restore or delete multiple files at once
- Full integration with tool registry and schema validation

### ISSUE-019: Access Tokens (Programmatic) ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Created `AccessTokensAPIClient` class with token management
- Methods: `getAccessTokens()`, `createAccessToken()`, `deleteAccessToken()`
- Added `access_tokens` tool with actions: `list`, `create`, `delete`
- Token masking for security (shows only last 4 characters)
- Optional expiration date support
- Full integration with tool registry and schema validation

### ISSUE-022: Design Quality Analysis (Overlaps, Emojis) ✅
**Status:** ✅ IMPLEMENTED (December 26, 2024)  
**Implementation:**
- Extended `analyze` tool with new quality analysis actions
- **New Actions:**
  - `overlaps`: Detect overlapping/duplicate elements at same positions
  - `emojis`: Detect emoji characters in text elements
  - `quality`: Comprehensive quality check (overlaps + emojis + accessibility)
  - `fix_overlaps`: Automatically fix overlapping elements (hide/delete duplicates)
  - `fix_emojis`: Automatically remove emoji characters from text
  - `fix_all`: Fix all detected quality issues at once
- **Overlap Detection Features:**
  - Detects elements at same position (configurable tolerance)
  - Calculates bounding box overlap percentage
  - Groups issues by parent frame for better context
  - Configurable overlap threshold (default: 50%)
  - Position tolerance (default: 5px)
- **Emoji Detection Features:**
  - Comprehensive Unicode emoji regex pattern
  - Built-in emoji-to-text replacement dictionary (👤→User, 📍→Location, etc.)
  - Suggested text replacements for common emojis
  - Scans all text elements including nested content
- **Fix Capabilities:**
  - `fix_overlaps`: Hides duplicate elements (configurable: hide/delete)
  - `fix_emojis`: Removes emojis from text, applies replacements
  - `fix_all`: Runs both fixes in parallel
  - Can target specific issues via `issueIds` parameter
- **Quality Score:**
  - Provides 0-100 quality score based on issues found
  - Aggregated summary across all quality dimensions
  - Actionable recommendations for improvements
- **New Schema Options:**
  - `overlapThreshold`: Min overlap % to flag (default: 50)
  - `positionTolerance`: Pixels for "same position" (default: 5)
  - `replaceEmojis`: Include replacement suggestions
  - `fixStrategy`: How to fix overlaps (hide/delete/move)
  - `issueIds`: Specific issues to fix
  - `frameId`: Analyze specific screen/artboard

---

*Last Updated: December 26, 2024*
