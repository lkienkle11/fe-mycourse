# GitNexus research — estimated duration FE (2026-06-15)

## Symbols to extend

| Symbol | File |
|--------|------|
| `CourseSubLesson`, `CourseLesson`, `CourseSection`, `UpsertCourseSubLessonPayload`, `CourseSubLessonFormState` | `src/types/course.ts` |
| `createCourseSubLessonFormState`, `buildSubLessonEstimatedDurationPayload` | `src/lib/utils/course.ts` |
| `formatDurationMs`, `parseDurationPartsToMs`, `splitMsToDurationParts` | `src/lib/utils/duration.ts` (new) |
| `saveSubLesson` | `src/hooks/course/use-course-editor-state.ts` |
| `CourseOutlineTab` / section-lesson-item cards | `course-editor-outline-tab.tsx` |
| `SubLessonTextFields`, `SubLessonQuizFields`, `SubLessonVideoFields`, `CourseMediaDialogs` | `course-editor-dialogs.tsx` |
| i18n | `messages/en.ts`, `messages/vi.ts` |

## Impact

- `saveSubLesson` — **LOW** (1 d=1: `InstructorCourseEditorPage`). Payload extension only.
- `CourseOutlineTab` — display-only additive labels.

## Notes

- `MediaFile.duration` available on video pick; unused today in sub-lesson dialog.
- No existing duration formatter in FE utils.
