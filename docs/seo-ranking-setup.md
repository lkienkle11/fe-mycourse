# SEO / Ranking / Performance / Security foundation

_Last audited: 2026-07-26 (temporary signed-in `/home` under `(web)` + `PRIVATE_ROUTES.home`; most SEO helpers still unused by other pages)._

Source of truth for the SEO foundation under `src/types/seo/**`, `src/constants/seo/**`, `src/lib/seo/**`, `src/lib/performance/**`, and `src/lib/security/web/**`. Companion FE security notes: [`security-hardening-notes.md`](./security-hardening-notes.md). BE intent (take-note only): [`be-mycourse/docs/security-public-seo-notes.md`](../../be-mycourse/docs/security-public-seo-notes.md).

**Status:** helpers exist for future `generateMetadata` / JSON-LD / crawl policy. They are **not** imported from `layout.tsx`, route `page.tsx`, `app/sitemap.ts`, or `app/robots.ts` in this phase. The temporary `/{locale}/home` route ships **without** page metadata; its crawl protection comes from `PRIVATE_ROUTES` disallow derivation only.

---

## Baseline (confirmed)

- Next.js **16.2.1**, App Router + `next-intl` (`localePrefix: "always"`); root `/` redirects to the default locale.
- Root metadata today is title/description only in `src/app/layout.tsx` — no OG/Twitter/JSON-LD/sitemap/robots under `src/`.
- Guest home uses **mock** course data. Signed-in `/home` exists as a **temporary** login-required placeholder (`PRIVATE_ROUTES.home`); Figma UI and personalized API data are not shipped.
- BE has **no** public anonymous course catalogue (`be-mycourse/docs/modules.md` Planned). `learner-courses*` requires JWT + `course:read` — not for SEO public cache.
- No frontend site origin env yet. Do not hard-code a domain. Do not use `NEXT_PUBLIC_API_URL` as canonical/`metadataBase`. Future server-side `SITE_URL` is documented in [`deploy.md`](./deploy.md) only (env files / nginx / PM2 unchanged this phase).

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
| A7 | Nav href builders | `src/lib/navigation/routes.ts`, `home.ts` | Canonical/sitemap use `homeHref`, `toPublicRoute`, … |
| A8 | i18n locales + pathname | `src/i18n/routing.ts`, `navigation.ts` | `locales` / `defaultLocale` / `getPathname` for hreflang — do not invent locale lists. |
| A9 | URL assemble | `src/lib/utils/url.ts` `buildQueryParams` | Path/query assembly when needed. |
| A10 | Truncate Unicode | `src/lib/utils/unicode-length.ts` `truncateUnicodeCodePoints` | SERP/OG title & description truncation. |
| A11 | Delta plain text | `src/lib/utils/course-delta.ts` `extractPlainText` | Meta description from Quill when real data exists. |
| A12 | Slug helper | `src/lib/utils/slug.ts` | Future slug UI/canonical; no second slugger. |
| A13 | HTTP URL parse pattern | `src/lib/instructor-application/url-validation.ts` | `site-config` validates `SITE_URL` with the same HTTPS URL rules (mirror pattern; no instructor-form dependency). |
| A14 | Domain types | `src/types/course.ts`, `instructor.ts`, `taxonomy/`, `media/` | JSON-LD builders accept these; not home mock `CourseType`. |
| A15 | Fonts | `src/lib/font.ts` | Existing CWV font setup — cite only; no new font module. |
| A16 | Image sizes precedent | `src/components/home/course-card.tsx`, hero | Preset `sizes` normalized into performance policy constants. |
| A17 | Media MIME/ext | `src/lib/utils/media.ts` | Validate OG image extension when needed. |
| A18 | Metadata i18n pattern | `generateMetadata` + `getTranslations` (not-found, confirm-email, logout) | Factory mirrors this pattern; pages unchanged this phase. |
| A19 | Locale proxy | `src/proxy.ts` | Only middleware entry; no new `middleware.ts`. |
| A20 | Nginx header docs | `docs/deploy.md` | Header draft FE aligns with X-Frame-Options / nosniff / Referrer-Policy already documented. |
| A21 | Docs catalog | `docs/reusable-assets.md`, api-overview, quality | Catalog updated when helpers are added. |

