# Code Change Inventory

Companion to `design.md` (the design also summarises every item here per file; this file carries the exact "after" code and call sites). Frontend only (`fe-mycourse`); do not touch `be-mycourse`. Line numbers are from `HEAD c5153b1` and must be re-located by symbol/quote at implementation time. Each item has: **what changes** (ADD / MODIFY / DELETE / MOVE), **call sites** (grep-confirmed), **reused resource** (why nothing new is created), **tests**, **docs** (IDs in `docs-update-inventory.md`).

GitNexus note: `gitnexus_impact` (upstream) returned `impactedCount: 0` / `risk: UNKNOWN` for every symbol at index `35a818a` because JSX and hook-call edges are not indexed (graph gap, not proof of no callers). `gitnexus_context` and `grep` supply the caller lists below; task 6.2 re-runs impact after `npx gitnexus analyze` (6.1) and records the result before the first edit.

## 0. Codebase-wide capability audit result (decisions that drive this inventory)

Four read-only audits ran over all of `src/`, `e2e/`, `scripts/` (GitNexus → docs → source), one per capability family; the full evidence is in `design.md` §"Codebase-wide capability audit". Verdicts used below:

| ID | Capability | Verdict | Shared module (owner/name) |
|---|---|---|---|
| CAP-1 | "Include an optional string/id in a write payload only when non-blank [and different from persisted]" — 6 inline copies in 4 files | MERGE | `src/lib/utils/payload.ts` |
| CAP-2 | Slug zod rule — private in course schema | MERGE | `src/schema/shared/slug.ts` |
| CAP-3 | "Server adjusted the submitted slug" predicate — inline in course editor | MERGE | `src/lib/utils/slug.ts` → `isSlugAdjusted` |
| CAP-4 | 409/3007 recommended-slug suggestion state machine — private in `useCourseCreateFlow` | MERGE | `src/hooks/slug/use-slug-conflict-flow.ts` |
| CAP-5 | Stacked recommended-slug confirm JSX — inline in `courses/page.tsx` | MERGE | `src/components/shared/slug-conflict-confirm-dialog.tsx` |
| CAP-6 | Labelled form control block (`div.space-y-2 > RequiredLabel + control + hint + FieldError`) — 6 identical blocks in 3 files + slug | MERGE | `src/components/shared/form-field.tsx` (+ `slug-field.tsx`) |
| CAP-7 | Inline field error `<p>` — `AuthFieldError` is a byte-identical copy of shared `FieldError` | MERGE | existing `src/components/shared/field-error.tsx` |
| CAP-8 | Validation-message resolver — `resolveAuthValidationMessage` duplicates `resolveValidationMessage` (+ 8 `as unknown as` casts) | MERGE | existing `src/lib/utils/validation-message.ts`, made generic |
| CAP-9 | Nested-node traversal (`count`, `max depth`, `find by id`, `find path`, `walk`) — 5 copies in 4 files, none generic | MERGE | `src/lib/utils/tree.ts` |
| CAP-10 | `RequiredLabel`-vs-`Label` branch in `ImageFileField` | MERGE (micro) | existing `RequiredLabel` |
| CAP-11 | Taxonomy name/short-description length literals duplicated between schema and inputs | MERGE (intra-feature) | `src/constants/taxonomy/limits.ts` |
| CAP-12 | Tree editor owned by `components/shared` but taxonomy-only (imports taxonomy util/type, one consumer) | MOVE | `src/components/features/taxonomy/` |

