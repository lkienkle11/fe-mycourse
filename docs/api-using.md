# API Usage Patterns (`fe-mycourse`)

_Last audited: 2026-07-22 (server sanitized logs; browser no custom Console; compress body memo retained). Prior: raw GET cache; media 30s._


How the frontend communicates with the Go backend API. All patterns described here apply to both client-side (browser) and server-side (Server Actions / RSC) contexts.

---

## Base URL

```
NEXT_PUBLIC_API_URL       # e.g. https://api.yourdomain.net
API_URL                   # Server-side fallback (pure SSR contexts)
```

Set in `.env` or the deployment environment. Never hard-code these values.

---

## API Layer Overview

```
src/api/
├── index.ts / cache.ts
├── core/           # fetch policy/error, helpers, body, redirect policy, methods, raw-http
├── xior/           # exact-pinned raw/auth client factory and lifecycle interceptors
├── transport/      # api-transport, browser-api-methods
├── auth/           # auth-refresh, auth-runtime, browser-auth, server-auth
├── server/         # cache-policy, server-raw-http
├── callers/        # Domain create*Callers + browser-bound services
└── hooks/          # SWR hooks
```

---

## Response Envelope

All Go backend responses follow this shape:

```ts
interface ApiResponse<T> {
  code: number;     // 0 = success, non-zero = application error
  message: string;  // Human-readable status
  data: T;          // Payload (null on error)
}
```

The `ApiErrorCode` constant map in `src/constants/api-error-code.ts` mirrors `be/internal/shared/errors/errcode_codes.go` (1:1 numeric codes).

```ts
import { ApiErrorCode } from "@/constants/api-error-code";
if (result.code === ApiErrorCode.Unknown) { ... }
```

---

## Standard API Call Methods

Import from `@/api`:

```ts
import { apiFetch, apiPost, apiPut, apiDelete, apiOptions } from "@/api";
```

All return `ApiResult<T>`:

```ts
type ApiResult<T> = {
  data: T;
  statusCode: number;
  headers: Record<string, string>;
  cookies: Record<string, string>;
};
```

### Pattern: Fetch data (GET)

```ts
try {
  const { data } = await apiFetch<ApiResponse<CourseListResponse>>("/api/v1/courses");
  if (data.code !== 0) {
    // handle business error
  }
  const courses = data.data;
} catch (error) {
  // handle transport/HTTP error
}
```

### Pattern: Submit data (POST)

```ts
const { data, error } = await apiPost<LoginResponse>("/api/v1/auth/login", {
  email,
  password,
  remember_me: rememberMe,
});
```

### Pattern: Update (PUT)

```ts
const { data, error } = await apiPut<CourseResponse>(`/api/v1/courses/${id}`, payload);
```

### Pattern: Delete (DELETE)

```ts
const { data, error } = await apiDelete(`/api/v1/courses/${id}`);
```

---

## Route Constants

Never hard-code API paths. Use the constants from `src/constants/api-route.ts`:

```ts
import { API_PUBLIC_ROUTES, API_PRIVATE_ROUTES } from "@/constants/api-route";

// Public (no auth required)
API_PUBLIC_ROUTES.auth.login        // POST /api/v1/auth/login
API_PUBLIC_ROUTES.auth.register     // POST /api/v1/auth/register
API_PUBLIC_ROUTES.auth.confirm      // POST /api/v1/auth/confirm
API_PUBLIC_ROUTES.auth.logout       // POST /api/v1/auth/logout
API_PUBLIC_ROUTES.auth.refresh      // POST /api/v1/auth/refresh
API_PUBLIC_ROUTES.auth.google       // POST /api/v1/auth/google         (Google auth-code)
API_PUBLIC_ROUTES.auth.googleOnetap // POST /api/v1/auth/google/onetap  (Google One Tap credential)
API_PUBLIC_ROUTES.auth.discord      // POST /api/v1/auth/discord          (Discord OAuth code)
API_PUBLIC_ROUTES.auth.x            // POST /api/v1/auth/x              (X/Twitter code + PKCE verifier; retained, not wired to popup)
// Note: /api/v1/auth/google/mobile exists on the BE for native mobile apps only — it is
// intentionally NOT surfaced in the web FE route map (no web caller).

// Private (requires Authorization header)
API_PRIVATE_ROUTES.user.getMe   // GET /api/v1/me
```

