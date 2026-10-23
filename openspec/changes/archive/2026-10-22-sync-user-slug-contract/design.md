## Context

See `proposal.md` for motivation and `specs/user-slug-contract/spec.md` for the requirements. Companion documents: `code-change-inventory.md` (exact "after" code, call sites, reuse ledger, no-change consumer list) and `docs-update-inventory.md` (verbatim CURRENT and REPLACEMENT text per documentation passage). This change is frontend only (`fe-mycourse`); `be-mycourse` is read-only evidence and is never edited.

### Current state (HEAD `2a807df`, branch `feat/taxonomy-slug-management-ui`, working tree clean)

The audit sources, in AGENTS.md order: (1) GitNexus (index one commit behind; type-only symbols are poorly represented, so `impact` returned no callers for `MeResponse` and could not resolve `UserPickerCandidate`; grep results below replace it), (2) the existing docs, (3) the source in `src/`, `e2e/`, plus the backend DTOs, handlers, SQL projections and `docs/api_swagger.yaml`.

| Backend contract (verified in `be-mycourse`) | Frontend type today | Gap |
|---|---|---|
| `MeResponse.slug` string, no `omitempty` (`internal/auth/delivery/dto.go:89`) | `MeResponse` has no `slug` (`src/types/auth/auth.ts:14-25`) | missing |
| `MeResponse.avatar_url`, `avatar_object_key`: `*string`, `omitempty` (`dto.go:90-91`) | `avatar_url: string` required; no `avatar_object_key` | required vs optional; missing |
| `UpdateMeRequest.slug` `validate.Optional[string]` (`dto.go:80`): omitted = unchanged; null/empty/malformed/reserved = 400 `ValidationFailed`; taken = auto-suffix, never 409 | `UpdateMePayload { avatar_file_id? }` and `updateMeSchema` (avatar only) | missing |
| `CourseListItem.owner_slug` `omitempty` (`internal/course/domain/course.go:50`); populated by admin list, trash, review queue (`COALESCE(ou.slug,'')`, `repos.go:238`); not by `/courses/my` or `/learner-courses` | `CourseListItem` has `owner_display_name?` only (`src/types/course.ts:33-46`) | missing |
| `Collaborator.slug` string (`course.go:102`) on list, bulk-add `added[]`, `CourseDetail.collaborators[]` | `CourseCollaborator` (`course.ts:78-85`) | missing |
| `InstructorCandidate.slug` (`course.go:211`), `rosterCandidateResponse.slug` (`instructor/delivery/dto.go:170`), both from `userpicker.UserPickerSelectSQL` | `UserPickerCandidate` (`user-picker.ts:4-10`), aliased as `CourseInstructorCandidate` (`course.ts:296`) | missing |
| `rosterResponse.slug` (`dto.go:152`), list and bulk-add | `InstructorRosterMember` (`instructor.ts:160-166`) | missing |
| `applicationMeResponse.slug` (`dto.go:199`), embedded in `applicationResponse` (admin list/detail, approve/reject) and reused by profile list/detail/me | `MyInstructorApplication` (`instructor.ts:98-115`), `InstructorUserIdentity` (`instructor.ts:149-158`, base of `InstructorApplication` and `InstructorProfile`) | missing |

Facts that shape the design:

- `slug` is plain `string`, serialised as `""` while a legacy user is not backfilled (`COALESCE(u.slug,'')`; `MeResponse` maps a NULL row to `""` in Go). Migration `000044` (NOT NULL) exists but its applied state in any environment is unknown, so `""` must be representable.
- `PATCH /me` and `GET /me` return the same `toMeResponse` body (`handler.go:223-239,315`), so one `MeResponse` type serves both and `patchMeService` is already typed correctly.
- `patchMeService`, `UpdateMePayload`, `updateMeSchema` and `UpdateMeFormValues` have **no UI consumer** (`patchMeService` is only re-exported at `auth-browser.ts:20`; the schema and form-values type are imported nowhere). Adding fields to them is contract synchronisation, not feature work.
- The only readers of `me.avatar_url` are `user-menu.tsx:26-29` and `sidebar-auth-footer.tsx:51-53`, both guarded by a truthiness check, so making it optional cannot break them.
- `mergeInstructorApplicationDetail` (`src/lib/instructor-application/helpers.ts:19-45`) spreads `...listRow, ...detail`, so `slug` flows through with no code change.
- The Playwright fixture `e2e/fixtures/server.mjs` is a plain `.mjs` and is excluded from `tsconfig.json` (`include` lists `**/*.ts`/`**/*.tsx`), so the type-checker will not flag its drift; it must be updated by hand.

