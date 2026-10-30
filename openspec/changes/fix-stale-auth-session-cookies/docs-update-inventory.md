# Documentation Update Inventory

Companion to `design.md` and `tasks.md` group 9 (`docs-sync` skill). Every document that becomes stale when this change lands, with the CURRENT text (verbatim, `HEAD dab5c1a`) and the exact REPLACEMENT. All replacement text is English. `docs/SHARED.md` keeps its existing mixed English/Vietnamese style (new rows are English; existing Vietnamese cells are not touched). Dated handoff notes and `docs/ALL-SPRINTS.md` history rows are exempt from replacement.

Method (AGENTS.md order): (1) GitNexus does not index documents, so it cannot enumerate them; (2) existing documents grepped for `refresh`, `refresh_token`, `session_id`, `cookie`, `clearAuthSessionCookies`, `attemptRefresh`, `logout`, `BroadcastChannel`, `broadcast`, `tab sync`, `proxy.ts`, `hasAuthSessionCookies`, `stale cookie`, `login required`, `signed-in home`, `X-Token-Expired`, `InvalidSession`, `RefreshTokenExpired`, `UserDisabled`, `UserBanned`, `navigator.locks`, `session_expired` across `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/*.md`, `openspec/specs/**`, `openspec/changes/archive/**` (grep only), `.ai/skills/**`, `.claude/skills/**`, `.cursor/**` (a read-only Codex `gpt-6-luna` explorer produced the first pass and every hit below was re-read by the main agent); (3) the codebase (see `code-change-inventory.md`).

Conventions: `FRAGMENT` = replace exactly the `old` substring with `new` inside the line; `INSERT` = add the text as a new line/row after the quoted anchor; `REPLACE` = replace the whole quoted block. Line numbers are `HEAD` references: re-locate by quoting `old`, and re-read the entry after editing (docs-sync rule: replace outdated text, never leave old and new claims side by side). Case note: git tracks `docs/architecture.md` and `docs/pages.md` in lower case; `AGENTS.md` names them upper case (recorded as a follow-up, not edited here).

Final-state facts every replacement must state (single source: `design.md`): a backend `401`/`403` on refresh clears all five session cookies in the refresh proxy and in the server-writable refresh; every other failure keeps them; the proxy error body then carries `session_cleared: true`; the browser broadcasts `logout` with reason `session_expired` once per refresh outcome and only when cookies were cleared; browser refresh runs under the Web Lock `mycourse:auth-refresh` (unlocked fallback); Server Action refreshes take no lock and send no event; `src/proxy.ts` stays presence-based and unchanged; the open `/home` keeps its prompt until reload.

Documents changed (8): `docs/FEATURES.md`, `docs/SHARED.md`, `docs/architecture.md`, `docs/pages.md`, `docs/testing.md`, `docs/deploy.md`, `README.md`, `docs/ALL-SPRINTS.md`. DOC-1..DOC-36 are Phase 1 (already applied on this branch, uncommitted); DOC-37..DOC-67 (section "Phase 2 documentation items" at the end) are Phase 2 and touch seven of the same eight files (not `docs/deploy.md`, not `README.md`); each Phase 2 CURRENT text was verified to occur exactly once in the working tree of 2026-10-26, i.e. on top of the Phase 1 edits. Main specs under `openspec/specs/` change only through archive/sync of this change's delta specs (task 10.4), not by hand.

---

## `docs/FEATURES.md` — entry `## auth`

### DOC-1 — L21 — FRAGMENT (refresh rule bullet)
old: `Browser: single-flight `POST ${origin}/api/auth/refresh` (absolute same-origin URL; a relative one fails URL parsing in `fetch-core`), FE proxy forwards `X-Refresh-Token` + `X-Session-Id` and rewrites cookies;`
new: `Browser: single-flight `POST ${origin}/api/auth/refresh` (absolute same-origin URL; a relative one fails URL parsing in `fetch-core`) taken under the cross-tab Web Lock `mycourse:auth-refresh` (`runWithCrossTabRefreshLock`, `src/api/auth/browser-auth.ts`; without `navigator.locks` it runs unlocked), FE proxy forwards `X-Refresh-Token` + `X-Session-Id` and rewrites cookies (`handleRefreshProxy`, `src/api/auth/refresh-proxy.ts`, called by the thin `src/app/api/auth/refresh/route.ts`);`
Reason: the lock and the proxy extraction are new facts of the same sentence.

### DOC-2 — after L21 — INSERT (new bullet)
`- Dead session: a refresh the backend rejects with `401` or `403` (`isDeadSessionRefreshStatus`, `src/api/auth/auth-refresh.ts`) clears all five session cookies (`access_token`, `refresh_token`, `session_id`, `auth_session_expires_at`, legacy `auth_session_max_age`) through the one remover `clearAuthSessionCookies`: in the refresh proxy, and for Server Actions through the optional `clearSession` callback of the `server-writable` runtime (`createClearSessionFromRequest`; the upstream status travels on `ApiRefreshValidationError.upstreamStatus`). `400`, `429`, `5xx`, timeout, network errors, a malformed upstream answer (`502`), a cookie persist failure (`500`) and the missing-credentials `401` never clear anything. When the proxy cleared the cookies its error body adds `session_cleared: true` (still only the allowlisted code, the fixed message and `data: null`, never the BE message); the browser transport then broadcasts `logout` with reason `session_expired` exactly once per refresh outcome (`BROADCAST_LOGOUT_REASON`, `sendBroadcastOutbound`). The server cannot compare cookies across tabs (its `cookies()` is the request snapshot), which is why the cross-tab lock, not compare-and-clear, prevents clearing a session another tab just rotated. Server Action refreshes take no lock and send no event.`

### DOC-3 — L58 — FRAGMENT (logout flow bullet)
old: `Other tabs: `useAuthLogoutTabSync` -> `mutateMe()` + `window.location.reload()`.`
new: `Other tabs: `useAuthLogoutTabSync` -> `mutateMe()` + `window.location.reload()`, for any `reason`; the same listener serves the dead-session broadcast (`reason: "session_expired"`, see the "Dead session" rule above).`