Add new constants here when new API endpoints are used.

---

## Authentication — How Tokens Are Attached

Each authenticated `ApiTransport.request` creates an isolated Xior executor whose request interceptor handles this automatically:

```
Every request
  └─ Server (RSC/Action): request interceptor asks the request-scoped
      runtime to read next/headers cookie and sets
      Authorization: Bearer <access_token>
  └─ Client (browser): credentials:include; BE reads HttpOnly cookies
      directly (no manual Authorization header)
```

You do **not** need to manually set the Authorization header.

Xior's response interceptor preserves non-2xx responses for the typed project error mapper. Token refresh and the one protected-request retry remain in `ApiTransport`; no Xior retry, refresh, cache, dedupe, throttle or progress plugin is enabled.

Authenticated default timeout is **10s**. Override per call with `options.timeout` (milliseconds), e.g. `apiPost(url, body, { timeout: 30_000 })`. Media upload uses this for large multipart posts.

Optional **`compress?: boolean`** on `MutationApiOptions` / `RawMutationApiOptions` (default **false**). When `true`, only JSON bodies for POST/PUT/PATCH are gzipped **once** with `CompressionStream("gzip")` into a replayable byte body reused for refresh retry and redirect hops. Keeps `Content-Type: application/json`, adds `Content-Encoding: gzip`, does not set `Content-Length`. After merging caller headers, fetch-core **forces** `Content-Encoding: gzip` and removes any caller `Content-Length` when the body is gzipped (prevents overwrite / length mismatch). Compression starts only after the request abort/timeout lifecycle is armed and aborts with the request. FormData/file upload, GET, DELETE, OPTIONS are never compressed. **No production caller sets `compress: true` yet** — BE does not decompress gzip; current flows stay uncompressed.

---

## Token Refresh

The authenticated transport in `src/api/transport/api-transport.ts` handles silent token refresh automatically:

- Triggers on eligible `401` / `403` responses (`X-Token-Expired: true` or `401` missing bearer token).
- **Client**: uses a mutex (single refresh, queued requests) to avoid refresh stampedes.
- **Client refresh transport**: browser calls FE proxy `POST /api/auth/refresh`; proxy relays tokens and rewrites cookies using BE `Set-Cookie` Max-Age or `auth_session_expires_at` fallback.
- **Server (SSR)**: writable FromRequest transport persists rotated cookies via `setAuthSessionCookies` (same Max-Age relay).
- **Refresh upstream (BFF + server writable)**: `rawPostRefreshUpstream` in `src/api/auth/refresh-upstream-raw.ts` (not public `rawPost` options) hard-codes fail-closed `redirect: "error"` + trusted origin from the resolved API base URL.
- After refresh: all queued requests are retried with the new token.
- On refresh failure: all requests reject and `reportError` is called.

You do **not** need to implement retry logic — it is handled transparently.

---

## Server Actions Pattern

For sensitive operations (login, signup), use Next.js Server Actions instead of direct API calls from the browser. This proxies the request through the Next.js server, hiding the API URL and tokens from the browser network panel.

```ts
// src/actions/auth/auth.ts
"use server";

export async function loginAction(payload: LoginPayload): Promise<AuthActionResult> {
  const { data, error } = await loginService(payload);
  if (error || data?.code !== 0) {
    return { success: false, message: data?.message ?? "Login failed", code: data?.code ?? ApiErrorCode.Unknown };
  }
  // Set cookies via next/headers
  const cookieStore = await cookies();
  cookieStore.set("access_token", data.data.access_token, buildCookieOptions(...));
  return { success: true, message: data.message, code: 0 };
}
```

Call from a client component:

```ts
"use client";
import { loginAction } from "@/actions/auth/auth";

const result = await loginAction({ email, password, remember_me: rememberMe });
if (!result.success) { /* show error */ }
```

---

## OAuth Server Actions (Google + Discord + X)

