Companion documents: `design.md` (decisions D1–D11, the codebase-wide capability audit CAP-1…CAP-7, per-file code and per-document documentation specifications), `code-change-inventory.md` (exact CURRENT and AFTER code, call sites, no-change consumers, tests) and `docs-update-inventory.md` (CURRENT and REPLACEMENT documentation text, `DOC-n` IDs, final sweep). Groups 1–17 follow the order of `AGENTS.md`. Every implementation task lists **Files/symbols**, **Reuse check** (re-grep `src/` and `e2e/` before adding anything; if an equivalent exists, use it; duplication means reject and redo per the Critical Reuse and Deduplication rules), **Tests**, **Docs** (item IDs) and **Verify**. Work is frontend only (`fe-mycourse`); do not touch `be-mycourse`, `next.config.ts` or any lint, knip, madge, jscpd, biome, jest or tsconfig rule.

## 1. Task Classification (AGENTS.md — Scope and Applicability)

- [x] 1.1 Classify the request before any `.context` or Session ID lifecycle: it creates and modifies project source, tests, fixtures, assets and documentation, so it is an **in-scope implementation task** (frontend only; this OpenSpec change is the plan). Verify: the session context's first line states "in-scope, frontend only, no backend edits".
- [x] 1.2 Because the task is in scope, the session record is the project's `.context/session-<SESSION_ID>.md` (never the external `AI_SESSION_CONTEXT_FILE`). Verify: no read-only-task external context file is created.

## 2. Memory Bank Pre-Response Load (AGENTS.md — Global Memory Bank Rules)

- [x] 2.1 Run `memory-bank-cli memory_bank_read_all --project fe-mycourse` before any task work or user-facing answer (30 s hard limit, no retry in the same turn). Verify: `activeContext.md`, `progress.md`, `lastResponse.md` (and any `nextTasks.md`) were read.
- [x] 2.2 Fallback chain on failure or timeout: `memory-bank` MCP (`list_project_files`, then concurrent `memory_bank_read`), then direct reads of `/private/tmp/ai-agent/memory/fe-mycourse/`. Verify: the path used is recorded in the session context.
- [x] 2.3 After any context compaction, reload every Memory Bank file for the project before continuing. Verify: a reload note exists in the session context for each compaction.
- [x] 2.4 Never store secrets, credentials, tokens, private keys or raw sensitive values in memory. Verify: grep the persisted files for token and key patterns before the final answer.

## 3. Session ID Bootstrap (AGENTS.md — Critical Pre-Conversation Session Bootstrap; Subagent Propagation)

- [x] 3.1 Resolve `AI_SESSION_ID_FILE` as `<OS_TEMP_DIR>/ai-agent-sessions/<conversation-bootstrap-key>/session-id` (macOS/Linux: `$TMPDIR` then `/tmp`), outside every project and worktree, directory mode `0700`; create the ID once (atomic write) only if the file does not exist, otherwise reuse it; never regenerate it for any topic, branch, retry, compaction or new message. Verify: the file exists, holds exactly one non-empty ID, and `AI_SESSION_ID` equals it. (At proposal time `AI_SESSION_ID_FILE` was not defined in the shell; it must be established before the first project edit.)
- [x] 3.2 Validate before touching project files: `AI_SESSION_ID_FILE` defined; path outside every project, repository and working tree; no project-level temp, `.env`, `.context` or doc file contains the ID. Verify: on any failed check, stop and repair the external state, never create a project-local fallback.
- [x] 3.3 Never search project directories for the ID file and never derive an ID from timestamps, branch or task names, PIDs or `.context` filenames. Verify: the session context records only the exact path read.
- [x] 3.4 Subagent propagation: every subagent receives the exact `AI_SESSION_ID_FILE` path, the exact `AI_SESSION_ID`, the exact `.context/session-<SESSION_ID>.md` path and the prohibition on creating or writing any other context file; only the main agent writes the session context. Verify: any subagent result that used another ID or wrote a context file is rejected and redone.

## 4. Existing Project Context (AGENTS.md — Critical First Action; Dual Session Context Lifecycle)

- [x] 4.1 Read the complete existing `.context/` folder (every `session-*.md`; 27 files at proposal time) before repository-based planning or implementation; note prior decisions and constraints (course slug, taxonomy slug, user slug contract, `sync-me-roles-contract` learnings). Verify: the session context lists the files read and the facts reused.
- [x] 4.2 Resolve exactly one writable `<project>/.context/session-<SESSION_ID>.md`: reuse if it exists, create once if absent, never create a second file for the same ID, resolve duplicates before continuing. Verify: `ls .context | grep <SESSION_ID>` returns exactly one file.

