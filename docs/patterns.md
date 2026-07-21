# Coding Patterns and Conventions (`fe-mycourse`)

_Last audited: 2026-06-29 (SearchableSelect `useApiInfiniteListQuery` + `getRowKey` page-merge dedupe). Prior: shared `deferDropdownAction` + `DeferredDropdownMenuItem` for menu→dialog flows (2026-06-26)._


Rules and repeatable patterns every developer and AI agent must follow when adding or modifying code in this project.

---

## 1. File Naming

| Type | Convention | Example |
|------|-----------|---------|
| React components | `kebab-case.tsx` | `auth-layout.tsx` |
| Hooks | `use-kebab-case.ts` | `use-auth-store.ts` |
| Utilities | `kebab-case.ts` | `cookie.ts`, `cn.ts` |
| Type files | `kebab-case.ts` | `api.ts`, `auth.ts` |
| Schema files | `kebab-case.ts` | `auth.ts` |
| Barrel files | always `index.ts` | `src/api/index.ts` |
| Server Actions | `kebab-case.ts` in `src/actions/<domain>/` | `auth.ts` |

---

## 2. Component Patterns

### Server vs Client boundary

Default to **Server Components**. Add `"use client"` only when needed:

| Requires `"use client"` | Stays Server Component |
|------------------------|----------------------|
| React hooks (`useState`, `useEffect`, SWR, Zustand) | Pure rendering (no state/effects) |
| Event handlers (`onClick`, `onSubmit`) | Data fetching via `async` component |
| Radix interactive primitives | Static layout and content |
| `useTranslations` (next-intl client hook) | `getTranslations` (next-intl server function) |

### Component export style

Always named exports — never default exports for components:

```ts
// ✅ Correct
export function AuthLayout() { ... }

// ❌ Wrong
export default function AuthLayout() { ... }
```

### Barrel re-exports

Every feature folder must have an `index.ts` barrel:

```ts
// src/components/common/index.ts
export * from "./header";
export * from "./footer";
export * from "./auth-menu";
```

Consumers import from the barrel, not the implementation file:

```ts
// ✅ Correct
import { Header, Footer } from "@/components/common";

// ❌ Wrong
import { Header } from "@/components/common/header/header";
```

### DropdownMenu → Dialog / AlertDialog (row actions)

When a `DropdownMenuItem` opens a page-level `Dialog` or `AlertDialog` (course review approve/reject, move to trash, outline add/edit, etc.):

1. Use a **non-modal** menu shell: `<DropdownMenu modal={false}>` (`CourseAdminTableActionsMenu`, `CourseOutlineRowActions`).
2. Use **`DeferredDropdownMenuItem`** (`onAction` prop) instead of raw `onClick` / inline `setTimeout`.
3. Under the hood: `deferDropdownAction()` in `src/lib/utils/defer-dropdown-action.ts` schedules the callback on the next tick so the menu layer unmounts before the dialog mounts.

Without this, Radix can leave `document.body` with `pointer-events: none` after the dialog closes — the dashboard appears frozen until reload.

**Reuse:** `DeferredDropdownMenuItem`, `deferDropdownAction`, `CourseAdminTableActionsMenu`, `CourseReviewRowActions`, `CourseOutlineRowActions`, `course-admin-all-page`, `course-admin-trash-page`. See `docs/logic-flow.md` §14.

### Popover combobox inside Dialog (taxonomy locale)

Sympton: language list under a Dialog does not scroll or accept clicks even when `CommandList` has `overflow-y-auto` and `scrollHeight > clientHeight`.

Cause: Dialog sets `body { pointer-events: none }` and only dialog content resets to `auto`. Default `PopoverContent` **portals to `body`**, so the panel inherits `none`.

Preferred fix (scoped): `PopoverContent` supports **`portal?: boolean` (default `true`)**. Taxonomy locale picker uses **`portal={false}`** so content stays in the dialog tree. Do **not** flip shared default styles on `PopoverContent` for every consumer (`SearchableSelect` and others).

Manual blast radius before editing `PopoverContent`: grep importers — currently `TaxonomyLocaleTabsSection` + `SearchableSelect`. Default `portal={true}` must keep SearchableSelect behavior unchanged. GitNexus `impact(PopoverContent)` may show 0 callers when the index is stale; trust grep until `npx gitnexus analyze` is fresh.