Google, Discord, and X (Twitter) social login use Server Actions that reuse the same session-cookie handling as email login. All actions return `AuthActionResult` (`{ success, message, code }`).

> **Popup wiring:** `LoginContent` / `SignupContent` call **`useDiscordLogin`** + **`useGoogleLogin`** only. X actions/hooks remain but are not connected to `AuthSocialLogin`.

### Callers (`src/api/callers/auth/auth-factory.ts` + `auth-browser.ts`)

Factory (`createAuthCallers`) is isomorphic. Browser singletons live in `auth-browser.ts`. Server Actions import **`@/api/callers/auth/auth-factory` only**.

| Service | Method | Path constant | Payload |
|---------|--------|---------------|---------|
| `googleLoginService` | POST | `API_PUBLIC_ROUTES.auth.google` | `{ code, remember_me }` |
| `googleOneTapService` | POST | `API_PUBLIC_ROUTES.auth.googleOnetap` | `{ credential }` |
| `discordLoginService` | POST | `API_PUBLIC_ROUTES.auth.discord` | `{ code, remember_me, entrypoint }` |
| `xLoginService` | POST | `API_PUBLIC_ROUTES.auth.x` | `{ code, code_verifier, remember_me, entrypoint }` |

Each returns `{ data: ApiResponse<LoginResponse>, setCookieHeaders }` — the same shape as `loginService`, so the shared finalizer can set the session cookies.

### Actions

| Action | File | Responsibility |
|--------|------|----------------|
| `googleLoginAction({ code, remember_me })` | `src/actions/auth/google-oauth.ts` | Exchange the GSI auth code → `finalizeAuthLoginAction(googleLoginService)` |
| `googleOneTapAction({ credential })` | `src/actions/auth/google-oauth.ts` | Verify the One Tap ID credential → `finalizeAuthLoginAction(googleOneTapService)` |
| `startDiscordLoginAction({ entrypoint, remember_me })` | `src/actions/auth/discord-oauth.ts` | Generate random `state`, store it with `entrypoint` / `remember_me` in short-lived (`600s`) HttpOnly cookies, and return the Discord authorize URL. `redirect_uri` is **`NEXT_PUBLIC_DISCORD_CALLBACK_URL`** (canonical; must match BE `DISCORD_CALLBACK_URL` byte-for-byte). Missing client id or callback URL → `ApiErrorCode.DiscordOAuthStartFailed` (4026, FE-local). |
| `discordLoginAction({ code, state })` | `src/actions/auth/discord-oauth.ts` | Validate `state` against the cookie, then `finalizeAuthLoginAction(discordLoginService)` with stored `entrypoint` / `remember_me`; clears OAuth cookies afterward. Mismatched/expired state → `ApiErrorCode.InvalidOAuthState` (4018, FE-local) |
| `startXLoginAction({ entrypoint, remember_me })` | `src/actions/auth/x-oauth.ts` | *(Retained, not wired to popup.)* Generate PKCE verifier/challenge + random state, store them in short-lived (`600s`) HttpOnly cookies, and return the X authorize URL. `redirect_uri` is **`NEXT_PUBLIC_X_CALLBACK_URL`** (canonical; must match BE `X_CALLBACK_URL` byte-for-byte). |
| `xLoginAction({ code, state })` | `src/actions/auth/x-oauth.ts` | *(Retained, not wired to popup.)* Validate `state` against the cookie, then `finalizeAuthLoginAction(xLoginService)` with the stored `code_verifier` / `entrypoint` / `remember_me`; clears OAuth cookies afterward. Mismatched/expired state → `ApiErrorCode.InvalidOAuthState` (4018, FE-local) |

### Shared finalizer (`src/lib/utils/auth-action.ts`)

`loginAction`, `confirmAction`, and all OAuth actions call `finalizeAuthLoginAction(serviceCall)`. On `code === Success` with data it sets session cookies via `setAuthSessionCookies` (using `refreshMaxAgeFromBeSetCookie(setCookieHeaders)`). Errors map through shared `mapAuthApiError` to `AuthActionResult` (`src/types/auth/auth.ts`); register uses `mapAuthApiError(error, { includeRetryAfter: true })`. Reuse this helper for any new login-like action.

