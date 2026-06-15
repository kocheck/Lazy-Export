# Changelog

All notable changes to the Lazy Export Figma plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-06-14

### 🎉 Complete Rewrite

This version is a complete modernization of the plugin from the ground up.

### Added

#### **Core Features**
- **PDF Export Format** - Vector export for print and scalable assets
- **Custom Preset System** - Create, edit, delete, and persist custom export presets
- **Advanced Directory Mode** - Production-ready folder structure generation
- **iOS Metadata Generation** - Auto-creates `Contents.json` for `.imageset` folders
- **Android Multi-Density Support** - Proper `drawable-*` folder structure
- **Preset Persistence** - Uses `figma.clientStorage` API for cross-session storage

#### **UI/UX**
- **Figma UI3 Design System** - Native aesthetic with automatic Dark Mode
- **Grid-Based Preset Cards** - Fast, click-to-apply interface (no dropdowns)
- **Real-Time Selection Count** - Live feedback on selected layers
- **Modal-Based Preset Creator** - Intuitive form for custom presets
- **Hover Actions** - Edit/delete buttons on custom preset cards
- **Custom Asset Naming** - Optional naming with intelligent suffix handling

#### **Technical**
- **React 18** - Modern component-based UI
- **TypeScript 5** - Full type safety throughout
- **Vite 7** - Lightning-fast build tooling
- **esbuild** - Optimized plugin compilation
- **Type-Safe Messaging** - Strict types for UI ↔ Plugin communication
- **Optimistic UI Updates** - Instant feedback on user actions

### Changed

- **Build System**: Rollup v1 → Vite 7 + esbuild
- **Framework**: Svelte 3 → React 18
- **TypeScript**: ES6 → ES2020 with strict mode
- **UI Pattern**: Dropdown menus → Direct preset cards
- **Interaction Model**: Dropdown menus → Direct preset cards (menu commands retained and extended)
- **Project Structure**: Organized into `ui/`, `plugin/`, `shared/` folders
- **Export Naming**: Smarter suffix handling with advanced mode
- **Bundle Output**: `public/` → `dist/`

### Removed

- **Legacy dropdown UI** - Replaced by direct-click preset cards; `figma.command` menu commands are retained and extended (applyIOS, applyAndroid, applyWeb, applyPDF, clearExport)
- **Svelte Dependencies** - Fully migrated to React
- **Rollup Build System** - Replaced with Vite
- **Legacy Component Library** - Custom UI3 components instead
- **15+ Deprecated Dependencies** - Clean, modern dependency tree

### Fixed

- Async/await patterns now used throughout (no sync API calls)
- Proper TypeScript error handling
- Better node type support (INSTANCE, COMPONENT_SET, SECTION)
- Dark Mode compatibility via CSS variables

### Security

- Removed legacy dependencies with known vulnerabilities
- Updated to latest stable versions of all packages
- Network access properly scoped in manifest

---

## [1.0.1] - 2020-03-21

### Legacy Version (Svelte + Rollup)

This was the original version built with Svelte and Rollup. See git history for details.

### Features (v1.0.1)
- Basic iOS, Android, Web export presets
- Advanced mode with folder naming
- Custom asset naming
- Dropdown-based platform selection
- Menu command triggers

---

## Migration Guide: v1.x → v2.0

### For Users

**Breaking Changes:**
- The dropdown-based UI is replaced by direct-click preset cards. Menu commands (iOS, Android, Web, PDF, Clear) are still present in the manifest.
- You'll need to re-import the plugin manifest from the new `dist/` folder.

**New Workflow:**
1. Open plugin from Plugins menu
2. Select layers in Figma
3. Click a preset card directly (no dropdown!)
4. Optionally enable Advanced Mode for folder structures

### For Developers

**Setup:**
```bash
# Remove old dependencies
rm -rf node_modules package-lock.json

# Install new dependencies
npm install

# Build
npm run build

# Development with watch mode
npm run dev
```

**Key Changes:**
- Entry points: `src/ui/main.tsx` (UI), `src/plugin/main.ts` (plugin)
- Build output: `dist/` folder
- Commands: `npm run build`, `npm run dev`
- Manifest location: `dist/manifest.json`

---

## Roadmap

### Future Enhancements (v2.1+)

- [ ] Preset import/export as JSON files
- [ ] Preset templates library
- [ ] Batch rename functionality
- [ ] Export history/undo
- [ ] Team preset sharing
- [ ] Export preview before applying
- [ ] Preset categories/tags
- [ ] Keyboard shortcuts
- [ ] Multi-language support

---

[2.0.0]: https://github.com/kocheck/Lazy-Export/compare/v1.0.1...v2.0.0
[1.0.1]: https://github.com/kocheck/Lazy-Export/releases/tag/v1.0.1
