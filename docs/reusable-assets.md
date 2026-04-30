# Reusable Assets

All reusable utilities, types, hooks, stores, schemas, constants, and shared logic across `fe-mycourse`. Check this file **before** creating any new utility or type to prevent duplication.

---

## TypeScript Types & Interfaces

### Asset: ApiResponse
- **Name**: `ApiResponse<T>`
- **Type**: Interface
- **Path**: `src/types/api.ts`
- **Purpose**: Standard JSON envelope for every BE API response — mirrors `be/pkg/response/response.go`. `code === 0` means success; any other value is an application-level error.
- **Scope**: All API callers and Service functions.
- **Dependencies**: none.

### Asset: ApiResult
- **Name**: `ApiResult<T>`
- **Type**: Interface
- **Path**: `src/types/api.ts`
- **Purpose**: Return shape for low-level HTTP helpers (`apiFetch`, `apiPost`, etc.) — wraps `data`, `statusCode`, `headers`, `cookies`.
- **Scope**: `src/api/methods.ts`, `src/api/callers/**`.
- **Dependencies**: none.

### Asset: ApiPageInfo
- **Name**: `ApiPageInfo`
- **Type**: Interface
- **Path**: `src/types/api.ts`
- **Purpose**: Pagination metadata — mirrors `be/pkg/response.PageInfo` (`page`, `per_page`, `total_pages`, `total_items`).
- **Scope**: Any list endpoint response.
- **Dependencies**: none.

### Asset: ApiPaginatedData / ApiPaginatedResponse
- **Name**: `ApiPaginatedData<T>`, `ApiPaginatedResponse<T>`
- **Type**: Interface / Type alias
- **Path**: `src/types/api.ts`
- **Purpose**: Paginated response shape — `result` array + `page_info`. Use as the generic for `ApiResponse` when the endpoint returns a list.
- **Scope**: Any list endpoint.
- **Dependencies**: `ApiPageInfo`.

### Asset: MeResponse
- **Name**: `MeResponse`
- **Type**: Interface
- **Path**: `src/types/auth/auth.ts`
- **Purpose**: Shape of the current user returned by `GET /api/v1/me` — mirrors `be/dto/auth.go MeResponse`.
- **Scope**: `useAuth`, `useMeStore`, any component that reads the current user.
- **Dependencies**: none.

### Asset: LoginResponse / RefreshTokenResponse
- **Name**: `LoginResponse`, `RefreshTokenResponse`
- **Type**: Interface
- **Path**: `src/types/auth/auth.ts`
- **Purpose**: Response bodies for login and token refresh endpoints.
- **Scope**: `src/api/callers/auth/auth.ts`, `src/actions/auth/auth.ts`, `src/api/instance.ts` interceptor.
- **Dependencies**: none.

### Asset: AuthActions
- **Name**: `AuthActions`
- **Type**: Union type (`"none" | "login" | "signup" | "logout"`)
- **Path**: `src/types/auth/auth.ts`
- **Purpose**: Tracks the current auth modal state in `useAuthStore`.
- **Scope**: `src/store/auth/auth.ts`, `src/components/common/auth-menu/`.
- **Dependencies**: none.

### Asset: AuthActionResult
- **Name**: `AuthActionResult`
- **Type**: Interface (`{ success, message, code }`)
- **Path**: `src/actions/auth/auth.ts`
- **Purpose**: Standard return type for all auth Server Actions.
- **Scope**: `loginAction`, `signupAction` and any future auth Server Action.
- **Dependencies**: none.

### Asset: ApiErrorEntry
- **Name**: `ApiErrorEntry`
- **Type**: Interface
- **Path**: `src/store/api-error-store.ts`
- **Purpose**: Shape of a stored API error entry — `id`, `statusCode`, `appCode`, `message`, `url`, `method`, `timestamp`.
- **Scope**: `useApiError` store, error display components.
- **Dependencies**: none.

---

## Error Codes & Constants

