# Session: FE dashboard UI shell

**Date:** 2026-05-22

## Goal

Implement role dashboard shell (admin, instructor, sysadmin): types, RBAC tree filter, placeholder nav constants, `DashboardLayout` + sidebar, app routes, screens, docs sync.

## Phase 1 discovery

- Read RBAC session summaries and `docs/router.md`, `folder-structure.md`, `components.md`.
- BE `permissions.go` aligns with FE `PERMISSIONS` for `admin:modify`, `instructor:modify`, `sysadmin:modify`, resource `*:read` placeholders.
- Git: untracked scaffold on branch `refactor/header-browse-sidebar-menu`.
- GitNexus: `filterUserMenuGroups` → `useFilteredUserMenuGroups`; sidebar pattern from `BrowseSidebarMenu`.

## Files added

| Path | Purpose |
|------|---------|
| `src/types/dashboard/index.ts` | `DashboardItem`, `DashboardLayoutProps`, `DashboardCustomStyles` |
| `src/lib/utils/dashboard.ts` | `filterDashboardItems` |
| `src/constants/dashboard/*.ts` | `ADMIN_*`, `INSTRUCTOR_*`, `SYSADMIN_*` placeholder trees |
| `src/components/common/dashboard/*` | Layout, sidebar, unauthorized |
| `src/components/common/header/header-dashboard.tsx` | Dashboard header (`px-2`) |
| `src/app/[locale]/{admin,instructor,sysadmin}/layout.tsx` + `page.tsx` | App Router wiring |
| `src/screen/{admin,instructor,sysadmin}/page.tsx` | Placeholder dashboard pages |

## Files edited

- `src/types/index.ts`, `src/lib/utils/index.ts`, `src/hooks/auth/use-permissions.ts`
- `src/constants/index.ts`, `src/components/common/index.ts`, `src/components/common/header/index.ts`
- `src/screen/*/index.ts`, `src/screen/index.ts`
- `src/messages/en.json`, `src/messages/vi.json` — `dashboard.*` keys
- Docs: `router.md`, `folder-structure.md`, `components.md`, `screens.md`, `reusable-assets.md`, `architecture.md`

## Placeholder permissions (menu items)

| Role | Root item | Permission |
|------|-----------|------------|
| Admin | Overview | `admin:modify` |
| Admin | Users (nested) | `user:read` |
| Admin | Courses | `course:read` |
| Instructor | Overview | `instructor:modify` |
| Instructor | My Courses (nested) | `course_instructor:read` |
| Instructor | Media | `media_file:read` |
| Sysadmin | Overview, System, Roles | `sysadmin:modify` (System child: `user:read`) |

## GitNexus

- `npx gitnexus analyze --force` → **1687** nodes, **3502** edges, **87** flows (no embeddings).
- `impact(DashboardLayout)` → **LOW**, 0 upstream callers (new symbol).
- `detect_changes(all)` → 18 symbols; new dashboard processes only (expected).

## QA

| Check | Result |
|-------|--------|
| `npm run lint` | pass |
| `npm run lint:biome` | pass (3 pre-existing warnings in `field.tsx`, `sidebar.tsx`) |
| `npx tsc --noEmit` | pass |
| `npm run build` | pass — routes `/[locale]/admin`, `/instructor`, `/sysadmin` |

## Manual smoke (recommended)

- `/vi/admin`, `/vi/instructor`, `/vi/sysadmin` — shell renders.
- Sidebar collapse: icon-only roots; expand shows nested items.
- User without `admin:modify` → `DashboardUnauthorized` on admin layout.

## Notes

- Child nav hrefs (e.g. `/admin/users`) are placeholders; pages not built yet.
- `LoginSignupPopup` mounted once per `DashboardLayout` (same as web `Header`).