### DOC-4 — L61-71 — REPLACE (refresh decision diagram)
CURRENT:
```
401/403 eligible? -- no --> reportApiError -> throw ApiHttpError
  |yes
  already retried? -- yes --> report + throw
  server writable  -> rawPostRefreshUpstream -> setAuthSessionCookies -> retry once
  server read-only -> throw ApiRefreshRequiredError (no report)
  browser          -> single-flight POST /api/auth/refresh -> retry once with rotated token
  failure          -> throw original ApiHttpError with sanitized cause + report
```
REPLACEMENT:
```
401/403 eligible? -- no --> reportApiError -> throw ApiHttpError
  |yes
  already retried? -- yes --> report + throw
  server writable  -> rawPostRefreshUpstream -> setAuthSessionCookies -> retry once
  server read-only -> throw ApiRefreshRequiredError (no report)
  browser          -> Web Lock mycourse:auth-refresh -> single-flight POST /api/auth/refresh -> retry once with rotated token
  failure, BE 401/403 -> clearAuthSessionCookies (proxy, or clearSession on server writable)
                         browser: body session_cleared -> broadcast logout "session_expired" once
  failure, anything else (400/429/5xx/timeout/network/parse) -> cookies kept
  then             -> throw original ApiHttpError with sanitized cause + report
```

### DOC-5 — L79 — FRAGMENT (Code line)
old: `` `src/app/api/auth/refresh/route.ts`, ``
new: `` `src/app/api/auth/refresh/route.ts` (thin `POST`), `src/api/auth/refresh-proxy.ts` (`handleRefreshProxy`), ``

### DOC-6 — L85 — FRAGMENT (Gotchas, end of line)
old: `` `useGetMe` cache can keep a stale avatar after cookies clear (known, pre-existing).``
new: `` `useGetMe` cache can keep a stale avatar after cookies clear (known, pre-existing); a dead session is noticed only when a request triggers a refresh, the tab that noticed keeps its `/home` prompt until it reloads (it does not receive its own broadcast), and Server Action refreshes take neither the lock nor the broadcast (known gap, with the BE `rotateSession` race as follow-up).``

## `docs/FEATURES.md` — entry `## home-and-catalog`

### DOC-7 — L94 — FRAGMENT (`/home` bullet)
old: `only a visitor with stale cookies sees the CTA `<Link href={loginHref(signedInHomeHref)}>` to `/login?next=/home`;`
new: `only a visitor with stale cookies sees the CTA `<Link href={loginHref(signedInHomeHref)}>` to `/login?next=/home` (the failed refresh that revealed the dead session also removes the stale cookies, see `auth`, so the page keeps its prompt until the visitor reloads or navigates and the next request for `/{locale}` is served the public home);`

### DOC-8 — L116 — FRAGMENT (Gotchas)
old: `a stale cookie must never redirect `/home` back to `/` (loop);`
new: `a stale cookie must never redirect `/home` back to `/` (loop; the page does not clear cookies, the failed refresh does);`

## `docs/FEATURES.md` — entry `## realtime-streams`

### DOC-9 — L393 — FRAGMENT (allowed types)
old: `` `broadcast` = `logout` (`{ reason?: string }`), ``
new: `` `broadcast` = `logout` (`{ reason?: string }`; senders use `BROADCAST_LOGOUT_REASON`: `user` for an explicit logout, `session_expired` after a refresh the BE rejected with `401`/`403`), ``

### DOC-10 — L397 — FRAGMENT (sending)
old: `broadcast via `useSendBroadcastOutbound()` / `postBroadcastOutbound()` (used for logout sync and cross-tab confirm).`
new: `broadcast via `useSendBroadcastOutbound()` (React) or `sendBroadcastOutbound()` (`src/events/broadcast/send-broadcast-outbound.ts`, the single owner of the "attach metadata and post" step, also used by the browser API transport wiring) / `postBroadcastOutbound()` (used for logout sync, session-expired sync and cross-tab confirm).`

### DOC-11 — L422 — REPLACE (cross-tab logout paragraph; the old text also claimed `clearAuthCookiesClient`, which the listener does not call and which is a deprecated no-op)
CURRENT: `Cross-tab logout: the tab at `/{locale}/logout` runs `logoutAction`, then broadcasts `{ type: "logout", payload: { reason: "user" } }`; `AuthLogoutTabSync` in other tabs runs `clearAuthCookiesClient`, `mutateMe()` and `window.location.reload()`.`
REPLACEMENT: `Cross-tab logout: two senders publish `{ type: "logout", payload: { reason } }`: the tab at `/{locale}/logout` after `logoutAction` succeeds (`reason: "user"`), and the browser refresh path when the refresh proxy reports `session_cleared` (`reason: "session_expired"`, once per refresh outcome, never for transient failures). `AuthLogoutTabSync` in the other tabs runs `mutateMe()` and `window.location.reload()` for any reason; the sending tab is not notified because a `BroadcastChannel` does not deliver to the instance that posted.`

### DOC-12 — L428 — FRAGMENT (Code line)
old: `` `outbound-metadata.ts`, `join-url.ts`, transports) ``
new: `` `outbound-metadata.ts`, `join-url.ts`, `broadcast/send-broadcast-outbound.ts`, transports) ``

## `docs/SHARED.md`

### DOC-13 — after L157 — INSERT (new row, `## Utility Functions`, directly below `setAuthSessionCookies`)
`| `clearAuthSessionCookies(): Promise<void>` | Server-only utility function | `src/lib/utils/auth-session.ts` — **not** re-exported from `@/lib/utils`. | The only remover of the session cookies (`access_token`, `refresh_token`, `session_id`, `auth_session_expires_at`, legacy `auth_session_max_age`). Callers: `logoutAction`, the failure cleanup inside `setAuthSessionCookies`, the refresh proxy and the server-writable transport through `createClearSessionFromRequest`. Import: `import { clearAuthSessionCookies } from "@/lib/utils/auth-session";` |`

