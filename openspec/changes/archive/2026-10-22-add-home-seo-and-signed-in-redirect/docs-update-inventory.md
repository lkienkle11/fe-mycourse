# Documentation Update Inventory

Companion to `design.md` and `tasks.md` group 12. It lists every document that becomes stale when this change lands, with the CURRENT text (verbatim, `HEAD 0f884da`) and the exact REPLACEMENT. It is split into three parts that were drafted from separate scopes and share one numbering scheme: **Part A** (`DOC-A*`: SEO, security, quality, testing, API and pattern docs, OpenSpec specs), **Part B** (`DOC-B*`: deploy, Docker, README, the five `.env*.example` files), **Part C** (`DOC-C*`: routing, pages, screens, architecture, folder structure, modules, flows, components, reusable assets).

Method (AGENTS.md order): (1) GitNexus (the graph does not index documents, so it is not an authority for this list); (2) the existing documents, grepped for home route, SEO, robots, sitemap, metadata, `SITE_URL`, proxy, middleware, redirect, `homeHref`, post-login, cookie names, "unused", "this phase", "no route metadata"; (3) the source code, to confirm each statement.

Language: all documents are English except the section "Tích hợp home" of `docs/seo-ranking-setup.md` (Vietnamese) and the comments of the `.env*.example` files (Vietnamese); replacements there keep that language (Documentation Language Consistency Rule). **Replace, do not append** (Full Documentation Replacement Rule): each CURRENT passage is replaced so that no stale text and no history note remains.

Conventions: `REPLACE`, `FRAGMENT` (replace exactly the `old` substring with `new`), `INSERT`, `STAMP` (prepend the standard sentence inside the `_Last audited: ..._` line, the old text follows as `Prior: ...`), `DELETE`. Line numbers are `HEAD` references; re-locate by the quoted text.

Final-state facts every replacement must state (single source: `design.md`): `SITE_URL` is a server-only runtime variable validated at server start and never read at build; `/{locale}` has full SEO metadata and an Organization JSON-LD; `/{locale}/home` is `noindex, nofollow` with its own title; `src/proxy.ts` redirects locale roots to `/{locale}/home` when both `refresh_token` and `session_id` cookies exist; `/robots.txt` and `/sitemap.xml` are served by `src/app/robots.ts` and `src/app/sitemap.ts`; the default post-auth destination is `defaultPostAuthHref`; auth cookie names come from `src/constants/auth-cookie.ts`; `buildLanguageAlternates` in `canonical.ts` produces the hreflang map (with `x-default`) for both the metadata factory and the sitemap builder.

