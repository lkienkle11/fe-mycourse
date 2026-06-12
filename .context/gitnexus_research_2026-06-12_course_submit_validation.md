# GitNexus Research Note — Course Submit Validation (FE)

Date: 2026-06-12
Repository: `fe-mycourse`
Scope: Phase 1 discovery only (no code changes)

## Discovery checklist (temporary-docs/tieu-chuan-check-be-fe)

- Read context baseline:
  - `.context/session_summary_2026-06-10_course_validation.md`
  - `.context/session_summary_2026-06-11_course_delta_wysiwyg.md`
- Read course references:
  - `temporary-docs/chuc-nang-course-da-lam/fe-chuc-nang-course.md`
- Trace existing FE flow:
  - `src/screen/instructor/courses/editor-page.tsx`
  - `src/hooks/course/use-course-editor-state.ts`
  - `src/schema/course/course.ts`
  - `src/lib/utils/course.ts`
- Git baseline:
  - reviewed `git log --oneline -20`
  - reviewed diff vs `origin/main...HEAD` for course editor files
- GitNexus:
  - read `gitnexus://repo/fe-mycourse/context`
  - ran `query`, `context`, `impact` for submit-related symbols

## Symbols analyzed

- `handleSubmitReview` (`src/hooks/course/use-course-editor-state.ts`)
- `saveSubLesson` (`src/hooks/course/use-course-editor-state.ts`)
- `courseBasicInfoSchema` (schema search via file read; index query fallback pointed to `src/schema/course/course.ts`)

## Impact summary (upstream)

- `handleSubmitReview`: LOW; d=1 caller `InstructorCourseEditorPage`
- `saveSubLesson`: LOW; d=1 caller `InstructorCourseEditorPage`

No HIGH/CRITICAL risk found in FE submit target symbols.

## Reuse vs extend decision

Reuse:
- `courseBasicInfoSchema` from `src/schema/course/course.ts`
- `createCourseBasicInfoState` from `src/lib/utils/course.ts`
- `toastValidationError` from `src/lib/utils/validation-message.ts`
- existing sub-lesson save validation branches in `saveSubLesson`

Extend:
- add `validateCourseSubmitReadiness(detail)` in `src/lib/utils/course.ts`
- extract shared sub-lesson form-content validation helper from `saveSubLesson`
- call readiness validation inside `handleSubmitReview` before API call
- add i18n keys under `course.validation.*` in `src/messages/en.ts` and `src/messages/vi.ts`

Do not duplicate:
- avoid second parallel schema definitions
- avoid copy-paste validation rules between save and submit actions

## Source-level submit flow (current gap)

Current:
- submit button in `editor-page.tsx` calls `handleSubmitReview`
- `handleSubmitReview` directly calls `submitCourseReviewService(courseId)` without client-side readiness checks

Gap:
- no FE pre-submit blocking toast for missing required basic info/outline/collaborator constraints

## Planned touch surface (implementation phases)

- `src/lib/utils/course.ts`
- `src/hooks/course/use-course-editor-state.ts`
- `src/messages/en.ts`
- `src/messages/vi.ts`
