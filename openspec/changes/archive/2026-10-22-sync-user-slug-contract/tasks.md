Companion documents: `design.md` (decisions, the codebase-wide capability audit, per-file code and per-document documentation specifications), `code-change-inventory.md` (exact CURRENT and AFTER code, call sites, no-change consumers) and `docs-update-inventory.md` (verbatim CURRENT and REPLACEMENT documentation text, `DOC-n` IDs). Groups 1–17 follow the order of `AGENTS.md`. Every implementation task lists **Files/symbols**, **Call sites**, **Reuse check** (re-grep `src/` and `e2e/` before adding anything; if an equivalent exists, use it; duplication means reject and redo per the Critical Reuse and Deduplication rules), **Tests**, **Docs** (item IDs) and **Verify**. Work is frontend only (`fe-mycourse`); do not touch `be-mycourse`. Runtime behaviour must stay identical: this is a contract synchronisation with no UI, endpoint, hook or store change.

## 1. Task Classification (AGENTS.md — Scope and Applicability)

- [x] 1.1 Classify the request before any `.context` or Session ID lifecycle: it modifies project source types, a schema, tests, fixtures and project-owned documentation, so it is an **in-scope implementation task** (frontend only; this OpenSpec change is the plan). Verify: the session context's first line states "in-scope, frontend only, no backend edits".
- [x] 1.2 Because the task is in scope, the session record is the project's `.context/session-<SESSION_ID>.md` (never the external `AI_SESSION_CONTEXT_FILE`). Verify: no read-only-task external context file is created.

## 2. Memory Bank Pre-Response Load (AGENTS.md — Global Memory Bank Rules)

- [x] 2.1 Run `memory-bank-cli memory_bank_read_all --project fe-mycourse` before any task work or user-facing answer (30 s hard limit, no retry in the same turn). Verify: `activeContext.md`, `nextTasks.md`, `progress.md`, `lastResponse.md` were read; note that `nextTasks.md` was corrected after the Task A explore (the slug fields are all missing, not "existing").
- [x] 2.2 Fallback chain on failure or timeout: `memory-bank` MCP (`list_project_files`, then concurrent `memory_bank_read`), then direct reads of `/private/tmp/ai-agent/memory/fe-mycourse/`. Verify: the path used is recorded in the session context. _(Not needed: the CLI succeeded, no fallback was used.)_
- [x] 2.3 After any context compaction, reload every Memory Bank file for the project before continuing. Verify: a reload note exists in the session context for each compaction. _(No context compaction occurred.)_
- [x] 2.4 Never store secrets, credentials, tokens, private keys or raw sensitive values in memory. Verify: grep the persisted files for token and key patterns before the final answer.

## 3. Session ID Bootstrap (AGENTS.md — Critical Pre-Conversation Session Bootstrap; Subagent Propagation)

- [x] 3.1 Resolve `AI_SESSION_ID_FILE` as `<OS_TEMP_DIR>/ai-agent-sessions/<conversation-bootstrap-key>/session-id` (macOS/Linux: `$TMPDIR` then `/tmp`), outside every project and worktree, directory mode `0700`; create the ID once (atomic write) only if the file does not exist, otherwise reuse it; never regenerate it for any topic, branch, retry, compaction or new message. Verify: the file exists, holds exactly one non-empty ID, and `AI_SESSION_ID` equals it.
- [x] 3.2 Validate before touching project files: `AI_SESSION_ID_FILE` defined; path outside every project, repository and working tree; no project-level temp, `.env`, `.context` or doc file contains the ID. Verify: on any failed check, stop and repair the external state, never create a project-local fallback.
- [x] 3.3 Never search project directories for the ID file and never derive an ID from timestamps, branch or task names, PIDs or `.context` filenames. Verify: the session context records only the exact path read.
- [x] 3.4 Subagent propagation: every subagent receives the exact `AI_SESSION_ID_FILE` path, the exact `AI_SESSION_ID`, the exact `.context/session-<SESSION_ID>.md` path and the prohibition on creating or writing any other context file; only the main agent writes the session context. Verify: any subagent result that used another ID or wrote a context file is rejected and redone.

