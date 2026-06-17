# API Usage Patterns (`fe-mycourse`)

_Last audited: 2026-06-08 (code-based API errors + `/api/v1/me` callers)._


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
├── instance.ts         # Axios instance + request/response interceptors
├── axios-helpers.ts    # Shared header/cookie helpers (methods + raw-http)
├── methods.ts          # apiFetch / apiPost / apiPut / apiPatch / apiDelete / apiOptions
├── raw-http.ts         # rawFetch / rawPost (interceptor-free, for token refresh only)
├── callers/            # Domain-specific service functions
└── hooks/              # SWR hooks built on top of service functions
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
API_PUBLIC_ROUTES.auth.login    // POST /api/v1/auth/login
API_PUBLIC_ROUTES.auth.register  // POST /api/v1/auth/register
API_PUBLIC_ROUTES.auth.confirm   // POST /api/v1/auth/confirm
API_PUBLIC_ROUTES.auth.logout    // POST /api/v1/auth/logout
API_PUBLIC_ROUTES.auth.refresh  // POST /api/v1/auth/refresh

// Private (requires Authorization header)
API_PRIVATE_ROUTES.user.getMe   // GET /api/v1/me
```

Add new constants here when new API endpoints are used.

---

## Authentication — How Tokens Are Attached

The Axios request interceptor in `src/api/instance.ts` handles this automatically:

```
Every request
  └─ interceptor reads access_token cookie
      ├─ Client (browser): js-cookie → Cookies.get("access_token")
      └─ Server (RSC/Action): next/headers → cookies().get("access_token")
  └─ If token exists → sets: Authorization: Bearer <access_token>
```

You do **not** need to manually set the Authorization header.

---

## Token Refresh

The response interceptor in `src/api/instance.ts` handles silent token refresh automatically:

- Triggers on `401` / `403` responses when `refresh_token` and `session_id` cookies are present.
- **Client**: uses a mutex (single refresh, queued requests) to avoid refresh stampedes.
- **Server**: per-request isolation, no mutex needed.
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

## SWR Hooks Pattern

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
import { getMeEndpointKey } from "@/api/callers/auth/auth";
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

### Course-admin (sysadmin catalog + trash)

Callers in `src/api/callers/course/course.ts`:

| Service | Method | Path |
|---------|--------|------|
| `listAdminCoursesService` | GET | `/api/v1/course-admin/courses?approval=` |
| `listTrashedCoursesService` | GET | `/api/v1/course-admin/courses/trash` |
| `trashCourseService` | POST | `/api/v1/course-admin/courses/:courseId/trash` |
| `restoreTrashedCourseService` | POST | `/api/v1/course-admin/courses/:courseId/restore` |
| `permanentDeleteTrashedCourseService` | DELETE | `/api/v1/course-admin/courses/:courseId/permanent` |

Hooks in `src/api/hooks/course/useCourses.ts`: `useAdminCourses`, `useTrashedCourses`. After trash/restore/delete, call `mutate` on the relevant SWR keys.

Eligibility helper: `canMoveCourseToTrash` in `src/lib/utils/course.ts` (mirrors BE trash rules for UI).

---

## Error Handling

Client-side API errors are pushed to `useApiError` store by the response interceptor (server-side path only logs and returns):

```ts
import { useApiError } from "@/store/api-error-store";
const { lastError, errors, clear } = useApiError();
```

For component-level error handling, check `ApiResult.error` or `ApiResult.data.code`:

```ts
const { data, error } = await apiFetch<T>(url);
if (error) {
  // Network / HTTP-level error (AxiosError)
}
if (data && data.code !== 0) {
  // Application-level error (business logic)
  toast.error(data.message);
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

Domain modules may alias or extend this shape. Taxonomy extends it with `search_by` + `search_value`.

---

## Taxonomy (admin)

Callers live in `src/api/callers/taxonomy/taxonomy.ts`. List data uses the paginated envelope (`data.result` + `data.page_info`).

```ts
import { listTaxonomyService, createTaxonomyService } from "@/api/callers/taxonomy";
import { useTaxonomyList } from "@/api/hooks/taxonomy/useTaxonomy";

// SWR list hook
const { rows, pageInfo, mutate } = useTaxonomyList("levels", {
  page: 1,
  per_page: 20,
  status: "ACTIVE",
});

// One-off service call
await createTaxonomyService("tags", {
  name: "React",
  status: "ACTIVE",
});
```

Routes are declared in `API_PRIVATE_ROUTES.taxonomy` (`src/constants/api-route.ts`). Resource tables live in `src/constants/taxonomy/resources.ts` (`TAXONOMY_RESOURCES`, `TAXONOMY_RESOURCE_KEYS`); lookup helpers are `getTaxonomyResourceConfig()` / `getTaxonomySearchableColumns()` in `src/lib/utils/taxonomy.ts`. Types (`TaxonomyResourceConfig`, `TaxonomyListColumn`, …) are in `src/types/taxonomy/`. List callers reuse `apiListQueryToRecord()` and append taxonomy typed-search fields (`search_by`, `search_value`) in caller scope. UI entry points: `src/screen/common/taxonomy/taxonomy-list-page.tsx` via role wrappers in `src/screen/{admin,sysadmin}/taxonomy/*/page.tsx`.

See also `docs/taxonomy-admin.md`, `docs/instructor-admin.md`.

---

## Media (library popup)

Callers live in `src/api/callers/media/media.ts`. List uses the same `apiListQueryToRecord()` helper as taxonomy.

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

await uploadMediaFiles(fileList); // multipart field `files`
await deleteMediaFile(objectKey); // path param is object_key, not UUID
```

Routes: `API_PRIVATE_ROUTES.media` (`files`, `fileById`). Batch delete route constant exists for future use; UI deletes one file at a time via `DELETE .../:objectKey`.

See `docs/media-collection.md`.

---

## API error i18n (all modules)

Never show the BE `message` field to users. Resolve errors by numeric `code` only:

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

Callers in `src/api/callers/auth/auth.ts`:

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

## Do Not Use

| Pattern | Reason |
|---------|--------|
| Direct `axios` calls | Bypasses interceptors — use `apiFetch`/`apiPost`/etc. |
| Hard-coded API paths | Use constants from `src/constants/api-route.ts` |
| `rawPost`/`rawFetch` outside `instance.ts` | Reserved for token refresh only |
| Manual `Authorization` header | Set automatically by the request interceptor |
| Showing `response.message` in UI | Use `toastApiError` / `translateApiErrorCode` with `errors.codes.{code}` |
| Semantic error keys per module (`auth.errors.*` for API) | API errors use numeric `errors.codes.*` only |
