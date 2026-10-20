Companion documents: `design.md` (decisions D1–D11, verified facts, capability audit, risks), `code-change-inventory.md` (exact CURRENT and AFTER code, call sites, tests) and `docs-update-inventory.md` (CURRENT and REPLACEMENT text per document, `DOC-A/B/C-n` IDs). Groups 1–17 follow the order of `AGENTS.md`; group 18 lists the manual steps that only the user can do. Frontend only (`fe-mycourse`): no backend, API contract or database change.

## 1. Task Classification (AGENTS.md — Scope and Applicability)

- [x] 1.1 Classify the request before any `.context` or Session ID lifecycle: it creates and modifies project source, tests, configuration examples and documentation, so it is an **in-scope implementation task** (frontend only). Verify: the session context's first line states "in-scope, frontend only, no backend edits".
- [x] 1.2 The session record is the project's `.context/session-<SESSION_ID>.md` (never the external `AI_SESSION_CONTEXT_FILE`). Verify: no read-only-task external context file is created.

## 2. Memory Bank Pre-Response Load (AGENTS.md — Global Memory Bank Rules)

- [x] 2.1 Run `memory-bank-cli memory_bank_read_all --project fe-mycourse` before any task work or user-facing answer (30 s hard limit, no retry in the same turn). Verify: `activeContext.md`, `progress.md`, `lastResponse.md` (and any `nextTasks.md`) were read.
- [x] 2.2 Fallback chain on failure or timeout: `memory-bank` MCP (`list_project_files`, then concurrent `memory_bank_read`), then direct reads of `/private/tmp/ai-agent/memory/fe-mycourse/`. Verify: the path used is recorded in the session context.
- [x] 2.3 After any context compaction, reload every Memory Bank file for the project before continuing. Verify: a reload note exists in the session context for each compaction.
- [x] 2.4 Never store secrets, credentials, tokens, private keys or raw sensitive values in memory (this includes any real `SITE_URL` of a private environment). Verify: grep the persisted files for token and key patterns before the final answer.

## 3. Session ID Bootstrap (AGENTS.md — Critical Pre-Conversation Session Bootstrap; Subagent Propagation)

- [x] 3.1 Resolve `AI_SESSION_ID_FILE` as `<OS_TEMP_DIR>/ai-agent-sessions/<conversation-bootstrap-key>/session-id` (macOS/Linux: `$TMPDIR` then `/tmp`), outside every project and worktree, directory mode `0700`; create the ID once (atomic write) only if the file does not exist, otherwise reuse it; never regenerate it for any topic, branch, retry, compaction or new message. Verify: the file exists, holds exactly one non-empty ID, and `AI_SESSION_ID` equals its content.
- [x] 3.2 Validate before touching project files: `AI_SESSION_ID_FILE` defined; path outside every project, repository and working tree; no project-level temp, `.env`, `.context` or doc file contains the ID. Verify: on any failed check, stop and repair the external state; never create a project-local fallback.
- [x] 3.3 Never search project directories for the ID file and never derive an ID from timestamps, branch or task names, PIDs or `.context` filenames. Verify: the session context records only the exact path read.
- [x] 3.4 Subagent propagation: every subagent receives the exact `AI_SESSION_ID_FILE` path, the exact `AI_SESSION_ID`, the exact `.context/session-<SESSION_ID>.md` path and the prohibition on creating or writing any other context file; only the main agent writes the session context. Verify: any subagent result that used another ID or wrote a context file is rejected and redone.

## 4. Existing Project Context (AGENTS.md — Critical First Action; Dual Session Context Lifecycle)

- [x] 4.1 Read the complete existing `.context/` folder (every `session-*.md`) before repository-based planning or implementation; note prior decisions (the signed-in home change documented "`/home` has no metadata" and "post-login default should switch to `signedInHomeHref`"; course/taxonomy/user slug contracts). Verify: the session context lists the files read and the facts reused.
- [x] 4.2 Resolve exactly one writable `<project>/.context/session-<SESSION_ID>.md`: reuse if it exists, create once if absent, never create a second file for the same ID, resolve duplicates before continuing. Verify: `ls .context | grep <SESSION_ID>` returns exactly one file.
- [x] 4.3 Do not edit context files owned by other Session IDs (they mention `SITE_URL`, sitemap and `signedInHomeHref` as past decisions; they stay as history). Verify: `git status` shows no other `.context/session-*.md` modified.

