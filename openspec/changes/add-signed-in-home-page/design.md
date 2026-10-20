## Context

See `proposal.md` for motivation and `specs/{signed-in-home,home-catalog-contract,course-detail-placeholder}/spec.md` for the requirements. Companion documents: `code-change-inventory.md` (exact current and after code, call sites, reuse ledger, no-change consumers) and `docs-update-inventory.md` (current and replacement text per documentation passage, `DOC-n` IDs). This change is frontend only (`fe-mycourse`); `be-mycourse` is read-only evidence.

### Evidence sources (AGENTS.md order: GitNexus, then docs, then source)

1. **GitNexus** (`fe-mycourse`, index at `5a40767`, two commits behind HEAD `af62c40`): every `impact` call returned `UNKNOWN` with zero callers and zero processes, and constants are not indexed as symbols. The graph is therefore **not an authority**; task 6 re-runs `npx gitnexus analyze` first and records the result, and the grep and read results below replace it. `.codegraph` does not exist.
2. **Docs**: `docs/*.md` (every file scanned for home, catalog, trending, continue learning, route tables, folder trees, i18n and image statements), `README.md`, `be-mycourse/docs/{modules/course.md,modules/instructor.md,modules/enrollment.md,return_types.md,api_swagger.yaml,security-public-seo-notes.md}`, and the checkpoint export `temporary-docs/claude-doanchat/Claude-Home page catalog APIs (...).md` (backend decisions, backend smoke test, Figma analysis).
3. **Source**: `src/**`, `e2e/**`, `be-mycourse/internal/{course,instructor}/delivery/*`.
4. **Figma** (file `Mh8LEZPNctm96sQhhTNRJD`, frame `5139:10435`, 1440×3641): structure read through `get_metadata` and a screenshot; per-card style (colours, fonts, spacing) and the overlay treatment for slides 2 and 3 are read with `get_design_context` at implementation time (task 8.1).

### Current state (HEAD `af62c40`, branch `feat/sync-user-slug-contract`, tree clean apart from the untracked change directory)

- `/home` = `src/app/[locale]/(web)/home/page.tsx` → `SignedInHomePage` (`src/screen/common/home/signed-in-home-page.tsx`, client component): `useGetMe`; spinner while loading; guest sees `home.signedIn.loginRequired.*` and a `Link` to `loginHref(signedInHomeHref)`; signed-in user sees `home.signedIn.title` and `home.signedIn.temporaryNotice`. No API call, no route metadata (a product decision recorded in `docs/screens.md`, `docs/pages.md`, `docs/seo-ranking-setup.md`).
- Importers of `SignedInHomePage`: `home/page.tsx:1` and the barrel `src/screen/common/index.ts:2`. No jest test, e2e spec or message assertion references the placeholder text (grep over `src` and `e2e`).
- `API_PUBLIC_ROUTES` holds only `auth` (`src/constants/api-route.ts:2-15`). `API_PRIVATE_ROUTES.course` already has `learnerCollection`, `learnerById`, `learnerEnroll`, `learnerProgress` (`:90-93`) but no continue route. `PUBLIC_RESOURCE_ROUTES` is an empty object (`src/constants/route.ts`, the only slot for public dynamic routes) and `toPublicResourceRoute` exists but is unused.
- Callers follow a request-scoped factory: `createCourseCallers` (`course-factory.ts`) spreads `createCourseCoreCallers` and `createCourseReviewCallers`; `course-browser.ts` binds `browserApiMethods` and re-exports each service; `course-keys.ts` owns URL/key helpers; hooks live in `src/api/hooks/course/useCourses.ts` over `useApiRowsQuery` (`src/api/hooks/shared.ts:53`). The learner endpoints (`listPublishedCoursesService`, `getLearningCourseService`) live in `course-factory-review.ts:164-200`; no component consumes them. Their SWR keys are bare strings (`"published-courses"`, `` `learning-course-${id}` ``) and are **not** a model to copy.
- Transport: `apiFetch` always sends `credentials: "include"` and `cache: "no-store"` (`api-transport.ts:347-350`); a public endpoint returning 200 works through it, and a 401 on a public endpoint cannot occur. `src/api/server/cache-policy.ts` `publicCacheProfiles` is empty, so the server public cache path rejects every request.
- `next.config.ts` has **no** `images` block. Remote images already use `unoptimized` (`media-item-card.tsx:120`, `image-file-field.tsx:52`).
- `src/proxy.ts` is only the `next-intl` middleware: `/home` is gated on the client (`useGetMe`) and nothing in this change adds a server gate.
- ESLint constraints that shape file placement (`eslint.config.mjs`): `src/screen` allows only `page.tsx`, `*-page.tsx` and `index.ts`; `src/types/**` is type-only; `src/constants/**` is values-only; `max-lines` 700; no inline lint directives. `knip` checks unreachable files (every new component must be imported); `jscpd` runs inside `npm run dupl` (threshold 10, minLines 10, minTokens 100; `src/components/ui` excluded); `madge --circular` runs inside `quality:deps`.
- Backend contract (verified in code and in the 2026-10-16 smoke test): see `specs/home-catalog-contract/spec.md`. Verified specifically: `popularInstructorResponse` emits the picture as `avatar` (`internal/instructor/delivery/dto.go:158-165`); the continue route is guarded by `course:read` (`internal/course/delivery/routes.go:54`) which every real role (learner, instructor, admin, sysadmin) holds; `limit` is clamped server side by `ClampQueryLimit` (defaults 8/4/4, maxima 24/12/10).

