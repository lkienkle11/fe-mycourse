# Session Summary: Review FE V1 Remediation

_Date:_ 2026-06-07  
_Repo:_ `fe-mycourse`

## Scope

Completed a frontend-only remediation pass for the findings documented in `temporary-docs/code-review-v1/review-fe-v1.md`.

This pass focused on:

- secret-bearing auth/API log removal
- safe course-delta link insertion
- shared utility extraction for course-delta parsing and formatting
- admin/sysadmin layout deduplication
- stream-event hook deduplication
- SWR hook normalization and request fan-out reduction
- course editor state cleanup and targeted performance improvements
- taxonomy tree layout optimization
- docs and `.context` synchronization

`be-mycourse` was used only as a read-only contract/reference source. No backend code was changed.

## Important implementation rules preserved

- Reuse-first: existing dashboard layout, route/page exports, shared hook names, media/date utilities, and screen structure were reused or extended instead of replaced.
- Deduplicate-on-touch: repeated route wrapper pages, stream-event adapters, SWR return-shape plumbing, and course-delta helpers were consolidated into shared internal modules.
- Contract stability: no backend API contract changes, no route URL changes, and existing exported hook names remained stable.

## What changed

### Security and correctness

- Removed refresh-token/session-bearing console logs from `src/api/instance.ts`.
- Moved course-delta parsing/stringifying/text/image extraction into `src/lib/utils/course-delta.ts`.
- Hardened course-delta link insertion to normalize and allow only `http`/`https` URLs.
- Added localized invalid-link feedback in `src/messages/en.ts` and `src/messages/vi.ts`.

### Shared architecture cleanup

- Added `src/components/common/dashboard/role-dashboard-layout.tsx` and switched admin/sysadmin layouts to the shared wrapper around the existing `DashboardLayout`.
- Moved auth submit orchestration from the auth component tree into `src/actions/auth/auth-client.ts`.
- Replaced four stream-event source filters with one shared helper in `src/hooks/events/internal/create-scoped-stream-event-hook.ts`.
- Added shared SWR helpers in `src/api/hooks/shared.ts` and refactored list/detail hooks behind stable public exports.

### Course editor and UI cleanup

- Split `useCourseEditorState` internally by concern while keeping the public hook stable for `InstructorCourseEditorPage`.
- Reduced editor request fan-out by making taxonomy and collaborator support data less eager and less revalidation-heavy.
- Reused the shared date formatter path through `src/lib/utils/date.ts` and `src/lib/utils/media.ts`.
- Avoided repeated dagre tree layout + `fitView()` work inside `src/components/shared/dagre-tree-dialog.tsx`.

### Route and screen deduplication

- Kept Next App Router route files in place.
- Removed duplicated admin/sysadmin taxonomy and instructor screen wrapper files under `src/screen/admin/**` and `src/screen/sysadmin/**`.
- Updated route files to import shared screen implementations directly.

## GitNexus notes

- Refreshed the FE index with `npx gitnexus analyze --force` before implementation.
- Used GitNexus impact analysis before changing key symbols, including:
  - `useTaxonomyList` — `HIGH`, 3 direct callers
  - `useInstructorRosterList` — `HIGH`, 3 direct callers
  - `useCourseEditorState` — `LOW`, 1 direct caller
- High-risk shared hooks were kept consumer-shape compatible and validated through lint, typecheck, dependency checks, and production build.
- The current CLI in this session exposed `query`, `context`, and `impact`, but not a `detect_changes` command equivalent, so final scope verification used `git diff` inspection plus validation output.

## Validation status

Passed:

- `npm run biome`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run quality:deps`
- `npm run build`

Informational:

- `npm run test`
  - prints `No frontend test suite is configured yet.`

Build environment note:

- `npm run build` can fail in restricted/offline environments because Next.js fetches Google Fonts (`Geist Mono`, `Roboto`) during the build.
- The final validation build passed once network access was available.

## Docs synced

Updated to reflect the final code:

- `docs/architecture.md`
- `docs/components.md`
- `docs/flow.md`
- `docs/folder-structure.md`
- `docs/instructor-admin.md`
- `docs/modules.md`
- `docs/pages.md`
- `docs/quality.md`
- `docs/reusable-assets.md`
- `docs/router.md`
- `docs/screens.md`
- `docs/taxonomy-admin.md`

## Remaining follow-up risk

- The frontend still relies on JS-readable auth cookies/tokens because the current backend contract still requires client-readable bearer-token behavior.
- This pass intentionally did not redesign the auth architecture into a proxy/BFF or HttpOnly-cookie flow.
- That risk is now documented and should be handled as a separate cross-FE/BE architecture task.