### DOC-14 — L206 — REPLACE (split `refreshBrowserSession` out of the reporter row)
CURRENT begins: `| `reportApiError` (file-private), `refreshBrowserSession` |  | `src/api/transport/api-transport.ts`, `src/api/auth/browser-auth.ts` | Reporter classifies expected vs logged failures.`
FRAGMENT old: `| `reportApiError` (file-private), `refreshBrowserSession` |  | `src/api/transport/api-transport.ts`, `src/api/auth/browser-auth.ts` |`
FRAGMENT new: `| `reportApiError` (file-private) | Reporter | `src/api/transport/api-transport.ts` |`
INSERT after that row: `| `refreshBrowserSession(onSessionCleared?)`, `createBrowserProxyRuntimeAdapter(options?)` | Browser refresh single-flight + adapter | `src/api/auth/browser-auth.ts` | One module-scoped in-flight promise per tab; its request runs under the cross-tab Web Lock `mycourse:auth-refresh` (`navigator.locks`, unlocked fallback). On a proxy answer carrying `session_cleared` the failure result has `sessionCleared: true` and `onSessionCleared` is called once for all waiters (best effort, exceptions swallowed). |`

### DOC-15 — L209 — FRAGMENT (`apiTransport` row)
old: `Refresh failure attaches a sanitized cause; browser refresh uses absolute same-origin `/api/auth/refresh`.`
new: `Refresh failure attaches a sanitized cause; browser refresh uses absolute same-origin `/api/auth/refresh`. A server-writable refresh the BE rejected with `401`/`403` clears the session through the optional `clearSession` runtime callback; `createBrowserApiTransport(pushApiError, onSessionCleared?)` forwards the browser callback.`

### DOC-16 — after the `apiTransport` row (L209) — INSERT (new rows)
`| `isDeadSessionRefreshStatus(status)`, `isSessionClearedRefreshResponse(data)` | Refresh decision helpers | `src/api/auth/auth-refresh.ts` | Isomorphic. First is `true` only for HTTP `401`/`403` (the single definition of "refresh rejection proves a dead session", used by the proxy and by `attemptRefresh`). Second reads the `session_cleared` marker of the proxy error body. Reuse both; never compare statuses inline. |`
`| `handleRefreshProxy(deps)`, `RefreshProxyDeps` | Browser refresh proxy handler | `src/api/auth/refresh-proxy.ts` | Body of `POST /api/auth/refresh` with injected cookie reader/persister/clearer so it is testable without a Next request scope; clears on BE `401`/`403` and adds `session_cleared: true`. Real deps: `readAuthCookiesFromRequest`, `createPersistRotatedSessionFromRequest`, `createClearSessionFromRequest`. |`
`| `createClearSessionFromRequest()` | Server-only factory | `src/api/auth/server-auth.ts` | Returns a `ClearAuthSessionFn` (dynamic import of `clearAuthSessionCookies`); wired into `createWritableServerApiTransportFromRequest` and the refresh route. |`
`| `ApiRefreshValidationError.upstreamStatus` | Error field | `src/api/core/fetch-error.ts` | Optional HTTP status of the upstream refresh response; deliberately not copied into `sanitizeApiErrorCause`. |`

### DOC-17 — L238 — FRAGMENT (constants row)
old: `` | `STREAM_ENV_KEYS`, `STREAM_EVENTS_LOG_MAX` | Constant | `src/constants/events/index.ts` | Env key names for stream URLs; max events in Zustand log (100). | ``
new: `` | `STREAM_ENV_KEYS`, `STREAM_EVENTS_LOG_MAX`, `BROADCAST_LOGOUT_REASON` | Constant | `src/constants/events/index.ts` | Env key names for stream URLs; max events in Zustand log (100); `reason` values of the broadcast `logout` event (`user`, `session_expired`). | ``

### DOC-18 — L247 — FRAGMENT + INSERT (broadcast sender rows)
old: `` | `useSendBroadcastOutbound()` | Hook | `src/hooks/events/broadcast/use-send-broadcast-outbound.ts` | Send `BroadcastOutboundEvent` with auto metadata. | ``
new: `` | `useSendBroadcastOutbound()` | Hook | `src/hooks/events/broadcast/use-send-broadcast-outbound.ts` | Stable React callback over `sendBroadcastOutbound`. | ``
INSERT after it: `| `sendBroadcastOutbound(message)`, `BroadcastOutboundSendInput` | Function + type | `src/events/broadcast/send-broadcast-outbound.ts` | Send a `BroadcastOutboundEvent` with auto metadata (`seq` + `timestamp`); usable outside React (used by `browser-api-methods.ts`). No-op on the server. |`

## `docs/architecture.md` — `## Key Design Decisions`

### DOC-19 — L148 (decision 2) — FRAGMENT
old: `After silent refresh the BFF proxy and server writable refresh rewrite cookies through `setAuthSessionCookies` with BE `Set-Cookie` Max-Age (fallback `auth_session_expires_at`);`
new: `After silent refresh the BFF proxy and server writable refresh rewrite cookies through `setAuthSessionCookies` with BE `Set-Cookie` Max-Age (fallback `auth_session_expires_at`); when the BE rejects the refresh with `401`/`403` the same two paths remove all session cookies through `clearAuthSessionCookies`, so a dead session cannot keep pinning the presence-based proxy redirect (other failures keep the cookies);`

### DOC-20 — L150 (decision 4) — three FRAGMENTS
1. old: `4. **Token refresh mutex (client only).**` new: `4. **Token refresh mutex (per tab and across tabs).**`
2. old: `share one module-scoped refresh promise (`refreshBrowserSession`);` new: `share one module-scoped refresh promise (`refreshBrowserSession`) whose request runs under a cross-tab Web Lock (`navigator.locks`, name `mycourse:auth-refresh`; released when the refresh settles; unlocked fallback when the API is missing) so two tabs of one browser never rotate the same refresh token at once;`
3. old: `server writable requests are request-scoped and do not use single-flight;` new: `server writable requests are request-scoped and use neither single-flight nor the lock;`

