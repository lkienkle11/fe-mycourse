# SEO / Ranking / Performance / Security foundation

_Last audited: 2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL). Prior: 2026-10-16 (signed-in home page: hero carousel, Complete your Course, Trending Course and Popular Instructor read the catalog and learner-courses APIs; temporary `/courses/[slug]` placeholder; `UserAvatar` and `CourseThumbnail` under `src/components/shared`). Prior: 2026-10-15 (A12 slug helper row: `src/lib/utils/slug.ts` no longer holds a name-to-slug generator). Prior: 2026-07-26 (temporary signed-in `/home` under `(web)` + `PRIVATE_ROUTES.home`; most SEO helpers still unused by other pages)._

Source of truth for the SEO foundation under `src/types/seo/**`, `src/constants/seo/**`, `src/lib/seo/**`, `src/lib/performance/**`, and `src/lib/security/web/**`. Companion FE security notes: [`security-hardening-notes.md`](./security-hardening-notes.md). BE intent (take-note only): [`be-mycourse/docs/security-public-seo-notes.md`](../../be-mycourse/docs/security-public-seo-notes.md).

**Status:** the home pages and the crawl files are wired. The guest home `/{locale}` (`src/app/[locale]/(web)/page.tsx`) has `generateMetadata` built with `buildPageMetadata` and renders Organization JSON-LD (`buildOrganizationJsonLd` + `JsonLd`). The signed-in `/{locale}/home` (`.../home/page.tsx`) has `generateMetadata` returning its title and `robotsPreset(signedInHomeRobotsMode())` (noindex, nofollow). `login` and `signup` call `robotsPreset` / `robotsModeForPublicRouteKey` from their own `generateMetadata`. `src/app/robots.ts` and `src/app/sitemap.ts` (both `dynamic = "force-dynamic"`) serve `/robots.txt` and `/sitemap.xml` from `buildRobotsTxtRules` and `buildSitemapEntries`. `src/instrumentation.ts` validates `SITE_URL` when the server starts. The remaining helpers (`seoFetch` and `publicCacheProfiles`, the Course / Person / Breadcrumb / Article / Video / FAQ JSON-LD builders, `src/lib/performance/**`, `redact-client-payload`, the security header presets) are still not imported by any page or layout.

---

## Baseline (confirmed)

- Next.js **16.2.1**, App Router + `next-intl` (`localePrefix: "always"`); root `/` (`src/app/page.tsx`, using `routing.defaultLocale`) redirects to the default locale, and `src/proxy.ts` sends a signed-in session on `/{locale}` on to `/{locale}/home`.
- Root metadata in `src/app/layout.tsx` is `title` = `DEFAULT_SITE_NAME` (`MyCourse`) only, and `<html lang>` comes from `await getLocale()`. OG/Twitter/canonical/hreflang/JSON-LD are emitted per page (guest home); `src/app/robots.ts` and `src/app/sitemap.ts` serve `/robots.txt` and `/sitemap.xml`.
- Guest home uses **mock** course data (never used for metadata or JSON-LD). Signed-in `/home` is a login-required page (`PRIVATE_ROUTES.home`) that shows catalog and continue-learning data fetched client side; its route metadata is only a title plus noindex, nofollow robots.
- The BE exposes two public anonymous catalogue endpoints (`GET /api/v1/catalog/courses/trending`, `GET /api/v1/catalog/instructors/popular`; published-only projections, see `be-mycourse/docs/security-public-seo-notes.md`). The FE home reads them client side and does **not** register `publicCacheProfiles`. `learner-courses*` (including `/continue`) requires JWT + `course:read` and is per-user — never for SEO public cache.
- The frontend site origin is the server-only **runtime** env var `SITE_URL` (see "Site origin, crawl files and signed-in redirect" below and [`deploy.md`](./deploy.md)). Do not hard-code a domain. Do not use `NEXT_PUBLIC_API_URL` as canonical/`metadataBase`.

---

## Resource classification (A / B / C)