### Asset: ApiErrorCode
- **Name**: `ApiErrorCode`
- **Type**: Constant object (mirrors `be/pkg/errcode/codes.go`)
- **Path**: `src/types/api.ts`
- **Purpose**: FE-side mirror of BE application error codes. Use to compare `response.code` in callers and Server Actions instead of hardcoding numeric values.
- **Scope**: All API callers, Server Actions, interceptors.
- **Dependencies**: none.
- **Current Usage**: `src/api/instance.ts`, `src/actions/auth/auth.ts`, `src/api/callers/auth/auth.ts`.
- **Reuse Rule**: Always import from here. Never hardcode `code === 0` or `code === 3002` inline.

### Asset: API_PUBLIC_ROUTES
- **Name**: `API_PUBLIC_ROUTES`
- **Type**: Constant object
- **Path**: `src/constants/api-route.ts`
- **Purpose**: All public (unauthenticated) BE API endpoint paths. Prevents scattered hardcoded strings.
- **Current Entries**: `auth.login`, `auth.signup`, `auth.refresh`.
- **Scope**: API callers, `api/instance.ts` token refresh interceptor.
- **Dependencies**: none.

### Asset: API_PRIVATE_ROUTES
- **Name**: `API_PRIVATE_ROUTES`
- **Type**: Constant object
- **Path**: `src/constants/api-route.ts`
- **Purpose**: All authenticated BE API endpoint paths.
- **Current Entries**: `user.getMe`.
- **Scope**: API callers.
- **Dependencies**: none.

### Asset: PUBLIC_ROUTES
- **Name**: `PUBLIC_ROUTES`
- **Type**: Constant object
- **Path**: `src/constants/route.ts`
- **Purpose**: FE client-side route constants (paths for navigation).
- **Current Entries**: `home: "/"`.
- **Scope**: Navigation helpers, links, router.
- **Dependencies**: none.

### Asset: BASIC_ACTIONS
- **Name**: `BASIC_ACTIONS`
- **Type**: Constant object
- **Path**: `src/constants/actions.ts`
- **Purpose**: Maps BE RBAC permission code strings to named constants for FE permission checks.
- **Scope**: Any component or guard that checks the current user's permissions.
- **Dependencies**: none.

### Asset: HEADER_DROPDOWN_ITEMS
- **Name**: `HEADER_DROPDOWN_ITEMS`
- **Type**: Constant (`UserMenuGroup[]`)
- **Path**: `src/constants/common.ts`
- **Purpose**: Static configuration for the user dropdown menu in the header.
- **Scope**: `src/components/common/auth-menu/user-menu.tsx`.
- **Dependencies**: `UserMenuGroup`, `UserMenuItem` (also in `common.ts`).

### Asset: LANGUAGE_OPTIONS
- **Name**: `LANGUAGE_OPTIONS`
- **Type**: Constant array
- **Path**: `src/constants/common.ts`
- **Purpose**: Locale options for the locale switcher — `{ locale, label }`.
- **Scope**: `src/components/common/header/locale-switcher.tsx`.
- **Dependencies**: none.

---

## Utility Functions

### Asset: cn
- **Name**: `cn(...inputs: ClassValue[]): string`
- **Type**: Utility function
- **Path**: `src/lib/utils/cn.ts`
- **Purpose**: Merge Tailwind class names without conflicts — wraps `clsx` + `tailwind-merge`. **Primary styling utility — use everywhere for conditional classes.**
- **Scope**: All components.
- **Dependencies**: `clsx`, `tailwind-merge`.
- **Reuse Rule**: Never use `clsx` or `tailwind-merge` directly; always use `cn()`.

### Asset: isServer
- **Name**: `isServer(): boolean`
- **Type**: Utility function
- **Path**: `src/lib/utils/runtime.ts`
- **Purpose**: Returns `true` when running on the server (SSR/Server Component). Replaces scattered `typeof window === "undefined"` checks.
- **Scope**: Any isomorphic utility that needs to branch on runtime environment.
- **Dependencies**: none.