## Goals / Non-Goals

**Goals:**

- Replace the placeholder with the Figma-faithful signed-in home (hero carousel, Complete your Course, Trending Course, Popular Instructor) using only data the backend returns.
- Add the three-endpoint client layer through the existing caller factory, keys and hooks, with no new transport, no new dependency and no duplicate of an existing capability.
- Collapse duplicated capabilities into modules owned by their domain: user avatar, section header, course thumbnail, section state handling.
- Keep every consumer, test, fixture and document consistent so `npm run check-all` stays green and the docs describe the final state.

**Non-Goals:**

- The guest home `/` and every `src/components/home/*` mock section (including the mock `CourseCard`) stay untouched; the shared `Header` and `Footer` stay untouched (the Figma navbar differs slightly: Browse dropdown, no locale switcher; accepted).
- "More from MyCourse Studio" and "Popular Category" (present in Figma, excluded by the product owner).
- Price, discount, badge, rating, review count, taxonomy chips, search and any personalised recommendation.
- A real course detail page, an instructor public page or a get-by-slug endpoint.
- Server-side rendering of the home data, `publicCacheProfiles`, ISR, JSON-LD and route metadata for `/home`.
- Any backend, swagger or database change; the backend rate limit, cache and `EXPLAIN` verification remain unverified (reported, not worked around).

## Codebase-wide capability audit (Reuse and Deduplication)

Three read-only investigations ran in parallel (documentation, code reuse and duplication, GitNexus/impact and flows) and their findings were re-checked against the files cited. The capability under change is "show backend catalogue and learner data as cards on a page"; for each sub-capability the verdict and the owning module are fixed here so the implementation cannot invent a second copy.

### Reused as-is (nothing new is written)

| Capability | Existing module | Used for |
|---|---|---|
| Authenticated/unauthenticated JSON GET | `browserApiMethods.apiFetch` via `createApiMethods` (`src/api/core/methods.ts`) | all three endpoints (public ones too: consistent with every caller, error reporting included) |
| Array-shaped SWR query | `useApiRowsQuery` (`src/api/hooks/shared.ts:53`) | all three hooks (a `null` key disables the fetch) |
| Query string assembly | `buildQueryParams` (`src/lib/utils/url.ts:25`) | `?limit=` |
| URL-or-throw guard | `requireUrl` (`course-keys.ts:16`) | the new course service when a key can be null (kept consistent with siblings) |
| Response envelope | `ApiResponse<T>` (`src/types/api.ts:30`) | `data.data ?? []` pattern of `listPublishedCoursesService` |
| SWR defaults (30 s dedupe, 3 min error retry, no focus revalidation) | `DEFAULT_SWR_CONFIG` via `AppProviders` | no per-hook override |
| Current user and permission | `useGetMe` (`src/hooks/auth/use-auth-store.ts`), `useHasPermission` (`use-permissions.ts:28`), `PERMISSIONS.CourseRead` (`src/constants/permissions.ts:9`) | login gate, continue gating |
| Login CTA and href | `loginHref`, `signedInHomeHref` (`src/lib/navigation/routes.ts`) | unchanged gate |
| Carousel | `Carousel*` (`src/components/ui/carousel.tsx`, Embla, `setApi`) | hero |
| Primitives | `Card*`, `Skeleton`, `Progress`, `Empty*`, `Button`, `AspectRatio` (`src/components/ui`) | cards, states |
| Initials fallback | `pickCharacter` (`src/lib/utils/user.ts:7`) | inside the shared `UserAvatar` |
| Image sizes presets | `IMAGE_SIZES_COURSE_CARD` (existing); new `IMAGE_SIZES_HERO_TILE`, `IMAGE_SIZES_HERO_PHOTO` (`src/constants/seo/image.ts`) | `sizes` of thumbnails and hero images |
| Route builder | `toPublicResourceRoute`, `PUBLIC_RESOURCE_ROUTES` (empty today) | `courseDetailHref` |
| Test infrastructure | `renderWithProviders`, MSW `server`, `buildMeResponse`, `mock-app-router` | all new tests |
| E2E harness | `e2e/fixtures/server.mjs`, `fixture-client.ts`, `auth.ts` | one new journey |
| Error classification | `classifyApiError` (`src/lib/utils/api-error.ts:118`) | not used for the per-section error (full-page `StatusErrorPage` is too heavy; plain `Empty*` + retry button) |

### Merged or newly shared (same business meaning, more than one declaration or an imminent second copy)

