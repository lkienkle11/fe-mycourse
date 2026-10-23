# Code Change Inventory

Companion to `design.md`; this file carries the exact CURRENT code (read from `HEAD 0f884da`), the exact AFTER code, call sites, the reused resource that justifies creating nothing new, and the tests per item. Frontend only (`fe-mycourse`). Line numbers are `HEAD 0f884da` and must be re-located by symbol or quote at implementation time. **ADD** = new, **MODIFY** = replace, **DELETE** = remove. Documentation IDs are intentionally omitted (they live in `docs-update-inventory*.md`).

GitNexus note: the project rule requires `gitnexus_impact` per edited symbol before the first edit and `gitnexus_detect_changes` before commit; callers below come from `grep`/`Read`. HIGH or CRITICAL results must be reported to the user first. The riskiest symbols by fan-in are `homeHref`/`signedInHomeHref` (routes.ts), `AUTH_SESSION_EXPIRES_AT_COOKIE` (single importer, itself), and `parseAbsoluteHttpsOrigin`/`resolveSiteConfig` (called from `buildCanonicalUrl` for every canonical).

## 0. Capability audit verdicts that drive this inventory

| ID | Capability | Verdict | Shared module (owner / name) |
|---|---|---|---|
| CAP-1 | Auth cookie names (4 literal copies + 1 private array + 1 exported const) | MERGE into one constants module | `src/constants/auth-cookie.ts` (NEW) |
| CAP-2 | Locale-root detection + signed-in redirect decision (needed by proxy and by the resolver) | NEW shared, one implementation | `src/lib/navigation/signed-in-home-redirect.ts` (NEW) |
| CAP-3 | Per-locale canonical map plus `x-default` (duplicated in `build-page-metadata.ts` L52-59 and `sitemap-builder.ts` L49-61) | MERGE into one helper | `src/lib/seo/canonical.ts` → `buildLanguageAlternates` (EXTEND existing file) |
| CAP-4 | Origin parsing with loopback policy | EXTEND `parseAbsoluteHttpsOrigin` (optional 2nd arg), no second URL parser | `src/lib/seo/site-config.ts` |
| CAP-5 | Default destination after login/OAuth/confirm-email/already-signed-in | NEW named constant next to `signedInHomeHref` | `src/lib/navigation/routes.ts` → `defaultPostAuthHref` |
| CAP-6 | Private path prefixes for robots Disallow (`listPrivatePathPrefixes` unused duplicate of `privateCrawlDisallowPaths`) | DELETE duplicate, reuse `privateCrawlDisallowPaths` | `src/lib/security/web/crawl-policy.ts` |
| CAP-7 | Signed-in home path constant (`SIGNED_IN_HOME_PATH` duplicates `PRIVATE_ROUTES.home` / `signedInHomeHref`) | DELETE duplicate | `src/lib/navigation/routes.ts` → `signedInHomeHref` |
| CAP-8 | robots.txt rules builder | NEW (nothing equivalent exists) | `src/lib/seo/robots-txt.ts` |
| CAP-9 | Sitemap, JSON-LD Organization, page metadata factory, robots presets | REUSE as-is | `buildSitemapEntries`, `buildOrganizationJsonLd`, `JsonLd`, `buildPageMetadata`, `robotsPreset` |

## 1. Reuse ledger (resources reused as-is, never re-implemented)

| Resource | Path | Used for |
|---|---|---|
| `resolveSiteConfig`, `SiteConfigError`, `siteLocales`, `siteDefaultLocale` | `src/lib/seo/site-config.ts` | instrumentation check, robots, sitemap, home page JSON-LD |
| `buildCanonicalUrl`, `localizedPathname`, `toAbsoluteUrl` | `src/lib/seo/canonical.ts` | alternates helper, robots paths, sitemap URL |
| `buildPageMetadata` | `src/lib/seo/build-page-metadata.ts` | home `generateMetadata` |
| `buildSitemapEntries` | `src/lib/seo/sitemap-builder.ts` | `src/app/sitemap.ts` |
| `listSeoIndexablePathnames` | `src/lib/seo/indexable-routes.ts` | sitemap defaults (unchanged) |
| `privateCrawlDisallowPaths`, `publicCrawlAllowPaths`, `signedInHomeRobotsMode` | `src/lib/security/web/crawl-policy.ts` | robots rules, `/home` metadata |
| `robotsPreset` | `src/lib/seo/robots-presets.ts` | `/home` metadata (`privateApp` mode) |
| `buildOrganizationJsonLd` | `src/lib/seo/ranking/organization.ts` | home JSON-LD |
| `JsonLd` | `src/lib/seo/json-ld.tsx` | home JSON-LD script |
| `DEFAULT_SITE_NAME` | `src/constants/seo/metadata.ts` | root layout title |
| `homeHref`, `signedInHomeHref` | `src/lib/navigation/routes.ts` (re-exported by `src/lib/navigation/home.ts`) | metadata pathname, redirect target |
| `routing` | `src/i18n/routing.ts` | locale validation, default locale |
| `hasLocale` | `next-intl` | locale validation (same call as `src/app/[locale]/layout.tsx`) |
| `getLocale`, `getTranslations` | `next-intl/server` | root layout `lang`, metadata titles (same as `src/app/not-found.tsx`, `login/page.tsx`) |
| `createMiddleware(routing)` | `next-intl/middleware` | proxy (kept) |
| `renderWithProviders`, `MockAppRouterProvider`, MSW `server` | `src/test-support/*` | tests |
| `FIXTURE_USERS`, `loginAsHomeLearner`, `resetFixtures` | `e2e/support/*` | e2e |

## 2. Findings that change or constrain the design (read these first)

1. **Jest `testMatch` (jest.config.ts) only runs these in the jsdom project: `src/**/*.test.tsx`, `src/lib/**/*.test.ts`, `src/hooks/**/*.test.ts`, `src/store|schema|events/**`, `src/api/hooks/**`, `src/api/callers/**`.** A `.test.ts` at `src/proxy.test.ts`, `src/instrumentation.test.ts`, `src/app/robots.test.ts` or `src/app/sitemap.test.ts` would NOT run. These four tests must be named `*.test.tsx` (JSX not required in the file). The node project only matches `src/api/auth|transport` and `src/app/api/auth`.
2. **`NextRequest`/`NextResponse` need real Web APIs.** The jsdom project polyfills `Request/Response/Headers` with undici (`jest.setup.jsdom-fetch.ts`) but I could not run it. Put the per-file docblock `/** @jest-environment node */` on the first line of `src/proxy.test.tsx` and `src/instrumentation.test.tsx` (a per-file docblock, not a config change). `jest.setup.ts` already guards DOM stubs with `typeof window`. If node env hits the MSW/`undici` setup, fall back to jsdom; this is the one test-infra item to try first.
3. **`NEXT_PHASE` is not in the Next 16 docs** (`node_modules/next/dist/docs` has no mention) but `node_modules/next/dist/build/index.js:1125` sets `process.env.NEXT_PHASE = PHASE_PRODUCTION_BUILD` (`"phase-production-build"`) at build, so the D2 guard is valid for `next build` workers. Risk: it is an internal detail; if a Next upgrade changes it, `docker build` / `npm run build` (NODE_ENV=production, no SITE_URL) would throw in `register()`. Mitigation is the e2e/CI build itself (`buildEnv` has no SITE_URL, so `npm run test:e2e` proves the guard).
4. **Deploy prerequisite (not changed here, must be told to the user).** Every `docker/*.yml` sets `NODE_ENV: production` (including `compose.local.yml`). With D1/D2 the server refuses to start unless `SITE_URL` is a non-loopback https origin in the container `env_file`. `http://localhost:3000` is rejected in production by design, so local docker stacks need a real https origin or a non-production `NODE_ENV`. `docs/deploy.md` L959 still says "not configured this phase" (docs item). `.env`/`env_file` values are outside this change.
5. **Root `layout.tsx` + `await getLocale()`**: `next-intl` `getLocale` reads `headers()` (RequestLocale.js). Routes the proxy matcher skips (`api`, `_next`, `auth/discord/callback`, `auth/x/callback`, `*.ext`) get the default locale (`vi`) through `src/i18n/request.ts` (`hasLocale` fallback), which equals today's hard-coded `lang="vi"`. `src/app/not-found.tsx` already calls `getLocale()` and `next build` passes, so the same call in the root layout is expected to build; `npm run build` in the quality gate is the proof (prerender of `/_not-found` is the thing to watch).
6. **`new URL(redirectPath, request.url)` (D5) behind nginx**: `deploy/nginx/nginx.conf` sends `Host $host` and `X-Forwarded-Proto $scheme`, so `request.url` carries the public host in practice. `request.nextUrl.clone()` (what next-intl uses internally for its own redirects) is more robust against a host mismatch; D5 as specified uses `request.url`. Implemented as specified below; recommended swap is one line (`const target = request.nextUrl.clone(); target.pathname = redirectPath;`) if the reviewer prefers it. The redirect drops the query string in both variants only if you also clear `search`; as specified (`new URL(path, base)`) the query is dropped.
7. **Stale-cookie behavior**: `hasAuthSessionCookies` only checks presence (REFRESH + SESSION_ID). A revoked/expired server session with surviving cookies redirects `/en` to `/en/home`, which renders the existing guest "Sign in to continue" prompt (no loop: `/home` is not redirected). Acceptable, but call it out.
8. **Client router cache**: signed-in `Link href="/"` prefetches are redirected to `/en/home`. After logout, `logout-content.tsx` navigates to `homeHref`; dynamic pages have `staleTimes.dynamic = 0` in Next 16, so a stale cached `/en/home` should not be served, but add the e2e step "logout then brand link shows the guest home" to prove it.
9. **`/` handling**: matcher `/` is processed by `createMiddleware` which 307s to `/{locale}` (cookie or Accept-Language, else `vi`). `isLocaleRootPathname("/")` is false (no locale segment), so a signed-in user at `/` takes two hops (`/` -> `/en` -> `/en/home`). That satisfies the e2e requirement; a one-hop variant would need `negotiator`/cookie logic duplicated from next-intl, so it is deliberately not done.
10. **`hasLocale` from `next-intl` inside `proxy.ts` path**: proxy runs on Node in Next 16 (`proxy.md` "defaults to using the Node.js runtime"), so importing the package root there is fine. `next build` + e2e verify it.
11. **Biome-ignore in `json-ld.tsx` L18** stays untouched (tooling rule protection).
12. **Madge**: new import edges are `signed-in-home-redirect.ts -> {constants/auth-cookie, navigation/routes, i18n/routing, next-intl}`, `proxy.ts -> {signed-in-home-redirect, i18n/routing}`, `canonical.ts -> site-config` (already exists), `robots-txt.ts -> {crawl-policy, canonical, site-config}`. `crawl-policy.ts` imports `lib/seo/indexable-routes` (not `robots-txt`), so no cycle. `routes.ts` imports only `@/constants/route`, `@/lib/utils/url` (no imports of its own) and a type from `@/types/course`; `routing.ts` imports only `next-intl/routing`. No cycle. Run `npm run cycles`.