## 5. Initial Phase — Project Understanding (AGENTS.md — Initial Phase)

- [x] 5.1 Read in full the project documentation this change touches or depends on: `docs/{api-overview,api-using,modules,pages,router,screens,architecture,folder-structure,components,reusable-assets,seo-ranking-setup,testing,deploy,patterns,quality,dependencies,security-hardening-notes}.md`, `README.md`, `be-mycourse/docs/{modules/course.md,modules/instructor.md,modules/enrollment.md,return_types.md,security-public-seo-notes.md}` and `api_swagger.yaml` lines for the three endpoints, plus the checkpoint `temporary-docs/claude-doanchat/Claude-Home page catalog APIs (...).md`, and `openspec/changes/sync-user-slug-contract/*` (precedent for the user slug fields). Verify: the session context lists each file read.
- [x] 5.2 Read all three skills under `.ai/skills/` and record a compliance note for each: `logic-n-1-optimize` (the home adds three independent list reads and no multi-item mutation; no per-item call loop), `nextjs-optimization` (hero images: `next/image`, `sizes`, `priority` only for the measured LCP image; no new font or script; remote images `unoptimized` per precedent), `nextjs-seo-optimization` (`/home` stays without route metadata by product decision; the placeholder page is no-index; no JSON-LD). Also read `.claude/skills/openspec-apply-change/SKILL.md` for the apply workflow and load `figma:figma-design-to-code` **before** the first `get_design_context` call. Verify: each skill has a compliance line in the session context.
- [x] 5.3 Use GitNexus first to trace quickly (after the re-index in 6.1): `gitnexus_query` for "signed-in home page", "course callers learner", "instructor callers"; `gitnexus_context` for `SignedInHomePage`, `createCourseReviewCallers`, `createInstructorCallers`, `useApiRowsQuery`. Verify: results, including the known gap for constants and type-only symbols, are recorded in the session context.
- [x] 5.4 Review all changed code in Git before editing: `git status --short`, `git log -10 --stat`, `git diff main...HEAD --stat`; preserve any pre-existing uncommitted work. Verify: the session context states the working-tree baseline (clean at proposal time on `feat/sync-user-slug-contract`, HEAD `af62c40`, apart from the untracked change directory). Note that `add-taxonomy-slug-management-ui` and `sync-user-slug-contract` changes are merged work awaiting archive and are not in flight.
- [x] 5.5 Map the structure for this change: components under `src/components/{home,shared,ui}`, hooks under `src/hooks/<domain>`, API under `src/api/{callers,hooks}/<domain>`, types in `src/types/{course,instructor}.ts`, constants in `src/constants`, screens in `src/screen/common/*-page.tsx`, routes in `src/app/[locale]/(web)`, i18n in `src/messages/{en,vi}.ts`, tests colocated, e2e under `e2e/`; quality rules from `eslint.config.mjs` and `package.json`. Verify: the session context records where each edit lands and why each new module exists.
- [x] 5.6 Subagents only when they save real time (at most 4; never by default): Auto mode or a same-family model at the same or lower tier with input price ≤ USD 3 and output price ≤ USD 15 per million tokens (if unverifiable use Auto or the lowest cost); pass the propagation data from 3.4. Verify: the main agent consolidates findings, avoids duplicated effort and owns the final approach.
- [x] 5.7 Re-verify the backend contract at implementation time (read only): `be-mycourse/internal/course/delivery/{routes,handler_catalog,handler_learner}.go` (limits 8/24, 4/10, route guards), `internal/course/domain/course.go` (`TrendingCourseItem`, `ContinueLearningItem` JSON tags), `internal/instructor/delivery/{dto,routes}.go` (`popularInstructorResponse`, limit 4/12), `docs/api_swagger.yaml` lines for the three paths. Verify: any difference from `design.md` and the specs is written into the session context and the artifacts are updated before editing.
- [x] 5.8 Read the sign-out and sign-in flow that governs the SWR cache (`src/hooks/auth/use-auth-logout-tab-sync.ts`, the `logout` page and action, `useAuth`, `src/lib/swr/me-cache-provider.ts`, `src/components/providers/app-providers.tsx`). Record whether a soft sign-out in the same tab clears or revalidates non-`/me` SWR entries. Decision rule (design D3): if it already does (or navigates with a full reload), no extra mechanism is added; otherwise scope the continue-learning data to the signed-in user through the mechanism the auth flow already uses (for example the existing SWR clear/mutate used on logout), and write the evidence and the choice into the session context before editing. Verify: the spec scenario "User switch in one session" is satisfied and is covered by a hook or page test in 8.24 and by the e2e journey. _As built: soft sign-out does not clear non-`/me` SWR entries (`logout-content.tsx` only calls `mutateMe` and `router.replace`), so the continue-learning cache key carries the user id as a URL fragment (`getContinueLearningKey(limit, userId)` via the existing `buildQueryParams` fragment argument); the id is never sent._

