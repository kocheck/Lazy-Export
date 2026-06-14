# 012 — Preset import/export — build

> **Planned at:** `bc89585`, 2026-06-14
> **For the executor:** This is a self-contained handoff plan. You have zero prior context.
> All design decisions (JSON format, merge policy, iframe UX) are fixed in
> `docs/preset-import-export-design.md`. Do NOT re-decide them here. Implement task-by-task,
> in order. Steps use checkbox (`- [ ]`) syntax — check them as you go.

**Goal:** Implement the preset import/export feature as fully designed in plan 011. Let users
export all custom presets to a JSON blob (textarea copy) and import a JSON blob from a teammate
or another file, merging into `clientStorage`.

**Effort:** M · **Depends on:** 001 (green baseline), 011 (design doc in `docs/preset-import-export-design.md`).

**Resolve §7 open questions with the operator before starting this plan.** The five open questions
(selective import, overwrite option, suggested filename, default-preset export, version migration
ownership) are listed in `docs/preset-import-export-design.md §7`.

---

## Handoff conventions (read first)

- **Base branch:** branch from `review-lazy-export-plan` (or the 011 branch if not yet merged).
  Create `advisor/012-preset-import-export-build`. PRs target `origin/production`. Do **not**
  commit to `production`; do **not** push or open a PR unless the operator says so.
- **Commits:** one commit per logical step; sentence-case imperative messages.
- **Drift check first:** before editing, run
  `git diff --stat 082adbb..HEAD -- src/shared/types.ts src/plugin/core.ts src/ui/App.tsx`
  and confirm the "Current state" sections below match live files.
- **STOP if:** a "Current state" excerpt no longer matches HEAD; a gate fails twice after a
  reasonable fix; a file outside **In scope** must change; unexpected `dist/` churn appears.
- **Core.ts note (critical):** Plan 008 moved all message-handling logic from `src/plugin/main.ts`
  into `src/plugin/core.ts`. The `figma.ui.onmessage` switch lives in `handleUIMessage()` in
  `core.ts`. `main.ts` is now just a 2-line shim. **All new `case` blocks go in `core.ts`.**

## Tracked-`dist/` artifact policy

`dist/code.js`, `dist/index.html`, `dist/manifest.json` are committed.
- **This plan changes `src/**`**, so it must run `npm run build`, commit the regenerated `dist/`
  files, and verify a second `npm run build` yields no further diff.

---

## Current state (verify before editing)

`PresetExportFile` is already stubbed in `src/shared/types.ts` (landed in plan 011). The
existing `UIMessage` union and `PluginMessage` union in `src/shared/types.ts` do **not** yet
have `export-presets`, `import-presets`, `presets-exported`, or `presets-imported` variants.

`handleUIMessage()` in `src/plugin/core.ts` already has `save-preset` and `delete-preset`
cases (around lines 242–285) — the new cases mirror that pattern.

`src/ui/utils/clipboard.ts` has `copyToClipboard()` using `document.execCommand('copy')`.
**Reuse this util for the export Copy button.** Do not use `navigator.clipboard`.

---

## In scope (only these files may change)

- `src/shared/types.ts` — add `export-presets` / `import-presets` UIMessage variants; add
  `presets-exported` / `presets-imported` PluginMessage variants; reuse existing `PresetExportFile`
- `src/plugin/core.ts` — two new `case` blocks in `handleUIMessage()`:
  - `'export-presets'`: build file object, serialise, reply `presets-exported`
  - `'import-presets'`: parse, validate, merge-by-id (rename-with-new-id policy), persist, reply
    `presets-imported` + fresh `preferences-loaded`
- `src/ui/App.tsx` — "Import / Export" section opening a `Modal` with two textareas
- `src/ui/components/` — new `ImportExportModal.tsx` (or equivalent) with export and import UI
- `src/ui/utils/clipboard.ts` — **reuse only**, no changes unless a bug is found
- `src/test/` — new test file(s) for the plugin-side logic
- `dist/` — rebuilt after all source changes

---

## Tasks

### Task 1: Add message variants to the type unions

**File:** `src/shared/types.ts`

- [ ] Add to `UIMessage` union:
  ```ts
  | { type: 'export-presets' }
  | { type: 'import-presets'; json: string }
  ```
- [ ] Add to `PluginMessage` union:
  ```ts
  | { type: 'presets-exported'; json: string }
  | { type: 'presets-imported'; summary: ImportSummary }
  ```
- [ ] Add the `ImportSummary` interface (or inline type alias):
  ```ts
  export interface ImportSummary {
    added: number;
    renamed: number;
    skipped: number;
    overwritten: number;
    invalid: number;
  }
  ```
- [ ] `npx tsc --noEmit` → exit 0
- [ ] Commit: `"Add export-presets/import-presets message variants to type unions"`

### Task 2: Plugin export case

**File:** `src/plugin/core.ts`

- [ ] In `handleUIMessage()`, add a `case 'export-presets':` block:
  1. Load current preferences via `loadPreferences()`.
  2. Filter `customPresets` to `isCustom === true` (defensive; all should be).
  3. Build `PresetExportFile`: `{ format: 'lazy-export-presets', version: 1, exportedAt: Date.now(), presets }`.
  4. Serialise: `JSON.stringify(file, null, 2)`.
  5. Reply: `figma.ui.postMessage({ type: 'presets-exported', json })`.
- [ ] `npx tsc --noEmit` → exit 0
- [ ] Commit: `"Add export-presets case to handleUIMessage in core.ts"`