| ID | Capability | Existing implementations (file:line) | Verdict | Owner / shared module |
|---|---|---|---|---|
| CAP-1 | "A user's picture or coloured initials in a circle" | `components/common/auth-menu/user-menu.tsx:18-48`, `components/common/header/sidebar-auth-footer.tsx:43-60`, `components/features/instructor/instructor-user-cell.tsx:31-57`, `screen/common/instructor/instructor-roster-page.tsx:145-170`, `components/features/instructor/instructor-profile-view-dialog.tsx:76-125` (all: `next/image` when a URL exists, otherwise a `pickCharacter` coloured initial; only the size differs) | **MERGE**: one `UserAvatar` (props: `name`, `src?`, `sizeClassName`/size, `alt?`); the new popular-instructor card uses it; each of the five copies is migrated **after its markup is read in full** and only when the behaviour is the same (task 7.3); a copy whose behaviour differs (for example a non-circular crop or a different fallback) keeps its own code and the reason is written into `code-change-inventory.md` | `src/components/shared/user-avatar.tsx` (neutral, imported by features; no sibling-feature import) |
| CAP-2 | "Section title with a muted description line" | hand-copied in `components/home/top-courses-section.tsx:75-90`, `trending-courses-section.tsx:63-77`, `upcoming-webinars-section.tsx:42-58`, `advanced-promo-section.tsx` (two shapes: left-aligned with a "view all" button; centred with a badge) | **MERGE (left-aligned shape only)**: one `SectionHeader` used by the three new sections; the guest mock sections are migrated only when their left-aligned markup is identical (task 7.4). They are mock-only sections of the page the product owner asked to leave unchanged, so any section whose markup differs in a way that would alter its rendering stays as is and the reason is recorded | `src/components/shared/section-header.tsx` |
| CAP-3 | "Remote course thumbnail with placeholder" | `components/home/course-card.tsx:36-49` (mock card), `components/features/media/media-item-card.tsx:113-139` (`unoptimized` image or `Empty` placeholder) | **NEW shared**: `CourseThumbnail` follows `media-item-card` (remote URL → `unoptimized` `next/image`; none → `Empty`/icon placeholder), used by both new course cards; the mock `course-card.tsx` is not merged (it renders local static imports and mock fields, different semantics) | `src/components/shared/course-thumbnail.tsx` |
| CAP-4 | "Section with loading, empty and error handling, then content" | `media-tab-panel.tsx:30-44` and `editor-page.tsx:276-284` each hand-roll a skeleton grid and an empty text; the three new sections would be three more copies | **NEW shared inside the feature**: `HomeSectionShell` (header + skeleton slot + empty + error with retry + children + optional footer) owned by the home feature; the older copies belong to other features with different layouts and stay as they are | `src/components/home/signed-in/home-section-shell.tsx` |
| CAP-5 | Owner fields of a course item (`owner_display_name?`, `owner_slug?`) and the common course-card fields (`slug`, `title`, `thumbnail_url?`) | `CourseListItem` (`src/types/course.ts:33-48`) declares the owner pair alongside instructor-only fields; the two new response types would repeat them | **MERGE (compose)**: `CourseOwnerSummary = { owner_display_name?: string; owner_slug?: string }` and `CourseCardBase = CourseOwnerSummary & { slug: string; title: string; thumbnail_url?: string }`; `TrendingCourseItem` and `ContinueLearningItem` extend the base; `CourseListItem` is **not** changed (it is the instructor list shape and carries many other fields) | `src/types/course.ts` |
| CAP-6 | Course-catalogue callers | `listPublishedCoursesService`, `getLearningCourseService`, `enrollInCourseService`, `getCourseProgressService` (`course-factory-review.ts:164-200`) already own the `learner-courses` endpoints | **EXTEND** the same factory: `listContinueLearningService` sits beside them (same route family, same permission); `listTrendingCoursesService` is added to the same file because it is the course-domain read of published courses | `course-factory-review.ts`, `course-keys.ts`, `course-browser.ts` |

### Examined and kept separate (different semantics, or not a capability this change implements)

| Item | Why it stays separate |
|---|---|
| `src/components/home/course-card.tsx` (`CourseCard`, `CourseType`) and the mock sections that use it | Mock marketing card with rating, price, category, duration, level and "Enroll Now", none of which exist in the API; used only by the guest `/`. Extending it would couple two features and keep non-existent fields alive. Not modified, not deleted. |
| Trending card vs Continue card as one "course card" | Share only the thumbnail and the owner line (extracted as `CourseThumbnail` and the shared base type); trending adds a description, continue adds a progress bar and counts. A single generic card with mode flags would hide the business meaning, so there are two thin cards. |
| `PopularInstructorItem` vs `UserPickerCandidate` vs `InstructorUserIdentity` vs `InstructorRosterMember` | Different wire shapes and optionality (`avatar` vs `avatar_url` vs `avatar`; no `email`; `course_count`, `subtitle`). Mapping them onto one type would need an adapter layer the contract does not justify. Documented in `docs/reusable-assets.md`. |
| `MeResponse` / `MyInstructorApplication` | Different endpoints and fields. |
| `usePublishedCourses`, `useLearningCourse` and their bare-string SWR keys | Pre-existing, unused by UI, and deliberately not copied: the new keys are the request URL (consistent with every `get*Key`). They are not modified. |
| `StatusErrorPage` | Full-page component (`min-h-[50vh]`); section errors use `Empty` + `Button` instead. |
| `publicCacheProfiles` / `seoFetch` / `serverRawFetch` | The home data is personalised-adjacent and fetched client side; the empty registry is intentionally left empty (documented). |
| Guest mock home sections' headers that use the centred shape | Different layout shape; recorded, not merged. |
| `usePublishedCourses` hook placement of the new hooks | New hooks are added to the same file (`useCourses.ts`, 90 lines) for course data and to a new `useInstructorCatalog.ts` for the instructor domain (domain ownership). |

### Sibling-feature dependency check

