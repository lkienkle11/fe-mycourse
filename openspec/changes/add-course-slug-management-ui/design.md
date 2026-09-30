## Context

See `proposal.md` for motivation. Companion documents (part of this design; read them before implementing):

- `code-change-inventory.md` — every file, symbol, signature, call site, and reused resource, plus the test plan.
- `docs-update-inventory.md` — every documentation file, section, current text, and replacement text, plus the scanned files that need no change.

Findings from the three research methods required by `AGENTS.md` (GitNexus, existing docs, source). GitNexus is 14 commits behind HEAD and reports zero callers, so caller lists were confirmed with grep.

- Create dialog (`src/screen/instructor/courses/page.tsx:44,95-116,238-259`) shows a read-only slug from `slugifyName(title)`, sends `{ title }`, and disables Create when the derived slug is empty.
- `slug` lives on `Course` (`src/types/course.ts:25`), not on `CourseVersion`. `useCourseBasicInfoState` (`src/hooks/course/use-course-editor-state.ts:70-95`) resyncs only when the draft version id or `row_version` changes, so a slug change needs its own sync.
- Save flow (`use-course-editor-state.ts:365-393`): `courseBasicInfoSchema.safeParse` → `toUpdateCourseBasicInfoPayload` → `updateCourseBasicInfoService` → `mutateDetail(detail, { revalidate: false })`. The tab is gated by `editable` (a draft exists) because `expected_row_version` is required and only known from `draft_version` (backend would create a draft itself; the frontend cannot know the row version without `/draft/prepare`).
- `validateCourseSubmitReadiness` (`src/lib/utils/course.ts:392-404`) also parses `createCourseBasicInfoState(draftVersion)` with `courseBasicInfoSchema`; a required slug would break submit readiness unless the factory receives `course.slug`.
- `extractApiError` (`src/lib/utils/api-error.ts:33`) returns only `{ code, message }`; nothing reads `response.data.data`. `ApiErrorCode` stops at `3006`.
- Reusable as-is: `ConfirmActionDialog` (AlertDialog; stacks over `Dialog`), `RequiredLabel` (`required={false}`), `FieldError`, `Input`, `toastApiError`, `toastValidationError`, `resolveValidationMessage`, `isApiHttpError`, `createCourseService`, `updateCourseBasicInfoService`, MSW test server (`@/test-support/msw/server`), the e2e fixture helpers.
- `generateSlug`/`slugifyName` are used by taxonomy (`sortable-tree-editor.tsx`, `taxonomy/form-helpers.ts`); their behaviour must not change.
- Quality constraints: ESLint `max-lines` 700 (non-blank, non-comment) with `noInlineConfig`; `src/screen/**` only `page.tsx`/`*-page.tsx`; `src/constants/**` no functions/types; jscpd (10 lines / 100 tokens); knip flags unused files under `src/components/**`; jest `.test.tsx` for components and hooks; Biome organises imports/exports. The repo has no Husky or Makefile; the gate is `npm run check-all`.

## Goals / Non-Goals

**Goals:**
- One slug input component, one sanitizer, one pattern, one schema rule set shared by create and update.
- Reuse existing dialog, label, error, toast, payload-builder, and caller code; add only what is missing (see the reuse ledger in `code-change-inventory.md`).
- Keep `extractApiError`, `toastApiError`, `generateSlug`, `slugifyName`, and both course callers behaviour-compatible.
- Follow the `AGENTS.md` implementation workflow end to end (see "AGENTS.md Workflow Mapping").

**Non-Goals:**
- Backend changes, new endpoints, slug-availability lookups while typing.
- Client-side transliteration or a title-derived slug/preview.
- Changing the draft gate, `/draft/prepare` timing, or taxonomy slug behaviour.
- Removing the unused `course.editor.basicInfo.titleReadOnlyHint` message (out of scope; recorded in the session learning summary).
- Modifying any lint/format/test/build/CI configuration (Tooling rule protection).

## Decisions

