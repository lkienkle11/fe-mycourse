This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment Variables

Create a `.env` file at the project root (already included, gitignored):

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL for the backend API | `http://localhost:8080` |

The Axios instance at `src/api/instance.ts` reads `NEXT_PUBLIC_API_URL` as its `baseURL`.

---

## Low-level API Helpers (`src/api/methods.ts`)

Four Axios wrapper functions — `apiFetch`, `apiPost`, `apiPut`, `apiDelete` — all return `ApiResult<T>` (defined in `src/types/api.ts`):

```ts
interface ApiResult<T = unknown> {
  data: T;                          // parsed response body
  statusCode: number;               // HTTP status code (200, 201, 401, …)
  headers: Record<string, string>;  // response headers (set-cookie excluded)
  cookies: Record<string, string>;  // cookies parsed from Set-Cookie header (name → raw value, attributes stripped)
}
```

### `headers`

All response headers are flattened to `Record<string, string>`. Multi-value headers (arrays) are joined with `", "`. `set-cookie` is excluded from `headers` — access it via `cookies` instead.

### `cookies`

Parsed from the `Set-Cookie` response header. Each entry `name=value; Path=/; HttpOnly` becomes `{ name: "value" }` (attributes are stripped). Useful when running inside a Server Action / SSR context — where the browser does not automatically receive `Set-Cookie` from Axios and the cookie must be relayed manually.

### Example

```ts
const { data, statusCode, headers, cookies } = await apiPost<ApiResponse<null>>(
  "/auth/login",
  payload,
);

// cookies["access_token"] → raw token value from Set-Cookie
// headers["x-request-id"] → trace ID from the server
```

> If you don't need `headers` / `cookies`, destructure as usual:
> ```ts
> const { data } = await apiFetch<ApiResponse<MeResponse>>("/me");
> ```

---

## Auth Flow (Login)

### Overview

```
LoginContent (client)
  → handleAuthSubmit("login", values)   [auth-form-handler.ts]
    → loginAction(payload)              [src/actions/auth/auth.ts — "use server"]
      → loginService(payload)           [src/api/callers/auth/auth.ts]
        → apiPost(API_PUBLIC_ROUTES.auth.login, payload)
```

- **No API endpoint is exposed in the browser network tab** — the call goes through a Next.js Server Action (`"use server"`).
- **Tokens are set as non-HttpOnly cookies** so that client-side JS can read them and attach them to outgoing requests as `Authorization` / `X-Refresh-Token` / `X-Session-Id` headers.
- The Server Action reads `access_token`, `refresh_token`, and `session_id` from the **JSON response body** (all three are returned by the BE) and sets them as `SameSite=Lax` non-HttpOnly cookies via `next/headers`.
- **`buildCookieOptions`** (in `src/lib/utils.ts`) is used to build cookie options with `httpOnly: false`.

### Files Added / Modified

| File | Role |
|------|------|
| `.env` | `NEXT_PUBLIC_API_URL=http://localhost:8080` |
| `src/schema/auth/auth.ts` | Zod schemas: `loginSchema`, `signupSchema` + inferred types |
| `src/api/callers/auth/auth.ts` | `loginService(payload)` — wraps `apiPost` |
| `src/actions/auth/auth.ts` | `loginAction(payload)` Server Action — reads tokens from JSON body, sets non-HttpOnly cookies |
| `src/lib/utils.ts` | `buildCookieOptions` — non-HttpOnly cookie options factory |
| `src/components/…/auth-form-handler.ts` | `handleAuthSubmit(type, payload)` — shared by LoginContent & SignupContent |
| `src/components/…/login-content.tsx` | react-hook-form + zodResolver + loginAction |
| `src/components/…/signup-content.tsx` | react-hook-form + zodResolver + signupAction |

### Shared `handleAuthSubmit`

```ts
handleAuthSubmit("login", loginValues)   // → loginAction
handleAuthSubmit("signup", signupValues) // → signupAction
```

### Validation Messages (i18n)

Schema error messages use i18n keys (e.g. `"validation.email"`).  
Components call `t(error.message)` which resolves the key via `next-intl`.

---

## Auth Flow (Get Current User / Me)

### Overview

```
AuthLayout (client)
  → useGetMe()                          [src/hooks/auth/useAuthContext.tsx]
    → useAuth()                         [src/api/hooks/auth/useAuth.ts — SWR]
      → getMeService()                  [src/api/callers/auth — apiFetch wrapper]
        → apiFetch(getMeEndpointKey)    [GET /api/v1/me]
          ↑ Authorization: Bearer <access_token>   (added by Axios interceptor)
```