No new edge between sibling features: `components/home/signed-in/*` imports `components/shared/*`, `components/ui/*`, `api/hooks/*`, `hooks/auth/*`, `lib/navigation/*`, `types/*`; the five migrated avatar call sites import `components/shared/user-avatar` (a neutral module that already hosts `SearchBar`, `FormField`, `SlugField`). The route file imports the screen barrel like its siblings. `madge --circular` (task 10.2) and the import-edge baseline (task 7.6) prove it.

## Decisions

### D1. Where the code lives (domain ownership)

- Course data (trending, continue): the existing course caller slice `course-factory-review.ts` (which already owns `learner-courses`) + `course-keys.ts` + `course-browser.ts` + hooks in `useCourses.ts`.
- Instructor data (popular): a new slice `instructor-factory-catalog.ts` composed in `createInstructorCallers` (`instructor-factory.ts`), key in `instructor-factory-keys.ts`, binding in `instructor-browser.ts`, hook in a new `useInstructorCatalog.ts` (exported from `src/api/hooks/instructor/index.ts`). The instructor domain owns it because the response is an instructor identity.
- Public routes: `API_PUBLIC_ROUTES.catalog` = `{ trendingCourses, popularInstructors }`; the authenticated continue route is `API_PRIVATE_ROUTES.course.continueLearning` next to `learnerCollection`.
- UI: new feature folder `src/components/home/signed-in/` (the existing `components/home/*` is the guest mock set and stays flat and untouched); `UserAvatar` and `CourseThumbnail` in `src/components/shared/` (cross-feature components; `ui/` stays shadcn/Tailwind).
- Screen: `SignedInHomePage` stays in `src/screen/common/home/signed-in-home-page.tsx` (ESLint-allowed name) and only composes components.
- Alternatives rejected: a new top-level `catalog` caller domain (three endpoints, two domains already own them; a third folder would split ownership); putting all three in the course domain (popular is an instructor identity).

### D2. Public endpoints go through the existing `apiFetch`

`apiFetch` is the only transport every caller uses; it reports errors to the shared store and a 200 from a public endpoint is unaffected by the credentials default. *Alternative:* `rawFetch` (no error reporting, would need an explicit base URL) or `serverRawFetch` + `publicCacheProfiles` (server-only, requires a reviewed profile, and the data would then be cached server-side); both rejected as a larger step than the page needs, and the cache registry is documented as intentionally empty.

### D3. Continue learning is gated by user and permission, and is not shared across users

The hook is called with a `null` key unless `me` exists **and** `useHasPermission(PERMISSIONS.CourseRead)` is true; the section is not rendered otherwise. The SWR cache provider is in-memory (`meCacheProvider` persists only `/me`), so a hard reload drops it; for a soft sign-out and sign-in in one tab the existing logout flow must clear or revalidate it. Task 5.8 reads the logout flow (`use-auth-logout-tab-sync.ts`, `logoutHref` page, `useAuth` logout) and **if it does not already reset the SWR cache**, the continue key is scoped to the signed-in user by a reused mechanism rather than a new one; the decision rule and the evidence are written into the session context before editing (the spec requirement "No cross-user reuse" is the acceptance test).

### D4. Types

`CourseOwnerSummary` and `CourseCardBase` are declared once in `src/types/course.ts`; `TrendingCourseItem = CourseCardBase & { id: string; short_description: string; created_at: number }`; `ContinueLearningItem = CourseCardBase & { course_id: string; completed_sub_lessons: number; total_sub_lessons: number; progress_percent: number; last_activity_at: number }`. `PopularInstructorItem` lives in `src/types/instructor.ts`. No Zod schema is added (read-only list responses; schemas in `src/schema` are for forms).

### D5. Expand More is an in-page limit increase (product decision, 2026-10-16)

Initial limits: trending 8, continue 3, popular 4 (no expand). Expand More swaps the SWR key to the maximum limit (24 / 10) and hides the control. The button is shown only when the first response length equals the initial limit. Constants live in `src/constants/home.ts` (values only). Two comments are mandatory at the Expand More handler of **both** sections and at the constant block, worded exactly (English):

1. `Expand More currently only extends the list in place on the signed-in home page; the original product intent was to navigate to a course detail/list page.`
2. `If a course detail/list page is ever implemented, ask the user with AskUserQuestion whether Expand More should change from in-page expansion to navigation before changing this behaviour.`

*Alternatives:* fetch the maximum immediately and slice on the client (one request, larger payload on every visit; rejected by the product owner); link to a list page (does not exist).

### D6. Images

- API images (`thumbnail_url`, instructor `avatar`) are remote: rendered with `next/image` `unoptimized` (the repository precedent) so `next.config.ts` is **not** touched and no host allow-list is introduced. `sizes` uses `IMAGE_SIZES_COURSE_CARD`.
- Hero images are static files imported through `@public/assets/images/home/hero/...` (slide 1 eight tiles `tile-1..8.webp`, slide 2 `instructor-recording.webp`, slide 3 `learner-comfortable.webp`), exported from Figma with `get_design_context` / `download_assets` and converted to WebP at the original 1536×1024 (3:2) source size, never pre-cropped (an earlier 1600×723 crop distorted the framing; the 60% photo panel crops through `object-cover`, centred, exactly like Figma); the first slide's first visible image uses `priority` (LCP), `sizes` `IMAGE_SIZES_HERO_FULL`. The overlay is a CSS layer using the colour and opacity read from Figma node `5139:30531` (task 8.1 records the values).
- Alternative: `images.remotePatterns` in `next.config.ts` (optimised remote images). Rejected for now: it is a deployment-visible config change and the host of `thumbnail_url` is environment dependent; revisit with the course detail page.

