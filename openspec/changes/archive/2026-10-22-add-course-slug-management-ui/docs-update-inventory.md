# Documentation Update Inventory — Course Slug Management UI

All documentation is edited in **English** (every scanned file is English; `AGENTS.md` language-consistency rule). Edits **replace** outdated statements (Full Documentation Replacement Rule) — no appended "update notes". Line numbers are from proposal time; re-read each file completely before editing and re-locate by heading/quote. Every audit stamp uses `2026-09-29`. Facts to document (must match final code exactly):

- Slug input is `SlugInput` (`src/components/shared/slug-input.tsx`): filters through `sanitizeSlugInput` (`src/lib/utils/slug.ts`) which turns spaces into `-` and **drops** every character outside `a-z 0-9 -` (uppercase, accented, non-Latin, emoji), max `SLUG_MAX_LENGTH` = 255; final validation `SLUG_PATTERN` (`^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$`).
- Create: `{ title, slug? }` built by `toCreateCoursePayload`; blank slug omitted; no title-derived slug/preview in FE; `409` + code `3007` (`ApiErrorCode.SlugAlreadyExists`) + `data.recommended_slug` (`extractRecommendedSlug`) → stacked `ConfirmActionDialog`, Yes resubmits (repeats on new 3007), No returns to form; flow in `useCourseCreateFlow`.
- Update: slug field required and editable, default `course.slug`, disabled without a draft; `toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug)` sends `slug` only when changed; response `data.course.slug` is authoritative; `slugAdjusted` toast when it differs from the sent slug.
- `generateSlug`/`slugifyName` remain taxonomy-only.

## 1. Files that change

### `docs/api-overview.md`
1. **L88** row `POST /api/v1/courses` — current note `Body { title } only`. Replace the note with: `Body `{ title, slug? }` (`toCreateCoursePayload`); a blank slug is omitted so the BE generates it. A taken slug returns `409` / code **3007** with `data.recommended_slug` (`extractRecommendedSlug`); `useCourseCreateFlow` confirms and resubmits with the recommended slug`.
2. **L90** row `PATCH …/basic-info` — keep the existing optimistic-lock sentence and append: `Body includes `slug` only when it differs from the persisted `course.slug` (`toUpdateCourseBasicInfoPayload`); the response `data.course.slug` is the source of truth (if it differs from the sent slug the UI toasts `course.editor.toast.slugAdjusted`).`
3. **After L47** (error-code bullets) add: `- `ApiErrorCode.SlugAlreadyExists` (**3007**, HTTP 409) is returned by `POST /courses` when the slug is taken; the create response body carries `data.recommended_slug`, read with `extractRecommendedSlug(error)` (`src/lib/utils/api-error.ts`, code 3007 only).`
4. L113 ("Dual response") — verified no change (taxonomy 3005 only).

### `docs/patterns.md`
1. **L351** table row `course.validation` — insert `slugRequired`, `slugInvalid`, `slugMax` after `titleMax` in the key list.
2. **§15 "Slug fields" body (L570–572)** — replace the whole paragraph. Current: `Taxonomy and course-create slugs are **read-only** in the UI. … Do not expose an editable slug input or duplicate tree node types.` New:
   ```
   **Taxonomy** slugs are **read-only** in the UI. Show a live preview with `generateSlug(name)` / `slugifyName(name)` while the user types the name. **Do not send `slug` in taxonomy create/update payloads** — the backend computes the persisted slug with `utils.SlugifyName`. Use one shared `TaxonomyTreeNode` type (`slug?` optional on write); strip slugs with `toTaxonomyTreeWritePayload()` before taxonomy mutations. Do not expose an editable slug input or duplicate tree node types. `generateSlug` / `slugifyName` are for taxonomy only.

   **Course** slugs are **editable** and independent of the course title (no title-derived slug or preview in the FE). Reuse the shared `SlugInput` (`src/components/shared/slug-input.tsx`), which filters input through `sanitizeSlugInput` (`src/lib/utils/slug.ts`: spaces become `-`, every character outside `a-z 0-9 -` is dropped, max `SLUG_MAX_LENGTH` = 255); validate with `SLUG_PATTERN` through the course schema (`course.validation.slugRequired` / `slugInvalid` / `slugMax`).
   - Create dialog: the slug is **optional**; a blank slug is omitted from `POST /courses` (`toCreateCoursePayload(title, slug)`) so the BE generates it. A `409` / code **3007** with `data.recommended_slug` (`extractRecommendedSlug`) opens a stacked `ConfirmActionDialog` (Yes resubmits with the recommended slug and repeats on a new 3007; No returns to the form) — see `useCourseCreateFlow` (`src/hooks/course/use-course-create-flow.ts`).
   - Basic-info tab: the slug is **required**, defaults to `course.slug`, and is disabled while there is no draft. `toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug)` sends `slug` only when it differs from the persisted slug; the response `data.course.slug` is the source of truth.
   ```