## `docs/pages.md` — `## Middleware: locale enforcement and home redirects`

### DOC-21 — after L33 ("No loop" bullet) — INSERT
`- **Dead session:** the presence check cannot tell a live cookie pair from a dead one. When the BE rejects a refresh with `401`/`403`, `POST /api/auth/refresh` (or the Server Action that refreshed) removes the cookies, so the next request for `/{locale}` is served the public home instead of being redirected. `src/proxy.ts` and the two redirect rules above are unchanged.`

## `docs/testing.md`

Counts below are the expected totals (existing cases + cases added in `code-change-inventory.md` section 4); replace with the actual Jest/Playwright output at task 9.5 if it differs.

### DOC-22 — L77 (Stage 1 `auth-refresh` row) — two FRAGMENTS
1. old: `` `parseExactBrowserRefreshProxySuccess`) `` new: `` `parseExactBrowserRefreshProxySuccess`, `isDeadSessionRefreshStatus`, `isSessionClearedRefreshResponse`) ``
2. old: `extra keys | ✅ Passing (34 cases) |` new: `extra keys, dead-session status table (401/403 only), session-cleared marker guard | ✅ Passing (50 cases) |`

### DOC-23 — L85 (Stage 2 `browser-auth` row) — FRAGMENT
old: `single-flight coordination across concurrent callers, a new request once the previous one has settled | ✅ Passing (5 cases) |`
new: `single-flight coordination across concurrent callers, a new request once the previous one has settled, `sessionCleared` flag from the proxy marker, one `onSessionCleared` call for concurrent callers, cross-tab Web Lock acquire/serialise/release-on-rejection and unlocked fallback | ✅ Passing (15 cases) |`

### DOC-24 — L86 (Stage 2 retry row) — FRAGMENT
old: `never attempts a refresh for a non-401/403 error | ✅ Passing (3 cases) |`
new: `never attempts a refresh for a non-401/403 error; calls the session-cleared callback once on a marked 401 and never on a 500 or a successful retry | ✅ Passing (6 cases) |`

### DOC-25 — after L86 — INSERT (new Stage 2 rows)
`| `src/api/auth/refresh-proxy.ts` (`handleRefreshProxy`) — injected cookie collaborators, MSW upstream | `src/api/auth/refresh-proxy.test.ts` | success, missing credentials, malformed envelope/tokens (502), persist failure (500), upstream 4xx/5xx passthrough with allowlisted code and fixed message, network error (502), timeout (504); BE 401/403 clear once and add `session_cleared`; 400/429/5xx/network/timeout/missing credentials never clear; a failing clear returns the upstream status without the marker | ✅ Passing (<count from run>) |`
`| `src/api/transport/api-transport.ts` `attemptRefresh` server-writable branch — plain-object runtime | `src/api/transport/api-transport-refresh.test.ts` | `upstreamStatus` 401/403 clear once and rethrow the original error; 500/undefined do not; a throwing or missing `clearSession` still rethrows the original error | ✅ Passing (<count from run>) |`
(The two `<count from run>` markers are replaced by the Jest summary at task 9.5; they must not be committed.)

### DOC-26 — L95 (Jest-level boundary paragraph) — FRAGMENT
old: `and `src/app/api/auth/refresh/route.ts` reads/writes cookies the same way.`
new: `and `src/app/api/auth/refresh/route.ts` reads/writes cookies the same way (its handling now lives in `handleRefreshProxy`, which Jest covers through injected cookie collaborators; the route file itself stays covered by Stage 3 only).`

### DOC-27 — after the `normalize-inbound` row (L104) — INSERT (Stage 3 matrix)
`| `src/events/broadcast/send-broadcast-outbound.ts` (`sendBroadcastOutbound`) — real `BroadcastChannel` in jsdom | `src/events/broadcast/send-broadcast-outbound.test.ts` | `logout` with `session_expired` reaches a second channel with `seq`/`timestamp`, explicit metadata preserved, `confirm_success` posted | ✅ Passing (<count from run>) |`

### DOC-28 — L105 (browser journeys row) — two FRAGMENTS
1. old: `auth (login/logout/expired-session/forbidden)` new: `auth (login/logout/expired-session/revoked-session cookie cleanup and public-home recovery/forbidden)`
2. old: `✅ Passing (27 cases, real Chromium + real Next server)` new: `✅ Passing (28 cases, real Chromium + real Next server)`

## `docs/deploy.md` — Appendix H

### DOC-29 — after L943 (`### Auth tokens expire and the app does not recover`) — INSERT paragraph
`A refresh the backend rejects with `401`/`403` (session revoked, user disabled or banned, refresh token expired) is expected to remove the `refresh_token`, `session_id`, `access_token`, `auth_session_expires_at` cookies in the same response; after it, `/{locale}` serves the public home again. If the cookies stay after a rejected refresh check that `POST /api/auth/refresh` returns `401`/`403` with `session_cleared: true` in the body and `Set-Cookie` deletions, and that `AUTH_COOKIE_DOMAIN` equals the BE value (a mismatching domain cannot delete the cookie). `5xx`, timeout and network failures keep the cookies on purpose.`

## `README.md`

### DOC-30 — L279 (Auth Flow overview, "Automatic token refresh") — FRAGMENT
old: `Readonly RSC fails closed with `ApiRefreshRequiredError`.`
new: `Readonly RSC fails closed with `ApiRefreshRequiredError`. A backend `401`/`403` on refresh clears the session cookies (proxy and writable server path); every other failure keeps them.`