Examined and deliberately **kept separate** (different semantics or outside this change's capability; reasons in `design.md`): `compact*Translations` (locale-level strip), instructor `toSubmitPayload` (`null` = clear), kind-union sub-lesson body, `toTaxonomyTreeWritePayload` structural projection, course outline helpers (typed levels, `stable_id`, leases), `filterPermissionNavTree`, dagre **layout**, menu renderers, `SortableList`, `slugifyKey`, `normalize*` search keys, `queryCacheKey`, instructor `Field`, DeltaEditor/ImageFileField controls, review/approval textarea blocks (no wrapper `div`, different layout), `classifyApiError`, auth result-code branching, optimistic-lock policy (toast only), `finalizeBulkUserPickerSubmit`, the 22 mutation-runner handlers (separate change), hand-rolled course delete dialog (separate change), zod uuid/email/required-string helpers (not a slug capability), diacritic folding in `search-text.ts`.

New sibling-feature import edges introduced by this change: **none**. Every shared module lives in a neutral directory (`src/lib/utils`, `src/schema/shared`, `src/hooks/slug`, `src/components/shared`); `components/features/taxonomy` imports no `course`/`instructor` code; `lib/utils/taxonomy` imports no `lib/utils/course`.

## 1. Reuse ledger (resources reused as-is, never re-implemented)

| Resource | Path | Used for |
|---|---|---|
| `SlugInput` | `src/components/shared/slug-input.tsx` | `SlugField`, node inline slug input |
| `sanitizeSlugInput`, `SLUG_PATTERN`, `SLUG_MAX_LENGTH` | `src/lib/utils/slug.ts` | filtering and the format rule (via the shared zod fields) |
| `extractRecommendedSlug`, `toastApiError` | `src/lib/utils/api-error.ts` | 3007 handling inside `useSlugConflictFlow` |
| `ApiErrorCode.SlugAlreadyExists`, `errors.codes.3007` | `src/constants/api-error-code.ts`, `src/messages/error-codes.ts` | already present |
| `ConfirmActionDialog` (`stacked`) | `src/components/shared/confirm-action-dialog.tsx` | rendered by `SlugConflictConfirmDialog` |
| `RequiredLabel`, `FieldError` | `src/components/shared/required-label.tsx`, `field-error.tsx` | `FormField`, auth fields, node error line |
| `Button` (`ghost`, `icon-sm`), `Input`, `Label`, lucide `Pencil` / `Check` | `src/components/ui/*`, `lucide-react` | node slug toggle (`Pencil` already used in `media-item-card.tsx`) |
| `resolveValidationMessage` | `src/lib/utils/validation-message.ts` | zod `validation.*` keys under any parent namespace |
| `persistTaxonomyForm`, `createTaxonomyService`, `updateTaxonomyService` | `form-submit.ts`, `src/api/callers/taxonomy/*` | already return the saved entity (service level) |
| `getPersistedTaxonomySlug`, `getTaxonomyTreeFromEntity`, `newV7`, `TAXONOMY_TREE_INDENT_PX` | `form-helpers.ts`, `resource.ts`, `src/lib/utils/uuid.ts` | baseline, new node ids, indent |
| `SortableList` | `src/components/shared/sortable-list.tsx` | unchanged; drag handle only (inputs inside rows are safe) |
| `renderWithProviders`, `server` (MSW), `jest.setup.ts` polyfills | `src/test-support/*` | component and hook tests |
| `resetFixtures`, `FIXTURE_USERS`, `json`, `envelope`, `readBody`, `TAKEN_SLUG*`, `resetState` | `e2e/support/fixture-client.ts`, `e2e/fixtures/server.mjs` | e2e |
| BE contract | `be-mycourse/docs/api_swagger.yaml`, `docs/curl_api.md`, `handler_helpers.go:134-138` | 409/3007 create only; update/tree collisions auto-resolved; blank on update/existing node is 400 |

## A. New shared primitives

### A1. `src/lib/utils/payload.ts` — ADD (CAP-1)

```ts
/** Value unchanged when it has non-whitespace content, else `undefined`. */
export function omitWhenBlank(value: string | null | undefined): string | undefined {
  return value && value.trim() !== "" ? value : undefined;
}

/** Trimmed value when non-blank and different from `persisted`, else `undefined` (create: `persisted = ""`). */
export function changedNonBlank(value: string, persisted = ""): string | undefined {
  const trimmed = value.trim();
  return trimmed !== "" && trimmed !== persisted ? trimmed : undefined;
}

/** `{ [key]: value }` when defined, else `{}`; spread into a payload literal so an omitted key stays absent. */
export function payloadField<K extends string>(
  key: K,
  value: string | undefined,
): { [P in K]?: string } {
  return value === undefined ? {} : ({ [key]: value } as { [P in K]?: string });
}
```
- Pure "should this key be present" rules; they do not encode what an omitted key means to the BE (create: generate; update: keep) — callers keep that meaning.
- Not exported from the `@/lib/utils` barrel (consumers import `@/lib/utils/payload`, like `slug.ts`).
- Consumers (all MODIFY below): `src/lib/utils/course.ts` (B2), `src/lib/utils/taxonomy/form-submit.ts` (E5), `src/lib/utils/taxonomy/resource.ts` (E3), `src/hooks/course/use-course-editor-state.ts` (B3).
- Behaviour note: whitespace-only values are now treated as blank at the `media_url`, `image_file_id`, `preview_video_file_id` sites (previously only `""` was omitted); whitespace-only ids/urls are never valid, and a blank slug on update is already blocked by `courseBasicInfoSchema` (`slugRequired`) / the taxonomy edit schema before the builders run.
- Tests: new `src/lib/utils/payload.test.ts` — `omitWhenBlank` (`undefined`, `null`, `""`, `"   "`, non-blank returned unchanged incl. surrounding spaces); `changedNonBlank` (blank, equal persisted, changed, trimmed result, default persisted); `payloadField` (defined, undefined, `"slug" in result === false`).
- Docs: PAY-*, RA-* (new asset), FS-* (utils tree).

### A2. `src/lib/utils/tree.ts` — ADD (CAP-9)

```ts
export type TreeNodeLike<T> = { id: string; children?: T[] };
export type TreeVisitContext<T> = { depth: number; parent: T | null; index: number };

/** Pre-order depth-first walk; root nodes have depth 0. */
export function walkTree<T extends TreeNodeLike<T>>(
  nodes: readonly T[] | undefined,
  visit: (node: T, context: TreeVisitContext<T>) => void,
  parent: T | null = null,
  depth = 0,
): void;

export function flattenTree<T extends TreeNodeLike<T>>(nodes: readonly T[] | undefined): T[];
export function countTreeNodes<T extends TreeNodeLike<T>>(nodes: readonly T[] | undefined): number;
/** Roots = 0; empty tree = 0 (preserves `getTaxonomyTreeMaxDepth`). */
export function getTreeMaxDepth<T extends TreeNodeLike<T>>(nodes: readonly T[] | undefined): number;
/** Ancestor chain down to (and including) the first node matching `predicate`, else `null`. */
export function findTreePath<T extends TreeNodeLike<T>>(
  nodes: readonly T[] | undefined,
  predicate: (node: T) => boolean,
): T[] | null;
export function findTreeNodeById<T extends TreeNodeLike<T>>(nodes: readonly T[] | undefined, id: string): T | null;
/** Immutable update of the node with `id` at any depth; returns the same array when `id` is absent. */
export function updateTreeNode<T extends TreeNodeLike<T>>(nodes: T[], id: string, patch: (node: T) => T): T[];
```
- Pure TypeScript, no feature imports; every taxonomy-semantic rule stays in `src/lib/utils/taxonomy/`.
- Consumers: `resource.ts` (E3: `flattenTree`), `taxonomy-tree-view-button.tsx` (E3: `countTreeNodes` replaces `countTaxonomyTreeNodes` at lines 16 and 39), `taxonomy-form-dialog.tsx` (F1: `getTreeMaxDepth`), `dashboard-page-header.ts` (D1: `findTreeNodeById`, `findTreePath`), `dagre-tree.ts` (D2: `walkTree`), `taxonomy-tree-editor.tsx` (F2: `updateTreeNode`).
- Tests: new `src/lib/utils/tree.test.ts` (empty/`undefined`, single, nested pre-order, `depth`/`parent`/`index` context, count, max depth, find path/by id incl. not found, `updateTreeNode` structural sharing and no input mutation, not-found returns same array).
- Docs: TREE-*, RA-* (new asset), FS-* (utils tree), MOD-*.

### A3. `src/lib/utils/slug.ts` — MODIFY (CAP-3)

- **ADD** `export function isSlugAdjusted(sentSlug: string | undefined, savedSlug: string): boolean { return sentSlug !== undefined && sentSlug !== savedSlug; }`.
- **DELETE** `generateSlug` (lines 5-17) and `slugifyName` (lines 19-21) — executed in task 8.32 after both preview consumers are gone (re-grep in 7.5 and 8.32). Consumers (grep over `src/ e2e/ scripts/`): `src/components/shared/sortable-tree-editor.tsx:7,101` (removed by F2), `src/lib/utils/taxonomy/form-helpers.ts:2,188` (removed by E4), barrel `src/lib/utils/index.ts:98`, `src/lib/utils/slug.test.ts:3,54-56`. Re-grep immediately before deleting; if any other consumer exists keep both.
- **MODIFY** the doc comment of `sanitizeSlugInput` (line 31 "Unlike `generateSlug` it keeps dashes…") so it no longer names the deleted function.
- **KEEP** `SLUG_MAX_LENGTH`, `SLUG_PATTERN`, `sanitizeSlugInput`.
- `src/lib/utils/index.ts:98` `export { generateSlug, slugifyName } from "./slug";` — **DELETE**.
- `src/lib/utils/slug.test.ts` — **DELETE** the `generateSlug` import and the `describe("generateSlug (taxonomy preview, unchanged)")` block; **ADD** `describe("isSlugAdjusted")` (undefined sent → false; equal → false; different → true). Existing `sanitizeSlugInput` / `SLUG_PATTERN` cases untouched.
- Consumers of `isSlugAdjusted`: `use-course-editor-state.ts` (B3), `form-submit.ts` `getTaxonomySaveSlugNotice` (E5).

### A4. `src/schema/shared/slug.ts` — ADD; `src/schema/shared/index.ts` — ADD; `src/schema/index.ts` — MODIFY (CAP-2)

```ts
import { z } from "zod";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/utils/slug";

const slugFormatField = (allowEmpty: boolean) =>
  z
    .string()
    .max(SLUG_MAX_LENGTH, { message: "validation.slugMax" })
    .refine((value) => (allowEmpty && value === "") || SLUG_PATTERN.test(value), {
      message: "validation.slugInvalid",
    });

/** Blank allowed (BE generates it); otherwise `SLUG_PATTERN` + max length. */
export const optionalSlugField = slugFormatField(true);

/** Blank rejected first with `validation.slugRequired`, then format + length. */
export const requiredSlugField = z
  .string()
  .min(1, { message: "validation.slugRequired" })
  .pipe(slugFormatField(false));
```
- `src/schema/shared/index.ts`: `export * from "./slug";`; `src/schema/index.ts`: add `export * from "./shared";` between `./media` and `./taxonomy`.
- Import rule: consumers use `@/schema/shared` (not the root barrel). MOVE of the private course helper — it must not exist twice after B1.
- Tests: no pattern table here (the course cases `course.test.ts:30-88` keep exercising the moved code); taxonomy wiring cases in E2.

### A5. `src/lib/utils/validation-message.ts` — MODIFY (CAP-8)

```ts
export function resolveValidationMessage(
  // `never` key: accepts any next-intl scoped translator (typed key unions)
  // as well as a plain `(key: string) => string`, without call-site casts.
  t: (key: never) => string,
  message: string | undefined,
): string {
  if (!message) return "";
  return t(message as never);
}
```
- **DELETE** the redundant inner `const translate = t as (key: string) => string;`. `firstValidationMessageKey`, `translateValidationIssueMessage`, `toastValidationError` unchanged.
- Call sites that drop their cast (grep): `course-editor-basic-tab.tsx:142,177,208,243,364,405` (`tCourse as unknown as (key: string) => string`), `taxonomy-form-dialog.tsx:413,439` (`tForm as (key: string) => string`), plus the auth callers in D3. If `tsc` rejects a call site's translator type, fix the call site by passing the typed translator (never by re-adding a cast wrapper).
- Tests: new `src/lib/utils/validation-message.test.ts` — empty/undefined → `""`; key passthrough; `firstValidationMessageKey` prefix strip and fallback; `translateValidationIssueMessage`; `toastValidationError` with mocked `sonner`.

### A6. `src/constants/taxonomy/limits.ts` — ADD (CAP-11)

```ts
/** Mirrors the BE canonical name limit; schema `.max()` and UI `maxLength` share it. */
export const TAXONOMY_NAME_MAX_LENGTH = 255;
/** Mirrors the BE outcome short-description limit. */
export const TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH = 100;
```
- Numbers only (`src/constants/**` forbids functions/types). Consumers: `src/schema/taxonomy/taxonomy.ts:9` (`.max(255, …nameMax)`) and `:29` (`.max(100, …shortDescriptionMax)`), `taxonomy-form-dialog.tsx:401` (`maxLength={100}`) and `:429` (`maxLength={255}`), `sortable-tree-editor.tsx:83` (`maxLength={255}`, now in F2).
- Tests: `taxonomy.test.ts` already covers 256-char name; add a 101-char short-description case if missing.

## B. Course migration onto the shared primitives (behaviour unchanged)

### B1. `src/schema/course/course.ts` — MODIFY
- **DELETE** the `SLUG_MAX_LENGTH, SLUG_PATTERN` import (line 6) and `slugFormatField` (lines 16-25); **ADD** `import { optionalSlugField, requiredSlugField } from "@/schema/shared";`.
- Line 32 `slug: slugFormatField(true),` → `slug: optionalSlugField,`; lines 37-40 → `slug: requiredSlugField,`.
- Callers (signatures unchanged): `use-course-create-flow.ts:10,39`, `use-course-editor-state.ts` (`courseBasicInfoSchema.safeParse`), `lib/utils/course.ts` (`validateCourseSubmitReadiness`), `course-editor-basic-tab.tsx` (resolver). Tests: `course.test.ts` unchanged.

### B2. `src/lib/utils/course.ts` — MODIFY
After (only the two payload builders change):
```ts
export function toUpdateCourseBasicInfoPayload(
  basicInfo: CourseBasicInfoForm,
  persistedSlug: string,
): UpdateCourseBasicInfoPayload {
  return {
    expected_row_version: basicInfo.expected_row_version,
    title: basicInfo.title.trim(),
    short_description: basicInfo.short_description.trim(),
    about_course: basicInfo.about_course.trim(),
    thumbnail_file_id: basicInfo.thumbnail_file_id,
    course_level_id: basicInfo.course_level_id,
    course_topic_id: basicInfo.course_topic_id,
    tag_ids: basicInfo.tag_ids,
    skill_ids: basicInfo.skill_ids,
    outcome_ids: basicInfo.outcome_ids,
    ...payloadField("preview_video_file_id", omitWhenBlank(basicInfo.preview_video_file_id)),
    ...payloadField("slug", changedNonBlank(basicInfo.slug, persistedSlug)),
  };
}

export function toCreateCoursePayload(title: string, slug: string): CreateCoursePayload {
  return { title: title.trim(), ...payloadField("slug", changedNonBlank(slug)) };
}
```
- **DELETE** the inline `if (basicInfo.preview_video_file_id) …` (lines 89-91), `const slug = basicInfo.slug.trim(); if (slug !== persistedSlug) …` (92-95) and `const trimmedSlug … if (trimmedSlug) …` (104-107). **ADD** import `{ changedNonBlank, omitWhenBlank, payloadField } from "@/lib/utils/payload"`.
- Callers: `use-course-editor-state.ts:385-388` (update), `use-course-create-flow.ts:51` (create), `lib/utils/course.test.ts` (8 cases must pass unchanged). Public signatures unchanged.

### B3. `src/hooks/course/use-course-editor-state.ts` — MODIFY (file ~675/700 `max-lines`; net ≤ 0)
- Line 398 `if (payload.slug !== undefined && payload.slug !== savedSlug) {` → `if (isSlugAdjusted(payload.slug, savedSlug)) {`; **ADD** import `isSlugAdjusted` from `@/lib/utils/slug`.
- Sub-lesson payload (lines ~590-596): `media_url: subLessonForm.video_url || undefined,` → `...payloadField("media_url", omitWhenBlank(subLessonForm.video_url)),` inside the `video` object; **ADD** import `{ omitWhenBlank, payloadField } from "@/lib/utils/payload"`.
- **KEEP** the rest of `handleSaveBasicInfo` (it mutates SWR and form state; taxonomy closes its dialog — not shareable, see design).
- Verify with `npx eslint src/hooks/course/use-course-editor-state.ts` (`max-lines`).

### B4. `src/hooks/course/use-course-create-flow.ts` — MODIFY (thin wrapper; return shape identical)
```ts
export function useCourseCreateFlow({ onCreated }: UseCourseCreateFlowParams) {
  const t = useTranslations("course.list");
  const tValidation = useTranslations("course.validation");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const clearForm = () => { setTitle(""); setSlug(""); };

  const flow = useSlugConflictFlow({
    slug,
    setSlug,
    prepare: (nextSlug) => {
      const parsed = courseCreateSchema.safeParse({ title: title.trim(), slug: nextSlug.trim() });
      if (!parsed.success) {
        toastValidationError(tValidation, parsed.error.issues, "title");
        return null;
      }
      return toCreateCoursePayload(title, nextSlug);
    },
    request: createCourseService,
    onSuccess: async (created) => {
      toast.success(t("toast.created"));
      clearForm();
      await onCreated(created);
    },
  });

  return {
    title, setTitle, slug, setSlug,
    isSubmitting: flow.isSubmitting,
    suggestedSlug: flow.suggestedSlug,
    submit: flow.submit,
    acceptSuggestion: flow.acceptSuggestion,
    dismissSuggestion: flow.dismissSuggestion,
    reset: () => { clearForm(); flow.dismissSuggestion(); },
  };
}
```
- **DELETE** local `isSubmitting`/`suggestedSlug` state, the `try/catch` with `extractRecommendedSlug`/`toastApiError`, the `acceptSuggestion`/`dismissSuggestion` bodies and the imports `extractRecommendedSlug`, `toastApiError`, `useTranslations("errors.codes")`.
- Consumers (API unchanged): `src/screen/instructor/courses/page.tsx:40-46`, `src/hooks/course/index.ts`, `use-course-create-flow.test.tsx` (8 cases unchanged).

### B5. `src/screen/instructor/courses/page.tsx` — MODIFY
- Lines 207-216 (title block `div.space-y-2 > RequiredLabel htmlFor="course-title" + Input`) → `<FormField id="course-title" label={t("createDialog.titleLabel")}><Input id="course-title" value={create.title} onChange={(event) => create.setTitle(event.target.value)} /></FormField>`.
- Lines 217-230 (slug block) → `<SlugField id="course-slug" required={false} label={t("createDialog.slugLabel")} placeholder={t("createDialog.slugPlaceholder")} hint={t("createDialog.slugHint")} value={create.slug} onValueChange={create.setSlug} />`.
- Lines 251-268 (`ConfirmActionDialog stacked …`) → `<SlugConflictConfirmDialog suggestedSlug={create.suggestedSlug} isSubmitting={create.isSubmitting} onAccept={create.acceptSuggestion} onDismiss={create.dismissSuggestion} labels={{ title: t("createDialog.slugConflictTitle"), description: t("createDialog.slugConflictDescription", { slug: create.suggestedSlug ?? "" }), confirm: t("createDialog.slugConflictConfirm"), cancel: t("createDialog.slugConflictCancel"), loading: t("createDialog.creating") }} />`.
- **DELETE** imports no longer used (`RequiredLabel`, `SlugInput`; `ConfirmActionDialog` only if the delete dialog at lines 272-305 does not use it — it is a hand-rolled `Dialog`, so verify by grep). **KEEP** the hand-rolled delete dialog (out of this capability; design §"kept separate").
- DOM ids unchanged (`#course-title`, `#course-slug`) so `e2e/tests/course-slug.spec.ts` selectors still match.

### B6. `src/components/features/course/course-editor-basic-tab.tsx` — MODIFY
- Title (`:120-150`), slug (`:151-184`), short_description (`:185-216`) `Controller` render bodies → `FormField`/`SlugField`. Example slug: `<SlugField id="course-basic-slug" label={t("slugLabel")} name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value} disabled={!editable} placeholder={t("slugPlaceholder")} hint={t("slugHint")} error={fieldState.error} errorMessage={resolveValidationMessage(tCourse, fieldState.error?.message)} onValueChange={(value) => { field.onChange(value); setBasicInfo((prev) => ({ ...prev, slug: value })); }} />`; title/short_description: `<FormField id="course-basic-title" label={t("titleLabel")} error={fieldState.error} errorMessage={resolveValidationMessage(tCourse, fieldState.error?.message)}><Input {...field} id="course-basic-title" disabled={!editable} onChange={…} /></FormField>`.
- Remaining `resolveValidationMessage(tCourse as unknown as (key: string) => string, …)` calls at `:243` (about_course `FieldError`), `:364`, `:405` → drop the cast (A5). **KEEP** `DeltaEditor`, `ImageFileField`, selects/panels (own control semantics).
- **DELETE** imports no longer used (`RequiredLabel`, `SlugInput`, possibly `FieldError`; keep it if the DeltaEditor/select blocks still use it — verify with grep, Biome `noUnusedImports`). DOM ids unchanged.

## C. Shared hook and components (new)

### C1. `src/hooks/slug/use-slug-conflict-flow.ts` — ADD; `src/hooks/slug/index.ts` — ADD; `src/hooks/index.ts` — MODIFY (CAP-4)

```ts
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { extractRecommendedSlug, toastApiError } from "@/lib/utils/api-error";

export type UseSlugConflictFlowParams<TPayload, TResult> = {
  /** Current slug text owned by the caller (local state or an RHF value). */
  slug: string;
  /** Writes the accepted recommended slug back into the caller's field. */
  setSlug: (slug: string) => void;
  /** Validates and builds the payload for `slug`; return `null` after surfacing feedback to skip the request. */
  prepare: (slug: string) => TPayload | null;
  request: (payload: TPayload) => Promise<TResult>;
  onSuccess: (result: TResult) => void | Promise<void>;
};

export function useSlugConflictFlow<TPayload, TResult>({ slug, setSlug, prepare, request, onSuccess }: UseSlugConflictFlowParams<TPayload, TResult>) {
  const tErrors = useTranslations("errors.codes");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedSlug, setSuggestedSlug] = useState<string | null>(null);

  const submit = async (slugOverride?: string) => {
    const payload = prepare(slugOverride ?? slug);
    if (payload === null) { setSuggestedSlug(null); return; }
    setIsSubmitting(true);
    try {
      const result = await request(payload);
      setSuggestedSlug(null);
      await onSuccess(result);
    } catch (error) {
      const recommendedSlug = extractRecommendedSlug(error);
      if (recommendedSlug) { setSuggestedSlug(recommendedSlug); }
      else { setSuggestedSlug(null); toastApiError(tErrors, error); }
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptSuggestion = async () => {
    if (!suggestedSlug) return;
    setSlug(suggestedSlug);
    await submit(suggestedSlug);
  };

  const dismissSuggestion = () => setSuggestedSlug(null);

  return { isSubmitting, suggestedSlug, submit, acceptSuggestion, dismissSuggestion };
}
```
- `src/hooks/slug/index.ts`: `export * from "./use-slug-conflict-flow";`; `src/hooks/index.ts`: add `export * from "./slug";` after `export * from "./quill";`.
- Consumers: `use-course-create-flow.ts` (B4), `taxonomy-form-dialog.tsx` (F1). Neutral directory, imports only `@/lib/utils/api-error`.
- Tests: `use-slug-conflict-flow.test.tsx` (injected `prepare`/`request`, no MSW): prepare `null` skips the request and clears the suggestion; success calls `onSuccess` and clears; 3007 + recommended → `suggestedSlug`; accept calls `setSlug` and resubmits with the recommended slug; repeated 3007 replaces the suggestion; dismiss clears with no request; non-3007 clears and toasts. The 4 pure state-machine cases in `use-course-create-flow.test.tsx` stay (they are integration coverage of the wrapper).

### C2. `src/components/shared/slug-conflict-confirm-dialog.tsx` — ADD (CAP-5)
```tsx
export type SlugConflictConfirmDialogProps = {
  suggestedSlug: string | null;
  isSubmitting: boolean;
  onAccept: () => void | Promise<void>;
  onDismiss: () => void;
  labels: { title: string; description: string; confirm: string; cancel: string; loading: string };
};
```
Body: `<ConfirmActionDialog stacked open={suggestedSlug !== null} onOpenChange={(open) => { if (!open) onDismiss(); }} onConfirm={onAccept} title={labels.title} description={labels.description} confirmLabel={labels.confirm} cancelLabel={labels.cancel} isLoading={isSubmitting} loadingLabel={labels.loading} />` (MOVED from `page.tsx:251-268`). The `{slug}` interpolation stays with the caller (namespaces differ per domain). Consumers: `page.tsx` (B5), `taxonomy-form-dialog.tsx` (F1). Tests: `slug-conflict-confirm-dialog.test.tsx`.

### C3. `src/components/shared/form-field.tsx` — ADD (CAP-6)
```tsx
export type FormFieldProps = {
  /** Control id; becomes the label `htmlFor`. */
  id: string;
  label: ReactNode;
  /** Shows the required marker (default true, like `RequiredLabel`). */
  required?: boolean;
  hint?: ReactNode;
  error?: FieldErrorType;      // react-hook-form FieldError
  errorMessage?: string;
  children: ReactNode;         // the control (Input, SlugInput, …)
};
// <div className="space-y-2">
//   <RequiredLabel htmlFor={id} required={required}>{label}</RequiredLabel>
//   {children}
//   {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
//   <FieldError error={error} message={errorMessage ?? ""} />
// </div>
```
- Produces exactly the DOM of the six existing blocks (course basic tab title/slug/short_description, courses page title/slug, taxonomy name/short_description), so e2e selectors and styling are preserved.
- Not used for: DeltaEditor (own label), ImageFileField (preview/browse), selects/panels, the duration composite, the review/approval/ticket textarea blocks (no wrapper `div`; different layout), instructor `Field` (non-RHF string error, scroll anchor, ring styling) — kept separate.
- Tests: `form-field.test.tsx` (label `htmlFor` association, required marker toggle, hint, error line only with an error, children rendered).

### C4. `src/components/shared/slug-field.tsx` — ADD
```tsx
export type SlugFieldProps = Omit<SlugInputProps, "id"> &
  Omit<FormFieldProps, "children"> ;
// SlugField = <FormField id label required hint error errorMessage><SlugInput id {...rest} /></FormField>
```
`name`/`ref`/`onBlur`/`disabled`/`placeholder`/`value`/`onValueChange` pass through to `SlugInput` (React 19 ref-as-prop, same as `course-editor-basic-tab.tsx:162`). Consumers: `page.tsx` (B5), `course-editor-basic-tab.tsx` (B6), `taxonomy-form-dialog.tsx` (F1). Tests: `slug-field.test.tsx` (passthrough + filtering via the real `SlugInput`).

### C5. `src/components/shared/index.ts` — MODIFY
Add (alphabetical): `export * from "./form-field";` after the `./delta-editor` block; `export * from "./slug-conflict-confirm-dialog";` and `export * from "./slug-field";` before `./slug-input`; **DELETE** `export * from "./sortable-tree-editor";` (F2). `field-error` and `required-label` are imported by path today and stay that way.

## D. Cross-feature refactors found by the audit

### D1. `src/lib/navigation/dashboard-page-header.ts` — MODIFY (CAP-9)
- **DELETE** `findDashboardItemById` (lines 39-58) and `findDashboardItemPathByHref` (lines 61-83).
- Call sites (both file-private): line ~119 `findDashboardItemById(items, breadcrumb.itemId)` → `findTreeNodeById(items, breadcrumb.itemId)`; line ~172 `findDashboardItemPathByHref(items, breadcrumbHref)` → `findTreePath(items, (item) => item.href === breadcrumbHref)`. Behaviour preserved: first match in pre-order, returns the ancestor chain including the node.
- **ADD** import `{ findTreeNodeById, findTreePath } from "@/lib/utils/tree"`. `DashboardItem` (`@/types/dashboard`) has `id` and `children?: DashboardItem[]` (structurally a `TreeNodeLike`).
- Tests: add a breadcrumb test next to the file (explicit breadcrumb by item id; path by href; not found → role root only) — none exists today, so the replacement is protected before the refactor (write the test first against the old code).

### D2. `src/lib/utils/dagre-tree.ts` — MODIFY (CAP-9; layout stays local)
```ts
export function treeToFlowElements(root: DagreTreeRoot, direction: DagreTreeLayoutDirection = "vertical") {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  walkTree([root], (node, { parent }) => {
    nodes.push({ id: node.id, data: { label: node.name }, position: { x: 0, y: 0 } });
    if (parent) {
      edges.push({ id: `${parent.id}-${node.id}`, source: parent.id, target: node.id, type: "smoothstep" });
    }
  });
  return getLayoutedElements(nodes, edges, direction);
}
```
- **DELETE** the local `walkTree` (lines 16-40); **ADD** import `walkTree` from `@/lib/utils/tree`. `getLayoutedElements`, `DagreTreeRoot`, constants unchanged. Consumers: `dagre-tree-dialog.tsx:61`.
- Tests: add `dagre-tree.test.ts` for `treeToFlowElements` node/edge ids and order (assert on the pre-layout shape via `getLayoutedElements` mock or compare ids/edges, positions ignored).

### D3. `src/components/common/auth-menu/auth/auth-form-fields.tsx` — MODIFY (CAP-7, CAP-8)
- **DELETE** `AuthValidationMessageKey` and `resolveAuthValidationMessage` (lines 13-26) and `AuthFieldError` + `AuthFieldErrorProps` (lines 34-42).
- **ADD** imports `{ FieldError } from "@/components/shared/field-error"` (same direction as `header.tsx:5` importing `@/components/shared`) and `{ resolveValidationMessage } from "@/lib/utils/validation-message"`.
- Call sites: `resolveAuthValidationMessage(t, error?.message)` at lines 56, 139, 167 → `resolveValidationMessage(t, error?.message)`; `<AuthFieldError error={error} message={errorMessage} />` at lines 70, 154, 187 → `<FieldError … />` (identical `<p className="text-xs text-destructive px-1">`).
- Consumers of `auth-form-fields` unchanged (`AuthEmailField`, `AuthFullNameField`, `AuthPasswordField`, `AuthEmailPasswordFields`). Tests: existing auth component/e2e tests (`auth.spec.ts`) must pass; add `auth-form-fields.test.tsx` only if no existing test renders these fields (check first).

### D4. `src/components/shared/image-file-field.tsx` — MODIFY (CAP-10)
- Lines 44-48 `{required ? <RequiredLabel>{label}</RequiredLabel> : <Label>{label}</Label>}` → `<RequiredLabel required={required}>{label}</RequiredLabel>`; **DELETE** `import { Label } from "@/components/ui/label"` (line 8). DOM identical (`RequiredLabel` with `required={false}` renders the plain `Label` with the same children).
- Consumers unchanged (`course-editor-basic-tab.tsx`, `taxonomy-form-dialog.tsx`).

## E. Taxonomy types, schema, helpers

### E1. `src/types/taxonomy/index.ts` — MODIFY (type-only file)
- `TaxonomyTreeNode.slug` comment (lines 21-22) → "Present on API responses. Send on create/update only when the user supplied or changed it; omitted slugs are preserved by node id (existing) or generated (new)."
- `CreateSlugStatusPayload` (134-138) and `UpdateSlugStatusPayload` (140-145): **ADD** `slug?: string;` (`CreateTopicPayload`/`CreateSkillPayload` inherit it).
- `UpdateTopicPayload` (152-159) → `UpdateSlugStatusPayload & { image_file_id?: string; child_topics?: TaxonomyTreeNode[] }`; `UpdateSkillPayload` (165-171) → `UpdateSlugStatusPayload & { children?: TaxonomyTreeNode[] }` (removes four duplicated fields each).
- **ADD** `export type TaxonomySlugBaseline = { slug: string; treeSlugs: ReadonlyMap<string, string> };`
- **KEEP** outcome payload types (no slug), `CreateTaxonomyPayloadMap`, `UpdateTaxonomyPayloadMap`.

### E2. `src/schema/taxonomy/taxonomy.ts` — MODIFY; `taxonomy.test.ts` — MODIFY
- Imports: **ADD** `{ optionalSlugField, requiredSlugField } from "@/schema/shared"`, `{ TAXONOMY_NAME_MAX_LENGTH, TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH } from "@/constants/taxonomy/limits"`.
- `taxonomyNameField` `.max(255, …)` → `.max(TAXONOMY_NAME_MAX_LENGTH, …)`; outcome `short_description` `.max(100, …)` → `.max(TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH, …)`.
- `taxonomySlugStatusSchema`: **ADD** `slug: optionalSlugField.optional(),` (optional so existing callers/tests that omit it stay valid; topic and skill schemas `.extend` it; `taxonomyOutcomeSchema` unchanged).
- **ADD** `getTaxonomyFormSchema(resourceKey: TaxonomyResourceKey, mode: "create" | "edit")` — MOVE of the resource→schema selection currently inline in `taxonomy-form-dialog.tsx:117-122`; for `mode === "edit"` and non-outcome resources return the schema `.extend({ slug: requiredSlugField })`.
- Tests: slug omitted valid; blank valid on create; `abc---123` valid; `-abc` / `ABC` / `a_b` invalid; `a`×256 → `validation.slugMax`; edit schema blank → `validation.slugRequired`; topic/skill inherit; outcomes unaffected.

### E3. `src/lib/utils/taxonomy/resource.ts` — MODIFY
- **DELETE** `countTaxonomyTreeNodes` (lines 88-99); caller `taxonomy-tree-view-button.tsx:16,39` → `countTreeNodes(getTaxonomyTreeFromEntity(resourceKey, row))` from `@/lib/utils/tree`.
- **ADD** `collectTaxonomyTreeSlugs(nodes: TaxonomyTreeNode[]): Map<string, string>` — `new Map(flattenTree(nodes).map((n) => [n.id, n.slug ?? ""]))` (map membership = "persisted node").
- **MODIFY** `toTaxonomyTreeWritePayload(nodes: TaxonomyTreeNode[], persistedSlugs: ReadonlyMap<string, string> = new Map()): TaxonomyTreeNode[]`:
  ```ts
  return nodes.map(({ id, name, slug, translations, children }) => ({
    id,
    name,
    ...payloadField("slug", changedNonBlank(slug ?? "", persistedSlugs.get(id) ?? "")),
    ...(translations ? { translations } : {}),
    children: children?.length ? toTaxonomyTreeWritePayload(children, persistedSlugs) : undefined,
  }));
  ```
  Callers: `form-submit.ts:121,135`. Rewrite the doc comment (no longer "Strip slug…").
- **ADD** `validateTaxonomyTreeSlugs(nodes, persistedSlugs): Record<string, string>` — per `flattenTree` node: `persistedSlugs.has(node.id) ? requiredSlugField : optionalSlugField`, `safeParse((node.slug ?? "").trim())`, on failure `result[node.id] = issues[0].message` (a `validation.slug*` key).
- **ADD** `hasAdjustedTaxonomyTreeSlugs(sent: TaxonomyTreeNode[], saved: TaxonomyTreeNode[]): boolean` — a sent node with non-empty `slug` whose saved node (same `id`) has a different `slug`.
- **MODIFY** `createTaxonomyTreeNode` comment (line 78 "local slug preview only") → "New empty node; no slug (the backend generates it unless the user types one)."
- Imports: **ADD** `{ changedNonBlank, payloadField } from "@/lib/utils/payload"`, `{ flattenTree } from "@/lib/utils/tree"`, `{ optionalSlugField, requiredSlugField } from "@/schema/shared"`. `src/lib/utils/taxonomy/index.ts` uses `export *` so no barrel edit.
- Tests: new `resource.test.ts` (inventory §G).

### E4. `src/lib/utils/taxonomy/form-helpers.ts` — MODIFY
- **DELETE** `resolveTaxonomySlugPreview` (183-190) and the `slugifyName` import (line 2); sole caller `taxonomy-form-dialog.tsx:44,281`.
- **DELETE** `getTaxonomyTreeMaxDepth` (192-204); caller `taxonomy-form-dialog.tsx:42,287` → `getTreeMaxDepth(tree)`.
- `buildTaxonomyFormDefaultValues` (131-160): non-outcome branch **ADD** `slug: getPersistedTaxonomySlug(resourceKey, initialData),`.
- **ADD** `buildTaxonomySlugBaseline(resourceKey, initialData?): TaxonomySlugBaseline` → `{ slug: getPersistedTaxonomySlug(resourceKey, initialData), treeSlugs: collectTaxonomyTreeSlugs(getTaxonomyTreeFromEntity(resourceKey, initialData)) }` (imports from `./resource`; `resource.ts` does not import `form-helpers`, so no cycle).
- **KEEP** `getPersistedTaxonomySlug`, `compactNameTranslations`, constants (`TAXONOMY_TREE_INDENT_PX`, `TAXONOMY_DIALOG_BASE_MIN_PX`).
- Tests: new `form-helpers.test.ts`.

### E5. `src/lib/utils/taxonomy/form-submit.ts` — MODIFY (not re-exported from the barrel; import deep)
- `TaxonomySubmitFormValues` (30-35) and `NameFormValues` (37-40): **ADD** `slug?: string;`.
- `prepareSlugStatusSubmitPayload(values, nameTranslations, baseline)`, `prepareTopicSubmitPayload(values, nameTranslations, tree, baseline)`, `prepareSkillSubmitPayload(values, nameTranslations, tree, baseline)`: payload **ADD** `...payloadField("slug", changedNonBlank(values.slug ?? "", baseline.slug))`; tree via `toTaxonomyTreeWritePayload(tree, baseline.treeSlugs)`.
- `prepareTopicSubmitPayload` (line 120) and `prepareOutcomeSubmitPayload` (line 104): `image_file_id: values.image_file_id || undefined` → `...payloadField("image_file_id", omitWhenBlank(values.image_file_id))` (preserves key presence semantics; BE meaning of an omitted image id is not verified here and is not changed).
- `buildTaxonomySubmitPayload(args)` (247-297): `args` **ADD** `baseline: TaxonomySlugBaseline`; pass `slug: values.slug` and `baseline` to the three builders; outcomes path unchanged.
- `persistTaxonomyCreate` (152-173), `persistTaxonomyUpdate` (175-207), `persistTaxonomyForm` (209-233): `Promise<void>` → `Promise<TaxonomyEntity>`; `await createTaxonomyService(...)`/`await updateTaxonomyService(...)` + `return;` → `return createTaxonomyService(...)`/`return updateTaxonomyService(...)`. Single caller: `taxonomy-form-dialog.tsx:51,259`.
- Collapse the four spellings of the payload union (154-158, 179-183, 214-218, 238-243) into one exported alias `TaxonomySubmitPayload`.
- **ADD** `getTaxonomySaveSlugNotice(resourceKey, payload: TaxonomySubmitPayload, saved: TaxonomyEntity): { adjustedSlug?: string; treeAdjusted: boolean }` — `adjustedSlug` = saved slug when `isSlugAdjusted("slug" in payload ? payload.slug : undefined, "slug" in saved ? saved.slug : "")`; `treeAdjusted` = `hasAdjustedTaxonomyTreeSlugs(payload.child_topics ?? payload.children ?? [], getTaxonomyTreeFromEntity(resourceKey, saved))`.
- Imports: **ADD** `{ omitWhenBlank, changedNonBlank, payloadField }`, `isSlugAdjusted`, `hasAdjustedTaxonomyTreeSlugs`, `getTaxonomyTreeFromEntity`, types `TaxonomyEntity`, `TaxonomySlugBaseline`.
- Tests: new `form-submit.test.ts` (mock `@/api/callers/taxonomy`).

## F. Taxonomy UI and messages

### F1. `src/components/features/taxonomy/taxonomy-form-dialog.tsx` — MODIFY (~491/700 `max-lines`)
Imports — **DELETE**: `getPersistedTaxonomySlug` (39), `resolveTaxonomySlugPreview` (44), `getTaxonomyTreeMaxDepth` (42), the four schema imports (55-59), `RequiredLabel`/`FieldError` only if no longer used (they are replaced by `FormField`). **ADD**: `buildTaxonomySlugBaseline`, `validateTaxonomyTreeSlugs` from `@/lib/utils/taxonomy`; `getTaxonomySaveSlugNotice` from `@/lib/utils/taxonomy/form-submit`; `getTaxonomyFormSchema` from `@/schema/taxonomy`; `FormField`, `SlugField`, `SlugConflictConfirmDialog` from `@/components/shared`; `useSlugConflictFlow` from `@/hooks/slug`; `getTreeMaxDepth` from `@/lib/utils/tree`; `TAXONOMY_NAME_MAX_LENGTH`, `TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH` from `@/constants/taxonomy/limits`.

State/logic:
- Lines 113-115 `persistedSlug` → `const [slugBaseline] = useState(() => buildTaxonomySlugBaseline(resourceKey, initialData));`.
- Lines 117-122 schema `useMemo` → `useMemo(() => getTaxonomyFormSchema(resourceKey, mode), [resourceKey, mode])`.
- Lines 139-143 `nameValue` `useWatch` and 280-283 `slugPreview` → **DELETE**; **ADD** `slugValue` (`useWatch` on `"slug"`, `?? ""`) and `const [treeSlugErrors, setTreeSlugErrors] = useState<Record<string, string>>({});`.
- Line 96 `isSubmitting` → **DELETE** (from the flow). Line 287 `getTaxonomyTreeMaxDepth(tree)` → `getTreeMaxDepth(tree)`.
- Lines 241-278 `onSubmit` → **REPLACE** by:
  ```ts
  const slugFlow = useSlugConflictFlow({
    slug: slugValue,
    setSlug: (next) => (form.setValue as (n: "slug", v: string) => void)("slug", next),
    prepare: (nextSlug) => {
      const issues = validateTaxonomyTreeSlugs(tree, slugBaseline.treeSlugs);
      setTreeSlugErrors(issues);
      if (Object.keys(issues).length > 0) { toast.error(tForm("validation.treeSlug")); return null; }
      const built = buildTaxonomySubmitPayload({ resourceKey, values: { ...form.getValues(), slug: nextSlug }, nameTranslations, outcomeTranslations, tree, baseline: slugBaseline });
      if (!built.ok) { toast.error(tForm("outcomeShortRequired", { locale: contentLocaleOptionLabel(built.error.locale) })); return null; }
      return built.payload;
    },
    request: async (payload) => ({ payload, saved: await persistTaxonomyForm(resourceKey, mode, initialData?.id, expectedRowVersion, payload) }),
    onSuccess: ({ payload, saved }) => {
      const notice = getTaxonomySaveSlugNotice(resourceKey, payload, saved);
      if (notice.adjustedSlug) toast.info(tForm("slugAdjusted", { slug: notice.adjustedSlug }));
      if (notice.treeAdjusted) toast.info(tForm("treeSlugsAdjusted"));
      if (!notice.adjustedSlug && !notice.treeAdjusted) toast.success(mode === "create" ? t("common.createSuccess") : t("common.updateSuccess"));
      onSuccess();
      onOpenChange(false);
    },
  });
  ```
- `<form onSubmit={form.handleSubmit(onSubmit)}>` (329) → `form.handleSubmit(() => void slugFlow.submit())`; footer buttons (482-492) `disabled={isSubmitting}` → `disabled={slugFlow.isSubmitting}`.

JSX:
- Outcome `short_description` (394-421) and `name` (424-447) blocks → `FormField` with `maxLength={TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH}` / `{TAXONOMY_NAME_MAX_LENGTH}` and `error`/`errorMessage` passed only when `activeLocale === "en"` (same conditional as today); `resolveValidationMessage(tForm, …)` without the cast.
- Lines 448-461 (read-only slug, inside `activeLocale === "en"`) → `<SlugField id="slug" required={mode === "edit"} label={tForm("slug")} placeholder={tForm("slugPlaceholder")} hint={tForm(mode === "create" ? "slugHintCreate" : "slugHintEdit")} value={slugValue} onValueChange={(next) => form.setValue("slug", next, { shouldValidate: form.formState.isSubmitted })} error={"slug" in form.formState.errors ? form.formState.errors.slug : undefined} errorMessage={resolveValidationMessage(tForm, "slug" in form.formState.errors ? form.formState.errors.slug?.message : undefined)} />`, placed after the name field and **outside** the `activeLocale === "en"` guard (a slug is not localized; the old guard existed only because the preview derived from the English name). Not rendered for `outcomes` (inside the non-outcomes branch).
- Lines 466-471 `TaxonomyTreeEditor` **ADD** `slugErrors` (each `treeSlugErrors` message key resolved with `resolveValidationMessage(tForm, key)`); `onChange={(next) => { setTree(next); setTreeSlugErrors({}); }}`.
- After `</form>` (494), before `</DialogContent>` (495): `<SlugConflictConfirmDialog suggestedSlug={slugFlow.suggestedSlug} isSubmitting={slugFlow.isSubmitting} onAccept={slugFlow.acceptSuggestion} onDismiss={slugFlow.dismissSuggestion} labels={{ title: tForm("slugConflictTitle"), description: tForm("slugConflictDescription", { slug: slugFlow.suggestedSlug ?? "" }), confirm: tForm("slugConflictConfirm"), cancel: tForm("slugConflictCancel"), loading: tForm("slugConflictLoading") }} />` (inside `DialogContent`, React-tree nested, per the documented `stacked` rule).
- **KEEP** `export { buildTaxonomyFormDefaultValues } from "@/lib/utils/taxonomy";` (line 81). Callers of `TaxonomyFormDialog`: `src/components/features/taxonomy/index.ts:2`, `taxonomy-list-page.tsx:11,316` (props unchanged).

### F2. `src/components/features/taxonomy/taxonomy-tree-editor.tsx` — MODIFY (absorbs `shared/sortable-tree-editor.tsx`; CAP-12, CAP-9, CAP-11)
Final shape (single feature-owned component):
```tsx
export type TaxonomyTreeEditorProps = {
  resourceKey: TaxonomyResourceKey;
  value: TaxonomyTreeNode[];
  onChange: (value: TaxonomyTreeNode[]) => void;
  /** Active content locale — edits `translations[locale].name`. */
  editLocale?: string;
  /** node id → resolved slug error message. */
  slugErrors?: Readonly<Record<string, string>>;
};
```
- MOVE from `sortable-tree-editor.tsx` (then delete that file): `getNodeDisplayName`, `patchNodeName`, `TreeLevel`; **ADD** `patchNodeSlug(node, value) => ({ ...node, slug: value })`.
- Per-node state changes use `onChange(updateTreeNode(nodes, node.id, patch))` instead of the three index-closure rebuilds (`:85-91`, `:113-116`, `:141-144`); remove stays `nodes.filter((item) => item.id !== node.id)`.
- Labels come from `useTranslations(resourceKey === "skills" ? "taxonomy.treeSkills" : "taxonomy.tree")` (keys `dragHandle`, `namePlaceholder`, `slugPlaceholder`, `slugAuto`, `slugEdit`, `slugDone`, `addChild`, `remove`); the `SortableTreeEditorLabels`/`SortableTreeEditorProps` types and the pass-through wrapper disappear.
- `indentPx = 12` → `TAXONOMY_TREE_INDENT_PX` (from `@/lib/utils/taxonomy`, already the dialog's sizing constant); name `maxLength={255}` → `TAXONOMY_NAME_MAX_LENGTH`; `createNode` default → `createTaxonomyTreeNode`.
- The read-only slug cell (`:95-105`, `slugifyName`) → `<TreeNodeSlugField …/>` (F3).
- Imports **DELETE**: `slugifyName`; the `@/components/shared/sortable-tree-editor` import. **KEEP** `SortableList` (shared; drag listeners are only on the handle).
- Callers: `taxonomy-form-dialog.tsx:466` only. `src/components/shared/sortable-tree-editor.tsx` — **DELETE** (single consumer, taxonomy-only imports); `src/components/shared/index.ts:19` export removed (C5).
- Tests: new `taxonomy-tree-editor.test.tsx` (`renderWithProviders`; no drag): node slugs rendered from props; editing a node slug reports only that node changed (`updateTreeNode` structural sharing); new node shows the auto placeholder; `slugErrors` shown on the node; name editing per locale preserved (en mirrors canonical).

### F3. `src/components/features/taxonomy/tree-node-slug-field.tsx` — ADD
```tsx
type TreeNodeSlugFieldProps = {
  slug: string;
  labels: { slugPlaceholder: string; slugAuto: string; slugEdit: string; slugDone: string };
  error?: string;
  onSlugChange: (slug: string) => void;
};
```
- `"use client"`; local `useState(false)` for the edit toggle (hooks cannot live in the `renderItem` render prop). Closed: `Label` (`text-xs text-muted-foreground`) + muted text (`slug || labels.slugAuto`) + ghost `icon-sm` `Pencil` button (`aria-label={labels.slugEdit}`). Open (also while `error` is set): `SlugInput` (`aria-label={labels.slugPlaceholder}`, `aria-invalid` when `error`) + `Check` button (`aria-label={labels.slugDone}`); error via `FieldError` with `{ type: "validate" }`.
- Reuses `SlugInput`, `Button`, `Label`, `FieldError`, lucide icons; no new filtering/validation code. Consumer: `taxonomy-tree-editor.tsx` (knip unused-file rule satisfied).
- Tests: `tree-node-slug-field.test.tsx` (placeholder when blank; shows slug; pencil toggles; typing is filtered; done closes; stays open with an error).

### F4. `src/messages/en.ts` and `src/messages/vi.ts` — MODIFY (keys must mirror; `Messages` type enforces parity)
Under the top-level `taxonomy` namespace (en.ts:1298 / vi.ts:1299; not the unrelated menu `taxonomy` at en.ts:337):

| Key | en | vi |
|---|---|---|
| `form.slugPlaceholder` | `my-slug` | `duong-dan-cua-ban` |
| `form.slugHintCreate` | `Optional. Leave blank to generate one automatically. Lowercase letters, numbers, and dashes only.` | `Không bắt buộc. Để trống để hệ thống tự tạo. Chỉ gồm chữ thường, số và dấu gạch ngang.` |
| `form.slugHintEdit` | `Lowercase letters, numbers, and dashes only. If the slug is already taken, a suffix is added automatically.` | `Chỉ gồm chữ thường, số và dấu gạch ngang. Nếu slug đã được dùng, hệ thống sẽ tự thêm hậu tố.` |
| `form.slugConflictTitle` | `Slug already exists` | `Slug đã tồn tại` |
| `form.slugConflictDescription` | `This slug already exists. We suggest: {slug}. Do you want to continue creating this item with this slug?` | `Slug này đã tồn tại. Chúng tôi đề xuất: {slug}. Bạn có muốn tiếp tục tạo với slug này không?` |
| `form.slugConflictConfirm` / `slugConflictCancel` | `Yes` / `No` | `Có` / `Không` |
| `form.slugConflictLoading` | `Saving...` | `Đang lưu...` |
| `form.slugAdjusted` | `Saved. The slug was already taken, so it was changed to {slug}.` | `Đã lưu. Slug đã được dùng nên được đổi thành {slug}.` |
| `form.treeSlugsAdjusted` | `Saved. Some sub-item slugs were already used in this tree and were adjusted to stay unique.` | `Đã lưu. Một số slug mục con đã được dùng trong cây này nên đã được điều chỉnh để không trùng.` |
| `form.validation.slugRequired` | `Please enter a slug.` | `Vui lòng nhập slug.` |
| `form.validation.slugInvalid` | `Slug may only contain lowercase letters, numbers, and dashes, and cannot start or end with a dash.` | `Slug chỉ gồm chữ thường, số và dấu gạch ngang, và không được bắt đầu hoặc kết thúc bằng dấu gạch ngang.` |
| `form.validation.slugMax` | `Slug must be at most 255 characters.` | `Slug tối đa 255 ký tự.` |
| `form.validation.treeSlug` | `Fix the highlighted sub-item slugs before saving.` | `Hãy sửa các slug mục con được đánh dấu trước khi lưu.` |
| `tree.slugAuto` / `treeSkills.slugAuto` | `Generated from the name` | `Tự tạo từ tên` |
| `tree.slugEdit` / `treeSkills.slugEdit` | `Edit slug` | `Sửa slug` |
| `tree.slugDone` / `treeSkills.slugDone` | `Done editing slug` | `Xong chỉnh sửa slug` |

Existing keys reused: `form.slug`, `tree.slugPlaceholder`, `treeSkills.slugPlaceholder`, `common.createSuccess|updateSuccess`, `errors.codes.3007`. Each added block is under 10 lines (below the jscpd floor).

## G. Tests (new and changed; co-located; jsdom unless noted)

| File | Status | Cases |
|---|---|---|
| `src/lib/utils/payload.test.ts` | ADD | A1 |
| `src/lib/utils/tree.test.ts` | ADD | A2 |
| `src/lib/utils/slug.test.ts` | MODIFY | A3 |
| `src/lib/utils/validation-message.test.ts` | ADD | A5 |
| `src/lib/utils/dagre-tree.test.ts` | ADD | D2 |
| `src/lib/navigation/dashboard-page-header.test.ts` | ADD | D1 (written first against the old code) |
| `src/schema/taxonomy/taxonomy.test.ts` | MODIFY | E2 |
| `src/lib/utils/taxonomy/resource.test.ts` | ADD | `countTreeNodes` replacement parity; `collectTaxonomyTreeSlugs`; `toTaxonomyTreeWritePayload` (untouched node omits slug; new node with typed slug sends it; edited existing sends it; unchanged omits; blank omits; nested; `translations`/`children` shape; empty children → `undefined`); `validateTaxonomyTreeSlugs` (persisted blank → `validation.slugRequired`, malformed, new blank ok); `hasAdjustedTaxonomyTreeSlugs` |
| `src/lib/utils/taxonomy/form-helpers.test.ts` | ADD | defaults seed `slug` (create `""`, edit persisted, outcomes none); `buildTaxonomySlugBaseline` |
| `src/lib/utils/taxonomy/form-submit.test.ts` | ADD | per resource slug rules, `image_file_id` omit/keep, tree slugs via baseline, outcomes no slug, `getTaxonomySaveSlugNotice` (root/tree/none), `persistTaxonomyForm` returns the saved entity |
| `src/lib/utils/course.test.ts` | KEEP (must pass unchanged) | 8 existing cases |
| `src/hooks/slug/use-slug-conflict-flow.test.tsx` | ADD | C1 |
| `src/hooks/course/use-course-create-flow.test.tsx` | KEEP (must pass unchanged) | 8 existing cases (MSW) |
| `src/components/shared/form-field.test.tsx`, `slug-field.test.tsx`, `slug-conflict-confirm-dialog.test.tsx` | ADD | C2-C4 |
| `src/components/features/taxonomy/tree-node-slug-field.test.tsx`, `taxonomy-tree-editor.test.tsx` | ADD | F2-F3 |
| `src/components/features/taxonomy/taxonomy-form-dialog.test.tsx` | ADD | MSW + `renderWithProviders`, parameterised over levels/tags/topics/skills: create blank slug omitted / typed sent; 409/3007 confirm (Yes resubmits with the recommended slug, No keeps the form); edit rename omits slug; changed slug sent with adjusted notice; blank slug and cleared persisted node slug blocked; node collision notice; outcomes shows no slug field |
| `e2e/tests/taxonomy-slug.spec.ts` | ADD | H |

## H. e2e (outside `npm run check-all`; run with `npm run test:e2e`)

- `e2e/fixtures/server.mjs`: **ADD** `slugConflictResponse(res)` (409 `envelope(3007, "Slug already exists", { recommended_slug: TAKEN_SLUG_SUFFIXED })`) and `resolveSavedSlug(slug)` (`slug === TAKEN_SLUG ? TAKEN_SLUG_SUFFIXED : slug`); **MODIFY** the course `POST /api/v1/courses` (389-402) and `PATCH …/basic-info` (404-414) handlers to use them (MOVE, not copy); **ADD** an admin user in `USERS` (24-44) with the taxonomy permissions the admin shell and `TAXONOMY_RESOURCES` require (exact names read from `src/constants/permissions` and `src/constants/dashboard/admin-items.ts` in task 9.1); **ADD** stateful levels and topics (seeded 2-level tree) reset in `resetState` (68-83), with list (replacing the generic empty list at 535-537 for these segments), `GET /:id?view=edit`, `POST` (taken slug → `slugConflictResponse`), `PATCH` (slug via `resolveSavedSlug`; echo the tree preserving omitted node slugs by id, suffixing a duplicate).
- `e2e/support/auth.ts`: `loginAsInstructor` delegates to new `loginAs(page, user, startPath)`; **ADD** `loginAsAdmin`. `e2e/support/fixture-client.ts`: **ADD** `FIXTURE_USERS.admin`.
- `e2e/tests/taxonomy-slug.spec.ts`: create level blank slug; taken slug → accept; → decline keeps the form; edit level rename → PATCH body has no `slug`; edit topic change one node slug → PATCH body has only that node's `slug`; clear a persisted node slug → blocked with an error; adjusted-slug notice.

## I. Removed symbols (evidence of no remaining consumer)

| Symbol | Defined | Evidence |
|---|---|---|
| `generateSlug`, `slugifyName` | `src/lib/utils/slug.ts` | grep over `src/ e2e/ scripts/`: only the two removed previews, barrel line 98, `slug.test.ts` |
| `resolveTaxonomySlugPreview` | `form-helpers.ts:183-190` | sole caller `taxonomy-form-dialog.tsx:44,281` |
| `getTaxonomyTreeMaxDepth` | `form-helpers.ts:192-204` | sole caller `taxonomy-form-dialog.tsx:42,287` |
| `countTaxonomyTreeNodes` | `resource.ts:88-99` | sole caller `taxonomy-tree-view-button.tsx:16,39` |
| `findDashboardItemById`, `findDashboardItemPathByHref` | `dashboard-page-header.ts:39-83` | file-private; callers `:119`, `:172` |
| local `walkTree` | `dagre-tree.ts:16-40` | file-private; caller `treeToFlowElements` |
| `resolveAuthValidationMessage`, `AuthFieldError`, `AuthValidationMessageKey` | `auth-form-fields.tsx:13-42` | file-private; callers listed in D3 |
| private `slugFormatField` | `src/schema/course/course.ts:16-25` | MOVED to `src/schema/shared/slug.ts` |
| `SortableTreeEditor`, `SortableTreeEditorLabels`, `SortableTreeEditorProps` | `src/components/shared/sortable-tree-editor.tsx` | sole consumer `taxonomy-tree-editor.tsx:4,26`; barrel `shared/index.ts:19` |

## J. Files explicitly NOT changed (verified)

`src/api/callers/taxonomy/*` (payload types widen only), `src/screen/common/taxonomy/taxonomy-list-page.tsx` (props unchanged), the 10 admin/sysadmin route files, `src/components/shared/sortable-list.tsx`, `src/components/shared/dagre-tree-dialog.tsx`, `src/components/features/taxonomy/taxonomy-tree-view-button.tsx` (only its `countTaxonomyTreeNodes` call site: E3), `src/components/shared/slug-input.tsx`, `src/components/shared/confirm-action-dialog.tsx`, `src/lib/utils/api-error.ts`, `src/constants/taxonomy/resources.ts`, `src/constants/api-error-code.ts`, `src/messages/error-codes.ts`, instructor `Field`/`toSubmitPayload`/`search-text.ts`, course outline helpers, `filterPermissionNavTree`, and all lint/format/test/build/CI configuration (Tooling rule protection).