## 4. Existing Project Context (AGENTS.md — Critical First Action; Dual Session Context Lifecycle)

- [x] 4.1 Read the complete existing `.context/` folder (every `session-*.md`; 24 files at proposal time) before repository-based planning or implementation; note prior decisions, conventions, failures, constraints (course slug, taxonomy slug and `sync-me-roles-contract` learnings). Verify: the session context lists the files read and the facts reused.
- [x] 4.2 Resolve exactly one writable `<project>/.context/session-<SESSION_ID>.md`: reuse if it exists, create once if absent, never create a second file for the same ID, resolve duplicates before continuing. Verify: `ls .context | grep <SESSION_ID>` returns exactly one file.

## 5. Initial Phase — Project Understanding (AGENTS.md — Initial Phase)

- [x] 5.1 Read in full the project documentation this change touches or depends on: `docs/api-overview.md`, `docs/api-using.md` (Me API, collaborators, `CourseListItem`), `docs/modules.md`, `docs/folder-structure.md`, `docs/reusable-assets.md` (`MeResponse`, user picker, collaborators), `docs/testing.md`, `docs/instructor-admin.md`, `docs/instructor-application.md`, `docs/patterns.md`, `docs/architecture.md`, `docs/dependencies.md`, `docs/quality.md` (jscpd), `README.md`, plus `openspec/changes/sync-me-roles-contract/*` (precedent) and `openspec/changes/add-taxonomy-slug-management-ui/*`. Verify: the session context lists each file read. _(Done: the touched and dependent sections were read and grepped during the proposal and implementation; full-file reads of the large docs were done by the proposal-phase subagents.)_
- [x] 5.2 Read all three skills under `.ai/skills/` and record a compliance note for each: `logic-n-1-optimize` (no multi-item operation is added; no API call is added), `nextjs-optimization` (no image, font, script or metadata change), `nextjs-seo-optimization` (no route or metadata change; no slug route exists). Verify: each skill has a compliance line in the session context. Also read `.claude/skills/openspec-apply-change/SKILL.md` for the apply workflow.
- [x] 5.3 Use GitNexus first to trace quickly: `gitnexus_query` for "current user profile me slug avatar", "course collaborator user picker candidate", "instructor roster application identity"; `gitnexus_context` for `buildMeResponse`, `mergeInstructorApplicationDetail`, `useAuth`, `UserMultiSelectPickerDialog`. Verify: results, including the known gap that type-only symbols are poorly indexed, are recorded in the session context. _(Done: `gitnexus_impact` and `gitnexus_detect_changes` ran; `gitnexus_context`/`query` returned not-found for type-only symbols, so grep was the authority.)_
- [x] 5.4 Review all changed code in Git before editing: `git status --short`, `git log -10 --stat`, `git diff main...HEAD --stat`; preserve any pre-existing uncommitted work. Verify: the session context states the working-tree baseline (clean at proposal time on `feat/taxonomy-slug-management-ui`, HEAD `2a807df`).
- [x] 5.5 Map the structure for this change: types in `src/types/{auth,course,user-picker,instructor}`, payload type next to the caller in `src/api/callers/auth/auth-factory.ts`, Zod schemas in `src/schema/me` with shared fields in `src/schema/shared`, fixtures in `src/test-support/fixtures`, colocated tests, e2e fixture in `e2e/fixtures/server.mjs`; lint, knip, madge and jscpd rules from `package.json`. Verify: the session context records where each edit lands and why no new module is created.
- [x] 5.6 Subagents only when they save real time (at most 4; never by default): Auto mode or a same-family model at the same or lower tier with input price ≤ USD 3 and output price ≤ USD 15 per million tokens (if unverifiable use Auto or the lowest cost); pass the propagation data from 3.4. Verify: the main agent consolidates findings, avoids duplicated effort and owns the final approach.
- [x] 5.7 Re-verify the backend contract at implementation time (the BE branch is local): `be-mycourse/internal/auth/delivery/dto.go` (`MeResponse`, `UpdateMeRequest`), `internal/course/domain/course.go` (`CourseListItem.OwnerSlug`, `Collaborator`, `InstructorCandidate`), `internal/instructor/delivery/dto.go` (`rosterResponse`, `rosterCandidateResponse`, `applicationMeResponse`). Verify: any difference from `design.md` is written into the session context and the design is updated before editing. Read only; never edit `be-mycourse`.