## Goals / Non-Goals

**Goals:**

- Make every frontend contract that mirrors a backend user-identity or current-user response carry the fields the backend returns, with the same required/optional shape as the backend (`slug` required `string`; `owner_slug`, `avatar_url`, `avatar_object_key` optional).
- Declare each identity field once: collapse `CourseCollaborator` onto the shared picker identity type instead of adding `slug` twice.
- Keep every consumer, fixture, test builder and document consistent with the types so the frontend gates (`npm run check-all`) stay green and the docs describe the final state.

**Non-Goals:**

- Any UI that shows, links or edits a user slug (account settings, owner link on course lists, instructor public page): deferred, needs a backend get-by-slug and a public route.
- Any change to `useSlugConflictFlow`, `SlugInput`, `extractRecommendedSlug` or error-code handling: user slug has no 409 path, so the create-only flow does not apply.
- Search by slug in pickers and roster (backend searches `display_name`/`email` only).
- Home catalog types and wiring (Task B); taxonomy fields in Home APIs.
- Refactoring the pre-existing overlap between `MyInstructorApplication` and `InstructorApplication` (different semantics, see audit).
- Backend, swagger or database changes. Backend observations are reported, not edited.

## Codebase-wide capability audit (Reuse and Deduplication)

Four read-only investigations ran in parallel over `src/`, `e2e/`, `scripts/`, `docs/`, the OpenSpec tree and the backend (types and consumers; documentation; tests/fixtures/quality gates; backend contract). The capability under change is "a user identity row as the frontend represents it, plus the current-user profile and its update body".

### Merged (same business meaning, more than one declaration)

| ID | Capability | Existing implementations | Verdict | Owner / shared module |
|---|---|---|---|---|
| CAP-1 | "A user shown in a picker or collaborator list": `user_id`, `display_name`, `email`, `avatar_file_id?`, `avatar_url?` | `UserPickerCandidate` (`src/types/user-picker.ts:4`) and `CourseCollaborator` (`src/types/course.ts:78`) declare the identical five fields; the backend also produces both from one projection (`userpicker.UserPickerSelectSQL`) | **MERGE**: `CourseCollaborator = UserPickerCandidate & { role: CourseCollaboratorRole }` | `src/types/user-picker.ts` (owner of the identity shape); `src/types/course.ts` already imports it (line 2) and aliases it as `CourseInstructorCandidate` (line 296), so no new import edge |
| CAP-2 | Slug format and length rule for client validation | `optionalSlugField` / `requiredSlugField` (`src/schema/shared/slug.ts`), reused by `courseCreateSchema`, `courseBasicInfoSchema` and the taxonomy schemas | **REUSE**: `updateMeSchema.slug = optionalSlugField.optional()`; no second regex | `src/schema/shared/slug.ts` (import via `@/schema/shared`, as course and taxonomy do) |
| CAP-3 | Slug regex and max length constants | `SLUG_PATTERN`, `SLUG_MAX_LENGTH` (`src/lib/utils/slug.ts`), verified identical to the backend `formatPattern` and `MaxUserSlugLen = 255` | **REUSE** (through CAP-2); nothing added | `src/lib/utils/slug.ts` |
| CAP-4 | The owner collaborator seed row in the fixture server | `e2e/fixtures/server.mjs` declares the identical one-row `collaborators` array twice: at module level (lines 178-185) and again in `resetState()` (lines 190-197) | **MERGE (in-file)**: one `seedCollaborators()` function returning a fresh array; the module-level `let collaborators = seedCollaborators();` and `resetState()` both call it, so `slug` is added once | `e2e/fixtures/server.mjs` |

### Examined and kept separate (different semantics, or not a capability this change implements)