### `docs/instructor-admin.md`
1. **L88** "My Courses" paragraph — replace `create dialog sends `{ title }` only; slug preview is read-only (`slugifyName(title)`).` with: `create dialog sends `{ title, slug? }` via `toCreateCoursePayload(title, slug)` (driven by `useCourseCreateFlow`, `src/hooks/course/use-course-create-flow.ts`). The slug is an editable **optional** field (shared `SlugInput`; input filtered by `sanitizeSlugInput` to `a-z 0-9 -`, spaces become `-`, max 255) with a static placeholder and hint; there is no title-derived slug or live preview in the FE. A blank slug is omitted from the request so the BE generates it. If the slug is taken the BE returns `409` / code **3007** with `data.recommended_slug`; the flow opens a stacked `ConfirmActionDialog` — **Yes** resubmits with the recommended slug (and repeats if a new 3007 comes back), **No** returns to the form.` Keep the trailing title rule sentence.
2. **L90** "Course editor basic info" — replace the first sentence `title is editable on save; BE recomputes `courses.slug` from the new title.` with: `title and slug are independent editable fields; the BE no longer recomputes `courses.slug` from the title. The slug field (`SlugInput`, default = `course.slug`) is disabled while there is no draft (no `expected_row_version`) and must be non-empty. `PATCH …/basic-info` sends `slug` only when it differs from the persisted `course.slug`; the response `data.course.slug` is the source of truth, and if it differs from the value sent the UI toasts `course.editor.toast.slugAdjusted` instead of `basicInfoSaved`.` Also change `(all required basic-info fields including `title`; preview video optional)` to `(all required basic-info fields including `title` and `slug`; preview video optional; `toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug)` omits an unchanged slug)`.
3. L100 (submit-for-review) — verified: wording stays correct.

### `docs/logic-flow.md`
1. **§10 L337 Source line** — add `(`createCourseBasicInfoState`, `toUpdateCourseBasicInfoPayload`)` after `src/lib/utils/course.ts`.
2. **L344** — `PATCH /courses/:id/basic-info  { …fields, expected_row_version }` → `PATCH /courses/:id/basic-info  { …fields, expected_row_version, slug? }   (slug only if ≠ persisted course.slug)`.
3. **L347** — `└─ toast "basicInfoSaved"` → `└─ response data.course.slug ≠ sent slug ? toast "slugAdjusted" : toast "basicInfoSaved"`.
4. **L349** — `useCourseBasicInfoState(activeVersion)` → `useCourseBasicInfoState(activeVersion, courseSlug)   [createCourseBasicInfoState(version, courseSlug)]`.
5. **L354** — append: `The slug is independent of the title (the BE no longer recomputes it); the persisted slug from the PATCH response (`data.course.slug`) is authoritative, and a taken slug on create returns `409` / app code `3007` (`ApiErrorCode.SlugAlreadyExists`).`
6. **New section `## 10a. Course Create — Optional Slug and Slug Conflict (3007)`** inserted after §10's closing `---` and before `## 11.` (do not renumber; other docs link to §11):
   ```
   **Source:** `src/hooks/course/use-course-create-flow.ts` (`useCourseCreateFlow`), `src/lib/utils/course.ts` (`toCreateCoursePayload`), `src/lib/utils/api-error.ts` (`extractRecommendedSlug`), `src/components/shared/slug-input.tsx`

   User submits create dialog { title, slug? }
     ↓
   courseCreateSchema.safeParse  → invalid → toastValidationError
     ↓
   toCreateCoursePayload(title, slug)  → blank slug omitted → { title } | { title, slug }
     ↓
   POST /api/v1/courses
     ├─ success → toast created, reset form, onCreated → close dialog, refresh list, open editor
     ├─ 409 + code 3007 + data.recommended_slug  (extractRecommendedSlug(error))
     │     → open stacked ConfirmActionDialog
     │         ├─ Yes → resubmit with slug = recommended_slug   (repeats on a new 3007)
     │         └─ No  → close confirm, return to form (input unchanged)
     └─ other error → toastApiError(tErrors, error)

   The FE never derives a slug from the title; a blank slug lets the BE generate it.
   ```
