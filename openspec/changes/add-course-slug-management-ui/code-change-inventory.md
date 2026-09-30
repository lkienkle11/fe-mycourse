# Code Change Inventory — Course Slug Management UI

Frontend only (`fe-mycourse`). Every entry names the file, the exact symbol, the change, the call sites (from grep; GitNexus reports zero callers because its index is 14 commits behind), and the existing resource that is reused instead of creating a new one. Line numbers are from the tree at proposal time and must be re-checked when editing.

Legend: **ADD** new symbol/file, **MOD** modify existing, **DEL** remove, **KEEP** explicitly unchanged.

## A. Types, constants, messages

### A1. `src/types/course.ts`
| Symbol | Change | Detail |
|---|---|---|
| `CreateCoursePayload` (l.208) | MOD | `{ title: string; slug?: string }` |
| `UpdateCourseBasicInfoPayload` (l.212) | MOD | add `slug?: string` (sent only when changed) |
| `CourseBasicInfoForm` (l.314) | MOD | add `slug: string` (form value; seeded from `course.slug`) |
| `Course.slug` (l.25), `CourseDetail.course` (l.161) | KEEP | already typed; the response `data.course.slug` is read from here |

Consumers of `CourseBasicInfoForm` (type-only, need no code change but must type-check): `course-editor-basic-tab.tsx:36,49,50`, `course-editor-dialogs.tsx:34,656,657`, `use-course-editor-state.ts:45,73`, `lib/utils/course.ts:15`.
Consumers of `CreateCoursePayload`: `api/callers/course/course-factory-core.ts:23,49,53`. Of `UpdateCourseBasicInfoPayload`: `course-factory-core.ts:25,89,93`, `lib/utils/course.ts:24,72`. No caller signature changes.

### A2. `src/constants/api-error-code.ts`
| Symbol | Change | Detail |
|---|---|---|
| `ApiErrorCode` (l.2) | MOD | add `SlugAlreadyExists: 3007,` directly after `TooManyRequests: 3006` (l.27) in the "Client / HTTP-shaped (3xxx)" block. Keep the file a plain `as const` object (ESLint forbids functions/types in `src/constants/**`). |

### A3. `src/messages/error-codes.ts`
| Symbol | Change | Detail |
|---|---|---|
| Header comment (l.10) | MOD | `3003–3006` → `3003–3007` |
| `errorCodesEn` (after `"3006"`, l.39) | MOD | `"3007": "This slug is already in use."` |
| `errorCodesVi` (after `"3006"`, l.112) | MOD | `"3007": "Slug này đã được sử dụng."` |
`ApiErrorCodeKey = keyof typeof errorCodesEn` (`lib/utils/api-error.ts:22`) then accepts `"3007"`; `toApiErrorCodeKey` needs no change.

### A4. `src/messages/en.ts` and `src/messages/vi.ts` (must mirror; `Messages` type enforces parity)
Existing keys reused unchanged: `course.list.createDialog.slugLabel`, `slugPlaceholder`, `creating`, `create`, `title`, `titleLabel`; `course.list.toast.created`; `course.editor.toast.basicInfoSaved`; `course.common.cancel`.