| Item | Why it stays separate |
|---|---|
| `UpdateMePayload` (`auth-factory.ts:33`) vs `updateMeSchema` (`schema/me/me.ts`) | Both describe the same body, but this repository's convention is a payload type next to the API caller and a Zod schema under `src/schema/` for form validation (the same pairing as `CreateCoursePayload` / `courseCreateSchema` and the taxonomy payloads). The caller is isomorphic and is imported by server actions, so it must not import a Zod schema module. Both are updated in the same change and are tied by the spec scenarios and by `me.test.ts`. |
| `MyInstructorApplication` vs `InstructorApplication`/`InstructorUserIdentity` | They overlap on `user_id`, `display_name`, `email`, `avatar` and review fields, but they mirror two backend shapes with different optionality (`avatar?` vs `avatar`, no `full_name`/`is_*` on the former). The overlap pre-dates this change; folding them is a refactor with its own risk (admin screens, eligibility helpers) and would not be a contract sync. `slug: string` is added to each because each mirrors a distinct backend struct that emits it. |
| `InstructorRosterMember` vs `UserPickerCandidate` | Different wire shapes: roster uses `id`, `full_name`, `avatar`, `phone`; the picker uses `user_id`, `display_name`, `avatar_url`. Not mergeable without a mapping layer, which the backend contract does not justify. |
| `InstructorTicket`, `InstructorTicketMessage`, `InstructorRejectionRecord`, `MediaFile.display_name` | They carry a name or id but the backend does not emit a slug for them (verified in `ticketResponse`, `ticketMessageResponse`, `rejectionRecordResponse`, `UploadFileResponse`). Not part of the contract; left untouched. |
| `InstructorTaxonomyChip.slug`, `InstructorExpertiseTopic.slug`, `InstructorExpertiseSkill.slug` | Taxonomy slugs, not user slugs; already present and unchanged. |
| `Course.slug` | The course slug, already present; `owner_slug` is deliberately added only to `CourseListItem` because the backend puts it only there (`Course` has `owner_user_id` only). |
| `useSlugConflictFlow`, `SlugConflictConfirmDialog`, `extractRecommendedSlug` | Create-only 409/3007 flow used by course and taxonomy create; `PATCH /me` never returns 409. Not reused, not changed. |
| `isSlugAdjusted(sent, saved)` (`src/lib/utils/slug.ts`) | Exists and is the right helper for the future change-slug UI; no consumer is added here. |
| `buildMeResponse` factory itself | Gets a field and loses the empty `avatar_url`; a test of the factory would only test the test helper, so none is added. |
| Home types (trending, popular, continue learning) | Task B; the Home components use mock data and have no types to sync. |

### Sibling-feature dependency check

No new import edge is created. `src/types/course.ts` already imports `src/types/user-picker.ts`; `src/schema/me/me.ts` gains an import of `@/schema/shared`, the same neutral shared module that `src/schema/course` and `src/schema/taxonomy` use; no feature imports another feature. `src/api/callers/auth/auth-factory.ts` imports nothing new. `npm run cycles` (madge) and `npm run dupl` (jscpd, 10 lines / 100 tokens) run as part of `npm run check-all`; the added lines are field declarations and short fixture rows well under the duplication threshold.

## Decisions

### 1. Backend parity decides required vs optional

`slug: string` is required wherever the backend emits it without `omitempty` (`MeResponse`, collaborator, picker candidate, roster member, application identity). `owner_slug?: string` is optional because the backend tags it `omitempty` and does not populate it on the instructor and learner lists. `avatar_url?` and `avatar_object_key?` are optional because they are nil pointers with `omitempty`. *Alternatives considered:* making every `slug` optional "to be safe" (rejected: it misstates the contract, hides a missing field in fixtures, and forces `?.`/`||` noise in the future UI), or modelling an empty slug as `string | null` (rejected: the backend never emits null).

### 2. `""` is a value, not an error

An empty `slug` means "not assigned yet" because migration `000044` and the backfill command may not have run. The type stays `string`; future consumers use `slug || fallback`. No normaliser, parser or default is added now (no consumer exists). *Alternative:* a `normalizeSlug` helper (rejected: no caller, would be dead code under `knip`).

### 3. `CourseCollaborator` is composed from `UserPickerCandidate`

`export type CourseCollaborator = UserPickerCandidate & { role: CourseCollaboratorRole };` This keeps the field set and optionality byte-for-byte equal to today (verified field by field), declares `slug` once, and mirrors the backend, which builds collaborators and candidates from the same row type. *Alternatives:* add `slug` to both declarations (rejected: keeps a duplicate and violates the Critical Deduplication Rule); extract a third `UserIdentity` base (rejected: a new abstraction with two users, one of which would be an alias).

### 4. `updateMeSchema.slug = optionalSlugField.optional()`

