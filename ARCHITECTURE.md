# Architecture Documentation

This document provides a deep dive into the technical architecture of Lazy Export v2.0.

---

## Table of Contents

- [System Overview](#system-overview)
- [Build Architecture](#build-architecture)
- [Runtime Architecture](#runtime-architecture)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Persistence Layer](#persistence-layer)
- [Type System](#type-system)
- [Performance Considerations](#performance-considerations)

---

## System Overview

Lazy Export is a **dual-context Figma plugin** consisting of:

1. **UI Layer** (React app in iframe with full DOM access)
2. **Plugin Layer** (Sandbox with Figma API access, no DOM)

These layers communicate via the **postMessage API**.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Figma Desktop                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Plugin Sandbox                      │  │
│  │  - Figma API Access                                   │  │
│  │  - No DOM/window/fetch                                │  │
│  │  - Node.js-like environment                           │  │
│  │                                                        │  │
│  │  src/plugin/main.ts                                   │  │
│  │    ├── figma.showUI()                                 │  │
│  │    ├── figma.clientStorage (persistence)             │  │
│  │    ├── figma.currentPage.selection                   │  │
│  │    └── figma.ui.onmessage (handle UI messages)       │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│                    postMessage API                           │
│                            ↓                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    UI iframe (HTML)                   │  │
│  │  - Full browser APIs (DOM, fetch, localStorage)      │  │
│  │  - No Figma API access                                │  │
│  │  - React 18 app                                       │  │
│  │                                                        │  │
│  │  src/ui/main.tsx → App.tsx                            │  │
│  │    ├── React components                               │  │
│  │    ├── window.onmessage (listen to plugin)           │  │
│  │    └── parent.postMessage (send to plugin)           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Build Architecture

### Dual Build System

We use **two separate build processes**:

#### 1. UI Build (Vite)

**Input:** `src/ui/main.tsx`
**Output:** `dist/index.html` (single-file bundle)
**Process:**
```
src/ui/**/*.tsx
    ↓ (Vite + React plugin)
TypeScript → JavaScript
    ↓ (CSS processed)
Styles inlined
    ↓ (vite-plugin-singlefile)
Single HTML file with <script> tags
    ↓
dist/index.html (~160kb)
```

**Key Config:** `vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: 'src/ui',
  build: {
    outDir: '../../dist',
    rollupOptions: {
      input: 'src/ui/index.html',
    },
  },
});
```

#### 2. Plugin Build (esbuild)

**Input:** `src/plugin/main.ts`
**Output:** `dist/code.js`
**Process:**
```
src/plugin/main.ts
    ↓ (esbuild)
TypeScript → JavaScript (ES2020)
    ↓ (bundling)
Single CommonJS file
    ↓
dist/code.js (~5.5kb)
```

**Key Config:** `build-plugin.js`
```javascript
build({
  entryPoints: ['src/plugin/main.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  platform: 'node',
  target: 'es2020',
});
```

### Why Two Builders?

- **Vite** excels at browser-based React apps (HMR, CSS, assets)
- **esbuild** is perfect for lightweight Node-like bundles
- Separation of concerns: UI tooling vs. plugin tooling

### Build Commands

```bash
npm run build          # Both builds sequentially
npm run build:plugin   # Plugin only (esbuild)
npm run dev            # Plugin + Vite watch mode
```

---

## Runtime Architecture

### Plugin Initialization Flow

```
Figma loads plugin
    ↓
dist/code.js executes
    ↓
Check figma.command?
    ↓ (Yes: Quick Action)
    Apply Preset & Close (skip UI)
    ↓ (No: Open Plugin)
figma.showUI(__html__)     ← Points to dist/index.html
    ↓
UI iframe loads
    ↓
React app mounts (src/ui/main.tsx)
    ↓
useEffect hook runs
    ↓
UI sends 'ready' signal (via window.onmessage setup)
    ↓
Plugin loads preferences from figma.clientStorage
    ↓
Plugin sends 'preferences-loaded' message to UI
    ↓
UI renders with initial state
```

### Message Flow

#### UI → Plugin

```typescript
// src/ui/App.tsx
const message: UIMessage = {
  type: 'apply-preset',
  preset: selectedPreset,
  customName: 'icon-home',
  advancedMode: true,
};
parent.postMessage({ pluginMessage: message }, '*');
```

```typescript
// src/plugin/main.ts
figma.ui.onmessage = async (msg: UIMessage) => {
  if (msg.type === 'apply-preset') {
    applyExportSettings(
      figma.currentPage.selection,
      msg.preset.settings,
      msg.customName,
      msg.advancedMode
    );
  }
};
```

#### Plugin → UI

```typescript
// src/plugin/main.ts
const message: PluginMessage = {
  type: 'selection-changed',
  count: figma.currentPage.selection.length,
};
figma.ui.postMessage(message);
```

```typescript
// src/ui/App.tsx
useEffect(() => {
  window.onmessage = (event) => {
    const msg = event.data.pluginMessage as PluginMessage;
    if (msg.type === 'selection-changed') {
      setSelectionCount(msg.count);
    }
  };
}, []);
```

---

## Data Flow

### Applying a Preset (Complete Flow)

```
1. User clicks preset card
   ↓
2. onClick handler in PresetCard component
   ↓
3. App.tsx applyPreset() function
   ↓
4. Create UIMessage object
   {
     type: 'apply-preset',
     preset: { id, name, settings: [...] },
     customName: 'icon-home',
     advancedMode: true
   }
   ↓
5. parent.postMessage() to plugin
   ↓
6. Plugin receives via figma.ui.onmessage
   ↓
7. Extract parameters from message
   ↓
8. Get current selection: figma.currentPage.selection
   ↓
9. For each selected node:
     - Map preset settings to Figma ExportSettings
     - Apply suffix (basic or advanced mode)
     - Set node.exportSettings = [...]
   ↓
10. If iOS advanced mode:
      - Generate Contents.json metadata
      - Log to console
   ↓
11. Send success notification via figma.notify()
   ↓
12. Send PluginMessage back to UI
   {
     type: 'success',
     message: 'Settings applied'
   }
   ↓
13. UI receives message
   ↓
14. Console.log success (optional UI feedback)
```

### Custom Preset Creation Flow

```
1. User clicks "+ Create Custom Preset"
   ↓
2. App.tsx sets isCreatorOpen = true
   ↓
3. Modal renders with PresetCreator component
   ↓
4. User fills form:
     - Name: "Retina Web"
     - Icon: "🌐"
     - Platform: "Web"
     - Settings: [SVG, PNG @2x]
   ↓
5. User clicks "Save Preset"
   ↓
6. PresetCreator validates and calls onSave()
   ↓
7. App.tsx savePreset() creates UIMessage
   {
     type: 'save-preset',
     preset: {
       id: 'custom-1234567890',
       name: 'Retina Web',
       isCustom: true,
       ...
     }
   }
   ↓
8. Message sent to plugin
   ↓
9. Plugin receives, loads existing preferences
   ↓
10. Plugin updates preferences.customPresets array
   ↓
11. Plugin saves to figma.clientStorage.setAsync()
   ↓
12. Plugin sends 'success' message back
   ↓
13. UI optimistically updates state (already done in step 7)
   ↓
14. Modal closes, new preset appears in UI
```

---

## State Management

### UI State (React)

**Location:** `src/ui/App.tsx`

```typescript
const App: React.FC = () => {
  // Local UI state
  const [customName, setCustomName] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectionCount, setSelectionCount] = useState(0);

  // Plugin-synced state
  const [preferences, setPreferences] = useState<SavedPreferences | null>(null);

  // Modal state
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CustomPreset | undefined>();

  // Derived state
  const customPresets = preferences?.customPresets || [];
  const hasSelection = selectionCount > 0;
};
```

**State Categories:**

1. **Transient State** (lives only during session)
   - `customName` - Current text input value
   - `advancedMode` - Toggle state
   - `isCreatorOpen` - Modal visibility

2. **Selection State** (synced from plugin)
   - `selectionCount` - Number of selected layers
   - Updated via 'selection-changed' messages

3. **Persistent State** (synced with clientStorage)
   - `preferences` - Custom presets, settings
   - Loaded on mount, updated on save/delete

### Plugin State

**Location:** `src/plugin/main.ts`

Plugin is **stateless** - all state comes from:

1. **Figma Document State**
   - `figma.currentPage.selection` (current selection)
   - `node.exportSettings` (export config on nodes)

2. **Persistent Storage**
   - `figma.clientStorage` (saved preferences)

3. **Message State**
   - Incoming messages from UI contain all needed data

---

## Persistence Layer

### clientStorage API

**Type:** Key-value store (async)
**Scope:** Per plugin, per user, per file
**Limit:** ~1MB total

**Usage:**

```typescript
// Save
await figma.clientStorage.setAsync('preferences', {
  customPresets: [...],
  advancedModeEnabled: true,
});

// Load
const saved = await figma.clientStorage.getAsync('preferences');

// Delete
await figma.clientStorage.deleteAsync('preferences');
```

### Data Structure

```typescript
interface SavedPreferences {
  customPresets: CustomPreset[];
  lastUsedPreset?: string;
  advancedModeEnabled: boolean;
}

interface CustomPreset {
  id: string;                    // 'custom-1234567890'
  name: string;                  // 'Retina Web'
  platform: Platform;            // 'Web'
  icon?: string;                 // '🌐'
  settings: ExportSetting[];     // [{ format: 'SVG', ... }, ...]
  isCustom: true;                // Always true for custom
  createdAt: number;             // Timestamp
  generateMetadata?: boolean;
  directoryStructure?: boolean;
}
```

### Optimistic Updates

To improve perceived performance, UI updates immediately:

```typescript
const savePreset = (preset: CustomPreset) => {
  // 1. Send to plugin
  parent.postMessage({ pluginMessage: { type: 'save-preset', preset } }, '*');

  // 2. Update local state immediately (optimistic)
  if (preferences) {
    const updated = [...preferences.customPresets, preset];
    setPreferences({ ...preferences, customPresets: updated });
  }

  // 3. If plugin fails, state is already updated (acceptable)
  //    Real apps would rollback on error
};
```

---

## Type System

### Discriminated Unions

Messages use **discriminated unions** for type safety:

```typescript
type UIMessage =
  | { type: 'apply-preset'; preset: PresetConfig; customName?: string; advancedMode: boolean }
  | { type: 'clear-export' }
  | { type: 'save-preset'; preset: CustomPreset }
  | { type: 'delete-preset'; presetId: string };

// TypeScript knows exact shape based on 'type'
figma.ui.onmessage = (msg: UIMessage) => {
  if (msg.type === 'apply-preset') {
    msg.preset         // ✅ Exists
    msg.customName     // ✅ Optional string
    msg.presetId       // ❌ Error - doesn't exist on this variant
  }
};
```

### Shared Types

**Location:** `src/shared/types.ts`

Both UI and plugin import from the same file:

```typescript
// src/ui/App.tsx
import { UIMessage, PresetConfig } from '../shared/types';

// src/plugin/main.ts
import { UIMessage, ExportSetting } from '../shared/types';
```

Benefits:
- Single source of truth
- Compile-time type checking across layers
- Auto-complete in both contexts

---

## Performance Considerations

### Bundle Size

**Current:**
- UI: ~160kb (minified, gzipped ~50kb)
- Plugin: ~5.5kb

**Optimizations:**
- Single HTML file (no external requests)
- Tree-shaking via Vite
- CSS variables (no JS color calculations)
- Lazy loading not needed (small bundle)

### Runtime Performance

**React Optimizations:**
```typescript
// Memoized derived state
const customPresets = useMemo(
  () => preferences?.customPresets || [],
  [preferences]
);

// Event handlers defined outside render
const handleClick = useCallback(() => {
  applyPreset(preset);
}, [preset]);
```

**Plugin Optimizations:**
```typescript
// Batch operations
nodes.forEach(node => {
  node.exportSettings = settings;  // O(1) per node
});

// Avoid synchronous API calls (v2 API all async)
await figma.clientStorage.getAsync('preferences');
```

### Memory Considerations

- **UI state** is minimal (few KB)
- **Custom presets** limited by clientStorage (~1MB total)
- **No image caching** (just metadata)
- **Modal unmounts** when closed (frees memory)

---

## Security Considerations

### Network Access

```json
// dist/manifest.json
{
  "networkAccess": {
    "allowedDomains": ["none"]
  }
}
```

Plugin has **no network access** - fully offline.

### Data Storage

- Data stored via `figma.clientStorage` (Figma's secure storage)
- No localStorage (UI has access, but we don't use it)
- No cookies, no external APIs

### Input Validation

```typescript
// Always validate user input
const savePreset = (preset: CustomPreset) => {
  if (!preset.name.trim()) {
    alert('Preset name required');
    return;
  }

  if (preset.settings.length === 0) {
    alert('At least one export setting required');
    return;
  }

  // Proceed...
};
```

---

## Extension Points

### Adding a New Export Format

1. **Update types:**
   ```typescript
   // src/shared/types.ts — current type is 'PNG' | 'JPG' | 'SVG' | 'PDF'
   // add your new format to the union, e.g.:
   export type ExportFormat = 'PNG' | 'JPG' | 'SVG' | 'PDF' | 'WEBP';
   ```

2. **Update UI form:**
   ```typescript
   // src/ui/components/PresetCreator.tsx
   const FORMATS = ['PNG', 'JPG', 'SVG', 'PDF', 'WEBP'] as const;
   ```

3. **Handle in plugin (if special logic needed):**
   ```typescript
   // src/plugin/main.ts
   if (setting.format === 'AVIF') {
     // Special handling if needed
   }
   ```

### Adding a New Message Type

1. **Define type:**
   ```typescript
   // src/shared/types.ts
   export type UIMessage =
     | ...existing messages
     | { type: 'export-all'; format: 'ZIP' };
   ```

2. **Send from UI:**
   ```typescript
   // src/ui/App.tsx
   const exportAll = () => {
     parent.postMessage({
       pluginMessage: { type: 'export-all', format: 'ZIP' }
     }, '*');
   };
   ```

3. **Handle in plugin:**
   ```typescript
   // src/plugin/main.ts
   figma.ui.onmessage = (msg: UIMessage) => {
     if (msg.type === 'export-all') {
       // Implementation
     }
   };
   ```

---

## Debugging

### UI Debugging

```typescript
// Console logs appear in DevTools
console.log('Preset applied:', preset);

// React DevTools works
// Right-click UI → Inspect Element → Components tab
```

**Open DevTools:**
- Right-click plugin UI → Inspect Element
- Or: Plugins → Development → Open Console

### Plugin Debugging

```typescript
// Console logs appear in Plugin DevTools
console.log('Selection:', figma.currentPage.selection);

// Use debugger
debugger;  // Pauses execution
```

**Open Plugin Console:**
- Plugins → Development → Open Console

### Message Debugging

```typescript
// UI side
window.onmessage = (event) => {
  console.log('[UI] Received:', event.data.pluginMessage);
  // Handle message...
};

// Plugin side
figma.ui.onmessage = (msg) => {
  console.log('[Plugin] Received:', msg);
  // Handle message...
};
```

---

## Testing Strategy

### Manual Testing

See CONTRIBUTING.md for comprehensive checklist.

### Future: Automated Testing

**Planned:**

```typescript
// Unit tests (Jest)
describe('applyExportSettings', () => {
  it('should apply settings to all nodes', () => {
    const nodes = [createMockNode(), createMockNode()];
    const settings = [{ format: 'PNG', suffix: '@2x' }];

    applyExportSettings(nodes, settings);

    expect(nodes[0].exportSettings).toEqual([...]);
  });
});

// Component tests (React Testing Library)
describe('PresetCard', () => {
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(
      <PresetCard preset={mockPreset} onClick={handleClick} />
    );

    fireEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

---

## Deployment

### Publishing to Figma

1. Build: `npm run build`
2. Verify files in `dist/`:
   - `code.js`
   - `index.html`
   - `manifest.json`
3. In Figma: Plugins → Publish Plugin
4. Select `dist/manifest.json`
5. Follow Figma's publishing flow

### Versioning

- Update `package.json` version
- Update `CHANGELOG.md`
- Tag release: `git tag v2.0.0`
- Push: `git push --tags`

---

## Further Reading

- [Figma Plugin API Reference](https://www.figma.com/plugin-docs/api/api-reference/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vite Documentation](https://vitejs.dev/guide/)
- [esbuild Documentation](https://esbuild.github.io/)

---

**Last Updated:** 2025-12-21
**Version:** 2.0.0