**BE assets (docs take-note only — no BE code this phase):** B1–B10 are listed in [`be-mycourse/docs/security-public-seo-notes.md`](../../be-mycourse/docs/security-public-seo-notes.md) (`ListPublishedCourses`, `filterPreviewOutline`, publish path, ratelimit NFR-1.1, auth/CORS/cookie, field matrix, slug uniqueness, media visibility, `/me` cache-aside).

### B) New resources created this phase (unused)

| # | Path | Purpose | Depends on |
| --- | --- | --- | --- |
| N1 | `src/types/seo/{metadata,ranking,data,performance}.ts` | Type-only SEO contracts (`SeoPageInput`, JSON-LD builder inputs, sitemap/fetch/rendering/image policy types) | A14; `src/constants/seo/**` for derived unions |
| N1b | `src/constants/seo/{metadata,routes,rendering,image,robots}.ts` | Plain SEO policy values only (limits/defaults, indexable route keys, rendering hints, image sizes, robots presets) | A6, A16 |
| N2 | `src/lib/seo/site-config.ts` | Runtime contract/validate **pure** `SITE_URL` origin (`https://host` only); optional `defaultOgImage` (no invented `/og-default.png`) | N1–N1b, A13, A8 |
| N3 | `src/lib/seo/build-page-metadata.ts` | `buildPageMetadata(): Metadata` — emits OG/Twitter **images only when** caller or site config supplies a real `SeoImage` | N1–N2, N1b, A7, A8, A10 |
| N4 | `src/lib/seo/canonical.ts` | Absolute canonical from site origin + pathname | N2, A7, A8, A9 |
| N5 | `src/lib/seo/robots-presets.ts` | `indexable` / `noindex` / `privateApp` + `robotsModeForPublicRouteKey` | N1, `indexable-routes` |
| N5b | `src/lib/seo/indexable-routes.ts` | Runtime predicates/pathname helpers over `src/constants/seo/routes.ts` (`home` only) | A6, N1–N1b |
| N5c | `src/constants/seo/routes.ts` `SIGNED_IN_HOME_PATH` | Constant `/home` aligned with `PRIVATE_ROUTES.home` (not SEO-indexable) | A6 |
| N6 | `src/lib/seo/sitemap-builder.ts` | Pure sitemap builder; default pathnames = SEO-indexable only | A6, A6b, N5b, A7, A8 |
| N7 | `src/lib/seo/ranking/*.ts` | Organization / Course / Person / Breadcrumb / Article / Video / FAQ builders | A14 |
| N8 | `src/lib/seo/json-ld.tsx` | Server JSON-LD script + `\u003c` escape | N7 |
| N9 | `src/constants/seo/rendering.ts` + `src/types/seo/data.ts` | SSG / SSR / ISR constants and derived type for SEO payloads | — |
| N10 | `src/lib/seo/data/seo-fetch.ts` | Thin wrap → `serverRawFetch` + fail-closed cache-policy | A1, A2 |
| N11 | `src/lib/performance/image-seo.ts` | Preset sizes + LCP/CLS policy | A16, A17 |
| N12 | `src/lib/performance/resource-hints.ts` | Preconnect / dns-prefetch builders (not injected) | — |
| N13 | `src/lib/security/web/crawl-policy.ts` | Disallow lists from private routes via A6b; public crawl-allow aligns with SEO-indexable keys | A6, A6b |
| N14 | `src/lib/security/web/redact-client-payload.ts` | Allow-list / DTO redact for client props | A4 |
| N15 | `src/lib/security/web/sanitize-json-ld.ts` | Sanitize before serialize | N8 |
| N16 | `src/lib/security/web/security-headers-presets.ts` | Draft header map align deploy.md; CSP draft inactive | A20 |
| D1 | `docs/seo-ranking-setup.md` | This file | — |
| D2 | `docs/security-hardening-notes.md` | FE security helpers + link BE notes | — |

