# FE Close-out — course admin UX + permissions (2026-06-17)

> **Process note:** Code landed before formal Phase-1 sign-off per `temporary-docs/tieu-chuan-check-be-fe/fe-mycourse.md`. This file retroactively completes the checklist.

---

## Phase 1 — Discovery (retroactive)

### Context + docs read
- `docs/router.md`, `pages.md`, `screens.md`, `reusable-assets.md`, `instructor-admin.md`
- Reuse: `ConfirmDeleteDialog`, `buildCourseAdminListColumns`, instructor menu pattern (`INSTRUCTOR_GROUP_READ_PERMISSIONS`)

### Git baseline
- Uncommitted: sysadmin course subnav, permissions, confirm dialogs, preview route simplification

### GitNexus
- `gitnexus_query`: sysadmin course menu → `sysadmin-items.ts`, `DashboardLayout` → `toPermissionSet`
- Menu permission change affects `DashboardLayout` visibility only — no d=1 API callers

### Files planned (implemented)
| Action | Path |
|--------|------|
| Add | `src/constants/course/resources.ts` |
| Edit | `permissions.ts`, `permission-ids.ts`, `sysadmin-items.ts`, `admin-items.ts` |
| Edit | `route.ts`, `routes.ts`, `page-header.ts` |
| Edit | `course-admin-all-page.tsx`, `course-admin-trash-page.tsx`, `course-review-page.tsx` |
| Move | preview → `reviewing/[courseId]/preview/page.tsx` |
| i18n | `confirmTrash`, `confirmDelete` en/vi |

---

## Phase 2 — Implementation (completed)

1. Granular menu permissions (P62/P59/P64) — not `CourseRead` / shell modify
2. Confirm dialog before trash + permanent delete
3. Preview route without `versionId`

---

## Phase 3 — Quality + close-out

### Quality gates
| Command | Result |
|---------|--------|
| `npm run test-all` | **PASS** (lint, biome, deadcode, quality:deps) |
| `npm run check-all` | **PASS** (prior run in session) |

### Docs synced
- `docs/router.md`, `pages.md`, `screens.md`, `folder-structure.md`, `modules.md`, `reusable-assets.md`, `instructor-admin.md`

### GitNexus
- `gitnexus_detect_changes({ scope: "all", repo: "fe-mycourse" })` — run

### Manual test (operator)
- [ ] `/vi/sysadmin/courses/all` — trash confirm dialog
- [ ] `/vi/sysadmin/courses/trash` — permanent delete confirm
- [ ] `/vi/sysadmin/courses/reviewing` — preview link `/reviewing/{id}/preview`
- Requires BE `000024` + re-login

---

## Checklist cuối giai đoạn

- [x] UI/logic/i18n/routing scope
- [x] `npm run test-all` PASS
- [x] `npm run check-all` PASS (earlier in session)
- [x] Docs synced
- [x] GitNexus detect_changes run
- [x] Session summary (this file)
- [ ] Manual browser test — pending operator