Agents must not confuse **reuse** (A) with **new files** (B) or **forbidden work** (C).

### A) Existing resources to consume / derive / document (do not fork)

| # | Asset | Path | Role for SEO foundation |
| --- | --- | --- | --- |
| A1 | Public cache registry | `src/api/server/cache-policy.ts` | Keep `publicCacheProfiles` **empty**. SEO wrap calls `resolvePublicCacheProfile` / `validatePublicCacheRequest` (fail-closed). |
| A2 | Server public GET | `src/api/server/server-raw-http.ts` `serverRawFetch` | SEO data helper **only** calls this. No parallel HTTP client. |
| A3 | Fetch core + helpers | `src/api/core/fetch-core.ts`, `fetch-helpers.ts` | URL/origin policy; SEO must not bypass. |
| A4 | Error redact allow-list | `src/api/core/fetch-error.ts` | Reuse `redactApiErrorUrl` / `sanitizeApiErrorCause`; client redact mirrors allow-list pattern. |
| A5 | Auth API transport | `src/api/transport/api-transport.ts` | Keep `no-store` for auth/dashboard; **not** for SEO public cache. |
| A6 | Route maps | `src/constants/route.ts` | Crawl/robots **derive** `PUBLIC_ROUTES` / `PRIVATE_ROUTES` / `PRIVATE_RESOURCE_ROUTES`. Sitemap uses a separate **SEO-indexable** allow-list of `PUBLIC_ROUTES` keys (not raw public-routable). |
| A6b | Flatten route tree | `src/lib/navigation/flatten-route-tree.ts` `flattenRouteTreePaths` | Single shared recursion for nested route constant objects; crawl-policy + sitemap private helpers reuse it (no duplicate flatten). |
| A7 | Nav href builders | `src/lib/navigation/routes.ts`, `home.ts` | Canonical/sitemap use `homeHref`, `toPublicRoute`, …; the post-auth default destination (`defaultPostAuthHref`, which equals `signedInHomeHref`) and the proxy redirect target use the signed-in home path; `courseDetailHref(slug)` builds the placeholder course link. |
| A8 | i18n locales + pathname | `src/i18n/routing.ts`, `navigation.ts` | `locales` / `defaultLocale` / `getPathname` for hreflang — do not invent locale lists. |
| A9 | URL assemble | `src/lib/utils/url.ts` `buildQueryParams` | Path/query assembly when needed. |
| A10 | Truncate Unicode | `src/lib/utils/unicode-length.ts` `truncateUnicodeCodePoints` | SERP/OG title & description truncation. |
| A11 | Delta plain text | `src/lib/utils/course-delta.ts` `extractPlainText` | Meta description from Quill when real data exists. |
| A12 | Slug helpers | `src/lib/utils/slug.ts` | `sanitizeSlugInput` / `SLUG_PATTERN` / `SLUG_MAX_LENGTH` / `isSlugAdjusted` for editable slugs. The FE has no name-to-slug generator (the BE generates slugs), so do not add a slugger for future canonical/SEO use. |
| A13 | HTTP URL parse pattern | `src/lib/instructor-application/url-validation.ts` | `site-config` validates `SITE_URL` as a pure origin with the same URL rules (mirror pattern; no instructor-form dependency); `resolveSiteConfig` adds the production-versus-development host rules. |
| A14 | Domain types | `src/types/course.ts`, `instructor.ts`, `taxonomy/`, `media/` | JSON-LD builders accept these; not home mock `CourseType`. The signed-in home types (`TrendingCourseItem`, `ContinueLearningItem`, `PopularInstructorItem`) are not wired into JSON-LD. |
| A15 | Fonts | `src/lib/font.ts` | Existing CWV font setup — cite only; no new font module. |
| A16 | Image sizes precedent | `src/components/home/course-card.tsx`, hero | Preset `sizes` normalized into performance policy constants. |
| A17 | Media MIME/ext | `src/lib/utils/media.ts` | Validate OG image extension when needed. |
| A18 | Metadata i18n pattern | `generateMetadata` + `getTranslations` (not-found, confirm-email, logout) | Factory mirrors this pattern; the guest home and `/home` pages use it. |
| A19 | Locale proxy | `src/proxy.ts` | Only middleware entry; no new `middleware.ts`. Wraps next-intl `createMiddleware(routing)` and adds the signed-in `/{locale}` to `/{locale}/home` redirect (logic in `src/lib/navigation/signed-in-home-redirect.ts`). |
| A20 | Nginx header docs | `docs/deploy.md` | Header draft FE aligns with X-Frame-Options / nosniff / Referrer-Policy already documented. |
| A21 | Docs catalog | `docs/reusable-assets.md`, api-overview, quality | Catalog updated when helpers are added. |