### Asset: buildQueryParams
- **Name**: `buildQueryParams(url, query?, params?, fragment?): string | null`
- **Type**: Utility function
- **Path**: `src/lib/utils/url.ts`
- **Purpose**: Build a URL from a path template, named route params (`:name` placeholders), query string, and optional fragment. All values are properly URI-encoded to prevent injection.
- **Scope**: API callers (building endpoint keys), navigation helpers.
- **Dependencies**: none.
- **Reuse Rule**: Use whenever building a URL with dynamic segments or query params. Do not do manual string concatenation.

### Asset: getCookieDomain
- **Name**: `getCookieDomain(rawDomain?: string): string | undefined`
- **Type**: Utility function
- **Path**: `src/lib/utils/cookie.ts`
- **Purpose**: Normalize the `AUTH_COOKIE_DOMAIN` env var into a parent domain string. Returns `undefined` on `localhost` so cookies are not domain-scoped during development.
- **Scope**: `src/actions/auth/auth.ts`, any Server Action that sets auth cookies.
- **Dependencies**: none.

### Asset: buildCookieOptions
- **Name**: `buildCookieOptions(input: BuildCookieOptionsInput)`
- **Type**: Utility function
- **Path**: `src/lib/utils/cookie.ts`
- **Purpose**: Returns a consistent cookie options object for `next/headers` `cookies().set()`. Non-HttpOnly by default so client JS can read the token and attach it to the Authorization header.
- **Scope**: `src/actions/auth/auth.ts`, any Server Action that sets auth cookies.
- **Dependencies**: none.
- **Note**: `buildHttpOnlyCookieOptions` is deprecated — use `buildCookieOptions` instead.

### Asset: getCookieValue / setCookieValue
- **Name**: `getCookieValue(name): Promise<string | null>`, `setCookieValue(name, value, options?): Promise<void>`
- **Type**: Isomorphic utility functions
- **Path**: `src/lib/utils/cookie.ts`
- **Purpose**: Unified cookie read/write that works on both client (via `js-cookie`) and server (via `next/headers`). Hides the environment-branching logic.
- **Scope**: Any isomorphic code that needs to read/write cookies (e.g. token extraction in interceptors).
- **Dependencies**: `js-cookie`, `next/headers`, `isServer`.

### Asset: pickCharacter
- **Name**: `pickCharacter(username: string): { label, color, backgroundColor }`
- **Type**: Utility function
- **Path**: `src/lib/utils/user.ts`
- **Purpose**: Derive a deterministic avatar fallback from a username — 1–2 letter label and a stable HSL color pair. Pure function, no I/O.
- **Scope**: Any avatar component that needs to show a fallback when no image is available.
- **Dependencies**: none.

### Asset: useUniqueId
- **Name**: `useUniqueId(prefix?: string): string`
- **Type**: React hook (utility)
- **Path**: `src/lib/utils/react.ts`
- **Purpose**: Stable, hydration-safe unique ID for DOM/SVG/a11y attributes. Combines React `useId` with FNV-1a noise. Never uses `Math.random()` in render.
- **Scope**: Any component needing a stable element ID.
- **Dependencies**: `react` (`useId`).

---

## Zod Schemas

### Asset: loginSchema / LoginFormValues
- **Name**: `loginSchema`, `LoginFormValues`
- **Type**: Zod schema + inferred type
- **Path**: `src/schema/auth/auth.ts`
- **Purpose**: Validates login form — `email`, `password`, `rememberMe`. Validation messages are i18n keys (`"validation.email"`, `"validation.password"`) — components translate via `useTranslations("auth")`.
- **Scope**: `src/components/common/auth-menu/auth/login-content.tsx`.
- **Dependencies**: `zod`.
- **Reuse Rule**: Use `zodResolver(loginSchema)` with `react-hook-form`. Never re-define inline.

### Asset: signupSchema / SignupFormValues
- **Name**: `signupSchema`, `SignupFormValues`
- **Type**: Zod schema + inferred type
- **Path**: `src/schema/auth/auth.ts`
- **Purpose**: Validates signup form — `fullName`, `email`, `password`. Same i18n key pattern.
- **Scope**: `src/components/common/auth-menu/auth/signup-content.tsx`.
- **Dependencies**: `zod`.

