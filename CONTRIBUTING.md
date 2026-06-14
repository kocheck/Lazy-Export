# Contributing to Lazy Export

Thank you for your interest in contributing! This document provides guidelines and context for developers and AI agents working on this codebase.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Architecture Overview](#architecture-overview)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [For AI Agents](#for-ai-agents)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Figma Desktop App** (for testing)
- Basic knowledge of React, TypeScript, and Figma Plugin API

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/kocheck/Lazy-Export.git
cd Lazy-Export

# Install dependencies
npm install

# Build the plugin
npm run build

# Development mode (watch)
npm run dev
```

### Testing in Figma

1. Open Figma Desktop
2. Go to **Plugins → Development → Import plugin from manifest**
3. Select `dist/manifest.json` from this repository
4. Run **Plugins → Lazy Export**

---

## 🔧 Development Workflow

### Build Commands

```bash
# Production build (optimized)
npm run build

# Development build with watch mode
npm run dev

# Build plugin code only
npm run build:plugin
```

### Project Structure

```
lazy-export/
├── src/
│   ├── ui/              # React UI (rendered in iframe)
│   │   ├── App.tsx      # Main app component
│   │   ├── main.tsx     # React entry point
│   │   ├── components/  # Reusable UI components
│   │   └── styles/      # Global CSS
│   ├── plugin/          # Figma plugin sandbox code
│   │   └── main.ts      # Plugin entry point
│   └── shared/          # Shared types & constants
│       ├── types.ts     # TypeScript definitions
│       └── presets.ts   # Default preset configs
├── dist/                # Build output (gitignored)
│   ├── code.js         # Compiled plugin
│   ├── index.html      # UI bundle
│   └── manifest.json   # Figma manifest
├── vite.config.ts      # Vite configuration
├── build-plugin.js     # esbuild script for plugin
└── tsconfig.json       # TypeScript config
```

---

## 🏗️ Architecture Overview

### Communication Pattern

The plugin uses a **message-passing architecture** between UI and plugin:

```
┌─────────────────┐         postMessage         ┌──────────────────┐
│   React UI      │ ──────────────────────────→ │  Plugin Sandbox  │
│  (iframe/DOM)   │                              │  (Figma API)     │
│                 │ ←────────────────────────── │                  │
└─────────────────┘    figma.ui.postMessage     └──────────────────┘
```

**Message Types:**
- `UI → Plugin`: Apply preset, save preset, delete preset, clear export
- `Plugin → UI`: Selection changed, preferences loaded, success/error notifications

### Data Flow

```
User Action
    ↓
React Component Handler
    ↓
UIMessage created
    ↓
postMessage to Plugin
    ↓
Plugin processes (Figma API)
    ↓
figma.clientStorage (persistence)
    ↓
PluginMessage back to UI
    ↓
React State Update
    ↓
UI Re-renders
```

### Key Files Explained

#### **src/shared/types.ts**
- Defines all TypeScript interfaces
- Ensures type safety across UI and plugin
- Single source of truth for data structures

#### **src/shared/presets.ts**
- Contains default preset configurations
- Easy to add new default presets here

#### **src/plugin/main.ts**
- Handles all Figma API interactions
- Manages client storage (persistence)
- Applies export settings to nodes
- Generates metadata (iOS Contents.json)

#### **src/ui/App.tsx**
- Main React component
- State management
- Message handling
- Orchestrates UI flow

---

## 🎨 Code Style

### TypeScript

- **Strict mode enabled** - No implicit any, strict null checks
- **Explicit return types** for functions
- **Interface over type** for object shapes
- **Descriptive names** - No abbreviations

**Good:**
```typescript
function applyExportSettings(
  nodes: readonly SceneNode[],
  settings: ExportSetting[]
): void {
  // Implementation
}
```

**Bad:**
```typescript
function apply(n, s) {
  // Implementation
}
```

### React

- **Functional components** with hooks (no class components)
- **TypeScript for props** - Always define prop interfaces
- **CSS Modules** for component-specific styles
- **Controlled components** for forms

**Component Template:**
```typescript
import React from 'react';
import './MyComponent.css';

interface MyComponentProps {
  title: string;
  onClick: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onClick }) => {
  return (
    <button className="my-component" onClick={onClick}>
      {title}
    </button>
  );
};
```

### CSS

- **Use Figma CSS variables** for all colors/spacing
- **BEM naming convention** for classes
- **Mobile-first** approach (though plugin is fixed-width)
- **Avoid magic numbers** - use CSS variables

**Good:**
```css
.preset-card {
  background-color: var(--figma-color-bg);
  border: 1px solid var(--figma-color-border);
  padding: 12px;
}

