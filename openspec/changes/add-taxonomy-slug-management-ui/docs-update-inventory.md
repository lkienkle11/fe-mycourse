# Documentation Update Inventory

Companion to `design.md` (the design lists every item below per document; this file carries the verbatim CURRENT text and the exact REPLACEMENT). All documentation is English (verified: every file below is English; only quoted UI-copy examples inside `docs/taxonomy-admin.md` L67-L74 are bilingual by design and are not edited). **Replace, do not append**: each CURRENT passage is replaced by the stated text so no stale statement remains (Full Documentation Replacement Rule). Audit stamps keep the previous stamp as `Prior:` exactly as the course change did; every live statement is replaced.

Method (AGENTS.md order): (1) GitNexus (`query`/`context` on the taxonomy slug, tree, payload, field and validation symbols; the graph indexes only `docs/taxonomy-admin.md` and `docs/dependencies.md` as project docs, so it is not an authority for the doc list), (2) the existing docs, (3) the source. Two scans produced this inventory: the first (slug capability) and a second after the codebase-wide capability audit (tree utils, payload rule, `FormField`, validation resolver, ownership move, limits). Every project-owned markdown file was grepped with the full symbol list; Appendix A lists every matched line of the first scan with a keep/change decision, and every unchanged file is justified in "Scanned — no change".

Conventions: `REPLACE` = replace the quoted passage (whole lines) with the given text; `FRAGMENT` = inside the quoted line replace exactly the listed `old` substring with `new`; `INSERT` = new lines after the quoted anchor line; `INSERT_BEFORE` = new lines before the anchor. Line numbers are `HEAD c5153b1` and must be re-located by quote at implementation time. New audit date: `2026-10-14` (re-stamp with the actual date at implementation). Test counts are `[N]`/`[Status]` placeholders to fill from the real run.

Documents changed (17): `docs/api-overview.md`, `docs/api-using.md`, `docs/architecture.md`, `docs/components.md`, `docs/dependencies.md`, `docs/folder-structure.md`, `docs/instructor-admin.md`, `docs/logic-flow.md`, `docs/modules.md`, `docs/pages.md`, `docs/patterns.md`, `docs/quality.md`, `docs/reusable-assets.md`, `docs/screens.md`, `docs/seo-ranking-setup.md`, `docs/taxonomy-admin.md`, `docs/testing.md`; plus `AGENTS.md` / `CLAUDE.md` only for the regenerated GitNexus counts (no new rule is added, so no `<!-- begin:… -->` boundary is needed). Optional items are marked **optional** and are applied for completeness (stamp-only or historical-table rows).

ID prefixes: `TAX`/`PAT`/`APIO`/`APIU`/`INS`/`LF`/`ARC`/`CMP`/`RA`/`FS`/`MOD`/`PG`/`SCR`/`TST` = slug capability; `MOVE` = tree editor ownership move; `TREE` = generic tree utils; `DAG` = dagre tree; `NAV` = dashboard nav resolver; `PAY` = payload rule; `FF` = `FormField`; `VAL` = validation resolver / auth fields; `LIM` = taxonomy limits; `SCH` = shared slug schema; `TAXU` = taxonomy util assets; `DEP`, `SEO`, `QUA` = other docs.

---

# Part 1 — Edit items per file (slug capability, corrected for the final design)

### `docs/taxonomy-admin.md`

#### TAX-1 - `docs/taxonomy-admin.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last audited: 2026-07-12 (multilingual: `locale` query, `view=edit`, translation tabs, `expected_row_version`)._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (taxonomy slug management UI: editable root + per-node slug (`SlugInput`), create 409/3007 recommended-slug confirm via `useSlugConflictFlow`, update `taxonomy.form.slugAdjusted`). Prior: 2026-07-12 (multilingual: `locale` query, `view=edit`, translation tabs, `expected_row_version`)._
````

#### TAX-2 - `docs/taxonomy-admin.md:L23` - **INSERT**
_Three new REUSE MAP rows appended directly after the `List labels` row (table end)._

Anchor line (unchanged; insert after it) - CURRENT:
````text
| List labels | `listTaxonomyService` / `useTaxonomyList` with `locale` | Assume mono-locale canonical `name` only |
````
INSERT text:
````text
| Slug field | Shared `SlugField` / `SlugInput` (`src/components/shared/slug-field.tsx`, `slug-input.tsx`) + `sanitizeSlugInput` / `SLUG_PATTERN` / `SLUG_MAX_LENGTH` (`src/lib/utils/slug.ts`) for the root slug; `TreeNodeSlugField` (`src/components/features/taxonomy/tree-node-slug-field.tsx`) for the per-node tree slug; shared zod fields `optionalSlugField` / `requiredSlugField` (`src/schema/shared/slug.ts`) | Hand-roll slug character filtering or a slug regex; derive a slug from `name` on the FE |
| Slug payload rule | `payloadField("slug", changedNonBlank(slug, persistedSlug))` (`src/lib/utils/payload.ts`) and `isSlugAdjusted(sent, saved)` (`src/lib/utils/slug.ts`) | Re-implement "omit blank / omit unchanged" in a taxonomy builder |
| Slug conflict on create | Shared `useSlugConflictFlow` (`src/hooks/slug/use-slug-conflict-flow.ts`, also used by `useCourseCreateFlow`) + `SlugConflictConfirmDialog` (`ConfirmActionDialog stacked`) + `extractRecommendedSlug` (`src/lib/utils/api-error.ts`) | Re-implement 409 / **3007** handling inline in `TaxonomyFormDialog`; show a 3007 conflict as an error toast |
| Labelled form field | Shared `FormField` (`src/components/shared/form-field.tsx`: `RequiredLabel` + control + hint + `FieldError`) | Re-write the label + control + error block per field |
| Tree traversal | `src/lib/utils/tree.ts` (`flattenTree`, `countTreeNodes`, `getTreeMaxDepth`, …) | Add another recursive walk over `children` |
| Text limits | `TAXONOMY_NAME_MAX_LENGTH` / `TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH` (`src/constants/taxonomy/limits.ts`) | Repeat `255` / `100` in schema or `maxLength` props |
````

#### TAX-3 - `docs/taxonomy-admin.md:L63` - **INSERT**

Anchor line (unchanged; insert after it) - CURRENT:
````text
- **Data locale:** list/picker reads pass `locale` from `useLocale()` so BE resolves labels via translation fallback. Admin edit loads `GET …/:id?view=edit` for canonical + full `translations` (independent of UI chrome language for stored locales).
````
INSERT text:
````text
- **Slug copy:** root form keys under `taxonomy.form`: `slug` (label, existing), `slugPlaceholder`, `slugHintCreate`, `slugHintEdit`, the create-conflict confirm `slugConflictTitle` / `slugConflictDescription` (`{slug}`) / `slugConflictConfirm` / `slugConflictCancel` / `slugConflictLoading`, the save notices `slugAdjusted` (`{slug}`) and `treeSlugsAdjusted`, and `validation.slugRequired` / `slugInvalid` / `slugMax` / `treeSlug`; tree node slug controls `taxonomy.tree.slugAuto` / `slugEdit` / `slugDone` (topics) and the same keys under `taxonomy.treeSkills` (skills), next to the existing `slugPlaceholder` label. Present in both `src/messages/en.ts` and `src/messages/vi.ts`.
````

#### TAX-4 - `docs/taxonomy-admin.md:L80` - **REPLACE**

CURRENT (verbatim):
````text
Edit/reorder still uses `SortableTreeEditor` in the form dialog — separate from the read-only dagre popup. On edit, tree nodes carry optional per-node `translations` maps (same canonical ↔ `en` sync rules as root).
````
REPLACEMENT (whole passage):
````text
Edit/reorder still uses `TaxonomyTreeEditor` (`src/components/features/taxonomy/taxonomy-tree-editor.tsx`) in the form dialog — separate from the read-only dagre popup. On edit, tree nodes carry optional per-node `translations` maps (same canonical ↔ `en` sync rules as root) and an editable per-node `slug` (see **Slug**).
````

#### TAX-5 - `docs/taxonomy-admin.md:L92-L99` - **REPLACE**

CURRENT (verbatim):
````text
## Slug (read-only preview; server authority — taxonomy only)

- UI preview uses `slugifyName()` / `generateSlug()` in `src/lib/utils/slug.ts` (trim, lowercase, remove Vietnamese accents, `đ/Đ -> d`, spaces/underscores → `-`, keep Unicode letters/numbers, collapse repeated dashes).
- On edit, slug preview falls back to API `slug` until the watched canonical `name` field is non-empty (avoids empty preview when `useWatch` lags behind `defaultValues` after dialog remount).
- Slug field is **read-only** on create and edit; users only type the name.
- Scope: this read-only, name-derived behavior applies to **taxonomy only**. Course slugs are editable and independent of the title (shared `SlugInput`, `sanitizeSlugInput`, `SLUG_PATTERN`, `SLUG_MAX_LENGTH` in `src/lib/utils/slug.ts`); `generateSlug` / `slugifyName` are not used for courses. See `docs/patterns.md` §15 and `docs/instructor-admin.md`.
- **Create/update API payloads omit `slug`** — BE derives it from **canonical `name`** (and from each tree node canonical `name`) via `utils.SlugifyName`. Non-`en` translation-only edits do not regenerate slug.
- Tree nodes: canonical name is editable, slug preview is read-only; write payload omits `slug` on `TaxonomyTreeNode` (use `toTaxonomyTreeWritePayload()` in `src/lib/utils/taxonomy/`).
````
REPLACEMENT (whole passage):
````text
## Slug (editable; server authority)

- **Resources:** levels, topics, skills and tags have a slug; outcomes do not. Topics and skills also carry a per-node slug inside `child_topics` / `children`. A slug is never localized, so the field is shown on every language tab.
- **Root field:** the form dialog renders the shared `SlugField` (`src/components/shared/slug-field.tsx`, built on `FormField` and `SlugInput`) on create and edit. Input is filtered by `sanitizeSlugInput` (`src/lib/utils/slug.ts`: whitespace becomes `-`, every character outside `a-z 0-9 -` is dropped, max `SLUG_MAX_LENGTH` = 255) and the final shape is checked with `SLUG_PATTERN` through the shared zod fields in `src/schema/shared/slug.ts`. The FE never derives the slug from `name`; there is no live preview. On edit the field is seeded with the persisted API `slug`; clearing it is blocked with `taxonomy.form.validation.slugRequired` (the BE answers `400` for a blank slug on update).
- **Create payload:** `slug` is sent only when the trimmed field is non-blank (`payloadField("slug", changedNonBlank(slug, ""))`, `src/lib/utils/payload.ts`); a blank slug is omitted so the BE generates it from the canonical `name`.
- **Create conflict:** a taken slug returns HTTP `409` with app code **3007** (`ApiErrorCode.SlugAlreadyExists`) and `data.recommended_slug`. The shared hook `useSlugConflictFlow` (also used by `useCourseCreateFlow`) reads it with `extractRecommendedSlug` and `SlugConflictConfirmDialog` opens a stacked `ConfirmActionDialog` (`taxonomy.form.slugConflict*`): **Yes** resubmits with the recommended slug (and repeats if a new 3007 comes back), **No** returns to the form with the input unchanged. The 3007 is not shown as an error toast.
- **Update payload:** `slug` is sent only when it differs from the persisted slug (`payloadField("slug", changedNonBlank(slug, persistedSlug))`, the same rule as `toUpdateCourseBasicInfoPayload` for courses), including when only the name or translations change. The BE resolves a colliding slug on update by adding a suffix (no `409`); `persistTaxonomyForm` returns the saved entity, the response slug is the source of truth (`isSlugAdjusted`), and when it differs from the slug sent the UI shows the `taxonomy.form.slugAdjusted` toast instead of the plain success toast.
- **Tree nodes (topics `child_topics`, skills `children`):** each node shows its persisted slug as muted text with a pencil button (`TreeNodeSlugField`, `src/components/features/taxonomy/tree-node-slug-field.tsx`, rendered by `TaxonomyTreeEditor`) that reveals an inline `SlugInput`; a node added in the dialog shows the "generated from the name" placeholder. `toTaxonomyTreeWritePayload(nodes, persistedSlugs)` includes a node's `slug` only for a new node with a typed slug or an existing node whose slug differs from the value loaded with the item; every other node omits it and the BE preserves the stored slug by node `id`. `validateTaxonomyTreeSlugs` runs before submit: a persisted node with a blank slug or any malformed node slug blocks the save with an error attached to that node. In-tree collisions are resolved by the BE (no `409`); `taxonomy.form.treeSlugsAdjusted` is toasted when a sent node slug comes back different (`hasAdjustedTaxonomyTreeSlugs`).
- **Types:** one shared `TaxonomyTreeNode` type with optional `slug`; `CreateSlugStatusPayload` / `UpdateSlugStatusPayload` carry an optional `slug` (`UpdateTopicPayload` / `UpdateSkillPayload` extend `UpdateSlugStatusPayload`). The name-to-slug generators (`generateSlug` / `slugifyName`) no longer exist.
- Non-`en` translation-only edits do not change the slug: the BE no longer re-derives it from the name on update. See `docs/patterns.md` §15 and `docs/logic-flow.md` §10b.
````

#### TAX-6 - `docs/taxonomy-admin.md:L142` - **REPLACE**

CURRENT (verbatim):
````text
- Tree editors accept optional per-node `translations`.
````
REPLACEMENT (whole passage):
````text
- Tree editors accept optional per-node `translations` and an optional per-node `slug` (edited through the pencil toggle; see **Slug**).
````

#### TAX-7 - `docs/taxonomy-admin.md:L143` - **REPLACE**

CURRENT (verbatim):
````text
- Submit sends canonical and/or `translations`; update includes **`expected_row_version`** from the edit GET.
````
REPLACEMENT (whole passage):
````text
- Submit sends canonical and/or `translations` and, when set or changed, `slug` (root and tree nodes); update includes **`expected_row_version`** from the edit GET.
````

#### TAX-8 - `docs/taxonomy-admin.md:L149` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **Schemas**: `src/schema/taxonomy/taxonomy.ts` — `taxonomySlugStatusSchema`, `taxonomyTopicSchema`, `taxonomySkillSchema`, `taxonomyOutcomeSchema` (i18n keys under `taxonomy.form.validation.*`).
````
FRAGMENT 1 - replace exactly:
````text
(i18n keys under `taxonomy.form.validation.*`).
````
with:
````text
(i18n keys under `taxonomy.form.validation.*`). `taxonomySlugStatusSchema` (and therefore the topic/skill schemas) validates an optional root `slug` with the shared `optionalSlugField` (`src/schema/shared/slug.ts`: blank allowed, otherwise `SLUG_PATTERN` and max `SLUG_MAX_LENGTH`); `getTaxonomyFormSchema(resourceKey, "edit")` swaps it for `requiredSlugField` so a blank slug on an existing item reports `taxonomy.form.validation.slugRequired`. Tree-node slugs are validated by `validateTaxonomyTreeSlugs` (`src/lib/utils/taxonomy/resource.ts`) with the same shared fields.
````
RESULTING LINE:
````text
- **Schemas**: `src/schema/taxonomy/taxonomy.ts` — `taxonomySlugStatusSchema`, `taxonomyTopicSchema`, `taxonomySkillSchema`, `taxonomyOutcomeSchema` (i18n keys under `taxonomy.form.validation.*`). `taxonomySlugStatusSchema` (and therefore the topic/skill schemas) validates an optional root `slug` with the shared `optionalSlugField` (`src/schema/shared/slug.ts`: blank allowed, otherwise `SLUG_PATTERN` and max `SLUG_MAX_LENGTH`); `getTaxonomyFormSchema(resourceKey, "edit")` swaps it for `requiredSlugField` so a blank slug on an existing item reports `taxonomy.form.validation.slugRequired`. Tree-node slugs are validated by `validateTaxonomyTreeSlugs` (`src/lib/utils/taxonomy/resource.ts`) with the same shared fields.
````

#### TAX-9 - `docs/taxonomy-admin.md:L150` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **Form UI**: `TaxonomyFormDialog` uses `RequiredLabel` + `FieldError` on `name` / `short_description`; Zod enforces `name` 1–255 and outcome fields per BE; keys resolve via `useTranslations("taxonomy.form")` + `validation.*`; slug preview stays read-only (`required={false}`).
````
FRAGMENT 1 - replace exactly:
````text
uses `RequiredLabel` + `FieldError` on `name` / `short_description`; Zod enforces `name` 1–255 and outcome fields per BE;
````
with:
````text
uses `FormField` (`RequiredLabel` + `FieldError`) on `name` / `short_description` / `slug`; Zod enforces `name` 1–`TAXONOMY_NAME_MAX_LENGTH` (255) and outcome fields per BE (`src/constants/taxonomy/limits.ts`);
````
FRAGMENT 2 - replace exactly:
````text
slug preview stays read-only (`required={false}`).
````
with:
````text
the root slug uses `SlugField` (`RequiredLabel` marker only in edit mode, `FieldError` under the input); the confirm for a create slug conflict is `SlugConflictConfirmDialog` rendered inside the form `DialogContent`.
````
RESULTING LINE:
````text
- **Form UI**: `TaxonomyFormDialog` uses `FormField` (`RequiredLabel` + `FieldError`) on `name` / `short_description` / `slug`; Zod enforces `name` 1–`TAXONOMY_NAME_MAX_LENGTH` (255) and outcome fields per BE (`src/constants/taxonomy/limits.ts`); keys resolve via `useTranslations("taxonomy.form")` + `validation.*`; the root slug uses `SlugField` (`RequiredLabel` marker only in edit mode, `FieldError` under the input); the confirm for a create slug conflict is `SlugConflictConfirmDialog` rendered inside the form `DialogContent`.
````

#### TAX-10 - `docs/taxonomy-admin.md:L152` - **REPLACE**

CURRENT (verbatim):
````text
- **API failures**: list delete and form create/update catch → `toastApiError(useTranslations("errors.codes"), error)` — never `taxonomy.common.errorGeneric` for API responses. Stale lock → **3005** / HTTP 409 (same as course).
````
REPLACEMENT (whole passage):
````text
- **API failures**: list delete and form create/update catch → `toastApiError(useTranslations("errors.codes"), error)` — never `taxonomy.common.errorGeneric` for API responses. Stale lock → **3005** / HTTP 409 (same as course). A create slug conflict → **3007** / HTTP 409 with `data.recommended_slug` is **not** toasted: `useSlugConflictFlow` opens the stacked recommended-slug confirm (see **Slug**).
````

### `docs/patterns.md`

#### PAT-1 - `docs/patterns.md:L349` - **REPLACE**

CURRENT (verbatim):
````text
| `taxonomy.form.validation` | `name`, `nameMax`, `shortDescription`, `shortDescriptionMax`, `descriptionMaxLines`, `descriptionLineMax` |
````
REPLACEMENT (whole passage):
````text
| `taxonomy.form.validation` | `name`, `nameMax`, `shortDescription`, `shortDescriptionMax`, `descriptionMaxLines`, `descriptionLineMax`, `slugRequired`, `slugInvalid`, `slugMax`, `treeSlug` |
````

#### PAT-2 - `docs/patterns.md:L572` - **REPLACE**

CURRENT (verbatim):
````text
**Taxonomy** slugs are **read-only** in the UI. Show a live preview with `generateSlug(name)` / `slugifyName(name)` while the user types the name. **Do not send `slug` in taxonomy create/update payloads** — the backend computes the persisted slug with `utils.SlugifyName`. Use one shared `TaxonomyTreeNode` type (`slug?` optional on write); strip slugs with `toTaxonomyTreeWritePayload()` before taxonomy mutations. Do not expose an editable slug input or duplicate tree node types. `generateSlug` / `slugifyName` are for taxonomy only.
````
REPLACEMENT (whole passage):
````text
**Taxonomy** slugs (levels, topics, skills, tags, and the per-node slugs inside topic `child_topics` / skill `children`) are **editable** and independent of `name`, using the same shared `SlugField` / `SlugInput`, `sanitizeSlugInput`, `SLUG_PATTERN` and `SLUG_MAX_LENGTH` as course slugs (see below); there is no name-derived slug or live preview in the FE and `generateSlug` / `slugifyName` no longer exist. Use one shared `TaxonomyTreeNode` type (`slug?` optional) and do not duplicate tree node types. Build payload slugs only with `payloadField("slug", changedNonBlank(slug, persistedSlug))` (`src/lib/utils/payload.ts`): a blank root slug is omitted on create so the BE generates it; on update `slug` is sent only when it differs from the persisted slug (a blank slug on an existing item is blocked in the form); a tree node's `slug` is sent only for a new node with a typed slug or an existing node whose slug was edited, through `toTaxonomyTreeWritePayload(nodes, persistedSlugs)`. A create `409` / code **3007** with `data.recommended_slug` is handled by the shared `useSlugConflictFlow` (`src/hooks/slug/use-slug-conflict-flow.ts`) with a stacked `SlugConflictConfirmDialog` (same flow as course create); update and tree-node conflicts are resolved by the BE and surfaced with the `taxonomy.form.slugAdjusted` / `taxonomy.form.treeSlugsAdjusted` toasts.
````

#### PAT-3 - `docs/patterns.md:L576` - **FRAGMENT**

CURRENT (verbatim line):
````text
- Create dialog: the slug is **optional**; a blank slug is omitted from `POST /courses` (`toCreateCoursePayload(title, slug)` from `@/lib/utils/course`) so the BE generates it. A `409` / code **3007** with `data.recommended_slug` (`extractRecommendedSlug`) opens a stacked `ConfirmActionDialog` (Yes resubmits with the recommended slug and repeats on a new 3007; No returns to the form) — see `useCourseCreateFlow` (`src/hooks/course/use-course-create-flow.ts`). Render the confirm as `ConfirmActionDialog stacked` inside the create `DialogContent` (React-tree nested): a sibling dialog would dismiss the parent (Radix treats its focus as outside), and the default `AlertDialog` variant comes from a separate Radix package copy whose focus trap fights the parent dialog's (`RangeError: Maximum call stack size exceeded`). Use `stacked` whenever a confirm opens over another `Dialog`.
````
FRAGMENT 1 - replace exactly:
````text
— see `useCourseCreateFlow` (`src/hooks/course/use-course-create-flow.ts`).
````
with:
````text
— see `useCourseCreateFlow` (`src/hooks/course/use-course-create-flow.ts`), which uses the shared `useSlugConflictFlow` (`src/hooks/slug/use-slug-conflict-flow.ts`).
````
RESULTING LINE:
````text
- Create dialog: the slug is **optional**; a blank slug is omitted from `POST /courses` (`toCreateCoursePayload(title, slug)` from `@/lib/utils/course`) so the BE generates it. A `409` / code **3007** with `data.recommended_slug` (`extractRecommendedSlug`) opens a stacked `ConfirmActionDialog` (Yes resubmits with the recommended slug and repeats on a new 3007; No returns to the form) — see `useCourseCreateFlow` (`src/hooks/course/use-course-create-flow.ts`), which uses the shared `useSlugConflictFlow` (`src/hooks/slug/use-slug-conflict-flow.ts`). Render the confirm as `ConfirmActionDialog stacked` inside the create `DialogContent` (React-tree nested): a sibling dialog would dismiss the parent (Radix treats its focus as outside), and the default `AlertDialog` variant comes from a separate Radix package copy whose focus trap fights the parent dialog's (`RangeError: Maximum call stack size exceeded`). Use `stacked` whenever a confirm opens over another `Dialog`.
````

### `docs/api-overview.md`

#### APIO-1 - `docs/api-overview.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last audited: 2026-07-22 (browser `[API]` Console only when NODE_ENV=development; server sanitized logs; prod browser silent)._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (taxonomy slug create/update contract; 3007 on taxonomy create). Prior: 2026-07-22 (browser `[API]` Console only when NODE_ENV=development; server sanitized logs; prod browser silent)._
````

#### APIO-2 - `docs/api-overview.md:L48` - **REPLACE**

CURRENT (verbatim):
````text
- `ApiErrorCode.SlugAlreadyExists` (**3007**, HTTP 409) is returned by `POST /courses` when the slug is taken; the create response body carries `data.recommended_slug`, read with `extractRecommendedSlug(error)` (`src/lib/utils/api-error.ts`, code 3007 only).
````
REPLACEMENT (whole passage):
````text
- `ApiErrorCode.SlugAlreadyExists` (**3007**, HTTP 409) is returned by `POST /courses` and by taxonomy create (`POST /taxonomy/{levels,topics,skills,tags}`) when the slug is taken; the response body carries `data.recommended_slug`, read with `extractRecommendedSlug(error)` (`src/lib/utils/api-error.ts`, code 3007 only). Slug conflicts on update (course basic-info PATCH, taxonomy PATCH) and on tree nodes are resolved by the BE (no 409); the response slug is authoritative.
````

#### APIO-3 - `docs/api-overview.md:L89` - **FRAGMENT**

CURRENT (verbatim line):
````text
| `POST /api/v1/courses` | `createCourseService` | Body `{ title, slug? }` (`toCreateCoursePayload`); a blank slug is omitted so the BE generates it. A taken slug returns `409` / code **3007** with `data.recommended_slug` (`extractRecommendedSlug`); `useCourseCreateFlow` confirms and resubmits with the recommended slug |
````
FRAGMENT 1 - replace exactly:
````text
`useCourseCreateFlow` confirms and resubmits with the recommended slug
````
with:
````text
`useCourseCreateFlow` (shared `useSlugConflictFlow`) confirms and resubmits with the recommended slug
````
RESULTING LINE:
````text
| `POST /api/v1/courses` | `createCourseService` | Body `{ title, slug? }` (`toCreateCoursePayload`); a blank slug is omitted so the BE generates it. A taken slug returns `409` / code **3007** with `data.recommended_slug` (`extractRecommendedSlug`); `useCourseCreateFlow` (shared `useSlugConflictFlow`) confirms and resubmits with the recommended slug |
````

#### APIO-4 - `docs/api-overview.md:L114` - **INSERT**
_New paragraph at the end of `## Taxonomy routes (private)` (before `## Media routes (private)`)._

Anchor line (unchanged; insert after it) - CURRENT:
````text
**Dual response:** list / `GET /:id?locale=` → localized/public shape; `GET /:id?view=edit` → admin editable (canonical + full `translations` + `row_version`). PATCH sends `expected_row_version` (stale → 409 / **3005**). See `docs/taxonomy-admin.md`, `docs/api-using.md` § Taxonomy.
````
INSERT text:
````text

**Slug (levels, topics, skills, tags):** create/update bodies accept an optional root `slug` and, for topics `child_topics` and skills `children`, an optional per-node `slug`. A blank root slug is omitted on create so the BE generates it from the canonical `name`; update sends `slug` only when changed. A taken root slug on create returns `409` / code **3007** with `data.recommended_slug` (`extractRecommendedSlug`); `useSlugConflictFlow` confirms and resubmits. Update and tree-node conflicts are resolved by the BE and the response slug is the source of truth (`taxonomy.form.slugAdjusted` when it differs from the slug sent). See `docs/taxonomy-admin.md` § Slug.
````

### `docs/api-using.md`

#### APIU-1 - `docs/api-using.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last audited: 2026-07-22 (server sanitized logs; browser no custom Console; compress body memo retained). Prior: raw GET cache; media 30s._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (taxonomy create/update slug contract and 3007 confirm flow). Prior: 2026-07-22 (server sanitized logs; browser no custom Console; compress body memo retained). Prior: raw GET cache; media 30s._
````

#### APIU-2 - `docs/api-using.md:L415` - **FRAGMENT**

CURRENT (verbatim line):
````text
Slug conflicts return HTTP `409` with app code **3007** (`ApiErrorCode.SlugAlreadyExists`, copy in `errors.codes.3007` en/vi). `extractRecommendedSlug(error)` (`src/lib/utils/api-error.ts`) reads `data.recommended_slug` (code 3007 only); `useCourseCreateFlow` opens a stacked `ConfirmActionDialog` (Yes resubmits with the recommended slug, No returns to the form). After a PATCH, `data.course.slug` is the source of truth and `course.editor.toast.slugAdjusted` shows when it differs from the slug sent. Input filtering and limits live in `src/lib/utils/slug.ts` (`sanitizeSlugInput`, `SLUG_PATTERN`, `SLUG_MAX_LENGTH`).
````
FRAGMENT 1 - replace exactly:
````text
`useCourseCreateFlow` opens a stacked `ConfirmActionDialog`
````
with:
````text
`useCourseCreateFlow` (built on the shared `useSlugConflictFlow`, which taxonomy create also uses) opens a stacked `ConfirmActionDialog`
````
RESULTING LINE:
````text
Slug conflicts return HTTP `409` with app code **3007** (`ApiErrorCode.SlugAlreadyExists`, copy in `errors.codes.3007` en/vi). `extractRecommendedSlug(error)` (`src/lib/utils/api-error.ts`) reads `data.recommended_slug` (code 3007 only); `useCourseCreateFlow` (built on the shared `useSlugConflictFlow`, which taxonomy create also uses) opens a stacked `ConfirmActionDialog` (Yes resubmits with the recommended slug, No returns to the form). After a PATCH, `data.course.slug` is the source of truth and `course.editor.toast.slugAdjusted` shows when it differs from the slug sent. Input filtering and limits live in `src/lib/utils/slug.ts` (`sanitizeSlugInput`, `SLUG_PATTERN`, `SLUG_MAX_LENGTH`).
````

#### APIU-3 - `docs/api-using.md:L469` - **INSERT**
_Inside the `createTaxonomyService("tags", {...})` sample._

Anchor line (unchanged; insert after it) - CURRENT:
````text
  name: "React",
````
INSERT text:
````text
  slug: "react", // optional — omit (or leave blank) to let the BE generate it; a taken slug → 409 / 3007 + data.recommended_slug
````

#### APIU-4 - `docs/api-using.md:L474` - **INSERT**
_Inside the `updateTaxonomyService("tags", id, {...})` sample._

Anchor line (unchanged; insert after it) - CURRENT:
````text
  translations: { vi: { name: "Phản ứng" } },
````
INSERT text:
````text
  slug: "react-js", // sent only when it differs from detail.slug; the BE resolves a taken slug and the response slug wins
````

#### APIU-5 - `docs/api-using.md:L482` - **INSERT**

Anchor line (unchanged; insert after it) - CURRENT:
````text
| `getTaxonomyDetailService` | `locale` → public/localized shape; `view: "edit"` → canonical + `translations` + tree translations + `row_version` |
````
INSERT text:
````text
| `createTaxonomyService` / `updateTaxonomyService` | Root `slug` (optional: blank omitted on create, sent on update only when changed) and tree-node `slug` (only when edited). Create conflict → `409` / **3007** + `data.recommended_slug` (`extractRecommendedSlug`; `useSlugConflictFlow` confirms and resubmits). Update conflicts are resolved by the BE and the response `slug` wins (`taxonomy.form.slugAdjusted`). |
````

#### APIU-6 - `docs/api-using.md:L539` - **REPLACE**

CURRENT (verbatim):
````text
- `409` slug conflicts use code **3007** (`ApiErrorCode.SlugAlreadyExists`); `extractRecommendedSlug(error)` reads `data.recommended_slug` for the create-course confirm flow.
````
REPLACEMENT (whole passage):
````text
- `409` slug conflicts use code **3007** (`ApiErrorCode.SlugAlreadyExists`); `extractRecommendedSlug(error)` reads `data.recommended_slug` for the create-course and taxonomy-create confirm flows (`useSlugConflictFlow`).
````

### `docs/instructor-admin.md`

#### INS-1 - `docs/instructor-admin.md:L3` - **REPLACE**
_Audit stamp; apply only together with INS-2._

CURRENT (verbatim):
````text
_Last audited: 2026-07-06 — Approvals ⋮ menu: **Delete** only when applicant account is ineligible (disabled / banned / email unconfirmed); active users get View + Approve + Reject only. Prior: roster profile modal on `portfolioId`; removed Profiles screen._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (course create dialog now built on the shared `useSlugConflictFlow`). Prior: 2026-07-06 — Approvals ⋮ menu: **Delete** only when applicant account is ineligible (disabled / banned / email unconfirmed); active users get View + Approve + Reject only. Prior: roster profile modal on `portfolioId`; removed Profiles screen._
````

#### INS-2 - `docs/instructor-admin.md:L88` - **FRAGMENT**