### Client wiring

Client components never call the actions directly for the popup flows — they use the hooks in `src/hooks/auth/` (`useGoogleLogin`, `useGoogleOneTap`, `useDiscordLogin`, `useXLogin`, `useOAuthPostAuth`). See `docs/components.md` (Auth OAuth hooks) and `docs/screens.md` (social login behavior). OAuth failures resolve to `errors.codes.*` (BE codes **4013–4017/4019**, **4023–4025**; FE-local **4018**, **4020–4022**, **4026**); success/cancel toasts use `auth.socialLogin.*`.

---

## SWR Hooks Pattern

### Global SWR defaults (`AppProviders`)

`src/components/providers/app-providers.tsx` wraps the app in `SWRConfig` with shared defaults from `src/constants/swr.ts`:

| Option | Value | Purpose |
|--------|-------|---------|
| `revalidateOnFocus` | `false` | Avoid refetch storms when the user switches browser tabs |
| `dedupingInterval` | `30_000` ms | Dedupe identical in-flight keys within 30 s |
| `errorRetryInterval` | `180_000` ms (3 min) | When SWR retries after a fetch error, wait 3 minutes between attempts (SWR default is 5 s) |

Hooks may override these per subscription. Examples:

- `useAuth` — `revalidateOnFocus: true`, `shouldRetryOnError: false` (session refresh on tab focus; no error retry loop).
- `useMyInstructorApplication` — inherits global `revalidateOnFocus: false`, `shouldRetryOnError: false`; exposes **bootstrap-only** `isLoading` (see `docs/instructor-application.md`).
- Hooks that omit `shouldRetryOnError: false` inherit SWR’s default retry-on-error behaviour but use the **3-minute** `errorRetryInterval` instead of 5 seconds.

Use SWR hooks for data that needs to be reactive (e.g. current user state).

```ts
// Using the built-in useAuth hook
import { useAuth } from "@/api/hooks/auth";
const { me, isLoading, error, mutate } = useAuth();
```

Creating a new SWR hook:

```ts
// src/api/hooks/course/useCourses.ts
import useSWR from "swr";
import { getMeEndpointKey } from "@/api/callers/auth/auth-factory";
import { apiFetch } from "@/api";

const COURSES_KEY = "/api/v1/courses";

export function useCourses() {
  return useSWR(COURSES_KEY, () => apiFetch<CourseListResponse>(COURSES_KEY), {
    shouldRetryOnError: false,
  });
}
```

**Rules:**
- Define the SWR key as a named constant (re-usable for `mutate(key)` calls).
- Place the fetcher function in `src/api/callers/<domain>/<domain>.ts`.
- Place the hook in `src/api/hooks/<domain>/use<Domain>.ts`.

### Course collaborators (instructor editor)

Callers in `src/api/callers/course/course-factory.ts (+ course-browser.ts)`:

| Service | Method | Path | Notes |
|---------|--------|------|-------|
| `listCourseCollaboratorsService` | GET | `/api/v1/courses/:courseId/collaborators` | Paginated (`page`, `per_page`, optional `search`); returns `ApiPaginatedData<CourseCollaborator[]>` |
| `listCourseInstructorCandidatesService` | GET | `/api/v1/courses/:courseId/instructor-candidates` | Requires `course_collaborator_candidate:read` (P67); owner-only on BE; paginated picker source |
| `addCourseCollaboratorsBulkService` | POST | `/api/v1/courses/:courseId/collaborators/bulk` | Bulk add; returns `added` + `failed[]` |
| `removeCourseCollaboratorService` | DELETE | `/api/v1/courses/:courseId/collaborators/:userId` | |

Hooks: `useCourseCollaborators`, `useCourseInstructorCandidates` in `src/api/hooks/course/`. Filter params reuse `ApiListQueryParams` (`page`, `per_page`, `search`). Picker API requires **`course_collaborator_candidate:read` (P67)**. Bulk add partial-success UX uses `finalizeBulkUserPickerSubmit` (`src/lib/utils/user-picker-bulk-submit.ts`) via `useCourseCollaboratorActions`. UI: `CourseCollaboratorsTab`, `CourseCollaboratorPickerDialog` (closes only after successful multi-add; errors keep dialog open; `PermissionGate` on add/picker for owners).

