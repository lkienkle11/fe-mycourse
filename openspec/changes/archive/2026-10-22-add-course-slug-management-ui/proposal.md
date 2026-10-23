## Why

The backend now lets a course slug be chosen at creation (`POST /api/v1/courses` accepts an optional `slug`, and answers a taken manual slug with `409` / code `3007` plus `data.recommended_slug`) and changed afterwards (`PATCH /api/v1/courses/:courseId/basic-info` accepts an optional `slug`). The frontend still shows a read-only slug preview derived from the title in the create dialog and has no slug field in the basic-info tab, so instructors cannot use either capability and the `3007` conflict would surface as an "Unknown error".

## What Changes

- Create dialog: replace the read-only derived slug with an editable, optional slug input. Blank means "let the backend generate it"; no client-side transliteration and no auto-fill from the title.
- Create conflict flow: on `409` / `3007`, read `data.recommended_slug` and show a confirm dialog stacked over the create dialog. Yes resubmits with the recommended slug (and repeats the flow if a new conflict is returned); No returns to the form.
- Basic-info tab: add an editable slug field defaulting to the current `course.slug`. It is disabled together with the other fields until a draft exists (unchanged draft gate: the editor needs the draft's `expected_row_version`).
- Update payload: send `slug` only when it differs from the persisted `course.slug`. An empty slug is blocked in the form with a visible field error before submit.
- Update result: after saving, the form and detail cache take the slug returned in `data.course.slug`; if it differs from the slug that was sent (backend resolved a conflict by adding a suffix) a dedicated toast reports the final slug.
- Shared slug input behaviour: filter typed and pasted text to `a-z`, `0-9`, `-` immediately, replace spaces with `-`, cap at 255 characters; validate with `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$` for instant feedback only (the backend stays authoritative).
- Add error code `3007` to the FE error-code map and to the English and Vietnamese messages.
- Sync documentation (English) and the GitNexus index to the final behaviour.

No backend change. No new API endpoint.

## Capabilities

### New Capabilities
- `course-slug-management`: course slug entry at creation and update, input filtering and validation, the `3007` recommended-slug confirmation flow, and slug reconciliation after update.

### Modified Capabilities
- `frontend-regression-coverage`: adds a requirement that the slug create/conflict/update flows are covered by automated tests.

## Impact

- **Types**: `src/types/course.ts` (`CreateCoursePayload`, `UpdateCourseBasicInfoPayload`, `CourseBasicInfoForm` gain `slug`).
- **Constants / messages**: `src/constants/api-error-code.ts`, `src/messages/error-codes.ts` (en + vi), `src/messages/en.ts`, `src/messages/vi.ts`.
- **Shared utilities**: `src/lib/utils/slug.ts` (input sanitizer, pattern, max length), `src/lib/utils/api-error.ts` (recommended-slug extractor built on the existing envelope reader), `src/lib/utils/course.ts` (form state and payload builders).
- **Schema**: `src/schema/course/course.ts` (slug field shared by create and basic-info schemas).
- **UI**: new `src/components/shared/slug-input.tsx`; `src/screen/instructor/courses/page.tsx`; `src/components/features/course/course-editor-basic-tab.tsx`.
- **Hooks**: new `src/hooks/course/use-course-create-flow.ts`; `src/hooks/course/use-course-editor-state.ts`.
- **Callers**: `src/api/callers/course/course-factory-core.ts` needs no signature change (payload types widen only).
- **Tests**: new unit tests for slug utils, course schema, api-error extractor, create flow; e2e fixture routes and a slug e2e spec.
- **Detail**: exact per-file, per-symbol changes are in `code-change-inventory.md`; exact per-section documentation edits (English) are in `docs-update-inventory.md`; the task list follows the `AGENTS.md` workflow (bootstrap, understanding, reuse/dedup, quality gates, documentation sync, session learning, Memory Bank persistence).
- **Documentation**: `docs/patterns.md`, `docs/instructor-admin.md`, `docs/api-overview.md`, `docs/logic-flow.md`, `docs/reusable-assets.md`, `docs/components.md`, `docs/folder-structure.md`, `docs/modules.md`, `docs/pages.md`, `docs/screens.md`, `docs/router.md`, `docs/taxonomy-admin.md`, `docs/seo-ranking-setup.md`, `docs/testing.md`; the full inventory with exact sections is in `design.md`.
- **Backend / dependencies**: none; no new package.
