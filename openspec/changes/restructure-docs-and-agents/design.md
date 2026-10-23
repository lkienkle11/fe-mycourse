## Context

See `proposal.md` - Why / What Changes for motivation and the full change list. This document records the technical decisions needed to execute that plan without losing a rule, creating dead links, or growing `AGENTS.md` past the Codex limit.

Current state, confirmed by reading the files (not only filenames):

- `docs/` holds 26 `*.md` files + `docs/delivery/` (7 stubs: `broadcast`, `graphql`, `grpc`, `long-polling`, `mqtt`, `sse`, `websocket`). `delivery.md` states "stubs unchanged". `testing.md` is only 149 lines but 45 KB (very long lines); `deploy.md` is 1058 lines with Appendices A–J + `## SITE_URL`.
- `README.md` (37 KB) has `## Documentation Convention (Mandatory)` (line 54) and `## Documentation in this repo` (line 65, a 17-row table) and then reproduces feature-level documentation in its own body (lines 163–540: Environment Variables, Low-level API Helpers, Auth Flow (Login), Auth Flow (Get Current User / Me), Token Refresh, Zustand Stores, Project Constants, Auth Store).
- `AGENTS.md` is 56,831 bytes / 863 lines: GitNexus block (lines 1–102, 5,497 bytes, auto-rewritten by `npx gitnexus analyze`), SKILLS (104–107), Global Memory Bank Rules (109–225), Implementation Workflow Rules (227–863). `CLAUDE.md` is 103 lines: `@AGENTS.md` + the same GitNexus block (auto-managed).
- There is no Husky, no `.husky`, no `core.hooksPath` (repo or global), no installed hook (`.git/hooks` has only `.sample` files), no `Makefile` in `fe-mycourse`. `package.json` has `check-all` (= `lint` + `biome` + `test` + `deadcode` + `quality:deps` + `build`), `test-all` (= `check-all` without `build`) and `lint:commit` (`commitlint --from=HEAD~1 --to=HEAD`). CI (`e2e-browser.yml`, `deploy-dev.yml`) runs `npm run test-all`; no workflow references `docs/`.
- `be-mycourse` (branch `feat/add-user-slug-management`, upstream `[gone]`, 6 local commits): `docs/` → `ARCHITECTURE.md`, `FEATURES.md`, `DATA-MODEL.md`, `SHARED.md`; `AGENTS.md` 60,339 bytes with `make check-all` / `make test-all` (`check-all` = `go fmt` + `test-all` + `build-nocgo` + `build`). BE's `restructure-docs-and-agents` change is 53/53 done.
- `.ai/skills` has `logic-n-1-optimize`, `nextjs-optimization` (with `evals/`, `references/`), `nextjs-seo-optimization` (23,460 bytes of `SKILL.md` total). `skills-lock.json` lists `shadcn` and `supabase-postgres-best-practices`.
- `.cursor/rules/rule-before-plan-code.mdc` (`alwaysApply: false`) references `docs/` at lines 197, 200, 202, 225, 260, 293, 295, 331, 341, 352, 464, 471, 502–529 and `IMPLEMENTATION_PLAN_EXECUTION.md` at lines 382 and 423. `.cursor/index.mdc` (`alwaysApply: true`) is 3 lines. `.cursor/skills/session-context-handoff/SKILL.md` writes `.context/session_summary_<timestamp>.md`, which contradicts `AGENTS.md`'s `.context/session-<SESSION_ID>.md`. `.cursor/skills/openspec-*` and `.cursor/commands/opsx-*` duplicate `.claude/skills/openspec-*` and `.claude/commands/opsx/*` (not changed here).
- OpenSpec: 5 archived changes (`2026-09-16-add-frontend-test-coverage`, `2026-09-18-add-frontend-error-handling`, `2026-09-19-fix-dashboard-mobile-forbidden-logo`, `2026-09-19-unify-dashboard-forbidden-ui`, `2026-09-20-route-based-auth-modal`) and 8 active, all 100% complete: `sync-user-slug-contract` 62/62, `add-taxonomy-slug-management-ui` 104/104, `add-signed-in-home-page` 83/83, `add-home-seo-and-signed-in-redirect` 77/77, `sync-me-roles-contract` 13/13, `sync-course-collaborator-role-contract` 13/13, `disable-dev-deploy-job` 13/13, `add-course-slug-management-ui` 48/48.
- `src/app` has 55 `page.tsx`; the only `src` references to `docs/` are three comments in `src/lib/security/web/security-headers-presets.ts` (lines 2, 8, 27) pointing at `docs/deploy.md`, which is kept.

## Goals / Non-Goals

