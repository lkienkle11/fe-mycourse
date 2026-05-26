# Session: Header home navigation unification

**Date:** 2026-05-26  
**Scope:** `fe-mycourse` only

## What changed

### Shared utility
- Added `src/lib/navigation/home.ts`:
  - `homeHref` from `PUBLIC_ROUTES.home`
  - `navigateToHome(router)` for client-side click handlers

### UI touchpoints updated
- `src/components/common/header/header.tsx`
  - Desktop brand wrapper changed to `Link` and now uses `homeHref`
- `src/components/common/header/header-mobile-bar.tsx`
  - Mobile logo `Link` now uses `homeHref`
- `src/components/common/header/header-dashboard.tsx`
  - Dashboard brand wrapper changed to semantic button and uses `navigateToHome(router)`
- `src/components/common/dashboard/dashboard-layout.tsx`
  - Sidebar mobile header brand `Link` now uses `homeHref` (existing close-sidebar behavior preserved via `onClick={close}`)

## Docs synced
- `docs/components.md` updated with current home-navigation behavior for:
  - `Header`
  - `HeaderMobileBar`
  - `HeaderDashboard`
  - `DashboardLayout`
- `docs/folder-structure.md` updated with `src/lib/navigation/home.ts`
- `docs/router.md` updated with reusable helper reference for home navigation

## Validation
- `npm --prefix "/Users/kienlt/Documents/projects/mycourse-full/fe-mycourse" run lint` ✅
- `npm --prefix "/Users/kienlt/Documents/projects/mycourse-full/fe-mycourse" run build` ✅
- `ReadLints` on all touched FE files: no new diagnostics ✅

## GitNexus
- Pre-edit impact checks (upstream) run for:
  - `Header`
  - `HeaderDashboard`
  - `HeaderMobileBar`
  - `DashboardLayout`
- Risk for all four symbols: **LOW**
- No HIGH/CRITICAL warnings encountered

## Follow-ups
- Optional: migrate any remaining hard-coded `"/"` brand links in non-header feature modules to `homeHref` for consistency.
