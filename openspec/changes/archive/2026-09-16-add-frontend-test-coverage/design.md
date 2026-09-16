## Context

See proposal.md for motivation. The checkout uses Next.js 16.2.1, React 19.2.4, TypeScript, next-intl, SWR, Zustand, Zod, and xior. `npm test` is a successful placeholder; `test-all` and `check-all` already invoke it, and the dev workflow runs `test-all` before its build job. No canonical `openspec/specs` directory exists yet; related API contracts are documented in existing change artifacts and project documentation.

Source inspection identifies reusable seams: pure refresh eligibility/envelope helpers, permission-tree filtering, the shared bulk picker finalizer, caller factories accepting API methods, and course reorder hooks accepting cache and lease callbacks. Global 404 and locale layout are async Server Components. These seams permit useful tests without extracting new production modules solely for testing.

## Goals / Non-Goals

**Goals:** Make regressions observable through deterministic commands, cover the finite behavior matrix below, and keep failure diagnosis local to the relevant layer. Complete one overall initiative through three independently reviewable stages.

**Non-Goals:** Change authorization policy, add endpoints, promise backend contract conformance from mocks, redesign production state management, test third-party library internals, or achieve exhaustive file/device/visual coverage.

## Decisions

### 1. One unit/integration runner and one real-runtime layer

Use Jest configured through `next/jest`, React Testing Library, jest-dom, user-event, and MSW. Select compatible development dependency versions during implementation against the installed Node/Next/React versions and commit the lockfile. Use Node for pure/server-side helpers and jsdom for client components/hooks; do not mix implicit globals between environments. Import Jest APIs explicitly to avoid type collisions with browser tests.

Use Playwright with Chromium for the required browser journeys. Async Server Components, actual routing, provider composition, and cookie round trips belong here. Pure logic called by a server component can still have unit tests. Jest-only coverage was rejected because rendering a mocked component does not exercise Next routing; introducing Vitest alongside Jest was rejected because two unit runners add no required capability.

Reference: https://nextjs.org/docs/app/guides/testing/jest (reviewed during exploration; recheck compatibility at implementation).

### 2. Preserve real application behavior inside each test boundary

Colocate Jest tests as `*.test.ts(x)` next to their source. Put shared render/fixture helpers under `src/test-support/`, where existing source quality tools can inspect them. Keep browser specs and their fixture server in `e2e/`, the conventional separate runtime suite; do not use directory placement to evade checks. Reuse factories for data and table-driven cases to comply with duplication rules. Keep test imports out of production entry points.

The render helper supplies actual locale messages, a fresh SWR cache, and explicit auth state. Restore Zustand state, cookies/storage, timers, network handlers, and subscriptions after each test. Mock HTTP boundaries with MSW while retaining the actual API client, hooks, and rendering in integration tests. Unexpected requests fail; tests do not contact dev/prod services. Focused unit tests may inject existing collaborators, but a mocked service-call assertion alone is insufficient evidence for a complete business flow.

For browser tests, start a local HTTP fixture backend before starting the production-built Next server. Supply its URL at both build and runtime where public/server configuration requires it. It serves both browser and Next-server requests, including refresh responses and Set-Cookie headers. Browser route interception alone was rejected because it cannot cover server-originated requests. Use serial execution with reset fixtures and a fresh browser context per scenario initially; concurrency can be introduced separately. Provide only synthetic accounts/tokens, scope fixture control to loopback, and shut down child processes on success or failure. No production authentication bypasses or test-only routes are added to the app.

### 3. Fixed behavior matrix and explicit contract authority

Record the planned behavior matrix in the current implementation session context after bootstrap and project understanding. After implementation, GitNexus force-sync, quality gates, and review, publish the verified matrix in `docs/testing.md` with one row per behavior: source contract, test layer/file, required cases, and status. Resolve expected behavior from existing specs and documented API/business contracts, then current source where unambiguous. A conflict becomes an explicitly reviewed defect or contract question, not an assertion that silently blesses the current implementation.

| Stage | Source targets | Required cases |
| --- | --- | --- |
| 1 | `src/api/auth/auth-refresh.ts` | 401/403, expired header, bearer presence, already-retried guard, malformed/missing rotated tokens and envelopes |
| 1 | `src/lib/utils/permission.ts` | all/any/empty requirements, absent permission, nested branch retention/removal; role labels never substitute for permission inputs |
| 2 | auth transport, browser/server auth, refresh route, auth store | successful login/logout, refresh success/failure, retry bound, cookie rotation/clearing per contract, concurrent refresh coordination as documented, denied response handling |
| 2 | collaborator actions and bulk picker finalizer | empty selection, one bulk request with all IDs and `EDITOR`, all/partial/no successes, API failure, loading reset, failed selection retained and successful selection removed by the consuming picker |
| 2 | course outline reorder hook | success merge, lease denial, lease rejection, persist rejection, optimistic rollback and lease release according to the accepted contract; sections/lessons/sublessons |
| 2 | shared API queries and representative form UI | disabled query, loading/empty/error/success, page merge/deduplication, no duplicate load-more while pending, validation error, pending submit behavior |
| 3 | running app auth/course/locale routes | login to protected screen, logout/expired-session path, forbidden response UI, collaborator submit, outline reorder success and failure recovery, valid locale and unknown URL/invalid locale 404 behavior |
| 3 | instructor page-state resolver, taxonomy schemas, media caller factory, event normalizer | instructor state/permission combinations; valid/invalid taxonomy inputs; multipart files/default visibility/error; valid/invalid event and default source/metadata |

