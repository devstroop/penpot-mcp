# Penpot MCP - Capability Analysis

> **Last Updated:** December 25, 2024  
> **Tested Against:** Penpot self-hosted at penpot.devstroop.com

---

## ✅ Working Features

### 1. **Profile Management**
- `profile.getProfile()` - Get current user profile ✓

### 2. **Files Management**
- `files.getFile(fileId)` - Get file metadata ✓
- `files.getFilePages(fileId)` - Get all pages ✓

### 3. **Shape Creation (via FileChanges)**
| Shape | Method | Status | Notes |
|-------|--------|--------|-------|
| Frame | `addFrame()` | ✅ Working | Artboards/screens |
| Rectangle | `addRectangle()` | ✅ Working | Basic rectangles |
| Ellipse | `addEllipse()` | ✅ Working | Circles/ovals |
| **Text** | `addText()` | ✅ **NEW!** | Full text support |
| **Path** | `addPath()` | ✅ **NEW!** | Vector paths |

### 4. **Object Management (NEW!)**
| Action | Method | Status | Notes |
|--------|--------|--------|-------|
| Modify | `modifyObject()` | ✅ **NEW!** | Change properties |
| Delete | `deleteObject()` | ✅ **NEW!** | Remove objects |

### 5. **Design Tokens**
- `tokens.getColors(fileId)` - Get color palette ✓
- `tokens.getTypography(fileId)` - Get typography styles ✓

### 6. **Library Management**
- `library.getLinkedLibraries(fileId)` - Get linked libs ✓

---

## 🎨 Design Demo Created

A complete **Mobile Finance App** was created using ONLY MCP tools:

### Screens (at y=2000)
| Screen | Position | Description |
|--------|----------|-------------|
| Welcome | x: 0 | Logo, welcome text, CTA button, sign-in link |
| Sign In | x: 400 | Email/password fields, buttons, social auth |
| Home | x: 800 | Balance card, quick actions, transaction list |
| Profile | x: 1200 | Avatar, menu items, logout button |

### Elements Created
- **4 Frames** - Mobile screens (375×812)
- **50+ Rectangles** - Cards, buttons, inputs, list items
- **20+ Ellipses** - Avatars, icons, action buttons
- **50+ Text elements** - Headings, labels, body text, links

### Text Examples Demonstrated
```javascript
// Heading
await fileChanges.addText(fileId, pageId, {
  x: 420, y: 2100, content: 'Sign In',
  fontSize: 32, fontWeight: '700', fill: '#000000'
});

// Body text
await fileChanges.addText(fileId, pageId, {
  x: 420, y: 2145, content: 'Welcome back!',
  fontSize: 16, fill: '#8E8E93'
});

// Button text
await fileChanges.addText(fileId, pageId, {
  x: 555, y: 2465, content: 'Sign In',
  fontSize: 18, fontWeight: '600', fill: '#FFFFFF'
});
```

---

## ⚠️ Partially Working / Known Issues

| Feature | Issue | Workaround |
|---------|-------|------------|
| Create Color Token | 400 revn conflicts | Needs batch operations |
| Create Typography | Property naming | Manual mapping needed |
| Get Teams | API endpoint mismatch | Use profile instead |
| Get Projects | API endpoint mismatch | Access files directly |
| Get Objects | Parsing issues | Use pages list |
| Get Components | API endpoint mismatch | Use library |
| Get Comments | API endpoint mismatch | Not available |

---

## ❌ Missing / Not Implemented

### High Priority
| Feature | Difficulty | Notes |
|---------|------------|-------|
| Component Instances | Medium | Reference existing components |
| Page Management | Easy | Create/delete/rename pages |

### Medium Priority
| Feature | Difficulty | Notes |
|---------|------------|-------|
| Layer Management | Medium | Reorder, group, lock |
| Copy/Paste Objects | Easy | Clone existing objects |
| Border Radius | Easy | For rectangles |
| Stroke Properties | Easy | Width, style, color |

### Lower Priority
| Feature | Difficulty | Notes |
|---------|------------|-------|
| Export Assets | Medium | PNG/SVG/PDF generation |
| Effects | Medium | Shadows, blur, blend modes |
| Constraints | Medium | Layout constraints |
| Styles | Medium | Shared style application |

---

## 📊 Capability Matrix