- **Header-based auth**: the Axios request interceptor in `src/api/instance.ts` reads the `access_token` cookie and attaches it as `Authorization: Bearer <token>` on every request.
- **Automatic token refresh**: if a request returns `401` / `403` with `X-Token-Expired: true`, the response interceptor calls `POST /api/v1/auth/refresh` and retries the original request transparently (see below).
- **401 = not authenticated**: `getMeService` catches 401 and returns `null` instead of throwing, so SWR does not treat it as an error.

### Conditional Rendering in `AuthLayout`

| State | Rendered |
|-------|----------|
| `isLoading = true` | Circular 40×40 px skeleton with `animate-pulse` |
| `me != null` | `<UserMenu me={me} />` with real user data |
| `me == null` | `<AuthButton />` (login / sign-up button) |

### Files Added / Modified

| File | Change |
|------|--------|
| `src/types/auth/auth.ts` | `MeResponse`, `LoginResponse` (+ `session_id`), `RefreshTokenResponse` |
| `src/api/callers/auth/auth.ts` | `getMeEndpointKey`, `getMeService()`, `loginService()`, `refreshTokenService()` |
| `src/api/hooks/auth/useAuth.ts` | SWR hook returning `{ me, isLoading, error, mutate }` |
| `src/hooks/auth/useAuthContext.tsx` | `useGetMe()` — thin wrapper over `useAuth()` |
| `src/components/…/auth-layout.tsx` | Rendering logic driven by state from `useGetMe` |
| `src/components/…/user-menu.tsx` | Accepts `me: MeResponse` prop |

### `MeResponse` type

Mirrors `be/dto/auth.go → MeResponse`:

```ts
interface MeResponse {
  user_id: number;
  user_code: string;
  email: string;
  display_name: string;
  avatar_url: string;
  email_confirmed: boolean;
  is_disabled: boolean;
  created_at: number;       // Unix timestamp
  permissions: string[];
}
```

### `LoginResponse` / `RefreshTokenResponse` types

```ts
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  session_id: string;
}

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  session_id: string;   // unchanged across rotations
}
```

### `useGetMe` hook usage

```ts
import { useGetMe } from "@/hooks/auth/useAuthContext";

const { me, isLoading, isError, mutateMe } = useGetMe();

// After a successful login — revalidate immediately:
await loginAction(payload);
mutateMe();
```

> To use the SWR hook directly:
> ```ts
> import { useAuth } from "@/api/hooks/auth";
> const { me, isLoading, error, mutate } = useAuth();
> ```

---

## Token Refresh Interceptor (`src/api/instance.ts`)

### How it works

Every response that is `401` or `403` **and** carries `X-Token-Expired: true` triggers an automatic token rotation before the error is surfaced to the caller.

```
Request → BE → 401 + X-Token-Expired: true
  │
  ├─ [first attempt, no _retry flag]
  │     Read refresh_token + session_id from cookies
  │     POST /api/v1/auth/refresh
  │       X-Refresh-Token: <refresh_jwt>
  │       X-Session-Id:    <session_id>
  │     ├─ [success] Update cookies → retry original request → return response
  │     └─ [failure] Report error → reject promise
  │
  └─ [second attempt, _retry flag set] → Report error → reject promise

Any other error (non-401/403, or missing X-Token-Expired) → report + reject immediately
```

### Mutex (client-side only)

If multiple requests expire simultaneously, only **one** refresh call is made. All other requests are queued and receive the new token once the refresh completes. This is implemented with a module-level `isRefreshing` flag and a `pendingResolvers` array.

The mutex is **not used server-side** — server requests are isolated per user, so a shared flag would incorrectly block or mix tokens across different users.

### Cookie helpers (`src/lib/utils.ts`)

| Function | Description |
|---|---|
| `isServer` | `typeof window === "undefined"` |
| `getCookieValue(name)` | Reads a cookie. Client: `js-cookie`. Server: `next/headers` (requires a Next.js request context). |
| `setCookieValue(name, value, options?)` | Writes a cookie. Client: `js-cookie`. Server: `next/headers` (writable only inside Server Actions / Route Handlers — silently skipped in pure RSC). |

### `refreshTokenService`

Low-level caller for the refresh endpoint. The interceptor calls this directly — application code should not need to call it manually.

```ts
import { refreshTokenService } from "@/api/callers/auth";

const response = await refreshTokenService(refreshToken, sessionId);
// response.data → { access_token, refresh_token, session_id }
```

### API route constants

