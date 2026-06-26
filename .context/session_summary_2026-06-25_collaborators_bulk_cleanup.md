# Session Summary — Collaborators single-add cleanup (FE)

**Date:** 2026-06-25

## Removed dead single-add artifacts

- `courseCollaboratorSchema` / `CourseCollaboratorValues` (`src/schema/course/course.ts`)
- i18n `validation.collaboratorUserId`, toast `collaboratorAddError`
- `docs/patterns.md` — dropped `collaboratorUserId` from validation key list

## Verified removed earlier

- `addCourseCollaboratorService` — replaced by `addCourseCollaboratorsBulkService`

## Quality gates

- `npm run check-all` — PASS