CURRENT (verbatim line):
````text
**My Courses** (`InstructorCoursesPage`): create dialog sends `{ title, slug? }` via `toCreateCoursePayload(title, slug)` (driven by `useCourseCreateFlow`, `src/hooks/course/use-course-create-flow.ts`). The slug is an editable **optional** field (shared `SlugInput`; input filtered by `sanitizeSlugInput` to `a-z 0-9 -`, whitespace becomes `-`, max 255) with a static placeholder and hint; there is no title-derived slug or live preview in the FE. A blank slug is omitted from the request so the BE generates it. If the slug is taken the BE returns `409` / code **3007** with `data.recommended_slug`; the flow opens a `ConfirmActionDialog` with the `stacked` variant (rendered inside the create `DialogContent`; the `stacked` variant shares the create dialog's `Dialog` primitive family, so focus traps cooperate and Radix does not dismiss the parent) — **Yes** resubmits with the recommended slug (and repeats if a new 3007 comes back), **No** returns to the form. Title must have ≥5 non-whitespace characters (FE `courseCreateSchema` + BE `nonwhitespace_min=5`).
````
FRAGMENT 1 - replace exactly:
````text
(driven by `useCourseCreateFlow`, `src/hooks/course/use-course-create-flow.ts`)
````
with:
````text
(driven by `useCourseCreateFlow`, `src/hooks/course/use-course-create-flow.ts`, which builds on the shared `useSlugConflictFlow`, `src/hooks/slug/use-slug-conflict-flow.ts`)
````

### `docs/logic-flow.md`

#### LF-1 - `docs/logic-flow.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last audited: 2026-07-08 (Discord + Google OAuth on popup; X code retained). Prior: 2026-06-26 (course admin ⋮ menu → dialog: `modal={false}` + deferred `onSelect` so `body` stays clickable after approve/trash flows). Prior: course version numbering §13, reject-fork draft, reorder nested merge._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (taxonomy create/update slug flow §10b; §10a source now includes the shared slug-conflict hook). Prior: 2026-07-08 (Discord + Google OAuth on popup; X code retained). Prior: 2026-06-26 (course admin ⋮ menu → dialog: `modal={false}` + deferred `onSelect` so `body` stays clickable after approve/trash flows). Prior: course version numbering §13, reject-fork draft, reorder nested merge._
````

#### LF-2 - `docs/logic-flow.md:L360` - **FRAGMENT**

CURRENT (verbatim line):
````text
**Source:** `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`), `src/lib/utils/course.ts` (`toCreateCoursePayload`), `src/lib/utils/api-error.ts` (`extractRecommendedSlug`), `src/components/shared/slug-input.tsx`, `src/screen/instructor/courses/page.tsx`
````
FRAGMENT 1 - replace exactly:
````text
`src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`),
````
with:
````text
`src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`), `src/hooks/slug/use-slug-conflict-flow.ts` (`useSlugConflictFlow`),
````
RESULTING LINE:
````text
**Source:** `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`), `src/hooks/slug/use-slug-conflict-flow.ts` (`useSlugConflictFlow`), `src/lib/utils/course.ts` (`toCreateCoursePayload`), `src/lib/utils/api-error.ts` (`extractRecommendedSlug`), `src/components/shared/slug-input.tsx`, `src/screen/instructor/courses/page.tsx`
````

#### LF-3 - `docs/logic-flow.md:L382` - **INSERT_BEFORE**
_New section placed after §10a's closing `---` and before `## 11.` (do not renumber; other docs link to §11)._

Anchor line (unchanged; insert before it) - CURRENT:
````text
## 11. Course Editor — Submit-for-Review Validation Flow
````
INSERT text:
````text
## 10b. Taxonomy Create / Update — Slug and Slug Conflict (3007)

**Source:** `src/components/features/taxonomy/taxonomy-form-dialog.tsx` (`TaxonomyFormDialog`), `src/components/features/taxonomy/taxonomy-tree-editor.tsx` (`TaxonomyTreeEditor`), `src/components/features/taxonomy/tree-node-slug-field.tsx` (`TreeNodeSlugField`), `src/lib/utils/taxonomy/form-submit.ts` (`buildTaxonomySubmitPayload`, `persistTaxonomyForm`, `getTaxonomySaveSlugNotice`), `src/lib/utils/taxonomy/resource.ts` (`toTaxonomyTreeWritePayload`, `validateTaxonomyTreeSlugs`), `src/lib/utils/payload.ts` (`payloadField`, `changedNonBlank`), `src/lib/utils/slug.ts` (`isSlugAdjusted`), `src/schema/shared/slug.ts`, `src/hooks/slug/use-slug-conflict-flow.ts` (`useSlugConflictFlow`), `src/lib/utils/api-error.ts` (`extractRecommendedSlug`), `src/components/shared/slug-field.tsx`, `src/components/shared/slug-conflict-confirm-dialog.tsx`

```
Admin submits the form dialog (levels | topics | skills | tags)
  ↓
zodResolver(getTaxonomyFormSchema(resourceKey, mode))
  → edit: blank slug → slugRequired (field error, no request)
  ↓
useSlugConflictFlow.prepare
  → validateTaxonomyTreeSlugs (topics/skills)
        persisted node blank, or malformed node slug → node error + toast, no request
  → buildTaxonomySubmitPayload
        root slug: blank → omitted; edit → sent only if ≠ persisted slug
        tree nodes: slug sent only for a new node with a typed slug or an edited existing node
  ↓
create:  POST /api/v1/taxonomy/{resource}
  ├─ success → notice → close dialog, refresh list
  ├─ 409 + code 3007 + data.recommended_slug  (extractRecommendedSlug(error))
  │     → SlugConflictConfirmDialog (ConfirmActionDialog stacked, taxonomy.form.slugConflict*)
  │         ├─ Yes → resubmit with slug = recommended_slug   (repeats on a new 3007)
  │         └─ No  → close confirm, return to form (input unchanged)
  └─ other error → toastApiError(tErrors, error)   (incl. 3005 stale lock)

update:  PATCH /api/v1/taxonomy/{resource}/:id  { …fields, expected_row_version, slug? }
  ├─ success → notice → close dialog, refresh list
  └─ error → toastApiError(tErrors, error)

notice (getTaxonomySaveSlugNotice):
  response slug ≠ sent slug          → toast taxonomy.form.slugAdjusted
  a sent node slug came back changed → toast taxonomy.form.treeSlugsAdjusted
  neither                            → taxonomy.common.createSuccess / updateSuccess
```

The FE never derives a slug from `name`; a blank root slug lets the BE generate it. Update and tree-node collisions are resolved by the BE (no 409). The create confirm is rendered inside the form `DialogContent` for the same reason as §10a.

---

````

### `docs/architecture.md`

#### ARC-1 - `docs/architecture.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last audited: 2026-09-16 (Technology Stack: added Jest/RTL/MSW unit/integration tests and Playwright browser tests rows; Quality gates section and Related Docs updated for `e2e-browser.yml` and `testing.md` — see `docs/testing.md`). Prior: 2026-06-17 (Turbopack dev tuning, `clean:next` / `dev:clean` scripts)._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (taxonomy slug UI: `SlugInput` and `extractRecommendedSlug` now shared by course and taxonomy; `useSlugConflictFlow`; shared `FormField`, `tree.ts`, `payload.ts`; `SortableTreeEditor` merged into `TaxonomyTreeEditor`). Prior: 2026-09-16 (Technology Stack: added Jest/RTL/MSW unit/integration tests and Playwright browser tests rows; Quality gates section and Related Docs updated for `e2e-browser.yml` and `testing.md` — see `docs/testing.md`). Prior: 2026-06-17 (Turbopack dev tuning, `clean:next` / `dev:clean` scripts)._
````

#### ARC-2 - `docs/architecture.md:L284` - **REPLACE**

CURRENT (verbatim):
````text
| `extractRecommendedSlug` | `lib/utils/api-error.ts` | Read `data.recommended_slug` from a `409` / code 3007 (`SlugAlreadyExists`) create-course error |
````
REPLACEMENT (whole passage):
````text
| `extractRecommendedSlug` | `lib/utils/api-error.ts` | Read `data.recommended_slug` from a `409` / code 3007 (`SlugAlreadyExists`) create error (create-course and taxonomy create) |
````

#### ARC-3 - `docs/architecture.md:L286` - **REPLACE**

CURRENT (verbatim):
````text
| `SlugInput` | `components/shared/slug-input.tsx` | Editable slug field (filters through `sanitizeSlugInput`: `a-z 0-9 -`, whitespace becomes `-`, max 255); used by the course create dialog (optional) and the course basic-info tab (required) |
````
REPLACEMENT (whole passage):
````text
| `SlugInput` | `components/shared/slug-input.tsx` | Editable slug field (filters through `sanitizeSlugInput`: `a-z 0-9 -`, whitespace becomes `-`, max 255); used by the course create dialog (optional), the course basic-info tab (required), the taxonomy form root slug and per-node tree slugs |
````

#### ARC-4 - `docs/architecture.md:L286` - **INSERT**
_Insert directly after the (replaced) `SlugInput` row (ARC-3)._

Anchor line (unchanged; insert after it) - CURRENT:
````text
| `SlugInput` | `components/shared/slug-input.tsx` | Editable slug field (filters through `sanitizeSlugInput`: `a-z 0-9 -`, whitespace becomes `-`, max 255); used by the course create dialog (optional) and the course basic-info tab (required) |
````
INSERT text:
````text
| `useSlugConflictFlow` | `hooks/slug/use-slug-conflict-flow.ts` | Generic create-with-optional-slug submit: on `409` / 3007 exposes the BE `recommended_slug` for a stacked `ConfirmActionDialog` (accept resubmits, dismiss returns to the form); used by course create and taxonomy create |
````

#### ARC-5 - `docs/architecture.md:L286` - INSERT (second row only; first row unchanged)
````text
| `optionalSlugField` / `requiredSlugField` | `schema/shared/slug.ts` | The single slug zod rule set (blank-allowed / required first, then `SLUG_PATTERN` + `SLUG_MAX_LENGTH`) used by the course and taxonomy schemas and by tree-node slug validation |
| `omitWhenBlank` / `changedNonBlank` / `payloadField` | `lib/utils/payload.ts` | The single "omit blank / omit unchanged" rule for optional write-payload fields (course + taxonomy builders) |
| `isSlugAdjusted` | `lib/utils/slug.ts` | "The server adjusted the slug" check (sent vs saved) shared by course and taxonomy |
| `walkTree` / `flattenTree` / `countTreeNodes` / `getTreeMaxDepth` / `findTreePath` / `findTreeNodeById` / `updateTreeNode` | `lib/utils/tree.ts` | Generic `{ id, children? }` tree helpers shared by taxonomy, the dashboard nav resolver and the dagre layout |
````

### `docs/components.md`

#### CMP-1 - `docs/components.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last audited: 2026-09-29 (course slug UI: shared `SlugInput`, create-course optional slug + recommended-slug confirm, basic-info editable slug). Prior: 2026-07-10 (AdvancedPromoSection promo image: subtle hover brightness)._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (taxonomy slug UI: `SlugInput` + `SlugField` + `FormField`, per-node slug in `TaxonomyTreeEditor` (`SortableTreeEditor` merged into it), shared `useSlugConflictFlow`). Prior: 2026-09-29 (course slug UI: shared `SlugInput`, create-course optional slug + recommended-slug confirm, basic-info editable slug). Prior: 2026-07-10 (AdvancedPromoSection promo image: subtle hover brightness)._
````

#### CMP-2 - `docs/components.md:L230` - **FRAGMENT**

CURRENT (verbatim line):
````text
| `ConfirmActionDialog` | `confirm-action-dialog.tsx` | Generic confirm shell (`title`, `description`, `confirmLabel`, `cancelLabel`, `isLoading`, `loadingLabel`); blocks close while loading. Default renders a Radix `AlertDialog`. `stacked` renders a `Dialog` (`role="alertdialog"`, no close button, outside interaction ignored) for use **inside the content of another `Dialog`** — the same primitive family as the parent, so both focus traps cooperate (a separate `AlertDialog` copy fights the parent trap: `RangeError: Maximum call stack size exceeded`). Composed by `ConfirmDeleteDialog`, course submit-review confirm, and the stacked recommended-slug confirm in the create-course flow (`stacked`, rendered inside the create `DialogContent`). |
````
FRAGMENT 1 - replace exactly:
````text
and the stacked recommended-slug confirm in the create-course flow (`stacked`, rendered inside the create `DialogContent`).
````
with:
````text
and the stacked recommended-slug confirm in the create-course and taxonomy-create flows (`useSlugConflictFlow`; `stacked`, rendered inside the parent create `DialogContent`).
````
RESULTING LINE:
````text
| `ConfirmActionDialog` | `confirm-action-dialog.tsx` | Generic confirm shell (`title`, `description`, `confirmLabel`, `cancelLabel`, `isLoading`, `loadingLabel`); blocks close while loading. Default renders a Radix `AlertDialog`. `stacked` renders a `Dialog` (`role="alertdialog"`, no close button, outside interaction ignored) for use **inside the content of another `Dialog`** — the same primitive family as the parent, so both focus traps cooperate (a separate `AlertDialog` copy fights the parent trap: `RangeError: Maximum call stack size exceeded`). Composed by `ConfirmDeleteDialog`, course submit-review confirm, and the stacked recommended-slug confirm in the create-course and taxonomy-create flows (`useSlugConflictFlow`; `stacked`, rendered inside the parent create `DialogContent`). |
````

#### CMP-4 - `docs/components.md:L236` - **REPLACE**

CURRENT (verbatim):
````text
| `SlugInput` | `slug-input.tsx` | Editable slug `Input`; every change is filtered by `sanitizeSlugInput` (`a-z 0-9 -`, spaces become `-`, max 255). Used by the create-course dialog (optional) and the course editor basic-info tab (required). Does not auto-derive from a title; taxonomy keeps its read-only preview. |
````
REPLACEMENT (whole passage):
````text
| `SlugInput` | `slug-input.tsx` | Editable slug `Input`; every change is filtered by `sanitizeSlugInput` (`a-z 0-9 -`, spaces become `-`, max 255). Used by the create-course dialog (optional), the course editor basic-info tab (required), the taxonomy form root slug and the per-node slug in `TaxonomyTreeEditor` (`TreeNodeSlugField`). Does not auto-derive from a name or title. |
````

#### CMP-8 - `docs/components.md:L236` - INSERT (two rows; the `TreeNodeSlugField` row is removed because the component is in `features/taxonomy`, covered by MOVE-5)
````text
| `SlugField` | `slug-field.tsx` | Labelled slug form field: `FormField` (`RequiredLabel` + hint + `FieldError`) around a `SlugInput`; `name`/`ref`/`onBlur`/`disabled` pass through (works under RHF `Controller` and plain state). Used by the create-course dialog, the course basic-info tab and the taxonomy form root slug. |
| `SlugConflictConfirmDialog` | `slug-conflict-confirm-dialog.tsx` | Stacked "use the recommended slug?" confirm (`ConfirmActionDialog stacked`) driven by `useSlugConflictFlow`'s `suggestedSlug`; render inside the parent `DialogContent`. Used by the create-course dialog and `TaxonomyFormDialog`. |
````

#### CMP-7 - `docs/components.md:L261` - **INSERT**

Anchor line (unchanged; insert after it) - CURRENT:
````text
| `useSearchablePaginatedOptions` | `hooks/searchable-select/use-searchable-paginated-options.ts` | Popover UX + wiring for `SearchableSelect`: debounced search, pinned `selectedLabel`, `excludeValues`, `onOptionSelect`. Data via `useApiInfiniteListQuery` with `getRowKey` dedupe on `mapToOption(item).value`. See `docs/patterns.md` §4 SearchableSelect. |
````
INSERT text:
````text
| `useSlugConflictFlow` | `hooks/slug/use-slug-conflict-flow.ts` | Create-with-optional-slug submit + `409`/3007 recommended-slug confirm state (`extractRecommendedSlug`); shared by the course create dialog and taxonomy create. See `docs/logic-flow.md` §10a/§10b. |
````

### `docs/reusable-assets.md`

#### RA-1 - `docs/reusable-assets.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last audited: 2026-09-29 (course slug management UI: `SlugInput`, `sanitizeSlugInput`, `extractRecommendedSlug`, `useCourseCreateFlow`, `ApiErrorCode.SlugAlreadyExists`). Prior: 2026-07-10 (Homepage marketing images under `public/assets/images/home`); before that: 2026-06-14 (Quill SSR lazy load via `ensureQuillLoaded`)._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (taxonomy slug management UI: `useSlugConflictFlow`, `FormField` / `SlugField`, `payload.ts`, `tree.ts`, per-node slug in `TaxonomyTreeEditor`, `SlugInput` reuse in taxonomy). Prior: 2026-09-29 (course slug management UI: `SlugInput`, `sanitizeSlugInput`, `extractRecommendedSlug`, `useCourseCreateFlow`, `ApiErrorCode.SlugAlreadyExists`). Prior: 2026-07-10 (Homepage marketing images under `public/assets/images/home`); before that: 2026-06-14 (Quill SSR lazy load via `ensureQuillLoaded`)._
````