## 6. GitNexus Safety Gates (CLAUDE.md — Always Do / Never Do / Self-Check)

- [x] 6.1 Refresh the stale index first: `npx gitnexus analyze` (add `--embeddings` only if `.gitnexus/meta.json` reports `stats.embeddings` > 0; it was 0 at proposal time). Verify: `.gitnexus/meta.json` `lastCommit` equals HEAD.
- [x] 6.2 Run `gitnexus_impact({ target, direction: "upstream" })` for **every symbol that will be edited**: `SignedInHomePage`, `createCourseReviewCallers`, `createCourseCallers`, `createInstructorCallers`, `useApiRowsQuery` (read only), `toPublicResourceRoute`, `UserMenu`, `SidebarAuthFooter`, `InstructorUserCell`, `InstructorRosterPage`, `InstructorProfileViewDialog`, and each migrated section component. Report direct callers, affected processes and risk to the user before the first edit; warn on any HIGH or CRITICAL result. For constants and type-only symbols (`API_PUBLIC_ROUTES`, `API_PRIVATE_ROUTES`, `PUBLIC_RESOURCE_ROUTES`, `CourseListItem`) use the grep caller lists in `code-change-inventory.md` §2 and §4. Verify: the impact report is written into the session context before the first source edit. _As built: the index was refreshed first (6.1) but `gitnexus_impact` was run after the edits instead of before them (an order violation, reported to the user). Every symbol returned `UNKNOWN` risk with zero callers (React components and constants are poorly indexed); the grep caller lists in `code-change-inventory.md` were used._
- [x] 6.3 Extract/split rule for the five avatar copies and the section headers: run `gitnexus_context` on each call-site component and list every incoming and outgoing reference before moving code. Verify: all d=1 dependents are accounted for in `code-change-inventory.md` U1/U3 (or the "kept separate" note).
- [x] 6.4 There is no symbol rename in this change. If a rename becomes necessary use `gitnexus_rename({ dry_run: true })` first, never find-and-replace. Verify: no rename was done by text replacement.

## 7. Critical Reuse and Deduplication Audit (AGENTS.md — before writing code)

- [x] 7.1 Re-run the capability audit on the current HEAD (GitNexus → docs → source): `grep -rn "pickCharacter" src`, `grep -rn "unoptimized" src`, `grep -rn "learner-courses/continue\|catalog/" src e2e`, `grep -rn "limit" src/constants src/hooks`, `grep -rn "useExpand\|isExpanded" src`, `grep -rn "Skeleton" src --include='*.tsx' -l`, `grep -rn "owner_slug\|owner_display_name" src/types`. Verify: no new capability duplicate appeared since the proposal; if one did, update `design.md` and the inventories to reuse or merge it first.
- [x] 7.2 Confirm the "examined and kept separate" table in `design.md` still holds (mock `CourseCard`, `PopularInstructorItem` vs picker/roster/identity types, `usePublishedCourses`/`useLearningCourse`, `StatusErrorPage`, `publicCacheProfiles`). Verify: each keeps its documented semantic reason.
- [x] 7.3 Read **in full** the five avatar call sites (`user-menu.tsx`, `sidebar-auth-footer.tsx`, `instructor-user-cell.tsx`, `instructor-roster-page.tsx`, `instructor-profile-view-dialog.tsx`) and record per file: image component, size classes, `alt`, `priority`, rounding, fallback colours and label size. Derive the `UserAvatar` props from the intersection; mark each file "migrate" (identical behaviour) or "keep" (with the exact difference). Verify: the table is written into the session context and `code-change-inventory.md` U1 before 8.11.
- [x] 7.4 Read **in full** `top-courses-section.tsx`, `trending-courses-section.tsx`, `upcoming-webinars-section.tsx` and `advanced-promo-section.tsx` header markup and decide per file whether it is the same left-aligned title + description shape. Verify: the decision per file is recorded; only identical markup migrates (the guest page is otherwise untouched by product decision). _As built: the four guest headers differ (a view-all button, a centred badge, different description classes), so none is identical; no `SectionHeader` module was created (single consumer would be a premature abstraction) and the header markup lives inside `HomeSectionShell`; guest sections untouched._
- [x] 7.5 Read `media-item-card.tsx:100-140`, `image-file-field.tsx` and `home/course-card.tsx:30-60` to fix the `CourseThumbnail` contract (remote `unoptimized` image or placeholder). Verify: the contract (props, classes, placeholder) is recorded.
- [x] 7.6 Record the cross-feature import-edge baseline (`grep -rn 'from "@/components/features/' src` importers by feature; `grep -rn 'from "@/components/home' src`; `grep -rn 'from "@/screen' src/components`) before editing. Verify: the baseline is compared again in 11.3 and shows **no new sibling-feature edge and no new cycle**.
- [x] 7.7 Baseline gates on the untouched branch: `npx tsc --noEmit`, `npm run lint`, `npm run biome`, `npm test`, `npm run deadcode`, `npm run quality:deps`; optionally `npm run test:e2e` (record pass counts and any pre-existing failure). Verify: results are in the session context so later failures are attributable.