| Category | Read | Create | Modify | Delete | Status |
|----------|------|--------|--------|--------|--------|
| Profile | ✅ | N/A | ⚠️ | N/A | Working |
| Files | ✅ | ⚠️ | ⚠️ | ⚠️ | Mostly works |
| Pages | ✅ | ❌ | ❌ | ❌ | Read only |
| **Frames** | ✅ | ✅ | ✅ | ✅ | **Full support** |
| **Rectangles** | ✅ | ✅ | ✅ | ✅ | **Full support** |
| **Ellipses** | ✅ | ✅ | ✅ | ✅ | **Full support** |
| **Text** | ✅ | ✅ | ✅ | ✅ | **Full support** |
| **Paths** | ✅ | ✅ | ✅ | ✅ | **Full support** |
| Components | ⚠️ | ❌ | ❌ | ❌ | Read only |
| Colors | ✅ | ⚠️ | ⚠️ | ❌ | Read works |
| Typography | ✅ | ⚠️ | ⚠️ | ❌ | Read works |
| Comments | ⚠️ | ⚠️ | ❌ | ❌ | Limited |
| Exports | ⚠️ | N/A | N/A | N/A | Untested |

---

## 🔧 Technical Notes

### Update-file Endpoint Requirements
Every shape mutation requires:
```javascript
{
  revn: 42,              // Current file revision
  vern: 1,               // Version number
  // Shape properties:
  selrect: { x1, y1, x2, y2 },
  points: [[x1,y1], ...],       // Corner coordinates
  transform: [[1,0,0],[0,1,0],[0,0,1]],
  'transform-inverse': [[1,0,0],[0,1,0],[0,0,1]],
  'frame-id': uuid,
  'parent-id': uuid
}
```

### Text Shape Structure
```javascript
{
  type: 'text',
  content: {
    type: 'root',
    children: [{
      type: 'paragraph-set',
      children: [{
        type: 'paragraph',
        children: [{
          text: 'Hello',
          'font-size': '16',
          'font-family': 'sourcesanspro',
          'font-weight': '400',
          fill: '#000000'
        }]
      }]
    }]
  }
}
```

### Version Conflict Prevention
For rapid updates:
1. **Batch operations** - Group changes in single request
2. **Sequential queue** - Wait for each operation to complete
3. **Revision tracking** - Track and update revn after each op

---

## 📝 Working Code Examples

### Create a Frame
```javascript
await fileChanges.addFrame(fileId, pageId, {
  x: 0, y: 0, width: 375, height: 812,
  name: 'Mobile Screen', fill: '#FFFFFF'
});
```

### Create a Rectangle
```javascript
await fileChanges.addRectangle(fileId, pageId, {
  x: 20, y: 100, width: 335, height: 50,
  name: 'Button', fill: '#007AFF'
});
```

### Create Text (NEW!)
```javascript
await fileChanges.addText(fileId, pageId, {
  x: 100, y: 50, content: 'Hello World',
  name: 'Title', fontSize: 32, fontWeight: '700',
  fontFamily: 'sourcesanspro', fill: '#000000'
});
```

### Create an Ellipse
```javascript
await fileChanges.addEllipse(fileId, pageId, {
  x: 150, y: 200, width: 75, height: 75,
  name: 'Avatar', fill: '#E0E0E0'
});
```

### Modify Object (NEW!)
```javascript
await fileChanges.modifyObject(fileId, pageId, objectId, {
  x: 100,
  fill: '#FF0000'
});
```

---

## 🎯 Next Steps

### Immediate Priorities
1. **Fix token creation** - Resolve revn conflicts with batch operations
2. **Add page management** - Create/delete/rename pages

### Future Enhancements
4. **Component instances** - Use library components in designs
5. **Layer ordering** - Control z-index
6. **Effects** - Add shadows and other effects

---

## 📈 Progress Summary

| Milestone | Status |
|-----------|--------|
| Basic shapes (frame, rect, ellipse) | ✅ Complete |
| Text elements | ✅ **Complete (NEW!)** |
| Path/vector shapes | ✅ **Complete (NEW!)** |
| Object modification | ✅ **Complete (NEW!)** |
| Object deletion | ✅ **Complete (NEW!)** |
| Design tokens read | ✅ Complete |
| Design tokens write | ⚠️ Issues |
| Page management | ❌ Pending |
| Component instances | ❌ Pending |

**Total capability coverage: ~65%** of core design operations