#### RA-2 - `docs/reusable-assets.md:L154` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **Reuse Rule**: Always import from here. Never hardcode `code === 0`, `code === 3002` or `code === 3007` inline (use `ApiErrorCode.SlugAlreadyExists` for a duplicate course slug; copy lives in `errors.codes.3007` in `src/messages/error-codes.ts`, en + vi).
````
FRAGMENT 1 - replace exactly:
````text
(use `ApiErrorCode.SlugAlreadyExists` for a duplicate course slug;
````
with:
````text
(use `ApiErrorCode.SlugAlreadyExists` for a duplicate course or taxonomy slug;
````
RESULTING LINE:
````text
- **Reuse Rule**: Always import from here. Never hardcode `code === 0`, `code === 3002` or `code === 3007` inline (use `ApiErrorCode.SlugAlreadyExists` for a duplicate course or taxonomy slug; copy lives in `errors.codes.3007` in `src/messages/error-codes.ts`, en + vi).
````

#### RA-4 - `docs/reusable-assets.md:L505` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **Purpose**: Multi-locale content presets for taxonomy translation tabs; BCP47 canonicalize; **whitelist** add via `resolveAllowedContentLocale` (dropdown-only — no free-enter); hydrate form defaultValues / translation maps; compact empty locales before write; slug preview helpers.
````
FRAGMENT 1 - replace exactly:
````text
compact empty locales before write; slug preview helpers.
````
with:
````text
compact empty locales before write; persisted-slug baseline (`getPersistedTaxonomySlug`) for the changed-only slug rule.
````
RESULTING LINE:
````text
- **Purpose**: Multi-locale content presets for taxonomy translation tabs; BCP47 canonicalize; **whitelist** add via `resolveAllowedContentLocale` (dropdown-only — no free-enter); hydrate form defaultValues / translation maps; compact empty locales before write; persisted-slug baseline (`getPersistedTaxonomySlug`) for the changed-only slug rule.
````

#### RA-5 - `docs/reusable-assets.md:L507` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **Dependencies**: `LANGUAGE_OPTIONS` (for `en`/`vi` labels), `slugifyName`, taxonomy types.
````
FRAGMENT 1 - replace exactly:
````text
`LANGUAGE_OPTIONS` (for `en`/`vi` labels), `slugifyName`, taxonomy types.
````
with:
````text
`LANGUAGE_OPTIONS` (for `en`/`vi` labels), taxonomy types.
````
RESULTING LINE:
````text
- **Dependencies**: `LANGUAGE_OPTIONS` (for `en`/`vi` labels), taxonomy types.
````

#### RA-6 - `docs/reusable-assets.md:L537` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **Purpose**: Create/update taxonomy rows per `resourceKey`; locale UI is a multi-preset combobox only (`CONTENT_LOCALE_OPTIONS`, **no en/vi Tabs**, **no free-enter**; placeholder “Select language” / “Chọn ngôn ngữ”; scrollable list + empty copy); submit via `buildTaxonomySubmitPayload` / `persistTaxonomyForm` from `@/lib/utils/taxonomy/form-submit`; canonical + `translations` (and tree node `translations`); initializes `useForm` and local tree/description/image state from **edit detail** on mount (no `useEffect` sync). Update body includes `expected_row_version`. Slug preview is read-only via `resolveTaxonomySlugPreview(name, persistedSlug)`.
````
FRAGMENT 1 - replace exactly:
````text
Slug preview is read-only via `resolveTaxonomySlugPreview(name, persistedSlug)`.
````
with:
````text
The root slug is the shared editable `SlugInput` (default = persisted `slug`; blank omitted on create; sent on update only when changed); a create `409` / **3007** opens the stacked recommended-slug `ConfirmActionDialog` through `useSlugConflictFlow`, and a BE-adjusted update slug toasts `taxonomy.form.slugAdjusted`.
````
RESULTING LINE:
````text
- **Purpose**: Create/update taxonomy rows per `resourceKey`; locale UI is a multi-preset combobox only (`CONTENT_LOCALE_OPTIONS`, **no en/vi Tabs**, **no free-enter**; placeholder “Select language” / “Chọn ngôn ngữ”; scrollable list + empty copy); submit via `buildTaxonomySubmitPayload` / `persistTaxonomyForm` from `@/lib/utils/taxonomy/form-submit`; canonical + `translations` (and tree node `translations`); initializes `useForm` and local tree/description/image state from **edit detail** on mount (no `useEffect` sync). Update body includes `expected_row_version`. The root slug is the shared editable `SlugInput` (default = persisted `slug`; blank omitted on create; sent on update only when changed); a create `409` / **3007** opens the stacked recommended-slug `ConfirmActionDialog` through `useSlugConflictFlow`, and a BE-adjusted update slug toasts `taxonomy.form.slugAdjusted`.
````

#### RA-7 - `docs/reusable-assets.md:L539` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **Dependencies**: `@/lib/utils/taxonomy` (resource + form-helpers), `@/lib/utils/taxonomy/form-submit`, `slugifyName`, `MediaCollectionDialog`, taxonomy Zod schemas, `toastApiError` (incl. **3005**).
````
FRAGMENT 1 - replace exactly:
````text
`@/lib/utils/taxonomy/form-submit`, `slugifyName`, `MediaCollectionDialog`,
````
with:
````text
`@/lib/utils/taxonomy/form-submit`, `SlugInput`, `useSlugConflictFlow`, `ConfirmActionDialog`, `MediaCollectionDialog`,
````
RESULTING LINE:
````text
- **Dependencies**: `@/lib/utils/taxonomy` (resource + form-helpers), `@/lib/utils/taxonomy/form-submit`, `SlugInput`, `useSlugConflictFlow`, `ConfirmActionDialog`, `MediaCollectionDialog`, taxonomy Zod schemas, `toastApiError` (incl. **3005**).
````

#### RA-9 - `docs/reusable-assets.md:L592` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **Scope**: `ConfirmDeleteDialog` wrapper; instructor course editor submit-review confirm (`editor-page.tsx`); stacked "use recommended slug?" confirm over the create-course dialog (`useCourseCreateFlow`, `InstructorCoursesPage`; `stacked` variant rendered inside the create `DialogContent`).
````
FRAGMENT 1 - replace exactly:
````text
stacked "use recommended slug?" confirm over the create-course dialog (`useCourseCreateFlow`, `InstructorCoursesPage`; `stacked` variant rendered inside the create `DialogContent`).
````
with:
````text
stacked "use recommended slug?" confirm over the create-course dialog (`useCourseCreateFlow`, `InstructorCoursesPage`) and the taxonomy create form (`TaxonomyFormDialog`), both through `useSlugConflictFlow` (`stacked` variant rendered inside the parent create `DialogContent`).
````
RESULTING LINE:
````text
- **Scope**: `ConfirmDeleteDialog` wrapper; instructor course editor submit-review confirm (`editor-page.tsx`); stacked "use recommended slug?" confirm over the create-course dialog (`useCourseCreateFlow`, `InstructorCoursesPage`) and the taxonomy create form (`TaxonomyFormDialog`), both through `useSlugConflictFlow` (`stacked` variant rendered inside the parent create `DialogContent`).
````

#### RA-10a - `docs/reusable-assets.md:L719` - **REPLACE**

CURRENT (verbatim):
````text
- **Purpose**: Create-course dialog state machine. Builds the `POST /api/v1/courses` body with `toCreateCoursePayload(title, slug)` (`{ title, slug? }`; a blank slug is omitted and the BE generates it — the slug is never derived from the title on the FE). On HTTP 409 with `code === ApiErrorCode.SlugAlreadyExists` (3007) it reads `data.recommended_slug` via `extractRecommendedSlug` and exposes `suggestedSlug` for a stacked `ConfirmActionDialog`: `acceptSuggestion` resubmits with the recommended slug, `dismissSuggestion` returns to the form. Any other error goes to `toastApiError`.
````
REPLACEMENT (whole passage):
````text
- **Purpose**: Create-course dialog state. Builds the `POST /api/v1/courses` body with `toCreateCoursePayload(title, slug)` (`{ title, slug? }`; a blank slug is omitted and the BE generates it — the slug is never derived from the title on the FE) and delegates the conflict handling to the shared `useSlugConflictFlow`: on HTTP 409 with `code === ApiErrorCode.SlugAlreadyExists` (3007) it reads `data.recommended_slug` via `extractRecommendedSlug` and exposes `suggestedSlug` for a stacked `ConfirmActionDialog` — `acceptSuggestion` resubmits with the recommended slug, `dismissSuggestion` returns to the form. Any other error goes to `toastApiError`.
````

#### RA-10b - `docs/reusable-assets.md:L721` - **REPLACE**

CURRENT (verbatim):
````text
- **Dependencies**: `toCreateCoursePayload` (`src/lib/utils/course.ts`), `extractRecommendedSlug` / `toastApiError` (`src/lib/utils/api-error.ts`), `ApiErrorCode`, `courseCreateSchema`, `createCourseService` (`src/api/callers/course`).
````
REPLACEMENT (whole passage):
````text
- **Dependencies**: `useSlugConflictFlow` (`src/hooks/slug/use-slug-conflict-flow.ts`), `toCreateCoursePayload` (`src/lib/utils/course.ts`), `courseCreateSchema`, `createCourseService` (`src/api/callers/course`).
````

#### RA-10c - `docs/reusable-assets.md:L722` - **REPLACE**

CURRENT (verbatim):
````text
- **Reuse Rule**: Reuse for any create-with-optional-slug flow; never re-implement 3007 handling inline.
````
REPLACEMENT (whole passage):
````text
- **Reuse Rule**: Course-specific wrapper — use it only for the create-course dialog. For any other create-with-optional-slug flow use `useSlugConflictFlow`; never re-implement 3007 handling inline.
````

#### RA-11 - `docs/reusable-assets.md:L722` - **INSERT**

Anchor line (unchanged; insert after it) - CURRENT:
````text
- **Reuse Rule**: Reuse for any create-with-optional-slug flow; never re-implement 3007 handling inline.
````
INSERT text:
````text

### Asset: useSlugConflictFlow
- **Name**: `useSlugConflictFlow<TPayload, TResult>({ slug, setSlug, prepare, request, onSuccess })`
- **Type**: React hook
- **Path**: `src/hooks/slug/use-slug-conflict-flow.ts` (barrel `src/hooks/slug/index.ts`, re-exported from `src/hooks/index.ts`)
- **Purpose**: Generic create/update-with-optional-slug submit state. `prepare(slug)` validates and builds the payload (return `null` after surfacing feedback to skip the request); `request(payload)` performs the call; on HTTP 409 with `code === ApiErrorCode.SlugAlreadyExists` (3007) it reads `data.recommended_slug` via `extractRecommendedSlug` and exposes `suggestedSlug` for `SlugConflictConfirmDialog` (`acceptSuggestion` writes it back with `setSlug` and resubmits, repeating on a new 3007; `dismissSuggestion` returns to the form). Any other error goes to `toastApiError`. Returns `{ isSubmitting, suggestedSlug, submit, acceptSuggestion, dismissSuggestion }`.
- **Scope**: `useCourseCreateFlow` (create-course dialog) and `TaxonomyFormDialog` (levels, topics, skills, tags; create and update share the path, but only create can receive a 3007).
- **Dependencies**: `extractRecommendedSlug` / `toastApiError` (`src/lib/utils/api-error.ts`), `next-intl` `errors.codes`.
- **Reuse Rule**: Reuse for any submit with an optional slug; never re-implement 3007 handling inline.

### Asset: SlugConflictConfirmDialog
- **Name**: `SlugConflictConfirmDialog`, `SlugConflictConfirmDialogProps`
- **Type**: React component
- **Path**: `src/components/shared/slug-conflict-confirm-dialog.tsx`
- **Purpose**: Stacked "use the recommended slug?" confirm: `ConfirmActionDialog stacked`, open while `suggestedSlug !== null`, accept/dismiss callbacks, caller-supplied labels (the `{slug}` interpolation stays with the caller because namespaces differ per domain).
- **Scope**: Create-course dialog and `TaxonomyFormDialog`; render it inside the parent `DialogContent`.
- **Dependencies**: `ConfirmActionDialog`.
- **Reuse Rule**: Use with `useSlugConflictFlow`; do not copy the `ConfirmActionDialog stacked` wiring.

### Asset: SlugField
- **Name**: `SlugField`, `SlugFieldProps`
- **Type**: React component
- **Path**: `src/components/shared/slug-field.tsx`
- **Purpose**: `FormField` (`RequiredLabel` + optional hint + `FieldError`) around a `SlugInput` for a slug form field; `name` / `ref` / `onBlur` / `disabled` pass through to `SlugInput` so it works under react-hook-form `Controller` and with plain state.
- **Scope**: Create-course dialog, course editor basic-info tab, `TaxonomyFormDialog` root slug.
- **Dependencies**: `FormField`, `SlugInput`.
- **Reuse Rule**: Use for any labelled slug form field; use bare `SlugInput` only where the layout differs (tree node).

### Asset: TreeNodeSlugField
- **Name**: `TreeNodeSlugField`
- **Type**: React component
- **Path**: `src/components/features/taxonomy/tree-node-slug-field.tsx`
- **Purpose**: Per-node slug control for `TaxonomyTreeEditor`: muted slug text (or the "generated from the name" placeholder) with a pencil button that toggles an inline `SlugInput` and a done button; stays open while an error is set.
- **Scope**: `TaxonomyTreeEditor` (topics/skills tree).
- **Dependencies**: `SlugInput`, `Button`, `FieldError`, lucide `Pencil` / `Check`.
- **Reuse Rule**: Do not add another per-node slug input.

### Asset: optionalSlugField / requiredSlugField
- **Name**: `optionalSlugField`, `requiredSlugField`
- **Type**: Zod schema fields
- **Path**: `src/schema/shared/slug.ts` (import from `@/schema/shared`)
- **Purpose**: The single slug rule set: `optionalSlugField` allows blank, otherwise `SLUG_PATTERN` and `SLUG_MAX_LENGTH`; `requiredSlugField` reports `validation.slugRequired` first. Messages are the keys `validation.slugRequired` / `slugInvalid` / `slugMax`, so every consuming namespace defines the same three keys.
- **Scope**: `courseCreateSchema`, `courseBasicInfoSchema`, `taxonomySlugStatusSchema`, `getTaxonomyFormSchema`, `validateTaxonomyTreeSlugs`.
- **Dependencies**: `SLUG_PATTERN`, `SLUG_MAX_LENGTH`.
- **Reuse Rule**: Never re-declare a slug regex or length check in a schema.
````

#### RA-13a - `docs/reusable-assets.md:L827` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **Purpose**: Controlled text input for an **editable** slug (`value` + `onValueChange`). Every change goes through `sanitizeSlugInput`: whitespace becomes `-`, every character outside `a-z 0-9 -` (uppercase, accented) is dropped, length capped at `SLUG_MAX_LENGTH` (255). It does not derive a slug from a title. Callers own validation (course schemas, `SLUG_PATTERN`) and error display (`FieldError`).
````
FRAGMENT 1 - replace exactly:
````text
Callers own validation (course schemas, `SLUG_PATTERN`)
````
with:
````text
Callers own validation (course and taxonomy schemas, `SLUG_PATTERN`)
````
RESULTING LINE:
````text
- **Purpose**: Controlled text input for an **editable** slug (`value` + `onValueChange`). Every change goes through `sanitizeSlugInput`: whitespace becomes `-`, every character outside `a-z 0-9 -` (uppercase, accented) is dropped, length capped at `SLUG_MAX_LENGTH` (255). It does not derive a slug from a title. Callers own validation (course and taxonomy schemas, `SLUG_PATTERN`) and error display (`FieldError`).
````

#### RA-13b - `docs/reusable-assets.md:L828` - **REPLACE**

CURRENT (verbatim):
````text
- **Scope**: Create-course dialog (optional slug) and the course editor basic-info tab (required slug, disabled without a draft). Taxonomy keeps its read-only slug preview and does not use this component.
````
REPLACEMENT (whole passage):
````text
- **Scope**: Create-course dialog (optional slug), the course editor basic-info tab (required slug, disabled without a draft), the taxonomy form root slug (optional on create) and the per-node slug in `TaxonomyTreeEditor` (`TreeNodeSlugField`, topics/skills).
````

#### RA-14 - `docs/reusable-assets.md:L848-L854` - **REPLACE** (delete the whole asset)
_`generateSlug` / `slugifyName` are deleted in code (`src/lib/utils/slug.ts`, barrel line, `slug.test.ts`); the only consumers were the removed read-only previews._

CURRENT (verbatim):
````text
### Asset: slugifyName
- **Name**: `slugifyName(text: string): string`
- **Type**: Utility function
- **Path**: `src/lib/utils/slug.ts`
- **Purpose**: Build slug from display name (`generateSlug` + `slugifyName` alias): trim, lowercase, remove Vietnamese accents (`đ/Đ -> d`), spaces/underscores → `-`, keep Unicode letters/numbers, collapse repeated dashes. Used for **taxonomy read-only UI preview only** (taxonomy slugs are still computed on BE via `utils.SlugifyName`); course slugs are user-editable and do not use this helper.
- **Scope**: Taxonomy form dialog, tree editor, submit handlers. Not used for course slugs.
- **Dependencies**: none.
````
REPLACEMENT: delete the passage above including the blank line that follows it (the next heading `### Asset: sanitizeSlugInput / SLUG_MAX_LENGTH / SLUG_PATTERN` becomes adjacent to the previous asset's blank line).

#### RA-15 - `docs/reusable-assets.md:L856-L863` - **REPLACE**

CURRENT (verbatim):
````text
### Asset: sanitizeSlugInput / SLUG_MAX_LENGTH / SLUG_PATTERN
- **Name**: `sanitizeSlugInput(value: string): string`, `SLUG_MAX_LENGTH` (255), `SLUG_PATTERN`
- **Type**: Utility function + constants
- **Path**: `src/lib/utils/slug.ts` (import from `@/lib/utils/slug`; the `@/lib/utils` barrel re-exports only `generateSlug` / `slugifyName`)
- **Purpose**: Editable-slug input filter and validation constants. `sanitizeSlugInput` maps whitespace to `-`, drops every character outside `a-z 0-9 -` (uppercase and accented letters are dropped, not lowercased or transliterated; non-Latin letters and emoji too) and truncates to `SLUG_MAX_LENGTH`. `SLUG_PATTERN` (`^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$`) is the accepted final shape used by the course Zod schemas. `generateSlug` / `slugifyName` are unchanged (taxonomy preview only).
- **Scope**: `SlugInput`, `courseCreateSchema` / `courseBasicInfoSchema` slug fields.
- **Dependencies**: none.
- **Reuse Rule**: Import the constants instead of repeating `255` or a slug regex.
````
REPLACEMENT (whole passage):
````text
### Asset: sanitizeSlugInput / SLUG_MAX_LENGTH / SLUG_PATTERN / isSlugAdjusted
- **Name**: `sanitizeSlugInput(value: string): string`, `SLUG_MAX_LENGTH` (255), `SLUG_PATTERN`, `isSlugAdjusted(sentSlug: string | undefined, savedSlug: string): boolean`
- **Type**: Utility functions + constants
- **Path**: `src/lib/utils/slug.ts` (import from `@/lib/utils/slug`; the `@/lib/utils` barrel no longer re-exports anything from it)
- **Purpose**: Editable-slug input filter, validation constants and the "server adjusted the slug" check. `sanitizeSlugInput` maps whitespace to `-`, drops every character outside `a-z 0-9 -` (uppercase and accented letters are dropped, not lowercased or transliterated; non-Latin letters and emoji too) and truncates to `SLUG_MAX_LENGTH`. `SLUG_PATTERN` (`^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$`) is the accepted final shape used by the shared slug zod fields. `isSlugAdjusted` is true when a slug was sent and the server stored a different one.
- **Scope**: `SlugInput`, `optionalSlugField` / `requiredSlugField`, `handleSaveBasicInfo`, `getTaxonomySaveSlugNotice`.
- **Dependencies**: none.
- **Reuse Rule**: Import the constants instead of repeating `255` or a slug regex; use `isSlugAdjusted` instead of an inline sent/saved comparison; the omit-blank / omit-unchanged payload rule is `src/lib/utils/payload.ts` (see **payload utils**).
````

#### RA-16 - `docs/reusable-assets.md:L1228` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **Scope**: Auth, Me, Media, Taxonomy, Instructor, Course — all `catch` blocks after API calls; `extractRecommendedSlug` — create-course flow (`useCourseCreateFlow`).
````
FRAGMENT 1 - replace exactly:
````text
`extractRecommendedSlug` — create-course flow (`useCourseCreateFlow`).
````
with:
````text
`extractRecommendedSlug` — create-with-slug flows (`useSlugConflictFlow`: course create, taxonomy create).
````
RESULTING LINE:
````text
- **Scope**: Auth, Me, Media, Taxonomy, Instructor, Course — all `catch` blocks after API calls; `extractRecommendedSlug` — create-with-slug flows (`useSlugConflictFlow`: course create, taxonomy create).
````

### `docs/folder-structure.md`

#### FS-1 - `docs/folder-structure.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last audited: 2026-09-29 (course slug UI: `slug-input.tsx`, `use-course-create-flow.ts`, `slug.ts` `sanitizeSlugInput`, `e2e/tests/course-slug.spec.ts`). Prior: 2026-09-16 (added `e2e/`, `src/test-support/`, `scripts/e2e-lifecycle.mjs`, `jest.config.ts`, `playwright.config.ts`; `src/**/*.test.ts(x)` colocated test files across the source tree — see `docs/testing.md`). Prior: 2026-07-08 (Discord OAuth: server actions, hooks, callback; popup uses Discord not X; X code retained); 2026-06-08 (validation schemas, api-error utils, error-codes messages)._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (taxonomy slug UI: `src/hooks/slug/use-slug-conflict-flow.ts`, `src/schema/shared/slug.ts`, `src/lib/utils/{tree,payload}.ts`, `src/constants/taxonomy/limits.ts`, `src/components/shared/{form-field,slug-field,slug-conflict-confirm-dialog}.tsx`, tree editor merged into `src/components/features/taxonomy/taxonomy-tree-editor.tsx`, `e2e/tests/taxonomy-slug.spec.ts`). Prior: 2026-09-29 (course slug UI: `slug-input.tsx`, `use-course-create-flow.ts`, `slug.ts` `sanitizeSlugInput`, `e2e/tests/course-slug.spec.ts`). Prior: 2026-09-16 (added `e2e/`, `src/test-support/`, `scripts/e2e-lifecycle.mjs`, `jest.config.ts`, `playwright.config.ts`; `src/**/*.test.ts(x)` colocated test files across the source tree — see `docs/testing.md`). Prior: 2026-07-08 (Discord OAuth: server actions, hooks, callback; popup uses Discord not X; X code retained); 2026-06-08 (validation schemas, api-error utils, error-codes messages)._
````

#### FS-9 - `docs/folder-structure.md:L200` - **FRAGMENT**

CURRENT (verbatim line):
````text
│                           #   SortableTreeEditor, SlugInput, PreviewPdf (dynamic client-only) + preview-pdf-viewer,
````
FRAGMENT 1 - replace exactly:
````text
SortableTreeEditor, SlugInput,
````
with:
````text
SlugInput, FormField, SlugField, SlugConflictConfirmDialog,
````
RESULTING LINE:
````text
│                           #   SlugInput, FormField, SlugField, SlugConflictConfirmDialog, PreviewPdf (dynamic client-only) + preview-pdf-viewer,
````

#### FS-2 - `docs/folder-structure.md:L340` - **INSERT**
_In the `src/hooks/` tree, directly after the `quill/` block and before `└── use-mobile.ts`._

Anchor line (unchanged; insert after it) - CURRENT:
````text
│   └── use-delta-editor-media-handlers.ts
````
INSERT text:
````text
├── slug/
│   ├── index.ts            # Barrel: use-slug-conflict-flow
│   └── use-slug-conflict-flow.ts  # useSlugConflictFlow: generic submit with an optional slug + 409/3007 recommended-slug confirm state (course create + taxonomy)
````

#### FS-11 - `docs/folder-structure.md:L509-L511` (the inventory says L510; the three lines are L509, L510, L511) - REPLACE
`countTaxonomyTreeNodes` is deleted (tree helpers live in `tree.ts`); there is no `flattenTaxonomyTree`.
````text
│   │   ├── resource.ts     # getTaxonomyResourceConfig, getTaxonomySearchableColumns, getTaxonomyTreeFromEntity, buildTaxonomyDagreRoot, collectTaxonomyTreeSlugs, toTaxonomyTreeWritePayload (persisted-slug aware), validateTaxonomyTreeSlugs, hasAdjustedTaxonomyTreeSlugs, createTaxonomyTreeNode (node count / depth: `src/lib/utils/tree.ts`)
│   │   ├── form-helpers.ts # CONTENT_LOCALE_OPTIONS, canonicalizeContentLocale, buildTaxonomyFormDefaultValues (seeds slug), getPersistedTaxonomySlug, buildTaxonomySlugBaseline, TAXONOMY_TREE_INDENT_PX, compact*Translations
│   │   └── form-submit.ts  # buildTaxonomySubmitPayload, persistTaxonomyForm (returns the saved entity), getTaxonomySaveSlugNotice (slug: blank omitted on create, only changed on update/tree nodes) — import as `@/lib/utils/taxonomy/form-submit` only
````

#### FS-6 - `docs/folder-structure.md:L512` - **REPLACE**

CURRENT (verbatim):
````text
│   ├── slug.ts             # generateSlug() + slugifyName() (taxonomy preview) + sanitizeSlugInput(), SLUG_MAX_LENGTH, SLUG_PATTERN (editable slug input; import via `@/lib/utils/slug` — the barrel re-exports only generateSlug/slugifyName)
````
REPLACEMENT (whole passage):
````text
│   ├── slug.ts             # sanitizeSlugInput(), SLUG_MAX_LENGTH, SLUG_PATTERN, isSlugAdjusted() (course + taxonomy slug rules; import via `@/lib/utils/slug` — not re-exported by the barrel; the omit-blank / omit-unchanged payload rule is `payload.ts`)
````

#### FS-7 - `docs/folder-structure.md:L641` - **FRAGMENT**

CURRENT (verbatim line):
````text
│   └── server.mjs                # Loopback HTTP fixture backend (plain node:http, no framework) — auth, /me, course detail/collaborators/candidates (2 seeded outline sections)/sections-reorder/leases, taxonomy lists; POST /api/v1/courses (slug create incl. 409/3007 + recommended_slug) and course basic-info PATCH slug echo; CORS headers for cross-origin browser calls
````
FRAGMENT 1 - replace exactly:
````text
and course basic-info PATCH slug echo; CORS headers
````
with:
````text
and course basic-info PATCH slug echo; POST/PATCH /api/v1/taxonomy/{resource} (slug create incl. 409/3007 + recommended_slug, adjusted slug echo on update); CORS headers
````
RESULTING LINE:
````text
│   └── server.mjs                # Loopback HTTP fixture backend (plain node:http, no framework) — auth, /me, course detail/collaborators/candidates (2 seeded outline sections)/sections-reorder/leases, taxonomy lists; POST /api/v1/courses (slug create incl. 409/3007 + recommended_slug) and course basic-info PATCH slug echo; POST/PATCH /api/v1/taxonomy/{resource} (slug create incl. 409/3007 + recommended_slug, adjusted slug echo on update); CORS headers for cross-origin browser calls
````

#### FS-8 - `docs/folder-structure.md:L649` - **INSERT**

Anchor line (unchanged; insert after it) - CURRENT:
````text
    ├── course-slug.spec.ts       # optional slug on create, 409/3007 recommended-slug confirm (Yes/No), basic-info slug edit
````
INSERT text:
````text
    ├── taxonomy-slug.spec.ts     # root slug on create, 409/3007 recommended-slug confirm (Yes/No), update slug-adjusted toast, per-node slug edit
````

### `docs/modules.md`

#### MOD-1 - `docs/modules.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last audited: 2026-09-29 (Course slug management UI: editable slug on create + basic-info, 3007 recommended-slug confirm). Prior: 2026-07-08 (Auth module: Discord + Google on popup; X OAuth code retained). Prior: 2026-06-17 (course read-path performance: `include_outline`, `include_images`, browser-verified info tab)._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (Taxonomy slug management UI: editable root + per-node slug, 3007 recommended-slug confirm via shared hook). Prior: 2026-09-29 (Course slug management UI: editable slug on create + basic-info, 3007 recommended-slug confirm). Prior: 2026-07-08 (Auth module: Discord + Google on popup; X OAuth code retained). Prior: 2026-06-17 (course read-path performance: `include_outline`, `include_images`, browser-verified info tab)._
````

#### MOD-2 - `docs/modules.md:L41` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **UI**: `src/screen/common/taxonomy/taxonomy-list-page.tsx` (`TaxonomyListPage`), app routes under `src/app/[locale]/{admin,sysadmin}/taxonomy/*/page.tsx`, `src/components/features/taxonomy/*` (incl. `TaxonomyTreeViewButton` with `nodesDraggable={false}`, `child_render` column), shared `DagreTreeDialog`, `ConfirmDeleteDialog`.
````
FRAGMENT 1 - replace exactly:
````text
shared `DagreTreeDialog`, `ConfirmDeleteDialog`.
````
with:
````text
shared `DagreTreeDialog`, `ConfirmDeleteDialog`, `FormField`, `SlugField` / `SlugInput`, `ConfirmActionDialog` (`stacked`, via `SlugConflictConfirmDialog`); the sortable tree editor with per-node slug is `TaxonomyTreeEditor` (`taxonomy-tree-editor.tsx`, `tree-node-slug-field.tsx`).
````
RESULTING LINE:
````text
- **UI**: `src/screen/common/taxonomy/taxonomy-list-page.tsx` (`TaxonomyListPage`), app routes under `src/app/[locale]/{admin,sysadmin}/taxonomy/*/page.tsx`, `src/components/features/taxonomy/*` (incl. `TaxonomyTreeViewButton` with `nodesDraggable={false}`, `child_render` column), shared `DagreTreeDialog`, `ConfirmDeleteDialog`, `FormField`, `SlugField` / `SlugInput`, `ConfirmActionDialog` (`stacked`, via `SlugConflictConfirmDialog`); the sortable tree editor with per-node slug is `TaxonomyTreeEditor` (`taxonomy-tree-editor.tsx`, `tree-node-slug-field.tsx`).
````

#### MOD-3 - `docs/modules.md:L41` - **INSERT**

Anchor line (unchanged; insert after it) - CURRENT:
````text
- **UI**: `src/screen/common/taxonomy/taxonomy-list-page.tsx` (`TaxonomyListPage`), app routes under `src/app/[locale]/{admin,sysadmin}/taxonomy/*/page.tsx`, `src/components/features/taxonomy/*` (incl. `TaxonomyTreeViewButton` with `nodesDraggable={false}`, `child_render` column), shared `DagreTreeDialog`, `ConfirmDeleteDialog`.
````
INSERT text:
````text
- **Slug**: editable root and per-node slug (shared `SlugInput`; `sanitizeSlugInput` / `SLUG_PATTERN` / `SLUG_MAX_LENGTH` from `src/lib/utils/slug.ts`); a create `409` / **3007** goes through `useSlugConflictFlow` (`src/hooks/slug/use-slug-conflict-flow.ts`, shared with course create) and a stacked `ConfirmActionDialog`; update sends `slug` only when changed and toasts `taxonomy.form.slugAdjusted` when the BE adjusts it.
````

#### MOD-4 - `docs/modules.md:L85` - **FRAGMENT**

CURRENT (verbatim line):
````text
  - `src/hooks/course/use-course-create-flow.ts` — `useCourseCreateFlow`: create-course submit with optional slug (`toCreateCoursePayload`, blank slug omitted), 409 + `ApiErrorCode.SlugAlreadyExists` (3007) → `extractRecommendedSlug` → `ConfirmActionDialog stacked` rendered inside the create dialog (Yes resubmits with `data.recommended_slug`, No returns to the form)
````
FRAGMENT 1 - replace exactly:
````text
`useCourseCreateFlow`: create-course submit with optional slug (`toCreateCoursePayload`, blank slug omitted),
````
with:
````text
`useCourseCreateFlow` (built on the shared `useSlugConflictFlow`): create-course submit with optional slug (`toCreateCoursePayload`, blank slug omitted),
````
RESULTING LINE:
````text
  - `src/hooks/course/use-course-create-flow.ts` — `useCourseCreateFlow` (built on the shared `useSlugConflictFlow`): create-course submit with optional slug (`toCreateCoursePayload`, blank slug omitted), 409 + `ApiErrorCode.SlugAlreadyExists` (3007) → `extractRecommendedSlug` → `ConfirmActionDialog stacked` rendered inside the create dialog (Yes resubmits with `data.recommended_slug`, No returns to the form)
````

### `docs/pages.md`

#### PG-1 - `docs/pages.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last audited: 2026-09-29 — course slug management UI (create-dialog optional slug + 3007 confirm; basic-info editable slug). Prior: 2026-09-19 — route-based login/signup modal (`/login`, `/signup` + `@modal` intercepting slot), replacing modal-only Zustand auth. Prior: 2026-07-26 temporary signed-in `/{locale}/home`; 2026-07-06 roster `?portfolioId=` modal; Profiles screen removed; become-instructor route._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 — taxonomy slug management UI (form-dialog editable slug + 3007 confirm; tree-node slug edit). Prior: 2026-09-29 — course slug management UI (create-dialog optional slug + 3007 confirm; basic-info editable slug). Prior: 2026-09-19 — route-based login/signup modal (`/login`, `/signup` + `@modal` intercepting slot), replacing modal-only Zustand auth. Prior: 2026-07-26 temporary signed-in `/{locale}/home`; 2026-07-06 roster `?portfolioId=` modal; Profiles screen removed; become-instructor route._
````

#### PG-2 - `docs/pages.md:L88` - **REPLACE**

CURRENT (verbatim):
````text
| Taxonomy list + form dialog | `taxonomy.form.validation.*`, `RequiredLabel`, `FieldError`; create/edit remounts `TaxonomyFormDialog` via `formDialogKey` so `initialData` hydrates form + slug preview (controlled `open` does not invoke Radix `onOpenChange(true)`) | `toastApiError` on delete / create / update |
````
REPLACEMENT (whole passage):
````text
| Taxonomy list + form dialog | `taxonomy.form.validation.*`, `RequiredLabel`, `FieldError`; editable root slug (`SlugInput`, `SLUG_PATTERN`, max 255; blank allowed) and per-node slug toggles in the tree editor; create/edit remounts `TaxonomyFormDialog` via `formDialogKey` so `initialData` hydrates the form incl. the slug (controlled `open` does not invoke Radix `onOpenChange(true)`) | `toastApiError` on delete / create / update (a create 409/3007 with a recommended slug is handled by a stacked `ConfirmActionDialog`, not toasted; `taxonomy.form.slugAdjusted` when the BE adjusts an update slug) |
````

### `docs/screens.md`

#### SCR-1 - `docs/screens.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last audited: 2026-09-29 (course slug UI: create dialog optional slug + 3007 confirm; info tab editable slug). Prior: 2026-09-19 (route-based login/signup modal: `/login` + `/signup` pages, `@modal` parallel/intercepting slot, `LoginSignupPopup` no longer mounted in `header.tsx` / `DashboardLayout`, Zustand `authAction`/`nextLink` removed). Prior: 2026-07-26 temporary signed-in `/home` route + SignedInHomePage; 2026-07-10 Homepage sections use `public/assets/images/home` static assets; 2026-07-08 Discord + Google on login/signup popup._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (taxonomy slug UI: form-dialog editable root slug + 3007 confirm, per-node tree slug). Prior: 2026-09-29 (course slug UI: create dialog optional slug + 3007 confirm; info tab editable slug). Prior: 2026-09-19 (route-based login/signup modal: `/login` + `/signup` pages, `@modal` parallel/intercepting slot, `LoginSignupPopup` no longer mounted in `header.tsx` / `DashboardLayout`, Zustand `authAction`/`nextLink` removed). Prior: 2026-07-26 temporary signed-in `/home` route + SignedInHomePage; 2026-07-10 Homepage sections use `public/assets/images/home` static assets; 2026-07-08 Discord + Google on login/signup popup._
````

#### SCR-2 - `docs/screens.md:L56` - **REPLACE**

CURRENT (verbatim):
````text
| `/{locale}/admin/taxonomy/{resource}` | Active | Shared `TaxonomyListPage` (resource = levels \| topics \| outcomes \| skills \| tags); list uses `locale` from `useLocale()`; create/edit increments `formDialogKey` and remounts `TaxonomyFormDialog`; **edit loads** `getTaxonomyDetailService(…, { view: "edit" })` (canonical + translations Tabs + `expected_row_version`) |
````
REPLACEMENT (whole passage):
````text
| `/{locale}/admin/taxonomy/{resource}` | Active | Shared `TaxonomyListPage` (resource = levels \| topics \| outcomes \| skills \| tags); list uses `locale` from `useLocale()`; create/edit increments `formDialogKey` and remounts `TaxonomyFormDialog`; **edit loads** `getTaxonomyDetailService(…, { view: "edit" })` (canonical + translations Tabs + `expected_row_version`); levels/topics/skills/tags forms have an editable root slug (`SlugInput`; create 409/3007 opens a stacked recommended-slug `ConfirmActionDialog`) and topics/skills tree nodes an inline-editable slug |
````

#### SCR-3 - `docs/screens.md:L430` - **REPLACE**

CURRENT (verbatim):
````text
| `SlugInput` | `slug-input.tsx` | Editable slug input filtered by `sanitizeSlugInput` — course create dialog, course basic-info tab. |
````
REPLACEMENT (whole passage):
````text
| `SlugInput` | `slug-input.tsx` | Editable slug input filtered by `sanitizeSlugInput` — course create dialog, course basic-info tab, taxonomy form root slug, taxonomy tree-node slug (`TaxonomyTreeEditor`). |
````

#### SCR-4 - `docs/screens.md:L430` - INSERT (the `TreeNodeSlugField` row is removed: it is a `features/taxonomy` component, not in `components/shared`)
````text
| `SlugField` | `slug-field.tsx` | Labelled slug field (`FormField` + `SlugInput`) — course create dialog, course basic-info tab, taxonomy form root slug. |
| `SlugConflictConfirmDialog` | `slug-conflict-confirm-dialog.tsx` | Stacked recommended-slug confirm — course create dialog, taxonomy form dialog. |
````

### `docs/testing.md`

#### TST-1 - `docs/testing.md:L3` - **REPLACE**
_Audit stamp (precedent: add-course-slug-management-ui inventory keeps the old text as `Prior:`)._

CURRENT (verbatim):
````text
_Last updated: 2026-09-29 — course slug management UI tests added under `openspec/changes/add-course-slug-management-ui` (new behavior matrix and Playwright journey below). Prior: 2026-09-16 — Stage 1 (foundation), Stage 2 (priority business flows), and Stage 3 (browser runtime and bounded expansion) delivered under `openspec/changes/add-frontend-test-coverage`. This is selected-scope coverage, not whole-repository or exhaustive-file coverage._
````
REPLACEMENT (whole passage):
````text
_Last updated: 2026-10-14 — taxonomy slug management UI tests added under `openspec/changes/add-taxonomy-slug-management-ui` (behavior matrix and Playwright journey below). Prior: 2026-09-29 — course slug management UI tests added under `openspec/changes/add-course-slug-management-ui` (new behavior matrix and Playwright journey below). Prior: 2026-09-16 — Stage 1 (foundation), Stage 2 (priority business flows), and Stage 3 (browser runtime and bounded expansion) delivered under `openspec/changes/add-frontend-test-coverage`. This is selected-scope coverage, not whole-repository or exhaustive-file coverage._
````

#### TST-2 - `docs/testing.md:L28` - **FRAGMENT**

CURRENT (verbatim line):
````text
- **Fixture backend:** `e2e/fixtures/server.mjs` — a plain `node:http` server (no framework), loopback-bound, serving the subset of the real BE contract the journeys need: `/api/v1/auth/login`, `/api/v1/auth/refresh` (upstream, called server-side), `/api/v1/auth/logout`, `/api/v1/me`, one synthetic course's detail/collaborators/instructor-candidates/collaborators-bulk (with two seeded outline sections)/sections-reorder/leases (acquire, heartbeat, release), a fixed `course-fixture-forbidden` course id that always returns 403 for an authenticated request (exercises `StatusErrorPage`'s forbidden variant), and empty taxonomy lists. The synthetic course's `draft_version` carries valid basic-info fields (about-course delta, thumbnail/level/topic/tag/skill/outcome UUIDs) so the info tab can be saved. `POST /api/v1/courses` accepts an optional slug (slug `taken-slug` returns 409 + code 3007 + `data.recommended_slug` `taken-slug-x7k92ab`; any other request returns 201 with the fixture course), and `PATCH /api/v1/courses/course-fixture-1/basic-info` echoes the slug (`taken-slug` becomes the suffixed slug) and increments the draft `row_version`; both are used by `course-slug.spec.ts`. `POST /__fixtures__/reset` and `POST /__fixtures__/revoke-session` reset/mutate state between scenarios. Slug and draft row-version state also reset there. Two synthetic accounts only (`instructor@example.test`, `learner@example.test`), never real credentials.
````
FRAGMENT 1 - replace exactly:
````text
and empty taxonomy lists.
````
with:
````text
and taxonomy lists (empty by default; `POST`/`PATCH /api/v1/taxonomy/{resource}` accept an optional slug — a taken slug on create returns 409 + code 3007 + `data.recommended_slug`, an update echoes the BE-adjusted slug — used by `taxonomy-slug.spec.ts`).
````

#### TST-3 - `docs/testing.md:L38` - **INSERT**

Anchor line (unchanged; insert after it) - CURRENT:
````text
  - `course-slug.spec.ts` — seven cases for `openspec/changes/add-course-slug-management-ui`: creating a course with a blank slug (omitted from the request body) opens the editor; the slug input filters typing down to `a-z 0-9 -`; a duplicate slug triggers the 409/3007 stacked confirm and Yes resubmits with the recommended slug; No returns to the form; the basic-info tab shows the current slug and toasts when the backend-resolved slug differs from the one sent; saving without touching the slug omits `slug` from the PATCH body and shows the normal success toast; clearing the slug blocks saving.
````
INSERT text:
````text
  - `taxonomy-slug.spec.ts` — [N] cases for `openspec/changes/add-taxonomy-slug-management-ui`: creating a taxonomy item with a blank slug omits it from the request body; the slug input filters typing down to `a-z 0-9 -`; a duplicate slug triggers the 409/3007 stacked confirm and Yes resubmits with the recommended slug; No returns to the form; editing a slug sends it only when changed and toasts when the backend-resolved slug differs; a tree node slug is edited through the pencil toggle and sent only when changed.
````

#### TST-4 - `docs/testing.md:L71` - **REPLACE**

CURRENT (verbatim):
````text
| `src/schema/taxonomy/taxonomy.ts` (`taxonomySlugStatusSchema`, `taxonomyTopicSchema`, `taxonomySkillSchema`, `taxonomyOutcomeSchema`) | `src/schema/taxonomy/taxonomy.test.ts` | valid/blank/missing/over-length name, invalid status enum, name trimming, topic/skill inherit base validation, outcome short-description bounds, description line-count/length limits | ✅ Passing (16 cases) |
````
REPLACEMENT (whole passage):
````text
| `src/schema/taxonomy/taxonomy.ts` (`taxonomySlugStatusSchema`, `taxonomyTopicSchema`, `taxonomySkillSchema`, `taxonomyOutcomeSchema`) | `src/schema/taxonomy/taxonomy.test.ts` | valid/blank/missing/over-length name, invalid status enum, name trimming, topic/skill inherit base validation, outcome short-description bounds, description line-count/length limits, optional slug (blank allowed, `SLUG_PATTERN`, over-length rejected) | ✅ Passing ([N] cases) |
````

#### TST-5 - `docs/testing.md:L74` - **REPLACE**

CURRENT (verbatim):
````text
| Browser journeys (see Harness — Playwright above) | `e2e/tests/*.spec.ts` | auth (login/logout/expired-session/forbidden), collaborator submission, keyboard-driven outline section reorder (persists across reload), locale/404, course editor forbidden `StatusErrorPage` variant, course slug create/409-confirm/basic-info edit | ✅ Passing (17 cases, real Chromium + real Next server) |
````
REPLACEMENT (whole passage):
````text
| Browser journeys (see Harness — Playwright above) | `e2e/tests/*.spec.ts` | auth (login/logout/expired-session/forbidden), collaborator submission, keyboard-driven outline section reorder (persists across reload), locale/404, course editor forbidden `StatusErrorPage` variant, course slug create/409-confirm/basic-info edit, taxonomy slug create/409-confirm/update/tree-node edit | ✅ Passing ([N] cases, real Chromium + real Next server) |
````

#### TST-7 - `docs/testing.md:L84` - **FRAGMENT**

CURRENT (verbatim line):
````text
| `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`) | `src/hooks/course/use-course-create-flow.test.tsx` | blank slug omitted and `onCreated` called, manual slug sent, 3007 exposes `suggestedSlug` without `onCreated`, accept resubmits with the recommended slug, dismiss keeps the form and sends nothing, a repeated 3007 replaces the suggestion, other errors clear the suggestion, an invalid slug is blocked before any request | ✅ Passing (8 cases) |
````
FRAGMENT 1 - replace exactly:
````text
| `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`) |
````
with:
````text
| `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`, delegating to `useSlugConflictFlow`) |
````
RESULTING LINE:
````text
| `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`, delegating to `useSlugConflictFlow`) | `src/hooks/course/use-course-create-flow.test.tsx` | blank slug omitted and `onCreated` called, manual slug sent, 3007 exposes `suggestedSlug` without `onCreated`, accept resubmits with the recommended slug, dismiss keeps the form and sends nothing, a repeated 3007 replaces the suggestion, other errors clear the suggestion, an invalid slug is blocked before any request | ✅ Passing (8 cases) |
````

#### TST-6 - `docs/testing.md:L86` - **INSERT**
_New matrix section after the `Behavior matrix — course slug management UI` table (before the `Selected-scope coverage baseline` paragraph). Counts are `[N]` placeholders: fill them from the real run and mark ✅ Passing only after the tests pass._

Anchor line (unchanged; insert after it) - CURRENT:
````text
| `src/components/shared/confirm-action-dialog.tsx` (`ConfirmActionDialog`, default and `stacked`) | `src/components/shared/confirm-action-dialog.test.tsx` | default alert dialog reports confirm/cancel; `stacked` renders inside a parent `Dialog`, keeps it open, and reports confirm/cancel; `stacked` ignores dismissal while loading | ✅ Passing (3 cases) |
````
INSERT text:
````text
## Behavior matrix — taxonomy slug management UI

| Source contract | Test file | Cases | Status |
|---|---|---|---|
| `src/lib/utils/payload.ts` (`omitWhenBlank`, `changedNonBlank`, `payloadField`) | `src/lib/utils/payload.test.ts` | blank/whitespace omitted, trimmed value returned, equal-to-persisted omitted, changed value sent, create default persisted `""`, key absent when spread | [Status] ([N] cases) |
| `src/lib/utils/slug.ts` (`isSlugAdjusted`) | `src/lib/utils/slug.test.ts` | undefined sent slug, equal, different (the sanitize / pattern cases are in the course matrix row) | [Status] ([N] cases) |
| `src/lib/utils/tree.ts` (`walkTree`, `flattenTree`, `countTreeNodes`, `getTreeMaxDepth`, `findTreePath`, `findTreeNodeById`, `updateTreeNode`) | `src/lib/utils/tree.test.ts` | traversal order and parent/depth, flatten, count (empty = 0), maximum depth, path to a nested node / not found, lookup by id, immutable single-node update | [Status] ([N] cases) |
| `src/schema/shared/slug.ts` (`optionalSlugField`, `requiredSlugField`) | `src/schema/shared/slug.test.ts` | blank allowed on optional, valid and invalid formats, over-length `validation.slugMax`, required reports `validation.slugRequired` first | [Status] ([N] cases) |
| `src/schema/taxonomy/taxonomy.ts` (`taxonomySlugStatusSchema` slug, `getTaxonomyFormSchema`) | `src/schema/taxonomy/taxonomy.test.ts` | slug omitted/blank valid on create, valid and invalid formats, over-length, edit schema rejects blank with `validation.slugRequired`, inheritance by topic/skill, outcomes unaffected, name / short-description limits from `src/constants/taxonomy/limits.ts` | [Status] ([N] cases) |
| `src/hooks/slug/use-slug-conflict-flow.ts` (`useSlugConflictFlow`) | `src/hooks/slug/use-slug-conflict-flow.test.tsx` | prepare `null` skips the request, success calls `onSuccess`, 3007 exposes the suggestion, accept writes the slug back and resubmits, repeated 3007 replaces the suggestion, dismiss sends nothing, other errors clear the suggestion and toast | [Status] ([N] cases) |
| `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`, delegating to `useSlugConflictFlow`) | `src/hooks/course/use-course-create-flow.test.tsx` | unchanged 8 cases | ✅ Passing (8 cases) |
| `src/lib/utils/taxonomy/resource.ts` (`collectTaxonomyTreeSlugs`, `toTaxonomyTreeWritePayload`, `validateTaxonomyTreeSlugs`, `hasAdjustedTaxonomyTreeSlugs`) | `src/lib/utils/taxonomy/resource.test.ts` | untouched nodes omit slug, new node with typed slug sends it, edited existing node sends it, blank omitted, nested children and translations preserved, persisted-blank and malformed node slugs reported, adjusted-slug detection | [Status] ([N] cases) |
| `src/lib/utils/taxonomy/form-helpers.ts` (`buildTaxonomyFormDefaultValues`, `buildTaxonomySlugBaseline`) | `src/lib/utils/taxonomy/form-helpers.test.ts` | slug seeded from the persisted slug (create empty, outcomes none), baseline holds root and node slugs | [Status] ([N] cases) |
| `src/lib/utils/taxonomy/form-submit.ts` (`buildTaxonomySubmitPayload`, `persistTaxonomyForm`, `getTaxonomySaveSlugNotice`) | `src/lib/utils/taxonomy/form-submit.test.ts` | blank root slug omitted on create, root slug sent on update only when changed, tree slugs through the baseline, blank `image_file_id` omitted, outcomes payload has no slug, persist returns the saved entity, save notice for root/tree/none | [Status] ([N] cases) |
| `src/components/shared/form-field.tsx`, `slug-field.tsx`, `slug-conflict-confirm-dialog.tsx` | `*.test.tsx` next to each file | label `htmlFor` / hint / error wiring and ref passthrough; closed when no suggestion, accept/dismiss/loading | [Status] ([N] cases) |
| `src/components/features/taxonomy/tree-node-slug-field.tsx`, `taxonomy-tree-editor.tsx` (per-node slug) | `*.test.tsx` next to each file | placeholder, pencil toggle, filtered typing, stays open with an error; node slugs rendered, editing reports only that node, new node placeholder, node error shown | [Status] ([N] cases) |
| `src/components/features/taxonomy/taxonomy-form-dialog.tsx` (root + node slug, 3007 confirm) | `src/components/features/taxonomy/taxonomy-form-dialog.test.tsx` | create blank slug omitted / typed sent, 409/3007 confirm (Yes resubmits, No keeps the form), edit rename omits slug, changed slug sent with adjusted notice, blank slug and cleared node slug blocked, per resource, outcomes has no slug field | [Status] ([N] cases) |
| `src/components/common/auth-menu/auth/login-content.tsx` (auth form fields on the shared `resolveValidationMessage` / `FieldError`) | `src/components/common/auth-menu/auth/login-content.test.tsx` | unchanged 3 cases (required errors, format error clears, visibility toggle) | ✅ Passing (3 cases) |
````