Documents changed (19 documents plus five env example files): `README.md`, `docs/deploy.md`, `docs/docker.md`, `docs/seo-ranking-setup.md`, `docs/security-hardening-notes.md`, `docs/quality.md`, `docs/testing.md`, `docs/api-using.md`, `docs/patterns.md`, `docs/api-overview.md` (stamp only), `docs/router.md`, `docs/pages.md`, `docs/screens.md`, `docs/architecture.md`, `docs/folder-structure.md`, `docs/modules.md`, `docs/flow.md`, `docs/logic-flow.md`, `docs/components.md`, `docs/reusable-assets.md`, plus the five `.env*.example` files (comments). `AGENTS.md` and `CLAUDE.md` change only through the regenerated GitNexus counts (`npx gitnexus analyze`). `openspec/specs/**`, `docs/instructor-admin.md`, `docs/dependencies.md`, `docs/delivery*.md` are scanned and need no change (reasons are in each part's final table).

---

# Documentation Update Inventory — Part A (SEO / security / quality / testing / API / patterns docs)

Scope: `docs/seo-ranking-setup.md`, `docs/security-hardening-notes.md`, `docs/quality.md`, `docs/testing.md`, `docs/api-using.md`, `docs/patterns.md`, `docs/api-overview.md`, `openspec/specs/*/spec.md`. Line numbers are `HEAD 0f884da`; re-locate by quote. Conventions: `REPLACE` = replace the quoted line(s); `FRAGMENT` = inside the quoted line replace exactly `old` with `new`; `INSERT` = new line(s) after the quoted anchor; `STAMP` = prepend the new sentence inside the `_Last audited: ..._` / `_Last updated: ..._` line (the old text stays after it as `Prior: ...`). All text is English except the section "Tích hợp home" of `docs/seo-ranking-setup.md`, which stays Vietnamese.

Standard stamp sentence (every `STAMP` item): `2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL).`

Because the old stamp starts with its own date, every STAMP is expressed as a FRAGMENT of the opening of the line: the old opening `_Last audited: ` (or `_Last updated: `) becomes `_Last audited: <standard sentence> Prior: `, so the previous text follows unchanged as `Prior: <old date> (...)`.

---

## `docs/seo-ranking-setup.md`

### DOC-A1 — `docs/seo-ranking-setup.md:L3` — STAMP
old: `_Last audited: 2026-10-16 (signed-in home page:`
new: `_Last audited: 2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL). Prior: 2026-10-16 (signed-in home page:`
(The rest of the line, including the existing `Prior: 2026-10-15 ...` and `Prior: 2026-07-26 (... most SEO helpers still unused by other pages)` entries, is kept unchanged.)

### DOC-A2 — `docs/seo-ranking-setup.md:L7` — REPLACE
CURRENT: `**Status:** helpers exist for future `generateMetadata` / JSON-LD / crawl policy. They are **not** imported from `layout.tsx`, route `page.tsx`, `app/sitemap.ts`, or `app/robots.ts` in this phase. The signed-in `/{locale}/home` route ships **without** page metadata; its crawl protection comes from `PRIVATE_ROUTES` disallow derivation only. **Exception:** `robotsPreset` / `robotsModeForPublicRouteKey` (N5) are now imported and used, from `generateMetadata` in `src/app/[locale]/(web)/login/page.tsx` and `.../signup/page.tsx` — the first real page wiring of this SEO scaffolding.`
REPLACEMENT:
`**Status:** the home pages and the crawl files are wired. The guest home `/{locale}` (`src/app/[locale]/(web)/page.tsx`) has `generateMetadata` built with `buildPageMetadata` and renders Organization JSON-LD (`buildOrganizationJsonLd` + `JsonLd`). The signed-in `/{locale}/home` (`.../home/page.tsx`) has `generateMetadata` returning its title and `robotsPreset(signedInHomeRobotsMode())` (noindex, nofollow). `login` and `signup` call `robotsPreset` / `robotsModeForPublicRouteKey` from their own `generateMetadata`. `src/app/robots.ts` and `src/app/sitemap.ts` (both `dynamic = "force-dynamic"`) serve `/robots.txt` and `/sitemap.xml` from `buildRobotsTxtRules` and `buildSitemapEntries`. `src/instrumentation.ts` validates `SITE_URL` when the server starts. The remaining helpers (`seoFetch` and `publicCacheProfiles`, the Course / Person / Breadcrumb / Article / Video / FAQ JSON-LD builders, `src/lib/performance/**`, `redact-client-payload`, the security header presets) are still not imported by any page or layout.`

### DOC-A3 — `docs/seo-ranking-setup.md:L14` — REPLACE
CURRENT: `- Root metadata today is title/description only in `src/app/layout.tsx` — no OG/Twitter/JSON-LD/sitemap/robots under `src/`.`
REPLACEMENT: `- Root metadata in `src/app/layout.tsx` is `title` = `DEFAULT_SITE_NAME` (`MyCourse`) only, and `<html lang>` comes from `await getLocale()`. OG/Twitter/canonical/hreflang/JSON-LD are emitted per page (guest home); `src/app/robots.ts` and `src/app/sitemap.ts` serve `/robots.txt` and `/sitemap.xml`.`

### DOC-A4 — `docs/seo-ranking-setup.md:L13` — REPLACE
CURRENT: `- Next.js **16.2.1**, App Router + `next-intl` (`localePrefix: "always"`); root `/` redirects to the default locale.`
REPLACEMENT: `- Next.js **16.2.1**, App Router + `next-intl` (`localePrefix: "always"`); root `/` (`src/app/page.tsx`, using `routing.defaultLocale`) redirects to the default locale, and `src/proxy.ts` sends a signed-in session on `/{locale}` on to `/{locale}/home`.`

### DOC-A5 — `docs/seo-ranking-setup.md:L15` — REPLACE
CURRENT: `- Guest home uses **mock** course data. Signed-in `/home` is a login-required page (`PRIVATE_ROUTES.home`) that shows catalog and continue-learning data fetched client side; it has no route metadata.`
REPLACEMENT: `- Guest home uses **mock** course data (never used for metadata or JSON-LD). Signed-in `/home` is a login-required page (`PRIVATE_ROUTES.home`) that shows catalog and continue-learning data fetched client side; its route metadata is only a title plus noindex, nofollow robots.`

### DOC-A6 — `docs/seo-ranking-setup.md:L17` — REPLACE
CURRENT: `- No frontend site origin env yet. Do not hard-code a domain. Do not use `NEXT_PUBLIC_API_URL` as canonical/`metadataBase`. Future server-side `SITE_URL` is documented in [`deploy.md`](./deploy.md) only (env files / nginx / PM2 unchanged this phase).`
REPLACEMENT: `- The frontend site origin is the server-only **runtime** env var `SITE_URL` (see "Site origin, crawl files and signed-in redirect" below and [`deploy.md`](./deploy.md)). Do not hard-code a domain. Do not use `NEXT_PUBLIC_API_URL` as canonical/`metadataBase`.`

### DOC-A7 — `docs/seo-ranking-setup.md:L36` — FRAGMENT (A7)
old: `Canonical/sitemap use `homeHref`, `toPublicRoute`, …;`
new: `Canonical/sitemap use `homeHref`, `toPublicRoute`, …; the post-auth default destination (`defaultPostAuthHref`, which equals `signedInHomeHref`) and the proxy redirect target use the signed-in home path;`

### DOC-A8 — `docs/seo-ranking-setup.md:L42` — REPLACE (A13)
CURRENT: `| A13 | HTTP URL parse pattern | `src/lib/instructor-application/url-validation.ts` | `site-config` validates `SITE_URL` with the same HTTPS URL rules (mirror pattern; no instructor-form dependency). |`
REPLACEMENT: `| A13 | HTTP URL parse pattern | `src/lib/instructor-application/url-validation.ts` | `site-config` validates `SITE_URL` as a pure origin with the same URL rules (mirror pattern; no instructor-form dependency); `resolveSiteConfig` adds the production-versus-development host rules. |`

### DOC-A9 — `docs/seo-ranking-setup.md:L47` — FRAGMENT (A18)
old: `Factory mirrors this pattern; pages unchanged this phase.`
new: `Factory mirrors this pattern; the guest home and `/home` pages use it.`

### DOC-A10 — `docs/seo-ranking-setup.md:L48` — REPLACE (A19)
CURRENT: `| A19 | Locale proxy | `src/proxy.ts` | Only middleware entry; no new `middleware.ts`. |`
REPLACEMENT: `| A19 | Locale proxy | `src/proxy.ts` | Only middleware entry; no new `middleware.ts`. Wraps next-intl `createMiddleware(routing)` and adds the signed-in `/{locale}` to `/{locale}/home` redirect (logic in `src/lib/navigation/signed-in-home-redirect.ts`). |`

### DOC-A11 — `docs/seo-ranking-setup.md:L54` — REPLACE (heading)
CURRENT: `### B) New resources created this phase (unused)`
REPLACEMENT: `### B) New resources`

### DOC-A12 — `docs/seo-ranking-setup.md:L60` — REPLACE (N2)
CURRENT: `| N2 | `src/lib/seo/site-config.ts` | Runtime contract/validate **pure** `SITE_URL` origin (`https://host` only); optional `defaultOgImage` (no invented `/og-default.png`) | N1–N1b, A13, A8 |`
REPLACEMENT: `| N2 | `src/lib/seo/site-config.ts` | `resolveSiteConfig`: reads the server-only runtime `SITE_URL`. Production (`NODE_ENV=production`, so `next start` for staging and prod alike) requires a pure `https://` origin whose host is not loopback; non-production additionally accepts `http://localhost[:port]` and `http://127.0.0.1[:port]`. Optional `defaultOgImage` (no invented `/og-default.png`) | N1–N1b, A13, A8 |`

### DOC-A13 — `docs/seo-ranking-setup.md:L61` — REPLACE (N3)
CURRENT: `| N3 | `src/lib/seo/build-page-metadata.ts` | `buildPageMetadata(): Metadata` — emits OG/Twitter **images only when** caller or site config supplies a real `SeoImage` | N1–N2, N1b, A7, A8, A10 |`
REPLACEMENT: `| N3 | `src/lib/seo/build-page-metadata.ts` | `buildPageMetadata(): Metadata` — title, description, canonical, hreflang alternates for every locale plus `x-default` (built by the shared `buildLanguageAlternates` helper in `canonical.ts`, also used by the sitemap builder), robots preset, OG and Twitter; emits OG/Twitter **images only when** caller or site config supplies a real `SeoImage`. Used by the guest home. | N1–N2, N1b, A7, A8, A10 |`

### DOC-A14 — `docs/seo-ranking-setup.md:L63` — REPLACE (N5)
CURRENT: `| N5 | `src/lib/seo/robots-presets.ts` | `indexable` / `noindex` / `privateApp` + `robotsModeForPublicRouteKey` | N1, `indexable-routes` |`
REPLACEMENT: `| N5 | `src/lib/seo/robots-presets.ts` | `indexable` / `noindex` / `privateApp` + `robotsModeForPublicRouteKey`; used by the guest home, `/home`, `login` and `signup` metadata | N1, `indexable-routes` |`

### DOC-A14b — `docs/seo-ranking-setup.md:L62` — REPLACE (N4)
CURRENT: `| N4 | `src/lib/seo/canonical.ts` | Absolute canonical from site origin + pathname | N2, A7, A8, A9 |`
REPLACEMENT: `| N4 | `src/lib/seo/canonical.ts` | Absolute canonical from site origin + pathname; `buildLanguageAlternates` returns the per-locale canonical URLs plus `x-default`, shared by `build-page-metadata.ts` and `sitemap-builder.ts` | N2, A7, A8, A9 |`

### DOC-A15 — `docs/seo-ranking-setup.md:L65` — REPLACE (N5c)
CURRENT: `| N5c | `src/constants/seo/routes.ts` `SIGNED_IN_HOME_PATH` | Constant `/home` aligned with `PRIVATE_ROUTES.home` (not SEO-indexable) | A6 |`
REPLACEMENT: `| N5c | `PRIVATE_ROUTES.home` (`src/constants/route.ts`) | Single source for the signed-in `/home` path (not SEO-indexable, derived into the robots.txt disallow list); there is no second `/home` constant under `src/constants/seo/**` | A6 |`

### DOC-A16 — `docs/seo-ranking-setup.md:L66` — REPLACE (N6)
CURRENT: `| N6 | `src/lib/seo/sitemap-builder.ts` | Pure sitemap builder; default pathnames = SEO-indexable only | A6, A6b, N5b, A7, A8 |`
REPLACEMENT: `| N6 | `src/lib/seo/sitemap-builder.ts` | Pure sitemap builder `buildSitemapEntries` (default-locale URL + hreflang alternates incl. `x-default` from `buildLanguageAlternates`); default pathnames = SEO-indexable only. Consumed by `src/app/sitemap.ts`. | A6, A6b, N5b, A7, A8 |`

### DOC-A17 — `docs/seo-ranking-setup.md:L68` — REPLACE (N8)
CURRENT: `| N8 | `src/lib/seo/json-ld.tsx` | Server JSON-LD script + `<` escape | N7 |`
REPLACEMENT: `| N8 | `src/lib/seo/json-ld.tsx` | Server JSON-LD script + `<` escape; rendered by the guest home with `buildOrganizationJsonLd({ name, url })` (no logo, no `sameAs`) | N7 |`

### DOC-A18 — `docs/seo-ranking-setup.md:L73` — REPLACE (N13)
CURRENT: `| N13 | `src/lib/security/web/crawl-policy.ts` | Disallow lists from private routes via A6b; public crawl-allow aligns with SEO-indexable keys | A6, A6b |`
REPLACEMENT: `| N13 | `src/lib/security/web/crawl-policy.ts` | `privateCrawlDisallowPaths` (disallow lists from private routes via A6b), `publicCrawlAllowPaths` (aligned with SEO-indexable keys) and `signedInHomeRobotsMode` (`privateApp`); consumed by `buildRobotsTxtRules` and the `/home` metadata | A6, A6b |`

### DOC-A19 — after `docs/seo-ranking-setup.md:L76` (row N16), before `| D1 |` — INSERT
```
| N17 | `src/lib/seo/robots-txt.ts` | Pure `buildRobotsTxtRules`: rules for `*` that allow the localized public roots (`publicCrawlAllowPaths()` through `localizedPathname`) and disallow every `privateCrawlDisallowPaths()` entry for every locale (`/vi/admin`, `/en/admin`, …) | N13, A6, A8 |
| N18 | `src/app/robots.ts`, `src/app/sitemap.ts` | `MetadataRoute.Robots` (rules from N17, `sitemap: <SITE_URL>/sitemap.xml`) and `MetadataRoute.Sitemap` (`buildSitemapEntries()`); both export `dynamic = "force-dynamic"` and bypass `src/proxy.ts` (its matcher excludes paths containing a dot) | N2, N6, N17 |
| N19 | `src/instrumentation.ts` | `register()` runs `resolveSiteConfig` at server start (nodejs runtime, `NODE_ENV=production`, skipped when `NEXT_PHASE=phase-production-build`) so a missing or invalid `SITE_URL` stops the server instead of returning a 500 on the homepage | N2 |
| N20 | `src/lib/navigation/signed-in-home-redirect.ts`, `src/constants/auth-cookie.ts` | `resolveSignedInHomeRedirectPath` and `hasAuthSessionCookies` (pure logic used by `src/proxy.ts`); `auth-cookie.ts` holds the auth cookie names (`ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`, `SESSION_ID_COOKIE`, `AUTH_SESSION_EXPIRES_AT_COOKIE`, `LEGACY_AUTH_SESSION_MAX_AGE_COOKIE`, `AUTH_COOKIE_NAMES`) shared by the server auth, cookie and session helpers | A19, A7 |
```

### DOC-A20 — `docs/seo-ranking-setup.md:L88` — REPLACE (end of Ownership rule)
CURRENT: `- Because this foundation is intentionally not wired, Knip ignores `types`/`nsTypes`/`files` for all of `src/types/**` (same posture as other non-UI folders). Do not put unused orphans under `src/components/**`.`
REPLACEMENT: `- Knip ignores `types`/`nsTypes`/`files` for all of `src/types/**` (same posture as other non-UI folders), because the foundation still contains helpers no page imports. Do not put unused orphans under `src/components/**`.`

### DOC-A21 — `docs/seo-ranking-setup.md:L90-L99` — REPLACE (section C)
CURRENT:
```
### C) Forbidden this phase

- Wire SEO helpers broadly into `layout.tsx` / guest pages; create `app/sitemap.ts`, `app/robots.ts`, `opengraph-image.tsx`.
- Change `next.config.ts`, `.env`, `.env.example`, nginx, PM2.
- Replace the guest `/` marketing home or give `/home` route metadata (the signed-in `/home` now ships with real catalog data and intentionally has no metadata).
- Register `publicCacheProfiles`; call production APIs from server components (the client home calls them); build JSON-LD from home mock data.
- Add packages: `schema-dts`, `react-schemaorg`, `@next/bundle-analyzer`.
- Duplicate fetch / cache / route-list / slugger / truncate stacks; `OptimizedImage` wrapper; new `middleware.ts`; new font loader.
- Orphan React files under `src/components/**` (Knip `files` fails). Put `JsonLd` under `src/lib/seo/`.
- BE source code changes.
```
REPLACEMENT:
```
### C) Forbidden

- Create `opengraph-image.tsx`, or invent an OG image, an Organization `logo` or `sameAs` (no real asset or profile list exists).
- Expose `SITE_URL` as `NEXT_PUBLIC_*`, a Docker build arg or a GitHub secret (it is a runtime-only server variable), or change `next.config.ts`, `Dockerfile`, `docker/*.yml`, `ecosystem.config.cjs`, `deploy/nginx` or the GitHub workflows for it.
- Replace the guest `/` marketing home, or give `/home` a canonical, OG or JSON-LD, or an indexable robots mode (`/home` stays noindex, nofollow).
- Register `publicCacheProfiles`; call production APIs from server components (the client home calls them); build JSON-LD from home mock data.
- Add packages: `schema-dts`, `react-schemaorg`, `@next/bundle-analyzer`.
- Duplicate fetch / cache / route-list / slugger / truncate stacks; `OptimizedImage` wrapper; new `middleware.ts` (`src/proxy.ts` is the only entry); new font loader; a second private-path list, `/home` constant or auth cookie-name literal.
- Orphan React files under `src/components/**` (Knip `files` fails). Put `JsonLd` under `src/lib/seo/`.
- BE source code changes.
```

### DOC-A22 — `docs/seo-ranking-setup.md:L106` — FRAGMENT
old: `hreflang alternates from A8,`
new: `hreflang alternates from A8 (every locale plus `x-default`, via the shared `buildLanguageAlternates` in `canonical.ts`),`

### DOC-A23 — `docs/seo-ranking-setup.md:L107` — FRAGMENT
old: `do not invent a 404 URL.`
new: `do not invent a 404 URL. The home pages currently pass no image, so their OG/Twitter cards have none.`

### DOC-A24 — `docs/seo-ranking-setup.md:L108` — REPLACE
CURRENT: `- `site-config` reads optional **server-side** `process.env.SITE_URL` only (never `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_API_URL`). Validation rejects username/password, non-empty pathname (must be `/` or empty), search, and hash — pure `https://` origin, no silent base-path drop.`
REPLACEMENT: `- `site-config` reads **server-side** `process.env.SITE_URL` at request time only (never `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_API_URL`). Validation rejects username/password, non-empty pathname (must be `/` or empty), search, and hash — pure origin, no silent base-path drop. Production requires `https://` and a non-loopback host; non-production also accepts `http://localhost[:port]` and `http://127.0.0.1[:port]`.`

### DOC-A25 — `docs/seo-ranking-setup.md:L113` — FRAGMENT
old: `**Phase now: `home` only.**`
new: `**Currently `home` only.**`

### DOC-A26 — `docs/seo-ranking-setup.md:L114` — REPLACE
CURRENT: `- Auth-adjacent public routes (`forgotPassword`, `confirmEmail`, `logout`, `login`, `signup`) and other non-allow-listed public keys use `robotsModeForPublicRouteKey` → `noindex` when wired. `login` and `signup` are the first two of these actually wired: their `generateMetadata` calls `robotsModeForPublicRouteKey("login" | "signup")` + `robotsPreset(...)` directly. Do not put them in `buildSitemapEntries` defaults.`
REPLACEMENT: `- Auth-adjacent public routes (`forgotPassword`, `confirmEmail`, `logout`, `login`, `signup`) and other non-allow-listed public keys use `robotsModeForPublicRouteKey` → `noindex`. `login` and `signup` call `robotsModeForPublicRouteKey("login" | "signup")` + `robotsPreset(...)` from their `generateMetadata`. Do not put them in `buildSitemapEntries` defaults.`

### DOC-A27 — `docs/seo-ranking-setup.md:L126` — FRAGMENT
old: `No production profile registration this phase.`
new: ``publicCacheProfiles` stays empty.`

### DOC-A28 — `docs/seo-ranking-setup.md:L133` — FRAGMENT
old: `**not** injected into layout this phase.`
new: `**not** injected into the layout.`

### DOC-A29 — `docs/seo-ranking-setup.md:L138` — REPLACE (Security (FE))
CURRENT: `See [`security-hardening-notes.md`](./security-hardening-notes.md). Crawl policy derives disallow paths from `PRIVATE_ROUTES` / private resources. Redact is allow-list based. Header presets are drafts aligned with nginx in `deploy.md`; CSP remains inactive until One Tap / OAuth / media / proxy review.`
REPLACEMENT: `See [`security-hardening-notes.md`](./security-hardening-notes.md). Crawl policy derives disallow paths from `PRIVATE_ROUTES` / private resources and feeds `robots.txt` and the `/home` noindex mode. Redact is allow-list based. Header presets are drafts aligned with nginx in `deploy.md`; CSP remains inactive until One Tap / OAuth / media / proxy review.`

### DOC-A30 — after `docs/seo-ranking-setup.md:L138`, before the `---` that precedes `## Tích hợp home` — INSERT (English section)
```

## Site origin, crawl files and signed-in redirect

- **`SITE_URL`** is a server-only **runtime** variable: never `NEXT_PUBLIC_`, never a build arg, never a GitHub secret. Every consumer runs at request time, because all routes are dynamic and `src/app/robots.ts` / `src/app/sitemap.ts` export `dynamic = "force-dynamic"`. The same artifact is configured per environment through the container/PM2 runtime environment. The e2e server uses the fake origin `https://e2e.example.test`.
- **Validation:** `resolveSiteConfig` (`src/lib/seo/site-config.ts`) is the contract (production: pure non-loopback `https` origin; non-production also `http://localhost` / `http://127.0.0.1`). `register()` in `src/instrumentation.ts` calls it at server start (nodejs runtime, `NODE_ENV=production`, skipped while `NEXT_PHASE=phase-production-build`), so a missing or invalid value stops the server instead of returning a 500 on the homepage.
- **`/robots.txt`:** rules for `*` allow the localized public roots (`publicCrawlAllowPaths()` through `localizedPathname`) and disallow every `privateCrawlDisallowPaths()` entry for every locale (`/vi/admin`, `/en/admin`, …); `sitemap: <SITE_URL>/sitemap.xml`. Rules are assembled by `buildRobotsTxtRules` (`src/lib/seo/robots-txt.ts`).
- **`/sitemap.xml`:** `buildSitemapEntries()` returns the default-locale URL with hreflang alternates including `x-default`; only `home` is indexable.
- Both files bypass `src/proxy.ts` (its matcher excludes paths containing a dot).
- **Signed-in redirect:** `src/proxy.ts` wraps next-intl `createMiddleware(routing)`. When the request path is exactly a locale root (`/vi`, `/en`, optional trailing slash) and **both** the `refresh_token` and `session_id` cookies are present (presence only, not validity), it answers `307` to `/{locale}/home` with `Cache-Control: private, no-store` and `Vary: Cookie` (next-intl's `Set-Cookie` is copied). `/` is first redirected by next-intl to `/{locale}` and then handled the same way (two hops). Googlebot sends no cookies, so it always receives the public homepage. A CDN must not cache `/`, `/vi` or `/en` (manual check). Pure logic: `resolveSignedInHomeRedirectPath` and `hasAuthSessionCookies` in `src/lib/navigation/signed-in-home-redirect.ts`; cookie names come from `src/constants/auth-cookie.ts`.
- **Post-auth destination:** the default destination after login, OAuth, email confirmation and the login/signup popup is `defaultPostAuthHref` (`src/lib/navigation/routes.ts`, equal to `signedInHomeHref`). Logout, the brand logo and header links, not-found / error "back to home", `global-error` and the canonical default stay on `homeHref`.
```

### DOC-A31 — `docs/seo-ranking-setup.md:L148` — REPLACE (Vietnamese table row)
CURRENT: `| `/` (`PUBLIC_ROUTES.home`) | Khách chưa đăng nhập | UI home marketing mock/static, chưa fetch API. | SEO-indexable allow-list key `home` (wire later). |`
REPLACEMENT: `| `/{locale}` (`PUBLIC_ROUTES.home`) | Khách chưa đăng nhập | UI home marketing mock/static, chưa fetch API; JSON-LD Organization chỉ dùng tên và URL, không dùng dữ liệu mock. | Index: `generateMetadata` dùng `buildPageMetadata` (canonical `/{locale}`, hreflang vi + en + `x-default`, OG/Twitter không ảnh); key `home` nằm trong allow-list SEO-indexable và trong `sitemap.xml`. |`

### DOC-A32 — `docs/seo-ranking-setup.md:L149` — REPLACE (Vietnamese table row)
CURRENT: `| `/home` (`PRIVATE_ROUTES.home`) | Người đã đăng nhập | Trang chủ đã đăng nhập: hero carousel, Complete your Course, Trending Course, Popular Instructor; dữ liệu lấy từ API catalog và learner-courses ở phía client; auth gate phía client; không có metadata route. | Không index: chặn crawl qua danh sách disallow suy ra từ `PRIVATE_ROUTES` (route không có `generateMetadata`). |`
REPLACEMENT: `| `/{locale}/home` (`PRIVATE_ROUTES.home`) | Người đã đăng nhập | Trang chủ đã đăng nhập: hero carousel, Complete your Course, Trending Course, Popular Instructor; dữ liệu lấy từ API catalog và learner-courses ở phía client; auth gate phía client; `generateMetadata` chỉ trả về tiêu đề (`home.signedIn.pageTitle`) và `robots`. | Không index: `robots` = noindex, nofollow (`robotsPreset(signedInHomeRobotsMode())`, preset `privateApp`) và đường dẫn nằm trong danh sách disallow của `robots.txt` suy ra từ `PRIVATE_ROUTES`; không có canonical, OG hay JSON-LD. |`

### DOC-A33 — after `docs/seo-ranking-setup.md:L151` (Locale note) — INSERT (Vietnamese)
```

Chuyển hướng đã đăng nhập: `src/proxy.ts` trả `307` từ `/vi` hoặc `/en` sang `/{locale}/home` khi request có đủ cả hai cookie `refresh_token` và `session_id` (chỉ kiểm tra có mặt, không kiểm tra hợp lệ), kèm `Cache-Control: private, no-store` và `Vary: Cookie`. Truy cập `/` đi hai bước: next-intl chuyển sang `/{locale}`, rồi proxy xử lý như trên. Googlebot không gửi cookie nên luôn nhận trang home công khai.
```

### DOC-A34 — `docs/seo-ranking-setup.md:L176-L179` — REPLACE (guest section, Vietnamese)
CURRENT:
```
### Guest `/` (current)

- Existing marketing home under locale routes remains mock-driven.
- Future SEO wire may attach `buildPageMetadata` + optional Organization JSON-LD only after real site config (`SITE_URL`) and content policy are approved.
```
REPLACEMENT:
```
### Guest `/{locale}` (hiện tại)

- Trang home marketing theo locale vẫn dùng dữ liệu mock.
- `generateMetadata` trong `src/app/[locale]/(web)/page.tsx` gọi `buildPageMetadata`: title/description lấy từ các key i18n `homepage.seo.title` / `homepage.seo.description`, canonical `/{locale}`, hreflang vi + en + `x-default`, OG + Twitter không có ảnh (repo chưa có asset ảnh thật và không bịa ảnh), robots indexable.
- Trang render JSON-LD Organization qua `buildOrganizationJsonLd({ name, url })` + `JsonLd` (không có logo, không có `sameAs`). JSON-LD không bao giờ lấy dữ liệu course mock.
- Origin lấy từ `SITE_URL` (biến runtime phía server, xem mục "Site origin, crawl files and signed-in redirect").
```

### DOC-A35 — `docs/seo-ranking-setup.md:L185` — REPLACE
CURRENT: `Synthetic metadata factory, OG/Twitter, JSON-LD, sitemap/robots builders, rendering modes over the existing server fetch + fail-closed cache registry, performance presets, and crawl/redact/header hardening — all as **reusable unused** layers, not hand-copied per page. Temporary discussion notes are not SoT; this file + code under `src/lib/**` are.`
REPLACEMENT: `Synthetic metadata factory, OG/Twitter, JSON-LD, sitemap/robots builders, rendering modes over the existing server fetch + fail-closed cache registry, performance presets, and crawl/redact/header hardening — reusable layers, not hand-copied per page. The metadata factory, the Organization JSON-LD builder, the sitemap and robots builders and the crawl policy are wired into the home pages, `robots.ts` and `sitemap.ts`; the fetch wrapper, the other JSON-LD builders, the performance presets and the redact and header helpers are not wired yet. Temporary discussion notes are not SoT; this file + code under `src/lib/**` are.`

### DOC-A36 — `docs/seo-ranking-setup.md:L189-L196` — REPLACE (checklist)
CURRENT:
```
## Wiring checklist (future phase)

1. Approve `SITE_URL` and document in env/deploy.
2. Call `buildPageMetadata` from selected `generateMetadata` owners (guest `/` and `/home` both still unwired — `/home` intentionally has no route metadata yet).
3. Add reviewed `publicCacheProfiles` entries before any `seoFetch` production use.
4. Keep `/home` on `privateApp` unless product proves a public, non-personalized slice is safe to index.
5. Add `app/sitemap.ts` / `app/robots.ts` consumers of the pure builders.
6. Wire `JsonLd` only with real published DTOs.
```
REPLACEMENT:
```
## Wiring checklist (remaining work)

1. Call `buildPageMetadata` from every further indexable page's `generateMetadata` (wired today: guest `/{locale}`), adding its key to `SEO_INDEXABLE_PUBLIC_ROUTE_KEYS` so the sitemap and robots allow list pick it up.
2. Add reviewed `publicCacheProfiles` entries before any `seoFetch` production use.
3. Keep `/home` on `privateApp` (noindex, nofollow) unless product proves a public, non-personalized slice is safe to index.
4. Add Course / Person / Breadcrumb / Article / Video / FAQ `JsonLd` only with real published DTOs (Organization is the only builder in use, with name and URL only).
5. Supply a real approved OG image asset (and the Organization `logo` / `sameAs` once they exist) through `defaultOgImage` / `SeoPageInput.image`.
```

---

## `docs/security-hardening-notes.md`

### DOC-A37 — `docs/security-hardening-notes.md:L3` — STAMP
old: `_Last audited: 2026-07-25 (unused helpers under `src/lib/security/web/**`)._`
new: `_Last audited: 2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL). Prior: 2026-07-25 (unused helpers under `src/lib/security/web/**`)._`

### DOC-A38 — `docs/security-hardening-notes.md:L5` — FRAGMENT
old: `Backend public-SEO intent (take-note only, no BE code this phase):`
new: `Backend public-SEO intent (take-note only, no BE code):`

### DOC-A39 — `docs/security-hardening-notes.md:L9` — REPLACE
CURRENT: `Helpers are **unused** by pages/layouts. They do **not** replace authentication or authorization. `noindex` / robots disallow lists are a crawl hint, not an access control. **Exception:** `safe-redirect.ts` is used — via `useAuthNextParam` (`src/hooks/auth/use-auth-next-param.ts`), which is used by `LoginContent`, `SignupContent`, and `useOAuthPostAuth` for the route-based login/signup modal and pages.`
REPLACEMENT: `The helpers do **not** replace authentication or authorization. `noindex` / robots disallow lists are a crawl hint, not an access control; the signed-in redirect in `src/proxy.ts` only checks that the `refresh_token` and `session_id` cookies are present and is a navigation convenience, not an auth gate. **Used:** `crawl-policy.ts` (`privateCrawlDisallowPaths`, `publicCrawlAllowPaths` by `buildRobotsTxtRules` / `src/app/robots.ts`; `signedInHomeRobotsMode` by the `/home` metadata), `JsonLd` with `sanitize-json-ld.ts`-style escaping for the guest home Organization JSON-LD, and `safe-redirect.ts` via `useAuthNextParam` (`src/hooks/auth/use-auth-next-param.ts`), which is used by `LoginContent`, `SignupContent`, and `useOAuthPostAuth` for the route-based login/signup modal and pages. **Still unused by pages/layouts:** `redact-client-payload.ts`, `security-headers-presets.ts` and `sanitize-json-ld.ts`.`
(Verify at implementation time whether `sanitizeJsonLd` is called by the home page; if it is not, drop the phrase "`sanitize-json-ld.ts`-style escaping" and write only "`JsonLd` (which escapes `<` to `<`)".)

### DOC-A40 — `docs/security-hardening-notes.md:L15` — REPLACE (Crawl policy row)
CURRENT: `| Crawl policy | `src/lib/security/web/crawl-policy.ts` | Builds disallow path lists by **deriving** `PRIVATE_ROUTES` / `PRIVATE_RESOURCE_ROUTES` via shared `flattenRouteTreePaths`. Public crawl-allow aligns with **SEO-indexable** `PUBLIC_ROUTES` keys (not every public-routable path). Do not hard-code a second private path list. |`
REPLACEMENT: `| Crawl policy | `src/lib/security/web/crawl-policy.ts` | `privateCrawlDisallowPaths` builds disallow path lists by **deriving** `PRIVATE_ROUTES` / `PRIVATE_RESOURCE_ROUTES` via shared `flattenRouteTreePaths`; `publicCrawlAllowPaths` aligns with **SEO-indexable** `PUBLIC_ROUTES` keys (not every public-routable path); `signedInHomeRobotsMode` returns `privateApp` for `/home`. Consumed by `buildRobotsTxtRules` (`src/lib/seo/robots-txt.ts`) and `src/app/robots.ts`. Do not hard-code a second private path list or `/home` constant. |`

### DOC-A41 — `docs/security-hardening-notes.md:L17` — FRAGMENT
old: `used with `JsonLd` (`src/lib/seo/json-ld.tsx`) which also escapes `<` → `<`. |`
new: `used with `JsonLd` (`src/lib/seo/json-ld.tsx`) which also escapes `<` → `<`; `JsonLd` is rendered by the guest home Organization JSON-LD. |`

### DOC-A42 — after `docs/security-hardening-notes.md:L19` (end of Helpers table) — INSERT row
```
| Signed-in home redirect | `src/proxy.ts`, `src/lib/navigation/signed-in-home-redirect.ts` | `resolveSignedInHomeRedirectPath` / `hasAuthSessionCookies`: a locale-root request with both `refresh_token` and `session_id` cookies (presence only) gets `307` to `/{locale}/home` with `Cache-Control: private, no-store` and `Vary: Cookie`. Cookie names come from `src/constants/auth-cookie.ts`, which replaces the string literals in the server auth, cookie, session and refresh-route code. Not an authentication check: the destination page still gates on the real session. |
```

### DOC-A43 — `docs/security-hardening-notes.md:L25` — FRAGMENT
old: `Do not put personalized `/home` data, tokens, PII, or private enrollment into public HTML, OG, JSON-LD, or public fetch cache.`
new: `Do not put personalized `/home` data, tokens, PII, or private enrollment into public HTML, OG, JSON-LD, or public fetch cache. Never cache a locale-root response at a CDN or reverse proxy: the signed-in redirect depends on the `Cookie` header (`Vary: Cookie`, `Cache-Control: private, no-store` on the redirect).`

### DOC-A44 — `docs/security-hardening-notes.md:L28-L30` — REPLACE (Related deploy take-note)
CURRENT:
```
## Related deploy take-note

Planned FE origin `SITE_URL` (server-side) for canonical/metadata — documented in [`deploy.md`](./deploy.md). This phase does **not** change `.env`, `.env.example`, nginx, or PM2.
```
REPLACEMENT:
```
## Related deploy take-note

The FE origin `SITE_URL` is a server-only runtime variable (never `NEXT_PUBLIC_`, never a build arg or GitHub secret) used for canonical, sitemap and robots output and validated at server start by `src/instrumentation.ts` — documented in [`deploy.md`](./deploy.md). Nginx, PM2, Docker and the workflows are unchanged.
```

---

## `docs/quality.md`

### DOC-A45 — `docs/quality.md:L3` — STAMP
old: `_Last audited: 2026-10-15 (jscpd dedup table:`
new: `_Last audited: 2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL). Prior: 2026-10-15 (jscpd dedup table:`

### DOC-A46 — `docs/quality.md:L270-L272` — REPLACE
CURRENT:
```
## Unused SEO foundation (intentional)

Shared SEO/performance/security helpers under `src/lib/seo/**`, `src/lib/performance/**`, and `src/lib/security/web/**` are intentionally unused by pages/layouts this phase. Knip ignores `files` under `src/lib/**` and ignores `types` / `nsTypes` / `files` under all of `src/types/**` (including SEO contracts). **Do not** place unused orphans under `src/components/**` (`JsonLd` lives in `src/lib/seo/json-ld.tsx`). Gate remains `npm run check-all`. See [`seo-ranking-setup.md`](./seo-ranking-setup.md).
```
REPLACEMENT:
```
## SEO foundation and Knip

The home metadata, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/instrumentation.ts` and `src/proxy.ts` use the SEO and crawl helpers under `src/lib/seo/**` and `src/lib/security/web/**`. The other helpers there and under `src/lib/performance/**` (for example `seoFetch`, the non-Organization JSON-LD builders, the resource hints) are still not imported by any page. Knip ignores `files` under `src/lib/**` and ignores `types` / `nsTypes` / `files` under all of `src/types/**` (including SEO contracts). **Do not** place unused orphans under `src/components/**` (`JsonLd` lives in `src/lib/seo/json-ld.tsx`). Gate remains `npm run check-all`. See [`seo-ranking-setup.md`](./seo-ranking-setup.md).
```

### DOC-A47 — `docs/quality.md:L62` — FRAGMENT (decide: include, low risk)
old: `supplies App Router entry patterns (`src/app/**/{page,layout,route,…}.tsx`, `src/proxy.ts`, `next.config.ts`, …).`
new: `supplies App Router entry patterns (`src/app/**/{page,layout,route,robots,sitemap,…}.tsx`, `src/proxy.ts`, `src/instrumentation.ts`, `next.config.ts`, …).`
Reason: `robots.ts`, `sitemap.ts` and `instrumentation.ts` are new Next special files; confirm with `knip.json` / the plugin at implementation time, and if the plugin does not list them keep the original text.

---

## `docs/testing.md`

### DOC-A48 — `docs/testing.md:L3` — STAMP
old: `_Last updated: 2026-10-18 (signed-in home hero carousel reworked`
new: `_Last updated: 2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL). Prior: 2026-10-18 (signed-in home hero carousel reworked`

### DOC-A49 — after the last row of the "Behavior matrix — signed-in home" table (after `docs/testing.md:L41`, before `## Harness — Playwright (browser)`) — INSERT rows
```
| `resolveSignedInHomeRedirectPath`, `hasAuthSessionCookies` | `src/lib/navigation/signed-in-home-redirect.test.ts` | [cases: locale root with both cookies redirects, trailing slash, only one cookie, no cookies, non-root paths, unknown locale — fill from the real test] | ✅ Passing ([n] cases) |
| `resolveSiteConfig` / `parseAbsoluteHttpsOrigin` | `src/lib/seo/site-config.test.ts` | [cases: production https only, loopback rejected in production, localhost and 127.0.0.1 accepted outside production, userinfo / path / search / hash rejected, missing value] | ✅ Passing ([n] cases) |
| `buildRobotsTxtRules` | `src/lib/seo/robots-txt.test.ts` | [cases: allow list per locale, disallow list per locale from `PRIVATE_ROUTES`] | ✅ Passing ([n] cases) |
| `buildPageMetadata` (`x-default`), `generateMetadata` of the guest home and `/home` | `src/lib/seo/build-page-metadata.test.ts`, `src/app/[locale]/(web)/page.test.tsx`, `src/app/[locale]/(web)/home/page.test.tsx` | [cases: hreflang with `x-default`, canonical, noindex/nofollow for `/home`, Organization JSON-LD without mock data] | ✅ Passing ([n] cases) |
```
(Rows are templates: file names, case lists and counts are filled from the real test files at implementation time and must be verified before writing.)

### DOC-A50 — `docs/testing.md:L50` — REPLACE (Lifecycle bullet)
CURRENT: `- **Lifecycle:** `scripts/e2e-lifecycle.mjs` (`npm run test:e2e`) — starts the fixture backend in-process, runs `next build` with `NEXT_PUBLIC_API_URL` pointed at it (required: this env var is inlined at build time), starts `next start` on a fixed port, polls both for readiness, runs `playwright test`, then tears down both child processes on success **or** failure (verified: killed cleanly after both a passing and a failing run during development).`
REPLACEMENT: `- **Lifecycle:** `scripts/e2e-lifecycle.mjs` (`npm run test:e2e`) — starts the fixture backend in-process, runs `next build` with `NEXT_PUBLIC_API_URL` pointed at it (required: this env var is inlined at build time), starts `next start` on a fixed port with the runtime variable `SITE_URL=https://e2e.example.test` (a fake origin; `src/instrumentation.ts` refuses to start a production server without a valid `SITE_URL`, and it is not needed at build time), polls both for readiness, runs `playwright test`, then tears down both child processes on success **or** failure (verified: killed cleanly after both a passing and a failing run during development).`
(Confirm the variable is set in `scripts/e2e-lifecycle.mjs` or `playwright.config.ts` at implementation time and cite the file that really sets it.)

### DOC-A51 — `docs/testing.md:L55` — FRAGMENT (home.spec.ts bullet)
old: `a trending card opens the temporary `/en/courses/<slug>` page.`
new: `a trending card opens the temporary `/en/courses/<slug>` page. [Add the new cases once written: a signed-in request for `/en` (and `/` after its two hops) lands on `/en/home`; a guest request for `/en` stays on the public homepage and `/robots.txt` and `/sitemap.xml` respond with the e2e `SITE_URL` origin. Update the case count in "5 cases".]`
Also FRAGMENT the same line: old `5 cases for `openspec/changes/add-signed-in-home-page`` new `[n] cases for `openspec/changes/add-signed-in-home-page` and `openspec/changes/add-home-seo-and-signed-in-redirect``.
Reason: the e2e specs of this change are not written yet; the count and wording are filled from the real spec.

### DOC-A52 — `docs/testing.md:L84` — FRAGMENT (decide: probably no change)
Left unchanged. `src/app/api/auth/refresh/route.ts` and `src/actions/auth/auth.ts` only swap cookie-name string literals for the `auth-cookie.ts` constants; the Jest-level boundary text stays true. Listed in the "scanned" table below.

---

## `docs/api-using.md`

### DOC-A53 — `docs/api-using.md:L3` — STAMP
old: `_Last audited: 2026-10-16 (signed-in home page:`
new: `_Last audited: 2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL). Prior: 2026-10-16 (signed-in home page:`

### DOC-A54 — `docs/api-using.md:L200` — FRAGMENT
old: `cookieStore.set("access_token", data.data.access_token, buildCookieOptions(...));`
new: `cookieStore.set(ACCESS_TOKEN_COOKIE, data.data.access_token, buildCookieOptions(...));`
Reason: the string literal is replaced by the `ACCESS_TOKEN_COOKIE` constant from `src/constants/auth-cookie.ts` in `src/actions/auth/auth.ts` and every other auth cookie consumer.

### DOC-A55 — after `docs/api-using.md:L176` (the "Server (SSR)" bullet of the auth cookie list) — INSERT
```
- **Cookie names:** every auth cookie name (`access_token`, `refresh_token`, `session_id`, `auth_session_expires_at`, and the legacy max-age cookie) is a constant in `src/constants/auth-cookie.ts` (`ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`, `SESSION_ID_COOKIE`, `AUTH_SESSION_EXPIRES_AT_COOKIE`, `LEGACY_AUTH_SESSION_MAX_AGE_COOKIE`, `AUTH_COOKIE_NAMES`). `src/api/auth/server-auth.ts`, `src/lib/utils/auth-session.ts`, `src/lib/utils/cookie.ts`, `src/app/api/auth/refresh/route.ts`, `src/actions/auth/auth.ts` and `src/proxy.ts` (through `hasAuthSessionCookies`) import them; do not repeat the literals.
```

### DOC-A56 — `docs/api-using.md:L249` — FRAGMENT (post-auth destination, only if the doc states a destination)
No destination text exists on this line; no change. Listed in the "scanned" table.

The `## SEO public GET (`seoFetch`) — unused` section (L614-621) stays: `seoFetch` is still not imported anywhere.

---

## `docs/patterns.md`

### DOC-A57 — `docs/patterns.md:L3` — STAMP
old: `_Last audited: 2026-10-15 (§15 Slug fields:`
new: `_Last audited: 2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL). Prior: 2026-10-15 (§15 Slug fields:`

### DOC-A58 — `docs/patterns.md:L503-L504` — REPLACE
CURRENT:
```
const token = getCookieValue("access_token");
setCookieValue("access_token", newToken, buildCookieOptions({ ... }));
```
REPLACEMENT:
```
import { ACCESS_TOKEN_COOKIE } from "@/constants/auth-cookie";

const token = getCookieValue(ACCESS_TOKEN_COOKIE);
setCookieValue(ACCESS_TOKEN_COOKIE, newToken, buildCookieOptions({ ... }));
```
(Place the new `import` with the other imports in the fence, directly after the existing `import { getCookieValue, setCookieValue } from "@/lib/utils";` line.)

### DOC-A59 — after `docs/patterns.md:L513` (the `auth-session.ts uses next/headers` sentence) — INSERT
```

Auth cookie names live in `src/constants/auth-cookie.ts` (`ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`, `SESSION_ID_COOKIE`, `AUTH_SESSION_EXPIRES_AT_COOKIE`, `LEGACY_AUTH_SESSION_MAX_AGE_COOKIE`, `AUTH_COOKIE_NAMES`). Never write the literal cookie string in a helper, action or route handler.
```

### DOC-A60 — `docs/patterns.md:L602-L609` — REPLACE (section SEO metadata)
CURRENT:
```
## Synthetic SEO metadata (unused foundation)

- Prefer `buildPageMetadata` over hand-written OG/Twitter per page (when wiring is approved).
```
(the following bullets, L605-L608, stay)
REPLACEMENT:
```
## Synthetic SEO metadata

- Use `buildPageMetadata` instead of hand-written OG/Twitter per page (the guest home does); a private page such as `/home` returns only `title` plus `robots: robotsPreset(...)` from `generateMetadata`.
- Read the site origin only through `resolveSiteConfig` (server-only runtime `SITE_URL`); never `process.env.SITE_URL` in a page, and never `NEXT_PUBLIC_` for it.
```
Also FRAGMENT `docs/patterns.md:L607`:
old: `- JSON-LD builders require real domain-typed fields; never invent ratings/prices from mock UI.`
new: `- JSON-LD builders require real domain-typed fields; never invent ratings/prices from mock UI (the guest home renders Organization with name and URL only).`
Also FRAGMENT `docs/patterns.md:L605`:
old: `Public SEO data must go through `seoFetch` → `serverRawFetch` → `cache-policy` (fail-closed while registry empty).`
new: `Public SEO data must go through `seoFetch` → `serverRawFetch` → `cache-policy` (fail-closed while registry empty; `seoFetch` is not wired yet).`

### DOC-A61 — in the "Adding New Features Checklist" near `docs/patterns.md:L596-L598` — INSERT (optional, include)
After the line `- [ ] Build runtime URLs through `src/lib/navigation/routes.ts` helpers (no route string interpolation in screens/components)` add:
`- [ ] Post-auth default destination is `defaultPostAuthHref` (= `signedInHomeHref`); `homeHref` is only for the guest home, brand links, logout and canonical`
Reason: documents the destination split so a new auth entry point does not fall back to `homeHref`.

---

## `docs/api-overview.md`

### DOC-A62 — `docs/api-overview.md:L3` — STAMP
old: `_Last audited: 2026-10-16 (signed-in home page:`
new: `_Last audited: 2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL). Prior: 2026-10-16 (signed-in home page:`

### DOC-A63 — `docs/api-overview.md:L157-L159` — no change
`## SEO fetch consumer (unused)` is still correct: `seoFetch` is not imported by the new `robots.ts` / `sitemap.ts` (they build from route constants, not API data). Listed in the "scanned" table.

---

## `openspec/specs/*/spec.md`

### DOC-A64 — `openspec/specs/auth-route-modal/spec.md:L46,L50` — no change
The requirement text says "falls back to its default post-login destination" and "navigates the visitor to the application's default destination". It names no path, so the change of the default from `homeHref` to `signedInHomeHref` does not make it stale. The change adds new specs only; nothing is modified here.

### DOC-A65 — `openspec/specs/dashboard-access-control/spec.md`, `frontend-error-handling/spec.md`, `frontend-regression-coverage/spec.md`, `frontend-test-execution/spec.md` — no change
No requirement mentions `SITE_URL`, robots, sitemap, metadata, canonical, noindex, `src/proxy.ts`, `homeHref` or `signedInHomeHref` (grep over `openspec/specs/*/spec.md` returned only the generic redirect / destination wording above).

---

## Scanned, no change needed

| File | Reason |
|---|---|
| `docs/seo-ranking-setup.md` L5, L16, L25-L35, L37-L41, L43-L46, L49-L53, L55-L59, L62, L64, L67, L69-L72, L74-L80, L82-L87, L103-L105, L109-L112, L115-L125, L128-L132, L134-L137, L153-L175 | Metadata-factory principles, A-assets, BE take-note, data modes (the `SEO_TEMPORARY_ENV_CACHE_POLICY` hint is still dormant with `enabled: false`), performance and the Figma-based `/home` content notes describe code this change does not touch; `/home` stays client-fetched and its data stays out of metadata and JSON-LD. |
| `docs/security-hardening-notes.md` L11-L14, L16, L18-L24, L26-L27 | Header presets, client redact, HSTS and logging rules unchanged; the safe-redirect row (L19) is unaffected by the destination change. |
| `docs/quality.md` L33-L261 | Knip scope, jscpd and gate tables unaffected; no new Knip config, no rule change. |
| `docs/testing.md` L7-L40, L42-L49, L51-L54, L56-L93 | Harness, fixtures, other journeys and the Jest-level boundary note (L84) stay true (cookie-literal swaps do not change behavior). |
| `docs/api-using.md` L5-L175, L177-L199, L201-L613, L614-L621 | API route, transport, OAuth and `seoFetch` (still unused) text unchanged; the post-auth destination is not described there. |
| `docs/patterns.md` L5-L494, L515-L601 | No SEO, redirect or destination text outside the sections listed above. |
| `docs/api-overview.md` L5-L156 | API layer description unchanged; the "SEO fetch consumer (unused)" section stays accurate. |
| `openspec/specs/*/spec.md` (5 specs) | No requirement names a path, `SITE_URL`, crawl or metadata behavior; the change adds new specs only. |

---

# Documentation Update Inventory — Part B (deploy, docker, README, env examples)

Scope: `docs/deploy.md`, `docs/docker.md`, `README.md`, `.env.example`, `.env.local.example`, `.env.dev.example`, `.env.staging.example`, `.env.prod.example`. Line numbers are `HEAD 0f884da`; re-locate by quote. Method and conventions are those of `../add-signed-in-home-page/docs-update-inventory.md` (`REPLACE`, `FRAGMENT`, `INSERT`, `STAMP`, `DELETE`). Documents are English; the `.env*.example` files keep their existing Vietnamese comments.

Facts every replacement states (final design):
- `SITE_URL` is a server-only RUNTIME variable: never `NEXT_PUBLIC_`, never a Docker build arg, never a GitHub Actions secret, not added to `deploy-dev.yml` or any CI build step. Every consumer is request-time (all routes are dynamic; `src/app/robots.ts` and `src/app/sitemap.ts` export `dynamic = "force-dynamic"`), so `npm run build` passes with `SITE_URL` unset. It reaches the process through the per-environment env file (`.env.local` / `.env.staging` / `.env.prod`) via PM2 `env_file` and Docker `env_file`.
- Contract (`src/lib/seo/site-config.ts` `resolveSiteConfig`): with `NODE_ENV=production` (every `next start`: dev, staging and prod servers) a pure `https` origin (no path, query, hash or userinfo) whose host is not loopback; outside production `http://localhost[:port]` and `http://127.0.0.1[:port]` are also accepted. `src/instrumentation.ts` `register()` validates it at server start (nodejs runtime, `NODE_ENV=production`, skipped when `NEXT_PHASE=phase-production-build`): a missing or invalid value stops the PM2 process or container with a `SiteConfigError`. Use the same host (www or apex) as the OAuth callback origins; dev and staging use their own domain, never the production one. The e2e server uses the fake origin `https://e2e.example.test`.
- `/robots.txt` and `/sitemap.xml` come from `src/app/robots.ts` and `src/app/sitemap.ts`; they bypass `src/proxy.ts` (matcher excludes paths containing a dot). No static robots/sitemap in `public/` or nginx.
- `src/proxy.ts` wraps next-intl `createMiddleware(routing)`: exact locale root (`/vi`, `/en`, optional trailing slash) plus both cookies `refresh_token` and `session_id` gives a 307 to `/{locale}/home` with `Cache-Control: private, no-store` and `Vary: Cookie`. Cookie names live in `src/constants/auth-cookie.ts`. nginx needs no change (no `proxy_cache`; only `/_next/static` is cached). Cloudflare/CDN rules are outside the repo: verify manually that `/`, `/vi`, `/en` are not cached.

Standard stamp (every `STAMP` item; the old text stays after it as `Prior: …`):

`2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL).`

---

## `docs/deploy.md`

### DOC-B1 — `docs/deploy.md:L3` — STAMP
CURRENT: `_Last audited: 2026-10-16 (signed-in home page: hero carousel, … `CourseThumbnail` under `src/components/shared`). Prior: 2026-09-16 (added `e2e-browser.yml` … ); 2026-07-09 (GitHub Actions secrets list + workflow YAML snippet); 2026-06-17._`
REPLACEMENT: `_Last audited: 2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL). Prior: 2026-10-16 (signed-in home page: hero carousel, Complete your Course, Trending Course and Popular Instructor read the catalog and learner-courses APIs; temporary `/courses/[slug]` placeholder; `UserAvatar` and `CourseThumbnail` under `src/components/shared`). Prior: 2026-09-16 (added `e2e-browser.yml` browser-test workflow — runs on PRs unlike `deploy-dev.yml`; `test` job now runs the real Jest suite, not a placeholder — see `docs/testing.md`). Prior: 2026-07-09 (CI secrets: dev implemented + stg/main placeholder names); 2026-07-09 (GitHub Actions secrets list + workflow YAML snippet); 2026-06-17._`

### DOC-B2 — `docs/deploy.md:L22` — REPLACE (Quick Reference)
CURRENT: `| Required env var | `NEXT_PUBLIC_API_URL` (must be set **before** `npm run build`) |`
REPLACEMENT: `| Required env vars | `NEXT_PUBLIC_API_URL` (must be set **before** `npm run build`); `SITE_URL` (server-only, **runtime** — read from the env file at `next start`, never at build; the server refuses to start without a valid value — see [`SITE_URL`](#site_url)) |`

### DOC-B3 — `docs/deploy.md:L26` — FRAGMENT (Quick Reference, GitHub Actions row)
old: `separate from `deploy-dev.yml`) — see [`testing.md`](./testing.md) ([Appendix G](#appendix-g--cicd-github-actions)) |`
new: `separate from `deploy-dev.yml`) — see [`testing.md`](./testing.md) ([Appendix G](#appendix-g--cicd-github-actions)). `SITE_URL` is not a GitHub Actions secret and no workflow sets it for the build. |`

### DOC-B4 — `docs/deploy.md:L44` — REPLACE (Step 1, empty item "5. ")
CURRENT: `5. `
REPLACEMENT: `5. **Public site origin:** Decide the canonical frontend origin (e.g. `https://yourdomain.net` or `https://www.yourdomain.net`) — the same host used for the OAuth callback URLs. This is the value for the runtime variable `SITE_URL` (pure `https` origin, no path). Dev and staging servers use their own domain, never the production one.`

### DOC-B5 — `docs/deploy.md:L157` — INSERT (Step 7, after the "Required variables" ini block line 156, inside the fence)
REPLACEMENT (new lines after `NEXT_PUBLIC_API_URL=https://api.yourdomain.net`):
```ini

# Canonical public origin of THIS frontend — server-only, read at runtime (not at build).
# Pure https origin: no path, query, hash or credentials. Localhost/loopback is rejected
# when the server runs with NODE_ENV=production (next start), including dev and staging.
# Feeds metadataBase, canonical, hreflang, robots.txt and sitemap.xml. The server fails to
# start with SiteConfigError when it is missing or invalid.
SITE_URL=https://yourdomain.net
```

### DOC-B6 — `docs/deploy.md:L180` — INSERT (variable reference table, after the `API_URL` row)
REPLACEMENT: `| `SITE_URL` | **Yes** (all `next start` servers) | Server only, **runtime** | Canonical frontend origin used by `src/lib/seo/site-config.ts` (`resolveSiteConfig`) for `metadataBase`, canonical, hreflang, `/robots.txt` and `/sitemap.xml`. Pure `https` origin; loopback hosts are rejected under `NODE_ENV=production`. Validated at server start by `src/instrumentation.ts`. Not a `NEXT_PUBLIC_*` variable, not a build arg, not a CI secret. |`

### DOC-B7 — `docs/deploy.md:L190` — INSERT (after the `NEXT_PUBLIC_*` warning)
REPLACEMENT: `> **`SITE_URL` is the opposite of `NEXT_PUBLIC_*`:** it is **never** baked into the bundle. It is read per request on the server, so changing it needs only a process restart (`pm2 reload … --update-env`), not a rebuild. `npm run build` succeeds with `SITE_URL` unset; `next start` does not.`

### DOC-B8 — `docs/deploy.md:L271` — INSERT (Step 9, after the nginx block closing fence at L271)
REPLACEMENT: `The vhost needs no SEO-specific rule: `/robots.txt` and `/sitemap.xml` are served by Next.js (no static file in nginx), and nginx has no `proxy_cache` for pages (`location /` sets `proxy_cache off`; only `/_next/static/` is cached). The signed-in redirect on `/{locale}` therefore always reaches the Next.js proxy.`

### DOC-B9 — `docs/deploy.md:L320` — FRAGMENT (Step 11)
old: ``env_file` defaults are `.env.local` (dev), `.env.staging` (staging), `.env.prod` (prod).`
new: `The server env files `.env.local` (dev), `.env.staging` (staging) and `.env.prod` (prod) are the `env_file` defaults and must contain `SITE_URL` for that environment (runtime-only: PM2 passes it to `next start`, nothing is injected at build).`

### DOC-B10 — `docs/deploy.md:L354` — INSERT (PM2 example `env`, after `API_URL: 'https://api.yourdomain.net',`)
REPLACEMENT: `        SITE_URL: 'https://yourdomain.net',`

### DOC-B11 — `docs/deploy.md:L361` — INSERT (after the "Note on `NEXT_PUBLIC_*` in PM2")
REPLACEMENT: `> **Note on `SITE_URL` in PM2:** unlike `NEXT_PUBLIC_API_URL`, `SITE_URL` is a pure runtime variable — setting it here (or in the `env_file`) is sufficient and no rebuild is needed. If it is missing or invalid, the process exits at start with `SiteConfigError` (see [Troubleshooting](#siteconfigerror-on-start-server-or-container-exits-immediately)).`

### DOC-B12 — `docs/deploy.md:L383-L391` — REPLACE (Step 12 curl block)
CURRENT:
```bash
# HTTPS loads with locale redirect
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" https://yourdomain.net
# Expected: 307 https://yourdomain.net/vi   (or 200 if middleware redirect happens in Next.js)

# Vietnamese home page
curl -sS -o /dev/null -w "%{http_code}\n" https://yourdomain.net/vi

# English home page
curl -sS -o /dev/null -w "%{http_code}\n" https://yourdomain.net/en
```
REPLACEMENT:
```bash
# HTTPS loads with locale redirect
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" https://yourdomain.net
# Expected: 307 https://yourdomain.net/vi

# Vietnamese home page (guest: no auth cookies)
curl -sS -o /dev/null -w "%{http_code}\n" https://yourdomain.net/vi
# Expected: 200

# English home page (guest)
curl -sS -o /dev/null -w "%{http_code}\n" https://yourdomain.net/en
# Expected: 200

# Signed-in redirect: both refresh_token and session_id cookies present
curl -sS -o /dev/null -D - -H "Cookie: refresh_token=x; session_id=y" https://yourdomain.net/vi \
  | grep -i -E "^(HTTP|location|cache-control|vary)"
# Expected: 307, location: https://yourdomain.net/vi/home, cache-control: private, no-store, vary: Cookie

# Only one of the two cookies (or none) keeps the guest page
curl -sS -o /dev/null -w "%{http_code}\n" -H "Cookie: refresh_token=x" https://yourdomain.net/vi
# Expected: 200

# SEO files (the host in the output must be SITE_URL)
curl -sS https://yourdomain.net/robots.txt
# Expected: 200, "Sitemap: https://yourdomain.net/sitemap.xml"
curl -sS https://yourdomain.net/sitemap.xml
# Expected: 200, <loc> entries on the SITE_URL host with hreflang alternates (vi, en, x-default)
```

### DOC-B13 — `docs/deploy.md:L395` — FRAGMENT (Step 12 manual check 1)
old: `should redirect to `/vi` and render the home page (header, body, **footer** with `commonFooter` copy).`
new: `should redirect to `/vi` and render the guest home page (header, body, **footer** with `commonFooter` copy). While logged in, opening `https://yourdomain.net/vi` (or `/en`) must redirect to `/vi/home`.`

### DOC-B14 — `docs/deploy.md:L399` — INSERT (Step 12 manual checks, after item 5)
REPLACEMENT:
`6. View source of `https://yourdomain.net/vi` — `<link rel="canonical">`, `hreflang` alternates and `og:url` use the `SITE_URL` host; `/vi/home` carries `noindex`.`
`7. **Cloudflare / CDN (outside the repo):** confirm no cache rule or "Cache Everything" page rule covers `/`, `/vi` or `/en`; the signed-in redirect is per user (`Vary: Cookie`, `Cache-Control: private, no-store`) and a shared cache would serve one visitor's redirect to everyone.`

### DOC-B15 — `docs/deploy.md:L407-L409` — INSERT/REPLACE (Step 13 Frontend checklist)
CURRENT L409: `  [ ] src/proxy.ts exists and locale routing is enforced.`
REPLACEMENT:
```
  [ ] SITE_URL is set in the server env file (.env.local / .env.staging / .env.prod) to this environment's own https origin (no path; not the production domain on dev/staging) and the process started without SiteConfigError.
  [ ] src/proxy.ts exists, locale routing is enforced and a signed-in visit to /vi or /en redirects to /{locale}/home.
```

### DOC-B16 — `docs/deploy.md:L427` — INSERT (Step 13 Integration checklist, after the footer line)
REPLACEMENT:
```
  [ ] /robots.txt and /sitemap.xml return 200 and reference the SITE_URL host.
  [ ] Cloudflare / CDN does not cache /, /vi or /en (no "Cache Everything"); nginx has no page cache.
```

### DOC-B17 — `docs/deploy.md:L463` — INSERT (Appendix B table, after the `API_URL` row)
REPLACEMENT: `| `SITE_URL` | **Yes** (every `next start`) | ❌ not read at build | ✅ Server only (request time + `src/instrumentation.ts` at start) | Canonical frontend origin: pure `https` origin, no path/query/hash/userinfo, non-loopback in production (`http://localhost[:port]` / `http://127.0.0.1[:port]` accepted only outside production). Feeds metadata, `/robots.txt`, `/sitemap.xml`. Same host as the OAuth callback origins. |`

### DOC-B18 — `docs/deploy.md:L473` — REPLACE (Appendix B note)
CURRENT: `> **Build-time only:** because `NEXT_PUBLIC_*` are inlined during `next build`, setting these in the PM2 / container runtime env file has **no effect** on the browser bundle. They must be provided to whatever runs `next build` — the CI `build` job (via GitHub Secrets/Variables) or the Docker build-args — and you must **rebuild** after changing them.`
REPLACEMENT: `> **Build-time only:** because `NEXT_PUBLIC_*` are inlined during `next build`, setting these in the PM2 / container runtime env file has **no effect** on the browser bundle. They must be provided to whatever runs `next build` — the CI `build` job (via GitHub Secrets/Variables) or the Docker build-args — and you must **rebuild** after changing them. `SITE_URL` is the reverse: runtime-only, supplied through the env file (PM2 `env_file` / Docker `env_file`), never a CI secret or build arg, and changed with a restart only.`

### DOC-B19 — `docs/deploy.md:L477-L495` — REPLACE (Appendix C heading text kept; body)
CURRENT:
```
## Appendix C — Middleware (Locale Routing)

`src/proxy.ts` contains the `next-intl` locale proxy middleware:

// src/proxy.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);
... matcher ...

Project uses `src/proxy.ts` as locale proxy middleware entry. Keep this file in place and ensure matcher remains correct.
```
REPLACEMENT (the fenced snippet is the final proxy shape; keep the matcher array unchanged):
```
## Appendix C — Middleware (Locale Routing)

`src/proxy.ts` wraps the `next-intl` locale proxy and adds the signed-in redirect:

```ts
// src/proxy.ts (shape)
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // 1. next-intl resolves the locale (`/` -> 307 `/{locale}`).
  // 2. Exact locale root (`/vi`, `/en`, optional trailing slash) + BOTH cookies
  //    `refresh_token` and `session_id` (names from src/constants/auth-cookie.ts)
  //    -> 307 `/{locale}/home` with `Cache-Control: private, no-store` and `Vary: Cookie`
  //    (next-intl's Set-Cookie is copied onto the redirect).
  // 3. Any other request passes through the next-intl response unchanged.
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|auth/discord/callback|auth/x/callback|.*\\..*).*)",
  ],
};
```

Project uses `src/proxy.ts` as the locale proxy and signed-in redirect entry. Keep this file in place and ensure the matcher remains correct. The matcher excludes every path containing a dot, so `/robots.txt` and `/sitemap.xml` (served by `src/app/robots.ts` and `src/app/sitemap.ts`) bypass the proxy.

**Caching:** nginx has no page cache (`location /` sets `proxy_cache off`; only `/_next/static/` is cached), so no nginx change is needed for the redirect. Cloudflare / CDN cache rules live outside this repo — check manually that `/`, `/vi` and `/en` are not cached (no "Cache Everything"), otherwise one visitor's redirect can be served to others.
```

