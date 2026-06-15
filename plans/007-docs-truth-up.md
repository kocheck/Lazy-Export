# 007 — Docs truth-up + deprecated CI actions

> **Planned at:** `082adbb`, 2026-06-14
> **For the executor:** This is a self-contained handoff plan. You have zero prior context.
> Implement task-by-task, in order. Steps use checkbox (`- [ ]`) syntax — check them as you go.

**Goal:** Bring the documentation back in line with the actual code, and replace the two
deprecated GitHub Actions so the CI/automation workflows keep running on current runners.

**Why this matters:** Several docs are *actively wrong* — they claim WebP export support (the
type has none), "Vite 5" (the repo is on Vite 7), and "Future: Automated Testing" (tests exist
now). Deprecated actions (`actions/labeler@v2`, `actions/stale@v1`) will eventually fail on
GitHub's runners. Wrong docs mislead human contributors and AI agents alike.

**Findings addressed:** F7 (docs drift + deprecated CI actions), F6-docs (the test-count /
coverage claims in `TESTING.md` and `IMPLEMENTATION_SUMMARY.md`).

**Effort:** S · **Depends on:** **partial** (see "Dependency split" below).

---

## Dependency split (READ THIS FIRST — it controls what you can do today)

This plan has **two independent halves**:

1. **Doc-drift + CI-action half (Tasks 1–8)** — **INDEPENDENT of plan 001.** These are pure
   text/config corrections (WebP, Vite version, roadmap, dates, deprecated actions). You can do
   these now regardless of whether plan 001 has landed.

2. **Test-count / coverage half (Task 9)** — **DEPENDS ON plan 001.** `TESTING.md:7` and
   `IMPLEMENTATION_SUMMARY.md:7,30` cite a specific coverage % and test count. Those numbers were
   true at some past point but the suite is **red today** (plan 001 fixes it). You must **derive
   fresh numbers from `npm run test:coverage` AFTER 001 has landed** — do **NOT** hardcode the
   old "73 passing tests / 93.82% coverage" values, and do **NOT** invent numbers.
   - **If plan 001 is NOT yet DONE** (check `plans/README.md` — row 001 must say `DONE`): do
     Tasks 1–8 and the final index update, then **SKIP Task 9** and set row 007 to
     `BLOCKED — Task 9 (test counts) awaits 001`. Re-run Task 9 later once 001 is DONE.
   - **If plan 001 IS DONE:** do all tasks 1–9.

To check 001's status:
```bash
grep -n "^| \[001\]" plans/README.md
```

---

## This is a DOCS + CI-CONFIG-ONLY plan

- **NO `src/**` changes.** You touch only Markdown docs and `.github/workflows/*.yml` (+ possibly
  one new `.github/labeler.yml`).
- **`dist/` MUST stay clean.** This plan changes no source and runs no build that writes `dist/`.
  The Done criteria require `git status` to show `dist/` completely untouched.

**In scope (only these files may change):**
- `.cursorrules`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `ARCHITECTURE.md`
- `README.md` (date footer only — see scope note)
- `.github/workflows/stale.yml`
- `.github/workflows/label.yml` (bump **or** delete — Option A/B below)
- `.github/labeler.yml` (create — only if you choose Option A)
- `TESTING.md` (Task 9, gated on 001)
- `IMPLEMENTATION_SUMMARY.md` (Task 9, gated on 001)
- `plans/README.md` (final index update only)

**Out of scope:**
- Do **NOT** edit any file under `src/**`, `dist/**`, `public/**`, or `package.json`.
- Do **NOT** add the README "Apply PDF" Quick-Action line — that belongs to **plan 009**. Adding
  it here would create a duplicate edit / merge conflict. Leave `README.md:33-38` (the Quick
  Actions list) untouched.
- Do **NOT** "fix" anything beyond the exact before→after edits listed below.

---

## Handoff conventions (read first)

- **Base branch:** branch from `review-lazy-export-plan`. Create a branch named
  `advisor/007-docs-truth-up`. PRs target `origin/production`. Do **not** commit to `production`,
  and do **not** push or open a PR unless the operator explicitly says so.
```bash
git checkout review-lazy-export-plan
git checkout -b advisor/007-docs-truth-up
```
- **Commits:** one commit per logical doc (or logical step), sentence-case imperative messages
  that match `git log` style (e.g. "Correct Vite version and remove WebP claims in .cursorrules").