7. **i18n table (`course.validation.*`, after the `submitOutlineNoItems` row, ~L420–434)** — add rows: `slugRequired` (Basic-info slug is empty), `slugInvalid` (Slug does not match `SLUG_PATTERN`: `a-z`, `0-9`, `-`; no leading/trailing `-`), `slugMax` (Slug longer than `SLUG_MAX_LENGTH`, 255).
8. L375 (submit-readiness schema check) — no text change (schema now also requires the slug; `createCourseBasicInfoState` is seeded with `course.slug`).

### `docs/api-using.md`
1. **New subsection `### Course create and basic-info slug`** inserted before `## Course detail (instructor)` (~L408): a table of `createCourseService` (POST `/api/v1/courses`, body `{ title, slug? }` from `toCreateCoursePayload`) and `updateCourseBasicInfoService` (PATCH `/api/v1/courses/:courseId/basic-info`, `expected_row_version` plus optional `slug` from `toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug)`), followed by a paragraph: slug conflicts return HTTP `409` with app code **3007** (`ApiErrorCode.SlugAlreadyExists`, `errors.codes.3007` en/vi); `extractRecommendedSlug(error)` reads `data.recommended_slug` (code 3007 only); `useCourseCreateFlow` opens a stacked `ConfirmActionDialog` (Yes resubmits, No returns to the form); after a PATCH, `data.course.slug` is the source of truth and `course.editor.toast.slugAdjusted` shows when it differs; input filtering/limits live in `src/lib/utils/slug.ts` (`sanitizeSlugInput`, `SLUG_PATTERN`, `SLUG_MAX_LENGTH`).
2. **After L527** (API error i18n bullets) add: `- `409` slug conflicts use code **3007** (`ApiErrorCode.SlugAlreadyExists`); `extractRecommendedSlug(error)` reads `data.recommended_slug` for the create-course confirm flow.`
3. L81–110 (generic `/api/v1/courses` examples) — illustrative, no change.

### `docs/taxonomy-admin.md`
1. **L92** heading `## Slug (read-only preview; server authority)` → `## Slug (read-only preview; server authority — taxonomy only)`.
2. **After L98** add bullet: `- Scope: this read-only, name-derived behavior applies to **taxonomy only**. Course slugs are editable and independent of the title (shared `SlugInput`, `sanitizeSlugInput`, `SLUG_PATTERN`, `SLUG_MAX_LENGTH` in `src/lib/utils/slug.ts`); `generateSlug` / `slugifyName` are not used for courses. See `docs/patterns.md` §15 and `docs/instructor-admin.md`.`
3. L21, L151 (3005 for taxonomy) — no change.

### `docs/architecture.md`
1. **After L284** (`RequiredLabel` / `FieldError` row) add a row: `| `SlugInput` | `components/shared/slug-input.tsx` | Editable slug field (filters through `sanitizeSlugInput`: `a-z 0-9 -`, spaces become `-`, max 255); used by the course create dialog (optional) and the course basic-info tab (required) |`.
2. **After L283** (`toastApiError` row) add a row: `| `extractRecommendedSlug` | `lib/utils/api-error.ts` | Read `data.recommended_slug` from a `409` / code 3007 (`SlugAlreadyExists`) create-course error |`.

