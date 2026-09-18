## Why

`fe-mycourse` has no dedicated handling for four failure classes: a render-time error thrown by a route segment, a fatal error at the root layout, total server/network unreachability, and an API failure that should render a full-page state (401/403/5xx) instead of a toast. Today all four collapse into either a blank production page (no `error.tsx`/`global-error.tsx` exist anywhere in `src/app`) or the same generic "could not load" fallback regardless of cause, so users never learn why a page failed to load.

## What Changes

- Add a segment-level `error.tsx` for the app's protected/dashboard route groups so a component render failure shows a recoverable in-app error UI instead of an uncaught crash.
- Add a root-level `global-error.tsx` so a fatal error that escapes every segment boundary still renders a branded fallback instead of a blank page.
- Add a `StatusErrorPage` full-page component (icon + status code + title + description + primary action), generalized from the existing `NotFoundPage` layout, driven by an explicit `variant` (`unauthorized` / `forbidden` / `server-error` / `network`) rather than by guessing from `data === undefined`. A 404 (or 429) response is deliberately not one of these variants — it stays out of scope for this component and resolves to `"unknown"` from `classifyApiError`.
- Wire `ApiNetworkError`/`ApiTimeoutError` (already classified in `src/api/core/fetch-error.ts`) through to the `network` variant of `StatusErrorPage` so an unreachable or non-responding backend gets a distinct message from an HTTP error response.
- Classify the HTTP-status→variant mapping through a small, ordered rule table (`HTTP_STATUS_RULES` in `classifyApiError`) instead of an `if`/`else` chain, so adding a status code later (e.g. a future 409/502-specific message) is a new table entry, not new branching logic.
- Update `editor-page.tsx` (and any other screen relying on the same "no data → generic fallback" pattern) to read the `error` from its data hook and pick the matching `StatusErrorPage` variant instead of the current one-size-fits-all fallback.

## Capabilities

### New Capabilities
- `frontend-error-handling`: Route-level and component-level error recovery (segment `error.tsx`, root `global-error.tsx`) plus a status-aware full-page error UI for API/network failures (401/403/5xx/network), replacing the current undifferentiated "could not load" fallback.

### Modified Capabilities
(none — no existing spec'd capability's requirements change; this only adds new behavior)

## Impact

- Affected code: `src/app/[locale]/error.tsx` and `src/app/global-error.tsx` (new), a new shared component (generalized from `src/screen/common/not-found/not-found-page.tsx`), `src/lib/utils/api-error.ts` (new `classifyApiError` helper), `src/screen/instructor/courses/editor-page.tsx` (existing symbol `InstructorCourseEditorPage`, requires `gitnexus_impact` before editing per this project's `AGENTS.md`), `src/messages/en.ts` / `vi.ts` (new `errors.statusPage` keys).
- Also added: `e2e/tests/course-error-states.spec.ts` (real Chromium/Next journey proving the forbidden `StatusErrorPage` variant renders on `editor-page.tsx` instead of the old generic fallback), `e2e/support/auth.ts` (`loginAsInstructor` helper, extracted from `e2e/tests/auth.spec.ts`'s inline login flow so both specs share it), and a `course-fixture-forbidden` route in `e2e/fixtures/server.mjs`. This is the one live e2e proof that was kept — unlike the boundary tests (see Risks in design.md), it needed no test-only route or middleware exception, since it just points the existing fixture course-detail endpoint at a second, always-forbidden id.
- No BE/API contract changes — this only consumes error information the transport layer (`src/api/core/fetch-error.ts`, `src/api/core/fetch-core.ts`) already produces (`ApiHttpError`, `ApiNetworkError`, `ApiTimeoutError`, etc.).
- Affected documentation (existing files already in the repo — this is a sync, not new docs): `docs/router.md` (`## App Router Tree` / `### Route Groups`, `## Custom 404 (not-found)`), `docs/screens.md` (`## Not Found Screen (NotFoundPage)`, `## GitNexus Cluster Mapping`), `docs/components.md` (`## shared/ — Cross-Feature Components`), `docs/patterns.md` (`## 6b. API Error Pattern (all modules)`).
- GitNexus index for `fe-mycourse` (`.gitnexus/`) must be force-synced (`npx gitnexus analyze`) after implementation, per this project's `AGENTS.md`.
- Tracked separately from the 3 open Course-collaborator role-gate follow-ups (`temporary-docs/claude-doanchat/Claude-3 van de con lai cua role gate Course collaborator.md` in `be-mycourse`) — no overlap in files or scope.