### 1. Sanitizer, pattern, and max length live in `src/lib/utils/slug.ts`, separate from `generateSlug`
`sanitizeSlugInput` replaces whitespace with `-` and drops every character outside `[a-z0-9-]` (uppercase included, per the product spec "no other character gets in"), then caps at 255. `generateSlug` is not reused: it lowercases, strips accents, keeps `\p{L}` letters, collapses `-+`, and trims edge dashes, which contradicts the required filtering and would fight typing `abc-`; changing it would also alter taxonomy previews. Whitespace-only input cannot occur in the field (spaces become `-`), so a whitespace-only value never reaches the payload; `toCreateCoursePayload` still trims defensively.
*Alternative*: extend `generateSlug` with an options flag — rejected (branching in a shared function for no shared behaviour).

### 2. One shared `SlugInput` component
Wraps `Input`, sanitizes in `onChange` (covers typing and paste), exposes `value`/`onValueChange`. Used by the create dialog and (through `Controller`) the basic-info tab. Exported from `src/components/shared/index.ts`.

### 3. Schema: one format helper, two rules
`slugFormatField(allowEmpty)` (max + pattern, messages `validation.slugMax`/`validation.slugInvalid`). `courseCreateSchema.slug = slugFormatField(true)`; `courseBasicInfoSchema.slug = z.string().min(1, slugRequired).pipe(slugFormatField(false))`. `createCourseBasicInfoState(version, courseSlug)` seeds the form; `validateCourseSubmitReadiness` passes `detail.course.slug`. A `z.union` for the optional case was rejected because its first issue is a generic `invalid_union` message that cannot be mapped to a `course.validation` key.

### 4. Payload builders extend the existing builder module
`toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug)` adds `slug` only when changed (same conditional style as `preview_video_file_id`). New `toCreateCoursePayload(title, slug)` sits beside it. Payload types widen (`slug?`), so callers need no signature change.

### 5. Recommended slug is read by extending the existing envelope reader
Extract the two-branch "response body of an ApiHttpError or legacy error" read from `extractApiError` into a private `readErrorResponseBody`, used by `extractApiError` (result unchanged) and the new `extractRecommendedSlug` (returns `data.recommended_slug` only for code `3007`). No second reader is created. `3007` is added to `ApiErrorCode` and both message maps; a `3007` without a usable recommendation falls through to `toastApiError`.

### 6. Create flow in a dedicated hook; confirm uses the existing dialog
`useCourseCreateFlow({ onCreated })` owns `title`, `slug`, `isSubmitting`, `suggestedSlug` and exposes `submit`, `acceptSuggestion`, `dismissSuggestion`, `reset`. `onCreated` keeps router navigation and list `mutate` in the page. Accept resubmits through the same `submit`, so a repeated `3007` re-opens the confirm with the new recommendation without special-casing. `page.tsx` renders `ConfirmActionDialog stacked` **inside** the create `DialogContent`. Two defects were found while testing: a sibling dialog's focus dismisses the create dialog (Radix treats it as outside; found by the e2e decline scenario), and the default `AlertDialog` comes from a separate Radix package copy (`node_modules/@radix-ui/react-alert-dialog/node_modules/...` vs the copy under `radix-ui`) whose focus trap fights the parent `Dialog` trap (`RangeError: Maximum call stack size exceeded`, confirm never focused; found by manual Chrome DevTools testing against the real backend). `ConfirmActionDialog` therefore gained an optional `stacked` prop that renders the same content on the `Dialog` primitive family (`role="alertdialog"`); `npm dedupe` was rejected (changes ~340 lockfile packages).
*Alternative*: inline state in `page.tsx` — rejected (harder to test, page grows).

### 7. Update: slug synced from `course.slug`, reconciled from the response
`useCourseBasicInfoState(activeVersion, courseSlug)` adds a render-time sync (the idiom already used for version id and row version). `handleSaveBasicInfo` sends the payload built with the persisted slug, then sets `basicInfo.slug` and `expected_row_version` from the response, updates the cache with `mutateDetail(detail, { revalidate: false })`, and shows `toast.info(slugAdjusted)` when a sent slug differs from `detail.course.slug`, otherwise the existing success toast. If `use-course-editor-state.ts` would exceed `max-lines`, `useCourseBasicInfoState` is moved (not copied) to `use-course-basic-info-state.ts`.

