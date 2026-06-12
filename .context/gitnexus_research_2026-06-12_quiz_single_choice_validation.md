# GitNexus Research Note — Quiz Single-Choice Validation (FE)

Date: 2026-06-12
Repository: `fe-mycourse`
Scope: Phase 1 discovery + close-out reference

## Discovery checklist (`temporary-docs/tieu-chuan-check-be-fe/fe-mycourse.md`)

- Read context baseline:
  - `.context/session_summary_2026-06-12_course_submit_validation.md`
- Read docs:
  - `docs/router.md`, `docs/folder-structure.md`, `docs/pages.md`, `docs/reusable-assets.md`, `docs/quality.md`
  - `docs/logic-flow.md`, `docs/instructor-admin.md`, `docs/modules.md`, `docs/patterns.md`
- Reuse audit:
  - `courseQuizOptionSchema` in `src/schema/course/course.ts` (extend, do not duplicate)
  - `firstValidationMessageKey` / `toastValidationError` in `src/lib/utils/validation-message.ts`
  - `validateSubLessonFormContent` / `validateCourseSubmitReadiness` in `src/lib/utils/course.ts`
  - `SubLessonQuizFields` in `src/components/features/course/course-editor-dialogs.tsx`
- GitNexus:
  - `query({ query: "quiz sub lesson validation allow_multiple correct answer" })`
  - `impact({ target: "validateSubLessonFormContent", direction: "upstream" })` → LOW
  - `impact({ target: "validateQuizSubLesson", direction: "upstream", repo: "be-mycourse" })` → LOW (paired BE task)

## Reuse vs extend decision

Reuse:
- `courseQuizOptionSchema` — extended with `allow_multiple`, `is_correct`, `superRefine` for correct-answer rules
- `firstValidationMessageKey` — map Zod `validation.*` keys to `course.validation.*` toast keys
- `validateSubLessonFormContent`, `validateCourseSubmitReadiness` — thin wrappers calling schema

Extend (not duplicate):
- `applyQuizAllowMultipleChange`, `applyQuizOptionCorrectChange` in `src/lib/utils/course.ts` for quiz editor UI state

Do not:
- parallel hand-written quiz validation separate from `courseQuizOptionSchema`
- invent `courseEditor.validation` namespace (actual namespace is `course.validation`)

## Planned touch surface

- `src/schema/course/course.ts`
- `src/lib/utils/course.ts`
- `src/components/features/course/course-editor-dialogs.tsx`
- `src/hooks/course/use-course-editor-state.ts`
- `src/messages/{en,vi}.ts`
- docs: `pages.md`, `router.md`, `folder-structure.md`, `screens.md`, `reusable-assets.md`, `logic-flow.md`, `instructor-admin.md`, `modules.md`, `patterns.md`