## 5. Initial Phase — Project Understanding (AGENTS.md — Initial Phase)

- [x] 5.1 Read project skills before analysis: metadata of every skill in `.ai/skills`, `.agents` (absent) and `.claude/skills`; load in full only `.ai/skills/nextjs-seo-optimization`, `.ai/skills/nextjs-optimization` and `.claude/skills/gitnexus/*`; skip `logic-n-1-optimize` (no overlapping scope). Verify: the session context lists loaded and skipped skills with the reason.
- [x] 5.2 Re-read the planning artifacts of this change (`proposal.md`, `specs/*`, `design.md`, both inventories) and the neighbouring change `add-signed-in-home-page` (design section E, `signed-in-home` spec, `docs-update-inventory.md`) so the superseded "no `/home` metadata" decision is replaced, not contradicted. Verify: the session context records the superseded statements and the documents that carry them.
- [x] 5.3 Read all project documentation named in `docs-update-inventory.md` (`docs/*.md`, `README.md`) at HEAD to confirm every CURRENT passage still matches (lines may have moved). Verify: any drift between inventory CURRENT text and the file is noted and the inventory entry corrected before editing.
- [x] 5.4 Review all changed code in Git (`git status`, `git diff`, `git log -5`) to know the baseline; the working tree must be clean except this change's `openspec/changes/add-home-seo-and-signed-in-redirect/`. Verify: `git status --short` output is recorded.
- [x] 5.5 Use at most four subagents, only where useful (for example one for a final duplicate sweep, one for the docs sweep), in Auto mode or a model of the same family at the same or lower tier and within the input ≤ USD 3 / output ≤ USD 15 limits; fall back to Auto when pricing is unverifiable. Verify: the session context records each subagent, its model and its single purpose.
- [x] 5.6 Baseline before editing: run `npm run build` once with `SITE_URL` unset and record that it passes (this is the reference for task 10.4). Verify: exit code 0 recorded. (Recorded by the research subagent on the untouched tree before editing; re-run with `SITE_URL` unset after the change: exit 0.)

## 6. GitNexus Safety Gates (CLAUDE.md — Always Do / Never Do / Self-Check)

- [x] 6.1 Check index freshness (`gitnexus://repo/fe-mycourse/context`); if stale run `npx gitnexus analyze --embeddings` only if `.gitnexus/meta.json` shows embeddings, otherwise `npx gitnexus analyze`. Verify: the freshness result is recorded.
- [x] 6.2 Run `gitnexus_impact({direction: "upstream"})` before editing each symbol and report blast radius, risk and affected processes to the user: `homeHref`, `signedInHomeHref`, `useRedirectIfAuthenticated`, `useOAuthPostAuth`, `LoginContent`, `ConfirmEmailContent`, `LoginSignupPopup`, `resolveSiteConfig`, `parseAbsoluteHttpsOrigin`, `buildPageMetadata`, `buildSitemapEntries`, `listPrivatePathPrefixes`, `setAuthSessionCookies`, `clearAuthSessionCookies`, `readAuthCookiesFromRequest`, `HomePage`, `SignedInHomePage`, `RootLayout`, the `src/proxy.ts` default export. Where the graph returns `UNKNOWN` (constants are not indexed) rely on `grep` call sites recorded in `code-change-inventory.md`. Verify: each result and any HIGH/CRITICAL warning is reported to the user before that edit. (Result: every probed symbol returned `UNKNOWN` with 0 callers because the index does not record these imports; the call sites came from the grep lists in `code-change-inventory.md`. `detect_changes` afterwards reported `critical` only because the auth flows (login, logout, confirm-email, OAuth) reach the renamed cookie constants and the new default destination; values are unchanged.)
- [x] 6.3 Never rename with find-and-replace; this change renames nothing (`gitnexus_rename` is not needed). Verify: no symbol rename appears in the diff.
- [x] 6.4 Before any commit run `gitnexus_detect_changes({scope: "all"})`. Verify: only the files and processes in the inventories appear; unexpected ones are explained or reverted.

## 7. Critical Reuse and Deduplication Audit (AGENTS.md — before writing code)

