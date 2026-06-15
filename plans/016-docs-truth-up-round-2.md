# 016 — Docs truth-up, round 2 (TESTING.md CI fiction + stale numbers)

> **Planned at:** `df82c72`, 2026-06-14
> **For the executor:** This is a self-contained handoff plan. You have zero prior context.
> Implement task-by-task, in order. Steps use checkbox (`- [ ]`) syntax — check them as you go.
> **This is a docs-only plan: no `src/**` or `dist/**` may change.**

**Goal:** Make `TESTING.md` and `IMPLEMENTATION_SUMMARY.md` (plus two small spots in `.cursorrules`
and `README.md`) describe the project as it actually is — most importantly, stop `TESTING.md` from
describing a CI pipeline that does not exist.

**Why this matters:** Plan 007 truthed up README/CONTRIBUTING/ARCHITECTURE, but `TESTING.md` and
`IMPLEMENTATION_SUMMARY.md` still carry stale numbers, and `TESTING.md` describes CI steps that don't
run. On a repo where separate agents execute handoff plans, actively-wrong docs are worse than
missing ones — an executor that reads "CI runs linters" trusts a gate that isn't there.

**Findings addressed:** F6 (audit at `df82c72`).

**Effort:** S · **Depends on:** best sequenced **after plan 014** — once 014 adds a lint step, the
"CI runs linters" line in `TESTING.md` becomes true rather than something to delete. If 014 has
**not** landed, write the CI section to match the **current** `ci.yml` (no lint step) instead.

**In scope (only these files may change):**
- `TESTING.md`
- `IMPLEMENTATION_SUMMARY.md`
- `.cursorrules`
- `README.md`

**Out of scope:** **No** `src/**`, `dist/**`, `package.json`, or `.github/**` changes. If a fact
seems wrong, fix the **doc** to match the system — never change code/CI to match a doc. `git status`
must show `dist/` clean and no source touched.

---

## Handoff conventions (read first)

- **Base branch:** branch from `production` (or off the 014 branch if 014 isn't merged yet, so the
  CI claims line up). Create `advisor/016-docs-truth-up-round-2`. PRs target `origin/production`. Do
  **not** commit to `production`; do **not** push/PR unless told.
- **Commits:** one commit per logical step; sentence-case imperative messages.
- **Drift check first:** open `.github/workflows/ci.yml` and the four in-scope docs and confirm the
  "Current state" facts below still hold. Re-derive any number you cite (don't trust this plan's
  figures blindly — they were captured at `df82c72`).
- **Shared STOP conditions:** a quoted fact no longer matches; `git status --porcelain` shows any
  `src/` or `dist/` change; a gate fails.
- **Index update:** on completion, set this plan's row in `plans/README.md` to `DONE`.
- **No build:** this plan changes only docs; do **not** run `npm run build`, and `git status` must
  show `dist/` clean.

---

## Current state (verify before editing — re-derive numbers yourself)

**`ci.yml` actually does:** checkout → setup-node (node 20, npm cache) → `npm ci` → `npm run
typecheck` → `npm run build` → a `dist/` freshness check → `npm run test:run`. (After plan 014 it
also runs `npm run lint`.) It does **not** enforce a coverage threshold and does **not** run security
scans.

**`TESTING.md` problems:**
- `:235-243` "Continuous Integration" claims the pipeline "Runs linters" (only true after 014),
  "Fails if coverage drops below threshold" (**false**), "Runs security scans" (**false**).
- `:7` "We maintain **52.08% code coverage** on business logic." (stale)
- `:27-44` "Test Structure" tree lists only `plugin/main.test.ts`, `shared/sanitizeLog.test.ts`, and
  six `ui/components/*` files. The repo actually has **14** test files / **159** tests, including
  `plugin/core.test.ts`, `shared/customName.test.ts`, `ui/App.test.tsx`,
  `ui/components/PresetCreator.test.tsx`, `ui/components/Modal.test.tsx`,
  `ui/utils/bugReporting.test.ts`. Re-derive with `find src -name '*.test.*' -not -path '*/coverage/*'`.

**`IMPLEMENTATION_SUMMARY.md` problems:**
- `:7` and `:245-246` "107 passing tests" / "52.08%" (actual: 159 passing). `:234`/`:250`
  "170.46 kB" bundle. `:48` "main.test.ts - 11 tests", `:64` "49 tests" (stale counts).
