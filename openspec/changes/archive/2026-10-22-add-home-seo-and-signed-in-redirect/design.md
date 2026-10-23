## Context

See `proposal.md` for motivation. Companion documents: `code-change-inventory.md` (exact CURRENT and AFTER code per file, call sites, tests) and `docs-update-inventory.md` (CURRENT and REPLACEMENT text per document). This file records the decisions, the capability audit, the risks and the manual steps.

**Method (AGENTS.md order: GitNexus, then the existing docs, then the code).** (1) GitNexus was used through the MCP index for callers (`homeHref`, `signedInHomeHref`, `buildPageMetadata`, `resolveSiteConfig`); the index does not cover constants or documents, so it is not the authority for the lists below. (2) Every file in `docs/`, `README.md`, `openspec/specs/**`, `AGENTS.md`, `CLAUDE.md` was grepped for the topics (home route, SEO, robots, sitemap, metadata, `SITE_URL`, proxy, redirect, post-login, cookies). (3) The code was read in full: `src/proxy.ts`, `src/i18n/*`, `src/lib/seo/*`, `src/lib/security/web/crawl-policy.ts`, `src/constants/seo/*`, `src/types/seo/*`, the `app` layouts and pages, the auth modules, the post-auth components, the messages, `scripts/e2e-lifecycle.mjs`, the CI, Docker, PM2 and nginx files. Skills read: `.ai/skills/nextjs-seo-optimization` and `.ai/skills/nextjs-optimization` (apply); `.ai/skills/logic-n-1-optimize` (not applicable); `.claude/skills/openspec-*` (workflow); `.claude/skills/gitnexus` (graph tooling).

**Verified facts that shape the design**

| Fact | Evidence |
|---|---|
| Every route is dynamic (`ƒ`), including `/[locale]` and `/[locale]/home`; nothing is prerendered. | `npm run build` route table (no `○`/`●` row); no `generateStaticParams`; next-intl reads request headers. |
| `/` is redirected by next-intl to `/{locale}` with 307; the target depends on `NEXT_LOCALE` cookie, then `Accept-Language`, then `vi`. | `next start` + curl: none → `/vi`, `Accept-Language: en` → `/en`, `fr` → `/vi`, cookie `en` beats header `vi`. |
| `src/proxy.ts` is only `createMiddleware(routing)`; its matcher excludes any path containing a dot, so `/robots.txt` and `/sitemap.xml` never reach it. | `src/proxy.ts`; Next 16 `proxy.md`. |
| Auth tokens are HttpOnly cookies (`access_token`, `refresh_token`, `session_id`); client code cannot read them, middleware can. | `docs/architecture.md:326`; `src/lib/utils/auth-session.ts`. |
| `access_token` is short lived; `refresh_token` and `session_id` carry the session lifetime. | `setAuthSessionCookies` (`maxAge` only on the latter two). |
| `buildPageMetadata` throws `SiteConfigError` when `SITE_URL` is missing; `SITE_URL` appears in no env file, workflow or Docker file. | `src/lib/seo/site-config.ts:59`; grep over `.env*`, `.github`, `docker`, `Dockerfile`. |
| `robots.ts` / `sitemap.ts` are cached (prerendered at build) unless they use a request API or `dynamic`. | Next 16 `robots.md`, `sitemap.md`. |
| `/home` ships with no metadata; the only `generateMetadata` for the home pair is absent. | `src/app/[locale]/(web)/home/page.tsx`; `openspec/changes/add-signed-in-home-page/design.md` section E (a documented product decision this change deliberately supersedes). |
| No robots.txt or sitemap exists in `public/` or nginx. | `public/` listing; `deploy/nginx/nginx.conf`. |
| nginx has no `proxy_cache` (`location /` sets `proxy_cache off`); only `/_next/static` carries a cache header. | `deploy/nginx/nginx.conf:12-30`. |

## Goals / Non-Goals