Blank is accepted and means "do not send", which matches the existing `avatar_file_id` handling (`.or(z.literal(""))`). The backend rejects an explicit empty slug, so a future form must drop a blank before building the payload; the schema stays permissive and the payload builder owns omission (the same split as `toCreateCoursePayload`). *Alternative:* `requiredSlugField` (rejected: a form that only changes the avatar must stay valid). Messages reuse `validation.slugInvalid` / `validation.slugMax`; the namespace those keys are resolved under is a concern of the future me-form and is recorded as a follow-up, not decided here.

### 5. No change to `mergeInstructorApplicationDetail`

The spread already carries `slug` from the detail over the list row. Both responses are produced by the same backend projection, so an empty detail slug can only mean the user has none. A test pins this behaviour (new `helpers.test.ts`) instead of adding trimming code that no input needs.

### 6. Fixtures mirror the backend, including omission

`buildMeResponse` and `userMeResponse()` gain `slug` and stop emitting `avatar_url: ""` (the backend omits the key; no test or e2e spec reads `avatar_url`, verified by grep). The e2e fixture gets `slug` on the three `USERS`, on `CANDIDATE_USER` (spread into the bulk-add `added[]` row) and on the owner collaborator seed. That seed is currently written out twice (module level and `resetState()`); because the same lines must be edited, the two copies are merged into one `seedCollaborators()` function used by both (CAP-4, inventory E4), so the duplicate disappears instead of receiving a second `slug` line.

### 7. Documentation: replace, in English, with refreshed audit stamps

Every touched document keeps its English language and gets a new first sentence in its audit header with the previous stamp kept as `Prior:` (the convention of the course and taxonomy changes). Statements are replaced, not appended. `README.md` has no audit header; its `MeResponse` block is also missing `roles` (a pre-existing staleness from `sync-me-roles-contract`), so the whole block is replaced to describe the final state. The GitNexus counts in `AGENTS.md` and `CLAUDE.md` are regenerated by `npx gitnexus analyze`, never hand-edited.

### 8. Backend observations are reported, not worked around

The frontend declares both avatar fields optional, which is correct whether or not the backend later populates them. The BE-side findings (never populated; swagger `MeProfile` types `user_id` as integer and omits both avatar fields; `be-mycourse/docs/api-overview.md` says nested `avatar`) are listed in the final report for the backend owners. They are not documented as FE behaviour except where a FE doc already states the contract.

## Code change specification (per file)

Full "after" code, line anchors and call sites are in `code-change-inventory.md`; line numbers are `HEAD 2a807df` and must be re-located by symbol at implementation time.

| # | File | Symbol | Change |
|---|---|---|---|
| T1 | `src/types/auth/auth.ts` | `MeResponse` | ADD `slug: string`; MODIFY `avatar_url: string` → `avatar_url?: string`; ADD `avatar_object_key?: string` |
| T2 | `src/api/callers/auth/auth-factory.ts` | `UpdateMePayload` | ADD `slug?: string` |
| T3 | `src/schema/me/me.ts` | `updateMeSchema` | ADD `slug: optionalSlugField.optional()` and the `@/schema/shared` import; update the doc comment |
| T4 | `src/types/user-picker.ts` | `UserPickerCandidate` | ADD `slug: string` |
| T5 | `src/types/course.ts` | `CourseCollaborator` | MODIFY to `UserPickerCandidate & { role: CourseCollaboratorRole }` (DELETE the five duplicated field lines) |
| T6 | `src/types/course.ts` | `CourseListItem` | ADD `owner_slug?: string` after `owner_display_name?` |
| T7 | `src/types/instructor.ts` | `MyInstructorApplication` | ADD `slug: string` |
| T8 | `src/types/instructor.ts` | `InstructorUserIdentity` | ADD `slug: string` (inherited by `InstructorApplication`, `InstructorProfile`) |
| T9 | `src/types/instructor.ts` | `InstructorRosterMember` | ADD `slug: string` (also types `AddRosterBulkResult.added`) |
| F1 | `src/test-support/fixtures/auth.ts` | `buildMeResponse` | ADD `slug: "test-learner"`; DELETE `avatar_url: ""` |
| F2 | `src/hooks/course/use-course-collaborator-actions.test.tsx` | `buildCollaborator` | ADD `slug: \`user-${userId}\`` |
| F3 | `src/components/shared/user-multi-select-picker-dialog.test.tsx` | `rows` | ADD `slug` to both rows |
| F4 | `src/lib/instructor-application/get-page-state.test.ts` | `buildApplication` | ADD `slug: "learner"` |
| E1 | `e2e/fixtures/server.mjs` | `USERS` (three entries) | ADD `slug` to each entry |
| E2 | `e2e/fixtures/server.mjs` | `CANDIDATE_USER` | ADD `slug` |
| E3 | `e2e/fixtures/server.mjs` | `userMeResponse` | ADD `slug: user.slug`; DELETE `avatar_url: ""` |
| E4 | `e2e/fixtures/server.mjs` | `collaborators` seed (module level and `resetState`) | ADD `seedCollaborators()` with `slug`; DELETE the two inline copies |
| N1 | `src/schema/me/me.test.ts` | new | ADD schema contract tests |
| N2 | `src/lib/instructor-application/helpers.test.ts` | new | ADD `mergeInstructorApplicationDetail` slug tests |

