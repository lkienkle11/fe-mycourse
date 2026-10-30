# Code Change Inventory

Companion to `design.md` and `tasks.md`. It carries, for every file this change touches, the CURRENT code (read from `HEAD dab5c1a`, branch `docs/restructure-docs-agents-and-skills`), the exact AFTER code, call sites, the existing resource that justifies creating nothing new, the tests and the verification command. Frontend only (`fe-mycourse`). Line numbers are `HEAD` references; re-locate by quoting the CURRENT snippet. Sections 0-5 describe Phase 1 (clear dead session cookies, C1-C14, T1-T9; applied and green on this branch, uncommitted). Section 6 describes Phase 2 (retryable current-user outage and shared sign-in gates, C15-C29, T10-T20; proposed, not applied).

GitNexus note: `gitnexus_impact` on `attemptRefresh` returned `UNKNOWN` with 0 callers (the index was 2 commits behind and file-private symbols resolve poorly). Callers below come from `grep`/`Read`. The project rule still requires `gitnexus_impact` (upstream) for every edited symbol before the first edit, `gitnexus_detect_changes` before commit, and reporting HIGH/CRITICAL to the user first. Re-run `npx gitnexus analyze` before the impact runs (task 2.3).

## 0. Capability audit verdicts (what already exists, what is new)

