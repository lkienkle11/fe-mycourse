## Why

On mobile viewports, `DashboardLayout`'s denial branch (`src/components/common/dashboard/dashboard-layout.tsx:200` to `213`) renders `HeaderDashboard` without a `leading` element. `HeaderDashboard`'s own logo and title block is hidden below the `md` breakpoint (`hidden md:flex`), so the only thing that can fill the header's left slot on mobile is whatever `leading` supplies. The authorized branch supplies a hamburger trigger there; the denial branch supplies nothing. The result: a visitor denied access to `instructor`, `admin`, or `sysadmin` on mobile sees an empty top left corner, no brand mark, no way to tell this is still MyCourse, while desktop keeps the logo visible in both states. This regresses the `unify-dashboard-forbidden-ui` requirement that "the dashboard header ... remains visible" alongside a denial state, since an empty corner is not a meaningfully visible header.

## What Changes

- On mobile (below `md`), when `DashboardLayout` renders its denial state (`forbidden` or `unauthorized`), show the MyCourse logo alone (no "mycourse.io" title text) in the header's left slot, in place of the hamburger trigger that only appears in the authorized state.
- Leave the authorized branch untouched: the hamburger trigger (`DashboardMenuTrigger`) keeps opening the sidebar exactly as today, since a sidebar exists to open there. The denial branch never renders a sidebar, so a hamburger has nothing to open and the logo is the correct mobile affordance instead.
- No change to desktop rendering (`HeaderDashboard`'s own `hidden md:flex` logo and title block already covers `md+` in both states), to `useSatisfiesPermissions`/`useGetMe` gating logic, to which `StatusErrorPage` variant is chosen, or to any error boundary outside `DashboardLayout`'s own permission gate (`error.tsx`, `global-error.tsx` are out of scope, per explicit decision during exploration).

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `dashboard-access-control`: tighten the existing "header remains visible alongside the denial state" requirement with an explicit scenario for narrow viewports, so the header's brand affordance (not just the DOM node) stays visible when the section-specific navigation control (hamburger) is absent.

## Impact

**Code expected to change:**
- `src/components/common/header/brand-logo-link.tsx` (new) — `BrandLogoLink`, a shared logo-only, no-title `Link` to `homeHref`, extracted from the markup that was duplicated between `header-mobile-bar.tsx` and this change's first draft of `dashboard-layout.tsx`; accepts an optional `className` to cover both call sites (see design.md's Decisions — revised after the user flagged the duplication).
- `src/components/common/header/header-mobile-bar.tsx` — replaced its inline `Link` + `MainLogo` markup with `<BrandLogoLink />`; no visual change.
- `src/components/common/header/index.ts` — barrel export for `BrandLogoLink`.
- `src/components/common/dashboard/dashboard-layout.tsx` (`DashboardLayout`, denial branch `~200-213`) — pass `leading={<BrandLogoLink className="md:hidden" />}` to `HeaderDashboard` in this branch (no local wrapper component; a bare `className` prop was enough).
- `src/components/common/header/header-dashboard.tsx` — no change expected; its `leading` slot already supports arbitrary content, this is a caller-side fix.

**Documentation expected to update** (grep-confirmed references to the affected behavior):
- `docs/screens.md:287` — the "Denied:" line describing the denial-branch header layout.
- `docs/components.md:116,122,132` — the `HeaderMobileBar` row, the `header/index.ts` barrel list, and the `DashboardLayout` row's description of what renders on denial; plus a new `BrandLogoLink` row.
- `docs/reusable-assets.md:367` — the dashboard-shell asset description's "Layout permission gate: on denial..." sentence.
- `docs/architecture.md:125-126`, `docs/folder-structure.md:166-167` — checked, no change expected: `brand-logo-link.tsx` lands in the already-listed `header/` folder, no new folder entry needed beyond the `components.md` table row above.
- Current project's `.context/session-<SESSION_ID>.md` — end-of-task learning summary, per AGENTS.md.

**Out of scope:**
- `error.tsx` / `global-error.tsx` boundaries and any denial state rendered inside an already-authorized page (e.g. `editor-page.tsx`'s per-resource `StatusErrorPage`) — those already render inside the authorized branch, where the hamburger and sidebar remain correct and unaffected.
- Any change to which permissions gate a section, or to `permissionMode` evaluation.
- Any change to `StatusErrorPage` itself.

**Dependency note:** `dashboard-access-control` is the capability introduced by `unify-dashboard-forbidden-ui` (all 24 tasks complete, currently merged into `main`, not yet archived via `openspec archive`). This change's spec delta is written against that capability's requirements as merged in code today; if `unify-dashboard-forbidden-ui` is archived before this change, the delta applies against the archived base spec normally, if archived after, the archive step should reconcile both changes' deltas for `dashboard-access-control` together.
