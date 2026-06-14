# 011 — Preset import/export — design spike (JSON format + conflict rules + iframe UX)

> **Planned at:** `082adbb`, 2026-06-14
> **For the executor:** This is a self-contained handoff plan. You have zero prior context.
> Implement task-by-task, in order. Steps use checkbox (`- [ ]`) syntax — check them as you go.

**Goal:** Produce a **design document** that fully answers *how* the plugin would let users
export their custom presets to JSON and import them back — the file format, the
conflict/merge rules on import, the new UIMessages, and the download/upload UX inside Figma's
restricted iframe. Then write a **follow-up build-plan stub** (`plans/012-…`) and an
**open-questions list** for the maintainer.

**This is a SPIKE / DESIGN plan, not a build-everything plan.** You are **not** implementing
the import/export feature. You are deciding and writing down the design so a later build plan
(012) can execute it without re-deciding anything. The only deliverables are Markdown docs
(and, optionally, one tiny type stub — see the explicit exception below).

**Why:** Direction **D2** in the audit. `CustomPreset` is already fully JSON-serializable
(`src/shared/types.ts:29-32` — plain fields: `id`, `name`, `platform`, `icon?`, `settings[]`,
`generateMetadata?`, `directoryStructure?`, `isCustom: true`, `createdAt: number`), so
import/export is feasible; what's missing is a *decided* file format, merge policy, and an
iframe-safe transport. This spike removes that ambiguity before any code is written.