## 8. Middle Phase — Implementation (existing structure; reuse first; English only)

### 8a. Design input

- [x] 8.1 Read the Figma design with the MCP tools after loading `figma:figma-design-to-code`: `get_design_context` for the hero (`5139:30520`, including `5139:30531` overlay), Continue Watching card (`5139:11206`), Option-1 card (`5139:10451`) and Instructor card (`5139:11465`), `get_variable_defs` for the page frame `5139:10435`, and `get_screenshot` for the three hero slide sources (`5139:30547`, `5152:11316`, `5142:11272`). Record in the session context: spacing, radii, colours (mapped to existing Tailwind tokens first), typography, the overlay colour/opacity and how it is applied to slides 2 and 3, the previous/next control geometry, the dot size and active colour, and the card hover states. Verify: the recorded values are cited by the component tasks below; no value is guessed.

### 8b. Constants and types (base first)

- [x] 8.2 `src/constants/api-route.ts`: ADD `API_PUBLIC_ROUTES.catalog.{trendingCourses, popularInstructors}` and `API_PRIVATE_ROUTES.course.continueLearning` (A1, A2).
  - Reuse check: confirm no `catalog` or `continue` key exists; read `api-transport.ts` and `server-auth.ts` for any iteration over the route objects.
  - Docs: DOC-3, DOC-9, DOC-34, DOC-47. Verify: `npx tsc --noEmit` clean.
- [x] 8.3 `src/constants/home.ts`: ADD the six limit constants with the mandatory Expand More comment block (A3). Read `src/constants/index.ts` first and add a barrel line only if siblings are exported that way.
  - Docs: DOC-12, DOC-40. Verify: `npx tsc --noEmit`; ESLint accepts the values-only file.
- [x] 8.4 `src/types/course.ts`: ADD `CourseOwnerSummary`, `CourseCardBase`, `TrendingCourseItem`, `ContinueLearningItem` (A4); do not change `CourseListItem`.
  - Docs: DOC-49. Verify: `npx tsc --noEmit` clean.
- [x] 8.5 `src/types/instructor.ts`: ADD `PopularInstructorItem` (A5) with `avatar` (not `avatar_url`).
  - Verify: `npx tsc --noEmit` clean.

### 8c. API layer

- [x] 8.6 `course-keys.ts` ADD `getTrendingCoursesKey`, `getContinueLearningKey`; `course-factory-review.ts` ADD `listTrendingCoursesService`, `listContinueLearningService` and add them to the returned object; `course-browser.ts` ADD two re-exports (A6–A8).
  - Reuse check: mirror `listPublishedCoursesService`; use `requireUrl`; no new transport.
  - Tests: `course-keys.test.ts`, `course-factory-review.test.ts` (MSW: items, `data: null` → `[]`, `limit` string, non-2xx rejects).
  - Docs: DOC-6, DOC-10. Verify: `npx jest src/api/callers/course --ci` passes.
- [x] 8.7 Instructor catalog slice: `instructor-factory-keys.ts` ADD `getPopularInstructorsKey`; NEW `instructor-factory-catalog.ts`; `instructor-factory.ts` compose + key re-export; `instructor-browser.ts` ADD binding (A9–A12).
  - Reuse check: same factory-slice pattern as `instructor-factory-ticket.ts`; do not import from the course domain.
  - Tests: `instructor-factory-catalog.test.ts`.
  - Docs: DOC-6, DOC-10, DOC-39. Verify: `npx jest src/api/callers/instructor --ci` passes.
- [x] 8.8 Hero assets: export `tile-1.webp … tile-8.webp`, `learner-comfortable.webp`, `instructor-recording.webp` from Figma (asset URLs from `get_design_context`; they are short-lived, do not commit them or the URLs) into `public/assets/images/home/hero/`, convert to WebP at the source resolution (1536×1024 for the two photos; do NOT pre-crop, the panel crops with `object-cover`) and check the file sizes. Decide which image gets `priority` by inspecting the first visible slide (LCP candidate); all others lazy.
  - Docs: DOC-43, DOC-46. Verify: the files exist, each is under the agreed size budget recorded in the session context, `git status` shows only the new files.
