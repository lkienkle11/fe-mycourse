# GitNexus Research — HttpOnly Auth Cookies (FE-02 / FE-04)

**Date:** 2026-06-14  
**Task:** Auth cookies HttpOnly; stop client JS reading/writing auth tokens  
**Checklist:** `temporary-docs/tieu-chuan-check-be-fe/fe-mycourse.md` (process adapted for auth security)

## Index

- Repo: `fe-mycourse`

## Symbols changed

| Symbol | Change | Risk (impact) | Notes |
|--------|--------|---------------|-------|
| `buildAuthCookieOptions` | **new** — always HttpOnly | LOW | used by auth-session |
| `buildCookieOptions` | UI cookies only; doc updated | LOW | default httpOnly=false kept for non-auth |
| `setAuthSessionCookies` | uses buildAuthCookieOptions | LOW | server-only |
| `createApiInstance` | client: withCredentials; server: Bearer from next/headers | LOW — d=1: apiInstance → all api callers | no d=1 code changes required |
| `syncAuthSessionCookiesAction` | **new file** `sync-auth-session.ts` | LOW | breaks import cycle with auth.ts |
| `clearAuthCookiesClient` | no-op (HttpOnly) | LOW | logout via Server Action |
| `setCookieValue` | blocks auth cookie writes on client | LOW | |

## Import cycle resolved

`instance.ts` → `sync-auth-session.ts` (not `auth.ts`) to avoid:
`auth.ts → callers → methods → instance → auth.ts`

## Docs gap (before fix)

| Doc | Stale content |
|-----|---------------|
| `README.md`, `docs/flow.md`, `docs/architecture.md` | non-HttpOnly design |
| `docs/deploy.md` | verify cookies NOT HttpOnly |
| `docs/reusable-assets.md` | buildCookieOptions for auth |

## Follow-up (out of scope)

- FE-03: parseSetCookies strip attributes (login path uses JSON body not Set-Cookie relay)
- BE-03: remove token from JSON body