- **Drift check first:** before editing, confirm the "Current state" excerpts below still match
  the live files:
```bash
git diff --stat 082adbb..HEAD -- .cursorrules CONTRIBUTING.md CHANGELOG.md ARCHITECTURE.md README.md TESTING.md IMPLEMENTATION_SUMMARY.md .github/workflows
```
  If any in-scope file differs from the excerpts quoted here, **STOP** (drift).
- **Index update:** on completion, set this plan's row in `plans/README.md` to `DONE` (or
  `BLOCKED` + one-line reason). That is the only edit this plan makes to the index.
- **Shared STOP conditions:** a "Current state" excerpt no longer matches HEAD; any verification
  gate fails twice after a reasonable fix; a file outside the **In scope** list must change to
  proceed; `git status` shows unexpected `dist/` churn.

## Tracked-`dist/` artifact policy (this plan)

**State: docs/CI-only → NO `dist/` changes.** `dist/code.js`, `dist/index.html`, and
`dist/manifest.json` are committed artifacts, but this plan changes no source and runs no build.
**Do not run `npm run build`.** `git status` must show `dist/` clean at the end (it is part of the
Done criteria).

---

## Current state (verified at 082adbb)

**Ground-truth facts the docs contradict:**
- `src/shared/types.ts:5` — `export type ExportFormat = 'PNG' | 'JPG' | 'SVG' | 'PDF';`
  → **There is no `WEBP` or `AVIF`.** Any doc claiming WebP/AVIF support is wrong.
- `package.json:33` — `"vite": "^7.3.0"` → the stack is **Vite 7**, not Vite 5.
- Tests exist: `src/plugin/main.test.ts`, several `src/ui/components/*.test.tsx`,
  `src/shared/sanitizeLog.test.ts`, plus `vitest` config and `test:*` scripts. So "Future:
  Automated Testing" / "⏭️ Automated tests" are stale (tests are present, not future).
- Today's date is **2026-06-14**. Docs dated "2025-12-21" / "December 2025" are drifted.

**Deprecated CI actions:**
- `.github/workflows/label.yml:17` — `uses: actions/labeler@v2`. **AND** there is **no**
  `.github/labeler.yml` config file (confirm with the command in Task 7), so the labeler is
  already broken: bumping the version alone will not make it work.
- `.github/workflows/stale.yml:13` — `uses: actions/stale@v1`.

---

## Tasks

### Task 1: `.cursorrules` — fix Vite version, remove WebP, mark tests done

**File:** `.cursorrules`

- [ ] **Step 1 — Stack line (line 10).** Change Vite 5 → Vite 7.

  Before:
  ```
  **Stack:** React 18 + TypeScript 5 + Vite 5 + Figma Plugin API v1.0.0
  ```
  After:
  ```
  **Stack:** React 18 + TypeScript 5 + Vite 7 + Figma Plugin API v1.0.0
  ```

- [ ] **Step 2 — Purpose line (line 13).** Remove "WebP," from the supported-platforms list (the
  `ExportFormat` type has no WebP).

  Before:
  ```
  A Figma plugin that allows users to quickly apply export settings to selected layers using preset configurations. Supports iOS, Android, Web, WebP, and PDF exports with custom preset creation.
  ```
  After:
  ```
  A Figma plugin that allows users to quickly apply export settings to selected layers using preset configurations. Supports iOS, Android, Web, and PDF exports with custom preset creation.
  ```

- [ ] **Step 3 — Completed-features list (line 297).** Remove "WebP" from the default-presets
  line.

  Before:
  ```
  ✅ Default presets (iOS, Android, Web, WebP, PDF)
  ```
  After:
  ```
  ✅ Default presets (iOS, Android, Web, PDF)
  ```

- [ ] **Step 4 — Future Roadmap (line 309).** Tests now exist, so remove the "⏭️ Automated tests"
  roadmap entry. Delete the entire line:

  Before (the roadmap block, lines 304-309):
  ```
  ### Future Roadmap
  ⏭️ Preset import/export as JSON
  ⏭️ Preset templates library
  ⏭️ Export history
  ⏭️ Keyboard shortcuts
  ⏭️ Automated tests
  ```
  After:
  ```
  ### Future Roadmap
  ⏭️ Preset import/export as JSON
  ⏭️ Preset templates library
  ⏭️ Export history
  ⏭️ Keyboard shortcuts
  ```
  (Remove only the `⏭️ Automated tests` line; leave the other four roadmap items unchanged.)