## 3. Edits per file

### C1 — `src/constants/auth-cookie.ts` — ADD (plain consts only)

ESLint `src/constants/**/*.ts` forbids functions, arrow functions, type aliases, interfaces, type exports. Only `export const` strings and an `as const` array are used.

AFTER (whole file):

```ts
/** HttpOnly auth cookie names (BFF-owned). DTO field names such as `access_token` in token payloads are not cookie names. */
export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const SESSION_ID_COOKIE = "session_id";

/**
 * HttpOnly cookie - absolute session expiry (Unix seconds).
 * FE-only, never sent to BE. Used when SSR refresh cannot read Set-Cookie headers.
 */
export const AUTH_SESSION_EXPIRES_AT_COOKIE = "auth_session_expires_at";

/** Legacy cookie name (relative Max-Age) - cleared on read/write for migration. */
export const LEGACY_AUTH_SESSION_MAX_AGE_COOKIE = "auth_session_max_age";

/** Cookies a browser must never write from JS (see `setCookieValue`). */
export const AUTH_COOKIE_NAMES = [
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_ID_COOKIE,
] as const;
```

Reuse: `src/constants/index.ts` barrel is not required (importers use the file path like `@/constants/api-route`). Check `src/constants/index.ts` first and add `export * from "./auth-cookie"` only if the barrel re-exports siblings. Tests: none needed for constants; covered by C2-C6 tests.

### C2 — `src/api/auth/server-auth.ts` — MODIFY

CURRENT (lines 37-45):

```ts
export async function readAuthCookiesFromRequest(): Promise<AuthCookieBag> {
  const store = await cookies();
  return {
    accessToken: store.get("access_token")?.value,
    refreshToken: store.get("refresh_token")?.value,
    sessionId: store.get("session_id")?.value,
  };
}
```

CURRENT (lines 79-84):

```ts
    const refreshMaxAge = parseMaxAgeForCookie(
      setCookieHeaders,
      "refresh_token",
    );
```

AFTER: add import (after `@/constants/api-route`, Biome order: `@/constants/api-route` < `@/constants/auth-cookie`):

```ts
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_ID_COOKIE,
} from "@/constants/auth-cookie";
```

```ts
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value,
    sessionId: store.get(SESSION_ID_COOKIE)?.value,
```

```ts
    const refreshMaxAge = parseMaxAgeForCookie(
      setCookieHeaders,
      REFRESH_TOKEN_COOKIE,
    );
```

Unchanged on purpose: `auth-refresh.ts` L65/68/71/160 (`access_token`, `refresh_token`, `session_id` are DTO field keys of the refresh envelope, not cookie names). Existing tests that must still pass: `src/api/auth/*.test.ts`, `src/api/transport/*.test.ts` (node project; none mention the literals; run the whole node project). Reuse: the shared constants (CAP-1).

### C3 — `src/lib/utils/auth-session.ts` — MODIFY

CURRENT (lines 1-6, 8-17):

```ts
import "server-only";

import { cookies } from "next/headers";
import { sanitizeApiErrorCause } from "@/api/core/fetch-error";
import { parseMaxAgeForCookie } from "@/api/core/fetch-helpers";
import { buildAuthCookieOptions, getCookieDomain } from "./cookie";

/**
 * HttpOnly cookie — absolute session expiry (Unix seconds).
 * FE-only, never sent to BE. Used when SSR refresh cannot read Set-Cookie headers.
 * Stores expiry, not relative Max-Age, so non-remember sessions cannot be extended
 * on fallback (BE uses remaining lifetime, not a renewed cap).
 */
export const AUTH_SESSION_EXPIRES_AT_COOKIE = "auth_session_expires_at";

/** Legacy cookie name (relative Max-Age) — cleared on read/write for migration. */
const LEGACY_AUTH_SESSION_MAX_AGE_COOKIE = "auth_session_max_age";
```

AFTER (imports; delete L8-17 including both comments, which move to `auth-cookie.ts`; keep the "Stores expiry, not relative Max-Age..." sentence in the constants comment of C1 if desired):

```ts
import "server-only";

import { cookies } from "next/headers";
import { sanitizeApiErrorCause } from "@/api/core/fetch-error";
import { parseMaxAgeForCookie } from "@/api/core/fetch-helpers";
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_SESSION_EXPIRES_AT_COOKIE,
  LEGACY_AUTH_SESSION_MAX_AGE_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_ID_COOKIE,
} from "@/constants/auth-cookie";
import { buildAuthCookieOptions, getCookieDomain } from "./cookie";
```

Line edits:

- L67 `return parseMaxAgeForCookie(setCookieHeaders, "refresh_token");` -> `return parseMaxAgeForCookie(setCookieHeaders, REFRESH_TOKEN_COOKIE);`
- L190-192 CURRENT `set("access_token", access_token); set("refresh_token", refresh_token, resolvedMaxAge); set("session_id", session_id, resolvedMaxAge);` -> `set(ACCESS_TOKEN_COOKIE, access_token); set(REFRESH_TOKEN_COOKIE, refresh_token, resolvedMaxAge); set(SESSION_ID_COOKIE, session_id, resolvedMaxAge);`
- L244-246 CURRENT `remove("access_token"); remove("refresh_token"); remove("session_id");` -> `remove(ACCESS_TOKEN_COOKIE); remove(REFRESH_TOKEN_COOKIE); remove(SESSION_ID_COOKIE);`
- L146, L206, L247 (`AUTH_SESSION_EXPIRES_AT_COOKIE`) and L213, L248 (`LEGACY_AUTH_SESSION_MAX_AGE_COOKIE`) keep their identifiers; they now come from the import.
- L132-134 `assertNonEmptyToken("access_token", ...)` etc. are token-field labels (DTO), NOT cookie names; leave unchanged.

Importers of the removed export `AUTH_SESSION_EXPIRES_AT_COOKIE` from `auth-session.ts`: grep `src/ e2e/ scripts/` finds none other than `auth-session.ts` itself, so removing the export breaks nothing. Existing tests: none import `auth-session` (grep `auth-session` in `*.test.ts(x)` is empty). Tests to add: none required (behavior unchanged); `src/lib/navigation/signed-in-home-redirect.test.ts` pins the cookie names the proxy reads.

### C4 — `src/lib/utils/cookie.ts` — MODIFY

CURRENT (lines 92-105):

```ts

/**
 * Writes a cookie value.
 * - Client: via js-cookie.
 * - Server: via next/headers.
 *   Only works inside a Server Action or Route Handler (not a pure RSC).
 *   Failures are swallowed silently.
 */
const AUTH_COOKIE_NAMES = [
  "access_token",
  "refresh_token",
  "session_id",
] as const;
```

(The doc comment above the array actually documents `setCookieValue` at L115; it sits on the array by accident.)

AFTER: delete L100-104 (the private array) and add the import at the top (Biome order: `js-cookie`, then `@/constants/auth-cookie`, then `./runtime`):

```ts
import Cookies from "js-cookie";
import { AUTH_COOKIE_NAMES } from "@/constants/auth-cookie";
import { isServer } from "./runtime";
```

Move the 6-line `Writes a cookie value.` doc comment directly above `export async function setCookieValue(` (it already describes it). L119 `(AUTH_COOKIE_NAMES as readonly string[]).includes(name)` is unchanged. Existing tests: none for `cookie.ts` (grep empty). Add `src/lib/utils/cookie.test.ts`? Optional; not required.

### C5 — `src/app/api/auth/refresh/route.ts` — MODIFY

CURRENT (lines 99-100):

```ts
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const sessionId = cookieStore.get("session_id")?.value;
```

AFTER: import after `@/constants/api-route`:

```ts
import { REFRESH_TOKEN_COOKIE, SESSION_ID_COOKIE } from "@/constants/auth-cookie";
```

(Biome will wrap it to multi-line; run `biome check --write` only on the touched file - it is the formatter, not a rule change.)

```ts
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;
```

Existing tests (node project, `src/app/api/auth/**/*.test.ts`): run them; they set cookies by mocking `next/headers`, they should be unaffected. Grep of the literal names in tests found none.

### C6 — `src/actions/auth/auth.ts` — MODIFY

CURRENT (lines 70-72):

```ts
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const sessionId = cookieStore.get("session_id")?.value;
```

AFTER: add `import { REFRESH_TOKEN_COOKIE, SESSION_ID_COOKIE } from "@/constants/auth-cookie";` after `@/constants/api-error-code` (L9) and:

```ts
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;
```

File is `"use server"`: only async function exports are allowed; importing constants into it is fine.

Other cookie-name literals found by grep over `src/ e2e/ scripts/` and their disposition:

| File:line | Literal | Disposition |
|---|---|---|
| `e2e/tests/auth.spec.ts:79` | `c.name === "session_id"` | KEEP: e2e does not import `src/` (no `@/` imports under `e2e/`), Playwright project is separate |
| `e2e/fixtures/server.mjs:501,544` | `"refresh_token=fixture; Max-Age=..."` | KEEP: fixture backend plain `.mjs`, emulates upstream Set-Cookie |
| `src/api/auth/auth-refresh.ts:65,68,71,160` | DTO keys | KEEP |
| `src/lib/utils/auth-session.ts:132-134` | `assertNonEmptyToken` labels | KEEP |
| `src/actions/auth/x-oauth.ts`, `discord-oauth.ts` | `*_OAUTH_COOKIE_NAMES` | unrelated OAuth flow cookies, KEEP |

### R1 — `src/lib/navigation/routes.ts` — MODIFY (adds `defaultPostAuthHref`)

CURRENT (lines 97-99):

```ts
export const homeHref = toPublicRoute(publicRoutes.home);
export const signedInHomeHref = toPrivateRoute(privateRoutes.home);
export const forgotPasswordHref = toPublicRoute(publicRoutes.forgotPassword);
```

AFTER:

