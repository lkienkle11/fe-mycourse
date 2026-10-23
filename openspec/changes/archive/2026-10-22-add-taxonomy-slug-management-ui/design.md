## Context

See `proposal.md` for motivation. Companion documents (part of this design; read them before implementing):

- `code-change-inventory.md` — exact "after" code, call sites, reused resources, and tests for every code change (sections A–J).
- `docs-update-inventory.md` — every documentation file, section, CURRENT verbatim text, and REPLACEMENT text (English, replace-not-append), the scan tables, and the scanned files that need no change.

This design file additionally lists, inline and per file, everything that changes (section "Code change specification") and every documentation edit (section "Documentation change specification"), so it can be reviewed without opening the companions.

Findings from the three research methods required by `AGENTS.md` (GitNexus → existing docs → source). GitNexus is 2 commits behind HEAD (`35a818a` vs `c5153b1`; merge + docs commits only, no source change) and returns `impactedCount: 0` / `risk: UNKNOWN` for every symbol because JSX and hook-call edges are not indexed (a graph gap, not proof of no callers); `gitnexus_context` plus `grep` over `src/`, `e2e/`, `scripts/` supply the caller lists recorded in the inventory, and task 6.2 re-runs impact after a fresh `npx gitnexus analyze`.

**Backend contract (verified against `be-mycourse/openspec/changes/unify-taxonomy-slug-management`, `docs/api_swagger.yaml`, `docs/curl_api.md`, and `internal/taxonomy/delivery/handler_helpers.go:134-138`):**

| Operation | Behaviour the FE must respect |
|---|---|
| `POST /taxonomy/{levels,topics,skills,tags}` | `slug` optional; blank/missing → BE generates it; a taken manual slug → `409`, code `3007`, `data.recommended_slug`; format `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$`, max 255 → else `400` |
| `PATCH …/:id` | `slug` independent and omittable (omitted keeps the stored slug even when `name` changes); `null`/`""`/whitespace → `400`; same value → no-op; a colliding value is **silently auto-resolved** with a suffix (no `409`); the response carries the final entity incl. the tree |
| tree nodes (`child_topics`, `children`) | per-node `slug` optional; new node (id not in the stored tree) omitted → generated; existing node omitted → preserved by `id`; existing node `null`/`""` → `400` naming the node; in-tree collisions auto-resolved (no `409`); node `id` must be a UUID; `child_topics`/`children` omitted on PATCH → tree untouched |
| update still requires | `expected_row_version` (already handled) |

Two statements in the original request summary were corrected by this verification: update conflicts and tree-node conflicts are **not** `409` — only create has the recommended-slug confirmation.

**Current FE state (verified):**

