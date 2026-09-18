## Context

`DashboardLayout` (`src/components/common/dashboard/dashboard-layout.tsx:200-210`) already computes `canAccessDashboard` from `useSatisfiesPermissions({ permissions, permissionMode })` and, on failure, renders `DashboardUnauthorized` (`src/components/common/dashboard/dashboard-unauthorized.tsx`) — a plain heading + paragraph — inside the same wrapper (`HeaderDashboard` + `LoginSignupPopup`) used today. `useGetMe()` (`src/hooks/auth/use-auth-store.ts`) already exposes `me`, which is `null` until a session resolves. `StatusErrorPage` (`src/components/shared/status-error-page.tsx`) already exists with `unauthorized`/`forbidden` variants, default copy from `errors.statusPage.<variant>.*`, a default action (`homeHref`), and a `fillViewport` flag for filling the space below a page header. See proposal.md for why this gap exists.

## Goals / Non-Goals

**Goals:**
- Make the section-level dashboard denial state visually and structurally identical in kind to the per-resource `StatusErrorPage` denial state already shown elsewhere.
- Distinguish "not authenticated" from "authenticated but missing permission" using data `DashboardLayout` already has, without a new fetch or a new permission concept.

**Non-Goals:**
- Not changing which permissions gate `instructor`, `admin`, or `sysadmin`, or how `permissionMode` ("any"/"all") is evaluated.
- Not adding a redirect; the visitor stays on the URL, as today.
- Not touching the per-resource `StatusErrorPage` usage in the course editor (`editor-page.tsx`) or the `error.tsx`/`global-error.tsx` boundaries — those are already correct.

## Decisions

**Variant selection: derive from `me`, not from a new prop.** `DashboardLayout` already calls `useGetMe()` for `isLoading`; read `me` from the same call and pass `variant={me ? "forbidden" : "unauthorized"}` into `StatusErrorPage` when `!canAccessDashboard`. Alternative considered: add an explicit `isAuthenticated` prop threaded through every `layout.tsx` call site — rejected, since `DashboardLayout` is the single place that already knows both facts and every call site would otherwise need to duplicate the same `me` check for no benefit.

**Copy: use `StatusErrorPage`'s existing default copy, no dashboard-specific override.** `errors.statusPage.unauthorized.*` and `errors.statusPage.forbidden.*` already read as generic enough for a whole-section denial (unlike the course-editor case, which needed course-specific action text). Alternative considered: keep a dashboard-specific string (`dashboard.unauthorized.*`) and pass it via `title`/`description` — rejected as the exact duplication this change removes; if the section-gate copy ever needs to diverge from the generic one, that's a reason to add a distinct variant or override at that time, not to keep an unused parallel string today.

**Action target: default (`homeHref`), not the dashboard root.** The visitor who fails a dashboard section's gate may also fail the app's home-dashboard redirect logic (e.g. an instructor route denied to a non-instructor); routing them to a generic reachable page (`homeHref`, `StatusErrorPage`'s default) avoids building a second denial loop. Alternative considered: link back to `instructorRootHref`/`adminRootHref` per section — rejected as it re-enters the same gate for a visitor who lacks that section's role entirely.

**`fillViewport`: `true`.** The denial state replaces the entire body below `HeaderDashboard`, same shape as a route-level full page, not content embedded inside another page's own layout (contrast with `editor-page.tsx`, which embeds it inside the dashboard shell and uses the default `false`).

**Cleanup: keep `DashboardUnauthorized` and its message keys, marked `@deprecated`, rather than deleting.** Revised after initial implementation deleted it: the user asked to restore the file instead of removing it, annotated so nobody wires it back in by mistake. `DashboardLayout` no longer imports or renders it (confirmed via code search: nothing under `src/` references it), so it is inert dead code, not a second active gate UI — the "two components doing the same job" risk from the original decision doesn't apply once nothing calls the deprecated one.

## Risks / Trade-offs

- [`DashboardUnauthorized` and its message keys, left in the tree unreferenced, drift out of date or get miscopied into new code despite the `@deprecated` tag] → Accepted: the tag plus this design doc's decision above are the guardrail; if this proves insufficient in practice, delete it for real rather than adding more process around dead code.
- [`StatusErrorPage`'s default action always points home, so a visitor denied one dashboard section but authorized for another gets routed away from the app shell entirely instead of to a section they *can* reach] → Accepted for this change: computing "a section this visitor can reach" would require walking every section's permission set from this one component, which the current sidebar-filtering logic (`useFilteredDashboardItems`) already does elsewhere for the authorized case; wiring that in is more scope than this UI-consistency fix needs, and `homeHref` still gets the visitor out of the dead end.
