# Session — course admin UX + permissions FE (2026-06-17)

## Done
1. **Granular menu permissions** — `COURSE_GROUP_READ_PERMISSIONS`, sysadmin course children use P62/P59/P64; admin Courses menu uses P59
2. **Confirm dialogs** — move to trash (all page), permanent delete (trash page) via `ConfirmDeleteDialog`
3. **Preview route** — `/sysadmin/courses/reviewing/[courseId]/preview` (removed `versionId` segment)

## Files
- `src/constants/permissions.ts`, `permission-ids.ts`, `course/resources.ts`
- `sysadmin-items.ts`, `admin-items.ts`, `route.ts`, `routes.ts`, `page-header.ts`
- `course-admin-all-page.tsx`, `course-admin-trash-page.tsx`, `course-review-page.tsx`
- App route moved to `reviewing/[courseId]/preview/page.tsx`
- i18n: `confirmTrash`, `confirmDelete` (en/vi)
- Docs: router, pages, screens, modules, folder-structure, reusable-assets

## Quality
- `npm run check-all` PASS

## Deploy note
Re-login after BE migration `000024` so menu/API permissions align.