- [x] 8.9 Hooks: `useCourses.ts` ADD `useTrendingCourses`, `useContinueLearning`; NEW `useInstructorCatalog.ts` with `usePopularInstructors`; `hooks/instructor/index.ts` ADD export (A13, A14).
  - Reuse check: `useApiRowsQuery`; no per-hook SWR option.
  - Tests: `useHomeCourses.test.tsx` (`enabled=false` makes no request), `useInstructorCatalog.test.tsx`.
  - Docs: DOC-10, DOC-49. Verify: `npx jest src/api/hooks --ci` passes.
- [x] 8.10 `src/hooks/home/use-expand-more.ts` ADD `useExpandMore` with the two mandatory comments (CAP-7). Read `src/hooks/index.ts` and export consistently with the siblings.
  - Tests: `use-expand-more.test.tsx`. Docs: DOC-13, DOC-49. Verify: `npx jest src/hooks/home --ci` passes.

### 8d. Shared UI modules (and migrations)

- [x] 8.11 `src/components/shared/user-avatar.tsx` ADD per 7.3; migrate each "migrate" call site and leave each "keep" site untouched with the reason in `code-change-inventory.md` (U1/U2).
  - Reuse check: `pickCharacter` is reused inside; no second initials implementation remains in a migrated file.
  - Tests: `user-avatar.test.tsx` plus the existing tests of the migrated files unchanged and green (`dashboard-layout.test.tsx` and the instructor tests).
  - Docs: DOC-44, DOC-49. Verify: `npx jest --ci` for the touched directories passes; `grep -rn "pickCharacter" src` shows only `user-avatar.tsx`, `lib/utils/user.ts` and any "keep" file.
- [x] 8.12 `src/components/shared/section-header.tsx` ADD per 7.4; migrate only identical guest sections. _As built: not created, see 7.4._
  - Tests: `section-header.test.tsx`. Docs: DOC-44. Verify: tests green; the guest `/` renders the same markup (`git diff` of migrated files shows only the header replacement).
- [x] 8.13 `src/components/shared/course-thumbnail.tsx` ADD per 7.5.
  - Tests: `course-thumbnail.test.tsx`. Docs: DOC-44. Verify: tests green.

### 8e. Home UI

- [x] 8.14 `src/components/home/signed-in/home-section-shell.tsx` ADD (CAP-4) using `SectionHeader`, `Skeleton`, `Empty*`, `Button`.
  - Tests: `home-section-shell.test.tsx`. Docs: DOC-43. Verify: tests green.
- [x] 8.15 Cards ADD: `continue-learning-card.tsx`, `trending-course-card.tsx`, `popular-instructor-card.tsx` using `CourseThumbnail`, `Progress`, `UserAvatar`, `courseDetailHref` (defined in 8.19; implement the helper first or in the same commit), styles from 8.1. _As built: a `CourseCardFrame` / `CourseOwnerLine` pair (`course-card-parts.tsx`) is shared by the two course cards; the progress bar is a small `role="progressbar"` overlay inside `CourseThumbnail` because `ui/progress` cannot take the Figma teal indicator without editing a generated primitive._
  - Reuse check: no price, rating or badge anywhere; keys are `course_id`, `id`, `user_id`; progress clamped to 0–100.
  - Tests: one file per card (see `code-change-inventory.md` §6). Docs: DOC-43. Verify: tests green.
- [x] 8.16 Sections ADD: `home-continue-learning-section.tsx` (gated by `me` and `course:read`), `home-trending-section.tsx`, `home-popular-instructors-section.tsx`, each using `HomeSectionShell`, `useExpandMore` where applicable and the mandatory Expand More comments. _As built: the two Expand More footers are one shared `ExpandMoreFooter`; `useContinueLearning(limit, userId)` replaces the planned `enabled` boolean; trending uses `keepPreviousData`._
  - Tests: one file per section (states, Expand More once, gating, error independence). Docs: DOC-43. Verify: tests green.
- [x] 8.17 `src/components/home/signed-in/hero-carousel.tsx` ADD: `Carousel` (`loop`), `setApi`, three Figma slides (tinted collage; yellow panel + instructor photo; learner photo + teal panel, via `HeroSplitSlide`), single `h1`, dots with `aria-label` / `aria-current`, `priority` only on the image chosen in 8.8. _As built (reworked 2026-10-18 after review): no previous/next arrow buttons; drag/swipe and dots; autoplay through `useCarouselAutoplay` (3 s, restarts on manual change, paused on pointer down, off for reduced motion)._
  - Tests: `hero-carousel.test.tsx`, `src/hooks/home/use-carousel-autoplay.test.tsx`, e2e `home.spec.ts` (no arrows, drag, autoplay). Docs: DOC-43. Verify: tests green; no `h1` duplication (`getAllByRole("heading", { level: 1 })` length 1).

