# All Sprints

History and roadmap of `fe-mycourse`: what is **to do**, **in progress** and **done**. It is a log, not a system description: behavior and rules live in [`FEATURES.md`](FEATURES.md), [`PAGES.md`](PAGES.md), [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`SHARED.md`](SHARED.md).

Rules:

- One line per item; a `Done` row points at the OpenSpec change (`openspec/changes/archive/`) instead of restating it.
- This file is exempt from the "update docs after every task" rule and is not read by default: open it only when a task asks about history or the roadmap.
- When a change is archived, move its row from `In progress` to `Done` (date = the change's creation date); when work starts on a `To do` item, move it to `In progress` and fill the OpenSpec change name.
- `Owner` is `agent`, `developer` or `unassigned`. Rows tagged **Roadmap** come from the product owner's own planning artifacts (the deleted BE plan `.vscode/e-learning_crud_backend_8f5ca286_reset_all_pending.plan.md`, 33 pending todos for Phase 02-12, and the five source specs `docs-will-be-delete/*` of `be-mycourse`, both recoverable from Git history); their Notes say what exists today in BE and FE. Rows tagged **Candidate** were found in the repository by the agent and await owner confirmation.

## To do

| Item | Owner | Notes (source) |
|------|-------|----------------|
| Course series (learning paths) with ordered items and series enrollment | unassigned | **Roadmap**, old BE plan Phase 08 + series enrollments of Phase 11. BE: no series table or API (0 commits). FE: nothing |
| Coupons (percentage / fixed amount, usage limits, expiry, scope by course / category / series) | unassigned | **Roadmap**, old BE plan Phase 09 and instructor spec. BE: no coupon table or API (0 commits). FE: nothing |
| Cart and orders (orders + order items, checkout) | unassigned | **Roadmap**, old BE plan Phase 10 and `commerce` module of the spec. BE: no `orders` table, no cart. FE: nothing |
| Payment provider and platform settings (Stripe / VNPay / PayPal keys, instructor commission, upload limits) | unassigned | **Roadmap**, SysAdmin section of the spec. Not implemented in BE or FE |
| Quiz attempts and instant grading, timed quizzes, pass scores, per-question weights | unassigned | **Roadmap**, old BE plan Phase 07/12 and `learning_workspace/quizzes`. BE has quiz authoring (`course_sub_lesson_quizzes`) but no attempts; video quizzes (popup at timestamps) not found |
| Course reviews and ratings, instructor ratings, threaded comments with user tagging | unassigned | **Roadmap**, old BE plan Phase 12 and `interactions` module. BE: only the admin review/approval flow, no learner ratings or comments. FE: nothing |
| Learner progress tracking and `sync_uid` migration to a new course version | unassigned | **Roadmap**, spec `learning_workspace/progress`. BE has `course_progress_items` keyed by `stable_content_id` and `GET /learner-courses/continue`; FE shows "Complete your Course" only. Real-time tracking (scroll, watch time), resume position and opt-in version sync need a check |
| Certificates (templates by completion criteria, dynamic HTML) | unassigned | **Roadmap**, spec `learning_workspace/certificates`. Not found in BE; FE has only the `certificate` editor tab placeholder |
| Subtitles and course languages (`.srt` / `.vtt` upload, declared languages) | unassigned | **Roadmap**, old BE plan Phase 06 and instructor spec. Not found in BE or FE |
| Course prerequisites and metadata beyond level/outcomes/skills/tags (tools used) | unassigned | **Roadmap**, old BE plan Phase 04 and instructor spec. Not found |
| Instructor and admin analytics dashboards (revenue, active students, quiz pass rate) | unassigned | **Roadmap**, spec Instructor and Admin sections. Dashboards are placeholders today |
| Admin tooling: role upgrades, global analytics, error logs and webhook monitoring | unassigned | **Roadmap**, spec Admin / SysAdmin sections. Partly present (roles, instructor management); logs and webhook monitoring in the UI not found |
| Real course detail page `/{locale}/courses/{slug}` | unassigned | Candidate. `CourseDetailPlaceholderPage` is a temporary no-index "coming soon" page (`PAGES.md`, `home-and-catalog`) |
| Replace placeholder dashboards (`/admin`, `/instructor`, `/sysadmin`) | unassigned | Candidate. `AdminDashboardPage`, `InstructorDashboardPage`, `SysadminDashboardPage` are placeholders |
| Sysadmin course review preview content | unassigned | Candidate. `sysadmin/courses/reviewing/[courseId]/preview` renders a placeholder `CourseReviewPreviewPage` |
| Real search (header `SearchBar`) | unassigned | Candidate. `SearchBar` is a UI stub, no backend call |
| `useSendWebSocketOutbound` hook (mirror broadcast) | unassigned | Candidate, only if many call sites send WS messages (former "Gap Analysis") |
| Shared form error display component | unassigned | Candidate (former "Gap Analysis"); `FormField` + `FieldError` cover labelled fields today |
| Reusable paginated list hook | unassigned | Candidate (former "Gap Analysis"); `useApiListQuery` / `useApiInfiniteListQuery` exist, check before adding |
| Course, lesson, enrollment types and service callers (learner side) | unassigned | Candidate (former "Gap Analysis" Phase 02+); learner course player is out of scope in `instructor-admin` |
| Hosted GitHub Actions run of `e2e-browser.yml` | developer | Candidate. README: "Hosted-run verification ... is pending until a real run is observed" |
| Raise `permission.ts` unit coverage (about 55%) | unassigned | Candidate (`testing.md`): read/id-mapping helpers not yet exercised |
| SEO wiring checklist | unassigned | Candidate: call `buildPageMetadata` from further indexable pages and add their key to `SEO_INDEXABLE_PUBLIC_ROUTE_KEYS`; reviewed `publicCacheProfiles` before any `seoFetch` use; real OG image / Organization `logo` / `sameAs`; other JSON-LD builders only with real DTOs (`seo-web`) |
| Media gaps | unassigned | Candidate (`media`): rename (no BE API), public <-> private toggle after upload, BE legacy R2 key repath / `user_id` backfill |
| Testing residual backlog | unassigned | Candidate. See `testing.md` "Residual backlog" |
| `images.remotePatterns` for remote course/instructor images | unassigned | Candidate. Home images use `unoptimized` today (`home-and-catalog`) |
| `FormField` does not set `aria-invalid` | unassigned | Candidate (recorded in earlier session notes) |
| Limit how much of `.context/` the Initial Phase reads | developer | Candidate. 27 session files (about 228 KB, gitignored) and growing; the rule still reads the whole folder |
| Trim `README.md` body (Auth Flow, Token Refresh, Zustand Stores sections) to pointers | unassigned | Candidate. The body duplicates `FEATURES.md` / `ARCHITECTURE.md` / `SHARED.md` |
| Further compact `SHARED.md` (about 105 KB) | unassigned | Candidate. This change cut `reusable-assets.md` from 144 KB; remaining rows still carry long purpose text |
| Add functional UI skills (layout, responsive, shadcn) for the skill-selection rule | developer | Candidate. The dry run of the SKILLS rule for a frontend layout task found no functional skill in the project or agent folders (only non-functional `nextjs-optimization` / `logic-n-1-optimize` and workflow skills); BE has not been inventoried yet |
| Decide `skills-lock.json` | developer | Candidate. Lists `shadcn` and `supabase-postgres-best-practices`, while `.ai/skills` holds other skills |
| `be-mycourse` follow-up change | developer | Candidate. Apply the shared `AGENTS.md` (< 32 KiB), skills and Commit rule to BE; hand-off in `temporary-docs/claude-doanchat` |
| Backend `rotateSession` compare-and-swap | developer | Candidate. `RefreshSession` reads, checks and then overwrites the session UUID without a conditional update, so two overlapping refreshes with the same refresh token can leave cookie and stored UUID different (`be-mycourse`) |
| Lock and `session_expired` broadcast for Server Action refreshes | unassigned | Candidate. The cross-tab lock and the broadcast exist for the browser path only |
| Guest-looking chrome during a `/me` outage (header `AuthLayout`, `SidebarAuthFooter`, Google One Tap, `BecomeInstructorPromoBanner`) | unassigned | Candidate. They read only `me`/`isLoading`, so an outage looks signed out there; the outage state exists in `useMeOutage` |
| `buildHttpError` re-sanitises an already sanitised refresh cause | unassigned | Candidate. `attemptRefresh` returns `sanitizeApiErrorCause(error)` and `throwReportedHttp` sanitises it again, turning the cause into `{ kind: "unknown" }` |
| Server Action refresh outage is not marked as an unverified session | unassigned | Candidate. Only the browser-proxy refresh sets `outage`; the `server-writable` branch of `attemptRefresh` keeps the plain 401 |
| Why the guest home `/{locale}` is dynamic (`ƒ`) and how to cache it | unassigned | Candidate. Baseline build: every route `ƒ`; suspects: `getLocale()` in the root layout, no `generateStaticParams`/`setRequestLocale`, `await params`; `SEO_TEMPORARY_ENV_CACHE_POLICY` stays disabled until then |
| Align doc file names in the `AGENTS.md` documentation map with git (`docs/architecture.md`, `docs/pages.md`) | developer | Candidate |

## In progress

| Item | Owner | OpenSpec change |
|------|-------|-----------------|
| Restructure docs and agent instructions (4-file docs set, sprints log, `AGENTS.md` < 32 KiB, skills) | agent | `restructure-docs-and-agents` |
| Clear stale auth session cookies when a refresh is rejected (cross-tab refresh lock, `session_expired` logout broadcast, retryable `/me` outage state, shared `unauthorized` sign-in gates) | agent | `fix-stale-auth-session-cookies` |

## Done

| Date | Item | Summary | OpenSpec change |
|------|------|---------|-----------------|
| 2026-09-16 | Frontend test coverage | Jest + RTL + MSW harness and behavior matrix so `npm test` runs real tests (auth, permissions, course editing) | `2026-09-16-add-frontend-test-coverage` |
| 2026-09-18 | Frontend error handling | `error.tsx` / `global-error.tsx`, `StatusErrorPage` variants and `classifyApiError` for full-page API failures | `2026-09-18-add-frontend-error-handling` |
| 2026-09-19 | Dashboard mobile forbidden logo | Denied dashboard header shows `BrandLogoLink` below `md` | `2026-09-19-fix-dashboard-mobile-forbidden-logo` |
| 2026-09-19 | Unified dashboard forbidden UI | Permission denial renders `StatusErrorPage` (`forbidden` vs `unauthorized`) instead of a bare message | `2026-09-19-unify-dashboard-forbidden-ui` |
| 2026-09-20 | Route-based auth modal | `/login` and `/signup` as routes intercepted by the `@modal` slot, `next` return path, unauthorized auto-prompt | `2026-09-20-route-based-auth-modal` |
| 2026-09-11 | Disable dev deploy job | `deploy-dev.yml` keeps test + build, deployment job commented out | `2026-10-22-disable-dev-deploy-job` |
| 2026-09-11 | `/me` roles contract | `MeResponse.roles` (display-only) added to the FE contract and docs | `2026-10-22-sync-me-roles-contract` |
| 2026-09-14 | Course collaborator role contract | Bulk-add `role` type narrowed to `EDITOR` | `2026-10-22-sync-course-collaborator-role-contract` |
| 2026-09-29 | Course slug management UI | Optional slug on create with 409/3007 recommended-slug confirm, editable slug on basic info | `2026-10-22-add-course-slug-management-ui` |
| 2026-10-14 | Taxonomy slug management UI | Editable root and per-node slug for levels/topics/skills/tags, shared `useSlugConflictFlow` | `2026-10-22-add-taxonomy-slug-management-ui` |
| 2026-10-15 | User slug contract | User `slug` carried on every user-identity DTO | `2026-10-22-sync-user-slug-contract` |
| 2026-10-16 | Signed-in home page | `/home` hero carousel, Complete your Course, Trending Course, Popular Instructor, course placeholder page | `2026-10-22-add-signed-in-home-page` |
| 2026-10-19 | Home SEO and signed-in redirect | Guest home metadata/JSON-LD, `robots.txt`, `sitemap.xml`, runtime `SITE_URL`, `/{locale}` <-> `/{locale}/home` redirects | `2026-10-22-add-home-seo-and-signed-in-redirect` |