```ts
export const homeHref = toPublicRoute(publicRoutes.home);
export const signedInHomeHref = toPrivateRoute(privateRoutes.home);
/**
 * Default destination after login / OAuth / confirm-email / already-signed-in
 * when no safe `next` path exists.
 */
export const defaultPostAuthHref = signedInHomeHref;
export const forgotPasswordHref = toPublicRoute(publicRoutes.forgotPassword);
```

Lint checks done: knip `exclude` list includes `exports`, and `src/lib/**` is in `ignoreIssues` for `files`, so a new export is never reported; there is no ESLint rule against `export const x = y` aliases (only `max-lines` and the constants/types/screen restrictions); `src/lib/navigation/home.ts` is NOT touched because none of the five sites import from `home.ts` (all five import `@/lib/navigation/routes`). Tests: extend `src/lib/navigation/routes.test.ts` (imports `./routes`): `expect(defaultPostAuthHref).toBe("/home")` and `expect(defaultPostAuthHref).toBe(signedInHomeHref)`.

### R2 — five post-auth sites — MODIFY (`homeHref` -> `defaultPostAuthHref`)

Kept as `homeHref` (do not edit): `logout-content.tsx:38`, `header/brand-logo-link`, `header.tsx`, `header-dashboard` (`navigateToHome`), `dashboard-layout`, `not-found-page`, `status-error-page`, `global-error.tsx`, `canonical.ts`.

| Site | CURRENT | AFTER |
|---|---|---|
| `src/components/common/auth-menu/auth/login-content.tsx` L23 | `import { homeHref, signupHref } from "@/lib/navigation/routes";` | `import { defaultPostAuthHref, signupHref } from "@/lib/navigation/routes";` |
| same, L116 | `onAuthenticated(nextPath ?? homeHref);` | `onAuthenticated(nextPath ?? defaultPostAuthHref);` |
| `src/hooks/auth/use-oauth-post-auth.ts` L5 | `import { homeHref } from "@/lib/navigation/routes";` | `import { defaultPostAuthHref } from "@/lib/navigation/routes";` |
| same, L26 | `onAuthenticated(nextPath ?? homeHref);` | `onAuthenticated(nextPath ?? defaultPostAuthHref);` |
| `src/hooks/auth/use-redirect-if-authenticated.ts` L6 | `import { homeHref } from "@/lib/navigation/routes";` | `import { defaultPostAuthHref } from "@/lib/navigation/routes";` |
| same, L43 | `router.replace(nextPath ?? homeHref);` | `router.replace(nextPath ?? defaultPostAuthHref);` |
| same, doc comment L28-30 | `...a bounce to \`homeHref\` instead — caught via a fixture-backed e2e run where a learner's own post-login redirect to \`/instructor\` got hijacked back to \`/\` this way.` | `...a bounce to \`defaultPostAuthHref\` instead — caught via a fixture-backed e2e run where a learner's own post-login redirect to \`/instructor\` got hijacked back to the default destination this way.` |
| `src/components/common/auth-menu/auth/login-signup-popup.tsx` L14 | `import { homeHref } from "@/lib/navigation/routes";` | `import { defaultPostAuthHref } from "@/lib/navigation/routes";` |
| same, L45 | `closeWithAnimation(() => router.push(destination \|\| homeHref));` | `closeWithAnimation(() => router.push(destination \|\| defaultPostAuthHref));` |
| `src/components/common/auth-menu/auth/confirm-email-content.tsx` L10 | `import { homeHref } from "@/lib/navigation/routes";` | `import { defaultPostAuthHref } from "@/lib/navigation/routes";` |
| same, L43 | `router.replace(homeHref);` | `router.replace(defaultPostAuthHref);` |

Existing tests asserting the destination: grep of `login-content.test.tsx` and `login-signup-popup.test.tsx` for `push`/`replace`/`"/"`/`onAuthenticated` call args finds NO destination assertion (login submission goes through a Server Action and is explicitly covered by e2e per the file comment). No tests exist for `use-oauth-post-auth`, `use-redirect-if-authenticated`, `confirm-email-content`. `use-auth-modal-background-bridge.test.tsx:54` uses `/home` only as a sample string.

New tests (all run in jsdom):

- `src/hooks/auth/use-oauth-post-auth.test.ts`: mock `@/hooks/auth/use-auth-store` (`useGetMe` -> `{ mutateMe }`); `renderHook(() => useOAuthPostAuth(null, onAuth))` then `result.current()` -> `onAuth("/home")`; with `"/instructor"` -> `onAuth("/instructor")`.
- `src/hooks/auth/use-redirect-if-authenticated.test.ts`: mock `useGetMe` (authenticated) and `@/i18n/navigation` `useRouter` -> `{ replace }`; authenticated with `null` next -> `replace("/home")`; with next `"/instructor"` -> `replace("/instructor")`; guest -> no call.
- `src/components/common/auth-menu/auth/confirm-email-content.test.tsx`: mock `@/actions/auth` `confirmAction` -> `{ success: true }`, `MockAppRouterProvider` router spy, `useSearchParams` token set; expect `router.replace` called with a string ending `/home`.
- `LoginSignupPopup.handleAuthenticated`: not reachable without a real login; covered by the e2e `signed-in-redirect.spec.ts` login-without-next case (see E3).

Existing e2e that logs in without a `next` target would now land on `/en/home`; specs found: all call `loginAs` from `/en/instructor` (next target is `/instructor`) so they are unchanged; re-run `npm run test:e2e` to confirm.

### S1 — `src/lib/seo/site-config.ts` — MODIFY (D1)

Smallest change: one optional 2nd argument on `parseAbsoluteHttpsOrigin` (the alias `parseAbsoluteHttpsUrl` is the same function so it inherits it); one-argument behavior is byte-identical to today (accepts https, including `https://localhost`). `resolveSiteConfig` picks the policy from `nodeEnv`.

Type (ADD to `src/types/seo/metadata.ts`, types only; also see T1):

```ts
export type SiteOriginLoopbackPolicy = "reject" | "allow-http";

export type ParseSiteOriginOptions = {
  /**
   * Omitted: today's behavior (https only, any host).
   * "reject": https only AND the host must not be loopback (localhost, 127.0.0.1, [::1]).
   * "allow-http": https any host, or http on localhost / 127.0.0.1 only.
   */
  loopback?: SiteOriginLoopbackPolicy;
};
```

CURRENT: `site-config.ts` lines 1-42 and 56-75 as shown in section 3 reading (parse L16-35, resolve L53-75).

AFTER (imports and new constants/helper; keep header comment, adjust line 2-3 to "pure https origin in production; loopback http allowed outside production"):

```ts
import {
  DEFAULT_SITE_NAME,
  DEFAULT_THEME_COLOR,
} from "@/constants/seo/metadata";
import { routing } from "@/i18n/routing";
import type {
  ParseSiteOriginOptions,
  ResolveSiteConfigInput,
  SeoSiteConfig,
} from "@/types/seo/metadata";

const LOOPBACK_HOSTNAMES: readonly string[] = [
  "localhost",
  "127.0.0.1",
  "[::1]",
];
const DEV_HTTP_HOSTNAMES: readonly string[] = ["localhost", "127.0.0.1"];

/** Lower-cased hostname without a trailing dot (`localhost.` is still loopback). */
function normalizedHostname(url: URL): string {
  return url.hostname.trim().toLowerCase().replace(/\.$/, "");
}

/**
 * Parse and validate a pure origin: https, or (only with
 * `loopback: "allow-http"`) http on localhost / 127.0.0.1.
 * Rejects username/password, pathname other than empty/"/", search, and hash.
 */
export function parseAbsoluteHttpsOrigin(
  raw: string,
  options: ParseSiteOriginOptions = {},
): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const hostname = normalizedHostname(url);
    if (!hostname) return null;
    if (url.protocol === "http:") {
      if (
        options.loopback !== "allow-http" ||
        !DEV_HTTP_HOSTNAMES.includes(hostname)
      ) {
        return null;
      }
    } else if (url.protocol !== "https:") {
      return null;
    } else if (
      options.loopback === "reject" &&
      LOOPBACK_HOSTNAMES.includes(hostname)
    ) {
      return null;
    }
    if (url.username || url.password) return null;
    if (url.search || url.hash) return null;
    const path = url.pathname;
    if (path !== "" && path !== "/") return null;
    return url;
  } catch {
    return null;
  }
}
```

`resolveSiteConfig`:

```ts
export function resolveSiteConfig(
  input: ResolveSiteConfigInput = {},
): SeoSiteConfig {
  const fromEnv = input.readEnv === true ? process.env.SITE_URL : undefined;
  const raw = (input.siteUrl ?? fromEnv ?? "").trim();
  const isProduction = (input.nodeEnv ?? process.env.NODE_ENV) === "production";
  const parsed = parseAbsoluteHttpsOrigin(raw, {
    loopback: isProduction ? "reject" : "allow-http",
  });
  if (!parsed) {
    throw new SiteConfigError(
      isProduction
        ? "SITE_URL must be a pure public https:// origin in production (no path/query/hash/userinfo; no localhost/127.0.0.1/[::1]; not NEXT_PUBLIC_*)"
        : "SITE_URL must be a pure https:// origin (or http://localhost / http://127.0.0.1 outside production); no path/query/hash/userinfo; not NEXT_PUBLIC_*",
    );
  }
  // ...return object unchanged
}
```

`ResolveSiteConfigInput` (T1) gains:

```ts
  /** Test injection for the production/non-production policy; defaults to `process.env.NODE_ENV`. */
  nodeEnv?: string;
```

Matrix pinned by tests: production accepts `https://example.com`, `https://example.com:8443`; rejects `http://example.com`, `http://localhost:3000`, `https://localhost`, `https://127.0.0.1`, `https://[::1]`, `https://LOCALHOST.`; non-production additionally accepts `http://localhost`, `http://localhost:3000`, `http://127.0.0.1:3000` and still rejects `http://example.com`, `http://[::1]:3000`, `ftp://x`, and any path/query/hash/userinfo. Empty/missing SITE_URL throws in both. Normalization: `normalizeSiteOrigin` unchanged (`url.origin`, so `http://localhost:3000` -> `http://localhost:3000`).

Call sites: `parseAbsoluteHttpsOrigin` / `parseAbsoluteHttpsUrl` have no callers outside `site-config.ts` and the barrel (`src/lib/seo/index.ts` L20-27); `resolveSiteConfig` is called in `canonical.ts:28`, `build-page-metadata.ts:32` and the new files. Next versions treat `process.env.NODE_ENV` as a build-time constant; reading it at runtime in `resolveSiteConfig` is safe in the server bundle. Edge note: in tests NODE_ENV is `"test"`, i.e. non-production, so existing/new unit tests may use `http://localhost:3000` without injecting `nodeEnv`; tests of the production matrix inject `nodeEnv: "production"`.