### DOC-31 — `## Token Refresh` > `### How it works` diagram — two FRAGMENTS
1. old: `  │     Browser: POST /api/auth/refresh (single-flight promise)` new: `  │     Browser: POST /api/auth/refresh (single-flight promise, cross-tab Web Lock)`
2. old: `  │     └─ [failure] Report original protected-request error → reject` new: `  │     └─ [failure] Report original protected-request error → reject`
   followed by new line `  │          (BE 401/403 on refresh: session cookies cleared first; other failures keep them)`

### DOC-32 — `### Browser refresh single-flight` — FRAGMENT
old: `BFF `POST /api/auth/refresh` maps upstream timeout to **504** (`instanceof ApiTimeoutError`) and other network failures to **502**.`
new: `BFF `POST /api/auth/refresh` maps upstream timeout to **504** (`instanceof ApiTimeoutError`) and other network failures to **502**. The POST runs under the Web Lock `mycourse:auth-refresh` (`navigator.locks`) so tabs of one browser refresh one at a time; browsers without the API refresh unlocked. When the BE answered `401`/`403` the proxy removes the session cookies and adds `session_cleared: true` to its error body, which makes the tab broadcast `logout` with reason `session_expired` once.`

### DOC-33 — `### Production refresh ownership` — FRAGMENT
old: `then persists via `setAuthSessionCookies`.`
new: `then persists via `setAuthSessionCookies`; on a backend `401`/`403` it clears the session cookies instead (`handleRefreshProxy` for the browser path, the `clearSession` runtime callback for the writable server path).`

## `docs/ALL-SPRINTS.md` (history log; exempt from the replacement rule)

### DOC-34 — `## In progress` table — INSERT row when apply starts
`| Clear stale auth session cookies when a refresh is rejected (cross-tab refresh lock, `session_expired` logout broadcast) | agent | `fix-stale-auth-session-cookies` |`

### DOC-35 — `## To do` table — INSERT candidate rows (follow-ups of this change)
`| Backend `rotateSession` compare-and-swap | developer | Candidate. `RefreshSession` reads, checks and then overwrites the session UUID without a conditional update, so two overlapping refreshes with the same refresh token can leave cookie and stored UUID different (`be-mycourse`) |`
`| Lock and `session_expired` broadcast for Server Action refreshes | unassigned | Candidate. The cross-tab lock and the broadcast exist for the browser path only |`
`| Why the guest home `/{locale}` is dynamic (`ƒ`) and how to cache it | unassigned | Candidate. Baseline build: every route `ƒ`; suspects: `getLocale()` in the root layout, no `generateStaticParams`/`setRequestLocale`, `await params`; `SEO_TEMPORARY_ENV_CACHE_POLICY` stays disabled until then |`
`| Align doc file names in the `AGENTS.md` documentation map with git (`docs/architecture.md`, `docs/pages.md`) | developer | Candidate |`

### DOC-36 — at archive — MOVE row
Move DOC-34's row to `## Done` as `| 2026-10-25 | Stale session cookie cleanup | A refresh the BE rejects with 401/403 clears the session cookies; cross-tab refresh lock; `session_expired` logout broadcast | `<archive folder name>` |` (date = this change's creation date).

---

## Scanned, no change needed (with reason)

| File | Why unchanged |
|---|---|
| `docs/quality.md`, `docs/docker.md`, `docs/course-collaboration-handoff-2026-06-04.md` | refresh/cookie mentions are Fetch/Xior migration notes, runtime env vars or dated history |
| `docs/FEATURES.md` `## auth` rules at L18-20 (cookie names, options, credentials) | still true; the clearer already existed |
| `docs/FEATURES.md` L60 (signed-in redirect), `## home-and-catalog` L93 (presence-only proxy) | still true; proxy untouched |
| `docs/SHARED.md` L332 (`providers/`, `AuthLogoutTabSync`) | listener behaviour unchanged |
| `docs/pages.md` L29-32 | redirect rules unchanged |
| `AGENTS.md`, `CLAUDE.md`, `.ai/skills/**`, `.claude/skills/**`, `.cursor/**` | workflow rules, no description of this behaviour |
| `openspec/specs/signed-in-home/spec.md` | Phase 1: the stale-cookie scenario stayed true. Phase 2 changes it: the login-gate requirement is MODIFIED by this change's delta `specs/signed-in-home/spec.md`, synced at archive, not edited by hand |
| `openspec/specs/{auth-route-modal,public-home-seo,crawl-discovery,course-detail-placeholder,taxonomy-slug-management}/spec.md` | "refresh" there means page reload or list refresh, or unaffected SEO behaviour |
| `openspec/changes/archive/**` | history |
| `openspec/specs/signed-in-home-entry/spec.md`, `openspec/specs/frontend-regression-coverage/spec.md`, `openspec/specs/signed-in-home/spec.md`, `openspec/specs/dashboard-access-control/spec.md`, new `openspec/specs/auth-session-recovery/spec.md`, ADDED requirements of `openspec/specs/frontend-error-handling/spec.md` | updated by archive/sync of this change's delta specs |
| `README.md`, `docs/deploy.md` (Phase 2) | grep for `/me`, `unauthorized`, `sign-in prompt`, `Login required` finds no description of the guest/outage behaviour there |
| `docs/FEATURES.md` `## seo-web`, `## course-editor`, `## media` (Phase 2) | they mention `StatusErrorPage` or `/me` only in unrelated flows (course editor forbidden variant, avatar PATCH) |

Verification after editing (task 9.7; Phase 2: task 14.5): `grep -n "session_cleared\|mycourse:auth-refresh\|session_expired\|clearAuthSessionCookies" docs/*.md README.md` shows the expected hits only; every path and symbol named in an edited line exists (`rg`/`test -e` script); no `<count from run>` marker remains; no entry keeps an old claim next to the new one (re-read each edited entry).

---

## Phase 2 documentation items (DOC-37..DOC-67)