### DOC-B20 — `docs/deploy.md:L501-L512` — REPLACE (Appendix C verification curls)
CURRENT: the block `curl … http://127.0.0.1:3000/` … `# Expected: 307  http://127.0.0.1:3000/vi` … `# Expected: 200 (no redirect to /vi/auth/discord/callback)` … `# Expected: 404 (no locale-prefixed callback page — by design)`
REPLACEMENT: `Verify locale redirect, the signed-in redirect, SEO files and OAuth callback reachability:`
```bash
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" http://127.0.0.1:3000/
# Expected: 307  http://127.0.0.1:3000/vi

curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/vi
# Expected: 200 (guest)

curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" -H "Cookie: refresh_token=x; session_id=y" http://127.0.0.1:3000/vi
# Expected: 307  http://127.0.0.1:3000/vi/home   (Cache-Control: private, no-store; Vary: Cookie)

curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/robots.txt
# Expected: 200 (served by src/app/robots.ts, not the proxy)

curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/sitemap.xml
# Expected: 200

curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" http://127.0.0.1:3000/auth/discord/callback
# Expected: 200 (no redirect to /vi/auth/discord/callback)

curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/vi/auth/discord/callback
# Expected: 404 (no locale-prefixed callback page — by design)
```
(The first two `curl`s run against a loopback server that started successfully, i.e. `SITE_URL` was valid.)