**BE assets (docs take-note only — no BE code this phase):** B1–B10 are listed in [`be-mycourse/docs/security-public-seo-notes.md`](../../be-mycourse/docs/security-public-seo-notes.md) (`ListPublishedCourses`, `filterPreviewOutline`, publish path, ratelimit NFR-1.1, auth/CORS/cookie, field matrix, slug uniqueness, media visibility, `/me` cache-aside).

### B) New resources

| # | Path | Purpose | Depends on |
| --- | --- | --- | --- |
| N1 | `src/types/seo/{metadata,ranking,data,performance}.ts` | Type-only SEO contracts (`SeoPageInput`, JSON-LD builder inputs, sitemap/fetch/rendering/image policy types) | A14; `src/constants/seo/**` for derived unions |
| N1b | `src/constants/seo/{metadata,routes,rendering,image,robots}.ts` | Plain SEO policy values only (limits/defaults, indexable route keys, rendering hints, image sizes, robots presets) | A6, A16 |
| N2 | `src/lib/seo/site-config.ts` | `resolveSiteConfig`: reads the server-only runtime `SITE_URL`. Production (`NODE_ENV=production`, so `next start` for staging and prod alike) requires a pure `https://` origin whose host is not loopback; non-production additionally accepts `http://localhost[:port]` and `http://127.0.0.1[:port]`. Optional `defaultOgImage` (no invented `/og-default.png`) | N1–N1b, A13, A8 |
| N3 | `src/lib/seo/build-page-metadata.ts` | `buildPageMetadata(): Metadata` — title, description, canonical, hreflang alternates for every locale plus `x-default` (built by the shared `buildLanguageAlternates` helper in `canonical.ts`, also used by the sitemap builder), robots preset, OG and Twitter; emits OG/Twitter **images only when** caller or site config supplies a real `SeoImage`. Used by the guest home. | N1–N2, N1b, A7, A8, A10 |
| N4 | `src/lib/seo/canonical.ts` | Absolute canonical from site origin + pathname; `buildLanguageAlternates` returns the per-locale canonical URLs plus `x-default`, shared by `build-page-metadata.ts` and `sitemap-builder.ts` | N2, A7, A8, A9 |
| N5 | `src/lib/seo/robots-presets.ts` | `indexable` / `noindex` / `privateApp` + `robotsModeForPublicRouteKey`; used by the guest home, `/home`, `login` and `signup` metadata | N1, `indexable-routes` |
| N5b | `src/lib/seo/indexable-routes.ts` | Runtime predicates/pathname helpers over `src/constants/seo/routes.ts` (`home` only) | A6, N1–N1b |
| N5c | `PRIVATE_ROUTES.home` (`src/constants/route.ts`) | Single source for the signed-in `/home` path (not SEO-indexable, derived into the robots.txt disallow list); there is no second `/home` constant under `src/constants/seo/**` | A6 |
| N6 | `src/lib/seo/sitemap-builder.ts` | Pure sitemap builder `buildSitemapEntries` (default-locale URL + hreflang alternates incl. `x-default` from `buildLanguageAlternates`); default pathnames = SEO-indexable only. Consumed by `src/app/sitemap.ts`. | A6, A6b, N5b, A7, A8 |
| N7 | `src/lib/seo/ranking/*.ts` | Organization / Course / Person / Breadcrumb / Article / Video / FAQ builders | A14 |
| N8 | `src/lib/seo/json-ld.tsx` | Server JSON-LD script + `\u003c` escape; rendered by the guest home with `buildOrganizationJsonLd({ name, url })` (no logo, no `sameAs`) | N7 |
| N9 | `src/constants/seo/rendering.ts` + `src/types/seo/data.ts` | SSG / SSR / ISR constants and derived type for SEO payloads | — |
| N10 | `src/lib/seo/data/seo-fetch.ts` | Thin wrap → `serverRawFetch` + fail-closed cache-policy | A1, A2 |
| N11 | `src/lib/performance/image-seo.ts` | Preset sizes + LCP/CLS policy | A16, A17 |
| N12 | `src/lib/performance/resource-hints.ts` | Preconnect / dns-prefetch builders (not injected) | — |
| N13 | `src/lib/security/web/crawl-policy.ts` | `privateCrawlDisallowPaths` (disallow lists from private routes via A6b), `publicCrawlAllowPaths` (aligned with SEO-indexable keys) and `signedInHomeRobotsMode` (`privateApp`); consumed by `buildRobotsTxtRules` and the `/home` metadata | A6, A6b |
| N14 | `src/lib/security/web/redact-client-payload.ts` | Allow-list / DTO redact for client props | A4 |
| N15 | `src/lib/security/web/sanitize-json-ld.ts` | Sanitize before serialize | N8 |
| N16 | `src/lib/security/web/security-headers-presets.ts` | Draft header map align deploy.md; CSP draft inactive | A20 |
| N17 | `src/lib/seo/robots-txt.ts` | Pure `buildRobotsTxtRules`: rules for `*` that allow the localized public roots (`publicCrawlAllowPaths()` through `localizedPathname`) and disallow every `privateCrawlDisallowPaths()` entry for every locale (`/vi/admin`, `/en/admin`, …) | N13, A6, A8 |
| N18 | `src/app/robots.ts`, `src/app/sitemap.ts` | `MetadataRoute.Robots` (rules from N17, `sitemap: <SITE_URL>/sitemap.xml`) and `MetadataRoute.Sitemap` (`buildSitemapEntries()`); both export `dynamic = "force-dynamic"` and bypass `src/proxy.ts` (its matcher excludes paths containing a dot) | N2, N6, N17 |
| N19 | `src/instrumentation.ts` | `register()` runs `resolveSiteConfig` at server start (nodejs runtime, `NODE_ENV=production`, skipped when `NEXT_PHASE=phase-production-build`); on failure it logs the `SiteConfigError` message with `console.error` and calls `process.exit(1)`, because Next 16 would otherwise keep the server alive and answer every request with HTTP 500 | N2 |
| N20 | `src/lib/navigation/signed-in-home-redirect.ts`, `src/constants/auth-cookie.ts` | `resolveSignedInHomeRedirectPath`, `getLocaleRootLocale` and `hasAuthSessionCookies` (pure logic used by `src/proxy.ts`); `auth-cookie.ts` holds the auth cookie names (`ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`, `SESSION_ID_COOKIE`, `AUTH_SESSION_EXPIRES_AT_COOKIE`, `LEGACY_AUTH_SESSION_MAX_AGE_COOKIE`, `AUTH_COOKIE_NAMES`) shared by the server auth, cookie and session helpers | A19, A7 |
| D1 | `docs/seo-ranking-setup.md` | This file | — |
| D2 | `docs/security-hardening-notes.md` | FE security helpers + link BE notes | — |