Same conventions as above (FRAGMENT / INSERT). Final-state facts every Phase 2 replacement must state (single source: `design.md` D10-D16): a `/me` lookup failing with a backend failure, a timeout, no connection or a `401` whose browser refresh could not conclude is an outage, not a guest (`ApiSessionUnverifiedError`, `useMeOutage`, `MeOutagePage`); the cookies are never cleared for it and the login modal is never opened for it; it is visible only when no user is cached; 403 and 404 keep their guest-like handling; dashboards, `/home` and `become-instructor` show the shared `unauthorized` state to a guest (same copy as before) and `MeOutagePage` to an outage; header chrome, sidebar footer, Google One Tap and the become-instructor banner are unchanged (follow-up); Server Action refreshes are unchanged; `src/proxy.ts` and caching are unchanged. The e2e count (48) and the Jest counts in DOC-56..DOC-65 are the counts of the checked copy and must be replaced by the real counts of tasks 14.1 and 14.3.

### `docs/FEATURES.md` (Phase 2)

#### DOC-37 — FRAGMENT

CURRENT (occurs exactly once):

```text
`getMeService` returns `null` on `401` (guest, not an error) and throws otherwise.
```

REPLACEMENT:

```text
`getMeService` returns `null` on a plain `401` (guest, not an error) and throws otherwise, including `ApiSessionUnverifiedError` (a `401` whose browser refresh could not conclude: proxy 429/5xx, timeout or no connection; an `ApiHttpError` with status 401 carrying `outage: "network" | "server-error"`, built by `buildHttpError` from the `outage` that `attemptRefresh` reads off `BrowserRefreshResult`). `useMeOutage()` (`src/hooks/auth/use-me-outage.ts`) turns a stored `isError` into `{ variant: "server-error" | "network", retry: mutateMe }` only when there is no cached `me`, the lookup is not loading and `classifyApiError` returns `server-error` or `network`; 403 and 404 stay guest-like.
```

#### DOC-38 — FRAGMENT

CURRENT (occurs exactly once):

```text
and Server Action refreshes take neither the lock nor the broadcast (known gap, with the BE `rotateSession` race as follow-up).
```

REPLACEMENT:

```text
and Server Action refreshes take neither the lock nor the broadcast (known gap, with the BE `rotateSession` race as follow-up). A `/me` outage (5xx, timeout, no connection, or a refresh that cannot conclude) never clears cookies and never opens the login modal; it shows only when no cached user exists (a new tab or a first load), because SWR keeps the previous user and `meCacheProvider` restores the persisted one on a hard navigation. The header chrome, the sidebar footer, Google One Tap and the become-instructor banner still look signed out during an outage (follow-up in `ALL-SPRINTS.md`).
```

#### DOC-39 — FRAGMENT

CURRENT (occurs exactly once):

```text
only a visitor with stale cookies sees the CTA `<Link href={loginHref(signedInHomeHref)}>` to `/login?next=/home`
```

REPLACEMENT:

```text
only a visitor with stale cookies sees the shared `StatusErrorPage` `unauthorized` state (title and description from `home.signedIn.loginRequired.*`, CTA to `/login?next=/home`)
```

#### DOC-40 — FRAGMENT

CURRENT (occurs exactly once):

```text
no home request is made without a session; it never redirects back to `/` (prevents loops).
```

REPLACEMENT:

```text
when `/me` failed with a backend failure, timeout or no connection and no user is cached (`useMeOutage()`), it shows `MeOutagePage` (`server-error`/`network` plus a retry that revalidates `/me`) instead of the sign-in state; no home request is made without a session or during an outage; it never redirects back to `/` (prevents loops).
```

#### DOC-41 — FRAGMENT

CURRENT (occurs exactly once):

```text
Unauthenticated overrides everything; approved overrides a high rejection count.
```

REPLACEMENT:

```text
Unauthenticated overrides everything; approved overrides a high rejection count. State A renders the shared `StatusErrorPage` `unauthorized` state (`stateA.*` copy, CTA to `/login?next=/become-instructor`), not a `StateCard`; when `useMeOutage()` is set the page shows `MeOutagePage` instead (the page state stays `unauthenticated` because `me` is `null`). `StateCard` remains for states B and G.
```

#### DOC-42 — FRAGMENT

CURRENT (occurs exactly once):

```text
variant `forbidden` when `useGetMe().me` is set, `unauthorized` otherwise. On `unauthorized`,
```

REPLACEMENT:

```text
variant `forbidden` when `useGetMe().me` is set, `unauthorized` otherwise, and `MeOutagePage` (`server-error`/`network` plus a retry) when `useMeOutage()` is set, because the session is then unknown rather than absent. On `unauthorized`,
```

#### DOC-43 — FRAGMENT

CURRENT (occurs exactly once):

```text
`LoginSignupPopup` is not mounted inside `DashboardLayout`.
```

REPLACEMENT:

```text
`LoginSignupPopup` is not mounted inside `DashboardLayout`. The outage state never auto-prompts (`isUnauthorized` excludes it).
```

#### DOC-44 — FRAGMENT

CURRENT (occurs exactly once):

```text
a 404 is not a variant.
```

REPLACEMENT:

```text
a 404 is not a variant. `classifyApiError` first maps `ApiSessionUnverifiedError` (a 401 whose refresh could not conclude) to its `outage`, then uses the status table.
```

#### DOC-45 — FRAGMENT

CURRENT (occurs exactly once):

```text
`src/app/[locale]/error.tsx` (segment render-error boundary with its own generic copy).
```

REPLACEMENT:

```text
`src/app/[locale]/error.tsx` (segment render-error boundary with its own generic copy), `useMeOutage` (current-user outage) and the sign-in gates of `/home` and `become-instructor` (`unauthorized` variant with their own title, description and CTA). `MeOutagePage` (`src/components/shared/me-outage-page.tsx`) wraps `StatusErrorPage` with the `errors.boundary.retry` label and `mutateMe`; dashboards, `/home` and `become-instructor` use it.
```


### `docs/SHARED.md` (Phase 2)