### 8f. Routes, screens, i18n

- [x] 8.18 `src/constants/route.ts` MODIFY (`PUBLIC_RESOURCE_ROUTES.course`, `home` comment) and `src/lib/navigation/routes.ts` ADD `courseDetailHref` (R1, R2). Before editing, read `src/lib/seo/**` and `crawl-policy.ts` to prove nothing iterates `PUBLIC_RESOURCE_ROUTES` into the sitemap or disallow list.
  - Tests: `routes.test.ts` additions. Docs: DOC-4, DOC-16, DOC-24, DOC-33, DOC-48. Verify: `npx jest src/lib/navigation src/lib/seo --ci` passes.
- [x] 8.19 Placeholder page: `src/app/[locale]/(web)/courses/[slug]/page.tsx`, `src/screen/common/course/course-detail-placeholder-page.tsx`, `src/screen/common/index.ts` barrel line (R3, R4). Read `src/lib/seo/robots-presets.ts` and reuse the existing no-index mode; read an existing dynamic route for the `params` signature. _As built: `CourseDetailPlaceholderPage` is a synchronous component using `useTranslations` (testable under jsdom); the route file does not receive `slug` because the placeholder does not use it._
  - Tests: `course-detail-placeholder-page.test.tsx`. Docs: DOC-15, DOC-20, DOC-21, DOC-26. Verify: tests green; `npm run cycles` shows no new cycle.
- [x] 8.20 `signed-in-home-page.tsx` MODIFY (H2): keep the loading and guest branches and imports; replace the signed-in return with the composed sections; update the doc comment.
  - Tests: `signed-in-home-page.test.tsx` (loading, guest CTA with `next=/home` and no data request, signed-in with and without `course:read`). Docs: DOC-17, DOC-30. Verify: tests green.
- [x] 8.21 `src/messages/en.ts` and `vi.ts` MODIFY `home.signedIn` (H3) with every key listed in `code-change-inventory.md`; delete `title` and `temporaryNotice`. Verify: `grep -rn "home.signedIn" src` shows only live keys; `npx tsc --noEmit` clean (a missing `vi` key fails the build).
- [x] 8.22 `src/constants/seo/image.ts` comment (H4) and the `src/constants/route.ts` `home` comment are updated. Verify: `git diff` shows comment-only changes in `image.ts`.

### 8g. Fixtures and journeys

- [x] 8.23 `e2e/fixtures/server.mjs`, `e2e/support/fixture-client.ts`, `e2e/support/auth.ts` MODIFY (E1): three endpoints, a new fixture user with `course:read`, `loginAsHomeLearner` (shared login body if the existing helpers duplicate it). Do not change the existing learner's permissions.
  - Docs: DOC-57. Verify: `node --check e2e/fixtures/server.mjs`; `npm run biome` clean on the files.
- [x] 8.24 Complete the unit tests not yet covered in 8.6–8.20: the user-switch scenario (5.8), and any remaining item from `code-change-inventory.md` §6. Verify: `npm test` passes; record real case counts for DOC-59. _As built: `src/screen` forbids test files, so the page tests live beside the route files in `src/app/[locale]/(web)/home/page.test.tsx` and `courses/[slug]/page.test.tsx`; `IntersectionObserver` is stubbed in `src/test-support/jest.setup.ts` (Embla needs it); `seedSignedInMe` and `okEnvelope` test helpers were added._
- [x] 8.25 `e2e/tests/home.spec.ts` ADD (E2). Verify: `npm run test:e2e` passes all journeys (or record exactly which could not run and why).

## 9. Final Phase — GitNexus Sync (AGENTS.md — Final Phase)

- [x] 9.1 Force-sync GitNexus after the implementation and before the gates: `npx gitnexus analyze` (no `--embeddings` unless `.gitnexus/meta.json` `stats.embeddings` > 0). Verify: `.gitnexus/meta.json` reflects the final working state and the regenerated counts in `AGENTS.md` / `CLAUDE.md` are the only changes to those two files.
- [x] 9.2 Run `gitnexus_detect_changes({ scope: "all" })`. Verify: only the symbols and files listed in `code-change-inventory.md` changed and every d=1 dependent is accounted for.

