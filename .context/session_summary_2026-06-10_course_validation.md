# Session Summary — Course Field Validation FE (2026-06-10)

## Scope
Zod schemas mirroring BE; course editor basic tab + hooks + outline dialogs; no react-quill (reuse `CourseDeltaEditor`).

## FE changes
- `src/schema/course/course.ts` — full validation rules
- `src/lib/utils/course-delta.ts` — `countNonWhitespace`, `countDeltaNonWhitespace`
- `course-editor-basic-tab.tsx` — CourseDeltaEditor, RequiredLabels, single outcome Select
- `use-course-editor-state.ts` — `courseBasicInfoSchema` on save; section/lesson full validation; QUIZ preview forced false
- `course-editor-dialogs.tsx` — required section/lesson fields; preview only VIDEO/TEXT
- `course-delta-editor.tsx` — `disabled`, `showDeltaJson`, `required`, `label`
- `image-file-field.tsx` — `required` prop
- i18n `course.validation.*` + `selectOutcome` / `noOutcome`

## Quality gates (all PASS)
- `npm run lint:biome` — OK
- `npm run lint` — OK
- `npm run build` — OK
- `npm run quality:deps` — OK

## Docs synced
- `docs/modules.md`, `docs/instructor-admin.md`
