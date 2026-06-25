# Session Summary — Instructor Roster Picker (FE)

**Date:** 2026-06-25

## Implemented

- `UserMultiSelectPickerDialog` — shared picker UI extracted from collaborator pattern (search, pagination, responsive overflow)
- `InstructorRosterPickerDialog` + `useInstructorRosterCandidates` — multi-select add on `/admin/instructors/roster`
- `InstructorRosterPage` — `handleAddInstructors(userIds[])` sequential POST; removed `ConfirmAddInstructorDialog`
- `UserPickerCandidate` shared type; `CourseInstructorCandidate` aliases it
- i18n `instructor.roster.picker.*` (en/vi)

## Reused

- `CourseCollaboratorPickerDialog` pattern, `InstructorListPagination`, `buildInstructorPageFooterFromInfo`, `useApiListQuery`

## Quality gates

- `npm run check-all` — PASS

## Docs

- `docs/instructor-admin.md`, `docs/reusable-assets.md`