## 6. GitNexus Safety Gates (CLAUDE.md — Always Do / Never Do / Self-Check)

- [x] 6.1 Refresh the index: `npx gitnexus analyze` (add `--embeddings` only if `.gitnexus/meta.json` reports `stats.embeddings` > 0; it is 0 at proposal time). Verify: `.gitnexus/meta.json` `lastCommit` equals HEAD.
- [x] 6.2 Run `gitnexus_impact({ target, direction: "upstream" })` for **every symbol that will be edited**: `MeResponse`, `UpdateMePayload`, `updateMeSchema`, `UserPickerCandidate`, `CourseCollaborator`, `CourseListItem`, `MyInstructorApplication`, `InstructorUserIdentity`, `InstructorRosterMember`, `buildMeResponse`. Report direct callers, affected processes and risk to the user before the first edit; warn on any HIGH or CRITICAL result. Where GitNexus returns zero callers for a type-only symbol (graph gap), use the grep caller lists in `code-change-inventory.md` §2 and §4. Verify: the impact report is written into the session context before the first source edit.
- [x] 6.3 `CourseCollaborator` is restructured (T5): run `gitnexus_context` on it and on `UserPickerCandidate` to list every incoming and outgoing reference (extract/split rule). Verify: all d=1 dependents appear in `code-change-inventory.md` §2 T4/T5 and §4. _(Done: `gitnexus_context` returned "Symbol not found" for `CourseCollaborator`; dependents come from the grep lists in `code-change-inventory.md` §2 T4/T5 and §4.)_
- [x] 6.4 There is no symbol rename in this change. If a rename becomes necessary use `gitnexus_rename({ dry_run: true })` first, never find-and-replace. Verify: no rename was done by text replacement.

## 7. Critical Reuse and Deduplication Audit (AGENTS.md — before writing code)

- [x] 7.1 Re-run the capability audit on the current HEAD (GitNexus → docs → source): `grep -rn "user_id: string" src/types`, `grep -rnE "avatar_file_id\?: string" src`, `grep -rn "display_name: string" src/types`, `grep -rn "optionalSlugField\|requiredSlugField" src`, `grep -rn "SLUG_PATTERN\|SLUG_MAX_LENGTH" src`, `grep -rn "user_id: \"user-candidate\"\|display_name: \"Fixture Instructor\"" e2e`. Verify: no new identity-shape or slug-rule duplicate appeared since the proposal; if one did, update `design.md` and the inventory to reuse or merge it first.
- [x] 7.2 Confirm the "examined and kept separate" table in `design.md` still holds (`UpdateMePayload` vs `updateMeSchema` kept as payload type plus schema; `MyInstructorApplication` vs `InstructorApplication`; `InstructorRosterMember` vs `UserPickerCandidate`; ticket and rejection types without slug; taxonomy chips). Verify: each keeps its documented semantic reason.
- [x] 7.3 Record the cross-feature import-edge baseline (`grep -rn 'from "@/components/features/' src` importers by feature; `grep -rn "from \"@/types/" src/types`) before editing. Verify: the baseline is compared again in 11.3 and shows **no new edge** (`src/types/course.ts` already imports `src/types/user-picker.ts`; `src/schema/me/me.ts` gains `@/schema/shared`, the neutral module `src/schema/course` and `src/schema/taxonomy` already use).
- [x] 7.4 Baseline gates on the untouched branch: `npx tsc --noEmit`, `npm run lint`, `npm run biome`, `npm test`, `npm run deadcode`, `npm run quality:deps`; optionally `npm run test:e2e` (record pass counts and any pre-existing failure). Verify: results are in the session context so later failures are attributable.