| Path | en text | vi text |
|---|---|---|
| `course.list.createDialog.slugHint` | `Optional. Leave blank to generate one automatically. Lowercase letters, numbers, and dashes only.` | `Không bắt buộc. Để trống để hệ thống tự tạo. Chỉ gồm chữ thường, số và dấu gạch ngang.` |
| `course.list.createDialog.slugConflictTitle` | `Slug already exists` | `Slug đã tồn tại` |
| `course.list.createDialog.slugConflictDescription` | `This slug already exists. We suggest: {slug}. Do you want to continue creating the course with this slug?` | `Slug này đã tồn tại. Chúng tôi đề xuất: {slug}. Bạn có muốn tiếp tục tạo khóa học với slug này không?` |
| `course.list.createDialog.slugConflictConfirm` | `Yes` | `Có` |
| `course.list.createDialog.slugConflictCancel` | `No` | `Không` |
| `course.editor.basicInfo.slugLabel` | `Slug` | `Đường dẫn tĩnh` (matches the existing vi `createDialog.slugLabel`) |
| `course.editor.basicInfo.slugPlaceholder` | `course-slug` | `khoa-hoc-cua-ban` |
| `course.editor.basicInfo.slugHint` | `Lowercase letters, numbers, and dashes only. If the slug is already taken, a suffix is added automatically.` | `Chỉ gồm chữ thường, số và dấu gạch ngang. Nếu slug đã được dùng, hệ thống sẽ tự thêm hậu tố.` |
| `course.editor.toast.slugAdjusted` | `Course information saved. The slug was already taken, so it was changed to {slug}.` | `Đã lưu thông tin khóa học. Slug đã được dùng nên được đổi thành {slug}.` |
| `course.validation.slugRequired` | `Please enter a slug.` | `Vui lòng nhập slug.` |
| `course.validation.slugInvalid` | `Slug may only contain lowercase letters, numbers, and dashes, and cannot start or end with a dash.` | `Slug chỉ gồm chữ thường, số và dấu gạch ngang, và không được bắt đầu hoặc kết thúc bằng dấu gạch ngang.` |
| `course.validation.slugMax` | `Slug must be at most 255 characters.` | `Slug tối đa 255 ký tự.` |

Insert positions: `createDialog` block en.ts:938–945 / vi.ts:936–943; `basicInfo` block en.ts:1100–1131 (after `titleReadOnlyHint`/`titleLabel` area, before `shortDescriptionLabel`); `toast` block en.ts:1243–1262 (after `basicInfoSaveError`); `validation` block en.ts:829+ (after `titleMax`). `src/messages/en.ts` and `vi.ts` are exempt from `max-lines`.
**KEEP**: `course.editor.basicInfo.titleReadOnlyHint` (unused in `src`, out of scope; noted in the session learning summary, not removed).

## B. Shared utilities (`src/lib/utils`)

### B1. `src/lib/utils/slug.ts`
| Symbol | Change | Detail |
|---|---|---|
| `generateSlug`, `slugifyName` | KEEP | behaviour unchanged; callers `components/shared/sortable-tree-editor.tsx:7,101`, `lib/utils/taxonomy/form-helpers.ts:2,188` |
| `SLUG_MAX_LENGTH` | ADD | `export const SLUG_MAX_LENGTH = 255;` |
| `SLUG_PATTERN` | ADD | `export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;` |
| `sanitizeSlugInput(value: string): string` | ADD | `value.replace(/\s/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, SLUG_MAX_LENGTH)`. Spaces become `-` first; then every other character (uppercase, accented and non-Latin letters, emoji, punctuation) is dropped. Idempotent. Does not trim dashes or collapse them (so typing `abc-` and `abc---123` keep working). |
Why not reuse `generateSlug`: it lowercases, strips accents (`é→e`), keeps Unicode letters via `\p{L}`, collapses `-+`, and trims edge dashes — all contradict the required "drop everything outside `a-z0-9-`, keep typing state" behaviour, and changing it would alter taxonomy previews.

### B2. `src/lib/utils/index.ts` (barrel)
KEEP (decided during implementation): the barrel is unchanged. Its `./course` export is a named list that already omits `toUpdateCourseBasicInfoPayload`, and `src/schema/course/course.ts` already imports sibling helpers by direct path; consumers import `@/lib/utils/slug` (`sanitizeSlugInput`, `SLUG_MAX_LENGTH`, `SLUG_PATTERN`) and `@/lib/utils/course` (`toCreateCoursePayload`) directly.

### B3. `src/lib/utils/api-error.ts`
| Symbol | Change | Detail |
|---|---|---|
| private `readErrorResponseBody(error: unknown): unknown` | ADD | returns `error.response.data` for `isApiHttpError(error)`, otherwise the legacy `(error as { response?: { data?: unknown } })?.response?.data` — the exact two branches now inline in `extractApiError` (l.33–38) |
| `extractApiError(error)` | MOD | body becomes `return parseApiErrorEnvelope(readErrorResponseBody(error));` — same result, same signature (24 consumers unaffected) |
| `extractRecommendedSlug(error: unknown): string \| undefined` | ADD | returns `undefined` unless `extractApiError(error).code === ApiErrorCode.SlugAlreadyExists`; then reads `readErrorResponseBody(error)`; if it is an object with an object `data` whose `recommended_slug` is a string with non-blank content, returns that string, else `undefined`. `ApiErrorCode` is already imported in this file. |
`toastApiError` (l.111) KEEP. `parseApiErrorEnvelope` (`api/core/fetch-error.ts:224`) KEEP (it intentionally reads only `code` and `message`).

