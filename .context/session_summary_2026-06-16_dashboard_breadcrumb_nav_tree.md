# Session summary — dashboard breadcrumb derived from nav tree (FE)

**Date:** 2026-06-16  
**Trigger:** Refactor `page-header.ts` to stop duplicating breadcrumb item ids; derive breadcrumb labels/links from existing `*DASHBOARD_ITEMS` sidebar config.

## Phase 1 — Discovery

- Read uncommitted dashboard page-header work (layout-owned header, Zustand overrides, `page-header.ts` route registry).
- Read docs: `docs/router.md`, `docs/screens.md`, `docs/folder-structure.md`, `docs/reusable-assets.md`.
- Git audit: branch `feat/outline-kind-icons-mobile-reorder`, in-progress dashboard header feature (uncommitted).
- GitNexus:
  - `query({ query: "dashboard page header breadcrumb resolve metadata", repo: "fe-mycourse" })` — located resolver + layout flow.
  - `impact({ target: "resolveDashboardPageHeaderMetadata", direction: "upstream", repo: "fe-mycourse" })` — **LOW**, 1 d=1 caller (`DashboardShellContent`).

## Phase 2 — Implementation

| File | Change |
|------|--------|
| `src/lib/navigation/dashboard-page-header.ts` | Added `findDashboardItemPathByHref`, `detectDashboardRole`, `resolveBreadcrumbsFromNavTree`. Breadcrumbs now walk the role nav tree by `href` instead of manual item-id lists. |
| `src/constants/dashboard/page-header.ts` | Removed ~150 lines of duplicated `breadcrumbs` arrays. Routes now only declare `match`, `titleKey`, `descriptionKey`. Regex course-editor route uses `breadcrumbHref: instructorCoursesHref`. |
| `src/types/dashboard/index.ts` | `DashboardHeaderRouteEntry.breadcrumbs` optional; added optional `breadcrumbHref` for regex routes. |
| `docs/reusable-assets.md`, `docs/router.md`, `docs/screens.md`, `docs/folder-structure.md` | Documented nav-tree breadcrumb derivation. |

### How it works (beginner-friendly)

1. Each dashboard page route has an `href` (e.g. `/admin/taxonomy/levels`).
2. The sidebar config (`ADMIN_DASHBOARD_ITEMS`, etc.) already maps those `href`s to menu items with labels.
3. The resolver finds the matching item in the tree, walks up to collect parent groups (Taxonomy → Course levels), prepends the role root (Admin), and builds the breadcrumb trail automatically.
4. Page titles/descriptions still come from i18n keys in `page-header.ts` because they differ from sidebar labels on some pages.

## Phase 3 — Quality + close-out

- `npm run lint:biome` — pass
- `npm run lint` — pass
- `npm run build` — pass
- `npm run quality:deps` — pass (pre-existing Quill jscpd clone only)
- `gitnexus_detect_changes({ scope: "all" })` — run at close-out

## Behavior note

Instructor course list breadcrumb now includes the full nav ancestry (`Instructor > My Courses > Course List`) because the href lives on the child item `instructor-courses-list`. Previously it stopped at the parent only. This aligns breadcrumb links with the actual sidebar structure.