### D7. Hero carousel

`Carousel` from `ui/carousel` with `opts={{ loop: true }}` and `setApi` to track the selected snap for the dots (buttons with `aria-label`s and `aria-current`); each `CarouselItem` has `role="group"` and `aria-roledescription="slide"` via the primitive. Three Figma slides (nodes `5139:30547`, `5139:30586`, `5152:11316`):

1. Tile collage (4×2 grid) under a multiply red/brown tint (`#7a2e26` at 60%), centred headline + sub-headline. This is the only `h1`.
2. `HeroSplitSlide`: `#e6a700` panel (40%) beside the instructor photo (60%), copy `hero.instructor.*`.
3. `HeroSplitSlide` with `imageFirst`: learner photo (60%) beside a `base-primary` teal panel (40%), copy `hero.learner.*`.

Photo panels are 60% of the slide width at the slide height (about 4:3 on desktop, 718×542 at a 1197 px container), which is the Figma frame ratio; the two photos are the unmodified 3:2 Figma sources shown with `object-cover` and no custom `object-position`. Split slides stack on narrow screens (photo above, panel below). There are no previous/next arrow buttons (product decision 2026-10-18); users drag (mouse) or swipe (touch), or use the dots, and Embla's keyboard arrows still work through the primitive. Autoplay is `useCarouselAutoplay(api, HOME_HERO_AUTOPLAY_INTERVAL_MS)` (`src/hooks/home/use-carousel-autoplay.ts`, 3000 ms): it calls `api.scrollNext()` after the idle time, re-arms on every `select` and `settle` event (so any manual slide change restarts the countdown), is cleared on `pointerDown`, and does not start when `prefers-reduced-motion: reduce` matches. `embla-carousel-autoplay` was deliberately not added (no new dependency for one timer).

### D8. Layout and responsive behaviour

Container `max-w-[1197px]`, horizontal padding 16 px on small screens, section spacing 44-48 px (Figma). Grids: Complete your Course `1 / 2 / 3` columns (sm / md / lg), Trending `1 / 2 / 4` columns, Popular Instructor `1 / 2 / 4`. Card sizes follow Figma on desktop (continue 285×230, trending 285×318, instructor 284×400) and scale fluidly below. Colours, fonts and radii are read from Figma variables (`get_variable_defs`) and mapped to the existing Tailwind tokens (`primary`, `muted-foreground`, `object-black`) before adding any literal.

### D9. Placeholder course route

`PUBLIC_RESOURCE_ROUTES.course = "/courses/:slug"`; `courseDetailHref(slug)` in `routes.ts` via `toPublicResourceRoute`; page `src/app/[locale]/(web)/courses/[slug]/page.tsx` (awaits `params`, per the dynamic-route precedent) renders `CourseDetailPlaceholderPage` (`src/screen/common/course/course-detail-placeholder-page.tsx`, exported from the screen barrel); `generateMetadata` mirrors `login/page.tsx` and uses a no-index robots mode. The task reads `robots-presets.ts` and picks the existing no-index preset (no new preset). `PUBLIC_ROUTES`, `SEO_INDEXABLE_PUBLIC_ROUTE_KEYS` and the sitemap builder are untouched, so the page is neither in the sitemap nor in the private crawl-disallow list.

### E. `/home` metadata and gating stay as they are

No `generateMetadata` is added to `/home` (documented product decision); the client gate is unchanged; `PRIVATE_ROUTES.home` keeps its crawl-disallow behaviour. The stale comment `Signed-in homepage (temporary placeholder UI until Figma home ships)` at `src/constants/route.ts:15` and the comment `(planned signed-in /home)` at `src/constants/seo/image.ts:8` are updated.

### D10. i18n

`home.signedIn` keeps `loginRequired.{title,description,login}` and drops `title` and `temporaryNotice` (no consumer after the rewrite). New keys under the same namespace in both `en.ts` and `vi.ts` (the `vi` object `satisfies Messages`, so a missing key fails `tsc`): `hero.{label,headline,subheadline,instructor.{headline,subheadline},learner.{headline,subheadline},goToSlide,slideLabel}`, `continueLearning.{title,description,progress,completed,empty,error,retry,expandMore}`, `trending.{title,description,empty,error,retry,expandMore}`, `popularInstructors.{title,description,empty,error,retry}`, `courseCard.{imageAlt}`, `coursePlaceholder.{title,description,back}` (exact strings in `code-change-inventory.md`). The description line of every section is the Figma text "We know the best things for You. Top picks for You." with a Vietnamese equivalent.

### D11. Tests

Jest/MSW for callers (URL, limit param, `null` data → `[]`), hooks (null key gating), `courseDetailHref`, each component's loading/empty/error/expanded states, `UserAvatar`, `SectionHeader`, `CourseThumbnail`, and the page gate (guest, loading, signed-in with and without `course:read`). Playwright: one `home.spec.ts` journey against the extended fixture server. Fixture rule: the existing fixture learner has `permissions: []` and is used by an "access denied" test, so a **new** fixture user with `course:read` is added instead of changing it.

## Code change specification (per file)

Full current and after code, call sites and the reused-resource justification are in `code-change-inventory.md`; line numbers are `HEAD af62c40` and must be re-located by symbol at implementation time.

