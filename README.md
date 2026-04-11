# MyCourse — Frontend (`fe`)

Next.js **16.2** (App Router) client for **MyCourse**: React **19**, **Tailwind CSS 4**, **next-intl** (`en` / `vi`), **SWR**, **Axios**, **Zustand**, **react-hook-form** + **Zod**. The UI communicates with the Go API via `NEXT_PUBLIC_API_URL`.

> **Important — middleware filename:** The project ships `src/proxy.ts` with the `next-intl` locale middleware. Before deploying to production, rename it to `src/middleware.ts` so Next.js actually executes it. See [`docs/deploy.md` Appendix C](docs/deploy.md#appendix-c--middleware-locale-routing-fix) for details.

## Getting started

```bash
npm install
npm run dev
```

Open the URL Next.js prints (default [http://localhost:3000](http://localhost:3000)). The root route redirects into the default locale (`vi`); localized paths look like `/vi` or `/en`.

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run lint:biome` / `npm run format:biome` | Biome check / format |

## Documentation in this repo

| Doc | Contents |
|-----|----------|
| [`docs/architecture.md`](docs/architecture.md) | Full tech stack, directory map, functional clusters (Ui / Api / Auth), design decisions, env vars, i18n, caching layer |
| [`docs/deploy.md`](docs/deploy.md) | **Production deploy** on Ubuntu 24.04 — Nginx, Certbot, PM2, env vars (`NEXT_PUBLIC_API_URL`, `AUTH_COOKIE_DOMAIN`), go-live checklist, rollback, troubleshooting, CI/CD |
| [`docs/flow.md`](docs/flow.md) | Auth and API execution flows — login, signup (placeholder), `/me`, token refresh, cookie strategy, error handling, Zustand store interactions |
| [`docs/screens.md`](docs/screens.md) | App Router routes, layout hierarchy, home sections, auth shell component trees, UI primitives, route constants |

For **full-stack** VPS setup (Go API + Postgres + Redis + joint Nginx), follow [`../be/docs/deploy.md`](../be/docs/deploy.md) first; use this repo's `docs/deploy.md` for frontend-specific steps.

### CI deploy (`dev`)

Pushing to the **`dev`** branch runs [`.github/workflows/deploy-dev.yml`](.github/workflows/deploy-dev.yml): a **build** job on GitHub Actions, then SSH to the VPS (`DEPLOY_PATH_DEV`), `git pull`, clean **`node_modules`**, **`npm ci` + `npm run build`**, and **`pm2 reload mycourse-web-dev`**. Required secrets: `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`, `DEPLOY_PATH_DEV`. Details and operational notes are in [`docs/deploy.md` Appendix G](docs/deploy.md#appendix-g--cicd-github-actions).

## Environment Variables

Create a `.env` file at the project root (gitignored). In production use `.env.production.local` on the server — see [`docs/deploy.md`](docs/deploy.md) for details.

| Variable | Required | Scope | Description | Example |
|----------|----------|-------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Build + client + server | Base URL for the backend API. **Inlined at `next build`** — rebuild required after changing. | `http://localhost:8080` |
| `AUTH_COOKIE_DOMAIN` | Prod only | Server only | Parent domain for auth cookies when FE and API are on separate subdomains. Leave unset on localhost. | `yourdomain.net` |
| `API_URL` | No | Server only | Server-side fallback for `NEXT_PUBLIC_API_URL`. Not exposed to the client bundle. | `http://localhost:8080` |

The Axios instance at `src/api/instance.ts` reads `NEXT_PUBLIC_API_URL` (or `API_URL` as a server-side fallback) as its `baseURL`. `AUTH_COOKIE_DOMAIN` is read by `loginAction` via `getCookieDomain()` to scope cookies for cross-subdomain auth.

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
  → useAuth()                           [src/api/hooks/auth/useAuth.ts — SWR]
      → getMeService()                  [src/api/callers/auth — apiFetch wrapper]
        → apiFetch(getMeEndpointKey)    [GET /api/v1/me]
          ↑ Authorization: Bearer <access_token>   (added by Axios interceptor)
```

Optional: `useGetMe()` in [`src/hooks/auth/useAuthContext.tsx`](src/hooks/auth/useAuthContext.tsx) is a thin wrapper over the same SWR hook when you prefer the `@/hooks` import path.

- **Header-based auth**: the Axios request interceptor in `src/api/instance.ts` reads the `access_token` cookie and attaches it as `Authorization: Bearer <token>` on every request.
- **Automatic token refresh**: if a request returns `401` / `403` with `X-Token-Expired: true`, the response interceptor calls `POST /api/v1/auth/refresh` and retries the original request transparently (see below).
- **401 = not authenticated**: `getMeService` catches 401 and returns `null` instead of throwing, so SWR does not treat it as an error.

### Conditional Rendering in `AuthLayout`

| State | Rendered |
|-------|----------|
| `isLoading = true` | `size-10` pulse placeholder (`animate-pulse` rounded circle) |
| `me != null` | `<UserMenu me={me} />` with real user data |
| `me == null` | `<AuthButton />` (login / sign-up button) |

### Files Added / Modified

| File | Change |
|------|--------|
| `src/types/auth/auth.ts` | `MeResponse`, `LoginResponse` (+ `session_id`), `RefreshTokenResponse` |
| `src/api/callers/auth/auth.ts` | `getMeEndpointKey`, `getMeService()`, `loginService()`, `refreshTokenService()` |
| `src/api/hooks/auth/useAuth.ts` | SWR hook returning `{ me, isLoading, error, mutate }` |
| `src/hooks/auth/useAuthContext.tsx` | `useGetMe()` — thin wrapper over `useAuth()` |
| `src/components/…/auth-layout.tsx` | Header chrome: `useAuth()` → skeleton / `UserMenu` / `AuthButton` + `LoginSignupPopup` |
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