- `:220-231` "Dependencies Added" block lists `happy-dom` and `vitest ^4.0.16` /
  `@vitest/coverage-v8 ^4.0.16` — but `package.json` has `vitest ^4.1.8`,
  `@vitest/coverage-v8 ^4.1.8`, and **no** `happy-dom` (the test env is `jsdom`).
- `:45` already carries a "snapshot from the v2.0 milestone" disclaimer — you may keep historical
  numbers under that framing, but the **deps block** and any CI-adjacent claim must be corrected.

**`.cursorrules:249`** "Keep bundle size under 200kb (currently ~165kb)" — actual `dist/index.html`
is ≈ 172–176 KB (re-derive: `wc -c dist/index.html`, or the size vite prints on `npm run build`).

**`README.md:73-78`** architecture diagram lists `ui/ plugin/ shared/` but omits that `plugin/` is a
15-line `main.ts` shim + `core.ts` (the real dispatcher) — a one-line note prevents executors from
adding handlers to the wrong file (plan 012 already has to warn about this).

## Tasks

### Task 1: Fix the TESTING.md CI section + counts

**File:** `TESTING.md`

- [ ] Rewrite `:235-243` to match the real `ci.yml`: typecheck → build → `dist/` freshness check →
  tests (+ `lint` **iff** 014 landed). Remove the coverage-threshold and security-scan claims (or
  mark them explicitly "not currently configured").
- [ ] Update the coverage line (`:7`) and the "Test Structure" tree (`:27-44`) to reflect the real
  14 test files. If you cite a coverage %, get it from `npm run test:coverage` (writes to the
  gitignored `coverage/` dir — fine) and don't commit any coverage artifact.
- [ ] Commit: `"Correct TESTING.md CI description and test inventory"`

### Task 2: Fix IMPLEMENTATION_SUMMARY.md

**File:** `IMPLEMENTATION_SUMMARY.md`

- [ ] Correct the "Dependencies Added" block (`:220-231`) to match `package.json` (remove
  `happy-dom`; fix the vitest/coverage versions to `^4.1.8`).
- [ ] Update the test count / coverage / bundle numbers (`:7`, `:234`, `:245-246`, `:250`, and the
  per-file counts at `:48`/`:64`) — either to current values or reframed as "(historical milestone —
  see TESTING.md / `npm run test:coverage` for current)". Keep the existing `:45` disclaimer.
- [ ] Commit: `"Truth up IMPLEMENTATION_SUMMARY numbers and dependency list"`

### Task 3: Fix .cursorrules + README

- [ ] `.cursorrules:249`: correct the bundle figure to the re-derived value (e.g. "currently
  ~176kb").
- [ ] `README.md:73-78`: add a one-line note that `plugin/` splits into a thin `main.ts` entry shim
  and `core.ts` (which holds `handleUIMessage` and all plugin logic).
- [ ] Commit: `"Correct bundle figure and note the plugin main/core split"`

### Task 4: Update the plans index

- [ ] Set this plan's row in `plans/README.md` to `DONE`.
- [ ] Commit: `"Mark plan 016 done in the plans index"`

## Done criteria

- [ ] No doc claims a CI step that `ci.yml` does not perform.
- [ ] The `TESTING.md` test tree matches `find src -name '*.test.*' -not -path '*/coverage/*'`.
- [ ] No doc cites a dependency absent from `package.json` (no `happy-dom`; correct vitest versions).
- [ ] `git status --porcelain` shows **only** the four in-scope docs (+ the `plans/README.md` row)
  changed; `dist/` and `src/` are clean.
- [ ] `plans/README.md` row 016 set to `DONE`.

## STOP conditions

Stop and report if: you are tempted to change code/CI to make a doc true (fix the doc instead);
`git status` shows any `src/`/`dist/` change; a quoted fact no longer matches HEAD and you can't
re-derive the correct value.

## Maintenance notes

- When `ci.yml` changes, the `TESTING.md` CI section is the one to keep in sync.
- Reviewer: confirm zero `src/`/`dist/` changes and that every number cited is re-derivable from the
  repo at HEAD.
