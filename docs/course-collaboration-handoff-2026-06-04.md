# Course Collaboration Handoff

_Last updated: 2026-06-17 (version numbering: reject forks `max+1` draft, `last_rejection_reason`, edit badge + `publishedVersionBadge`; reorder nested merge). Prior: 2026-06-05 course i18n pass._

## Purpose

This document is the current frontend checkpoint for the course collaboration and versioned publishing work across `be-mycourse` and `fe-mycourse`.

It summarizes:

- the frontend context
- what was implemented
- what was fixed
- what is still incomplete
- what should happen next

## Frontend scope that was targeted

- Instructor course list and editor
- Draft-safe course editing UI
- Course collaborator management
- Admin/sysadmin review queue UI
- Reuse of existing project patterns for dashboards, API hooks, media selection, and sortable outline editing

## Frontend context

The frontend work was added on top of the existing app shell and API/hook patterns. The implementation intentionally reused existing building blocks instead of creating parallel infrastructure.

All course-facing copy in the implemented instructor and review surfaces now comes from `next-intl` message dictionaries in `src/messages/en.ts` and `src/messages/vi.ts`. The instructor dashboard course menu entry also uses translation keys instead of screen-local hardcoded labels.

The course editing experience is organized into route-backed tabs:

- `Basic Info`
- `Outline`
- `Collaborators`
- `Pricing`
- `Certificate`

Current expected behavior:

- `Basic Info` is functional
- `Outline` is functional
- `Collaborators` is functional
- `Pricing` is placeholder-only
- `Certificate` is placeholder-only

## Tasks completed

### Types and API integration

Added:

- `src/types/course.ts`
- `src/api/callers/course/`
- `src/api/hooks/course/`

Implemented API integration for:

- editable course list
- course detail
- draft preparation
- basic info save
- collaborator add/remove
- section / lesson / sub-lesson CRUD
- section / lesson / sub-lesson reorder
- lease acquire / heartbeat / release
- review submit / reopen (legacy fork) / approve / reject
- `CourseDetail.last_rejection_reason` after reject-fork
- learner course list / detail / enroll / progress callers

### Instructor screens and routes

Added:

- `src/app/[locale]/instructor/courses/page.tsx`
- `src/app/[locale]/instructor/courses/[courseId]/{info,outline,collaborators,pricing,certificate}/page.tsx`
- `src/screen/instructor/courses/page.tsx`
- `src/screen/instructor/courses/editor-page.tsx`
- `src/components/features/instructor/instructor-course-editor-route.tsx`
- `src/components/features/course/course-editor-basic-tab.tsx`
- `src/components/features/course/course-editor-outline-tab.tsx`
- `src/components/features/course/course-editor-outline-row-actions.tsx`
- `src/components/features/course/course-editor-collaborators-tab.tsx`
- `src/components/features/course/course-editor-dialogs.tsx`
- `src/hooks/course/use-course-editor-state.ts`

Implemented:

- editable course list
- create course dialog
- owner-only delete action
- tabbed course editor
- basic metadata editing (info tab; taxonomy pickers with `include_images: false`)
- outline CRUD and reordering (same `useCourseDetail` SWR cache — no refetch on tab switch)
- collaborator management
- English and Vietnamese translations for course list, editor tabs, dialogs, status badges, review queue, and course menu labels

### Admin and sysadmin review screens

Added:

- `src/app/[locale]/admin/courses/page.tsx`
- `src/app/[locale]/sysadmin/courses/page.tsx`
- `src/screen/common/course/course-review-page.tsx`

Implemented:

- review queue listing
- draft approve action
- draft reject action with reason

### Feature components added

Added:

- `src/components/features/course/course-status-badge.tsx`
- `src/components/shared/delta-editor.tsx`