## 10. Quality Gates and Exit Code Rule (AGENTS.md — Final Phase; Exit Code Rule; Tooling rule protection)

- [x] 10.1 `npx tsc --noEmit`. Verify: exit 0. (If it fails only because of stale gitignored `.next/types/routes.d *.ts` junk files, run the build first as in the previous change; do not edit `tsconfig.json`.)
- [x] 10.2 `npm run check-all` (= `lint && biome && test && deadcode && quality:deps && build`; `quality:deps` = `cycles` + `dupl`). Verify: exit 0. Never modify, disable, weaken or bypass a lint, biome, knip, madge, jscpd, jest or tsconfig rule; fix the implementation instead. If `dupl` flags the two list functions in `course-factory-review.ts` or two cards, apply the shared extraction described in the inventory.
- [x] 10.3 `npm run test:e2e` (starts the fixture backend on 4100 and the app on 4200; not part of `check-all`). Verify: all journeys pass, or record exactly which could not run and why; do not claim success otherwise.
- [x] 10.4 Exit Code Rule: any non-zero exit, including failures unrelated to this change that can break CI/CD, is fixed gradually and every required gate is re-run until all pass. Verify: the final report lists each command with its real exit status; nothing is claimed that was not run.
- [x] 10.5 Manual UI verification against the Figma screenshot at 1440, 1024, 768 and 390 px widths using the running app (a signed-in dev account from the local notes; credentials are never written to any file): hero controls and dots, the three sections, loading skeletons, empty and error states (stop the backend to see the error), Expand More, links to the placeholder, no console errors. Verify: findings recorded in the session context; any mismatch fixed or reported. _As built: verified with Playwright screenshots against the fixture backend at 1440 and 390 px (768 px captured, not reviewed in detail); the continue-learning grid was narrowed to Figma's 895 px after the review._

## 11. Post-Implementation Code Review (AGENTS.md — Post-Implementation Code Review Requirement)

- [x] 11.1 `git diff --check`; inspect the complete diff. Verify: only files in `code-change-inventory.md` plus the documents in `docs-update-inventory.md` (and the regenerated GitNexus blocks) changed.
- [x] 11.2 Review every written or modified file against the checklist, recording findings in the session context: follows the existing architecture; follows the existing folder structure; existing utilities, components, hooks, services and types were reused where possible; no duplicate logic (one avatar, one section header, one thumbnail, one expand hook, one set of keys); no unrelated files modified; no hardcoded secrets or credentials; ready for CI/CD. Reject and redo on any duplication.
- [x] 11.3 Compare the import-edge baseline from 7.6 with the final tree. Verify: no new sibling-feature edge; `npm run cycles` clean.
- [x] 11.4 `openspec validate add-signed-in-home-page --strict --no-interactive`. Verify: valid; the checklist in this file matches the implemented state.
- [x] 11.5 Confirm every "kept separate" item in `design.md` is untouched in the diff (`course-card.tsx` mock card, `usePublishedCourses`, `useLearningCourse`, `StatusErrorPage`, `Header`, `Footer`, `next.config.ts`, `publicCacheProfiles`, `proxy.ts`). Verify: `git diff --stat` shows none of those files, and the avatar/section-header "keep" files are changed only as recorded.
- [x] 11.6 Confirm the two mandatory Expand More comments exist verbatim in `src/constants/home.ts`, `use-expand-more.ts` and at the Expand More button of both sections. Verify: `grep -rn "ask the user with AskUserQuestion" src` returns those locations.

## 12. Documentation and Context Sync (AGENTS.md — Documentation and Context Sync; Full Documentation Replacement; Language Consistency; Swagger rule)