| # | File | Symbol | Change |
|---|---|---|---|
| A1 | `src/constants/api-route.ts` | `API_PUBLIC_ROUTES` | ADD `catalog: { trendingCourses, popularInstructors }` |
| A2 | `src/constants/api-route.ts` | `API_PRIVATE_ROUTES.course` | ADD `continueLearning: "/api/v1/learner-courses/continue"` after `learnerProgress` |
| A3 | `src/constants/home.ts` | new | ADD limits and expand constants (values only) |
| A4 | `src/types/course.ts` | new types | ADD `CourseOwnerSummary`, `CourseCardBase`, `TrendingCourseItem`, `ContinueLearningItem` |
| A5 | `src/types/instructor.ts` | new type | ADD `PopularInstructorItem` |
| A6 | `src/api/callers/course/course-keys.ts` | new | ADD `getTrendingCoursesKey(limit?)`, `getContinueLearningKey(limit?)` |
| A7 | `src/api/callers/course/course-factory-review.ts` | `createCourseReviewCallers` | ADD `listTrendingCoursesService(limit?)`, `listContinueLearningService(limit?)`; add to returned object |
| A8 | `src/api/callers/course/course-browser.ts` | exports | ADD two re-exports |
| A9 | `src/api/callers/instructor/instructor-factory-keys.ts` | new | ADD `getPopularInstructorsKey(limit?)` |
| A10 | `src/api/callers/instructor/instructor-factory-catalog.ts` | new | ADD `createInstructorCatalogCallers` with `listPopularInstructorsService` |
| A11 | `src/api/callers/instructor/instructor-factory.ts` | `createInstructorCallers` | ADD the spread and the key re-export |
| A12 | `src/api/callers/instructor/instructor-browser.ts`, `index.ts` | exports | ADD binding and export |
| A13 | `src/api/hooks/course/useCourses.ts` | hooks | ADD `useTrendingCourses(limit)`, `useContinueLearning(limit, enabled)` |
| A14 | `src/api/hooks/instructor/useInstructorCatalog.ts`, `index.ts` | new | ADD `usePopularInstructors(limit)` |
| R1 | `src/constants/route.ts` | `PUBLIC_RESOURCE_ROUTES` | ADD `course: "/courses/:slug"`; MODIFY the `home` comment |
| R2 | `src/lib/navigation/routes.ts` | new | ADD `courseDetailHref(slug)` |
| R3 | `src/app/[locale]/(web)/courses/[slug]/page.tsx` | new | ADD route file |
| R4 | `src/screen/common/course/course-detail-placeholder-page.tsx`, `src/screen/common/index.ts` | new | ADD screen + barrel line |
| U1 | `src/components/shared/user-avatar.tsx` | new | ADD shared avatar |
| U2 | five avatar call sites (CAP-1) | MODIFY | use `UserAvatar` when identical; keep and document otherwise |
| U3 | `src/components/shared/section-header.tsx` | new | ADD shared header |
| U4 | guest mock sections (CAP-2) | MODIFY | use `SectionHeader` only when markup is identical |
| U5 | `src/components/shared/course-thumbnail.tsx` | new | ADD shared thumbnail |
| H1 | `src/components/home/signed-in/*` | new | ADD hero, three sections, two cards, section shell, skeletons |
| H2 | `src/screen/common/home/signed-in-home-page.tsx` | `SignedInHomePage` | MODIFY: compose the sections; DELETE the placeholder block |
| H3 | `src/messages/en.ts`, `vi.ts` | `home.signedIn` | MODIFY (delete `title`, `temporaryNotice`; add the new keys) |
| H4 | `src/constants/seo/image.ts` | comment | MODIFY comment only |
| H5 | `public/assets/images/home/hero/*` | new | ADD exported images |
| T1 | colocated `*.test.ts(x)` | new | ADD tests per `code-change-inventory.md` §6 |
| E1 | `e2e/fixtures/server.mjs`, `e2e/support/{auth,fixture-client}.ts` | MODIFY | ADD three endpoints, one fixture user, one login helper |
| E2 | `e2e/tests/home.spec.ts` | new | ADD journey |

## Documentation change specification (per document)

Current and replacement text for every item is in `docs-update-inventory.md`. All documents are English except the `Tích hợp home` part of `docs/seo-ranking-setup.md`, which stays Vietnamese (Documentation Language Consistency Rule).