Reuse: the existing parser (no second parser). Tests: `src/lib/seo/site-config.test.ts` (jsdom, `src/lib/**`): the matrix above; one-argument `parseAbsoluteHttpsOrigin("https://localhost")` still returns a URL; alias identity `parseAbsoluteHttpsUrl === parseAbsoluteHttpsOrigin`; `readEnv: true` reads `process.env.SITE_URL` (save/restore in `beforeEach/afterEach`).

### I1 — `src/instrumentation.ts` — ADD (D2)

Location verified: Next docs say the file goes in the project root or inside `src/` when a `src` folder is used; this repo uses `src/app` and `src/proxy.ts`, so `src/instrumentation.ts`. Knip's Next plugin lists `{instrumentation,...}.{js,ts}` with the `src/` prefix as a production entry, so no knip config change is needed; ESLint/Biome need nothing special; it is not under `src/constants|types|screen`.

AFTER (whole file):

```ts
import { resolveSiteConfig } from "@/lib/seo/site-config";

/**
 * Fail fast: a production Node server must not start with a missing or
 * invalid SITE_URL (canonical, hreflang, sitemap, robots all depend on it).
 * Skipped for `next build` (NEXT_PHASE=phase-production-build), which runs
 * with NODE_ENV=production but without runtime env.
 */
export async function register(): Promise<void> {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    resolveSiteConfig({ readEnv: true });
  }
}
```

(`register` may be async per the docs; `async` keeps the D2 signature without awaiting anything, which Biome does not flag. If a `useAwait` style rule objects in `biome check`, drop `async`/`Promise<void>`; the docs allow a sync function.) `SiteConfigError` propagates out of `register` and stops server start. Tests: `src/instrumentation.test.tsx` with `/** @jest-environment node */`: cases `NEXT_RUNTIME=nodejs, NODE_ENV=production, SITE_URL unset` -> rejects with `SiteConfigError`; `SITE_URL=https://example.com` -> resolves; `NEXT_PHASE=phase-production-build` -> resolves with no SITE_URL; `NEXT_RUNTIME=edge` -> resolves; `NODE_ENV=development` -> resolves. Mutate env via direct assignment for `NEXT_RUNTIME/NEXT_PHASE/SITE_URL` and `jest.replaceProperty(process.env, "NODE_ENV", ...)` for `NODE_ENV` (typed readonly); restore in `afterEach`.

### U1 — `src/lib/seo/canonical.ts` — MODIFY (adds `buildLanguageAlternates`, D6 per coordinator)

Trade-off recorded: the two loops are identical (per-locale canonical map + `x-default` = default-locale canonical), differing only in that the sitemap passes `input.site` (possibly undefined, defaulting to env) and the metadata factory passes `siteOpts`. One helper removes a real duplicate and a divergence risk (hreflang and sitemap `x-default` must agree). Cost: one exported function and one input type. No cycle: `canonical.ts` already imports `site-config.ts`.

Type (ADD to `src/types/seo/metadata.ts`):

```ts
export type LanguageAlternatesInput = {
  /** Locale-less app pathname, e.g. "/" or "/become-instructor". */
  pathname?: string;
  /** Defaults to the routing locales. */
  locales?: readonly string[];
  site?: ResolveSiteConfigInput;
};
```

CURRENT `canonical.ts` lines 5-9 and 27-32:

```ts
import { getPathname } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/home";
import { resolveSiteConfig } from "@/lib/seo/site-config";
import { buildQueryParams } from "@/lib/utils/url";
import type { CanonicalInput } from "@/types/seo/metadata";
...
export function buildCanonicalUrl(input: CanonicalInput): string {
  const site = resolveSiteConfig(input.site ?? { readEnv: true });
  const path = localizedPathname(input.locale, input.pathname ?? homeHref);
  const withQuery = buildQueryParams(path, input.query) ?? path;
  return `${site.siteUrl}${withQuery.startsWith("/") ? withQuery : `/${withQuery}`}`;
}
```

AFTER:

```ts
import { getPathname } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/home";
import {
  resolveSiteConfig,
  siteDefaultLocale,
  siteLocales,
} from "@/lib/seo/site-config";
import { buildQueryParams } from "@/lib/utils/url";
import type {
  CanonicalInput,
  LanguageAlternatesInput,
} from "@/types/seo/metadata";
```

Append after `buildCanonicalUrl`:

```ts
/**
 * hreflang map: one canonical URL per locale plus `x-default`
 * (the default locale's canonical). Shared by page metadata and the sitemap.
 */
export function buildLanguageAlternates(
  input: LanguageAlternatesInput,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of input.locales ?? siteLocales()) {
    languages[locale] = buildCanonicalUrl({
      locale,
      pathname: input.pathname,
      site: input.site,
    });
  }
  languages["x-default"] = buildCanonicalUrl({
    locale: siteDefaultLocale(),
    pathname: input.pathname,
    site: input.site,
  });
  return languages;
}
```

Call sites: new in `build-page-metadata.ts` and `sitemap-builder.ts` only. Also export it through the barrel `src/lib/seo/index.ts` (add `buildLanguageAlternates` to the `canonical` export list, alphabetical: `buildCanonicalUrl, buildLanguageAlternates, localizedPathname, toAbsoluteUrl`). Tests: `src/lib/seo/canonical.test.ts`: `localizedPathname("vi","/")` is `/vi` (next-intl `prefixPathname` strips the lone slash, verified in `node_modules/next-intl/.../shared/utils.js`), `localizedPathname("en","/home")` is `/en/home`; `buildLanguageAlternates({ pathname: "/", site: { siteUrl: "https://example.com" } })` equals `{ en: "https://example.com/en", vi: "https://example.com/vi", "x-default": "https://example.com/vi" }`; `locales: ["en"]` override gives `en` and `x-default` only.

### U2 — `src/lib/seo/build-page-metadata.ts` — MODIFY

CURRENT (lines 11, 52-59):

```ts
import { buildCanonicalUrl, toAbsoluteUrl } from "@/lib/seo/canonical";
import { robotsPreset } from "@/lib/seo/robots-presets";
import { resolveSiteConfig, siteLocales } from "@/lib/seo/site-config";
...
  const languages: Record<string, string> = {};
  for (const locale of siteLocales()) {
    languages[locale] = buildCanonicalUrl({
      locale,
      pathname,
      site: siteOpts,
    });
  }
```

AFTER:

```ts
import {
  buildCanonicalUrl,
  buildLanguageAlternates,
  toAbsoluteUrl,
} from "@/lib/seo/canonical";
import { robotsPreset } from "@/lib/seo/robots-presets";
import { resolveSiteConfig } from "@/lib/seo/site-config";
...
  const languages = buildLanguageAlternates({ pathname, site: siteOpts });
```

(`siteLocales` import removed, no other use in the file.) Result: `alternates.languages` now includes `"x-default"`. Callers of `buildPageMetadata`: none today; the new `(web)/page.tsx` is the first. Tests: `src/lib/seo/build-page-metadata.test.ts`: with `site: { siteUrl: "https://example.com" }`: `title`/`description` pass through and truncate at 60/160 code points; `alternates.canonical === "https://example.com/en"` for locale `en`, pathname `/`; `alternates.languages` has `en`, `vi`, `x-default` (= `/vi`); default robots equals `robotsPreset("indexable")`; `robots: "noindex"` input maps through; no `openGraph.images` / `twitter.card === "summary"` without an image; with an image, `summary_large_image`; `metadataBase.href === "https://example.com/"`; `openGraph.url === canonical`; `canonicalPath` overrides `pathname`.

### U3 — `src/lib/seo/sitemap-builder.ts` — MODIFY (also D14)

CURRENT (lines 1-34 and 40-76 shown in the read above). Header comment L2 `Pure sitemap entry builder. Not wired to app/sitemap.ts this phase.` becomes false once `src/app/sitemap.ts` exists.

AFTER (full file):

```ts
/**
 * Pure sitemap entry builder, consumed by `src/app/sitemap.ts`.
 * Defaults to SEO-indexable pathnames - not raw PUBLIC_ROUTES.
 */

import { PUBLIC_ROUTES } from "@/constants/route";
import { toPublicRoute } from "@/lib/navigation/routes";
import {
  buildCanonicalUrl,
  buildLanguageAlternates,
  localizedPathname,
} from "@/lib/seo/canonical";
import { listSeoIndexablePathnames } from "@/lib/seo/indexable-routes";
import { siteDefaultLocale } from "@/lib/seo/site-config";
import type {
  BuildSitemapEntriesInput,
  PublicRouteValue,
  SitemapEntry,
} from "@/types/seo/metadata";

export {
  isSeoIndexablePublicRouteKey,
  listSeoIndexablePathnames,
  SEO_INDEXABLE_PUBLIC_ROUTE_KEYS,
} from "@/lib/seo/indexable-routes";

/**
 * All publicly routable static pathnames (including auth flows).
 * Prefer `listSeoIndexablePathnames` for sitemap / crawl-allow.
 */
export function listPublicStaticPathnames(): string[] {
  return Object.values(PUBLIC_ROUTES).map((route) => toPublicRoute(route));
}

/**
 * Builds absolute sitemap entries with hreflang alternates per locale.
 * Default pathnames = SEO_INDEXABLE_PUBLIC_ROUTE_KEYS - never raw PUBLIC_ROUTES.
 */
export function buildSitemapEntries(
  input: BuildSitemapEntriesInput = {},
): SitemapEntry[] {
  const pathnames = input.pathnames ?? listSeoIndexablePathnames();
  const defaultLocale = siteDefaultLocale();

  return pathnames.map((pathname) => ({
    url: buildCanonicalUrl({
      locale: defaultLocale,
      pathname,
      site: input.site,
    }),
    changeFrequency: input.changeFrequency ?? "weekly",
    priority: input.priority ?? (pathname === "/" ? 1 : 0.7),
    alternates: {
      languages: buildLanguageAlternates({
        pathname,
        locales: input.locales,
        site: input.site,
      }),
    },
  }));
}

/** Debug helper: localized public paths without absolute origin. */
export function listLocalizedPublicPaths(
  locale: string,
  pathnames: readonly PublicRouteValue[] = Object.values(PUBLIC_ROUTES),
): string[] {
  return pathnames.map((pathname) => localizedPathname(locale, pathname));
}
```