### `docs/reusable-assets.md`
1. **L3** `_Last audited_` → `_Last audited: 2026-09-29 (course slug management UI: `SlugInput`, `sanitizeSlugInput`, `extractRecommendedSlug`, `useCourseCreateFlow`, `ApiErrorCode.SlugAlreadyExists`). Prior: 2026-07-10 (Homepage marketing images under `public/assets/images/home`)._`
2. **L154** ApiErrorCode Reuse Rule → `Always import from here. Never hardcode `code === 0`, `code === 3002` or `code === 3007` inline (use `ApiErrorCode.SlugAlreadyExists` for a duplicate course slug; copy lives in `errors.codes.3007` in `src/messages/error-codes.ts`, en + vi).`
3. **L591–593** ConfirmActionDialog Scope → append `; stacked "use recommended slug?" confirm over the create-course dialog (`useCourseCreateFlow`, `InstructorCoursesPage`)`.
4. **Insert after L713** (end of `useCourseOutlineReorder`, before `### Asset: CourseOutlineRowActions`) a new entry using this file's template:
   ```
   ### Asset: useCourseCreateFlow
   - **Name**: `useCourseCreateFlow`
   - **Type**: React hook
   - **Path**: `src/hooks/course/use-course-create-flow.ts` (barrel: `src/hooks/course/index.ts`)
   - **Purpose**: Create-course dialog state machine. Builds the `POST /api/v1/courses` body with `toCreateCoursePayload(title, slug)` (`{ title, slug? }`; a blank slug is omitted and the BE generates it — the slug is never derived from the title on the FE). On HTTP 409 with `code === ApiErrorCode.SlugAlreadyExists` (3007) it reads `data.recommended_slug` via `extractRecommendedSlug` and exposes `suggestedSlug` for a stacked `ConfirmActionDialog`: `acceptSuggestion` resubmits with the recommended slug, `dismissSuggestion` returns to the form. Any other error goes to `toastApiError`.
   - **Scope**: `InstructorCoursesPage` create dialog.
   - **Dependencies**: `toCreateCoursePayload` (`src/lib/utils/course.ts`), `extractRecommendedSlug` / `toastApiError` (`src/lib/utils/api-error.ts`), `ApiErrorCode`, `courseCreateSchema`, `createCourseService` (`src/api/callers/course`).
   - **Reuse Rule**: Reuse for any create-with-optional-slug flow; never re-implement 3007 handling inline.
   ```
5. **L794** `course editor utils` Purpose — replace the fragment `basic-info/sub-lesson form state factories (…), … `toUpdateCourseBasicInfoPayload` (PATCH fields only — no `title`), taxonomy id `Set` mapping,` with: `basic-info/sub-lesson form state factories (`createCourseBasicInfoState(version, courseSlug)` seeds the form `slug` from `course.slug`; H/M/S duration parts for TEXT/QUIZ), `buildSubLessonEstimatedDurationPayload` / `validateSubLessonDurationForm`, `toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug)` (sends `title` and all required fields — the previous "no `title`" statement was already wrong — and adds `slug` only when it differs from `persistedSlug`), `toCreateCoursePayload(title, slug)` (`{ title, slug? }`, blank slug omitted), taxonomy id `Set` mapping,`. On the L795 Scope line add `use-course-create-flow`.
6. **Insert after L812** (`SortableTreeEditor` Dependencies, before `### Asset: ImageFileField`):
   ```
   ### Asset: SlugInput
   - **Name**: `SlugInput`, `SlugInputProps`
   - **Type**: React component
   - **Path**: `src/components/shared/slug-input.tsx`
   - **Purpose**: Controlled text input for an **editable** slug. Every change goes through `sanitizeSlugInput`: spaces become `-`, anything outside `a-z 0-9 -` is dropped, length capped at `SLUG_MAX_LENGTH` (255). It does not derive a slug from a title. Callers own validation (course schemas, `SLUG_PATTERN`) and error display (`FieldError`).
   - **Scope**: Create-course dialog (optional slug) and the course editor basic-info tab (required slug, disabled without a draft). Taxonomy keeps its read-only slug preview and does not use this component.
   - **Dependencies**: `Input` (`src/components/ui`), `sanitizeSlugInput` (`src/lib/utils/slug.ts`).
   - **Reuse Rule**: Use for any user-editable slug field; never hand-roll slug character filtering in a form.
   ```
