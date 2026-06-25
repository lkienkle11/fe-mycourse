# GitNexus Research — Collaborators Popup + Pagination (FE)

**Date:** 2026-06-24  
See also: `be-mycourse/.context/gitnexus_research_2026-06-24_collaborators_popup.md`

## Impact (LOW)

- `CourseCollaboratorsTab` — editor-page consumer only
- `handleAddCollaborator` — refactor to `handleAddCollaborators(userIds[])`
- `listCourseCollaboratorsService` — currently unused; becomes paginated hook fetcher

## Reuse

- `useApiListQuery`, `InstructorListPagination`, review-history URL sync, `Dialog` + `Checkbox`, `courseCollaboratorSchema`