#### DOC-46 — FRAGMENT

CURRENT (occurs exactly once):

```text
Returns `null` for 401 (unauthenticated) without throwing.
```

REPLACEMENT:

```text
Returns `null` for a plain 401 (unauthenticated) without throwing; a 401 whose refresh could not conclude (`ApiSessionUnverifiedError`), a 5xx, a timeout and a network failure surface as `error`.
```

#### DOC-47 — INSERT after the row/line that starts with `| `useGetMe(): MeStoreState` |`

Anchor (occurs exactly once):

```text
| `useGetMe(): MeStoreState` | Custom hook (Zustand selector) | `src/hooks/auth/use-auth-store.ts` | Read the current user from `useMeStore` with a shallow-equal selector. Returns `{ me, isLoading, isError, mePermissions, mutateMe }`. |
```

NEW row(s), added directly below the anchor:

```text
| `useMeOutage(): MeOutage` (or `null`) | Custom hook | `src/hooks/auth/use-me-outage.ts` (barrel: `@/hooks/auth`) | Derived from `useGetMe()` + `classifyApiError`: `{ variant: "server-error" or "network", retry }` when `/me` failed for an outage and no user is cached, else `null` (403, 404 and other errors stay `null`). Reuse: gate any signed-in-only screen with it before showing a sign-in prompt and render `MeOutagePage`. |
```

#### DOC-48 — FRAGMENT

CURRENT (occurs exactly once):

```text
`GET /api/v1/me` returns `null` on 401;
```

REPLACEMENT:

```text
`GET /api/v1/me` returns `null` on a plain 401 and rethrows `ApiSessionUnverifiedError` and every other error;
```

#### DOC-49 — INSERT after the row/line that starts with `| `isDeadSessionRefreshStatus(status)`, `isSessionClearedRefreshResponse(data)` |`

Anchor (occurs exactly once):

```text
| `isDeadSessionRefreshStatus(status)`, `isSessionClearedRefreshResponse(data)` | Refresh decision helpers | `src/api/auth/auth-refresh.ts` | Isomorphic. First is `true` only for HTTP `401`/`403` (the single definition of "refresh rejection proves a dead session", used by the proxy and by `attemptRefresh`). Second reads the `session_cleared` marker of the proxy error body. Reuse both; never compare statuses inline. |
```

NEW row(s), added directly below the anchor:

```text
| `isTransientRefreshStatus(status)` | Refresh decision helper | `src/api/auth/auth-refresh.ts` | Isomorphic. `true` for HTTP `429` and `500`-`599`: the refresh did not conclude about the session. Disjoint from `isDeadSessionRefreshStatus`. Used by `performBrowserRefresh` to set `outage`. |
| `ApiSessionUnverifiedError`, `ApiRefreshOutage` | Error subclass + type | `src/api/core/fetch-error.ts` | An `ApiHttpError` (status 401) whose refresh could not conclude, carrying `outage: "network" or "server-error"`. Every `isApiHttpError` / `status === 401` check still matches; `getMeService` rethrows it and `classifyApiError` maps it to its outage. |
```

#### DOC-50 — INSERT after the row/line that starts with `| `StatusErrorPage` | See `dashboards-and-access` |`

Anchor (occurs exactly once):

```text
| `StatusErrorPage` | See `dashboards-and-access` |
```

NEW row(s), added directly below the anchor:

```text
| `MeOutagePage` | See `dashboards-and-access` |
```


### `docs/architecture.md` (Phase 2)

#### DOC-51 — FRAGMENT

CURRENT (occurs exactly once):

```text
(details in `auth`). `useMyInstructorApplication` deliberately
```

REPLACEMENT:

```text
(details in `auth`). A failed `/me` (5xx, timeout, no connection, or a `401` whose refresh could not conclude) is an error, not a guest: `useMeOutage()` exposes it and gated screens render `MeOutagePage` instead of the sign-in state. `useMyInstructorApplication` deliberately
```


### `docs/pages.md` (Phase 2)

#### DOC-52 — FRAGMENT

CURRENT (occurs exactly once):

```text
which keeps its client-side sign-in prompt and never redirects back to `/`.
```

REPLACEMENT:

```text
which shows the shared `unauthorized` sign-in state (or a retryable `server-error`/`network` state while `/me` is failing) and never redirects back to `/`.
```

#### DOC-53 — FRAGMENT

CURRENT (occurs exactly once):

```text
`SignedInHomePage`, login-gated, `noindex,nofollow` |
```

REPLACEMENT:

```text
`SignedInHomePage`, login-gated (`StatusErrorPage` `unauthorized`; `MeOutagePage` on a `/me` outage), `noindex,nofollow` |
```

#### DOC-54 — FRAGMENT

CURRENT (occurs exactly once):

```text
`BecomeInstructorPage` (states A-H; see `instructor-application`) |
```

REPLACEMENT:

```text
`BecomeInstructorPage` (states A-H; state A is the shared `unauthorized` state, a `/me` outage shows `MeOutagePage`; see `instructor-application`) |
```

#### DOC-55 — FRAGMENT

CURRENT (occurs exactly once):

```text
(once per denied path per page load) |
```

REPLACEMENT:

```text
(once per denied path per page load; never during a `/me` outage, which renders `MeOutagePage`) |
```


### `docs/testing.md` (Phase 2)

#### DOC-56 — FRAGMENT

CURRENT (occurs exactly once):

```text
loading, sign-in prompt (reachable only with stale cookies) without any data request, signed-in sections, `course:read` gating
```

REPLACEMENT:

```text
loading, sign-in prompt (shared `unauthorized` state, reachable only with stale cookies) without any data request, retryable `server-error` state on a `/me` outage (retry calls `mutateMe`, no data request), signed-in sections, `course:read` gating
```

#### DOC-57 — FRAGMENT

CURRENT (occurs exactly once):

```text
✅ Passing (4 + 1 cases) |
```

REPLACEMENT:

```text
✅ Passing (5 + 1 cases) |
```