### Course-admin (sysadmin catalog + trash)

Callers in `src/api/callers/course/course-factory.ts (+ course-browser.ts)`:

| Service | Method | Path |
|---------|--------|------|
| `listAdminCoursesService` | GET | `/api/v1/course-admin/courses` |
| `listTrashedCoursesService` | GET | `/api/v1/course-admin/courses/trash` |
| `trashCourseService` | POST | `/api/v1/course-admin/courses/:courseId/trash` |
| `restoreTrashedCourseService` | POST | `/api/v1/course-admin/courses/:courseId/restore` |
| `permanentDeleteTrashedCourseService` | DELETE | `/api/v1/course-admin/courses/:courseId/permanent` |

Hooks in `src/api/hooks/course/useCourses.ts`: `useAdminCourses`, `useTrashedCourses`. After trash/restore/delete, call `mutate` on the relevant SWR keys.

**List response (`CourseListItem`):** admin catalog, trash, and review queue (`GET /course-reviews/pending`) return items with `owner_user_id` plus optional `owner_display_name` (owner display name from BE; same source as collaborator `display_name`). Admin/review table columns render `owner_display_name` and fall back to `owner_user_id` when empty (`buildCourseAdminListColumns`).

Eligibility helper: `canMoveCourseToTrash` in `src/lib/utils/course.ts` (mirrors BE trash rules for UI).

---

## Error Handling

Client-side **abnormal** API errors are pushed to `useApiError` by the browser-installed reporter. Server path never imports Zustand. Reporter messages are FE-owned (`HTTP ${status}` / transport-typed); never BE body `message`, tokens, cookies, session IDs, Authorization headers, or sensitive bodies.

**Classification** (`reportApiError` in `api-transport.ts` — no logging env vars / feature flags):

| Class | Examples | Console `[API]` | Zustand |
|-------|----------|-----------------|---------|
| Expected | guest `GET /api/v1/me` → 401; `ERR_BLOCKED_BY_CLIENT`; `ApiRefreshRequiredError` | never | never |
| Logged | other **4xx**; **5xx**; timeout; **abort**; **network** (non-blocked); **parse**; policy; replay | **`isServer()` OR `NODE_ENV === "development"`** | browser yes |

Production **browser**: **0** custom `[API]` Console (manual reporter only). Server / development: sanitized Console for the logged set. Do not blanket-skip all `status < 500`. `toastApiError`: i18n from `code`; development may `console.debug({ code, message })`.

Do not silence bad navigations by hiding console — prevent missing-route Links/prefetch instead (see `docs/screens.md` / `docs/router.md`).

```ts
import { useApiError } from "@/store/api-error-store";
const { lastError, errors, clear } = useApiError();
```

For component-level error handling, catch transport throws or check application `code`:

```ts
try {
  const { data } = await apiFetch<ApiResponse<T>>(url);
  if (data.code !== 0) {
    // Application-level error — use toastApiError / translateApiErrorCode, never data.message
  }
} catch (error) {
  // Network / HTTP-level error (ApiHttpError / ApiTransportError)
  toastApiError(tErrors, error);
}
```

---

## Pagination

Paginated responses return `ApiPageInfo` alongside the data:

```ts
interface ApiPageInfo {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}
```

Shared list filters mirror BE pagination query params (`page`, `per_page`, `search`, `status`, `sort_by`, `sort_desc`, and for media also `sort_order`, `category`):

```ts
import type { ApiListQueryParams } from "@/types/api";
import { apiListQueryToRecord, buildQueryParams } from "@/lib/utils";

const filters: ApiListQueryParams = {
  page: 1,
  per_page: 20,
  status: "ACTIVE",
  sort_by: "name",
  sort_desc: false,
};

const url = buildQueryParams("/api/v1/taxonomy/levels", apiListQueryToRecord(filters));
```

