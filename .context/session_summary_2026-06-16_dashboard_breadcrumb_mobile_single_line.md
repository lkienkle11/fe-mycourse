# Session summary — mobile breadcrumb single-line collapse (FE)

**Date:** 2026-06-16  
**Trigger:** Keep dashboard breadcrumb on one line on mobile when possible; collapse middle items to ellipsis while preserving first + last; allow wrap only as last resort. One shared layout for mobile and desktop.

## Phase 1 — Discovery

- Read `dashboard-page-header.tsx`, `breadcrumb.tsx` (`BreadcrumbEllipsis` available).
- GitNexus: `impact({ target: "DashboardPageHeader", direction: "upstream" })` — **LOW**, 0 direct callers in index (layout-only usage).

## Phase 2 — Implementation

| File | Change |
|------|--------|
| `src/components/common/dashboard/dashboard-page-header.tsx` | Extracted `DashboardBreadcrumbTrail` with one shared `breadcrumbs.map()` loop. Mobile overflow pipeline: `full` → `collapsed` (first + `BreadcrumbEllipsis` + last) → `wrap`. Tailwind `truncate`, `flex-nowrap`, `md:flex-wrap` on same elements. |
| `docs/components.md` | Documented mobile collapse behavior. |

### Mobile behavior (3 steps)

1. **Full** — render all crumbs, `flex-nowrap`
2. **Overflow?** → **Collapsed** — hide middle, show `...`, truncate first (38%) / last (52%)
3. **Still overflow?** → **Wrap** — allow `flex-wrap` as last resort

Desktop (`md+`): always full trail via `isMobile === false`.

## Phase 3 — Quality + close-out

- `npm run lint:biome` — pass
- `npm run lint` — pass
- `npm run build` — pass
- `npm run quality:deps` — pass
- `gitnexus_detect_changes({ scope: "all" })` — run at close-out