- [x] 7.1 Re-run the capability audit of `design.md` D10 against the current tree with `grep -rn` (cookie literals, `nextPath ?? homeHref`, `languages[`, `listPrivatePathPrefixes`, `SIGNED_IN_HOME_PATH`, `locale` path parsing) and compare with `code-change-inventory.md`. Verify: no hit is missing from the inventory; any new hit is added to the inventory first.
- [x] 7.2 For every NEW symbol (`AUTH_COOKIE_NAMES` and siblings, `hasAuthSessionCookies`, `resolveSignedInHomeRedirectPath`, `defaultPostAuthHref`, `buildLanguageAlternates`, `buildRobotsTxtRules`, `register`) prove by search that no equivalent exists. Verify: the search commands and empty results are recorded.
- [x] 7.3 Confirm reuse (not re-implementation): `buildPageMetadata`, `buildSitemapEntries`, `privateCrawlDisallowPaths`, `publicCrawlAllowPaths`, `signedInHomeRobotsMode`, `robotsPreset`, `localizedPathname`, `toAbsoluteUrl`, `buildCanonicalUrl`, `JsonLd`, `buildOrganizationJsonLd`, `routing`, `hasLocale`, `signedInHomeHref`, `homeHref`, `getTranslations`, `getLocale`, `resolveSiteConfig`. Verify: the diff calls these and defines no parallel version.
- [x] 7.4 Duplicate found at any point → the solution is rejected and redone from the start of group 8 after re-reading the project. Verify: the session context states "no duplicate found" or documents the redo.

## 8. Middle Phase — Implementation (existing structure; reuse first; English only)

### 8a. Auth cookie name constants (D4)

- [x] 8a.1 Create `src/constants/auth-cookie.ts` with plain constants only (`ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`, `SESSION_ID_COOKIE`, `AUTH_SESSION_EXPIRES_AT_COOKIE`, `LEGACY_AUTH_SESSION_MAX_AGE_COOKIE`, `AUTH_COOKIE_NAMES`) exactly as in `code-change-inventory.md`. Verify: `npx eslint src/constants/auth-cookie.ts` clean (the `src/constants/**` rule allows only constants).
- [x] 8a.2 Replace every literal/const in `src/api/auth/server-auth.ts`, `src/lib/utils/auth-session.ts` (remove its exported `AUTH_SESSION_EXPIRES_AT_COOKIE` and private legacy constant), `src/lib/utils/cookie.ts` (remove the private `AUTH_COOKIE_NAMES`), `src/app/api/auth/refresh/route.ts`, `src/actions/auth/auth.ts`. Token DTO field names stay. Verify: `grep -rnE '"(access_token|refresh_token|session_id|auth_session_expires_at|auth_session_max_age)"' src --include=*.ts --include=*.tsx` shows only DTO/payload fields, tests, and `auth-cookie.ts`; the existing tests of these modules still pass.

### 8b. Site origin contract and startup validation (D1, D2)

- [x] 8b.1 Extend `src/lib/seo/site-config.ts` and `src/types/seo/metadata.ts` (`ResolveSiteConfigInput.nodeEnv`): production rejects loopback hosts and non-https; non-production additionally accepts `http://localhost[:port]` and `http://127.0.0.1[:port]`; keep the one-argument behaviour of `parseAbsoluteHttpsOrigin` / `parseAbsoluteHttpsUrl`; update the file header comment. Verify: the new `site-config.test.ts` matrix passes (valid, trailing slash, path, query, fragment, userinfo, http host, loopback in both modes, empty).
- [x] 8b.2 Create `src/instrumentation.ts` with `register()` guarded by `NEXT_RUNTIME === "nodejs"`, `NODE_ENV === "production"` and `NEXT_PHASE !== "phase-production-build"`, calling `resolveSiteConfig({ readEnv: true })`. Verify: `instrumentation.test.ts` covers production-missing (throws), production-valid, non-production, build phase, edge runtime.

### 8c. SEO library (D5, D7, D10)