Domain modules may alias or extend this shape. Taxonomy extends it with `search_by` + `search_value`, optional `include_images` (pass `false` to skip image URL hydration on list — used by course editor info tab pickers), and **`locale`** (from `useLocale()` for resolved labels).

---

## Course detail (instructor)

Callers: `src/api/callers/course/course-factory.ts (+ course-browser.ts)`, hook `useCourseDetail` in `src/api/hooks/course/useCourses.ts`.

```ts
// Course editor — one fetch per courseId, SWR cache shared across tabs
const { data } = useCourseDetail(courseId);

// Optional lighter payload for non-editor callers only
const { data } = useCourseDetail(courseId, { includeOutline: false });
```

`getCourseDetailKey` appends `include_outline=false` when `includeOutline === false`. **Editor must not** vary this by tab — route-backed tabs (`/info`, `/outline`, …) remount the page; a stable key avoids refetch + skeleton on tab switch.

---

## Taxonomy (admin)

Callers live in `src/api/callers/taxonomy/taxonomy-factory.ts (+ taxonomy-browser.ts)`. List data uses the paginated envelope (`data.result` + `data.page_info`). Hooks and services **pass `locale`** (typically `useLocale()`).

```ts
import {
  listTaxonomyService,
  getTaxonomyDetailService,
  createTaxonomyService,
  updateTaxonomyService,
} from "@/api/callers/taxonomy";
import { useTaxonomyList } from "@/api/hooks/taxonomy/useTaxonomy";

// SWR list hook — localized display columns
const { rows, pageInfo, mutate } = useTaxonomyList("levels", {
  page: 1,
  per_page: 20,
  status: "ACTIVE",
  locale: "vi",
});

// Course editor info tab pickers (no image hydration)
useTaxonomyList("topics", {
  page: 1,
  per_page: 100,
  include_images: false,
  locale: "vi",
});

// Admin edit — full translations + row_version (list row is not enough)
const detail = await getTaxonomyDetailService("levels", id, { view: "edit" });

// Create / update (update sends expected_row_version)
await createTaxonomyService("tags", {
  name: "React",
  translations: { en: { name: "React" }, vi: { name: "React" } },
  status: "ACTIVE",
});
await updateTaxonomyService("tags", id, {
  translations: { vi: { name: "Phản ứng" } },
  expected_row_version: detail.row_version,
});
```

| Call | Purpose |
|------|---------|
| `listTaxonomyService` / `useTaxonomyList` | Localized list (`locale`); optional `include_images` |
| `getTaxonomyDetailService` | `locale` → public/localized shape; `view: "edit"` → canonical + `translations` + tree translations + `row_version` |

Routes are declared in `API_PRIVATE_ROUTES.taxonomy` (`src/constants/api-route.ts`). Resource tables live in `src/constants/taxonomy/resources.ts` (`TAXONOMY_RESOURCES`, `TAXONOMY_RESOURCE_KEYS`); lookup helpers are `getTaxonomyResourceConfig()` / `getTaxonomySearchableColumns()` in `src/lib/utils/taxonomy/`. Types (`TaxonomyResourceConfig`, `TaxonomyListColumn`, `TaxonomyListFilters.include_images` / `locale`, …) are in `src/types/taxonomy/`. List callers reuse `apiListQueryToRecord()` and append taxonomy typed-search + `locale` fields in caller scope. UI entry points: `src/screen/common/taxonomy/taxonomy-list-page.tsx` via app routes under `src/app/[locale]/{admin,sysadmin}/taxonomy/*/page.tsx`; course editor info tab via `editor-page.tsx`.

See also `docs/taxonomy-admin.md`, `docs/instructor-admin.md`.

---

## Media (library popup)

Callers live in `src/api/callers/media/media-factory.ts (+ media-browser.ts)`. List uses the same `apiListQueryToRecord()` helper as taxonomy.

Authenticated transport default timeout is **10s**. Multipart upload must pass a longer per-request `timeout` — `uploadMediaFiles` uses **30_000 ms** via `apiPost(..., { timeout: MEDIA_UPLOAD_TIMEOUT_MS })`. Other authenticated calls omit `timeout` and keep the default.

