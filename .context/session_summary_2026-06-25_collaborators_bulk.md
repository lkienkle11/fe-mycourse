# Session Summary — Collaborators Bulk Add (FE)

**Date:** 2026-06-25

## Implemented

- `addCourseCollaboratorsBulkService` → `POST …/collaborators/bulk`
- Removed sequential `addCourseCollaboratorService` loop
- `useCourseCollaboratorActions` hook — partial-success UX (`UserPickerConfirmResult`) aligned with instructor roster picker
- Tab: separate mutation success vs `mutate()` refresh failure (`listRefreshError` toast)
- i18n: `collaboratorAddPartialSuccess`, `collaboratorAddAllFailed`, `listRefreshError`

## GitNexus impact

- `addCourseCollaboratorService`: LOW (d=1: `handleAddCollaborators` — updated)
- `handleAddCollaborators`: LOW

## Quality gates

- `npm run check-all` — PASS
- `npx gitnexus analyze --force` — PASS

## Docs synced

- `docs/api-using.md`, `docs/reusable-assets.md`