---

## Zustand Stores

### Asset: useAuthStore
- **Name**: `useAuthStore`
- **Type**: Zustand store
- **Path**: `src/store/auth/auth.ts`
- **Purpose**: Tracks the active auth modal (`authAction`: none/login/signup/logout) and post-auth redirect path (`nextLink`). Methods: `openLoginModal(nextPath?)`, `openSignupModal(nextPath?)`, `closeAllModals()`.
- **Scope**: Any component that opens/closes auth modals or checks auth modal state.
- **Dependencies**: `zustand`.
- **Reuse Rule**: Do not use local state for auth modal visibility — always use `useAuthStore`.

### Asset: useMeStore
- **Name**: `useMeStore`
- **Type**: Zustand store
- **Path**: `src/store/auth/auth.ts`
- **Purpose**: Holds the current user (`me`), loading state, error, and permissions. Synced from SWR `useAuth` via `useSyncMeFromAuth` in `AppProviders`. Read from any component via `useGetMe()`.
- **Scope**: Any component that needs the current user without directly calling SWR.
- **Dependencies**: `zustand`, `swr` (for `mutate`).
- **Reuse Rule**: Always read the current user via `useGetMe()` (not `useAuth()` directly). Only `MeSwrSync` in `AppProviders` calls `useSyncMeFromAuth`.

### Asset: useApiError
- **Name**: `useApiError`
- **Type**: Zustand store
- **Path**: `src/store/api-error-store.ts`
- **Purpose**: Global API error log — populated automatically by the Axios response interceptor. Keeps at most 20 entries. Methods: `push(error)`, `remove(id)`, `clear()`.
- **Scope**: Error display components, toast-on-error listeners.
- **Dependencies**: `zustand`.

---

## React Hooks

### Asset: useAuth
- **Name**: `useAuth(): UseAuthReturn`
- **Type**: SWR hook
- **Path**: `src/api/hooks/auth/useAuth.ts`
- **Purpose**: Fetches `GET /api/v1/me` via SWR — returns `{ me, isLoading, error, mutate }`. Returns `null` for 401 (unauthenticated) without throwing. Auto-revalidates on window focus.
- **Scope**: `useSyncMeFromAuth` in `AppProviders` only. Do not call directly in feature components — use `useGetMe()` instead.
- **Dependencies**: `swr`, `getMeService`, `getMeEndpointKey`.

### Asset: useGetMe
- **Name**: `useGetMe(): MeStoreState`
- **Type**: Custom hook (Zustand selector)
- **Path**: `src/hooks/auth/use-auth-store.ts`
- **Purpose**: Read the current user from `useMeStore` with a shallow-equal selector. Returns `{ me, isLoading, isError, mePermissions, mutateMe }`.
- **Scope**: Any component that needs current user info (preferred over `useAuth`).
- **Dependencies**: `useMeStore`, `zustand/react/shallow`.

### Asset: useSyncMeFromAuth
- **Name**: `useSyncMeFromAuth(): void`
- **Type**: Custom hook
- **Path**: `src/hooks/auth/use-auth-store.ts`
- **Purpose**: Bridges SWR `useAuth` → `useMeStore`. Called once inside `MeSwrSync` component in `AppProviders`. Keeps global Zustand state in sync with SWR cache.
- **Scope**: `src/components/providers/app-providers.tsx` (`MeSwrSync`) only.
- **Dependencies**: `useAuth`, `useMeStore`.

---

## API Layer Functions

### Asset: apiFetch / apiPost / apiPut / apiDelete / apiOptions
- **Name**: `apiFetch<T>`, `apiPost<T,D>`, `apiPut<T,D>`, `apiDelete<T>`, `apiOptions<T>`
- **Type**: HTTP method wrappers
- **Path**: `src/api/methods.ts`
- **Purpose**: Thin wrappers around the shared Axios `apiInstance`. All return `ApiResult<T>` (data + statusCode + headers + cookies). Support `headers`, `cookies` (server-side forwarding), `params`, and `otherAxiosInstance` options.
- **Scope**: All API callers in `src/api/callers/**`. **Do not call `apiInstance.get/post/...` directly.**
- **Dependencies**: `apiInstance`, `ApiResult`.

