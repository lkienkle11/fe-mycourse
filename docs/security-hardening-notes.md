# Security hardening notes (FE)

_Last audited: 2026-07-25 (unused helpers under `src/lib/security/web/**`)._

FE companions for crawl policy, client payload redaction, JSON-LD sanitization, and draft security headers. Backend public-SEO intent (take-note only, no BE code this phase): [`../../be-mycourse/docs/security-public-seo-notes.md`](../../be-mycourse/docs/security-public-seo-notes.md). SEO foundation SoT: [`seo-ranking-setup.md`](./seo-ranking-setup.md).

## Status

Helpers are **unused** by pages/layouts. They do **not** replace authentication or authorization. `noindex` / robots disallow lists are a crawl hint, not an access control.

## Helpers

| Module | Path | Behavior |
| --- | --- | --- |
| Crawl policy | `src/lib/security/web/crawl-policy.ts` | Builds disallow path lists by **deriving** `PRIVATE_ROUTES` / `PRIVATE_RESOURCE_ROUTES` via shared `flattenRouteTreePaths`. Public crawl-allow aligns with **SEO-indexable** `PUBLIC_ROUTES` keys (not every public-routable path). Do not hard-code a second private path list. |
| Client redact | `src/lib/security/web/redact-client-payload.ts` | Allow-list / DTO projection for props that may reach the client. Mirrors the allow-list discipline of `redactApiErrorUrl` / `sanitizeApiErrorCause` in `src/api/core/fetch-error.ts` — never blind key-name deletion. |
| JSON-LD sanitize | `src/lib/security/web/sanitize-json-ld.ts` | Sanitize graph objects before serialize; used with `JsonLd` (`src/lib/seo/json-ld.tsx`) which also escapes `<` → `\u003c`. |
| Header presets | `src/lib/security/web/security-headers-presets.ts` | Draft map aligned with nginx headers already documented in [`deploy.md`](./deploy.md) (`X-Frame-Options SAMEORIGIN`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`). CSP draft is **inactive** until Google One Tap, OAuth popup, media/embed, reverse proxy, and report endpoint are reviewed. |

## Rules

- HSTS belongs on the HTTPS / reverse-proxy layer (see deploy docs), not as a substitute for app auth.
- `X-Frame-Options` does not replace CSP `frame-ancestors`.
- Do not put personalized `/home` data, tokens, PII, or private enrollment into public HTML, OG, JSON-LD, or public fetch cache.
- Logging of SEO fetch failures should reuse `redactApiErrorUrl` / `sanitizeApiErrorCause` where URLs or causes are involved.

## Related deploy take-note

Planned FE origin `SITE_URL` (server-side) for canonical/metadata — documented in [`deploy.md`](./deploy.md). This phase does **not** change `.env`, `.env.example`, nginx, or PM2.