**Goals:**
- `/{locale}` is a correctly described, canonical, localised, crawlable page; `/robots.txt` and `/sitemap.xml` exist and are correct.
- `/{locale}/home` is explicitly non-indexable and has its own title.
- A signed-in user never sees the marketing page; a crawler always does.
- No duplicated implementation: the SEO toolkit already in the repo is consumed, not re-created; every duplicate found on the touched capabilities is merged.
- CI build, Docker image build and PM2/Docker runtime keep working with the smallest possible operational change (one runtime env var).

**Non-Goals:**
- Social share image, `WebSite` + `SearchAction` JSON-LD, course `ItemList` JSON-LD (the guest home is mock data; no search page exists).
- Server-side verification of the session in the proxy (cookie presence only; no backend call).
- Making `/` a single hop (it stays `/` → `/{locale}` → `/{locale}/home`).
- Changing the locale negotiation, the matcher, or adding `middleware.ts`.
- Backend, database, API contract, nginx, Dockerfile, compose, PM2, GitHub workflow changes.
- Fixing the `homeHref` import-path inconsistency (`@/lib/navigation/routes` vs `@/lib/navigation/home`) or other pages' metadata (login/signup/confirm-email/logout keep their `generateMetadata` as is).

## Decisions

### D1 — `SITE_URL` is runtime-only; validate at server start, not at build

Decision: keep `SITE_URL` a plain server env var read lazily by `resolveSiteConfig({ readEnv: true })`; add `src/instrumentation.ts` with `register()` that, only when `NEXT_RUNTIME === "nodejs"`, `NODE_ENV === "production"` and `NEXT_PHASE !== "phase-production-build"`, calls `resolveSiteConfig({ readEnv: true })`; on failure it logs the `SiteConfigError` message and calls `process.exit(1)` so a missing/invalid value stops the server (PM2 process or container). Verified on Next 16.2.1: a `register()` that merely throws leaves `next start` running and answering every request with HTTP 500 ("Failed to prepare server"), so the explicit exit is required for the process to actually stop.

Why: the verified build shows every route is dynamic, so metadata is never evaluated at build; a "fail at build" gate would have required forcing `SITE_URL` into CI, the Docker image and the e2e build for no benefit. Startup validation gives the same fail-fast behaviour where the value is actually supplied (the server env file).

Alternatives: (a) fail only per request → homepage 500 for real users and an unnoticed misconfiguration; (b) silent fallback without canonical → SEO quietly wrong; (c) `NEXT_PUBLIC_SITE_URL` → baked at build, one image could not serve several environments, and exposes config to the client (rejected by the existing `site-config.ts` contract).

Consequences: `robots.ts` and `sitemap.ts` set `export const dynamic = "force-dynamic"` so they do not read the variable at build. `npm run build` must pass with `SITE_URL` unset (verified by a task). Staging and dev servers also run with `NODE_ENV=production`, so each needs its own valid value.

### D2 — Accepted origins: strict in production, localhost allowed elsewhere

Decision: `resolveSiteConfig` accepts, when `NODE_ENV !== "production"`, `http://localhost[:port]` and `http://127.0.0.1[:port]` in addition to pure `https` origins; in production it requires `https` and rejects loopback hosts (`localhost`, `127.0.0.1`, `::1`). The single URL parser (`parseAbsoluteHttpsOrigin`, alias `parseAbsoluteHttpsUrl`) keeps its one-argument behaviour; the loopback allowance is an optional second options argument, so no second parser is written. `ResolveSiteConfigInput` gains an injectable `nodeEnv` for tests.

Why: developers run `next dev` on `http://localhost:3000`; a production host pointing at localhost is always a misconfiguration that would put `localhost` into Google's canonical URLs.

E2E: the Playwright server runs `next start` (`NODE_ENV=production`), so `scripts/e2e-lifecycle.mjs` gives it the fake but valid origin `https://e2e.example.test` (canonical text only; no navigation depends on it).