### B4. `src/lib/utils/course.ts`
| Symbol | Change | Detail |
|---|---|---|
| `createCourseBasicInfoState(activeVersion?, courseSlug = "")` (l.50) | MOD | add second parameter; return object gains `slug: courseSlug`. Callers: `use-course-editor-state.ts:74,82` and `validateCourseSubmitReadiness` `course.ts:402–404` (→ `createCourseBasicInfoState(draftVersion, detail.course.slug)`). |
| `toUpdateCourseBasicInfoPayload(basicInfo, persistedSlug)` (l.70) | MOD | second parameter `persistedSlug: string`; after the `preview_video_file_id` conditional add `const slug = basicInfo.slug.trim(); if (slug !== persistedSlug) { payload.slug = slug; }`. Caller: `use-course-editor-state.ts:379`. |
| `toCreateCoursePayload(title: string, slug: string): CreateCoursePayload` | ADD | `{ title: title.trim() }` plus `slug` only when the trimmed slug is non-empty. Sits next to `toUpdateCourseBasicInfoPayload` (same builder pattern). Add `CreateCoursePayload` to the type import list (l.14–25). |
| `validateCourseSubmitReadiness` (l.392) | MOD | pass `detail.course.slug` as shown above so `courseBasicInfoSchema` (now requiring a slug) still passes for complete drafts. |

## C. Schema — `src/schema/course/course.ts`
| Symbol | Change | Detail |
|---|---|---|
| import | ADD | `import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/utils/slug";` (schema already imports `@/lib/utils/course-delta` directly; no cycle: `slug.ts` has no imports) |
| `slugFormatField(allowEmpty)` (private, next to `titleField` l.6) | ADD | `z.string().max(SLUG_MAX_LENGTH, { message: "validation.slugMax" }).refine((v) => (allowEmpty && v === "") \|\| SLUG_PATTERN.test(v), { message: "validation.slugInvalid" })` |
| `courseCreateSchema` (l.18) | MOD | `{ title: titleField, slug: slugFormatField(true) }` |
| `courseBasicInfoSchema` (l.22) | MOD | add `slug: z.string().min(1, { message: "validation.slugRequired" }).pipe(slugFormatField(false))` so an empty value reports `slugRequired` first |
| `CourseCreateValues` / `CourseBasicInfoValues` (l.136–137) | KEEP | inferred types gain `slug` automatically |
Consumers: `courseCreateSchema` → only `useCourseCreateFlow` (was `page.tsx:31,96`); `courseBasicInfoSchema` → `course-editor-basic-tab.tsx:34,91,96`, `use-course-editor-state.ts:39,370`, `lib/utils/course.ts:13,402`. Verify the installed `zod` major supports `.pipe` short-circuit before relying on it (fallback: `.superRefine`).

