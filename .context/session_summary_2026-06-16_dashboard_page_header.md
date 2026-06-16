# Session summary — dashboard breadcrumb + shared page header (FE)

**Date:** 2026-06-16  
**Trigger:** Implement a shared dashboard breadcrumb and page-header system for all current FE dashboard routes, including dynamic instructor course editor tabs, while keeping the dashboard layout as the single renderer.

## Discovery and boundary read

- Read FE context and docs before editing, including `docs/router.md`, `docs/screens.md`, `docs/components.md`, `docs/folder-structure.md`, `docs/reusable-assets.md`, and the existing dashboard UI session summaries.
- Did a boundary read of BE context and structure docs to understand module ownership and avoid crossing into backend implementation scope.
- Reviewed recent FE and BE git history/diffs for current project direction and to keep docs aligned with the latest code state.

## GitNexus

- Initial FE impact checks before edits:
  - `DashboardLayout` — **LOW**
  - `filterDashboardItems` — **LOW**
  - `InstructorCoursesPage` — **LOW**
  - `InstructorCourseEditorPage` — **LOW**
  - `CourseReviewPage` — **LOW**
  - `TaxonomyListPage` — **LOW**
  - `InstructorRosterPage` — **LOW**
  - `InstructorApprovalsPage` — **LOW**
  - `InstructorProfilesPage` — **LOW**
  - `InstructorExpertisePage` — **LOW**
  - `InstructorTicketsPage` — **LOW**
  - `InstructorTicketsAdminPage` — **LOW**
  - `AdminDashboardPage` — **LOW**
  - `InstructorDashboardPage` — **LOW**
  - `SysadminDashboardPage` — **LOW**
- `DashboardItem` and dashboard item constant symbols were not exposed cleanly in the local FE GitNexus index, so those areas were handled by code inspection plus final diff review instead of symbol-level graph inspection.
- Final FE index sync completed with `npx gitnexus analyze --force`.

## Changes

| File | Change |
|------|--------|
| `src/components/common/dashboard/dashboard-page-header.tsx` | Added the shared dashboard header renderer: breadcrumb, title, optional description, optional actions. |
| `src/components/common/dashboard/dashboard-page-header-state.tsx` | Added provider + registration hook so pages can override header data at runtime without creating a second header system. |
| `src/components/common/dashboard/dashboard-layout.tsx` | Moved dashboard page-heading ownership into the shell and resolved route metadata from pathname + current dashboard item tree. |
| `src/types/dashboard/index.ts` | Centralized `DashboardRole` and shared dashboard page-header types so the resolver and components no longer declare or import component-local header types. |
| `src/constants/dashboard/page-header.ts` | Centralized static dashboard header route metadata and role-root config under the existing dashboard constants area. |
| `src/lib/navigation/dashboard-page-header.ts` | Reduced this file to resolver-only logic for dashboard breadcrumb/title/description, including dynamic instructor course editor tabs. |
| `src/components/common/dashboard/index.ts` | Re-exported the new shared header assets. |
| `src/screen/admin/page.tsx`, `src/screen/instructor/page.tsx`, `src/screen/sysadmin/page.tsx` | Removed duplicated root-page heading markup because the layout now renders it. |
| `src/screen/instructor/courses/page.tsx` | Moved top-right CTA into shared header actions and removed duplicated local title/description block. |
| `src/screen/instructor/courses/editor-page.tsx` | Registered dynamic breadcrumb/title/actions from loaded course state and active tab; removed competing local page header. |
| `src/screen/instructor/tickets/page.tsx`, `src/screen/common/instructor/instructor-roster-page.tsx`, `src/screen/common/taxonomy/taxonomy-list-page.tsx` | Moved page-level add/create actions into shared header actions. |
| `src/screen/common/course/course-review-page.tsx`, `src/screen/common/instructor/instructor-approvals-page.tsx`, `src/screen/common/instructor/instructor-profiles-page.tsx`, `src/screen/common/instructor/instructor-expertise-page.tsx`, `src/screen/common/instructor/instructor-tickets-admin-page.tsx` | Removed duplicated top-level heading/description markup now covered by the shared layout header. |
| `docs/components.md`, `docs/folder-structure.md`, `docs/reusable-assets.md`, `docs/router.md`, `docs/screens.md` | Updated docs to reflect the new layout-owned dashboard page header and route metadata flow. |

## Header behavior

- Dashboard headers now render in this order: breadcrumb, title, optional description, optional actions.
- Static dashboard pages derive metadata from one shared route resolver.
- Static route definitions and role-root values live in `src/constants/dashboard/page-header.ts`.
- Dynamic instructor course editor pages register runtime metadata so the breadcrumb leaf and title can follow loaded course data and active editor tab.
- Breadcrumbs start at the active dashboard root and do not include a global home item.

## Quality

- `npm run format:biome` — pass
- `npm run biome` — pass
- `npm run lint` — pass
- `npm run test` — pass (`test` script currently prints the placeholder no-suite message)
- `npx tsc --noEmit` — pass
- `npm run quality:deps` — pass
  - `madge` found no circular dependencies
  - `jscpd` reported one pre-existing clone in Quill helper files outside this task scope
- `npm run build` — pass

## Notes

- This implementation stayed FE-only. No backend source files, backend quality gates, or backend docs were modified.
- The final closeout used FE GitNexus sync plus full git diff review because the local CLI in this environment does not expose the same change-detection command set referenced by the higher-level workflow note.