- [x] 8c.1 Add `buildLanguageAlternates` to `src/lib/seo/canonical.ts` (per-locale canonical URLs plus `x-default`), and use it in `src/lib/seo/build-page-metadata.ts` and `src/lib/seo/sitemap-builder.ts`, removing both private loops. Verify: `canonical.test.ts` and `build-page-metadata.test.ts` assert `vi`, `en`, `x-default`; the sitemap output is byte-identical to before for the same input.
- [x] 8c.2 Create `src/lib/seo/robots-txt.ts` (`buildRobotsTxtRules`) reusing `publicCrawlAllowPaths`, `privateCrawlDisallowPaths`, `localizedPathname`, `toAbsoluteUrl`, `siteLocales`. Verify: `robots-txt.test.ts` asserts `/vi/admin`, `/en/admin`, `/vi/home`, `/en/home` disallowed, `/vi` and `/en` allowed, and the absolute sitemap URL.
- [x] 8c.3 Delete `listPrivatePathPrefixes` (and imports it alone used) from `sitemap-builder.ts` and `src/lib/seo/index.ts`; delete `SIGNED_IN_HOME_PATH` from `src/constants/seo/routes.ts` and its re-export in `src/lib/security/web/crawl-policy.ts`; fix the comments that mention them; update the stale header comments of `sitemap-builder.ts` ("Not wired…") and `json-ld.tsx` ("while unused") only where they became false. Verify: `grep -rn "listPrivatePathPrefixes\|SIGNED_IN_HOME_PATH" src e2e` returns nothing; `npm run deadcode` passes.

### 8d. Navigation helpers (D3, D8)

- [x] 8d.1 Add `defaultPostAuthHref = signedInHomeHref` to `src/lib/navigation/routes.ts` (and the `home.ts` re-export only if a consumer imports from there). Verify: `routes.test.ts` asserts the value `/home`.
- [x] 8d.2 Create `src/lib/navigation/signed-in-home-redirect.ts` (`hasAuthSessionCookies`, `resolveSignedInHomeRedirectPath`, one shared locale-root test), importing no `server-only`, `next/headers` or `@/i18n/navigation` module. Verify: `signed-in-home-redirect.test.ts` covers `/`, `/vi`, `/vi/`, `/en`, `/fr`, `/vi/home`, `/vi/login`, `/vi/courses/x`, with none, one and both cookies; `npm run quality:deps` (madge cycles) passes.

### 8e. Proxy (D3)

- [x] 8e.1 Modify `src/proxy.ts`: keep `createMiddleware(routing)` and the exact matcher literal; add the wrapper that redirects (307, `Cache-Control: private, no-store`, `Vary: Cookie`, next-intl `Set-Cookie` copied). Verify: `proxy.test.ts` asserts redirect status/location/headers/cookie copy, untouched non-root paths and the unchanged matcher.

### 8f. Pages, layout, routes (D5, D6, D7, D9, D10)

- [x] 8f.1 `src/app/[locale]/(web)/page.tsx`: add `generateMetadata` and the `Organization` JSON-LD as specified. Verify: `page.test.tsx` asserts title/description/canonical/alternates/robots from the output and the JSON-LD payload (name and url only).
- [x] 8f.2 `src/app/[locale]/(web)/home/page.tsx`: add `generateMetadata` (`{ title, robots }`). Verify: `home/page.test.tsx` (existing) updated and asserts `noindex`/`nofollow` and the absence of `alternates`/`openGraph`.
- [x] 8f.3 Create `src/app/robots.ts` and `src/app/sitemap.ts` (`dynamic = "force-dynamic"`). Verify: unit tests call the default exports with a stubbed `SITE_URL` and assert the shapes; e2e covers the served output (8k).
- [x] 8f.4 `src/app/layout.tsx`: `metadata = { title: DEFAULT_SITE_NAME }`; `async` layout; `lang` from `getLocale()`. `src/app/page.tsx`: `routing.defaultLocale`. Verify: a test/e2e asserts `<html lang="en">` on `/en` and no `MyCourse FE`/`Next.js 16 starter` text in served heads; `grep -rn "MyCourse FE\|Next.js 16 starter" src e2e` shows no remaining assertion.

### 8g. Messages

- [x] 8g.1 Add `homepage.seo.title`, `homepage.seo.description` and `home.signedIn.pageTitle` to `src/messages/en.ts` and `src/messages/vi.ts` (title ≤ 60, description ≤ 160 code points; final copy from the inventory, flagged for product review). Verify: `npm run lint` (typed `Messages` parity) and a length test pass.

### 8h. Post-auth default destination (D8)

- [x] 8h.1 Replace `homeHref` with `defaultPostAuthHref` in `login-content.tsx`, `use-oauth-post-auth.ts`, `use-redirect-if-authenticated.ts` (and its doc comment), `login-signup-popup.tsx`, `confirm-email-content.tsx`; keep `homeHref` in the files listed as unchanged in the inventory. Verify: `grep -rn "homeHref" src` lists only the intentional remaining uses; the existing tests of these files are updated to expect `/home` where they asserted the old default and pass.