### Client-only libraries (Quill)

Libraries that touch `document` at import time (e.g. `quill`) **must not** use top-level `import Quill from "quill"`. Pattern used in this repo:

1. `import type Quill from "quill"` for TypeScript refs only.
2. `await ensureQuillLoaded()` from `@/lib/quill` inside `useEffect` before `new Quill(...)`.
3. Helpers in `delta-editor-quill.ts` call `getQuill()` after `ensureQuillLoaded()` has resolved.

This keeps `@/components/shared` barrel exports (including `DeltaEditor`) safe when imported from other client components during SSR module evaluation.

---

## 3. Styling Pattern

### Use `cn()` for conditional classes

```ts
import { cn } from "@/lib/utils";

<div className={cn(
  "base-styles here",
  isActive && "active-styles",
  variant === "outline" && "outline-styles",
)} />
```

### No inline styles

```ts
// ✅ Correct
<div className="flex items-center gap-2 px-4" />

// ❌ Wrong
<div style={{ display: "flex", alignItems: "center" }} />
```

### Tailwind class ordering

Follow the Tailwind CSS recommended order: layout → spacing → sizing → typography → color → effects.

---

## 4. State Management

### Rule: match state type to tool

| State type | Tool | Example |
|------------|------|---------|
| Server data (async, cached) | SWR | `useAuth`, `useCourses` |
| Global UI state (sync, no fetch) | Zustand | `useAuthStore` (modal), `useLanguageStore` (locale label/code), `useApiError`, `useStreamEventsStore` |
| Realtime push (multi-transport) | Events pipeline + hooks | `useWebSocketStreamEvent`, `useSseStreamEvent`, … |
| Local component state | `useState` | Form open/close toggles |
| URL/navigation state | `useRouter` / `usePathname` | Active nav item highlight |

### Zustand: no Provider needed

```ts
// ✅ Correct — import directly, no wrap needed
import { useAuthStore } from "@/store/auth/auth";
const { openLoginModal } = useAuthStore();
```

### Language: store + sync hook (no Context)

`useLocale()` (next-intl) is synced once in `LanguageLocaleSync` → `useLanguageStore`. Client components read via `useCustomLanguage()` (`languageCode`, `locale`, `languageLabel`). Server components use `resolveCustomLanguage(await getLocale())` from `src/lib/language/resolve-language.ts`.

**Locale links:** `LocaleSwitcher` must use `usePathname()` from `@/i18n/navigation` as `href` — never hard-code `href="/"` or switching locale always sends users to home.

### SWR: always use the endpoint key constant

```ts
// src/api/callers/auth/auth-factory.ts (+ auth-browser.ts)
export const getMeEndpointKey = "/api/v1/me"; // defined once

// In hooks or components that need to mutate
import { getMeEndpointKey } from "@/api/callers/auth/auth-factory";
mutate(getMeEndpointKey);
```

### SearchableSelect: SWR infinite list + UI hook

**Implementation (2026-06-29):** Split pattern — data layer uses `useApiInfiniteListQuery` (`useSWRInfinite` in `src/api/hooks/shared.ts`); popover UX stays in `useSearchablePaginatedOptions` (open state, debounced search input, pinned `selectedLabel`, `excludeValues`, `onOptionSelect`).

| Layer | Hook / primitive | Responsibility |
|-------|------------------|----------------|
| Data | `useApiInfiniteListQuery` | SWR infinite pages, merged `rows` (optional `getRowKey` dedupe across pages), `loadMore`, `hasMore`, `mutate` / `retry` |
| UI + wiring | `useSearchablePaginatedOptions` | Popover open/close, debounced search → SWR key, pinned label, client `excludeValues` |
| Presentational | `SearchableSelect` | `Popover` + `Command` trigger and list |

**Consumer config:** pass `getPageKey(params)` using existing caller key builders (`getInstructorRosterListKey`, `getTaxonomyListKey`, …). Do **not** pass ad-hoc `fetchPage` — SWR fetcher uses `fetchPaginatedListByKey` on the canonical URL key.

