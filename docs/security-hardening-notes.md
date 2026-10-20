# Security hardening notes (FE)

_Last audited: 2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL). Prior: 2026-07-25 (unused helpers under `src/lib/security/web/**`)._

FE companions for crawl policy, client payload redaction, JSON-LD sanitization, and draft security headers. Backend public-SEO intent (take-note only, no BE code): [`../../be-mycourse/docs/security-public-seo-notes.md`](../../be-mycourse/docs/security-public-seo-notes.md). SEO foundation SoT: [`seo-ranking-setup.md`](./seo-ranking-setup.md).

## Status

The helpers do **not** replace authentication or authorization. `noindex` / robots disallow lists are a crawl hint, not an access control; the signed-in and guest redirects between `/{locale}` and `/{locale}/home` in `src/proxy.ts` only check that the `refresh_token` and `session_id` cookies are present and is a navigation convenience, not an auth gate. **Used:** `crawl-policy.ts` (`privateCrawlDisallowPaths`, `publicCrawlAllowPaths` by `buildRobotsTxtRules` / `src/app/robots.ts`; `signedInHomeRobotsMode` by the `/home` metadata), `JsonLd` with `sanitize-json-ld.ts` for the guest home Organization JSON-LD, and `safe-redirect.ts` via `useAuthNextParam` (`src/hooks/auth/use-auth-next-param.ts`), which is used by `LoginContent`, `SignupContent`, and `useOAuthPostAuth` for the route-based login/signup modal and pages. **Still unused by pages/layouts:** `redact-client-payload.ts` and `security-headers-presets.ts`.

## Helpers

| Module | Path | Behavior |
| --- | --- | --- |
| Crawl policy | `src/lib/security/web/crawl-policy.ts` | `privateCrawlDisallowPaths` builds disallow path lists by **deriving** `PRIVATE_ROUTES` / `PRIVATE_RESOURCE_ROUTES` via shared `flattenRouteTreePaths`; `publicCrawlAllowPaths` aligns with **SEO-indexable** `PUBLIC_ROUTES` keys (not every public-routable path); `signedInHomeRobotsMode` returns `privateApp` for `/home`. Consumed by `buildRobotsTxtRules` (`src/lib/seo/robots-txt.ts`) and `src/app/robots.ts`. Do not hard-code a second private path list or `/home` constant. |
| Client redact | `src/lib/security/web/redact-client-payload.ts` | Allow-list / DTO projection for props that may reach the client. Mirrors the allow-list discipline of `redactApiErrorUrl` / `sanitizeApiErrorCause` in `src/api/core/fetch-error.ts` — never blind key-name deletion. |
| JSON-LD sanitize | `src/lib/security/web/sanitize-json-ld.ts` | Sanitize graph objects before serialize; used with `JsonLd` (`src/lib/seo/json-ld.tsx`) which also escapes `<` → `\u003c`; `JsonLd` is rendered by the guest home Organization JSON-LD. |
| Header presets | `src/lib/security/web/security-headers-presets.ts` | Draft map aligned with nginx headers already documented in [`deploy.md`](./deploy.md) (`X-Frame-Options SAMEORIGIN`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`). CSP draft is **inactive** until Google One Tap, OAuth popup, media/embed, reverse proxy, and report endpoint are reviewed. |
| Safe redirect (open-redirect guard) | `src/lib/security/web/safe-redirect.ts` | `isSafeInternalPath` validates that a post-login/signup return path (`next` query param on `/login`/`/signup`) is a same-origin relative internal path before it is ever used for navigation — rejects absolute URLs (`scheme://`), protocol-relative paths (`//...`), and backslash-prefixed paths. `isAuthRoutePath` additionally rejects a `next` that is itself `/login`/`/signup` (self-reference, otherwise propagates through every login/signup cross-link). Both used by `useAuthNextParam` (`src/hooks/auth/use-auth-next-param.ts`); `isAuthRoutePath` also by `AuthButton` and `useAuthModalBackgroundBridge`. |
| Signed-in home redirect | `src/proxy.ts`, `src/lib/navigation/signed-in-home-redirect.ts` | `resolveSignedInHomeRedirectPath` / `hasAuthSessionCookies`: a locale-root request with both `refresh_token` and `session_id` cookies (presence only) gets `307` to `/{locale}/home` with `Cache-Control: private, no-store` and `Vary: Cookie` on that redirect. Cookie names come from `src/constants/auth-cookie.ts`, which replaces the string literals in the server auth, cookie, session and refresh-route code. Not an authentication check: the destination page still gates on the real session. |

## Rules

- HSTS belongs on the HTTPS / reverse-proxy layer (see deploy docs), not as a substitute for app auth.
- `X-Frame-Options` does not replace CSP `frame-ancestors`.
- Do not put personalized `/home` data, tokens, PII, or private enrollment into public HTML, OG, JSON-LD, or public fetch cache. Never cache a locale-root response at a CDN or reverse proxy: the signed-in redirect depends on the `Cookie` header (`Vary: Cookie`, `Cache-Control: private, no-store` on the redirect).
- Logging of SEO fetch failures should reuse `redactApiErrorUrl` / `sanitizeApiErrorCause` where URLs or causes are involved.

## Related deploy take-note

The FE origin `SITE_URL` is a server-only runtime variable (never `NEXT_PUBLIC_`, never a build arg or GitHub secret) used for canonical, sitemap and robots output and validated at server start by `src/instrumentation.ts` (a missing or invalid value stops the process) — documented in [`deploy.md`](./deploy.md). Nginx, PM2, Docker and the workflows are unchanged.