**Effort:** M · **Depends on:** **001** (a green baseline — `tsc` 0 / tests green — must exist
so the optional type stub, if taken, doesn't land on a red repo).

**In scope (only these files may change):**
- `docs/preset-import-export-design.md` (create — the main deliverable)
- `plans/012-preset-import-export-build.md` (create — the follow-up build-plan stub)
- `plans/README.md` (add a row for 012; set row 011 to `DONE` — index edits only)
- **Optional, only if you choose the documented exception below:** `src/shared/types.ts`
  (add a single exported `PresetExportFile` interface — types only, no runtime code)

**Out of scope (do NOT do in this plan):**
- Do **not** implement export or import behavior anywhere (`src/ui/**`, `src/plugin/main.ts`,
  components, clipboard util).
- Do **not** add the new UIMessages to the `UIMessage`/`PluginMessage` unions — only *describe*
  them in the doc (012 adds them).
- Do **not** change `src/ui/utils/clipboard.ts` (the `execCommand` approach is the deliberate
  Figma-iframe choice and the design must *reuse* it).

---

## Handoff conventions (read first)

- **Base branch:** branch from `review-lazy-export-plan`. Create
  `advisor/011-preset-import-export-spike`. PRs target `origin/production`. Do **not** commit to
  `production`; do **not** push or open a PR unless the operator says so.
- **Commits:** one commit per logical step; sentence-case imperative messages (match `git log`,
  e.g. "Add preset import/export design doc").
- **Drift check first:** run
  `git diff --stat 082adbb..HEAD -- src/shared/types.ts src/ui/utils/clipboard.ts src/plugin/main.ts plans/README.md`
  and compare the "Current state" excerpts below to the live files. If they differ, STOP.
- **STOP if:** an excerpt no longer matches HEAD; a gate fails twice after a reasonable fix; a
  file outside **In scope** must change; unexpected `dist/` churn appears.
- **Path note:** the plugin entry is `src/plugin/main.ts`; shared types `src/shared/types.ts`;
  clipboard util `src/ui/utils/clipboard.ts`; UI root `src/ui/App.tsx`.

## Tracked-`dist/` artifact policy (this plan)

`dist/code.js`, `dist/index.html`, `dist/manifest.json` are committed.
- **This is a docs-only plan.** It must produce **no `dist/` changes**: after all tasks,
  `git status --porcelain dist` must be **empty**.
- **The one exception:** if you take the optional type-stub (Task 4), it adds a *type-only*
  `interface` to `src/shared/types.ts`. Interfaces are erased at compile time and emit **no**
  JavaScript, so even then `dist/` stays clean (verified by a `git status` check in Task 4). If
  any `dist/` file shows as modified after the stub, **STOP** — something else was changed.

---

## Current state (verified at 082adbb)

`CustomPreset` is fully serializable (`src/shared/types.ts:7-32`):

```ts
export interface ExportSetting {
  format: ExportFormat;            // 'PNG' | 'JPG' | 'SVG' | 'PDF'
  suffix?: string;
  constraint?: { type: 'SCALE' | 'WIDTH' | 'HEIGHT'; value: number };
  svgOutlineText?: boolean;
  svgIdAttribute?: boolean;
  svgSimplifyStroke?: boolean;
}

export interface PresetConfig {
  id: string;
  name: string;
  platform: Platform;              // 'iOS' | 'Android' | 'Web' | 'PDF'
  icon?: string;
  settings: ExportSetting[];
  generateMetadata?: boolean;
  directoryStructure?: boolean;
}

export interface CustomPreset extends PresetConfig {
  isCustom: true;
  createdAt: number;
}
```

Custom presets are persisted in the plugin sandbox via `figma.clientStorage`
(`src/plugin/main.ts:49-66`, key `'preferences'`, shape `SavedPreferences.customPresets`).
Save/delete are handled by the `save-preset` / `delete-preset` message cases
(`src/plugin/main.ts:330-365`): `save-preset` upserts by `id`; `delete-preset` filters by `id`.
The UI manages presets in `src/ui/App.tsx` — `savePreset`/`deletePreset` post messages and
optimistically update `preferences.customPresets`. There is **no** export/import path today.

The **clipboard is restricted** in Figma's iframe. The existing util
(`src/ui/utils/clipboard.ts`) deliberately uses `document.execCommand('copy')` against a hidden
`<textarea>` (not `navigator.clipboard`, which is blocked):

```ts
const textarea = document.createElement('textarea');
textarea.value = text;
textarea.style.position = 'fixed';
textarea.style.opacity = '0';
document.body.appendChild(textarea);
textarea.select();
const success = document.execCommand('copy');   // ← the iframe-safe path
```

There is **no** `docs/` directory in the repo yet (the design doc creates the first one);
`plans/README.md` lists plans 001–011 with no row for 012.

---

## Tasks

### Task 1: Create the design doc skeleton

**Files:** Create `docs/preset-import-export-design.md`.

- [ ] **Step 1:** Create the `docs/` directory and the file with this exact top-level outline
  (you fill the sections in Tasks 2–3; create the headings now so the structure is fixed):
```markdown
# Preset Import/Export — Design (D2 spike)

> Status: design only. Build plan: `plans/012-preset-import-export-build.md`.
> Planned at: 082adbb, 2026-06-14.

## 1. Goal & non-goals
## 2. JSON file format (with `version`)
## 3. Conflict / merge rules on import
## 4. Messages & responsibilities (UI ↔ plugin)
## 5. Download / upload UX inside Figma's iframe
## 6. Validation & error handling
## 7. Open questions for the maintainer
## 8. Follow-up build plan (012) summary
```
- [ ] **Step 2:** Under **`## 1. Goal & non-goals`**, write:
  - Goal: let a user export all their custom presets to a JSON blob and import a JSON blob from
    another file/teammate, merging into `clientStorage` (`SavedPreferences.customPresets`).
  - Non-goals (call out explicitly): no cloud sync; no sharing of *default* presets (only
    `isCustom` presets are exported); no per-preset selective export in v1 (export-all only —
    note selective export as a possible v2 in §7).
- [ ] **Step 3:** Commit.
```bash
git add docs/preset-import-export-design.md
git commit -m "Add preset import/export design doc skeleton"
```

### Task 2: Define the JSON file format and the conflict/merge rules

**Files:** `docs/preset-import-export-design.md`

- [ ] **Step 1 — §2 JSON file format:** Specify and write down this concrete shape, with a
  **`version` field for forward-compat**, and explain each field:
```jsonc
{
  "format": "lazy-export-presets",   // magic string, lets import reject unrelated JSON
  "version": 1,                       // schema version; bump on breaking changes
  "exportedAt": 1718323200000,        // epoch ms, informational only
  "presets": [                        // array of CustomPreset (exactly the stored shape)
    {
      "id": "custom-1718000000000",
      "name": "My iOS set",
      "platform": "iOS",
      "settings": [{ "format": "PNG", "suffix": "@2x", "constraint": { "type": "SCALE", "value": 2 } }],
      "generateMetadata": true,
      "directoryStructure": true,
      "isCustom": true,
      "createdAt": 1718000000000
    }
  ]
}
```
  Document the rules:
  - `presets[]` entries are exactly `CustomPreset` (`src/shared/types.ts:29-32`) — no extra
    wrapping. This keeps export = `JSON.stringify({ format, version, exportedAt, presets })`
    and the heavy lifting reusable.
  - `format` and `version` are **required**; import must reject a blob missing/ mismatching
    `format`, and must handle `version` it doesn't recognize (see §6).
  - **Forward-compat rule:** an importer at `version: 1` reading a future `version: 2` blob
    should refuse with a clear message ("This preset file was made by a newer version of Lazy
    Export"), rather than silently dropping fields. Document a migration hook location for when
    `version: 2` exists.
- [ ] **Step 2 — §3 conflict/merge rules:** Specify the **dedupe-by-`id`** policy and the
  collision options, then **recommend one**:
  - **Dedupe key:** `CustomPreset.id`.
  - Collision (an imported preset's `id` already exists in `customPresets`) options:
    1. **skip** — keep the existing preset, ignore the imported one.
    2. **overwrite** — replace the existing preset with the imported one.
    3. **rename-with-new-id** — keep both: assign the imported preset a fresh `id`
       (e.g. `custom-${Date.now()}-${rand}`) and a disambiguated `name` (e.g. append
       `" (imported)"`), then add it.
  - **Recommendation (state it plainly and justify):** default to **rename-with-new-id** because
    it is non-destructive (never silently loses a user's existing preset and never silently
    discards the imported one). Note that **overwrite** could be offered later as an explicit
    "Replace existing" option, and document why **skip** is a poor silent default (the user
    pasted a file expecting *something* to import).
  - Also specify **intra-file dedupe**: if the imported `presets[]` contains two entries with the
    same `id`, treat the second as a collision against the first under the same policy.
  - Specify the **import result summary** the plugin should report back: counts of
    `{ added, renamed, skipped, overwritten, invalid }` so the UI can show "Imported 3 presets
    (1 renamed)".
- [ ] **Step 2b — §6 validation & error handling:** While the rules are fresh, fill §6:
  - Import must `JSON.parse` inside try/catch and reject malformed JSON with a user-facing
    message (no crash).
  - Validate each preset is shaped like `CustomPreset` (has `id`, `name` string, `platform` in
    the allowed set, `settings` is an array, `isCustom === true`). Invalid entries are counted as
    `invalid` and skipped, not fatal.
  - Reject the whole blob if `format !== "lazy-export-presets"` or `version` is unknown.
  - Note: validation must live where the data is trusted — i.e. defensively in the **plugin**
    handler (it writes `clientStorage`), even if the UI also pre-validates.
- [ ] **Step 3:** Commit.
```bash
git add docs/preset-import-export-design.md
git commit -m "Specify preset JSON format, version, and import merge rules"
```

### Task 3: Define the messages, responsibilities, and the iframe UX

**Files:** `docs/preset-import-export-design.md`

- [ ] **Step 1 — §4 messages & responsibilities:** Document the **new UIMessages that 012 would
  add** (describe them; do NOT add them to the union in this plan):
  - **Export:** UI → plugin `{ type: 'export-presets' }`; plugin reads
    `preferences.customPresets`, builds the file object (§2), and replies to UI with a new
    PluginMessage `{ type: 'presets-exported'; json: string }`. (The plugin owns the data, so it
    builds the JSON; the UI owns the DOM, so it does the clipboard/textarea transport — see §5.)
  - **Import:** UI → plugin `{ type: 'import-presets'; json: string }` (the raw text the user
    pasted); plugin parses, validates (§6), merges per §3, persists via `savePreferences`, and
    replies `{ type: 'presets-imported'; summary: { added; renamed; skipped; overwritten; invalid } }`
    plus a fresh `preferences-loaded` so the UI re-renders the merged list.
  - Spell out the responsibility split in a small table: **UI** = render textareas, copy via
    `execCommand`, post raw text; **plugin** = serialize, parse, validate, merge, persist.
  - Note the plumbing requirement for 012: each new variant must be added to the `UIMessage` /
    `PluginMessage` discriminated unions (`src/shared/types.ts:41-86`) **and** get a matching
    `case` in the plugin `figma.ui.onmessage` switch (`src/plugin/main.ts:310-379`), mirroring
    the existing `save-preset` / `delete-preset` cases.
- [ ] **Step 2 — §5 download/upload UX (the iframe constraints):** Document explicitly:
  - **Constraint:** Figma plugin UI runs in a sandboxed `<iframe>`. The **File System Access
    API is unavailable**; `navigator.clipboard` is **restricted/blocked**; a true file
    download/`<input type="file">` upload is unreliable. Therefore the transport is **text**,
    not files.
  - **Export UX (recommended):** plugin sends the JSON string → UI shows it in a read-only
    `<textarea>` with a **"Copy"** button that calls the existing
    `copyToClipboard()` (`src/ui/utils/clipboard.ts`, the `execCommand('copy')` path). The user
    pastes it into a file/Slack/etc. manually. (Reusing the existing util is mandatory — do not
    reach for `navigator.clipboard`.)
  - **Import UX (recommended):** UI shows an empty `<textarea>`; the user **pastes** the JSON;
    an **"Import"** button posts `{ type: 'import-presets', json }`. No file picker.
  - Document the rejected alternatives and *why*: `navigator.clipboard.writeText` (blocked in
    iframe), `<a download>` / Blob URLs (unreliable in the sandbox), File System Access API
    (not exposed). This makes the textarea choice defensible rather than arbitrary.
  - Sketch where the UI lives: a small "Manage presets" affordance (e.g. an "Import / Export"
    section near "Create Custom Preset" in `src/ui/App.tsx`), opening a `Modal` with the two
    textareas. (Describe only — 012 builds it.)
- [ ] **Step 3:** Commit.
```bash
git add docs/preset-import-export-design.md
git commit -m "Document import/export messages and iframe-safe textarea UX"
```

### Task 4 (OPTIONAL — the only allowed src change): land the type stub

> Skip this task entirely if you prefer a pure docs change (then `src/` is untouched). If you do
> it, it is the **only** edit to `src/**` in this plan and must be type-only.

**Files:** `src/shared/types.ts`

- [ ] **Step 1:** Add a single exported, type-only interface for the export file shape so 012
  has a referenceable contract. Append after the `SavedPreferences` interface (around
  `src/shared/types.ts:38`):
```ts
/**
 * Shape of an exported preset file (D2). Design: docs/preset-import-export-design.md.
 * Type-only stub — no runtime export/import logic lands until plan 012.
 */
export interface PresetExportFile {
  format: 'lazy-export-presets';
  version: 1;
  exportedAt: number;
  presets: CustomPreset[];
}
```
- [ ] **Step 2:** Verify it compiles and emits no JS (interfaces are erased).
```bash
npx tsc --noEmit            # expect exit 0, no output
npm run build               # rebuild
git status --porcelain dist # expect EMPTY (no dist change from a type-only stub)
```
  If `dist/` shows any change, **STOP and revert** — a type-only interface must not alter the
  bundle, so something else changed.
- [ ] **Step 3:** Reference the new type from §2 of the design doc (one line: "The export file
  shape is captured as the `PresetExportFile` type in `src/shared/types.ts`."), then commit both.
```bash
git add src/shared/types.ts docs/preset-import-export-design.md
git commit -m "Add PresetExportFile type stub for the import/export design"
```

### Task 5: Write the follow-up build-plan stub (012) and open questions

**Files:** Create `plans/012-preset-import-export-build.md`; edit `docs/preset-import-export-design.md` (§7, §8).

- [ ] **Step 1 — §7 open questions** in the design doc: list the decisions you deliberately left
  to the maintainer, e.g.:
  - Should import offer **selective** (per-preset) merge, or always merge-all?
  - Should **overwrite** be a user-selectable option in v1, or is rename-only enough?
  - Should export include a **human-readable name in the suggested filename** even though there's
    no real file download (e.g. shown as guidance text)?
  - Do we ever want to export **default** presets that a user has edited, or strictly `isCustom`?
  - Versioning: who owns bumping `version` and writing migrations when the `CustomPreset` shape
    changes (ties to plans 005/010 which touch preset fields)?
- [ ] **Step 2 — §8** in the design doc: a 5–8 line summary of what 012 will build, pointing at
  the new plan file.
- [ ] **Step 3:** Create `plans/012-preset-import-export-build.md` as a **stub** (a real,
  self-contained skeleton that 012's executor will flesh out — not a placeholder). Use the same
  header/format as this plan and include at minimum:
  - Header `> **Planned at:** ...` block (copy the format from this file).
  - `**Effort:** M · **Depends on:** 001, 011 (the design doc).`
  - **In scope:** `src/shared/types.ts` (add `export-presets`/`import-presets` UIMessages +
    `presets-exported`/`presets-imported` PluginMessages + reuse `PresetExportFile`),
    `src/plugin/main.ts` (two new `case` blocks: build/serialize on export; parse + validate +
    merge-by-id + persist on import), `src/ui/App.tsx` + a new import/export UI (Modal with two
    textareas), reuse `src/ui/utils/clipboard.ts`, tests, and rebuilt `dist/` per the dist policy.
  - **Tasks (named, not detailed):** (1) add the message variants to the unions; (2) plugin
    export case; (3) plugin import case (validation + merge per §3 + summary); (4) UI export
    textarea + Copy; (5) UI import textarea + Import + summary toast; (6) tests for serialize /
    parse / each collision branch (skip/overwrite/rename) / invalid-blob; (7) rebuild + commit
    `dist/`; (8) set README row 012 to DONE.
  - **Done criteria:** `tsc` 0, `vitest run` green incl. the new merge tests, `dist/` rebuilt
    and second build clean, the three collision branches covered.
  - A pointer: "Design decisions are fixed in `docs/preset-import-export-design.md` — do not
    re-decide format/merge/UX; resolve any §7 open question with the operator first."
- [ ] **Step 4:** Commit.
```bash
git add docs/preset-import-export-design.md plans/012-preset-import-export-build.md
git commit -m "Add open questions and 012 build-plan stub for preset import/export"
```

### Task 6: Update the plans index

**Files:** `plans/README.md`

- [ ] **Step 1:** Add a status-table row for **012** directly under the 011 row:
```markdown
| [012](012-preset-import-export-build.md) | Preset import/export — build | D2 | M | 001, 011 | PLANNED |
```
- [ ] **Step 2:** Set the **011** row Status from `PLANNED` to `DONE`.
- [ ] **Step 3:** (Optional, keep tidy) add `011 ──── 012` under the dependency graph if it's
  easy; if the format doesn't fit cleanly, skip — the table row is the required edit.
- [ ] **Step 4:** Commit.
```bash
git add plans/README.md
git commit -m "Mark plan 011 done and add 012 to the plans index"
```

---

## Done criteria

- [ ] `docs/preset-import-export-design.md` exists and concretely answers:
  - the **JSON format** including a `version` field and the `{ format, version, exportedAt,
    presets }` shape (§2);
  - the **conflict/merge rules** — dedupe by `id`, the three collision options, with one
    **recommended** (rename-with-new-id) and a reported import summary (§3);
  - the **messages & responsibilities** (`export-presets` / `import-presets` + plugin/UI split,
    §4);
  - the **iframe-restricted download/upload UX** — explicitly: no File System Access, restricted
    clipboard, reuse `clipboard.ts`'s `execCommand` path, textarea-based copy/paste, with
    rejected alternatives named (§5);
  - **validation/error handling** (§6) and an **open-questions list** (§7).
- [ ] `plans/012-preset-import-export-build.md` exists as a self-contained build-plan stub that
  defers all design decisions to the doc.
- [ ] No failing gates introduced: `npx tsc --noEmit` → **exit 0**; `npx vitest run` →
  **unchanged green** (same pass count as after 001; this plan adds no tests).
- [ ] `git status --porcelain dist` is **empty** (docs-only; the optional type stub emits no JS).
- [ ] `plans/README.md` row 011 set to `DONE`; a row for 012 added.

## STOP conditions (plan-specific)

- A "Current state" excerpt no longer matches HEAD (drift) → STOP.
- `npx tsc --noEmit` or `npx vitest run` is **not** green *before* you start (this plan assumes
  001 landed a green baseline) → STOP; 001 must complete first.
- Any `dist/` file shows as modified at the end (including after the optional Task 4 type stub) →
  STOP and revert; a docs/type-only change must not alter the bundle.
- The design appears to require a behavior/runtime change to `src/**` to be writable → STOP; this
  is a design spike — capture it as an open question or defer to 012 instead of implementing it.
