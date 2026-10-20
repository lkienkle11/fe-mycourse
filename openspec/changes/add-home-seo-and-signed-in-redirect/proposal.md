## Why

The public homepage `/` (really `/{locale}`, locales `vi` and `en`) is the only page meant to rank on search engines, yet it ships with the placeholder metadata of the root layout (`"MyCourse FE"` / `"Next.js 16 starter with i18n and app stack"`), no canonical, no hreflang, no Open Graph, no structured data, and the site has no `robots.txt` or `sitemap.xml`. The complete SEO toolkit already exists under `src/lib/seo/**` but no page, route or layout consumes it, and the server-only site origin it depends on (`SITE_URL`) is not configured anywhere.

At the same time the signed-in homepage `/{locale}/home` has no metadata of its own, so it silently inherits that placeholder and carries no `noindex`, and a signed-in user who opens `/` is shown the marketing page instead of their home.

## What Changes

- **Public homepage SEO (`/{locale}`)**: `generateMetadata` built on the existing `buildPageMetadata` (localised title and description, canonical, `hreflang` vi + en + `x-default`, Open Graph, Twitter, robots indexable) and an `Organization` JSON-LD block. `buildPageMetadata` is extended to emit `x-default`. No social image is emitted because no real image asset exists.
- **Crawl discovery**: new `src/app/robots.ts` and `src/app/sitemap.ts` (served at `/robots.txt` and `/sitemap.xml`, rendered at request time) built on the existing crawl-policy and sitemap builders; robots disallows every private route prefix for every locale and advertises the sitemap.
- **Signed-in homepage (`/{locale}/home`)**: explicit `generateMetadata` with its own title and `noindex, nofollow` (the existing `privateApp` preset). It never had page metadata to remove; the placeholder it inherited is replaced at the root.
- **Signed-in redirect**: `src/proxy.ts` wraps the next-intl middleware and answers a `307` from `/{locale}` to `/{locale}/home` when both auth session cookies (`refresh_token`, `session_id`) are present, with `Cache-Control: private, no-store` and `Vary: Cookie`. Crawlers send no cookies, so `/` is always the public page for them. `/` itself keeps redirecting to `/{locale}` first (two hops).
- **Post-auth destination**: the default destination after login, OAuth, signup-confirmation and "already signed in" becomes the signed-in home (`signedInHomeHref`) instead of `/`. Logout, brand-logo links and "back to home" links keep `homeHref`.
- **Site origin contract**: `SITE_URL` becomes a documented, runtime-only, server-only variable. `resolveSiteConfig` keeps requiring a pure `https` origin in production, rejects loopback hosts in production, and accepts `http://localhost[:port]` / `http://127.0.0.1[:port]` outside production. A new `src/instrumentation.ts` validates it when the production server starts so a missing or invalid value stops the server instead of returning 500 on the homepage. Nothing reads it at build time, so CI builds and the Docker image build are unchanged.
- **Root layout**: the placeholder description is removed (title is the site name) and `<html lang>` follows the active locale instead of the hard-coded `vi`.
- **Shared auth cookie names**: the auth cookie names (`access_token`, `refresh_token`, `session_id`, `auth_session_expires_at`, legacy max-age cookie) get a single source, `src/constants/auth-cookie.ts`, replacing string literals in five modules so the proxy can reuse them without importing `server-only` code.
- **Duplicate cleanup**: delete the unused `listPrivatePathPrefixes` (superseded by `privateCrawlDisallowPaths`) and `SIGNED_IN_HOME_PATH` (duplicate of `PRIVATE_ROUTES.home`); `src/app/page.tsx` uses `routing.defaultLocale` instead of the literal `"vi"`.
- **Configuration and docs**: `SITE_URL` added to the five `.env*.example` files, the e2e server environment and `docs/deploy.md`; every affected document is rewritten to the final state (see `docs-update-inventory.md`). No change to Dockerfile, compose/stack files, PM2 ecosystem, nginx or GitHub workflows.
- **BREAKING (behavioural)**: a visitor with both session cookies who opens `/` or `/{locale}` now lands on `/{locale}/home`. Anyone relying on a signed-in user seeing the marketing page must use the guest view (signed out) instead.

## Capabilities

### New Capabilities
- `public-home-seo`: search-engine metadata, structured data and document language of the public homepage `/{locale}`, including the root-layout defaults it inherits.
- `crawl-discovery`: the `robots.txt` and `sitemap.xml` endpoints and the paths they allow, disallow and list.
- `signed-in-home-entry`: how a signed-in user reaches `/{locale}/home` (proxy redirect, post-auth default destination) and the non-indexable metadata of that page.
- `site-origin-config`: the `SITE_URL` contract (accepted values per environment, startup validation, runtime-only scope).

### Modified Capabilities
<!-- None: no existing spec under openspec/specs/ describes these behaviours. auth-route-modal's "default post-login destination" wording stays true because it does not name a path. -->

## Impact

- **Routing/proxy**: `src/proxy.ts` (wrapper around the existing next-intl middleware; matcher unchanged), new `src/lib/navigation/signed-in-home-redirect.ts`, new `src/constants/auth-cookie.ts`.
- **Pages/layout**: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/[locale]/(web)/page.tsx`, `src/app/[locale]/(web)/home/page.tsx`; new `src/app/robots.ts`, `src/app/sitemap.ts`, `src/instrumentation.ts`.
- **SEO library**: `src/lib/seo/site-config.ts`, `build-page-metadata.ts`, `sitemap-builder.ts`, `index.ts`, new `robots-txt.ts`; `src/types/seo/metadata.ts`; `src/constants/seo/routes.ts`; `src/lib/security/web/crawl-policy.ts`.
- **Auth modules (cookie-name literals only)**: `src/api/auth/server-auth.ts`, `src/lib/utils/auth-session.ts`, `src/lib/utils/cookie.ts`, `src/app/api/auth/refresh/route.ts`, `src/actions/auth/auth.ts`.
- **Post-auth defaults**: `login-content.tsx`, `use-oauth-post-auth.ts`, `use-redirect-if-authenticated.ts`, `login-signup-popup.tsx`, `confirm-email-content.tsx`.
- **i18n**: `src/messages/en.ts`, `src/messages/vi.ts` (three new keys).
- **Config/tests/docs**: five `.env*.example` files, `scripts/e2e-lifecycle.mjs`, new Jest tests and e2e specs, about twenty documents under `docs/` plus `README.md`.
- **Backend / database**: none. The change needs no API, contract, DTO, permission or schema change.
- **Operations (manual, outside the repo)**: set `SITE_URL` in the server env file of every environment (dev, staging, production), each with its own real origin; confirm Cloudflare or any CDN does not cache `/`, `/vi`, `/en`.
