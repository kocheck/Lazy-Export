# Lazy Export — Improvement Plans (Index)

> **Planned at:** `082adbb`, 2026-06-14 (branch `review-lazy-export-plan`, workspace dir `denver`).
> Source audit: `.context/attachments/FU1A2G/plan.md` (the `/improve` deliverable).

These are **self-contained handoff plans**. Each `NNN-*.md` file is written so a fresh,
zero-context, possibly weaker model can execute exactly one plan without reading any other
file in this folder. The plans do **not** change source code themselves — they are
instructions for a separate executor.

The audit baseline was **executed, not estimated**, in this worktree at `082adbb`:
- `npx tsc --noEmit` → **11 errors**
- `npx vitest run` → **6 failed / 67 passed / 73 total / 3 unhandled rejections**
- No `typecheck` script and no CI workflow that runs the build/tests.

`001` fixes that baseline and is a **hard prerequisite for every other plan except `007`**.

---

## Status table

| Plan | Title | Findings | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| [001](001-verification-baseline.md) | Verification baseline (typecheck + tests green + CI) | F1, F3-typings | L | — | DONE |
| [002](002-figma-iframe-feedback.md) | Figma-iframe feedback (replace `alert`/`window.open`) | F2, F3-metadata | M | 001 | DONE |
| [003](003-harden-message-handler.md) | Harden UI message handler + `customName` contract | F3, F10 | S | 001 | DONE |
| [004](004-remove-legacy-artifacts.md) | Remove legacy v1 artifacts + dead config | F4, F9 | S | 001 | DONE |
| [005](005-persist-preferences.md) | Persist Advanced Mode + wire `lastUsedPreset` | F5, D1 | S | 001 | DONE |
| [006](006-dependency-security.md) | Dependency security bumps | F6 | M | 001 | DONE |
| [007](007-docs-truth-up.md) | Docs truth-up + deprecated CI actions | F7, F6-docs | S | partial (see note) | DONE |
| [008](008-core-path-tests.md) | Core-path tests (with a real test seam) | F8, F7 | M | 001 | DONE |
| [009](009-apply-pdf-quick-action.md) | Add `applyPDF` quick-action | D4 | S | 001 | DONE |
| [010](010-custom-preset-metadata-toggles.md) | Custom-preset metadata toggles (UI + plugin) | D3, F2-blocker | M | 001 | PLANNED |
| [011](011-preset-import-export-spike.md) | Preset import/export — design spike | D2 | M | 001 | PLANNED |

Set a row to `DONE` (or `BLOCKED` + one-line reason) when its plan completes. That is the
only edit a plan makes to this index.

---

## Dependency graph

```
001 ──┬── 002
      ├── 003
      ├── 004
      ├── 005
      ├── 006
      ├── 008
      ├── 009
      ├── 010
      └── 011

007 ── (independent for doc-drift + CI-action edits;
        TESTING.md / IMPLEMENTATION_SUMMARY.md portions depend on 001)
```

**Recommended execution order = numeric (001 first).**

---

## Handoff conventions (every plan inlines these)

A separate, zero-context executor runs one plan at a time. Each `NNN-*.md` restates the rules
below so it can be executed standalone.

- **Base branch:** branch from `review-lazy-export-plan`. One branch per plan, named
  `advisor/NNN-<slug>`. PRs target `origin/production`. Do **not** commit to `production`, and
  do **not** push or open a PR unless the operator explicitly says so.
- **Commits:** one commit per logical step; message style matches `git log` (sentence-case
  imperative, e.g. "Fix ExportSettings variant typing").
- **Index update:** on completion, set this plan's row above to `DONE` / `BLOCKED`.
- **Drift check first:** before editing, run
  `git diff --stat 082adbb..HEAD -- <in-scope paths>` and compare the plan's "Current state"
  excerpts against the live files. If they no longer match, STOP.
- **Shared STOP conditions** (in addition to each plan's own):
  - A "Current state" excerpt no longer matches HEAD (drift).
  - Any verification gate fails twice after a reasonable fix.
  - A file outside the plan's named **In scope** list must change to proceed.
  - `git status` shows unexpected `dist/` churn.
- **Path note:** source is nested under `src/`. Common paths the audit refers to by short name:
  - plugin entry → `src/plugin/main.ts`
  - shared types → `src/shared/types.ts`
  - default presets → `src/shared/presets.ts`
  - clipboard util → `src/ui/utils/clipboard.ts`
  - figma mock → `src/test/figma-mock.ts`
  - test setup → `src/test/setup.ts`

---

## Tracked-`dist/` artifact policy (applies to every plan)

`dist/code.js`, `dist/index.html`, and `dist/manifest.json` are **committed** to the repo.

- **Plans that change `src/**` or `public/manifest.json`** (002, 003, 004, 005, 006, 009, 010)
  must run `npm run build`, commit the regenerated `dist/` files, and verify a **second**
  `npm run build` yields **no further diff**.
- **Test-only / docs-only / CI-only plans** (007, 008, and 001 *except* its `src/plugin/main.ts`
  type fixes) must produce **no `dist/` changes** (`git status` shows `dist/` clean).
- **001 and 006** touch source/build-tooling, so they rebuild and commit `dist/`.
- **Deferred question for the maintainer:** whether to stop committing `dist/` entirely and
  build only at publish time. Out of scope for these plans — noted here so it is not lost.

---

## Considered & rejected (do not re-audit)

- **postMessage `'*'` targetOrigin** — Figma's required, documented pattern; changing it breaks
  the plugin. By design.
- **Toast.tsx "malformed/critical JSX"** — the JSX is balanced and compiles (the committed
  `dist/` proves it). Cosmetic indentation only; do not "fix" structure in 002 beyond the
  scoped changes.
- **React → devDependencies "bundle bloat"** — false: esbuild bundles zero React into
  `dist/code.js`. For a distributed plugin the dependency field placement is cosmetic.
- **Optimistic-update rollback** — `ARCHITECTURE.md` documents this as an accepted tradeoff.
- **`sanitizeLog` ReDoS** — patterns are bounded; not vulnerable.

---

## Verification baseline (any plan, after `npm ci`)

```bash
npx tsc --noEmit          # expect 0 errors (after 001)
npx vitest run            # expect all green (after 001)
npm run build             # writes dist/code.js + dist/index.html (+ manifest copy)
```

For behavior changes (002, 005, 009, 010): load `dist/manifest.json` in Figma → select a layer
→ apply a preset / toggle Advanced Mode / trigger an error toast, and confirm the new behavior.