7. **L834–836** `slugifyName` entry — replace the sentence `Used for **read-only UI preview only**; persisted slugs are computed on BE (`utils.SlugifyName`).` with `Used for **taxonomy read-only UI preview only** (taxonomy slugs are still computed on BE via `utils.SlugifyName`); course slugs are user-editable and do not use this helper.` and append ` Not used for course slugs.` to its Scope line.
8. **Insert after L836** (before `### Asset: unicodeCodePointLength / truncateUnicodeCodePoints`):
   ```
   ### Asset: sanitizeSlugInput / SLUG_MAX_LENGTH / SLUG_PATTERN
   - **Name**: `sanitizeSlugInput(value: string): string`, `SLUG_MAX_LENGTH` (255), `SLUG_PATTERN`
   - **Type**: Utility function + constants
   - **Path**: `src/lib/utils/slug.ts`
   - **Purpose**: Editable-slug input filter and validation constants. `sanitizeSlugInput` maps whitespace to `-`, drops every character outside `a-z 0-9 -` (uppercase, accented and non-Latin letters, emoji) and truncates to `SLUG_MAX_LENGTH`. `SLUG_PATTERN` is the accepted final shape used by the course Zod schemas. `generateSlug` / `slugifyName` are unchanged (taxonomy preview only).
   - **Scope**: `SlugInput`, `courseCreateSchema` / `courseBasicInfoSchema` slug fields.
   - **Dependencies**: none.
   - **Reuse Rule**: Import the constants instead of repeating `255` or a slug regex.
   ```
9. **L1197 / L1200 / L1201** `toastApiError` entry — add `extractRecommendedSlug` to the Name list; append to Purpose: ` `extractRecommendedSlug(error)` returns `data.recommended_slug` **only** when the error carries `ApiErrorCode.SlugAlreadyExists` (3007) and the field is a non-blank string, otherwise `undefined`; it shares a private response-body reader with `extractApiError` (no duplicate parsing).`; append to Scope: `; `extractRecommendedSlug` — create-course flow (`useCourseCreateFlow`).`
10. L134–142, L1363–1372 (`ApiErrorEntry`, `ApiErrorCodeValue`) — verified no per-code values listed; no change.

### `docs/components.md`
1. **L3** audit stamp → `_Last audited: 2026-09-29 (course slug UI: shared `SlugInput`, create-course optional slug + recommended-slug confirm, basic-info editable slug). Prior: 2026-07-10 (AdvancedPromoSection promo image: subtle hover brightness)._`
2. **L230** `ConfirmActionDialog` row — ending becomes `Composed by `ConfirmDeleteDialog`, course submit-review confirm, and the stacked recommended-slug confirm in the create-course flow.`
3. **After L235** (`SortableTreeEditor` row) add `| `SlugInput` | `slug-input.tsx` | Editable slug `Input`; every change is filtered by `sanitizeSlugInput` (`a-z 0-9 -`, spaces become `-`, max 255). Used by the create-course dialog (optional) and the course editor basic-info tab (required). Does not auto-derive from a title; taxonomy keeps its read-only preview. |`
4. **L247** `components/features/course/` paragraph — in the `course-editor-basic-tab` sentence add: `the tab renders an editable, required slug field (`SlugInput`, default `course.slug`, disabled without a draft); the PATCH carries `slug` only when changed and the response `data.course.slug` is the source of truth (a `slugAdjusted` toast shows when it differs from what was sent)`; add a sentence: `The create dialog (`InstructorCoursesPage`) uses `useCourseCreateFlow`: optional `SlugInput`, blank slug omitted from the POST, and a 409/3007 opens a stacked `ConfirmActionDialog` with the BE `recommended_slug`.`