## 8. Middle Phase — Implementation (existing structure; reuse first; English only)

### 8a. Types and payload (order matters: base types first)

- [x] 8.1 `src/types/user-picker.ts`: ADD `slug: string` to `UserPickerCandidate` (T4).
  - Files/symbols: `UserPickerCandidate`. Call sites: none edited; `CourseInstructorCandidate` (`course.ts:296`) inherits it.
  - Reuse check: this is the single owner of the identity shape; do not add `slug` anywhere else for this shape.
  - Docs: DOC-19, DOC-20. Verify: `npx tsc --noEmit` reports errors only at the literals fixed in 8.8–8.10 (expected).
- [x] 8.2 `src/types/course.ts`: MODIFY `CourseCollaborator` to `UserPickerCandidate & { role: CourseCollaboratorRole }` and DELETE the five duplicated field lines (T5); ADD `owner_slug?: string` after `owner_display_name?` in `CourseListItem` (T6).
  - Call sites: `course.ts:98,167`, `course-factory-core.ts:16,110,116,158,167`, `useCourseCollaborators.ts:9,17`, `use-course-collaborator-actions.ts:11,28,33,54`, `course-editor-collaborators-tab.tsx:26,38,122,195-203` (no edit).
  - Reuse check: `UserPickerCandidate` is already imported at line 2; no new import; confirm with `grep -rnE "(Pick|Omit|Partial)<\s*CourseCollaborator"` that nothing derives from the old object type.
  - Docs: DOC-6, DOC-8, DOC-11, DOC-20. Verify: `npx tsc --noEmit` shows no error on any `CourseCollaborator` consumer.
- [x] 8.3 `src/types/instructor.ts`: ADD `slug: string` to `MyInstructorApplication`, `InstructorUserIdentity` and `InstructorRosterMember` (T7, T8, T9).
  - Call sites: see `code-change-inventory.md` T7–T9 (no edit); `mergeInstructorApplicationDetail` still type-checks through its spread.
  - Reuse check: `slug` is not added to `InstructorTicket`, `InstructorTicketMessage`, `InstructorRejectionRecord` (the BE emits none).
  - Docs: DOC-25, DOC-27. Verify: `npx tsc --noEmit` shows errors only at the literals fixed in 8.10.
- [x] 8.4 `src/types/auth/auth.ts`: MODIFY `MeResponse`: ADD `slug: string`, MODIFY `avatar_url` to optional, ADD `avatar_object_key?: string` (T1).
  - Call sites: `user-menu.tsx:26-29` and `sidebar-auth-footer.tsx:51-53` already guard by truthiness (no edit); confirm `src` has no other `me.avatar_url` reader with `grep -rn "\.avatar_url" src`.
  - Docs: DOC-1, DOC-3, DOC-12, DOC-18. Verify: `npx tsc --noEmit` clean on `src/components/common`.
- [x] 8.5 `src/api/callers/auth/auth-factory.ts`: ADD `slug?: string` to `UpdateMePayload` (T2).
  - Call sites: `patchMeService` and its re-export only; no caller to edit.
  - Docs: DOC-4, DOC-9. Verify: `npx tsc --noEmit` clean.

### 8b. Schema