Deleted: `listPrivatePathPrefixes` (L32-34, D14) and the imports `PRIVATE_ROUTES`, `flattenRouteTreePaths` (no other use in the file; `flattenRouteTreePaths` stays used by `crawl-policy.ts` and `flatten-route-tree.ts`), plus the `siteLocales` import. Behavior unchanged except the explicit `entries` array became `map` (same output order/values). Barrel `src/lib/seo/index.ts` L28-32 CURRENT:

```ts
export {
  buildSitemapEntries,
  listPrivatePathPrefixes,
  listPublicStaticPathnames,
} from "@/lib/seo/sitemap-builder";
```

AFTER: `export { buildSitemapEntries, listPublicStaticPathnames } from "@/lib/seo/sitemap-builder";` (Biome formats multi-line). Consumers of `listPrivatePathPrefixes`: grep over the repo finds only the definition, the barrel, and openspec/doc text (`docs/seo-ranking-setup.md`, `docs/folder-structure.md`, `openspec/...`); no source or test imports it. `SitemapEntry` items are assignable to `MetadataRoute.Sitemap` items (`url`, `lastModified?: string | Date`, `changeFrequency` same union, `priority`, `alternates.languages: Record<string,string>`; checked against `node_modules/next/dist/lib/metadata/types/metadata-interface.d.ts:562-572`); `exactOptionalPropertyTypes` is the only TS flag to double-check if `tsc` complains.

`json-ld.tsx` comment L10-11 CURRENT: `Place under src/lib/seo (not src/components) while unused — Knip files policy.` This becomes false once the home page uses it. AFTER: `Lives under src/lib/seo next to the other SEO builders (not src/components).` (comment-only edit; the biome-ignore line stays). Tests: `src/lib/seo/sitemap-builder.test.ts`: default call with `site: { siteUrl: "https://example.com" }` yields exactly one entry `url === "https://example.com/vi"`, `priority === 1`, `changeFrequency === "weekly"`, `alternates.languages` = en/vi/x-default; custom `pathnames: ["/become-instructor"]` gives priority `0.7` and `/vi/become-instructor`; `locales: ["en"]` restricts languages; `listPublicStaticPathnames()` unchanged.

### D1x — `src/constants/seo/routes.ts`, `src/lib/security/web/crawl-policy.ts` — MODIFY/DELETE (D14)

CURRENT `src/constants/seo/routes.ts` lines 11-15:

```ts
/**
 * Signed-in homepage path — mirrors `PRIVATE_ROUTES.home`.
 * Not SEO-indexable; crawl disallow derives from `PRIVATE_ROUTES`.
 */
export const SIGNED_IN_HOME_PATH = "/home" as const;
```

AFTER: delete those 5 lines and the blank line before them. `import type { PUBLIC_ROUTES }` and `SEO_INDEXABLE_PUBLIC_ROUTE_KEYS` stay. The doc comment on `SEO_INDEXABLE_PUBLIC_ROUTE_KEYS` needs no change. `indexable-routes.ts` does NOT mention `SIGNED_IN_HOME_PATH` (verified), so no comment edit there. CURRENT `crawl-policy.ts` L10: `export { SIGNED_IN_HOME_PATH } from "@/constants/seo/routes";` -> delete the line (and the blank line after it). `signedInHomeRobotsMode` keeps its doc comment ("Signed-in `/home` ..."). `src/constants/seo/index.ts` does `export * from "./routes"`; nothing else to edit.

Proof of no other consumers: `grep -rn SIGNED_IN_HOME_PATH` over the repo finds the definition, the re-export, and text in `docs/seo-ranking-setup.md`, `docs/folder-structure.md` and openspec files; no `src/` import, no test, no e2e. The documentation mentions must be corrected by the docs inventory (use `signedInHomeHref` from `routes.ts` as the single source). Replacement: `signedInHomeHref` (already used).

### P1 — `src/app/page.tsx` — MODIFY (D14)

CURRENT (whole file):

```tsx
import { redirect } from "@/i18n/navigation";

export default function Home() {
  redirect({ href: "/", locale: "vi" });
}
```

AFTER:

```tsx
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { homeHref } from "@/lib/navigation/home";

export default function Home() {
  redirect({ href: homeHref, locale: routing.defaultLocale });
}
```

The coordinator spec says `href: "/"`; using `homeHref` (`"/"`) is the same value from the existing constant; if the reviewer wants the literal, `"/"` is acceptable. Note: with the proxy matcher this page is effectively unreachable (intl middleware redirects `/` first); it remains a safety net. Tests: none (no logic); covered by e2e `/` redirect.

### X1 — `src/lib/navigation/signed-in-home-redirect.ts` — ADD (D4)

Constraints verified: no `server-only`, no `next/headers`, no `@/i18n/navigation`; imports only `next-intl` (`hasLocale`), `@/i18n/routing`, `@/lib/navigation/routes`, `@/constants/auth-cookie`. `routes.ts` has no imports of its own beyond constants/`lib/utils/url` (itself import-free) and a type import, `routing.ts` imports only `next-intl/routing`: no cycle, so madge is clean. It also does not import `canonical.ts` or `lib/seo`.

AFTER (whole file):

```ts
import { hasLocale } from "next-intl";
import {
  REFRESH_TOKEN_COOKIE,
  SESSION_ID_COOKIE,
} from "@/constants/auth-cookie";
import { routing } from "@/i18n/routing";
import { signedInHomeHref } from "@/lib/navigation/routes";

type CookieReader = { has(name: string): boolean };

/** A session exists when both the refresh token and the session id cookies are present. */
export function hasAuthSessionCookies(cookies: CookieReader): boolean {
  return cookies.has(REFRESH_TOKEN_COOKIE) && cookies.has(SESSION_ID_COOKIE);
}

/**
 * The locale of a locale-root pathname (`/vi`, `/en`, optional trailing
 * slash), or null for anything else (including `/`, `/fr`, `/vi/home`).
 */
export function getLocaleRootLocale(pathname: string): string | null {
  const trimmed = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (!trimmed.startsWith("/")) return null;
  const segment = trimmed.slice(1);
  if (!segment || segment.includes("/")) return null;
  return hasLocale(routing.locales, segment) ? segment : null;
}

export function isLocaleRootPathname(pathname: string): boolean {
  return getLocaleRootLocale(pathname) !== null;
}

/**
 * `/{locale}/home` when a signed-in visitor requests a locale root, else null.
 */
export function resolveSignedInHomeRedirectPath(input: {
  pathname: string;
  hasSession: boolean;
}): string | null {
  if (!input.hasSession) return null;
  const locale = getLocaleRootLocale(input.pathname);
  return locale ? `/${locale}${signedInHomeHref}` : null;
}
```

`"//"`: trimmed `"/"`, segment `""` -> null. `"/vi//"`: trimmed `"/vi/"`, segment `"vi/"` includes `/` -> null. One implementation of locale-root detection (`getLocaleRootLocale`) is shared by the resolver and by the proxy (via `isLocaleRootPathname`). Tests: `src/lib/navigation/signed-in-home-redirect.test.ts` (jsdom, `src/lib/**`): table for `resolveSignedInHomeRedirectPath` with session: `/` -> null, `/vi` -> `/vi/home`, `/vi/` -> `/vi/home`, `/en` -> `/en/home`, `/en/` -> `/en/home`, `/fr` -> null, `/vi/home` -> null, `/vi/login` -> null, `/vi/` + query is not part of pathname; without session every row -> null. `hasAuthSessionCookies` with a `new Set(...)`-backed `{ has }` stub: both present true; only refresh false; only session_id false; only access_token false. `isLocaleRootPathname` mirrors the table.

### X2 — `src/proxy.ts` — MODIFY (D5)

Verified in `proxy.md` (Next 16.2.1): "The file must export a single function, either as a default export or named `proxy`"; `config.matcher` values must be constants for static analysis; proxy defaults to the Node.js runtime. The `config` export is kept byte-identical (static literal); the default export changes from the `createMiddleware(routing)` result to a function named `proxy`.

CURRENT (whole file):

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|auth/discord/callback|auth/x/callback|.*\\..*).*)",
  ],
};
```

AFTER:

```ts
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import {
  hasAuthSessionCookies,
  isLocaleRootPathname,
  resolveSignedInHomeRedirectPath,
} from "@/lib/navigation/signed-in-home-redirect";

const intlMiddleware = createMiddleware(routing);

/** Adds a token to `Vary` without clobbering an existing value. */
function appendVary(response: NextResponse, token: string): void {
  const existing = response.headers.get("Vary");
  if (!existing) {
    response.headers.set("Vary", token);
    return;
  }
  const tokens = existing.split(",").map((value) => value.trim().toLowerCase());
  if (tokens.includes("*") || tokens.includes(token.toLowerCase())) return;
  response.headers.set("Vary", `${existing}, ${token}`);
}

export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);
  const { pathname } = request.nextUrl;
  const redirectPath = resolveSignedInHomeRedirectPath({
    pathname,
    hasSession: hasAuthSessionCookies(request.cookies),
  });

  if (redirectPath) {
    const redirect = NextResponse.redirect(
      new URL(redirectPath, request.url),
      307,
    );
    redirect.headers.set("Cache-Control", "private, no-store");
    redirect.headers.set("Vary", "Cookie");
    for (const setCookie of response.headers.getSetCookie()) {
      redirect.headers.append("Set-Cookie", setCookie);
    }
    return redirect;
  }

  if (isLocaleRootPathname(pathname)) {
    appendVary(response, "Cookie");
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|auth/discord/callback|auth/x/callback|.*\\..*).*)",
  ],
};
```

Notes: `intlMiddleware` runs first so its `NEXT_LOCALE` Set-Cookie (and any locale detection cookie) survives the redirect (copied via `getSetCookie()`, Node >= 19.7 / undici). The intl response for `/en` is a rewrite (`x-middleware-rewrite` header etc.); it is discarded for the redirect, which is correct. `isLocaleRootPathname` is the same function the resolver uses (no second implementation). Guests keep the rewrite response, with `Vary: Cookie` appended only for locale roots so shared caches do not serve a guest page to a signed-in visitor or the reverse. Callers: the framework only. Tests: `src/proxy.test.tsx` (`/** @jest-environment node */` first line): build `new NextRequest("http://localhost:3000/en", { headers: { cookie: "refresh_token=r; session_id=s" } })`; assert status `307`, `location` ends with `/en/home`, `cache-control === "private, no-store"`, `vary` is `Cookie`, a `set-cookie` carried over (use a request without `NEXT_LOCALE` to let intl set `NEXT_LOCALE`; assert `response.headers.getSetCookie()` contains it when the intl response had one, or assert it equals the intl response's set-cookie list by calling `createMiddleware(routing)` directly); `/vi/` redirects to `/vi/home`; only `refresh_token` cookie -> no redirect (status 200 rewrite) and `vary` includes `Cookie`; guest `/en` -> `vary` includes `Cookie`, no `location`; `/en/home` and `/en/login` with a session -> no redirect and no added `Vary`; pre-existing `Vary: Accept-Language` (stub by wrapping, or assert order) stays and `Cookie` is appended once (unit-test `appendVary` indirectly through two calls is not possible, so cover through a `jest.mock("next-intl/middleware")` returning a response with `Vary: Accept-Language`). `config.matcher` equality snapshot test: `expect(config.matcher).toEqual([...])` to pin the static literal.

### SEO1 — `src/lib/seo/robots-txt.ts` — ADD (D7)

`localizedPathname("vi", "/")` returns `/vi` (no trailing slash; next-intl `prefixPathname` strips the root slash, `localePrefix: "always"`). `privateCrawlDisallowPaths()` returns strings such as `/home`, `/admin`, `/admin/users`, ...; `publicCrawlAllowPaths()` returns `["/"]`. Resulting rules: `Allow: /en`, `Allow: /vi`, `Disallow: /en/home`, `/en/admin`, ... for every locale. Robots matching is prefix-based and the longest match wins (Google), so `Allow: /vi` does not override the longer `Disallow: /vi/admin`; as a side effect `Allow: /vi` is also a prefix of unrelated future paths such as `/video` (none exist; mention only).

Type (ADD to `src/types/seo/metadata.ts`):

```ts
export type BuildRobotsTxtRulesInput = {
  site?: ResolveSiteConfigInput;
  locales?: readonly string[];
};
```

AFTER (whole file):

```ts
/**
 * robots.txt rules for `src/app/robots.ts`: localized public allow-list,
 * localized private disallow-list, and the absolute sitemap URL.
 */

