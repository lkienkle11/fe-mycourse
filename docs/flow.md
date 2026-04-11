# Execution Flows (`fe`)

This document traces the major user-visible and technical flows in the MyCourse frontend. Flows are derived from the **GitNexus** process index for repo `fe` (12 tracked execution chains across the **Auth** and **Api** clusters) and from direct source inspection. Regenerate the graph after large UI changes with `npx gitnexus analyze --force` from `fe/`.

The **(web) layout** (`src/app/[locale]/(web)/layout.tsx`) wraps every marketing page in `Header` → `<main>` → `Footer`; the flows below focus on **auth** and **API** unless otherwise noted.

---

## Overview of Tracked Processes

GitNexus currently indexes 12 execution flows, grouped into two categories:

| Flow category | Processes | Type |
|---------------|-----------|------|
| Login submit chain | OnSubmit → LoginService, OnSubmit → GetCookieDomain, OnSubmit → BuildCookieOptions | cross-community |
| Signup submit chain | OnSubmit → SignupAction | intra-community |
| Auth UI wiring | LoginContent → UseAuth, SignupContent → HandleSearch, RegisterForm → HandleSearch | intra/cross-community |

---

## 1. Login Flow

**Goal:** Validate credentials, obtain tokens, persist cookies, and refresh the UI — without exposing the login HTTP call in the browser network panel.

### 1.1 Sequence

```mermaid
sequenceDiagram
  participant U as User
  participant LC as LoginContent (client)
  participant H as handleAuthSubmit
  participant SA as loginAction ("use server")
  participant LS as loginService
  participant API as Go API (NEXT_PUBLIC_API_URL)
  participant CK as next/headers cookies()
  participant SWR as useAuth (SWR)

  U->>LC: Submit form (email, password, rememberMe)
  LC->>LC: react-hook-form validate (loginSchema / Zod)
  LC->>H: handleAuthSubmit("login", values)
  H->>SA: loginAction(payload)
  SA->>LS: loginService({ email, password, remember_me })
  LS->>API: POST /api/v1/auth/login
  API-->>LS: { code:0, data: { access_token, refresh_token, session_id } }
  LS-->>SA: { data: ApiResponse, cookies: Record<name,value> }
  SA->>CK: cookieStore.set("access_token", ..., buildCookieOptions)
  SA->>CK: cookieStore.set("refresh_token", ..., buildCookieOptions + maxAge)
  SA->>CK: cookieStore.set("session_id", ..., buildCookieOptions + maxAge)
  SA-->>LC: AuthActionResult { success: true, message, code }
  LC->>SWR: mutate() → force GET /api/v1/me revalidation
  SWR->>API: GET /api/v1/me  (Authorization: Bearer <access_token>)
  API-->>SWR: MeResponse
  SWR-->>LC: me (triggers AuthLayout to render UserMenu)
```

### 1.2 Step-by-step

**Step 1 — Form validation (`LoginContent`)**

`src/components/common/auth-menu/auth/login-content.tsx`

`react-hook-form` with `zodResolver(loginSchema)`. The schema (`src/schema/auth/auth.ts`) validates:
- `email`: non-empty, valid email format
- `password`: non-empty
- `rememberMe`: boolean

Validation error messages are i18n keys (e.g. `"validation.email"`); the component calls `t(error.message)` to resolve them via `useTranslations("auth")`.

**Step 2 — Dispatch to server action (`handleAuthSubmit`)**

`src/components/common/auth-menu/auth/auth-form-handler.ts`

Shared dispatcher called by both `LoginContent` and `SignupContent`:

```ts
handleAuthSubmit("login", loginValues)   // → loginAction
handleAuthSubmit("signup", signupValues) // → signupAction
```

**Step 3 — Server Action (`loginAction`)**

`src/actions/auth/auth.ts` — marked `"use server"`.

- Calls `loginService(payload)` which issues `POST /api/v1/auth/login` **from the Next.js server** (not the browser).
- The Go API returns `{ code, message, data: { access_token, refresh_token, session_id } }`.
- The action reads the three tokens from the JSON body and writes them as cookies via `next/headers`:

```ts
cookieStore.set("access_token", access_token, buildCookieOptions({ sameSite: "lax", isProduction, domain }));
cookieStore.set("refresh_token", refresh_token, buildCookieOptions({ sameSite: "lax", isProduction, domain, maxAge: ... }));
cookieStore.set("session_id", session_id, buildCookieOptions({ ... }));
```

**Step 4 — Cookie strategy**

`buildCookieOptions` (from `src/lib/utils/cookie/build-options.ts`, via `@/lib/utils`) produces **non-HttpOnly**, `SameSite=Lax` cookies:

| Attribute | Value | Reason |
|-----------|-------|--------|
| `httpOnly` | `false` | Client-side Axios interceptor must read these via `js-cookie` / `getCookieValue()` to attach `Authorization: Bearer` headers |
| `sameSite` | `lax` | Prevents CSRF while allowing top-level navigation redirects |
| `secure` | `true` (production) | Forces HTTPS-only transmission |
| `domain` | parent domain (e.g. `yourdomain.net`) | Allows cookies to be sent to `api.yourdomain.net` when FE and API are on separate subdomains. Controlled by `AUTH_COOKIE_DOMAIN` env var. |
| `maxAge` | — (`access_token`), 30 days (refresh/session if `remember_me=true`) | Session-scoped by default; persisted if user checks "Remember me" |

> **Why not HttpOnly?** The Axios interceptor (`src/api/instance.ts`) runs on **both** client and server. On the client, it reads cookies via `js-cookie` and sets `Authorization: Bearer <token>`. HttpOnly cookies are invisible to JavaScript — using them would break client-side authenticated requests.

**Step 5 — SWR revalidation**

After a successful login, the client calls `mutate()` on the `useAuth` SWR hook. This forces an immediate `GET /api/v1/me` request with the newly set `access_token` cookie. The response populates `me` and `AuthLayout` switches from `AuthButton` to `UserMenu`.

---

## 2. Signup Flow

**Goal:** Create a new user account through the same UX pattern as login.

### Current status

`signupAction` (`src/actions/auth/auth.ts`) is a **placeholder**:

```ts
export async function signupAction(_payload: SignupPayload): Promise<AuthActionResult> {
  // TODO: implement signupService and call it here
  return { success: false, message: "Signup not implemented yet", code: ApiErrorCode.Unknown };
}
```

The form (`SignupContent`) is fully wired with `react-hook-form` + `signupSchema`, but the server action does not yet call the API. Implement `signupService` in `src/api/callers/auth/auth.ts` and update the action to complete this flow.

### Expected sequence (once implemented)

```
SignupContent (client)
  → handleAuthSubmit("signup", signupValues)
    → signupAction(payload)             ["use server"]
      → signupService(payload)          [POST /api/v1/auth/signup]
        → apply same cookie strategy as loginAction
      → mutate() on useAuth SWR
```

---

## 3. Current User ("me") Loading

**Goal:** Render the correct header chrome (skeleton → `UserMenu` or `AuthButton`) based on session state.

### Sequence

```mermaid
sequenceDiagram
  participant AL as AuthLayout (client)
  participant UA as useAuth (SWR)
  participant GM as getMeService
  participant AX as Axios (apiInstance)
  participant API as Go API

  AL->>UA: useAuth()
  UA->>GM: getMeService() [SWR fetcher]
  GM->>AX: apiFetch(GET /api/v1/me)
  AX->>AX: Request interceptor: read access_token cookie → set Authorization header
  AX->>API: GET /api/v1/me  Authorization: Bearer <token>
  API-->>AX: 200 MeResponse  OR  401 (unauthenticated)
  AX-->>GM: ApiResult<ApiResponse<MeResponse>>
  GM-->>UA: MeResponse | null  (null on 401, throws on other errors)
  UA-->>AL: { me, isLoading, error, mutate }

  alt isLoading
    AL->>AL: render pulse skeleton (animate-pulse circle)
  else me != null
    AL->>AL: render <UserMenu me={me} />
  else me == null
    AL->>AL: render <AuthButton /> + <LoginSignupPopup />
  end
```

### `useAuth` hook details

`src/api/hooks/auth/useAuth.ts` — SWR hook:

```ts
const { me, isLoading, error, mutate } = useAuth();
```

- **Key:** `getMeEndpointKey` = `"/api/v1/me"` (defined once in `src/api/callers/auth/auth.ts`).
- **Global config:** `revalidateOnFocus: false`, `dedupingInterval: 30_000ms` (set in `AppProviders`).
- **401 handling:** `getMeService` catches 401 and returns `null` instead of throwing, so SWR does not enter error state for unauthenticated users.

---

## 4. Authenticated API Calls and Token Refresh

**Goal:** Attach a valid `Authorization: Bearer` token to every request and silently rotate the token when it expires.

### 4.1 Request interceptor

Every Axios request goes through the interceptor in `createApiInstance`:

```
Request
  └─ interceptor reads access_token cookie
      ├─ Client: js-cookie  (getCookieValue → Cookies.get)
      └─ Server: next/headers  (getCookieValue → cookies().get)
  └─ Sets  Authorization: Bearer <access_token>
```

### 4.2 Token refresh flow

Triggered when a response is `401` or `403` **and** carries `X-Token-Expired: true`:

```
Response: 401 + X-Token-Expired: true
  │
  ├─ cfg._retry already set? → surface error immediately (prevent retry loop)
  │
  ├─ SERVER PATH (no shared mutex — each request is per-user):
  │     Read refresh_token + session_id from cookies via next/headers
  │     POST /api/v1/auth/refresh
  │       X-Refresh-Token: <refresh_jwt>
  │       X-Session-Id:    <session_id>
  │     ├─ success → update cookies (setCookieValue) → retry original request
  │     └─ failure → reportError → reject
  │
  └─ CLIENT PATH (with mutex to prevent refresh stampede):
        isRefreshing == true?
          → queue resolver in pendingResolvers → wait
        isRefreshing == false:
          → set isRefreshing = true
          → read refresh_token + session_id from js-cookie
          → POST /api/v1/auth/refresh  (raw axios, bypasses interceptors)
          ├─ success:
          │     update cookies (js-cookie)
          │     flushRefreshQueue(newAccessToken) → unblock all queued requests
          │     retry original request
          └─ failure:
                flushRefreshQueue(null) → reject all queued requests
                reportError → reject

Any other 4xx/5xx → reportError → reject
```