- [ ] **Step 5:** Commit.
```bash
git add .cursorrules
git commit -m "Correct Vite version, remove WebP claims, and drop stale tests roadmap in .cursorrules"
```

### Task 2: `CONTRIBUTING.md` — fix Vite version

**File:** `CONTRIBUTING.md` (line 370)

- [ ] **Step 1.** Change Vite 5 → Vite 7.

  Before:
  ```
  - Vite 5 (Build)
  ```
  After:
  ```
  - Vite 7 (Build)
  ```

- [ ] **Step 2:** Commit.
```bash
git add CONTRIBUTING.md
git commit -m "Correct Vite version in CONTRIBUTING.md"
```

### Task 3: `ARCHITECTURE.md` — fix ExportFormat examples (remove WEBP/AVIF)

**File:** `ARCHITECTURE.md` (lines 593-601, the "Adding a New Export Format" example)

The example type/array list `'WEBP'` and `'AVIF'`, which do not exist in the real
`ExportFormat`. Make the examples match reality (`'PNG' | 'JPG' | 'SVG' | 'PDF'`) while still
illustrating *how to extend* the type — append a placeholder `'WEBP'` only as the "new format you
are adding", since the section is literally about adding a format. To avoid implying it already
exists, edit as follows.

- [ ] **Step 1 — types example (line 593-595).**

  Before:
  ```typescript
     // src/shared/types.ts
     export type ExportFormat = 'PNG' | 'JPG' | 'SVG' | 'PDF' | 'WEBP' | 'AVIF';
  ```
  After:
  ```typescript
     // src/shared/types.ts — current type is 'PNG' | 'JPG' | 'SVG' | 'PDF'
     // add your new format to the union, e.g.:
     export type ExportFormat = 'PNG' | 'JPG' | 'SVG' | 'PDF' | 'WEBP';
  ```

- [ ] **Step 2 — UI form example (line 599-600).**

  Before:
  ```typescript
     // src/ui/components/PresetCreator.tsx
     const FORMATS = ['PNG', 'JPG', 'SVG', 'PDF', 'WEBP', 'AVIF'] as const;
  ```
  After:
  ```typescript
     // src/ui/components/PresetCreator.tsx
     const FORMATS = ['PNG', 'JPG', 'SVG', 'PDF', 'WEBP'] as const;
  ```

  (Rationale: this section documents *adding* a format, so a single illustrative new value
  (`WEBP`) is fine; the key fix is stating the **current** type accurately and not implying two
  formats already ship. The plugin example below at line ~606 may keep its `'AVIF'` placeholder as
  the hypothetical-handling case — leave it; it does not claim AVIF exists in the type.)

- [ ] **Step 3:** Commit.
```bash
git add ARCHITECTURE.md
git commit -m "Align ExportFormat extension example with the real type in ARCHITECTURE.md"
```

### Task 4: `ARCHITECTURE.md` — tests exist, not "Future"

**File:** `ARCHITECTURE.md` (line 696, the "### Future: Automated Testing" heading)

Tests now exist (Vitest + React Testing Library). The heading and "Planned:" framing are stale.

- [ ] **Step 1.** Change the heading and the intro line.

  Before (lines 696-698):
  ```
  ### Future: Automated Testing

  **Planned:**
  ```
  After:
  ```
  ### Automated Testing

  The plugin uses **Vitest** + **React Testing Library**. See `TESTING.md` for how to run and
  write tests. Representative examples:
  ```
  (Leave the code block that follows unchanged — it still serves as illustrative examples. Only
  the heading and the one "**Planned:**" line change.)

- [ ] **Step 2:** Commit.
```bash
git add ARCHITECTURE.md
git commit -m "Mark automated testing as present, not future, in ARCHITECTURE.md"
```

### Task 5: `CHANGELOG.md` — correct date drift + Vite version

**File:** `CHANGELOG.md`

The release is dated `2025-12-21`; today is `2026-06-14`. Per plan.md guidance, correct obvious
date drift. Also the Technical bullet says "Vite 5".