Optional barrel: `src/lib/seo/index.ts` (Knip `ignoreFiles` covers `**/index.ts`).

### Ownership rule

- `src/types/seo/**` is type-only: reusable contracts and builder inputs; no runtime values/functions.
- `src/constants/seo/**` is data-only: plain values; no functions/types.
- `src/lib/seo/**` and `src/lib/performance/**` retain runtime validation, mapping, builders, and React helpers.
- Feature-private implementation types stay beside their owner (for example `JsonLdProps`); generic web-security types remain with the security module rather than being mislabeled as SEO.
- Knip ignores `types`/`nsTypes`/`files` for all of `src/types/**` (same posture as other non-UI folders), because the foundation still contains helpers no page imports. Do not put unused orphans under `src/components/**`.

### C) Forbidden

- Create `opengraph-image.tsx`, or invent an OG image, an Organization `logo` or `sameAs` (no real asset or profile list exists).
- Expose `SITE_URL` as `NEXT_PUBLIC_*`, a Docker build arg or a GitHub secret (it is a runtime-only server variable), or change `next.config.ts`, `Dockerfile`, `docker/*.yml`, `ecosystem.config.cjs`, `deploy/nginx` or the GitHub workflows for it.
- Replace the guest `/` marketing home, or give `/home` a canonical, OG or JSON-LD, or an indexable robots mode (`/home` stays noindex, nofollow).
- Register `publicCacheProfiles`; call production APIs from server components (the client home calls them); build JSON-LD from home mock data.
- Add packages: `schema-dts`, `react-schemaorg`, `@next/bundle-analyzer`.
- Duplicate fetch / cache / route-list / slugger / truncate stacks; `OptimizedImage` wrapper; new `middleware.ts` (`src/proxy.ts` is the only entry); new font loader; a second private-path list, `/home` constant or auth cookie-name literal.
- Orphan React files under `src/components/**` (Knip `files` fails). Put `JsonLd` under `src/lib/seo/`.
- BE source code changes.

