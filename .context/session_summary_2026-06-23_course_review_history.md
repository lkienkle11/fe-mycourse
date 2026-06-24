# Session: Course review enhancements (FE)

**Date:** 2026-06-23

## GitNexus research (Phase 1)

- Research note: `.context/gitnexus_research_2026-06-23_course_review_history.md`
- `impact(approveCourseReviewService)` → **LOW**, d=1 `handleApprove` updated in same task

## Implementation

| Area | Change |
|------|--------|
| Task 1 | Approve modal (5–500 chars) + reject modal hint/validation 5–500 |
| Task 2 | Tab `review-history` + `CourseEditorReviewHistoryTab` + route page |
| API | `approveCourseReviewService(id, { approval_note })`, `useCourseReviewHistory` |
| i18n | `course.review.approveDialog`, `course.editor.reviewHistory`, validation keys |

## Quality gates

| Gate | Result |
|------|--------|
| `npm run test-all` | PASS |
| `npm run check-all` | PASS |

## GitNexus close-out

- `npx gitnexus analyze --force` — OK
- `gitnexus_detect_changes({ scope: "all" })` — run at close-out

## Docs synced

- `docs/router.md`, `docs/screens.md`, `docs/components.md`, `docs/reusable-assets.md`

## Manual verification

- Admin/sysadmin **Chờ xét duyệt**: ⋮ → Duyệt opens feedback modal; Từ chối enforces 5–500 chars
- Instructor editor tab **Lịch sử xét duyệt**: cards, green/red, filter, pagination, URL `?page=&status=`
- Locales: `vi` + `en`