## Documentation change specification (per document)

Verbatim CURRENT text and REPLACEMENT text for every item are in `docs-update-inventory.md`. All documents are English (verified); each keeps English.

| Document | Items |
|---|---|
| `README.md` | DOC-1: replace the `MeResponse` interface block (adds `slug`, optional `avatar_url`, `avatar_object_key`, and the missing `roles`) |
| `docs/api-overview.md` | DOC-2 audit stamp; DOC-3 `GET /me` row; DOC-4 `PATCH /me` row |
| `docs/api-using.md` | DOC-5 audit stamp; DOC-6 collaborators row; DOC-7 candidates row; DOC-8 `CourseListItem` paragraph; DOC-9 Me API PATCH sentence |
| `docs/modules.md` | DOC-10 audit stamp; DOC-11 Course responsibilities sentence; DOC-12 Authorization note; DOC-13 Me schema line |
| `docs/folder-structure.md` | DOC-14 audit stamp; DOC-15 `me/me.ts` tree line; DOC-16 `fixtures/auth.ts` tree line (the tree lists no individual colocated tests, so the new tests add no line here) |
| `docs/reusable-assets.md` | DOC-17 audit stamp; DOC-18 `MeResponse` asset; DOC-19 user picker asset; DOC-20 collaborators asset |
| `docs/testing.md` | DOC-21 stamp; DOC-22 fixtures/helpers line; DOC-23 fixture backend sentence; DOC-28 two new behavior-matrix rows |
| `docs/instructor-admin.md` | DOC-24 audit stamp; DOC-25 identity rendering note |
| `docs/instructor-application.md` | DOC-26 audit stamp; DOC-27 API/domain types sentence |
| `AGENTS.md`, `CLAUDE.md` | Regenerated GitNexus counts only, by `npx gitnexus analyze`; no rule added, so no `<!-- begin:... -->` boundary is needed |

Scanned and unchanged (reasons in the inventory): `docs/architecture.md`, `flow.md`, `logic-flow.md`, `patterns.md`, `screens.md`, `components.md`, `dependencies.md`, `deploy.md`, `media-collection.md`, `pages.md`, `router.md`, `quality.md`, `seo-ranking-setup.md`, `taxonomy-admin.md`, `security-hardening-notes.md`, `delivery.md`, `docs/delivery/*`, `course-collaboration-handoff-2026-06-04.md`, `IMPLEMENTATION_PLAN_EXECUTION.md`, `openspec/specs/**`, `openspec/config.yaml`, completed OpenSpec changes, `.context/session-*.md` of other sessions, `.ai/**`, `.claude/**`.

## AGENTS.md Workflow Mapping