**Fetch gating:** `useSearchablePaginatedOptions` passes `enabled && open` into `useApiInfiniteListQuery` so lists are not requested while the trigger is idle. Close/reopen reuses SWR cache (`revalidateOnFocus: false`, `revalidateFirstPage: false`).

**Search:** debounced input updates the key prefix; hook resets infinite `size` to 1 when debounced search changes.

**Page merge dedupe:** pass optional `getRowKey` into `useApiInfiniteListQuery`. `useSearchablePaginatedOptions` sets `getRowKey: (item) => mapToOption(item).value` so unstable pagination or overlapping pages never surface duplicate options in the dropdown.

**Precedent:** same split as `useUserMultiSelectPickerState` + `useInstructorRosterCandidates`, but infinite scroll uses `useSWRInfinite` instead of page-number state + `useApiListQuery`.

---

## 4.1 Stream events

### Listen: channel hooks, not raw socket

```ts
// ✅ Correct
import { useWebSocketStreamEvent } from "@/hooks/events/socket";
useWebSocketStreamEvent("notification", (e) => { /* e is WebSocketStreamEvent */ });

// ❌ Wrong — bypasses normalize + store
ws.onmessage = (ev) => { /* manual JSON */ };
```

`handler` may be an inline function — `useStreamEvent` syncs it in `useEffect`. Do **not** assign `ref.current = handler` during render in custom hooks (eslint-plugin-react-hooks).

### Nhiều handler cho cùng một key (`source` + `type`)

Một event có thể có **nhiều function** xử lý. Dùng `order` (số nhỏ chạy trước). Thứ tự áp dụng **toàn app** (mọi component / mọi lần `subscribeStreamEvents`).

**Cách 1 — một hook, mảng handler** (nên `useMemo` mảng để tránh đăng ký lại mỗi render):

```ts
const handlers = useMemo(
  () => [
    { order: 0, handler: (e) => validateNotification(e) },
    { order: 10, handler: (e) => toast.info(e.payload.title) },
    { order: 20, handler: (e) => analytics.track(e.metadata.code) },
  ],
  [],
);

useWebSocketStreamEvent("notification", handlers);
```

**Cách 2 — nhiều component / nhiều hook**, cùng key, `order` khác nhau:

```ts
// Component A
useWebSocketStreamEvent("notification", {
  order: 0,
  handler: (e) => syncToStore(e),
});

// Component B
useWebSocketStreamEvent("notification", {
  order: 100,
  handler: (e) => showToast(e),
});
```

**Cách 3 — imperative** (ngoài React):

```ts
import { subscribeStreamEvents } from "@/events";

const unsub = subscribeStreamEvents({
  filter: { source: "websocket", type: "notification" },
  order: 5,
  handler: (event) => { /* ... */ },
});
// unsub() khi không cần nữa
```

### Send: typed outbound + metadata helper

```ts
import { postSocketOutbound } from "@/events";
import { nextStreamOutboundMetadata } from "@/events/core/outbound-metadata";

postSocketOutbound({
  source: "websocket",
  type: "ping",
  payload: { id: crypto.randomUUID() },
  metadata: nextStreamOutboundMetadata(),
});
```

### Define new event types

1. Add payload + map entry in `src/types/events/payloads.ts` (or channel-specific `index.ts`).
2. Add Zod schema to `inboundPayloadBySource` in `normalize-inbound.ts`.
3. Update the matching `docs/delivery/*.md` type table.

---

## 5. API Call Pattern

### Never call `fetch` / third-party HTTP clients for MyCourse API — use `api` wrappers

```ts
// ✅ Correct
import { apiFetch } from "@/api";
const { data } = await apiFetch<T>(url);

// ❌ Wrong — bypasses auth refresh / error reporting
const res = await fetch(url);
```

### Always check both HTTP error and app-level error code

```ts
const { data, error } = await apiFetch<T>(url);
if (error) { /* network/HTTP failure */ }
if (data && data.code !== 0) { /* business logic failure */ }
const payload = data?.data;
```

---

## 6. Forms Pattern

All forms use `react-hook-form` with `zodResolver`:

```ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/schema/auth/auth";

const form = useForm<LoginValues>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: "", password: "", rememberMe: false },
});
```

Validation error messages in schemas must use **i18n keys**, not hard-coded strings:

```ts
// ✅ Correct
z.string().email({ message: "validation.email" })

// ❌ Wrong
z.string().email({ message: "Please enter a valid email" })
```

Translate keys in `auth-form-fields.tsx` (`resolveAuthValidationMessage`) or shared helpers from `src/lib/utils/validation-message.ts`:
- `resolveValidationMessage()` — inline field errors (react-hook-form)
- `toastValidationError()` — pre-submit Zod `safeParse` failures (toast before API call)

Pass `error` from react-hook-form, not `t(errors.*.message)` in form shells (calling `t(undefined)` throws `MISSING_MESSAGE`).

Schemas live under `src/schema/<domain>/` (barrel `@/schema`). Each module uses its own validation namespace:

| Module | Zod path | i18n validation namespace |
|--------|----------|---------------------------|
| Auth | `schema/auth/auth.ts` | `auth.validation.*` |
| Me | `schema/me/me.ts` | `me.validation.*` |
| Media | `schema/media/media.ts` | `media.validation.*` |
| Taxonomy | `schema/taxonomy/taxonomy.ts` | `taxonomy.form.validation.*` |
| Instructor | `schema/instructor/instructor.ts` | `instructor.validation.*` |
| Course | `schema/course/course.ts` | `course.validation.*` |

**Validation keys in messages (en/vi):**

| Namespace | Keys |
|-----------|------|
| `media.validation` | `tooMany`, `fileTooLarge`, `totalTooLarge`, `executableRejected` |
| `taxonomy.form.validation` | `name`, `nameMax`, `shortDescription`, `shortDescriptionMax`, `descriptionMaxLines`, `descriptionLineMax` |
| `instructor.validation` | `email`, `rejectionReason`, `rejectionReasonMax`, `topicId`, `skillId`, `ticketSubject`, `ticketMessage` |
| `course.validation` | `title`, `titleMax`, `shortDescriptionMax`, `sectionTitle`, `lessonTitle`, `subLessonTitle`, `subLessonKind`, `quizPrompt`, `quizOptionBody`, `quizOptionsMin`, `quizCorrectAnswerRequired`, `quizSingleChoiceMultipleCorrect`, `quizPreviewNotAllowed`, `videoMediaRequired`, `textContentRequired`, `submitInvalidSubLesson`, `submitBasicInfoIncomplete`, `submitCollaboratorRequired`, `submitOutlineNoSections`, `submitOutlineNoLessons`, `submitOutlineNoItems`, `rejectReason`, `rejectReasonMax` |

Taxonomy forms resolve Zod keys via `useTranslations("taxonomy.form")` + schema key `validation.*` (same parent-namespace pattern as auth).

Use `RequiredLabel` + `FieldError` from `src/components/shared/` on required dialog fields.

---

## 6b. API Error Pattern (all modules)

Never show the BE JSON `message` to users. Resolve by numeric `code` only:

```ts
import { useTranslations } from "next-intl";
import { toastApiError, translateApiErrorCode } from "@/lib/utils/api-error";

const tErrors = useTranslations("errors.codes");

// catch after apiFetch / service call
catch (error) {
  toastApiError(tErrors, error);
}

// Server Action result (inline)
setServerError(translateApiErrorCode(tErrors, result.code));
```

- Copy: `errors.codes.{code}` in `src/messages/en.ts` / `vi.ts` (sourced from `src/messages/error-codes.ts`).
- Unknown codes fall back to `errors.codes.9999`.
- `ApiErrorCode` in `src/constants/api-error-code.ts` mirrors `be/internal/shared/errors/errcode_codes.go` 1:1.
- BE has **no** taxonomy/course/instructor-specific numeric codes — those modules reuse shared `2xxx`/`3xxx` (and media also `9011`–`9019`, including `R2BucketNotConfigured = 9019`).
- Do **not** use semantic per-module API keys (`auth.errors.emailAlreadyExists`, `media.upload.errors.*` for API responses, etc.).

---

## 7. Internationalization (i18n) Pattern

Translations live in `src/messages/en.ts` and `vi.ts` (`vi` uses `satisfies Messages`). Server bootstrap loads them via `loadMessages` in `src/lib/i18n/load-messages.ts`, called from `src/i18n/request.ts`. **No** `messages/ja.ts` and no `ja` in routing — UI chrome is `en`/`vi` only.