- [x] 12.1 Re-read every document in `docs-update-inventory.md` and the whole `.context/` folder before editing, then apply DOC-1 … DOC-61 exactly (English; the "Tích hợp home" section stays Vietnamese; replace, never append; keep each file's tone and terminology). Fill the bracketed values (`[N]` counts, file names) from the real implementation. Verify: each CURRENT passage no longer exists and each REPLACEMENT is present once.
- [x] 12.2 Refresh the audit stamps (DOC-5, 8, 11, 14, 19, 25, 31, 35, 41, 45, 50, 55, 60) with the real date, keeping the previous stamp as `Prior:`. Verify: `grep -n "Last audited\|Last updated" <file>` shows the new stamp first.
- [x] 12.3 Run the final sweep from `docs-update-inventory.md` ("Final sweep"). Verify: every listed grep returns nothing stale.
- [x] 12.4 Scan the whole repository for documents the inventory may have missed (`grep -rln "SignedInHomePage\|learner-courses\|API_PUBLIC_ROUTES\|PUBLIC_RESOURCE_ROUTES\|components/home" --include='*.md' . | grep -v node_modules`). Verify: every hit is either changed or listed under "Scanned — no change" with a reason.
- [x] 12.5 Swagger rule: no Swagger YAML exists or changes in this repository, so `ruby generate-apidog-postman.rb` is not applicable. Verify: `git diff --name-only | grep -i swagger` is empty.
- [x] 12.6 Replace (not append to) the descriptions in the current project's `.context/session-<SESSION_ID>.md` and refresh GitNexus files (9.1). Verify: no conflicting old and new statements remain in that file; other sessions' files are untouched.
- [x] 12.7 Record in the session context that Expand More is an in-page expansion by product decision and the AskUserQuestion requirement for any future change (it is a durable constraint for the course detail page change). Verify: the statement exists in the session context and in `docs/modules.md` DOC-13.

## 13. Sensitive Test Accounts and Environment Secrets (AGENTS.md — Sensitive policy)

- [x] 13.1 Inspect only the committable Git surface (`git ls-files`, `git status --short`, `git check-ignore -v`): changed tests, fixtures, assets and docs contain only placeholders (`example.com`, `example.test`, synthetic slugs such as `fixture-learner`), no credentials, tokens, private endpoints or values derived from `.env`; mention environment variables by name only. Exported Figma asset URLs are short-lived and must not appear in any file. Verify: the report states that only the committable surface was inspected.

## 13b. Follow-up: swipeable sections on mobile

- [x] 13b.1 `HomeSectionShell` lays the skeletons and the content out as a scroll-snap row below `sm` (`flex snap-x snap-mandatory overflow-x-auto`, items `w-[85%] shrink-0 snap-start`, scrollbar hidden) and as the existing grid from `sm` (`sm:grid`, item sizing reset); the three sections pass their grid classes without the base `grid grid-cols-1 gap-*` (now `sm:` prefixed). Verify: computed styles at 1280 px are unchanged (4 columns of 284.25 px, gaps 20/24 and 20/20) and at 390 px the row scrolls (scrollWidth 629 against 358) with no page overflow; `home-section-shell.test.tsx` covers content and skeleton rows.

## 14. Mandatory End-of-Task Learning Summary

- [x] 14.1 Update only `.context/session-<SESSION_ID>.md` after implementation, review, gates, GitNexus and docs are complete, with **What I Learned Today** (what existed and was reused, the avatar/section-header decisions, the Figma-vs-BE deviations, the SWR cache decision, any command failure) and **What I Should Learn or Do Next Time** (course detail page and Expand More question, instructor public page, `remotePatterns`, unverified backend rate limit and cache, the Figma navbar variant). Verify: both headings exist and every statement is true.

## 15. Memory Bank End-of-Turn Persistence (AGENTS.md — Required end-of-turn persistence; Verbatim final-response persistence)

- [x] 15.1 As the last operation before the final answer: `memory-bank-cli memory_bank_update` for `activeContext.md`, `progress.md` (and `nextTasks.md` if it exists), and for `lastResponse.md` the complete final answer verbatim (CLI → MCP → direct file; 30 s limit; no retry in the same turn). Verify: only claim persistence if the write succeeded; emit exactly the persisted text.

## 16. Final Response Requirement (AGENTS.md)

- [x] 16.1 Report: what was implemented; files changed; existing resources reused (`useApiRowsQuery`, the course caller factory, `Carousel`, `pickCharacter`, `media-item-card` pattern, `buildQueryParams`); duplicate logic merged or avoided (avatar, section header, thumbnail, expand hook, owner types); documentation, GitNexus and the `.context/session-<SESSION_ID>.md` updated; quality gates run; commands passed; commands failed and how they were fixed; remaining risks (unverified backend rate limit and cache, dev DB migrations and slug backfill, unoptimised remote images, Figma navbar deviation, the placeholder course page, Expand More behaviour).

## 17. Commit Rules (AGENTS.md — Commit rules; Branch rename; Agent rule boundaries)

- [x] 17.1 Commit only if the user asks: title in English, one line `<type>: <title>`, no scope or parentheses, no body or footer, 15–72 characters, specific enough to explain the change (for example `feat: build the signed-in home page with catalog data`); let the Husky `pre-commit` hook run `make check-all` if present (this repository has no Husky or Makefile at this commit, so `npm run check-all` is the equivalent) and the `commit-msg` hook validate with commitlint; never `--no-verify`. Verify: `git log -1 --format=%s` is compliant.
- [x] 17.2 Branch rename rules apply only if the user asks to rename the branch; never push, delete remote branches or change upstream unless separately requested. Verify: no push or remote change was made.