| AGENTS.md section | How this change satisfies it | tasks.md group |
|---|---|---|
| Scope and Applicability | Implementation of types, schema, tests, fixtures and project docs is an in-scope task; classification is recorded first | 1 |
| Global Memory Bank Rules (pre-response load) | `memory-bank-cli memory_bank_read_all --project fe-mycourse` before any work, CLI → MCP → file fallback, reload after compaction | 2 |
| Session ID Bootstrap and subagent propagation | One external `AI_SESSION_ID_FILE`; the same ID and the exact `.context/session-<SESSION_ID>.md` path go to every subagent | 3 |
| Critical First Action; Dual Session Context Lifecycle | Read the whole `.context/`; reuse or create exactly one `<project>/.context/session-<SESSION_ID>.md` | 4 |
| Initial Phase (docs, `.ai/skills`, GitNexus, Git changes, subagents ≤ 4) | Read listed docs and the three `.ai/skills`; GitNexus query/context; `git status`/`git diff`; subagents only when they save time | 5 |
| CLAUDE.md GitNexus gates (impact before edit, detect_changes before commit) | `gitnexus_impact` for every edited symbol; grep fallback for type-only symbols | 6 |
| Critical Reuse Rule and Critical Deduplication Rule | Re-run the audit on HEAD, apply CAP-1…CAP-4, keep the separate table intact | 7 |
| Middle Phase: Implementation | Types, schema, fixtures, tests, in dependency order | 8 |
| Final Phase: Sync, Quality Gates, Exit Code Rule | Force-sync GitNexus, `npm run check-all`, fix any non-zero exit, plus e2e | 9, 10 |
| Post-Implementation Code Review | Checklist over every touched file | 11 |
| Documentation and Context Sync; Full Documentation Replacement Rule; Documentation Language Consistency Rule | Replace outdated text in English; refresh stamps; scan everything | 12 |
| Sensitive Test Accounts and Environment Secrets Policy | Inspect only the committable Git surface; fixtures use placeholder values | 13 |
| Mandatory End-of-Task Learning Summary | Update only the current project session file | 14 |
| Required end-of-turn persistence; verbatim final response | `memory_bank_update` for `activeContext.md`, `progress.md`, `lastResponse.md` | 15 |
| Final Response Requirement | Report implemented work, files, reuse, merged duplicates, docs, gates, failures, risks | 16 |
| Commit rules; Branch rename rules | Only if the user asks; one-line `<type>: <title>`, 15-72 characters, no scope or body | 17 |
| Tooling rule protection | No lint, knip, jscpd, biome, jest or tsconfig rule is changed or suppressed | 10, 11 |
| Swagger and API Documentation Rule | No Swagger YAML in this repository changes, so `generate-apidog-postman.rb` is not applicable | 12 |

## Risks / Trade-offs

- **Required `slug` breaks hand-built literals** → Mitigation: the exact set is known (`buildMeResponse`, `buildCollaborator`, picker `rows`, `buildApplication`, plus the `.mjs` fixture that the compiler cannot see). `npx tsc --noEmit` and `next build` (inside `check-all`) fail on any miss in TypeScript; the `.mjs` fixture is covered by the e2e run and by review.
- **Backend not merged** (`feat/add-user-slug-management` is a local branch; contract verified by reading code, not by calling a running server) → Mitigation: the types are additive; the final report states that contract checks were by code reading and that e2e ran against the fixture, not a real backend; re-verify the DTOs if the branch changes before merge.
- **`""` slug reaches a future UI** → Mitigation: Decision 2 and the spec scenario make it a documented value; the follow-up UI must use a fallback.
- **`/me` avatar fields are never populated by the backend today** (`buildMeProfile` sets only `AvatarFileID`, so the header avatar always shows its fallback) → Mitigation: out of scope and unchanged in behaviour; reported to the backend owners; the optional typing is correct either way.
- **`CourseCollaborator` alias changes how the type prints in error messages** → Mitigation: structure is identical; `npm run build` proves it; no `Pick`/`Omit` of `CourseCollaborator` exists (grep).
- **Docs drift again** → Mitigation: every item is listed with the exact current text; task 12 greps the whole repository for `avatar_url: string`, `{ avatar_file_id?: uuid }` and `owner_display_name` before finishing.
- **Untestable `PATCH /me` through the UI** (no caller) → Accepted: the contract is pinned by `me.test.ts` and the type; there is no behaviour to exercise end-to-end.

## Migration Plan

Single frontend change, no data or backend migration. Order: types (T1…T9) → schema (T3) → fixtures and test builders (F1…F4, E1…E5) → new tests (N1, N2) → quality gates → documentation → GitNexus re-index. Rollback is a plain revert of the change; nothing persists at runtime.

## Open Questions

Confirmed by the user on 2026-10-15 (all four match the recommendations written above, so no artifact changes): (1) `slug` is added to `updateMeSchema` in this change (with `me.test.ts`); (2) `CourseCollaborator` is composed as `UserPickerCandidate & { role }`; (3) the non-slug `MyInstructorApplication` drift (`is_disabled`, `email_confirmed`, `banned_until`, `is_banned`) is NOT merged and is recorded as a separate follow-up; (4) `avatar_url: ""` is removed from `buildMeResponse` and the e2e `userMeResponse`.

None remain that would change the specs, the approach or the task breakdown. Deferred, answered by later changes: the i18n namespace under which the future account-settings form resolves `validation.slug*`; whether the future UI shows the slug on the admin course list; whether the backend adds get-by-slug and slug search.
