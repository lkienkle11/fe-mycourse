# Session Summary: Instructor Course Editor Route Adapter Move

_Date:_ 2026-06-08  
_Repo:_ `fe-mycourse`

## Scope

- Moved the shared instructor course editor route adapter out of `src/app/**` into `src/components/features/instructor/`.
- Kept the 5 canonical instructor course editor routes:
  - `/{locale}/instructor/courses/{courseId}/info`
  - `/{locale}/instructor/courses/{courseId}/outline`
  - `/{locale}/instructor/courses/{courseId}/collaborators`
  - `/{locale}/instructor/courses/{courseId}/pricing`
  - `/{locale}/instructor/courses/{courseId}/certificate`
- Synced FE docs with the new route adapter location and route-backed tab structure.

## Reuse / Dedup decisions

- Reused `InstructorCourseEditorPage` as the single shared screen; route files only forward `courseId` + `tab`.
- Reused `renderInstructorCourseEditorRoute` and exported `InstructorCourseEditorRouteProps` so the 5 App Router pages do not duplicate the `params` shape.
- Kept route generation centralized in `src/lib/navigation/routes.ts` with:
  - `instructorCourseEditorHref(courseId)`
  - `instructorCourseEditorTabHref(courseId, tab)`
- Did not recreate any route helper inside `src/app/**`.

## Code changes

- Added `src/components/features/instructor/instructor-course-editor-route.tsx`
- Updated `src/components/features/instructor/index.ts` to export the shared route adapter and props type.
- Updated all 5 instructor course editor route pages under `src/app/[locale]/instructor/courses/[courseId]/*/page.tsx` to import the shared adapter from `@/components/features/instructor`.
- Reused `InstructorCourseEditorRouteProps` in each route page to remove repeated inline `params` typing.

## Docs synced

- `docs/pages.md`
- `docs/screens.md`
- `docs/router.md`
- `docs/instructor-admin.md`
- `docs/architecture.md`
- `docs/folder-structure.md`
- `docs/quality.md`
- `docs/reusable-assets.md`
- `docs/course-collaboration-handoff-2026-06-04.md`

## GitNexus

- Upstream impact already checked earlier in this workstream for the shared course editor shell and state symbols:
  - `InstructorCourseEditorPage` → LOW
  - `InstructorCoursesPage` → LOW
  - `CourseBasicInfoTab` → LOW
  - `CourseOutlineTab` → LOW
  - `CourseCollaboratorsTab` → LOW
  - `useCourseEditorState` → LOW
  - `instructorCourseEditorHref` → LOW
- Attempted to query impact for `renderInstructorCourseEditorRoute` and the new route page symbols, but the current GitNexus index does not know those freshly added symbols yet (`target not found`).
- Current installed GitNexus CLI does not expose a `detect-changes` subcommand, so close-out scope was checked with `git status` / docs diff review instead.

## FE verification

Passed:

- `npm run lint:biome`
- `npm run lint`
- `npm test` (`No frontend test suite is configured yet.`)
- `npm run quality:deps`
- `npm run build`

## Build note

- Sandbox build failed when Next.js tried to fetch Google Fonts (`Roboto`, `Geist Mono`).
- Re-ran `npm run build` with escalated permissions and it passed.