### UI i18n vs data locale

| Concern | Source | Used for |
|---------|--------|----------|
| UI chrome | `useTranslations` + `src/messages/{en,vi}.ts` | Buttons, labels, validation copy |
| Data / content locale | `useLocale()` → API query `locale` | Taxonomy list/picker names, instructor chips (BE translation fallback) |
| Admin taxonomy edit | `GET …?view=edit` + locale combobox only (presets from `CONTENT_LOCALE_OPTIONS`, no en/vi pill Tabs, no free-enter) | Canonical + full `translations` map (stored BCP47 may exceed UI presets for legacy rows) |

Do not conflate next-intl route locale with inventing a second FE locale store for taxonomy reads — pass `useLocale()` through callers/hooks.

### All user-visible text via `useTranslations`

```ts
import { useTranslations } from "next-intl";
const t = useTranslations("auth"); // namespace
const tErrors = useTranslations("errors.codes"); // API errors only
<p>{t("loginTitle")}</p>
<p>{tErrors("4002")}</p> // Invalid credentials
```

Two namespaces for errors — do not mix:

| Purpose | Key pattern | Example |
|---------|-------------|---------|
| API failure (BE `code`) | `errors.codes.{code}` | `tErrors("4004")` |
| Form validation (pre-submit) | `{module}.validation.*` | `tValidation("title")` |

### Navigation helpers

Always use the typed wrappers from `@/i18n/navigation`:

```ts
import { Link, useRouter } from "@/i18n/navigation"; // ✅ includes locale prefix
import { Link } from "next/link"; // ❌ breaks locale routing
```

### Never hard-code locale strings

```ts
// ✅ Correct
import { routing } from "@/i18n/routing";
const { locales, defaultLocale } = routing;

// ❌ Wrong
const locales = ["en", "vi"];
```

---

## 8. TypeScript Patterns

### Strict mode — no `any`

```ts
// ✅ Correct
function processUser(user: MeResponse): string { ... }

// ❌ Wrong
function processUser(user: any): string { ... }
```

### Type imports

```ts
// ✅ Always use `import type` for type-only imports
import type { MeResponse } from "@/types/auth/auth";
```

### Path aliases

Always use `@/` aliases — never relative path traversal beyond one level:

```ts
// ✅ Correct
import { cn } from "@/lib/utils";

// ❌ Wrong
import { cn } from "../../../../lib/utils/cn";
```

---

## 9. Cookie Handling Pattern

Always use the isomorphic helpers — never access cookies directly:

```ts
import { getCookieValue, setCookieValue } from "@/lib/utils";

// Works in both browser and server context
const token = getCookieValue("access_token");
setCookieValue("access_token", newToken, buildCookieOptions({ ... }));
```

**Server Actions only** — after login/confirm, set auth cookies via:

```ts
import { setAuthSessionCookies } from "@/lib/utils/auth-session"; // not from @/lib/utils barrel
```

`auth-session.ts` uses `next/headers` and `import "server-only"` so it must never be re-exported from the client-safe barrel.

---

## 10. Paginated list query params

Do not redefine `page` / `per_page` / `sort_by` on each module. Use `ApiListQueryParams` from `src/types/api.ts` and `apiListQueryToRecord()` from `src/lib/utils/list-query.ts`:

```ts
import type { ApiListQueryParams } from "@/types/api";
import { apiListQueryToRecord, buildQueryParams } from "@/lib/utils";

export type CourseListFilters = ApiListQueryParams;

const url = buildQueryParams("/api/v1/courses", apiListQueryToRecord(filters));
```

Media lists add optional `category` and `sort_order` on the same type (`MediaListFilters` = `ApiListQueryParams` + narrowed fields). Taxonomy keeps `sort_desc` and adds typed search fields (`search_by`, `search_value`), **`locale`**, and optional `include_images` in taxonomy filter type; shared keys are still emitted via `apiListQueryToRecord()`.

For human-readable file sizes in the UI, use `formatBytes()` from `src/lib/utils/format-bytes.ts` (exported via `@/lib/utils`). Do not copy byte-formatting logic into feature components.