This is the acceptance set, not a claim that the entire application is covered. Additional features go into a named residual backlog. Deduplication, batch limits, destructive confirmation, and similar cases are required only at the existing layer whose accepted contract defines them; this proposal does not invent limits or add new product behavior.

### 4. Commands and CI strengthen existing checks

Proposed commands: `test` runs Jest once; `test:watch` is local interactive mode; `test:coverage` reports statements/branches/functions/lines; `test:e2e` runs the managed fixture-server/Next/Playwright lifecycle. Normal test execution fails on zero discovered tests, assertion failures, and unexpected network access. Distinguish pure/node and component projects in diagnostics.

Keep existing `test-all` and `check-all` checks intact, with `test` now executing real tests. Stage 1 makes unit/integration tests required wherever these commands already run. Stage 3 adds a dedicated browser workflow on pull requests and pushes to dev; it runs the existing quality command before building the app with fixture configuration and executing browser tests. The existing dev build/deploy workflow and commented deployment block remain intact. Do not change branch protection settings automatically or claim that a workflow is a required merge check without verifying repository settings.

Upload browser failure traces/screenshots and coverage summaries with synthetic data only. Use no blanket retries to turn intermittent failures green and no pass-with-no-tests switch. No suppression, threshold reduction, new ignored source paths, or disabled quality check is authorized by this proposal. If existing protected tooling cannot accommodate the completed implementation, follow the repository's explicit approval process.

### 5. Measure coverage without substituting it for acceptance

Collect coverage for the explicit source targets in the behavior matrix, including files with zero tests, and label reports as selected-scope coverage. Keep a complete source inventory in the matrix/backlog so omitted domains remain visible. Do not imply this is whole-repository coverage. Establish the measured baseline after stage 1; every required scenario must pass regardless of percentages. Global numerical thresholds are deferred to a separate evidence-based decision, not automatically set to 80% or 100%. Snapshot-only tests and tests that merely repeat implementation expressions do not satisfy a behavior row.

## Risks / Trade-offs

- Mock/backend drift → Anchor fixture shapes to documented envelopes and source contracts, document that backend enforcement remains unverified, and track live contract checks separately.
- Existing bugs exposed by rollback/auth tests → Preserve the failing scenario and document the conflict; resolve a targeted fix explicitly before accepting the affected stage. Do not widen scope silently or skip the test.
- ESM/browser-only dependencies and jsdom gaps → Validate representative imports in stage 1; use browser coverage for browser runtime behavior instead of widespread mocks or weakening lint/build rules.
- State/cache leakage and timers → Fresh providers, deterministic clocks where needed, complete teardown, and two consecutive clean acceptance runs per stage.
- Runtime cost → Keep Chromium journeys bounded and avoid repeating all unit cases in E2E. No browser provisioning is required for ordinary Jest execution.
- Single large change review → Maintain one OpenSpec change but deliver by stage and by feature-sized PRs; unlimited time does not remove review and fixture-design risks.

## Migration Plan

Each of the three delivery stages follows the complete AGENTS.md lifecycle. The numbered stage headings in tasks.md are delivery boundaries, not permission to omit project understanding or finalization.

1. Before implementation commands or project reads, establish or validate the stable external conversation Session ID. Read the complete existing project context, resolve exactly one project session file, then read project documentation and relevant skills, inspect Git changes and structure, identify reuse, and inspect GitNexus. Propagate the same identity to any research subagent and follow model/cost restrictions. Keep planning-only revisions outside the coding context lifecycle.
2. Implement the stage in English using existing resources. Run upstream impact before every existing-symbol edit, report risk and direct dependents, and follow graph-aware refactoring rules. Reject duplicate implementations and consolidate shared logic. Stage 1 establishes the harness/reference tests; stage 2 covers priority flows; stage 3 covers browser runtime and bounded expansion.
3. Force-sync the FE GitNexus index with `npx gitnexus analyze --force`, preserving embeddings when present. Then run the stage acceptance suites and `npm run check-all`. Fix FE CI-breaking failures without weakening tooling or modifying BE, re-sync indexed code after fixes, and rerun required gates.
4. Review all stage changes for architecture, folder placement, reuse, duplication, scope, committable-surface secrets, and CI readiness. Correct findings and repeat the affected sync/gate cycle before accepting the review.
5. Reread project documentation, complete context, the current session file, and graph documents; scan source and fully reconcile relevant documentation/GitNexus files with the delivered behavior. Replace outdated text, preserve document languages, and publish the verified testing matrix and residual backlog. Validate the final scope with change detection and strict OpenSpec validation; rerun checks affected by subsequent edits.
6. Update only the current project's session context with consolidated state, `What I Learned Today`, and `What I Should Learn or Do Next Time`. Verify stable identity and a single session file, then report actual changes, reuse/deduplication, documentation and graph sync, checks, failures/resolutions, and remaining risks. Apply governing memory persistence requirements without claiming unperformed writes. Repeat this lifecycle for the next stage using the same conversation identity.

Stage acceptance still requires two consecutive reset-state suite runs for isolation evidence and passing applicable quality checks. Stage 3 adds browser runs; no stage can be accepted with unresolved required behavior rows. Hosted CI remains unverified until an actual run is observed.

There is no data migration or application deployment in this proposal. Commits are separate user-authorized actions and require change detection, the prescribed hooks and message format, and post-commit reindexing with embeddings preserved. If protected tooling cannot be satisfied, follow the repository's explain/stash/await-decision/reapply procedure; do not introduce silent skips or restore a successful placeholder as a workaround.