import type { MetadataRoute } from "next";
import {
  privateCrawlDisallowPaths,
  publicCrawlAllowPaths,
} from "@/lib/security/web/crawl-policy";
import { localizedPathname, toAbsoluteUrl } from "@/lib/seo/canonical";
import { resolveSiteConfig, siteLocales } from "@/lib/seo/site-config";
import type { BuildRobotsTxtRulesInput } from "@/types/seo/metadata";

export function buildRobotsTxtRules(
  input: BuildRobotsTxtRulesInput = {},
): MetadataRoute.Robots {
  const site = resolveSiteConfig(input.site ?? { readEnv: true });
  const locales = input.locales ?? siteLocales();
  const localized = (paths: readonly string[]): string[] =>
    locales.flatMap((locale) =>
      paths.map((path) => localizedPathname(locale, path)),
    );

  return {
    rules: {
      userAgent: "*",
      allow: localized(publicCrawlAllowPaths()),
      disallow: localized(privateCrawlDisallowPaths()),
    },
    sitemap: toAbsoluteUrl(site.siteUrl, "/sitemap.xml"),
  };
}
```

Reuse: `privateCrawlDisallowPaths`/`publicCrawlAllowPaths` (no new path lists), `localizedPathname`, `toAbsoluteUrl`. Import graph: `robots-txt -> crawl-policy -> {constants/route, navigation/flatten-route-tree, seo/indexable-routes}`; no cycle. Also export from the barrel `src/lib/seo/index.ts`: `export { buildRobotsTxtRules } from "@/lib/seo/robots-txt";` (alphabetical after `robots-presets` block). Tests: `src/lib/seo/robots-txt.test.ts`: `allow` equals `["/en", "/vi"]` (locale order of `routing.locales`: `en`, `vi`); `disallow` contains `/en/admin`, `/vi/admin`, `/en/home`, `/vi/home` and no entry without a locale prefix; `sitemap === "https://example.com/sitemap.xml"`; `locales: ["vi"]` restricts; invalid `site` (production, `http://x`) throws `SiteConfigError`; rule shape is `{ userAgent: "*", allow: [...], disallow: [...] }`.

### SEO2 — `src/app/robots.ts` and `src/app/sitemap.ts` — ADD (D8)

Verified in the Next docs: `robots.ts`/`sitemap.ts` are Route Handlers cached by default unless a dynamic config is used; `export const dynamic = "force-dynamic"` makes them evaluate per request so `SITE_URL` is read at runtime (no build-time env). Knip's Next plugin treats `src/app/{robots,sitemap}.ts` as entries (patterns with `src/` prefix); `src/app/**` is also in `ignoreIssues`.

AFTER `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { buildRobotsTxtRules } from "@/lib/seo/robots-txt";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsTxtRules({ site: { readEnv: true } });
}
```

AFTER `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/seo/sitemap-builder";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries({ site: { readEnv: true } });
}
```

`BuildSitemapEntriesInput.site` is `ResolveSiteConfigInput` (verified). `/robots.txt` and `/sitemap.xml` are excluded from the proxy matcher by the `.*\\..*` clause, so they are not locale-redirected. Tests: `src/app/robots.test.tsx` and `src/app/sitemap.test.tsx` (`.tsx` so they run; node docblock recommended): set `process.env.SITE_URL = "https://example.com"` in `beforeEach` (restore in `afterEach`); `robots()` returns `sitemap: "https://example.com/sitemap.xml"` and `rules.disallow` contains `/en/admin`; `sitemap()` returns one entry with `url: "https://example.com/vi"` and `alternates.languages["x-default"] === "https://example.com/vi"`; both export `dynamic === "force-dynamic"`; both throw `SiteConfigError` without `SITE_URL` in `nodeEnv` production (set via `jest.replaceProperty(process.env, "NODE_ENV", "production")`).

### H1 — `src/app/[locale]/(web)/page.tsx` — MODIFY (D9)

CURRENT (whole file):

```tsx
import { HomePage } from "@/screen";

export default function LocalePage() {
  return <HomePage />;
}
```

Type facts: `SeoPageInput` fields are `locale`, `pathname`, `title`, `description` (required) and `robots?`, `image?`, `canonicalPath?`, `type?`; `OrganizationJsonLdInput` is `{ name, url, logoUrl?, sameAs? }`; `buildOrganizationJsonLd` throws on an empty `name`/`url`. No OG image (none exists, so `buildPageMetadata` emits a `summary` Twitter card and no `og:image`).

AFTER:

```tsx
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { homeHref } from "@/lib/navigation/home";
import { buildPageMetadata } from "@/lib/seo/build-page-metadata";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildOrganizationJsonLd } from "@/lib/seo/ranking/organization";
import { resolveSiteConfig } from "@/lib/seo/site-config";
import { HomePage } from "@/screen";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "homepage.seo",
  });
  return buildPageMetadata(
    {
      locale: resolvedLocale,
      pathname: homeHref,
      title: t("title"),
      description: t("description"),
    },
    { site: { readEnv: true } },
  );
}

export default function LocalePage() {
  const site = resolveSiteConfig({ readEnv: true });
  return (
    <>
      <JsonLd
        data={buildOrganizationJsonLd({ name: site.siteName, url: site.siteUrl })}
      />
      <HomePage />
    </>
  );
}
```

(The login page precedent imports SEO modules by file path, hence direct imports instead of the `@/lib/seo` barrel.) Biome will re-wrap the `data=` line. The locale layout 404s for invalid locales (`notFound()`), the `hasLocale` fallback only guards `generateMetadata` ordering. JSON-LD uses only `site.siteName` and `site.siteUrl`; the home mock course data is not used. Build-time safety: there is no `generateStaticParams` in the app (grep), so `[locale]` pages are rendered on demand and `SITE_URL` is read at request time; `next build` does not need `SITE_URL`. If a future change adds `generateStaticParams`, `buildPageMetadata` would throw at build for lack of `SITE_URL`.

Page `getTranslations({ locale, namespace })` is the object form used by next-intl 4.13. Tests: `src/app/[locale]/(web)/page.test.tsx` (jsdom): mock `next-intl/server` so `getTranslations` returns a real translator (`createTranslator({ locale, messages: en or vi, namespace })` from `next-intl`); call `generateMetadata({ params: Promise.resolve({ locale: "en" }) })` with `SITE_URL=https://example.com`; expect `title === "MyCourse - Learn online from industry experts"`, `alternates.canonical === "https://example.com/en"`, `alternates.languages["x-default"] === "https://example.com/vi"`, `robots` indexable, `openGraph.siteName === "MyCourse"`, `metadataBase.origin === "https://example.com"`; locale `vi` uses Vietnamese copy; locale `xx` falls back to the default locale (`vi`) without throwing; rendering `<LocalePage />` outputs one `script[type="application/ld+json"]` whose parsed JSON has `@type: "Organization"`, `name: "MyCourse"`, `url: "https://example.com"` (stub `@/screen` `HomePage` with `jest.mock` to avoid the full home tree and its providers).

### H2 — `src/app/[locale]/(web)/home/page.tsx` — MODIFY (D10)

CURRENT (whole file):

```tsx
import { SignedInHomePage } from "@/screen/common/home/signed-in-home-page";

export default function SignedInHomeRoutePage() {
  return <SignedInHomePage />;
}
```

AFTER (mirrors `login/page.tsx`):

```tsx
import { getTranslations } from "next-intl/server";
import { signedInHomeRobotsMode } from "@/lib/security/web/crawl-policy";
import { robotsPreset } from "@/lib/seo/robots-presets";
import { SignedInHomePage } from "@/screen/common/home/signed-in-home-page";

export async function generateMetadata() {
  const t = await getTranslations("home.signedIn");
  return {
    title: t("pageTitle"),
    robots: robotsPreset(signedInHomeRobotsMode()),
  };
}

export default function SignedInHomeRoutePage() {
  return <SignedInHomePage />;
}
```

`robotsPreset("privateApp")` resolves to `{ index: false, follow: false, nocache: true }`, which Next renders as `<meta name="robots" content="noindex, nofollow, nocache">` (the e2e assertion uses a `noindex, nofollow` prefix match). Existing test `src/app/[locale]/(web)/home/page.test.tsx` (4 tests, default-export rendering) must be UPDATED: keep the 4 tests untouched and add (a) `jest.mock("next-intl/server", ...)` is NOT required for them; add a new `describe("generateMetadata")` that mocks `getTranslations` (as in H1) and expects `title: "Home"` (English `pageTitle`, see M1) and `robots` toEqual `robotsPreset("privateApp")`. Because `jest.mock` is hoisted file-wide, mock `next-intl/server` with a factory that only defines `getTranslations`; the default-export tests do not import it, so they are unaffected.

