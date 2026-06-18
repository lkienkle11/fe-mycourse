# Session summary — sysadmin courses sub-nav (FE)

**Date:** 2026-06-17  
**Checklist:** `temporary-docs/tieu-chuan-check-be-fe/fe-mycourse.md`

## Phase 1 — Discovery (retroactive)

| Item | Status | Notes |
|------|--------|-------|
| Context + docs | PASS | router, screens, pages, reusable-assets, navigation |
| GitNexus query/context/impact | PARTIAL (retro) | Route/nav symbols; shared review page reuse |
| File plan | PASS | all/reviewing/trash/preview routes + admin pages |
| `git status` / diff | PASS | Reviewed before implementation |
| No code before discovery | **FAIL** | Code shipped before formal Phase 1 checklist signed — acknowledged |

## Phase 2 — Implementation

| Item | Status | Notes |
|------|--------|-------|
| Routes + nav children | PASS | `/sysadmin/courses/{all,reviewing,trash}` + preview |
| API hooks/callers | PASS | course-admin services + `useAdminCourses` / `useTrashedCourses` |
| i18n en/vi | PASS | menu, adminAll, trash, review preview |
| jscpd clones | PASS | 0 clones (shared columns + quill helper) |
| Manual route test | PASS | Terminal logs show `/vi/sysadmin/courses` 200; sub-routes wired |

## Phase 3 — Close-out

| Item | Status | Notes |
|------|--------|-------|
| `npm run test-all` | PASS | 2026-06-17 |
| `npm run check-all` | PASS | (prior run in session) |
| Docs sync | PASS | `router.md`, `screens.md`, `pages.md`, `folder-structure.md`, `components.md`, `api-using.md`, `modules.md`, `reusable-assets.md`, `instructor-admin.md` |
| GitNexus analyze + detect_changes | PASS | `analyze --force`; detect_changes scope=all |
| Session summary | PASS | This file |

## Changes

- Routes: `sysadmin.courses.{all,reviewing,trash}`, preview under `reviewing/[courseId]/[versionId]/preview`.
- Screens: `course-admin-all-page`, `course-admin-trash-page`, `course-review-preview-page` (placeholder).
- Shared: `buildCourseAdminListColumns`, `canMoveCourseToTrash`.
- Nav: Courses sidebar children All / Reviewing / Trash.

## Quality gates

- `npm run test-all` — **PASS** (jscpd 0 clones)
- `npx gitnexus analyze --force` — **PASS**

## Manual verification

- FE dev server: `GET /vi/sysadmin/courses` → redirect/all; sub-nav routes compile and return 200 in dev logs.

## Open (optional, not in original scope)

- Confirm dialog before "Move to trash" — not implemented yet.
