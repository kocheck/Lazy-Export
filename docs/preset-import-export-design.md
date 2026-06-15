# Preset Import/Export — Design (D2 spike)

> Status: design only. Build plan: `plans/012-preset-import-export-build.md`.
> Planned at: 082adbb, 2026-06-14.

## 1. Goal & non-goals

**Goal:** Let a user export all their custom presets to a JSON blob and import a JSON blob from another file or teammate, merging the imported presets into `clientStorage` (the `SavedPreferences.customPresets` array). This enables sharing preset configurations between Figma files, team members, or devices without any cloud infrastructure.

**Non-goals (v1):**

- **No cloud sync.** Export is text-copy and import is text-paste; no remote storage or accounts.
- **Default presets are not exported.** Only presets where `isCustom === true` are included in the export. Shipping presets are defined in code and do not need to travel in a file.
- **No per-preset selective export in v1.** Export is all-or-nothing. Selective (per-preset) export is acknowledged as a useful v2 feature and noted in §7 as an open question.

## 2. JSON file format (with `version`)

The exported file is a JSON text string with the following top-level shape:

```jsonc
{
  "format": "lazy-export-presets",   // magic string — import rejects unrelated JSON
  "version": 1,                       // schema version; bump on breaking changes
  "exportedAt": 1718323200000,        // epoch ms, informational only
  "presets": [                        // array of PresetV1 (frozen v1 wire shape)
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

**Field rules:**

- `format` (required): the magic string `"lazy-export-presets"`. Import must reject any blob where `format` is absent or does not match this exact string.
- `version` (required): integer schema version, starting at `1`. See forward-compat rule below.
- `exportedAt` (informational): `Date.now()` at export time. Not used during import; helpful for debugging.
- `presets[]` (required): each entry is a `PresetV1` (`src/shared/types.ts`) — a frozen wire type that is intentionally **not** aliased to the runtime `CustomPreset`, so a future change to `CustomPreset`/`ExportSetting` cannot silently mutate the v1 on-disk contract (a new runtime shape gets a `PresetV2`). At v1 the two shapes are field-for-field identical, so serialization stays trivial: `JSON.stringify({ format, version, exportedAt, presets })`.

**Forward-compatibility rule:** An importer built against `version: 1` that receives a blob with `version: 2` (or any unknown version) must refuse with a clear, user-facing error message:

> "This preset file was made by a newer version of Lazy Export. Please upgrade the plugin before importing."

It must not silently drop unrecognised fields or partially import. When `version: 2` exists, a migration function should be placed alongside the import handler in `src/plugin/core.ts` and called before validation.

The export file shape is captured as the `PresetExportFile` type in `src/shared/types.ts`, whose `presets` field is `PresetV1[]` (the decoupled wire types `PresetV1`/`PresetV1Setting` live in the same file).

## 3. Conflict / merge rules on import

**Dedupe key:** `CustomPreset.id`.

When an imported preset's `id` already exists in the current `customPresets` array, that is a **collision**. There are three options:

| Option | Behaviour |
|--------|-----------|
| **skip** | Keep the existing preset; discard the imported one silently. |
| **overwrite** | Replace the existing preset with the imported one. |
| **rename-with-new-id** | Keep both: assign the imported preset a fresh `id` (e.g. `custom-${Date.now()}-${Math.random().toString(36).slice(2,7)}`) and a disambiguated name (e.g. append `" (imported)"`), then add it. |

**Recommendation: default to `rename-with-new-id`.**

Rationale:
- It is non-destructive: the user's existing preset is never silently lost, and the imported preset is never silently discarded.
- `skip` is a poor silent default because the user pasted a file expecting something to import — receiving no feedback or change is confusing.
- `overwrite` could cause data loss on mis-paste; it should only be offered as an explicit user-selected option in a future version.
- `rename-with-new-id` errs on the side of "keep everything visible" and surfaces the conflict by making the renamed entry obvious in the list.

`overwrite` may be offered in a later release as an opt-in "Replace existing" checkbox in the import UI.

**Intra-file dedupe:** If the imported `presets[]` array itself contains two entries with the same `id`, treat the second as a collision against the first under the same rename-with-new-id policy (the first entry from the file is treated as already-added).

**Import result summary:** After merging, the plugin must report back counts so the UI can display a human-readable summary (e.g. "Imported 3 presets (1 renamed)"):

```ts
{
  added: number;       // presets added without any collision
  renamed: number;     // presets kept but given a new id + "(imported)" suffix
  skipped: number;     // presets dropped due to collision (only relevant if skip policy used)
  overwritten: number; // presets that replaced an existing entry (only if overwrite used)
  invalid: number;     // presets skipped due to validation failure (see §6)
}
```

## 4. Messages & responsibilities (UI ↔ plugin)

The following new message variants would be added by plan 012 (they are described here for design; they must NOT be added to the `UIMessage`/`PluginMessage` unions in this plan).

**Export flow:**

1. UI posts `{ type: 'export-presets' }` to plugin.
2. Plugin reads `preferences.customPresets`, filters to `isCustom === true` (all should be, but defensive), builds the file object from §2, serialises it with `JSON.stringify`, and replies with `{ type: 'presets-exported'; json: string }`.
3. UI receives the JSON string and shows it in a read-only `<textarea>` (see §5).

**Import flow:**

1. UI posts `{ type: 'import-presets'; json: string }` (raw text the user pasted into the textarea).
2. Plugin parses, validates (§6), and merges per §3.
3. Plugin persists the merged list via `savePreferences`.
4. Plugin replies with `{ type: 'presets-imported'; summary: { added; renamed; skipped; overwritten; invalid } }`.
5. Plugin also posts a fresh `preferences-loaded` message so the UI re-renders the merged preset list immediately.

**Responsibility split:**

| Concern | Owner |
|---------|-------|
| Serialise presets to JSON | Plugin |
| Parse + validate + merge + persist | Plugin |
| Render textareas | UI |
| Copy via `execCommand` | UI |
| Post raw text to plugin | UI |

**Plumbing note for plan 012:** Each new message variant must be added to the `UIMessage` / `PluginMessage` discriminated unions in `src/shared/types.ts` **and** get a matching `case` block in `handleUIMessage()` in `src/plugin/core.ts` (not `main.ts` — Plan 008 moved the message switch into `core.ts`'s `handleUIMessage` function, following the same pattern as the existing `save-preset` and `delete-preset` cases in `core.ts`'s `handleUIMessage` switch).

## 5. Download / upload UX inside Figma's iframe

**Constraint:** Figma plugin UI runs in a sandboxed `<iframe>`. The following browser APIs are unavailable or unreliable in this context:

- **File System Access API** — not exposed to plugin iframes.
- **`navigator.clipboard.writeText`** — blocked; the existing `src/ui/utils/clipboard.ts` already works around this using `document.execCommand('copy')` via a hidden `<textarea>`.
- **`<a download>` / Blob URL downloads** — unreliable in the sandboxed iframe; the browser may intercept or silently ignore them depending on the Figma host.
- **`<input type="file">` upload** — also unreliable in the sandbox and requires additional host permissions.

Therefore, the transport is **text copy-paste**, not file system I/O.

**Export UX (recommended):**

1. User clicks "Export Presets" in the manage-presets UI.
2. Plugin sends the JSON string (`presets-exported`).
3. UI displays the JSON in a read-only `<textarea>`.
4. A **"Copy"** button calls the existing `copyToClipboard()` from `src/ui/utils/clipboard.ts` (the `execCommand('copy')` path). This util must be reused — do not reach for `navigator.clipboard`.
5. User pastes the text into a file, Slack message, or shares it however they like.

**Import UX (recommended):**

1. User clicks "Import Presets" (or the same modal shows an import tab).
2. UI shows an empty, editable `<textarea>` with placeholder text ("Paste your preset JSON here").
3. User pastes JSON.
4. User clicks **"Import"** button; UI posts `{ type: 'import-presets', json: textarea.value }` to plugin.
5. Plugin replies with `presets-imported` summary; UI shows a toast (e.g. "Imported 4 presets (1 renamed)").
6. No file picker is needed or used.

**Rejected alternatives:**

| Alternative | Reason rejected |
|-------------|-----------------|
| `navigator.clipboard.writeText` | Blocked in Figma's plugin iframe |
| `<a download>` / Blob URLs | Unreliable in sandboxed iframe |
| File System Access API | Not exposed to plugin context |
| `<input type="file">` | Unreliable in sandbox; requires extra host permissions |

**Where the UI lives:** A "Manage presets" affordance (e.g. an "Import / Export" collapsible section or button near "Create Custom Preset" in `src/ui/App.tsx`) opens a `Modal` component containing the export textarea (with Copy button) and the import textarea (with Import button). Plan 012 builds this — this plan only describes the shape.

## 6. Validation & error handling

**Blob-level validation (whole-file checks — reject early if any fail):**

1. `JSON.parse` the input inside a `try/catch`. If it throws, reject with user-facing message: "Invalid JSON — the pasted text could not be parsed."
2. Check `parsed.format === "lazy-export-presets"`. If not, reject: "This file is not a Lazy Export preset file."
3. Check `typeof parsed.version === 'number'`. If the version is unknown/future (e.g. `version > 1`), reject with: "This preset file was made by a newer version of Lazy Export. Please upgrade the plugin before importing."

**Per-entry validation (invalid entries are counted and skipped, not fatal):**

Each entry in `parsed.presets` is individually checked. An entry is counted as `invalid` and skipped if it fails any of:
- `typeof entry.id === 'string'` (non-empty)
- `typeof entry.name === 'string'` (non-empty)
- `entry.platform` is one of `'iOS' | 'Android' | 'Web' | 'PDF'`
- `Array.isArray(entry.settings)`
- `entry.isCustom === true`

An invalid entry does not abort the import; the rest continue to be processed.

**Where validation lives:** Validation must be implemented defensively in the **plugin handler** (`handleUIMessage` case for `'import-presets'` in `src/plugin/core.ts`), because the plugin owns `clientStorage` and must never write untrusted data to it. The UI may optionally perform a lighter pre-validation to give faster feedback, but the plugin's validation is authoritative.

**Error response:** If the whole blob fails validation, the plugin replies with a `{ type: 'error', message: '...' }` PluginMessage so the existing UI error-display path handles it.

## 7. Resolved decisions

These questions were resolved before plan 012 began implementation.

1. **Selective import** → **No for v1.** Import is merge-all. Per-preset selection (checkboxes) is a v2 feature. Rationale: simplicity; merge-all with `rename-with-new-id` collision handling is safe and non-destructive.

2. **Overwrite option** → **No for v1.** `rename-with-new-id` is the only collision mode. An explicit "Replace existing" checkbox is deferred to a later release. Rationale: non-destructive default; overwrite UI adds complexity without clear v1 demand.

3. **Suggested filename guidance** → **Yes.** Show `lazy-export-presets.json` as guidance text above the export textarea. Not enforced — there is no real file download in the iframe — but helpful to orient users.

4. **Exporting default presets** → **No.** The `isCustom === true` filter is permanent. Shipping presets live in code and don't need to travel in a file. Rationale: default presets are versioned with the plugin; copying them into user files creates divergence risk.

5. **Version migration ownership** → Additive **optional** fields do **not** bump `version`; only a breaking shape change bumps it and ships a migration function beside the import handler in `src/plugin/core.ts`. Plans 005/010 added `generateMetadata`/`directoryStructure` as optional fields — they stay `version: 1`. Rationale: optional fields are backward-compatible; consumers that don't know a field ignore it.

## 8. Follow-up build plan (012) summary

Plan 012 (`plans/012-preset-import-export-build.md`) is the build execution of this design.

It adds the `export-presets` / `import-presets` UIMessage variants and `presets-exported` / `presets-imported` PluginMessage variants to `src/shared/types.ts`, then wires two new `case` blocks into `handleUIMessage()` in `src/plugin/core.ts`. The export case reads `customPresets`, builds the §2 file object, serialises it, and replies. The import case parses and validates the pasted JSON (§6), applies the §3 merge policy, persists via `savePreferences`, and replies with the `{ added, renamed, skipped, overwritten, invalid }` summary.

On the UI side, plan 012 adds an "Import / Export" section to `src/ui/App.tsx` backed by a `Modal` with two textareas. The export textarea is read-only and wired to the existing `copyToClipboard()` from `src/ui/utils/clipboard.ts`; the import textarea accepts paste input and triggers the import message. A summary toast shows the result counts.

Plan 012 also adds tests covering JSON serialisation, each of the three collision branches, and invalid-blob rejection, then rebuilds and commits `dist/`.

All format, merge, and UX decisions are fixed here. Before starting 012, resolve any §7 open questions with the operator.