### 8. Static placeholder and hint; no derived preview
Create input reuses `createDialog.slugPlaceholder` and adds `slugHint`; the backend's generator (transliteration, random-suffix retry) is authoritative and a client preview could mislead.

### 9. Tests are co-located and use existing infrastructure
Unit tests use Jest/Testing Library and the MSW server already used by `use-course-collaborator-actions.test.tsx`; e2e extends the fixture server's existing helpers. Test data uses placeholder values only (no credentials, no environment-derived values).

### 10. GitNexus, documentation, and session state
GitNexus is refreshed before impact analysis and force-synced at the end. Documentation changes follow `docs-update-inventory.md` (English, replace-not-append). Session state goes only to the exact `.context/session-<SESSION_ID>.md`.

## AGENTS.md Workflow Mapping

| AGENTS.md requirement | Where it is executed in `tasks.md` |
|---|---|
| Task classification (in-scope implementation, frontend only, no backend edits) | 1.1 |
| Memory Bank pre-response load (CLI → MCP → direct file), reload after compaction | 1.2 |
| Session ID bootstrap outside the project; exact session context file; subagent propagation | 1.3, 1.4 |
| Read full `.context` and all project docs, `.ai/skills`, GitNexus, git changes; ≤4 subagents with the cost/model restriction | 1.5, 1.6 |
| Impact analysis before editing symbols; warn on HIGH/CRITICAL | 1.7 |
| Critical Reuse and Deduplication rules (re-grep before adding, merge duplicates, reject and redo on duplication) | 1.8 and the "Reuse check" line of every implementation task |
| Middle phase implementation in existing structure | groups 2–7 |
| GitNexus force-sync, `npm run check-all`, exit code rule | group 9 |
| Post-implementation review checklist | 10.3 |
| Documentation and context sync (full replacement, language consistency) | group 8, 10.5 |
| Swagger/Apidog rule | 10.6 (not triggered: no Swagger YAML in the frontend) |
| Sensitive data policy (Git-surface scoped, placeholders only) | 10.4 |
| Tooling rule protection (no config changes; stash-and-ask protocol if compliance is impossible) | 9.3 |
| Learning summary in the session context | 10.7 |
| Memory Bank end-of-turn persistence and verbatim `lastResponse.md` | 10.8 |
| Final response requirements | 10.9 |
| Commit rules (only if the user asks to commit) | 10.10 |

## Risks / Trade-offs

- [`extractApiError` has 24 consumers] → the refactor is behaviour-preserving; existing `api-error.test.ts` cases stay and new regression cases for both body shapes are added first (task 3.5).
- [`use-course-editor-state.ts` is at 700 raw lines] → measure with `npx eslint` after the edit; the move-not-copy fallback is specified in decision 7.
- [Required slug breaks submit readiness] → `createCourseBasicInfoState` receives `detail.course.slug` (task 3.3) and a unit test asserts a complete draft still passes.
- [`.pipe` short-circuit depends on the installed zod major] → verify at implementation time; fallback is `superRefine` with the same messages.
- [Caret jumps while filtering on `onChange`] → the sanitizer is idempotent and only removes/replaces characters; verify paste and Vietnamese IME (Telex) manually.
- [Placeholder mistaken for the stored slug] → static example plus hint that blank means auto-generate.
- [e2e is outside `check-all`] → run `npm run test:e2e` separately; CI already runs it.
- [GitNexus index stale, zero callers] → refresh first; grep-confirmed callers are in `code-change-inventory.md`.
- [Docs drift] → `docs-update-inventory.md` is re-verified against the final code in task 8.9.

## Migration Plan

Frontend only; no data migration, no flag; the backend already accepts and returns the fields. Rollback is a revert of the change.

## Open Questions

None that change specs, approach, or tasks. Deferred: whether to remove the unused `titleReadOnlyHint` message in a separate cleanup.