```ts
import { listMediaFiles, uploadMediaFiles, deleteMediaFile } from "@/api/callers/media";
import { useMediaFiles } from "@/api/hooks/media/useMediaFiles";

const { rows, mutate } = useMediaFiles({
  page: 1,
  per_page: 20,
  category: "image",
  sort_by: "created_at",
  sort_order: "desc",
});

await uploadMediaFiles(fileList); // multipart field `files`; 30s timeout
await deleteMediaFile(objectKey); // path param is object_key, not UUID
```

Routes: `API_PRIVATE_ROUTES.media` (`files`, `fileById`). Batch delete route constant exists for future use; UI deletes one file at a time via `DELETE .../:objectKey`.

See `docs/media-collection.md`.

---

## API error i18n (all modules)

Never show the BE `message` field to users. Resolve errors by numeric `code` only. The authenticated transport reporter also must not put BE `message` into console or Zustand — only status + `appCode` (or FE transport-typed messages).

```ts
import { useTranslations } from "next-intl";
import { toastApiError, translateApiErrorCode } from "@/lib/utils/api-error";

const tErrors = useTranslations("errors.codes");

// Toast (catch blocks)
catch (error) {
  toastApiError(tErrors, error);
}

// Inline (Server Action results)
setServerError(translateApiErrorCode(tErrors, result.code));
```

- i18n keys: `errors.codes.{code}` in `src/messages/en.ts` / `vi.ts` (sourced from `src/messages/error-codes.ts`).
- Unknown codes fall back to `errors.codes.9999`.
- FE form validation uses separate namespaces (`auth.validation.*`, `course.validation.*`, …) — never mix with API codes.

---

## Me API (`/api/v1/me`)

Routes in `API_PRIVATE_ROUTES.user`: `getMe`, `patchMe`, `deleteMe`, `hardDeleteMe`, `getMyPermissions`.

Callers in `src/api/callers/auth/auth-factory.ts (+ auth-browser.ts)`:

```ts
import {
  getMeService,
  patchMeService,
  deleteMeService,
  hardDeleteMeService,
  getMyPermissionsService,
} from "@/api/callers/auth";
```

`useAuth` exposes `errorCode` for non-401 GET failures. PATCH body: `{ avatar_file_id?: uuid }` (optional).

---

## Raw helpers (`rawFetch` / `rawPost` / …)

Public options: `headers`, `cookies`, `params`, `timeout`, `withCredentials`, `baseURL`, `signal`, and optional **`cache?: RequestCache`**.

| Request | When `cache` omitted | When `cache` set |
|---|---|---|
| `rawFetch` (GET) | Browser: omit Fetch cache (HTTP semantics). Server: `no-store` | Use caller value (e.g. `"force-cache"`) — **GET only** |
| POST/PUT/PATCH/DELETE/OPTIONS | Always `no-store` | Ignored; still `no-store` |

```ts
import { rawFetch } from "@/api/core/raw-http";

await rawFetch(url); // defaults unchanged
await rawFetch(url, { cache: "force-cache" }); // opt-in browser/HTTP cache mode
```

**TTL caveat:** approving `cache` on `RawApiOptions` does **not** make `force-cache` expire after 30 seconds. Exact TTL still needs response `Cache-Control: max-age=30`, an app Cache Storage timestamp, or Next `revalidate: 30` via `serverRawFetch` profiles. Fetch `cache` alone is opt-in browser cache, not a precise TTL.

---

## Do Not Use

| Pattern | Reason |
|---------|--------|
| Direct `fetch` / third-party HTTP for MyCourse API | Bypasses transport — use `apiFetch`/`apiPost`/etc. |
| Hard-coded API paths | Use constants from `src/constants/api-route.ts` |
| `rawPost`/`rawFetch` for private MyCourse routes | Reserved for refresh/third-party only (`remote-data.ts`, `wikidata-company.ts`) — never for private API routes |
| Manual `Authorization` header | Set automatically by the authenticated transport |
| Showing `response.message` in UI | Use `toastApiError` / `translateApiErrorCode` with `errors.codes.{code}` |
| Semantic error keys per module (`auth.errors.*` for API) | API errors use numeric `errors.codes.*` only |