### DOC-B21 — `docs/deploy.md:L541` — INSERT (Appendix D, after the `pm2 reload` note)
REPLACEMENT: `> `SITE_URL` is read from the env file at process start. If the release changes it, reload with `pm2 reload ecosystem.config.cjs --only <app> --update-env`; an invalid value makes the new instance exit with `SiteConfigError` (no rebuild is involved).`

### DOC-B22 — `docs/deploy.md:L623` — FRAGMENT (Appendix G build job paragraph)
old: `Because the bundle is built in CI, `NEXT_PUBLIC_API_URL` and other required `NEXT_PUBLIC_*` values must remain available in the CI build environment.`
new: `Because the bundle is built in CI, `NEXT_PUBLIC_API_URL` and other required `NEXT_PUBLIC_*` values must remain available in the CI build environment. `SITE_URL` is not one of them: every consumer is request-time (all routes are dynamic; `robots.ts` and `sitemap.ts` are `force-dynamic`), `npm run build` passes with it unset, and it is supplied only by the server env file.`

### DOC-B23 — `docs/deploy.md:L631` — FRAGMENT (browser tests paragraph)
old: `starts `next start`, runs Playwright against Chromium`
new: `starts `next start` with the fake site origin `https://e2e.example.test` as `SITE_URL` (`serverEnv` in `scripts/e2e-lifecycle.mjs`), runs Playwright against Chromium`

### DOC-B24 — `docs/deploy.md:L662` — INSERT (Dev secret table, after the "Minimum for dev social login" line)
REPLACEMENT: `**`SITE_URL` is not a secret:** there is no `SITE_URL_DEV` and nothing maps to `SITE_URL` in the build job `env`. The dev server gets it from `.env.local` on the VPS (PM2 `env_file`), set to the dev domain (never the production one).`

### DOC-B25 — `docs/deploy.md:L666` — FRAGMENT (Staging placeholder intro)
old: `runtime env **`.env.staging`**.`
new: `runtime env **`.env.staging`** (carries `SITE_URL` set to the staging domain; no `SITE_URL_STG` secret).`

### DOC-B26 — `docs/deploy.md:L683` — FRAGMENT (Production placeholder intro)
old: `runtime env **`.env.prod`**.`
new: `runtime env **`.env.prod`** (carries `SITE_URL` set to the production origin; no `SITE_URL_MAIN` secret).`

### DOC-B27 — `docs/deploy.md:L830` — INSERT (Notes, after the `AUTH_COOKIE_DOMAIN` bullet)
REPLACEMENT: `- **`SITE_URL`** — server-only **runtime** variable supplied by the environment's env file (`.env.local` / `.env.staging` / `.env.prod` through PM2 `env_file`, or Docker `env_file`). It is not a GitHub Actions secret and is not added to any `env:` block or build step of `deploy-dev.yml`; the restored deploy job reloads PM2 with `--update-env` and the env file supplies the value.`

### DOC-B28 — `docs/deploy.md:L871` — REPLACE (Troubleshooting, anchor fix and wording)
CURRENT: `The middleware file is not registered. See [Appendix C](#appendix-c--middleware-locale-routing-fix).`
REPLACEMENT: `The proxy file is not registered. See [Appendix C](#appendix-c--middleware-locale-routing).`

### DOC-B29 — `docs/deploy.md:L878` — INSERT (Troubleshooting, after the locale-redirect entry)
REPLACEMENT:
```
### Signed-in visitors are not redirected from `/vi` or `/en` to `/vi/home`

The proxy redirects only when **both** `refresh_token` and `session_id` cookies are sent. Check in DevTools that both exist for the FE host (see `AUTH_COOKIE_DOMAIN`). If the redirect works against `http://127.0.0.1:3000` but not through the public URL, a cache in front of the app is serving a stored response: Cloudflare / CDN must not cache `/`, `/vi`, `/en` (no "Cache Everything"). nginx itself has no page cache.

### `SiteConfigError` on start (server or container exits immediately)

`SITE_URL` is missing or invalid. Fix the env file used by the process and restart (no rebuild needed):

```bash
pm2 logs mycourse-web-dev --lines 50   # look for SiteConfigError
grep -n '^SITE_URL=' .env.local        # or .env.staging / .env.prod
```

Typical causes: variable not set in the env file; value has a path, query, hash or credentials (`https://example.com/app`); `http://` used in production; `localhost` / `127.0.0.1` used on a `next start` server (dev, staging and prod servers all run with `NODE_ENV=production`). Use a pure `https` origin of that environment's own domain, e.g. `SITE_URL=https://yourdomain.net`.

### `/robots.txt` or `/sitemap.xml` shows the wrong host

