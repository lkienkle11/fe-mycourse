# Session Summary — Quiz Single-Choice Validation (FE + BE)

Date: 2026-06-12
Repos: `fe-mycourse`, `be-mycourse`

## Hotfix — hooks runtime error (same day)

- **Symptom:** switching sub-lesson kind in `CourseSubLessonDialog` → `Rendered fewer hooks than expected`.
- **Cause:** `SubLessonKindFields` called `renderer(props)` as a plain function, merging child hooks into one component.
- **Fix:** `return <Renderer {...props} />` so VIDEO/TEXT/QUIZ keep separate hook boundaries.
- **A11y:** sr-only `DialogDescription` on `CourseOutlineItemDialog` / `CourseSubLessonDialog` (same pattern as `MediaCollectionDialog`).

## Compliance note (FE checklist)

Initial pass missed items from `temporary-docs/tieu-chuan-check-be-fe/fe-mycourse.md` Phase 3:

- Did not extend existing `courseQuizOptionSchema` (created duplicate `validateQuizContent` logic)
- Did not update all required docs (`pages.md`, `router.md`, `folder-structure.md`, `screens.md`)
- Did not run FE GitNexus close-out (`detect_changes`, `analyze`)
- Documented wrong i18n namespace (`courseEditor.validation` vs actual `course.validation`)

Remediated in follow-up pass below.

## Scope completed

### BE

- `ErrCourseQuizSingleChoiceMultipleCorrect` + `validateQuizSubLesson` single-choice rule
- Handler mapping + submit-for-review wrap
- Tests: `repo_versioning_quiz_test.go`

### FE

- Extended `courseQuizOptionSchema` (`allow_multiple`, `is_correct`, superRefine)
- `validateSubLessonFormContent` / `validateCourseSubmitReadiness` delegate to schema via `firstValidationMessageKey`
- Quiz editor UI helpers: `applyQuizAllowMultipleChange`, `applyQuizOptionCorrectChange`
- i18n: `course.validation.quizSingleChoiceMultipleCorrect` (en/vi)

## GitNexus

- BE `impact(validateQuizSubLesson)` → LOW
- FE `impact(validateSubLessonFormContent)` → LOW
- FE `query("quiz sub lesson validation allow_multiple correct answer")`
- Close-out: `detect_changes(scope=all)` on both repos + `npx gitnexus analyze --force`

## Quality gates

### BE — PASS

```bash
golangci-lint run
make check-architecture
make check-dupl
make check-layout
go test ./...
go build ./...
```

### FE — PASS

```bash
npm run lint:biome
npm run lint
npm run build
npm run quality:deps
```

## Docs updated

- FE: `pages.md`, `router.md`, `folder-structure.md`, `screens.md`, `reusable-assets.md`, `logic-flow.md`, `instructor-admin.md`, `modules.md`, `patterns.md`
- BE: `docs/modules/course.md`, `return_types.md`, `database.md`