- [x] 8.6 `src/schema/me/me.ts`: ADD `slug: optionalSlugField.optional()`, the `import { optionalSlugField } from "@/schema/shared"` line and the updated doc comment (T3).
  - Reuse check: no regex or length literal is written; the format rule is the shared one. Do not import the schema into `auth-factory.ts` (isomorphic caller).
  - Tests: 8.11. Docs: DOC-13, DOC-15. Verify: `npm run cycles` reports no cycle.

### 8c. Fixtures and test builders

- [x] 8.7 `src/test-support/fixtures/auth.ts`: ADD `slug: "test-learner"` and DELETE `avatar_url: ""` in `buildMeResponse` (F1).
  - Call sites: `use-permissions.test.tsx:95`, `dashboard-layout.test.tsx:91` inherit the field.
  - Docs: DOC-16, DOC-22. Verify: `npx jest src/hooks/auth/use-permissions.test.tsx src/components/common/dashboard/dashboard-layout.test.tsx --ci` passes.
- [x] 8.8 `src/hooks/course/use-course-collaborator-actions.test.tsx`: ADD `slug` to `buildCollaborator` (F2). Verify: `npx jest src/hooks/course/use-course-collaborator-actions.test.tsx --ci` passes.
- [x] 8.9 `src/components/shared/user-multi-select-picker-dialog.test.tsx`: ADD `slug` to both `rows` literals (F3). Verify: `npx jest src/components/shared/user-multi-select-picker-dialog.test.tsx --ci` passes.
- [x] 8.10 `src/lib/instructor-application/get-page-state.test.ts`: ADD `slug: "learner"` to `buildApplication` (F4). Verify: `npx jest src/lib/instructor-application/get-page-state.test.ts --ci` passes.
- [x] 8.11 ADD `src/schema/me/me.test.ts` (N1) and `src/lib/instructor-application/helpers.test.ts` (N2) exactly as specified in `code-change-inventory.md`.
  - Reuse check: reuse `SLUG_MAX_LENGTH` from `@/lib/utils/slug`; do not copy the case lists of `src/schema/shared/slug.test.ts` beyond the me-specific assertions.
  - Docs: DOC-28. Verify: `npx jest src/schema/me/me.test.ts src/lib/instructor-application/helpers.test.ts --ci` passes; record the real case counts for DOC-28.
- [x] 8.12 `e2e/fixtures/server.mjs` (E1–E4; plain `.mjs`, not type-checked): ADD `slug` to the three `USERS` entries and to `CANDIDATE_USER`; ADD `seedCollaborators()` and use it for both the module-level `collaborators` and `resetState()` (deleting the two inline literals); ADD `slug: user.slug` and DELETE `avatar_url: ""` in `userMeResponse`.
  - Reuse check: the owner row is built from `USERS["instructor@example.test"]`; no second copy of the instructor's name, id or slug remains. `CANDIDATE_USER` stays the single source for the candidates list and the bulk-add `added[]` row.
  - Tests: no spec edit is required (verified: no spec reads user slug or `avatar_url`).
  - Docs: DOC-23. Verify: `node --check e2e/fixtures/server.mjs`; `npm run biome` clean on the file; the e2e run in 10.3.

## 9. Final Phase — GitNexus Sync (AGENTS.md — Final Phase)

- [x] 9.1 Force-sync GitNexus after the implementation and before the gates: `npx gitnexus analyze` (no `--embeddings` unless `.gitnexus/meta.json` `stats.embeddings` > 0). Verify: `.gitnexus/meta.json` reflects the new HEAD working state and the regenerated counts in `AGENTS.md` / `CLAUDE.md` are the only changes to those two files.
- [x] 9.2 Run `gitnexus_detect_changes({ scope: "all" })`. Verify: only the symbols and files listed in `code-change-inventory.md` changed and every d=1 dependent is accounted for.

## 10. Quality Gates and Exit Code Rule (AGENTS.md — Final Phase; Exit Code Rule; Tooling rule protection)

