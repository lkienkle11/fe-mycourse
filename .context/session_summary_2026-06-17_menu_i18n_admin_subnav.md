# Session — menu i18n + admin course subnav (2026-06-17)

## Phase 1 — Discovery
- Sidebar: `useTranslations("dashboard")` + `titleKey` → keys must live under `dashboard.*`
- Course menu keys were only under `course.menu.*` → raw keys shown in UI

## Phase 2 — Implementation
1. Added `dashboard.course.menu.{group,all,reviewing,trash}` in `en.ts` / `vi.ts`
2. Admin courses mirror sysadmin:
   - `/admin/courses` → redirect `/admin/courses/all`
   - `/admin/courses/all` → `CourseAdminAllPage`
   - `/admin/courses/reviewing` → `CourseReviewPage` (admin)
   - `/admin/courses/trash` → `CourseAdminTrashPage`
3. `admin-items.ts` — Courses group with 3 children + granular permissions
4. `route.ts`, `routes.ts`, `page-header.ts` updated

## Phase 3 — Quality
- `npm run check-all` PASS
- Docs: `router.md`, `pages.md`, `screens.md`, `modules.md`, `instructor-admin.md`

## Manual test
- [ ] `/vi/sysadmin` — course menu shows Vietnamese labels (not `dashboard.course.menu.*`)
- [ ] `/vi/admin` — Courses expandable with All / Reviewing / Trash