| Document | Items |
|---|---|
| `README.md` | DOC-1 `docs/screens.md` row; DOC-2 `docs/seo-ranking-setup.md` row; DOC-3 API route constants block; DOC-4 `route.ts` row |
| `docs/api-overview.md` | DOC-5 stamp; DOC-6 new "Home catalog routes" section; DOC-7 SEO fetch consumer sentence |
| `docs/api-using.md` | DOC-8 stamp; DOC-9 route constants block; DOC-10 new "Signed-in home" subsection |
| `docs/modules.md` | DOC-11 stamp; DOC-12 signed-in home bullet and non-goals; DOC-13 new "Home catalog module" |
| `docs/pages.md` | DOC-14 stamp; DOC-15 page table rows; DOC-16 resource-route sentence; DOC-17 implementation-notes row; DOC-18 "Home SEO foundation" paragraph |
| `docs/router.md` | DOC-19 stamp; DOC-20 route tree; DOC-21 status table; DOC-22 classification; DOC-23 guest vs signed-in table; DOC-24 href helpers |
| `docs/screens.md` | DOC-25 stamp; DOC-26 route table; DOC-27 public routes bullet; DOC-28 layout hierarchy; DOC-29 i18n namespaces; DOC-30 "Signed-in home" section |
| `docs/architecture.md` | DOC-31 stamp; DOC-32 directory map; DOC-33 route constants block; DOC-34 API routes block |
| `docs/folder-structure.md` | DOC-35 stamp; DOC-36 route tree; DOC-37 screen tree; DOC-38 components tree; DOC-39 callers tree; DOC-40 constants line |
| `docs/components.md` | DOC-41 stamp; DOC-42 `home/` row in the directory table; DOC-43 `home/` section; DOC-44 shared components rows |
| `docs/reusable-assets.md` | DOC-45 stamp; DOC-46 home images asset; DOC-47 API route assets; DOC-48 route assets; DOC-49 new shared assets (`UserAvatar`, `SectionHeader`, `CourseThumbnail`, hooks, types) |
| `docs/seo-ranking-setup.md` | DOC-50 stamp; DOC-51 status line; DOC-52 baseline bullets; DOC-53 out-of-scope bullet; DOC-54 `Tích hợp home` (Vietnamese) |
| `docs/testing.md` | DOC-55 stamp; DOC-56 fixtures list; DOC-57 fixture backend sentence; DOC-58 journey entry; DOC-59 behaviour-matrix rows |
| `docs/deploy.md` | DOC-60 stamp; DOC-61 signed-in home row |
| `AGENTS.md`, `CLAUDE.md` | GitNexus counts regenerated by `npx gitnexus analyze` only; no rule added, so no `<!-- begin:... -->` boundary |

Scanned and unchanged (reasons in the inventory): `docs/flow.md`, `logic-flow.md`, `instructor-admin.md`, `instructor-application.md`, `media-collection.md`, `taxonomy-admin.md`, `docker.md`, `delivery*.md`, `quality.md`, `patterns.md`, `dependencies.md`, `security-hardening-notes.md`, `course-collaboration-handoff-2026-06-04.md`, `openspec/specs/*`, `openspec/config.yaml`, `.ai/skills/*`, `.claude/skills/*`, `deploy/`.

## AGENTS.md Workflow Mapping

| AGENTS.md section | How this change satisfies it | tasks.md group |
|---|---|---|
| Scope and Applicability | Source, tests, fixtures, assets and docs change, so it is an in-scope implementation task; classified first | 1 |
| Global Memory Bank Rules (pre-response load) | `memory-bank-cli memory_bank_read_all --project fe-mycourse` first; CLI → MCP → file fallback | 2 |
| Session ID Bootstrap and subagent propagation | One external `AI_SESSION_ID_FILE`; same ID and exact `.context/session-<SESSION_ID>.md` path to every subagent | 3 |
| Critical First Action; Dual Session Context Lifecycle | Read the whole `.context/`; reuse or create exactly one session file | 4 |
| Initial Phase (docs, `.ai/skills`, GitNexus, Git changes, subagents ≤ 4) | Read listed docs, three skills, GitNexus, `git` state; subagents only when they save time | 5 |
| CLAUDE.md GitNexus gates | Re-index first (index is stale); `gitnexus_impact` for every edited symbol with the grep fallback documented | 6 |
| Critical Reuse Rule and Deduplication Rule | Re-run the audit on HEAD; apply CAP-1…CAP-6; keep the separate table intact; migrate the five avatar copies | 7 |
| Middle Phase: Implementation | Constants, types, callers, hooks, shared UI, home UI, routes, screen, i18n, assets, tests, fixtures | 8 |
| Final Phase: Sync, Quality Gates, Exit Code Rule | Force-sync GitNexus, `npm run check-all`, fix any non-zero exit, plus e2e | 9, 10 |
| Post-Implementation Code Review | Checklist over every touched file | 11 |
| Documentation and Context Sync; Full Replacement; Language Consistency; Swagger rule | Replace outdated text in English (Vietnamese section stays Vietnamese); no Swagger YAML exists here | 12 |
| Sensitive Test Accounts and Environment Secrets Policy | Committable surface only; placeholders only | 13 |
| Mandatory End-of-Task Learning Summary | Only the current project session file | 14 |
| Required end-of-turn persistence; verbatim final response | `memory_bank_update`/`write` for `activeContext.md`, `progress.md`, `lastResponse.md` | 15 |
| Final Response Requirement | Implemented work, files, reuse, merged duplicates, docs, gates, failures, risks | 16 |
| Commit rules; Branch rename rules | Only if the user asks; one-line `<type>: <title>`, 15–72 characters, no scope or body | 17 |
| Tooling rule protection | No lint, knip, jscpd, biome, jest, tsconfig or madge rule is changed or bypassed; `next.config.ts` is not changed | 10, 11 |

## Risks / Trade-offs