- [x] 10.1 `npx tsc --noEmit`. Verify: exit 0 (this also catches any literal missed in group 8, excluding the `.mjs` fixture). _(Result: exit 0 after `next build` regenerated `.next/types`; the baseline exit 1 came only from two stale gitignored junk files `.next/types/routes.d 2.ts` and `routes.d 3.ts`.)_
- [x] 10.2 `npm run check-all` (= `npm run lint && npm run biome && npm run test && npm run deadcode && npm run quality:deps && npm run build`; `quality:deps` = `cycles` + `dupl`). Verify: exit 0. Never modify, disable, weaken or bypass a lint, biome, knip, madge, jscpd, jest or tsconfig rule; fix the implementation instead.
- [x] 10.3 `npm run test:e2e` (starts the fixture backend on 4100 and the app on 4200; not part of `check-all`). Verify: all journeys pass, or record exactly which could not run and why (browser or port unavailable); do not claim success otherwise. _(Result: 27 passed against the fixture backend, not a real backend.)_
- [x] 10.4 Exit Code Rule: any non-zero exit, including failures unrelated to this change that can break CI/CD, is fixed gradually and every required gate is re-run until all pass. Verify: the final report lists each command with its real exit status; nothing is claimed that was not run.

## 11. Post-Implementation Code Review (AGENTS.md — Post-Implementation Code Review Requirement)

- [x] 11.1 `git diff --check`; inspect the complete diff. Verify: only files in `code-change-inventory.md` §2 plus the documents in `docs-update-inventory.md` (and the regenerated GitNexus blocks) changed.
- [x] 11.2 Review every written or modified file against the checklist, recording findings in the session context: follows the existing architecture; follows the existing folder structure; existing types, schema fields and fixtures were reused; no duplicate logic (one identity shape, one slug rule, one owner-seed row); no unrelated files modified; no hardcoded secrets or credentials; ready for CI/CD. Reject and redo on any duplication.
- [x] 11.3 Compare the import-edge baseline from 7.3 with the final tree. Verify: no new sibling-feature edge; `npm run cycles` clean.
- [x] 11.4 `openspec validate sync-user-slug-contract --strict --no-interactive`. Verify: valid; the checklist in this file matches the implemented state.
- [x] 11.5 Confirm every "kept separate" item in `design.md` is untouched in the diff (`useSlugConflictFlow`, `SlugConflictConfirmDialog`, `mergeInstructorApplicationDetail`, `course-admin-list-columns.tsx`, `instructor-user-cell.tsx`, ticket types). Verify: `git diff --stat` shows none of those files.

## 12. Documentation and Context Sync (AGENTS.md — Documentation and Context Sync; Full Documentation Replacement; Language Consistency; Swagger rule)