Section description and lesson summary use the shared `CourseOutlineItemDialog` with `DeltaEditor` (`allowMediaEmbed={false}`) — Quill Delta JSON, text formatting only (no image/video/object embeds). TEXT sub-lessons use full `DeltaEditor` with media embeds. Toolbar font picker (Roboto, Gilroy, Geist Mono, serif, monospace). Image/video via `MediaCollectionDialog`, paste (Ctrl+V), or drag-and-drop — paste/drop upload is delegated to `onObjectEmbedded` (`useDeltaEditorMediaHandlers` → `uploadMediaFiles`); embed removal (× or Backspace/Delete) calls `onDelete` → `deleteMediaFile`. Delta stores URL references only (no base64).

## Important fixes already completed

### Instructor shell permission fix

Updated:

- `src/app/[locale]/instructor/layout.tsx`

This was important because the instructor shell previously depended only on `instructor:modify`, while the course area also needed to allow course collaborator access through `course_instructor:read`.

### Reuse-first implementation

The course frontend reuses existing app pieces instead of adding separate infrastructure:

- dashboard layout patterns
- shared form inputs
- shared dialog components
- shared table/card patterns
- existing sortable DnD components
- media selection dialog
- taxonomy hooks
- instructor roster hooks

## Backend status from the frontend point of view

The backend APIs required by the frontend are implemented and wired.

Important current backend checkpoint:

- the backend course package is functionally implemented
- the backend course package cleanup/refactor is now lint-clean at the package level
- broader final repo-wide backend validation still needs to be re-run

Backend companion doc:

- `/Users/kienlt/Documents/projects/mycourse-full/be-mycourse/docs/course-collaboration-handoff-2026-06-04.md`

## Validation completed

### Passed

- `npm run lint`
- `npm run biome`
- `npm run format:biome`
- `npm run quality:deps`
- `npm run build`

Current limitation:

- there is still no dedicated frontend test suite; `npm run test` is currently a placeholder command used to keep local and CI validation flows stable

### Passed with one pre-existing warning

- `npm run biome`
- `npm run lint:biome`

Current warning:

- `src/components/ui/sidebar.tsx` still triggers Biome's `noDocumentCookie` warning on the existing sidebar cookie write.

### Build note

- `npm run build` passed during the latest validation run when the environment could fetch the existing Google Fonts dependencies used by Next.js.
- In a restricted offline sandbox, the same build can fail while fetching `Geist Mono` and `Roboto`; that is environmental, not caused by the course implementation itself.

## Docs already updated in frontend

Updated earlier during this work:

- `docs/pages.md`
- `docs/modules.md`
- `docs/instructor-admin.md`
- `docs/quality.md`
- `docs/dependencies.md`

## Tasks not completed yet

### Browser and UX QA

Still needed:

- end-to-end manual QA against a running backend
- lock/lease UX validation with two instructor sessions
- stale-save and optimistic-lock UX validation
- review flow QA with admin/sysadmin accounts

### UI polish / follow-up work

Still possible follow-up work:

- richer WYSIWYG behavior for text lessons if the lightweight Delta editor is not enough
- learner-facing course player UI polish
- additional autosave or draft-state UX improvements if product asks for them later

## Frontend tasks that were intentionally left incomplete

- `Pricing` tab behavior
- `Certificate` tab behavior
- broader learner playback/player experience

These remain placeholder-only or outside the implemented scope.

## Current frontend status

- The instructor-facing course collaboration UI is implemented.
- The admin/sysadmin review UI is implemented.
- The duplication gate is clean after consolidating repeated instructor admin action/footer blocks.
- The remaining work is mostly browser QA, live integration checks, and future UX polish.

## Recommended next steps

1. Perform browser QA with a live backend for:
   - course creation
   - draft preparation
   - basic info saving
   - outline CRUD / reorder
   - collaborator management
   - approve / reject review flow

2. Validate lock/lease UX with two simultaneous instructor sessions so the conflict-handling copy and state transitions feel correct.

3. Decide whether the current text lesson editor is sufficient or should be replaced later with a more full-featured Quill-compatible authoring experience.