#### DOC-58 — FRAGMENT

CURRENT (occurs exactly once):

```text
`isDeadSessionRefreshStatus`, `isSessionClearedRefreshResponse`) |
```

REPLACEMENT:

```text
`isDeadSessionRefreshStatus`, `isSessionClearedRefreshResponse`, `isTransientRefreshStatus`) |
```

#### DOC-59 — FRAGMENT

CURRENT (occurs exactly once):

```text
session-cleared marker guard | ✅ Passing (50 cases) |
```

REPLACEMENT:

```text
session-cleared marker guard, transient-status table | ✅ Passing (63 cases) |
```

#### DOC-60 — FRAGMENT

CURRENT (occurs exactly once):

```text
cross-tab Web Lock acquire/wait/release-on-rejection and unlocked fallback | ✅ Passing (13 cases) |
```

REPLACEMENT:

```text
cross-tab Web Lock acquire/wait/release-on-rejection and unlocked fallback, `outage` flag (proxy 429/5xx -> `server-error`, network failure -> `network`, 400/401/403 -> none) | ✅ Passing (20 cases) |
```

#### DOC-61 — FRAGMENT

CURRENT (occurs exactly once):

```text
a successful refresh never clears | ✅ Passing (7 cases) |
```

REPLACEMENT:

```text
a successful refresh never clears; a browser-proxy refresh result with an `outage` throws `ApiSessionUnverifiedError` (401), without one the plain 401 | ✅ Passing (10 cases) |
```

#### DOC-62 — FRAGMENT

CURRENT (occurs exactly once):

```text
✅ Passing (17 cases: 8 existing + 9 new)
```

REPLACEMENT:

```text
✅ Passing (20 cases: 8 existing + 9 new + 3 unverified-session)
```

#### DOC-63 — INSERT after the row/line that starts with `| `src/lib/utils/api-error.ts` (`classifyApiError`, `extractApiError`, `extractRecommendedSlug`) |`

Anchor (occurs exactly once):

```text
| `src/lib/utils/api-error.ts` (`classifyApiError`, `extractApiError`, `extractRecommendedSlug`) | `src/lib/utils/api-error.test.ts` | existing classification/extraction cases plus `extractRecommendedSlug`: 3007 recommended slug, legacy response shape, missing/null data, blank or non-string value, other error codes ignored, non-HTTP error | ✅ Passing (17 cases: 8 existing + 9 new) |
```

NEW row(s), added directly below the anchor:

```text
| `getMeService` (`src/api/callers/auth/auth-factory.ts`) | `src/api/callers/auth/auth-factory.test.ts` | plain 401 -> `null`; unverified 401 (network, server-error) and 500 rethrown | ✅ Passing (4 cases) |
| `useMeOutage` (`src/hooks/auth/use-me-outage.ts`) | `src/hooks/auth/use-me-outage.test.tsx` | outage for 500, network failure and unverified 401; retry calls `mutateMe`; `null` for no error, 403, 404, loading and a cached user | ✅ Passing (9 cases) |
| `MeOutagePage` (`src/components/shared/me-outage-page.tsx`) | `src/components/shared/me-outage-page.test.tsx` | `server-error` and `network` copy; retry calls the outage retry | ✅ Passing (2 cases) |
| `DashboardLayout` current-user outage | `src/components/common/dashboard/dashboard-layout.test.tsx` | outage shows the server-error state with a retry and never auto-prompts login; a 404 `/me` error keeps the unauthorized state and the 500 ms prompt | ✅ Passing (8 cases incl. 6 auto-prompt) |
| `/become-instructor` route sign-in gate | `src/app/[locale]/(web)/become-instructor/page.test.tsx` | guest -> shared unauthorized state with sign-in link; outage -> retry instead of the gate (tests live beside the route because `src/screen` only allows page files) | ✅ Passing (2 cases) |
```

#### DOC-64 — FRAGMENT

CURRENT (occurs exactly once):

```text
revoked-session cookie cleanup and public-home recovery/forbidden)
```

REPLACEMENT:

```text
revoked-session cookie cleanup and public-home recovery, backend 500 on `/me` keeps the session and shows the retryable state, forbidden)
```

#### DOC-65 — FRAGMENT

CURRENT (occurs exactly once):

```text
✅ Passing (47 cases, real Chromium + real Next server)
```

REPLACEMENT:

```text
✅ Passing (48 cases, real Chromium + real Next server)
```


### `docs/ALL-SPRINTS.md` (Phase 2)

#### DOC-66 — FRAGMENT

CURRENT (occurs exactly once):

```text
(cross-tab refresh lock, `session_expired` logout broadcast)
```

REPLACEMENT:

```text
(cross-tab refresh lock, `session_expired` logout broadcast, retryable `/me` outage state, shared `unauthorized` sign-in gates)
```

#### DOC-67 — INSERT after the row/line that starts with `| Lock and `session_expired` broadcast for Server Action refreshes |`

Anchor (occurs exactly once):

```text
| Lock and `session_expired` broadcast for Server Action refreshes | unassigned | Candidate. The cross-tab lock and the broadcast exist for the browser path only |
```

NEW row(s), added directly below the anchor:

```text
| Guest-looking chrome during a `/me` outage (header `AuthLayout`, `SidebarAuthFooter`, Google One Tap, `BecomeInstructorPromoBanner`) | unassigned | Candidate. They read only `me`/`isLoading`, so an outage looks signed out there; the outage state exists in `useMeOutage` |
| `buildHttpError` re-sanitises an already sanitised refresh cause | unassigned | Candidate. `attemptRefresh` returns `sanitizeApiErrorCause(error)` and `throwReportedHttp` sanitises it again, turning the cause into `{ kind: "unknown" }` |
| Server Action refresh outage is not marked as an unverified session | unassigned | Candidate. Only the browser-proxy refresh sets `outage`; the `server-writable` branch of `attemptRefresh` keeps the plain 401 |
```