- [ ] **Step 1 — release date (line 10).**

  Before:
  ```
  ## [2.0.0] - 2025-12-21
  ```
  After:
  ```
  ## [2.0.0] - 2026-06-14
  ```

- [ ] **Step 2 — Vite version in the Technical bullets (line 37).**

  Before:
  ```
  - **Vite 5** - Lightning-fast build tooling
  ```
  After:
  ```
  - **Vite 7** - Lightning-fast build tooling
  ```

- [ ] **Step 3:** Commit.
```bash
git add CHANGELOG.md
git commit -m "Correct release date and Vite version in CHANGELOG.md"
```

### Task 6: `README.md` — correct date footer

**File:** `README.md` (line 93)

> **Scope note:** Touch ONLY the date footer. Do **NOT** edit the Quick Actions list at
> `README.md:33-38` — the "Apply PDF" addition is owned by plan 009.

- [ ] **Step 1 — footer date (line 93).**

  Before:
  ```
  *v2.0.0 - December 2025*
  ```
  After:
  ```
  *v2.0.0 - June 2026*
  ```

- [ ] **Step 2:** Commit.
```bash
git add README.md
git commit -m "Correct release date footer in README.md"
```

### Task 7: `.github/workflows/label.yml` — fix the broken/deprecated labeler

**File:** `.github/workflows/label.yml` (and possibly new `.github/labeler.yml`)

`label.yml` uses `actions/labeler@v2`. **AND** there is no `.github/labeler.yml` config, so the
labeler is already non-functional — bumping the version alone leaves it broken. Two valid fixes:

- [ ] **Step 1 — confirm the config is missing.**
```bash
ls -la .github/labeler.yml
```
  Expected: "No such file or directory" (confirms the labeler config is absent). If the file
  *does* exist, the current state has drifted — STOP and re-read this task.

Choose **one** of the two options below. **Recommended: Option A** (keep useful automation; a
working path-based labeler helps triage PRs). Use Option B only if the operator has said they do
not want PR auto-labeling.

#### Option A (RECOMMENDED) — add a valid v5 config + bump to v5 + least-privilege permissions

- [ ] **A1.** Create `.github/labeler.yml` with a minimal, valid v5 schema (v5 uses
  `changed-files` / `any-glob-to-any-file`). Use repo-appropriate path globs:
```yaml
documentation:
  - changed-files:
      - any-glob-to-any-file:
          - '**/*.md'
          - '.cursorrules'

ui:
  - changed-files:
      - any-glob-to-any-file: 'src/ui/**'

plugin:
  - changed-files:
      - any-glob-to-any-file: 'src/plugin/**'

ci:
  - changed-files:
      - any-glob-to-any-file: '.github/**'

tests:
  - changed-files:
      - any-glob-to-any-file:
          - 'src/**/*.test.ts'
          - 'src/**/*.test.tsx'
          - 'src/test/**'
```

- [ ] **A2.** Replace the entire contents of `.github/workflows/label.yml` with a v5-compatible
  workflow that declares least-privilege permissions (`contents: read`, `pull-requests: write`)
  and drops the obsolete `repo-token` input (v5 uses the default `GITHUB_TOKEN` automatically):

  Before (full file):
  ```yaml
  # This workflow will triage pull requests and apply a label based on the
  # paths that are modified in the pull request.
  #
  # To use this workflow, you will need to set up a .github/labeler.yml
  # file with configuration.  For more information, see:
  # https://github.com/actions/labeler/blob/master/README.md

  name: Labeler
  on: [pull_request]

  jobs:
    label:

      runs-on: ubuntu-latest

      steps:
      - uses: actions/labeler@v2
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
  ```
  After (full file):
  ```yaml
  # Triage pull requests and apply labels based on the paths modified.
  # Configuration lives in .github/labeler.yml (actions/labeler v5 schema).
  # See: https://github.com/actions/labeler

  name: Labeler
  on: [pull_request_target]

  permissions:
    contents: read
    pull-requests: write

  jobs:
    label:
      runs-on: ubuntu-latest
      steps:
      - uses: actions/labeler@v5
  ```
  (Note: `actions/labeler@v5` requires the `pull-requests: write` permission to apply labels and
  reads `.github/labeler.yml` automatically. `pull_request_target` is the event labeler v5 expects
  so it can label PRs from forks; the workflow runs no untrusted code, so this is safe here.)