---

## Metadata & social (Open Graph / Twitter)

- Prefer **Open Graph** + **Twitter Card**. Discord, Slack, Teams, Zalo, Instagram, Threads largely consume OG — no per-network adapters without a separate requirement.
- `buildPageMetadata` composes title, description (Unicode-truncated via A10), canonical, hreflang alternates from A8 (every locale plus `x-default`, via the shared `buildLanguageAlternates` in `canonical.ts`), robots presets, OG, and Twitter.
- **OG/Twitter images:** emitted only when `SeoPageInput.image` or `resolveSiteConfig({ defaultOgImage })` provides a real asset. There is **no** placeholder `/og-default.png` in the repo; do not invent a 404 URL. The home pages currently pass no image, so their OG/Twitter cards have none. When an approved 1200×630 public asset exists, pass it explicitly and document ownership in `reusable-assets.md`.
- `site-config` reads **server-side** `process.env.SITE_URL` at request time only (never `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_API_URL`). Validation rejects username/password, non-empty pathname (must be `/` or empty), search, and hash — pure origin, no silent base-path drop. Production requires `https://` and a non-loopback host; non-production also accepts `http://localhost[:port]` and `http://127.0.0.1[:port]`.

## Public-routable vs SEO-indexable

- `PUBLIC_ROUTES` = publicly routable (no login gate at the constant layer). That is **not** the sitemap list.
- `SEO_INDEXABLE_PUBLIC_ROUTE_KEYS` (in `src/constants/seo/routes.ts`) is the allow-list of `PUBLIC_ROUTES` keys eligible for sitemap / crawl-allow. **Currently `home` only.**
- Auth-adjacent public routes (`forgotPassword`, `confirmEmail`, `logout`, `login`, `signup`) and other non-allow-listed public keys use `robotsModeForPublicRouteKey` → `noindex`. `login` and `signup` call `robotsModeForPublicRouteKey("login" | "signup")` + `robotsPreset(...)` from their `generateMetadata`. Do not put them in `buildSitemapEntries` defaults.

## JSON-LD / ranking

- Builders require **real** inputs (domain types). They do not invent rating, review, price, offer, discount, FAQ, video, author, or dates.
- FAQ only when Q&A is visible on the page; Video only with real public URL / thumbnail / duration / upload date; Course/Offer only with a future public DTO — never from mock cards.
- `JsonLd` escapes `<` to `\u003c` before embedding JSON in `<script type="application/ld+json">`.
- Description text from Quill uses `extractPlainText` (A11) when callers pass Delta-backed fields.