### 8i. Configuration examples and e2e environment

- [x] 8i.1 Add the commented `SITE_URL` block to the five `.env*.example` files (comment language of each file; values per the docs inventory; the `.env.local.example` comment states that `http://localhost` works only under `next dev` and that a local `next start` or Docker container needs an `https` origin such as `https://local.example.test`). Verify: `grep -n SITE_URL .env*.example` shows five blocks; no real domain or secret appears.
- [x] 8i.2 `scripts/e2e-lifecycle.mjs`: `serverEnv.SITE_URL = "https://e2e.example.test"`; `buildEnv` unchanged. Verify: the e2e server starts (instrumentation passes) in 8k.

### 8j. Unit tests (listed per file in the inventory)

- [x] 8j.1 Add/update the Jest tests named above plus `auth-session`/`server-auth`/`cookie` tests affected by the constants, and place each where `jest.config.ts` runs it: its `testMatch` does not pick up `*.test.ts` directly under `src/` or `src/app/`, so the proxy, instrumentation, robots and sitemap tests are named `*.test.tsx` (proxy and instrumentation tests use a per-file `@jest-environment node` docblock when jsdom cannot host `NextRequest`). Verify: `npm run test` passes with the new tests counted.

### 8k. E2E journeys

- [x] 8k.1 Add specs under `e2e/tests/` (style of `e2e/support/auth.ts`): guest `/en` head tags (title, description, canonical, hreflang vi/en/x-default, `og:*`, `Organization` JSON-LD, no `og:image`); signed-in learner `/en` and `/` → `/en/home` and logo → `/en/home`; `/en/home` robots `noindex, nofollow` with no canonical; `/robots.txt` and `/sitemap.xml` content on `https://e2e.example.test`; guest logo → `/en`; logout then brand link shows the guest home (proves no stale client-router cache of `/en/home`). Verify: `npm run test:e2e` passes locally.

## 9. Final Phase — GitNexus Sync (AGENTS.md — Final Phase)

- [x] 9.1 Force-sync the graph after the code is final: `npx gitnexus analyze` (add `--embeddings` only if `.gitnexus/meta.json` shows embeddings). Verify: `AGENTS.md` and `CLAUDE.md` GitNexus counts are regenerated by the tool, not hand-edited.
- [x] 9.2 Run `gitnexus_detect_changes({scope: "all"})` and confirm every d=1 dependent from 6.2 was updated. Verify: the result is recorded in the session context.

## 10. Quality Gates and Exit Code Rule (AGENTS.md — Final Phase; Exit Code Rule; Tooling rule protection)

- [x] 10.1 Run `npm run check-all` (lint, biome, test, deadcode, quality:deps, build). Verify: exit code 0.
- [x] 10.2 Any non-zero exit is fixed gradually, including failures unrelated to this task that can break CI/CD, then every gate is re-run. Verify: the session context lists each failure and its fix; no command is claimed as passed unless run.
- [x] 10.3 Tooling rule protection: do not modify, disable, weaken or bypass lint, Biome, tests, knip, madge, jscpd, tsconfig, CI or hooks; no suppressions or ignore entries; if a rule blocks a structure, refactor the implementation; if compliance is genuinely impossible, explain, stash with a descriptive message and wait for the user. Verify: `git diff --name-only` contains no tooling config (`eslint.config.mjs`, `biome.json`, `knip.json`, `.jscpd.json`, `jest.config.ts`, `tsconfig.json`, `.github/**`, `package.json` scripts).
- [x] 10.4 Build with `SITE_URL` unset passes (the same command as 5.6) and a production start without `SITE_URL` fails with the `SiteConfigError` message while a start with `SITE_URL=https://example.com` serves `/vi` (200), the cookie request (307 to `/vi/home`), `/robots.txt` and `/sitemap.xml`. Verify: the four observations are recorded.
- [x] 10.5 Run `npm run test:e2e` once more on the final tree. Verify: exit code 0.

## 11. Post-Implementation Code Review (AGENTS.md — Post-Implementation Code Review Requirement)

- [x] 11.1 Review the whole diff for: existing architecture and folder structure followed; existing utilities reused; no duplicate logic (re-run the 7.1 searches); no unrelated files modified; no secrets or real domains hard-coded; CI/CD readiness (no new required build env). Verify: a checklist with the result of each item is in the session context.
- [x] 11.2 Review the behaviour against `specs/*` scenario by scenario. Verify: every scenario maps to a test (unit or e2e) or a recorded manual check.