### D3 — Redirect in `src/proxy.ts`, cookie presence only

Decision: wrap the next-intl middleware.

```
request ──▶ intlMiddleware(request)            (locale negotiation, "/" → "/{locale}")
              │
              ├─ path is exactly "/{locale}[/]" AND cookies refresh_token + session_id
              │      └▶ 307 "/{locale}/home"   Cache-Control: private, no-store
              │                                Vary: Cookie   (+ next-intl Set-Cookie copied)
              └─ otherwise → intl response untouched (guest page: Next's own
                             Cache-Control: private, no-cache, no-store)
```

Why this and not the alternatives: reading `cookies()` in the page makes `/` depend on a request API per page and spreads the rule; a client redirect through `useGetMe` flashes the guest page, costs a `/me` call and cannot help crawlers or first paint; the proxy decides before rendering, keeps the page dynamic as it already is and holds the rule in one place. Crawlers never send the cookies, so they always receive the public page (no cloaking: the content difference is by session, not by user agent).

Cookie choice: `refresh_token` and `session_id` carry the long session lifetime, `access_token` expires within minutes and would make a returning user look signed out. Presence is not validity: a stale cookie lands on `/home`, whose existing client gate shows the sign-in prompt and does not redirect back, so no loop is possible.

Headers: the redirect differs per cookie, so it carries `Vary: Cookie` and `Cache-Control: private, no-store`; without this a CDN could serve one user's redirect to everyone. The guest page needs no extra header: Next.js answers dynamic pages with `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` (verified with `curl -D -`), so no shared cache stores it. A `Vary: Cookie` set by the proxy on the guest page was tried and is overwritten by Next's own `Vary` (RSC headers) when the page is rendered, so it was not kept.

Reuse: the "is this path a locale root" test and the redirect target live in one pure module `src/lib/navigation/signed-in-home-redirect.ts` (no `server-only`, no `next/headers`, no `@/i18n/navigation`) so the proxy and its tests share it. `src/app/global-error.tsx:detectLocaleFromPathname` was examined and kept: it is deliberately dependency-free and returns a boundary-copy key, a different output.

### D4 — One source for auth cookie names

Decision: new `src/constants/auth-cookie.ts` (plain constants, as required by the ESLint rule for `src/constants/**`): `ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`, `SESSION_ID_COOKIE`, `AUTH_SESSION_EXPIRES_AT_COOKIE`, `LEGACY_AUTH_SESSION_MAX_AGE_COOKIE`, `AUTH_COOKIE_NAMES`. All string literals in `src/api/auth/server-auth.ts`, `src/lib/utils/auth-session.ts`, `src/lib/utils/cookie.ts`, `src/app/api/auth/refresh/route.ts`, `src/actions/auth/auth.ts` are replaced.

Why: the proxy needs these names but cannot import `server-only` modules (`server-auth.ts`, `auth-session.ts`). Copying the literals into the proxy would create the exact duplicate the project forbids; the existing private `AUTH_COOKIE_NAMES` array in `cookie.ts` and the exported `AUTH_SESSION_EXPIRES_AT_COOKIE` in `auth-session.ts` already show the drift risk. DTO field names such as `access_token` in token payloads are not cookie names and are untouched.

### D5 — `/{locale}` metadata through the existing factory; no invented assets

Decision: `generateMetadata` in `src/app/[locale]/(web)/page.tsx` guards the locale with `hasLocale`, loads `homepage.seo.title` / `homepage.seo.description` with `getTranslations({ locale, namespace })`, and returns `buildPageMetadata({ locale, pathname: homeHref, title, description }, { site: { readEnv: true } })`. The page renders `<JsonLd data={buildOrganizationJsonLd({ name, url })} />` above `<HomePage />`.

