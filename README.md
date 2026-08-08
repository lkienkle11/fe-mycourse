# MyCourse — Frontend (`fe`)

Next.js **16.2** (App Router) client for **MyCourse**: React **19**, **Tailwind CSS 4**, **next-intl** (`en` / `vi`), **SWR**, **Xior 0.8.3** over the Next.js Fetch runtime (`ApiTransport`), **Zustand**, **react-hook-form** + **Zod**. The UI communicates with the Go API via `NEXT_PUBLIC_API_URL`.

> **Locale routing:** Next.js **16** uses **`src/proxy.ts`** (not `middleware.ts`) for the `next-intl` locale proxy. Keep that file in place — see [`docs/deploy.md` Appendix C](docs/deploy.md#appendix-c--middleware-locale-routing-fix).

## Getting started

```bash
npm install
npm run dev          # normal dev (Turbopack; see Dev performance below if CPU/RAM is high)
npm run dev:clean    # wipe .next then start dev (use after cache bloat)
npm run clean:next   # delete .next only
```

Open the URL Next.js prints (default [http://localhost:3000](http://localhost:3000)). The root route redirects into the default locale (`vi`); localized paths look like `/vi` or `/en`.

### Dev performance (CPU / RAM)

Next.js 16 dev uses **Turbopack** (`next dev`). If the machine feels slow:

| Symptom | Cause | Fix |
|---------|-------|-----|
| Very high CPU/RAM, disk full | Unbounded `.next/dev/cache/turbopack` (multi-GB) | `npm run dev:clean` or `npm run clean:next` then `npm run dev` |
| Dev server watches sibling repos | Multi-root workspace / monorepo parent | `next.config.ts` sets `turbopack.root` to this app directory |
| Slow locale validation every request | Dev-only `preloadAllMessages()` | Cached once per process in `src/lib/i18n/load-messages.ts` |

Project defaults in `next.config.ts`: **4 GB** Turbopack memory cap, **filesystem dev cache off** (trade-off: slightly slower cold start, no runaway disk), **`logging.browserToTerminal: false`** (less terminal overhead). Details: [`docs/architecture.md`](docs/architecture.md#development-server).

**Docker (optional):** `./scripts/docker/compose-up.sh local` — **Windows:** `scripts\docker\compose-up.cmd local` — see [`docs/docker.md`](docs/docker.md). CI still deploys via PM2 on the VPS.

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server (Next.js 16 Turbopack) |
| `npm run dev:clean` | Delete `.next` then start dev — use when cache is bloated |
| `npm run clean:next` | Delete `.next` build/dev cache only |
| `npm run build` / `npm run start` | Production build / server |
| `npm run lint` | ESLint (part of `test-all` / `check-all`) |
| `npm run biome` / `npm run lint:biome` / `npm run fix:biome` / `npm run format:biome` | Biome check alias / check / safe auto-fix (`check --write`) / format-only (`format:biome` local; `fix:biome` not in CI) |
| `npm run cycles` | Circular import check (Madge on `src/`) — run before large refactors |
| `npm run cycles:json` | Same as `cycles`, JSON output |
| `npm run dupl` | Duplicate code check (jscpd; excludes shadcn `src/components/ui/**`) |
| `npm run deadcode` | Dead-code check (Knip; [`knip.json`](knip.json) — unused types in `src/types/**` + unused files in `src/components/**` / `src/screen/**`) |
| `npm run quality:deps` | `cycles` then `dupl` (part of `test-all` / `check-all`) |
| `npm run test-all` | `lint` → `biome` → `test` → `deadcode` → `quality:deps` — **CI `test` job on `dev`** |
| `npm run check-all` | `test-all` + `build` — recommended **pre-PR local gate** |

**Pre-PR local gate:** `npm run check-all` (optionally `npm run fix:biome` or `npm run format:biome`, then `npx tsc --noEmit` before it) — details in [`docs/quality.md`](docs/quality.md).

## Documentation Convention (Mandatory)

The `docs/` folder is the **primary and authoritative documentation source** for this project.

- **Before starting any task** (coding, planning, debugging, refactoring), read the relevant files in `docs/` first.
- If `docs/` already contains sufficient and up-to-date information → **reuse it directly** without re-running full discovery.
- If `docs/` is missing information or outdated → re-run discovery and **update `docs/` before proceeding**.
- Always sync `docs/` after completing any task that changes architecture, APIs, data flow, components, patterns, or reusable assets.
- `docs/reusable-assets.md` must be checked before proposing any new utility, hook, type, or helper to avoid duplication.
- `AGENTS.md` and `CLAUDE.md` are version-controlled agent guidance. `CLAUDE.md` imports the complete canonical rules from `AGENTS.md` through `@AGENTS.md`.

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
| [`docs/quality.md`](docs/quality.md) | ESLint, Biome, Knip / Madge / jscpd gates; `test-all` (CI) and `check-all` (local pre-PR) |
| [`docs/seo-ranking-setup.md`](docs/seo-ranking-setup.md) | **SEO / ranking / performance / security foundation** — unused helpers under `src/lib/seo|performance|security/web`; A/B/C reuse tables; planned `/` vs `/home` take-note |
| [`docs/security-hardening-notes.md`](docs/security-hardening-notes.md) | FE crawl/redact/JSON-LD sanitize/header draft helpers + link to BE public-SEO notes |
| [`docs/reusable-assets.md`](docs/reusable-assets.md) | All reusable utilities, hooks, types, schemas, stores, constants, API callers, and Server Actions |
| [`docs/delivery.md`](docs/delivery.md) | **Realtime channels** — BroadcastChannel, WebSocket, SSE, NDJSON gRPC; envelope model, env vars, links to per-channel docs |
| [`docs/deploy.md`](docs/deploy.md) | **Production deploy** on Ubuntu 24.04 — Nginx, Certbot, PM2, env vars (`NEXT_PUBLIC_API_URL`, `AUTH_COOKIE_DOMAIN`, stream URLs), go-live checklist, rollback, troubleshooting, CI/CD |
| [`docs/docker.md`](docs/docker.md) | Docker Compose alternative (local/VPS manual; PM2/CI unchanged) |

After large refactors, run **`npx gitnexus analyze --force`** in this repo so the local graph (`.gitnexus/`, ignored by git) and the generated **`CLAUDE.md` / `AGENTS.md`** header stats stay aligned with the code; use **`npx gitnexus query -r fe-mycourse "…"`** / **`npx gitnexus context -r fe-mycourse SymbolName`** when updating `docs/*.md`.

For **full-stack** VPS setup (Go API + Postgres + Redis + joint Nginx), follow [`../be-mycourse/docs/deploy.md`](../be-mycourse/docs/deploy.md) first; use this repo's `docs/deploy.md` for frontend-specific steps.

### Branch policy: `main` only from `dev`

Enforcement is **remote-only** (GitHub Actions): any pull request **into `main`** must have **`dev`** as the source branch. The workflow [`.github/workflows/enforce-main-from-dev.yml`](.github/workflows/enforce-main-from-dev.yml) fails otherwise (including feature branches or `release/*` opened directly against `main`). On the repository, protect **`main`**: require this check (or equivalent required status checks) before merge, and restrict direct pushes to `main` so updates go through PRs.

### CI/CD — GitHub Actions secrets by environment

| Environment | Branch trigger (planned) | Workflow file | PM2 app | Status |
|-------------|--------------------------|---------------|---------|--------|
| **Dev** | `push` → **`dev`** | [`.github/workflows/deploy-dev.yml`](.github/workflows/deploy-dev.yml) | `mycourse-web-dev` | **Implemented** |
| **Staging** | `push` → **`staging`** *(planned)* | `.github/workflows/deploy-staging.yml` *(not in repo)* | `mycourse-web-staging` | **Placeholder secrets only** — deploy manually or add workflow later |
| **Production** | `push` → **`main`** *(planned)* | `.github/workflows/deploy-main.yml` *(not in repo)* | `mycourse-web-prod` | **Placeholder secrets only** — deploy manually or add workflow later |

Pushes to feature branches or pull requests **do not** run any deploy workflow today. Only **`dev`** is wired in CI.

Secrets are stored under **Repository → Settings → Secrets and variables → Actions**. Names ending in `_DEV`, `_STG`, or `_MAIN` are **per-environment**; each suffix is read only when the matching deploy workflow runs on its branch (today: **`_DEV` only** on `dev` pushes).

#### Dev — implemented (`deploy-dev.yml`, branch `dev`)

| Secret | Injected as (build `env`) | Example placeholder |
|--------|---------------------------|---------------------|
| `SSH_PRIVATE_KEY` | — | *(deploy key)* |
| `SSH_HOST` | — | `203.0.113.10` |
| `SSH_USER` | — | `deploy` |
| `DEPLOY_PATH_DEV` | — | `/var/www/fe-mycourse` |
| `NEXT_PUBLIC_API_URL_DEV` | `NEXT_PUBLIC_API_URL` | `https://api-dev.example.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID_DEV` | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `YOUR_GOOGLE_CLIENT_ID_DEV` |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID_DEV` | `NEXT_PUBLIC_DISCORD_CLIENT_ID` | `YOUR_DISCORD_CLIENT_ID_DEV` |
| `NEXT_PUBLIC_DISCORD_CALLBACK_URL_DEV` | `NEXT_PUBLIC_DISCORD_CALLBACK_URL` | `https://dev.example.com/auth/discord/callback` |
| `NEXT_PUBLIC_X_CLIENT_ID_DEV` *(optional)* | `NEXT_PUBLIC_X_CLIENT_ID` | `YOUR_X_CLIENT_ID_DEV` |
| `NEXT_PUBLIC_X_CALLBACK_URL_DEV` *(optional)* | `NEXT_PUBLIC_X_CALLBACK_URL` | `https://dev.example.com/auth/x/callback` |

#### Staging — placeholder (`deploy-staging.yml` not in repo)

Reserve these secret names for a future **`staging`** branch workflow. Until then, set equivalent values in the server **`.env.staging`** file and deploy manually ([`docs/deploy.md`](docs/deploy.md)).

| Secret | Injected as (build `env`) | Example placeholder |
|--------|---------------------------|---------------------|
| `SSH_PRIVATE_KEY` | — | *(reuse or separate key)* |
| `SSH_HOST_STG` | — | `203.0.113.20` |
| `SSH_USER_STG` | — | `deploy` |
| `DEPLOY_PATH_STG` | — | `/var/www/fe-mycourse-staging` |
| `NEXT_PUBLIC_API_URL_STG` | `NEXT_PUBLIC_API_URL` | `https://api-staging.example.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID_STG` | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `YOUR_GOOGLE_CLIENT_ID_STG` |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID_STG` | `NEXT_PUBLIC_DISCORD_CLIENT_ID` | `YOUR_DISCORD_CLIENT_ID_STG` |
| `NEXT_PUBLIC_DISCORD_CALLBACK_URL_STG` | `NEXT_PUBLIC_DISCORD_CALLBACK_URL` | `https://staging.example.com/auth/discord/callback` |
| `NEXT_PUBLIC_X_CLIENT_ID_STG` *(optional)* | `NEXT_PUBLIC_X_CLIENT_ID` | `YOUR_X_CLIENT_ID_STG` |
| `NEXT_PUBLIC_X_CALLBACK_URL_STG` *(optional)* | `NEXT_PUBLIC_X_CALLBACK_URL` | `https://staging.example.com/auth/x/callback` |

#### Production (`main`) — placeholder (`deploy-main.yml` not in repo)

Reserve these for a future **`main`** branch workflow. Until then, use **`.env.prod`** on the server and manual deploy.

| Secret | Injected as (build `env`) | Example placeholder |
|--------|---------------------------|---------------------|
| `SSH_PRIVATE_KEY` | — | *(reuse or separate key)* |
| `SSH_HOST_MAIN` | — | `203.0.113.30` |
| `SSH_USER_MAIN` | — | `deploy` |
| `DEPLOY_PATH_MAIN` | — | `/var/www/fe-mycourse-prod` |
| `NEXT_PUBLIC_API_URL_MAIN` | `NEXT_PUBLIC_API_URL` | `https://api.example.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID_MAIN` | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `YOUR_GOOGLE_CLIENT_ID_MAIN` |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID_MAIN` | `NEXT_PUBLIC_DISCORD_CLIENT_ID` | `YOUR_DISCORD_CLIENT_ID_MAIN` |
| `NEXT_PUBLIC_DISCORD_CALLBACK_URL_MAIN` | `NEXT_PUBLIC_DISCORD_CALLBACK_URL` | `https://www.example.com/auth/discord/callback` |
| `NEXT_PUBLIC_X_CLIENT_ID_MAIN` *(optional)* | `NEXT_PUBLIC_X_CLIENT_ID` | `YOUR_X_CLIENT_ID_MAIN` |
| `NEXT_PUBLIC_X_CALLBACK_URL_MAIN` *(optional)* | `NEXT_PUBLIC_X_CALLBACK_URL` | `https://www.example.com/auth/x/callback` |

> **Dev SSH note:** `deploy-dev.yml` uses shared `SSH_HOST` / `SSH_USER` (no `_DEV` suffix). Staging/production placeholders use `SSH_HOST_STG` / `SSH_USER_STG` and `SSH_HOST_MAIN` / `SSH_USER_MAIN` when hosts differ; on a single VPS you may reuse the same `SSH_*` secrets.

Full mapping, workflow YAML, and VPS steps: [`docs/deploy.md` Appendix G](docs/deploy.md#appendix-g--cicd-github-actions).

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

`ApiTransport` (`src/api/transport/api-transport.ts`) resolves `baseURL` from `NEXT_PUBLIC_API_URL` (or `API_URL` as a server-side fallback). `AUTH_COOKIE_DOMAIN` is read by `loginAction` via `getCookieDomain()` to scope cookies for cross-subdomain auth.

**Stream events (v1):** `EventsStreamProvider` in `AppProviders` starts BroadcastChannel (always) plus SSE/WS/gRPC when the env vars above are set. See [`docs/delivery.md`](docs/delivery.md).

---

## Low-level API Helpers

### Xior transport (`src/api/core/methods.ts` + `src/api/transport/api-transport.ts`)

Six authenticated helpers on `browserApiMethods` — `apiFetch`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`, and **`apiOptions`** (HTTP OPTIONS) — all return `ApiResult<T>` (defined in `src/types/api.ts`):

The HTTP attempt is owned by an exact-pinned Xior instance. Raw traffic uses one shared executor with no auth/refresh behavior; each authenticated transport request creates an isolated executor from the same Xior factory. The request interceptor applies runtime-provided headers and preserves native Fetch options (`cache`, `next`, credentials, redirect and signal). The response interceptor exposes both successful and non-2xx native responses to the existing project error contract. Token refresh, one-retry, reporter, body replay/gzip and trusted-origin redirect rules remain outside Xior plugins.

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

Parsed from the `Set-Cookie` response header. Each entry `name=value; Path=/; HttpOnly` becomes `{ name: "value" }` (attributes are stripped). Useful when running inside a Server Action / SSR context — where the browser does not automatically receive `Set-Cookie` from upstream Fetch and the cookie must be relayed manually.

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
      → loginService(payload)           [src/api/callers/auth/auth-factory.ts (+ auth-browser.ts)]
        → apiPost(API_PUBLIC_ROUTES.auth.login, payload)
```

- **No API endpoint is exposed in the browser network tab** — the call goes through a Next.js Server Action (`"use server"`).
- **Tokens are set as HttpOnly cookies** via Server Actions (`buildAuthCookieOptions`). Client-side JS cannot read them; the browser sends cookies with `credentials: "include"` and the backend reads session from cookies.
- The Server Action reads `access_token`, `refresh_token`, and `session_id` from the **JSON response body** (all three are returned by the BE) and sets them as `SameSite=Lax` **HttpOnly** cookies via `next/headers`.
- **`buildAuthCookieOptions`** (from `src/lib/utils/cookie.ts`) is used for auth cookies. **`buildCookieOptions`** remains for non-auth UI cookies only (`httpOnly: false` default).

### Files Added / Modified

| File | Role |
|------|------|
| `.env` | `NEXT_PUBLIC_API_URL=http://localhost:8080` |
| `src/schema/auth/auth.ts` | Zod schemas: `loginSchema`, `signupSchema` + inferred types |
| `src/api/callers/auth/auth-factory.ts (+ auth-browser.ts)` | `loginService(payload)` — wraps `apiPost` |
| `src/actions/auth/auth.ts` | `loginAction(payload)` Server Action — reads tokens from JSON body, sets HttpOnly cookies |
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
`auth-form-fields.tsx` resolves keys via `useTranslations("auth")` only when `error.message` is set.

---

## Auth Flow (Get Current User / Me)

### Overview

```
AuthLayout (client)
  → useAuth()                           [src/api/hooks/auth/useAuth.ts — SWR]
      → getMeService()                  [src/api/callers/auth — apiFetch wrapper]
        → apiFetch(getMeEndpointKey)    [GET /api/v1/me]
          ↑ Server-side: Authorization: Bearer <access_token> (runtime adapter)
```

Optional: `useGetMe()` / `useSyncMeFromAuth()` in [`src/hooks/auth/use-auth-store.ts`](src/hooks/auth/use-auth-store.ts) — shallow `useMeStore` slice and SWR → store sync; `AppProviders` mounts `MeSwrSync` under `SWRConfig` to run the sync (see [`src/components/providers/app-providers.tsx`](src/components/providers/app-providers.tsx)).

- **Header-based auth**: server-side requests (RSC/Server Action) read `access_token` via `next/headers` and set `Authorization: Bearer <token>`. Browser requests rely on `credentials: "include"` so BE reads HttpOnly cookies directly.
- **Automatic token refresh**: the authenticated Fetch transport retries eligible `401`/`403` failures once. Browser path calls FE proxy `POST /api/auth/refresh` (access_token-only DTO). Writable server path refreshes upstream via `rawPost` and persists cookies with `setAuthSessionCookies`. Readonly RSC fails closed with `ApiRefreshRequiredError`.
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
| `src/api/callers/auth/auth-factory.ts (+ auth-browser.ts)` | `getMeEndpointKey`, `getMeService()`, `loginService()`, … (no refreshTokenService — refresh via transport/BFF) |
| `src/api/hooks/auth/useAuth.ts` | SWR hook returning `{ me, isLoading, error, mutate }` |
| `src/hooks/auth/use-auth-store.ts` | Re-export `useAuthStore`; `useGetMe()`; `useSyncMeFromAuth()` — shallow `useMeStore` + SWR → store sync |
| `src/components/…/auth-layout.tsx` | Header chrome: `useAuth()` → skeleton / `UserMenu` / `AuthButton` + `LoginSignupPopup` |
| `src/components/…/user-menu.tsx` | Accepts `me: MeResponse` prop |

### `MeResponse` type

Mirrors `be/dto/auth.go → MeResponse`:

```ts
interface MeResponse {
  user_id: string; // UUID v7
  user_code: string; // ULID
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

Remember-me is **not** in the API JSON. FE cookie TTL comes from BE `Set-Cookie` Max-Age; fallback `auth_session_expires_at` stores absolute expiry for silent refresh.

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

`PERMISSIONS` mirrors BE `AllPermissions` (40 entries). Default mode is AND (`permissionMode: "all"`), same as BE `RequirePermission`. User menu links are filtered with `useFilteredUserMenuGroups()`: the role-switch entries (`/sysadmin`, `/admin`, `/instructor`) remain permission-gated by `sysadmin:modify`, `admin:modify`, and `instructor:modify`, while the legacy study/account links are temporarily left visible by commented config guards in `HEADER_DROPDOWN_ITEMS`. Every dropdown item now also carries a `titleKey` under `commonHeader.userMenu.*`, while keeping its original `title` fallback in config. Re-login after BE permission matrix changes so JWT claims refresh.

> To use the SWR hook directly:
> ```ts
> import { useAuth } from "@/api/hooks/auth";
> const { me, isLoading, error, mutate } = useAuth();
> ```

---

## Token Refresh (`src/api/transport/api-transport.ts` + `src/api/auth/*` adapters)

### How it works

An automatic rotation runs **before** the error is surfaced if **all** of the following hold: response is `401` or `403`; the request has not already been retried; and **either** the response includes `X-Token-Expired: true` **or** the failed request had **no** non-empty `Authorization: Bearer …` and the status is `401` (missing access token while a session still exists).

```
Request → BE → 401 (or 403 with X-Token-Expired)
  │
  ├─ [eligible, not retried]
  │     Browser: POST /api/auth/refresh (single-flight promise)
  │     Writable server: raw upstream refresh + setAuthSessionCookies
  │     Readonly / no-context: ApiRefreshRequiredError (no refresh)
  │     ├─ [success] Retry original request once with rotated access token
  │     └─ [failure] Report original protected-request error → reject
  │
  └─ [second attempt already retried] → Report error → reject

Otherwise (wrong kind of 401/403, other status) → report + reject immediately
```

### Raw HTTP (`src/api/core/raw-http.ts` + `src/api/index.ts`)

`rawFetch`, `rawPost`, `rawPut`, `rawPatch`, `rawDelete`, and `rawOptions` call the shared raw Xior executor via `src/api/core/fetch-core.ts` (no MyCourse auth, no refresh, no error store). The Xior interceptors preserve Next.js Fetch cache semantics and native response metadata, while Fetch policy retains body replay, gzip and redirect security. The public barrel **`src/api/index.ts`** re-exports both `api*` and `raw*` symbols so callers can `import { apiFetch, rawPost } from "@/api"`.

### Browser refresh single-flight

If multiple browser requests expire simultaneously, only **one** refresh call is made (`src/api/auth/browser-auth.ts`). All waiters join the same module-scoped promise. Public authenticated options intentionally omit `AbortSignal`, so `refreshBrowserSession` has no signal parameter. BFF `POST /api/auth/refresh` maps upstream timeout to **504** (`instanceof ApiTimeoutError`) and other network failures to **502**.

Server Actions must use `createWritableServerApiTransportFromRequest` + `createApiMethods` + domain caller factories (for example `createAuthCallers`) — there is no server-global refresh mutex.

### Cookie helpers (`src/lib/utils/cookie.ts` + `@/lib/utils`)

| Function | Description |
|---|---|
| `isServer()` | `src/lib/utils/runtime.ts` — `@/lib/utils` |
| `getCookieValue(name)` | Reads a cookie. Client: `js-cookie`. Server: `next/headers` (requires a Next.js request context). |
| `setCookieValue(name, value, options?)` | Writes a cookie. Client: `js-cookie`. Server: `next/headers` (writable only inside Server Actions / Route Handlers — silently skipped in pure RSC). |

### Production refresh ownership

Refresh never recurses through the authenticated transport. Browser refresh goes through Route Handler `POST /api/auth/refresh` (access_token-only DTO). Writable server refresh uses `rawPost` to the BE refresh route, validates all three rotated tokens, then persists via `setAuthSessionCookies`.

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
| `src/store/api-error-store.ts` | `useApiError` | Accumulates API errors from the authenticated Fetch reporter (max 20 entries) |
| `src/store/use-app-store.ts` | `useAppStore` | App-level state (counter placeholder, extend as needed) |

### `useApiError` — Global API Error Store

Populated automatically by the authenticated transport reporter in `src/api/transport/api-transport.ts`. Entries use FE-owned safe copy only (HTTP status + appCode) — never the BE response `message`. Components can subscribe to display toast notifications or error banners:

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
  message: string;     // FE-owned safe copy only (never BE body message)
  url: string;         // Request path, e.g. "/auth/login"
  method: string;      // "GET" | "POST" | "PUT" | "DELETE" | …
  timestamp: number;   // Date.now() when recorded
}
```

---

## Project Constants (`src/constants/`)

| File | Description |
|------|-------------|
| `common.ts` | Shared UI constants — `HEADER_DROPDOWN_ITEMS` (per-item `permissions` / `titleKey` config), `LANGUAGE_OPTIONS`. Menu types live in `src/types/user-menu.ts`. |
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