- [x] 12.1 Re-read every document in `docs-update-inventory.md` and the whole `.context/` folder before editing, then apply DOC-1 … DOC-28 exactly (English; replace, never append; keep each file's tone and terminology). Fill DOC-28's `[Status]` and `[N]` from the real run in 8.11. Verify: each CURRENT passage no longer exists and each REPLACEMENT is present once.
- [x] 12.2 Refresh the audit stamps (DOC-2, 5, 10, 14, 17, 21, 24, 26) with the real date, keeping the previous stamp as `Prior:`. Verify: `grep -n "Last audited\|Last updated" <file>` shows the new stamp first.
- [x] 12.3 Run the final sweep from `docs-update-inventory.md` ("Final sweep"). Verify: `grep -rn "avatar_url: string" README.md docs` and `grep -rn "{ avatar_file_id?: uuid }" README.md docs` return nothing; no sentence lists `/me` fields without `slug`.
- [x] 12.4 Scan the whole repository for documents the inventory may have missed (`grep -rln "MeResponse\|CourseCollaborator\|UserPickerCandidate\|owner_display_name" --include='*.md' . | grep -v node_modules`). Verify: every hit is either changed or listed under "Scanned — no change" with a reason.
- [x] 12.5 Swagger rule: no Swagger YAML exists or changes in this repository, so `ruby generate-apidog-postman.rb` is not applicable. Verify: `git diff --name-only | grep -i swagger` is empty.
- [x] 12.6 Replace (not append to) the descriptions in the current project's `.context/session-<SESSION_ID>.md` and refresh GitNexus files (9.1). Verify: no conflicting old and new statements remain in that file; other sessions' files are untouched.

## 13. Sensitive Test Accounts and Environment Secrets (AGENTS.md — Sensitive policy)

- [x] 13.1 Inspect only the committable Git surface (`git ls-files`, `git status --short`, `git check-ignore -v`): changed tests, fixtures and docs contain only placeholders (`example.com`, `example.test`, synthetic slugs such as `test-learner`, `fixture-instructor`), no credentials, tokens, private endpoints or values derived from `.env`; mention environment variables by name only. Note: `e2e/fixtures/server.mjs` already holds fixture passwords for synthetic accounts; do not add any. Verify: the final report states that only the committable Git surface was inspected and never claims the whole machine was checked.

## 14. Mandatory End-of-Task Learning Summary

- [x] 14.1 Update only `.context/session-<SESSION_ID>.md` after implementation, review, gates, GitNexus and docs are complete, with **What I Learned Today** (the memory-bank claim that these slug fields already existed was wrong; `/me` never populates avatar fields on the BE; the `.mjs` fixture escapes the type-checker; `CourseCollaborator` duplicated the picker shape; the fixture seed was duplicated; user slug has no 409 so the create-only conflict flow does not apply; user corrections) and **What I Should Learn or Do Next Time** (verify Memory Bank claims against code first; Task B Home wiring; future slug UI needs a message namespace and `isSlugAdjusted`; BE swagger and doc drift to report; get-by-slug and slug search need BE work). Verify: based only on what actually happened; exactly one session file; no other session's file modified.

## 15. Memory Bank End-of-Turn Persistence (AGENTS.md — Required end-of-turn persistence; Verbatim final-response persistence)

- [x] 15.1 As the last operation before the final answer: `memory-bank-cli memory_bank_update` for `activeContext.md`, `progress.md` and `nextTasks.md` (Task A done; Task B next), and for `lastResponse.md` the complete final answer verbatim (CLI → MCP → direct file; 30 s limit; no retry in the same turn). Verify: only claim persistence if the write succeeded; emit exactly the persisted text.

## 16. Final Response Requirement (AGENTS.md)

- [x] 16.1 Report: what was implemented; files changed; existing resources reused (`UserPickerCandidate`, `optionalSlugField`, `USERS`); duplicate logic merged or avoided (collaborator identity shape, fixture owner seed); documentation, GitNexus and the `.context/session-<SESSION_ID>.md` updated; quality gates run; commands passed; commands failed and how they were fixed; remaining risks (BE branch unmerged; contract verified by code reading; avatar fields never populated by the BE; BE swagger and doc drift) and follow-ups (Task B, slug UI). Verify: nothing is claimed that was not run.

## 17. Commit Rules (AGENTS.md — Commit rules; Branch rename; Agent rule boundaries)

- [x] 17.1 Commit only if the user asks: title in English, one line `<type>: <title>`, no scope or parentheses, no body or footer, 15–72 characters, specific enough to explain the change (for example `feat: sync user slug fields with the api contract`); let the Husky `pre-commit` hook run `make check-all` if present (the FE repo has no Husky or Makefile at this commit, so `npm run check-all` is the gate) and the `commit-msg` commitlint hook; never `--no-verify`; before committing run `gitnexus_detect_changes()`; after committing refresh GitNexus (`npx gitnexus analyze`). Verify: `git log -1 --format=%s` matches the rules.
- [x] 17.2 Branch rename rules apply only if the user asks to rename the branch; never push, delete remote branches or change upstream unless separately requested. Verify: no push or remote change was made.