`buildPageMetadata` and `buildSitemapEntries` each contain an identical "per-locale canonical map" loop; the sitemap one already adds `x-default`, the metadata one does not. Both are replaced by one helper `buildLanguageAlternates` in `src/lib/seo/canonical.ts` (it owns `buildCanonicalUrl`), which emits `x-default`. This is the merge of an existing duplicate on the capability being modified.

No `og:image`: the factory already emits images only when a real `SeoImage` exists, and `public/` holds only template SVGs. Inventing an image is rejected; a later change can add one without touching this design. JSON-LD is limited to `Organization` (`name`, `url`) because the page content is mock data (`docs/seo-ranking-setup.md` forbids JSON-LD from mock data).

The message copy (title ≤ 60, description ≤ 160 code points, both locales) is product text listed in the inventory for review.

### D6 — `/{locale}/home`: explicit private metadata, nothing public

Decision: `generateMetadata` in `src/app/[locale]/(web)/home/page.tsx` returns `{ title, robots: robotsPreset(signedInHomeRobotsMode()) }` (title key `home.signedIn.pageTitle`), mirroring `login/page.tsx`. It does not call `buildPageMetadata`, so it needs no `SITE_URL`, emits no canonical/OG/hreflang and cannot fail on configuration. `signedInHomeRobotsMode()` already exists in `crawl-policy.ts` and returns the `privateApp` preset; it was unused until now.

This supersedes the earlier "no route metadata for `/home`" decision in `add-signed-in-home-page` (that page only lacked metadata, it inherited the placeholder); its documents are rewritten to the final state, not annotated.

### D7 — `robots.txt` and `sitemap.xml`