### M1 — `src/messages/en.ts` and `src/messages/vi.ts` — MODIFY (D11)

`vi.ts` is `satisfies Messages` and `Messages` is derived from `en.ts`, so a missing key in one file fails `tsc`. Both files are ESLint-ignored and not under `max-lines`.

New keys and final copy (**product text, to be reviewed by the owner**). Lengths measured in code points: all within SEO limits (title <= 60, description <= 160).

`en.ts`, inside `home.signedIn` (CURRENT starts at L34: `signedIn: {` then `loginRequired: {`), insert as the first key:

```ts
      pageTitle: "Home",
```

`en.ts`, inside `homepage` (CURRENT L282-: `homepage: {` then `hero: {`), insert before `hero`:

```ts
    seo: {
      title: "MyCourse - Learn online from industry experts", // 45
      description:
        "Explore online courses taught by industry experts. Discover trending courses, learn from popular instructors, and build new skills at your own pace.", // 148
    },
```

`vi.ts`, inside `home.signedIn` (L35):

```ts
      pageTitle: "Trang chủ",
```

`vi.ts`, inside `homepage` (L281):

```ts
    seo: {
      title: "MyCourse - Học trực tuyến cùng chuyên gia", // 41
      description:
        "Khám phá các khóa học trực tuyến do chuyên gia đầu ngành giảng dạy. Xem khóa học xu hướng, học cùng giảng viên nổi bật và nâng cao kỹ năng theo nhịp của bạn.", // 157
    },
```

(Remove the `// 45`-style counters when writing; they are for review only.) Tone matches `homepage.hero.description` ("Discover World-Class Courses Taught By Industry Experts...") and the signed-in sections ("Trending Course", "Popular Instructor"). No `home.title` boilerplate key is touched. Consumers: only `getTranslations` in H1/H2; no component reads these keys. Verify: `npx tsc --noEmit`.

### L1 — `src/app/layout.tsx` — MODIFY (D12)

CURRENT (whole file, lines 1-27) as read above: `metadata = { title: "MyCourse FE", description: "Next.js 16 starter with i18n and app stack" }`, sync `RootLayout`, `<html lang="vi" ...>`.

AFTER:

```tsx
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Toaster } from "sonner";
import { DEFAULT_SITE_NAME } from "@/constants/seo/metadata";
import { geistMono, gilroy, roboto } from "@/lib/font";
import "./globals.css";

export const metadata: Metadata = {
  title: DEFAULT_SITE_NAME,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${roboto.variable} ${gilroy.variable} ${geistMono.variable} font-roboto h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
```

Biome import order: `next`, `next-intl/server`, `sonner`, then `@/` aliases, then side-effect CSS (matches the existing file where `import "./globals.css"` is last). Placeholder `description` removed (pages without their own description now emit none). Assumption checks: `global-error.tsx` owns its own `<html lang={locale}>` (L136) and does not use the root layout; `global-error.test.tsx` asserts `lang` of that boundary, not the root layout, so it is unaffected. There is no test of `layout.tsx`. Grep over `src/` and `e2e/` for assertions on the old title `MyCourse FE` finds only `layout.tsx` itself; the only `lang` assertions are in `global-error.test.tsx`. Paths skipped by the proxy matcher fall back to the default locale `vi` via `src/i18n/request.ts`, equal to the previous hard-coded value. Tests: add `src/app/layout.test.tsx` only if rendering `<html>` in jsdom is acceptable (see `global-error.test.tsx` which does exactly that); otherwise cover through e2e: `/en` has `html[lang="en"]`, `/vi` has `html[lang="vi"]`. Recommended: e2e only (see E2).

### E0 — `scripts/e2e-lifecycle.mjs` — MODIFY (D15)

CURRENT (lines 99-102):

```js
    const serverEnv = {
      NEXT_PUBLIC_API_URL: FIXTURE_URL,
      PORT: String(APP_PORT),
    };
```

AFTER:

```js
    const serverEnv = {
      NEXT_PUBLIC_API_URL: FIXTURE_URL,
      PORT: String(APP_PORT),
      SITE_URL: "https://e2e.example.test",
    };
```

`buildEnv` stays `{ NEXT_PUBLIC_API_URL: FIXTURE_URL }` (no SITE_URL at build proves the `NEXT_PHASE` guard). `next start` runs with `NODE_ENV=production`, so `https://e2e.example.test` passes the production policy.

### E1 — `e2e/tests/seo.spec.ts` — ADD (D15)

Style source: `e2e/tests/home.spec.ts` (imports `expect, test` from `@playwright/test`, `resetFixtures`, `beforeEach`), `locale-404.spec.ts`. Scenarios (guest, no login):

1. `/en` head: `await page.goto("/en")`; `await expect(page).toHaveTitle("MyCourse - Learn online from industry experts")`; `meta[name="description"]` content equals the en description; `link[rel="canonical"]` href `https://e2e.example.test/en`; `link[rel="alternate"][hreflang="vi"]` -> `https://e2e.example.test/vi`; `hreflang="en"` -> `.../en`; `hreflang="x-default"` -> `https://e2e.example.test/vi`; `meta[property="og:title"|"og:description"|"og:url"|"og:site_name"|"og:type"]` (`og:url` is the canonical, `og:site_name` is `MyCourse`, `og:type` is `website`); `meta[name="robots"]` contains `index, follow`; `html` has `lang="en"`.
2. JSON-LD: `const raw = await page.locator('script[type="application/ld+json"]').first().textContent()`; `JSON.parse(raw)` equals `{ "@context": "https://schema.org", "@type": "Organization", name: "MyCourse", url: "https://e2e.example.test" }`.
3. `/vi` has `html[lang="vi"]` and the Vietnamese title.
4. `/en/home` as a guest: `meta[name="robots"]` content matches `/noindex, nofollow/` and the title is `Home`.
5. `/robots.txt`: `const res = await page.request.get("/robots.txt")`; status 200; body contains `Disallow: /en/admin`, `Disallow: /vi/admin`, `Disallow: /en/home`, `Allow: /en`, and `Sitemap: https://e2e.example.test/sitemap.xml`.
6. `/sitemap.xml`: status 200, content-type contains `xml`; body contains `<loc>https://e2e.example.test/vi</loc>` and `hreflang="x-default"` with `https://e2e.example.test/vi` (default locale is `vi`, format is `xhtml:link` alternates per Next docs).

### E3 — `e2e/tests/signed-in-redirect.spec.ts` — ADD (D15)

Uses `loginAsHomeLearner` and `resetFixtures`. Cookie fact: login goes through the Next Server Action `loginAction`, which calls `setAuthSessionCookies`; that sets **all three** (`access_token`, `refresh_token`, `session_id`) as HttpOnly cookies in the browser context (the fixture login response carries `refresh_token=fixture; Max-Age=1209600` in `set-cookie`, `server.mjs:501,544`, giving a resolvable lifetime; `auth.spec.ts:79` already reads `session_id` from `page.context().cookies()`). So `hasAuthSessionCookies` is true after the fixture login. Add `test.use({ locale: "en-US" })` so `/` negotiates `/en`.

Scenarios: (1) after `loginAsHomeLearner(page)`, `page.goto("/en")` ends at `/\/en\/home$/` and the signed-in hero heading is visible; (2) `page.goto("/en/")` (trailing slash) and `page.goto("/")` end at `/\/en\/home$/`; (3) `page.goto("/vi")` ends at `/\/vi\/home$/`; (4) a signed-in learner at `/en/become-instructor` is NOT redirected; (5) guest `/en` stays on `/en` (no `/home`); (6) after logout (header user menu, the e2e flow used in `auth.spec.ts`), clicking the brand link shows the guest home, not the sign-in prompt of `/home` (stale router cache check, finding 8); (7) login from a page with no `next` target lands on `/en/home` (covers `defaultPostAuthHref` end to end; reuse `loginAs` from a guest page that opens the login popup without a `next`, e.g. `/en` header Login button, then expect `/\/en\/home$/`).

## 4. No-change consumers (verified by grep, not edited)

`logout-content.tsx:38`, `header/brand-logo-link.tsx`, `header.tsx`, `header-dashboard` (`navigateToHome`), `dashboard-layout.tsx`, `not-found-page`, `status-error-page`, `src/app/global-error.tsx` and its test (own `<html lang>`), `src/lib/navigation/home.ts` (`homeHref`, `signedInHomeHref` re-exports; `defaultPostAuthHref` is NOT added there because no site imports from it), `src/lib/seo/index.ts` (edited only for the removed `listPrivatePathPrefixes` and the two added exports), `src/lib/seo/indexable-routes.ts`, `robots-presets.ts` and its test, `src/constants/seo/index.ts` (`export * from "./routes"` still valid), `src/constants/seo/metadata.ts`, `src/api/auth/auth-refresh.ts` (DTO keys), `src/actions/auth/x-oauth.ts` / `discord-oauth.ts`, `src/i18n/*`, `src/lib/seo/ranking/*`, `src/lib/seo/json-ld.tsx` (comment only), `next.config.ts`, `Dockerfile`, `docker/*.yml`, `ecosystem.config.cjs`, `deploy/nginx`, `.github/workflows/*`, `package.json`, and all lint/test/format/build configs.

## 5. Existing tests that must be updated or re-run

| Test | Action | Why |
|---|---|---|
| `src/app/[locale]/(web)/home/page.test.tsx` | UPDATE: add `generateMetadata` cases (H2) | page gains `generateMetadata` |
| `src/lib/navigation/routes.test.ts` | UPDATE: add `defaultPostAuthHref` assertions | new export (R1) |
| `src/components/common/auth-menu/auth/login-content.test.tsx`, `login-signup-popup.test.tsx` | RE-RUN, no edit needed | imports changed; no destination assertions exist |
| `src/app/global-error.test.tsx` | RE-RUN | unaffected (own `<html>`) but touches `lang` |
| `src/api/auth/*.test.ts`, `src/api/transport/*.test.ts`, `src/app/api/auth/**/*.test.ts` (node project) | RE-RUN | cookie-name constants migration |
| `src/lib/seo/robots-presets.test.ts` | RE-RUN | `indexable-routes` untouched |
| `e2e/tests/*.spec.ts` | RE-RUN all | `/en` redirect for signed-in users, layout `lang`, post-auth destination |