## Data modes (SSG / SSR / ISR)

- `src/constants/seo/rendering.ts` exposes named rendering values; `SeoRenderingMode` is derived in `src/types/seo/data.ts`.
- `seoFetch` is a typed thin wrapper over `serverRawFetch` + cache-policy. With an empty registry it **fail-closes** (`cache-profile-unknown`). No second fetch stack. `publicCacheProfiles` stays empty.
- Authenticated / personalized `/home` data must not use public cache. SEO HTML content must not rely only on client `useEffect` fetches for crawlers.
- **TEMPORARY dormant env cache hint (keep — do not delete):** `SEO_TEMPORARY_ENV_CACHE_POLICY` in `src/constants/seo/rendering.ts` plus `resolveSeoTemporaryRevalidateSeconds()` in `src/lib/seo/data/temporary-cache-policy.ts`. Flag `enabled` is **`false`** — no effect on pages/`seoFetch`/`publicCacheProfiles` this phase. When deliberately enabled later: development → `false` (immediate refresh / no ISR hold); production → `60` seconds temporary revalidate. Replace only after a permanent cache policy is approved.

## Performance

- `image-seo.ts` presets sizes from A16 (course-card / hero / promo). Policy requires alt, intrinsic dimensions or aspect ratio; `priority` only after LCP measurement.
- `resource-hints.ts` builds hint descriptors; **not** injected into the layout.
- Font CWV remains A15 (`src/lib/font.ts`). Helpers do not claim Core Web Vitals improvements until wired.

## Security (FE)

See [`security-hardening-notes.md`](./security-hardening-notes.md). Crawl policy derives disallow paths from `PRIVATE_ROUTES` / private resources and feeds `robots.txt` and the `/home` noindex mode. Redact is allow-list based. Header presets are drafts aligned with nginx in `deploy.md`; CSP remains inactive until One Tap / OAuth / media / proxy review.

## Site origin, crawl files and signed-in redirect