- One generic taxonomy implementation serves levels/topics/skills/tags (+ outcomes, which has no slug): `TaxonomyListPage` → `TaxonomyFormDialog` (react-hook-form + `zodResolver` mixed with `useState` for `tree`, translations, locale) → `SortableTreeEditor` (a `components/shared` file whose only consumer is taxonomy). The 10 admin/sysadmin route files are one-liners.
- Slug is a read-only preview: `taxonomy-form-dialog.tsx:280-283,448-461` shows `slugifyName(name)`; `sortable-tree-editor.tsx:95-105` shows `slugifyName(node.name)`; `toTaxonomyTreeWritePayload` (`resource.ts:64-76`) strips `slug`; no payload type has `slug`; no taxonomy 409 handling exists (3007 falls to `toastApiError`). After the BE change the preview is wrong (a rename no longer changes the stored slug) and `slugifyName` keeps non-ASCII letters whereas the BE forces ASCII.
- Reusable, already merged (PR #316): `SlugInput`, `sanitizeSlugInput` / `SLUG_PATTERN` / `SLUG_MAX_LENGTH`, `extractRecommendedSlug`, `ApiErrorCode.SlugAlreadyExists` + `errors.codes.3007`, `ConfirmActionDialog stacked`, `useCourseCreateFlow`, `toCreateCoursePayload` / `toUpdateCourseBasicInfoPayload`, the e2e fixture slug helpers.
- `persistTaxonomyForm` returns `Promise<void>` although the service callers return the saved entity; the dialog closes on success and reopens from a fresh `view=edit` fetch.
- Quality constraints: ESLint `max-lines` 700 (non-blank, non-comment) with `noInlineConfig`; `src/types/**` type-only; `src/constants/**` no functions; `src/screen/**` only `page.tsx`/`*-page.tsx`; Biome `noUnusedImports`/`noUnusedVariables`; knip flags unused **files** under `src/components/**` (unused exports are excluded); madge forbids cycles (the taxonomy barrel must not re-export `form-submit`); jscpd 10 lines / 100 tokens scans `src/**` including tests and messages (last report: 0 clones, so any new clone is a regression); the gate is `npm run check-all`; e2e (`npm run test:e2e`) is separate.
- Project skills (`.ai/skills/`, read in task 5.2): `logic-n-1-optimize` (one batch request per multi-item user action; never loop per item; loading/atomic-failure/validation/testing requirements), `nextjs-optimization`, `nextjs-seo-optimization` (images/fonts/metadata/sitemap; no slug route exists). This change sends exactly one create or update request per user action (the whole tree travels in one PATCH), validates every node locally with no per-node or per-keystroke API call, and touches no image/font/metadata/SEO code.

## Goals / Non-Goals

**Goals:**
- One slug rule set, one optional-field payload rule, one conflict state machine, one confirm dialog, one labelled field block, one tree-traversal primitive, one validation-message resolver — shared by every feature that implements the same capability; zero duplicated logic (Critical Reuse and Deduplication rules).
- Editable root and per-node slugs for levels, topics, skills, tags on both admin and sysadmin screens, matching the BE contract above, without making the tree form noisy.
- Keep the behaviour, public return shapes, DOM ids, and existing tests of every migrated feature unchanged.
- No new dependency between sibling features; each shared module lives in a neutral directory with capability-based ownership and naming.
- Follow the `AGENTS.md` implementation workflow end to end (see "AGENTS.md Workflow Mapping").

**Non-Goals:**
- Backend changes, new endpoints, slug-availability lookups while typing, client-side transliteration or any name-derived slug/preview.
- A 409/recommendation flow for update or tree-node conflicts (the BE does not return one).
- Instructor slug (deferred on the BE), outcomes slug (none), dagre dialog slug display, drag across parents, changing the dialog close-on-save behaviour.
- Merging code that only looks similar (see the "kept separate" table); the optional mutation-runner extraction and the hand-rolled course delete dialog (separate changes).
- Modifying any lint/format/test/build/CI configuration (Tooling rule protection).

## Codebase-wide capability audit (Reuse and Deduplication)

**Method.** Four read-only audits covered the whole of `src/`, `e2e/`, `scripts/` in the order GitNexus (`query` by concept, `context` per symbol) → documentation (`reusable-assets`, `patterns`, `components`, `folder-structure`, `modules`, `logic-flow`) → source (every hit read). Families: (E1) slug / identifier text and string-field validation, (E2) mutation submit state, API-error handling, conflict/confirm flows, (E3) nested/tree data traversal and editing UI, (E4) payload building (omit-blank / omit-unchanged), baseline diff, labelled field blocks. Decision rule applied: merge only when the business meaning is the same; keep separate when semantics differ; never create an edge between sibling features; merged code lives in a neutral, capability-named module.

### Merged (same business meaning, ≥2 implementations or an implementation that taxonomy would otherwise copy)

| ID | Capability | Existing implementations (path:line) | Consumers after the change | Shared module (owner / name) |
|---|---|---|---|---|
| CAP-1 | Include an optional string/id in a write payload only when non-blank [and different from the persisted value] | `course.ts:89-91` (`preview_video_file_id`), `:92-95` (slug update), `:104-107` (slug create); `form-submit.ts:104,120` (`image_file_id`); `use-course-editor-state.ts:593` (`media_url`) | the same 6 sites + taxonomy root slug + per-node slug (`resource.ts`) | `src/lib/utils/payload.ts` — `omitWhenBlank`, `changedNonBlank`, `payloadField` |
| CAP-2 | Slug zod rule | private `slugFormatField` + inline fields, `schema/course/course.ts:16-25,32,37-40` | course schemas, taxonomy schemas, tree-node validation | `src/schema/shared/slug.ts` — `optionalSlugField`, `requiredSlugField` |
| CAP-3 | "The server adjusted the submitted slug" predicate | inline `use-course-editor-state.ts:398` | course editor, `getTaxonomySaveSlugNotice` | `src/lib/utils/slug.ts` — `isSlugAdjusted` |
| CAP-4 | Slug-conflict suggestion state machine (hold recommended value, accept resubmits, dismiss clears) | private in `hooks/course/use-course-create-flow.ts:27-77` — the only implementation | `useCourseCreateFlow` (thin wrapper), `TaxonomyFormDialog` | `src/hooks/slug/use-slug-conflict-flow.ts` — `useSlugConflictFlow` |
| CAP-5 | Stacked recommended-slug confirm | inline `screen/instructor/courses/page.tsx:251-268` | course create page, taxonomy dialog | `src/components/shared/slug-conflict-confirm-dialog.tsx` |
| CAP-6 | Labelled form control block `div.space-y-2 > RequiredLabel + control + hint + FieldError` | `course-editor-basic-tab.tsx:120-216` (title, slug, short description), `courses/page.tsx:207-230`, `taxonomy-form-dialog.tsx:394-461` | those 8 blocks + the new slug field | `src/components/shared/form-field.tsx` (`FormField`) and `slug-field.tsx` (`SlugField` = `FormField` + `SlugInput`) |
| CAP-7 | Inline field-error `<p>` | `AuthFieldError` `auth-form-fields.tsx:39-42` is byte-identical to `shared/field-error.tsx:11-14` | auth fields use `FieldError` | existing `src/components/shared/field-error.tsx` |
| CAP-8 | Validation-message resolver | `resolveAuthValidationMessage` `auth-form-fields.tsx:14-26` duplicates `resolveValidationMessage` (+ 8 `as unknown as` casts at call sites) | auth fields, course tab, taxonomy dialog | existing `src/lib/utils/validation-message.ts`, made generic |
| CAP-9 | Nested-node traversal (count, max depth, find by id, find path, walk, update-at-id) | `resource.ts:89-99`, `form-helpers.ts:192-204`, `dashboard-page-header.ts:39-83`, `dagre-tree.ts:16-40`, three index-closure rebuilds in `sortable-tree-editor.tsx:85-144` | taxonomy utils, taxonomy tree editor, dashboard breadcrumbs, dagre | `src/lib/utils/tree.ts` — `walkTree`, `flattenTree`, `countTreeNodes`, `getTreeMaxDepth`, `findTreePath`, `findTreeNodeById`, `updateTreeNode` |
| CAP-10 | `RequiredLabel`-vs-`Label` branch | `image-file-field.tsx:44-48` | `RequiredLabel required={required}` | existing `RequiredLabel` |
| CAP-11 | Taxonomy name / short-description length literals | `schema/taxonomy/taxonomy.ts:9,29`, `taxonomy-form-dialog.tsx:401,429`, `sortable-tree-editor.tsx:83`; `indentPx = 12` vs `TAXONOMY_TREE_INDENT_PX` | schema + inputs + editor | `src/constants/taxonomy/limits.ts`; existing `TAXONOMY_TREE_INDENT_PX` |
| CAP-12 | Tree editor ownership | `components/shared/sortable-tree-editor.tsx` imports `@/lib/utils/taxonomy` and `@/types/taxonomy`, embeds translations/slug semantics, one consumer | merged into `TaxonomyTreeEditor` | `src/components/features/taxonomy/` |

### Examined and kept separate (different semantics, or not a capability this change implements)

| Item | Reason |
|---|---|
| `compactNameTranslations` / `compactOutcomeTranslations` / `compactEnNameTranslations` | strip a **locale entry**, not an optional field; different bodies and validation coupling |
| instructor `toSubmitPayload` (`form-state.ts:117-154`) | resubmission snapshot; `\|\| null` / `""` means **clear**, not omit |
| kind-union sub-lesson body, `buildSubLessonEstimatedDurationPayload` | `undefined` means "this kind has no such block"; only the `media_url` leaf is the omit-blank idiom (merged via CAP-1) |
| trim-only action bodies (review reason, rejection reason, ticket subject) | required values already validated by zod; no omission semantic |
| list/GET query builders and `search \|\| undefined` call sites | read-side query-string capability already centralised in `apiListQueryToRecord` / `buildQueryParams` |
| `toTaxonomyTreeWritePayload` | the single taxonomy tree projection; per-node slug mapping **extends** it and consumes CAP-1/CAP-9 |
| course outline helpers (`assignSequentialOrderIndex`, `merge*`, `useCourseOutlineReorder`), `validateCourseSubmitReadiness` | typed 3 levels, `stable_id`, `row_version`, leases; nodes use `lessons`/`sub_lessons`, not `children` |
| `filterPermissionNavTree`, `flattenRouteTreePaths`, menu renderers (`BrowseSidebarMenuLevel/SubLevel`, `HeaderBrowseNav`, `UserMenuDropdownLinks`, `DashboardSidebarTree`) | permission semantics / different data shape / three distinct UIs |
| dagre **layout** (`getLayoutedElements`, `DagreTreeRoot`, `buildTaxonomyDagreRoot`) | layout-domain output; only its internal `walkTree` adopts CAP-9 |
| `SortableList` | already the single drag-and-drop list primitive (also used by the course outline) |
| `createTaxonomyTreeNode`, description `toRows`, `createEmptyQuizOption` | different entities; all already share `newV7` |
| `slugifyKey`, `normalizeSearchText`, `normalizeDedupeKey`, `normalizeDomainKey`, `normalizeCompositeKey`, `queryCacheKey` | instructor remote-dataset keys / BE-mirrored ids / cache keys; not slugs |
| diacritic folding in `search-text.ts` (2 copies) | not used by this change; folding changes persisted ids (`custom:` / `hh:`) — separate decision |
| `generateSlug` / `slugifyName` | not merged — **deleted** (their only consumers are the removed read-only previews; re-grep in task 8.32) |
| `classifyApiError` / `StatusErrorPage` | primary-load classification; mutations toast (documented rule) |
| auth result-code branching, optimistic-lock (3005) policy, `finalizeBulkUserPickerSubmit`, `handleRemoveCollaborator` rethrow, optimistic outline reorder | different semantics; 3005 is a uniform toast with no refetch (adding refetch would be a new behaviour) |
| 22 busy-flag + try/catch + toast handlers (mutation runner) | structurally similar only; ~13 files; recorded as an optional separate change (`useToastedMutation`) |
| hand-rolled course delete `Dialog` (`courses/page.tsx:272-305`) vs `ConfirmDeleteDialog` | same meaning but a different capability (delete confirm); `ConfirmDeleteDialog` is bound to the `taxonomy.delete` namespace — separate change |
| instructor `Field` (`sections.tsx:216-252`), `DeltaEditor`, `ImageFileField` control, selects/panels, duration composite, review/approval/ticket label+textarea blocks | own control semantics or layout (no wrapper `div`, non-RHF string error + scroll anchor); only the identical blocks adopt `FormField` |
| zod uuid / optional-uuid / required-string / email helpers (`requiredUuid` ×6 …) | a different capability (not slug); recorded as an optional follow-up in `schema/shared` |
| flat-list `next[i] = {...}` idiom (7 sites) | mechanical idiom without business meaning |
| `components/ui/field.tsx` shadcn primitives | generated shadcn layer, jscpd-ignored, protected by the tooling rule |
| `useCourseEditorState` save handlers, `handleSaveBasicInfo` reconcile | lease + SWR cache + form re-seed (course editor stays mounted); taxonomy closes its dialog — only `isSlugAdjusted` and the payload rule are shared |

### Sibling-feature dependency check

Pre-existing cross-feature imports found by the audit (**not extended** by this change): `course ↔ instructor` (`course-editor-collaborators-tab.tsx:9-10`, `course-editor-review-history-tab.tsx:7`, `instructor-roster-row-actions.tsx:4`, `instructor-approvals-row-actions.tsx:10`), `course/taxonomy/instructor → media` (`MediaCollectionDialog`), `shared → features/instructor` (`user-multi-select-picker-dialog.tsx:3-4`), `shared → features/media` (`delta-editor.tsx:7`), `shared/confirm-delete-dialog.tsx:23` bound to the `taxonomy.delete` namespace, `instructor` schema/lib → `lib/utils/course-delta` (misfiled delta util). **New edges introduced: none** — verified by tasks 7.3 and 8.33 (an import-edge grep before and after): `components/features/taxonomy` imports no `course`/`instructor` code, `lib/utils/taxonomy` imports no `lib/utils/course`, `hooks/course` imports `@/hooks/slug` (neutral), `components/common/auth-menu` imports `@/components/shared` (existing precedent `header.tsx:5`), and the removed `shared → taxonomy` edge (`sortable-tree-editor.tsx:7-9`) is eliminated.

## Decisions

### 1. Extract the duplicated capabilities into neutral shared modules and migrate every consumer
Each row of the "Merged" table is MOVED (never copied) into its shared module and **all** listed consumers are migrated in the same change, so no second implementation survives. Course and auth behaviour, return shapes, DOM ids and tests are unchanged; each migration is gated by that feature's existing tests (tasks 8.12–8.19).
*Alternatives*: copy into taxonomy (rejected: jscpd clone and the Critical Deduplication rule); let `InstructorCoursesPage` call the generic hook directly (rejected: moves schema, payload, and toast logic into the screen file and breaks the existing hook tests); neutral `slug.*` i18n namespace shared by course and taxonomy (rejected for churn, see decision 12).

### 2. Payload rule: three tiny pure functions, no slug-named wrapper
`omitWhenBlank`, `changedNonBlank`, `payloadField` decide only whether a key is **present**; they do not encode what an omitted key means to the BE (create: generate; update: keep). Slug sites call `payloadField("slug", changedNonBlank(slug, persisted))` directly — a slug-named wrapper (`buildSlugPayloadField`) was rejected because it would be a second way to express the same rule. Whitespace-only values are now blank at the `media_url` / `image_file_id` / `preview_video_file_id` sites (previously only `""`); such ids/urls are never valid, so this is a no-op for real input.

### 3. Hook location `src/hooks/slug/`
`src/hooks/` is made of single-concern folders with a barrel (`quill/`, `language/`, `searchable-select/`, `user-picker/`); domain folders must not import each other, and both `hooks/course` and `components/features/taxonomy` consume this hook. The hook owns the whole submit orchestration (`prepare` → `request` → `onSuccess`, catch → suggestion or `toastApiError`, `finally`) rather than only the suggestion state, so neither consumer repeats the 15-line try/catch/finally.
*Alternatives*: `src/hooks/slug-conflict/use-slug-conflict-suggestion.ts` exposing only `captureConflict`/`clearSuggestion` (rejected: each caller would re-implement the try/catch skeleton); `src/hooks/shared/` (no hook precedent).

### 4. Root slug lives in react-hook-form, schema-driven, with mode-specific required-ness
`slug` becomes a form field (default from `getPersistedTaxonomySlug`, `""` on create). `taxonomySlugStatusSchema` gets `slug: optionalSlugField.optional()` (optional so existing callers/tests stay valid; topic/skill `.extend` it). `getTaxonomyFormSchema(resourceKey, mode)` — the resource→schema selection moved out of the dialog — swaps in `requiredSlugField` for `mode === "edit"` so a blank slug on an existing item is blocked with `validation.slugRequired` (the BE would answer `400`). Errors render through `FormField` → `FieldError` with `resolveValidationMessage(tForm, key)`.
*Alternative*: plain `useState` for the slug (rejected: a second validation path); optional on edit with "blank = unchanged" (rejected: silently ignores input; diverges from the course basic-info rule).

### 5. "Send only when changed" uses a baseline snapshot taken at mount
`TaxonomySlugBaseline = { slug, treeSlugs: Map<nodeId, slug> }` is built once from `initialData` (`buildTaxonomySlugBaseline`) and held in dialog state (the parent remounts the dialog per open via `key`, so there is no `useEffect` sync). Root: `payloadField("slug", changedNonBlank(values.slug, baseline.slug))`. Nodes: `toTaxonomyTreeWritePayload(tree, baseline.treeSlugs)` emits `slug` only for a new node with a typed slug or an existing node whose slug differs from its baseline entry. Course keeps its own (live-prop) baseline lifecycle; only the pure compare is shared.
*Alternative*: always send every node's slug (rejected: contradicts "omit preserves by id" and the course rule; bigger payload).

### 6. One traversal primitive; validation reuses the shared zod fields
`src/lib/utils/tree.ts` is generic over `{ id: string; children?: T[] }` and imports no feature code. Taxonomy-specific rules (`collectTaxonomyTreeSlugs`, `validateTaxonomyTreeSlugs`, `hasAdjustedTaxonomyTreeSlugs`, `toTaxonomyTreeWritePayload`) stay in `src/lib/utils/taxonomy/resource.ts` and consume it. `validateTaxonomyTreeSlugs` parses each node slug with `requiredSlugField` (persisted node) or `optionalSlugField` (new node), so the slug rule exists in exactly one place; it returns `node id → message key`, resolved by the dialog with `tForm`.

### 7. Tree editor ownership: merge `SortableTreeEditor` into `TaxonomyTreeEditor` (features/taxonomy)
The shared file had one consumer, imported taxonomy util/types, and embedded translation/slug semantics, so it is moved and merged with its pass-through wrapper; `SortableList` stays shared. The merged component uses `updateTreeNode` instead of three index-closure rebuilds, `TAXONOMY_TREE_INDENT_PX` instead of a second `12`, and the limits constants instead of `255`. The per-node toggle needs a component boundary (hooks cannot live in `SortableList`'s `renderItem`), hence `tree-node-slug-field.tsx` beside it.
*Alternative*: keep it shared and make it generic with render props (rejected: no second consumer; slug/translation semantics are taxonomy's).

### 8. Node slug UX: muted text + pencil toggle (`TreeNodeSlugField`)
Each node shows its slug as muted text with a pencil that reveals an inline `SlugInput` and a done button; a node without a slug shows the "generated from the name" placeholder; the control stays open while it has an error and renders it via `FieldError`. Most nodes never need a manual slug, so a per-node toggle keeps trees compact. *Alternatives*: always-visible inputs (noisy), per-node secondary dialog (extra interaction level).

### 9. Saved entity flows back; notices are a pure function; the dialog still closes on success
`persistTaxonomyCreate/Update/Form` return the saved `TaxonomyEntity`. `getTaxonomySaveSlugNotice(resourceKey, payload, saved)` computes `{ adjustedSlug?, treeAdjusted }`; the dialog toasts `slugAdjusted` and/or `treeSlugsAdjusted`, otherwise `common.createSuccess|updateSuccess`, then `onSuccess()` and `onOpenChange(false)` as today; the next edit open fetches `view=edit`, so final node slugs appear there. *Alternative*: keep the dialog open and re-seed tree/baseline/`row_version` (rejected: larger state surface, new bugs, no requirement).

### 10. Conflict dialog is create-only by contract, but the flow is shared by create and update
`useSlugConflictFlow` wraps both modes (one code path). Only create can receive `3007`; if the BE ever returned it on update, accept would resubmit with the recommended slug (safe). The confirm renders inside `DialogContent` with `ConfirmActionDialog stacked` (React-tree nested), the documented rule for a confirm over a `Dialog`.

### 11. Previews and slugifiers are deleted; the slug field is not locale-gated
`resolveTaxonomySlugPreview`, the node preview cell, then `generateSlug`/`slugifyName` (+ barrel line + test) are removed after re-grepping for consumers; the slug field is shown on every language tab (a slug is not localized; the old English-only guard existed because the preview derived from the English name).

### 12. i18n keys stay in the `taxonomy.*` namespace
New keys under `taxonomy.form` and `taxonomy.tree` / `taxonomy.treeSkills` (en + vi; `Messages` type enforces parity), worded for "item". The three `validation.slug*` keys share names with `course.validation.*` so the shared zod fields resolve in either namespace; each added block is under the jscpd 10-line floor.

### 13. Payload types: topic/skill update types extend `UpdateSlugStatusPayload`
`slug?` is added once to `CreateSlugStatusPayload` and once to `UpdateSlugStatusPayload`; `UpdateTopicPayload`/`UpdateSkillPayload` become intersections with `UpdateSlugStatusPayload` (removing four duplicated fields each). Outcome payloads get no slug.

### 14. e2e: shared fixture helpers, one `loginAs`
The fixture's slug-conflict response and "resolve saved slug" logic are extracted once and used by the course and taxonomy handlers; `loginAsInstructor` delegates to `loginAs(page, user, startPath)`; an admin fixture user carries the taxonomy permissions (names read from `src/constants/permissions` and the admin sidebar constants).

### 15. GitNexus, documentation, and session state
GitNexus is refreshed before impact analysis and force-synced at the end. Documentation changes follow `docs-update-inventory.md` (English, replace-not-append, stamps updated). Session state goes only to the exact `.context/session-<SESSION_ID>.md`; Memory Bank persistence follows `AGENTS.md`.

## Code change specification (per file)

Legend: **ADD**, **MODIFY**, **DELETE**, **MOVE**. "After" code and call-site line numbers are in `code-change-inventory.md` (section letter in the last column). Every change reuses the resource named in the inventory's reuse ledger.

| File | Change | Symbols / specifics | Inventory |
|---|---|---|---|
| `src/lib/utils/payload.ts` | ADD | `omitWhenBlank`, `changedNonBlank`, `payloadField` (CAP-1) | A1 |
| `src/lib/utils/payload.test.ts` | ADD | blank / changed / spread cases | A1 |
| `src/lib/utils/tree.ts` | ADD | `TreeNodeLike`, `TreeVisitContext`, `walkTree`, `flattenTree`, `countTreeNodes`, `getTreeMaxDepth`, `findTreePath`, `findTreeNodeById`, `updateTreeNode` (CAP-9) | A2 |
| `src/lib/utils/tree.test.ts` | ADD | traversal, count, depth, path, by-id, immutable update | A2 |
| `src/lib/utils/slug.ts` | MODIFY | ADD `isSlugAdjusted`; DELETE `generateSlug`, `slugifyName`; reword `sanitizeSlugInput` comment (CAP-3) | A3 |
| `src/lib/utils/slug.test.ts` | MODIFY | DELETE `generateSlug` import + describe (lines 3, 54-56); ADD `isSlugAdjusted` describe | A3 |
| `src/lib/utils/index.ts` | MODIFY | DELETE line 98 `export { generateSlug, slugifyName } from "./slug"` | A3 |
| `src/schema/shared/slug.ts`, `index.ts`; `src/schema/index.ts` | ADD / MODIFY | `optionalSlugField`, `requiredSlugField`; barrel line `export * from "./shared"` (CAP-2) | A4 |
| `src/lib/utils/validation-message.ts` (+ `.test.ts`) | MODIFY / ADD | `resolveValidationMessage(t: (key: never) => string, …)` — accepts any next-intl scoped translator; delete inner cast (CAP-8) | A5 |
| `src/constants/taxonomy/limits.ts` | ADD | `TAXONOMY_NAME_MAX_LENGTH = 255`, `TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH = 100` (CAP-11) | A6 |
| `src/schema/course/course.ts` | MODIFY | DELETE private `slugFormatField` + import (lines 6, 16-25); `slug: optionalSlugField` (l.32), `slug: requiredSlugField` (l.37-40) | B1 |
| `src/lib/utils/course.ts` | MODIFY | `toUpdateCourseBasicInfoPayload`, `toCreateCoursePayload` on `payloadField`/`changedNonBlank`/`omitWhenBlank`; DELETE inline lines 89-91, 92-95, 104-107 | B2 |
| `src/hooks/course/use-course-editor-state.ts` | MODIFY | l.398 → `isSlugAdjusted`; sub-lesson `media_url` → `payloadField("media_url", omitWhenBlank(...))` | B3 |
| `src/hooks/course/use-course-create-flow.ts` | MODIFY | thin wrapper over `useSlugConflictFlow`; same return shape; DELETE local suggestion state/catch/accept/dismiss | B4 |
| `src/hooks/slug/use-slug-conflict-flow.ts`, `index.ts` (+ test); `src/hooks/index.ts` | ADD / MODIFY | `useSlugConflictFlow<TPayload,TResult>` (CAP-4); barrel `export * from "./slug"` | C1 |
| `src/screen/instructor/courses/page.tsx` | MODIFY | title → `FormField`; slug → `SlugField`; confirm → `SlugConflictConfirmDialog` (l.207-230, 251-268); KEEP hand-rolled delete dialog | B5 |
| `src/components/features/course/course-editor-basic-tab.tsx` | MODIFY | title/slug/short_description → `FormField`/`SlugField` (l.120-216); drop 6 casts (l.142,177,208,243,364,405) | B6 |
| `src/components/shared/form-field.tsx` (+ test) | ADD | `FormField` (CAP-6) | C3 |
| `src/components/shared/slug-field.tsx` (+ test) | ADD | `SlugField` = `FormField` + `SlugInput` | C4 |
| `src/components/shared/slug-conflict-confirm-dialog.tsx` (+ test) | ADD | `SlugConflictConfirmDialog` (CAP-5) | C2 |
| `src/components/shared/index.ts` | MODIFY | ADD `form-field`, `slug-conflict-confirm-dialog`, `slug-field`; DELETE `sortable-tree-editor` export (l.19) | C5 |
| `src/components/shared/image-file-field.tsx` | MODIFY | label branch → `<RequiredLabel required={required}>`; DELETE `Label` import (CAP-10) | D4 |
| `src/components/common/auth-menu/auth/auth-form-fields.tsx` | MODIFY | DELETE `resolveAuthValidationMessage`, `AuthValidationMessageKey`, `AuthFieldError`; use shared resolver + `FieldError` (CAP-7/8) | D3 |
| `src/lib/navigation/dashboard-page-header.ts` (+ new test) | MODIFY | DELETE `findDashboardItemById`, `findDashboardItemPathByHref` (l.39-83); use `findTreeNodeById`/`findTreePath` (l.~119, ~172) (CAP-9) | D1 |
| `src/lib/utils/dagre-tree.ts` (+ new test) | MODIFY | DELETE local `walkTree` (l.16-40); `treeToFlowElements` uses generic `walkTree` (CAP-9) | D2 |
| `src/types/taxonomy/index.ts` | MODIFY | `slug?` on `CreateSlugStatusPayload`/`UpdateSlugStatusPayload`; `UpdateTopicPayload`/`UpdateSkillPayload` extend `UpdateSlugStatusPayload`; ADD `TaxonomySlugBaseline`; `TaxonomyTreeNode.slug` comment | E1 |
| `src/schema/taxonomy/taxonomy.ts` (+ `.test.ts`) | MODIFY | `slug: optionalSlugField.optional()`; limits constants; ADD `getTaxonomyFormSchema(resourceKey, mode)` | E2 |
| `src/lib/utils/taxonomy/resource.ts` (+ new test) | MODIFY | DELETE `countTaxonomyTreeNodes`; ADD `collectTaxonomyTreeSlugs`, `validateTaxonomyTreeSlugs`, `hasAdjustedTaxonomyTreeSlugs`; `toTaxonomyTreeWritePayload(nodes, persistedSlugs)`; fix comments | E3 |
| `src/lib/utils/taxonomy/form-helpers.ts` (+ new test) | MODIFY | DELETE `resolveTaxonomySlugPreview`, `getTaxonomyTreeMaxDepth`, `slugifyName` import; `buildTaxonomyFormDefaultValues` seeds `slug`; ADD `buildTaxonomySlugBaseline` | E4 |
| `src/lib/utils/taxonomy/form-submit.ts` (+ new test) | MODIFY | slug + baseline through builders; `image_file_id` via `payloadField`; `persist*` return `TaxonomyEntity`; ADD `getTaxonomySaveSlugNotice`; one payload alias | E5 |
| `src/components/features/taxonomy/taxonomy-tree-view-button.tsx` | MODIFY | call site only: `countTaxonomyTreeNodes` → `countTreeNodes` (l.16, 39) | E3 |
| `src/components/features/taxonomy/taxonomy-form-dialog.tsx` (+ new test) | MODIFY | slug baseline, `getTaxonomyFormSchema`, `useSlugConflictFlow` replaces `onSubmit`/`isSubmitting`, `FormField`/`SlugField`, stacked confirm, tree errors, notices; DELETE preview, `nameValue`, casts | F1 |
| `src/components/features/taxonomy/taxonomy-tree-editor.tsx` (+ new test) | MODIFY (absorbs shared editor) | `TaxonomyTreeEditor` owns `TreeLevel`, name editing, `patchNodeSlug`, `updateTreeNode`, indent/limits constants (CAP-12) | F2 |
| `src/components/features/taxonomy/tree-node-slug-field.tsx` (+ test) | ADD | `TreeNodeSlugField` (muted slug + pencil toggle + inline `SlugInput`) | F3 |
| `src/components/shared/sortable-tree-editor.tsx` | DELETE | `SortableTreeEditor`, `SortableTreeEditorLabels`, `SortableTreeEditorProps` (single consumer; taxonomy-only imports) | F2 |
| `src/messages/en.ts`, `src/messages/vi.ts` | MODIFY | new `taxonomy.form.*`, `taxonomy.tree.*`, `taxonomy.treeSkills.*` keys (en + vi parity) | F4 |
| `e2e/fixtures/server.mjs`, `e2e/support/auth.ts`, `e2e/support/fixture-client.ts` | MODIFY | shared `slugConflictResponse`/`resolveSavedSlug`; admin user; taxonomy routes; `loginAs`/`loginAsAdmin` | H |
| `e2e/tests/taxonomy-slug.spec.ts` | ADD | create / conflict accept / decline / edit omit / node edit / node blocked / adjusted notice | H |

## Documentation change specification (per document)

All edits are English and replace the current passage (no appended notes). `ID` is the item key in `docs-update-inventory.md`, which holds the verbatim CURRENT text and the exact REPLACEMENT. "Section / anchor" shows the first line of the quoted passage.

### `docs/taxonomy-admin.md` (13 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| TAX-1 | L3 | REPLACE | _Last audited: 2026-07-12 (multilingual: `locale` query, `view=edit`, translation tabs, `expected_row_version`)._ |
| TAX-2 | L23 | INSERT | \| List labels \| `listTaxonomyService` / `useTaxonomyList` with `locale` \| Assume mono-locale canonical `name` only \| |
| TREE-1 | L58 | FRAGMENT | Sidebar items and actions use RBAC keys from `src/constants/permissions.ts` (e.g. `course_level:read`, `topic:create`… |
| TAX-3 | L63 | INSERT | - **Data locale:** list/picker reads pass `locale` from `useLocale()` so BE resolves labels via translation fallback.… |
| DAG-3 | L78 | REPLACE | Topics and skills list rows with nested `child_topics` / `children` show a **View tree** button in the `child_render`… |
| TAX-4 | L80 | REPLACE | Edit/reorder still uses `SortableTreeEditor` in the form dialog — separate from the read-only dagre popup. On edit, t… |
| TAX-5 | L92-L99 | REPLACE | ## Slug (read-only preview; server authority — taxonomy only) |
| LIM-1 | L140 | FRAGMENT | - Non-`en` name / short_description inputs use the same max lengths as canonical (`name` 255, short 100); BE validate… |
| TAX-6 | L142 | REPLACE | - Tree editors accept optional per-node `translations`. |
| TAX-7 | L143 | REPLACE | - Submit sends canonical and/or `translations`; update includes **`expected_row_version`** from the edit GET. |
| TAX-8 | L149 | FRAGMENT | - **Schemas**: `src/schema/taxonomy/taxonomy.ts` — `taxonomySlugStatusSchema`, `taxonomyTopicSchema`, `taxonomySkillS… |
| TAX-9 | L150 | FRAGMENT | - **Form UI**: `TaxonomyFormDialog` uses `RequiredLabel` + `FieldError` on `name` / `short_description`; Zod enforces… |
| TAX-10 | L152 | REPLACE | - **API failures**: list delete and form create/update catch → `toastApiError(useTranslations("errors.codes"), error)… |

### `docs/patterns.md` (7 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| PAT-4 | L3 | REPLACE | _Last audited: 2026-09-16 (Adding New Features Checklist: added a test-coverage checklist item pointing to `testing.m… |
| VAL-6 | L327-L328 | REPLACE | Translate keys in `auth-form-fields.tsx` (`resolveAuthValidationMessage`) or shared helpers from `src/lib/utils/valid… |
| PAT-1 | L349 | REPLACE | \| `taxonomy.form.validation` \| `name`, `nameMax`, `shortDescription`, `shortDescriptionMax`, `descriptionMaxLines`, `… |
| FF-6 | L355 | REPLACE | Use `RequiredLabel` + `FieldError` from `src/components/shared/` on required dialog fields. |
| PAT-2 | L572 | REPLACE | **Taxonomy** slugs are **read-only** in the UI. Show a live preview with `generateSlug(name)` / `slugifyName(name)` w… |
| PAT-3 | L576 | FRAGMENT | - Create dialog: the slug is **optional**; a blank slug is omitted from `POST /courses` (`toCreateCoursePayload(title… |
| PAY-1 | L577 | INSERT | - Basic-info tab: the slug is **required**, defaults to `course.slug`, and is disabled while there is no draft. `toUp… |

### `docs/api-overview.md` (4 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| APIO-1 | L3 | REPLACE | _Last audited: 2026-07-22 (browser `[API]` Console only when NODE_ENV=development; server sanitized logs; prod browse… |
| APIO-2 | L48 | REPLACE | - `ApiErrorCode.SlugAlreadyExists` (**3007**, HTTP 409) is returned by `POST /courses` when the slug is taken; the cr… |
| APIO-3 | L89 | FRAGMENT | \| `POST /api/v1/courses` \| `createCourseService` \| Body `{ title, slug? }` (`toCreateCoursePayload`); a blank slug is… |
| APIO-4 | L114 | INSERT | **Dual response:** list / `GET /:id?locale=` → localized/public shape; `GET /:id?view=edit` → admin editable (canonic… |

### `docs/api-using.md` (6 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| APIU-1 | L3 | REPLACE | _Last audited: 2026-07-22 (server sanitized logs; browser no custom Console; compress body memo retained). Prior: raw… |
| APIU-2 | L415 | FRAGMENT | Slug conflicts return HTTP `409` with app code **3007** (`ApiErrorCode.SlugAlreadyExists`, copy in `errors.codes.3007… |
| APIU-3 | L469 | INSERT | name: "React", |
| APIU-4 | L474 | INSERT | translations: { vi: { name: "Phản ứng" } }, |
| APIU-5 | L482 | INSERT | \| `getTaxonomyDetailService` \| `locale` → public/localized shape; `view: "edit"` → canonical + `translations` + tree … |
| APIU-6 | L539 | REPLACE | - `409` slug conflicts use code **3007** (`ApiErrorCode.SlugAlreadyExists`); `extractRecommendedSlug(error)` reads `d… |

### `docs/instructor-admin.md` (3 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| INS-1 | L3 | REPLACE | _Last audited: 2026-07-06 — Approvals ⋮ menu: **Delete** only when applicant account is ineligible (disabled / banned… |
| INS-2 | L88 | FRAGMENT | **My Courses** (`InstructorCoursesPage`): create dialog sends `{ title, slug? }` via `toCreateCoursePayload(title, sl… |
| INS-3 (optional) | L88 | FRAGMENT | The slug is an editable **optional** field (shared `SlugInput`; input filtered by `sanitizeSlugInput` |

### `docs/logic-flow.md` (4 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| LF-1 | L3 | REPLACE | _Last audited: 2026-07-08 (Discord + Google OAuth on popup; X code retained). Prior: 2026-06-26 (course admin ⋮ menu … |
| VAL-5 | L291 | REPLACE | → Resolve via resolveValidationMessage / resolveAuthValidationMessage — skip t() when message is undefined |
| LF-2 | L360 | FRAGMENT | **Source:** `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`), `src/lib/utils/course.ts` (`toCreat… |
| LF-3 | L382 | INSERT_BEFORE | ## 11. Course Editor — Submit-for-Review Validation Flow |

### `docs/architecture.md` (11 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| ARC-1 | L3 | REPLACE | _Last audited: 2026-09-16 (Technology Stack: added Jest/RTL/MSW unit/integration tests and Playwright browser tests r… |
| MOVE-1 | L20 | REPLACE | \| DnD / tree edit \| @dnd-kit/* \| 6.x \| `SortableList`, `SortableTreeEditor` in `src/components/shared/` \| |
| MOVE-2 | L22 | REPLACE | \| Legacy tree pkg \| @nosferatu500/react-sortable-tree \| 5.x \| Installed; taxonomy form uses `SortableTreeEditor` (@dn… |
| SCH-1 | L177 | FRAGMENT | │ ├── schema/ # Zod: auth, me, media, taxonomy, instructor, course (barrel @/schema) |
| TREE-6 (optional) | L196 | INSERT | │ │ │ ├── media.ts # media upload/list helpers |
| ARC-2 | L284 | REPLACE | \| `extractRecommendedSlug` \| `lib/utils/api-error.ts` \| Read `data.recommended_slug` from a `409` / code 3007 (`SlugA… |
| FF-1 | L285 | INSERT | \| `RequiredLabel` / `FieldError` \| `components/shared/` \| Form required asterisk + inline Zod errors \| |
| ARC-3 | L286 | REPLACE | \| `SlugInput` \| `components/shared/slug-input.tsx` \| Editable slug field (filters through `sanitizeSlugInput`: `a-z 0… |
| ARC-4 | L286 | INSERT | \| `SlugInput` \| `components/shared/slug-input.tsx` \| Editable slug field (filters through `sanitizeSlugInput`: `a-z 0… |
| ARC-5 | L286 | — | \| `optionalSlugField` / `requiredSlugField` \| `schema/shared/slug.ts` \| The single slug zod rule set (blank-allowed /… |
| VAL-1 | L386 | FRAGMENT | Validation error messages in Zod schemas (`loginSchema`, `signupSchema`) use **i18n keys** (e.g. `"validation.email"`… |

### `docs/components.md` (11 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| CMP-1 | L3 | REPLACE | _Last audited: 2026-09-29 (course slug UI: shared `SlugInput`, create-course optional slug + recommended-slug confirm… |
| MOVE-3 | L101 | REPLACE | \| `@dnd-kit/core`, `sortable`, `utilities`, `modifiers`, `accessibility` \| Modern DnD toolkit \| `SortableList`, `Sort… |
| VAL-2 | L170 | FRAGMENT | \| `AuthEmailPasswordFields` \| `auth/auth-form-fields.tsx` \| Shared UI \| Email + password for login/signup; translates… |
| FF-2 | L229 | INSERT | \| `FieldError` \| `field-error.tsx` \| Inline validation message below a control; pair with `resolveValidationMessage`. \| |
| CMP-2 | L230 | FRAGMENT | \| `ConfirmActionDialog` \| `confirm-action-dialog.tsx` \| Generic confirm shell (`title`, `description`, `confirmLabel`… |
| MOVE-4 | L235 | REPLACE | \| `SortableTreeEditor` \| `sortable-tree-editor.tsx` \| Nested sortable tree (name + read-only slug); used by taxonomy … |
| CMP-4 | L236 | REPLACE | \| `SlugInput` \| `slug-input.tsx` \| Editable slug `Input`; every change is filtered by `sanitizeSlugInput` (`a-z 0-9 -… |
| CMP-8 | L236 | — | \| `SlugField` \| `slug-field.tsx` \| Labelled slug form field: `FormField` (`RequiredLabel` + hint + `FieldError`) arou… |
| MOVE-5 | L242 | FRAGMENT | `src/components/features/taxonomy/` — taxonomy CRUD UI only: `TaxonomyFormDialog` (Zod schemas, `RequiredLabel`, `Fie… |
| FF-3 | L248 | FRAGMENT | `course-editor-basic-tab` — `react-hook-form + zodResolver` over `courseBasicInfoSchema`, with `RequiredLabel`, `Fiel… |
| CMP-7 | L261 | INSERT | \| `useSearchablePaginatedOptions` \| `hooks/searchable-select/use-searchable-paginated-options.ts` \| Popover UX + wiri… |

### `docs/reusable-assets.md` (31 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| RA-1 | L3 | REPLACE | _Last audited: 2026-09-29 (course slug management UI: `SlugInput`, `sanitizeSlugInput`, `extractRecommendedSlug`, `us… |
| RA-2 | L154 | FRAGMENT | - **Reuse Rule**: Always import from here. Never hardcode `code === 0`, `code === 3002` or `code === 3007` inline (us… |
| NAV-1 | L320 | FRAGMENT | - **Purpose**: Maps the current dashboard pathname to the shared breadcrumb/title/description model. Breadcrumb label… |
| TREE-3 | L494 | REPLACE | - **Name**: `getTaxonomyResourceConfig`, `getTaxonomySearchableColumns`, `getTaxonomyTreeFromEntity`, `buildTaxonomyD… |
| TAXU-1 | L502 | REPLACE | - **Name**: `CONTENT_LOCALE_OPTIONS`, `resolveAllowedContentLocale`, `canonicalizeContentLocale`, `buildTaxonomyFormD… |
| RA-4 | L505 | FRAGMENT | - **Purpose**: Multi-locale content presets for taxonomy translation tabs; BCP47 canonicalize; **whitelist** add via … |
| RA-5 | L507 | FRAGMENT | - **Dependencies**: `LANGUAGE_OPTIONS` (for `en`/`vi` labels), `slugifyName`, taxonomy types. |
| LIM-4 | L515 | INSERT | - **Dependencies**: `TaxonomyResourceKey` type. |
| RA-6 | L537 | FRAGMENT | - **Purpose**: Create/update taxonomy rows per `resourceKey`; locale UI is a multi-preset combobox only (`CONTENT_LOC… |
| RA-7 | L539 | FRAGMENT | - **Dependencies**: `@/lib/utils/taxonomy` (resource + form-helpers), `@/lib/utils/taxonomy/form-submit`, `slugifyNam… |
| TAXU-2 | L541 | REPLACE | - **Name**: `buildTaxonomySubmitPayload`, `persistTaxonomyForm`, `prepareOutcomeSubmitPayload`, `prepareTopicSubmitPa… |
| RA-9 | L592 | FRAGMENT | - **Scope**: `ConfirmDeleteDialog` wrapper; instructor course editor submit-review confirm (`editor-page.tsx`); stack… |
| RA-10a | L719 | REPLACE | - **Purpose**: Create-course dialog state machine. Builds the `POST /api/v1/courses` body with `toCreateCoursePayload… |
| RA-10b | L721 | REPLACE | - **Dependencies**: `toCreateCoursePayload` (`src/lib/utils/course.ts`), `extractRecommendedSlug` / `toastApiError` (… |
| RA-10c | L722 | REPLACE | - **Reuse Rule**: Reuse for any create-with-optional-slug flow; never re-implement 3007 handling inline. |
| RA-11 | L722 | INSERT | - **Reuse Rule**: Reuse for any create-with-optional-slug flow; never re-implement 3007 handling inline. |
| PAY-4 | L803 | FRAGMENT | `toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug)` (sends `title` and all required fields and adds `slug` onl… |
| DAG-1 | L811 | FRAGMENT | - **Purpose**: Walk a minimal tree shape (`id`, `name`, optional `children`) and produce layouted React Flow nodes/ed… |
| TREE-5 | L813 | INSERT | ### Asset: tree utils |
| MOVE-7 | L815-L821 | REPLACE | ### Asset: SortableTreeEditor |
| RA-13a | L827 | FRAGMENT | - **Purpose**: Controlled text input for an **editable** slug (`value` + `onValueChange`). Every change goes through … |
| RA-13b | L828 | REPLACE | - **Scope**: Create-course dialog (optional slug) and the course editor basic-info tab (required slug, disabled witho… |
| VAL-9 | L836 | FRAGMENT | - **Purpose**: Shared image picker/preview field with optional permission gate for the browse action and clear/reset … |
| RA-14 | L848-L854 | REPLACE | ### Asset: slugifyName |
| RA-15 | L856-L863 | REPLACE | ### Asset: sanitizeSlugInput / SLUG_MAX_LENGTH / SLUG_PATTERN |
| PAY-2 | L863 | INSERT | ### Asset: payload utils |
| VAL-8 | L972 | FRAGMENT | - **Purpose**: Validates login form — `email`, `password`, `rememberMe`. Validation messages are i18n keys (`"validat… |
| RA-16 | L1228 | FRAGMENT | - **Scope**: Auth, Me, Media, Taxonomy, Instructor, Course — all `catch` blocks after API calls; `extractRecommendedS… |
| FF-7 | L1236 | FRAGMENT + INSERT | - **Scope**: Taxonomy form dialog, instructor/course dialogs, any new forms. |
| VAL-7 | L1239-L1245 | REPLACE | ### Asset: resolveValidationMessage |
| SCH-4 | L1248 | FRAGMENT | - **Name**: Module schemas (`auth`, `me`, `media`, `taxonomy`, `instructor`, `course`) |

### `docs/folder-structure.md` (13 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| FS-1 | L3 | REPLACE | _Last audited: 2026-09-29 (course slug UI: `slug-input.tsx`, `use-course-create-flow.ts`, `slug.ts` `sanitizeSlugInpu… |
| MOVE-6 | L192 | FRAGMENT | │ ├── taxonomy/ # TaxonomyFormDialog, TaxonomyLocaleTabsSection, tree/description editors, taxonomy-table-columns, ta… |
| FS-9 | L200 | FRAGMENT | │ # SortableTreeEditor, SlugInput, PreviewPdf (dynamic client-only) + preview-pdf-viewer, |
| FS-2 | L340 | INSERT | │ └── use-delta-editor-media-handlers.ts |
| VAL-3 | L424 | REPLACE | Error messages in schemas use **i18n keys** (not hardcoded strings). Resolve in components via `resolveValidationMess… |
| LIM-2 | L457-L458 | REPLACE | ├── taxonomy/ |
| NAV-2 | L481 | FRAGMENT | │ └── dashboard-page-header.ts # dashboard route metadata resolver (consumes static constants + shared dashboard types) |
| VAL-4 | L500 | FRAGMENT | │ ├── validation-message.ts # resolveValidationMessage, toastValidationError, firstValidationMessageKey |
| TREE-4 | L506 | FRAGMENT + INSERT | │ ├── dagre-tree.ts # treeToFlowElements, getLayoutedElements (React Flow + dagre) |
| FS-11 | L509-L511 | — | │ │ ├── resource.ts # getTaxonomyResourceConfig, getTaxonomySearchableColumns, getTaxonomyTreeFromEntity, buildTaxono… |
| FS-6 | L512 | REPLACE | │ ├── slug.ts # generateSlug() + slugifyName() (taxonomy preview) + sanitizeSlugInput(), SLUG_MAX_LENGTH, SLUG_PATTER… |
| FS-7 | L641 | FRAGMENT | │ └── server.mjs # Loopback HTTP fixture backend (plain node:http, no framework) — auth, /me, course detail/collabora… |
| FS-8 | L649 | INSERT | ├── course-slug.spec.ts # optional slug on create, 409/3007 recommended-slug confirm (Yes/No), basic-info slug edit |

### `docs/modules.md` (9 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| MOD-1 | L3 | REPLACE | _Last audited: 2026-09-29 (Course slug management UI: editable slug on create + basic-info, 3007 recommended-slug con… |
| FF-4 | L10 | FRAGMENT | - `Validation + i18n errors`: `src/schema/**`, `src/messages/error-codes.ts`, `src/components/shared/required-label.t… |
| FF-5 | L25 | FRAGMENT | - `Validation + i18n errors` provides shared Zod schemas, form labels (`RequiredLabel`), field errors (`FieldError`),… |
| LIM-3 | L37 | REPLACE | - **Constants**: `src/constants/taxonomy/resources.ts` — `TAXONOMY_RESOURCES`, `TAXONOMY_RESOURCE_KEYS`, `TAXONOMY_GR… |
| TREE-2 | L38 | FRAGMENT | - **Utils**: `src/lib/utils/taxonomy/` — `resource.ts` (`getTaxonomyResourceConfig()`, `getTaxonomySearchableColumns(… |
| MOD-2 | L41 | FRAGMENT | - **UI**: `src/screen/common/taxonomy/taxonomy-list-page.tsx` (`TaxonomyListPage`), app routes under `src/app/[locale… |
| MOD-3 | L41 | INSERT | - **UI**: `src/screen/common/taxonomy/taxonomy-list-page.tsx` (`TaxonomyListPage`), app routes under `src/app/[locale… |
| MOD-4 | L85 | FRAGMENT | - `src/hooks/course/use-course-create-flow.ts` — `useCourseCreateFlow`: create-course submit with optional slug (`toC… |
| SCH-3 (optional) | L87 | FRAGMENT | required `slug` matching `SLUG_PATTERN`, max `SLUG_MAX_LENGTH` 255; |

### `docs/pages.md` (2 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| PG-1 | L3 | REPLACE | _Last audited: 2026-09-29 — course slug management UI (create-dialog optional slug + 3007 confirm; basic-info editabl… |
| PG-2 | L88 | REPLACE | \| Taxonomy list + form dialog \| `taxonomy.form.validation.*`, `RequiredLabel`, `FieldError`; create/edit remounts `Ta… |

### `docs/screens.md` (5 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| SCR-1 | L3 | REPLACE | _Last audited: 2026-09-29 (course slug UI: create dialog optional slug + 3007 confirm; info tab editable slug). Prior… |
| SCR-2 | L56 | REPLACE | \| `/{locale}/admin/taxonomy/{resource}` \| Active \| Shared `TaxonomyListPage` (resource = levels \\| topics \\| outcomes… |
| FF-8 | L428 | INSERT | \| `FieldError` \| `field-error.tsx` \| Inline validation message under a field (resolves i18n key from Zod). \| |
| SCR-3 | L430 | REPLACE | \| `SlugInput` \| `slug-input.tsx` \| Editable slug input filtered by `sanitizeSlugInput` — course create dialog, course… |
| SCR-4 | L430 | — | \| `SlugField` \| `slug-field.tsx` \| Labelled slug field (`FormField` + `SlugInput`) — course create dialog, course bas… |

### `docs/testing.md` (8 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| TST-1 | L3 | REPLACE | _Last updated: 2026-09-29 — course slug management UI tests added under `openspec/changes/add-course-slug-management-… |
| TST-2 | L28 | FRAGMENT | - **Fixture backend:** `e2e/fixtures/server.mjs` — a plain `node:http` server (no framework), loopback-bound, serving… |
| TST-3 | L38 | INSERT | - `course-slug.spec.ts` — seven cases for `openspec/changes/add-course-slug-management-ui`: creating a course with a … |
| TST-4 | L71 | REPLACE | \| `src/schema/taxonomy/taxonomy.ts` (`taxonomySlugStatusSchema`, `taxonomyTopicSchema`, `taxonomySkillSchema`, `taxon… |
| TST-5 | L74 | REPLACE | \| Browser journeys (see Harness — Playwright above) \| `e2e/tests/*.spec.ts` \| auth (login/logout/expired-session/forb… |
| TST-8 | L80 | REPLACE | \| `src/lib/utils/slug.ts` (`sanitizeSlugInput`, `SLUG_PATTERN`, `SLUG_MAX_LENGTH`; `generateSlug` unchanged) \| `src/l… |
| TST-7 | L84 | FRAGMENT | \| `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`) \| `src/hooks/course/use-course-create-flow.tes… |
| TST-6 | L86 | INSERT | \| `src/components/shared/confirm-action-dialog.tsx` (`ConfirmActionDialog`, default and `stacked`) \| `src/components/… |

### `docs/dependencies.md` (2 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| DEP-1 | L3 | REPLACE | _Last audited: 2026-09-16 (`server-only` 0.0.1 runtime; `knip` 6.17.1 dev; testing stack added — `jest` 30.5.1, `@pla… |
| DEP-2 | L133 | REPLACE | \| `@dnd-kit/core` \| ^6.3.1 \| DnD context — `SortableList`, `SortableTreeEditor` \| |

### `docs/seo-ranking-setup.md` (2 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| SEO-1 | L3 | REPLACE | _Last audited: 2026-07-26 (temporary signed-in `/home` under `(web)` + `PRIVATE_ROUTES.home`; most SEO helpers still … |
| SEO-2 | L41 | REPLACE | \| A12 \| Slug helper \| `src/lib/utils/slug.ts` \| Future slug UI/canonical; no second slugger. \| |

### `docs/quality.md` (1 items)

| ID | Location | Mode | Section / anchor (first line of the quoted passage) |
|---|---|---|---|
| QUA-1 | L3 | REPLACE | _Last audited: 2026-09-16 (`test` now runs the real Jest suite — see [`docs/testing.md`](./testing.md); `deadcode`/Kn… |


Files scanned and intentionally unchanged are listed with one-line reasons in `docs-update-inventory.md` ("Scanned — no change").

## AGENTS.md Workflow Mapping

| AGENTS.md rule / section | Where it is executed in `tasks.md` |
|---|---|
| Scope and Applicability — classify before any lifecycle (in-scope implementation, frontend only) | 1 |
| Global Memory Bank — required pre-response load (CLI → MCP → direct file), reload after compaction, no secrets | 2 |
| Critical Pre-Conversation Session Bootstrap (external `AI_SESSION_ID_FILE`, validations, never regenerate) | 3 |
| Agent and Subagent Session Propagation (exact path + ID + context file; prohibitions; reject divergent results) | 3.4, 5.6 |
| Critical First Action — read the complete existing `.context`; Dual Session Context Lifecycle (exactly one `session-<ID>.md`) | 4 |
| Initial Phase — project understanding: docs, `.ai/skills`, GitNexus, git changes, ≤4 subagents, cost restriction, `fe-mycourse` structure | 5 |
| `CLAUDE.md` GitNexus rules — impact before editing, report blast radius, warn on HIGH/CRITICAL, context before extract/split, `gitnexus_rename`, `detect_changes` | 6, 12.1, 17.1 |
| Critical Reuse Rule and Critical Deduplication Rule — read existing code first, reuse, merge duplicates, reject and redo on duplication | 7 and the "Reuse check" of every task in 8 |
| Middle Phase — implement in the existing structure, English only, reusable utilities in the right folder | 8 |
| Final Phase — GitNexus force-sync, `npm run check-all`, fix errors, CI/CD safety | 11 |
| Exit Code Rule + Tooling rule protection (no config change; stash-and-ask protocol) | 11.3, 11.4 |
| Post-Implementation Code Review (architecture, structure, reuse, no duplicates, no unrelated files, no secrets, CI-ready) | 12 |
| Documentation and Context Sync — scan entire source; add/update/delete docs; update GitNexus files; Full Documentation Replacement; Language Consistency | 10 (per document) |
| Swagger and API Documentation Rule | 10.20 |
| Sensitive Test Accounts and Environment Secrets Policy (Git-surface scoped, placeholders only) | 13 |
| Mandatory End-of-Task Learning Summary (`What I Learned Today`, `What I Should Learn or Do Next Time`) | 14 |
| Memory Bank end-of-turn persistence + verbatim `lastResponse.md` | 15 |
| Final Response Requirement | 16 |
| Commit rules (English one-line Conventional Commit, 15–72 chars, hooks, no `--no-verify`); Branch rename rules (not triggered) | 17 |
| Agent rule boundaries (no new rule is added, so no boundary markers) | 10.19 |

## Risks / Trade-offs

- [Behavioural regression while migrating course/auth/dashboard/dagre consumers] → each migration is gated by that feature's existing tests plus new characterization tests written **before** the refactor where none exist (breadcrumbs, dagre, auth fields); course regression gate 8.20 blocks the taxonomy work.
- [`use-course-editor-state.ts` is ~675/700 `max-lines`] → both edits are in-place replacements (net ≤ 0 lines); measure with `npx eslint`.
- [`taxonomy-form-dialog.tsx` ~491/700] → the flow replaces `onSubmit`, the preview, and `isSubmitting`; pure helpers already live outside the file; measure after the edit.
- [Making `resolveValidationMessage` generic may not type-check with next-intl's typed translators at every call site] → fix the call site's translator type (never add a cast wrapper); fallback is a single, documented cast inside `FormField`.
- [jscpd clone] → every repeated block was extracted; new message blocks are < 10 lines; run `npm run dupl` after the course gate and at the end.
- [zod `.pipe` / `.optional()` typing with `zodResolver` and the union `FormValues`] → follow the existing `as FormValues` / `FieldPath` casts; verify with `npx tsc --noEmit`; fallback for `.pipe` is `superRefine` with the same messages.
- [Whitespace-only values are now omitted at the `media_url` / `image_file_id` / `preview_video_file_id` sites] → documented behaviour note; the BE meaning of an omitted `image_file_id` on update is not verified in this repo and is deliberately not changed.
- [The BE contract is verified from docs and Go sources, not by running the BE (the BE branch is unpushed)] → e2e uses the fixture; manual verification against a local BE is task 11.7 and the FE must ship after the BE.
- [`generateSlug`/`slugifyName` have an undiscovered consumer] → re-grep in tasks 7.5 and 8.32; keep both functions if one appears.
- [e2e admin permission names unknown] → read `src/constants/permissions`, `admin-items.ts`, and the permission gate in task 9.1.
- [Caret jumps / IME while filtering on `onChange`] → inherited from `SlugInput` (idempotent sanitizer); verify paste and Vietnamese Telex manually on the node input.
- [A persisted node with a legacy blank slug blocks the whole save] → accepted: the BE rejects it too, and the error points at the node.
- [GitNexus index stale and zero callers] → refresh first (6.1); grep-confirmed callers are in the inventory.
- [Docs drift] → `docs-update-inventory.md` is re-verified against the final code in task 10.22.

## Migration Plan

Frontend only; no data migration and no flag. Ship after the backend `unify-taxonomy-slug-management` is deployed: against an older backend a manually sent slug would be ignored or rejected. The FE is forward-compatible with the new BE even before any user edits a slug (nothing is sent unless the user types one). Rollback is a revert of the change.

## Open Questions

None that change specs, approach, or tasks. Deferred (explicitly out of scope): manual verification against a running BE once its branch is pushed (task 11.7); instructor slug; the optional mutation-runner extraction (`useToastedMutation`), the hand-rolled course delete dialog, the shared zod uuid/email/required-string helpers, and diacritic-folding consolidation — each is a separate change with its own tests.