Symbol-to-test grep (changed symbols vs `*.test.ts(x)` and `e2e/`): `homeHref` appears in no test; `parseAbsoluteHttpsOrigin`, `resolveSiteConfig`, `buildSitemapEntries`, `buildPageMetadata`, `listPrivatePathPrefixes`, `SIGNED_IN_HOME_PATH`, `AUTH_SESSION_EXPIRES_AT_COOKIE`, `AUTH_COOKIE_NAMES` appear in no test or e2e file; `session_id` literal appears only at `e2e/tests/auth.spec.ts:79`; `MyCourse FE` appears nowhere in tests.

## 6. New test files (placement verified against `jest.config.ts` `testMatch`)

| File | Project | Scenarios |
|---|---|---|
| `src/lib/seo/site-config.test.ts` | jsdom (`src/lib/**`) | production vs non-production matrix, one-arg parser unchanged, alias identity, `readEnv`, error messages |
| `src/lib/seo/canonical.test.ts` | jsdom | `localizedPathname`, `buildCanonicalUrl`, `buildLanguageAlternates` (x-default, `locales` override) |
| `src/lib/seo/build-page-metadata.test.ts` | jsdom | canonical, languages incl. `x-default`, robots, OG/Twitter, truncation, `canonicalPath`, `metadataBase` |
| `src/lib/seo/sitemap-builder.test.ts` | jsdom | default entry `/vi`, alternates, priority, custom pathnames/locales |
| `src/lib/seo/robots-txt.test.ts` | jsdom | allow/disallow localized, sitemap URL, locales override, invalid site throws |
| `src/lib/navigation/signed-in-home-redirect.test.ts` | jsdom | locale-root matrix `/`, `/vi`, `/vi/`, `/en`, `/en/`, `/fr`, `/vi/home`, `/vi/login`, with and without session; cookie presence matrix |
| `src/proxy.test.tsx` | jsdom or `@jest-environment node` docblock | redirect 307 + `Location`, `Cache-Control`, `Vary`, Set-Cookie carried; guest `Vary`; non-root untouched; existing `Vary` preserved; matcher literal |
| `src/instrumentation.test.tsx` | node docblock | throws only for nodejs + production + not build phase + bad SITE_URL |
| `src/app/robots.test.tsx`, `src/app/sitemap.test.tsx` | jsdom/node docblock | env-driven output, `dynamic`, throws without env in production |
| `src/app/[locale]/(web)/page.test.tsx` | jsdom | `generateMetadata` for `en`, `vi`, invalid locale; JSON-LD script |
| `src/hooks/auth/use-oauth-post-auth.test.ts`, `use-redirect-if-authenticated.test.ts` | jsdom (`src/hooks/**`) | default destination `/home`, `next` honored, guest no-op |
| `src/components/common/auth-menu/auth/confirm-email-content.test.tsx` | jsdom | `router.replace` to `/home` on success |
| `e2e/tests/seo.spec.ts`, `e2e/tests/signed-in-redirect.spec.ts` | Playwright | see E1, E3 |

Test-code duplication note: jscpd scans `src` including tests (threshold 10 percent, blocks of >= 10 lines and 100 tokens); share setup in `beforeEach` helpers inside each file and avoid copy-pasted env save/restore blocks across the three env-driven tests (extract a tiny helper in `src/test-support/` only if jscpd reports it; do not pre-create).

## 7. Repo rules to respect (read from the configs)

- **ESLint (`eslint.config.mjs`)**: `max-lines` 700 (skip blanks/comments), `noInlineConfig: true` (no `eslint-disable`); `src/messages/en.ts`, `vi.ts` and `src/components/ui/**` are ignored.
- **`src/constants/**/*.ts`**: no functions, arrow functions, methods, type aliases, interfaces, or type exports; `.tsx` forbidden. `auth-cookie.ts` is plain `export const` strings and one `as const` array.
- **`src/types/**/*.ts`**: type-only; no `const`/`function`/classes/enums; only `import type` (or value imports from `@/constants`); only `export type`. The new types (`ParseSiteOriginOptions`, `SiteOriginLoopbackPolicy`, `LanguageAlternatesInput`, `BuildRobotsTxtRulesInput`, `nodeEnv` field) comply.
- **`src/screen/**`**: only `page.tsx` / `*-page.tsx` and `index.ts`; this change adds nothing there.
- **Biome (`npm run lint:biome`)**: double quotes, semicolons, organized imports (packages before `@/` aliases; `next/...` before `next-intl/...`), no unused imports; do not touch `biome-ignore` in `json-ld.tsx`.
- **Knip (`knip.json`)**: `include: types, nsTypes, files`; `exports` are excluded, so new/removed exports are not reported; `ignoreIssues` hides unused `files` for `src/lib|constants|app|hooks|types|...` but `src/instrumentation.ts` and `src/proxy.ts` are covered by the Next plugin (`{instrumentation,proxy}` at root and `src/`), and `src/app/{robots,sitemap}.ts` by its `app/**` patterns. A new unused file under `src/components` or `src/screen` would fail; this change adds none there.
- **jscpd (`.jscpd.json`)**: `threshold: 10` (percent), `minLines: 10`, `minTokens: 100`, scans `src`, ignores `src/components/ui/**`; the new `buildLanguageAlternates` removes an existing duplicated loop; `robots.ts` and `sitemap.ts` are 3-line wrappers.
- **Madge**: `npm run cycles` over `src` with `tsconfig`; see finding 12 (no new cycles).
- **Jest**: `testMatch` limits (finding 1); `JEST_PROJECT=node` only for `src/api/auth|transport` and `src/app/api/auth`; `npm test` runs node then jsdom (`--forceExit`).
- **`package.json` scripts**: `npm run check-all` = lint, biome, test, deadcode (knip), cycles + dupl, build. Frontend gate: `npm run check-all`; do not edit scripts or configs. E2E: `npm run test:e2e` (`scripts/e2e-lifecycle.mjs`, build + `next start` + Playwright).
- **Tooling rule protection**: no config edits are needed anywhere in this plan. Two points would force a conversation if they failed: (a) if Biome rejects `async register()` without `await`, drop `async` (the Next docs allow sync); (b) if jsdom cannot host `NextRequest`, use the per-file `@jest-environment node` docblock instead of touching `jest.config.ts`.
- **Do not change**: `Dockerfile`, `docker/*.yml`, `ecosystem.config.cjs`, `deploy/nginx`, `next.config.ts`, `.github/workflows/*`, `package.json` scripts, eslint/knip/jscpd/biome/tsconfig/jest configs.

## 8. Open risks to confirm with the owner before implementing

1. Deploy: production and every `docker/*.yml` (all `NODE_ENV=production`) require a non-loopback https `SITE_URL` in their `env_file`, or the server will not start (D1 + D2 by design). Local docker needs a real https origin.
2. `NEXT_PHASE` is an undocumented internal; the e2e build (no SITE_URL) is the regression guard.
3. Redirect target built with `new URL(redirectPath, request.url)` per D5; `request.nextUrl.clone()` is the more robust alternative (finding 6).
4. Signed-in redirect uses cookie presence, not validity (finding 7).
5. `Allow: /vi` / `/en` are prefix rules (harmless today; see SEO1).
6. Product copy in M1 needs owner review.

## 9. Deviations found while implementing (the code in the repository is authoritative)

1. **`register()` exits the process.** On Next 16.2.1 a throwing `register()` leaves `next start` running and answering every request with HTTP 500 ("Failed to prepare server"). `src/instrumentation.ts` therefore catches the `SiteConfigError`, logs its message with `console.error` and calls `process.exit(1)`. Verified: a start without `SITE_URL`, and a start with `SITE_URL=http://localhost:3000`, both exit with code 1 and print the message. The unit tests spy on `process.exit` and `console.error` instead of expecting a rejected promise.
2. **No `Vary: Cookie` on the guest page.** The proxy only adds it to the redirect. A `Vary` set on the guest response by the proxy is overwritten by Next's own `Vary` header at render time (verified with `curl -D -`), and the dynamic page already answers `Cache-Control: private, no-cache, no-store`. Consequently `appendVary` and `isLocaleRootPathname` were not added to the code (sections X1 and X2 above show them; they do not exist in the final code).
3. **Jest placement.** The `@jest-environment node` docblock fails in this repository (MSW setup reads `localStorage`), so `src/proxy.test.tsx`, `src/instrumentation.test.tsx`, `src/app/robots.test.tsx` and `src/app/sitemap.test.tsx` run in the jsdom project without a docblock.
4. **No `generateMetadata` unit tests.** `jest.mock` is not hoisted in this setup and `next-intl/server` cannot run in jsdom, so `generateMetadata` of `/` and `/home` is covered by `e2e/tests/seo.spec.ts` (title, description, canonical, hreflang, Open Graph, robots, JSON-LD) and the page tests assert the JSON-LD element data and the message lengths. `confirm-email-content` has no unit test for the same reason (`confirmAction` cannot be stubbed without `jest.mock`); its change is the shared constant and is exercised by the type check and the login redirect e2e.
5. **Barrel.** `src/constants/index.ts` re-exports siblings, so `export * from "./auth-cookie"` was added there too.
6. **`.env.local.example` and `.env.example`** ship `SITE_URL=http://localhost:3000` as an active line (valid only under `next dev`); the other three examples ship an `https` placeholder.

## 10. Follow-up: guest `/home` redirect and stale login popup

- `src/lib/navigation/signed-in-home-redirect.ts`: ADD `resolveGuestHomeRedirectPath({ pathname, hasSession })` (and a private `getSignedInHomeLocale`) reusing `getLocaleRootLocale` and `signedInHomeHref`; no new cookie or locale parsing.
- `src/proxy.ts`: the redirect branch now uses `resolveSignedInHomeRedirectPath(...) ?? resolveGuestHomeRedirectPath(...)`; headers and Set-Cookie copy are unchanged and shared.
- `src/app/[locale]/@modal/page.tsx` (ADD) and `src/app/[locale]/@modal/[...catchAll]/page.tsx` (ADD, re-exports the first): render `null` to clear the slot on soft navigation.
- Tests: `signed-in-home-redirect.test.ts`, `proxy.test.tsx`; e2e `home.spec.ts`, `seo.spec.ts`, `signed-in-redirect.spec.ts`.
- `src/lib/navigation/routes.ts`: ADD `resolvePostAuthHref(nextPath)`; `login-content.tsx`, `use-oauth-post-auth.ts`, `use-redirect-if-authenticated.ts` call it instead of `nextPath ?? defaultPostAuthHref`; tests in `routes.test.ts` and `use-oauth-post-auth.test.tsx`.
- Root cause of the popup: the post-login push to `/home` (previously `/`) left the intercepted `@modal/(.)login` slot mounted; reproduced with `user09@yopmail.com`, fixed and re-verified with `user09` and `user10`.