Both are generated per request from `SITE_URL`. Correct the value in the env file and restart; they do not depend on the build or on the request `Host` header.
```

### DOC-B30 — `docs/deploy.md:L920` — REPLACE (Appendix I)
CURRENT: `| Middleware (locale routing) | `src/proxy.ts` | See Appendix C |`
REPLACEMENT: `| Middleware (locale routing + signed-in redirect) | `src/proxy.ts` | next-intl proxy plus `/{locale}` to `/{locale}/home` redirect for requests with both auth cookies; cookie names in `src/constants/auth-cookie.ts` — see Appendix C |`

### DOC-B31 — `docs/deploy.md:L920` — INSERT (Appendix I, new rows after the proxy row)
REPLACEMENT:
`| Site origin config | `src/lib/seo/site-config.ts` | `resolveSiteConfig` reads runtime `SITE_URL` and throws `SiteConfigError` on an invalid value — see [`SITE_URL`](#site_url) |`
`| Startup validation | `src/instrumentation.ts` | `register()` validates `SITE_URL` at server start (nodejs runtime, `NODE_ENV=production`, skipped during `next build`) |`
`| robots.txt / sitemap.xml | `src/app/robots.ts`, `src/app/sitemap.ts` | `dynamic = "force-dynamic"`; served outside `src/proxy.ts` (matcher excludes dotted paths); no static copy in `public/` or nginx |`

### DOC-B32 — `docs/deploy.md:L952` — FRAGMENT (Appendix J)
old: `**[`docs/docker.md`](docker.md)** — `NEXT_PUBLIC_*` build-args, port matrix, Swarm demo (not for CI).`
new: `**[`docs/docker.md`](docker.md)** — `NEXT_PUBLIC_*` build-args, runtime-only `SITE_URL` through `env_file`, port matrix, Swarm demo (not for CI).`

### DOC-B33 — `docs/deploy.md:L959-L966` — REPLACE (rename heading; no inbound anchors exist, verified by grep)
CURRENT:
```
## Planned SITE_URL (take-note — not configured this phase)

Future **server-side only** `SITE_URL` must be a pure absolute `https://` frontend **origin** (…). It feeds `metadataBase`, canonical, hreflang, sitemap, and absolute OG URLs via `src/lib/seo/site-config.ts`.

- Reject values like `https://example.com/app` or `https://example.com?x=1` — …
- Do **not** treat `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_SITE_URL` as the site canonical origin.
- This phase does **not** change `.env`, `.env.example`, nginx, or PM2.
- Existing nginx security headers (…) remain the deploy baseline; … See [`seo-ranking-setup.md`](./seo-ranking-setup.md) and [`security-hardening-notes.md`](./security-hardening-notes.md).
```
REPLACEMENT:
```
## SITE_URL

`SITE_URL` is the **server-only, runtime-only** canonical origin of this frontend. It feeds `metadataBase`, canonical, hreflang, absolute OG URLs, `/robots.txt` and `/sitemap.xml` through `resolveSiteConfig` in `src/lib/seo/site-config.ts`.

- **Where it comes from:** the per-environment env file (`.env.local` for dev, `.env.staging`, `.env.prod`) via PM2 `env_file` and Docker `env_file`. It is never `NEXT_PUBLIC_`, never a Docker build arg and never a GitHub Actions secret; no CI build step sets it, and `npm run build` passes with it unset (all routes are dynamic; `robots.ts` and `sitemap.ts` are `force-dynamic`).
- **Contract:** a pure absolute origin — scheme + host [+ port], pathname `/` or empty, **no** username/password, **no** query, **no** hash; the trailing slash is normalized away. Values such as `https://example.com/app` or `https://example.com?x=1` are rejected, not stripped. Under `NODE_ENV=production` (every `next start`: dev, staging and prod servers) the scheme must be `https` and the host must not be loopback; outside production `http://localhost[:port]` and `http://127.0.0.1[:port]` are also accepted.
- **Start-up validation:** `src/instrumentation.ts` `register()` validates it when the server starts (nodejs runtime, `NODE_ENV=production`, skipped during `next build`). A missing or invalid value stops the PM2 process or container with `SiteConfigError` instead of returning 500 on the homepage.
- **Which host:** the same host (www or apex) as the OAuth callback origins. Dev and staging use their own domain, never the production one. The e2e server uses the fake origin `https://e2e.example.test`.
- Do **not** treat `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_SITE_URL` as the site canonical origin.
- nginx is unchanged (no page cache, no static robots/sitemap). Existing nginx security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) remain the deploy baseline; FE `security-headers-presets.ts` is an inactive draft aligned with them. Cloudflare / CDN cache rules are outside the repo and must not cache `/`, `/vi`, `/en`. See [`seo-ranking-setup.md`](./seo-ranking-setup.md) and [`security-hardening-notes.md`](./security-hardening-notes.md).
```

---

## `docs/docker.md` (no audit header)

### DOC-B34 — `docs/docker.md:L34` — INSERT (Quick start, after `# Set NEXT_PUBLIC_API_URL (must match your API — local or cloud)`)
REPLACEMENT: `# Set SITE_URL (runtime env_file value; the container runs next start with NODE_ENV=production, so it must be a non-loopback https origin or the container exits with SiteConfigError)`

### DOC-B35 — `docs/docker.md:L85` — INSERT (Dockerfile section, after the OAuth build-arg bullet)
REPLACEMENT: `  - **Not a build-arg:** `SITE_URL` (server-only runtime variable; `npm run build` passes without it)`

### DOC-B36 — `docs/docker.md:L92` — REPLACE
CURRENT: ``AUTH_COOKIE_DOMAIN` is **runtime** only (Server Actions) — set in env file, not build-args.`
REPLACEMENT: ``AUTH_COOKIE_DOMAIN` (Server Actions) and `SITE_URL` (canonical origin for metadata, `/robots.txt`, `/sitemap.xml`) are **runtime** only — set them in the env file (`env_file` in `docker/compose.*.yml`), never as build-args. `src/instrumentation.ts` validates `SITE_URL` when the container starts: a missing value, a path, `http://` or a loopback host makes the container exit with `SiteConfigError` (check `docker compose -f docker/compose.<env>.yml logs`). Use the environment's own https domain; dev and staging never use the production one.`

### DOC-B37 — `docs/docker.md:L102` — INSERT (Rebuild section, after "Changing env in a running container without rebuild does not update the browser bundle.")
REPLACEMENT: `Changing `SITE_URL` needs no rebuild: edit the env file and recreate the container (`docker compose -f docker/compose.<env>.yml up -d --force-recreate`), because `env_file` is read when the container is created.`

---

## `README.md` (no audit header)

### DOC-B38 — `README.md:L5` — REPLACE
CURRENT: `> **Locale routing:** Next.js **16** uses **`src/proxy.ts`** (not `middleware.ts`) for the `next-intl` locale proxy. Keep that file in place — see [`docs/deploy.md` Appendix C](docs/deploy.md#appendix-c--middleware-locale-routing-fix).`
REPLACEMENT: `> **Locale routing and signed-in redirect:** Next.js **16** uses **`src/proxy.ts`** (not `middleware.ts`) for the `next-intl` locale proxy. The same proxy redirects a signed-in visitor (both `refresh_token` and `session_id` cookies) from `/vi` or `/en` to `/{locale}/home`. Keep that file in place — see [`docs/deploy.md` Appendix C](docs/deploy.md#appendix-c--middleware-locale-routing).`

### DOC-B39 — `README.md:L16` — REPLACE
CURRENT: `Open the URL Next.js prints (default [http://localhost:3000](http://localhost:3000)). The root route redirects into the default locale (`vi`); localized paths look like `/vi` or `/en`.`
REPLACEMENT: `Open the URL Next.js prints (default [http://localhost:3000](http://localhost:3000)). The root route redirects into the default locale (`vi`); localized paths look like `/vi` or `/en` (guest home). A signed-in visitor on `/vi` or `/en` is redirected to `/vi/home` or `/en/home`. `/robots.txt` and `/sitemap.xml` are generated from the runtime `SITE_URL` (see Environment Variables).`

### DOC-B40 — `README.md:L81` — FRAGMENT (docs index, seo-ranking-setup row)
old: `unused helpers under `src/lib/seo|performance|security/web`; A/B/C reuse tables;`
new: `home metadata, `robots.txt`/`sitemap.xml`, `noindex` on `/home` and the runtime `SITE_URL` contract in `src/lib/seo`; helpers under `src/lib/performance|security/web`; A/B/C reuse tables;`

### DOC-B41 — `README.md:L85` — FRAGMENT (docs index, deploy row)
old: `env vars (`NEXT_PUBLIC_API_URL`, `AUTH_COOKIE_DOMAIN`, stream URLs)`
new: `env vars (`NEXT_PUBLIC_API_URL`, runtime-only `SITE_URL`, `AUTH_COOKIE_DOMAIN`, stream URLs)`

### DOC-B42 — `README.md:L86` — FRAGMENT (docs index, docker row)
old: `| Docker Compose alternative (local/VPS manual; PM2/CI unchanged) |`
new: `| Docker Compose alternative (local/VPS manual; PM2/CI unchanged; `SITE_URL` is a runtime `env_file` value, not a build-arg) |`

### DOC-B43 — `README.md:L108` — FRAGMENT (CI secrets intro paragraph)
old: `(today: **`_DEV` only** on `dev` pushes).`
new: `(today: **`_DEV` only** on `dev` pushes). `SITE_URL` is **not** a GitHub Actions secret: it is a server-only runtime variable read from the environment's env file, and no workflow sets it for the build. The Dev, Staging and Production secret tables are unchanged.`

### DOC-B44 — `README.md:L171` — INSERT (Environment Variables table, after the `API_URL` row)
REPLACEMENT: `| `SITE_URL` | **Yes** for `next start` (all deployed environments) | Server only, **runtime** | Canonical frontend origin for metadata, `/robots.txt` and `/sitemap.xml`. Pure `https` origin (no path/query/hash/userinfo), not loopback in production; `http://localhost[:port]` accepted only outside production. Not read at build; validated at server start (`SiteConfigError` if invalid). | `https://yourdomain.net` (local `next dev`: `http://localhost:3000`) |`

