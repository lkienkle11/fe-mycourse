## Why

The frontend currently reports success from `npm test` without executing behavioral tests, so the existing quality pipeline cannot detect regressions in authentication, permission-driven UI, or course editing. Establishing automated checks now provides a reusable safety net for ongoing changes without attempting to test every file or freezing unintended behavior.

## What Changes

- Establish Jest through `next/jest`, React Testing Library, user-event, and MSW for deterministic unit and frontend integration tests, with separate Node and jsdom environments.
- Replace the placeholder test command with an actual failing-on-regression suite and retain every existing lint, formatting, dependency, duplication, dead-code, and build check.
- Protect auth refresh/session handling, permission navigation, collaborator bulk submission, shared query state, and optimistic course-outline updates, including rejection and recovery paths.
- Add Playwright checks against the running Next.js application for login/session, protected navigation, a course-editing journey, and locale/404 behavior. Use a local HTTP fixture backend accessible to both browser and Next.js server requests; these checks validate FE behavior, not backend authorization enforcement.
- Add bounded representative coverage for instructor application state, taxonomy validation, media multipart requests, and inbound event normalization.
- Deliver in exactly three stages: foundation and reference tests; priority business flows; browser runtime and representative expansion. Each stage has its own acceptance gate and can be reviewed in smaller PRs.
- Maintain a behavior-to-test matrix, coverage reports, and a residual backlog. Do not require a test for every file or an arbitrary global coverage percentage.

## Capabilities

### New Capabilities

- `frontend-test-execution`: Deterministic local/CI test execution, isolation, diagnostics, and preservation of existing quality checks.
- `frontend-regression-coverage`: Required automated verification of selected frontend contracts and browser journeys, with explicit test boundaries and staged completion criteria.

### Modified Capabilities

None. Existing product/API behavior is not redefined; the capabilities above describe developer-facing verification guarantees.

## Impact

- Future implementation affects test dependencies and lockfile, Jest/Playwright configuration, test helpers and fixtures, colocated tests, test documentation, and additive CI integration. No dependencies or runtime code are changed by this proposal.
- Existing source targets include `src/api/auth`, `src/api/transport`, `src/app/api/auth/refresh`, `src/lib/utils/permission.ts`, `src/hooks/course`, `src/api/hooks/shared.ts`, `src/store/auth`, and the selected instructor/taxonomy/media/events modules.
- Reuse the existing `test-all` and `check-all` entry points and the dev workflow test-before-build dependency. Keep the commented deployment procedure intact.
- Backend code, schema/migrations, live third-party OAuth, exhaustive browser/device matrices, load testing, and full-repository coverage are outside this change.
- Any discovered product defect must be documented against its source contract and handled explicitly; do not silently refactor production behavior or weaken protected tooling to make tests pass.