- **`SITE_URL`** is a server-only **runtime** variable: never `NEXT_PUBLIC_`, never a build arg, never a GitHub secret. Every consumer runs at request time, because all routes are dynamic and `src/app/robots.ts` / `src/app/sitemap.ts` export `dynamic = "force-dynamic"`. The same artifact is configured per environment through the container/PM2 runtime environment. The e2e server uses the fake origin `https://e2e.example.test`.
- **Validation:** `resolveSiteConfig` (`src/lib/seo/site-config.ts`) is the contract (production: pure non-loopback `https` origin; non-production also `http://localhost` / `http://127.0.0.1`). `register()` in `src/instrumentation.ts` calls it at server start (nodejs runtime, `NODE_ENV=production`, skipped while `NEXT_PHASE=phase-production-build`); a missing or invalid value is logged with `console.error` and the process exits with code 1, because Next 16 would otherwise keep serving HTTP 500 on every request.
- **`/robots.txt`:** rules for `*` allow the localized public roots (`publicCrawlAllowPaths()` through `localizedPathname`) and disallow every `privateCrawlDisallowPaths()` entry for every locale (`/vi/admin`, `/en/admin`, …); `sitemap: <SITE_URL>/sitemap.xml`. Rules are assembled by `buildRobotsTxtRules` (`src/lib/seo/robots-txt.ts`).
- **`/sitemap.xml`:** `buildSitemapEntries()` returns the default-locale URL with hreflang alternates including `x-default`; only `home` is indexable.
- Both files bypass `src/proxy.ts` (its matcher excludes paths containing a dot).
- **Signed-in redirect:** `src/proxy.ts` wraps next-intl `createMiddleware(routing)`. When the request path is exactly a locale root (`/vi`, `/en`, optional trailing slash) and **both** the `refresh_token` and `session_id` cookies are present (presence only, not validity), it answers `307` to `/{locale}/home` with `Cache-Control: private, no-store` and `Vary: Cookie` set on that redirect only (next-intl's `Set-Cookie` is copied). The guest page gets no extra `Vary`: Next answers dynamic pages with `Cache-Control: private, no-cache, no-store`. `/` is first redirected by next-intl to `/{locale}` and then handled the same way (two hops). Googlebot sends no cookies, so it always receives the public homepage. The reverse rule lives in the same proxy: `/vi/home` or `/en/home` without both cookies answers `307` to `/{locale}` (same headers; `resolveGuestHomeRedirectPath` in `signed-in-home-redirect.ts`), so a crawler or guest never lands on a sign-in screen at `/home`. A CDN must not cache `/`, `/vi` or `/en` (manual check). Pure logic: `resolveSignedInHomeRedirectPath`, `getLocaleRootLocale` and `hasAuthSessionCookies` in `src/lib/navigation/signed-in-home-redirect.ts`; cookie names come from `src/constants/auth-cookie.ts`.
- **Post-auth destination:** the default destination after login, OAuth, email confirmation and the login/signup popup is `defaultPostAuthHref` (`src/lib/navigation/routes.ts`, equal to `signedInHomeHref`). Logout, the brand logo and header links, not-found / error "back to home", `global-error` and the canonical default stay on `homeHref`.

---

## Tích hợp home

### Ý định route (current)

| Route | Đối tượng | Dữ liệu hiện tại | Index |
| --- | --- | --- | --- |
| `/{locale}` (`PUBLIC_ROUTES.home`) | Khách chưa đăng nhập | UI home marketing mock/static, chưa fetch API; JSON-LD Organization chỉ dùng tên và URL, không dùng dữ liệu mock. | Index: `generateMetadata` dùng `buildPageMetadata` (canonical `/{locale}`, hreflang vi + en + `x-default`, OG/Twitter không ảnh); key `home` nằm trong allow-list SEO-indexable và trong `sitemap.xml`. |
| `/{locale}/home` (`PRIVATE_ROUTES.home`) | Người đã đăng nhập | Trang chủ đã đăng nhập: hero carousel, Complete your Course, Trending Course, Popular Instructor; dữ liệu lấy từ API catalog và learner-courses ở phía client; auth gate phía client; `generateMetadata` chỉ trả về tiêu đề (`home.signedIn.pageTitle`) và `robots`. | Không index: `robots` = noindex, nofollow (`robotsPreset(signedInHomeRobotsMode())`, preset `privateApp`) và đường dẫn nằm trong danh sách disallow của `robots.txt` suy ra từ `PRIVATE_ROUTES`; không có canonical, OG hay JSON-LD. |

Locale note: with `localePrefix: "always"`, user-facing paths are `/vi`, `/en`, `/vi/home`, `/en/home`.

Chuyển hướng đã đăng nhập: `src/proxy.ts` trả `307` từ `/vi` hoặc `/en` sang `/{locale}/home` khi request có đủ cả hai cookie `refresh_token` và `session_id` (chỉ kiểm tra có mặt, không kiểm tra hợp lệ), kèm `Cache-Control: private, no-store` và `Vary: Cookie` trên response chuyển hướng. Truy cập `/` đi hai bước: next-intl chuyển sang `/{locale}`, rồi proxy xử lý như trên. Googlebot không gửi cookie nên luôn nhận trang home công khai.

### Nội dung `/home` theo Figma (đã triển khai một phần)

Đã triển khai: hero carousel 3 slide (không có nút mũi tên; kéo/vuốt hoặc bấm dot; tự chuyển sang phải sau 3 giây, đặt lại khi người dùng chuyển thủ công), Complete your Course, Trending Course, Popular Instructor. Không triển khai (quyết định sản phẩm): topic chips, "More from MyCourse Studio", "Popular Category", badge/giá/rating trên card (BE không trả các field này).

Figma file `Mh8LEZPNctm96sQhhTNRJD`, signed-in home frame (e.g. node `4990:51595`). Verified visually 2026-07-25:

1. **Hero full-width:** collage học tập/nghề nghiệp; overlay đỏ/nâu bán trong suốt; H1 `Learn something new everyday.`; subtitle `Become professionals and ready to join the world.`
2. **Topic chips:** chip bo tròn responsive; selected = teal. Examples: `All Recommendation`, `Adobe Illustrator`, `Adobe Photoshop`, `UI Design`, `Web Programming`, `Mobile Programming`, `Backend Development`, `Vue JS`.
3. **“Based on your interest”:** heading + `We know the best things for You. Top picks for You.` + one row of four course cards (desktop).
4. **“Trending Course”:** same structure; multi-row four-column grid.
5. **Course card:** cover bo góc; badge Best Seller / discount; title; author; short description; rating + review count; current price + struck-through old price.
6. **Below fold:** promotional / banner slot after the course grids.

All Figma text, ratings, prices, and courses are **UI illustration only** — not metadata, schema, or course data until a real public DTO/API exists.

### SEO / performance constraints for that layout

- One H1 in hero; section H2s for the two course blocks; cards become canonical links only when real course routes exist.
- Chips use real interactive semantics (not text-only click targets).
- Images: alt + width/height or aspect ratio (CLS); `priority` only for measured LCP.
- Never put user interest, enrollment, history, identity, or personalized data into title, description, canonical, OG, JSON-LD, or public cache.
- Dữ liệu home là dữ liệu động/cá nhân phía client: không đưa vào metadata, JSON-LD hay public cache; **không** dùng JSON-LD `Course` / `Offer` / `AggregateRating` / FAQ / video từ dữ liệu này.

### Guest `/{locale}` (hiện tại)

- Trang home marketing theo locale vẫn dùng dữ liệu mock.
- `generateMetadata` trong `src/app/[locale]/(web)/page.tsx` gọi `buildPageMetadata`: title/description lấy từ các key i18n `homepage.seo.title` / `homepage.seo.description`, canonical `/{locale}`, hreflang vi + en + `x-default`, OG + Twitter không có ảnh (repo chưa có asset ảnh thật và không bịa ảnh), robots indexable.
- Trang render JSON-LD Organization qua `buildOrganizationJsonLd({ name, url })` + `JsonLd` (không có logo, không có `sameAs`). JSON-LD không bao giờ lấy dữ liệu course mock.
- Origin lấy từ `SITE_URL` (biến runtime phía server, xem mục "Site origin, crawl files and signed-in redirect").

---

## ChatGPT discussion alignment (§1–15 themes)

Synthetic metadata factory, OG/Twitter, JSON-LD, sitemap/robots builders, rendering modes over the existing server fetch + fail-closed cache registry, performance presets, and crawl/redact/header hardening — reusable layers, not hand-copied per page. The metadata factory, the Organization JSON-LD builder, the sitemap and robots builders and the crawl policy are wired into the home pages, `robots.ts` and `sitemap.ts`; the fetch wrapper, the other JSON-LD builders, the performance presets and the redact and header helpers are not wired yet. Temporary discussion notes are not SoT; this file + code under `src/lib/**` are.

---

## Wiring checklist (remaining work)

1. Call `buildPageMetadata` from every further indexable page's `generateMetadata` (wired today: guest `/{locale}`), adding its key to `SEO_INDEXABLE_PUBLIC_ROUTE_KEYS` so the sitemap and robots allow list pick it up.
2. Add reviewed `publicCacheProfiles` entries before any `seoFetch` production use.
3. Keep `/home` on `privateApp` (noindex, nofollow) unless product proves a public, non-personalized slice is safe to index.
4. Add Course / Person / Breadcrumb / Article / Video / FAQ `JsonLd` only with real published DTOs (Organization is the only builder in use, with name and URL only).
5. Supply a real approved OG image asset (and the Organization `logo` / `sameAs` once they exist) through `defaultOgImage` / `SeoPageInput.image`.
