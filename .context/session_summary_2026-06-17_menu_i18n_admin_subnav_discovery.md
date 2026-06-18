# Phase 1 Discovery — menu i18n + admin course subnav (2026-06-17)

## Root cause (i18n)
`DashboardSidebar` uses `useTranslations("dashboard")` + `titleKey`.
- Taxonomy: `titleKey: "taxonomy.menu.group"` → `dashboard.taxonomy.menu.group` ✅
- Courses: `titleKey: "course.menu.group"` → `dashboard.course.menu.group` ❌ (keys only under `course.menu.*`)

## Fix
Add `dashboard.course.menu.{group,all,reviewing,trash}` in `en.ts` / `vi.ts`.

## Admin submenu gap
Sysadmin has `/courses/{all,reviewing,trash}`; admin still flat `/admin/courses`.
Mirror structure under `/admin/courses/*` with same screens + permission gates.

## Files to change
- `src/messages/en.ts`, `vi.ts`
- `src/constants/route.ts`, `lib/navigation/routes.ts`
- `src/constants/dashboard/admin-items.ts`, `page-header.ts`
- `src/app/[locale]/admin/courses/**` (redirect + 3 sub-pages)
- `docs/router.md`, `pages.md`, `screens.md`, `instructor-admin.md`

## Risk: LOW (FE-only nav/i18n)