---

# Part 2 — Additional edit items from the codebase-wide capability refactors (grouped per file)


## A1. `docs/architecture.md`

#### MOVE-1 - `docs/architecture.md:L20` - **REPLACE**

CURRENT (verbatim):
````text
| DnD / tree edit | @dnd-kit/* | 6.x | `SortableList`, `SortableTreeEditor` in `src/components/shared/` |
````
REPLACEMENT (whole passage):
````text
| DnD / tree edit | @dnd-kit/* | 6.x | `SortableList` in `src/components/shared/`; `TaxonomyTreeEditor` (nested sortable tree built on `SortableList`) in `src/components/features/taxonomy/` |
````

#### MOVE-2 - `docs/architecture.md:L22` - **REPLACE**

CURRENT (verbatim):
````text
| Legacy tree pkg | @nosferatu500/react-sortable-tree | 5.x | Installed; taxonomy form uses `SortableTreeEditor` (@dnd-kit) instead |
````
REPLACEMENT (whole passage):
````text
| Legacy tree pkg | @nosferatu500/react-sortable-tree | 5.x | Installed; taxonomy form uses `TaxonomyTreeEditor` (@dnd-kit via `SortableList`) instead |
````

#### SCH-1 - `docs/architecture.md:L177` - **FRAGMENT**

CURRENT (verbatim line):
````text
│   ├── schema/                     # Zod: auth, me, media, taxonomy, instructor, course (barrel @/schema)
````
FRAGMENT 1 - replace exactly:
````text
# Zod: auth, me, media, taxonomy, instructor, course (barrel @/schema)
````
with:
````text
# Zod: auth, me, media, shared (slug fields), taxonomy, instructor, course (barrel @/schema)
````
RESULTING LINE:
````text
│   ├── schema/                     # Zod: auth, me, media, shared (slug fields), taxonomy, instructor, course (barrel @/schema)
````

#### TREE-6 - `docs/architecture.md:L196` - **INSERT** (utils listing rows; optional but the listing is the only `src/lib/utils` tree in this file)

Anchor line (unchanged; insert after it) - CURRENT:
````text
│   │   │   ├── media.ts            # media upload/list helpers
````
INSERT text:
````text
│   │   │   ├── payload.ts          # omitWhenBlank(), changedNonBlank(), payloadField() — optional write-payload fields (import `@/lib/utils/payload`)
│   │   │   ├── slug.ts             # sanitizeSlugInput(), SLUG_PATTERN, SLUG_MAX_LENGTH, isSlugAdjusted() (import `@/lib/utils/slug`)
│   │   │   ├── tree.ts             # generic `{ id, children? }` helpers: walkTree, flattenTree, countTreeNodes, getTreeMaxDepth, findTreePath, findTreeNodeById, updateTreeNode (import `@/lib/utils/tree`)
````

#### FF-1 - `docs/architecture.md:L285` - **INSERT**
_Directly after the `RequiredLabel` / `FieldError` row (before the `SlugInput` row replaced by ARC-3)._

Anchor line (unchanged; insert after it) - CURRENT:
````text
| `RequiredLabel` / `FieldError` | `components/shared/` | Form required asterisk + inline Zod errors |
````
INSERT text:
````text
| `FormField` | `components/shared/form-field.tsx` | Labelled field block: `RequiredLabel` (`htmlFor`) + control + optional muted hint + `FieldError`; `SlugField` is `FormField` + `SlugInput`; used by the course create dialog, the course basic-info tab and the taxonomy form dialog |
````

#### VAL-1 - `docs/architecture.md:L386` - **FRAGMENT**

CURRENT (verbatim line):
````text
Validation error messages in Zod schemas (`loginSchema`, `signupSchema`) use **i18n keys** (e.g. `"validation.email"`). `AuthEmailField`, `AuthPasswordField`, and `AuthFullNameField` in `auth-form-fields.tsx` resolve keys via `useTranslations("auth")` only when `error.message` is set (never `t(undefined)`).
````
FRAGMENT 1 - replace exactly:
````text
resolve keys via `useTranslations("auth")` only when `error.message` is set (never `t(undefined)`).
````
with:
````text
resolve keys with the shared `resolveValidationMessage` (`src/lib/utils/validation-message.ts`) over `useTranslations("auth")` and render them with the shared `FieldError`; a key is resolved only when `error.message` is set (never `t(undefined)`).
````

## A2. `docs/components.md`

#### MOVE-3 - `docs/components.md:L101` - **REPLACE**

CURRENT (verbatim):
````text
| `@dnd-kit/core`, `sortable`, `utilities`, `modifiers`, `accessibility` | Modern DnD toolkit | `SortableList`, `SortableTreeEditor` |
````
REPLACEMENT (whole passage):
````text
| `@dnd-kit/core`, `sortable`, `utilities`, `modifiers`, `accessibility` | Modern DnD toolkit | `SortableList`, `TaxonomyTreeEditor` (via `SortableList`) |
````

#### VAL-2 - `docs/components.md:L170` - **FRAGMENT**

CURRENT (verbatim line):
````text
| `AuthEmailPasswordFields` | `auth/auth-form-fields.tsx` | Shared UI | Email + password for login/signup; translates Zod i18n keys when `emailError` / `passwordError` set. |
````
FRAGMENT 1 - replace exactly:
````text
translates Zod i18n keys when `emailError` / `passwordError` set.
````
with:
````text
resolves Zod i18n keys through the shared `resolveValidationMessage` and renders them with the shared `FieldError` when `emailError` / `passwordError` set.
````
(L171 `AuthFullNameField` says "same validation translation pattern" - still accurate, no edit.)

#### FF-2 - `docs/components.md:L229` - **INSERT**
_New row directly after the `FieldError` row (before `ConfirmActionDialog`)._

Anchor line (unchanged; insert after it) - CURRENT:
````text
| `FieldError` | `field-error.tsx` | Inline validation message below a control; pair with `resolveValidationMessage`. |
````
INSERT text:
````text
| `FormField` | `form-field.tsx` | Labelled field block: `div.space-y-2` with `RequiredLabel` (`htmlFor`), the control (children), an optional muted hint (`text-xs text-muted-foreground`) and `FieldError`. Used by the create-course dialog (title, slug), the course basic-info tab (title, slug, short description) and `TaxonomyFormDialog` (name, short description, slug); `SlugField` composes it. The instructor `Field`, `DeltaEditor`, `ImageFileField`, selects and review/approval textarea blocks keep their own layout on purpose. |
````

#### MOVE-4 - `docs/components.md:L235` - **REPLACE** (delete the row; supersedes CMP-3 and the `TreeNodeSlugField` row of CMP-8)

CURRENT (verbatim):
````text
| `SortableTreeEditor` | `sortable-tree-editor.tsx` | Nested sortable tree (name + read-only slug); used by taxonomy topics/skills form editor. |
````
REPLACEMENT: delete the whole line. `SortableTreeEditor` no longer exists in `components/shared`; the tree editor is documented in the `src/components/features/taxonomy/` paragraph (MOVE-5). `SortableList` (L234) stays.

#### MOVE-5 - `docs/components.md:L242` - **FRAGMENT** (three fragments on the same line; supersedes CMP-5 FRAGMENT 1, whose slug-preview fragment is included below)

CURRENT (verbatim line):
````text
`src/components/features/taxonomy/` — taxonomy CRUD UI only: `TaxonomyFormDialog` (Zod schemas, `RequiredLabel`, `FieldError`, `toastApiError`; locale picker is **`TaxonomyLocaleTabsSection` searchable combobox only** — no en/vi pill Tabs; presets from `CONTENT_LOCALE_OPTIONS`, **no free-enter**; form state + tree/description/image; edit hydrates from `getTaxonomyDetailService(…, { view: "edit" })`; update sends `expected_row_version`; stale **3005** via `toastApiError`; parent remounts via `key`; slug preview via `resolveTaxonomySlugPreview`), `TaxonomyTreeEditor`, `TaxonomyDescriptionEditor`, `TaxonomyTreeViewButton`, `buildTaxonomyTableColumns`. Locale/canonicalize/defaultValues helpers live in `src/lib/utils/taxonomy/form-helpers.ts` (via `@/lib/utils/taxonomy`); submit prepare/persist in `src/lib/utils/taxonomy/form-submit.ts` (deep import only). See `docs/taxonomy-admin.md`.
````
FRAGMENT 1 - replace exactly:
````text
`TaxonomyFormDialog` (Zod schemas, `RequiredLabel`, `FieldError`, `toastApiError`;
````
with:
````text
`TaxonomyFormDialog` (Zod schemas, `FormField` (`RequiredLabel` + `FieldError`) for name / short description / slug, `toastApiError`;
````
FRAGMENT 2 - replace exactly:
````text
slug preview via `resolveTaxonomySlugPreview`), `TaxonomyTreeEditor`, `TaxonomyDescriptionEditor`,
````
with:
````text
root slug via the shared `SlugField`; create `409`/**3007** opens a stacked recommended-slug `SlugConflictConfirmDialog` through `useSlugConflictFlow`; update sends `slug` only when changed and toasts `taxonomy.form.slugAdjusted` when the BE adjusts it), `TaxonomyTreeEditor` (`taxonomy-tree-editor.tsx`: the nested `@dnd-kit` sortable tree over shared `SortableList` — recursive level, canonical / per-locale name editing, per-node slug through `TreeNodeSlugField`; `maxLength` from `TAXONOMY_NAME_MAX_LENGTH`), `TreeNodeSlugField` (`tree-node-slug-field.tsx`: muted slug or "generated from the name" placeholder + pencil toggle to an inline `SlugInput` + done button; stays open while an error is set), `TaxonomyDescriptionEditor`,
````
RESULTING LINE:
````text
`src/components/features/taxonomy/` — taxonomy CRUD UI only: `TaxonomyFormDialog` (Zod schemas, `FormField` (`RequiredLabel` + `FieldError`) for name / short description / slug, `toastApiError`; locale picker is **`TaxonomyLocaleTabsSection` searchable combobox only** — no en/vi pill Tabs; presets from `CONTENT_LOCALE_OPTIONS`, **no free-enter**; form state + tree/description/image; edit hydrates from `getTaxonomyDetailService(…, { view: "edit" })`; update sends `expected_row_version`; stale **3005** via `toastApiError`; parent remounts via `key`; root slug via the shared `SlugField`; create `409`/**3007** opens a stacked recommended-slug `SlugConflictConfirmDialog` through `useSlugConflictFlow`; update sends `slug` only when changed and toasts `taxonomy.form.slugAdjusted` when the BE adjusts it), `TaxonomyTreeEditor` (`taxonomy-tree-editor.tsx`: the nested `@dnd-kit` sortable tree over shared `SortableList` — recursive level, canonical / per-locale name editing, per-node slug through `TreeNodeSlugField`; `maxLength` from `TAXONOMY_NAME_MAX_LENGTH`), `TreeNodeSlugField` (`tree-node-slug-field.tsx`: muted slug or "generated from the name" placeholder + pencil toggle to an inline `SlugInput` + done button; stays open while an error is set), `TaxonomyDescriptionEditor`, `TaxonomyTreeViewButton`, `buildTaxonomyTableColumns`. Locale/canonicalize/defaultValues helpers live in `src/lib/utils/taxonomy/form-helpers.ts` (via `@/lib/utils/taxonomy`); submit prepare/persist in `src/lib/utils/taxonomy/form-submit.ts` (deep import only). See `docs/taxonomy-admin.md`.
````

#### FF-3 - `docs/components.md:L248` - **FRAGMENT** (two fragments; fragment 2 supersedes CMP-6 FRAGMENT 1)

CURRENT (verbatim passages inside the very long line):
````text
`course-editor-basic-tab` — `react-hook-form + zodResolver` over `courseBasicInfoSchema`, with `RequiredLabel`, `FieldError`, and `toastValidationError` on invalid submit (`course.validation.*`); the tab renders an editable, required slug field (`SlugInput`, default `course.slug`, disabled without a draft);
````
````text
The create dialog (`InstructorCoursesPage`) uses `useCourseCreateFlow`: optional `SlugInput`, blank slug omitted from the POST, and a 409/3007 opens a stacked `ConfirmActionDialog` with the BE `recommended_slug`.
````
FRAGMENT 1 - replace exactly:
````text
with `RequiredLabel`, `FieldError`, and `toastValidationError` on invalid submit (`course.validation.*`); the tab renders an editable, required slug field (`SlugInput`, default `course.slug`, disabled without a draft);
````
with:
````text
with `FormField` (title, slug, short description), `RequiredLabel`, `FieldError`, and `toastValidationError` on invalid submit (`course.validation.*`); the tab renders an editable, required slug field (`SlugField` over `SlugInput`, default `course.slug`, disabled without a draft);
````
FRAGMENT 2 - replace exactly:
````text
uses `useCourseCreateFlow`: optional `SlugInput`, blank slug omitted from the POST, and a 409/3007 opens a stacked `ConfirmActionDialog` with the BE `recommended_slug`.
````
with:
````text
uses `useCourseCreateFlow` (built on the shared `useSlugConflictFlow`): title and optional slug through `FormField` / `SlugField` (`SlugInput`), blank slug omitted from the POST, and a 409/3007 opens a stacked `SlugConflictConfirmDialog` (`ConfirmActionDialog stacked`) with the BE `recommended_slug`.
````

## A3. `docs/dependencies.md`

#### DEP-1 - `docs/dependencies.md:L3` - **REPLACE**
_Audit stamp. Required because DEP-2 edits a row. Also remove the `docs/dependencies.md` row from the inventory's "Scanned - no change" table._

CURRENT (verbatim):
````text
_Last audited: 2026-09-16 (`server-only` 0.0.1 runtime; `knip` 6.17.1 dev; testing stack added — `jest` 30.5.1, `@playwright/test` 1.63.0, `msw` 2.11.1, `undici` 8.10.2, `@testing-library/*` — all exact-pinned; lockfile pinned)._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (`@dnd-kit/core` consumer row now names `TaxonomyTreeEditor`; no package added, removed or changed). Prior: 2026-09-16 (`server-only` 0.0.1 runtime; `knip` 6.17.1 dev; testing stack added — `jest` 30.5.1, `@playwright/test` 1.63.0, `msw` 2.11.1, `undici` 8.10.2, `@testing-library/*` — all exact-pinned; lockfile pinned)._
````

#### DEP-2 - `docs/dependencies.md:L133` - **REPLACE**

CURRENT (verbatim):
````text
| `@dnd-kit/core` | ^6.3.1 | DnD context — `SortableList`, `SortableTreeEditor` |
````
REPLACEMENT (whole passage):
````text
| `@dnd-kit/core` | ^6.3.1 | DnD context — `SortableList`, `TaxonomyTreeEditor` (via `SortableList`) |
````

## A4. `docs/folder-structure.md`

#### MOVE-6 - `docs/folder-structure.md:L192` - **FRAGMENT**

CURRENT (verbatim line):
````text
│   ├── taxonomy/           # TaxonomyFormDialog, TaxonomyLocaleTabsSection, tree/description editors, taxonomy-table-columns, taxonomy-tree-view-button (no form helper/submit modules — those live under src/lib/utils/taxonomy/)
````
FRAGMENT 1 - replace exactly:
````text
tree/description editors, taxonomy-table-columns,
````
with:
````text
taxonomy-tree-editor (sortable tree + name + per-node slug), tree-node-slug-field, description editor, taxonomy-table-columns,
````
RESULTING LINE:
````text
│   ├── taxonomy/           # TaxonomyFormDialog, TaxonomyLocaleTabsSection, taxonomy-tree-editor (sortable tree + name + per-node slug), tree-node-slug-field, description editor, taxonomy-table-columns, taxonomy-tree-view-button (no form helper/submit modules — those live under src/lib/utils/taxonomy/)
````

#### VAL-3 - `docs/folder-structure.md:L424` - **REPLACE**

CURRENT (verbatim):
````text
Error messages in schemas use **i18n keys** (not hardcoded strings). Resolve in components via `resolveValidationMessage` or auth-specific `resolveAuthValidationMessage`.
````
REPLACEMENT (whole passage):
````text
Error messages in schemas use **i18n keys** (not hardcoded strings). Resolve in components via the shared `resolveValidationMessage` (`src/lib/utils/validation-message.ts`, the translator parameter is typed `(key: never) => string`; the auth form fields use it too).
````

#### LIM-2 - `docs/folder-structure.md:L457-L458` - **REPLACE** (`src/constants/` tree)

CURRENT (verbatim):
````text
├── taxonomy/
│   └── resources.ts        # TAXONOMY_RESOURCES, TAXONOMY_RESOURCE_KEYS, TAXONOMY_GROUP_READ_PERMISSIONS (data only)
````
REPLACEMENT (whole passage):
````text
├── taxonomy/
│   ├── resources.ts        # TAXONOMY_RESOURCES, TAXONOMY_RESOURCE_KEYS, TAXONOMY_GROUP_READ_PERMISSIONS (data only)
│   └── limits.ts           # TAXONOMY_NAME_MAX_LENGTH (255), TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH (100) — used by the taxonomy schema and the form / tree-editor maxLength props (data only)
````

#### NAV-2 - `docs/folder-structure.md:L481` - **FRAGMENT**

CURRENT (verbatim line):
````text
│   └── dashboard-page-header.ts  # dashboard route metadata resolver (consumes static constants + shared dashboard types)
````
FRAGMENT 1 - replace exactly:
````text
(consumes static constants + shared dashboard types)
````
with:
````text
(consumes static constants + shared dashboard types; nav-tree lookups via `findTreeNodeById` / `findTreePath` from `src/lib/utils/tree.ts`)
````

#### VAL-4 - `docs/folder-structure.md:L500` - **FRAGMENT**

CURRENT (verbatim line):
````text
│   ├── validation-message.ts # resolveValidationMessage, toastValidationError, firstValidationMessageKey
````
FRAGMENT 1 - replace exactly:
````text
# resolveValidationMessage, toastValidationError, firstValidationMessageKey
````
with:
````text
# resolveValidationMessage (translator typed `(key: never) => string`; auth + course + taxonomy), toastValidationError, firstValidationMessageKey
````

#### TREE-4 - `docs/folder-structure.md:L506` - **FRAGMENT + INSERT**

CURRENT (verbatim line):
````text
│   ├── dagre-tree.ts       # treeToFlowElements, getLayoutedElements (React Flow + dagre)
````
FRAGMENT 1 - replace exactly:
````text
# treeToFlowElements, getLayoutedElements (React Flow + dagre)
````
with:
````text
# treeToFlowElements (walks the tree with the generic walkTree), getLayoutedElements (React Flow + dagre)
````
INSERT after that line:
````text
│   ├── tree.ts             # Generic `{ id, children? }` helpers: walkTree, flattenTree, countTreeNodes, getTreeMaxDepth, findTreePath, findTreeNodeById, updateTreeNode (taxonomy, dashboard nav resolver, dagre-tree; import via `@/lib/utils/tree`)
│   ├── payload.ts          # Optional write-payload fields: omitWhenBlank, changedNonBlank, payloadField (course + taxonomy payload builders; import via `@/lib/utils/payload`)
````

## A5. `docs/logic-flow.md`

#### VAL-5 - `docs/logic-flow.md:L291` - **REPLACE**

CURRENT (verbatim):
````text
  → Resolve via resolveValidationMessage / resolveAuthValidationMessage — skip t() when message is undefined
````
REPLACEMENT (whole passage):
````text
  → Resolve via the shared resolveValidationMessage (src/lib/utils/validation-message.ts; auth form fields use it too) — skip t() when message is undefined
````

## A6. `docs/modules.md`

#### FF-4 - `docs/modules.md:L10` - **FRAGMENT**

CURRENT (verbatim line):
````text
- `Validation + i18n errors`: `src/schema/**`, `src/messages/error-codes.ts`, `src/components/shared/required-label.tsx`, `src/components/shared/field-error.tsx`, `src/lib/utils/validation-message.ts`
````
FRAGMENT 1 - replace exactly:
````text
`src/components/shared/field-error.tsx`, `src/lib/utils/validation-message.ts`
````
with:
````text
`src/components/shared/field-error.tsx`, `src/components/shared/form-field.tsx`, `src/lib/utils/validation-message.ts`
````

#### FF-5 - `docs/modules.md:L25` - **FRAGMENT**

CURRENT (verbatim line):
````text
- `Validation + i18n errors` provides shared Zod schemas, form labels (`RequiredLabel`), field errors (`FieldError`), and two i18n namespaces: `errors.codes.*` (API) vs `*.validation.*` (pre-submit).
````
FRAGMENT 1 - replace exactly:
````text
form labels (`RequiredLabel`), field errors (`FieldError`), and two i18n namespaces:
````
with:
````text
form labels (`RequiredLabel`), field errors (`FieldError`), the labelled field block (`FormField`), the shared slug zod fields (`src/schema/shared/slug.ts`), and two i18n namespaces:
````

#### LIM-3 - `docs/modules.md:L37` - **REPLACE**

CURRENT (verbatim):
````text
- **Constants**: `src/constants/taxonomy/resources.ts` — `TAXONOMY_RESOURCES`, `TAXONOMY_RESOURCE_KEYS`, `TAXONOMY_GROUP_READ_PERMISSIONS` (data only).
````
REPLACEMENT (whole passage):
````text
- **Constants**: `src/constants/taxonomy/resources.ts` — `TAXONOMY_RESOURCES`, `TAXONOMY_RESOURCE_KEYS`, `TAXONOMY_GROUP_READ_PERMISSIONS`; `src/constants/taxonomy/limits.ts` — `TAXONOMY_NAME_MAX_LENGTH` (255), `TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH` (100) (data only).
````

#### TREE-2 - `docs/modules.md:L38` - **FRAGMENT** (two fragments)

CURRENT (verbatim line):
````text
- **Utils**: `src/lib/utils/taxonomy/` — `resource.ts` (`getTaxonomyResourceConfig()`, `getTaxonomySearchableColumns()`, `getTaxonomyTreeFromEntity()`, `buildTaxonomyDagreRoot()`, `countTaxonomyTreeNodes()`, …); `form-helpers.ts` (locale tabs, canonicalize, defaultValues, compact translations); `form-submit.ts` (prepare/persist create-update payloads — import `@/lib/utils/taxonomy/form-submit` only, not via barrel, to avoid API caller cycle); barrel `index.ts` re-exports resource + form-helpers. Also `src/lib/utils/dagre-tree.ts` — read-only tree layout helpers.
````
FRAGMENT 1 - replace exactly:
````text
`buildTaxonomyDagreRoot()`, `countTaxonomyTreeNodes()`, …); `form-helpers.ts` (locale tabs, canonicalize, defaultValues, compact translations);
````
with:
````text
`buildTaxonomyDagreRoot()`, `toTaxonomyTreeWritePayload()`, `validateTaxonomyTreeSlugs()`, …); `form-helpers.ts` (locale tabs, canonicalize, defaultValues, persisted-slug baseline, compact translations);
````
FRAGMENT 2 - replace exactly:
````text
Also `src/lib/utils/dagre-tree.ts` — read-only tree layout helpers.
````
with:
````text
Also `src/lib/utils/dagre-tree.ts` — read-only tree layout helpers — and the generic `src/lib/utils/tree.ts` (`countTreeNodes`, `getTreeMaxDepth`, `flattenTree`, … shared with the dashboard nav resolver).
````

#### SCH-3 - `docs/modules.md:L87` - **FRAGMENT** (optional; keeps the Validation bullet true to the code once the slug rules move to `src/schema/shared/slug.ts`)

CURRENT (verbatim passages inside the long line):
````text
required `slug` matching `SLUG_PATTERN`, max `SLUG_MAX_LENGTH` 255;
````
````text
optional slug validated by `SLUG_PATTERN`, max `SLUG_MAX_LENGTH` 255, blank allowed and omitted from the POST).
````
FRAGMENT 1 - replace exactly: `required `slug` matching `SLUG_PATTERN`, max `SLUG_MAX_LENGTH` 255;` with:
````text
required `slug` (shared `requiredSlugField`, `src/schema/shared/slug.ts`: `SLUG_PATTERN`, max `SLUG_MAX_LENGTH` 255);
````
FRAGMENT 2 - replace exactly: `optional slug validated by `SLUG_PATTERN`, max `SLUG_MAX_LENGTH` 255, blank allowed and omitted from the POST).` with:
````text
optional slug (shared `optionalSlugField`: `SLUG_PATTERN`, max `SLUG_MAX_LENGTH` 255, blank allowed and omitted from the POST).
````

## A7. `docs/patterns.md`

#### PAT-4 - `docs/patterns.md:L3` - **REPLACE**
_Audit stamp missing from the inventory although PAT-2 / PAT-3 / PAT-1 edit this file._

CURRENT (verbatim):
````text
_Last audited: 2026-09-16 (Adding New Features Checklist: added a test-coverage checklist item pointing to `testing.md` and `src/test-support/`). Prior: 2026-06-29 (SearchableSelect `useApiInfiniteListQuery` + `getRowKey` page-merge dedupe); shared `deferDropdownAction` + `DeferredDropdownMenuItem` for menu→dialog flows (2026-06-26)._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (§15 Slug fields: taxonomy slugs editable, shared `useSlugConflictFlow`, optional write-payload helpers `payload.ts`; §6 Forms: `FormField`, shared `resolveValidationMessage`). Prior: 2026-09-16 (Adding New Features Checklist: added a test-coverage checklist item pointing to `testing.md` and `src/test-support/`). Prior: 2026-06-29 (SearchableSelect `useApiInfiniteListQuery` + `getRowKey` page-merge dedupe); shared `deferDropdownAction` + `DeferredDropdownMenuItem` for menu→dialog flows (2026-06-26)._
````

#### VAL-6 - `docs/patterns.md:L327-L328` - **REPLACE**

CURRENT (verbatim):
````text
Translate keys in `auth-form-fields.tsx` (`resolveAuthValidationMessage`) or shared helpers from `src/lib/utils/validation-message.ts`:
- `resolveValidationMessage()` — inline field errors (react-hook-form)
````
REPLACEMENT (whole passage):
````text
Translate keys with the shared helpers from `src/lib/utils/validation-message.ts` (the auth form fields in `auth-form-fields.tsx` use the same `resolveValidationMessage`):
- `resolveValidationMessage(t, message)` — inline field errors (react-hook-form); the translator parameter is typed `(key: never) => string`, so pass the scoped `useTranslations(...)` result directly (no `as unknown as (key: string) => string` cast)
````

#### FF-6 - `docs/patterns.md:L355` - **REPLACE**

CURRENT (verbatim):
````text
Use `RequiredLabel` + `FieldError` from `src/components/shared/` on required dialog fields.
````
REPLACEMENT (whole passage):
````text
Use `FormField` (`src/components/shared/form-field.tsx`: `RequiredLabel` + control + optional hint + `FieldError`) on labelled dialog fields; use `RequiredLabel` + `FieldError` directly only where the layout differs (selects, `DeltaEditor`, `ImageFileField`, review/approval textarea blocks).
````

#### PAY-1 - `docs/patterns.md:L577` - **INSERT**
_New paragraph at the end of §15, after the "Basic-info tab" bullet and before the `---` that precedes `## 16`._

Anchor line (unchanged; insert after it) - CURRENT:
````text
- Basic-info tab: the slug is **required**, defaults to `course.slug`, and is disabled while there is no draft. `toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug)` sends `slug` only when it differs from the persisted slug; the response `data.course.slug` is the source of truth.
````
INSERT text:
````text

**Optional write-payload fields** use the single rule in `src/lib/utils/payload.ts`: include an optional string or id in a create/update body only when it is non-blank and, on update, only when it differs from the persisted value. Use `omitWhenBlank(value)`, `changedNonBlank(value, persisted)` and spread `payloadField(key, value)`; do not hand-roll `trim()` / `value || undefined` branches. Consumers: `toCreateCoursePayload`, `toUpdateCourseBasicInfoPayload` (`preview_video_file_id`, `slug`), the taxonomy `prepare*SubmitPayload` builders (`image_file_id`, `slug`), the sub-lesson `media_url` in `use-course-editor-state.ts`, and each tree node `slug` in `toTaxonomyTreeWritePayload`. "The server adjusted the slug" is `isSlugAdjusted(sent, saved)` in `src/lib/utils/slug.ts`.
````

## A8. `docs/reusable-assets.md`

#### NAV-1 - `docs/reusable-assets.md:L320` and `L322` - **FRAGMENT**

CURRENT (verbatim lines):
````text
- **Purpose**: Maps the current dashboard pathname to the shared breadcrumb/title/description model. Breadcrumb labels and links are auto-derived from the role nav tree (`*DASHBOARD_ITEMS`) by walking item `href` ancestry; static route constants only supply title/description and regex-route anchors.
````
````text
- **Dependencies**: `DASHBOARD_PAGE_HEADER_ROUTES`, `DASHBOARD_ROLE_ROOT`, `DashboardItem`, existing dashboard nav config labels.
````
FRAGMENT (L320) - replace exactly: `by walking item `href` ancestry;` with:
````text
by walking item `href` ancestry with the shared `findTreePath` / `findTreeNodeById` (`src/lib/utils/tree.ts`);
````
FRAGMENT (L322) - replace exactly: `` `DashboardItem`, existing dashboard nav config labels. `` with:
````text
`DashboardItem`, `findTreePath` / `findTreeNodeById` (`src/lib/utils/tree.ts`), existing dashboard nav config labels.
````

#### TREE-3 - `docs/reusable-assets.md:L494`, `L497`, `L499` - **REPLACE** (asset `Taxonomy config helpers`; L497 supersedes RA-3)

CURRENT (verbatim):
````text
- **Name**: `getTaxonomyResourceConfig`, `getTaxonomySearchableColumns`, `getTaxonomyTreeFromEntity`, `buildTaxonomyDagreRoot`, `toTaxonomyTreeWritePayload`, `createTaxonomyTreeNode`, `countTaxonomyTreeNodes`
````
````text
- **Purpose**: Resolve `TAXONOMY_RESOURCES` entry, searchable column ids, extract nested tree from entity, build dagre root for read-only popup, strip slug for write payloads, create empty editor node, count nested nodes for button state.
````
````text
- **Dependencies**: `TAXONOMY_RESOURCES` (`src/constants/taxonomy/resources.ts`), `TaxonomyTreeNode`, `DagreTreeRoot` (`dagre-tree.ts`).
````
REPLACEMENT (L494):
````text
- **Name**: `getTaxonomyResourceConfig`, `getTaxonomySearchableColumns`, `getTaxonomyTreeFromEntity`, `buildTaxonomyDagreRoot`, `collectTaxonomyTreeSlugs`, `toTaxonomyTreeWritePayload`, `validateTaxonomyTreeSlugs`, `hasAdjustedTaxonomyTreeSlugs`, `createTaxonomyTreeNode`
````
REPLACEMENT (L497):
````text
- **Purpose**: Resolve `TAXONOMY_RESOURCES` entry, searchable column ids, extract nested tree from entity, build dagre root for the read-only popup (names pass through as the BE returned them for the list `locale`; slug is not rendered), collect persisted node slugs, build write payloads (`slug` kept only for a new node with a typed slug or an edited existing node, through `payloadField` / `changedNonBlank`), validate node slugs with the shared slug zod fields, detect BE-adjusted node slugs, create empty editor node. Node counting and maximum depth (tree-view button hint, dialog width) use the generic `countTreeNodes` / `getTreeMaxDepth` from `src/lib/utils/tree.ts`.
````
REPLACEMENT (L499):
````text
- **Dependencies**: `TAXONOMY_RESOURCES` (`src/constants/taxonomy/resources.ts`), `TaxonomyTreeNode`, `DagreTreeRoot` (`dagre-tree.ts`), `flattenTree` (`src/lib/utils/tree.ts`), `payloadField` / `changedNonBlank` (`src/lib/utils/payload.ts`), `optionalSlugField` / `requiredSlugField` (`src/schema/shared/slug.ts`).
````

#### TAXU-1 - `docs/reusable-assets.md:L502` - **REPLACE** (asset `Taxonomy form helpers`, Name list)

CURRENT (verbatim):
````text
- **Name**: `CONTENT_LOCALE_OPTIONS`, `resolveAllowedContentLocale`, `canonicalizeContentLocale`, `buildTaxonomyFormDefaultValues`, `compactNameTranslations`, `compactOutcomeTranslations`, `contentLocaleOptionLabel`, …
````
REPLACEMENT (whole passage):
````text
- **Name**: `CONTENT_LOCALE_OPTIONS`, `resolveAllowedContentLocale`, `canonicalizeContentLocale`, `buildTaxonomyFormDefaultValues`, `getPersistedTaxonomySlug`, `buildTaxonomySlugBaseline`, `compactNameTranslations`, `compactOutcomeTranslations`, `contentLocaleOptionLabel`, `TAXONOMY_TREE_INDENT_PX`, …
````

#### LIM-4 - `docs/reusable-assets.md:L515` - **INSERT**

Anchor line (unchanged; insert after it, last line of the `TAXONOMY_RESOURCE_KEYS` asset) - CURRENT:
````text
- **Dependencies**: `TaxonomyResourceKey` type.
````
INSERT text:
````text

### Asset: `TAXONOMY_NAME_MAX_LENGTH` / `TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH`
- **Name**: `TAXONOMY_NAME_MAX_LENGTH`, `TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH`
- **Type**: Constants
- **Path**: `src/constants/taxonomy/limits.ts`
- **Purpose**: Single source of the taxonomy text limits: name 255 and short description 100 (mirror the BE).
- **Scope**: `src/schema/taxonomy/taxonomy.ts` (`validation.nameMax`, `validation.shortDescriptionMax`) and the `maxLength` props of `TaxonomyFormDialog` and `TaxonomyTreeEditor`.
- **Dependencies**: none.
- **Reuse Rule**: Import the constants; never repeat `255` / `100` for taxonomy text fields.
````

#### TAXU-2 - `docs/reusable-assets.md:L541`, `L544` (supersedes RA-8), `L546` - **REPLACE** (asset `taxonomy form-submit utils`)

CURRENT (verbatim):
````text
- **Name**: `buildTaxonomySubmitPayload`, `persistTaxonomyForm`, `prepareOutcomeSubmitPayload`, `prepareTopicSubmitPayload`, `prepareSkillSubmitPayload`, `prepareSlugStatusSubmitPayload`
````
````text
- **Purpose**: Keep create/update submit branching out of `TaxonomyFormDialog.onSubmit` (≤60 lines / low cyclo). Compact translations, outcome short_description validation, and create vs update service calls.
````
````text
- **Dependencies**: `createTaxonomyService` / `updateTaxonomyService`, `toTaxonomyTreeWritePayload`, compact helpers in `form-helpers.ts`.
````
REPLACEMENT (L541):
````text
- **Name**: `buildTaxonomySubmitPayload`, `persistTaxonomyForm` (returns the saved entity), `getTaxonomySaveSlugNotice`, `prepareOutcomeSubmitPayload`, `prepareTopicSubmitPayload`, `prepareSkillSubmitPayload`, `prepareSlugStatusSubmitPayload`
````
REPLACEMENT (L544):
````text
- **Purpose**: Keep create/update submit branching out of `TaxonomyFormDialog.onSubmit` (≤60 lines / low cyclo). Compact translations, outcome short_description validation, and create vs update service calls. Optional fields go through `src/lib/utils/payload.ts`: a blank root `slug` is omitted on create, root `slug` on update only when it differs from the persisted slug, tree-node `slug` only when edited, `image_file_id` only when non-blank. `getTaxonomySaveSlugNotice` compares the sent and saved slug with `isSlugAdjusted` and reports adjusted tree-node slugs.
````
REPLACEMENT (L546):
````text
- **Dependencies**: `createTaxonomyService` / `updateTaxonomyService`, `toTaxonomyTreeWritePayload`, `payloadField` / `changedNonBlank` / `omitWhenBlank` (`src/lib/utils/payload.ts`), `isSlugAdjusted` (`src/lib/utils/slug.ts`), compact helpers in `form-helpers.ts`.
````

#### PAY-4 - `docs/reusable-assets.md:L803` and `L805` - **FRAGMENT** (asset `course editor utils`)

CURRENT (verbatim passages):
````text
`toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug)` (sends `title` and all required fields and adds `slug` only when it differs from `persistedSlug`), `toCreateCoursePayload(title, slug)` (`{ title, slug? }`, blank slug omitted; imported from `@/lib/utils/course`)
````
````text
- **Dependencies**: `course-delta.ts` (`createEmptyDeltaString`); `duration.ts` for display/payload conversion.
````
FRAGMENT (L803) - replace exactly: `adds `slug` only when it differs from `persistedSlug`), `toCreateCoursePayload(title, slug)` (`{ title, slug? }`, blank slug omitted;` with:
````text
adds `slug` only when it differs from `persistedSlug`; optional `preview_video_file_id` / `slug` go through `payloadField` / `changedNonBlank`), `toCreateCoursePayload(title, slug)` (`{ title, slug? }`, blank slug omitted via `payloadField`;
````
FRAGMENT (L805) - replace exactly: `` `duration.ts` for display/payload conversion. `` with:
````text
`duration.ts` for display/payload conversion; `payload.ts` (`payloadField`, `changedNonBlank`).
````

#### DAG-1 - `docs/reusable-assets.md:L811` and `L813` - **FRAGMENT** (asset `dagre-tree utils`)

CURRENT (verbatim lines):
````text
- **Purpose**: Walk a minimal tree shape (`id`, `name`, optional `children`) and produce layouted React Flow nodes/edges via dagre. Node `data.label` = `name` only.
````
````text
- **Dependencies**: `@xyflow/react`, `dagre`.
````
FRAGMENT (L811) - replace exactly: `Walk a minimal tree shape (`id`, `name`, optional `children`) and produce` with:
````text
Walk a minimal tree shape (`id`, `name`, optional `children`) with the shared generic `walkTree` (`src/lib/utils/tree.ts`) and produce
````
FRAGMENT (L813) - replace exactly: `` `@xyflow/react`, `dagre`. `` with:
````text
`@xyflow/react`, `dagre`, `walkTree` (`src/lib/utils/tree.ts`).
````

#### TREE-5 - `docs/reusable-assets.md:L813` - **INSERT**
_New asset directly after the `dagre-tree utils` asset (after the L813 `Dependencies` line + blank line, before the asset that replaces `SortableTreeEditor`)._

INSERT text:
````text
### Asset: tree utils
- **Name**: `walkTree`, `flattenTree`, `countTreeNodes`, `getTreeMaxDepth`, `findTreePath`, `findTreeNodeById`, `updateTreeNode`
- **Type**: Utility functions (generic over `{ id: string; children?: T[] }`)
- **Path**: `src/lib/utils/tree.ts` (import `@/lib/utils/tree`)
- **Purpose**: The single traversal layer for nested `{ id, children? }` trees: depth-first walk, flatten, node count, maximum depth, ancestor path to a node, lookup by id, and immutable per-node update.
- **Scope**: Taxonomy (`TaxonomyTreeViewButton` node count, `TaxonomyFormDialog` dialog width via the maximum depth, node-slug collection / validation / adjusted-slug detection in `resource.ts`, `TaxonomyTreeEditor`), the dashboard nav resolver (`findTreeNodeById` / `findTreePath` in `src/lib/navigation/dashboard-page-header.ts`), `treeToFlowElements` (`walkTree` in `dagre-tree.ts`).
- **Dependencies**: none.
- **Reuse Rule**: Never write another recursive walk / count / find over a `children` tree; import these helpers. Route-constant objects keep using `flattenRouteTreePaths` (different shape).

````

#### MOVE-7 - `docs/reusable-assets.md:L815-L821` - **REPLACE** (whole asset; supersedes RA-12a / RA-12b)

CURRENT (verbatim):
````text
### Asset: SortableTreeEditor
- **Name**: `SortableTreeEditor`
- **Type**: React component
- **Path**: `src/components/shared/sortable-tree-editor.tsx`
- **Purpose**: Nested drag-and-drop tree with name field and read-only slug preview per node. Uses shared `TaxonomyTreeNode` (no duplicate tree type).
- **Scope**: Taxonomy topics/skills (`TaxonomyTreeEditor` wrapper); similar JSONB trees elsewhere.
- **Dependencies**: `SortableList`, `slugifyName`, `createTaxonomyTreeNode`, `TaxonomyTreeNode`.
````
REPLACEMENT (whole passage):
````text
### Asset: TaxonomyTreeEditor
- **Name**: `TaxonomyTreeEditor`, `TaxonomyTreeEditorProps`
- **Type**: React component
- **Path**: `src/components/features/taxonomy/taxonomy-tree-editor.tsx` (barrel: `src/components/features/taxonomy/index.ts`)
- **Purpose**: Nested drag-and-drop tree editor for taxonomy topics/skills: recursive level over the shared `SortableList`, canonical / per-locale name editing (`editLocale`), add / remove child, and a per-node slug through `TreeNodeSlugField` (shown read-only, pencil toggle turns it into an inline `SlugInput`; an edited slug is written back on the node as `TaxonomyTreeNode.slug`, unedited nodes keep sending no slug). Uses shared `TaxonomyTreeNode` (no duplicate tree type); labels come from `taxonomy.tree.*` / `taxonomy.treeSkills.*`; `indentPx` defaults to `TAXONOMY_TREE_INDENT_PX`; name `maxLength` is `TAXONOMY_NAME_MAX_LENGTH`.
- **Scope**: `TaxonomyFormDialog` (topics `child_topics`, skills `children`).
- **Dependencies**: `SortableList`, `TreeNodeSlugField`, `createTaxonomyTreeNode`, `updateTreeNode` (`src/lib/utils/tree.ts`), `TaxonomyTreeNode`, `TAXONOMY_NAME_MAX_LENGTH`.
- **Reuse Rule**: Use for any taxonomy-shaped nested tree; reorder through `SortableList` and traverse through `src/lib/utils/tree.ts`, never a second recursive implementation.
````

#### FF-7 - `docs/reusable-assets.md:L1236` and after `L1237` - **FRAGMENT + INSERT**

CURRENT (verbatim lines):
````text
- **Scope**: Taxonomy form dialog, instructor/course dialogs, any new forms.
- **Dependencies**: `Label` from `@/components/ui/label`.
````
FRAGMENT (L1236) - replace exactly: `Taxonomy form dialog, instructor/course dialogs, any new forms.` with:
````text
Taxonomy form dialog, instructor/course dialogs, the auth form fields (`FieldError`), any new forms; wrapped by `FormField`.
````
INSERT after the `Dependencies` line (L1237):
````text

### Asset: FormField
- **Name**: `FormField`, `FormFieldProps`
- **Type**: React component
- **Path**: `src/components/shared/form-field.tsx`
- **Purpose**: Labelled form field block: `div.space-y-2` containing `RequiredLabel` (`htmlFor`), the control (children), an optional muted hint (`<p className="text-xs text-muted-foreground">`) and `FieldError`.
- **Scope**: Create-course dialog (title, slug), course editor basic-info tab (title, slug, short description), `TaxonomyFormDialog` (name, short description, slug); `SlugField` composes it. The instructor `Field`, `DeltaEditor`, `ImageFileField`, selects and review/approval textarea blocks keep their own layout on purpose.
- **Dependencies**: `RequiredLabel`, `FieldError`.
- **Reuse Rule**: Use for any labelled single-control field instead of repeating the label + control + hint + error markup. Not the shadcn `Field` in `src/components/ui/field.tsx`.
````

#### VAL-7 - `docs/reusable-assets.md:L1239-L1245` - **REPLACE** (asset `resolveValidationMessage`)

CURRENT (verbatim):
````text
### Asset: resolveValidationMessage
- **Name**: `resolveValidationMessage`
- **Type**: Utility function
- **Path**: `src/lib/utils/validation-message.ts`
- **Purpose**: Translates Zod i18n message keys through module-scoped `useTranslations` (e.g. `taxonomy.form.validation.*`).
- **Scope**: All Zod + react-hook-form forms.
- **Dependencies**: none.
````
REPLACEMENT (whole passage):
````text
### Asset: resolveValidationMessage
- **Name**: `resolveValidationMessage(t: (key: never) => string, message: string | undefined)`
- **Type**: Utility function
- **Path**: `src/lib/utils/validation-message.ts`
- **Purpose**: Translates Zod i18n message keys through a module-scoped `useTranslations` (e.g. `taxonomy.form.validation.*`, `auth.validation.*`); returns `""` when the message is undefined so `t(undefined)` is never called. The translator parameter is typed `(key: never) => string`, so call sites pass the scoped translator directly (no `as unknown as (key: string) => string` cast).
- **Scope**: All Zod + react-hook-form forms, including the auth form fields (`auth-form-fields.tsx`, rendered with the shared `FieldError`).
- **Dependencies**: none.
````

#### VAL-8 - `docs/reusable-assets.md:L972` and `L1163` - **FRAGMENT**

CURRENT (verbatim lines):
````text
- **Purpose**: Validates login form — `email`, `password`, `rememberMe`. Validation messages are i18n keys (`"validation.email"`, `"validation.password"`) — translated inside `auth-form-fields.tsx` (`resolveAuthValidationMessage`).
````
````text
- **Purpose**: Shared styled inputs for login/signup modals; resolves Zod i18n validation keys via `useTranslations("auth")` when `FieldError.message` is present.
````
FRAGMENT (L972) - replace exactly: `translated inside `auth-form-fields.tsx` (`resolveAuthValidationMessage`).` with:
````text
translated inside `auth-form-fields.tsx` with the shared `resolveValidationMessage`.
````
FRAGMENT (L1163) - replace exactly: `resolves Zod i18n validation keys via `useTranslations("auth")` when `FieldError.message` is present.` with:
````text
resolves Zod i18n validation keys with the shared `resolveValidationMessage` over `useTranslations("auth")` and renders them with the shared `FieldError` when `error.message` is present.
````

#### VAL-9 - `docs/reusable-assets.md:L836` and `L838` - **FRAGMENT** (asset `ImageFileField`)

CURRENT (verbatim lines):
````text
- **Purpose**: Shared image picker/preview field with optional permission gate for the browse action and clear/reset support.
````
````text
- **Dependencies**: `PermissionGate` (optional), `Button`, `Label`, `next/image`.
````
FRAGMENT (L836) - replace exactly: `and clear/reset support.` with:
````text
and clear/reset support; the field label is a `RequiredLabel` (`required` toggles the asterisk).
````
FRAGMENT (L838) - replace exactly: `` `PermissionGate` (optional), `Button`, `Label`, `next/image`. `` with:
````text
`PermissionGate` (optional), `Button`, `RequiredLabel`, `next/image`.
````

#### PAY-2 - `docs/reusable-assets.md:L863` - **INSERT**
_New asset after the `sanitizeSlugInput / ...` asset (after RA-15 is applied, i.e. after its `Reuse Rule` line)._

INSERT text:
````text

### Asset: payload utils
- **Name**: `omitWhenBlank(value)`, `changedNonBlank(value, persisted = "")`, `payloadField(key, value)`
- **Type**: Utility functions
- **Path**: `src/lib/utils/payload.ts` (import `@/lib/utils/payload`)
- **Purpose**: The single "include an optional string/id in a write payload only when non-blank [and different from the persisted value]" rule. `omitWhenBlank` returns the trimmed value or `undefined` when blank; `changedNonBlank` returns it only when it is also different from `persisted` (create semantics when `persisted` is `""`); `payloadField` turns the result into a spreadable `{ [key]: value }` fragment that leaves the key absent when the value is `undefined`.
- **Scope**: `toCreateCoursePayload`, `toUpdateCourseBasicInfoPayload` (`preview_video_file_id`, `slug`), taxonomy `prepare*SubmitPayload` (`image_file_id`, `slug`), sub-lesson `media_url` in `use-course-editor-state.ts`, `toTaxonomyTreeWritePayload` (node `slug`).
- **Dependencies**: none.
- **Reuse Rule**: Use these instead of inline `trim()` / `if (value)` / `value || undefined` in payload builders; never add another omit-when-blank helper.
````

#### SCH-4 - `docs/reusable-assets.md:L1248` - **FRAGMENT** (asset `Zod schemas (src/schema/)`)

CURRENT (verbatim):
````text
- **Name**: Module schemas (`auth`, `me`, `media`, `taxonomy`, `instructor`, `course`)
````
FRAGMENT 1 - replace exactly: `` (`auth`, `me`, `media`, `taxonomy`, `instructor`, `course`) `` with:
````text
(`auth`, `me`, `media`, `shared` slug fields, `taxonomy`, `instructor`, `course`)
````

## A9. `docs/screens.md`

#### FF-8 - `docs/screens.md:L428` - **INSERT**

Anchor line (unchanged; insert after it) - CURRENT:
````text
| `FieldError` | `field-error.tsx` | Inline validation message under a field (resolves i18n key from Zod). |
````
INSERT text:
````text
| `FormField` | `form-field.tsx` | Labelled field block (`RequiredLabel` + control + hint + `FieldError`) — course create dialog, course basic-info tab, taxonomy form dialog. |
````

## A10. `docs/seo-ranking-setup.md`

#### SEO-1 - `docs/seo-ranking-setup.md:L3` - **REPLACE**
_Audit stamp. The inventory's "Scanned - no change" row for this file (L41 "stays accurate ... `generateSlug` unchanged") is wrong once `generateSlug` is deleted._

CURRENT (verbatim):
````text
_Last audited: 2026-07-26 (temporary signed-in `/home` under `(web)` + `PRIVATE_ROUTES.home`; most SEO helpers still unused by other pages)._
````
REPLACEMENT (whole passage):
````text
_Last audited: 2026-10-14 (A12 slug helper row: `src/lib/utils/slug.ts` no longer holds a name-to-slug generator). Prior: 2026-07-26 (temporary signed-in `/home` under `(web)` + `PRIVATE_ROUTES.home`; most SEO helpers still unused by other pages)._
````

#### SEO-2 - `docs/seo-ranking-setup.md:L41` - **REPLACE**

CURRENT (verbatim):
````text
| A12 | Slug helper | `src/lib/utils/slug.ts` | Future slug UI/canonical; no second slugger. |
````
REPLACEMENT (whole passage):
````text
| A12 | Slug helpers | `src/lib/utils/slug.ts` | `sanitizeSlugInput` / `SLUG_PATTERN` / `SLUG_MAX_LENGTH` / `isSlugAdjusted` for editable slugs. The FE has no name-to-slug generator (the BE generates slugs), so do not add a slugger for future canonical/SEO use. |
````

## A11. `docs/taxonomy-admin.md`

#### TREE-1 - `docs/taxonomy-admin.md:L58` - **FRAGMENT**

CURRENT (verbatim line):
````text
Sidebar items and actions use RBAC keys from `src/constants/permissions.ts` (e.g. `course_level:read`, `topic:create`). Group visibility uses `TAXONOMY_GROUP_READ_PERMISSIONS` (`src/constants/taxonomy/resources.ts`) with `permissionMode: "any"` on the parent node; each child has its own read permission. Per-resource columns, tree flags, and searchable fields: `TAXONOMY_RESOURCES` + `getTaxonomyResourceConfig()` / `getTaxonomySearchableColumns()` / `countTaxonomyTreeNodes()` (`src/lib/utils/taxonomy/`).
````
FRAGMENT 1 - replace exactly:
````text
`getTaxonomyResourceConfig()` / `getTaxonomySearchableColumns()` / `countTaxonomyTreeNodes()` (`src/lib/utils/taxonomy/`).
````
with:
````text
`getTaxonomyResourceConfig()` / `getTaxonomySearchableColumns()` (`src/lib/utils/taxonomy/`); nested-node counting and depth use the generic `countTreeNodes` / `getTreeMaxDepth` (`src/lib/utils/tree.ts`).
````

#### DAG-3 - `docs/taxonomy-admin.md:L78` - **REPLACE** (replaces the inventory's TAX-11 "keep as is")

Verified in source: `buildTaxonomyDagreRoot` (`src/lib/utils/taxonomy/resource.ts:52-62`) returns `{ id: String(row.id), name: row.name, slug: row.slug, children: getTaxonomyTreeFromEntity(resourceKey, row) }` - raw `name` and raw entity nodes, no FE locale resolution; `walkTree` in `src/lib/utils/dagre-tree.ts` labels each node with `node.name` only and never reads `slug`. The "resolved" name is the one the BE returns for the list `locale` (`ResolveTreeNames`). `DagreTreeRoot.slug` is carried but unused.

CURRENT (verbatim):
````text
Topics and skills list rows with nested `child_topics` / `children` show a **View tree** button in the `child_render` column. It opens shared `DagreTreeDialog` with `nodesDraggable={false}` (read-only layout; no manual node repositioning). The list row is the graph root; descendants use `@xyflow/react` + `dagre`. Each node shows **resolved name** for the current list `locale` (no slug). Layout toggles: vertical (default) or horizontal. Rows with no child nodes show a disabled button with tooltip.
````
REPLACEMENT (whole passage):
````text
Topics and skills list rows with nested `child_topics` / `children` show a **View tree** button in the `child_render` column. It opens shared `DagreTreeDialog` with `nodesDraggable={false}` (read-only layout; no manual node repositioning). The list row is the graph root (`buildTaxonomyDagreRoot` in `src/lib/utils/taxonomy/resource.ts`); descendants use `@xyflow/react` + `dagre`. Each node label is the `name` the BE returned for the current list `locale` (the FE passes it through unchanged and does no locale resolution); slugs are never shown. The button count comes from `countTreeNodes` (`src/lib/utils/tree.ts`). Layout toggles: vertical (default) or horizontal. Rows with no child nodes show a disabled button with tooltip.
````

#### LIM-1 - `docs/taxonomy-admin.md:L140` - **FRAGMENT**

CURRENT (verbatim line):
````text
- Non-`en` name / short_description inputs use the same max lengths as canonical (`name` 255, short 100); BE validates every locale after canonicalize.
````
FRAGMENT 1 - replace exactly:
````text
(`name` 255, short 100);
````
with:
````text
(`TAXONOMY_NAME_MAX_LENGTH` = 255, `TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH` = 100, `src/constants/taxonomy/limits.ts`);
````

## A12. `docs/testing.md`

#### TST-8 - `docs/testing.md:L80` - **REPLACE**
_Missed by the inventory (Appendix A marks L80 "no"). `generateSlug` is deleted, so the contract cell and the "regression" case become false._

CURRENT (verbatim):
````text
| `src/lib/utils/slug.ts` (`sanitizeSlugInput`, `SLUG_PATTERN`, `SLUG_MAX_LENGTH`; `generateSlug` unchanged) | `src/lib/utils/slug.test.ts` | valid characters kept, uppercase/accented dropped, emoji/CJK/punctuation dropped, every whitespace character becomes `-`, idempotence, length cap, `SLUG_PATTERN` accept/reject table, `generateSlug` regression | ✅ Passing (15 cases) |
````
REPLACEMENT (whole passage):
````text
| `src/lib/utils/slug.ts` (`sanitizeSlugInput`, `SLUG_PATTERN`, `SLUG_MAX_LENGTH`, `isSlugAdjusted`) | `src/lib/utils/slug.test.ts` | valid characters kept, uppercase/accented dropped, emoji/CJK/punctuation dropped, every whitespace character becomes `-`, idempotence, length cap, `SLUG_PATTERN` accept/reject table, `isSlugAdjusted` undefined/equal/different | [Status] ([N] cases) |
````

## A13. `docs/instructor-admin.md` (optional)

#### INS-3 - `docs/instructor-admin.md:L88` and `L90` - **FRAGMENT** (optional wording; the course UI now renders through `FormField` / `SlugField`)

CURRENT (verbatim passages):
````text
The slug is an editable **optional** field (shared `SlugInput`; input filtered by `sanitizeSlugInput`
````
````text
The slug field (`SlugInput`, default = `course.slug`) is disabled while there is no draft
````
FRAGMENT (L88) - replace exactly: `(shared `SlugInput`; input filtered by` with `(shared `SlugField` over `SlugInput`; input filtered by`.
FRAGMENT (L90) - replace exactly: `The slug field (`SlugInput`, default = `course.slug`)` with `The slug field (`SlugField` over `SlugInput`, default = `course.slug`)`.
(INS-2's fragment on L88 targets a different substring; apply both.)

## A14. `docs/quality.md` (optional)

#### QUA-1 - `docs/quality.md:L3` - **REPLACE** and `L235` - **INSERT**
_The "jscpd dedup refactors" table is the project's log of extracted shared modules; this change extracts several. Skip both items if the table is considered closed history, but then also keep `docs/quality.md` in "Scanned - no change"._

CURRENT (L3, verbatim):
````text
_Last audited: 2026-09-16 (`test` now runs the real Jest suite — see [`docs/testing.md`](./testing.md); `deadcode`/Knip in `test-all` / `check-all`; CI `test` job uses `test-all`)._
````
REPLACEMENT (L3):
````text
_Last audited: 2026-10-14 (jscpd dedup table: shared tree / payload / slug / form-field / slug-conflict modules). Prior: 2026-09-16 (`test` now runs the real Jest suite — see [`docs/testing.md`](./testing.md); `deadcode`/Knip in `test-all` / `check-all`; CI `test` job uses `test-all`)._
````
Anchor (L235, unchanged; insert after it) - CURRENT:
````text
| `DashboardSidebarLevel` ↔ `DashboardSidebarSubLevel` | Single `DashboardSidebarTree` with `level: "root" \| "sub"` in `dashboard-sidebar.tsx` |
````
INSERT text:
````text
| Recursive tree walks (taxonomy count / depth / slug collection, dashboard nav lookup, dagre walk) | `src/lib/utils/tree.ts` (`walkTree`, `flattenTree`, `countTreeNodes`, `getTreeMaxDepth`, `findTreePath`, `findTreeNodeById`, `updateTreeNode`) |
| "Include optional field only when non-blank / changed" in course and taxonomy payload builders | `src/lib/utils/payload.ts` (`omitWhenBlank`, `changedNonBlank`, `payloadField`) |
| Slug zod rules (course create / basic-info, taxonomy root + tree nodes) | `src/schema/shared/slug.ts` (`optionalSlugField`, `requiredSlugField`) |
| 3007 conflict state machine (course create, taxonomy create) + stacked confirm | `src/hooks/slug/use-slug-conflict-flow.ts` + `src/components/shared/slug-conflict-confirm-dialog.tsx` |
| Label + control + hint + error block (course create, basic-info, taxonomy form) | `src/components/shared/form-field.tsx` / `slug-field.tsx` |
| Auth-local `resolveAuthValidationMessage` / `AuthFieldError` | shared `resolveValidationMessage` + `FieldError` |
````

---


---

# Resolved decisions

| id | Decision | Where it shows |
|---|---|---|
| C-I18N | New keys under `taxonomy.form` and `taxonomy.tree` / `taxonomy.treeSkills`; `taxonomy.toast` is NOT created | TAX-3, TAX-5, LF-3 |
| C-TAX-SEM | edit default = persisted slug; blank on edit blocked (`slugRequired`, BE answers `400`); tree-node conflicts auto-resolved by the BE and reported with `treeSlugsAdjusted`; the slug field is shown on every language tab | TAX-5, APIO-2/4, LF-3, PAT-2 |
| C-SCHEMA | root slug validated in `taxonomySlugStatusSchema` with `optionalSlugField`; edit via `getTaxonomyFormSchema(resourceKey, "edit")` + `requiredSlugField` | TAX-8, PAT-1, SCH-*, FS-10 |
| C-HOOK | `useCourseCreateFlow` stays a thin wrapper over `useSlugConflictFlow` in `src/hooks/slug/` | PAT-3, APIO-3, APIU-2, INS-1/2, LF-2, CMP-6→FF-3, RA-10*, MOD-4, TST-7 |
| C-PAYLOAD | the omit-blank / omit-unchanged rule is `src/lib/utils/payload.ts` (`omitWhenBlank`, `changedNonBlank`, `payloadField`); `buildSlugPayloadField` does not exist; `isSlugAdjusted` stays in `slug.ts` | PAY-*, TAX-5, PAT-2, RA-15 |
| C-TREE | generic tree helpers in `src/lib/utils/tree.ts`; `countTaxonomyTreeNodes` / `getTaxonomyTreeMaxDepth` deleted; dashboard finders and dagre `walkTree` reuse it | TREE-*, NAV-*, DAG-* |
| C-OWNER | `SortableTreeEditor` removed from `components/shared`, merged into `TaxonomyTreeEditor` (`features/taxonomy`); `TreeNodeSlugField` lives there | MOVE-*, RA-11/MOVE-7 |
| C-FIELD | `FormField` (+ `SlugField`) shared; `AuthFieldError` and `resolveAuthValidationMessage` deleted; `ImageFileField` label branch uses `RequiredLabel` | FF-*, VAL-* |
| C-SLUGIFY | `generateSlug` / `slugifyName` deleted | RA-14, RA-15, FS-6, PAT-2, SEO-2, TST-8 |
| C-E2E | a Playwright spec `e2e/tests/taxonomy-slug.spec.ts` and fixture taxonomy endpoints are added | TST-2, TST-3, TST-5, FS-7, FS-8 |
| C-TESTS | files and cases are in `code-change-inventory.md` §G; docs use `[N]` placeholders until the run | TST-4..TST-8 |

---

# Scanned — no change (one-line justification each)


| File(s) | Justification |
|---|---|
| `README.md` | 5 matches are generic words (`Low-level API Helpers`, `app-level`); docs index (L69-L86) does not list taxonomy-admin/instructor-admin; no slug content |
| `IMPLEMENTATION_PLAN_EXECUTION.md` | 0 matches; auth plan only |
| `AGENTS.md`, `CLAUDE.md` | GitNexus + agent-rule boilerplate; the symbol-count header is regenerated by `npx gitnexus analyze`; no new rule added so no `<!-- begin:... -->` boundary needed |
| `docs/flow.md` | 3 word matches; auth/API execution flows, no taxonomy/slug flow |
| `docs/quality.md` | 7 matches are historical refactor notes (taxonomy util path moves) and gate tooling; gates unchanged |
| `docs/router.md` | 15 matches: taxonomy route trees and `TaxonomyListPage` mapping; no route added/changed; L206 `info` row already says editable slug (course) |
| `docs/instructor-application.md` | become-instructor flow; taxonomy pickers + its own `search-text.ts` slug helper; unrelated |
| `docs/media-collection.md` | L5 mentions taxonomy topic/outcome image picker only; no slug |
| `docs/course-collaboration-handoff-2026-06-04.md` | dated snapshot (taxonomy pickers with `include_images: false`) |
| `docs/docker.md`, `docs/deploy.md`, `docs/security-hardening-notes.md` | operations/security notes; no taxonomy or slug content |
| `docs/delivery.md`, `docs/delivery/*.md` (broadcast, graphql, grpc, long-polling, mqtt, sse, websocket) | realtime protocol docs; `mqtt.md` matches are the word 'topic' |
| `.ai/skills/logic-n-1-optimize/SKILL.md` | batch-API skill; matches are 'item-level' |
| `.ai/skills/nextjs-optimization/SKILL.md`, `.../references/example.md` | Next.js image/layout examples; 'tags'/'children' words |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | generic product `[slug]` route SEO examples (`params.slug`); not project taxonomy |
| `.claude/skills/gitnexus/*/SKILL.md`, `.claude/skills/openspec-*/SKILL.md`, `.claude/commands/opsx/*.md`, `.cursor/commands/opsx-*.md`, `.cursor/skills/**` | tooling/agent workflow instructions (OpenSpec, GitNexus, session handoff); matches are 'topic', 'tags:' front-matter, 'Risk Level' |
| `.commandcode/taste/taste.md` | 0 matches; coding taste notes |
| `openspec/specs/auth-route-modal/spec.md`, `dashboard-access-control/spec.md`, `frontend-error-handling/spec.md`, `frontend-test-execution/spec.md` | main specs unrelated to slug (matches: 'top-level', 'error-level') |
| `openspec/specs/frontend-regression-coverage/spec.md` | L33 already lists 'taxonomy validation' generically; main specs are synced at archive. This change's delta goes in `openspec/changes/add-taxonomy-slug-management-ui/specs/frontend-regression-coverage/spec.md` (ADDED requirement, same shape as the course delta) plus a new capability spec `specs/taxonomy-slug-management/spec.md` |
| `openspec/changes/disable-dev-deploy-job/**`, `sync-course-collaborator-role-contract/**`, `sync-me-roles-contract/**` | other changes (CI job / role contracts); unrelated |
| `openspec/changes/add-course-slug-management-ui/**` (7 files: proposal, design, tasks, code-change-inventory, docs-update-inventory, 2 delta specs) | previous change artifacts (course); historical, not edited; used as the format/precedent |
| `.context/session-*.md` (23 files: 01457896, 0cbbd10e, 1e75c950, 1f9f24f9, 243b8b29, 249f210a, 33a65cbf, 5be16e63, 611a23d9, 61dbaa9b, 6b07ffc5, 7e8b4ee8, 81dadc11, 8ac1e19a, 91fc796e, a3fd2aad, accf7ff0, b60212f9, c50503c2, cc09c1ec, e4e6f2e0, e7d53670, f0ce04d5) | other sessions' history; AGENTS.md forbids touching other Session IDs' files. At implementation time the new `.context/session-<SESSION_ID>.md` is created/updated (not by this scan) |
| `openspec/changes/archive/**` | archived changes; excluded by the task (historical) |
| `docs/folder-structure.md`, `docs/screens.md`, `docs/pages.md`, `docs/modules.md`, `docs/components.md`, `docs/architecture.md`, `docs/api-overview.md`, `docs/api-using.md`, `docs/patterns.md`, `docs/logic-flow.md`, `docs/instructor-admin.md`, `docs/testing.md`, `docs/reusable-assets.md`, `docs/taxonomy-admin.md` | **these DO change** - see section 4; only the individually listed matched lines in Table A marked `no` stay as-is |


Additional files examined by the second scan:

| File / lines | Reason |
|---|---|
| `AGENTS.md`, `CLAUDE.md` | GitNexus/agent boilerplate; only the regenerated symbol counts change (inventory already covers). No symbol of this change is mentioned. |
| `README.md:L251`, `L266` | `L266` ("`auth-form-fields.tsx` resolves keys via `useTranslations("auth")` only when `error.message` is set") stays true under the shared `resolveValidationMessage`; `L251` is a partial barrel member list. |
| `docs/flow.md:L70` | Same sentence as README L266; still accurate (behavior unchanged, only the helper is shared). Optional wording: append "via the shared `resolveValidationMessage`". |
| `docs/architecture.md:L21` (`DagreTreeDialog` ... + `dagre-tree.ts`), `L133` (`shared/ # Cross-feature components (SearchBar, …)`), `L167-L172` (hooks tree, partial overview with `…`) | Still true; partial listings with ellipsis or without domain-specific members. |
| `docs/components.md:L53` (`Field` ui), `L134-L135` (`DashboardPageHeader`, `useRegisterDashboardPageHeader`), `L171` (`AuthFullNameField` "same validation translation pattern") | Unrelated or still accurate. |
| `docs/folder-structure.md:L172`, `L182`, `L288`, `L325-L326`, `L493` | Dashboard header files and `auth-form-fields.tsx` (Zod i18n validation translate) comments are still accurate; barrel comment is generic. |
| `docs/reusable-assets.md:L375` (`DashboardPageHeader` component asset), `L416`, `L616`, `L705`, `L868`, `L1226`, `L1451` | Unrelated to the final design or still accurate (L1226 already says `extractRecommendedSlug` is not in the barrel). |
| `docs/router.md:L278`, `docs/screens.md:L294` | "The resolver logic itself lives in `src/lib/navigation/dashboard-page-header.ts`" - still true; internal reuse of `findTreeNodeById` / `findTreePath` is documented in NAV-1 / NAV-2. |
| `docs/quality.md:L159`, `L175`, `L234` | Dated historical refactor notes (`countTaxonomyTreeNodes` -> `taxonomy.ts` on 2026-05-29) and the 2026-05-27 jscpd table; history, not current state. Only the optional QUA-1 adds a new dated row group. |
| `docs/instructor-application.md:L100`, `L108`, `L215` | `FieldError`-word / `validate-application-form.ts` matches; unrelated to the shared validation helper changes (they use `firstValidationMessageKey` / `translateValidationIssueMessage`, which are unchanged). |
| `docs/pages.md:L90-L92`, `docs/instructor-admin.md:L116` | `RequiredLabel` / `FieldError` mentions remain true (components still used directly where the layout differs). |
| `docs/media-collection.md`, `docs/api-using.md:L484`, `docs/api-overview.md`, `docs/taxonomy-admin.md:L37`, `L90` | `ImageFileField` / `image_file_id` statements describe the optional field, not the omit rule; `L484` lists `resources.ts` only (no limits mention needed); behavior unchanged. |
| `docs/dependencies.md:L138`, `docs/components.md:L102` | "Taxonomy uses `@dnd-kit` wrappers" - still true. |
| `openspec/specs/**`, `.ai/skills/**` | Zero hits for every symbol/phrase in the task list. `openspec/specs/frontend-regression-coverage/spec.md` is synced at archive. |

---

# Appendix A — complete scan of every project-owned markdown file (first scan)


Pattern (case-insensitive): `taxonom|\blevels?\b|\btopics?\b|\bskills?\b|\btags?\b|child_topics|\bchildren\b|slug|slugify|generateSlug|SortableTreeEditor|TaxonomyFormDialog|form-submit|form-helpers|toTaxonomyTreeWritePayload|SlugInput|useCourseCreateFlow|extractRecommendedSlug|3007|recommended_slug|ConfirmActionDialog`.
Excluded from the line table (listed in section 6 instead): `openspec/changes/add-course-slug-management-ui/**` (the previous change's own artifacts, 7 files), `.context/session-*.md` (23 read-only session logs), `openspec/changes/archive/**`, `node_modules`, `.next`, `.git`, `.gitnexus`.
`needs-change = yes` lines are covered by the edit id in the *reason* column; `yes (anchor)` marks a line that is only the INSERT anchor (the line itself is unchanged).

| file | line | matched text (verbatim, trimmed) | needs-change | reason |
|---|---|---|---|---|
| `.ai/skills/nextjs-optimization/references/example.md` | 20 | export default function Layout({ children }) { | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-optimization/references/example.md` | 21 | return <body className={inter.className}>{children}</body>; | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-optimization/SKILL.md` | 61 | - **No `<img>` tag**: Use `next/image` to prevent CLS and enable automatic optimization. | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/logic-n-1-optimize/SKILL.md` | 1 | # Frontend Skill: Batch API Usage for Multi-Item Operations | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/logic-n-1-optimize/SKILL.md` | 182 | Avoid creating one loading state per item unless the UI truly supports independent item-level actions. | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/logic-n-1-optimize/SKILL.md` | 244 | When useful, show item-level error details. | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/logic-n-1-optimize/SKILL.md` | 352 | Do not retry item-by-item unless the backend contract explicitly supports item-level retry. | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 9 | # Next.js SEO Optimization Skill | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 13 | Use this skill when: | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 17 | - Adding Open Graph tags for social sharing | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 65 | children, | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 67 | children: React.ReactNode | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 72 | {/* Additional meta tags */} | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 81 | <body>{children}</body> | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 90 | // app/products/[slug]/page.tsx | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 95 | params: { slug: string } | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 99 | const product = await getProduct(params.slug) | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 115 | url: `https://myshop.com/products/${product.slug}`, | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 141 | slug: product.slug | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 146 | const product = await getProduct(params.slug) | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 165 | // app/products/[slug]/page.tsx | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 176 | url: `https://myshop.com/products/${product.slug}`, | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 184 | url: `https://myshop.com/products/${product.slug}`, | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 254 | url: `${baseUrl}/products/${product.slug}`, | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 357 | // app/products/[slug]/opengraph-image.tsx | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 370 | params: { slug: string } | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 374 | const product = await getProduct(params.slug) | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 413 | '✅ Title tag (50-60 chars)', | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 415 | '✅ H1 tag (only one)', | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.ai/skills/nextjs-seo-optimization/SKILL.md` | 430 | '✅ Open Graph tags dynamic', | no | generic skill example (product/`[slug]` route sample, item-level wording); no project taxonomy content |
| `.claude/commands/opsx/archive.md` | 5 | tags: [workflow, archive, experimental] | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/commands/opsx/archive.md` | 65 | If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke openspec-sync-specs for change '<name>'. D... | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/commands/opsx/archive.md` | 159 | - If sync is requested, use the Skill tool to invoke `openspec-sync-specs` (agent-driven) | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/commands/opsx/explore.md` | 5 | tags: [workflow, explore, experimental, thinking] | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/commands/opsx/explore.md` | 147 | - Stay on topic if a tangent is valuable | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` | 76 | 2. Use the other GitNexus skills (`exploring`, `debugging`, `impact-analysis`, `refactoring`) for your task | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` | 36 | - [ ] Assess risk level and report to user | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` | 41 | \| Depth \| Risk Level       \| Meaning                  \| | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/commands/opsx/propose.md` | 5 | tags: [workflow, artifacts, experimental] | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/commands/opsx/apply.md` | 5 | tags: [workflow, artifacts, experimental] | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/commands/opsx/apply.md` | 152 | This skill supports the "actions on a change" model: | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/skills/openspec-explore/SKILL.md` | 142 | - Stay on topic if a tangent is valuable | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/commands/opsx/sync.md` | 5 | tags: [workflow, specs, experimental] | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/skills/openspec-apply-change/SKILL.md` | 156 | This skill supports the "actions on a change" model: | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.cursor/commands/opsx-archive.md` | 65 | If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke openspec-sync-specs for change '<name>'. D... | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.cursor/commands/opsx-archive.md` | 159 | - If sync is requested, use the Skill tool to invoke `openspec-sync-specs` (agent-driven) | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` | 15 | 2. **Match your task to a skill below** and **read that skill file** | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` | 16 | 3. **Follow the skill's workflow and checklist** | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` | 20 | ## Skills | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` | 22 | \| Task                                         \| Skill to read       \| | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.cursor/commands/opsx-apply.md` | 152 | This skill supports the "actions on a change" model: | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.claude/skills/openspec-archive-change/SKILL.md` | 69 | If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke openspec-sync-specs for change '<name>'. D... | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.cursor/commands/opsx-explore.md` | 147 | - Stay on topic if a tangent is valuable | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.cursor/skills/openspec-apply-change/SKILL.md` | 156 | This skill supports the "actions on a change" model: | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.cursor/skills/openspec-archive-change/SKILL.md` | 69 | If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke openspec-sync-specs for change '<name>'. D... | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `.cursor/skills/session-context-handoff/SKILL.md` | 11 | # Skill: Session Context Handoff (`/save` / `/load`) | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `CLAUDE.md` | 12 | - **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName"... | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `CLAUDE.md` | 49 | ## Impact Risk Levels | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `CLAUDE.md` | 94 | \| Task \| Read this skill file \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `CLAUDE.md` | 96 | \| Understand architecture / "How does X work?" \| `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `CLAUDE.md` | 97 | \| Blast radius / "What breaks if I change X?" \| `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `CLAUDE.md` | 98 | \| Trace bugs / "Why is X failing?" \| `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `CLAUDE.md` | 99 | \| Rename / extract / split / refactor \| `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `CLAUDE.md` | 100 | \| Tools, resources, schema reference \| `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `CLAUDE.md` | 101 | \| Index, status, clean, wiki CLI commands \| `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `.cursor/skills/openspec-explore/SKILL.md` | 142 | - Stay on topic if a tangent is valuable | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `docs/api-overview.md` | 43 | - Low-level helper return type: `ApiResult<T>` with `data/statusCode/headers/cookies`. | no | route/list/dual-response line unrelated to slug |
| `docs/api-overview.md` | 48 | - `ApiErrorCode.SlugAlreadyExists` (**3007**, HTTP 409) is returned by `POST /courses` when the slug is taken; the create response body carries `da... | yes | APIO-2 REPLACE |
| `docs/api-overview.md` | 78 | - `GET/POST/PATCH/DELETE /api/v1/instructor-profiles`, `GET …/me` — identity/snapshot DTOs (no separate named taxonomy chip hydrate on profile GETs) | no | route/list/dual-response line unrelated to slug |
| `docs/api-overview.md` | 79 | - `GET/POST/DELETE …/instructors/:id/expertise/topics\|skills` — pass **`locale`**; FE SWR keys must include `locale` | no | route/list/dual-response line unrelated to slug |
| `docs/api-overview.md` | 89 | \| `POST /api/v1/courses` \| `createCourseService` \| Body `{ title, slug? }` (`toCreateCoursePayload`); a blank slug is omitted so the BE generates i... | yes | APIO-3 FRAGMENT |
| `docs/api-overview.md` | 91 | \| `PATCH /api/v1/courses/:courseId/basic-info` \| `updateCourseBasicInfoService` \| Optimistic lock via `expected_row_version`; FE updates lock from ... | no | course PATCH row accurate |
| `docs/api-overview.md` | 104 | - Info tab only: `useTaxonomyList` with `include_images: false`. | no | route/list/dual-response line unrelated to slug |
| `docs/api-overview.md` | 106 | See `docs/api-using.md` § Course detail and § Taxonomy. | no | route/list/dual-response line unrelated to slug |
| `docs/api-overview.md` | 108 | ## Taxonomy routes (private) | no | route/list/dual-response line unrelated to slug |
| `docs/api-overview.md` | 110 | `API_PRIVATE_ROUTES.taxonomy` — callers in `src/api/callers/taxonomy/taxonomy-factory.ts (+ taxonomy-browser.ts)`, hooks in `src/api/hooks/taxonomy... | no | route/list/dual-response line unrelated to slug |
| `docs/api-overview.md` | 114 | **Dual response:** list / `GET /:id?locale=` → localized/public shape; `GET /:id?view=edit` → admin editable (canonical + full `translations` + `ro... | yes (anchor) | APIO-4 INSERT after this line |
| `docs/api-overview.md` | 136 | 10. Server Actions import `create*Callers` from `*-factory.ts` only — never from a file that top-level-imports `browserApiMethods` / Zustand. | no | route/list/dual-response line unrelated to slug |
| `docs/api-overview.md` | 143 | - Use `raw*` helpers only for refresh/low-level paths. | no | route/list/dual-response line unrelated to slug |
| `docs/course-collaboration-handoff-2026-06-04.md` | 100 | - basic metadata editing (info tab; taxonomy pickers with `include_images: false`) | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `docs/course-collaboration-handoff-2026-06-04.md` | 150 | - taxonomy hooks | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `docs/course-collaboration-handoff-2026-06-04.md` | 160 | - the backend course package cleanup/refactor is now lint-clean at the package level | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `docs/api-using.md` | 358 | For component-level error handling, catch transport throws or check application `code`: | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 364 | // Application-level error — use toastApiError / translateApiErrorCode, never data.message | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 367 | // Network / HTTP-level error (ApiHttpError / ApiTransportError) | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 401 | const url = buildQueryParams("/api/v1/taxonomy/levels", apiListQueryToRecord(filters)); | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 404 | Domain modules may alias or extend this shape. Taxonomy extends it with `search_by` + `search_value`, optional `include_images` (pass `false` to sk... | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 408 | ### Course create and basic-info slug | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 412 | \| `createCourseService` \| `POST /api/v1/courses` \| `{ title, slug? }` built by `toCreateCoursePayload(title, slug)` (`@/lib/utils/course`); a blank... | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 413 | \| `updateCourseBasicInfoService` \| `PATCH /api/v1/courses/:courseId/basic-info` \| `expected_row_version` plus optional `slug` from `toUpdateCourseB... | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 415 | Slug conflicts return HTTP `409` with app code **3007** (`ApiErrorCode.SlugAlreadyExists`, copy in `errors.codes.3007` en/vi). `extractRecommendedS... | yes | APIU-2 FRAGMENT |
| `docs/api-using.md` | 435 | ## Taxonomy (admin) | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 437 | Callers live in `src/api/callers/taxonomy/taxonomy-factory.ts (+ taxonomy-browser.ts)`. List data uses the paginated envelope (`data.result` + `dat... | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 441 | listTaxonomyService, | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 442 | getTaxonomyDetailService, | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 443 | createTaxonomyService, | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 444 | updateTaxonomyService, | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 445 | } from "@/api/callers/taxonomy"; | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 446 | import { useTaxonomyList } from "@/api/hooks/taxonomy/useTaxonomy"; | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 449 | const { rows, pageInfo, mutate } = useTaxonomyList("levels", { | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 457 | useTaxonomyList("topics", { | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 465 | const detail = await getTaxonomyDetailService("levels", id, { view: "edit" }); | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 468 | await createTaxonomyService("tags", { | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 473 | await updateTaxonomyService("tags", id, { | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 481 | \| `listTaxonomyService` / `useTaxonomyList` \| Localized list (`locale`); optional `include_images` \| | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 482 | \| `getTaxonomyDetailService` \| `locale` → public/localized shape; `view: "edit"` → canonical + `translations` + tree translations + `row_version` \| | yes (anchor) | APIU-5 INSERT after this line |
| `docs/api-using.md` | 484 | Routes are declared in `API_PRIVATE_ROUTES.taxonomy` (`src/constants/api-route.ts`). Resource tables live in `src/constants/taxonomy/resources.ts` ... | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 486 | See also `docs/taxonomy-admin.md`, `docs/instructor-admin.md`. | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 492 | Callers live in `src/api/callers/media/media-factory.ts (+ media-browser.ts)`. List uses the same `apiListQueryToRecord()` helper as taxonomy. | no | generic API/auth/media/course statement; taxonomy list/detail content stays accurate |
| `docs/api-using.md` | 539 | - `409` slug conflicts use code **3007** (`ApiErrorCode.SlugAlreadyExists`); `extractRecommendedSlug(error)` reads `data.recommended_slug` for the ... | yes | APIU-6 REPLACE |
| `docs/components.md` | 3 | _Last audited: 2026-09-29 (course slug UI: shared `SlugInput`, create-course optional slug + recommended-slug confirm, basic-info editable slug). P... | yes | CMP-1 REPLACE |
| `docs/components.md` | 65 | \| `Popover` \| `ui/popover.tsx` \| `radix-ui` \| Floating panel (date picker, menus). `PopoverContent` accepts optional `portal` (default `true`). Use... | no | component inventory line unrelated to slug UI |
| `docs/components.md` | 101 | \| `@dnd-kit/core`, `sortable`, `utilities`, `modifiers`, `accessibility` \| Modern DnD toolkit \| `SortableList`, `SortableTreeEditor` \| | no | component inventory line unrelated to slug UI |
| `docs/components.md` | 102 | \| `@nosferatu500/react-sortable-tree` + `react-dnd` + `react-dnd-html5-backend` \| Legacy tree pkg (installed) \| Taxonomy form uses `@dnd-kit` wrapp... | no | legacy-tree package row accurate |
| `docs/components.md` | 133 | \| `DashboardLayout` \| `dashboard-layout.tsx` \| Client \| Core dashboard shell: `SidebarProvider` + `HeaderDashboard` (`leading` burger `md:hidden`, ... | no | component inventory line unrelated to slug UI |
| `docs/components.md` | 137 | \| `DashboardSidebar` \| `dashboard-sidebar.tsx` \| Client \| Recursive nav tree (pattern from `BrowseSidebarMenu`). Renders each item's Lucide `icon` ... | no | component inventory line unrelated to slug UI |
| `docs/components.md` | 158 | \| `UserMenuDropdownItems` \| `user-menu-dropdown-items.tsx` \| Client \| Renders `useFilteredUserMenuGroups()` (deep permission-filtered `HEADER_DROPD... | no | component inventory line unrelated to slug UI |
| `docs/components.md` | 159 | \| `AuthButton` \| `auth-button.tsx` \| Client \| "Sign In / Sign Up" CTA buttons. No longer Zustand-driven: on any other page, renders `<Link href={lo... | no | component inventory line unrelated to slug UI |
| `docs/components.md` | 227 | \| `PermissionGate` \| `permission-gate.tsx` \| Client wrapper: shows `children` when `useSatisfiesPermissions` passes; optional `fallback`. Props: `p... | no | component inventory line unrelated to slug UI |
| `docs/components.md` | 230 | \| `ConfirmActionDialog` \| `confirm-action-dialog.tsx` \| Generic confirm shell (`title`, `description`, `confirmLabel`, `cancelLabel`, `isLoading`, ... | yes | CMP-2 FRAGMENT |
| `docs/components.md` | 232 | \| `ConfirmDeleteDialog` \| `confirm-delete-dialog.tsx` \| Soft-delete confirm; thin wrapper over `ConfirmActionDialog` with `taxonomy.delete` default... | no | component inventory line unrelated to slug UI |
| `docs/components.md` | 233 | \| `DataTable` \| `data-table.tsx` \| Generic sortable admin table (`columns`, `rows`, `sort`, `renderActions`) with optional built-in filter toolbar ... | no | component inventory line unrelated to slug UI |
| `docs/components.md` | 235 | \| `SortableTreeEditor` \| `sortable-tree-editor.tsx` \| Nested sortable tree (name + read-only slug); used by taxonomy topics/skills form editor. \| | yes | CMP-3 REPLACE |
| `docs/components.md` | 236 | \| `SlugInput` \| `slug-input.tsx` \| Editable slug `Input`; every change is filtered by `sanitizeSlugInput` (`a-z 0-9 -`, spaces become `-`, max 255)... | yes | CMP-4 REPLACE |
| `docs/components.md` | 237 | \| `DagreTreeDialog` \| `dagre-tree-dialog.tsx` \| Dagre layout popup (`@xyflow/react` + `dagre`); `nodesDraggable` prop (default `true`); node labels... | no | component inventory line unrelated to slug UI |
| `docs/components.md` | 242 | `src/components/features/taxonomy/` — taxonomy CRUD UI only: `TaxonomyFormDialog` (Zod schemas, `RequiredLabel`, `FieldError`, `toastApiError`; loc... | yes | CMP-5 FRAGMENT |
| `docs/components.md` | 248 | `src/components/features/course/` — course editor tabs and dialogs (see below) plus sysadmin catalog UI: `buildCourseAdminListColumns` (shared `Dat... | yes | CMP-6 FRAGMENT |
| `docs/components.md` | 287 | \| `AppProviders` \| `app-providers.tsx` \| `SWRConfig` (`provider: meCacheProvider`, `src/lib/swr/me-cache-provider.ts` — see below) + `EventsStreamP... | no | component inventory line unrelated to slug UI |
| `AGENTS.md` | 10 | - **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName"... | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 47 | ## Impact Risk Levels | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 92 | \| Task \| Read this skill file \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 94 | \| Understand architecture / "How does X work?" \| `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 95 | \| Blast radius / "What breaks if I change X?" \| `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 96 | \| Trace bugs / "Why is X failing?" \| `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 97 | \| Rename / extract / split / refactor \| `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 98 | \| Tools, resources, schema reference \| `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 99 | \| Index, status, clean, wiki CLI commands \| `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` \| | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 104 | ## SKILLS | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 106 | 1. All relevant skill files under `.ai/skills/` | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 270 | This Session ID must be created outside every project, repository, workspace, Desktop project folder, and working tree. It must never be written in... | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 286 | The exact resolved path must be stored in the process-level environment variable: | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 300 | 7. A topic change, repository change, branch change, task change, date change, tool restart, retry, compaction, or new user message does not create... | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 505 | After reading the complete existing project `.context` folder and resolving the current project session context file, the agent must thoroughly rea... | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 507 | If `.ai/skills` exists, the agent must inspect every relevant skill before planning or implementing any change. | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `AGENTS.md` | 738 | * Files, modules, documentation, skills, or commands that should be inspected earlier next time. | no | GitNexus/agent-rule boilerplate; counts header regenerated by `npx gitnexus analyze`, no manual edit |
| `docs/architecture.md` | 20 | \| DnD / tree edit \| @dnd-kit/* \| 6.x \| `SortableList`, `SortableTreeEditor` in `src/components/shared/` \| | no | stack/cluster line unrelated to slug |
| `docs/architecture.md` | 22 | \| Legacy tree pkg \| @nosferatu500/react-sortable-tree \| 5.x \| Installed; taxonomy form uses `SortableTreeEditor` (@dnd-kit) instead \| | no | stack/cluster line unrelated to slug |
| `docs/architecture.md` | 24 | \| i18n \| next-intl \| 4.x \| Locales `en` and `vi`, `localePrefix: "always"` (no `ja` routing). Taxonomy **data** labels localize from BE via query `... | no | stack/cluster line unrelated to slug |
| `docs/architecture.md` | 56 | ## High-Level Request Flow | no | stack/cluster line unrelated to slug |
| `docs/architecture.md` | 109 | │   │       ├── admin/              # DashboardLayout; taxonomy + instructors/* | no | stack/cluster line unrelated to slug |
| `docs/architecture.md` | 111 | │   │       └── sysadmin/           # DashboardLayout; taxonomy + instructors/* | no | stack/cluster line unrelated to slug |
| `docs/architecture.md` | 113 | │   ├── screen/                     # Page-level screen components (async server components) | no | stack/cluster line unrelated to slug |
| `docs/architecture.md` | 177 | │   ├── schema/                     # Zod: auth, me, media, taxonomy, instructor, course (barrel @/schema) | no | stack/cluster line unrelated to slug |
| `docs/architecture.md` | 281 | \| `apiFetch` / `apiPost` / `apiPut` / `apiDelete` / `apiOptions` \| `api/core/methods.ts` \| Low-level helpers on `apiTransport` → `ApiResult<T>` \| | no | stack/cluster line unrelated to slug |
| `docs/architecture.md` | 284 | \| `extractRecommendedSlug` \| `lib/utils/api-error.ts` \| Read `data.recommended_slug` from a `409` / code 3007 (`SlugAlreadyExists`) create-course e... | yes | ARC-2 REPLACE |
| `docs/architecture.md` | 286 | \| `SlugInput` \| `components/shared/slug-input.tsx` \| Editable slug field (filters through `sanitizeSlugInput`: `a-z 0-9 -`, whitespace becomes `-`,... | yes | ARC-3 REPLACE |
| `docs/architecture.md` | 333 | `useAuth` uses SWR to cache the `GET /api/v1/me` response with options defined in `src/api/hooks/auth/useAuth.ts` (including `shouldRetryOnError: f... | no | stack/cluster line unrelated to slug |
| `docs/architecture.md` | 341 | `AppProviders` null-render sync children: `MeSwrSync` (`useSyncMeFromAuth`), `LanguageLocaleSync` (`useSyncLanguageFromLocale`), plus auth tab sync... | no | stack/cluster line unrelated to slug |
| `docs/architecture.md` | 480 | - **Server:** Module-level `Map` (in-process, per-worker) | no | stack/cluster line unrelated to slug |
| `docs/docker.md` | 9 | \| Environment \| Env file \| Host port \| Image tag \| | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `docs/flow.md` | 108 | \| `sameSite` \| `lax` \| Prevents CSRF while allowing top-level navigation redirects \| | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `docs/flow.md` | 374 | appCode: number;     // BE app-level code (mirrors be/pkg/errcode/codes.go), fallback 9999 | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `docs/flow.md` | 409 | A soft navigation to `/login` or `/signup` from anywhere in the app is intercepted as a modal overlay by the `@modal` parallel-route slot (`src/app... | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `docs/dependencies.md` | 59 | \| `zod` \| 4.3.6 \| Schema validation — `src/schema/{auth,me,media,taxonomy,instructor,course}/`; validation messages use module i18n keys (separate ... | no | no package added/changed (pencil toggle uses existing lucide-react) |
| `docs/dependencies.md` | 71 | > **Note:** We use **Quill directly** with a thin React wrapper (`DeltaEditor` in `src/components/shared/delta-editor.tsx`), not `react-quill`, bec... | no | no package added/changed (pencil toggle uses existing lucide-react) |
| `docs/dependencies.md` | 81 | > **Build note:** `pdfjs-dist` lists optional Node dep `canvas`. Turbopack production builds alias it to `src/lib/stubs/canvas.ts`; `PreviewPdf` us... | no | no package added/changed (pencil toggle uses existing lucide-react) |
| `docs/dependencies.md` | 133 | \| `@dnd-kit/core` \| ^6.3.1 \| DnD context — `SortableList`, `SortableTreeEditor` \| | no | no package added/changed (pencil toggle uses existing lucide-react) |
| `docs/dependencies.md` | 138 | \| `@nosferatu500/react-sortable-tree` \| ^5.0.0 \| Legacy nested tree pkg (installed; taxonomy uses `@dnd-kit` wrappers) \| | no | no package added/changed (pencil toggle uses existing lucide-react) |
| `docs/delivery/mqtt.md` | 40 | - Topic ACLs on broker; no wildcard subscribe from browser without auth. | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `docs/delivery/mqtt.md` | 49 | - Map MQTT topics → `source` + `type` in `normalize-inbound.ts`. | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `docs/instructor-application.md` | 44 | \| `search-text.ts` \| Shared normalize/search/slug helpers for combobox + remote datasets \| | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/instructor-application.md` | 45 | \| `helpers.ts` \| `resolveInstructorApplicationProfile`, `resolveInstructorDisplayName`, taxonomy chip labels \| | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/instructor-application.md` | 56 | **UI:** `src/components/features/instructor/become-instructor-application/` — `application-form`, `sections`, `panels`, `combobox-fields`, `taxonom... | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/instructor-application.md` | 98 | 3. Teaching content ideas — **`teaching_content_ideas` required** (`Textarea`, **50–500 Unicode code points**, live counter). Concrete class/course... | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/instructor-application.md` | 102 | 7. Expertise (`topic_ids` 1–5, `skill_ids` 1–15) — `TaxonomySelect` in `taxonomy-select.tsx` wraps shared `SearchableSelect` with `grid w-full` + `... | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/instructor-application.md` | 104 | **Sidebar required checklist (no headline):** bio (≥100 Unicode code points of plain text inside Delta), teaching content ideas (50–500 Unicode cod... | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/instructor-application.md` | 116 | \| `become-instructor-application/taxonomy-select.tsx` \| Section 7 topic/skill pickers \| Full section width \| | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/instructor-application.md` | 117 | \| `instructor-expertise-page.tsx` \| Instructor + topic/skill add pickers \| `max-w-md` / `w-[280px]` \| | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/instructor-application.md` | 130 | \| Taxonomy pickers \| GET \| `/api/v1/taxonomy/topics`, `/api/v1/taxonomy/skills` (include `locale` from `useLocale()`) \| | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/instructor-application.md` | 191 | List/detail for managed profiles and applications use **`latest_submission.profile`**. Use `resolveInstructorApplicationProfile()` from `src/lib/in... | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/instructor-application.md` | 203 | **Hooks:** `defaultLayoutPlugin()` at the **top level** of inner `PreviewPdfViewer`, not inside `useMemo`. | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/instructor-application.md` | 211 | 3. On success → `ConfirmActionDialog` (reminder to double-check all information). | no | become-instructor flow (taxonomy pickers, own `search-text.ts` slug helper) unrelated |
| `docs/logic-flow.md` | 117 | - FE refresh Route Handler exact-validates upstream `{code,message,data}` (finite integer code, non-empty string message) before cookie persist; ma... | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 245 | → filterUserMenuItems / filterPermissionNavTree: recurse all nested children first | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 314 | Modules migrated: Auth, Me GET errorCode, Media, Taxonomy, Instructor, Course (incl. useCourseEditorState). | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 344 | ├─ PATCH /courses/:id/basic-info  { …fields, expected_row_version, slug? }   (slug only if ≠ persisted course.slug) | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 347 | └─ response data.course.slug ≠ sent slug ? toast "slugAdjusted" : toast "basicInfoSaved" | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 349 | useCourseBasicInfoState(activeVersion, courseSlug)   [createCourseBasicInfoState(version, courseSlug)] | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 354 | BE increments `row_version` on each PATCH; stale `expected_row_version` returns `409` / app code `3005`. The slug is independent of the title (the ... | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 358 | ## 10a. Course Create — Optional Slug and Slug Conflict (3007) | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 360 | **Source:** `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`), `src/lib/utils/course.ts` (`toCreateCoursePayload`), `src/lib/uti... | yes | LF-2 FRAGMENT |
| `docs/logic-flow.md` | 363 | User submits create dialog { title, slug? } | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 367 | toCreateCoursePayload(title, slug)  → blank slug omitted → { title } \| { title, slug } | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 371 | ├─ 409 + code 3007 + data.recommended_slug  (extractRecommendedSlug(error)) | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 372 | │     → suggestedSlug set → stacked ConfirmActionDialog | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 373 | │         ├─ Yes → resubmit with slug = recommended_slug   (repeats on a new 3007) | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 378 | The FE never derives a slug from the title; a blank slug lets the BE generate it. The confirm is `ConfirmActionDialog stacked`, rendered inside the... | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 391 | AlertDialog confirmation  [editor-page.tsx — ConfirmActionDialog + course.editor.submitConfirm] | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 460 | \| `slugRequired` \| Basic-info slug is empty \| | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 461 | \| `slugInvalid` \| Slug does not match `SLUG_PATTERN`: `a-z`, `0-9`, `-`; no leading/trailing `-` \| | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 462 | \| `slugMax` \| Slug longer than `SLUG_MAX_LENGTH` (255) \| | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/logic-flow.md` | 519 | Info tab: useTaxonomyList ×5 with include_images=false (parallel, SWR dedupe 5m) | no | course §10/§10a/§11 flow or generic i18n/error flow; already accurate (course slug) |
| `docs/folder-structure.md` | 3 | _Last audited: 2026-09-29 (course slug UI: `slug-input.tsx`, `use-course-create-flow.ts`, `slug.ts` `sanitizeSlugInput`, `e2e/tests/course-slug.spe... | yes | FS-1 REPLACE |
| `docs/folder-structure.md` | 16 | ├── .claude/                # Version-controlled Claude commands and agent skills | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 70 | ├── layout.tsx          # Locale layout: NextIntlClientProvider + AppProviders; renders {children} + {modal} (@modal slot) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 71 | ├── not-found.tsx       # Locale-level 404 → NotFoundPage (inherits providers from layout) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 90 | │   ├── taxonomy/       # App routes → shared TaxonomyListPage (resourceKey per route) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 113 | ├── taxonomy/       # App routes → shared TaxonomyListPage (resourceKey per route) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 117 | ### `src/screen/` — Page-Level Screen Components | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 125 | │   ├── index.ts            # Barrel: shared screens (home, taxonomy, instructor, course) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 144 | │   └── taxonomy/ | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 146 | │       └── taxonomy-list-page.tsx  # TaxonomyListPage (client CRUD list, formDialogKey remount, shared by admin + sysadmin) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 170 | ├── common/                 # Layout-level components shared across all pages | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 191 | │   │                       # Course*Dialog helpers; grouped tab prop objects (`state` / `data\|taxonomyRows` / `actions`) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 192 | │   ├── taxonomy/           # TaxonomyFormDialog, TaxonomyLocaleTabsSection, tree/description editors, taxonomy-table-columns, taxonomy-tree-view-b... | no | taxonomy components dir comment unchanged (no new component file) |
| `docs/folder-structure.md` | 200 | │                           #   SortableTreeEditor, SlugInput, PreviewPdf (dynamic client-only) + preview-pdf-viewer, | no | `SlugInput` already listed in shared components |
| `docs/folder-structure.md` | 208 | │   │                       # + AuthConfirmTabSync / AuthLogoutTabSync + children | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 271 | │   └── …                    # same factory vs browser split for media/taxonomy | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 292 | ├── use-app-store.ts        # useAppStore: app-level placeholder store | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 322 | │   └── use-course-create-flow.ts  # useCourseCreateFlow: create-course submit, optional slug, 409/3007 recommended-slug confirm | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 387 | ├── taxonomy/ | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 388 | │   └── index.ts            # Taxonomy entities, config types; TaxonomyListFilters (= ApiListQueryParams + search_by/search_value) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 391 | ├── browse-menu.ts          # BrowseMenuItem (recursive children?: BrowseMenuItem[]) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 415 | ├── index.ts                # Barrel: auth, me, media, taxonomy, instructor, course | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 419 | ├── taxonomy/taxonomy.ts    # slug/status/topic/skill/outcome schemas | yes | FS-3 FRAGMENT |
| `docs/folder-structure.md` | 421 | └── course/course.ts        # create (title + optional slug), basic-info (required slug), section, lesson, sub-lesson, collaborator, reject | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 432 | ├── api-route.ts            # API_PUBLIC_ROUTES (auth incl. google/googleOnetap/discord/x) + API_PRIVATE_ROUTES (me, taxonomy, media, instructor, …) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 449 | │   ├── admin-items.ts      # Admin sidebar tree (includes taxonomy group + children) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 454 | │   └── taxonomy-icons.ts   # TAXONOMY_MENU_ICONS — Lucide icons for taxonomy nav nodes | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 457 | ├── taxonomy/ | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 458 | │   └── resources.ts        # TAXONOMY_RESOURCES, TAXONOMY_RESOURCE_KEYS, TAXONOMY_GROUP_READ_PERMISSIONS (data only) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 496 | │   ├── list-query.ts       # apiListQueryToRecord() — BE list filter → query record (taxonomy + media) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 498 | │   ├── api-error.ts        # toastApiError, translateApiErrorCode, extractApiError, extractRecommendedSlug (3007) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 502 | │   ├── course.ts             # createCourseBasicInfoState(version, courseSlug), toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug), toCreate... | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 507 | │   ├── taxonomy/           # Taxonomy utils package (import via `@/lib/utils/taxonomy`) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 508 | │   │   ├── index.ts        # Re-exports resource + form-helpers only (not form-submit — avoids API cycle) | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 509 | │   │   ├── resource.ts     # getTaxonomyResourceConfig, getTaxonomySearchableColumns, getTaxonomyTreeFromEntity, buildTaxonomyDagreRoot, toTaxonom... | no | resource.ts export list: edit only if `toTaxonomyTreeWritePayload` is renamed (C-WRITE-PAYLOAD) |
| `docs/folder-structure.md` | 510 | │   │   ├── form-helpers.ts # CONTENT_LOCALE_OPTIONS, canonicalizeContentLocale, buildTaxonomyFormDefaultValues, compact*Translations, slug preview... | yes | FS-4 FRAGMENT |
| `docs/folder-structure.md` | 511 | │   │   └── form-submit.ts  # buildTaxonomySubmitPayload, persistTaxonomyForm — import as `@/lib/utils/taxonomy/form-submit` only | yes | FS-5 FRAGMENT |
| `docs/folder-structure.md` | 512 | │   ├── slug.ts             # generateSlug() + slugifyName() (taxonomy preview) + sanitizeSlugInput(), SLUG_MAX_LENGTH, SLUG_PATTERN (editable slug... | yes | FS-6 FRAGMENT |
| `docs/folder-structure.md` | 565 | Global API error namespace: `errors.codes` (numeric string keys). Module validation namespaces: `auth.validation`, `me.validation`, `media.validati... | no | directory listing line unaffected (no new file/folder/comment change here) |
| `docs/folder-structure.md` | 641 | │   └── server.mjs                # Loopback HTTP fixture backend (plain node:http, no framework) — auth, /me, course detail/collaborators/candidat... | yes | FS-7 FRAGMENT |
| `docs/folder-structure.md` | 649 | ├── course-slug.spec.ts       # optional slug on create, 409/3007 recommended-slug confirm (Yes/No), basic-info slug edit | yes (anchor) | FS-8 INSERT after this line |
| `docs/pages.md` | 3 | _Last audited: 2026-09-29 — course slug management UI (create-dialog optional slug + 3007 confirm; basic-info editable slug). Prior: 2026-09-19 — r... | yes | PG-1 REPLACE |
| `docs/pages.md` | 41 | \| `/{locale}/admin/taxonomy/{resource}` \| `src/app/[locale]/admin/taxonomy/*/page.tsx` \| `TaxonomyListPage` (`src/screen/common/taxonomy/`) — resou... | no | page/route inventory line unrelated to slug |
| `docs/pages.md` | 42 | \| `/{locale}/sysadmin/taxonomy/{resource}` \| `src/app/[locale]/sysadmin/taxonomy/*/page.tsx` \| Same shared `TaxonomyListPage` (sysadmin menu) \| Imp... | no | page/route inventory line unrelated to slug |
| `docs/pages.md` | 76 | \| Admin pages \| Implemented: dashboard shell, taxonomy, instructors, course review \| | no | page/route inventory line unrelated to slug |
| `docs/pages.md` | 78 | \| Sysadmin pages \| Implemented: dashboard shell, taxonomy, instructors, course review \| | no | page/route inventory line unrelated to slug |
| `docs/pages.md` | 88 | \| Taxonomy list + form dialog \| `taxonomy.form.validation.*`, `RequiredLabel`, `FieldError`; create/edit remounts `TaxonomyFormDialog` via `formDia... | yes | PG-2 REPLACE |
| `docs/pages.md` | 90 | \| Instructor roster / approvals / expertise / tickets / profiles \| `instructor.validation.*`, `RequiredLabel` on email/reject/topic/skill/ticket fi... | no | page/route inventory line unrelated to slug |
| `docs/pages.md` | 91 | \| Instructor courses list \| `course.validation.title` + optional slug (`SlugInput`, `SLUG_PATTERN`, max 255) on the create dialog; a 409/3007 opens... | no | page/route inventory line unrelated to slug |
| `docs/pages.md` | 92 | \| Instructor course editor \| `courseBasicInfoSchema` via `react-hook-form + zodResolver`, editable required slug field (`SlugInput`, disabled witho... | no | page/route inventory line unrelated to slug |
| `docs/pages.md` | 95 | See also [`screens.md`](./screens.md), [`router.md`](./router.md), [`taxonomy-admin.md`](./taxonomy-admin.md), [`instructor-admin.md`](./instructor... | no | page/route inventory line unrelated to slug |
| `docs/media-collection.md` | 5 | Reusable media library popup for browsing, uploading, and selecting files. Wired into taxonomy topic/outcome forms, course editor, instructor appli... | no | incidental word match (level/topic/skill/tag/children/slug as a plain word) in tooling, skill or agent-guidance markdown; no taxonomy slug content |
| `docs/patterns.md` | 72 | When a `DropdownMenuItem` opens a page-level `Dialog` or `AlertDialog` (course review approve/reject, move to trash, outline add/edit, etc.): | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 82 | ### Popover combobox inside Dialog (taxonomy locale) | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 88 | Preferred fix (scoped): `PopoverContent` supports **`portal?: boolean` (default `true`)**. Taxonomy locale picker uses **`portal={false}`** so cont... | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 90 | Manual blast radius before editing `PopoverContent`: grep importers — currently `TaxonomyLocaleTabsSection` + `SearchableSelect`. Default `portal={... | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 94 | Libraries that touch `document` at import time (e.g. `quill`) **must not** use top-level `import Quill from "quill"`. Pattern used in this repo: | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 181 | **Consumer config:** pass `getPageKey(params)` using existing caller key builders (`getInstructorRosterListKey`, `getTaxonomyListKey`, …). Do **not... | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 291 | ### Always check both HTTP error and app-level error code | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 340 | \| Taxonomy \| `schema/taxonomy/taxonomy.ts` \| `taxonomy.form.validation.*` \| | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 349 | \| `taxonomy.form.validation` \| `name`, `nameMax`, `shortDescription`, `shortDescriptionMax`, `descriptionMaxLines`, `descriptionLineMax` \| | yes | PAT-1 REPLACE |
| `docs/patterns.md` | 351 | \| `course.validation` \| `title`, `titleMax`, `slugRequired`, `slugInvalid`, `slugMax`, `shortDescriptionMax`, `sectionTitle`, `lessonTitle`, `subLe... | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 353 | Taxonomy forms resolve Zod keys via `useTranslations("taxonomy.form")` + schema key `validation.*` (same parent-namespace pattern as auth). | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 381 | - BE has **no** taxonomy/course/instructor-specific numeric codes — those modules reuse shared `2xxx`/`3xxx` (and media also `9011`–`9019`, includi... | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 418 | \| Data / content locale \| `useLocale()` → API query `locale` \| Taxonomy list/picker names, instructor chips (BE translation fallback) \| | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 419 | \| Admin taxonomy edit \| `GET …?view=edit` + locale combobox only (presets from `CONTENT_LOCALE_OPTIONS`, no en/vi pill Tabs, no free-enter) \| Canon... | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 421 | Do not conflate next-intl route locale with inventing a second FE locale store for taxonomy reads — pass `useLocale()` through callers/hooks. | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 483 | Always use `@/` aliases — never relative path traversal beyond one level: | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 530 | Media lists add optional `category` and `sort_order` on the same type (`MediaListFilters` = `ApiListQueryParams` + narrowed fields). Taxonomy keeps... | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 570 | ## 15. Slug fields | no | generic pattern or course-slug paragraph already accurate |
| `docs/patterns.md` | 572 | **Taxonomy** slugs are **read-only** in the UI. Show a live preview with `generateSlug(name)` / `slugifyName(name)` while the user types the name. ... | yes | PAT-2 REPLACE |
| `docs/patterns.md` | 574 | **Course** slugs are **editable** and independent of the course title (no title-derived slug or preview in the FE). Reuse the shared `SlugInput` (`... | no | course paragraph accurate; PAT-2 points to it ('see below') |
| `docs/patterns.md` | 576 | - Create dialog: the slug is **optional**; a blank slug is omitted from `POST /courses` (`toCreateCoursePayload(title, slug)` from `@/lib/utils/cou... | yes | PAT-3 FRAGMENT |
| `docs/patterns.md` | 577 | - Basic-info tab: the slug is **required**, defaults to `course.slug`, and is disabled while there is no draft. `toUpdateCourseBasicInfoPayload(bas... | no | course basic-info bullet accurate |
| `docs/quality.md` | 140 | - file-level exceptions only for `src/messages/en.ts` and `src/messages/vi.ts` | no | refactor history / gate tooling line |
| `docs/quality.md` | 157 | **2026-06-07 refactor (screens):** admin/sysadmin taxonomy and instructor app routes now import shared screens directly from `src/screen/common/**`... | no | refactor history / gate tooling line |
| `docs/quality.md` | 159 | **2026-05-29 refactor (constants):** `isImageFilename` / extension helpers → `src/lib/utils/media.ts`; taxonomy config types → `src/types/taxonomy/... | no | refactor history / gate tooling line |
| `docs/quality.md` | 175 | **2026-05-29 refactor (types):** `ApiErrorCode` → `src/constants/api-error-code.ts`; `isApiSuccess` → `src/lib/utils/api.ts`; `MEDIA_COLLECTION_ALL... | no | refactor history / gate tooling line |
| `docs/quality.md` | 185 | \| Named page screen \| `*-page.tsx` \| `src/screen/common/taxonomy/taxonomy-list-page.tsx` \| | no | refactor history / gate tooling line |
| `docs/quality.md` | 196 | **2026-06-08 refactor (validation + API errors):** `ApiErrorCode` stays in `src/constants/api-error-code.ts` (data-only); resolvers in `src/lib/uti... | no | refactor history / gate tooling line |
| `docs/quality.md` | 235 | \| `DashboardSidebarLevel` ↔ `DashboardSidebarSubLevel` \| Single `DashboardSidebarTree` with `level: "root" \\| "sub"` in `dashboard-sidebar.tsx` \| | no | refactor history / gate tooling line |
| `docs/router.md` | 78 | /[locale]/              → src/app/[locale]/layout.tsx     NextIntlClientProvider + AppProviders, renders `children` + `modal` (parallel slot) | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 80 | /[locale]/@modal        → src/app/[locale]/@modal/(.)login/page.tsx     intercepts same-level `/login` → <LoginSignupPopup type="login" /> | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 81 | /[locale]/@modal        → src/app/[locale]/@modal/(.)signup/page.tsx    intercepts same-level `/signup` → <LoginSignupPopup type="signup" /> | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 97 | /[locale]/admin/taxonomy/{levels,topics,outcomes,skills,tags}  → shared TaxonomyListPage | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 98 | /[locale]/sysadmin/taxonomy/{levels,topics,outcomes,skills,tags}  → shared TaxonomyListPage | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 113 | `src/app/[locale]/layout.tsx` accepts and renders a `modal` prop (a [parallel route](https://nextjs.org/docs/app/building-your-application/routing/... | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 116 | export default async function LocaleLayout({ children, modal, params }: LocaleLayoutProps) { | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 121 | {children} | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 132 | - `(.)login/page.tsx` — a same-level [intercepting route](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes) that m... | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 206 | \| `/vi/instructor/courses/{courseId}/info` \| `[locale]/instructor/courses/[courseId]/info/page.tsx` \| `InstructorCourseEditorPage` (`tab="info"`) —... | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 228 | \| `/vi/admin/taxonomy/levels` (and topics, outcomes, skills, tags) \| `admin/taxonomy/*/page.tsx` \| Shared `TaxonomyListPage` \| ✅ Implemented \| | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 229 | \| `/vi/sysadmin/taxonomy/*` \| `sysadmin/taxonomy/*/page.tsx` \| Shared `TaxonomyListPage` \| ✅ Implemented \| | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 231 | \| `/vi/admin/users`, … \| — \| — \| 🚧 Remaining placeholder nav links outside the implemented taxonomy, instructor, and course review surfaces \| | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 383 | src/app/[locale]/admin/taxonomy/levels/page.tsx   → route: /vi/admin/taxonomy/levels | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/router.md` | 384 | src/screen/common/taxonomy/taxonomy-list-page.tsx → TaxonomyListPage (shared CRUD UI imported directly by the route; `formDialogKey` remounts `Taxo... | no | route table/tree line; no route added or changed, `TaxonomyListPage` unchanged |
| `docs/instructor-admin.md` | 16 | \| Expertise (topics + skills) \| `/admin/instructors/expertise` \| `/sysadmin/instructors/expertise` \| — \| | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 46 | - Children: roster, approvals, expertise, tickets — keys `dashboard.instructor.menu.*` (**no Profiles / Hồ sơ** menu item) | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 78 | - Hooks (SWR): `src/api/hooks/instructor/` — roster, applications, profiles, expertise topics/skills, tickets, messages | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 88 | **My Courses** (`InstructorCoursesPage`): create dialog sends `{ title, slug? }` via `toCreateCoursePayload(title, slug)` (driven by `useCourseCrea... | yes | INS-2 FRAGMENT |
| `docs/instructor-admin.md` | 90 | **Course editor basic info** (`/instructor/courses/:id/info`): title and slug are independent editable fields; the BE no longer recomputes `courses... | no | course basic-info paragraph accurate |
| `docs/instructor-admin.md` | 94 | **Load performance:** `useCourseDetail(courseId)` — một SWR cache key per course (full detail kèm outline); chuyển tab info/outline/collaborators *... | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 100 | **Submit for review** (`handleSubmitReview`): **only rendered for `OWNER`** (`canManageReviewWorkflow` in `editor-page.tsx`). Clicking **Submit for... | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 114 | - **Schemas**: `src/schema/instructor/instructor.ts` — email, rejection reason, expertise topic/skill, ticket subject/message. | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 116 | - **Required fields UI**: `RequiredLabel` on rejection reason (`InstructorApprovalsRowActions`), expertise topic/skill pickers (`InstructorExpertis... | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 127 | \| `InstructorProfileViewDialog` \| Read-only profile popup on **approvals** (application) and **roster** (approved managed profile). Title uses appl... | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 136 | - **Instructor / topic / skill pickers:** shared `SearchableSelect` + `useSearchablePaginatedOptions`. Data layer: `useApiInfiniteListQuery` with `... | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 138 | - **Topics / skills add pickers:** `GET /taxonomy/topics` or `/skills` with `status=ACTIVE`, `search_by=name`, `search_value`, `include_images=fals... | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 139 | - **Assigned expertise rows / chips:** `GET /instructors/:id/expertise/topics\|skills` **must** send the same **`locale`** and include it in SWR key... | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 140 | - **Application detail chips:** `GET /instructor-applications/:id` (approvals view dialog) **must** pass **`locale`** and include it in the detail ... | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 141 | - Already-assigned topic/skill IDs excluded client-side from add-picker options. | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 164 | - Sidebar labels: `dashboard.instructor.menu.*` (same keys as taxonomy uses `dashboard.taxonomy.menu.*`). | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 173 | \| ADM-02 \| `PreviewPdf` + `InstructorProfileViewDialog` — read-only popup on **approvals** (application) and **roster** (`portfolioId` deep link). ... | no | instructor/course-editor statement; course slug text already accurate |
| `docs/instructor-admin.md` | 176 | **Approve → expertise:** On successful approve, BE copies application junction `topic_ids` / `skill_ids` into `instructor_expertise_*` for the appl... | no | instructor/course-editor statement; course slug text already accurate |
| `docs/taxonomy-admin.md` | 1 | # Taxonomy admin (FE) | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 5 | Admin and sysadmin dashboards can manage five taxonomy resources aligned with BE `/api/v1/taxonomy/*`: | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 9 | \| Course levels \| `/admin/taxonomy/levels` \| `/sysadmin/taxonomy/levels` \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 10 | \| Topics \| `/admin/taxonomy/topics` \| `/sysadmin/taxonomy/topics` \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 11 | \| Outcomes \| `/admin/taxonomy/outcomes` \| `/sysadmin/taxonomy/outcomes` \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 12 | \| Skills \| `/admin/taxonomy/skills` \| `/sysadmin/taxonomy/skills` \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 13 | \| Tags \| `/admin/taxonomy/tags` \| `/sysadmin/taxonomy/tags` \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 20 | \| Translation tab languages \| Preset list in `CONTENT_LOCALE_OPTIONS` (`src/lib/utils/taxonomy/form-helpers.ts`): UI chrome `en`/`vi` plus common B... | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 22 | \| Edit payload \| `getTaxonomyDetailService(resource, id, { view: "edit" })` \| Treat list-row `initialData` as full translations SoT \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 23 | \| List labels \| `listTaxonomyService` / `useTaxonomyList` with `locale` \| Assume mono-locale canonical `name` only \| | yes (anchor) | TAX-2 INSERT after this line |
| `docs/taxonomy-admin.md` | 29 | Taxonomy follows a slimmer **app route → shared screen** pattern: | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 33 | \| App route \| `src/app/[locale]/admin/taxonomy/{resource}/page.tsx` \| Imports shared `TaxonomyListPage` directly \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 34 | \| App route \| `src/app/[locale]/sysadmin/taxonomy/{resource}/page.tsx` \| Same shared screen for sysadmin \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 35 | \| Shared screen \| `src/screen/common/taxonomy/taxonomy-list-page.tsx` \| `TaxonomyListPage` — client CRUD list (DataTable, form dialog, delete confi... | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 37 | Resource keys match `TAXONOMY_RESOURCE_KEYS` in `src/constants/taxonomy/resources.ts` (`levels`, `topics`, `outcomes`, `skills`, `tags`). | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 41 | Taxonomy appears under **admin** and **sysadmin** dashboard sidebars (`ADMIN_DASHBOARD_ITEMS` / `SYSADMIN_DASHBOARD_ITEMS` in `src/constants/dashbo... | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 45 | \| `group` \| `Network` \| Taxonomy parent (collapsible group) \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 46 | \| `levels` \| `Layers` \| Course levels \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 47 | \| `topics` \| `BookMarked` \| Topics \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 49 | \| `skills` \| `Brain` \| Skills \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 50 | \| `tags` \| `Tags` \| Tags \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 52 | Labels use i18n keys `taxonomy.menu.*` (`titleKey` on `DashboardItem`). Items are deep-filtered by `filterPermissionNavTree` (see `docs/logic-flow.... | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 54 | To change icons, edit `taxonomy-icons.ts` only — do not duplicate imports in `admin-items.ts` / `sysadmin-items.ts`. | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 58 | Sidebar items and actions use RBAC keys from `src/constants/permissions.ts` (e.g. `course_level:read`, `topic:create`). Group visibility uses `TAXO... | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 62 | - **UI chrome:** `taxonomy.*` keys in `src/messages/vi.ts` and `en.ts` only — **no** `messages/ja.ts`. | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 69 | \| Topics table column `child_render` \| Chủ đề con \| Sub-topics \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 70 | \| Skills table column `child_render` \| Kỹ năng con \| Sub-skills \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 73 | \| Topics tree editor \| Thêm chủ đề con, Tên chủ đề con, … \| Add sub-topic, … \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 74 | \| Skills tree editor \| Thêm kỹ năng con, … \| Add sub-skill, … \| | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 78 | Topics and skills list rows with nested `child_topics` / `children` show a **View tree** button in the `child_render` column. It opens shared `Dagr... | no | dagre popup shows resolved name only (no slug) - still true |
| `docs/taxonomy-admin.md` | 80 | Edit/reorder still uses `SortableTreeEditor` in the form dialog — separate from the read-only dagre popup. On edit, tree nodes carry optional per-n... | yes | TAX-4 REPLACE |
| `docs/taxonomy-admin.md` | 84 | - **Topics / skills:** nested tree order in the form dialog (`child_topics` / `children`). | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 86 | - **Levels / tags:** table column sort only (no reorder API). | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 90 | Topics and outcomes support optional `image_file_id` (media file UUID). The form dialog opens **Browse media** (`MediaCollectionDialog` with `visib... | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 92 | ## Slug (read-only preview; server authority — taxonomy only) | yes | TAX-5 REPLACE |
| `docs/taxonomy-admin.md` | 94 | - UI preview uses `slugifyName()` / `generateSlug()` in `src/lib/utils/slug.ts` (trim, lowercase, remove Vietnamese accents, `đ/Đ -> d`, spaces/und... | yes | TAX-5 REPLACE |
| `docs/taxonomy-admin.md` | 95 | - On edit, slug preview falls back to API `slug` until the watched canonical `name` field is non-empty (avoids empty preview when `useWatch` lags b... | yes | TAX-5 REPLACE |
| `docs/taxonomy-admin.md` | 96 | - Slug field is **read-only** on create and edit; users only type the name. | yes | TAX-5 REPLACE |
| `docs/taxonomy-admin.md` | 97 | - Scope: this read-only, name-derived behavior applies to **taxonomy only**. Course slugs are editable and independent of the title (shared `SlugIn... | yes | TAX-5 REPLACE |
| `docs/taxonomy-admin.md` | 98 | - **Create/update API payloads omit `slug`** — BE derives it from **canonical `name`** (and from each tree node canonical `name`) via `utils.Slugif... | yes | TAX-5 REPLACE |
| `docs/taxonomy-admin.md` | 99 | - Tree nodes: canonical name is editable, slug preview is read-only; write payload omits `slug` on `TaxonomyTreeNode` (use `toTaxonomyTreeWritePayl... | yes | TAX-5 REPLACE |
| `docs/taxonomy-admin.md` | 103 | `TaxonomyListFilters` extends shared `ApiListQueryParams` with typed-search fields and locale: | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 105 | - `search_by`: `name \| slug \| short_description` | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 109 | Query strings are built from shared `apiListQueryToRecord()` plus taxonomy-specific `search_by`/`search_value`/`locale`/`include_images` keys in `s... | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 113 | Taxonomy list screens use the built-in `DataTable` toolbar: | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 124 | - `TaxonomyListPage` keeps `formDialogKey` state; `openCreate` / `openEdit` increment it and render `<TaxonomyFormDialog key={formDialogKey} … />`. | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 126 | - **Edit always loads detail:** `getTaxonomyDetailService(resource, id, { view: "edit" })` — list row is insufficient for full `translations` / tre... | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 127 | - `TaxonomyFormDialog` builds `defaultValues` from that editable detail (`buildTaxonomyFormDefaultValues`, tree/description/image helpers). No `use... | no | defaultValues sentence stays accurate (persisted slug default is described once in TAX-5) |
| `docs/taxonomy-admin.md` | 131 | - **No en/vi pill Tabs** in `TaxonomyLocaleTabsSection` — language switch + add is a **single searchable dropdown** over `CONTENT_LOCALE_OPTIONS`. | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 136 | - **Inside `TaxonomyFormDialog`:** do **not** portal the language `Popover` to `document.body` (`PopoverContent portal={false}`). Radix Dialog sets... | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/taxonomy-admin.md` | 138 | - Locale/form helpers live in `src/lib/utils/taxonomy/form-helpers.ts`; submit payload builders + persist wrappers live in `src/lib/utils/taxonomy/... | no | form-helpers/form-submit location sentence stays accurate (new slug code reuses these modules) |
| `docs/taxonomy-admin.md` | 149 | - **Schemas**: `src/schema/taxonomy/taxonomy.ts` — `taxonomySlugStatusSchema`, `taxonomyTopicSchema`, `taxonomySkillSchema`, `taxonomyOutcomeSchema... | yes | TAX-8 FRAGMENT |
| `docs/taxonomy-admin.md` | 150 | - **Form UI**: `TaxonomyFormDialog` uses `RequiredLabel` + `FieldError` on `name` / `short_description`; Zod enforces `name` 1–255 and outcome fiel... | yes | TAX-9 FRAGMENT |
| `docs/taxonomy-admin.md` | 152 | - **API failures**: list delete and form create/update catch → `toastApiError(useTranslations("errors.codes"), error)` — never `taxonomy.common.err... | yes | TAX-10 REPLACE |
| `docs/taxonomy-admin.md` | 154 | **List query (BE):** `page`, `per_page`, `sort_by`, `sort_desc`, `status`, `search_by`, `search_value`, **`locale`**, optional `include_images` (de... | no | taxonomy statement unrelated to slug/payload/tree-slug (routes, sidebar, locale picker, filters, image, permissions, list query) |
| `docs/screens.md` | 3 | _Last audited: 2026-09-29 (course slug UI: create dialog optional slug + 3007 confirm; info tab editable slug). Prior: 2026-09-19 (route-based logi... | yes | SCR-1 REPLACE |
| `docs/screens.md` | 36 | \| `/{locale}/instructor/courses` \| Active \| `InstructorCoursesPage` — editable course list, create dialog (title + optional editable slug via `Slug... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 37 | \| `/{locale}/instructor/courses/{courseId}/info` \| Active \| `InstructorCourseEditorPage` — route-backed basic info tab (incl. editable required slu... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 56 | \| `/{locale}/admin/taxonomy/{resource}` \| Active \| Shared `TaxonomyListPage` (resource = levels \\| topics \\| outcomes \\| skills \\| tags); list uses... | yes | SCR-2 REPLACE |
| `docs/screens.md` | 57 | \| `/{locale}/sysadmin/taxonomy/{resource}` \| Active \| Same shared `TaxonomyListPage` (sysadmin menu + permissions) \| | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 96 | │   <AppProviders>                      → `SWRConfig` (`provider: meCacheProvider` — persists only the `/me` cache entry to `sessionStorage`) + `Me... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 108 | - **Web shell:** Site chrome (`BecomeInstructorPromoBanner` when learner + not dismissed, then `Header`), Google One Tap host (`GoogleOneTapHost` —... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 116 | - **`src/screen/common/`** — shared screens used by multiple roles (e.g. marketing `HomePage`, `NotFoundPage`, `TaxonomyListPage`, instructor manag... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 122 | - **`src/components/features/course/`** — non-page course editor tabs and dialogs (`course-editor-basic-tab.tsx`, `course-editor-outline-tab.tsx`, ... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 158 | - `src/app/[locale]/not-found.tsx` — locale-level 404 (inherits providers from `[locale]/layout.tsx`) | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 178 | A shared full-page state for a *classified API failure*, distinct from `NotFoundPage` above (which is the route-level 404 for a URL that doesn't ma... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 187 | \| `network` \| Transport-level failure, no response received (`ApiNetworkError` or `ApiTimeoutError`) \| `WifiOffIcon` \| | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 197 | **Also used by:** `src/app/[locale]/error.tsx` (segment-level render-error boundary — see [`docs/router.md`](router.md#error-boundaries-errortsx--g... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 290 | `LoginSignupPopup` is no longer mounted inside `DashboardLayout` (authorized or denied). On the `unauthorized` denial state (no session at all — as... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 296 | - Pages that previously rendered top-level dashboard `<h1>` blocks now render only their feature content; pages with top-row CTAs pass those contro... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 317 | **`LoginSignupPopup`** — no longer mounted as a sibling in `header.tsx` (or inside `DashboardLayout`). It is rendered by the **`@modal` parallel ro... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 413 | \| `Badge` \| — \| Tags, status indicators \| | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 427 | \| `RequiredLabel` \| `required-label.tsx` \| Label with red asterisk for required fields — Taxonomy, Instructor approvals, Course create dialog. \| | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 430 | \| `SlugInput` \| `slug-input.tsx` \| Editable slug input filtered by `sanitizeSlugInput` — course create dialog, course basic-info tab. \| | yes | SCR-3 REPLACE |
| `docs/screens.md` | 450 | \| `"taxonomy.form.validation"` / `"media.validation"` / `"instructor.validation"` / `"course.validation"` \| Pre-submit / Zod validation only (never... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 530 | Feature screens (taxonomy, media, instructor, course) catch API errors with `toastApiError(useTranslations("errors.codes"), error)` — see [`logic-f... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/screens.md` | 536 | Symbol and edge counts change as the codebase grows. Refresh the local graph with `npx gitnexus analyze --force` (from this repo root), then `npx g... | no | route/layout/shell statement unrelated to taxonomy slug |
| `docs/modules.md` | 3 | _Last audited: 2026-09-29 (Course slug management UI: editable slug on create + basic-info, 3007 recommended-slug confirm). Prior: 2026-07-08 (Auth... | yes | MOD-1 REPLACE |
| `docs/modules.md` | 15 | - `Taxonomy`: `src/types/taxonomy`, `src/constants/taxonomy`, `src/api/callers/taxonomy`, `src/components/features/taxonomy`, `src/screen/common/ta... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 30 | - `Taxonomy` provides admin CRUD for levels/topics/outcomes/skills/tags; list filters reuse `ApiListQueryParams` and extend with taxonomy typed-sea... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 31 | - `Media` provides the reusable media library dialog (browse/upload/select); taxonomy cover images use it. List filters extend `ApiListQueryParams`... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 34 | ## Taxonomy module | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 36 | - **Types**: `src/types/taxonomy/` — entities, `TaxonomyResourceConfig`, `TaxonomyListColumn`; `TaxonomyListFilters` extends `ApiListQueryParams` w... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 37 | - **Constants**: `src/constants/taxonomy/resources.ts` — `TAXONOMY_RESOURCES`, `TAXONOMY_RESOURCE_KEYS`, `TAXONOMY_GROUP_READ_PERMISSIONS` (data on... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 38 | - **Utils**: `src/lib/utils/taxonomy/` — `resource.ts` (`getTaxonomyResourceConfig()`, `getTaxonomySearchableColumns()`, `getTaxonomyTreeFromEntity... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 39 | - **Nav**: `src/constants/dashboard/taxonomy-icons.ts` (`TAXONOMY_MENU_ICONS`) + taxonomy nodes in `admin-items.ts` / `sysadmin-items.ts`; filtered... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 40 | - **API**: `src/api/callers/taxonomy/taxonomy-factory.ts (+ taxonomy-browser.ts)`, `src/api/hooks/taxonomy/useTaxonomy.ts`, shared SWR normalizers ... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 41 | - **UI**: `src/screen/common/taxonomy/taxonomy-list-page.tsx` (`TaxonomyListPage`), app routes under `src/app/[locale]/{admin,sysadmin}/taxonomy/*/... | yes | MOD-2 FRAGMENT |
| `docs/modules.md` | 42 | - **Docs**: `docs/taxonomy-admin.md` (routes, permissions, sidebar icons, slug, DnD). | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 51 | - **UI**: `src/components/features/media/*`; embedded from `taxonomy-form-dialog.tsx`. | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 64 | - **Types**: `src/types/course.ts` — version status, `CourseDetail.last_rejection_reason`, outline nodes (`estimated_duration_ms` on section/lesson... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 68 | - `src/screen/instructor/courses/editor-page.tsx` — editor shell, status header (edit `version_no` badge + optional `publishedVersionBadge` when bo... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 78 | - `src/lib/utils/course.ts` — course editor tab registry, form state factories (`createCourseBasicInfoState(version, courseSlug)` seeds the form `s... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 79 | - `src/components/features/course/course-editor-basic-tab.tsx`, `course-editor-outline-tab.tsx`, `course-editor-outline-row-actions.tsx`, `course-e... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 84 | - `src/hooks/course/use-course-editor-state.ts` — shared client editor state, lease lifecycle, pre-submit Zod checks (`course.validation.*`), API e... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 85 | - `src/hooks/course/use-course-create-flow.ts` — `useCourseCreateFlow`: create-course submit with optional slug (`toCreateCoursePayload`, blank slu... | yes | MOD-4 FRAGMENT |
| `docs/modules.md` | 87 | - **Validation**: `src/schema/course/course.ts` — `courseBasicInfoSchema` mirrors BE basic-info rules (title ≥5 non-whitespace, editable on save; r... | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 91 | - `useTaxonomyList` for metadata pickers (info tab: `per_page: 100`, `include_images: false`) | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 98 | - **Constants**: `PERMISSIONS` (67 names), `PERMISSION_IDS` (P1–P67), `ROLES` in `src/constants/` — mirror BE `AllPermissions` and role tags. | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `docs/modules.md` | 135 | - All feature `catch` blocks after API calls → `toastApiError(useTranslations("errors.codes"), error)` (Auth, Media, Taxonomy, Instructor, Course). | no | course/instructor/media module line or taxonomy line that does not mention slug behaviour |
| `openspec/changes/disable-dev-deploy-job/proposal.md` | 12 | - Execute the complete implementation lifecycle required by `AGENTS.md`: validate and reuse the conversation Session ID, create or reuse the exact ... | no | other unrelated change folder (CI / role contract); historical |
| `openspec/changes/disable-dev-deploy-job/tasks.md` | 4 | - [x] 1.2 Read the complete frontend `.context` folder, `AGENTS.md`, all project documentation, every project skill under `.ai/skills`, the OpenSpe... | no | other unrelated change folder (CI / role contract); historical |
| `openspec/changes/disable-dev-deploy-job/tasks.md` | 9 | - [x] 2.1 Prefix every non-empty line of `.github/workflows/deploy-dev.yml` from the top-level `deploy:` key through the end of the job with `# `, ... | no | other unrelated change folder (CI / role contract); historical |
| `docs/testing.md` | 3 | _Last updated: 2026-09-29 — course slug management UI tests added under `openspec/changes/add-course-slug-management-ui` (new behavior matrix and P... | yes | TST-1 REPLACE |
| `docs/testing.md` | 28 | - **Fixture backend:** `e2e/fixtures/server.mjs` — a plain `node:http` server (no framework), loopback-bound, serving the subset of the real BE con... | yes | TST-2 FRAGMENT |
| `docs/testing.md` | 38 | - `course-slug.spec.ts` — seven cases for `openspec/changes/add-course-slug-management-ui`: creating a course with a blank slug (omitted from the r... | yes (anchor) | TST-3 INSERT after this line |
| `docs/testing.md` | 64 | **Jest-level boundary, resolved by Stage 3 (not a gap):** `LoginContent` submits through a Next.js Server Action (`loginAction`, which calls `next/... | no | harness/matrix row for another module or the already-documented course slug tests |
| `docs/testing.md` | 71 | \| `src/schema/taxonomy/taxonomy.ts` (`taxonomySlugStatusSchema`, `taxonomyTopicSchema`, `taxonomySkillSchema`, `taxonomyOutcomeSchema`) \| `src/sche... | yes | TST-4 REPLACE |
| `docs/testing.md` | 74 | \| Browser journeys (see Harness — Playwright above) \| `e2e/tests/*.spec.ts` \| auth (login/logout/expired-session/forbidden), collaborator submissio... | yes | TST-5 REPLACE |
| `docs/testing.md` | 76 | ## Behavior matrix — course slug management UI | no | harness/matrix row for another module or the already-documented course slug tests |
| `docs/testing.md` | 80 | \| `src/lib/utils/slug.ts` (`sanitizeSlugInput`, `SLUG_PATTERN`, `SLUG_MAX_LENGTH`; `generateSlug` unchanged) \| `src/lib/utils/slug.test.ts` \| valid... | no | harness/matrix row for another module or the already-documented course slug tests |
| `docs/testing.md` | 81 | \| `src/schema/course/course.ts` (`courseCreateSchema`, `courseBasicInfoSchema` slug fields) \| `src/schema/course/course.test.ts` \| blank/valid opti... | no | harness/matrix row for another module or the already-documented course slug tests |
| `docs/testing.md` | 82 | \| `src/lib/utils/course.ts` (`createCourseBasicInfoState`, `toUpdateCourseBasicInfoPayload`, `toCreateCoursePayload`, `validateCourseSubmitReadines... | no | harness/matrix row for another module or the already-documented course slug tests |
| `docs/testing.md` | 83 | \| `src/lib/utils/api-error.ts` (`classifyApiError`, `extractApiError`, `extractRecommendedSlug`) \| `src/lib/utils/api-error.test.ts` \| existing cla... | no | harness/matrix row for another module or the already-documented course slug tests |
| `docs/testing.md` | 84 | \| `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`) \| `src/hooks/course/use-course-create-flow.test.tsx` \| blank slug omitted an... | yes | TST-7 FRAGMENT |
| `docs/testing.md` | 85 | \| `src/components/shared/slug-input.tsx` (`SlugInput`) \| `src/components/shared/slug-input.test.tsx` \| typed values pass through the slug filter, p... | no | harness/matrix row for another module or the already-documented course slug tests |
| `docs/testing.md` | 86 | \| `src/components/shared/confirm-action-dialog.tsx` (`ConfirmActionDialog`, default and `stacked`) \| `src/components/shared/confirm-action-dialog.t... | yes (anchor) | TST-6 INSERT after this line |
| `docs/testing.md` | 92 | - Everything outside the proposal's behavior matrix (`src/api/auth`, `src/api/transport`, `src/app/api/auth/refresh`, `src/lib/utils/permission.ts`... | no | harness/matrix row for another module or the already-documented course slug tests |
| `openspec/changes/sync-me-roles-contract/tasks.md` | 9 | - [x] 2.1 Refresh the frontend GitNexus index if stale, run upstream impact analysis for `MeResponse` before editing it, report the direct callers,... | no | other unrelated change folder (CI / role contract); historical |
| `docs/reusable-assets.md` | 3 | _Last audited: 2026-09-29 (course slug management UI: `SlugInput`, `sanitizeSlugInput`, `extractRecommendedSlug`, `useCourseCreateFlow`, `ApiErrorC... | yes | RA-1 REPLACE |
| `docs/reusable-assets.md` | 17 | - **Scope**: Any component-level loading state that needs a compact spinner; currently reused by login and signup submit buttons during `isSubmitti... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 66 | - **Purpose**: Standard JSON envelope for every BE API response — mirrors `be/pkg/response/response.go`. `code === 0` means success; any other valu... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 74 | - **Purpose**: Return shape for low-level HTTP helpers (`apiFetch`, `apiPost`, etc.) — wraps `data`, `statusCode`, `headers`, `cookies`. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 98 | - **Purpose**: Shared BE list query params (`page`, `per_page`, `search`, `status`, `sort_by`, `sort_desc`) used directly or extended by domain mod... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 154 | - **Reuse Rule**: Always import from here. Never hardcode `code === 0`, `code === 3002` or `code === 3007` inline (use `ApiErrorCode.SlugAlreadyExi... | yes | RA-2 FRAGMENT |
| `docs/reusable-assets.md` | 170 | - **Current Entries**: grouped constants for `user`, `taxonomy`, `media`, `instructor`, `course`. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 187 | - **Purpose**: FE private route map (login-required) grouped by module: top-level `home` (`/home`), plus `admin`, `instructor`, `sysadmin`, and acc... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 256 | - **Purpose**: DB `permissions.permission_id` keyed like BE `perm_id` tags. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 264 | - **Purpose**: Known role name literals (`sysadmin`, `admin`, `instructor`, `learner`) — mirror BE `role:"..."` tags. `/me` now returns display-onl... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 280 | - **Purpose**: Dropdown menu config shape; extends `PermissionRequirement` for optional guards on items. `UserMenuItem` supports optional `titleKey... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 288 | - **Purpose**: Client-safe permission checks; `PERMISSION_NAME_TO_ID` is the bidirectional name ↔ id map for admin UI. `hasAllPermissions` / defaul... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 304 | - **Purpose**: Thin wrapper around `filterPermissionNavTree` for `DashboardItem[]` (deep bottom-up filter at every nesting level). | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 348 | ### Asset: `TAXONOMY_MENU_ICONS` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 349 | - **Name**: `TAXONOMY_MENU_ICONS` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 350 | - **Type**: Constant (`Record<"group" \\| "levels" \\| "topics" \\| "outcomes" \\| "skills" \\| "tags", LucideIcon>`) | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 351 | - **Path**: `src/constants/dashboard/taxonomy-icons.ts` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 352 | - **Purpose**: Shared Lucide icons for the taxonomy sidebar group and five child resources (`Network`, `Layers`, `BookMarked`, `Target`, `Brain`, `... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 353 | - **Scope**: Admin/sysadmin dashboard taxonomy nav only. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 359 | - **Path**: `src/constants/dashboard/` (`admin-items.ts`, `sysadmin-items.ts`, `instructor-items.ts`, `taxonomy-icons.ts`, `instructor-icons.ts`; b... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 360 | - **Purpose**: Nav trees per role with nested children, Lucide `icon`, optional `titleKey`, and permission gates aligned to BE `permissions.go`. Ta... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 362 | - **Dependencies**: `PERMISSIONS`, `TAXONOMY_MENU_ICONS`, `TAXONOMY_GROUP_READ_PERMISSIONS`, `DashboardItem`. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 368 | - **Purpose**: Role dashboard chrome: `DashboardLayout` owns the shell; `RoleDashboardLayout` centralizes admin/sysadmin role config (items + shell... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 400 | - **Purpose**: Render `children` only when `useSatisfiesPermissions` passes; optional `fallback` (default `null`). | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 416 | - **Purpose**: Locale options for the locale switcher — `{ locale, label }` for `en` / `vi` only (UI chrome). Taxonomy **content** locale presets l... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 417 | - **Scope**: `src/components/common/header/locale-switcher.tsx`. Taxonomy form locale combobox uses `CONTENT_LOCALE_OPTIONS`, not this list alone. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 472 | - **Purpose**: Convert shared list filters to query key/values for `buildQueryParams`. Use instead of per-module full `filtersToQuery` helpers. Sup... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 473 | - **Scope**: Taxonomy and media list callers; future paginated list callers. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 485 | ### Asset: Taxonomy config types | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 486 | - **Name**: `TaxonomyListColumnId`, `TaxonomyListColumn`, `TaxonomyResourceConfig` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 488 | - **Path**: `src/types/taxonomy/index.ts` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 489 | - **Purpose**: Column and per-resource admin config shapes for taxonomy list screens and API callers. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 490 | - **Scope**: `taxonomy-table-columns`, `TAXONOMY_RESOURCES` constant object (typed via `import type`). | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 491 | - **Dependencies**: `TaxonomyResourceKey`. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 493 | ### Asset: Taxonomy config helpers | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 494 | - **Name**: `getTaxonomyResourceConfig`, `getTaxonomySearchableColumns`, `getTaxonomyTreeFromEntity`, `buildTaxonomyDagreRoot`, `toTaxonomyTreeWrit... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 496 | - **Path**: `src/lib/utils/taxonomy/resource.ts` (re-exported from `src/lib/utils/taxonomy/index.ts`) | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 497 | - **Purpose**: Resolve `TAXONOMY_RESOURCES` entry, searchable column ids, extract nested tree from entity, build dagre root for read-only popup, st... | yes | RA-3 FRAGMENT |
| `docs/reusable-assets.md` | 498 | - **Scope**: Taxonomy list page, form dialog, table columns, tree view button. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 499 | - **Dependencies**: `TAXONOMY_RESOURCES` (`src/constants/taxonomy/resources.ts`), `TaxonomyTreeNode`, `DagreTreeRoot` (`dagre-tree.ts`). | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 501 | ### Asset: Taxonomy form helpers | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 502 | - **Name**: `CONTENT_LOCALE_OPTIONS`, `resolveAllowedContentLocale`, `canonicalizeContentLocale`, `buildTaxonomyFormDefaultValues`, `compactNameTra... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 504 | - **Path**: `src/lib/utils/taxonomy/form-helpers.ts` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 505 | - **Purpose**: Multi-locale content presets for taxonomy translation tabs; BCP47 canonicalize; **whitelist** add via `resolveAllowedContentLocale` ... | yes | RA-4 FRAGMENT |
| `docs/reusable-assets.md` | 506 | - **Scope**: Taxonomy form dialog + locale tabs section; do **not** keep these next to React components. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 507 | - **Dependencies**: `LANGUAGE_OPTIONS` (for `en`/`vi` labels), `slugifyName`, taxonomy types. | yes | RA-5 FRAGMENT |
| `docs/reusable-assets.md` | 509 | ### Asset: `TAXONOMY_RESOURCE_KEYS` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 510 | - **Name**: `TAXONOMY_RESOURCE_KEYS` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 512 | - **Path**: `src/constants/taxonomy/resources.ts` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 513 | - **Purpose**: Canonical ordered list of taxonomy resource keys (`levels`, `topics`, `outcomes`, `skills`, `tags`) typed as `readonly TaxonomyResou... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 514 | - **Scope**: Route/screen generation, iteration over resources; keep in sync with `TAXONOMY_RESOURCES` keys. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 515 | - **Dependencies**: `TaxonomyResourceKey` type. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 522 | - **Scope**: taxonomy, instructor, course, media hooks; `useSearchablePaginatedOptions`. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 525 | ### Asset: `TaxonomyListPage` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 526 | - **Name**: `TaxonomyListPage`, `TaxonomyListPageProps` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 528 | - **Path**: `src/screen/common/taxonomy/taxonomy-list-page.tsx` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 529 | - **Purpose**: Shared admin CRUD list for all five taxonomy resources (DataTable toolbar with `locale` from `useLocale()`, form dialog with `formDi... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 530 | - **Scope**: Imported directly by app routes under `src/app/[locale]/{admin,sysadmin}/taxonomy/*/page.tsx`. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 531 | - **Dependencies**: `useTaxonomyList`, `getTaxonomyDetailService`, `TaxonomyFormDialog`, `DataTable`, `getTaxonomyResourceConfig`, `getTaxonomySear... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 533 | ### Asset: `TaxonomyFormDialog` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 534 | - **Name**: `TaxonomyFormDialog`, `TaxonomyFormDialogProps` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 536 | - **Path**: `src/components/features/taxonomy/taxonomy-form-dialog.tsx` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 537 | - **Purpose**: Create/update taxonomy rows per `resourceKey`; locale UI is a multi-preset combobox only (`CONTENT_LOCALE_OPTIONS`, **no en/vi Tabs*... | yes | RA-6 FRAGMENT |
| `docs/reusable-assets.md` | 538 | - **Scope**: Opened from `TaxonomyListPage`; parent must remount with `key` when controlled `open` toggles from table actions. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 539 | - **Dependencies**: `@/lib/utils/taxonomy` (resource + form-helpers), `@/lib/utils/taxonomy/form-submit`, `slugifyName`, `MediaCollectionDialog`, t... | yes | RA-7 FRAGMENT |
| `docs/reusable-assets.md` | 540 | ### Asset: taxonomy form-submit utils | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 541 | - **Name**: `buildTaxonomySubmitPayload`, `persistTaxonomyForm`, `prepareOutcomeSubmitPayload`, `prepareTopicSubmitPayload`, `prepareSkillSubmitPay... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 543 | - **Path**: `src/lib/utils/taxonomy/form-submit.ts` (import `@/lib/utils/taxonomy/form-submit` — **not** re-exported from `@/lib/utils/taxonomy` ba... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 544 | - **Purpose**: Keep create/update submit branching out of `TaxonomyFormDialog.onSubmit` (≤60 lines / low cyclo). Compact translations, outcome shor... | yes | RA-8 FRAGMENT |
| `docs/reusable-assets.md` | 545 | - **Scope**: Taxonomy admin form dialog only; lives under utils, not under `components/features/taxonomy/`. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 546 | - **Dependencies**: `createTaxonomyService` / `updateTaxonomyService`, `toTaxonomyTreeWritePayload`, compact helpers in `form-helpers.ts`. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 547 | ### Asset: getTaxonomyDetailService | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 548 | - **Name**: `getTaxonomyDetailService`, `listTaxonomyService`, `useTaxonomyList` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 550 | - **Path**: `src/api/callers/taxonomy/taxonomy-factory.ts (+ taxonomy-browser.ts)`, `src/api/hooks/taxonomy/useTaxonomy.ts` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 552 | - **Scope**: Taxonomy admin, course editor pickers, instructor expertise/application pickers (list + locale). | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 568 | - **Scope**: Course outline tab (sections/lessons/sub-lessons), taxonomy description editor, tree editor; any list with stable string `id`. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 587 | ### Asset: ConfirmActionDialog | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 588 | - **Name**: `ConfirmActionDialog` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 592 | - **Scope**: `ConfirmDeleteDialog` wrapper; instructor course editor submit-review confirm (`editor-page.tsx`); stacked "use recommended slug?" con... | yes | RA-9 FRAGMENT |
| `docs/reusable-assets.md` | 648 | - **Scope**: `InstructorExpertisePage` instructor / topic / skill pickers. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 649 | - **Dependencies**: `useApiInfiniteListQuery`, `getInstructorRosterListKey`, `getTaxonomyListKey`, `Command`, `Popover`, `Button`. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 715 | ### Asset: useCourseCreateFlow | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 716 | - **Name**: `useCourseCreateFlow` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 719 | - **Purpose**: Create-course dialog state machine. Builds the `POST /api/v1/courses` body with `toCreateCoursePayload(title, slug)` (`{ title, slug... | yes | RA-10a REPLACE |
| `docs/reusable-assets.md` | 720 | - **Scope**: `InstructorCoursesPage` create dialog (the confirm is `ConfirmActionDialog stacked`, rendered inside the create `DialogContent`). | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 721 | - **Dependencies**: `toCreateCoursePayload` (`src/lib/utils/course.ts`), `extractRecommendedSlug` / `toastApiError` (`src/lib/utils/api-error.ts`),... | yes | RA-10b REPLACE |
| `docs/reusable-assets.md` | 722 | - **Reuse Rule**: Reuse for any create-with-optional-slug flow; never re-implement 3007 handling inline. | yes | RA-10c REPLACE |
| `docs/reusable-assets.md` | 753 | - **Scope**: Taxonomy topics/skills (`TaxonomyTreeViewButton` with `nodesDraggable={false}`); reusable for any `{ id, name, children? }` tree. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 770 | - **Props**: `allowMediaEmbed` (default `true`). `mediaEmbedKinds` (default `["image","video"]`; INFO tab uses module-level `ABOUT_COURSE_MEDIA_EMB... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 803 | - **Purpose**: Pure course editor helpers — `courseEditorTabs` registry (6 tabs incl. `review-history`), basic-info/sub-lesson form state factories... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 811 | - **Purpose**: Walk a minimal tree shape (`id`, `name`, optional `children`) and produce layouted React Flow nodes/edges via dagre. Node `data.labe... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 812 | - **Scope**: `DagreTreeDialog`; structurally compatible with `TaxonomyTreeNode` (no taxonomy import). | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 815 | ### Asset: SortableTreeEditor | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 816 | - **Name**: `SortableTreeEditor` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 819 | - **Purpose**: Nested drag-and-drop tree with name field and read-only slug preview per node. Uses shared `TaxonomyTreeNode` (no duplicate tree type). | yes | RA-12a REPLACE |
| `docs/reusable-assets.md` | 820 | - **Scope**: Taxonomy topics/skills (`TaxonomyTreeEditor` wrapper); similar JSONB trees elsewhere. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 821 | - **Dependencies**: `SortableList`, `slugifyName`, `createTaxonomyTreeNode`, `TaxonomyTreeNode`. | yes | RA-12b REPLACE |
| `docs/reusable-assets.md` | 823 | ### Asset: SlugInput | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 824 | - **Name**: `SlugInput`, `SlugInputProps` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 826 | - **Path**: `src/components/shared/slug-input.tsx` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 827 | - **Purpose**: Controlled text input for an **editable** slug (`value` + `onValueChange`). Every change goes through `sanitizeSlugInput`: whitespac... | yes | RA-13a FRAGMENT |
| `docs/reusable-assets.md` | 828 | - **Scope**: Create-course dialog (optional slug) and the course editor basic-info tab (required slug, disabled without a draft). Taxonomy keeps it... | yes | RA-13b REPLACE |
| `docs/reusable-assets.md` | 829 | - **Dependencies**: `Input` (`src/components/ui`), `sanitizeSlugInput` (`src/lib/utils/slug.ts`). | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 830 | - **Reuse Rule**: Use for any user-editable slug field; never hand-roll slug character filtering in a form. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 837 | - **Scope**: Taxonomy forms today; reusable for any form that stores `image_file_id` + preview URL. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 844 | - **Purpose**: Admin list table with optional column sort toggles, actions column, and optional toolbar (`FilterBy`, search). Custom filter UI is d... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 845 | - **Scope**: Taxonomy list page; future paginated admin lists. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 848 | ### Asset: slugifyName | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 849 | - **Name**: `slugifyName(text: string): string` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 851 | - **Path**: `src/lib/utils/slug.ts` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 852 | - **Purpose**: Build slug from display name (`generateSlug` + `slugifyName` alias): trim, lowercase, remove Vietnamese accents (`đ/Đ -> d`), spaces... | yes | RA-14a REPLACE |
| `docs/reusable-assets.md` | 853 | - **Scope**: Taxonomy form dialog, tree editor, submit handlers. Not used for course slugs. | yes | RA-14b REPLACE |
| `docs/reusable-assets.md` | 856 | ### Asset: sanitizeSlugInput / SLUG_MAX_LENGTH / SLUG_PATTERN | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 857 | - **Name**: `sanitizeSlugInput(value: string): string`, `SLUG_MAX_LENGTH` (255), `SLUG_PATTERN` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 859 | - **Path**: `src/lib/utils/slug.ts` (import from `@/lib/utils/slug`; the `@/lib/utils` barrel re-exports only `generateSlug` / `slugifyName`) | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 860 | - **Purpose**: Editable-slug input filter and validation constants. `sanitizeSlugInput` maps whitespace to `-`, drops every character outside `a-z ... | yes | RA-15a FRAGMENT |
| `docs/reusable-assets.md` | 861 | - **Scope**: `SlugInput`, `courseCreateSchema` / `courseBasicInfoSchema` slug fields. | yes | RA-15b REPLACE |
| `docs/reusable-assets.md` | 863 | - **Reuse Rule**: Import the constants instead of repeating `255` or a slug regex. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 1063 | - **Purpose**: Passed as `SWRConfig`'s `provider` in `AppProviders`. Behaves exactly like SWR's default in-memory `Map` for every key except the cu... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 1224 | - **Name**: `toastApiError`, `translateApiErrorCode`, `extractApiError`, `extractRecommendedSlug`, `resolveApiErrorMessageKey` | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 1226 | - **Path**: `src/lib/utils/api-error.ts` (barrel: `@/lib/utils`, except `extractRecommendedSlug` — import it from `@/lib/utils/api-error`) | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 1227 | - **Purpose**: Unified API error resolver — maps `response.code` → `errors.codes.{code}` i18n key. Never passes BE `message` to UI. Development may... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 1228 | - **Scope**: Auth, Me, Media, Taxonomy, Instructor, Course — all `catch` blocks after API calls; `extractRecommendedSlug` — create-course flow (`us... | yes | RA-16 FRAGMENT |
| `docs/reusable-assets.md` | 1236 | - **Scope**: Taxonomy form dialog, instructor/course dialogs, any new forms. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 1243 | - **Purpose**: Translates Zod i18n message keys through module-scoped `useTranslations` (e.g. `taxonomy.form.validation.*`). | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 1248 | - **Name**: Module schemas (`auth`, `me`, `media`, `taxonomy`, `instructor`, `course`) | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 1252 | - **Scope**: Forms across Auth, Me, Media, Taxonomy, Instructor, Course modules. | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `docs/reusable-assets.md` | 1443 | - **Reuse Rule**: Call this from future `generateMetadata`; do not hand-copy OG tags per page. **Unused** this phase. Sitemap defaults use `SEO_IND... | no | course/media/auth/nav/locale asset or generic word match; statement stays accurate for the taxonomy slug change |
| `openspec/specs/dashboard-access-control/spec.md` | 8 | Each top-level dashboard route group (instructor, admin, sysadmin) SHALL check the current visitor against that section's required permission set b... | no | main spec: not edited by hand; this change's deltas (new capability spec + `frontend-regression-coverage` ADDED requirement) land in `openspec/changes/add-taxonomy-slug-management-ui/specs/` and are synced at archive |
| `openspec/specs/frontend-regression-coverage/spec.md` | 33 | The suite SHALL cover disabled/loading/empty/error/success query states, pagination merging and pending behavior, representative form validation/su... | no | main spec: not edited by hand; this change's deltas (new capability spec + `frontend-regression-coverage` ADDED requirement) land in `openspec/changes/add-taxonomy-slug-management-ui/specs/` and are synced at archive |
| `docs/seo-ranking-setup.md` | 41 | \| A12 \| Slug helper \| `src/lib/utils/slug.ts` \| Future slug UI/canonical; no second slugger. \| | no | A12 'no second slugger' remains accurate; re-read at edit time |
| `docs/seo-ranking-setup.md` | 43 | \| A14 \| Domain types \| `src/types/course.ts`, `instructor.ts`, `taxonomy/`, `media/` \| JSON-LD builders accept these; not home mock `CourseType`. \| | no | SEO helper inventory (`slug.ts` A12 'no second slugger' still true: `sanitizeSlugInput` is an input filter) |
| `docs/seo-ranking-setup.md` | 52 | **BE assets (docs take-note only — no BE code this phase):** B1–B10 are listed in [`be-mycourse/docs/security-public-seo-notes.md`](../../be-mycour... | no | SEO helper inventory (`slug.ts` A12 'no second slugger' still true: `sanitizeSlugInput` is an input filter) |
| `docs/seo-ranking-setup.md` | 97 | - Duplicate fetch / cache / route-list / slugger / truncate stacks; `OptimizedImage` wrapper; new `middleware.ts`; new font loader. | no | SEO helper inventory (`slug.ts` A12 'no second slugger' still true: `sanitizeSlugInput` is an input filter) |
| `docs/seo-ranking-setup.md` | 158 | 2. **Topic chips:** chip bo tròn responsive; selected = teal. Examples: `All Recommendation`, `Adobe Illustrator`, `Adobe Photoshop`, `UI Design`, ... | no | SEO helper inventory (`slug.ts` A12 'no second slugger' still true: `sanitizeSlugInput` is an input filter) |
| `openspec/changes/disable-dev-deploy-job/design.md` | 23 | 1. Prefix every non-empty line from the top-level `deploy:` key through the end of that job with `# `. This removes the job from parsed YAML while ... | no | other unrelated change folder (CI / role contract); historical |
| `openspec/changes/disable-dev-deploy-job/design.md` | 28 | 6. Follow the repository workflow as part of apply: validate the external Session ID, reuse exactly one `.context/session-<SESSION_ID>.md`, read th... | no | other unrelated change folder (CI / role contract); historical |
| `openspec/specs/frontend-error-handling/spec.md` | 3 | Defines status-aware error recovery for the frontend: catching render-time failures at the route-segment and root level, and replacing the current ... | no | main spec: not edited by hand; this change's deltas (new capability spec + `frontend-regression-coverage` ADDED requirement) land in `openspec/changes/add-taxonomy-slug-management-ui/specs/` and are synced at archive |
| `openspec/specs/frontend-error-handling/spec.md` | 7 | ### Requirement: Segment-level render errors are caught | no | main spec: not edited by hand; this change's deltas (new capability spec + `frontend-regression-coverage` ADDED requirement) land in `openspec/changes/add-taxonomy-slug-management-ui/specs/` and are synced at archive |
| `openspec/specs/frontend-error-handling/spec.md` | 8 | Every top-level route group SHALL provide an `error.tsx` boundary so that a rendering exception thrown by any component within that segment is caug... | no | main spec: not edited by hand; this change's deltas (new capability spec + `frontend-regression-coverage` ADDED requirement) land in `openspec/changes/add-taxonomy-slug-management-ui/specs/` and are synced at archive |
| `openspec/specs/frontend-error-handling/spec.md` | 14 | ### Requirement: Root-level fatal errors are caught | no | main spec: not edited by hand; this change's deltas (new capability spec + `frontend-regression-coverage` ADDED requirement) land in `openspec/changes/add-taxonomy-slug-management-ui/specs/` and are synced at archive |
| `openspec/specs/frontend-error-handling/spec.md` | 18 | - **WHEN** an unhandled error occurs outside any segment-level `error.tsx`, or within the root layout | no | main spec: not edited by hand; this change's deltas (new capability spec + `frontend-regression-coverage` ADDED requirement) land in `openspec/changes/add-taxonomy-slug-management-ui/specs/` and are synced at archive |
| `openspec/specs/frontend-error-handling/spec.md` | 33 | - **WHEN** the primary data request fails with a transport-level network error or timeout and no HTTP response is received | no | main spec: not edited by hand; this change's deltas (new capability spec + `frontend-regression-coverage` ADDED requirement) land in `openspec/changes/add-taxonomy-slug-management-ui/specs/` and are synced at archive |
| `openspec/specs/frontend-error-handling/spec.md` | 48 | Every classified-API-failure full-page state — unauthorized, forbidden, server error, network-unreachable — SHALL be rendered through one shared co... | no | main spec: not edited by hand; this change's deltas (new capability spec + `frontend-regression-coverage` ADDED requirement) land in `openspec/changes/add-taxonomy-slug-management-ui/specs/` and are synced at archive |
| `README.md` | 63 | - `AGENTS.md`, `CLAUDE.md`, and `.claude/` are version-controlled agent guidance. `CLAUDE.md` imports the complete canonical rules from `AGENTS.md`... | no | generic/README tooling statement; README has no taxonomy or slug content and its docs index does not list taxonomy-admin |
| `README.md` | 182 | ## Low-level API Helpers | no | generic/README tooling statement; README has no taxonomy or slug content and its docs index does not list taxonomy-admin |
| `README.md` | 447 | \| `src/store/use-app-store.ts` \| `useAppStore` \| App-level state (counter placeholder, extend as needed) \| | no | generic/README tooling statement; README has no taxonomy or slug content and its docs index does not list taxonomy-admin |
| `README.md` | 473 | appCode: number;     // BE app-level code (mirrors be/pkg/errcode/codes.go), fallback 9999 | no | generic/README tooling statement; README has no taxonomy or slug content and its docs index does not list taxonomy-admin |
| `README.md` | 517 | `useAuthStore` is re-exported from `@/store/auth` for a single `@/hooks` import path. `useGetMe` selects the `/me` mirror slice (kept in sync from ... | no | generic/README tooling statement; README has no taxonomy or slug content and its docs index does not list taxonomy-admin |

Table A totals: 584 matched lines; 68 to change, 6 INSERT anchors, 510 unchanged.

Edit lines that did **not** match the scan pattern (e.g. audit stamps) - still listed in section 4: TAX-1 (`docs/taxonomy-admin.md:3`); TAX-3 (`docs/taxonomy-admin.md:63`); TAX-5 (`docs/taxonomy-admin.md:93`); TAX-6 (`docs/taxonomy-admin.md:142`); TAX-7 (`docs/taxonomy-admin.md:143`); APIO-1 (`docs/api-overview.md:3`); APIU-1 (`docs/api-using.md:3`); APIU-3 (`docs/api-using.md:469`); APIU-4 (`docs/api-using.md:474`); INS-1 (`docs/instructor-admin.md:3`); LF-1 (`docs/logic-flow.md:3`); LF-3 (`docs/logic-flow.md:382`); ARC-1 (`docs/architecture.md:3`); CMP-7 (`docs/components.md:261`); FS-2 (`docs/folder-structure.md:340`).