## 12. Documentation and Context Sync (AGENTS.md — Documentation and Context Sync; Full Documentation Replacement; Language Consistency; Swagger rule)

- [x] 12.1 Re-read all relevant documents, the complete `.context/` folder, the session context and GitNexus files, then apply every item of `docs-update-inventory.md` (parts A, B, C) by replacement, not by appending history; English everywhere except the Vietnamese section "Tích hợp home" of `docs/seo-ranking-setup.md`. Verify: each `DOC-n` is ticked off in the session context.
- [x] 12.2 Rescan the whole source for statements the inventory missed (route tables, folder trees, asset catalogues, env tables) and fix them. Verify: `grep -rn "no route metadata\|not wired\|Planned SITE_URL\|MyCourse FE\|nextPath ?? homeHref\|listPrivatePathPrefixes\|SIGNED_IN_HOME_PATH" docs README.md` returns nothing stale.
- [x] 12.3 Superseded statements in the earlier change's artifacts (`openspec/changes/add-signed-in-home-page/*`) are left as that change's history unless the change is still active in the same docs; the product documents (`docs/*`) must carry only the final state. Verify: no product document contradicts the code.
- [x] 12.4 Swagger/API rule: no Swagger YAML is touched, so `ruby generate-apidog-postman.rb` is not run. Verify: `git diff --name-only | grep -i swagger` is empty.
- [x] 12.5 Update only the current project's `.context/session-<SESSION_ID>.md` for coding-task state; update GitNexus files through task 9. Verify: no other context file changed.

## 13. Sensitive Test Accounts and Environment Secrets (AGENTS.md — Sensitive policy)

- [x] 13.1 Inspect only the committable Git surface (tracked, staged, modified and non-ignored untracked files); never read `.env.local`. Use only fake placeholders (`https://example.com`, `https://e2e.example.test`, `https://local.example.test`) in examples, tests and docs; mention env variable names only. Verify: `git diff` contains no real domain, credential, token, cookie value or private endpoint; ignored files were not scanned and the final answer says so.

## 14. Mandatory End-of-Task Learning Summary

- [x] 14.1 Update only `.context/session-<SESSION_ID>.md` after implementation, review, gates, GitNexus and docs are complete, with **What I Learned Today** (what existed and was reused, the all-dynamic-routes finding and why `SITE_URL` is runtime-only, the `instrumentation.ts` guard, the cookie-constant extraction, any command failure) and **What I Should Learn or Do Next Time** (social image asset, `WebSite` JSON-LD once search exists, one-hop `/` redirect, Cloudflare rule check, the homepage still mock data). Verify: both headings exist and every statement is true.

## 15. Memory Bank End-of-Turn Persistence (AGENTS.md — Required end-of-turn persistence; Verbatim final-response persistence)

- [x] 15.1 As the last operation before the final answer: `memory-bank-cli memory_bank_update` for `activeContext.md`, `progress.md` (and `nextTasks.md` if it exists), and for `lastResponse.md` the complete final answer verbatim (CLI → MCP → direct file; 30 s limit; no retry in the same turn). Verify: persistence is claimed only if the write succeeded; the emitted answer equals the persisted text.

## 16. Final Response Requirement (AGENTS.md)

- [x] 16.1 Report: what was implemented; files changed; existing resources reused (`buildPageMetadata`, `buildSitemapEntries`, `privateCrawlDisallowPaths`, `publicCrawlAllowPaths`, `signedInHomeRobotsMode`, `robotsPreset`, `localizedPathname`, `JsonLd`, `buildOrganizationJsonLd`, `routing`, `hasLocale`, the `login/page.tsx` metadata pattern); duplicate logic merged or avoided (cookie literals, post-auth default, language-alternate loops, `listPrivatePathPrefixes`, `SIGNED_IN_HOME_PATH`); documentation, GitNexus and the `.context/session-<SESSION_ID>.md` updated; quality gates run; commands passed; commands failed and how they were fixed; remaining risks (CDN cache rule, product copy review, `SITE_URL` per environment, stale-cookie landing, homepage still mock, no social image).

## 17. Commit Rules (AGENTS.md — Commit rules; Branch rename; Agent rule boundaries)

