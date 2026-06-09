# FE G1 Discovery — UUID v7 migration file list

**Date:** 2026-06-09  
**Rule:** Reuse existing symbols; no parallel helpers except `src/lib/utils/uuid.ts`.

## Docs reviewed
- `docs/router.md`, `folder-structure.md`, `pages.md`, `api-overview.md`, `api-using.md`, `modules.md`, `patterns.md`, `quality.md`

## Symbols to change (number → string UUID)
- Auth: `MeResponse.user_id`
- Course: all `id`, `*_id` FK fields (not `row_version`, `order_index`, `version_no`)
- Instructor: application/expertise/ticket IDs, `topic_id`, `skill_id`
- Taxonomy: list row `id` fields

## Callers / hooks / schemas
- `src/api/callers/{course,instructor,taxonomy}/*`
- `src/api/hooks/course/useCourses.ts`
- `src/api/hooks/instructor/useInstructorExpertise.ts`, `useInstructorTickets.ts`
- `src/schema/course/course.ts`, `src/schema/instructor/instructor.ts`

## UI hotspots
- `instructor-course-editor-route.tsx` — drop `Number(courseId)`
- `use-course-editor-state.ts` — collaborator `user_id` string
- `instructor-expertise-page.tsx` — topic/skill IDs string
- `course-editor-basic-tab.tsx` — selection toggle IDs string
- `data-table.tsx` — generic row id `string`

## Client ID generation
- Replace `crypto.randomUUID()` for **entity** IDs with `newV7()` from `uuid` package.

## Out of scope (stay numeric)
- RBAC admin `roleId` routes
- Pagination `page`, `per_page`
- `row_version`, scores, timestamps