- [ ] **A3.** Commit both files.
```bash
git add .github/labeler.yml .github/workflows/label.yml
git commit -m "Upgrade labeler to v5 with a valid config and least-privilege permissions"
```

#### Option B (alternative) — delete the broken workflow

- [ ] **B1.** If the operator does not want PR auto-labeling, remove the workflow entirely (there
  is no config backing it anyway):
```bash
git rm .github/workflows/label.yml
git commit -m "Remove broken labeler workflow (no labeler config present)"
```

> Do **only one** of Option A or Option B — not both.

### Task 8: `.github/workflows/stale.yml` — bump deprecated stale action

**File:** `.github/workflows/stale.yml` (line 13)

- [ ] **Step 1.** Bump `actions/stale@v1` → `actions/stale@v9`. The `repo-token` input and the
  message/label inputs remain valid in v9.

  Before:
  ```yaml
      - uses: actions/stale@v1
  ```
  After:
  ```yaml
      - uses: actions/stale@v9
  ```
  (Optional but recommended — add least-privilege permissions so v9 can close/label. If you add
  it, insert this block between `jobs:`'s `stale:` job header and `runs-on:` is fine, OR at the
  top level under `on:`. Simplest: add a top-level block right after the `on:` section:
  ```yaml
  permissions:
    issues: write
    pull-requests: write
  ```
  Skip this addition if you are unsure where it goes cleanly — the version bump alone resolves the
  deprecation. Do not break YAML indentation.)

- [ ] **Step 2:** Commit.
```bash
git add .github/workflows/stale.yml
git commit -m "Upgrade deprecated actions/stale to v9"
```

### Task 9: Test-count + coverage truth-up (GATED ON 001 — see Dependency split)

**Files:** `TESTING.md` (line 7), `IMPLEMENTATION_SUMMARY.md` (lines 7, 30+)

> **DO THIS ONLY IF `plans/README.md` row 001 says `DONE`.** Otherwise skip and set row 007 to
> `BLOCKED — Task 9 awaits 001` in Task 10. **Never hardcode "73 / 93.82%" — derive live numbers.**

- [ ] **Step 1 — derive the real numbers.** With 001 landed and the suite green, run:
```bash
npm run test:coverage
```
  From the output capture two things:
  - the **total number of passing tests** (the Vitest summary line, e.g. `Tests  N passed (N)`),
  - the **overall coverage %** (the `All files` row's `% Lines` — or whatever the report's headline
    "All files" statements/lines figure is). Use the actual printed number; do not round to match
    the old value.

  Record them as you read them. Call the test count `<N>` and coverage `<C>%` below.

- [ ] **Step 2 — `TESTING.md:7`.** Update the coverage claim to the freshly-derived `<C>%`.

  Before:
  ```
  The Lazy Export plugin uses **Vitest** for unit and component testing, with **React Testing Library** for UI components. We maintain **93.82% code coverage** on business logic.
  ```
  After (substitute the real number for `<C>`):
  ```
  The Lazy Export plugin uses **Vitest** for unit and component testing, with **React Testing Library** for UI components. We maintain **<C>% code coverage** on business logic.
  ```
  (If the real coverage happens to still be `93.82%`, leave the number — but only after you have
  confirmed it from the live run, not assumed it.)

- [ ] **Step 3 — `IMPLEMENTATION_SUMMARY.md`.** This file is a *historical implementation
  snapshot*. You have two acceptable approaches — pick **one**:

  **Approach 3a (preferred — update the numbers):** Replace the stale figures with the live ones.
  - Line 7 — before:
    ```
    Successfully implemented comprehensive testing infrastructure and privacy-focused error reporting, achieving 93.82% code coverage and 73 passing tests.
    ```
    after (substitute real `<C>` and `<N>`):
    ```
    Successfully implemented comprehensive testing infrastructure and privacy-focused error reporting, achieving <C>% code coverage and <N> passing tests.
    ```
  - Line 30 — before:
    ```
    #### Test Coverage (93.82% overall)
    ```
    after:
    ```
    #### Test Coverage (<C>% overall)
    ```
  - The per-file coverage table that follows (lines 31+) is a detailed snapshot. If it no longer
    matches `npm run test:coverage`, either update the rows to the live figures **or** prepend the
    table with a one-line note: `> Snapshot from the v2.0 testing milestone; see TESTING.md and
    \`npm run test:coverage\` for current numbers.` Do not leave stale per-file numbers presented
    as current with no caveat.

  **Approach 3b (alternative — mark historical):** If reconciling every row is impractical, add a
  banner immediately after the H1 (after line 1) marking the whole file as a point-in-time record:
  ```
  > **Historical snapshot** (v2.0 implementation milestone). Test counts and coverage here reflect
  > that milestone; for current figures run `npm run test:coverage` and see `TESTING.md`.
  ```
  and still correct line 7's headline numbers to the live `<C>`/`<N>` (the headline sentence should
  not be wrong even in a historical doc).