- [x] 17.1 Commit only if the user asks: title in English, one line `<type>: <title>`, no scope or parentheses, no body or footer, 15–72 characters, specific enough to explain the change (for example `feat: add homepage seo and redirect signed-in users home`); let the Husky `pre-commit` hook run `make check-all` if present (this repository has no Husky or Makefile at this commit, so `npm run check-all` is the equivalent) and the `commit-msg` hook validate with commitlint; never `--no-verify`. Verify: `git log -1 --format=%s` is compliant.
- [x] 17.2 Branch rename rules apply only if the user asks to rename the branch; never push, delete remote branches or change upstream unless separately requested. Verify: no push or remote change was made.
- [x] 17.3 Any new rule added to `AGENTS.md` must be wrapped in uniquely named `<!-- begin:<rule-name>:start -->` / `<!-- end:<rule-name>:end -->` markers; this change adds none. Verify: `git diff AGENTS.md` shows only tool-regenerated GitNexus counts, or nothing.

## 19. Follow-up fixes (guest `/home` redirect and stale login popup)

- [x] 19.1 Add `resolveGuestHomeRedirectPath` to `src/lib/navigation/signed-in-home-redirect.ts` and apply it in `src/proxy.ts` after the signed-in rule. Verify: `signed-in-home-redirect.test.ts` and `proxy.test.tsx` cover `/vi/home`, `/vi/home/`, `/en/home` (307 to the locale root with private no-store and `Vary: Cookie`), a single cookie, a full session (served) and non-matching paths.
- [x] 19.2 Add `src/app/[locale]/@modal/page.tsx` and `src/app/[locale]/@modal/[...catchAll]/page.tsx` (both render `null`) so a soft navigation away from the login modal clears the slot. Verify: logging in with `user09@yopmail.com` and `user10@yopmail.com` through the popup from `/vi` leaves no dialog on `/vi/home` (Playwright MCP).
- [x] 19.3 Update `e2e/tests/home.spec.ts` (guest is sent to `/en`), `e2e/tests/seo.spec.ts` (the `/en/home` noindex check logs in first) and `e2e/tests/signed-in-redirect.spec.ts` (guest `/en/home` redirect; no dialog after login).
- [x] 19.4 Update the spec delta (`signed-in-home-entry`), design D12/D13 and the docs: `router.md`, `flow.md`, `folder-structure.md`, `screens.md`, `testing.md`, `seo-ranking-setup.md`, `deploy.md`, `security-hardening-notes.md`, `reusable-assets.md`, `architecture.md`, `modules.md`.

- [x] 19.5 Add `resolvePostAuthHref(nextPath)` to `src/lib/navigation/routes.ts` (no `next`, or `next` equal to the public homepage, resolves to `defaultPostAuthHref`) and use it in `login-content.tsx`, `use-oauth-post-auth.ts` and `use-redirect-if-authenticated.ts`, replacing the three `nextPath ?? defaultPostAuthHref` copies. Verify: `routes.test.ts` and `use-oauth-post-auth.test.tsx` cover it; the login popup from `/vi` (header Login link, `next=/`) ends on `/vi/home` without the `/` to `/vi` to `/vi/home` redirect hops.

## 18. Manual Operations (user, outside the repo — not agent tasks)

- [x] 18.1 Add `SITE_URL=https://<that environment's own origin>` (pure origin, same host as the OAuth callbacks, never the production domain on dev/staging) to the server env file of each environment: dev PM2 `.env.local`, staging `.env.staging`, production `.env.prod`, or the file named by the container `env_file`; then reload (`pm2 reload ecosystem.config.cjs --only <app> --update-env` or `docker compose up -d`). Local `next dev` may use `http://localhost:3000`; a local `next start` or Docker container needs an `https` origin. Verify: the app starts; a missing or wrong value makes it exit with the `SiteConfigError` message.
- [x] 18.2 No GitHub Actions secret is needed for `SITE_URL` (nothing reads it at build). Verify: the dev deploy workflow still passes without it.
- [x] 18.3 Check Cloudflare/CDN rules so `/`, `/vi`, `/en` are not cached by a "Cache Everything" or equivalent rule. Verify: `curl -sI` twice with and without the cookies shows distinct, uncached responses.
- [x] 18.4 After the first production deploy run the verification commands from `docs/deploy.md` and, optionally, submit `https://<origin>/sitemap.xml` to Google Search Console. Verify: `/robots.txt` and `/sitemap.xml` show the real origin.