## D. Shared component — `src/components/shared/slug-input.tsx` (ADD, `"use client"`)
```
type SlugInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
};
export function SlugInput({ value, onValueChange, ...props }: SlugInputProps)
```
Renders the existing `Input` (`src/components/ui/input.tsx`) with `value`, `onChange={(e) => onValueChange(sanitizeSlugInput(e.target.value))}`, `autoComplete="off"`, `autoCapitalize="none"`, `spellCheck={false}`, remaining props spread. Covers typing and paste because filtering runs on the resulting value. Export from `src/components/shared/index.ts` (append `export * from "./slug-input";` in alphabetical position after `./sortable-tree-editor`… before `./status-error-page`, keeping the existing order style). Consumed by `page.tsx` and `course-editor-basic-tab.tsx` (satisfies knip's unused-file rule for `src/components/**`).

## E. Create flow

### E1. `src/hooks/course/use-course-create-flow.ts` (ADD, `"use client"`), export in `src/hooks/course/index.ts`
```
type UseCourseCreateFlowParams = { onCreated: (created: CourseDetail) => void | Promise<void> };
export function useCourseCreateFlow({ onCreated }): {
  title, setTitle, slug, setSlug, isSubmitting, suggestedSlug,
  submit: (slugOverride?: string) => Promise<void>,
  acceptSuggestion: () => Promise<void>, dismissSuggestion: () => void, reset: () => void }
```
Behaviour:
- state: `title`, `slug` (both `""`), `isSubmitting`, `suggestedSlug: string | null`.
- `submit(slugOverride?)`: `courseCreateSchema.safeParse({ title: title.trim(), slug: (slugOverride ?? slug).trim() })`; on failure `toastValidationError(tValidation, issues, "title")`, clear `suggestedSlug`, return. Else `setIsSubmitting(true)`; `createCourseService(toCreateCoursePayload(title, slugOverride ?? slug))`; on success `toast.success(t("toast.created"))`, `reset()`, `await onCreated(created)`. On error: `const recommended = extractRecommendedSlug(error)`; if defined `setSuggestedSlug(recommended)`; else `setSuggestedSlug(null)` and `toastApiError(tErrors, error)`. `finally` `setIsSubmitting(false)`.
- `acceptSuggestion`: read `suggestedSlug`; if null return; `setSlug(suggestedSlug)`; `await submit(suggestedSlug)` — a second `3007` naturally replaces `suggestedSlug`, re-opening the confirm with the new recommendation.
- `dismissSuggestion`: `setSuggestedSlug(null)` (form and inputs untouched).
- translators: `useTranslations("course.list")`, `("course.validation")`, `("errors.codes")` — same three the page uses today.
Reused as-is: `createCourseService` (`@/api/callers/course`), `courseCreateSchema`, `toastValidationError`, `toastApiError`, `toast`. `onCreated` keeps router and list `mutate` in the page, so the hook stays independent (and testable without mocking `@/i18n/navigation`).

### E0. `src/components/shared/confirm-action-dialog.tsx` (MOD, added during manual testing)
ADD optional prop `stacked?: boolean`. When true it renders `Dialog` + `DialogContent role="alertdialog" showCloseButton={false} onInteractOutside={preventDefault}` with `DialogHeader/Title/Description` and a `DialogFooter` of two `Button`s (cancel → `onOpenChange(false)`, confirm → `onConfirm`), keeping the `isLoading` close guard. Default (AlertDialog) rendering is unchanged; existing callers (`confirm-delete-dialog.tsx`, `editor-page.tsx`, `become-instructor-page.tsx`) are unaffected. New test: `src/components/shared/confirm-action-dialog.test.tsx` (3 cases).

### E2. `src/screen/instructor/courses/page.tsx` (MOD)
| Lines | Change |
|---|---|
| imports l.6,20–21,28,29–31 | DEL `createCourseService` (keep `deleteCourseService`), `Label`, `slugifyName`, `toastValidationError`, `courseCreateSchema`; ADD `useCourseCreateFlow` (from `@/hooks/course`), `SlugInput` and `ConfirmActionDialog` (from `@/components/shared/...`). `RequiredLabel`, `Input`, `toast`, `toastApiError`, `Dialog*` stay. |
| l.37 `tValidation` | DEL (only used by `handleCreate`); `tErrors` stays for `handleDelete` |
| l.42–44 `title`, `isSubmitting`, `derivedSlug` | DEL; `createOpen` stays |
| new | `const create = useCourseCreateFlow({ onCreated: async (created) => { setCreateOpen(false); await mutate(); router.push(instructorCourseEditorTabHref(created.course.id, "info")); } });` |
| l.95–116 `handleCreate` | DEL (replaced by `create.submit`) |
| l.232–236 title `Input` | MOD `value={create.title}` / `onChange={(e) => create.setTitle(e.target.value)}` |
| l.238–247 read-only slug | MOD → `<RequiredLabel htmlFor="course-slug" required={false}>{t("createDialog.slugLabel")}</RequiredLabel>`, `<SlugInput id="course-slug" value={create.slug} onValueChange={create.setSlug} placeholder={t("createDialog.slugPlaceholder")} />`, `<p className="text-xs text-muted-foreground">{t("createDialog.slugHint")}</p>`; DEL `readOnly`, `bg-muted`, `cursor-not-allowed`, `aria-readonly` |
| l.257–265 Create button | MOD `disabled={create.isSubmitting \|\| !create.title.trim()}`, `onClick={() => void create.submit()}`, label from `create.isSubmitting`; DEL the `derivedSlug.length < 1` condition |
| inside the create `DialogContent`, after `DialogFooter` (React-tree nested; a sibling makes Radix dismiss the create dialog — found by the e2e decline test; `stacked` avoids the AlertDialog focus-trap fight — found by manual testing) | ADD `<ConfirmActionDialog stacked open={create.suggestedSlug !== null} onOpenChange={(open) => { if (!open) create.dismissSuggestion(); }} onConfirm={create.acceptSuggestion} title={t("createDialog.slugConflictTitle")} description={t("createDialog.slugConflictDescription", { slug: create.suggestedSlug ?? "" })} confirmLabel={t("createDialog.slugConflictConfirm")} cancelLabel={t("createDialog.slugConflictCancel")} isLoading={create.isSubmitting} loadingLabel={t("createDialog.creating")} />` |
`slugifyName` stays exported and used by taxonomy, so no dead export appears.

## F. Update flow

### F1. `src/hooks/course/use-course-editor-state.ts` (MOD; currently 700 raw lines, limit is 700 non-blank non-comment)
| Symbol | Change | Detail |
|---|---|---|
| `useCourseBasicInfoState(activeVersion)` (l.70) | MOD | signature `(activeVersion?: CourseVersion, courseSlug = "")`; initial state `createCourseBasicInfoState(activeVersion, courseSlug)` (l.74) and the version-id branch (l.82) pass `courseSlug`; add `const [syncedCourseSlug, setSyncedCourseSlug] = useState(courseSlug);` and, after the existing `if / else if`, `if (syncedCourseSlug !== courseSlug) { setSyncedCourseSlug(courseSlug); setBasicInfo((prev) => ({ ...prev, slug: courseSlug })); }` (same render-time sync idiom as the two existing blocks; unsaved edits survive a refetch that returns the same slug). |
| call site (l.298) | MOD | `useCourseBasicInfoState(activeVersion, courseDetail?.course.slug ?? "")` |
| `handleSaveBasicInfo` (l.365–393) | MOD | `const payload = toUpdateCourseBasicInfoPayload(basicInfo, courseDetail?.course.slug ?? "");` → `updateCourseBasicInfoService(courseId, payload)`; `const savedSlug = detail.course.slug;` `setBasicInfo((prev) => ({ ...prev, slug: savedSlug, expected_row_version: detail.draft_version?.row_version ?? prev.expected_row_version }));` `await mutateDetail(detail, { revalidate: false });` then `payload.slug !== undefined && payload.slug !== savedSlug ? toast.info(t("slugAdjusted", { slug: savedSlug })) : toast.success(t("basicInfoSaved"))`. Validation failure keeps `toastValidationError(tValidation, parsed.error.issues, "title")` (first issue key is `slugRequired`/`slugInvalid` for slug problems). |
Fallback if the file exceeds `max-lines`: move `useCourseBasicInfoState` (unchanged apart from the above) into `src/hooks/course/use-course-basic-info-state.ts` and import it — a move, never a copy.

### F2. `src/components/features/course/course-editor-basic-tab.tsx` (MOD; 471 lines)
ADD a `Controller name="slug"` after the title `Controller` (l.~137–152) in the same grid, mirroring the title block: `RequiredLabel htmlFor="course-basic-slug"` (`t("slugLabel")`), `SlugInput` with `id="course-basic-slug"`, `name={field.name}`, `ref={field.ref}`, `onBlur={field.onBlur}`, `value={field.value}`, `disabled={!editable}`, `placeholder={t("slugPlaceholder")}`, `onValueChange={(value) => { field.onChange(value); setBasicInfo((prev) => ({ ...prev, slug: value })); }}`, then `<p className="text-xs text-muted-foreground">{t("slugHint")}</p>` and the existing `FieldError` + `resolveValidationMessage(tCourse …)` pair. `handleInvalidSubmit` and `form.handleSubmit(() => onSave(), handleInvalidSubmit)` unchanged (empty slug yields a field error plus the existing validation toast).

## G. KEEP list (must not change)
`generateSlug`, `slugifyName`, taxonomy slug UI (`taxonomy-form-dialog.tsx`, `sortable-tree-editor.tsx`, `taxonomy/form-helpers.ts`), `createCourseService`/`updateCourseBasicInfoService` bodies, `parseApiErrorEnvelope`, `toastApiError`, `ConfirmActionDialog`, `Input`, `RequiredLabel`, `FieldError`, `eslint.config.mjs`, `biome.json`, `knip.json`, `.jscpd.json`, `jest.config.ts`, `playwright.config.ts`, CI workflows, `package.json` dependencies.

## H. Tests (ADD unless noted; co-located, English names, placeholder data only)
| File | Cases |
|---|---|
| `src/lib/utils/slug.test.ts` | `sanitizeSlugInput`: uppercase dropped, `Khóa Học 01!` → exactly `ha-c-01` (uppercase and accented characters dropped, spaces to `-`), emoji and CJK dropped, spaces→`-` (including runs and edges), idempotent, 300-char input cut to 255, `abc---123` untouched; `SLUG_PATTERN`: accepts `a`, `abc---123`, rejects `-abc`, `abc-`, `Abc`, empty, `a_b`; `generateSlug("36 Thanh Hóa")` still `36-thanh-hoa` |
| `src/schema/course/course.test.ts` | create: blank slug ok, valid ok, `-x` → `validation.slugInvalid`, 256 chars → `validation.slugMax`; basic-info: empty → `validation.slugRequired` first, valid ok |
| `src/lib/utils/course.test.ts` | `createCourseBasicInfoState(version, "s")` seeds slug; `toUpdateCourseBasicInfoPayload` omits unchanged slug, includes changed slug, still includes `title`; `toCreateCoursePayload` omits blank slug, trims title; `validateCourseSubmitReadiness` passes for a complete draft with `course.slug` |
| `src/lib/utils/api-error.test.ts` (MOD) | keep existing `classifyApiError` cases; add `extractApiError` regression (both body shapes) and `extractRecommendedSlug` cases: 3007 with slug, 3007 without data, 3007 with blank/non-string slug, other code with `recommended_slug`, legacy `response.data` shape, non-HTTP error |
| `src/components/shared/slug-input.test.tsx` | typing and paste-style change events produce filtered values via `onValueChange`; spaces→`-`; `disabled` respected |
| `src/hooks/course/use-course-create-flow.test.tsx` | MSW `POST */api/v1/courses`: blank slug omitted from body; manual slug sent; 3007 sets `suggestedSlug`; `acceptSuggestion` posts `slug` = recommended; `dismissSuggestion` clears without a request; second 3007 replaces `suggestedSlug`; non-3007 error clears it and toasts; success calls `onCreated` and resets |
| `e2e/fixtures/server.mjs` (MOD) | reuse the file's existing body-reading and `json`/`envelope` helpers; ADD `POST /api/v1/courses` (slug `taken-slug` → 409 `envelope(3007, "Slug already exists", { recommended_slug: "taken-slug-x7k92ab" })`; otherwise 201 detail with `course.id = COURSE_ID` and the given or a generated slug) and `PATCH /api/v1/courses/${COURSE_ID}/basic-info` (echo detail with `course.slug` = sent slug, `taken-slug` → `taken-slug-x7k92ab`, `draft_version.row_version` incremented); make the state reset with the file's existing reset route. Existing routes untouched. |
| `e2e/tests/course-slug.spec.ts` | same `beforeEach` as `course-editing.spec.ts` (`resetFixtures`, `loginAsInstructor`); cases: create with blank slug; create with `taken-slug` → dialog → Yes → editor; create with `taken-slug` → No → form stays with input; basic-info slug edit shows toast when the fixture returns a suffixed slug |