### Task 3: Plugin import case (validation + merge + summary)

**File:** `src/plugin/core.ts`

Implement `case 'import-presets':` following the design in `docs/preset-import-export-design.md §3` and `§6`:

- [ ] Parse inside `try/catch`; on error reply `{ type: 'error', message: 'Invalid JSON — …' }` and return.
- [ ] Validate `format` and `version`; reject (via error PluginMessage) if wrong.
- [ ] For each entry in `parsed.presets`, validate shape (`id`, `name`, `platform`, `settings`, `isCustom`); invalid entries increment `summary.invalid`, not fatal.
- [ ] Merge valid entries into `preferences.customPresets` using **rename-with-new-id** on collision:
  - If `id` already exists (including intra-file duplicates), assign `id = \`custom-${Date.now()}-${rand}\`` and append `" (imported)"` to `name`; increment `summary.renamed`.
  - Otherwise add as-is; increment `summary.added`.
- [ ] Persist via `savePreferences`.
- [ ] Reply `{ type: 'presets-imported', summary }`.
- [ ] Post fresh `{ type: 'preferences-loaded', preferences: updatedPreferences }`.
- [ ] `npx tsc --noEmit` → exit 0
- [ ] Commit: `"Add import-presets case: validate, merge-by-id, persist, reply summary"`

### Task 4: UI export textarea + Copy button

**Files:** `src/ui/App.tsx`, new modal component

- [ ] Create `src/ui/components/ImportExportModal.tsx` (or similar) with an export tab/section:
  - Read-only `<textarea>` to display the JSON.
  - **"Copy"** button calls `copyToClipboard(json)` from `src/ui/utils/clipboard.ts`.
  - **"Export Presets"** button posts `{ type: 'export-presets' }`.
  - On receiving `presets-exported`, set the textarea value to `msg.json`.
- [ ] Wire a `Modal` trigger in `src/ui/App.tsx` near the "Create Custom Preset" section.
- [ ] `npx tsc --noEmit` → exit 0
- [ ] Commit: `"Add export presets textarea UI with Copy button"`

### Task 5: UI import textarea + Import button + summary toast

**File:** `src/ui/components/ImportExportModal.tsx` (continued)

- [ ] Add an import tab/section to the modal:
  - Editable `<textarea>` with placeholder "Paste your preset JSON here".
  - **"Import"** button posts `{ type: 'import-presets', json: textarea.value }`.
  - On receiving `presets-imported`, show a toast: `"Imported N presets (M renamed)"` (or similar using existing toast component).
- [ ] `npx tsc --noEmit` → exit 0
- [ ] Commit: `"Add import presets textarea UI and summary toast"`

### Task 6: Tests

**File:** `src/test/` (new file, e.g. `importExport.test.ts`)

Cover at minimum:

- [ ] Serialisation: `export-presets` case builds a valid `PresetExportFile` with all custom presets.
- [ ] `rename-with-new-id` collision branch: importing a preset with a duplicate id produces a renamed entry and increments `summary.renamed`.
- [ ] `skip` / `overwrite` branches if exposed (at least document the test anchor).
- [ ] Invalid-blob rejection: malformed JSON, wrong `format`, unknown `version`, each returns an error message.
- [ ] Per-entry validation: a preset missing `id` or with unknown `platform` is counted as `invalid` and skipped.
- [ ] Intra-file deduplication: two entries with the same `id` in one import file.
- [ ] `npx vitest run` → all green (no regressions)
- [ ] Commit: `"Add tests for preset import/export: serialise, merge, validation"`

### Task 7: Rebuild and commit dist

- [ ] `npm run build`
- [ ] `git status --porcelain dist` — should show `dist/code.js` and `dist/index.html` modified.
- [ ] Run `npm run build` a second time and confirm `git status --porcelain dist` shows no further changes.
- [ ] Commit: `"Rebuild dist for preset import/export feature"`

### Task 8: Update plans index

**File:** `plans/README.md`

- [ ] Set row 012 Status from `PLANNED` to `DONE`.
- [ ] Commit: `"Mark plan 012 done in the plans index"`

---

## Done criteria

- [ ] `npx tsc --noEmit` → exit 0, no output.
- [ ] `npx vitest run` → all green including new merge/validation tests; no regressions.
- [ ] Three collision branches covered by tests (rename-with-new-id at minimum; skip/overwrite if exposed in UI).
- [ ] `dist/` rebuilt and a second `npm run build` produces no further diff.
- [ ] `plans/README.md` row 012 set to `DONE`.

---

## Design decisions (fixed — do not re-decide)

All format, merge, UX, and validation decisions are documented in
`docs/preset-import-export-design.md`. Do not re-decide:

- JSON file format (§2): `{ format, version, exportedAt, presets[] }`.
- Merge policy (§3): rename-with-new-id by default.
- iframe UX (§5): textarea copy/paste; reuse `clipboard.ts`; no file picker.
- Validation rules (§6): per-blob and per-entry checks.

Resolve any §7 open question with the operator before touching implementation.

---

## STOP conditions (plan-specific)

- Any "Current state" excerpt no longer matches HEAD (drift) → STOP.
- `npx tsc --noEmit` or `npx vitest run` not green before you start → STOP; ensure 001 and 011 landed.
- Any `dist/` change appears before Task 7 → STOP.
- A new case block ends up in `src/plugin/main.ts` instead of `src/plugin/core.ts` → STOP and move it.
- The design appears to require changing `src/ui/utils/clipboard.ts` beyond reuse → STOP; it is out of scope.
