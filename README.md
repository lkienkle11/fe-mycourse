# MyCourse — Frontend (`fe`)

Next.js **16.2** (App Router) client for **MyCourse**: React **19**, **Tailwind CSS 4**, **next-intl** (`en` / `vi`), **SWR**, **Axios**, **Zustand**, **react-hook-form** + **Zod**. The UI communicates with the Go API via `NEXT_PUBLIC_API_URL`.

> **Locale routing:** Next.js **16** uses **`src/proxy.ts`** (not `middleware.ts`) for the `next-intl` locale proxy. Keep that file in place — see [`docs/deploy.md` Appendix C](docs/deploy.md#appendix-c--middleware-locale-routing-fix).

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
| `npm run cycles` | Circular import check (Madge on `src/`) — run before large refactors |
| `npm run cycles:json` | Same as `cycles`, JSON output |
| `npm run dupl` | Duplicate code check (jscpd; excludes shadcn `src/components/ui/**`) |
| `npm run quality:deps` | `cycles` then `dupl` (also runs in CI `test` job on `dev`) |

**Pre-PR local gate (2026-05-27):** `npm run lint:biome && npm run lint && npx tsc --noEmit && npm run quality:deps && npm run build` — details in [`docs/quality.md`](docs/quality.md).

## Documentation Convention (Mandatory)

The `docs/` folder is the **primary and authoritative documentation source** for this project.

- **Before starting any task** (coding, planning, debugging, refactoring), read the relevant files in `docs/` first.
- If `docs/` already contains sufficient and up-to-date information → **reuse it directly** without re-running full discovery.
- If `docs/` is missing information or outdated → re-run discovery and **update `docs/` before proceeding**.
- Always sync `docs/` after completing any task that changes architecture, APIs, data flow, components, patterns, or reusable assets.
- `docs/reusable-assets.md` must be checked before proposing any new utility, hook, type, or helper to avoid duplication.

## Documentation in this repo

| Doc | Contents |
|-----|----------|
| [`docs/architecture.md`](docs/architecture.md) | Full tech stack, directory map, functional clusters (Ui / Api / Auth), design decisions, env vars, i18n, caching layer |
| [`docs/folder-structure.md`](docs/folder-structure.md) | Full directory tree with purpose of every folder and subfolder |
| [`docs/flow.md`](docs/flow.md) | Auth and API execution flows — login, signup (placeholder), `/me`, token refresh, cookie strategy, error handling, Zustand store interactions |
| [`docs/screens.md`](docs/screens.md) | App Router routes, layout hierarchy (header / main / footer), home sections, auth shell, footer i18n (`commonFooter`), UI primitives, route constants |
| [`docs/api-using.md`](docs/api-using.md) | Frontend API usage patterns — `apiFetch`/`apiPost`, SWR hooks, Server Actions, auth token handling, error handling, pagination |
| [`docs/components.md`](docs/components.md) | Component inventory by directory — responsibilities, client/server boundary, naming conventions |
| [`docs/router.md`](docs/router.md) | App Router tree, locale routing, layout hierarchy, navigation helpers, route constants |
| [`docs/patterns.md`](docs/patterns.md) | Coding conventions — naming, styling (`cn()`), state management rules, form patterns, i18n, TypeScript patterns |
| [`docs/logic-flow.md`](docs/logic-flow.md) | Execution flows — login, token refresh, Me fetch, form submission, auth modal state, permission checks, i18n, API error capture |
| [`docs/dependencies.md`](docs/dependencies.md) | All runtime and dev dependencies — versions, roles, and usage rules |
| [`docs/quality.md`](docs/quality.md) | Madge / jscpd gates (`cycles`, `dupl`, `quality:deps`), exit codes, CI `test` job on `dev` |
| [`docs/reusable-assets.md`](docs/reusable-assets.md) | All reusable utilities, hooks, types, schemas, stores, constants, API callers, and Server Actions |
| [`docs/delivery.md`](docs/delivery.md) | **Realtime channels** — BroadcastChannel, WebSocket, SSE, NDJSON gRPC; envelope model, env vars, links to per-channel docs |
| [`docs/deploy.md`](docs/deploy.md) | **Production deploy** on Ubuntu 24.04 — Nginx, Certbot, PM2, env vars (`NEXT_PUBLIC_API_URL`, `AUTH_COOKIE_DOMAIN`, stream URLs), go-live checklist, rollback, troubleshooting, CI/CD |

After large refactors, run **`npx gitnexus analyze --force`** in this repo so the local graph (`.gitnexus/`, ignored by git) and the generated **`CLAUDE.md` / `AGENTS.md`** header stats stay aligned with the code; use **`npx gitnexus query -r fe-mycourse "…"`** / **`npx gitnexus context -r fe-mycourse SymbolName`** when updating `docs/*.md`.

For **full-stack** VPS setup (Go API + Postgres + Redis + joint Nginx), follow [`../be-mycourse/docs/deploy.md`](../be-mycourse/docs/deploy.md) first; use this repo's `docs/deploy.md` for frontend-specific steps.

### Branch policy: `main` only from `dev`

Enforcement is **remote-only** (GitHub Actions): any pull request **into `main`** must have **`dev`** as the source branch. The workflow [`.github/workflows/enforce-main-from-dev.yml`](.github/workflows/enforce-main-from-dev.yml) fails otherwise (including feature branches or `release/*` opened directly against `main`). On the repository, protect **`main`**: require this check (or equivalent required status checks) before merge, and restrict direct pushes to `main` so updates go through PRs.

### CI deploy (`dev`)

Pushing to the **`dev`** branch runs [`.github/workflows/deploy-dev.yml`](.github/workflows/deploy-dev.yml): **`test`** (`npm run quality:deps`) → **`build`** (`npm run build`) on GitHub Actions, then **`deploy`** SSH to the VPS (`DEPLOY_PATH_DEV`), `git pull`, clean **`node_modules`**, **`npm ci` + `npm run build`**, and **`pm2 reload mycourse-web-dev`**. Required secrets: `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`, `DEPLOY_PATH_DEV`. Details and operational notes are in [`docs/deploy.md` Appendix G](docs/deploy.md#appendix-g--cicd-github-actions).

## Environment Variables

Create a `.env` file at the project root (gitignored). In production use `.env.production.local` on the server — see [`docs/deploy.md`](docs/deploy.md) for details.

| Variable | Required | Scope | Description | Example |
|----------|----------|-------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Build + client + server | Base URL for the backend API. **Inlined at `next build`** — rebuild required after changing. | `http://localhost:8080` |
| `AUTH_COOKIE_DOMAIN` | Prod only | Server only | Parent domain for auth cookies when FE and API are on separate subdomains. Leave unset on localhost. | `yourdomain.net` |
| `API_URL` | No | Server only | Server-side fallback for `NEXT_PUBLIC_API_URL`. Not exposed to the client bundle. | `http://localhost:8080` |
| `NEXT_PUBLIC_STREAM_SSE_URL` | No | Build + client | SSE stream URL; omit to disable SSE transport | `http://localhost:8080/v1/events/sse` |
| `NEXT_PUBLIC_STREAM_WS_URL` | No | Build + client | WebSocket URL; omit to disable WS transport | `ws://localhost:8080/v1/events/ws` |
| `NEXT_PUBLIC_STREAM_GRPC_BASE_URL` | No | Build + client | Base URL for NDJSON event stream (no trailing slash) | `http://localhost:8080` |

The Axios instance at `src/api/instance.ts` reads `NEXT_PUBLIC_API_URL` (or `API_URL` as a server-side fallback) as its `baseURL`. `AUTH_COOKIE_DOMAIN` is read by `loginAction` via `getCookieDomain()` to scope cookies for cross-subdomain auth.

**Stream events (v1):** `EventsStreamProvider` in `AppProviders` starts BroadcastChannel (always) plus SSE/WS/gRPC when the env vars above are set. See [`docs/delivery.md`](docs/delivery.md).

---

## Low-level API Helpers

### Shared Axios instance (`src/api/methods.ts` + `src/api/instance.ts`)

Five helpers on the singleton `apiInstance` — `apiFetch`, `apiPost`, `apiPut`, `apiDelete`, and **`apiOptions`** (HTTP OPTIONS) — all return `ApiResult<T>` (defined in `src/types/api.ts`):

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
- **`buildCookieOptions`** (from `src/lib/utils/cookie.ts`, imported via `@/lib/utils`) is used to build cookie options with `httpOnly: false`.

### Files Added / Modified

| File | Role |
|------|------|
| `.env` | `NEXT_PUBLIC_API_URL=http://localhost:8080` |
| `src/schema/auth/auth.ts` | Zod schemas: `loginSchema`, `signupSchema` + inferred types |
| `src/api/callers/auth/auth.ts` | `loginService(payload)` — wraps `apiPost` |
| `src/actions/auth/auth.ts` | `loginAction(payload)` Server Action — reads tokens from JSON body, sets non-HttpOnly cookies |
| `src/lib/utils/*.ts` | `cn`, `url`, `react`, `user`, `cookie` in barrel `@/lib/utils`; `auth-session.ts` is server-only (import `@/lib/utils/auth-session` in actions, not from barrel) |
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

Optional: `useGetMe()` / `useSyncMeFromAuth()` in [`src/hooks/auth/use-auth-store.ts`](src/hooks/auth/use-auth-store.ts) — shallow `useMeStore` slice and SWR → store sync; `AppProviders` mounts `MeSwrSync` under `SWRConfig` to run the sync (see [`src/components/providers/app-providers.tsx`](src/components/providers/app-providers.tsx)).

- **Header-based auth**: the Axios request interceptor in `src/api/instance.ts` reads the `access_token` cookie and attaches it as `Authorization: Bearer <token>` on every request.
- **Automatic token refresh**: the response interceptor calls `POST /api/v1/auth/refresh` (via `rawPost` in `src/api/raw-http.ts`, so refresh does not depend on `apiInstance`) and retries the original request when **both** `refresh_token` and `session_id` cookies exist **and** either (a) the response is `401`/`403` with `X-Token-Expired: true` (access JWT expired — see BE `middleware/auth_jwt.go`), or (b) the response is **`401` with no non-empty `Authorization: Bearer …` on the outgoing request** (e.g. `access_token` cookie cleared while refresh cookies remain). Other `401`/`403` responses are reported and rejected without a refresh attempt.
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
| `src/hooks/auth/use-auth-store.ts` | Re-export `useAuthStore`; `useGetMe()`; `useSyncMeFromAuth()` — shallow `useMeStore` + SWR → store sync |
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
import { useGetMe } from "@/hooks/auth/use-auth-store";

const { me, isLoading, isError, mutateMe } = useGetMe();

// After a successful login — revalidate immediately:
await loginAction(payload);
mutateMe();
```

### Permission checks

```ts
import { PERMISSIONS } from "@/constants/permissions";
import { PermissionGate } from "@/components/shared";
import { useHasPermission, useSatisfiesPermissions } from "@/hooks/auth";

const canCreateCourse = useHasPermission(PERMISSIONS.CourseCreate);

// Config-driven guard (menu items use the same shape in HEADER_DROPDOWN_ITEMS)
const canManage = useSatisfiesPermissions({
  permissions: [PERMISSIONS.UserRead, PERMISSIONS.UserUpdate],
});

<PermissionGate permissions={[PERMISSIONS.CourseCreate]} fallback={null}>
  <CreateCourseButton />
</PermissionGate>
```

`PERMISSIONS` mirrors BE `AllPermissions` (40 entries). Default mode is AND (`permissionMode: "all"`), same as BE `RequirePermission`. User menu links are filtered with `useFilteredUserMenuGroups()`. Re-login after BE permission matrix changes so JWT claims refresh.

> To use the SWR hook directly:
> ```ts
> import { useAuth } from "@/api/hooks/auth";
> const { me, isLoading, error, mutate } = useAuth();
> ```

---

## Token Refresh Interceptor (`src/api/instance.ts`)

### How it works

When `refresh_token` and `session_id` are present, an automatic rotation runs **before** the error is surfaced if **all** of the following hold: response is `401` or `403`; the request has not already been retried (`_retry`); and **either** the response includes `X-Token-Expired: true` **or** the failed request had **no** non-empty `Authorization: Bearer …` and the status is `401` (missing access token while a session still exists).

```
Request → BE → 401 (or 403 with X-Token-Expired)
  │
  ├─ [eligible + refresh cookies present, no _retry]
  │     POST /api/v1/auth/refresh  (rawPost in raw-http.ts — no apiInstance)
  │       X-Refresh-Token: <refresh_jwt>
  │       X-Session-Id:    <session_id>
  │     ├─ [success] Update cookies → retry original request → return response
  │     └─ [failure] Report error → reject promise
  │
  └─ [second attempt, _retry flag set] → Report error → reject promise

Otherwise (no refresh cookies, wrong kind of 401/403, other status) → report + reject immediately
```

### Raw HTTP (`src/api/raw-http.ts` + `src/api/index.ts`)

`rawFetch`, `rawPost`, `rawPut`, `rawDelete`, and `rawOptions` call **plain Axios** (no `apiInstance`, no interceptors). They share the same `ApiResult<T>` shape as the `api*` helpers. The public barrel **`src/api/index.ts`** re-exports both `api*` and `raw*` symbols so callers can `import { apiFetch, rawPost } from "@/api"`. `instance.ts` imports **`rawPost` only from `./raw-http`** to avoid a circular dependency with `methods.ts`.

### Mutex (client-side only)

If multiple requests expire simultaneously, only **one** refresh call is made. All other requests are queued and receive the new token once the refresh completes. This is implemented with a module-level `isRefreshing` flag and a `pendingResolvers` array.

The mutex is **not used server-side** — server requests are isolated per user, so a shared flag would incorrectly block or mix tokens across different users.

### Cookie helpers (`src/lib/utils/cookie.ts` + `@/lib/utils`)

| Function | Description |
|---|---|
| `isServer()` | `src/lib/utils/runtime.ts` — `@/lib/utils` |
| `getCookieValue(name)` | Reads a cookie. Client: `js-cookie`. Server: `next/headers` (requires a Next.js request context). |
| `setCookieValue(name, value, options?)` | Writes a cookie. Client: `js-cookie`. Server: `next/headers` (writable only inside Server Actions / Route Handlers — silently skipped in pure RSC). |

### `refreshTokenService` (optional caller)

A commented-out example in `src/api/callers/auth/auth.ts` showed calling refresh via `apiPost`; that would recurse through the same interceptors. **Production refresh** is implemented only inside `doTokenRefresh` → **`rawPost`** (`raw-http.ts`). Uncomment or reintroduce a dedicated caller only if you need refresh from code paths that must not duplicate `rawPost` logic.

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
| `common.ts` | Shared UI constants — `HEADER_DROPDOWN_ITEMS` (with per-item `permissions`), `LANGUAGE_OPTIONS`. Menu types live in `src/types/user-menu.ts`. |
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

### `useAuthStore`, `useGetMe`, and `useSyncMeFromAuth` (`src/hooks/auth/use-auth-store.ts`)

`useAuthStore` is re-exported from `@/store/auth` for a single `@/hooks` import path. `useGetMe` selects the `/me` mirror slice (kept in sync from SWR via `useSyncMeFromAuth`). `useSyncMeFromAuth` lives in the same module and is wired by `MeSwrSync` in `AppProviders` — a null-render child **under** `SWRConfig` next to `children` (see `src/components/providers/app-providers.tsx`).

```ts
import { useAuthStore, useGetMe } from "@/hooks/auth/use-auth-store";

const { openLoginModal, authAction } = useAuthStore();

const { me, isLoading, isError, mutateMe } = useGetMe();
```

> **Note**: Zustand stores remain provider-free. `AppProviders` wraps the app in `SWRConfig` and mounts `MeSwrSync`, which calls `useSyncMeFromAuth` from `src/hooks/auth/use-auth-store.ts` inside the provider so SWR context matches the rest of the subtree.