| ID | Capability | Verdict | Owner module |
|---|---|---|---|
| CAP-1 | Clear all session cookies (access, refresh, session id, expiry, legacy max-age) | REUSE as-is | `clearAuthSessionCookies`, `src/lib/utils/auth-session.ts` L228 |
| CAP-2 | Read refresh/session cookies on the server | REUSE as-is (and remove the route's duplicate direct `cookies()` read) | `readAuthCookiesFromRequest`, `src/api/auth/server-auth.ts` L43 |
| CAP-3 | Persist rotated tokens as cookies from server code | REUSE as-is | `createPersistRotatedSessionFromRequest`, `server-auth.ts` L52 (wraps `setAuthSessionCookies`) |
| CAP-4 | Call the backend refresh endpoint | REUSE as-is | `rawPostRefreshUpstream`, `src/api/auth/refresh-upstream-raw.ts` |
| CAP-5 | "Refresh rejection means the session is dead" decision | NEW, one function, shared by route and transport | `isDeadSessionRefreshStatus`, `src/api/auth/auth-refresh.ts` (next to `isRefreshEligible`) |
| CAP-6 | Carry the upstream HTTP status of a failed server-side refresh | EXTEND existing error | `ApiRefreshValidationError.upstreamStatus`, `src/api/core/fetch-error.ts` |
| CAP-7 | Clear cookies from the server-writable transport branch | NEW optional callback, parallel to `persistRotatedSession`, and the same factory feeds the route | `createClearSessionFromRequest`, `server-auth.ts` |
| CAP-8 | Tell the browser the proxy cleared the session | NEW marker, guard next to the other proxy-DTO parser | `isSessionClearedRefreshResponse`, `auth-refresh.ts` |
| CAP-9 | Send a typed cross-tab event from non-React code | EXTRACT the body of the existing hook into a plain function; the hook becomes a thin wrapper | `sendBroadcastOutbound`, `src/events/broadcast/send-broadcast-outbound.ts` |
| CAP-10 | Receive the cross-tab logout and reload | REUSE as-is | `useAuthLogoutTabSync`, `AuthLogoutTabSync` |
| CAP-11 | Logout reason strings | NEW constants, adopted by the existing sender | `BROADCAST_LOGOUT_REASON`, `src/constants/events/index.ts` |
| CAP-12 | Cross-tab mutual exclusion | NEW, private helper in the only module that refreshes in the browser | `runWithCrossTabRefreshLock`, `src/api/auth/browser-auth.ts` |
| CAP-13 | Route handler testable without a Next request scope | EXTRACT the handler body to an injectable module (pure move) | `handleRefreshProxy`, `src/api/auth/refresh-proxy.ts` |

Kept separate on purpose (different semantics, searched across `src/`): `clearOAuthFlowCookies` (`src/lib/utils/oauth-popup-cookies.ts`, temporary OAuth state cookies); `clearAuthCookiesClient` (`src/lib/utils/cookie.ts` L98, deprecated no-op); `classifyApiError` (`src/lib/utils/api-error.ts` L95, UI error screens); `mapAuthApiError` (`src/lib/utils/auth-action.ts`, action result mapping); `getMeService` (`src/api/callers/auth/auth-factory.ts` L73, 401 to `null`); SWR dedupe constants (`src/constants/swr.ts`); course edit leases (`useCourseLeaseState`); `dedupeByLabel` (instructor application). No other implementation of session clearing, refresh-status classification or cross-tab locking exists.

## 1. Reuse ledger (imported, never re-implemented)

| Resource | Path | Used for |
|---|---|---|
| `clearAuthSessionCookies` | `src/lib/utils/auth-session.ts` | the only cookie remover |
| `readAuthCookiesFromRequest` | `src/api/auth/server-auth.ts` | proxy credentials |
| `createPersistRotatedSessionFromRequest` | `src/api/auth/server-auth.ts` | proxy persistence |
| `rawPostRefreshUpstream` | `src/api/auth/refresh-upstream-raw.ts` | proxy upstream call (unchanged) |
| `validateRotatedTokens`, `parseExactRefreshSuccessEnvelope`, `isRefreshEligible` | `src/api/auth/auth-refresh.ts` | proxy validation, transport eligibility (unchanged) |
| `isApiHttpError`, `ApiTimeoutError`, `parseApiErrorEnvelope`, `sanitizeApiErrorCause` | `src/api/core/fetch-error.ts` | error handling (unchanged) |
| `ApiErrorCode` | `src/constants/api-error-code.ts` | allowlist (unchanged) |
| `API_PUBLIC_ROUTES.auth.refresh` | `src/constants/api-route.ts` | upstream URL (unchanged) |
| `postBroadcastOutbound`, `nextStreamOutboundMetadata` | `src/events/broadcast/broadcast-transport.ts`, `src/events/core/outbound-metadata.ts` | moved sender body |
| `useBroadcastStreamEvent`, `useAuthLogoutTabSync`, `AuthLogoutTabSync` | `src/hooks/**`, `src/components/providers/**` | receiving side (unchanged) |
| `broadcastLogoutPayload` Zod schema, `BroadcastLogoutPayload` type | `src/events/core/normalize-inbound.ts` L34-36, `src/types/events/broadcast/index.ts` | already accepts any string `reason` (unchanged) |
| `server` (MSW), `okEnvelope` | `src/test-support/msw/server.ts`, `envelope.ts` | tests |
| `FIXTURE_USERS`, `login`, `revokeSession` | `e2e/support/*`, local helper in `e2e/tests/auth.spec.ts` | e2e |

## 2. Findings that constrain the design (read first)

1. `cookies()` in a Route Handler returns the snapshot of the incoming request plus its own mutations. The server therefore cannot detect that another tab already wrote newer cookies; compare-and-clear is impossible. The fix instead removes concurrency with a cross-tab lock.
2. `jest.mock()` does not hoist under this repo's `next/jest` SWC transform (`docs/testing.md`), and `cookies()` throws outside a request scope. The route logic must be reachable through injected collaborators; `route.ts` can only export HTTP handlers (Next validates route exports), so the logic moves to `src/api/auth/refresh-proxy.ts`.
3. `refreshUpstreamSession` (`server-auth.ts` L69) turns every `ApiHttpError` into `ApiRefreshValidationError` and `sanitizeApiErrorCause` (`fetch-error.ts` L200) keeps only `kind`/`reason`; the HTTP status is lost before `attemptRefresh` can decide. `sanitizeApiErrorCause` must keep dropping it (logs/store must not receive new data).
4. `performBrowserRefresh` (`browser-auth.ts` L41) maps every non-2xx to the same `invalid-envelope` failure; it must also read the proxy marker.
5. The listener `useAuthLogoutTabSync` ignores the payload and always reloads; the Zod schema accepts any string `reason`; therefore no change on the receiving side is needed.
6. One `BroadcastChannel` instance per tab sends and receives (`broadcast-transport.ts`); a channel does not deliver to the instance that posted, so the sending tab does not reload itself.
7. `postBroadcastOutbound` lazily creates the channel; it does not require `startBroadcastTransport()`. It is a no-op on the server (no `window`).
8. Server Actions are the only users of `server-writable` (`src/actions/auth/{auth,google-oauth,discord-oauth,x-oauth}.ts`), where cookies are writable.
9. No ESLint/Madge/Knip rule forbids `src/api/**` importing `src/events/**`; `browser-api-methods.ts` already imports a Zustand store. `npm run quality:deps` (Madge + jscpd) must still pass.
10. `BroadcastOutboundSendInput` is imported only inside `use-send-broadcast-outbound.ts` (grep): no re-export is needed after the move.
11. Biome/tooling configuration, `SEO_TEMPORARY_ENV_CACHE_POLICY` and `src/proxy.ts` stay untouched (tooling rule protection and non-goals).

## 3. Edits per file

### C1. `src/api/auth/auth-refresh.ts` (isomorphic) — ADD two functions

CURRENT (L26-41): `export function isRefreshEligible(input: {...}): boolean { ... return false; }` followed by `export function validateRotatedTokens(...)`.

AFTER — insert directly after `isRefreshEligible` (before `validateRotatedTokens`):

```ts
/**
 * A refresh the backend rejects with 401 or 403 (RefreshTokenExpired,
 * InvalidSession, UserDisabled, UserBanned) proves the session is dead.
 * Anything else (400, 429, 5xx, timeout, unknown) is transient or unrelated.
 */
export function isDeadSessionRefreshStatus(
  status: number | undefined,
): boolean {
  return status === 401 || status === 403;
}
```

AFTER — append at the end of the file (after `parseExactBrowserRefreshProxySuccess`):

```ts
/** True when the refresh proxy error body says it cleared the session cookies. */
export function isSessionClearedRefreshResponse(data: unknown): boolean {
  return (
    !!data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    (data as Record<string, unknown>).session_cleared === true
  );
}
```

Call sites: `refresh-proxy.ts` (C6), `api-transport.ts` (C5), `browser-auth.ts` (C8). Reuse: sits with the existing refresh decisions; no new file. Tests: T1. Verify: `JEST_PROJECT=node npx jest src/api/auth/auth-refresh.test.ts`.

### C2. `src/api/core/fetch-error.ts` — MODIFY `ApiRefreshValidationError`

CURRENT (L145-161):

```ts
export class ApiRefreshValidationError extends Error {
  readonly kind = "refresh-validation" as const;
  readonly reason: ApiRefreshValidationReason;
  readonly cause?: unknown;

  constructor(input: {
    reason: ApiRefreshValidationReason;
    message: string;
    cause?: unknown;
  }) {
    super(input.message);
    this.name = "ApiRefreshValidationError";
    this.reason = input.reason;
    this.cause = input.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

AFTER:

```ts
export class ApiRefreshValidationError extends Error {
  readonly kind = "refresh-validation" as const;
  readonly reason: ApiRefreshValidationReason;
  /** HTTP status of the upstream refresh response when the failure came from one. */
  readonly upstreamStatus?: number;
  readonly cause?: unknown;

  constructor(input: {
    reason: ApiRefreshValidationReason;
    message: string;
    cause?: unknown;
    upstreamStatus?: number;
  }) {
    super(input.message);
    this.name = "ApiRefreshValidationError";
    this.reason = input.reason;
    this.upstreamStatus = input.upstreamStatus;
    this.cause = input.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

`sanitizeApiErrorCause` (L200-218) stays unchanged on purpose. Existing constructors (`auth-refresh.ts` L47..., `browser-auth.ts` L53, `server-auth.ts` L60/L96/L102) keep compiling because the field is optional. Tests: T3, T4. Verify: `npx tsc --noEmit`.

### C3. `src/api/auth/auth-runtime.ts` — MODIFY types

CURRENT (L6-8 and L40-51):

```ts
export type BrowserRefreshResult =
  | { ok: true; accessToken: string }
  | { ok: false; cause?: unknown };
...
export type AuthRuntimeAdapter =
  | { kind: "browser-proxy"; refresh: () => Promise<BrowserRefreshResult> }
  | {
      kind: "server-writable";
      readAuthCookies: ReadAuthCookiesFn;
      refresh: (input: RefreshSessionInput) => Promise<RefreshSessionResult>;
      persistRotatedSession: PersistRotatedAuthSessionFn;
    }
```

AFTER:

```ts
export type BrowserRefreshResult =
  | { ok: true; accessToken: string }
  | { ok: false; cause?: unknown; sessionCleared?: true };
...
export type ClearAuthSessionFn = () => Promise<void>;
...
  | {
      kind: "server-writable";
      readAuthCookies: ReadAuthCookiesFn;
      refresh: (input: RefreshSessionInput) => Promise<RefreshSessionResult>;
      persistRotatedSession: PersistRotatedAuthSessionFn;
      /** Removes the session cookies when the BE proves the session is dead. */
      clearSession?: ClearAuthSessionFn;
    }
```

`ClearAuthSessionFn` goes next to `PersistRotatedAuthSessionFn` (L24-27). Call sites: C4, C5, C6, test fakes. Verify: `npx tsc --noEmit`.

### C4. `src/api/auth/server-auth.ts` (server-only) — ADD factory, MODIFY two spots

1. Import list: add `ClearAuthSessionFn` to the `import type { ... } from "./auth-runtime"` block (L33-38), alphabetically before `PersistRotatedAuthSessionFn`.
2. ADD after `createPersistRotatedSessionFromRequest` (after L67):

```ts
export function createClearSessionFromRequest(): ClearAuthSessionFn {
  return async () => {
    const { clearAuthSessionCookies } = await import(
      "@/lib/utils/auth-session"
    );
    await clearAuthSessionCookies();
  };
}
```

(same dynamic-import pattern and reason as the persist factory: keep `next/headers` out of the transport import graph.)

3. MODIFY `refreshUpstreamSession`, branch at L95-101. CURRENT:

```ts
    if (isApiHttpError(error)) {
      throw new ApiRefreshValidationError({
        reason: "invalid-envelope",
        message: `Upstream refresh HTTP ${error.response.status}`,
        cause: sanitizeApiErrorCause(error),
      });
    }
```

AFTER:

```ts
    if (isApiHttpError(error)) {
      throw new ApiRefreshValidationError({
        reason: "invalid-envelope",
        message: `Upstream refresh HTTP ${error.response.status}`,
        cause: sanitizeApiErrorCause(error),
        upstreamStatus: error.response.status,
      });
    }
```

4. MODIFY `createWritableServerApiTransportFromRequest` (L110-124): CURRENT `persistRotatedSession: createPersistRotatedSessionFromRequest(),` AFTER adds the next line `clearSession: createClearSessionFromRequest(),`.

Call sites of the writable factory: `src/actions/auth/{auth,google-oauth,discord-oauth,x-oauth}.ts` (unchanged), `src/api/index.ts`. Tests: T4. Verify: `npx tsc --noEmit`.

### C5. `src/api/transport/api-transport.ts` (isomorphic, no Next imports) — MODIFY

Imports: add `isDeadSessionRefreshStatus` to the `from "../auth/auth-refresh"` import (L22-25, currently `isRefreshEligible, requestSentNonEmptyBearer`); add `ApiRefreshValidationError` to the `from "../core/fetch-error"` import (L40-54) between `ApiRefreshRequiredError` and `ApiRequestReplayError`.

`attemptRefresh` server-writable `catch` (L295-297). CURRENT:

```ts
  } catch (error) {
    return { ok: false, cause: sanitizeApiErrorCause(error) };
  }
```

AFTER:

```ts
  } catch (error) {
    if (
      error instanceof ApiRefreshValidationError &&
      isDeadSessionRefreshStatus(error.upstreamStatus)
    ) {
      try {
        await runtime.clearSession?.();
      } catch {
        // Best effort: the caller must still see the original refresh failure.
      }
    }
    return { ok: false, cause: sanitizeApiErrorCause(error) };
  }
```

`createBrowserApiTransport` (L459-466). CURRENT:

```ts
export function createBrowserApiTransport(
  pushApiError: ApiErrorStorePush,
): ApiTransport {
  return createApiTransport({
    runtime: createBrowserProxyRuntimeAdapter(),
    pushApiError,
  });
}
```

AFTER:

```ts
export function createBrowserApiTransport(
  pushApiError: ApiErrorStorePush,
  onSessionCleared?: () => void,
): ApiTransport {
  return createApiTransport({
    runtime: createBrowserProxyRuntimeAdapter({ onSessionCleared }),
    pushApiError,
  });
}
```

Not touched: `attemptRefresh` browser-proxy branch (L269-278; the callback runs inside the single-flight, C8), the reporter, `ApiRefreshRequiredError` throw for read-only. Callers of `attemptRefresh`: `createApiTransport().request` L418 only. Callers of `createBrowserApiTransport`: `browser-api-methods.ts` L19 (C9), `src/api/index.ts` re-export. Tests: T3, T5. Verify: `rg "next/headers" src/api/transport` prints nothing.

### C6. `src/api/auth/refresh-proxy.ts` — NEW (moved code + new behaviour)

Moved unchanged from `route.ts`: `REFRESH_PROXY_ALLOWED_CODES`, `REFRESH_PROXY_SAFE_MESSAGES`, `BrowserRefreshProxySuccess`, `BrowserRefreshProxyError` (gains one optional field), `sanitizeRefreshProxyCode`, `sanitizeRefreshProxyMessage`, `errorDto` (gains one parameter), the docblock "Browser-safe refresh proxy (PENDING-06)" and the `POST` body. The only edits to the moved logic are marked `// NEW`.

```ts
import { NextResponse } from "next/server";
import { ApiErrorCode } from "@/constants/api-error-code";
import { API_PUBLIC_ROUTES } from "@/constants/api-route";
import type { ApiResponse } from "@/types/api";
import type { RefreshTokenResponse } from "@/types/auth";
import {
  ApiTimeoutError,
  isApiHttpError,
  parseApiErrorEnvelope,
} from "../core/fetch-error";
import {
  isDeadSessionRefreshStatus,
  parseExactRefreshSuccessEnvelope,
  validateRotatedTokens,
} from "./auth-refresh";
import type {
  ClearAuthSessionFn,
  PersistRotatedAuthSessionFn,
  ReadAuthCookiesFn,
} from "./auth-runtime";
import { rawPostRefreshUpstream } from "./refresh-upstream-raw";

// REFRESH_PROXY_ALLOWED_CODES, REFRESH_PROXY_SAFE_MESSAGES: moved verbatim.

type BrowserRefreshProxySuccess = { code: number; message: string; data: { access_token: string } }; // verbatim
type BrowserRefreshProxyError = {
  code: number;
  message: string;
  data: null;
  /** NEW: present only when the proxy removed the session cookies. */
  session_cleared?: true;
};

export type RefreshProxyResponse = NextResponse<BrowserRefreshProxySuccess | BrowserRefreshProxyError>; // NEW (route return type)

export type RefreshProxyDeps = { // NEW
  readAuthCookies: ReadAuthCookiesFn;
  persistSession: PersistRotatedAuthSessionFn;
  clearSession: ClearAuthSessionFn;
  baseURL: string;
  timeoutMs: number;
};

// sanitizeRefreshProxyCode, sanitizeRefreshProxyMessage: moved verbatim.

function errorDto(status: number, code: number = ApiErrorCode.Unknown, sessionCleared = false): NextResponse<BrowserRefreshProxyError> {
  const safeCode = sanitizeRefreshProxyCode(code);
  return NextResponse.json(
    {
      code: safeCode,
      message: sanitizeRefreshProxyMessage(safeCode),
      data: null,
      ...(sessionCleared ? { session_cleared: true as const } : {}), // NEW
    },
    { status },
  );
}

async function tryClearSession(clearSession: ClearAuthSessionFn): Promise<boolean> { // NEW
  try {
    await clearSession();
    return true;
  } catch {
    return false; // the original failure is still reported, without the marker
  }
}

export async function handleRefreshProxy(deps: RefreshProxyDeps): Promise<RefreshProxyResponse> {
  const { refreshToken, sessionId } = await deps.readAuthCookies(); // was: cookies().get(...) in route.ts
  if (!refreshToken?.trim() || !sessionId?.trim()) {
    return errorDto(401, ApiErrorCode.Unauthorized); // unchanged: no clear, no marker
  }
  try {
    const { data: envelope, setCookieHeaders } = await rawPostRefreshUpstream<ApiResponse<RefreshTokenResponse>>(
      deps.baseURL + API_PUBLIC_ROUTES.auth.refresh,
      { refreshToken, sessionId, baseURL: deps.baseURL, timeoutMs: deps.timeoutMs },
    );
    // parseExactRefreshSuccessEnvelope / validateRotatedTokens / 502 branches: verbatim
    // refreshMaxAge = refreshMaxAgeFromBeSetCookie(setCookieHeaders): verbatim (import from "@/lib/utils/auth-session" is server-only, so import parseMaxAgeForCookie + REFRESH_TOKEN_COOKIE exactly as server-auth.ts does)
    try {
      await deps.persistSession(tokens, refreshMaxAge); // was: setAuthSessionCookies({ tokens, refreshMaxAge })
    } catch {
      return errorDto(500, ApiErrorCode.InternalError); // unchanged
    }
    return NextResponse.json({ code: successEnvelope.code, message: successEnvelope.message, data: { access_token: tokens.access_token } }, { status: 200 }); // verbatim
  } catch (error) {
    if (isApiHttpError(error)) {
      const status = error.response.status;
      const parsed = parseApiErrorEnvelope(error.response.data);
      if (status >= 400 && status <= 599) {
        // NEW: a 401/403 from the BE proves the session is dead
        const sessionCleared = isDeadSessionRefreshStatus(status) ? await tryClearSession(deps.clearSession) : false;
        // Never forward raw BE message; only allowlisted codes + fixed copy.
        return errorDto(status, parsed.code, sessionCleared);
      }
    }
    if (error instanceof ApiTimeoutError) return errorDto(504, ApiErrorCode.Unknown); // verbatim
    return errorDto(502, ApiErrorCode.Unknown); // verbatim
  }
}
```

Implementation notes (binding): (a) `refreshMaxAgeFromBeSetCookie` lives in `src/lib/utils/auth-session.ts` which imports `server-only`; to keep this module free of `server-only`/`next/headers`, the Max-Age is obtained exactly like `server-auth.ts` L85-88 does it: `parseMaxAgeForCookie(setCookieHeaders, REFRESH_TOKEN_COOKIE)` (imports `parseMaxAgeForCookie` from `../core/fetch-helpers` and `REFRESH_TOKEN_COOKIE` from `@/constants/auth-cookie`); `refreshMaxAgeFromBeSetCookie` is that same call, so behaviour is identical. If the implementer prefers importing `refreshMaxAgeFromBeSetCookie`, the module becomes `server-only` and the Jest test T2 must prove it loads, otherwise use the first form. (b) The two `try` blocks that produce `502` (envelope and tokens validation) are moved verbatim.

Reuse: `readAuthCookiesFromRequest`, `createPersistRotatedSessionFromRequest`, `createClearSessionFromRequest` are injected by `route.ts` (C7); `rawPostRefreshUpstream` imported directly. Tests: T2. Verify: `JEST_PROJECT=node npx jest src/api/auth/refresh-proxy.test.ts`.

### C7. `src/app/api/auth/refresh/route.ts` — REPLACE with a thin handler

CURRENT: 170 lines (imports, `DEFAULT_BASE_URL`, `DEFAULT_TIMEOUT_MS`, `resolvedBaseURL`, allowlist, safe messages, DTO types, `sanitizeRefreshProxyCode/Message`, `errorDto`, `POST`).

AFTER (complete file):

```ts
import { handleRefreshProxy } from "@/api/auth/refresh-proxy";
import {
  createClearSessionFromRequest,
  createPersistRotatedSessionFromRequest,
  readAuthCookiesFromRequest,
} from "@/api/auth/server-auth";

const DEFAULT_BASE_URL = "http://localhost:3000/api";
const DEFAULT_TIMEOUT_MS = 10_000;
const resolvedBaseURL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? DEFAULT_BASE_URL;

export async function POST() {
  return handleRefreshProxy({
    readAuthCookies: readAuthCookiesFromRequest,
    persistSession: createPersistRotatedSessionFromRequest(),
    clearSession: createClearSessionFromRequest(),
    baseURL: resolvedBaseURL,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
}
```

DELETE from `route.ts` (all moved): the `cookies` import and the direct `cookieStore` reads (L102-104), `REFRESH_TOKEN_COOKIE`/`SESSION_ID_COOKIE` imports, `setAuthSessionCookies`/`refreshMaxAgeFromBeSetCookie` imports, every constant, type and helper listed above. Behaviour difference: persistence errors previously came straight from `setAuthSessionCookies`; now they come wrapped by `createPersistRotatedSessionFromRequest` (`ApiRefreshValidationError`); the handler's `catch { return errorDto(500, InternalError) }` is unchanged, so the response is identical. Verify: `npx tsc --noEmit`, `npm run build` (Next accepts only `POST` as export), T2 characterization cases green before and after the move.

### C8. `src/api/auth/browser-auth.ts` (client-safe) — MODIFY

Correction found while applying (2026-10-25): the first draft of `runWithCrossTabRefreshLock` was generic (`<T>`) and returned `locks.request(...)` directly; it fails `tsc` (`TS2322`, `Promise<Promise<T>>`), so the helper is non-generic over `BrowserRefreshResult` and awaits the lock result.

Imports: add `isSessionClearedRefreshResponse` to the `from "./auth-refresh"` import (currently `parseExactBrowserRefreshProxySuccess` only).

ADD after `CLIENT_REFRESH_PROXY_PATH` (L17) and before `performBrowserRefresh`:

```ts
const REFRESH_LOCK_NAME = "mycourse:auth-refresh";

/**
 * Tabs of one browser refresh one at a time so two tabs never rotate the same
 * refresh token concurrently. Without the Web Locks API the task runs unlocked.
 * The lock is released when the task settles; the task is bounded by the 10 s refresh timeout.
 */
async function runWithCrossTabRefreshLock(
  task: () => Promise<BrowserRefreshResult>,
): Promise<BrowserRefreshResult> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  if (!locks || typeof locks.request !== "function") return task();
  // `LockManager.request` is typed `Promise<T>` with `T` = the task's own promise, so await to flatten.
  return await locks.request(REFRESH_LOCK_NAME, task);
}
```

MODIFY `performBrowserRefresh` catch (L70-80). CURRENT:

```ts
    if (isApiHttpError(error)) {
      return {
        ok: false,
        cause: sanitizeApiErrorCause(
          new ApiRefreshValidationError({
            reason: "invalid-envelope",
            message: `Browser refresh HTTP ${error.response.status}`,
          }),
        ),
      };
    }
```

AFTER:

```ts
    if (isApiHttpError(error)) {
      return {
        ok: false,
        cause: sanitizeApiErrorCause(
          new ApiRefreshValidationError({
            reason: "invalid-envelope",
            message: `Browser refresh HTTP ${error.response.status}`,
          }),
        ),
        ...(isSessionClearedRefreshResponse(error.response.data)
          ? { sessionCleared: true as const }
          : {}),
      };
    }
```

MODIFY `refreshBrowserSession` (L92-99). CURRENT:

```ts
export function refreshBrowserSession(): Promise<BrowserRefreshResult> {
  if (!inflightRefresh) {
    inflightRefresh = performBrowserRefresh().finally(() => {
      inflightRefresh = null;
    });
  }
  return inflightRefresh;
}
```

AFTER:

```ts
export function refreshBrowserSession(
  onSessionCleared?: () => void,
): Promise<BrowserRefreshResult> {
  // The first caller that provides a callback owns the notification, even when
  // it joins a refresh another caller started.
  inflightOnSessionCleared ??= onSessionCleared;
  if (!inflightRefresh) {
    inflightRefresh = runWithCrossTabRefreshLock(performBrowserRefresh)
      .then((result) => {
        if (!result.ok && result.sessionCleared) {
          try {
            inflightOnSessionCleared?.();
          } catch {
            // Notification is best effort; the refresh outcome is unchanged.
          }
        }
        return result;
      })
      .finally(() => {
        inflightRefresh = null;
        inflightOnSessionCleared = undefined;
      });
  }
  return inflightRefresh;
}
```

(A module-level `let inflightOnSessionCleared: (() => void) | undefined;` sits next to `inflightRefresh`. Added after the code review of the committed change: the first version used the callback of the caller that created the promise, so a later caller's callback was dropped; test "notifies the first provided callback when the caller that started the refresh gave none".)

MODIFY `createBrowserProxyRuntimeAdapter` (L101-110). CURRENT takes no argument and returns `{ kind: "browser-proxy"; refresh: () => refreshBrowserSession() }`. AFTER:

```ts
export function createBrowserProxyRuntimeAdapter(options?: {
  onSessionCleared?: () => void;
}): {
  kind: "browser-proxy";
  refresh: () => Promise<BrowserRefreshResult>;
} {
  return {
    kind: "browser-proxy",
    refresh: () => refreshBrowserSession(options?.onSessionCleared),
  };
}
```

Callers: `refreshBrowserSession` (no other caller outside this file; docs/tests only), `createBrowserProxyRuntimeAdapter` (`api-transport.ts` L463). The callback runs inside the single-flight chain, so N waiting requests produce one call. Tests: T6, T7.

### C9. `src/api/transport/browser-api-methods.ts` — MODIFY (browser-only wiring file)

CURRENT:

```ts
import { useApiError } from "@/store/api-error-store";
import { type ApiMethods, createApiMethods } from "../core/methods";
...
const browserPushApiError: ApiErrorStorePush = (entry) => {
  useApiError.getState().push(entry);
};

export const apiTransport: ApiTransport =
  createBrowserApiTransport(browserPushApiError);
```

AFTER:

```ts
import { BROADCAST_LOGOUT_REASON } from "@/constants/events";
import { sendBroadcastOutbound } from "@/events/broadcast/send-broadcast-outbound";
import { useApiError } from "@/store/api-error-store";
...
const browserPushApiError: ApiErrorStorePush = (entry) => {
  useApiError.getState().push(entry);
};

/** The refresh proxy cleared a dead session: tell the other tabs once. */
const browserSessionCleared = () => {
  sendBroadcastOutbound({
    source: "broadcast",
    type: "logout",
    payload: { reason: BROADCAST_LOGOUT_REASON.sessionExpired },
  });
};

export const apiTransport: ApiTransport = createBrowserApiTransport(
  browserPushApiError,
  browserSessionCleared,
);
```

Import ordering follows Biome (`@/constants`, `@/events`, `@/store`). Consumers of `apiTransport`/`browserApiMethods`: all browser callers via `src/api/index.ts` (unchanged API). Verify: `npm run quality:deps` (no new cycle), `npx tsc --noEmit`.

### C10. `src/events/broadcast/send-broadcast-outbound.ts` — NEW (moved from the hook)

```ts
import { postBroadcastOutbound } from "@/events/broadcast/broadcast-transport";
import { nextStreamOutboundMetadata } from "@/events/core/outbound-metadata";
import type {
  BroadcastOutboundEvent,
  StreamOutboundMetadata,
} from "@/types/events";

/** Gửi broadcast: `metadata` có thể bỏ — hook sẽ gắn seq + timestamp. */
export type BroadcastOutboundSendInput =
  | (Omit<Extract<BroadcastOutboundEvent, { type: "logout" }>, "metadata"> & {
      metadata?: StreamOutboundMetadata;
    })
  | (Omit<
      Extract<BroadcastOutboundEvent, { type: "confirm_success" }>,
      "metadata"
    > & { metadata?: StreamOutboundMetadata });

/**
 * Gửi event sang tab khác (không phụ thuộc React).
 * Truyền đủ `source` + `type` + `payload` đúng cặp; `metadata` có thể bỏ để tự sinh seq + timestamp.
 */
export function sendBroadcastOutbound(
  message: BroadcastOutboundSendInput,
): void {
  const meta = message.metadata ?? nextStreamOutboundMetadata();
  if (message.type === "logout") {
    postBroadcastOutbound({
      source: "broadcast",
      type: "logout",
      payload: message.payload,
      metadata: meta,
    });
    return;
  }
  postBroadcastOutbound({
    source: "broadcast",
    type: "confirm_success",
    payload: message.payload,
    metadata: meta,
  });
}
```

(Type, branching and comments are the existing ones from `use-send-broadcast-outbound.ts` L9-44, moved verbatim; the doc comments keep their Vietnamese wording, the one new sentence is the "không phụ thuộc React" remark.) Not added to `src/events/index.ts` (the existing sender imports `@/events/broadcast/broadcast-transport` by path; keeping the barrel unchanged avoids a new unused export). Tests: T8.

### C11. `src/hooks/events/broadcast/use-send-broadcast-outbound.ts` — MODIFY (delegate)

CURRENT (L1-44): imports `postBroadcastOutbound`, `nextStreamOutboundMetadata`, types; declares `BroadcastOutboundSendInput`; `export function useSendBroadcastOutbound() { return useCallback((message: BroadcastOutboundSendInput) => { ...branching... }, []); }`.

AFTER (complete file):

```ts
"use client";

import { useCallback } from "react";

import {
  type BroadcastOutboundSendInput,
  sendBroadcastOutbound,
} from "@/events/broadcast/send-broadcast-outbound";

/**
 * Gửi event sang tab khác: bọc `sendBroadcastOutbound` trong callback ổn định cho React.
 */
export function useSendBroadcastOutbound() {
  return useCallback(
    (message: BroadcastOutboundSendInput) => sendBroadcastOutbound(message),
    [],
  );
}
```

DELETE: the local `BroadcastOutboundSendInput` type and the inlined branching body (moved in C10). Importers of `useSendBroadcastOutbound`: `logout-content.tsx` L19, `confirm-email-content.tsx` L22 (unchanged behaviour). `BroadcastOutboundSendInput` has no other importer (grep), so no re-export. Verify: `rg BroadcastOutboundSendInput src` lists only C10/C11.

### C12. `src/constants/events/index.ts` — ADD constant

Append after `STREAM_ENV_KEYS`:

```ts
/** `reason` values of the broadcast `logout` event (`BroadcastLogoutPayload.reason`). */
export const BROADCAST_LOGOUT_REASON = {
  user: "user",
  sessionExpired: "session_expired",
} as const;
```

Importers: C9, C13, T8. Zod schema and `BroadcastLogoutPayload` (`reason?: string`) are intentionally unchanged.

### C13. `src/components/common/auth-menu/auth/logout-content.tsx` — MODIFY

CURRENT L36: `          payload: { reason: "user" },` and imports L5-11 (`@/actions/auth`, `@/hooks`, ...). AFTER: add `import { BROADCAST_LOGOUT_REASON } from "@/constants/events";` between the `@/actions/auth` and `@/hooks` imports, and L36 becomes `          payload: { reason: BROADCAST_LOGOUT_REASON.user },`. No other change.

### C14. Files deliberately NOT changed (with reason)

`src/proxy.ts`, `src/lib/navigation/signed-in-home-redirect.ts` (redirect rules are a non-goal); `src/screen/common/home/signed-in-home-page.tsx` in Phase 1 (must not redirect; Phase 2 edits it as C27 with the user's approval, it still never redirects); `src/lib/utils/auth-session.ts` (`clearAuthSessionCookies` reused as-is); `src/actions/auth/*` (the transport handles the clear); `src/hooks/auth/use-auth-logout-tab-sync.ts` (reloads on any reason); `src/events/core/normalize-inbound.ts` and `src/types/events/broadcast/index.ts` (any string reason is accepted); `src/api/auth/refresh-upstream-raw.ts`; `src/constants/api-error-code.ts`; `src/api/index.ts`; `src/constants/seo/rendering.ts` (`SEO_TEMPORARY_ENV_CACHE_POLICY`, KEEP); every lint/format/test/build/CI configuration file.

## 4. Test inventory (written before the code they cover; jest has no `coverageThreshold`)

Jest routing (`jest.config.ts` L23-55): Node project: `src/api/auth/**/*.test.ts` (except `browser-*`), `src/api/transport/**/*.test.ts`, `src/app/api/auth/**`; jsdom project: `browser-*.test.ts`, `src/events/**`, hooks, components. No `jest.mock`; MSW server from `@/test-support/msw/server`; MSW is reset after each test by `src/test-support/jest.setup.ts`.

| ID | File | Env | Cases (each a separate `it`) |
|---|---|---|---|
| T1 | `src/api/auth/auth-refresh.test.ts` (extend) | Node | `it.each` `isDeadSessionRefreshStatus`: `401`, `403` true; `200`, `400`, `404`, `429`, `500`, `502`, `504`, `undefined` false. `isSessionClearedRefreshResponse`: `{ code, message, data: null, session_cleared: true }` true; `{ session_cleared: false }`, `{}`, `null`, `"x"`, `[]` false |
| T2 | `src/api/auth/refresh-proxy.test.ts` (NEW) | Node | Deps built from plain fakes (`readAuthCookies` returns `{ refreshToken: "r", sessionId: "s" }`, `persistSession`/`clearSession` as counting async functions, `baseURL: "http://be.test"`, `timeoutMs: 500`); MSW `http.post("http://be.test/api/v1/auth/refresh", ...)`. Characterization (green before behaviour change): success persists and returns access-token-only body; missing refresh token and missing session id give 401 `Unauthorized`; envelope with extra key gives 502; missing token field gives 502; persist rejects gives 500 `InternalError`; upstream 400/429/500 pass through status with allowlisted code and fixed message; network error gives 502; slow upstream beyond `timeoutMs` gives 504. Behaviour (written failing): upstream 401 and 403 call `clearSession` once and body equals `{ code, message, data: null, session_cleared: true }`; backend message never appears in the body; 400, 429, 500, network error, timeout and missing credentials never call `clearSession` and have no `session_cleared`; `clearSession` rejecting still returns the upstream status without the marker; success never calls `clearSession` |
| T3 | `src/api/transport/api-transport-refresh.test.ts` (NEW) | Node | `createApiTransport({ baseURL: "http://be.test", runtime })` with a plain-object `server-writable` runtime (`readAuthCookies` returns both cookies, `refresh` rejects with `new ApiRefreshValidationError({ reason: "invalid-envelope", message: "x", upstreamStatus })`, `persistRotatedSession` unused, `clearSession` counting); protected `GET /x` answered `401` by MSW without bearer so the refresh is eligible; `upstreamStatus` 401 and 403 call `clearSession` once and the original `ApiHttpError` is thrown; 500 and `undefined` do not; `clearSession` throwing still throws the original error; a runtime without `clearSession` throws the original error; a refresh that succeeds never clears |
| T4 | `src/api/auth/server-auth.test.ts` (NEW, conditional) | Node | Only if `import "server-only"` and `next/headers` load under Jest (decided in task 5.4 by one probing run); otherwise T3 covers `upstreamStatus` propagation by construction and the limitation is recorded. Cases: `refreshUpstreamSession` rejects with `upstreamStatus` 401/403/500 for the matching MSW upstream status; `validateRotatedTokens` failures carry no `upstreamStatus` |
| T5 | `src/api/auth/browser-transport-retry.test.ts` (extend) | jsdom | `apiFetch` through `createBrowserApiTransport(push, onSessionCleared)` with MSW: protected 401 then refresh 401 with `session_cleared: true` calls the callback once; refresh 500 does not; successful refresh retry does not |
| T6 | `src/api/auth/browser-auth.test.ts` (extend) | jsdom | refresh 401 with marker returns `{ ok: false, sessionCleared: true, cause }`; without marker no `sessionCleared`; three concurrent callers with the marker call `onSessionCleared` once; success never calls it; a throwing `onSessionCleared` does not change the result; when the caller that started the refresh gave no callback, the callback of a later joining caller is called once |
| T7 | same file | jsdom | Web Locks: install a fake `navigator.locks` with `Object.defineProperty(navigator, "locks", { configurable: true, value })` and restore in `afterEach`; `request` called once with `"mycourse:auth-refresh"`; the POST handler runs only after the fake grants the lock; a held lock (unresolved promise) delays the POST; task rejection releases the lock and the next call proceeds; `navigator.locks` undefined falls back to a direct call and still shares one in-flight request |
| T8 | `src/events/broadcast/send-broadcast-outbound.test.ts` (NEW) | jsdom | second `BroadcastChannel(broadcastEventsConfig.channelName)` receives a JSON string equal to `{ source: "broadcast", type: "logout", payload: { reason: BROADCAST_LOGOUT_REASON.sessionExpired }, metadata: { seq: <number>, timestamp: <number> } }`; explicit `metadata` is preserved; `confirm_success` payload `{ messageId }` is posted; the channel is closed in `afterEach` |
| T9 | `e2e/tests/auth.spec.ts` (extend) | Playwright | New `test("a revoked session leaves the public home reachable", ...)`: login with `FIXTURE_USERS.learner`, read `session_id`, `revokeSession`, `page.goto("/en/home")`, expect the sign-in prompt (`loginRequired` copy), `await expect.poll(async () => (await page.context().cookies()).filter(c => ["refresh_token","session_id"].includes(c.name)).length).toBe(0)`, `page.goto("/en")`, expect URL `/en` (no `/en/home`) and the public homepage heading. Needs the fixture backend; run with `npm run test:e2e` outside the sandbox |

Existing tests that must stay green unchanged in Phase 1 (Phase 2 extends `home/page.test.tsx` by one case and keeps its existing cases green): `src/proxy.test.tsx`, `src/lib/navigation/signed-in-home-redirect.test.ts`, `src/app/[locale]/(web)/home/page.test.tsx`, `src/hooks/auth/use-permissions.test.tsx`, `src/events/core/normalize-inbound.test.ts`, all current cases of `browser-auth.test.ts`, `browser-transport-retry.test.ts`, `auth-refresh.test.ts`.

## 5. Dependency and caller map (for `gitnexus_impact`/`detect_changes` cross-check)

| Symbol | Direct callers/importers (grep) | Risk note |
|---|---|---|
| `attemptRefresh` | `createApiTransport().request` (`api-transport.ts` L418) | single caller; behaviour added only in the server-writable catch |
| `createBrowserApiTransport` | `browser-api-methods.ts` L19, re-export in `src/api/index.ts` L49 | optional new parameter |
| `createBrowserProxyRuntimeAdapter` | `api-transport.ts` L463 | optional new parameter |
| `refreshBrowserSession` | `browser-auth.ts` (adapter), `browser-auth.test.ts` | optional new parameter |
| `refreshUpstreamSession` | `server-auth.ts` L121 (factory) | error gains optional field |
| `createWritableServerApiTransportFromRequest` | `src/actions/auth/{auth,google-oauth,discord-oauth,x-oauth}.ts`, `createWritableServerApiMethods` | optional new callback |
| `ApiRefreshValidationError` | `auth-refresh.ts`, `browser-auth.ts`, `server-auth.ts`, `fetch-error.ts` | optional new field |
| `useSendBroadcastOutbound` | `logout-content.tsx`, `confirm-email-content.tsx` | same signature and behaviour |
| route `POST` | Next runtime, `browser-auth.ts` via HTTP | thin wrapper; response contract identical plus optional marker |

## 6. Phase 2: current-user outage and shared sign-in gates (C15-C29, T10-T20)

Added after the user's review of the dashboards and `/home` (see `design.md` D10-D16). The AFTER code below was applied to a throw-away copy of the working tree **outside the repository** and checked there with `npx tsc --noEmit` (exit 0, `.next/` filtered), `npx biome check src` (clean), `npx eslint src e2e` (clean), `JEST_PROJECT=node npx jest` (4 suites, 98 tests) and `npx jest` (87 suites, 628 tests), and `npx playwright test --list` for the new e2e case (listed, **not executed**: it needs the fixture backend). The repository itself is unchanged by this proposal; the implementer applies these diffs in order and must reproduce the same results. Diffs are `diff -u` of the repository working tree (phase 1 already applied) against the checked copy.

### 6.0 Capability audit (what exists, what is new)

| ID | Capability | Verdict | Owner module |
|---|---|---|---|
| CAP-14 | Full-page state for a classified failure with title/description/action override | REUSE as-is | `StatusErrorPage`, `src/components/shared/status-error-page.tsx` |
| CAP-15 | Failure -> `StatusErrorVariant` classification | EXTEND with one typed check ahead of the status table | `classifyApiError`, `src/lib/utils/api-error.ts` |
| CAP-16 | Retry label | REUSE `errors.boundary.retry` (en/vi exist); no new i18n key | `src/messages/{en,vi}.ts` |
| CAP-17 | Retry action | REUSE `mutateMe` from `useGetMe()` | `src/store/auth/auth.ts` |
| CAP-18 | "Refresh did not conclude" decision | NEW one helper next to the dead-session helper | `isTransientRefreshStatus`, `src/api/auth/auth-refresh.ts` |
| CAP-19 | Typed 401 that carries the outage | NEW subclass of `ApiHttpError`, so every `isApiHttpError`/`status === 401` test is unchanged | `ApiSessionUnverifiedError`, `src/api/core/fetch-error.ts` |
| CAP-20 | Derived "current user outage" state | NEW hook over `useGetMe` + `classifyApiError` | `useMeOutage`, `src/hooks/auth/use-me-outage.ts` |
| CAP-21 | Retryable full-page outage state | NEW thin component over `StatusErrorPage`, one place for all three consumers | `MeOutagePage`, `src/components/shared/me-outage-page.tsx` |
| CAP-22 | Sign-in gate layout | REUSE `StatusErrorPage variant="unauthorized"` (dashboards already do) instead of two bespoke layouts | `signed-in-home-page.tsx`, `become-instructor-page.tsx` |

Kept separate on purpose: `StateCard` (`become-instructor-application/sections.tsx`) stays for states B and G (`submit_blocked`, `approved`), which are not sign-in gates; `HomeSectionShell` retry (per-section data errors, not the current user); `src/app/[locale]/error.tsx` (render-error boundary). `reportApiError` keeps its guest-probe filter, narrowed so an unverified-session 401 is reported as the incident it is.

### 6.1 Findings that constrain Phase 2 (read first)

1. `getMeService` rethrows every non-401 error, so a direct `/me` 5xx or network failure already reaches `useAuth` as `error` and `useMeStore.isError`; nothing reads it. Only the consumers need changing for that case (A).
2. A `/me` 401 followed by a refresh that fails with 5xx/timeout reaches `throwReportedHttp(failed, false, refreshResult.cause)`, which throws the **original 401**, so `getMeService` returns `null` and `isError` stays unset (C). The refresh `cause` cannot carry the signal: `buildHttpError` calls `sanitizeApiErrorCause(cause)` on a value that `attemptRefresh` already sanitised, and `sanitizeApiErrorCause` maps any non-`Error` object to `{ kind: "unknown" }` (existing latent double sanitisation, recorded as a follow-up, not fixed here). The outage therefore travels on a typed channel: a new `outage` field on the browser refresh result and the new error subclass.
3. SWR keeps the previous `data` when a revalidation throws, and `meCacheProvider` restores a persisted `/me` on a hard navigation within the same tab. So a visitor who already has a cached user never sees the outage state; it appears on the first load of a tab (empty `sessionStorage`) and in a new tab. The e2e case therefore opens a fresh tab. (SWR's keep-previous-data behaviour is library behaviour that was not re-run in isolation; the persisted-cache restore is read from `me-cache-provider.ts`.)
4. Statuses of the refresh proxy: upstream 5xx and 429 are passed through, network failure -> 502, timeout -> 504, persist failure -> 500, malformed upstream -> 502; all are `>= 500` or 429, so `isTransientRefreshStatus` covers them. 400/401/403 and a missing-credentials 401 are never transient.
5. `/me` answered 403 (`UserDisabled`/`UserBanned`) or 404 (deleted user) are errors that classify as `forbidden`/`unknown`; they must keep today's guest-like handling (`useMeOutage` returns `null`).
6. `isGuestMeUnauthorized` (reporter noise filter) would hide an unverified-session `GET /me` 401; it is narrowed with `instanceof ApiSessionUnverifiedError` so the incident is logged once like any other 5xx.
7. Server Action refreshes (`server-writable`) are not changed: `/me` is fetched by the browser only, and the server-writable catch has no network/timeout classification today.
8. ESLint `src/screen` rule: only `page.tsx` or `*-page.tsx` files; the new become-instructor test therefore lives beside the route (`src/app/[locale]/(web)/become-instructor/page.test.tsx`), like the existing `/home` route test.
9. `BecomeInstructorPage` mounts `preloadRemoteDatasets()` (two external JSON URLs) and a media dialog that requests `GET */api/v1/media/files`; its test must stub those three URLs with MSW or jsdom fails with `markResourceTiming is not a function`.
10. userEvent with Jest fake timers hangs; the dashboard outage tests use `fireEvent.click`.
11. (Found by the e2e run of T20, fixed in review) `retry` is SWR's bound `mutate`. Passing it directly as the button `onClick` hands it the click event, which SWR stores as the new current user; the header then renders `UserAvatar` with `display_name` undefined and throws (`name.trim`), landing on `error.tsx`. `MeOutagePage` therefore calls `outage.retry()` with no argument (`onClick: () => outage.retry()`), and T16 asserts `toHaveBeenCalledWith()`. The Jest tests could not see this because they inject a `jest.fn` retry and check only the call count.

### 6.2 Edits per file

#### C15. `src/api/core/fetch-error.ts` — MODIFY: add `ApiRefreshOutage` and `ApiSessionUnverifiedError extends ApiHttpError`

`ApiHttpError` is constructed in `api-transport.ts` (`buildHttpError`), `fetch-core`, `fetch-helpers` and tests; the subclass keeps `kind = "http"`, `instanceof ApiHttpError` and `response.status`, so `isApiHttpError(err) && err.response.status === 401` callers (`getMeService`, `performBrowserRefresh`, `reportApiError`, `classifyApiError`) are unchanged unless they opt in.

```diff
--- HEAD+phase1 src/api/core/fetch-error.ts
+++ AFTER src/api/core/fetch-error.ts
@@ -81,6 +81,27 @@
   }
 }
 
+/** Why a refresh did not conclude: the backend failed or could not be reached. */
+export type ApiRefreshOutage = "network" | "server-error";
+
+/**
+ * A 401 whose refresh attempt did not conclude (backend failure or no
+ * connection). Still an `ApiHttpError` with status 401, so every existing 401
+ * check keeps working; `getMeService` and `classifyApiError` read `outage`.
+ */
+export class ApiSessionUnverifiedError extends ApiHttpError {
+  readonly outage: ApiRefreshOutage;
+
+  constructor(
+    input: ConstructorParameters<typeof ApiHttpError>[0] & {
+      outage: ApiRefreshOutage;
+    },
+  ) {
+    super(input);
+    this.outage = input.outage;
+  }
+}
+
 export class ApiTimeoutError extends ApiRequestErrorBase {
   readonly kind = "timeout" as const;
 }
```

#### C16. `src/api/auth/auth-refresh.ts` — MODIFY: add `isTransientRefreshStatus`

Used only by `browser-auth.ts`. Sits beside `isDeadSessionRefreshStatus` (same domain: refresh outcome classification); the two are disjoint by construction.

```diff
--- HEAD+phase1 src/api/auth/auth-refresh.ts
+++ AFTER src/api/auth/auth-refresh.ts
@@ -51,6 +51,17 @@
   return status === 401 || status === 403;
 }
 
+/**
+ * A refresh answered 429 or 5xx did not conclude about the session: the
+ * backend is rate limiting or failing, so the cookies and the 401 stay as they
+ * are. Distinct from `isDeadSessionRefreshStatus` (401/403, session gone).
+ */
+export function isTransientRefreshStatus(status: number | undefined): boolean {
+  return (
+    status === 429 || (status !== undefined && status >= 500 && status <= 599)
+  );
+}
+
 export function validateRotatedTokens(
   payload: unknown,
 ): RotatedAuthSessionTokens {
```

#### C17. `src/api/auth/auth-runtime.ts` — MODIFY: failure variant of `BrowserRefreshResult` gains `outage?: ApiRefreshOutage`

Type-only. Consumers: `browser-auth.ts`, `api-transport.ts` (`attemptRefresh`), tests.

```diff
--- HEAD+phase1 src/api/auth/auth-runtime.ts
+++ AFTER src/api/auth/auth-runtime.ts
@@ -3,9 +3,16 @@
  * Isomorphic / client-safe — must not import Next cookie APIs or Node-only request adapters.
  */
 
+import type { ApiRefreshOutage } from "../core/fetch-error";
+
 export type BrowserRefreshResult =
   | { ok: true; accessToken: string }
-  | { ok: false; cause?: unknown; sessionCleared?: true };
+  | {
+      ok: false;
+      cause?: unknown;
+      sessionCleared?: true;
+      outage?: ApiRefreshOutage;
+    };
 
 export type AuthCookieBag = {
   accessToken?: string;
```

#### C18. `src/api/auth/browser-auth.ts` — MODIFY: `performBrowserRefresh` sets `outage`

Single producer of `BrowserRefreshResult`. Network/timeout detection reuses `ApiNetworkError`/`ApiTimeoutError` (the same two classes `classifyApiError` maps to `network`); a malformed success body or a missing origin stay without `outage`.

```diff
--- HEAD+phase1 src/api/auth/browser-auth.ts
+++ AFTER src/api/auth/browser-auth.ts
@@ -7,13 +7,16 @@
  */
 
 import {
+  ApiNetworkError,
   ApiRefreshValidationError,
+  ApiTimeoutError,
   isApiHttpError,
   sanitizeApiErrorCause,
 } from "../core/fetch-error";
 import { rawPost } from "../core/raw-http";
 import {
   isSessionClearedRefreshResponse,
+  isTransientRefreshStatus,
   parseExactBrowserRefreshProxySuccess,
 } from "./auth-refresh";
 import type { BrowserRefreshResult } from "./auth-runtime";
@@ -101,9 +104,18 @@
         ...(isSessionClearedRefreshResponse(error.response.data)
           ? { sessionCleared: true as const }
           : {}),
+        ...(isTransientRefreshStatus(error.response.status)
+          ? { outage: "server-error" as const }
+          : {}),
       };
     }
-    return { ok: false, cause: sanitizeApiErrorCause(error) };
+    return {
+      ok: false,
+      cause: sanitizeApiErrorCause(error),
+      ...(error instanceof ApiNetworkError || error instanceof ApiTimeoutError
+        ? { outage: "network" as const }
+        : {}),
+    };
   }
 }
```

#### C19. `src/api/transport/api-transport.ts` — MODIFY: `attemptRefresh` result and `buildHttpError`/`throwReportedHttp` carry `outage`; `isGuestMeUnauthorized` excludes the subclass

`attemptRefresh` has one caller (`createApiTransport().request`). `throwReportedHttp` is created by `createThrowReportedHttp` and called from the same `request`; only the refresh-failure call passes the new fourth argument. The server-writable branch is untouched.

```diff
--- HEAD+phase1 src/api/transport/api-transport.ts
+++ AFTER src/api/transport/api-transport.ts
@@ -30,10 +30,12 @@
   ApiHttpError,
   ApiNetworkError,
   ApiPolicyError,
+  type ApiRefreshOutage,
   ApiRefreshRequiredError,
   ApiRefreshValidationError,
   ApiRequestReplayError,
   ApiResponseParseError,
+  ApiSessionUnverifiedError,
   ApiTimeoutError,
   isApiHttpError,
   parseApiErrorEnvelope,
@@ -105,10 +107,11 @@
   failed: FailedHttpResponse,
   retried: boolean,
   cause?: unknown,
+  outage?: ApiRefreshOutage,
 ): ApiHttpError {
   // FE-owned message only — never copy BE body.message into error.message.
   // Raw body remains on response.data for code-based mappers.
-  return new ApiHttpError({
+  const input = {
     message: `HTTP ${failed.status}`,
     response: {
       status: failed.status,
@@ -121,7 +124,10 @@
       retried,
     },
     cause: sanitizeApiErrorCause(cause),
-  });
+  };
+  return outage
+    ? new ApiSessionUnverifiedError({ ...input, outage })
+    : new ApiHttpError(input);
 }
 
 /** True when a browser extension blocked the request (adblock — expected). */
@@ -157,6 +163,8 @@
 /** Anonymous probe: GET /api/v1/me → 401 — expected (getMeService → null). */
 function isGuestMeUnauthorized(error: unknown): boolean {
   if (!isApiHttpError(error)) return false;
+  // A 401 whose refresh did not conclude is an incident, not a guest probe.
+  if (error instanceof ApiSessionUnverifiedError) return false;
   if (error.response.status !== 401) return false;
   if (error.request.method.toUpperCase() !== "GET") return false;
   return apiErrorPathname(error.request.url) === API_PRIVATE_ROUTES.user.getMe;
@@ -253,7 +261,10 @@
 async function attemptRefresh(
   runtime: AuthRuntimeAdapter,
   failed: FailedHttpResponse,
-): Promise<{ ok: true; accessToken: string } | { ok: false; cause?: unknown }> {
+): Promise<
+  | { ok: true; accessToken: string }
+  | { ok: false; cause?: unknown; outage?: ApiRefreshOutage }
+> {
   if (
     runtime.kind === "server-readonly" ||
     runtime.kind === "server-no-request-context"
@@ -274,6 +285,9 @@
       return {
         ok: false,
         cause: result.ok === false ? result.cause : undefined,
+        ...(result.ok === false && result.outage
+          ? { outage: result.outage }
+          : {}),
       };
     }
     return { ok: true, accessToken: result.accessToken };
@@ -314,8 +328,9 @@
     failed: FailedHttpResponse,
     retried: boolean,
     cause?: unknown,
+    outage?: ApiRefreshOutage,
   ): never {
-    const error = buildHttpError(failed, retried, cause);
+    const error = buildHttpError(failed, retried, cause, outage);
     reportApiError(
       error,
       { url: failed.url, method: failed.method },
@@ -438,7 +453,12 @@
       }
 
       if (!refreshResult.ok) {
-        return throwReportedHttp(failed, false, refreshResult.cause);
+        return throwReportedHttp(
+          failed,
+          false,
+          refreshResult.cause,
+          refreshResult.outage,
+        );
       }
 
       const retryHeaders = mergeHeadersCaseInsensitive(headers, {
```

#### C20. `src/api/callers/auth/auth-factory.ts` — MODIFY: `getMeService` rethrows `ApiSessionUnverifiedError`

Only runtime consumer of `getMeService`: `useAuth.ts` (grep). A plain 401 still resolves to `null`.

```diff
--- HEAD+phase1 src/api/callers/auth/auth-factory.ts
+++ AFTER src/api/callers/auth/auth-factory.ts
@@ -3,7 +3,10 @@
  * Server Actions MUST import from this file (not auth-browser / barrel evaluation of Zustand).
  */
 
-import { isApiHttpError } from "@/api/core/fetch-error";
+import {
+  ApiSessionUnverifiedError,
+  isApiHttpError,
+} from "@/api/core/fetch-error";
 import type { ApiMethods } from "@/api/core/methods";
 import { API_PRIVATE_ROUTES, API_PUBLIC_ROUTES } from "@/constants/api-route";
 import { buildQueryParams } from "@/lib/utils";
@@ -78,7 +81,14 @@
           await methods.apiFetch<ApiResponse<MeResponse>>(endpointKey);
         return data.data;
       } catch (err) {
-        if (isApiHttpError(err) && err.response.status === 401) return null;
+        // A 401 whose refresh did not conclude is an outage, not a guest.
+        if (
+          isApiHttpError(err) &&
+          err.response.status === 401 &&
+          !(err instanceof ApiSessionUnverifiedError)
+        ) {
+          return null;
+        }
         throw err;
       }
     },
```

#### C21. `src/lib/utils/api-error.ts` — MODIFY: `classifyApiError` maps `ApiSessionUnverifiedError` to its outage

Callers: `editor-page.tsx` and the new `useMeOutage`. The HTTP status table (`HTTP_STATUS_RULES`) is not touched.

```diff
--- HEAD+phase1 src/lib/utils/api-error.ts
+++ AFTER src/lib/utils/api-error.ts
@@ -1,6 +1,7 @@
 import { toast } from "sonner";
 import {
   ApiNetworkError,
+  ApiSessionUnverifiedError,
   ApiTimeoutError,
   isApiHttpError,
   parseApiErrorEnvelope,
@@ -121,6 +122,7 @@
   if (error instanceof ApiNetworkError || error instanceof ApiTimeoutError) {
     return "network";
   }
+  if (error instanceof ApiSessionUnverifiedError) return error.outage;
   if (isApiHttpError(error)) {
     return matchHttpStatusRule(error.response.status) ?? "unknown";
   }
```

#### C22. `src/hooks/auth/use-me-outage.ts` — NEW

Derived state over the existing `useGetMe()`; no new store field. Variant narrowing reuses `StatusErrorVariant` and `classifyApiError`. A cached user, `isLoading`, no error, 403, 404 and unknown errors all return `null`.

```ts
"use client";

import {
  classifyApiError,
  type StatusErrorVariant,
} from "@/lib/utils/api-error";
import { useGetMe } from "./use-auth-store";

export type MeOutage = {
  variant: Extract<StatusErrorVariant, "server-error" | "network">;
  retry: () => void;
};

/**
 * Set when `/me` failed for a reason that says nothing about the session
 * (backend 5xx, timeout, no connection, or a refresh that could not conclude)
 * and there is no cached user to keep showing. A real 401 (guest), 403 and 404
 * stay `null` here, so they keep their existing sign-in or denial handling.
 */
export function useMeOutage(): MeOutage | null {
  const { me, isLoading, isError, mutateMe } = useGetMe();
  if (me || isLoading || !isError) return null;
  const variant = classifyApiError(isError);
  return variant === "server-error" || variant === "network"
    ? { variant, retry: mutateMe }
    : null;
}
```

#### C23. `src/hooks/auth/index.ts` — MODIFY (barrel)

```diff
--- HEAD+phase1 src/hooks/auth/index.ts
+++ AFTER src/hooks/auth/index.ts
@@ -6,6 +6,7 @@
 export * from "./use-discord-login";
 export * from "./use-google-login";
 export * from "./use-google-one-tap";
+export * from "./use-me-outage";
 export * from "./use-oauth-popup-login";
 export * from "./use-oauth-post-auth";
 export * from "./use-permissions";
```

#### C24. `src/components/shared/me-outage-page.tsx` — NEW

One place for the retry wiring so dashboards, `/home` and `become-instructor` do not each repeat the same `StatusErrorPage` + retry JSX. Label from `errors.boundary.retry` (exists in `en.ts` and `vi.ts`), so no i18n change.

```tsx
"use client";

import { useTranslations } from "next-intl";
import { StatusErrorPage } from "@/components/shared/status-error-page";
import type { MeOutage } from "@/hooks/auth/use-me-outage";

/** Full-page state for a `/me` outage: `StatusErrorPage` plus a retry that revalidates `/me`. */
export function MeOutagePage({
  outage,
  fillViewport,
}: {
  outage: MeOutage;
  fillViewport?: boolean;
}) {
  const t = useTranslations("errors.boundary");

  return (
    <StatusErrorPage
      variant={outage.variant}
      action={{ label: t("retry"), onClick: () => outage.retry() }}
      fillViewport={fillViewport}
    />
  );
}
```

#### C25. `src/components/shared/index.ts` — MODIFY (barrel)

```diff
--- HEAD+phase1 src/components/shared/index.ts
+++ AFTER src/components/shared/index.ts
@@ -13,6 +13,7 @@
 } from "./delta-editor";
 export * from "./form-field";
 export * from "./image-file-field";
+export * from "./me-outage-page";
 export * from "./permission-gate";
 export * from "./search-bar";
 export * from "./slug-conflict-confirm-dialog";
```

#### C26. `src/components/common/dashboard/dashboard-layout.tsx` — MODIFY

Consumers of `DashboardLayout`: `role-dashboard-layout.tsx` (admin, sysadmin), `src/app/[locale]/instructor/layout.tsx`. The auto-prompt effect and `frozenDenial` logic are unchanged except that `isUnauthorized` no longer holds during an outage.

```diff
--- HEAD+phase1 src/components/common/dashboard/dashboard-layout.tsx
+++ AFTER src/components/common/dashboard/dashboard-layout.tsx
@@ -8,6 +8,7 @@
 import { BrandLogoLink } from "@/components/common/header/brand-logo-link";
 import { HeaderDashboard } from "@/components/common/header/header-dashboard";
 import { LocaleSwitcher } from "@/components/common/header/locale-switcher";
+import { MeOutagePage } from "@/components/shared/me-outage-page";
 import { StatusErrorPage } from "@/components/shared/status-error-page";
 import { Button } from "@/components/ui/button";
 import {
@@ -24,6 +25,7 @@
 import {
   useFilteredDashboardItems,
   useGetMe,
+  useMeOutage,
   useSatisfiesPermissions,
 } from "@/hooks/auth";
 import { useDashboardPageHeaderOverride } from "@/hooks/dashboard";
@@ -212,6 +214,7 @@
   onKeyUp,
 }: DashboardLayoutProps) {
   const { me, isLoading: meLoading } = useGetMe();
+  const meOutage = useMeOutage();
   const isLoading = isLoadingProp ?? meLoading;
   const satisfiesLayout = useSatisfiesPermissions({
     permissions,
@@ -245,7 +248,7 @@
    * per denied path per page load, while a genuine browser refresh clears
    * it and re-arms the prompt (see that record's own comment).
    */
-  const isUnauthorized = !isLoading && !canAccessDashboard && !me;
+  const isUnauthorized = !isLoading && !canAccessDashboard && !me && !meOutage;
   const [frozenDenial, setFrozenDenial] = useState<{
     active: boolean;
     path: string | null;
@@ -286,10 +289,14 @@
           leading={<BrandLogoLink className="md:hidden" />}
           trailing={<DashboardHeaderLocale />}
         />
-        <StatusErrorPage
-          variant={me ? "forbidden" : "unauthorized"}
-          fillViewport
-        />
+        {meOutage ? (
+          <MeOutagePage outage={meOutage} fillViewport />
+        ) : (
+          <StatusErrorPage
+            variant={me ? "forbidden" : "unauthorized"}
+            fillViewport
+          />
+        )}
       </div>
     );
   }
```

#### C27. `src/screen/common/home/signed-in-home-page.tsx` — MODIFY (user-approved exception to the earlier "do not touch" rule)

The earlier constraint "do not touch `SignedInHomePage`" was lifted by the user for exactly this edit (sign-in gate on the shared `unauthorized` state, plus the outage state). Copy stays through `home.signedIn.loginRequired.*`, so the assertions on "Sign in to continue" (`home/page.test.tsx`, `e2e/tests/{auth,home,signed-in-redirect}.spec.ts`) and the link named "Sign in" with `next=%2Fhome` stay valid. Consumer: `src/app/[locale]/(web)/home/page.tsx`.

```diff
--- HEAD+phase1 src/screen/common/home/signed-in-home-page.tsx
+++ AFTER src/screen/common/home/signed-in-home-page.tsx
@@ -6,9 +6,9 @@
 import { HomeContinueLearningSection } from "@/components/home/signed-in/home-continue-learning-section";
 import { HomePopularInstructorsSection } from "@/components/home/signed-in/home-popular-instructors-section";
 import { HomeTrendingSection } from "@/components/home/signed-in/home-trending-section";
-import { Button } from "@/components/ui/button";
-import { useGetMe } from "@/hooks/auth";
-import { Link } from "@/i18n/navigation";
+import { MeOutagePage } from "@/components/shared/me-outage-page";
+import { StatusErrorPage } from "@/components/shared/status-error-page";
+import { useGetMe, useMeOutage } from "@/hooks/auth";
 import { loginHref, signedInHomeHref } from "@/lib/navigation/routes";
 
 /**
@@ -19,6 +19,7 @@
 export function SignedInHomePage() {
   const t = useTranslations("home.signedIn");
   const { me, isLoading } = useGetMe();
+  const meOutage = useMeOutage();
 
   if (isLoading) {
     return (
@@ -28,21 +29,20 @@
     );
   }
 
+  if (meOutage) return <MeOutagePage outage={meOutage} fillViewport />;
+
   if (!me) {
     return (
-      <section className="container mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
-        <h1 className="text-2xl font-semibold tracking-tight">
-          {t("loginRequired.title")}
-        </h1>
-        <p className="mt-2 text-sm text-muted-foreground">
-          {t("loginRequired.description")}
-        </p>
-        <Button asChild className="mt-6">
-          <Link href={loginHref(signedInHomeHref)}>
-            {t("loginRequired.login")}
-          </Link>
-        </Button>
-      </section>
+      <StatusErrorPage
+        variant="unauthorized"
+        title={t("loginRequired.title")}
+        description={t("loginRequired.description")}
+        action={{
+          label: t("loginRequired.login"),
+          href: loginHref(signedInHomeHref),
+        }}
+        fillViewport
+      />
     );
   }
```

#### C28. `src/screen/common/instructor/become-instructor-page.tsx` — MODIFY

State A moves from `StateCard icon="🔒"` to the shared `unauthorized` state with the same copy (`stateA.*`); `StateCard` stays for states B and G. Consumer: `src/app/[locale]/(web)/become-instructor/page.tsx`. `getPageState` and `useMyInstructorApplication` are unchanged (during an outage `me` is `null`, so `pageState` is `unauthenticated`, which the outage branch overrides).

```diff
--- HEAD+phase1 src/screen/common/instructor/become-instructor-page.tsx
+++ AFTER src/screen/common/instructor/become-instructor-page.tsx
@@ -18,6 +18,8 @@
 } from "@/components/features/instructor/become-instructor-application/sections";
 import { MediaCollectionDialog } from "@/components/features/media";
 import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
+import { MeOutagePage } from "@/components/shared/me-outage-page";
+import { StatusErrorPage } from "@/components/shared/status-error-page";
 import { Button } from "@/components/ui/button";
 import {
   Collapsible,
@@ -26,6 +28,7 @@
 } from "@/components/ui/collapsible";
 import { MEDIA_PDF_EXTENSIONS } from "@/constants/media/file-rules";
 import { PRIVATE_ROUTES, PUBLIC_ROUTES } from "@/constants/route";
+import { useMeOutage } from "@/hooks/auth";
 import { useMyInstructorApplication } from "@/hooks/instructor/use-my-instructor-application";
 import { Link } from "@/i18n/navigation";
 import {
@@ -67,6 +70,7 @@
     contactAdmin,
     mutate,
   } = useMyInstructorApplication();
+  const meOutage = useMeOutage();
 
   const [activeTab, setActiveTab] =
     useState<InstructorApplicationActiveTab>("info");
@@ -202,18 +206,16 @@
   return (
     <div className="flex min-h-[calc(100svh-4rem)] flex-col bg-background">
       <BecomeInstructorHero />
-      {pageState === INSTRUCTOR_PAGE_STATE.unauthenticated ? (
-        <StateCard
-          icon="🔒"
+      {meOutage ? <MeOutagePage outage={meOutage} /> : null}
+      {!meOutage && pageState === INSTRUCTOR_PAGE_STATE.unauthenticated ? (
+        <StatusErrorPage
+          variant="unauthorized"
           title={t("stateA.title")}
           description={t("stateA.description")}
-          action={
-            <Button asChild className="bg-[#3dcbb1] hover:bg-[#35b39c]">
-              <Link href={loginHref(PUBLIC_ROUTES.becomeInstructor)}>
-                {t("stateA.login")}
-              </Link>
-            </Button>
-          }
+          action={{
+            label: t("stateA.login"),
+            href: loginHref(PUBLIC_ROUTES.becomeInstructor),
+          }}
         />
       ) : null}
       {pageState === INSTRUCTOR_PAGE_STATE.submit_blocked ? (
```

#### C29. Files deliberately NOT changed in Phase 2 (with reason)

`src/proxy.ts` and `signed-in-home-redirect.ts` (redirects are a non-goal); `src/store/auth/auth.ts` and `src/hooks/auth/use-auth-store.ts` (`isError` and `mutateMe` already exist); `src/api/hooks/auth/useAuth.ts` (already exposes `error`); `src/lib/swr/me-cache-provider.ts`; `src/messages/{en,vi}.ts` (all copy reused); `src/api/auth/refresh-proxy.ts`, `src/app/api/auth/refresh/route.ts`, `server-auth.ts` (Server Action refreshes keep today's behaviour); `AuthLayout`, `SidebarAuthFooter`, `use-google-one-tap.ts`, `BecomeInstructorPromoBanner` (guest-looking chrome during an outage is a recorded follow-up); `src/components/shared/status-error-page.tsx`; every lint/format/test/build/CI configuration file.

### 6.3 Test inventory (written before the code they cover)

All files below passed in the checked copy once the code existed; in the real apply each test is written first and must fail for the stated reason before its code (task group 12). Counts are the real counts of that run.

| ID | File | Env | Cases |
|---|---|---|---|
| T10 | `src/api/auth/auth-refresh.test.ts` (extend) | Node | `isTransientRefreshStatus`: 429, 500, 502, 503, 504, 599 true; 400, 401, 403, 404, 200, 600, `undefined` false (file: 63 tests) |
| T11 | `src/api/auth/browser-auth.test.ts` (extend) | jsdom | proxy 500/502/429 -> `outage: "server-error"`; 400/401/403 -> no `outage`; network failure -> `outage: "network"` (file: 20 tests) |
| T12 | `src/api/transport/api-transport-refresh.test.ts` (extend) | Node | browser-proxy runtime whose refresh returns `outage` -> thrown `ApiSessionUnverifiedError`, `instanceof ApiHttpError`, status 401, matching `outage`; no `outage` -> plain 401 not an `ApiSessionUnverifiedError` (file: 10 tests) |
| T13 | `src/lib/utils/api-error.test.ts` (extend) | jsdom | unverified 401 with `network`/`server-error` classifies as that outage; plain 401 stays `unauthorized` (file: 20 tests) |
| T14 | `src/api/callers/auth/auth-factory.test.ts` (NEW) | jsdom | `getMeService`: plain 401 -> `null`; unverified 401 (both outages) rethrown; 500 rethrown (4 tests) |
| T15 | `src/hooks/auth/use-me-outage.test.tsx` (NEW) | jsdom | outage for 500, network failure, unverified 401; retry calls `mutateMe`; `null` for no error, 403, 404, while loading, and when a cached user exists (9 tests) |
| T16 | `src/components/shared/me-outage-page.test.tsx` (NEW) | jsdom | `server-error` and `network` copy and a retry that calls the outage retry (2 tests) |
| T17 | `src/components/common/dashboard/dashboard-layout.test.tsx` (extend) | jsdom | outage -> server-error heading, no `router.push` after 2000 ms, retry calls `mutateMe`; a 404 `/me` error keeps the unauthorized state and the 500 ms auto-prompt (file: 8 tests) |
| T18 | `src/app/[locale]/(web)/home/page.test.tsx` (extend) | jsdom | outage -> no "Sign in to continue", server-error heading, retry, no home request; existing guest case unchanged (file: 5 tests) |
| T19 | `src/app/[locale]/(web)/become-instructor/page.test.tsx` (NEW) | jsdom | guest -> unauthorized state with sign-in link; outage -> retry instead of the gate (2 tests) |
| T20 | `e2e/tests/auth.spec.ts` (extend) | Playwright | new case below; listed by `npx playwright test --list`, executed in task 14.3 |

Existing tests that must stay green unchanged: all earlier cases of `dashboard-layout.test.tsx`, `home/page.test.tsx`, `status-error-page.test.tsx`, `api-error.test.ts`, `browser-auth.test.ts`, `api-transport-refresh.test.ts`.

#### T10. `src/api/auth/auth-refresh.test.ts`

```diff
--- HEAD+phase1 src/api/auth/auth-refresh.test.ts
+++ AFTER src/api/auth/auth-refresh.test.ts
@@ -4,6 +4,7 @@
   isDeadSessionRefreshStatus,
   isRefreshEligible,
   isSessionClearedRefreshResponse,
+  isTransientRefreshStatus,
   parseExactBrowserRefreshProxySuccess,
   parseExactRefreshSuccessEnvelope,
   requestSentNonEmptyBearer,
@@ -216,3 +217,25 @@
     expect(isSessionClearedRefreshResponse(data)).toBe(expected);
   });
 });
+
+describe("isTransientRefreshStatus", () => {
+  it.each([
+    [429, true],
+    [500, true],
+    [502, true],
+    [503, true],
+    [504, true],
+    [599, true],
+    [400, false],
+    [401, false],
+    [403, false],
+    [404, false],
+    [200, false],
+    [600, false],
+    [undefined, false],
+  ])("returns %p for status %p", (status, expected) => {
+    expect(isTransientRefreshStatus(status as number | undefined)).toBe(
+      expected,
+    );
+  });
+});
```

#### T11. `src/api/auth/browser-auth.test.ts`

```diff
--- HEAD+phase1 src/api/auth/browser-auth.test.ts
+++ AFTER src/api/auth/browser-auth.test.ts
@@ -348,3 +348,50 @@
     expect(results[1]).toEqual(results[2]);
   });
 });
+
+describe("refreshBrowserSession outage", () => {
+  it.each([
+    [500, "server-error"],
+    [502, "server-error"],
+    [429, "server-error"],
+  ] as const)("flags an outage for proxy status %i", async (status, outage) => {
+    server.use(
+      http.post(REFRESH_URL, () =>
+        HttpResponse.json(
+          { code: status, message: "fixed", data: null },
+          { status },
+        ),
+      ),
+    );
+
+    const result = await refreshBrowserSession();
+
+    expect(result).toMatchObject({ ok: false, outage });
+  });
+
+  it.each([
+    400, 401, 403,
+  ])("flags no outage for proxy status %i", async (status) => {
+    server.use(
+      http.post(REFRESH_URL, () =>
+        HttpResponse.json(
+          { code: status, message: "fixed", data: null },
+          { status },
+        ),
+      ),
+    );
+
+    const result = await refreshBrowserSession();
+
+    expect(result.ok).toBe(false);
+    expect(result).not.toHaveProperty("outage");
+  });
+
+  it("flags a network outage when the proxy cannot be reached", async () => {
+    server.use(http.post(REFRESH_URL, () => HttpResponse.error()));
+
+    const result = await refreshBrowserSession();
+
+    expect(result).toMatchObject({ ok: false, outage: "network" });
+  });
+});
```

#### T12. `src/api/transport/api-transport-refresh.test.ts`

```diff
--- HEAD+phase1 src/api/transport/api-transport-refresh.test.ts
+++ AFTER src/api/transport/api-transport-refresh.test.ts
@@ -3,6 +3,7 @@
 import {
   ApiHttpError,
   ApiRefreshValidationError,
+  ApiSessionUnverifiedError,
 } from "@/api/core/fetch-error";
 import { ApiErrorCode } from "@/constants/api-error-code";
 import { okEnvelope } from "@/test-support/msw/envelope";
@@ -179,3 +180,55 @@
     expect(clearCount).toBe(0);
   });
 });
+
+describe("browser-proxy refresh outage", () => {
+  function createBrowserRuntime(result: {
+    outage?: "network" | "server-error";
+  }) {
+    return {
+      kind: "browser-proxy" as const,
+      refresh: async () => ({ ok: false as const, ...result }),
+    };
+  }
+
+  it.each([
+    "network",
+    "server-error",
+  ] as const)("throws an unverified 401 carrying the %s outage", async (outage) => {
+    mockUnauthorizedProbe();
+    const transport = createApiTransport({
+      baseURL: BASE_URL,
+      runtime: createBrowserRuntime({ outage }),
+    });
+
+    const error = await transport
+      .request({ method: "GET", url: "/api/v1/probe" })
+      .then(
+        () => undefined,
+        (cause: unknown) => cause,
+      );
+
+    expect(error).toBeInstanceOf(ApiSessionUnverifiedError);
+    expect(error).toBeInstanceOf(ApiHttpError);
+    expect((error as ApiSessionUnverifiedError).response.status).toBe(401);
+    expect((error as ApiSessionUnverifiedError).outage).toBe(outage);
+  });
+
+  it("keeps the plain 401 when the refresh carries no outage", async () => {
+    mockUnauthorizedProbe();
+    const transport = createApiTransport({
+      baseURL: BASE_URL,
+      runtime: createBrowserRuntime({}),
+    });
+
+    await expectOriginalUnauthorized(transport);
+
+    const error = await transport
+      .request({ method: "GET", url: "/api/v1/probe" })
+      .then(
+        () => undefined,
+        (cause: unknown) => cause,
+      );
+    expect(error).not.toBeInstanceOf(ApiSessionUnverifiedError);
+  });
+});
```

#### T13. `src/lib/utils/api-error.test.ts`

```diff
--- HEAD+phase1 src/lib/utils/api-error.test.ts
+++ AFTER src/lib/utils/api-error.test.ts
@@ -2,6 +2,7 @@
 import {
   ApiHttpError,
   ApiNetworkError,
+  ApiSessionUnverifiedError,
   ApiTimeoutError,
 } from "@/api/core/fetch-error";
 import {
@@ -61,6 +62,28 @@
   });
 });
 
+describe("classifyApiError for an unverified session", () => {
+  function unverified(outage: "network" | "server-error") {
+    return new ApiSessionUnverifiedError({
+      message: "HTTP 401",
+      response: { status: 401, data: {}, headers: {} },
+      request,
+      outage,
+    });
+  }
+
+  it.each([
+    "network",
+    "server-error",
+  ] as const)("maps a 401 with a %s outage to that variant", (outage) => {
+    expect(classifyApiError(unverified(outage))).toBe(outage);
+  });
+
+  it("keeps a plain 401 as unauthorized", () => {
+    expect(classifyApiError(httpError(401))).toBe("unauthorized");
+  });
+});
+
 describe("extractApiError", () => {
   it("reads code and message from an ApiHttpError body", () => {
     expect(
```

#### T17. `src/components/common/dashboard/dashboard-layout.test.tsx`

```diff
--- HEAD+phase1 src/components/common/dashboard/dashboard-layout.test.tsx
+++ AFTER src/components/common/dashboard/dashboard-layout.test.tsx
@@ -6,7 +6,9 @@
   it,
   jest,
 } from "@jest/globals";
-import { act } from "@testing-library/react";
+import { act, fireEvent, screen } from "@testing-library/react";
+import { ApiHttpError } from "@/api/core/fetch-error";
+import messages from "@/messages/en";
 import { useMeStore } from "@/store/auth";
 import { buildMeResponse } from "@/test-support/fixtures/auth";
 import {
@@ -144,3 +146,63 @@
     expect(router.push).toHaveBeenCalledTimes(2);
   });
 });
+
+describe("DashboardLayout — current-user outage", () => {
+  beforeEach(() => {
+    jest.useFakeTimers();
+    resetDashboardAutoPromptTracking();
+  });
+
+  afterEach(() => {
+    jest.useRealTimers();
+  });
+
+  function outageError(status: number) {
+    return new ApiHttpError({
+      message: `HTTP ${status}`,
+      response: { status, data: {}, headers: {} },
+      request: { url: "/api/v1/me", method: "GET", retried: false },
+    });
+  }
+
+  it("shows the server-error state with a retry and never prompts login", () => {
+    const mutateMe = jest.fn();
+    useMeStore.setState({
+      me: null,
+      isLoading: false,
+      isError: outageError(503),
+      mutateMe,
+    });
+    const { router } = renderDenied(false);
+
+    expect(
+      screen.getByRole("heading", {
+        name: messages.errors.statusPage["server-error"].title,
+      }),
+    ).toBeInTheDocument();
+    act(() => {
+      jest.advanceTimersByTime(2000);
+    });
+    expect(router.push).not.toHaveBeenCalled();
+
+    fireEvent.click(
+      screen.getByRole("button", { name: messages.errors.boundary.retry }),
+    );
+    expect(mutateMe).toHaveBeenCalledTimes(1);
+  });
+
+  it("keeps the unauthorized state and the auto-prompt for a 404 /me error", () => {
+    useMeStore.setState({
+      me: null,
+      isLoading: false,
+      isError: outageError(404),
+    });
+    const { router } = renderDenied(false);
+
+    act(() => {
+      jest.advanceTimersByTime(500);
+    });
+
+    expect(router.push).toHaveBeenCalledTimes(1);
+  });
+});
```

#### T18. `src/app/[locale]/(web)/home/page.test.tsx`

```diff
--- HEAD+phase1 src/app/[locale]/(web)/home/page.test.tsx
+++ AFTER src/app/[locale]/(web)/home/page.test.tsx
@@ -1,7 +1,9 @@
 import { describe, expect, it, jest } from "@jest/globals";
-import { screen } from "@testing-library/react";
+import { fireEvent, screen } from "@testing-library/react";
 import { http } from "msw";
+import { ApiHttpError } from "@/api/core/fetch-error";
 import { PERMISSIONS } from "@/constants/permissions";
+import messages from "@/messages/en";
 import { useMeStore } from "@/store/auth";
 import { seedSignedInMe } from "@/test-support/fixtures/auth";
 import { okEnvelope } from "@/test-support/msw/envelope";
@@ -44,6 +46,34 @@
     expect(handlers.continueLearning).not.toHaveBeenCalled();
   });
 
+  it("shows the retryable server-error state, not the sign-in prompt, when the current user failed to load", () => {
+    const handlers = mockHomeEndpoints();
+    const mutateMe = jest.fn();
+    useMeStore.setState({
+      me: null,
+      isLoading: false,
+      isError: new ApiHttpError({
+        message: "HTTP 503",
+        response: { status: 503, data: {}, headers: {} },
+        request: { url: "/api/v1/me", method: "GET", retried: false },
+      }),
+      mutateMe,
+    });
+    renderWithProviders(<SignedInHomeRoutePage />);
+
+    expect(screen.queryByText("Sign in to continue")).not.toBeInTheDocument();
+    expect(
+      screen.getByRole("heading", {
+        name: messages.errors.statusPage["server-error"].title,
+      }),
+    ).toBeInTheDocument();
+    fireEvent.click(
+      screen.getByRole("button", { name: messages.errors.boundary.retry }),
+    );
+    expect(mutateMe).toHaveBeenCalledTimes(1);
+    expect(handlers.trending).not.toHaveBeenCalled();
+  });
+
   it("renders the hero and all three sections for a user who can read courses", async () => {
     mockHomeEndpoints();
     seedSignedInMe([PERMISSIONS.CourseRead]);
```

#### T20. `e2e/tests/auth.spec.ts`

```diff
--- HEAD+phase1 e2e/tests/auth.spec.ts
+++ AFTER e2e/tests/auth.spec.ts
@@ -131,6 +131,48 @@
     ).toBeVisible();
   });
 
+  test("a backend failure on /me keeps the session and shows a retryable state", async ({
+    page,
+  }) => {
+    await page.goto("/en/instructor");
+    await login(page, FIXTURE_USERS.learner);
+    await expect(
+      page.getByRole("button", { name: "Open user menu" }),
+    ).toBeVisible({
+      timeout: 15_000,
+    });
+
+    // A new tab has an empty sessionStorage, so no cached `/me` hides the failure.
+    const freshTab = await page.context().newPage();
+    let failMe = true;
+    await freshTab.route("**/api/v1/me", (route) =>
+      failMe
+        ? route.fulfill({
+            status: 500,
+            contentType: "application/json",
+            body: JSON.stringify({ code: 9999, message: "x", data: null }),
+          })
+        : route.continue(),
+    );
+
+    await freshTab.goto("/en/home");
+    await expect(
+      freshTab.getByRole("heading", { name: "Server error" }),
+    ).toBeVisible({ timeout: 15_000 });
+    await expect(freshTab.getByText("Sign in to continue")).toHaveCount(0);
+    expect(
+      (await page.context().cookies()).filter((cookie) =>
+        ["refresh_token", "session_id"].includes(cookie.name),
+      ),
+    ).toHaveLength(2);
+
+    failMe = false;
+    await freshTab.getByRole("button", { name: "Try again" }).click();
+    await expect(
+      freshTab.getByRole("heading", { level: 1, name: /Learn something new/ }),
+    ).toBeVisible({ timeout: 15_000 });
+  });
+
   test("a user without the required permission sees the forbidden/unauthorized state", async ({
     page,
   }) => {
```

#### T14. `src/api/callers/auth/auth-factory.test.ts` — NEW

```ts
import { describe, expect, it } from "@jest/globals";
import {
  ApiHttpError,
  ApiSessionUnverifiedError,
} from "@/api/core/fetch-error";
import type { ApiMethods } from "@/api/core/methods";
import { createAuthCallers } from "./auth-factory";

const request = { url: "/api/v1/me", method: "GET", retried: false };
const response = { status: 401, data: {}, headers: {} };

function callersFailingWith(error: unknown) {
  const methods = {
    apiFetch: async () => {
      throw error;
    },
  } as unknown as ApiMethods;
  return createAuthCallers(methods);
}

describe("getMeService", () => {
  it("returns null for a plain 401 (guest)", async () => {
    const error = new ApiHttpError({ message: "HTTP 401", response, request });

    await expect(callersFailingWith(error).getMeService()).resolves.toBeNull();
  });

  it.each([
    "network",
    "server-error",
  ] as const)("rethrows a 401 whose refresh did not conclude (%s)", async (outage) => {
    const error = new ApiSessionUnverifiedError({
      message: "HTTP 401",
      response,
      request,
      outage,
    });

    await expect(callersFailingWith(error).getMeService()).rejects.toBe(error);
  });

  it("rethrows a 5xx response", async () => {
    const error = new ApiHttpError({
      message: "HTTP 500",
      response: { ...response, status: 500 },
      request,
    });

    await expect(callersFailingWith(error).getMeService()).rejects.toBe(error);
  });
});
```

#### T15. `src/hooks/auth/use-me-outage.test.tsx` — NEW

```tsx
import { describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import {
  ApiHttpError,
  ApiNetworkError,
  ApiSessionUnverifiedError,
} from "@/api/core/fetch-error";
import { useMeStore } from "@/store/auth";
import { buildMeResponse } from "@/test-support/fixtures/auth";
import { useMeOutage } from "./use-me-outage";

const request = { url: "/api/v1/me", method: "GET", retried: false };

function httpError(status: number) {
  return new ApiHttpError({
    message: `HTTP ${status}`,
    response: { status, data: {}, headers: {} },
    request,
  });
}

function setMe(state: Partial<ReturnType<typeof useMeStore.getState>>) {
  useMeStore.setState({ me: null, isLoading: false, ...state });
}

describe("useMeOutage", () => {
  it.each([
    ["a 500 response", httpError(500), "server-error"],
    [
      "a network failure",
      new ApiNetworkError({ message: "x", request }),
      "network",
    ],
    [
      "a 401 whose refresh did not conclude",
      new ApiSessionUnverifiedError({
        message: "HTTP 401",
        response: { status: 401, data: {}, headers: {} },
        request,
        outage: "server-error",
      }),
      "server-error",
    ],
  ] as const)("reports an outage for %s", (_label, error, variant) => {
    setMe({ isError: error });

    const { result } = renderHook(() => useMeOutage());

    expect(result.current?.variant).toBe(variant);
  });

  it("retries by revalidating the current user", () => {
    const mutateMe = jest.fn();
    setMe({ isError: httpError(503), mutateMe });

    const { result } = renderHook(() => useMeOutage());
    result.current?.retry();

    expect(mutateMe).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["no error", undefined],
    ["a 403 response", httpError(403)],
    ["a 404 response", httpError(404)],
  ] as const)("is null for %s", (_label, error) => {
    setMe({ isError: error });

    const { result } = renderHook(() => useMeOutage());

    expect(result.current).toBeNull();
  });

  it("is null while the current user is loading", () => {
    setMe({ isLoading: true, isError: httpError(500) });

    const { result } = renderHook(() => useMeOutage());

    expect(result.current).toBeNull();
  });

  it("is null when a cached user is still shown", () => {
    setMe({ me: buildMeResponse(), isError: httpError(500) });

    const { result } = renderHook(() => useMeOutage());

    expect(result.current).toBeNull();
  });
});
```

#### T16. `src/components/shared/me-outage-page.test.tsx` — NEW

```tsx
import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import messages from "@/messages/en";
import { renderWithProviders } from "@/test-support/render";
import { MeOutagePage } from "./me-outage-page";

describe("MeOutagePage", () => {
  it.each([
    "server-error",
    "network",
  ] as const)("renders the %s copy with a retry that calls the outage retry", async (variant) => {
    const retry = jest.fn();
    const { user } = renderWithProviders(
      <MeOutagePage outage={{ variant, retry }} />,
    );

    expect(
      screen.getByRole("heading", {
        name: messages.errors.statusPage[variant].title,
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: messages.errors.boundary.retry }),
    );

    expect(retry).toHaveBeenCalledTimes(1);
    // SWR's bound `mutate` treats a first argument as new data, so the click event must not reach it.
    expect(retry).toHaveBeenCalledWith();
  });
});
```

#### T19. `src/app/[locale]/(web)/become-instructor/page.test.tsx` — NEW

```tsx
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { ApiHttpError } from "@/api/core/fetch-error";
import {
  REMOTE_COMPANIES_URL,
  REMOTE_JOB_TITLES_URL,
} from "@/lib/instructor-application/remote-data";
import messages from "@/messages/en";
import { useMeStore } from "@/store/auth";
import { okEnvelope } from "@/test-support/msw/envelope";
import { server } from "@/test-support/msw/server";
import { renderWithProviders } from "@/test-support/render";
import BecomeInstructorRoutePage from "./page";

describe("/become-instructor route — sign-in gate", () => {
  beforeEach(() => {
    server.use(
      http.get("*/api/v1/media/files", () => okEnvelope([])),
      http.get(REMOTE_JOB_TITLES_URL, () => HttpResponse.json([])),
      http.get(REMOTE_COMPANIES_URL, () => HttpResponse.json([])),
    );
  });

  it("shows the shared unauthorized state with a sign-in link for a guest", () => {
    useMeStore.setState({ me: null, isLoading: false });
    renderWithProviders(<BecomeInstructorRoutePage />);

    expect(
      screen.getByRole("heading", {
        name: messages.instructor.application.stateA.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: messages.instructor.application.stateA.login,
      }),
    ).toHaveAttribute("href", expect.stringContaining("next="));
  });

  it("shows the retryable server-error state instead of the gate when the current user failed to load", () => {
    const mutateMe = jest.fn();
    useMeStore.setState({
      me: null,
      isLoading: false,
      isError: new ApiHttpError({
        message: "HTTP 503",
        response: { status: 503, data: {}, headers: {} },
        request: { url: "/api/v1/me", method: "GET", retried: false },
      }),
      mutateMe,
    });
    renderWithProviders(<BecomeInstructorRoutePage />);

    expect(
      screen.queryByText(messages.instructor.application.stateA.title),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: messages.errors.boundary.retry }),
    );
    expect(mutateMe).toHaveBeenCalledTimes(1);
  });
});
```

### 6.4 Dependency and caller map (Phase 2; for `gitnexus_impact`/`detect_changes`)

GitNexus returned `UNKNOWN` with 0 callers for `getMeService`, `useAuth`, `DashboardLayout` and `SignedInHomePage` (checked 2026-10-26); callers below are from `grep`.

| Symbol | Direct callers/importers (grep) | Risk note |
|---|---|---|
| `getMeService` | `src/api/hooks/auth/useAuth.ts` only | behaviour change only for an unverified 401 |
| `useAuth` / `useGetMe` | `useSyncMeFromAuth` (via `MeSwrSync`); `useGetMe` is imported by the header, sidebar footer, One Tap, banner, dashboards, home and auth forms | none of them reads `isError` today; unchanged |
| `classifyApiError` | `src/screen/instructor/courses/editor-page.tsx`, new `useMeOutage` | one added typed check |
| `ApiHttpError` | `fetch-core`, `api-transport.ts`, many `isApiHttpError` checks | subclass keeps every check true |
| `BrowserRefreshResult` | `browser-auth.ts`, `api-transport.ts` | optional field |
| `buildHttpError` / `throwReportedHttp` | `api-transport.ts` only | optional fourth argument |
| `DashboardLayout` | `RoleDashboardLayout`, `src/app/[locale]/instructor/layout.tsx` | outage branch before the denial branch |
| `SignedInHomePage` | `src/app/[locale]/(web)/home/page.tsx` | render-only change |
| `BecomeInstructorPage` | `src/app/[locale]/(web)/become-instructor/page.tsx` | render-only change |