### 4.3 Refresh request format

```
POST /api/v1/auth/refresh
Headers:
  Content-Type: application/json
  X-Refresh-Token: <refresh_jwt>
  X-Session-Id:    <session_id>

Response 200:
  { code: 0, data: { access_token, refresh_token, session_id } }
```

The `session_id` does not change across rotations. Both `access_token` and `refresh_token` are rotated.

### 4.4 Cookie update after refresh

| Environment | Cookie update method |
|-------------|---------------------|
| Client (browser) | `js-cookie` / `Cookies.set(...)` |
| Server (Server Action / Route Handler) | `next/headers` / `cookies().set(...)` |
| Server (pure RSC) | Silently skipped — `setCookieValue` swallows the error |

---

## 5. Global Error Handling

**Goal:** Surface API failures to the user and allow global observability.

The Axios response interceptor calls `reportError(error)` for every failed request. This:

1. Logs `[API] METHOD /path → HTTP status | appCode=N | message` to the console.
2. Calls `useApiError.getState().push({ statusCode, appCode, message, url, method })`.

The `useApiError` Zustand store (`src/store/api-error-store.ts`) retains the last 20 errors. UI components can subscribe:

```ts
import { useApiError } from "@/store/api-error-store";
const { lastError, errors, clear, remove } = useApiError();
```

`ApiErrorEntry` shape:

```ts
interface ApiErrorEntry {
  id: string;          // crypto.randomUUID()
  statusCode: number;  // HTTP status (0 = network error)
  appCode: number;     // BE app-level code (mirrors be/pkg/errcode/codes.go), fallback 9999
  message: string;
  url: string;         // e.g. "/auth/login"
  method: string;      // "GET" | "POST" | "PUT" | "DELETE"
  timestamp: number;   // Date.now()
}
```

The store is safe to call on the server (Zustand stores are singleton modules — `getState()` works without hydration).

---

## 6. Auth Modal State (Zustand)

**Goal:** Open and close login/signup modals from anywhere in the app without prop drilling.

`useAuthStore` (`src/store/auth/auth.ts`) is a provider-free Zustand store:

```ts
const { authAction, openLoginModal, openSignupModal, closeAllModals, nextLink } = useAuthStore();
```

| Action | Effect |
|--------|--------|
| `openLoginModal(nextPath?)` | Sets `authAction: "login"`, stores `nextPath` in `nextLink` |
| `openSignupModal(nextPath?)` | Sets `authAction: "signup"`, stores `nextPath` in `nextLink` |
| `closeAllModals()` | Resets `authAction: "none"`, clears `nextLink` |

`LoginSignupPopup` observes `authAction` to decide which tab to show and whether to be visible. `AuthButton` calls `openLoginModal()` when clicked.

**Post-auth redirect:** Store `nextLink` before triggering the modal; read it after successful login/signup to redirect the user to the intended page.

---

## 7. Isomorphic Cookie Utilities

`getCookieValue(name)` and `setCookieValue(name, value, options?)` in `src/lib/utils/cookie/isomorphic.ts` (imported as `@/lib/utils`) are isomorphic helpers used throughout:

| Context | Read (`getCookieValue`) | Write (`setCookieValue`) |
|---------|------------------------|--------------------------|
| Browser | `js-cookie` (`Cookies.get`) | `js-cookie` (`Cookies.set`) |
| Server Action / Route Handler | `next/headers` `cookies().get()` | `next/headers` `cookies().set()` |
| Pure RSC (read-only server) | `next/headers` `cookies().get()` | Silently skipped (no-op) |

`isServer = typeof window === "undefined"` is the branch condition.

---

## 8. Search Flow (Stub)

GitNexus tracks three `HandleSearch` processes:

- **LoginContent → HandleSearch** (cross-community)
- **SignupContent → HandleSearch** (intra-community)
- **RegisterForm → HandleSearch** (intra-community)

These trace the `SearchBar` component (`src/components/shared/search-bar.tsx`) receiving focus or input events inside auth-related forms. The search functionality itself is a UI stub — no backend call is currently wired.

---

## Cross-Reference

| For details on… | See |
|-----------------|-----|
| Component structure and routes | [`docs/screens.md`](screens.md) |
| Folder layout and clusters | [`docs/architecture.md`](architecture.md) |
| Production env vars and cookies | [`docs/deploy.md`](deploy.md) |
| Go API token endpoints | [`be/docs/deploy.md`](../../be/docs/deploy.md) |
| Full README with code examples | [`README.md`](../README.md) |
