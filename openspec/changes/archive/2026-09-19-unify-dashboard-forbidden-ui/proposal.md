## Why

Every instructor/admin/sysadmin route is gated client-side by `DashboardLayout`, and a failed permission check currently renders `DashboardUnauthorized`: a bare "Access denied" heading and one line of body text, with no icon, no action, and no distinction between "not logged in" and "logged in but missing the role." The app already built a status-aware full-page component (`StatusErrorPage`, from `frontend-error-handling`) for exactly this kind of denial and is using it for per-resource 401/403s, but nobody retrofitted the section-level dashboard gate onto it, so the two "you can't be here" experiences in the app now look and behave differently for no product reason.

## What Changes

- Replace `DashboardUnauthorized`'s rendering with the shared `StatusErrorPage` component, selecting the `unauthorized` variant when the visitor is not authenticated and the `forbidden` variant when they are authenticated but lack the required permission(s).
- Keep the existing gate mechanics unchanged: no redirect, `DashboardLayout` still renders the dashboard header and `LoginSignupPopup` alongside the failure state, and the check still runs via `useSatisfiesPermissions` per-section (`instructor`, `admin`, `sysadmin`).
- Give the rendered state a real recovery action (e.g. link back to the app's home/dashboard root) consistent with how `StatusErrorPage` is already used in the course editor's per-resource error path, instead of the current dead-end message.
- Keep `DashboardUnauthorized` in the tree, unreferenced, marked `@deprecated` (revised from an earlier version of this proposal that removed it — the user asked to restore it instead of deleting).

## Capabilities

### New Capabilities
- `dashboard-access-control`: the client-side role/permission gate shared by every instructor, admin, and sysadmin route — what triggers a denial, and what full-page state is shown for each denial reason.

### Modified Capabilities
(none — `frontend-error-handling`'s existing requirements are unchanged; `dashboard-access-control` consumes its shared `StatusErrorPage` component as-is)

## Impact

**Code/modules expected to change** (confirmed via `gitnexus_context`/repo search; see design.md for rationale):
- `src/components/common/dashboard/dashboard-layout.tsx` (`DashboardLayout`, `dashboard-layout.tsx:200-210`) — swap the failure branch to render `StatusErrorPage`, deriving the variant from `useGetMe().me`. Sole d=1 consumers of this branch are the three section layouts below (indirect, via props).
- `src/app/[locale]/instructor/layout.tsx`, `src/app/[locale]/admin/layout.tsx`, `src/app/[locale]/sysadmin/layout.tsx` — no code change expected; listed because they are `DashboardLayout`'s direct callers and must be re-verified (task 2.3) after the swap.
- `src/components/common/dashboard/dashboard-unauthorized.tsx` (`DashboardUnauthorized`) — kept, no longer imported by `dashboard-layout.tsx`; annotated `@deprecated` pointing at `StatusErrorPage` as the replacement.
- `src/components/common/dashboard/index.ts` — keeps the `DashboardUnauthorized` barrel export (component still exists, just unused).
- `src/messages/en.ts:302-305`, `src/messages/vi.ts:300-303` (equivalent block) — `dashboard.unauthorized.*` keys kept, since the deprecated component still reads them.
- No test currently asserts on `DashboardUnauthorized`'s rendered text (confirmed by repo search); none needed updating.

**Documentation expected to update** (grep-confirmed references to the symbols above):
- `docs/architecture.md:125` — folder listing notes `DashboardUnauthorized` as deprecated/unused.
- `docs/components.md:137-139` — component table row kept, marked deprecated/unused; barrel-export line lists it again.
- `docs/screens.md:287` — dashboard-shell description already updated to name `StatusErrorPage` (the component actually rendered); left as-is since `DashboardUnauthorized` isn't part of the live render path.
- `docs/reusable-assets.md:364,367` — named-component list keeps `DashboardUnauthorized`, description notes it's superseded and deprecated.
- `docs/folder-structure.md:167` — folder-contents comment lists `DashboardUnauthorized` again, marked deprecated/unused.
- Current project's `.context/session-<SESSION_ID>.md` — end-of-task learning summary, per AGENTS.md.

**Out of scope:** no backend change; no change to which permissions gate which section (`instructor`, `admin`, `sysadmin` keep their existing `PERMISSIONS.*` checks).