Optional barrel: `src/lib/seo/index.ts` (Knip `ignoreFiles` covers `**/index.ts`).

### Ownership rule

- `src/types/seo/**` is type-only: reusable contracts and builder inputs; no runtime values/functions.
- `src/constants/seo/**` is data-only: plain values; no functions/types.
- `src/lib/seo/**` and `src/lib/performance/**` retain runtime validation, mapping, builders, and React helpers.
- Feature-private implementation types stay beside their owner (for example `JsonLdProps`); generic web-security types remain with the security module rather than being mislabeled as SEO.
- Because this foundation is intentionally not wired, Knip ignores `types`/`nsTypes`/`files` for all of `src/types/**` (same posture as other non-UI folders). Do not put unused orphans under `src/components/**`.

### C) Forbidden this phase

- Wire SEO helpers broadly into `layout.tsx` / guest pages; create `app/sitemap.ts`, `app/robots.ts`, `opengraph-image.tsx`.
- Change `next.config.ts`, `.env`, `.env.example`, nginx, PM2.
- Replace guest `/` marketing home or ship full Figma signed-in `/home` UI / personalized API data (temporary `/home` placeholder + `privateApp` metadata is allowed).
- Register `publicCacheProfiles`; call production APIs; build JSON-LD from home mock data.
- Add packages: `schema-dts`, `react-schemaorg`, `@next/bundle-analyzer`.
- Duplicate fetch / cache / route-list / slugger / truncate stacks; `OptimizedImage` wrapper; new `middleware.ts`; new font loader.
- Orphan React files under `src/components/**` (Knip `files` fails). Put `JsonLd` under `src/lib/seo/`.
- BE source code changes.

---

## Metadata & social (Open Graph / Twitter)

- Prefer **Open Graph** + **Twitter Card**. Discord, Slack, Teams, Zalo, Instagram, Threads largely consume OG — no per-network adapters without a separate requirement.
- `buildPageMetadata` composes title, description (Unicode-truncated via A10), canonical, hreflang alternates from A8, robots presets, OG, and Twitter.
- **OG/Twitter images:** emitted only when `SeoPageInput.image` or `resolveSiteConfig({ defaultOgImage })` provides a real asset. There is **no** placeholder `/og-default.png` in the repo; do not invent a 404 URL. When an approved 1200×630 public asset exists, pass it explicitly and document ownership in `reusable-assets.md`.
- `site-config` reads optional **server-side** `process.env.SITE_URL` only (never `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_API_URL`). Validation rejects username/password, non-empty pathname (must be `/` or empty), search, and hash — pure `https://` origin, no silent base-path drop.

## Public-routable vs SEO-indexable

- `PUBLIC_ROUTES` = publicly routable (no login gate at the constant layer). That is **not** the sitemap list.
- `SEO_INDEXABLE_PUBLIC_ROUTE_KEYS` (in `src/constants/seo/routes.ts`) is the allow-list of `PUBLIC_ROUTES` keys eligible for sitemap / crawl-allow. **Phase now: `home` only.**
- Auth-adjacent public routes (`forgotPassword`, `confirmEmail`, `logout`) and other non-allow-listed public keys use `robotsModeForPublicRouteKey` → `noindex` when wired. Do not put them in `buildSitemapEntries` defaults.

## JSON-LD / ranking

- Builders require **real** inputs (domain types). They do not invent rating, review, price, offer, discount, FAQ, video, author, or dates.
- FAQ only when Q&A is visible on the page; Video only with real public URL / thumbnail / duration / upload date; Course/Offer only with a future public DTO — never from mock cards.
- `JsonLd` escapes `<` to `\u003c` before embedding JSON in `<script type="application/ld+json">`.
- Description text from Quill uses `extractPlainText` (A11) when callers pass Delta-backed fields.

## Data modes (SSG / SSR / ISR)