**Goals:**
- A fixed documentation set where each concern has exactly one home, so the redundancy above cannot recur by construction (route table only in `PAGES.md`; a feature's rules only in its `FEATURES.md` entry; an asset only in `SHARED.md`).
- An agent can find what it needs by `grep -n "^## " docs/FEATURES.md` plus one targeted read, never by reading the whole `docs/` folder.
- `AGENTS.md` under 32,768 bytes with no loss of any obligation: every obligation of the old file is either kept in `AGENTS.md`, moved verbatim to a named skill that `AGENTS.md` triggers, or deliberately removed and listed in the obligation map (Decision 9).
- Shared `AGENTS.md` sections are textually identical in `fe-mycourse` and `be-mycourse`; only the GitNexus block and the `Repository specifics` section differ.
- Zero dead links after the change (repository-wide search, both `docs/`-prefixed and relative `](./...)` styles).

**Non-Goals:**
- No change under `src/`, no change to `package.json`, ESLint, Biome, Knip, jscpd, Jest, Playwright, CI workflows or any quality tool/config (Tooling rule protection).
- No change to `CLAUDE.md`, the GitNexus block, or the `.claude/` / `.cursor/` OpenSpec skills and commands.
- No Git hook installation (Husky or otherwise).
- No limit on how much of `.context/` the Initial Phase reads (recorded as residual risk).
- No edit to any file under `be-mycourse/`; BE gets its own change.
- No hard per-entry line cap in `FEATURES.md`: entries are sized by genuine complexity (the 3007 slug-conflict and optimistic-lock flows keep their Mermaid).

## Decisions

**1. Four fixed docs files + one history file + five satellites.**
`ARCHITECTURE.md`, `PAGES.md`, `FEATURES.md`, `SHARED.md`, `ALL-SPRINTS.md`; satellites `deploy.md`, `docker.md`, `quality.md`, `testing.md`, `course-collaboration-handoff-2026-06-04.md`. `PAGES.md` takes the role BE's `DATA-MODEL.md` has: the FE has no database, but it has a large routing/screen surface that today is spread over four files. A separate `COMPONENTS.md` was rejected: its inventory already duplicates `reusable-assets.md` UI Primitives and `screens.md` Shared Components, which is the exact BE mistake to avoid; the inventory goes into `SHARED.md`, the conventions into `ARCHITECTURE.md`. A 3-file set (routes inside `ARCHITECTURE.md`) was rejected: it would make `ARCHITECTURE.md` the new 1000-line file.

**2. `FEATURES.md` is organised by feature area, with these entries (slug = `##` heading).**

| Slug | Covers | Primary sources |
|---|---|---|
| `auth` | login, social OAuth (Google/Discord/X), register, email confirm, logout, `/me`, token refresh, cookies, permission checks, isomorphic cookie utilities | `flow.md` §1,1b,2,2b,2c,3,4,7; `logic-flow.md` §1,1b,2,3,6; `api-using.md` (Authentication, Token Refresh, Server Actions, OAuth Server Actions, Me API); `api-overview.md` (Auth routes, Me routes); `modules.md` (Authorization constants & hooks, Me API module, Auth OAuth module) |
| `home-and-catalog` | guest `/`, signed-in `/home`, catalog APIs (trending, continue learning, popular instructor), `/courses/{slug}` placeholder, search stub, home SEO integration | `screens.md` (Home Screen, Signed-in home `/home`); `router.md` (Guest `/` vs signed-in `/home`); `pages.md` (Home SEO foundation); `modules.md` (Home catalog module); `api-overview.md` (Home catalog routes); `flow.md` §9; `seo-ranking-setup.md` (Tích hợp home) |
| `seo-web` | metadata/OG/Twitter, robots/sitemap, JSON-LD, SSG/SSR/ISR modes, performance and security helpers, `SITE_URL` contract | `seo-ranking-setup.md`; `security-hardening-notes.md`; `architecture.md` (SEO layer); `modules.md` (SEO / Performance / Security web); `api-using.md` (`seoFetch` unused); `api-overview.md` (SEO fetch consumer) |
| `instructor-application` | become-instructor page, page-state resolver, Delta/PDF preview, remote combobox, submit UX | `instructor-application.md`; `api-overview.md` (Instructor routes) |
| `instructor-admin` | approvals, roster, profiles, expertise, tickets, permissions P41–P58 + P68, identity rendering | `instructor-admin.md`; `api-using.md` (Course detail (instructor) only if instructor-specific) |
| `taxonomy-admin` | levels/outcomes/skills/tags/topics admin, tree + DnD, slug (3007), list query types | `taxonomy-admin.md`; `logic-flow.md` §10b; `api-using.md` (Taxonomy (admin)); `api-overview.md` (Taxonomy routes); `modules.md` (Taxonomy module) |
| `course-editor` | create (optional slug, 3007), info save (optimistic lock), outline, pricing, certificate, collaborators, review history, submit-for-review validation, version numbering | `logic-flow.md` §10,10a,11,13,14; `api-using.md` (Course detail (instructor)); `api-overview.md` (Course routes); `modules.md` (Course module); `course-collaboration-handoff-2026-06-04.md` (stays as history, linked) |
| `course-review-admin` | admin/sysadmin course lists (all/reviewing/trash), review preview placeholder, bulk review | `pages.md` rows for `/admin/courses/*`, `/sysadmin/courses/*`; `logic-flow.md` §11 (review side) |
| `media` | media library popup, upload defaults, list scoping, permissions, tabs, known gaps | `media-collection.md`; `api-using.md` (Media (library popup)); `api-overview.md` (Media routes); `modules.md` (Media module) |
| `dashboards-and-access` | admin/instructor/sysadmin shells, sidebar, forbidden UI, role/permission gating | `screens.md` (Dashboard Shell, Global Chrome (sidebar parts)); `openspec/specs/dashboard-access-control` (linked, not copied); `instructor-admin.md` (Sidebar navigation) |
| `realtime-streams` | BroadcastChannel / WebSocket / SSE / NDJSON gRPC, envelope model, env, per-channel notes | `flow.md` §8; `logic-flow.md` §12; `patterns.md` §4.1; `delivery.md`; `delivery/*` |

Cross-cutting API behavior (response envelope, error i18n, global error capture, pagination, raw helpers, "Do Not Use") goes to `ARCHITECTURE.md` `## API layer`, not to a feature entry. Every entry follows a fixed template: `Summary`, `Rules`, `Flow` (Mermaid only where branching carries error codes or conflicts), `API`, `Screens/Routes` (slug links into `PAGES.md`, no route table), `Code` (paths), `Permissions`, `Related`, `Gotchas`.

**3. `PAGES.md` owns routes.**
Single route table (from `router.md` "Current Routes", cross-checked against all 55 `page.tsx`), route classification, layout hierarchy, locale configuration, the `src/proxy.ts` locale + signed-in redirect, screen barrels, Global Chrome, Dashboard Shell, Auth Shell/route-based modal UX, custom 404, status error page, navigation helpers, client-side route constants, "Adding a New Page". Feature entries only name the route slug and link to `PAGES.md`.

**4. `SHARED.md` uses a compact asset format.**
Current format is 7 fields per asset (Name, Type, Path, Purpose, Scope, Dependencies, Reuse Rule). New format: one line per asset `Name | Type | Path | Use when / instead of`; a short note only for non-obvious reuse rules. Sections keep the existing typed order (UI primitives, static images, types, error codes/constants, utilities, Zod schemas, Zustand stores, hooks, API layer functions, server actions, supporting type utilities, stream events, SEO/performance/security) and gain `Components` (from `components.md` `ui/`, `common/`, `home/`, `shared/`, hooks, `providers/`, `demo/`). "Gap Analysis" is dropped (its four items are either implemented or recorded in `ALL-SPRINTS.md` To do); "Additional audited reusable assets" is merged into the typed sections. Every retained asset must resolve to an existing path or export (verification script in tasks 5.x). The `Reuse Rule` text is not lost: it is generalised in the section header and kept per asset only when it names a specific thing to avoid re-creating.

**5. Mermaid is kept where the branch structure is the hard part.**
Kept: login/OAuth, refresh single-flight, slug conflict 3007 (course create, taxonomy), optimistic lock on course info save, submit-for-review validation. Dropped (prose): everything that restates control flow readable from the code.

**6. Merge first, delete after; case-insensitive filesystem.**
Each source file is read in full immediately before its content is merged, and is deleted only after every section listed in the mapping table (Decision 7) exists in the target. `architecture.md` → `ARCHITECTURE.md` and `reusable-assets.md` → `SHARED.md` are renames: use `git mv docs/architecture.md docs/ARCHITECTURE.tmp.md && git mv docs/ARCHITECTURE.tmp.md docs/ARCHITECTURE.md` so Git records a rename, not a stray modification (same issue `be-mycourse` hit).

**7. Section-level mapping (every source heading has a destination).**
Authoritative mapping used by the tasks; a heading absent from this table must be added before its file is deleted.

- `architecture.md` → `ARCHITECTURE.md`: Technology Stack, High-Level Request Flow, Directory Map (merged with `folder-structure.md`), Functional Clusters (GitNexus; refreshed numbers), Key Design Decisions, Environment Variables, Internationalization, Development server, Caching Layer, Quality gates (→ pointer to `quality.md`), Related Docs (rewritten); App Router Layout Hierarchy, Middleware: Locale Routing and Signed-in Home Redirect, Route Constants, API Routes → `PAGES.md`; SEO layer → `FEATURES.md#seo-web`.
- `folder-structure.md` → `ARCHITECTURE.md` Directory Map: Root, `src/`, `public/`, `src/test-support/`, `e2e/`; `docs/` section rewritten for the new set.
- `patterns.md` → `ARCHITECTURE.md` `## Conventions`: §1 File Naming, §2 Component Patterns, §3 Styling, §4 State Management, §5 API Call Pattern, §6 Forms, §6b API Error Pattern, §7 i18n, §8 TypeScript, §9 Cookie Handling, §10 Paginated list query params, §12–§14 (constants/types/screen), §15 Slug fields, §16 Adding New Features Checklist; §4.1 Stream events → `FEATURES.md#realtime-streams`; §11 Bulk user-picker → `FEATURES.md#instructor-admin` (or `course-editor` if collaborators-only; decided at merge); Synthetic SEO metadata → `FEATURES.md#seo-web`.
- `api-using.md` → `ARCHITECTURE.md` `## API layer`: Base URL, API Layer Overview, Response Envelope, Standard API Call Methods, Authentication — How Tokens Are Attached, Token Refresh (tokens part also in `auth`), Server Actions Pattern, SWR Hooks Pattern, Error Handling, Pagination, API error i18n, Raw helpers, Do Not Use; Route Constants → `PAGES.md`; OAuth Server Actions, Me API → `auth`; Course detail (instructor) → `course-editor`; Taxonomy (admin) → `taxonomy-admin`; Media (library popup) → `media`; SEO public GET → `seo-web`.
- `api-overview.md`: Scope, Layout, Layers, Contracts, Error handling rules, Rules → `ARCHITECTURE.md` `## API layer`; route groups → the matching feature entry `API:` lines (Auth, Home catalog, Me, Instructor, Course, Taxonomy, Media); SEO fetch consumer → `seo-web`.
- `modules.md`: Module map, Responsibilities, Cross-module contracts, Events module detail → `ARCHITECTURE.md` (Functional Clusters / module map); per-module sections → the matching feature entry.
- `components.md` → `SHARED.md` `## Components`: Organization Principle, `ui/`, `common/`, `home/`, `shared/`, Hooks, `providers/`, `demo/`; Component Conventions (Client vs Server, Naming, Styling, i18n, JsonLd) → `ARCHITECTURE.md` `## Conventions`.
- `router.md` / `screens.md` / `pages.md` → `PAGES.md`: Routing Technology, Locale Configuration (one copy), Middleware, App Router Tree, Current Routes / Route Table / Current pages (one table), Route Classification / Public vs Private, Layout Hierarchy / Layout chain (one copy), Custom 404, Navigation Helpers, Client-Side Route Constants / Route Constants / API Routes Constants (one copy), Adding a New Page, Screen barrels, Home Screen, Not Found Screen, Status Error Page, Global Chrome, Dashboard Shell, Auth Shell, Auth UX, Internationalization on Screens, Validation & API errors by screen (→ the matching feature entry), Current implementation notes, GitNexus Cluster Mapping (→ `ARCHITECTURE.md`), Cross-Reference (rewritten); UI Primitives / Shared Components / Demo Components in `screens.md` → `SHARED.md` (deduplicated with `components.md`).
- `flow.md` / `logic-flow.md` → `FEATURES.md`: see Decision 2 table; Overview of Tracked Processes, Cross-Reference → dropped (replaced by `FEATURES.md` index via headings); `logic-flow.md` §4 Form Submission Pattern, §7 i18n Text Resolution, §8–§9 API Error flows → `ARCHITECTURE.md` `## Conventions` / `## API layer`.
- `instructor-admin.md`, `instructor-application.md`, `taxonomy-admin.md`, `media-collection.md` → one entry each (all sections kept; `Related docs` sections rewritten as `Related:` slugs). `taxonomy-admin.md` "REUSE MAP (do not invent)" → the entry's `Code` plus `SHARED.md` pointers.
- `seo-ranking-setup.md`, `security-hardening-notes.md` → `seo-web` (the "ChatGPT discussion alignment" and "Wiring checklist (remaining work)" sections: the checklist's open items move to `ALL-SPRINTS.md` To do; the discussion alignment is history and is dropped after confirming nothing unique).
- `delivery.md`, `delivery/*` → `realtime-streams` (Summary, Shared envelope model, Environment variables, Type definitions, Security; per-channel stubs reduced to a one-line status each, since they are declared stubs).
- `dependencies.md`: Runtime/Dev Dependencies and Overrides are derivable from `package.json` and are dropped; "Usage Rules" → `ARCHITECTURE.md` `## Conventions`.
- `deploy.md` (kept): Appendix C (Middleware: Locale Routing) is replaced by a pointer to `PAGES.md`; Appendix B (Environment Variables Reference) is reconciled with `ARCHITECTURE.md` `## Environment Variables` (one authoritative table, the other points to it); `## SITE_URL` stays (README links to `docs/deploy.md#site_url`); Appendix J Docker pointer kept.
- `docker.md`, `quality.md`, `testing.md` (kept): remove the `_Last audited` mega-line, fix `Related docs` sections, and in `testing.md` reconcile the "Behavior matrix" rows whose file paths no longer match; no content removal otherwise.
- `course-collaboration-handoff-2026-06-04.md` (kept, dated history): only add a one-line header pointing at `FEATURES.md#course-editor`; exempt from replacement.
- `reusable-assets.md` → `SHARED.md` (Decision 4).

**8. Remove the `_Last audited` mega-line; do not replace it with another per-file stamp.**
Kept files carry a short `Last updated: YYYY-MM-DD` line only if the file is a satellite or a dated note. The four fixed files carry no stamp; staleness is addressed by the rule "when you change a feature, update its entry" and by `ALL-SPRINTS.md`.

**9. `AGENTS.md` target structure and size budget (hard limit 32,768 bytes, target ≤ 24,000 for headroom).**
Draft measured at 19,462 bytes before the Decision 20 SKILLS rule; the new rule adds about 1.6 KB, so the expected size is about 21 KB (still ≤ 24,000 target). Structure: GitNexus block (unchanged) → SKILLS (discovery and picking rule per Decision 20 + two mandatory triggers) → Global Memory Bank Rules (Pre-response load, End-of-turn persistence incl. verbatim `lastResponse.md` + redaction, MCP tool list, Agent rule boundaries, Tooling rule protection, Commit rules) → Implementation Workflow Rules (Scope and Applicability, Session and Context invariants, Initial Phase, Subagent Model and Cost Restriction, Implementation, Reuse and Deduplication, Final Phase, Documentation and Context Sync, Final Response Requirement, Sensitive Test Accounts and Environment Secrets Policy) → `# Repository specifics (fe-mycourse)`.
Obligation map (old section → where each obligation lives in the new design; the tasks require this table to be filled with exact old line numbers and verified one by one):

| Old section (line) | New location |
|---|---|
| SKILLS (104–107: "read and follow all relevant skill files under `.ai/skills/`") | SKILLS section, rewritten per Decision 20 (superset: wider discovery, three categories, priority clause, evidence) |
| Initial Phase (501) paragraphs "read all project skills inside `.ai/skills`" / "inspect every relevant skill" | Initial Phase step 2 → "Apply the SKILLS rule" (obligation to inspect relevant skills is kept; "read all" is replaced by index + pick, deliberately) |
| Memory location and project identity (113) | Global Memory Bank Rules intro |
| Required pre-response load (119) | Pre-response load |
| Required end-of-turn persistence (130) | End-of-turn persistence 1–3, 5 |
| Verbatim final-response persistence (141) | End-of-turn persistence 4 (+ redaction) |
| MCP tool contract (150) | MCP tool list line |
| Agent rule boundaries (160), Tooling rule protection (171) | same names, condensed without dropping a step |
| Commit rules (187) | Commit rules (generic) + Repository specifics (gate/command) |
| Branch rename rules (200) | `.ai/skills/branch-rename/SKILL.md`, verbatim |
| Scope and Applicability Rule (229) | Scope and Applicability Rule (items 1–9 condensed) |
| Critical Pre-Conversation Session Bootstrap Rule (266) | `session-context` skill (verbatim) + invariants |
| Critical Agent and Subagent Session Propagation Rule (373) | `session-context` skill + invariant "same ID/path to every subagent" |
| Critical First Action (392) | Initial Phase step 1 + skill |
| Critical Dual Session Context Lifecycle Rule (418) | `session-context` skill + invariants |
| Initial Phase (501) | Initial Phase (docs read by routing) |
| Subagent Model and Cost Restriction (524) | same name, condensed |
| Middle Phase: Implementation (562) | Implementation Rule |
| Critical Reuse Rule (572) + Critical Deduplication Rule (580) | Reuse and Deduplication Rule (merged) |
| Final Phase (590) + Exit Code Rule (618) + Post-Implementation Review (628) | Final Phase (merged) |
| Documentation and Context Sync (642) + Full Documentation Replacement Rule (771) + Documentation Language Consistency (791) | Documentation and Context Sync |
| Swagger and API Documentation Rule (659) | removed from FE (no Swagger in `fe-mycourse`); BE keeps it in its own change |
| Mandatory External Context Update for Read-Only Repository Tasks (669) | `session-context` skill (verbatim) |
| Mandatory End-of-Task Learning Summary (716) | Documentation and Context Sync last bullet + skill (verbatim sections) |
| Final Response Requirement (746) | Final Response Requirement |
| Sensitive Test Accounts and Environment Secrets Policy (807) | same name, condensed |

**10. Shared sections are repo-agnostic; repo facts live in `Repository specifics`.**
This replaces BE's inline `For be-mycourse: ... / For fe-mycourse: ...` branching and its "as currently structured" placeholders (BE Decision 9), which cost bytes and needed a follow-up tightening. The shared text refers to "the quality gates / shared-assets file / documentation map named in Repository specifics". `fe-mycourse` and `be-mycourse` therefore differ only in the GitNexus block and in `Repository specifics` (BE keeps its `AI Agent — dev test account` block and Swagger rule there).

**11. Commit rules without Husky.**
Generic: one-line English Conventional Commit title `<type>: <title>`, no scope/parentheses/body/footer, 15–72 characters, never `--no-verify`. Per repo: run the quality gate after the task (Final Phase) and again immediately before every commit on the exact tree being committed (`npm run check-all` for FE, `make check-all` for BE; `check-all` includes `test-all`, so both are not required; `test-all` is allowed as a faster no-build option only for intermediate runs). FE additionally validates the message with `npm run lint:commit` after committing; BE has no commitlint in repo, so its title rules are convention only.

**12. Redaction before verbatim persistence.**
`lastResponse.md` stays verbatim except that any value matching the Sensitive Test Accounts policy (credentials, tokens, keys, private endpoints, database URLs, cookies, certificates) is replaced with `[redacted]` in the persisted copy. The final answer shown to the user is unchanged. This makes "never store secrets" and "persist the final answer" jointly satisfiable.

**13. `CLAUDE.md` unchanged.**
`npx gitnexus analyze` rewrites the GitNexus block in both `AGENTS.md` and `CLAUDE.md` (BE task 7.1 proved a one-line `@AGENTS.md` is not durable). The `PostToolUse` hook that triggers it is in `~/.claude/settings.json` (user-global, not in the repo). Accepted cost: the block is loaded twice (about 5 KB).

**14. `ALL-SPRINTS.md` schema and seeding.**
```
# All Sprints
## To do      | Item | Owner (agent / developer / unassigned) | Notes |
## In progress| Item | Owner | OpenSpec change |
## Done       | Date | Item | One-line summary | OpenSpec change |
```
Rules: one line per item; `Done` rows point at the OpenSpec change instead of restating it; the file is history and a roadmap, not a system description, so it is excluded from the "update docs after every task" rule and from default reading; on archiving a change, move its row to `Done`. Seed: `Done` = 5 archived + 8 completed FE changes (date from the change folder name or first commit touching it); `In progress` = empty; `To do` = candidates, each marked "candidate, awaiting owner confirmation", from: `/{locale}/courses/{slug}` placeholder page; admin/instructor/sysadmin dashboard placeholders; `sysadmin/courses/reviewing/{courseId}/preview` placeholder; `SearchBar` stub (`flow.md` §9); former "Gap Analysis" items (`useSendWebSocketOutbound`, shared form-error component, reusable paginated list hook, course/lesson/enrollment types and callers); hosted E2E run verification (`README.md`); `permission.ts` coverage (~55%, `testing.md`); `seo-ranking-setup.md` "Wiring checklist (remaining work)"; `media-collection.md` "Known gaps"; `testing.md` "Residual backlog". This file replaces `IMPLEMENTATION_PLAN_EXECUTION.md` as the plan target.

**15. `.cursor` and plan file.**
`rule-before-plan-code.mdc`: replace each `docs/` reference (list in Context) with the four-file map; replace plan target `IMPLEMENTATION_PLAN_EXECUTION.md` (lines 382, 423) with `docs/ALL-SPRINTS.md`; replace "recommended folder `docs/delivery/`" (line 260) and the `docs/delivery.md` + `docs/delivery/*` rules (lines 352, 529) with `FEATURES.md#realtime-streams`; replace `docs/reusable-assets.md` (225, 341, 471, 526) with `docs/SHARED.md`. The rule's other directives (supreme "no coding" directive, mandatory `gitnexus analyze --force`) are left as authored by the user and are not edited here; the conflict with the OpenSpec flow is noted in Open Questions. Delete `.cursor/skills/session-context-handoff/` and root `IMPLEMENTATION_PLAN_EXECUTION.md`.

**16. OpenSpec archive.**
Archive the eight completed changes with the repository's archive workflow (`openspec archive <name> --yes`, specs sync skipped where a change has no deltas; for changes with deltas, run the sync step first so `openspec/specs/` stays consistent). Archive runs first so `ALL-SPRINTS.md` `Done` can cite archived names. Verification: `openspec list --json` shows none of the eight active.

**17. `README.md`.**
Rewrite `## Documentation Convention (Mandatory)` (line 54) and `## Documentation in this repo` (line 65) for the new files and routing, replacing the 17-row table with the five-file map + satellites; fix remaining links (`docs/architecture.md#development-server` at line 28, `docs/deploy.md` links stay, `docs/delivery.md` at line 181, `docs/quality.md`/`docs/testing.md` stay). The README body (lines 163–540) duplicates documentation; whether to trim it to pointers is an open question, not part of the default task list.

**18. BE is a separate change.**
`be-mycourse` gets a new OpenSpec change (not a reopened `restructure-docs-and-agents`, which is committed locally at 53/53) for: `AGENTS.md` under 32,768 bytes, the same two skills (copied from the FE result), Commit/redaction fixes, and its own `Repository specifics`. Order: complete FE tasks 8.x first (they produce the shared text and skills), then execute the BE change. Because BE's branch upstream is `[gone]`, create a new branch from `main`/`dev` before pushing BE's six existing commits plus the new ones.

**18b. A written hand-off document leaves the repository.**
The shared text, skills, obligation map and BE-specific differences must survive across sessions and repositories, but must not become a tracked file in either repo (it would be one more document to keep in sync). The hand-off is therefore a single new Markdown file in `/Users/kienlt/Documents/projects/mycourse-full/temporary-docs/claude-doanchat/` named `Handoff - fe-mycourse to be-mycourse (restructure-docs-and-agents).md`, written at the end of apply (task 18.3) so it records measured results, not plans. It lives outside both Git working trees (not committable, so the secrets policy's Git-surface scan does not apply to it, but it still must not contain credentials or `.env` values). Alternative considered: put it under `fe-mycourse/docs/` or `openspec/changes/.../` — rejected because it would add a sixth fixed docs file or a second copy of facts that live in `design.md`.

**19. Verification strategy (no application tests apply).**
Docs/rules have no unit tests, so each task states a mechanical check: `wc -c AGENTS.md` < 32768; marker-pair counting for `<!-- begin:x:start -->` / `<!-- end:x:end -->`; `grep -rn` for removed file names across `README.md`, `docs/`, `.cursor/`, `.ai/`, `.claude/`, `src/`, `e2e/`, `scripts/`; a script (kept out of the repo, in scratchpad) that extracts every backticked `src/...` path in the new docs and checks it exists; a script that extracts exports named in `SHARED.md` and checks them with `grep`; byte-for-byte comparison of the GitNexus block before/after; `npm run check-all` must pass unchanged.

**20. Skill discovery and picking (replaces "read all project skills").**
Facts: this machine has 20 skills in the project (`.ai` 3, `.claude` 11, `.cursor` 6) and about 170 at agent level (`~/.claude/skills` 21, `~/.claude/plugins` 95, `~/.codex/skills` 6, `~/.agents/skills` 11, `~/.cursor/skills` 7 + `skills-cursor` 25, `~/.gemini/antigravity` 5); a naive `find` over agent folders returns 1,403 `SKILL.md` because plugin caches keep several versions of the same skill (e.g. `figma-use` ×9). The directories `.agent`, `.agents`, `.codex`, `.gemini`, `.antigravity` do not exist inside `fe-mycourse`, but the rule must list them because other repos and agents use them. Rule text (about 1.6 KB, shared and repo-agnostic):
1. When: before any action of an in-scope task, after the session-context trigger (identity first); for out-of-scope tasks only when a skill clearly fits. Subagents do not re-pick; the main agent passes the picked `SKILL.md` paths.
2. Discover by index only: for each skill folder list `name` and `description` from frontmatter; folders: project `.ai/skills`, `.agents/skills`, `.agent/skills`, `.claude/skills`, `.codex/skills`, `.cursor/skills`, `.gemini/skills`, `.antigravity/skills`, and the agent-level `~/.claude/skills`, `~/.codex/skills`, `~/.agents/skills`, `~/.cursor/skills`, `~/.gemini/skills` plus skills of installed plugins; de-duplicate by name (project over user-level; ignore plugin cache copies/older versions).
3. Pick in three categories: functional, non-functional, workflow (definitions in proposal.md). A category with no fitting skill is stated as "none".
4. Read picked skills in full, announce `Using <skill> (<category>) to <purpose>`, and follow them.
5. Priority: user instructions and `AGENTS.md`/`CLAUDE.md` override skills; a skill never overrides Tooling rule protection; when two skills conflict, the `AGENTS.md` workflow wins (this neutralises OpenSpec-vs-`superpowers` overlap).
6. Evidence: record picked skills (name, category, path) in `.context/session-<SESSION_ID>.md` and list them in the Final Response.
Skills of another agent cannot be "invoked" natively; they are read as plain instructions, and tool-specific ones (Cursor commands, Figma MCP) are picked only when the tool exists. Alternative rejected: "read every `SKILL.md` fully" (hundreds of thousands of tokens). The secrets policy gets one sentence: reading skill folders outside the repository is skill discovery, not a secrets scan, and is allowed.

**21. `docs-sync` skill: shared procedure plus a final `Repository specifics` section.**
One file, `.ai/skills/docs-sync/SKILL.md`. Frontmatter `name: docs-sync`, a `description` that triggers after any in-scope task changing behavior, routes, shared code or architecture. Body: When to use; Procedure (1 list what changed via `git diff`; 2 map each change to a target file; 3 edit only that entry, replace outdated text, never append a changelog; 4 keep the file's language and style; 5 verify paths exist, no heading duplicated across docs files, links resolve; 6 on archiving an OpenSpec change move its `ALL-SPRINTS.md` row to Done); Do not (touch dated handoff notes or `ALL-SPRINTS.md` history, add a new docs file); `Repository specifics` (FE: feature rule/flow → `FEATURES.md#<slug>`, route/screen → `PAGES.md`, shared code → `SHARED.md`, cross-cutting → `ARCHITECTURE.md`). `be-mycourse` copies the file and replaces only the final section (adds `DATA-MODEL.md` for tables/columns and `ruby generate-apidog-postman.rb` after Swagger changes). Alternatives rejected: `references/<repo>.md` (extra file the agent may not open; Codex does not auto-load references) and FE-only (copy-paste drift between repos, already seen with `AGENTS.md`). It also gives the workflow skill category something to pick for the documentation rule, and lets `AGENTS.md` stay short.

## Risks / Trade-offs

- [Merging ~26 files into 4 can silently drop a rule] → Read each source in full immediately before merging, follow the section mapping in Decision 7, delete only after the mapped sections exist, and keep the old files recoverable via Git history.
- [Moving session procedure to a skill depends on the agent following one trigger] → Keep five invariants and the "stop if not established" rule in `AGENTS.md`; the trigger is under SKILLS as a "mandatory trigger"; Codex does not auto-load `.ai/skills`, so the trigger names the exact file path.
- [Condensing Scope/Security/Final Response may weaken an obligation] → The obligation map (Decision 9) is filled and checked line by line in the tasks before the old text is removed; headroom (~13 KB) is available to restore wording.
- [A new always-read skill raises per-task cost] → `session-context` is read only when a task needs session state (in-scope tasks and out-of-scope tasks that need writable state), exactly as the old sections were read; `branch-rename` only on request.
- [`FEATURES.md` growth without a line cap] → Entries follow the template and "only write what the code cannot say"; completed-sprint history goes to `ALL-SPRINTS.md`, not into entries.
- [Compacting `SHARED.md` could hide a reusable asset and trigger duplicate code, a rejection-level defect] → Each of the 1669 source lines' assets is mapped to a compact row or explicitly dropped with a reason; asset verification script runs against `src/`.
- [`.context/` is still read in full] → Not addressed here; recorded as residual risk and `ALL-SPRINTS.md` To do candidate.
- [GitNexus block duplicated in `CLAUDE.md`] → Accepted (Decision 13).
- [`rule-before-plan-code.mdc` keeps directives that conflict with the OpenSpec flow] → Only references are updated; the conflict is flagged in Open Questions.
- [Skill discovery over ~190 skills is costly if done naively, and picking is subjective] → index-only discovery, de-duplication by name, cap on full reads to the picked skills, evidence in session file and Final Response so a review can see what was picked and why.
- [Skills from another agent are tool-specific or competing with OpenSpec] → read as plain instructions, pick only usable ones, priority clause (`AGENTS.md`/`CLAUDE.md` win).
- [`docs-sync` copied to BE could keep FE file names] → BE replaces the final `Repository specifics` section; hand-off document lists this explicitly.
- [Pre-commit gate is now a rule with no hook to enforce it] → Stated honestly in Commit rules; installing hooks is a separate, user-approved tooling change.

## Migration Plan

1. Archive the eight completed OpenSpec changes.
2. Build `FEATURES.md`, then `PAGES.md`, `ARCHITECTURE.md`, `SHARED.md`, `ALL-SPRINTS.md` (old files remain until each target is complete).
3. Edit satellites; delete merged-away files and `docs/delivery/`; do the two case-insensitive renames.
4. Fix backlinks (`README.md`, `docs/*`, `.cursor/*`, comments).
5. Create the three skills (`session-context`, `branch-rename`, `docs-sync`), rewrite `AGENTS.md` (including the new SKILLS rule), delete `.cursor/skills/session-context-handoff/` and `IMPLEMENTATION_PLAN_EXECUTION.md`.
6. Run `npm run check-all`, then `npx gitnexus analyze --embeddings`.
7. Commit in groups (one-line English Conventional Commit titles, 15–72 characters): archive; docs content; docs deletions/backlinks; agents + skills; cursor/plan cleanup; gitnexus stats.
8. Create and execute the BE change.
Rollback: `git revert` of the commit group; no runtime component.

## Open Questions

- `skills-lock.json` lists `shadcn` and `supabase-postgres-best-practices`, while `.ai/skills` has three other skills. Decide at apply time (ask the user) whether to leave, update or remove the lock; the change leaves it untouched unless the user decides.
- Does `README.md` lines 163–540 get trimmed to pointers into `FEATURES.md` / `ARCHITECTURE.md` / `SHARED.md`? Default: not trimmed in this change; list as an `ALL-SPRINTS.md` To do candidate.
- `rule-before-plan-code.mdc` "supreme no-coding directive" and forced `gitnexus analyze --force` conflict with explore/propose/apply flow; this change only updates references. Does the user want the rule itself revisited later?
- The `be-mycourse` six local commits sit on a branch whose upstream is `[gone]`; creating a new branch before push is the user's call and outside this FE change.

## Extension

Extension (2026-10-23, user-approved): `AGENTS.md` gained the Degraded Environment Rule, an expanded Implementation Rule (scope, match surrounding code, ask when it is the user's call, tests, safe by default, completion) and two skills, `pre-implementation-checkpoint` and `progress-tracking`, with matching mandatory triggers and Repository specifics implementation notes. The default subagent cap is 4 and exceeding it needs the user's answer. Not added by decision: a "never commit or push unless asked" rule (user still deciding).
