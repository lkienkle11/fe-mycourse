## Why

Development pushes should continue to run frontend quality checks and produce the runtime artifact without automatically deploying that artifact to the VPS. Temporarily disabling only the deployment job prevents unintended server changes while retaining the deployment procedure for later reactivation and keeping repository documentation consistent with the active workflow.

## What Changes

- Comment every non-empty line of the `deploy` job in `.github/workflows/deploy-dev.yml` instead of deleting or rewriting the job.
- Preserve the complete artifact download and verification, SSH, server Git synchronization, dependency installation, rsync, and PM2 reload workflow text in place.
- Leave the `test` and `build` jobs, workflow triggers, concurrency settings, imported actions, and deployment helpers unchanged.
- Keep the workflow valid so pushes to `dev` still execute `test` followed by `build`, but no deployment job is registered or run.
- Audit and synchronize all relevant frontend documentation that currently describes automatic dev deployment, including `README.md`, `docs/deploy.md`, `docs/folder-structure.md`, and `docs/quality.md`, so it states that deployment is temporarily paused while test and build remain active.
- Execute the complete implementation lifecycle required by `AGENTS.md`: validate and reuse the conversation Session ID, create or reuse the exact frontend session context, inspect all existing contexts and relevant documentation/skills/Git state, review GitNexus applicability before editing, force-sync GitNexus after editing, run every required frontend quality gate, perform the post-implementation review, and record the final learning and handoff state.
- Keep application source, APIs, dependencies, deployment scripts, secrets, and server configuration unchanged.

## Capabilities

### New Capabilities

- `development-ci-pipeline`: Defines the observable frontend development pipeline while automatic VPS deployment is paused and preserves the disabled deployment procedure for restoration.

### Modified Capabilities

None.

## Impact

- Primary implementation file: `.github/workflows/deploy-dev.yml`.
- Governance-required synchronization may update relevant documentation, GitNexus-generated metadata, and `.context/session-<SESSION_ID>.md`; it must not introduce unrelated changes.
- GitHub Actions continues to test and build the frontend on pushes to `dev`.
- Artifact download/verification, VPS SSH, server Git synchronization, runtime rsync, and PM2 reload are not executed while the job remains commented.
- Frontend validation includes `npm run check-all`, GitNexus force-sync/change detection, YAML validation, scoped diff review, strict OpenSpec validation, and final CI/CD readiness review.
- No application code, API, dependency, deployment helper, secret, or remote server state changes.