Decision: `src/app/robots.ts` and `src/app/sitemap.ts` at the app root (so they are served at `/robots.txt` and `/sitemap.xml`, not under a locale), both `dynamic = "force-dynamic"`.
- Robots rules come from a new pure `buildRobotsTxtRules` in `src/lib/seo/robots-txt.ts`: allow `publicCrawlAllowPaths()` and disallow `privateCrawlDisallowPaths()`, each passed through the existing `localizedPathname` for every locale (private route constants are locale-less while the site uses `localePrefix: "always"`, so an unlocalised `Disallow: /admin` would protect nothing), plus `sitemap` from `toAbsoluteUrl(siteUrl, "/sitemap.xml")`.
- The sitemap is `buildSitemapEntries()` as it exists (its `SitemapEntry` already matches Next's `MetadataRoute.Sitemap` item).
- Disallowing `/{locale}/home` together with `noindex` is intentional and consistent with the existing crawl policy (`privateCrawlDisallowPaths` derives from `PRIVATE_ROUTES`): the page is behind a login and never linked from public pages.

### D8 — Post-auth default destination is one named constant

Decision: add `defaultPostAuthHref = signedInHomeHref` in `src/lib/navigation/routes.ts` and use it where a flow ends with `nextPath ?? homeHref`: `login-content.tsx`, `use-oauth-post-auth.ts`, `use-redirect-if-authenticated.ts`, `login-signup-popup.tsx`, `confirm-email-content.tsx`. Kept on `homeHref`: logout redirect, `Header`, `BrandLogoLink`, `dashboard-layout`, `navigateToHome`, not-found and status-error "back to home", `global-error`, `canonical.ts`.

Why: five places repeated the same policy ("where does a user go after authenticating"); naming it once prevents drift and expresses the business meaning. Even without this change the proxy would bounce `/` to `/home`; sending users there directly saves a hop and avoids a flash.

### D9 — Root layout

Decision: `metadata` becomes `{ title: DEFAULT_SITE_NAME }` (placeholder description removed; no title template, so existing page titles and tests are unchanged) and `RootLayout` becomes `async` with `<html lang={await getLocale()}>`, mirroring `src/app/not-found.tsx`.

Why: the stale description leaked into `/home`, error pages and every page without metadata; a fixed `lang="vi"` on `/en` mislabels the document language for crawlers and screen readers.

### D10 — Duplicate cleanup

| Duplicate | Verdict |
|---|---|
| `listPrivatePathPrefixes` (sitemap-builder, barrel only) vs `privateCrawlDisallowPaths` (crawl-policy) | DELETE the former; robots uses the latter (it also covers `PRIVATE_RESOURCE_ROUTES` and strips `:param`). |
| `SIGNED_IN_HOME_PATH` (`"/home"`) vs `PRIVATE_ROUTES.home` / `signedInHomeHref` | DELETE the constant and its re-export in `crawl-policy.ts` (no consumer). |
| Two per-locale canonical-map loops | MERGE into `buildLanguageAlternates` (D5). |
| Auth cookie literals in 5 modules | MERGE into `auth-cookie.ts` (D4). |
| `nextPath ?? homeHref` in 5 flows | MERGE into `defaultPostAuthHref` (D8). |
| `redirect({ href: "/", locale: "vi" })` in `src/app/page.tsx` | Use `routing.defaultLocale`. |
| `publicCrawlAllowPaths` (sorted unique wrapper of `listSeoIndexablePathnames`) | KEEP: it is the crawl-policy entry point; `listSeoIndexablePathnames` stays for the sitemap builder (different consumer, one is derived from the other, no copied logic). |
| `robots: robotsPreset(robotsModeForPublicRouteKey(...))` repeated in login/signup | KEEP: two lines, unrelated to this change, different semantics (noindex flows). |

### D11 — Operations: what is and is not touched

| Surface | Change |
|---|---|
| `.env.example`, `.env.local.example`, `.env.dev.example`, `.env.staging.example`, `.env.prod.example` | add a commented `SITE_URL` block after the `API_URL` block. |
| `scripts/e2e-lifecycle.mjs` | `serverEnv.SITE_URL = "https://e2e.example.test"`. |
| `docs/deploy.md`, `docs/docker.md`, `README.md` | document the runtime variable, the startup failure, the cache check. |
| Dockerfile, `docker/*.yml`, `scripts/docker/*`, `ecosystem.config.cjs`, `deploy/nginx/*`, `next.config.ts`, `.github/workflows/*` | **no change**: a runtime-only variable arrives through the existing `env_file`; no build step reads it. |
| Cloudflare / CDN | **manual check** (outside the repo): `/`, `/vi`, `/en` must not be cached by a "Cache Everything" rule. |

### D12 — Guests are redirected away from `/{locale}/home` in the proxy
A visitor without both session cookies who requests exactly `/{locale}/home` gets a 307 to `/{locale}` (`resolveGuestHomeRedirectPath`, beside `resolveSignedInHomeRedirectPath`, applied in `src/proxy.ts`; same `Cache-Control: private, no-store` and `Vary: Cookie`). The two rules are mutually exclusive (both cookies versus a missing one), so they cannot loop. A stale cookie pair still counts as a session, so it reaches `/home` and keeps the existing client-side sign-in prompt. A client-side redirect to `/logout` for the stale case was rejected: the `/me` store is briefly `null` right after a login, so a redirect there could log a fresh session out.

### D13 — The `@modal` slot is cleared on every non-intercepted route
The post-login destination changed from `/` to `/home`. Next.js keeps the previous content of a parallel slot that has no match on a soft navigation, so the login popup (re-mounted open after the server redirect `/` to `/home`) appeared over the signed-in home. `src/app/[locale]/@modal/page.tsx` (locale root) and `src/app/[locale]/@modal/[...catchAll]/page.tsx` (everything else) render `null` so the slot is cleared. An optional catch-all `[[...catchAll]]` was rejected: Next refuses it next to the `/[locale]` page ("same specificity as a optional catch-all route").

### D14 — `next` equal to the public homepage is not a return path
The header Login link carries `next=/`. Honouring it sent every login through `/` → `/{locale}` → `/{locale}/home` (two extra server redirects, each re-fetching the page being left). `resolvePostAuthHref` treats `homeHref` as "no return path" and goes straight to `defaultPostAuthHref`; any other safe `next` still wins.

## Risks / Trade-offs

- **Forgotten `SITE_URL` on a server** → the process refuses to start (PM2 restarts, container exits) with a clear message; mitigated by the manual setup list in `tasks.md` group 18, the `.env*.example` blocks and the troubleshooting entry in `docs/deploy.md`. This is deliberate: a silent SEO failure is worse than a loud deploy failure.
- **`http://localhost` only works under `next dev`** → every `next start` (the dev PM2 app that reads `.env.local`, a local Docker container, `npm run start` on a laptop) runs with `NODE_ENV=production` and rejects it. `.env.local.example` and `docs/deploy.md` say so and give an `https` placeholder (`https://local.example.test`) for those cases; the rule is not relaxed because a production-mode server must never publish a loopback canonical.
- **`instrumentation.ts` could run during `next build`** → guarded by `NEXT_PHASE`; a task builds with `SITE_URL` unset and must pass. If Next 16 behaves differently, the guard is the only line to adjust.
- **Cookie presence is not validity** → a user with a revoked session is sent to `/home` and sees the sign-in prompt (one extra click); no loop because `/home` never redirects to `/`.
- **CDN caching a cookie-dependent response** → `Vary: Cookie` and `private, no-store` on the redirect; the Cloudflare rule check is manual because the repo cannot prove it.
- **Disallow + noindex on `/home`** → a disallowed URL cannot have its `noindex` read; accepted because the page is login-gated and not linked from public pages, and the disallow is the existing crawl policy.
- **Two-hop `/` for signed-in users** → acceptable (`/` → `/{locale}` → `/{locale}/home`); a single hop would need a second copy of the locale negotiation.
- **Behaviour change for signed-in users on `/`** (see **BREAKING** in the proposal) → intended; brand-logo links now land on `/home` for them.
- **`generateMetadata` runtime failure if the proxy-time check were skipped** (non-production server without a value) → `SiteConfigError` surfaces as an error page in development, which is the intended prompt to set the variable.
- **Product copy** (title/description in vi and en) is drafted in the inventory and must be reviewed by the product owner before release.
- **ESLint/knip/jscpd** constraints were read from the configs (constants = plain consts; `src/screen` files named `page.tsx`/`*-page.tsx`; `max-lines 700`; jscpd `minLines 10`); no rule is relaxed. If any rule blocks a structure, implementation stops and follows the Tooling rule protection procedure (explain, stash, wait).

## Migration Plan

1. Merge the code. Nothing breaks at build or in CI (no new required env).
2. **Before deploying to each environment**, add `SITE_URL=https://<that environment's own origin>` to the environment's server env file (`.env.local` for dev PM2, `.env.staging`, `.env.prod`, or the file referenced by the container's `env_file`), then restart/reload (`pm2 reload ... --update-env`, `docker compose up -d`). Use the same host (www or apex) as the OAuth callback URLs.
3. Verify (commands recorded in `docs/deploy.md`): `curl -sI https://<origin>/vi` → 200 with `Cache-Control` containing `no-store`; the same with `-H "Cookie: refresh_token=x; session_id=y"` → 307 to `/vi/home`; `/robots.txt` and `/sitemap.xml` → 200 with the real origin; `/vi/home` HTML contains `noindex`.
4. Check Cloudflare/CDN rules for `/`, `/vi`, `/en`.
5. Rollback: revert the commit; `SITE_URL` may stay in the env files (an unused variable is harmless).

## Open Questions

- Product review of the homepage title and description copy (both locales). Wording only; it does not change specs, approach or tasks.
- Whether to submit `sitemap.xml` to Google Search Console after the first production deploy (operational, outside the repo).