### DOC-B45 — `README.md:L176` — INSERT (after the `ApiTransport` paragraph)
REPLACEMENT: `` `SITE_URL` is resolved by `resolveSiteConfig` (`src/lib/seo/site-config.ts`) and validated at server start by `src/instrumentation.ts`. It is supplied through the per-environment env file (`.env.local`, `.env.staging`, `.env.prod`; PM2 `env_file`, Docker `env_file`) — never `NEXT_PUBLIC_`, a build-arg or a CI secret. See [`docs/deploy.md`](docs/deploy.md#site_url). ``

---

## Env example files (comments stay Vietnamese like the rest of each file; KIND INSERT, exact lines)

### DOC-B46 — `.env.example` — INSERT after L10 (`# API_URL=http://localhost:8080`), followed by a blank line
```
# Origin công khai của frontend — chỉ dùng phía server, chỉ đọc lúc runtime (không đọc lúc build, không phải NEXT_PUBLIC_).
# Phải là origin thuần (không path/query/hash/userinfo). Production (next start) bắt buộc https, không dùng localhost;
# http://localhost[:port] chỉ hợp lệ ngoài production (next dev). Thiếu/sai → server không khởi động (SiteConfigError).
SITE_URL=http://localhost:3000
```

### DOC-B47 — `.env.local.example` — INSERT after L7 (`# API_URL=http://localhost:8080`), followed by a blank line
```
# Origin công khai của frontend — chỉ server, chỉ runtime (không phải NEXT_PUBLIC_, không build-arg). Origin thuần, không path.
# Production (next start, gồm docker compose local) bắt buộc https và không loopback; http://localhost[:port] chỉ dùng với next dev.
# Thiếu/sai → server không khởi động (SiteConfigError).
SITE_URL=http://localhost:3000
```

### DOC-B48 — `.env.dev.example` — INSERT after L6 (`# API_URL=https://api.yourdomain.net`)... placed before `# AUTH_COOKIE_DOMAIN`; keep L7 after it. Add blank-line-free block:
```
# Origin công khai của frontend dev — chỉ server, chỉ runtime (không phải NEXT_PUBLIC_, không build-arg). Origin thuần, không path.
# next start luôn là production: bắt buộc https, không localhost. Dùng domain dev riêng, KHÔNG dùng domain production.
SITE_URL=https://dev.example.com
```

### DOC-B49 — `.env.staging.example` — INSERT after L5 (`# API_URL=https://api-staging.example.com`)
```
# Origin công khai của frontend staging — chỉ server, chỉ runtime (không phải NEXT_PUBLIC_, không build-arg). Origin thuần, không path.
# next start luôn là production: bắt buộc https, không localhost. Dùng domain staging riêng, KHÔNG dùng domain production.
SITE_URL=https://staging.example.com
```

### DOC-B50 — `.env.prod.example` — INSERT after L5 (`# API_URL=https://api.example.com`)
```
# Origin công khai của frontend production — chỉ server, chỉ runtime (không phải NEXT_PUBLIC_, không build-arg). Origin thuần, không path.
# Bắt buộc https, không localhost. Cùng host (www hoặc apex) với origin callback OAuth. Thiếu/sai → server không khởi động (SiteConfigError).
SITE_URL=https://example.com
```

---

## Scanned, no change needed

| File | Reason |
|------|--------|
| `Dockerfile` | `SITE_URL` is runtime-only: no `ARG`/`ENV` for it; the build (`npm run build`) passes with it unset and the value arrives at `docker run`/compose through `env_file`. |
| `docker/compose.local.yml`, `compose.dev.yml`, `compose.staging.yml`, `compose.prod.yml` | `build.args` lists only `NEXT_PUBLIC_*` (correct: `SITE_URL` must not be a build arg); each already uses `env_file` which delivers `SITE_URL` to the container. |
| `docker/stack.*.yml` | Swarm demo uses the same image and env mechanism; runtime variable needs no entry. |
| `scripts/docker/*` (`_lib.sh`, `_lib.ps1`, `compose-up.*`, `build-image.*`, `health-check.*`, `swarm-deploy.sh`) | Scripts export only `NEXT_PUBLIC_*` build-args; `SITE_URL` is not a build arg. `health-check` accepts 200/307/308, which still holds (guest `/` 307, `/vi` 200). |
| `ecosystem.config.cjs` | Already loads `env_file` (`DEPLOY_ENV_FILE_DEV/STG/MAIN`), so `SITE_URL` in `.env.local`/`.env.staging`/`.env.prod` reaches `next start` with no config change. |
| `deploy/nginx/nginx.conf` | No `proxy_cache` for pages (`location /` has `proxy_cache off`), only `/_next/static/` is cached; `/robots.txt` and `/sitemap.xml` are proxied to Next.js (no static file). The signed-in redirect needs no nginx rule. |
| `next.config.ts` | Nothing reads `SITE_URL` at build time; no `env` entry or header change. |
| `.github/workflows/*.yml` (`deploy-dev.yml`, `e2e-browser.yml`, `enforce-main-from-dev.yml`) | `SITE_URL` is runtime-only and not a CI secret; every consumer is request-time so `npm run build` passes unset. The e2e lifecycle injects `https://e2e.example.test` from `scripts/e2e-lifecycle.mjs`, not from the workflow. The mirrored YAML block in `docs/deploy.md` (L712-L819) therefore stays byte-identical. |
| `.dockerignore` | Excludes env files from the image context; `SITE_URL` is not baked into the image, so nothing to add. |
| `docs/delivery.md`, `docs/delivery/*.md` | Realtime channel env vars only; unrelated to site origin or the locale-root redirect. |
| `docs/dependencies.md` | No new package is introduced (next-intl, Next metadata/instrumentation APIs already present). |
| `docs/deploy.md` Appendix A diagram (L432-L453), Steps 2-6, 8, 10 and Appendix H `canvas`/502/TLS entries, Appendix D commands | Topology and commands unaffected; only the notes called out above change. |
| `README.md` CI secrets tables (Dev/Staging/Production), `Files Added / Modified` table (`.env` row), Dev performance section | Secret tables unchanged because `SITE_URL` is not a secret (explained by DOC-B43); the `.env` row documents the historical login change. |

---

# Documentation Update Inventory — Part C (architecture, routing, screens, modules, flow, components, assets)

Scope: `docs/router.md`, `docs/pages.md`, `docs/screens.md`, `docs/architecture.md`, `docs/folder-structure.md`, `docs/modules.md`, `docs/flow.md`, `docs/logic-flow.md`, `docs/components.md`, `docs/reusable-assets.md`. Line numbers are `HEAD 0f884da`; re-locate by quote. Conventions: `REPLACE` = replace the quoted line(s); `FRAGMENT` = inside the quoted line replace exactly `old` with `new`; `INSERT` = new line(s) after the quoted anchor; `STAMP` = prepend the standard sentence inside the `_Last audited: ..._` line and keep the previous text as `Prior: ...`. All documents are English.

Standard stamp text (every STAMP item; the previous text after `_Last audited: ` becomes `Prior: <previous text>` at the end of the same line, replacing the leading date-and-parentheses with the new sentence):

`2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL).`

Shared facts used below: post-auth default destination is the single constant `defaultPostAuthHref` (`= signedInHomeHref`, `/home`) in `src/lib/navigation/routes.ts`, used by `login-content.tsx`, `use-oauth-post-auth.ts`, `use-redirect-if-authenticated.ts`, `login-signup-popup.tsx`, `confirm-email-content.tsx`. Unchanged `homeHref` users: logout redirect, brand logo/header links, `navigateToHome`, not-found/status-error "back to home", global-error, canonical default.

---

## `docs/router.md`

### DOC-C1 — docs/router.md:L3 — STAMP
CURRENT: `_Last audited: 2026-10-16 (signed-in home page: hero carousel, Complete your Course, ...` (stamp line)
REPLACEMENT: standard stamp text, then `Prior: 2026-10-16 (signed-in home page: ...` (rest unchanged).

### DOC-C2 — docs/router.md:L14 — FRAGMENT
CURRENT: `| Locale routing | next-intl proxy middleware | `src/proxy.ts` |`
old: `next-intl proxy middleware`
new: `next-intl proxy middleware plus the signed-in `/{locale}` redirect`

### DOC-C3 — docs/router.md:L40 — REPLACE
CURRENT: `Root `/` automatically redirects to `/vi` (default locale) via `src/app/page.tsx`.`
REPLACEMENT: `Root `/` is redirected by the next-intl middleware to `/{locale}` (307; `/vi` by default). `src/app/page.tsx` (using `routing.defaultLocale`) is the fallback if the proxy does not run. A signed-in browser then takes a second hop from `/{locale}` to `/{locale}/home` (see "Middleware: Locale Enforcement and Signed-in Home Redirect").`

### DOC-C4 — docs/router.md:L44-L56 — REPLACE (heading, intro, quote, code block)
CURRENT:
```text
## Middleware: Locale Enforcement

`src/proxy.ts` exports the next-intl middleware that enforces locale prefixes on every request **except** locale-less OAuth callback routes.

> `src/proxy.ts` is the active locale proxy entry used in this project.

```ts
// src/proxy.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);
```
REPLACEMENT:
```text
## Middleware: Locale Enforcement and Signed-in Home Redirect

`src/proxy.ts` wraps the next-intl middleware (`createMiddleware(routing)`). It enforces locale prefixes on every request **except** locale-less OAuth callback routes and any path containing a dot (so `/robots.txt` and `/sitemap.xml` bypass it), and it redirects signed-in visitors from the locale root to `/{locale}/home`.

> `src/proxy.ts` is the active locale proxy entry used in this project.

- **Locale root only:** the redirect applies when the pathname is exactly `/vi` or `/en` (an optional trailing slash is accepted).
- **Session check (presence only):** both cookies `refresh_token` and `session_id` must be present; the token is not validated. The pure decision lives in `src/lib/navigation/signed-in-home-redirect.ts` (`resolveSignedInHomeRedirectPath({ pathname, hasSession })`, `hasAuthSessionCookies(cookies)`); cookie names come from `src/constants/auth-cookie.ts`.
- **Response:** 307 to `/{locale}/home` with `Cache-Control: private, no-store` and `Vary: Cookie`; the Set-Cookie headers produced by next-intl are copied onto the redirect. The guest page is a dynamic response (`Cache-Control: private, no-cache, no-store`), so shared caches never store it.
- **Two hops from `/`:** `/` is first redirected by next-intl to `/{locale}` (307) and then handled by the rule above.
- **Crawlers:** bots send no auth cookies, so they always receive the public homepage.
- **No redirect loop:** `/{locale}/home` is a client-side login gate and never redirects back to `/`; a stale cookie only leads a guest to the sign-in prompt.

```ts
// src/proxy.ts (shape)
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // locale-root + auth cookies -> 307 /{locale}/home (private, no-store, Vary: Cookie)
  // otherwise handleI18nRouting(request)
}
```
```

### DOC-C5 — docs/router.md:L64 — no change (matcher and OAuth explanation stay accurate; the matcher is unchanged).

### DOC-C6 — docs/router.md:L75 — REPLACE
CURRENT: `/                       → src/app/page.tsx               redirect → /vi`
REPLACEMENT: `/                       → src/proxy.ts (next-intl) redirect → /{locale}; src/app/page.tsx fallback redirect → routing.defaultLocale`

### DOC-C7 — docs/router.md:L83-L84 — REPLACE
CURRENT:
```text
/[locale]/              → src/app/[locale]/(web)/page.tsx    HomePage (guest marketing)
/[locale]/home          → src/app/[locale]/(web)/home/page.tsx  SignedInHomePage (login-required; hero + continue learning + trending + popular instructors)
```
REPLACEMENT:
```text
/[locale]/              → src/app/[locale]/(web)/page.tsx    HomePage (guest marketing, indexable: generateMetadata + Organization JSON-LD; signed-in browsers are redirected to /[locale]/home by src/proxy.ts)
/[locale]/home          → src/app/[locale]/(web)/home/page.tsx  SignedInHomePage (login-required client gate; hero + continue learning + trending + popular instructors; generateMetadata = title + noindex,nofollow)
```

### DOC-C8 — docs/router.md: after the App Router Tree top-level entries (after L75 line, new lines) — INSERT
REPLACEMENT:
```text
/robots.txt             → src/app/robots.ts              robots.txt (bypasses src/proxy.ts: path contains a dot)
/sitemap.xml            → src/app/sitemap.ts             sitemap.xml with hreflang alternates (bypasses src/proxy.ts)
```

### DOC-C9 — docs/router.md:L190-L193 — REPLACE
CURRENT:
```text
| `/vi` | `[locale]/(web)/page.tsx` | `HomePage` | ✅ Implemented |
| `/en` | `[locale]/(web)/page.tsx` | `HomePage` | ✅ Implemented |
| `/vi/home` | `[locale]/(web)/home/page.tsx` | `SignedInHomePage` — login-required signed-in home (hero, Complete your Course, Trending Course, Popular Instructor) | ✅ Implemented |
| `/en/home` | same | same | ✅ Implemented |
```
REPLACEMENT:
```text
| `/vi` | `[locale]/(web)/page.tsx` | `HomePage` — guest home, indexable (metadata + Organization JSON-LD); a signed-in browser is redirected to `/vi/home` by `src/proxy.ts` | ✅ Implemented |
| `/en` | `[locale]/(web)/page.tsx` | `HomePage` — same, redirects a signed-in browser to `/en/home` | ✅ Implemented |
| `/vi/home` | `[locale]/(web)/home/page.tsx` | `SignedInHomePage` — login-required signed-in home (hero, Complete your Course, Trending Course, Popular Instructor); `noindex,nofollow` | ✅ Implemented |
| `/en/home` | same | same | ✅ Implemented |
| `/robots.txt` | `src/app/robots.ts` | robots rules built by `buildRobotsTxtRules` | ✅ Implemented |
| `/sitemap.xml` | `src/app/sitemap.ts` | `buildSitemapEntries` over the SEO-indexable pathnames | ✅ Implemented |
```

### DOC-C10 — docs/router.md:L269 — REPLACE
CURRENT: `| `src/app/layout.tsx` | Global fonts (Roboto, Gilroy, GeistMono as CSS vars), `<Toaster>` (Sonner) |`
REPLACEMENT: `| `src/app/layout.tsx` | Global fonts (Roboto, Gilroy, GeistMono as CSS vars), `<Toaster>` (Sonner), `<html lang>` from `await getLocale()`, root metadata `title: DEFAULT_SITE_NAME` (page-level `generateMetadata` supplies title and description) |`

### DOC-C11 — docs/router.md:L153 — no change (the OAuth bypass statement stays true).

### DOC-C12 — docs/router.md:L394-L407 (section "Guest `/` vs signed-in `/home`") — REPLACE the table rows, the "Href helpers" paragraph and the crawl paragraph
CURRENT (L398-L399):
```text
| `/` (locale home via `PUBLIC_ROUTES.home`) | Guest marketing home | Exists (mock). Future SEO wire optional. **Only** default SEO-indexable public key today. `homeHref` still points here. |
| `/home` (`PRIVATE_ROUTES.home`) | Signed-in homepage | **Shipped.** `(web)` shell + client auth gate; hero carousel and three data sections fed by the catalog and learner-courses APIs; **no route metadata**. Crawl disallow derives from `PRIVATE_ROUTES` (includes `/home`). |
```
REPLACEMENT:
```text
| `/` (locale home via `PUBLIC_ROUTES.home`) | Guest marketing home | Shipped (mock course data). Indexable: `generateMetadata` via `buildPageMetadata` (`homepage.seo.title` / `homepage.seo.description`, canonical, hreflang `vi` + `en` + `x-default`, OG/Twitter without image) and Organization JSON-LD. **Only** SEO-indexable public key. `homeHref` points here. Signed-in browsers never see it: `src/proxy.ts` redirects `/{locale}` to `/{locale}/home` when `refresh_token` and `session_id` cookies are present. |
| `/home` (`PRIVATE_ROUTES.home`) | Signed-in homepage | **Shipped.** `(web)` shell + client auth gate; hero carousel and three data sections fed by the catalog and learner-courses APIs. `generateMetadata` returns the localized title (`home.signedIn.pageTitle`) and `noindex,nofollow` (`privateApp` robots preset). Crawl disallow derives from `PRIVATE_ROUTES` (includes `/home`). Guests see the sign-in prompt; there is no redirect back to `/`. |
```
CURRENT (L403): `**Href helpers:** `homeHref` = public `/`; `signedInHomeHref` = private `/home`; `courseDetailHref(slug)` = public `/courses/{slug}` (placeholder page). Logo / `navigateToHome` still use `homeHref` until product decides brand-home should follow auth state.`
REPLACEMENT: `**Href helpers:** `homeHref` = public `/`; `signedInHomeHref` = private `/home`; `defaultPostAuthHref` = `signedInHomeHref`, the default destination after login, signup, OAuth and email confirmation (used when no valid `next` param exists); `courseDetailHref(slug)` = public `/courses/{slug}` (placeholder page). Logout, the brand logo / header links, `navigateToHome`, not-found / status-error "back to home" and global-error keep `homeHref`; a signed-in user who clicks the logo lands on `/{locale}` and is redirected to `/{locale}/home` by `src/proxy.ts`.`
CURRENT (L407, end): `Locale: `localePrefix: "always"`. Details: [`seo-ranking-setup.md`](./seo-ranking-setup.md).`
REPLACEMENT (FRAGMENT old `Locale: `localePrefix: "always"`.` new): `Locale: `localePrefix: "always"`. `src/app/robots.ts` consumes `buildRobotsTxtRules` (`src/lib/seo/robots-txt.ts`, over `publicCrawlAllowPaths` / `privateCrawlDisallowPaths`) and `src/app/sitemap.ts` consumes `buildSitemapEntries`; both read the runtime-only `SITE_URL` (validated at server start by `src/instrumentation.ts`).`

### DOC-C13 — docs/router.md:L298-L299 (not-found CTA) — no change (`homeHref` unchanged).
### DOC-C14 — docs/router.md:L361-L366 — FRAGMENT
old: `- pre-built href constants like `homeHref`, `logoutHref`, `adminCoursesHref``
new: `- pre-built href constants like `homeHref`, `signedInHomeHref`, `defaultPostAuthHref`, `logoutHref`, `adminCoursesHref``

---

## `docs/pages.md`

### DOC-C15 — docs/pages.md:L3 — STAMP (standard text)

### DOC-C16 — docs/pages.md:L10-L11 — REPLACE
CURRENT:
```text
| `/{locale}` | `src/app/[locale]/(web)/page.tsx` | `HomePage` (`src/screen/common/home/page.tsx`) | Implemented |
| `/{locale}/home` | `src/app/[locale]/(web)/home/page.tsx` | `SignedInHomePage` — login-required signed-in home: hero carousel, Complete your Course, Trending Course, Popular Instructor (`PRIVATE_ROUTES.home`); no route metadata | Implemented |
```
REPLACEMENT:
```text
| `/{locale}` | `src/app/[locale]/(web)/page.tsx` | `HomePage` (`src/screen/common/home/page.tsx`) — guest home, indexable (`generateMetadata` + Organization JSON-LD); signed-in browsers are redirected to `/{locale}/home` by `src/proxy.ts` | Implemented |
| `/{locale}/home` | `src/app/[locale]/(web)/home/page.tsx` | `SignedInHomePage` — login-required signed-in home: hero carousel, Complete your Course, Trending Course, Popular Instructor (`PRIVATE_ROUTES.home`); metadata = title + `noindex,nofollow` | Implemented |
| `/robots.txt` | `src/app/robots.ts` | robots.txt from `buildRobotsTxtRules` | Implemented |
| `/sitemap.xml` | `src/app/sitemap.ts` | sitemap with hreflang alternates for the indexable pathnames | Implemented |
```

### DOC-C17 — docs/pages.md:L9 — REPLACE
CURRENT: `| `/` | `src/app/page.tsx` | Redirect → `/vi` (default locale) | Implemented |`
REPLACEMENT: `| `/` | `src/proxy.ts` (next-intl), fallback `src/app/page.tsx` | Redirect → `/{locale}` (`/vi` by default; 307), then `/{locale}/home` for a signed-in browser | Implemented |`

### DOC-C18 — docs/pages.md:L66 — FRAGMENT
old: `(for example `signedInHomeHref`, `courseDetailHref(slug)`,`
new: `(for example `signedInHomeHref`, `defaultPostAuthHref` (post-auth default, `= signedInHomeHref`), `courseDetailHref(slug)`,`

### DOC-C19 — docs/pages.md:L75-L76 — REPLACE
CURRENT:
```text
| Guest home `/` | Marketing mock `HomePage` |
| Signed-in home `/home` | Implemented: hero carousel + three data sections (continue learning, trending, popular instructors) + client auth gate; no route metadata |
```
REPLACEMENT:
```text
| Guest home `/` | Marketing `HomePage` with mock course data; indexable metadata and Organization JSON-LD; signed-in browsers are redirected to `/home` by `src/proxy.ts` |
| Signed-in home `/home` | Implemented: hero carousel + three data sections (continue learning, trending, popular instructors) + client auth gate; metadata = title + `noindex,nofollow` |
```

### DOC-C20 — docs/pages.md:L101 — REPLACE (section "Home SEO foundation (take-note)" body)
CURRENT: `Guest home remains mock. Signed-in `/home` is a login-required page (`SignedInHomePage`) showing real catalog and continue-learning data. The route ships **without** page metadata (product decision); crawl disallow derives from `PRIVATE_ROUTES`. SEO/performance helpers under `src/lib/**` remain unused by pages. See [`seo-ranking-setup.md`](./seo-ranking-setup.md) § “Tích hợp home” and [`screens.md`](./screens.md).`
REPLACEMENT: `Guest home `/{locale}` still uses mock course data but is the indexable homepage: `generateMetadata` (`buildPageMetadata`, keys `homepage.seo.title` / `homepage.seo.description`, canonical, hreflang `vi` + `en` + `x-default`, OG/Twitter without image) and Organization JSON-LD (`JsonLd` + `buildOrganizationJsonLd`). Signed-in users never see it: `src/proxy.ts` redirects `/{locale}` to `/{locale}/home` when the `refresh_token` and `session_id` cookies are present. Signed-in `/home` is a login-required page (`SignedInHomePage`) showing real catalog and continue-learning data; its metadata is the localized title with `noindex,nofollow`, and crawl disallow derives from `PRIVATE_ROUTES`. `src/app/robots.ts` and `src/app/sitemap.ts` publish the crawl policy and sitemap. See [`seo-ranking-setup.md`](./seo-ranking-setup.md) § “Tích hợp home” and [`screens.md`](./screens.md).`

---

## `docs/screens.md`

### DOC-C21 — docs/screens.md:L3 — STAMP (standard text)

### DOC-C22 — docs/screens.md:L17 — FRAGMENT
old: `| Middleware | `src/proxy.ts` | See `docs/deploy.md` Appendix C |`
new: `| Middleware | `src/proxy.ts` | next-intl locale routing + signed-in `/{locale}` to `/{locale}/home` redirect; see `docs/router.md` and `docs/deploy.md` Appendix C |`

### DOC-C23 — docs/screens.md:L19 — REPLACE
CURRENT: `The root page (`src/app/page.tsx`) immediately redirects to `/vi` (default locale) using the typed `redirect` helper from `src/i18n/navigation.ts`.`
REPLACEMENT: `A request for `/` is redirected by the proxy to `/{locale}` (307; `/vi` by default). The root page (`src/app/page.tsx`) is the fallback: it redirects to `routing.defaultLocale` using the typed `redirect` helper from `src/i18n/navigation.ts`.`

### DOC-C24 — docs/screens.md:L27 — REPLACE
CURRENT: `| `/` | `src/app/page.tsx` | **Locale redirect** → `/vi` (308 Permanent Redirect via `next-intl` navigation) |`
REPLACEMENT: `| `/` | `src/proxy.ts`, fallback `src/app/page.tsx` | **Locale redirect** → `/{locale}` (307 from the next-intl middleware; `/vi` by default); a signed-in browser then continues to `/{locale}/home` |`

### DOC-C25 — docs/screens.md:L30-L31 — REPLACE
CURRENT:
```text
| `/{locale}` | `src/app/[locale]/(web)/page.tsx` | **Home page** — renders `HomePage` |
| `/{locale}/home` | `src/app/[locale]/(web)/home/page.tsx` | **Signed-in home** — renders `SignedInHomePage` (login required) |
```
REPLACEMENT:
```text
| `/{locale}` | `src/app/[locale]/(web)/page.tsx` | **Home page** — renders `HomePage` (indexable: metadata + Organization JSON-LD); signed-in browsers are redirected to `/{locale}/home` by `src/proxy.ts` |
| `/{locale}/home` | `src/app/[locale]/(web)/home/page.tsx` | **Signed-in home** — renders `SignedInHomePage` (login required, `noindex,nofollow`) |
| `/robots.txt` | `src/app/robots.ts` | **robots.txt** from `buildRobotsTxtRules` |
| `/sitemap.xml` | `src/app/sitemap.ts` | **sitemap.xml** from `buildSitemapEntries` |
```

### DOC-C26 — docs/screens.md:L88 — REPLACE
CURRENT: `│   HTML lang="vi", font variables (Roboto, Gilroy, GeistMono)`
REPLACEMENT: `│   <html lang> from await getLocale(), font variables (Roboto, Gilroy, GeistMono); metadata title = DEFAULT_SITE_NAME`

### DOC-C27 — docs/screens.md:L130-L134 (Home Screen) — INSERT after L132 (`**File:** ... async Server Component.`)
REPLACEMENT: `**Route metadata:** `src/app/[locale]/(web)/page.tsx` exports `generateMetadata` (`buildPageMetadata` with `homepage.seo.title` / `homepage.seo.description`, canonical, hreflang, OG/Twitter without image, indexable robots) and renders Organization JSON-LD through `JsonLd`. A signed-in browser never reaches this page: `src/proxy.ts` redirects `/{locale}` to `/{locale}/home` when `refresh_token` and `session_id` cookies are present.`

### DOC-C28 — docs/screens.md:L359 — FRAGMENT
old: `(`mutateMe()` then `onAuthenticated(nextPath ?? homeHref)`, `nextPath` from `useAuthNextParam()`)`
new: `(`mutateMe()` then `onAuthenticated(nextPath ?? defaultPostAuthHref)`, `nextPath` from `useAuthNextParam()`; `defaultPostAuthHref` is `/home`)`

### DOC-C29 — docs/screens.md:L574 — REPLACE
CURRENT: `- **No route metadata** (`generateMetadata` intentionally omitted per product decision). Crawl protection derives from `PRIVATE_ROUTES` disallow lists. Do not emit Course/Offer JSON-LD from this data.`
REPLACEMENT: `- **Route metadata:** `generateMetadata` returns the localized title (`home.signedIn.pageTitle`) and `noindex,nofollow` (`privateApp` robots preset). Crawl protection also derives from `PRIVATE_ROUTES` disallow lists. The page stays a client-side login gate: a guest sees the sign-in prompt and is never redirected back to `/`, so a stale session cookie cannot cause a redirect loop. Do not emit Course/Offer JSON-LD from this data.`

---

## `docs/architecture.md`

### DOC-C30 — docs/architecture.md:L3 — STAMP (standard text)

### DOC-C31 — docs/architecture.md:L62 — REPLACE
CURRENT: `                    ├─ Middleware (src/proxy.ts) -> locale redirect`
REPLACEMENT: `                    ├─ Middleware (src/proxy.ts) -> locale redirect; signed-in /{locale} -> /{locale}/home`

### DOC-C32 — docs/architecture.md:L102-L103 — REPLACE
CURRENT:
```text
│   │   ├── layout.tsx              # Root layout — fonts, Toaster
│   │   ├── page.tsx                # / → redirect to /vi
```
REPLACEMENT:
```text
│   │   ├── layout.tsx              # Root layout — fonts, Toaster, <html lang> from getLocale(), title = DEFAULT_SITE_NAME
│   │   ├── page.tsx                # / → redirect to routing.defaultLocale (fallback; the proxy redirects first)
│   │   ├── robots.ts               # robots.txt (buildRobotsTxtRules)
│   │   ├── sitemap.ts              # sitemap.xml (buildSitemapEntries)
```

### DOC-C33 — docs/architecture.md:L109-L111 — REPLACE
CURRENT:
```text
│   │       │   └── page.tsx        # Home route → HomePage
│   │       │   # home/page.tsx → SignedInHomePage; courses/[slug]/page.tsx → CourseDetailPlaceholderPage
```
REPLACEMENT:
```text
│   │       │   └── page.tsx        # Home route → HomePage (generateMetadata + Organization JSON-LD)
│   │       │   # home/page.tsx → SignedInHomePage (generateMetadata: title + noindex); courses/[slug]/page.tsx → CourseDetailPlaceholderPage
```

### DOC-C34 — docs/architecture.md:L226-L227 — REPLACE
CURRENT:
```text
│   └── proxy.ts                    # next-intl middleware + matcher
│                                   # Locale proxy entry for next-intl routing
```
REPLACEMENT:
```text
│   ├── instrumentation.ts          # register(): validates SITE_URL at server start
│   └── proxy.ts                    # next-intl middleware + signed-in /{locale} -> /{locale}/home redirect + matcher
│                                   # Locale proxy entry for next-intl routing
```

### DOC-C35 — docs/architecture.md:L223-L224 area (`src/constants/` tree after `api-route.ts`, L430-L434) — INSERT line after `│   ├── api-error-code.ts ...`
REPLACEMENT: `│   ├── auth-cookie.ts          # ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, SESSION_ID_COOKIE, AUTH_SESSION_EXPIRES_AT_COOKIE, LEGACY_AUTH_SESSION_MAX_AGE_COOKIE, AUTH_COOKIE_NAMES — single source of auth cookie names`

### DOC-C36 — docs/architecture.md:L269 — FRAGMENT
old: `Redirects away from `/login`/`/signup` when`
new: `Redirects away from `/login`/`/signup` to `nextPath ?? defaultPostAuthHref` when`

### DOC-C37 — docs/architecture.md:L326 — FRAGMENT
old: `Auth tokens (`access_token`, `refresh_token`, `session_id`) are stored as`
new: `Auth tokens (`access_token`, `refresh_token`, `session_id`; names defined once in `src/constants/auth-cookie.ts`) are stored as`
and append at the end of the same paragraph (after `...Server-side Next.js code still reads HttpOnly cookies via `next/headers` and attaches `Authorization: Bearer …` when proxying to the API.`): ` The proxy only checks that `refresh_token` and `session_id` are present (not valid) to decide the signed-in `/{locale}` redirect.`

### DOC-C38 — docs/architecture.md:L424-L426 — REPLACE
CURRENT:
```text
## Middleware: Locale Routing

`src/proxy.ts` exports the next-intl locale proxy middleware (`createMiddleware(routing)`) and `config.matcher` used to enforce locale-prefixed routes. The matcher excludes locale-less OAuth popup callbacks (`/auth/discord/callback`, `/auth/x/callback`) so provider redirects are not rewritten to `/{locale}/auth/...` (which would 404 and break popup login).
```
REPLACEMENT:
```text
## Middleware: Locale Routing and Signed-in Home Redirect

`src/proxy.ts` wraps the next-intl locale middleware (`createMiddleware(routing)`) and exports `config.matcher` used to enforce locale-prefixed routes. When the request path is exactly a locale root (`/vi`, `/en`, optional trailing slash) and both `refresh_token` and `session_id` cookies are present (presence only, not validity), it answers 307 to `/{locale}/home` with `Cache-Control: private, no-store` and `Vary: Cookie`, copying next-intl's Set-Cookie headers. `/` is first redirected by next-intl to `/{locale}` and then handled (two hops). Crawlers send no cookies, so they always see the public homepage. The pure decision is `resolveSignedInHomeRedirectPath` / `hasAuthSessionCookies` in `src/lib/navigation/signed-in-home-redirect.ts`. The matcher excludes locale-less OAuth popup callbacks (`/auth/discord/callback`, `/auth/x/callback`) so provider redirects are not rewritten to `/{locale}/auth/...` (which would 404 and break popup login), and any path containing a dot, so `/robots.txt` and `/sitemap.xml` bypass the proxy.
```

### DOC-C39 — docs/architecture.md:L533-L535 — REPLACE (heading and paragraph)
CURRENT:
```text
## SEO foundation layer (unused, 2026-07-25)

Synthetic SEO helpers live under `src/lib/seo|performance|security/web` and **consume** the existing API stack (`serverRawFetch` + empty fail-closed `publicCacheProfiles`). Planned frontend origin is server-side `SITE_URL` for `metadataBase`/canonical — **not** `NEXT_PUBLIC_API_URL`. Details: [`seo-ranking-setup.md`](./seo-ranking-setup.md).
```
REPLACEMENT:
```text
## SEO layer (home metadata, robots.txt, sitemap.xml)

SEO helpers live under `src/lib/seo|performance|security/web` and **consume** the existing API stack (`serverRawFetch` + empty fail-closed `publicCacheProfiles`). The frontend origin is the runtime-only server-side `SITE_URL` (used for `metadataBase`/canonical/sitemap, validated at server start by `src/instrumentation.ts`; `http://localhost` is accepted outside production) — **not** `NEXT_PUBLIC_API_URL`. Consumers: `generateMetadata` of `/{locale}` (`buildPageMetadata`, canonical, hreflang `vi` + `en` + `x-default`, Organization JSON-LD) and `/{locale}/home` (title + `noindex,nofollow`), `src/app/robots.ts` (`buildRobotsTxtRules` over `publicCrawlAllowPaths` / `privateCrawlDisallowPaths`) and `src/app/sitemap.ts` (`buildSitemapEntries`). Helpers not yet consumed: ranking builders other than Organization, `seoFetch`, performance resource hints. Details: [`seo-ranking-setup.md`](./seo-ranking-setup.md).
```

### DOC-C40 — docs/architecture.md:L14 — no change (`Middleware` in the stack row stays valid).

---

## `docs/folder-structure.md`

### DOC-C41 — docs/folder-structure.md:L3 — STAMP (standard text)

### DOC-C42 — docs/folder-structure.md:L58-L61 — REPLACE
CURRENT:
```text
├── layout.tsx              # Root layout: loads fonts (Roboto, Gilroy, GeistMono), mounts Sonner <Toaster>
│                           # (no third-party auth scripts — GSI loads in (web)/layout.tsx only)
├── page.tsx                # Root page: immediately redirects browser to /vi (default locale)
```
REPLACEMENT:
```text
├── layout.tsx              # Root layout: loads fonts (Roboto, Gilroy, GeistMono), mounts Sonner <Toaster>, <html lang> from getLocale(), metadata title = DEFAULT_SITE_NAME
│                           # (no third-party auth scripts — GSI loads in (web)/layout.tsx only)
├── page.tsx                # Root page: fallback redirect to routing.defaultLocale (src/proxy.ts redirects / first)
├── robots.ts               # robots.txt route (buildRobotsTxtRules)
├── sitemap.ts              # sitemap.xml route (buildSitemapEntries)
```

### DOC-C43 — docs/folder-structure.md:L79-L80 — REPLACE
CURRENT:
```text
    │   ├── page.tsx        # Guest home → HomePage
    │   ├── home/page.tsx   # Signed-in home → SignedInHomePage (login-required)
```
REPLACEMENT:
```text
    │   ├── page.tsx        # Guest home → HomePage (generateMetadata + Organization JSON-LD; signed-in browsers redirected to /home by src/proxy.ts)
    │   ├── home/page.tsx   # Signed-in home → SignedInHomePage (login-required; generateMetadata: title + noindex)
```

### DOC-C44 — docs/folder-structure.md: `src/` root listing — INSERT `instrumentation.ts` entry next to `proxy.ts` (L583-L591 section; see DOC-C49) and no other `src/` root file list exists.

### DOC-C45 — docs/folder-structure.md:L322 — FRAGMENT
old: `Shared post-auth: mutateMe + onAuthenticated(nextPath ?? homeHref)`
new: `Shared post-auth: mutateMe + onAuthenticated(nextPath ?? defaultPostAuthHref)`

### DOC-C46 — docs/folder-structure.md:L445-L453 (`src/constants/`) — REPLACE lines for `home.ts` neighbors and `routes.ts`; INSERT `auth-cookie.ts`
CURRENT (L450): `│   ├── routes.ts           # SEO_INDEXABLE_PUBLIC_ROUTE_KEYS + SIGNED_IN_HOME_PATH (/home)`
REPLACEMENT: `│   ├── routes.ts           # SEO_INDEXABLE_PUBLIC_ROUTE_KEYS`
INSERT after L445 (`├── home.ts ...`): `├── auth-cookie.ts          # ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, SESSION_ID_COOKIE, AUTH_SESSION_EXPIRES_AT_COOKIE, LEGACY_AUTH_SESSION_MAX_AGE_COOKIE, AUTH_COOKIE_NAMES — single source of auth cookie names (proxy helper, server-auth, auth-session, cookie, refresh route, auth actions)`

### DOC-C47 — docs/folder-structure.md:L492-L493 (`src/lib/navigation/`) — REPLACE and INSERT
CURRENT (L492): `│   ├── home.ts             # navigateToHome(router) + re-exports homeHref / signedInHomeHref`
REPLACEMENT: `│   ├── home.ts             # navigateToHome(router) + re-exports homeHref / signedInHomeHref`
(unchanged text) and INSERT after `routes.ts` line (L493): `│   ├── signed-in-home-redirect.ts # resolveSignedInHomeRedirectPath({ pathname, hasSession }), hasAuthSessionCookies(cookies) — pure logic for the src/proxy.ts signed-in /{locale} redirect`
CURRENT (L493): `│   ├── routes.ts           # route builders + shared href constants (public/private/resource)`
REPLACEMENT: `│   ├── routes.ts           # route builders + shared href constants (public/private/resource), incl. homeHref, signedInHomeHref, defaultPostAuthHref`

### DOC-C48 — docs/folder-structure.md:L531-L534 (`src/lib/utils/`) — FRAGMENT
old: `│   ├── cookie.ts           # isomorphic getCookieValue / setCookieValue; buildCookieOptions`
new: `│   ├── cookie.ts           # isomorphic getCookieValue / setCookieValue; buildCookieOptions (auth cookie names from constants/auth-cookie.ts)`
old: `│   └── auth-session.ts     # SERVER ONLY — setAuthSessionCookies, auth_session_expires_at, resolveRefreshMaxAgeFromBe`
new: `│   └── auth-session.ts     # SERVER ONLY — setAuthSessionCookies, auth_session_expires_at, resolveRefreshMaxAgeFromBe (cookie names from constants/auth-cookie.ts)`

### DOC-C49 — docs/folder-structure.md:L583-L591 — REPLACE
CURRENT:
```text
### `src/proxy.ts` — Next.js Middleware

src/proxy.ts                # next-intl middleware (createMiddleware(routing)) + config.matcher
                            # Next.js 16 uses src/proxy.ts for request proxy/middleware-style handling.
                            # Matcher excludes locale-less OAuth callbacks: auth/discord/callback, auth/x/callback
```
REPLACEMENT:
```text
### `src/proxy.ts` and `src/instrumentation.ts` — Next.js Middleware and server start hook

src/proxy.ts                # wraps next-intl middleware (createMiddleware(routing)); locale root + refresh_token + session_id cookies -> 307 /{locale}/home (private, no-store, Vary: Cookie); + config.matcher
                            # Next.js 16 uses src/proxy.ts for request proxy/middleware-style handling.
                            # Matcher excludes api, trpc, _next, _vercel, locale-less OAuth callbacks (auth/discord/callback, auth/x/callback) and any path with a dot (/robots.txt, /sitemap.xml)
src/instrumentation.ts      # register(): validates the runtime-only SITE_URL at server start (resolveSiteConfig)
```

### DOC-C50 — docs/folder-structure.md:L671-L702 — REPLACE (heading, intro, tree, closing sentence)
CURRENT heading: `### `src/lib/seo/`, `src/lib/performance/`, `src/lib/security/web/` — Unused SEO foundation (2026-07-25)`
REPLACEMENT heading: `### `src/lib/seo/`, `src/lib/performance/`, `src/lib/security/web/` — SEO foundation (consumed by home metadata, robots.txt and sitemap.xml)`
CURRENT (L673): `` `src/lib/security/web/safe-redirect.ts` is the one exception below — it's wired and used by `useAuthNextParam` (`hooks/auth/use-auth-next-param.ts`). ``
REPLACEMENT: `The consumed helpers are `site-config`, `build-page-metadata`, `canonical` (`buildLanguageAlternates`), `robots-presets`, `robots-txt`, `indexable-routes`, `sitemap-builder`, `json-ld` + `ranking/organization`, and `crawl-policy` (used by the home pages, `src/app/robots.ts`, `src/app/sitemap.ts`); `src/lib/security/web/safe-redirect.ts` is used by `useAuthNextParam` (`hooks/auth/use-auth-next-param.ts`). The remaining helpers (other ranking builders, `seo-fetch`, `temporary-cache-policy`, performance hints) are not consumed yet.`
CURRENT tree lines (L677-L686) → REPLACEMENT tree lines:
```text
├── seo/
│   ├── site-config.ts           # resolveSiteConfig (https origin; http://localhost accepted outside production), SiteConfigError
│   ├── build-page-metadata.ts   # buildPageMetadata — title/description/canonical/hreflang (vi, en, x-default)/OG/Twitter/robots
│   ├── canonical.ts             # buildCanonicalUrl, localizedPathname, toAbsoluteUrl, buildLanguageAlternates (per-locale canonical URLs + x-default; shared by build-page-metadata and sitemap-builder)
│   ├── robots-presets.ts
│   ├── robots-txt.ts            # buildRobotsTxtRules — pure robots.txt rules for src/app/robots.ts
│   ├── indexable-routes.ts      # Predicates/path builders over constants/seo/routes
│   ├── sitemap-builder.ts       # buildSitemapEntries (hreflang alternates via buildLanguageAlternates), listPublicStaticPathnames
│   ├── json-ld.tsx              # JsonLd lives here (not src/components) for Knip unused-files
│   ├── index.ts                 # optional barrel
│   ├── ranking/                 # Runtime Organization/Course/Person/Breadcrumb/Article/Video/FAQ builders
│   └── data/
```
Closing sentence CURRENT (L702): `See [`seo-ranking-setup.md`](./seo-ranking-setup.md). Not wired to pages/layouts this phase.`
REPLACEMENT: `See [`seo-ranking-setup.md`](./seo-ranking-setup.md). Wired to `/{locale}` and `/{locale}/home` metadata, `src/app/robots.ts` and `src/app/sitemap.ts`; not wired to the root layout beyond `title`.`
Also the `crawl-policy.ts` line stays (`publicCrawlAllowPaths`, `privateCrawlDisallowPaths`, `signedInHomeRobotsMode` consumed by robots/metadata).

### DOC-C51 — docs/folder-structure.md: e2e tree (L652-L669) — INSERT lines in `tests/` listing (names verified at implementation against the real spec files)
CURRENT (L664 area): `    ├── course-slug.spec.ts       # optional slug on create, ...`
INSERT (extends existing `home.spec.ts` if present; otherwise add): `    ├── home.spec.ts              # guest home metadata/robots.txt/sitemap.xml and signed-in /{locale} -> /{locale}/home redirect`
(If the existing tree has no `home.spec.ts` line, add it between `course-slug.spec.ts` and `locale-404.spec.ts`.)

### DOC-C52 — docs/folder-structure.md: `src/lib/` colocated tests — no tree lines (tests are colocated and not enumerated; `docs/testing.md` is out of this part).

---

## `docs/modules.md`

### DOC-C53 — docs/modules.md:L3 — STAMP (standard text)

### DOC-C54 — docs/modules.md:L8 — FRAGMENT
old: `, `src/lib/utils/auth-action.ts`, `src/schema/auth`,`
new: `, `src/lib/utils/auth-action.ts`, `src/constants/auth-cookie.ts`, `src/schema/auth`,`

### DOC-C55 — docs/modules.md:L13 — REPLACE
CURRENT: `- `Routing + i18n`: `src/app`, `src/i18n`, `src/proxy.ts`, `src/messages``
REPLACEMENT: `- `Routing + i18n`: `src/app`, `src/i18n`, `src/proxy.ts` (locale routing + signed-in home redirect), `src/lib/navigation/signed-in-home-redirect.ts`, `src/messages``

### DOC-C56 — docs/modules.md:L143 — FRAGMENT
old: `(`mutateMe` + `onAuthenticated(nextPath ?? homeHref)`, `nextPath` from `useAuthNextParam`)`
new: `(`mutateMe` + `onAuthenticated(nextPath ?? defaultPostAuthHref)`, `nextPath` from `useAuthNextParam`)`

### DOC-C57 — docs/modules.md:L155-L164 — REPLACE the whole "SEO / Performance / Security web" section
CURRENT: heading `## SEO / Performance / Security web (foundation, unused)` plus bullets L157-L164 (SEO contracts ... Non-goals remaining).
REPLACEMENT:
```text
## SEO / Performance / Security web

- **SEO contracts**: `src/types/seo/**` — type-only metadata, ranking, fetch/rendering, image-policy, and resource-hint contracts.
- **SEO policy values**: `src/constants/seo/**` — data-only metadata defaults/limits, indexable route keys, rendering hints, image sizes, and robots presets.
- **SEO runtime**: `src/lib/seo/**` — metadata factory (`buildPageMetadata`, emits hreflang `vi` + `en` + `x-default`), site-config validation (`resolveSiteConfig`, runtime-only `SITE_URL`), canonical/robots/sitemap helpers (`buildLanguageAlternates`, `buildRobotsTxtRules`, `buildSitemapEntries`), JSON-LD + ranking builders, `seoFetch` over `serverRawFetch`, TEMPORARY dormant env cache helper (`temporary-cache-policy.ts`, flag off).
- **Consumers**: `generateMetadata` of `src/app/[locale]/(web)/page.tsx` (indexable, canonical, hreflang, OG/Twitter without image, Organization JSON-LD) and `src/app/[locale]/(web)/home/page.tsx` (title + `noindex,nofollow`); `src/app/robots.ts`; `src/app/sitemap.ts`; `src/instrumentation.ts` (validates `SITE_URL` at server start).
- **Performance**: `src/lib/performance/**` — image sizes/LCP policy, resource-hint builders (not injected).
- **Security web**: `src/lib/security/web/**` — crawl policy from route constants (consumed by `robots.ts`), client redact, JSON-LD sanitize, draft headers.
- **Signed-in home**: `PRIVATE_ROUTES.home` → `src/app/[locale]/(web)/home/page.tsx` + `SignedInHomePage` (hero carousel, Complete your Course, Trending Course, Popular Instructor; client auth gate; data from the catalog and learner-courses APIs); metadata = title + `noindex,nofollow`; `src/proxy.ts` redirects signed-in `/{locale}` visits to it; `/courses/[slug]` is a temporary placeholder page.
- **Docs**: [`seo-ranking-setup.md`](./seo-ranking-setup.md), [`security-hardening-notes.md`](./security-hardening-notes.md).
- **Non-goals remaining**: no page/layout SEO wire beyond the two home routes; no `publicCacheProfiles` entries (the home data is fetched client side).
```

---

## `docs/flow.md`

### DOC-C58 — docs/flow.md:L3 — STAMP (standard text)

### DOC-C59 — docs/flow.md:L131 — FRAGMENT
old: `See `docs/router.md` § Middleware.`
new: `See `docs/router.md` § Middleware: Locale Enforcement and Signed-in Home Redirect.`

### DOC-C60 — docs/flow.md:L189 — REPLACE
CURRENT: `**Goal:** User clicks email link → FE page confirms → session cookies set → redirect home.`
REPLACEMENT: `**Goal:** User clicks email link → FE page confirms → session cookies set → redirect to the signed-in home (`/home`).`

### DOC-C61 — docs/flow.md:L197 — REPLACE
CURRENT: `    → mutateMe() + broadcast confirm_success + router.replace("/")`
REPLACEMENT: `    → mutateMe() + broadcast confirm_success + router.replace(defaultPostAuthHref)   # "/home"`

### DOC-C62 — docs/flow.md:L206 — FRAGMENT (clarify the unchanged logout destination)
old: `→ cookies cleared → redirect home.`
new: `→ cookies cleared → redirect to the guest home (`/`, `homeHref`).`
(L214 `router.replace("/")` in the logout block stays: logout keeps `homeHref`.)

### DOC-C63 — docs/flow.md after L119-L121 (end of "Step 5" after-login text) — INSERT paragraph
REPLACEMENT: `**Signed-in home redirect:** once the `refresh_token` and `session_id` cookies exist, a request for the locale root (`/vi`, `/en`) is answered by `src/proxy.ts` with a 307 to `/{locale}/home` (`Cache-Control: private, no-store`, `Vary: Cookie`). The check is presence-only; `/{locale}/home` remains a client-side gate, so an expired or stale cookie shows the sign-in prompt instead of looping. Cookie names come from `src/constants/auth-cookie.ts`.`

### DOC-C64 — docs/flow.md:L399 — FRAGMENT
old: `(mirrors the existing `homeHref`/`logoutHref` pattern)`
new: `(mirrors the existing `homeHref`/`signedInHomeHref`/`logoutHref` pattern)`

### DOC-C65 — docs/flow.md:L420 — FRAGMENT
old: `redirects to `nextPath ?? homeHref` via `router.replace``
new: `redirects to `nextPath ?? defaultPostAuthHref` via `router.replace``

---

## `docs/logic-flow.md`

### DOC-C66 — docs/logic-flow.md:L3 — STAMP (standard text)

### DOC-C67 — docs/logic-flow.md:L54 — FRAGMENT
old: `→ onAuthenticated(nextPath ?? homeHref)   [prop supplied by LoginSignupPopup]`
new: `→ onAuthenticated(nextPath ?? defaultPostAuthHref)   [prop supplied by LoginSignupPopup; "/home"]`

### DOC-C68 — docs/logic-flow.md:L79 — FRAGMENT
old: `mutateMe() + onAuthenticated(nextPath ?? homeHref)   [nextPath read via useAuthNextParam()]`
new: `mutateMe() + onAuthenticated(nextPath ?? defaultPostAuthHref)   [nextPath read via useAuthNextParam()]`

### DOC-C69 — docs/logic-flow.md:L278-L282 — REPLACE
CURRENT:
```text
next-intl middleware (src/proxy.ts)
  → skipped for locale-less OAuth callbacks (/auth/discord/callback, /auth/x/callback)
  → otherwise detects locale from URL prefix (/vi/... or /en/...)
  → sets locale cookie / header
```
REPLACEMENT:
```text
src/proxy.ts (next-intl middleware wrapper)
  → skipped for locale-less OAuth callbacks (/auth/discord/callback, /auth/x/callback) and dotted paths (/robots.txt, /sitemap.xml)
  → locale root (/vi or /en) AND refresh_token + session_id cookies present
      → 307 /{locale}/home   (Cache-Control: private, no-store; Vary: Cookie; next-intl Set-Cookie copied)
  → otherwise next-intl: detects locale from URL prefix (/vi/... or /en/...); "/" redirects to /{locale} (307, then the rule above)
  → sets locale cookie / header
```

### DOC-C70 — docs/logic-flow.md:L45-L47 (cookie names in the login flow) — no change (names remain accurate).

---

## `docs/components.md`

### DOC-C71 — docs/components.md:L3 — STAMP (standard text)

### DOC-C72 — docs/components.md:L161 — FRAGMENT
old: `then calling `router.back()`. Rendered only by`
new: `then calling `router.back()`. When no destination is passed, the post-auth navigation falls back to `defaultPostAuthHref` (`/home`). Rendered only by`

### DOC-C73 — docs/components.md:L165 — FRAGMENT
old: `Takes an `onAuthenticated: (destination: string) => void` prop (called after a successful submit or successful OAuth login with the validated post-auth destination) instead of reading `useAuthStore`;`
new: `Takes an `onAuthenticated: (destination: string) => void` prop (called after a successful submit or successful OAuth login with the validated post-auth destination, defaulting to `nextPath ?? defaultPostAuthHref`, i.e. `/home`) instead of reading `useAuthStore`;`

### DOC-C74 — docs/components.md:L167 — REPLACE
CURRENT: `| `ConfirmEmailContent` | `auth/confirm-email-content.tsx` | Client | Email confirm page body → `confirmAction`. |`
REPLACEMENT: `| `ConfirmEmailContent` | `auth/confirm-email-content.tsx` | Client | Email confirm page body → `confirmAction`; on success `router.replace(defaultPostAuthHref)` (`/home`). |`

### DOC-C75 — docs/components.md:L305 — FRAGMENT
old: `to `nextPath ?? homeHref` when`
new: `to `nextPath ?? defaultPostAuthHref` when`

### DOC-C76 — docs/components.md:L306 — FRAGMENT
old: `then `onAuthenticated(nextPath ?? homeHref)`, reading`
new: `then `onAuthenticated(nextPath ?? defaultPostAuthHref)`, reading`

### DOC-C77 — docs/components.md:L369-L373 — REPLACE (JsonLd block)
CURRENT:
```text
### JsonLd (`src/lib/seo/json-ld.tsx`)

- **Placement:** under `src/lib/seo/` (not `src/components/**`) so an unused file does not fail Knip `files` on components.
- **Role:** server-friendly JSON-LD `<script type="application/ld+json">` with `<` → `<` escape; consumes ranking builders.
- **Status:** unused this phase. See [`seo-ranking-setup.md`](./seo-ranking-setup.md).
```
REPLACEMENT:
```text
### JsonLd (`src/lib/seo/json-ld.tsx`)

- **Placement:** under `src/lib/seo/` (not `src/components/**`) so a non-component helper does not count against Knip `files` on components.
- **Role:** server-friendly JSON-LD `<script type="application/ld+json">` with `<` → `<` escape; consumes ranking builders.
- **Status:** rendered by the guest home page (`src/app/[locale]/(web)/page.tsx`) with `buildOrganizationJsonLd`. See [`seo-ranking-setup.md`](./seo-ranking-setup.md).
```

### DOC-C78 — docs/components.md:L114, L117, L125, L133 (logo/header/dashboard links to `homeHref` / `navigateToHome`) — no change (the link target is still `homeHref`; the proxy handles the signed-in hop).

---

## `docs/reusable-assets.md`

### DOC-C79 — docs/reusable-assets.md:L3 — STAMP (standard text)

### DOC-C80 — docs/reusable-assets.md before L119 (`### Asset: AUTH_SESSION_EXPIRES_AT_COOKIE / resolveRefreshMaxAgeFromBe`) — INSERT new asset
REPLACEMENT:
```text
### Asset: Auth cookie names (ACCESS_TOKEN_COOKIE / REFRESH_TOKEN_COOKIE / SESSION_ID_COOKIE / AUTH_COOKIE_NAMES)
- **Name**: `ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`, `SESSION_ID_COOKIE`, `AUTH_SESSION_EXPIRES_AT_COOKIE`, `LEGACY_AUTH_SESSION_MAX_AGE_COOKIE`, `AUTH_COOKIE_NAMES`
- **Type**: Constants (data only)
- **Path**: `src/constants/auth-cookie.ts`
- **Purpose**: Single source of the auth cookie names (`access_token`, `refresh_token`, `session_id`, `auth_session_expires_at`, legacy `auth_session_max_age`) and the list of all of them (`AUTH_COOKIE_NAMES`).
- **Scope**: `src/api/auth/server-auth.ts`, `src/lib/utils/auth-session.ts`, `src/lib/utils/cookie.ts`, `src/app/api/auth/refresh/route.ts`, `src/actions/auth/auth.ts`, and `hasAuthSessionCookies` in `src/lib/navigation/signed-in-home-redirect.ts` (used by `src/proxy.ts`).
- **Dependencies**: none.
- **Reuse Rule**: Never hard-code `"access_token"`, `"refresh_token"` or `"session_id"` as cookie names; import these constants.
```

### DOC-C81 — docs/reusable-assets.md:L120-L125 — REPLACE
CURRENT:
```text
- **Name**: `AUTH_SESSION_EXPIRES_AT_COOKIE`, `resolveRefreshMaxAgeFromBe()`, `refreshMaxAgeFromBeSetCookie()`, `expiresAtFromMaxAge()`, `remainingSecondsUntilExpiresAt()`
- **Type**: Constant + server-only helpers
- **Path**: `src/lib/utils/auth-session.ts`
```
REPLACEMENT:
```text
- **Name**: `AUTH_SESSION_EXPIRES_AT_COOKIE`, `resolveRefreshMaxAgeFromBe()`, `refreshMaxAgeFromBeSetCookie()`, `expiresAtFromMaxAge()`, `remainingSecondsUntilExpiresAt()`
- **Type**: Constant + server-only helpers
- **Path**: helpers in `src/lib/utils/auth-session.ts`; the cookie-name constant is defined in `src/constants/auth-cookie.ts`
```

### DOC-C82 — docs/reusable-assets.md:L212-L217 — FRAGMENT/REPLACE
CURRENT (L212): `### Asset: pre-built navigation hrefs (`homeHref`, `signedInHomeHref`, `logoutHref`, `adminCoursesHref`, ...)`
REPLACEMENT: `### Asset: pre-built navigation hrefs (`homeHref`, `signedInHomeHref`, `defaultPostAuthHref`, `logoutHref`, `adminCoursesHref`, ...)`
CURRENT (L213): `- **Name**: `homeHref`, `signedInHomeHref`, `forgotPasswordHref`,`
REPLACEMENT: `- **Name**: `homeHref`, `signedInHomeHref`, `defaultPostAuthHref`, `forgotPasswordHref`,`
CURRENT (L216, Purpose): `... `homeHref` = public guest `/`; `signedInHomeHref` = private `/home`; `courseDetailHref(slug)` = public `/courses/{slug}` (builder function, placeholder page).`
REPLACEMENT (FRAGMENT old `` `signedInHomeHref` = private `/home`; `courseDetailHref(slug)` ``): new `` `signedInHomeHref` = private `/home`; `defaultPostAuthHref` = `signedInHomeHref`, the default post-login/signup/OAuth/email-confirm destination; `courseDetailHref(slug)` ``
CURRENT (L217, Scope): `- **Scope**: auth components, header/user menu constants, dashboard constants, signed-in home route.`
REPLACEMENT: `- **Scope**: auth components, header/user menu constants, dashboard constants, signed-in home route; `homeHref` also serves the brand logo, logout redirect, not-found / status-error and global-error links, and the canonical default.`

### DOC-C83 — docs/reusable-assets.md after L218 (end of the pre-built hrefs entry) — INSERT new asset
REPLACEMENT:
```text
### Asset: `defaultPostAuthHref`
- **Name**: `defaultPostAuthHref`
- **Type**: Constant string (`= signedInHomeHref`, `/home`)
- **Path**: `src/lib/navigation/routes.ts` (next to `signedInHomeHref`)
- **Purpose**: The one named default destination after login, signup, OAuth and email confirmation when no valid `next` query param exists.
- **Scope**: `login-content.tsx`, `use-oauth-post-auth.ts`, `use-redirect-if-authenticated.ts`, `login-signup-popup.tsx`, `confirm-email-content.tsx`.
- **Dependencies**: `signedInHomeHref`.
- **Reuse Rule**: Use it for any post-auth fallback; logout and brand links keep `homeHref`.

### Asset: `resolveSignedInHomeRedirectPath` / `hasAuthSessionCookies`
- **Name**: `resolveSignedInHomeRedirectPath({ pathname, hasSession })`, `hasAuthSessionCookies(cookies)`
- **Type**: Pure utility functions (edge-safe)
- **Path**: `src/lib/navigation/signed-in-home-redirect.ts`
- **Purpose**: Decide whether a request for the locale root (`/vi`, `/en`, optional trailing slash) must be redirected to `/{locale}/home`: true only when both `refresh_token` and `session_id` cookies are present (presence only, not validity). Returns the target path or `null`.
- **Scope**: `src/proxy.ts`.
- **Dependencies**: `routing` (`src/i18n/routing.ts`), `signedInHomeHref`, `REFRESH_TOKEN_COOKIE` / `SESSION_ID_COOKIE` (`src/constants/auth-cookie.ts`).
- **Reuse Rule**: Keep the redirect rule in this helper; do not re-implement cookie or path checks in `proxy.ts` or components.
```

### DOC-C84 — docs/reusable-assets.md:L992 — REPLACE
CURRENT: `- **Purpose**: Returns HttpOnly cookie options for auth session cookies (`access_token`, `refresh_token`, `session_id`). Used by `setAuthSessionCookies`.`
REPLACEMENT: `- **Purpose**: Returns HttpOnly cookie options for auth session cookies (`ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`, `SESSION_ID_COOKIE` from `src/constants/auth-cookie.ts`). Used by `setAuthSessionCookies`.`

### DOC-C85 — docs/reusable-assets.md:L1155 — FRAGMENT
old: `- **Dependencies**: `useGetMe` (`src/hooks/auth/use-auth-store.ts`), `@/i18n/navigation` (`useRouter`), `homeHref` (`src/lib/navigation/routes.ts`).`
new: `- **Dependencies**: `useGetMe` (`src/hooks/auth/use-auth-store.ts`), `@/i18n/navigation` (`useRouter`), `defaultPostAuthHref` (`src/lib/navigation/routes.ts`).`
and L1153 FRAGMENT old: `(via `router.replace(nextPath ?? homeHref)`)` new: `(via `router.replace(nextPath ?? defaultPostAuthHref)`)`; and its sentence `bounce to `homeHref`` (history of an old bug) in the same Purpose line: old `a bounce to `homeHref`` new `a bounce to the default destination`.

### DOC-C86 — docs/reusable-assets.md:L1306 — FRAGMENT
old: `sets `access_token`, `refresh_token`, `session_id` HttpOnly cookies`
new: `sets the `access_token`, `refresh_token`, `session_id` HttpOnly cookies (names from `src/constants/auth-cookie.ts`)`

### DOC-C87 — docs/reusable-assets.md:L1549 — REPLACE (section heading)
CURRENT: `## SEO / Performance / Security web (unused foundation — 2026-07-25)`
REPLACEMENT: `## SEO / Performance / Security web (home metadata, robots.txt, sitemap.xml)`

### DOC-C88 — docs/reusable-assets.md:L1556-L1559 (`buildPageMetadata`) — REPLACE Purpose, Dependencies and Reuse Rule
CURRENT (L1557): `- **Purpose**: Synthetic title/description/OG/Twitter/robots/canonical/hreflang from `SeoPageInput`. OG/Twitter **images omitted** until a real `SeoImage` is supplied (no `/og-default.png` placeholder).`
REPLACEMENT: `- **Purpose**: Title/description/OG/Twitter/robots/canonical/hreflang (per-locale canonical URLs plus `x-default`, via `buildLanguageAlternates`) from `SeoPageInput`. OG/Twitter **images omitted** until a real `SeoImage` is supplied (no `/og-default.png` placeholder).`
CURRENT (L1558): `- **Dependencies**: `site-config` (pure `SITE_URL` origin), `routing`/`getPathname`, `truncateUnicodeCodePoints`, nav builders.`
REPLACEMENT: `- **Dependencies**: `site-config` (pure `SITE_URL` origin), `buildLanguageAlternates` (`src/lib/seo/canonical.ts`), `routing`/`getPathname`, `truncateUnicodeCodePoints`, nav builders.`
CURRENT (L1559): `- **Reuse Rule**: Call this from future `generateMetadata`; do not hand-copy OG tags per page. **Unused** this phase. Sitemap defaults use `SEO_INDEXABLE_PUBLIC_ROUTE_KEYS` (`home` only) — not raw `PUBLIC_ROUTES`.`
REPLACEMENT: `- **Reuse Rule**: Call this from every `generateMetadata`; do not hand-copy OG tags per page. Consumers: `src/app/[locale]/(web)/page.tsx` (indexable) and `src/app/[locale]/(web)/home/page.tsx` (`privateApp` robots). Sitemap defaults use `SEO_INDEXABLE_PUBLIC_ROUTE_KEYS` (`home` only) — not raw `PUBLIC_ROUTES`.`

### DOC-C89 — docs/reusable-assets.md after the `buildPageMetadata` entry (after L1559) — INSERT new assets
REPLACEMENT:
```text
### Asset: buildLanguageAlternates
- **Name**: `buildLanguageAlternates`
- **Type**: Pure helper
- **Path**: `src/lib/seo/canonical.ts`
- **Purpose**: Builds the per-locale canonical URLs plus the `x-default` entry for one pathname.
- **Scope**: `build-page-metadata.ts` (metadata `alternates.languages`) and `sitemap-builder.ts` (sitemap `alternates.languages`).
- **Dependencies**: `buildCanonicalUrl`, `siteDefaultLocale`, `siteLocales`.
- **Reuse Rule**: Never rebuild hreflang maps by hand; call this helper.

### Asset: buildRobotsTxtRules
- **Name**: `buildRobotsTxtRules`
- **Type**: Pure helper
- **Path**: `src/lib/seo/robots-txt.ts`
- **Purpose**: Builds the robots.txt rules (allow the indexable public paths, disallow the private app paths) from `publicCrawlAllowPaths()` and `privateCrawlDisallowPaths()`.
- **Scope**: `src/app/robots.ts`.
- **Dependencies**: `crawl-policy` (`src/lib/security/web/crawl-policy.ts`).
- **Reuse Rule**: Change the crawl policy in `crawl-policy.ts` / route constants, not in `robots.ts`.
```

### DOC-C90 — docs/reusable-assets.md:L1566 — REPLACE
CURRENT: `- **Scope**: `crawl-policy.ts`, `sitemap-builder.ts` (private path listing).`
REPLACEMENT: `- **Scope**: `crawl-policy.ts` (private crawl disallow paths).`

### DOC-C91 — docs/reusable-assets.md:L1573-L1574 — no change (`home` only allow-list statement remains true).

### DOC-C92 — docs/reusable-assets.md:L1576-L1582 (`JsonLd + ranking builders`) — REPLACE Reuse Rule
CURRENT (L1582): `- **Reuse Rule**: No mock home cards; fail closed on missing required fields.`
REPLACEMENT: `- **Reuse Rule**: No mock home cards; fail closed on missing required fields. `JsonLd` + `buildOrganizationJsonLd` are consumed by the guest home page; the other builders have no consumer yet.`

### DOC-C93 — docs/reusable-assets.md:L1603-L1605 (`crawl-policy ...`) — REPLACE Purpose
CURRENT: `- **Purpose**: Derive private crawl lists from `PRIVATE_ROUTES`; allow-list redact; draft headers align `deploy.md`.`
REPLACEMENT: `- **Purpose**: Derive private crawl lists from `PRIVATE_ROUTES` (`privateCrawlDisallowPaths`, `publicCrawlAllowPaths`, `signedInHomeRobotsMode`, consumed by `robots.ts` / `buildRobotsTxtRules` and the `/home` metadata); allow-list redact; draft headers align `deploy.md`.`

### DOC-C94 — docs/reusable-assets.md: `resolveSiteConfig` — INSERT within DOC-C89 block as an extra asset
REPLACEMENT:
```text
### Asset: resolveSiteConfig
- **Name**: `resolveSiteConfig`, `parseAbsoluteHttpsOrigin`, `SiteConfigError`
- **Type**: Pure validators
- **Path**: `src/lib/seo/site-config.ts`
- **Purpose**: Validates the runtime-only `SITE_URL` (pure https origin; `http://localhost` is also accepted outside production) and returns the site config for `metadataBase`, canonical, sitemap and robots.
- **Scope**: `buildPageMetadata`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/instrumentation.ts` (fails fast at server start).
- **Dependencies**: `routing`, `constants/seo/metadata`.
- **Reuse Rule**: Never read `process.env.SITE_URL` elsewhere; no `NEXT_PUBLIC_*` fallback.
```

---

## Scanned, no change needed

| File | Reason |
|------|--------|
| `docs/instructor-admin.md` | Hits (`metadata`, stamp) are unrelated instructor identity/approval content; no home, proxy, SEO or cookie statement. |
| `docs/dependencies.md` | No package added or changed; `js-cookie` row (`src/lib/utils/cookie.ts` browser token access) and `knip` row remain accurate. |
| `docs/delivery.md` and `docs/delivery/*.md` | Realtime channel documents; only `metadata` of stream events and `credentials: "include"` hits, unrelated to this change. |
| `docs/router.md` L64, L153, L298-L299 | OAuth matcher exclusion, locale-less callbacks and the not-found `homeHref` CTA remain true (matcher and `homeHref` unchanged). |
| `docs/components.md` L114, L117, L125, L133, L185-L241 | Brand logo/header/dashboard links still use `homeHref` / `navigateToHome`; home section and image tables unchanged. |
| `docs/screens.md` L169 (`not-found` CTA `homeHref`), L340-L346 (hook composition tree) | Not-found CTA unchanged; the `useRedirectIfAuthenticated` / `useOAuthPostAuth` composition lines do not name the default destination. |
| `docs/logic-flow.md` L26-L29, L40-L47, L88-L117, L135 | Auth/transport steps unaffected; cookie names in the login diagram stay the same literals. |
| `docs/flow.md` L26-L113, L214, L238-L346 | Login/refresh sequences keep the same cookie names and logout keeps `router.replace("/")`; only the destination wording in DOC-C60 to DOC-C65 changes. |
| `docs/folder-structure.md` L228-L236, L250-L263 | Action/api trees keep their descriptions; cookie-name sourcing is covered by DOC-C46 and DOC-C48. |
| `docs/architecture.md` L14, L39, L511-L512 | Stack row, Knip and Biome notes unrelated to this change. |