- `src/constants/seo/rendering.ts` exposes named rendering values; `SeoRenderingMode` is derived in `src/types/seo/data.ts`.
- `seoFetch` is a typed thin wrapper over `serverRawFetch` + cache-policy. With an empty registry it **fail-closes** (`cache-profile-unknown`). No second fetch stack. No production profile registration this phase.
- Authenticated / personalized `/home` data must not use public cache. SEO HTML content must not rely only on client `useEffect` fetches for crawlers.
- **TEMPORARY dormant env cache hint (keep — do not delete):** `SEO_TEMPORARY_ENV_CACHE_POLICY` in `src/constants/seo/rendering.ts` plus `resolveSeoTemporaryRevalidateSeconds()` in `src/lib/seo/data/temporary-cache-policy.ts`. Flag `enabled` is **`false`** — no effect on pages/`seoFetch`/`publicCacheProfiles` this phase. When deliberately enabled later: development → `false` (immediate refresh / no ISR hold); production → `60` seconds temporary revalidate. Replace only after a permanent cache policy is approved.

## Performance

- `image-seo.ts` presets sizes from A16 (course-card / hero / promo). Policy requires alt, intrinsic dimensions or aspect ratio; `priority` only after LCP measurement.
- `resource-hints.ts` builds hint descriptors; **not** injected into layout this phase.
- Font CWV remains A15 (`src/lib/font.ts`). Helpers do not claim Core Web Vitals improvements until wired.

## Security (FE)

See [`security-hardening-notes.md`](./security-hardening-notes.md). Crawl policy derives disallow paths from `PRIVATE_ROUTES` / private resources. Redact is allow-list based. Header presets are drafts aligned with nginx in `deploy.md`; CSP remains inactive until One Tap / OAuth / media / proxy review.

---

## Tích hợp home

### Ý định route (current)

| Route | Đối tượng | Dữ liệu hiện tại | Index |
| --- | --- | --- | --- |
| `/` (`PUBLIC_ROUTES.home`) | Khách chưa đăng nhập | UI home marketing mock/static, chưa fetch API. | SEO-indexable allow-list key `home` (wire later). |
| `/home` (`PRIVATE_ROUTES.home`) | Người đã đăng nhập | **Temporary** placeholder + client auth gate; no API; no Figma sections. | **`privateApp` / noindex** via route `generateMetadata`. Included in crawl disallow through `PRIVATE_ROUTES`. |

Locale note: with `localePrefix: "always"`, user-facing paths are `/vi`, `/en`, `/vi/home`, `/en/home`.

### Nội dung `/home` theo Figma (later — not this temporary ship)

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
- While mock/no API: general home metadata only; **no** JSON-LD `Course` / `Offer` / `AggregateRating` / FAQ / video from illustration data.

### Guest `/` (current)

- Existing marketing home under locale routes remains mock-driven.
- Future SEO wire may attach `buildPageMetadata` + optional Organization JSON-LD only after real site config (`SITE_URL`) and content policy are approved.

---

## ChatGPT discussion alignment (§1–15 themes)

Synthetic metadata factory, OG/Twitter, JSON-LD, sitemap/robots builders, rendering modes over the existing server fetch + fail-closed cache registry, performance presets, and crawl/redact/header hardening — all as **reusable unused** layers, not hand-copied per page. Temporary discussion notes are not SoT; this file + code under `src/lib/**` are.

---

## Wiring checklist (future phase)

1. Approve `SITE_URL` and document in env/deploy.
2. Call `buildPageMetadata` from selected `generateMetadata` owners (guest `/` and `/home` both still unwired — `/home` intentionally has no route metadata yet).
3. Add reviewed `publicCacheProfiles` entries before any `seoFetch` production use.
4. Keep `/home` on `privateApp` unless product proves a public, non-personalized slice is safe to index.
5. Add `app/sitemap.ts` / `app/robots.ts` consumers of the pure builders.
6. Wire `JsonLd` only with real published DTOs.
7. Replace temporary `/home` placeholder with Figma signed-in layout when product/API are ready.