- **Remote thumbnails unoptimised** → heavier images and no resize; mitigation: matches the repository precedent, `sizes` is set, and `remotePatterns` is the documented follow-up with the course detail page.
- **Per-user continue data in an in-memory SWR cache** → leakage across a soft sign-out/sign-in; mitigation: D3 task 5.8 reads the logout flow and the spec scenario "User switch in one session" is covered by a hook test and the e2e journey.
- **Backend not fully verified** (rate limit, 5-minute cache, `EXPLAIN` were not checked by the backend smoke test; migrations `000043`/`000044` and the slug backfill depend on the environment) → mitigation: the frontend tolerates absent or empty slugs, shows per-section errors and does not retry in a loop; the final report lists these as unverified.
- **Figma navbar differs from the shared `Header`** → accepted (Header is shared and out of scope); recorded as a known deviation.
- **Merging five avatar copies touches unrelated feature files** → risk of visual regression; mitigation: each call site is read in full first, migrated only when identical, covered by the existing tests of those files plus `user-avatar.test.tsx`, and recorded when kept separate.
- **Expand More behaviour will change later** → mitigation: the two mandatory comments and the AskUserQuestion instruction (D5).
- **`knip` unreachable files** → every new component is imported by the page tree; `src/components/ui` is excluded; verified by `npm run deadcode`.
- **jscpd duplicate detection** on the two new cards and the three sections → mitigation: the shared base (`HomeSectionShell`, `CourseThumbnail`, `SectionHeader`) removes the repeated blocks; `npm run dupl` is part of the gate.
- **Hero assets size** → exported at 2× and converted to WebP; LCP measured before choosing `priority` (task 8.8).

## Migration Plan

Single frontend change; no data, backend or deployment migration. Order: constants and types → callers and hooks → shared UI modules and migrations → home UI → routes and placeholder page → i18n → assets → tests and fixtures → quality gates → documentation → GitNexus re-index. Rollback is a plain revert; the only user-visible effect is the `/home` page content (the two removed message keys have no other consumer).

## Open Questions

None that would change the specs, the approach or the task breakdown. Decisions already confirmed with the user on 2026-10-16: the section list (hero, Complete your Course, Trending Course, Popular Instructor), omission of price, badge and rating, Expand More as in-page expansion with the two mandatory comments, a temporary `/courses/[slug]` placeholder page (the user chose "create a placeholder page" over "href only"), instructor cards not linked, Continue Watching linking to the course placeholder, and keeping `/` and the `Header` unchanged. Deferred and answered by later changes: whether Expand More becomes navigation (must be asked with `AskUserQuestion` when a detail page is built); the public instructor page and its route; optimised remote images (`remotePatterns`); taxonomy chips on cards (needs a backend field); the Figma navbar variant for signed-in users.


## Implementation notes (as built, 2026-10-16)

- **Mobile sections (2026-10-20)**: below `sm` the three data sections are a CSS scroll-snap row instead of a one-column stack (`HomeSectionShell`, `MOBILE_CAROUSEL_CLASS_NAME`). Embla was not used: it would need the cards rendered twice or a JS media query (hydration mismatch risk), whereas native scroll snap swipes without JavaScript and leaves the `sm`+ grids untouched. No pagination dots (the 85% item width shows the next card).

These replace the corresponding plan statements above where they differ:

- **CAP-2 `SectionHeader`**: not created. Reading the four guest headers showed no identical markup (view-all button, centred badge, different description classes), and a single-consumer shared component would be premature, so the title and description block lives inside `HomeSectionShell`. The guest sections are untouched.
- **Progress bar**: a small `role="progressbar"` overlay inside `CourseThumbnail` replaces `ui/progress` (the generated primitive cannot take the Figma teal indicator without editing it).
- **D3 cache scoping**: soft sign-out does not clear non-`/me` SWR entries, so `getContinueLearningKey(limit, userId)` appends the user id as a URL fragment (existing `buildQueryParams` fragment argument) and `useContinueLearning(limit, userId | null)` replaces the `enabled` boolean. The id is never sent to the server.
- **Extra shared pieces**: `ExpandMoreFooter` (both Expand More buttons), `CourseCardFrame` and `CourseOwnerLine` (`course-card-parts.tsx`), `okEnvelope` and `seedSignedInMe` (test helpers).
- **i18n shape**: `retry`, `expandMore`, `sectionDescription` sit directly under `home.signedIn`; `hero.label`, `hero.slideLabel` and `continueLearning.progressLabel` were added; `HOME_POPULAR_INSTRUCTORS_MAX_LIMIT` was not needed.
- **Hero**: reworked 2026-10-18 (photos re-exported uncropped at 1536×1024 after a framing review) to the three Figma slides described in D7 (no arrow buttons, drag/swipe, 3 s autoplay that restarts on manual change); the earlier version showed the slide-1 headline on all three full-bleed images and had custom arrow buttons.
- **Hero image sizes (manual UI test, 2026-10-19)**: the hero images first used `sizes="100vw"` and Next warned for every tile; tiles now use `IMAGE_SIZES_HERO_TILE` (`25vw`) and split photos `IMAGE_SIZES_HERO_PHOTO` (`(max-width: 640px) 100vw, 60vw`).
- **Placeholder page** is a synchronous component (`useTranslations`) and its route ignores the slug.
- **Tests**: page tests live beside the route files because `src/screen` forbids test files; `IntersectionObserver` is stubbed in the shared jest setup because Embla needs it.
- **Avatar migration**: all five copies were identical in behaviour apart from size, text size, alt text and the sidebar's `rounded-md` shape (handled with `className` / `alt=""`), so all five were migrated to `UserAvatar`.
- **Placement (final, 2026-10-19)**: `UserAvatar` and `CourseThumbnail` live in `src/components/shared/` (the user confirmed this original placement after a brief move to `common/<domain>/`); they are imported by file path so layout components cannot form a cycle through the barrel.
