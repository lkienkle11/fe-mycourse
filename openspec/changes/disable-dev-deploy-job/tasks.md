## 1. Establish Frontend Implementation Context

- [x] 1.1 Read and validate the stable conversation ID from `AI_SESSION_ID_FILE`, verify the path is outside every project, and create or reuse exactly one `.context/session-<SESSION_ID>.md` for this frontend apply.
- [x] 1.2 Read the complete frontend `.context` folder, `AGENTS.md`, all project documentation, every project skill under `.ai/skills`, the OpenSpec apply instructions, and all current Git changes; verify the target workflow has no pre-existing edit and record any unrelated user-owned changes that must be preserved.
- [x] 1.3 Inspect the GitNexus repository context and index freshness before editing; record that symbol impact analysis is not applicable because this change modifies YAML and documentation rather than a function, class, or method.

## 2. Disable Frontend Deployment Without Deleting It

- [x] 2.1 Prefix every non-empty line of `.github/workflows/deploy-dev.yml` from the top-level `deploy:` key through the end of the job with `# `, and verify stripping only those new prefixes reconstructs the original deploy block byte-for-byte.
- [x] 2.2 Parse `.github/workflows/deploy-dev.yml` as YAML and verify `jobs` contains active `test` and `build` entries but no active `deploy` entry, with `build.needs` still equal to `test` and the `dev` trigger/concurrency unchanged.

## 3. Synchronize Frontend Documentation

- [x] 3.1 After the workflow edit, re-read the complete frontend `.context` folder, the current `.context/session-<SESSION_ID>.md`, all relevant project documentation, GitNexus files, and the complete Git change set; verify the exact final behavior and every documentation statement that must be replaced rather than appended to.
- [x] 3.2 Update `README.md`, `docs/deploy.md`, `docs/folder-structure.md`, and `docs/quality.md` so all current-state descriptions say pushes to `dev` run `test` then `build`, automatic VPS deployment is paused, and the complete commented deploy procedure remains the restoration source; verify a repository search finds no contradictory active-auto-deploy statement in relevant frontend docs.

## 4. Run Required Frontend Validation

- [x] 4.1 Force-sync GitNexus with the repository-approved command, run `gitnexus_detect_changes(scope="all")`, and verify any generated metadata and reported scope are attributable to this change.
- [x] 4.2 Run `npm run check-all` and verify lint, Biome, the configured test command, dead-code analysis, dependency/cycle/duplicate checks, TypeScript/Next.js build, and CI/CD readiness all pass without suppressing or weakening any tool.
- [x] 4.3 Run YAML job-graph and deploy-block reconstruction checks, `git diff --check`, and `openspec validate disable-dev-deploy-job --strict --no-interactive`; verify every command passes.

## 5. Review and Record the Final Frontend State

- [x] 5.1 Review all changed committable files and the complete Git diff; verify no deployment line was deleted, no application/API/dependency/helper/secret/server configuration changed, no unrelated user change was overwritten, and no credential value was introduced.
- [x] 5.2 Update only `.context/session-<SESSION_ID>.md` with the implemented state, commands and outcomes, failures and fixes, GitNexus/documentation results, plus `What I Learned Today` and `What I Should Learn or Do Next Time`; verify exactly one frontend context exists for the Session ID.
- [x] 5.3 Provide the `AGENTS.md`-required final handoff listing implementation, changed/reused resources, duplicate avoidance, documentation/GitNexus/context updates, every passed or failed command, and remaining risks; verify the workflow has not been executed against the VPS.