## 11. Bulk user-picker confirm (partial success)

When a multi-select user picker calls a bulk add API that returns `{ added[], failed[] }`, **do not copy** toast/control-flow logic into each screen. Use `finalizeBulkUserPickerSubmit` from `@/lib/utils/user-picker-bulk-submit`:

```ts
return await finalizeBulkUserPickerSubmit<MyRowType>({
  userIds,
  submit: (ids) => myBulkService({ user_ids: ids }),
  mapSucceededIds: (added) => added.map((row) => row.id),
  afterSubmit: async () => { await mutate(); }, // optional
  toasts: {
    onSuccess: () => toast.success(t("addSuccess")),
    onAllFailed: () => toast.error(t("addAllFailed")),
    onPartialSuccess: (succeeded, failed) =>
      toast.warning(t("addPartialSuccess", { succeeded: String(succeeded), failed: String(failed) })),
    onApiError: (error) => toastApiError(tErrors, error),
  },
});
```

Wrap with local loading state (`setIsAdding(true/false)`). `afterSubmit` (e.g. `mutate()`) runs only when at least one user was added — not on all-failed. Current usage: `InstructorRosterPage`, `useCourseCollaboratorActions`.

## 12. `src/constants/` — values only

[`eslint.config.mjs`](../eslint.config.mjs) enforces **data-only** modules under `src/constants/` (no functions, type exports, or `.tsx`). Put runtime helpers in `src/lib/utils/` and shared types in `src/types/`. Details: [`docs/quality.md`](./quality.md#eslint-eslintconfigmjs).

## 13. `src/types/` — types only

Same ESLint config enforces **type-only** files under `src/types/` (no `const`, functions, or `export *`). Exception: value imports from `@/constants/**` are allowed when deriving types (e.g. `PermissionName`, `ApiErrorCodeValue`). Runtime maps like `ApiErrorCode` live in `src/constants/`; helpers like `isApiSuccess()` live in `src/lib/utils/`.

## 14. `src/screen/` — pages only

[`eslint.config.mjs`](../eslint.config.mjs) restricts each `src/screen/**` module folder to **`index.ts`** plus **`page.tsx`** or **`*-page.tsx`** only. Put reusable UI in `src/components/`. Details: [`docs/quality.md`](./quality.md#srcscreen--page-files-only).

---

## 15. Slug fields

Taxonomy and course-create slugs are **read-only** in the UI. Show a live preview with `generateSlug(name)` / `slugifyName(name)` while the user types the name or title. **Do not send `slug` in create/update API payloads** — the backend computes the persisted slug with `utils.SlugifyName`. Use one shared `TaxonomyTreeNode` type (`slug?` optional on write); strip slugs with `toTaxonomyTreeWritePayload()` before taxonomy mutations. Do not expose an editable slug input or duplicate tree node types.

---

## 16. Adding New Features Checklist

Before writing code for a new feature:

- [ ] Read `docs/` — check architecture, flow, components, patterns
- [ ] Run `npx gitnexus analyze --force` — understand impact
- [ ] Before PR: **`npm run check-all`** (CI `test` on `dev` runs **`npm run test-all`**) — optionally `npm run fix:biome` first; see [`quality.md`](./quality.md)
- [ ] Reuse utilities from `src/lib/utils/` (barrel) or direct paths for server-only files (`auth-session.ts`)
- [ ] Place server data fetching in `src/api/callers/<domain>/`
- [ ] Place SWR hooks in `src/api/hooks/<domain>/`
- [ ] Place Server Actions in `src/actions/<domain>/`
- [ ] Place Zustand stores in `src/store/`
- [ ] Add new i18n strings to both `en.ts` and `vi.ts` (keep `vi.ts` satisfying `Messages`)
- [ ] Add/update route values in `src/constants/route.ts` (`PUBLIC_ROUTES`, `PRIVATE_ROUTES`, `PUBLIC_RESOURCE_ROUTES`, `PRIVATE_RESOURCE_ROUTES`)
- [ ] Build runtime URLs through `src/lib/navigation/routes.ts` helpers (no route string interpolation in screens/components)
- [ ] Add API route constants to `src/constants/api-route.ts`
- [ ] Update `docs/` after implementation