### `docs/folder-structure.md`
1. **L3** audit stamp → prepend `2026-09-29 (course slug UI: `slug-input.tsx`, `use-course-create-flow.ts`, `slug.ts` `sanitizeSlugInput`, `e2e/tests/course-slug.spec.ts`);` and keep the old text as `Prior:`.
2. **L197–201** shared listing — `SortableTreeEditor, PreviewPdf …` → `SortableTreeEditor, SlugInput, PreviewPdf …`.
3. **L319** `# Barrel: use-course-editor-state, use-course-outline-reorder` → add `, use-course-create-flow`; **insert after L321** `│   └── use-course-create-flow.ts  # useCourseCreateFlow: create-course submit, optional slug, 409/3007 recommended-slug confirm` (turning L321's `└──` into `├──`).
4. **L420** schema line → `└── course/course.ts        # create (title + optional slug), basic-info (required slug), section, lesson, sub-lesson, collaborator, reject`.
5. **L497** → `# toastApiError, translateApiErrorCode, extractApiError, extractRecommendedSlug (3007)`.
6. **L501** → `createCourseBasicInfoState(version, courseSlug), toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug), toCreateCoursePayload(title, slug), createCourseSubLessonFormState, …`.
7. **L511** → `# generateSlug() + slugifyName() (taxonomy preview) + sanitizeSlugInput(), SLUG_MAX_LENGTH, SLUG_PATTERN (editable slug input)`.
8. **L640** fixture server line → append `; POST /api/v1/courses (slug create incl. 409/3007 + recommended_slug) and course basic-info PATCH slug echo` (confirm against the final `e2e/fixtures/server.mjs`).
9. **After L645** add `    ├── course-slug.spec.ts       # optional slug on create, 409/3007 recommended-slug confirm (Yes/No), basic-info slug edit`.
10. Optional pre-existing gap: the tree omits `e2e/support/auth.ts` and `e2e/tests/course-error-states.spec.ts` (present in `docs/testing.md`); add if editing the same block.

### `docs/modules.md`
1. **L3** stamp → prepend `2026-09-29 (Course slug management UI: editable slug on create + basic-info, 3007 recommended-slug confirm).` and demote the old text to `Prior:`.
2. **L84** hook bullets — add after the `use-course-editor-state.ts` bullet: `  - `src/hooks/course/use-course-create-flow.ts` — `useCourseCreateFlow`: create-course submit with optional slug (`toCreateCoursePayload`, blank slug omitted), 409 + `ApiErrorCode.SlugAlreadyExists` (3007) → `extractRecommendedSlug` → stacked `ConfirmActionDialog` (Yes resubmits with `data.recommended_slug`, No returns to the form)`; and append to the `use-course-editor-state.ts` bullet: `The info-tab save sends `slug` only when it differs from the persisted `course.slug`; the response `data.course.slug` is the source of truth and a `slugAdjusted` toast is shown when it differs from the sent value.`
3. **L86** Validation bullet — `Create dialog uses `courseCreateSchema` (title ≥5 non-whitespace).` → `Create dialog uses `courseCreateSchema` (title ≥5 non-whitespace; optional slug validated by `SLUG_PATTERN`, max `SLUG_MAX_LENGTH` 255, blank allowed and omitted from the POST). `courseBasicInfoSchema` also requires `slug` (same pattern/length).`; and `` `toUpdateCourseBasicInfoPayload` sends all required fields including `title`. `` → `` `toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug)` sends all required fields including `title` and adds `slug` only when changed. ``
4. **L63** Types bullet — append `; `CreateCoursePayload.slug?`, `UpdateCourseBasicInfoPayload.slug?`, `CourseBasicInfoForm.slug``.
5. L9, L10, L14, L65 — verified no required change.

### `docs/pages.md`
1. **L3** stamp → prepend `2026-09-29 — course slug management UI (create-dialog optional slug + 3007 confirm; basic-info editable slug).`
2. **L91** row `Instructor courses list` → validation cell `course.validation.title` + optional slug (`SlugInput`, `SLUG_PATTERN`, max 255) on the create dialog; a 409/3007 opens a stacked `ConfirmActionDialog` (Yes resubmits with `data.recommended_slug`, No returns to the form)`; error cell `toastApiError` on create / delete (3007 with a recommended slug is handled by the confirm, not toasted)`.
3. **L92** row `Instructor course editor` → after `courseBasicInfoSchema via react-hook-form + zodResolver,` insert `editable required slug field (`SlugInput`, disabled without a draft; PATCH sends `slug` only when changed, `slugAdjusted` toast when the server slug differs),`.

### `docs/screens.md`
1. **L3** stamp → prepend `2026-09-29 (course slug UI: create dialog optional slug + 3007 confirm; info tab editable slug).`
2. **L36** → `` `InstructorCoursesPage` — editable course list, create dialog (title + optional editable slug via `SlugInput`; 409/3007 opens a stacked recommended-slug `ConfirmActionDialog`), owner-only delete ``.
3. **L37** → `` `InstructorCourseEditorPage` — route-backed basic info tab (incl. editable required slug) ``.
4. **L122** `src/components/features/course/` bullet → append `; create-course flow via `useCourseCreateFlow` (`src/hooks/course`)`.
5. **Shared component table near L427** — read the table; add `| `SlugInput` | `slug-input.tsx` | Editable slug input filtered by `sanitizeSlugInput` — course create dialog, course basic-info tab. |` if the table lists shared components individually.

### `docs/router.md`
1. **L206** (`info` route row) — append `; basic info includes the editable slug field`. No route added or changed; the file's audit stamp stays (routing itself did not change).

### `docs/testing.md`
1. **L28** fixture backend bullet → append `, plus `POST /api/v1/courses` (optional slug; 409 + code 3007 + `data.recommended_slug` when the slug is taken) and the course basic-info PATCH slug echo used by `course-slug.spec.ts``.
2. **After L37** add the journey bullet: `  - `course-slug.spec.ts` — create-course dialog with an optional slug (blank slug omitted from the request body); a duplicate slug triggers the 409/3007 stacked confirm (Yes resubmits with the recommended slug, No returns to the form); the basic-info tab edits and saves the slug and reflects the server-returned `data.course.slug`.`
3. **Stage 3 behavior-matrix table** — add rows (fill real case counts after the run): `src/lib/utils/slug.ts` ↔ `src/lib/utils/slug.test.ts`; `src/schema/course/course.ts` ↔ `src/schema/course/course.test.ts`; `src/lib/utils/course.ts` ↔ `src/lib/utils/course.test.ts`; `src/lib/utils/api-error.ts` (`extractRecommendedSlug`) ↔ `src/lib/utils/api-error.test.ts`; `src/hooks/course/use-course-create-flow.ts` ↔ `src/hooks/course/use-course-create-flow.test.tsx`; `src/components/shared/slug-input.tsx` ↔ `src/components/shared/slug-input.test.tsx` (status ✅ Passing only after they actually pass).
4. **L73** browser-journeys row → append `, course slug create/409-confirm/basic-info edit` and update the case count after the real run.
5. L79 (`src/hooks/course` already listed) — no change.

### `docs/seo-ranking-setup.md`
1. **L41** (A12) — verified: still accurate ("no second slugger"); `sanitizeSlugInput` is an input filter, not a slugger. No change; re-read at edit time to confirm the wording still holds.

## 2. Scanned and verified — no change (with reason)
| File | Reason |
|---|---|
| `README.md` | `CourseCreate` hits are a generic `PermissionGate` example |
| `IMPLEMENTATION_PLAN_EXECUTION.md` | only an unrelated auth `confirmAction` note |
| `docs/flow.md` | no course create/basic-info flow |
| `docs/quality.md` | gates and tooling only; gates unchanged |
| `docs/dependencies.md` | no package added or changed |
| `docs/instructor-application.md` | become-instructor flow; unrelated `search-text.ts` slug helper |
| `docs/course-collaboration-handoff-2026-06-04.md` | dated snapshot |
| `docs/delivery.md`, `docs/delivery/*.md` | protocol examples only |
| `docs/media-collection.md`, `docs/security-hardening-notes.md`, `docs/deploy.md`, `docs/docker.md` | unrelated |
| `.ai/skills/**` | no course/slug content |
| `openspec/specs/**` | only `frontend-regression-coverage` gains a requirement through this change's delta; main specs are synced at archive, not edited here |
| `CLAUDE.md`, `AGENTS.md` | GitNexus header regenerated by `npx gitnexus analyze`; no rule is added (Agent rule boundaries not triggered) |

## 3. Session and GitNexus documents
- `.context/session-<SESSION_ID>.md` (exact file resolved at apply time): replace prior-task content with the final state, "What I Learned Today", "What I Should Learn or Do Next Time"; do not touch other sessions' files.
- GitNexus: `npx gitnexus analyze` (add `--embeddings` only if `.gitnexus/meta.json` reports embeddings > 0) after implementation; verify the generated counts in `CLAUDE.md`/`AGENTS.md` headers are the only diff there.
- Memory Bank (`/private/tmp/ai-agent/memory/fe-mycourse/`): update `activeContext.md`, `progress.md`, and overwrite `lastResponse.md` with the verbatim final answer, per `AGENTS.md` (outside the repo; no secrets).
