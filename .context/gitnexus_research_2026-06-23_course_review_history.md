# GitNexus Research — Course Review Enhancements (FE)

Date: 2026-06-23  
Repository: `fe-mycourse`  
Scope: Phase 1 discovery only (no code changes)

## Context baseline

- `session_summary_2026-06-23_course_review_actions_dropdown.md` — row ⋮ menu done; approve still calls API directly.
- `session_summary_2026-06-23_course_collab_qa.md` — owner-only review workflow on FE.

## Docs gap

| Doc | Gap |
|-----|-----|
| `docs/router.md`, `docs/screens.md` | No `review-history` tab route |
| `docs/components.md`, `docs/reusable-assets.md` | No `CourseEditorReviewHistoryTab` |
| `docs/api-using.md` | Approve empty body; no review-history hook |
| Editor tabs docs | Still "5 tabs" — need 6 with review-history |

## Reuse audit

| Need | Reuse |
|------|-------|
| Approve/reject modal + char hint | Pattern from `instructor-approval-actions.tsx` |
| Paginated list | `useApiListQuery` + `InstructorListPagination` |
| Tab href + query | `instructorCourseEditorTabHref` |
| Reject schema | Extend `courseRejectReasonSchema` (5–500), add `courseApproveFeedbackSchema` |
| Editor route glue | `renderInstructorCourseEditorRoute` |

## Git baseline

- Branch: `feat/auth-refresh-bff-proxy`, clean, ahead 6 commits.

## Phase 2 file list (chốt)

- `src/schema/course/course.ts`
- `src/types/course.ts`
- `src/constants/api-route.ts`
- `src/api/callers/course/course.ts`
- `src/api/hooks/course/useCourseReviewHistory.ts`, `index.ts`
- `src/screen/common/course/course-review-page.tsx`
- `src/components/features/course/course-review-row-actions.tsx` (onApprove → open modal in page)
- `src/components/features/course/course-editor-review-history-tab.tsx` **NEW**
- `src/screen/instructor/courses/editor-page.tsx`
- `src/lib/utils/course.ts`
- `src/app/[locale]/instructor/courses/[courseId]/review-history/page.tsx` **NEW**
- `src/messages/vi.ts`, `en.ts`