### Asset: apiInstance
- **Name**: `apiInstance`
- **Type**: Axios instance
- **Path**: `src/api/instance.ts`
- **Purpose**: Shared Axios instance with: `baseURL` from `NEXT_PUBLIC_API_URL`/`API_URL`; request interceptor that attaches `access_token` cookie as `Authorization: Bearer`; response interceptor that detects `X-Token-Expired` header and performs transparent token refresh with client-side mutex (prevents refresh stampede).
- **Scope**: Used exclusively via `apiFetch`/`apiPost` etc. in `src/api/methods.ts`.
- **Dependencies**: `axios`, `js-cookie`, `getCookieValue`, `setCookieValue`, `isServer`, `useApiError`.

### Asset: getMeService / getMeEndpointKey
- **Name**: `getMeService(): Promise<MeResponse | null>`, `getMeEndpointKey: string | null`
- **Type**: API service + SWR key
- **Path**: `src/api/callers/auth/auth.ts`
- **Purpose**: Fetches `GET /api/v1/me`. Returns `null` on 401. `getMeEndpointKey` is the canonical SWR cache key — always import from here instead of building the URL manually.
- **Scope**: `useAuth` hook.
- **Dependencies**: `apiFetch`, `buildQueryParams`, `API_PRIVATE_ROUTES`.

### Asset: loginService
- **Name**: `loginService(payload: LoginPayload): Promise<{ data, cookies }>`
- **Type**: API service
- **Path**: `src/api/callers/auth/auth.ts`
- **Purpose**: Calls `POST /api/v1/auth/login`. Returns both the response body (`data`) and parsed `Set-Cookie` headers (`cookies`) so the Server Action can re-set cookies for the browser.
- **Scope**: `loginAction` Server Action.
- **Dependencies**: `apiPost`, `API_PUBLIC_ROUTES`.

---

## Server Actions

### Asset: loginAction
- **Name**: `loginAction(payload: LoginPayload): Promise<AuthActionResult>`
- **Type**: Next.js Server Action (`"use server"`)
- **Path**: `src/actions/auth/auth.ts`
- **Purpose**: Handles login end-to-end on the server — calls `loginService`, sets `access_token`, `refresh_token`, `session_id` cookies for the browser, and returns `AuthActionResult`. Cookies are non-HttpOnly so client JS can read them for `Authorization` header attachment.
- **Scope**: Login form's `onSubmit` handler in `login-content.tsx`.
- **Dependencies**: `loginService`, `buildCookieOptions`, `getCookieDomain`, `next/headers cookies()`.

### Asset: signupAction
- **Name**: `signupAction(payload: SignupPayload): Promise<AuthActionResult>`
- **Type**: Next.js Server Action (`"use server"`)
- **Path**: `src/actions/auth/auth.ts`
- **Purpose**: Placeholder — signup not yet implemented. Returns `{ success: false }`.
- **Scope**: `signup-content.tsx` (placeholder).
- **Dependencies**: none (yet).

---

## Supporting Type Utilities

### Asset: isApiSuccess
- **Name**: `isApiSuccess<T>(res: ApiResponse<T>): boolean`
- **Type**: Type guard function
- **Path**: `src/types/api.ts`
- **Purpose**: Returns `true` and narrows type to `ApiResponse<T> & { data: T }` when `res.code === 0`. Use instead of comparing `res.code === ApiErrorCode.Success` directly.
- **Scope**: All API service functions and Server Actions that check response success.
- **Dependencies**: `ApiErrorCode`.

---

## Gap Analysis (What Must Be Created Later)

- Reusable permission guard hook (e.g. `useHasPermission(permission: string): boolean`) using `mePermissions` from `useMeStore`.
- Shared form error display component.
- Reusable paginated list hook when list endpoints are implemented.
- Course, lesson, enrollment types and service callers (Phase 02+).
- Shared loading skeleton component.
