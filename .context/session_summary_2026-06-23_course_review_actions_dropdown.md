# Session: Course review row actions → shared dropdown

**Date:** 2026-06-23  
**Branch:** `feat/auth-refresh-bff-proxy` (FE, uncommitted)

## Task

Replace 3 separate action buttons on **Chờ xét duyệt** (`CourseReviewPage`) with a ⋮ dropdown menu, following `temporary-docs/tieu-chuan-check-be-fe/fe-mycourse.md` all phases.

## Phase 1 — Discovery

- Read: `session_summary_2026-06-23_basic_info_row_version_conflict.md`, `docs/patterns.md`, `docs/components.md`, `docs/reusable-assets.md`, `docs/screens.md`, `docs/instructor-admin.md`
- GitNexus: `context`, `query("course admin table row actions dropdown")`, `impact(CourseReviewPage|CourseAdminAllPage|CourseAdminTrashPage)` → all **LOW**
- Reuse decision: extract shared shell instead of duplicating inline `DropdownMenu` (jscpd had flagged clone vs `course-admin-all-page` in prior attempt)

## Phase 2 — Implementation

| File | Change |
|------|--------|
| `src/components/features/course/course-admin-table-actions-menu.tsx` | **NEW** — shared ⋮ `DropdownMenu` shell (`MoreHorizontal`, `menuLabel`, `disabled`) |
| `src/components/features/course/course-review-row-actions.tsx` | **NEW** — review menu (sysadmin: Preview link; Approve; Reject destructive) |
| `src/screen/common/course/course-review-page.tsx` | Use `CourseReviewRowActions`; fix `scope` prop |
| `src/screen/common/course/course-admin-all-page.tsx` | Refactor to shared shell (dedup) |
| `src/screen/common/course/course-admin-trash-page.tsx` | Refactor to shared shell (dedup) |
| `src/messages/{vi,en}.ts` | `course.review.actions.menu` |

## Phase 3 — Quality + docs + close-out

| Gate | Result |
|------|--------|
| `npm run test-all` | PASS |
| `npm run check-all` | PASS |
| jscpd | **0 clones** (was 1 clone in rejected attempt) |
| `npx gitnexus analyze --force` | PASS |
| `gitnexus_detect_changes` | Expected symbols only |

**Docs synced:** `docs/components.md`, `docs/reusable-assets.md`, `docs/instructor-admin.md`

## Manual test

- Chrome DevTools MCP → `http://localhost:3000/vi/sysadmin/courses/reviewing` (not logged in → "Không có quyền truy cập" — expected)
- **User verify (logged in as sysadmin):** row ⋮ opens Preview / Duyệt / Từ chối; admin scope omits Preview