- [ ] **Step 4:** Commit.
```bash
git add TESTING.md IMPLEMENTATION_SUMMARY.md
git commit -m "Update test count and coverage figures to match the green baseline"
```

### Task 10: Update the plans index

**File:** `plans/README.md`

- [ ] **Step 1.** Find row 007 in the status table:
```bash
grep -n "^| \[007\]" plans/README.md
```
- [ ] **Step 2.** Change its `Status` cell from `PLANNED` to:
  - `DONE` — if you completed Tasks 1–9 (001 was DONE).
  - `BLOCKED — Task 9 (test counts) awaits 001` — if you completed Tasks 1–8 but skipped Task 9.

  The row currently reads:
  ```
  | [007](007-docs-truth-up.md) | Docs truth-up + deprecated CI actions | F7, F6-docs | S | partial (see note) | PLANNED |
  ```
  Change only the final `PLANNED` cell. Do not edit any other row.
- [ ] **Step 3:** Commit.
```bash
git add plans/README.md
git commit -m "Mark plan 007 as done in the plans index"
```

---

## Done criteria

- [ ] `.cursorrules` says **Vite 7**, lists no **WebP** in the purpose/presets lines, and has no
  "⏭️ Automated tests" roadmap entry.
- [ ] `CONTRIBUTING.md:370` says **Vite 7 (Build)**.
- [ ] `ARCHITECTURE.md` ExportFormat examples no longer present `'WEBP'`/`'AVIF'` as
  already-shipping formats; the testing section is titled **Automated Testing** (not "Future:").
- [ ] `CHANGELOG.md` release line dated **2026-06-14** and the Technical bullet says **Vite 7**.
- [ ] `README.md` footer reads **June 2026**; the Quick Actions list (`:33-38`) is **unchanged**.
- [ ] `.github/workflows/stale.yml` uses **`actions/stale@v9`**.
- [ ] Labeler is fixed via Option A (valid `.github/labeler.yml` + `actions/labeler@v5` +
  `permissions: { contents: read, pull-requests: write }`) **or** removed via Option B.
- [ ] **Task 9 (if 001 is DONE):** `TESTING.md` / `IMPLEMENTATION_SUMMARY.md` figures match a live
  `npm run test:coverage`; **no hardcoded "73 / 93.82%"** unless the live run produced exactly
  those numbers.
- [ ] `git status` shows **`dist/` completely untouched** (no `dist/code.js`, `dist/index.html`,
  or `dist/manifest.json` changes), and **no `src/**` changes**.
- [ ] `plans/README.md` row 007 set to `DONE` (or `BLOCKED` + reason per Task 10).

Final sanity check:
```bash
git status
git diff --stat 082adbb..HEAD -- dist src
```
Expected: the second command prints **nothing** (no `dist/` or `src/` changes).

## STOP conditions (plan-specific)

- A "Current state" excerpt does not match the live file (drift) → STOP; the docs already changed.
- `.github/labeler.yml` already exists at the start (Task 7 Step 1) → STOP and re-evaluate; the
  current state has drifted from this plan's assumptions.
- Task 9 requires test numbers but plan 001 is **not** DONE → do **not** guess; skip Task 9 and set
  row 007 to `BLOCKED` per Task 10.
- Any change would touch `src/**`, `dist/**`, `public/**`, or `package.json` → STOP; that is out of
  scope for this docs/CI plan.
- A gate fails twice after a reasonable fix → STOP.