.preset-card:hover {
  background-color: var(--figma-color-bg-hover);
}
```

**Bad:**
```css
.card {
  background: #fff;
  border: 1px solid #e5e5e5;
  padding: 12px;
}
```

---

## 🧪 Testing

### Manual Testing Checklist

Before submitting a PR, test these scenarios:

**Basic Functionality:**
- [ ] Select a layer → Click preset → Verify export settings applied
- [ ] Try all 4 default presets (iOS, Android, Web, PDF)
- [ ] Custom name input → Verify suffix applied correctly
- [ ] Advanced mode → Verify folder structure in export names
- [ ] Clear export → Verify settings removed

**Custom Presets:**
- [ ] Create custom preset → Verify saved
- [ ] Edit custom preset → Verify changes persist
- [ ] Delete custom preset → Verify removed
- [ ] Reopen plugin → Verify presets persisted

**Edge Cases:**
- [ ] No selection → Verify buttons disabled
- [ ] Empty custom name → Verify default used
- [ ] Special characters in name → Verify handled
- [ ] Multiple layers selected → Verify all updated

**UI/UX:**
- [ ] Test in Light Mode
- [ ] Test in Dark Mode
- [ ] Hover interactions work
- [ ] Modal opens/closes correctly
- [ ] Forms validate properly

### Future: Automated Testing

We plan to add:
- Unit tests with Jest
- Component tests with React Testing Library
- E2E tests with Figma Plugin API mocks

---

## 🔄 Pull Request Process

### Before Submitting

1. **Test thoroughly** using the checklist above
2. **Update documentation** if needed (README, CHANGELOG)
3. **Follow commit conventions** (see below)
4. **Build successfully** with `npm run build`
5. **No TypeScript errors** - Check with `tsc --noEmit`

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Build process, dependencies

**Examples:**
```
feat(presets): Add JPG export format option

Added support for JPG exports with quality settings.
Users can now create presets with JPG at various quality levels.

Closes #42
```

```
fix(ui): Prevent modal from closing on backdrop click during form edit

Modal was closing accidentally when users clicked outside while editing.
Now only closes on explicit Cancel/X button or Escape key.
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested this change.

## Screenshots (if UI change)
Before/after screenshots or GIFs.

## Checklist
- [ ] Tested in Figma Desktop
- [ ] Tested in Light and Dark mode
- [ ] Updated documentation
- [ ] No TypeScript errors
- [ ] Follows code style guidelines
```

---

## 🤖 For AI Agents

### Quick Context

**What is this?**
A Figma plugin that lets users apply export settings to layers with one click. Think "presets for Figma's export panel."

**Tech Stack:**
- React 18 + TypeScript 5 (UI)
- Figma Plugin API v1.0.0 (Plugin)
- Vite 7 (Build)
- CSS with Figma UI3 variables (Styling)

### Key Constraints

1. **No DOM APIs in plugin code** - Plugin runs in a sandbox without DOM access
2. **postMessage for communication** - UI and plugin can only talk via messages
3. **Figma CSS variables required** - For Dark Mode support
4. **Bundle size matters** - Keep UI bundle under 200kb

### Common Tasks

**Add a new default preset:**
1. Edit `src/shared/presets.ts`
2. Add new preset object to `DEFAULT_PRESETS` array
3. Follow existing structure

**Add a new export format:**
1. Update `ExportFormat` type in `src/shared/types.ts`
2. Update PresetCreator form in `src/ui/components/PresetCreator.tsx`
3. Handle in plugin logic if special processing needed

**Add a new UI component:**
1. Create `src/ui/components/ComponentName.tsx`
2. Create `src/ui/components/ComponentName.css`
3. Export from component file
4. Import in `App.tsx` or parent component

**Modify message types:**
1. Update types in `src/shared/types.ts`
2. Update sender in `src/ui/App.tsx`
3. Update handler in `src/plugin/main.ts`

### Architecture Patterns to Follow

**State Management:**
- Use React hooks (`useState`, `useEffect`)
- Keep state in `App.tsx`, pass down as props
- Lift state up when needed

**Styling:**
- One CSS file per component
- Use BEM naming (e.g., `component__element--modifier`)
- Always use `var(--figma-color-*)` for colors

**Type Safety:**
- Never use `any` - Use `unknown` and type guards
- Define interfaces for all props
- Use discriminated unions for messages

**Error Handling:**
- Validate user input before sending to plugin
- Use try/catch in plugin for Figma API calls
- Show user-friendly error messages

### Files You'll Modify Most

| Task | Files to Edit |
|------|---------------|
| Add preset | `src/shared/presets.ts` |
| Change UI | `src/ui/App.tsx`, `src/ui/components/*.tsx` |
| Modify logic | `src/plugin/main.ts` |
| Update types | `src/shared/types.ts` |
| Style changes | `src/ui/**/*.css` |

### Common Gotchas

1. **Don't access `figma` object in UI code** - It doesn't exist there
2. **Don't access `window` in plugin code** - It doesn't exist there
3. **Always rebuild after changes** - Vite won't auto-reload the plugin
4. **Manifest changes require plugin reload** - Update in Figma UI
5. **clientStorage is async** - Use `await` when accessing

---

## 📚 Resources

- [Figma Plugin API Docs](https://www.figma.com/plugin-docs/)
- [Figma UI3 Design](https://www.figma.com/community/file/928108847914589057)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 💬 Questions?

- Open an issue on GitHub
- Check existing issues/PRs for similar questions
- Read the architecture docs (ARCHITECTURE.md)

---

**Happy coding! 🚀**
