## 1. Pre-change impact analysis (GitNexus, per AGENTS.md)

- [x] 1.1 Refresh the index (`npx gitnexus analyze` — the index was 7 commits behind HEAD at planning time) and confirm `gitnexus://repo/fe-mycourse/context` reports it current
- [x] 1.2 Run `gitnexus_impact({target: "DashboardLayout", direction: "upstream"})` and record the reported risk level and d=1 callers (currently: `DashboardLayout` is used by `src/app/[locale]/instructor/layout.tsx`, `admin/layout.tsx`, `sysadmin/layout.tsx` via `RoleDashboardLayout`); do not proceed to 2.x if risk is reported HIGH/CRITICAL without flagging it first
- [x] 1.3 Run `gitnexus_impact({target: "DashboardUnauthorized", direction: "upstream"})` and confirm its only caller is `DashboardLayout` (`dashboard-layout.tsx`) before deleting it in task 3.1 — if any other caller is reported, stop and re-scope task 3 instead of deleting

## 2. Wire `StatusErrorPage` into the dashboard gate

- [x] 2.1 In `src/components/common/dashboard/dashboard-layout.tsx`, read `me` from the existing `useGetMe()` call and compute the denial variant as `me ? "forbidden" : "unauthorized"`
- [x] 2.2 In the same file, replace the `<DashboardUnauthorized />` render in the `!isLoading && !canAccessDashboard` branch (currently `dashboard-layout.tsx:200-210`) with `<StatusErrorPage variant={...} fillViewport />` (component at `src/components/shared/status-error-page.tsx`), keeping `HeaderDashboard` and `LoginSignupPopup` exactly as rendered today; verify the branch still type-checks with no new required props left unset
- [x] 2.3 Verify manually (or via an existing test harness for `DashboardLayout`) that: an unauthenticated visitor hitting an instructor/admin/sysadmin route sees the `unauthorized` variant, and an authenticated visitor missing the section's permission sees the `forbidden` variant, for all three sections (`instructor`, `admin`, `sysadmin`)

## 3. Remove the superseded component and copy

- [x] 3.1 ~~Delete `src/components/common/dashboard/dashboard-unauthorized.tsx` and remove its export from the `dashboard/index.ts` barrel~~ — done, then reversed per user request; see group 6 below. Confirmed via a repo-wide search that no import of `DashboardUnauthorized` remains anywhere in `src/` (its export still exists in the barrel, but nothing imports it)
- [x] 3.2 ~~Remove the now-unused `dashboard.unauthorized.*` keys~~ — done, then restored per group 6 (the deprecated component still reads them)
- [x] 3.3 Delete or update any existing test that asserts on `DashboardUnauthorized`'s rendered text — none existed (confirmed by repo search), so nothing to do

## 4. Documentation sync (files confirmed to reference the removed/changed symbols)

- [x] 4.1 ~~`docs/architecture.md:125` — remove `DashboardUnauthorized` from the `dashboard/` folder listing~~ — restored per group 6, now marked deprecated/unused instead of removed
- [x] 4.2 ~~`docs/components.md:137,139` — remove the `DashboardUnauthorized` row~~ — row restored per group 6, marked deprecated/unused instead of removed
- [x] 4.3 `docs/screens.md:287` — update the dashboard-shell description ("Unauthorized: HeaderDashboard + trailing locale (lg+) + DashboardUnauthorized (no sidebar)") to describe the `StatusErrorPage` variant now rendered instead — kept as-is after group 6, since `DashboardUnauthorized` is no longer part of the live render path even though the file itself was restored
- [x] 4.4 ~~`docs/reusable-assets.md:364,367` — remove `DashboardUnauthorized` from the named-component list~~ — restored per group 6, description now notes it's superseded and deprecated instead of removed
- [x] 4.5 ~~`docs/folder-structure.md:167` — remove `DashboardUnauthorized` from the folder-contents comment~~ — restored per group 6, marked deprecated/unused instead of removed
- [x] 4.6 Update the current project's `.context/session-<SESSION_ID>.md` with what changed and why, per AGENTS.md's end-of-task learning summary requirement

## 5. Validate (per AGENTS.md pre-commit requirements)

- [x] 5.1 Run the frontend's full check suite (`npm run check-all`) and fix any type, lint, or test failures introduced by this change — re-run again after group 6 (task 6.4)
- [x] 5.2 Run `openspec validate unify-dashboard-forbidden-ui --strict` and resolve any reported issues — passed after group 6
- [x] 5.3 Run `gitnexus_detect_changes({scope: "all"})` and confirm the reported changed symbols/files match exactly this task list (2.x/3.x edits + 4.x docs) — investigate and resolve any unexpected symbol before committing. Result: 17 changed symbols across 12 files — the expected `DashboardLayout`/`DashboardUnauthorized` + 5 docs sections, plus `AGENTS.md`/`CLAUDE.md`'s GitNexus symbol-count badge (auto-updated as a side effect of the task-1.1 `npx gitnexus analyze` refresh: 4150→4170 symbols, 10366→10397 relationships). No unexpected app-code symbol found; risk reported `medium` from the 4 `DashboardLayout`-rooted cross-community processes, all expected given the edit. Re-run after group 6 (task 6.4).
- [x] 5.4 After committing, re-run `npx gitnexus analyze` (add `--embeddings` if `.gitnexus/meta.json`'s `stats.embeddings` is non-zero) to keep the index current for the next session — completed after the grouped commits; embeddings were `0`, and the standard analysis indexed 4,171 nodes, 10,398 edges, 158 clusters, and 300 flows

## 6. Reversal: restore `DashboardUnauthorized` as deprecated instead of deleted

User asked, after task 3/4 above shipped, to restore `DashboardUnauthorized` rather than delete it, annotated as deprecated. This group undoes the deletion parts of groups 3-4 while keeping the group-2 `StatusErrorPage` wiring intact.

- [x] 6.1 Restore `src/components/common/dashboard/dashboard-unauthorized.tsx` from git history (`git checkout HEAD -- <path>`) and add a `@deprecated` JSDoc comment pointing at `StatusErrorPage` as the replacement; do not re-import it into `dashboard-layout.tsx`
- [x] 6.2 Restore the `DashboardUnauthorized` barrel export in `src/components/common/dashboard/index.ts`, and restore the `dashboard.unauthorized.*` keys in `src/messages/en.ts` and `src/messages/vi.ts` (the deprecated component still reads them)
- [x] 6.3 Update `docs/architecture.md`, `docs/components.md`, `docs/reusable-assets.md`, `docs/folder-structure.md` to list `DashboardUnauthorized` again, each marked deprecated/unused; leave `docs/screens.md` describing `StatusErrorPage` since that's still the live render path
- [x] 6.4 Re-run `npm run check-all` (deadcode/knip may flag the now-unreferenced export) and `openspec validate unify-dashboard-forbidden-ui --strict`; fix any failures. Both passed clean — knip did not flag `DashboardUnauthorized`'s barrel export as unused.
- [x] 6.5 Re-run `gitnexus_detect_changes({scope: "all"})` after 6.4 passes, and update the session context file (`.context/session-<SESSION_ID>.md`) with this reversal. Result: 17 symbols / 9 files (down from 12 — `index.ts`, `en.ts`, `vi.ts` are now byte-identical to HEAD again since they were restored to their original content); only `dashboard-unauthorized.tsx` (new `@deprecated` comment), `dashboard-layout.tsx`, 5 docs, and the `AGENTS.md`/`CLAUDE.md` badge remain changed. No unexpected symbol.
