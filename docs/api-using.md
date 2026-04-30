# API Usage Patterns (`fe-mycourse`)

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
├── methods.ts          # apiFetch / apiPost / apiPut / apiDelete / apiOptions
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

The `ApiErrorCode` constant map in `src/types/api.ts` mirrors `be/pkg/errcode/codes.go`.

```ts
import { ApiErrorCode } from "@/types/api";
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
  data: ApiResponse<T> | null;
  error: AxiosError | null;
};
```

### Pattern: Fetch data (GET)

```ts
const { data, error } = await apiFetch<CourseListResponse>("/api/v1/courses");
if (error || !data || data.code !== 0) {
  // handle error
}
const courses = data.data;
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
API_PUBLIC_ROUTES.auth.signup   // POST /api/v1/auth/signup
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
import { useAuth } from "@/api";
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

---

## Error Handling

All API errors are automatically pushed to `useApiError` store by the response interceptor:

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
  page_size: number;
  total: number;
  total_pages: number;
}
```

Pass page params via query string using `buildQueryParams`:

```ts
import { buildQueryParams } from "@/lib/utils";
const url = `/api/v1/courses${buildQueryParams({ page: 1, page_size: 10 })}`;
```

---

## Do Not Use

| Pattern | Reason |
|---------|--------|
| Direct `axios` calls | Bypasses interceptors — use `apiFetch`/`apiPost`/etc. |
| Hard-coded API paths | Use constants from `src/constants/api-route.ts` |
| `rawPost`/`rawFetch` outside `instance.ts` | Reserved for token refresh only |
| Manual `Authorization` header | Set automatically by the request interceptor |