```ts
// src/constants/api-route.ts
API_PUBLIC_ROUTES.auth.login    // POST /api/v1/auth/login
API_PUBLIC_ROUTES.auth.signup   // POST /api/v1/auth/signup
API_PUBLIC_ROUTES.auth.refresh  // POST /api/v1/auth/refresh
API_PRIVATE_ROUTES.user.getMe   // GET  /api/v1/me
```

---

## Zustand Stores (`src/store/`)

The project uses [Zustand](https://zustand-demo.pmnd.rs/) instead of React Context for global state management. All stores are **provider-free** — import the hook directly into any component without wrapping a Provider.

| Store file | Hook export | Purpose |
|---|---|---|
| `src/store/auth/auth.ts` | `useAuthStore` | Auth modal state (`authAction`, `openLoginModal`, `closeAllModals`, `nextLink`) |
| `src/store/api-error-store.ts` | `useApiError` | Accumulates API errors from the Axios interceptor (max 20 entries) |
| `src/store/use-app-store.ts` | `useAppStore` | App-level state (counter placeholder, extend as needed) |

### `useApiError` — Global API Error Store

Populated automatically by the Axios response interceptor in `src/api/instance.ts`. Components can subscribe to display toast notifications or error banners:

```ts
import { useApiError } from "@/store/api-error-store";

const { lastError, errors, clear, remove } = useApiError();
```

| Field | Type | Description |
|---|---|---|
| `lastError` | `ApiErrorEntry \| null` | Most recent error, `null` when the store is empty |
| `errors` | `ApiErrorEntry[]` | All retained errors (max 20), oldest-first |
| `push(error)` | `fn` | Add a new entry (id and timestamp are auto-generated) |
| `remove(id)` | `fn` | Remove a single entry by id |
| `clear()` | `fn` | Clear all errors |

### `ApiErrorEntry` type

```ts
interface ApiErrorEntry {
  id: string;          // crypto.randomUUID()
  statusCode: number;  // HTTP status (0 = network error)
  appCode: number;     // BE app-level code (mirrors be/pkg/errcode/codes.go), fallback 9999
  message: string;     // Human-readable error message
  url: string;         // Request path, e.g. "/auth/login"
  method: string;      // "GET" | "POST" | "PUT" | "DELETE" | …
  timestamp: number;   // Date.now() when recorded
}
```

---

## Project Constants (`src/constants/`)

| File | Description |
|------|-------------|
| `common.ts` | Shared UI constants — `HEADER_DROPDOWN_ITEMS`, `LANGUAGE_OPTIONS`, and related types (`UserMenuItem`, `UserMenuGroup`). |
| `route.ts` | Application route paths — `ROUTES` object containing all named route strings (home, login, signup, …). |

## Auth Store (`src/store/auth/auth.ts`)

The auth modal flow is managed by a **Zustand store** (previously React Context — `src/context/auth/` has been removed).

### `AuthStoreState`

| Field / Method | Type | Description |
|---|---|---|
| `authAction` | `AuthActions` | Global auth state: `"none" \| "login" \| "signup" \| "logout"` |
| `setAuthAction(action)` | `fn` | Directly set `authAction` |
| `nextLink` | `string \| null` | Post-auth redirect path, cleared on `closeAllModals` |
| `setNextLink(link)` | `fn` | Manually set redirect path |
| `openLoginModal(nextPath?)` | `fn` | Sets `authAction` to `"login"`, optionally stores `nextPath` |
| `openSignupModal(nextPath?)` | `fn` | Sets `authAction` to `"signup"`, optionally stores `nextPath` |
| `closeAllModals()` | `fn` | Resets `authAction` to `"none"` and clears `nextLink` |

Use `authAction === "login"` / `authAction === "signup"` when deciding which auth modal to render.

```ts
// In any client component (no Provider needed):
import { useAuthStore } from "@/store/auth";

const { openLoginModal, closeAllModals } = useAuthStore();
```

### `useAuthContext` and `useGetMe` hooks (`src/hooks/auth/useAuthContext.tsx`)

Two convenience hooks bridge the store and the SWR data layer:

```ts
import { useAuthContext, useGetMe } from "@/hooks/auth/useAuthContext";

// Auth modal state (thin wrapper around useAuthStore):
const { openLoginModal, authAction } = useAuthContext();

// Current user from GET /api/v1/me (via SWR):
const { me, isLoading, isError, mutateMe } = useGetMe();
```

> **Migration note**: `AppProviders` no longer wraps an `AuthContextProvider` — Zustand stores are provider-free. Consuming components can import `useAuthStore` directly or use the `useAuthContext` / `useGetMe` hooks.
