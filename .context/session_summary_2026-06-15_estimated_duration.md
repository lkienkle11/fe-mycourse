# Session summary — estimated duration (FE)

**Date:** 2026-06-15  
**Research:** `.context/gitnexus_research_2026-06-15_estimated_duration.md`

## What changed

- Types: `estimated_duration_ms` on outline nodes; form H/M/S fields + `video_duration_seconds`
- `src/lib/utils/duration.ts` — parse/split/format ms (en/vi)
- `createCourseSubLessonFormState`, `buildSubLessonEstimatedDurationPayload`, `validateSubLessonDurationForm`
- `course-editor-dialogs.tsx` — `SubLessonDurationFields` on TEXT/QUIZ; VIDEO read-only duration from media
- `use-course-editor-state.ts` — `saveSubLesson` sends `estimated_duration_ms` for TEXT/QUIZ only
- `course-editor-outline-tab.tsx` — duration labels on section/lesson/sub-lesson
- i18n: `estimatedDurationLabel`, `durationHours/Minutes/Seconds`, `subLessonDurationInvalid`
- Docs: `docs/reusable-assets.md`, `docs/folder-structure.md`, `docs/modules.md`, `docs/instructor-admin.md`, `docs/screens.md`, `docs/pages.md`

## Manual test steps

1. Open instructor course editor → Outline tab
2. Add TEXT item, set 1h 25m 30s → save → reload shows `1h25m30s` (en) or `1g25p30g` (vi) on item + rolled-up lesson/section
3. Add QUIZ with duration — same behavior
4. Add VIDEO — no H/M/S inputs; duration hint from selected video file
5. Switch locale vi/en — unit suffixes change

## Quality gates

- `pnpm build` — pass
- `npx biome check --write` on touched files — pass
- `pnpm run quality:deps` — pass
- `npx gitnexus analyze --force` — reindexed
