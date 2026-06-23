# Session Summary — Access Token Recovery (Runtime Fix)

**Date:** 2026-06-23  
**Scope:** `fe-mycourse` fix runtime bug: delete `access_token` + reload multiple times must still refresh successfully, without storing token/session pairs in browser storage.

## Discovery (Phase 1)

- Followed checklist standards:
  - `temporary-docs/tieu-chuan-check-be-fe/fe-mycourse.md`
  - `temporary-docs/tieu-chuan-check-be-fe/be-mycourse.md`
- Read related FE docs/context:
  - `docs/api-using.md`, `docs/flow.md`, `docs/logic-flow.md`
  - `docs/patterns.md`, `docs/reusable-assets.md`, `docs/quality.md`
- Git audit:
  - `git status`, `git log -5`, `git diff`
- GitNexus:
  - `READ gitnexus://repo/fe-mycourse/context`
  - `impact` upstream:
    - `doTokenRefresh` (LOW)
    - `getRefreshSessionPair` (LOW)
    - `createApiInstance` (LOW)
- Blast radius:
  - d=1 mainly inside `createApiInstance` flow; no HIGH/CRITICAL risk.

## Implementation (Phase 2)

### Core fix

- `src/api/instance.ts`
  - Added `CLIENT_REFRESH_PROXY_PATH = "/api/auth/refresh"`.
  - Browser refresh path now calls FE proxy route (`/api/auth/refresh`) instead of calling BE refresh directly.
  - Server refresh path remains direct BE call with explicit `X-Refresh-Token` / `X-Session-Id`.
  - No `sessionStorage` / `localStorage` use for refresh/session pair persistence.

- `src/app/api/auth/refresh/route.ts` (new)
  - Reads `refresh_token` + `session_id` from HttpOnly cookies on Next server.
  - Calls BE `/api/v1/auth/refresh` with explicit refresh headers.
  - On success rewrites rotated auth cookies via `setAuthSessionCookies`.
  - Returns refresh envelope to browser interceptor.

### Docs updated

- `README.md`
- `docs/api-using.md`
- `docs/flow.md`
- `docs/logic-flow.md`

Docs now describe FE-proxy refresh architecture for browser path and direct refresh for server path.

## Quality + Close-out (Phase 3)

### Quality gates

- `npm run test-all` — PASS
- `npm run check-all` — PASS
- `ReadLints` on changed files — no linter errors

### GitNexus close-out

- `npx gitnexus analyze --force` — PASS
- `gitnexus_detect_changes({ scope: "all", repo: "fe-mycourse" })` — completed

### Manual/runtime verification

- Local browser verification via Chrome DevTools MCP:
  - login success on `http://localhost:3000/en`
  - call `POST /api/auth/refresh` repeatedly (3 times) in-page:
    - all responses `200`, `code=0`, with `access_token`, `refresh_token`, `session_id` present
- This validates repeated refresh rotation path without browser token storage.

### Files changed

- `src/api/instance.ts`
- `src/app/api/auth/refresh/route.ts`
- `README.md`
- `docs/api-using.md`
- `docs/flow.md`
- `docs/logic-flow.md`

---

## Follow-up Fix — rememberMe Regression in Proxy Route

**Date:** 2026-06-23 (same session, post-closeout finding)

### Finding

User-reported HIGH finding: proxy route (`src/app/api/auth/refresh/route.ts`) always called
`setAuthSessionCookies({ rememberMe: false })`, downgrading remember-me sessions to session-scoped
cookies after the first silent refresh → user gets logged out on browser close/restart.

### Root-cause

BE (`service_session.go`) persists `RememberMe: bool` in `RefreshSessionEntry` and uses it to
compute `newTTL = RememberMeRefreshTTL` (14-day sliding window) on every rotation. BE sets correct
`Max-Age` on `Set-Cookie` headers in the refresh response. However, the FE proxy route previously
ignored those headers and always called `setAuthSessionCookies({ rememberMe: false })`, which sets
`refreshMaxAge = undefined` → no `Max-Age` → session cookie.

### Fix

**`src/lib/utils/auth-session.ts`**  
Added optional `refreshMaxAge?: number` to `SetAuthSessionCookiesInput`. When provided and > 0, it
takes precedence over the `rememberMe`-derived value. Additive change — all existing callers
(`loginAction`, `confirmAction`, `syncAuthSessionCookiesAction`) unchanged.

**`src/app/api/auth/refresh/route.ts`**  
Replaced `rawPost` with direct `axios.post` call to access raw `Set-Cookie` response headers.
Added `parseMaxAgeForCookie` helper to extract `Max-Age` for the `refresh_token` cookie.
Passes the parsed `refreshMaxAge` to `setAuthSessionCookies`, so FE cookies exactly mirror the
TTL computed by BE.

Behaviour after fix:
- remember-me user → BE sets `Max-Age=1209600` (14 days) on rotation → FE proxy forwards same
  Max-Age → cookie persists across browser restarts ✅
- non-remember-me user → BE sets `Max-Age` = remaining lifetime → FE proxy forwards same value ✅

### Impact analysis (GitNexus)

- `setAuthSessionCookies` — HIGH, 4 d=1 callers. All verified unchanged (additive field).
- `gitnexus_detect_changes({ scope: "all" })` — changed symbols match expected scope.

### Quality gates

- `npm run test-all` — PASS
- `npm run check-all` (includes TypeScript build) — PASS
- `ReadLints` on changed files — no linter errors

### Note — pre-existing issue (out-of-scope)

`syncAuthSessionCookiesAction` (used by the SSR interceptor path) still passes `rememberMe: false`.
That path also has the same Max-Age downgrade for SSR-initiated refreshes. This is a pre-existing
issue introduced before this PR, separate task required to fix.

---

## Follow-up Fix 2 — REMEMBER_ME_MAX_AGE inconsistency

**Date:** 2026-06-23 (same session)

### Finding (Medium)

`REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60` (30 ngày) trong `auth-session.ts` không khớp với
`RememberMeRefreshTTL = 14 * 24 * time.Hour` (14 ngày) của BE. Sau ngày 14, BE session đã expired
nhưng browser vẫn còn cookie sống → app cứ thử silent refresh → 401 → UX tệ.

### Fix

Đổi `REMEMBER_ME_MAX_AGE` từ 30 ngày thành 14 ngày, khớp BE `domain.RememberMeRefreshTTL`.

```typescript
// src/lib/utils/auth-session.ts
export const REMEMBER_ME_MAX_AGE = 14 * 24 * 60 * 60; // was 30 days
```

Caller duy nhất bị thay đổi hành vi: `loginAction({ remember_me: true })` — đúng ý định.
Proxy route POST (dùng `refreshMaxAge` explicit từ BE) — không bị ảnh hưởng.

### Trạng thái TTL nhất quán sau toàn bộ 3 fix

| Path | Trước | Sau |
|---|---|---|
| Login (remember me) | FE cookie 30 days, BE session 14 days | FE cookie 14 days, BE session 14 days ✅ |
| Silent refresh proxy | FE cookie no Max-Age (session cookie) | FE cookie = BE Max-Age (14 days sliding) ✅ |
| Login (no remember me) | FE cookie session, BE session 30 days | FE cookie session, BE session 30 days (intentional) ✅ |

### Quality gates

- `npm run check-all` — PASS
